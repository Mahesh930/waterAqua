const express = require('express');
const router = express.Router();
const {
  getSuppliers,
  getSupplierById,
  getMyProfile,
  updateMyProfile,
  getSupplierFeedback
} = require('../controllers/suppliers.controller');
const { protect, restrictTo } = require('../middleware/auth.middleware');

router.get('/', getSuppliers);
router.get('/me', protect, restrictTo('supplier'), getMyProfile);
router.put('/me', protect, restrictTo('supplier'), updateMyProfile);
router.get('/:id', getSupplierById);
router.get('/:id/feedback', getSupplierFeedback);

module.exports = router;
