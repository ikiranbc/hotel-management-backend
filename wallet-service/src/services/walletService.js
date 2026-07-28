const walletRepository = require('../repositories/walletRepository');
const { publishEvent } = require('../events/publisher');

class WalletService {
  async getOrCreateWallet(userId) {
    let wallet = await walletRepository.findByUserId(userId);
    if (!wallet) {
      wallet = await walletRepository.createWallet(userId);
    }
    return wallet;
  }

  async loadFunds(userId, amount) {
    if (amount <= 0) {
      const err = new Error('Deposit amount must be positive');
      err.status = 400;
      throw err;
    }
    const wallet = await walletRepository.addFunds(userId, amount);
    await walletRepository.logTransaction({
      walletId: wallet.id,
      type: 'credit',
      amount,
      description: 'Loaded funds into wallet',
    });
    return wallet;
  }

  async getTransactions(userId) {
    await this.getOrCreateWallet(userId); // Ensure wallet exists
    return walletRepository.getTransactions(userId);
  }

  async processPayment({ bookingId, userId, amount, roomId, ownerId }) {
    console.log(`[Wallet] Processing payment for booking ${bookingId}: customer ${userId}, amount $${amount}, hotel owner ${ownerId}`);
    
    // Ensure wallets exist
    const customerWallet = await this.getOrCreateWallet(userId);
    // ownerId comes from the booking event — hotel 1 → owner 1, hotel 2 → owner 2, etc.
    const ownerWallet = await this.getOrCreateWallet(ownerId);

    // Try to atomically deduct funds from customer
    const updatedCustomerWallet = await walletRepository.deductFunds(userId, amount);
    if (!updatedCustomerWallet) {
      console.warn(`[Wallet] Insufficient funds for customer ${userId} (booking ${bookingId})`);
      // Publish payment failed event
      await publishEvent('payment.failed', { bookingId, userId, roomId });
      return;
    }

    // Log customer transaction
    await walletRepository.logTransaction({
      walletId: customerWallet.id,
      type: 'debit',
      amount,
      description: `Payment for booking #${bookingId}`,
      bookingId,
    });

    // Credit hotel owner account
    await walletRepository.addFunds(ownerId, amount);

    // Log owner transaction
    await walletRepository.logTransaction({
      walletId: ownerWallet.id,
      type: 'credit',
      amount,
      description: `Revenue from booking #${bookingId} (customer #${userId})`,
      bookingId,
    });

    console.log(`[Wallet] Payment successful for booking ${bookingId}. Funds transferred to hotel owner ${ownerId}.`);

    // Publish payment success event
    await publishEvent('payment.success', { bookingId, userId, roomId });
  }

  async processRefund({ bookingId, userId, amount, ownerId }) {
    console.log(`[Wallet] Processing refund for booking ${bookingId}: customer ${userId}, owner ${ownerId}, amount $${amount}`);
    
    const customerWallet = await this.getOrCreateWallet(userId);
    const ownerWallet = await this.getOrCreateWallet(ownerId);

    await walletRepository.deductFunds(ownerId, amount);

    await walletRepository.logTransaction({
      walletId: ownerWallet.id,
      type: 'debit',
      amount,
      description: `Refund payout for booking #${bookingId} to customer #${userId}`,
      bookingId,
    });

    await walletRepository.addFunds(userId, amount);

    await walletRepository.logTransaction({
      walletId: customerWallet.id,
      type: 'refund',
      amount,
      description: `Refund for cancelled booking #${bookingId}`,
      bookingId,
    });

    console.log(`[Wallet] Refund successfully processed for booking ${bookingId}.`);
  }
}

module.exports = new WalletService();
