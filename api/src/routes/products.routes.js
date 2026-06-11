const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
} = require('../controllers/products.controller');
const { protect, restrictTo } = require('../middleware/auth.middleware');

const validate = require('../middleware/validate');
const { createProductSchema, updateProductSchema } = require('../middleware/schemas');

router.get('/', getProducts);
router.get('/:id', getProductById);

// Protected Supplier-only routes
router.post('/', protect, restrictTo('supplier', 'admin'), validate(createProductSchema), createProduct);
router.put('/:id', protect, restrictTo('supplier', 'admin'), validate(updateProductSchema), updateProduct);
router.delete('/:id', protect, restrictTo('supplier', 'admin'), deleteProduct);

module.exports = router;
