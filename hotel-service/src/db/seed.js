const pool = require('../config/db');

const HOTELS = [
  { owner_id: 1, name: 'Grand Kathmandu Hotel',  location: 'Thamel, Kathmandu',  description: 'Luxury hotel in the heart of Thamel' },
  { owner_id: 2, name: 'Himalaya View Resort',   location: 'Nagarkot, Bhaktapur', description: 'Breathtaking Himalayan views' },
  { owner_id: 3, name: 'Pokhara Lakeside Inn',   location: 'Lakeside, Pokhara',   description: 'Serene lakeside accommodation' },
  { owner_id: 4, name: 'Chitwan Safari Lodge',   location: 'Sauraha, Chitwan',    description: 'Immersive wildlife and jungle stay' },
  { owner_id: 5, name: 'Lumbini Peace Sanctuary',location: 'Lumbini, Rupandehi',  description: 'Tranquil retreat near sacred gardens' },
];

const ROOM_TYPES = [
  { type: 'single', price: 50.00, count: 4 },
  { type: 'double', price: 90.00, count: 3 },
  { type: 'suite',  price: 180.00, count: 2 },
];

const seed = async () => {
  // Check existing hotel count
  const { rows } = await pool.query('SELECT COUNT(*) FROM hotels');
  if (parseInt(rows[0].count) >= 5) {
    console.log('Database already has 5 or more hotels seeded. Skipping hotel seeding...');
    return;
  }

  // Clear old seed data if less than 5 to ensure clean 5-hotel environment
  if (parseInt(rows[0].count) > 0 && parseInt(rows[0].count) < 5) {
    console.log('Re-seeding database to expand to 5 hotels...');
    await pool.query('TRUNCATE TABLE hotels CASCADE');
  }

  console.log('Seeding 5 hotels and rooms with pre-booked statuses...');
  for (const h of HOTELS) {
    const hotelRes = await pool.query(
      `INSERT INTO hotels (owner_id, name, location, description) VALUES ($1, $2, $3, $4) RETURNING id`,
      [h.owner_id, h.name, h.location, h.description]
    );
    const hotelId = hotelRes.rows[0].id;

    let roomNumCounter = 101;
    let roomIndex = 0;
    for (const rt of ROOM_TYPES) {
      for (let i = 0; i < rt.count; i++) {
        // Mark specific rooms as pre-booked (is_available = false)
        // e.g. room index 1 and 4 in each hotel are pre-booked
        const isAvailable = (roomIndex % 4 !== 1);

        await pool.query(
          `INSERT INTO rooms (hotel_id, room_number, type, price, is_available) VALUES ($1, $2, $3, $4, $5)`,
          [hotelId, roomNumCounter.toString(), rt.type, rt.price, isAvailable]
        );
        roomNumCounter++;
        roomIndex++;
      }
    }
  }
  console.log('✅ 5 Hotels & Rooms seeded successfully with pre-booked rooms.');
};

module.exports = seed;
