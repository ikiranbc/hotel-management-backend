const pool = require('../config/db');

const migrate = async () => {
  console.log('Running User Service Migrations...');
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(150) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      role VARCHAR(20) DEFAULT 'customer',
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);
  console.log('✅ Users table is ready.');
  await pool.end();
};

migrate().catch((err) => {
  console.error('❌ Migration failed', err);
  process.exit(1);
});
