const pool = require('../config/db');

const migrate = async () => {
  console.log('Running Booking Service Migrations...');
  await pool.query(`
    CREATE TABLE IF NOT EXISTS bookings (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      room_id INTEGER NOT NULL,
      hotel_id INTEGER NOT NULL,
      hotel_name VARCHAR(150),
      owner_id INTEGER,
      room_number VARCHAR(20),
      check_in DATE NOT NULL,
      check_out DATE NOT NULL,
      total_price DECIMAL(10,2) NOT NULL,
      status VARCHAR(20) DEFAULT 'pending', -- pending/confirmed/cancelled
      is_paid VARCHAR(20) DEFAULT 'false',
      created_at TIMESTAMP DEFAULT NOW()
    );
    ALTER TABLE bookings ALTER COLUMN is_paid TYPE VARCHAR(20);
  
  `);
  console.log('✅ Bookings table ready.');
  await pool.end();
};

migrate().catch((err) => {
  console.error('❌ Booking migration failed', err);
  process.exit(1);
});

