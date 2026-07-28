const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userRepository = require('../repositories/userRepository');

class UserService {
  async register({ name, email, password }) {
    const existing = await userRepository.findByEmail(email);
    if (existing) {
      const err = new Error('Email already registered');
      err.status = 409;
      throw err;
    }
    const hashedPassword = await bcrypt.hash(password, 12);
    return userRepository.create({ name, email, password: hashedPassword });
  }

  async login({ email, password }) {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      const err = new Error('Invalid credentials');
      err.status = 401;
      throw err;
    }
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      const err = new Error('Invalid credentials');
      err.status = 401;
      throw err;
    }
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'super_secret_jwt_key',
      { expiresIn: '24h' }
    );
    return {
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    };
  }

  async getProfile(userId) {
    const user = await userRepository.findById(userId);
    if (!user) {
      const err = new Error('User not found');
      err.status = 404;
      throw err;
    }
    return user;
  }

  async adminLoginBypass(ownerId) {
    const user = await userRepository.findById(ownerId);
    if (!user) {
      const err = new Error('Owner account not found');
      err.status = 404;
      throw err;
    }
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'super_secret_jwt_key',
      { expiresIn: '24h' }
    );
    return {
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    };
  }


  async getAdminBookings(ownerId, token) {
    const axios = require('axios');
    const bookingServiceUrl = process.env.BOOKING_SERVICE_URL || 'http://localhost:3003';
    try {
      const response = await axios.get(`${bookingServiceUrl}/api/bookings/owner/${ownerId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data.data;
    } catch (err) {
      const status = err.response ? err.response.status : 500;
      const message = err.response ? err.response.data.message : 'Booking Service unreachable';
      const error = new Error(message);
      error.status = status;
      throw error;
    }
  }

  async patchAdminBooking(bookingId, ownerId, updateData, token) {
    const axios = require('axios');
    const bookingServiceUrl = process.env.BOOKING_SERVICE_URL || 'http://localhost:3003';
    try {
      const response = await axios.patch(
        `${bookingServiceUrl}/api/bookings/${bookingId}`,
        { ownerId, ...updateData },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data.data;
    } catch (err) {
      const status = err.response ? err.response.status : 500;
      const message = err.response ? err.response.data.message : 'Booking Service unreachable';
      const error = new Error(message);
      error.status = status;
      throw error;
    }
  }

  async approveAdminBooking(bookingId, ownerId, token) {
    const axios = require('axios');
    const bookingServiceUrl = process.env.BOOKING_SERVICE_URL || 'http://localhost:3003';
    try {
      const response = await axios.post(
        `${bookingServiceUrl}/api/bookings/${bookingId}/approve`,
        { ownerId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data.data;
    } catch (err) {
      const status = err.response ? err.response.status : 500;
      const message = err.response ? err.response.data.message : 'Booking Service unreachable';
      const error = new Error(message);
      error.status = status;
      throw error;
    }
  }

  async deleteAdminBooking(bookingId, ownerId, token) {
    const axios = require('axios');
    const bookingServiceUrl = process.env.BOOKING_SERVICE_URL || 'http://localhost:3003';
    try {
      const response = await axios.delete(
        `${bookingServiceUrl}/api/bookings/${bookingId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          data: { ownerId }
        }
      );
      return response.data.data;
    } catch (err) {
      const status = err.response ? err.response.status : 500;
      const message = err.response ? err.response.data.message : 'Booking Service unreachable';
      const error = new Error(message);
      error.status = status;
      throw error;
    }
  }
}

module.exports = new UserService();

