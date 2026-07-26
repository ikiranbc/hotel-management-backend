const pool = require('../config/db');

class BookingRepository {
  async create({ userId, roomId, hotelId, checkIn, checkOut, totalPrice }) {
    const query = `
      INSERT INTO bookings (user_id, room_id, hotel_id, check_in, check_out, total_price, status)
      VALUES ($1, $2, $3, $4, $5, $6, 'pending')
      RETURNING *
    `;
    const values = [userId, roomId, hotelId, checkIn, checkOut, totalPrice];
    const { rows } = await pool.query(query, values);
    return rows[0];
  }

  async updateStatus(bookingId, status) {
    const query = 'UPDATE bookings SET status = $1 WHERE id = $2 RETURNING *';
    const { rows } = await pool.query(query, [status, bookingId]);
    return rows[0] || null;
  }

  async findByUser(userId) {
    const query = 'SELECT * FROM bookings WHERE user_id = $1 ORDER BY created_at DESC';
    const { rows } = await pool.query(query, [userId]);
    return rows;
  }

  async findById(id) {
    const query = 'SELECT * FROM bookings WHERE id = $1';
    const { rows } = await pool.query(query, [id]);
    return rows[0] || null;
  }
}

module.exports = new BookingRepository();
