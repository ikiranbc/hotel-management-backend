const router = require('express').Router();
const ctrl = require('../controllers/bookingController');
const auth = require('../middleware/authMiddleware');

router.post('/', auth, ctrl.createBooking.bind(ctrl));
router.get('/my', auth, ctrl.getMyBookings.bind(ctrl));

// Internal owner/admin routes (called from user-service)
router.get('/owner/:ownerId', ctrl.getBookingsByOwner.bind(ctrl));
router.post('/:id/approve', ctrl.approveBooking.bind(ctrl));
router.post('/:id/cancel', ctrl.cancelBooking.bind(ctrl));
router.patch('/:id', ctrl.updateBooking.bind(ctrl));
router.delete('/:id', ctrl.deleteBooking.bind(ctrl));

router.get('/:id', auth, ctrl.getBookingDetails.bind(ctrl));

module.exports = router;

