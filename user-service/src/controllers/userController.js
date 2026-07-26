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
}

module.exports = new UserController();
