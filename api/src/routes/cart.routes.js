const express = require('express');
const router = express.Router();
const {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart
} = require('../controllers/cart.controller');
const { protect, restrictTo } = require('../middleware/auth.middleware');

// All cart actions require authenticated user
router.use(protect);

router.get('/', getCart);
router.post('/items', addToCart);
router.patch('/items/:id', updateCartItem);
router.delete('/items/:id', removeFromCart);
router.delete('/clear', clearCart);

module.exports = router;
