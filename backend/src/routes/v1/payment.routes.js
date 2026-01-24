const express = require('express');
const router = express.Router();
const paymentController = require('../../controllers/payment.controller');
const authenticate = require('../../middleware/auth');

router.post('/order', authenticate, paymentController.createOrder);
router.post('/verify', authenticate, paymentController.verifyPayment);
router.get('/history', authenticate, paymentController.getPaymentHistory);
router.get('/receipt/:id', authenticate, paymentController.getReceipt);
router.post('/downgrade', authenticate, paymentController.downgradePlan);
router.post('/receipt/:id/email', authenticate, paymentController.emailReceipt);

module.exports = router;
