const express = require('express');
const router  = express.Router();
const {
  createRazorpayOrder,
  verifyPayment,
  getPaymentStatus,
} = require('../controllers/payment.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

// Create Razorpay order — buyer calls before opening checkout modal
router.post('/:orderId/create-order', protect, authorize('buyer'), createRazorpayOrder);

// Verify payment after Razorpay checkout success callback
router.post('/:orderId/verify', protect, authorize('buyer'), verifyPayment);

// Check payment / order status
router.get('/:orderId/status', protect, getPaymentStatus);

module.exports = router;
