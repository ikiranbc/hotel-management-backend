const pool = require('../config/db');

class WalletRepository {
  async findByUserId(userId) {
    const { rows } = await pool.query('SELECT * FROM wallets WHERE user_id = $1', [userId]);
    return rows[0] || null;
  }

  async createWallet(userId) {
    const { rows } = await pool.query(
      'INSERT INTO wallets (user_id, balance) VALUES ($1, 0.00) ON CONFLICT (user_id) DO NOTHING RETURNING *',
      [userId]
    );
    // If conflict happened rows might be empty, retrieve the wallet instead
    if (rows.length === 0) {
      return this.findByUserId(userId);
    }
    return rows[0];
  }

  async addFunds(userId, amount) {
    const query = `
      INSERT INTO wallets (user_id, balance)
      VALUES ($1, $2)
      ON CONFLICT (user_id)
      DO UPDATE SET balance = wallets.balance + EXCLUDED.balance
      RETURNING *
    `;
    const { rows } = await pool.query(query, [userId, amount]);
    return rows[0];
  }

  async deductFunds(userId, amount) {
    const query = `
      UPDATE wallets
      SET balance = balance - $1
      WHERE user_id = $2 AND balance >= $1
      RETURNING *
    `;
    const { rows } = await pool.query(query, [amount, userId]);
    return rows[0] || null;
  }

  async logTransaction({ walletId, type, amount, description, bookingId }) {
    const query = `
      INSERT INTO transactions (wallet_id, type, amount, description, booking_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const values = [walletId, type, amount, description, bookingId];
    const { rows } = await pool.query(query, values);
    return rows[0];
  }

  async getTransactions(userId) {
    const query = `
      SELECT t.* FROM transactions t
      JOIN wallets w ON t.wallet_id = w.id
      WHERE w.user_id = $1
      ORDER BY t.created_at DESC
    `;
    const { rows } = await pool.query(query, [userId]);
    return rows;
  }
}

module.exports = new WalletRepository();
