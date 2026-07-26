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

  // Seed 5 hotel owner accounts (IDs 1-5) — one per hotel
  // Password is bcrypt hash of 'ownerpass123'
  const ownerPassword = '$2b$10$YbkbEXOGYLn4.MnNs69sEO4t5KVuD2ybwB76dJAaTHwv6faMiB7bK';
  const owners = [
    { id: 1, name: 'Owner Grand Kathmandu', email: 'owner1@hotel.com' },
    { id: 2, name: 'Owner Himalaya View',   email: 'owner2@hotel.com' },
    { id: 3, name: 'Owner Pokhara Lakeside',email: 'owner3@hotel.com' },
    { id: 4, name: 'Owner Chitwan Safari',  email: 'owner4@hotel.com' },
    { id: 5, name: 'Owner Lumbini Sanctuary',email: 'owner5@hotel.com' },
  ];
  for (const o of owners) {
    await pool.query(
      `INSERT INTO users (id, name, email, password, role)
       VALUES ($1, $2, $3, $4, 'owner')
       ON CONFLICT (id) DO NOTHING`,
      [o.id, o.name, o.email, ownerPassword]
    );
  }
  // Ensure next auto-increment ID starts from 6 for regular customers
  await pool.query(`SELECT setval('users_id_seq', GREATEST(6, (SELECT MAX(id) FROM users)))`);
  console.log('✅ Hotel owner accounts seeded (IDs 1–5). Regular customers start from ID 6.');
  await pool.end();
};

migrate().catch((err) => {
  console.error('❌ Migration failed', err);
  process.exit(1);
});
