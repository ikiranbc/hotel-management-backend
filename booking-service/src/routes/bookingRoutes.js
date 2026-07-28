const router = require('express').Router();
const ctrl = require('../controllers/bookingController');
const auth = require('../middleware/authMiddleware');

router.post('/', auth, ctrl.createBooking.bind(ctrl));
router.get('/my', auth, ctrl.getMyBookings.bind(ctrl));

// Authenticated Admin/Owner booking management routes
router.get('/admin/bookings', auth, ctrl.getAdminBookings.bind(ctrl));
router.post('/admin/bookings/:id/approve', auth, ctrl.approveAdminBooking.bind(ctrl));
router.patch('/admin/bookings/:id', auth, ctrl.patchAdminBooking.bind(ctrl));
router.delete('/admin/bookings/:id', auth, ctrl.deleteAdminBooking.bind(ctrl));

// Legacy / Internal owner endpoints
router.get('/owner/:ownerId', ctrl.getBookingsByOwner.bind(ctrl));
router.post('/legacy/:id/approve', ctrl.approveBooking.bind(ctrl));

router.get('/:id', auth, ctrl.getBookingDetails.bind(ctrl));

module.exports = router;

