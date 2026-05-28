const express = require('express');
const router = express.Router();
const {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  verifyOtp,
  verifyRazorpayPayment
} = require('../controllers/orders.controller');
const { protect, restrictTo } = require('../middleware/auth.middleware');

// All order actions require authenticated user
router.use(protect);

router.post('/', restrictTo('customer'), createOrder);
router.post('/verify-payment', restrictTo('customer'), verifyRazorpayPayment);
router.get('/', getOrders);
router.get('/:id', getOrderById);

// Protected Supplier-only delivery cycle routes
router.patch('/:id/status', restrictTo('supplier', 'admin'), updateOrderStatus);
router.post('/:id/verify-otp', restrictTo('supplier', 'admin'), verifyOtp);

module.exports = router;
// Force Nodemon environment reload

