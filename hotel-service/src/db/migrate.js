const pool = require('../config/db');

const migrate = async () => {
  console.log('Running Hotel Service Migrations...');
  await pool.query(`
    CREATE TABLE IF NOT EXISTS hotels (
      id SERIAL PRIMARY KEY,
      name VARCHAR(150) NOT NULL,
      location VARCHAR(200) NOT NULL,
      description TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS rooms (
      id SERIAL PRIMARY KEY,
      hotel_id INTEGER REFERENCES hotels(id) ON DELETE CASCADE,
      room_number VARCHAR(20) NOT NULL,
      type VARCHAR(50) NOT NULL,
      price DECIMAL(10,2) NOT NULL,
      is_available BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);
  console.log('✅ Hotels & Rooms tables ready.');
  await pool.end();
};

migrate().catch((err) => {
  console.error('❌ Hotel migration failed', err);
  process.exit(1);
});
