const pool = require('../config/db');

class BookingRepository {
  async create({ userId, roomId, hotelId, hotelName, ownerId, roomNumber, checkIn, checkOut, totalPrice }) {
    const query = `
      INSERT INTO bookings (user_id, room_id, hotel_id, hotel_name, owner_id, room_number, check_in, check_out, total_price, status, is_paid)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending', FALSE)
      RETURNING *
    `;
    const values = [userId, roomId, hotelId, hotelName, ownerId, roomNumber, checkIn, checkOut, totalPrice];
    const { rows } = await pool.query(query, values);
    return rows[0];
  }

  async updateStatus(bookingId, status) {
    const query = 'UPDATE bookings SET status = $1 WHERE id = $2 RETURNING *';
    const { rows } = await pool.query(query, [status, bookingId]);
    return rows[0] || null;
  }

  async updatePaidStatus(bookingId, isPaid) {
    const query = 'UPDATE bookings SET is_paid = $1 WHERE id = $2 RETURNING *';
    const { rows } = await pool.query(query, [isPaid, bookingId]);
    return rows[0] || null;
  }

  async delete(bookingId) {
    const query = 'DELETE FROM bookings WHERE id = $1 RETURNING *';
    const { rows } = await pool.query(query, [bookingId]);
    return rows[0] || null;
  }

  async findByUser(userId) {
    const query = 'SELECT * FROM bookings WHERE user_id = $1 ORDER BY created_at DESC';
    const { rows } = await pool.query(query, [userId]);
    return rows;
  }

  async findByOwner(ownerId) {
    const query = 'SELECT * FROM bookings WHERE owner_id = $1 ORDER BY created_at DESC';
    const { rows } = await pool.query(query, [ownerId]);
    return rows;
  }

  async update(bookingId, updateData) {
    const fields = [];
    const values = [];
    let i = 1;
    for (const [key, val] of Object.entries(updateData)) {
      fields.push(`${key} = $${i}`);
      values.push(val);
      i++;
    }
    if (fields.length === 0) return this.findById(bookingId);
    values.push(bookingId);
    const query = `UPDATE bookings SET ${fields.join(', ')} WHERE id = $${i} RETURNING *`;
    const { rows } = await pool.query(query, values);
    return rows[0] || null;
  }

  async findById(id) {
    const query = 'SELECT * FROM bookings WHERE id = $1';
    const { rows } = await pool.query(query, [id]);
    return rows[0] || null;
  }
}

module.exports = new BookingRepository();

