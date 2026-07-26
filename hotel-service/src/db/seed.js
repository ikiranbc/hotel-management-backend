const pool = require('../config/db');

const HOTELS = [
  { name: 'Grand Kathmandu Hotel', location: 'Thamel, Kathmandu', description: 'Luxury hotel in the heart of Thamel' },
  { name: 'Himalaya View Resort', location: 'Nagarkot, Bhaktapur', description: 'Breathtaking Himalayan views' },
  { name: 'Pokhara Lakeside Inn', location: 'Lakeside, Pokhara', description: 'Serene lakeside accommodation' },
];

const ROOM_TYPES = [
  { type: 'single', price: 50.00, count: 5 },
  { type: 'double', price: 90.00, count: 4 },
  { type: 'suite',  price: 180.00, count: 2 },
];

const seed = async () => {
  // Check if data already exists
  const { rows } = await pool.query('SELECT COUNT(*) FROM hotels');
  if (parseInt(rows[0].count) > 0) {
    console.log('Database already seeded. Skipping hotel seeding...');
    return;
  }

  console.log('Seeding initial hotels and rooms...');
  for (const h of HOTELS) {
    const hotelRes = await pool.query(
      `INSERT INTO hotels (name, location, description) VALUES ($1, $2, $3) RETURNING id`,
      [h.name, h.location, h.description]
    );
    const hotelId = hotelRes.rows[0].id;

    let roomNumCounter = 101;
    for (const rt of ROOM_TYPES) {
      for (let i = 0; i < rt.count; i++) {
        await pool.query(
          `INSERT INTO rooms (hotel_id, room_number, type, price, is_available) VALUES ($1, $2, $3, $4, TRUE)`,
          [hotelId, roomNumCounter.toString(), rt.type, rt.price]
        );
        roomNumCounter++;
      }
    }
  }
  console.log('✅ Seeding completed successfully.');
};

module.exports = seed;
