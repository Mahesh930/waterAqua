const Notification = require('../models/Notification');
const paginate = require('../utils/pagination');

// @desc    Get user notifications
// @route   GET /api/v1/notifications
// @access  Private
exports.getNotifications = async (req, res, next) => {
  try {
    const paginatedResult = await paginate(Notification, { user: req.user.id }, req, [], '', { createdAt: -1 });
    res.success(paginatedResult);
  } catch (error) {
    next(error);
  }
};

// @desc    Mark all user notifications as read
// @route   PATCH /api/v1/notifications/mark-read
// @access  Private
exports.markNotificationsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { user: req.user.id, read: false },
      { $set: { read: true } }
    );

    res.success({ message: 'All notifications successfully marked as read' });
  } catch (error) {
    next(error);
  }
};
