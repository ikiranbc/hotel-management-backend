const router = require('express').Router();
const ctrl = require('../controllers/hotelController');
const auth = require('../middleware/authMiddleware');

router.get('/', auth, ctrl.getAllHotels.bind(ctrl));
router.get('/:id/rooms', auth, ctrl.getRoomsByHotel.bind(ctrl));
router.get('/:id/rooms/available', auth, ctrl.getAvailableRooms.bind(ctrl));
router.get('/rooms/:roomId', auth, ctrl.getRoomDetails.bind(ctrl));

module.exports = router;
