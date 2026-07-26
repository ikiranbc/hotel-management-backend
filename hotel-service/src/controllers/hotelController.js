const hotelService = require('../services/hotelService');

class HotelController {
  async getAllHotels(req, res) {
    try {
      const hotels = await hotelService.getAllHotels();
      return res.status(200).json({ success: true, data: hotels });
    } catch (err) {
      return res.status(err.status || 500).json({ success: false, message: err.message });
    }
  }

  async getRoomsByHotel(req, res) {
    try {
      const rooms = await hotelService.getRoomsByHotel(parseInt(req.params.id));
      return res.status(200).json({ success: true, data: rooms });
    } catch (err) {
      return res.status(err.status || 500).json({ success: false, message: err.message });
    }
  }

  async getAvailableRooms(req, res) {
    try {
      const rooms = await hotelService.getAvailableRooms(parseInt(req.params.id));
      return res.status(200).json({ success: true, data: rooms });
    } catch (err) {
      return res.status(err.status || 500).json({ success: false, message: err.message });
    }
  }

  async getRoomDetails(req, res) {
    try {
      const room = await hotelService.getRoomById(parseInt(req.params.roomId));
      return res.status(200).json({ success: true, data: room });
    } catch (err) {
      return res.status(err.status || 500).json({ success: false, message: err.message });
    }
  }
}

module.exports = new HotelController();
