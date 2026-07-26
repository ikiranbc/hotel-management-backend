const walletService = require('../services/walletService');

class WalletController {
  async getBalance(req, res) {
    try {
      const wallet = await walletService.getOrCreateWallet(req.user.userId);
      return res.status(200).json({ success: true, data: { balance: wallet.balance } });
    } catch (err) {
      return res.status(err.status || 500).json({ success: false, message: err.message });
    }
  }

  async loadFunds(req, res) {
    try {
      const { amount } = req.body;
      const wallet = await walletService.loadFunds(req.user.userId, parseFloat(amount));
      return res.status(200).json({ success: true, data: { balance: wallet.balance } });
    } catch (err) {
      return res.status(err.status || 500).json({ success: false, message: err.message });
    }
  }

  async getTransactions(req, res) {
    try {
      const list = await walletService.getTransactions(req.user.userId);
      return res.status(200).json({ success: true, data: list });
    } catch (err) {
      return res.status(err.status || 500).json({ success: false, message: err.message });
    }
  }
}

module.exports = new WalletController();
