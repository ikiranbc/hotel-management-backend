const router = require('express').Router();
const ctrl = require('../controllers/walletController');
const auth = require('../middleware/authMiddleware');

router.get('/balance', auth, ctrl.getBalance.bind(ctrl));
router.post('/load', auth, ctrl.loadFunds.bind(ctrl));
router.get('/transactions', auth, ctrl.getTransactions.bind(ctrl));

module.exports = router;
