const pool = require('../config/db');

class HotelRepository {
  async findAllHotels() {
    const { rows } = await pool.query('SELECT * FROM hotels ORDER BY id ASC');
    return rows;
  }

  async findRoomsByHotel(hotelId) {
    const { rows } = await pool.query('SELECT r.*, h.name AS hotel_name, h.owner_id FROM rooms r JOIN hotels h ON r.hotel_id = h.id WHERE r.hotel_id = $1 ORDER BY r.id ASC', [hotelId]);
    return rows;
  }

  async findAvailableRooms(hotelId) {
    const { rows } = await pool.query('SELECT r.*, h.name AS hotel_name, h.owner_id FROM rooms r JOIN hotels h ON r.hotel_id = h.id WHERE r.hotel_id = $1 AND r.is_available = TRUE ORDER BY r.id ASC', [hotelId]);
    return rows;
  }

  async findRoomById(roomId) {
    const { rows } = await pool.query('SELECT r.*, h.name AS hotel_name, h.owner_id FROM rooms r JOIN hotels h ON r.hotel_id = h.id WHERE r.id = $1', [roomId]);
    return rows[0] || null;
  }

  async updateRoomAvailability(roomId, isAvailable) {
    const { rows } = await pool.query(
      'UPDATE rooms SET is_available = $1 WHERE id = $2 RETURNING *',
      [isAvailable, roomId]
    );
    return rows[0] || null;
  }
}

module.exports = new HotelRepository();
