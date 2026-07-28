const router = require('express').Router();
const ctrl = require('../controllers/userController');
const auth = require('../middleware/authMiddleware');

router.post('/register', ctrl.register.bind(ctrl));
router.post('/login', ctrl.login.bind(ctrl));
router.post('/admin/login-bypass', ctrl.adminLoginBypass.bind(ctrl));
router.get('/profile', auth, ctrl.getProfile.bind(ctrl));


// Admin/Owner Bookings Management Routes
router.get('/admin/bookings', auth, ctrl.getAdminBookings.bind(ctrl));
router.patch('/admin/bookings/:id', auth, ctrl.patchAdminBooking.bind(ctrl));
router.post('/admin/bookings/:id/approve', auth, ctrl.approveAdminBooking.bind(ctrl));
router.delete('/admin/bookings/:id', auth, ctrl.deleteAdminBooking.bind(ctrl));

module.exports = router;

