const router = require('express').Router();
const ctrl = require('../controllers/bookingController');
const auth = require('../middleware/authMiddleware');

router.post('/', auth, ctrl.createBooking.bind(ctrl));
router.get('/my', auth, ctrl.getMyBookings.bind(ctrl));
router.get('/:id', auth, ctrl.getBookingDetails.bind(ctrl));

module.exports = router;
