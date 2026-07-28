const bookingService = require('../services/bookingService');

class BookingController {
  async createBooking(req, res) {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader.split(' ')[1]; // Extracted token for downstream HTTP authorization
      
      const { roomId, checkIn, checkOut } = req.body;
      const booking = await bookingService.createBooking({
        userId: req.user.userId,
        roomId,
        checkIn,
        checkOut,
        token,
      });

      return res.status(201).json({ success: true, data: booking });
    } catch (err) {
      return res.status(err.status || 500).json({ success: false, message: err.message });
    }
  }

  async getMyBookings(req, res) {
    try {
      const bookings = await bookingService.getMyBookings(req.user.userId);
      return res.status(200).json({ success: true, data: bookings });
    } catch (err) {
      return res.status(err.status || 500).json({ success: false, message: err.message });
    }
  }

  async getBookingDetails(req, res) {
    try {
      const booking = await bookingService.getBookingById(parseInt(req.params.id));
      return res.status(200).json({ success: true, data: booking });
    } catch (err) {
      return res.status(err.status || 500).json({ success: false, message: err.message });
    }
  }

  async getBookingsByOwner(req, res) {
    try {
      const bookings = await bookingService.getBookingsByOwner(parseInt(req.params.ownerId));
      return res.status(200).json({ success: true, data: bookings });
    } catch (err) {
      return res.status(err.status || 500).json({ success: false, message: err.message });
    }
  }

  async approveBooking(req, res) {
    try {
      const { ownerId } = req.body;
      const booking = await bookingService.approveBookingByOwner(parseInt(req.params.id), parseInt(ownerId));
      return res.status(200).json({ success: true, data: booking });
    } catch (err) {
      return res.status(err.status || 500).json({ success: false, message: err.message });
    }
  }

  async cancelBooking(req, res) {
    try {
      const { ownerId } = req.body;
      const booking = await bookingService.cancelBookingByOwner(parseInt(req.params.id), parseInt(ownerId));
      return res.status(200).json({ success: true, data: booking });
    } catch (err) {
      return res.status(err.status || 500).json({ success: false, message: err.message });
    }
  }

  async updateBooking(req, res) {
    try {
      const { ownerId, ...updateData } = req.body;
      const authHeader = req.headers.authorization;
      const token = authHeader ? authHeader.split(' ')[1] : '';
      const booking = await bookingService.updateBookingByOwner(parseInt(req.params.id), parseInt(ownerId), updateData, token);
      return res.status(200).json({ success: true, data: booking });
    } catch (err) {
      return res.status(err.status || 500).json({ success: false, message: err.message });
    }
  }

  async deleteBooking(req, res) {
    try {
      const { ownerId } = req.body;
      const booking = await bookingService.deleteBookingByOwner(parseInt(req.params.id), parseInt(ownerId));
      return res.status(200).json({ success: true, data: booking });
    } catch (err) {
      return res.status(err.status || 500).json({ success: false, message: err.message });
    }
  }
}

module.exports = new BookingController();

