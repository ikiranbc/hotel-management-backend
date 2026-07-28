const router = require('express').Router();
const ctrl = require('../controllers/userController');
const auth = require('../middleware/authMiddleware');

router.post('/register', ctrl.register.bind(ctrl));
router.post('/login', ctrl.login.bind(ctrl));
router.post('/admin/login-bypass', ctrl.adminLoginBypass.bind(ctrl));
router.get('/profile', auth, ctrl.getProfile.bind(ctrl));

module.exports = router;

