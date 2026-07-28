const axios = require('axios');
const bookingRepository = require('../repositories/bookingRepository');
const { publishEvent } = require('../events/publisher');
const redis = require('../config/redis');

const CACHE_TTL = 120; // 2 minutes

function formatBooking(b) {
  if (!b) return b;
  // Order keys: id, hotel_id, hotel_name, owner_id, room_id, room_number, and then others
  const ordered = {
    id: b.id,
    hotel_id: b.hotel_id,
    hotel_name: b.hotel_name,
    owner_id: b.owner_id,
    room_id: b.room_id,
    room_number: b.room_number,
    user_id: b.user_id,
    check_in: b.check_in,
    check_out: b.check_out,
    total_price: b.total_price,
    status: b.status,
    is_paid: b.is_paid,
    created_at: b.created_at
  };
  const isPaid = b.is_paid === true || b.is_paid === 'true';
  if (isPaid && b.status === 'pending') {
    ordered.message = "This booking is paid and pending. Please confirm or cancel this booking.";
  } else if (!isPaid && b.is_paid !== 'returned' && b.status === 'cancelled') {
    ordered.message = "The price exceeded your wallet amount";
  }
  return ordered;
}

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

    // 4. Create pending booking with rich hotel info
    const booking = await bookingRepository.create({
      userId,
      roomId,
      hotelId: room.hotel_id,
      hotelName: room.hotel_name,
      ownerId: room.owner_id,
      roomNumber: room.room_number,
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

    // Immediately mark the room as unavailable upon booking creation
    await publishEvent('room.status.update', {
      roomId,
      isAvailable: false,
    });

    // 6. Publish booking payment request event (include hotelId so wallet credits the right owner)
    await publishEvent('booking.payment.requested', {
      bookingId: booking.id,
      userId,
      amount: totalPrice,
      roomId,
      hotelId: room.hotel_id,
      ownerId: room.owner_id,  // Hotel owner receives the payment
    });

    return formatBooking(booking);
  }

  async confirmBooking(bookingId, roomId, userId) {
    const updated = await bookingRepository.updatePaidStatus(bookingId, 'true');
    if (updated) {
      // Invalidate cache
      try {
        await redis.del(`bookings:user:${userId}`);
      } catch (err) {
        console.error('Redis delete error:', err);
      }
    }
    return formatBooking(updated);
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
      // Release the room back to available
      await publishEvent('room.status.update', {
        roomId: updated.room_id,
        isAvailable: true,
      });
    }
    return formatBooking(updated);
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
    const formattedBookings = bookings.map(formatBooking);

    try {
      await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(formattedBookings));
    } catch (err) {
      console.error('Redis write error:', err);
    }

    return formattedBookings;
  }

  async getBookingById(bookingId) {
    const booking = await bookingRepository.findById(bookingId);
    if (!booking) {
      const err = new Error('Booking not found');
      err.status = 404;
      throw err;
    }
    return formatBooking(booking);
  }

  async getBookingsByOwner(ownerId) {
    const bookings = await bookingRepository.findByOwner(ownerId);
    return bookings.map(formatBooking);
  }

  async approveBookingByOwner(bookingId, ownerId) {
    const booking = await bookingRepository.findById(bookingId);
    if (!booking) {
      const err = new Error('Booking not found');
      err.status = 404;
      throw err;
    }
    if (booking.owner_id !== ownerId) {
      const err = new Error('Unauthorized for this hotel booking');
      err.status = 403;
      throw err;
    }
    const updated = await bookingRepository.updateStatus(bookingId, 'confirmed');
    // Release cache for customer
    try {
      await redis.del(`bookings:user:${booking.user_id}`);
    } catch (err) {
      console.error('Redis delete error:', err);
    }
    // Publish room status update to set room status to NOT available
    await publishEvent('room.status.update', {
      roomId: booking.room_id,
      isAvailable: false,
    });
    return formatBooking(updated);
  }

  async cancelBookingByOwner(bookingId, ownerId) {
    const booking = await bookingRepository.findById(bookingId);
    if (!booking) {
      const err = new Error('Booking not found');
      err.status = 404;
      throw err;
    }
    if (booking.owner_id !== ownerId) {
      const err = new Error('Unauthorized for this hotel booking');
      err.status = 403;
      throw err;
    }
    const updated = await bookingRepository.updateStatus(bookingId, 'cancelled');
    // Release cache for customer
    try {
      await redis.del(`bookings:user:${booking.user_id}`);
    } catch (err) {
      console.error('Redis delete error:', err);
    }
    // Publish room status update to set room status to available (free it up)
    await publishEvent('room.status.update', {
      roomId: booking.room_id,
      isAvailable: true,
    });
    return formatBooking(updated);
  }

  async updateBookingByOwner(bookingId, ownerId, updateData, token) {
    const booking = await bookingRepository.findById(bookingId);
    if (!booking) {
      const err = new Error('Booking not found');
      err.status = 404;
      throw err;
    }
    if (booking.owner_id !== ownerId) {
      const err = new Error('Unauthorized for this hotel booking');
      err.status = 403;
      throw err;
    }

    // If check_in/check_out dates changed, recalculate totalPrice
    if (updateData.check_in || updateData.check_out) {
      const checkIn = updateData.check_in || booking.check_in;
      const checkOut = updateData.check_out || booking.check_out;
      
      const date1 = new Date(checkIn);
      const date2 = new Date(checkOut);
      const timeDiff = date2.getTime() - date1.getTime();
      const nights = Math.ceil(timeDiff / (1000 * 3600 * 24));
      if (nights <= 0) {
        const error = new Error('Invalid booking dates: Check-out must be after Check-in');
        error.status = 400;
        throw error;
      }

      // Fetch room details to check price
      let room;
      try {
        const response = await axios.get(
          `${process.env.HOTEL_SERVICE_URL || 'http://localhost:3002'}/api/hotels/rooms/${booking.room_id}`,
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
      updateData.total_price = room.price * nights;
    }

    // If status is being updated, handle room availability
    if (updateData.status) {
      if (updateData.status === 'confirmed') {
        await publishEvent('room.status.update', {
          roomId: booking.room_id,
          isAvailable: false,
        });
      } else if (updateData.status === 'cancelled') {
        await publishEvent('room.status.update', {
          roomId: booking.room_id,
          isAvailable: true,
        });
      }
    }

    const updated = await bookingRepository.update(bookingId, updateData);
    try {
      await redis.del(`bookings:user:${booking.user_id}`);
    } catch (err) {
      console.error('Redis delete error:', err);
    }
    return formatBooking(updated);
  }

  async deleteBookingByOwner(bookingId, ownerId) {
    const booking = await bookingRepository.findById(bookingId);
    if (!booking) {
      const err = new Error('Booking not found');
      err.status = 404;
      throw err;
    }
    if (booking.owner_id !== ownerId) {
      const err = new Error('Unauthorized for this hotel booking');
      err.status = 403;
      throw err;
    }

    if (booking.status === 'cancelled') {
      const err = new Error('Booking is already cancelled');
      err.status = 400;
      throw err;
    }

    const isAlreadyPaid = booking.is_paid === true || booking.is_paid === 'true';

    const updated = await bookingRepository.updateStatus(bookingId, 'cancelled');
    if (isAlreadyPaid) {
      await bookingRepository.updatePaidStatus(bookingId, 'returned');
      updated.is_paid = 'returned';
      
      // Publish event for wallet service to process the refund
      await publishEvent('booking.refund.requested', {
        bookingId: booking.id,
        userId: booking.user_id,
        amount: booking.total_price,
        ownerId: booking.owner_id
      });
    }

    try {
      await redis.del(`bookings:user:${booking.user_id}`);
    } catch (err) {
      console.error('Redis delete error:', err);
    }

    // Release room availability
    await publishEvent('room.status.update', {
      roomId: booking.room_id,
      isAvailable: true,
    });

    return formatBooking(updated);
  }
}

module.exports = new BookingService();

