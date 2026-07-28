const hotelRepository = require('../repositories/hotelRepository');
const redis = require('../config/redis');

const HOTELS_CACHE_KEY = 'hotels:all';
const CACHE_TTL = 300; // 5 minutes
const ROOM_CACHE_TTL = 60; // 60 seconds

function formatRoom(r) {
  if (!r) return r;
  const ordered = {
    id: r.id,
    hotel_id: r.hotel_id,
    hotel_name: r.hotel_name,
    owner_id: r.owner_id,
    room_number: r.room_number,
    type: r.type,
    price: r.price,
    is_available: r.is_available,
    created_at: r.created_at
  };
  return ordered;
}

class HotelService {
  async getAllHotels() {
    try {
      const cached = await redis.get(HOTELS_CACHE_KEY);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (err) {
      console.error('Redis read error:', err);
    }

    const hotels = await hotelRepository.findAllHotels();

    try {
      await redis.setex(HOTELS_CACHE_KEY, CACHE_TTL, JSON.stringify(hotels));
    } catch (err) {
      console.error('Redis write error:', err);
    }

    return hotels;
  }

  async getRoomsByHotel(hotelId) {
    const rooms = await hotelRepository.findRoomsByHotel(hotelId);
    return rooms.map(formatRoom);
  }

  async getAvailableRooms(hotelId) {
    const cacheKey = `rooms:available:${hotelId}`;
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (err) {
      console.error('Redis read error:', err);
    }

    const rooms = await hotelRepository.findAvailableRooms(hotelId);
    const formattedRooms = rooms.map(formatRoom);

    try {
      await redis.setex(cacheKey, ROOM_CACHE_TTL, JSON.stringify(formattedRooms));
    } catch (err) {
      console.error('Redis write error:', err);
    }

    return formattedRooms;
  }

  async getRoomById(roomId) {
    const room = await hotelRepository.findRoomById(roomId);
    if (!room) {
      const err = new Error('Room not found');
      err.status = 404;
      throw err;
    }
    return formatRoom(room);
  }

  async markRoomAvailability(roomId, isAvailable) {
    const updatedRoom = await hotelRepository.updateRoomAvailability(roomId, isAvailable);
    if (updatedRoom) {
      // Invalidate room cache for this hotel
      const cacheKey = `rooms:available:${updatedRoom.hotel_id}`;
      try {
        await redis.del(cacheKey);
      } catch (err) {
        console.error('Redis delete error:', err);
      }
    }
    // Fetch fresh details to have hotel_name and owner_id fields present and properly formatted
    const fullRoom = await hotelRepository.findRoomById(roomId);
    return formatRoom(fullRoom);
  }
}

module.exports = new HotelService();

