const express = require('express');
const router = Router = express.Router();
const { getNotifications, markNotificationsRead } = require('../controllers/notifications.controller');
const { protect } = require('../middleware/auth.middleware');

router.use(protect);

router.get('/', getNotifications);
router.patch('/mark-read', markNotificationsRead);

module.exports = router;
