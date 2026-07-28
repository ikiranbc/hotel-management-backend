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
}

module.exports = new UserController();

