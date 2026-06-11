const express = require('express');
const router = express.Router();
const {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  verifyOtp,
  verifyRazorpayPayment,
  cancelOrder
} = require('../controllers/orders.controller');
const { protect, restrictTo } = require('../middleware/auth.middleware');

const validate = require('../middleware/validate');
const {
  createOrderSchema,
  verifyRazorpayPaymentSchema,
  updateOrderStatusSchema,
  verifyOtpSchema
} = require('../middleware/schemas');

// All order actions require authenticated user
router.use(protect);

router.post('/', restrictTo('customer'), validate(createOrderSchema), createOrder);
router.post('/verify-payment', restrictTo('customer'), validate(verifyRazorpayPaymentSchema), verifyRazorpayPayment);
router.get('/', getOrders);
router.get('/:id', getOrderById);

// Customer-only cancellation route
router.patch('/:id/cancel', restrictTo('customer'), cancelOrder);

// Customer feedback route
const { createFeedback } = require('../controllers/feedback.controller');
router.post('/:id/feedback', restrictTo('customer'), createFeedback);

// Protected Supplier-only delivery cycle routes
router.patch('/:id/status', restrictTo('supplier', 'admin'), validate(updateOrderStatusSchema), updateOrderStatus);
router.post('/:id/verify-otp', restrictTo('supplier', 'admin'), validate(verifyOtpSchema), verifyOtp);

module.exports = router;
// Force Nodemon environment reload

