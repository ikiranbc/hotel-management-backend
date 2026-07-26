const axios = require('axios');
const bookingRepository = require('../repositories/bookingRepository');
const { publishEvent } = require('../events/publisher');
const redis = require('../config/redis');

const CACHE_TTL = 120; // 2 minutes

class BookingService {
  async createBooking({ userId, roomId, checkIn, checkOut, token }) {
    // 1. Get room details from hotel-service using the user's JWT token for authorization
    let room;
    try {
      const response = await axios.get(
        `${process.env.HOTEL_SERVICE_URL || 'http://localhost:3002'}/api/hotels/rooms/${roomId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      room = response.data.data;
    } catch (err) {
      const status = err.response ? err.response.status : 500;
      const message = err.response ? err.response.data.message : 'Hotel Service unreachable';
      const error = new Error(message);
      error.status = status;
      throw error;
    }

    // 2. Verify availability
    if (!room.is_available) {
      const error = new Error('Room is already booked or unavailable');
      error.status = 409;
      throw error;
    }

    // 3. Calculate nights and total price
    const date1 = new Date(checkIn);
    const date2 = new Date(checkOut);
    const timeDiff = date2.getTime() - date1.getTime();
    const nights = Math.ceil(timeDiff / (1000 * 3600 * 24));
    if (nights <= 0) {
      const error = new Error('Invalid booking dates: Check-out must be after Check-in');
      error.status = 400;
      throw error;
    }

    const totalPrice = room.price * nights;

    // 4. Create pending booking
    const booking = await bookingRepository.create({
      userId,
      roomId,
      hotelId: room.hotel_id,
      checkIn,
      checkOut,
      totalPrice,
    });

    // 5. Invalidate the user bookings cache
    try {
      await redis.del(`bookings:user:${userId}`);
    } catch (err) {
      console.error('Redis delete error:', err);
    }

    // 6. Publish booking payment request event (include hotelId so wallet credits the right owner)
    await publishEvent('booking.payment.requested', {
      bookingId: booking.id,
      userId,
      amount: totalPrice,
      roomId,
      hotelId: room.hotel_id,
      ownerId: room.owner_id,  // Hotel owner receives the payment
    });

    return booking;
  }

  async confirmBooking(bookingId, roomId, userId) {
    const updated = await bookingRepository.updateStatus(bookingId, 'confirmed');
    if (updated) {
      // Invalidate cache
      try {
        await redis.del(`bookings:user:${userId}`);
      } catch (err) {
        console.error('Redis delete error:', err);
      }

      // Publish event to mark the room as booked (not available)
      await publishEvent('room.status.update', {
        roomId,
        isAvailable: false,
      });
    }
    return updated;
  }

  async failBooking(bookingId, userId) {
    const updated = await bookingRepository.updateStatus(bookingId, 'cancelled');
    if (updated) {
      // Invalidate cache
      try {
        await redis.del(`bookings:user:${userId}`);
      } catch (err) {
        console.error('Redis delete error:', err);
      }
    }
    return updated;
  }

  async getMyBookings(userId) {
    const cacheKey = `bookings:user:${userId}`;
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (err) {
      console.error('Redis read error:', err);
    }

    const bookings = await bookingRepository.findByUser(userId);

    try {
      await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(bookings));
    } catch (err) {
      console.error('Redis write error:', err);
    }

    return bookings;
  }

  async getBookingById(bookingId) {
    const booking = await bookingRepository.findById(bookingId);
    if (!booking) {
      const err = new Error('Booking not found');
      err.status = 404;
      throw err;
    }
    return booking;
  }
}

module.exports = new BookingService();
