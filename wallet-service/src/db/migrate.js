const pool = require('../config/db');

const migrate = async () => {
  console.log('Running Wallet Service Migrations...');
  await pool.query(`
    CREATE TABLE IF NOT EXISTS wallets (
      id SERIAL PRIMARY KEY,
      user_id INTEGER UNIQUE NOT NULL,
      balance DECIMAL(12,2) DEFAULT 0.00 CHECK (balance >= 0),
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id SERIAL PRIMARY KEY,
      wallet_id INTEGER REFERENCES wallets(id) ON DELETE CASCADE,
      type VARCHAR(20) NOT NULL, -- 'credit' or 'debit'
      amount DECIMAL(10,2) NOT NULL,
      description TEXT,
      booking_id INTEGER,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);
  console.log('✅ Wallets & Transactions tables ready.');
  await pool.end();
};

migrate().catch((err) => {
  console.error('❌ Wallet migration failed', err);
  process.exit(1);
});
