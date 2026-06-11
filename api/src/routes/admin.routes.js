const express = require('express');
const router = express.Router();
const {
  getOverview,
  getUsers,
  getSuppliers,
  getCommissions,
  toggleUserStatus,
  getAuditLogs
} = require('../controllers/admin.controller');
const { protect, restrictTo } = require('../middleware/auth.middleware');

// All administrative actions require authenticated admin account
router.use(protect);
router.use(restrictTo('admin'));

router.get('/overview', getOverview);
router.get('/users', getUsers);
router.get('/suppliers', getSuppliers);
router.get('/commissions', getCommissions);
router.get('/logs', getAuditLogs);
router.patch('/users/:id/status', toggleUserStatus);

module.exports = router;
