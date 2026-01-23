const express = require('express');
const router = express.Router();
const paymentController = require('../../controllers/payment.controller');
const authenticate = require('../../middleware/auth');

router.post('/order', authenticate, paymentController.createOrder);
router.post('/verify', authenticate, paymentController.verifyPayment);

module.exports = router;
