const express = require('express');
const router = express.Router();
const {
  getSuppliers,
  getSupplierById,
  getMyProfile,
  updateMyProfile
} = require('../controllers/suppliers.controller');
const { getSupplierFeedback } = require('../controllers/feedback.controller');
const { protect, restrictTo } = require('../middleware/auth.middleware');

router.get('/', getSuppliers);
router.get('/me', protect, restrictTo('supplier'), getMyProfile);
router.put('/me', protect, restrictTo('supplier'), updateMyProfile);
router.get('/:id', getSupplierById);
router.get('/:id/feedback', getSupplierFeedback);

module.exports = router;
