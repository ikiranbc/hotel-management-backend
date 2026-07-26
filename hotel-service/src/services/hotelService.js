const hotelRepository = require('../repositories/hotelRepository');
const redis = require('../config/redis');

const HOTELS_CACHE_KEY = 'hotels:all';
const CACHE_TTL = 300; // 5 minutes
const ROOM_CACHE_TTL = 60; // 60 seconds

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
    return hotelRepository.findRoomsByHotel(hotelId);
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

    try {
      await redis.setex(cacheKey, ROOM_CACHE_TTL, JSON.stringify(rooms));
    } catch (err) {
      console.error('Redis write error:', err);
    }

    return rooms;
  }

  async getRoomById(roomId) {
    const room = await hotelRepository.findRoomById(roomId);
    if (!room) {
      const err = new Error('Room not found');
      err.status = 404;
      throw err;
    }
    return room;
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
    return updatedRoom;
  }
}

module.exports = new HotelService();
