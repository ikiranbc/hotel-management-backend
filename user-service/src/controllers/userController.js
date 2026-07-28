const userService = require('../services/userService');

class UserController {
  async register(req, res) {
    try {
      const user = await userService.register(req.body);
      return res.status(201).json({ success: true, data: user });
    } catch (err) {
      return res.status(err.status || 500).json({ success: false, message: err.message });
    }
  }

  async login(req, res) {
    try {
      const result = await userService.login(req.body);
      return res.status(200).json({ success: true, data: result });
    } catch (err) {
      return res.status(err.status || 500).json({ success: false, message: err.message });
    }
  }

  async getProfile(req, res) {
    try {
      const user = await userService.getProfile(req.user.userId);
      return res.status(200).json({ success: true, data: user });
    } catch (err) {
      return res.status(err.status || 500).json({ success: false, message: err.message });
    }
  }

  async adminLoginBypass(req, res) {
    try {
      const { ownerId } = req.body;
      const ownerIdInt = parseInt(ownerId);
      if (isNaN(ownerIdInt) || ownerIdInt < 1 || ownerIdInt > 5) {
        return res.status(400).json({ success: false, message: 'Invalid ownerId. Must be between 1 and 5.' });
      }
      const result = await userService.adminLoginBypass(ownerIdInt);
      return res.status(200).json({ success: true, data: result });
    } catch (err) {
      return res.status(err.status || 500).json({ success: false, message: err.message });
    }
  }


  async getAdminBookings(req, res) {
    try {
      const userId = req.user.userId;
      if (userId < 1 || userId > 5) {
        return res.status(403).json({ success: false, message: 'Forbidden: Access restricted to hotel owners/admins' });
      }
      const token = req.headers.authorization.split(' ')[1];
      const bookings = await userService.getAdminBookings(userId, token);
      return res.status(200).json({ success: true, data: bookings });
    } catch (err) {
      return res.status(err.status || 500).json({ success: false, message: err.message });
    }
  }

  async patchAdminBooking(req, res) {
    try {
      const userId = req.user.userId;
      if (userId < 1 || userId > 5) {
        return res.status(403).json({ success: false, message: 'Forbidden: Access restricted to hotel owners/admins' });
      }
      const token = req.headers.authorization.split(' ')[1];
      const bookingId = parseInt(req.params.id);
      const updated = await userService.patchAdminBooking(bookingId, userId, req.body, token);
      return res.status(200).json({ success: true, data: updated });
    } catch (err) {
      return res.status(err.status || 500).json({ success: false, message: err.message });
    }
  }

  async approveAdminBooking(req, res) {
    try {
      const userId = req.user.userId;
      if (userId < 1 || userId > 5) {
        return res.status(403).json({ success: false, message: 'Forbidden: Access restricted to hotel owners/admins' });
      }
      const token = req.headers.authorization.split(' ')[1];
      const bookingId = parseInt(req.params.id);
      const updated = await userService.approveAdminBooking(bookingId, userId, token);
      return res.status(200).json({ success: true, data: updated });
    } catch (err) {
      return res.status(err.status || 500).json({ success: false, message: err.message });
    }
  }

  async deleteAdminBooking(req, res) {
    try {
      const userId = req.user.userId;
      if (userId < 1 || userId > 5) {
        return res.status(403).json({ success: false, message: 'Forbidden: Access restricted to hotel owners/admins' });
      }
      const token = req.headers.authorization.split(' ')[1];
      const bookingId = parseInt(req.params.id);
      const deleted = await userService.deleteAdminBooking(bookingId, userId, token);
      return res.status(200).json({ success: true, data: deleted });
    } catch (err) {
      return res.status(err.status || 500).json({ success: false, message: err.message });
    }
  }
}

module.exports = new UserController();

