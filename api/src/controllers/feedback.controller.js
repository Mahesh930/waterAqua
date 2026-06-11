const Feedback = require('../models/Feedback');
const Order = require('../models/Order');
const Supplier = require('../models/Supplier');
const Notification = require('../models/Notification');
const paginate = require('../utils/pagination');
const { logAudit } = require('../utils/auditLogger');

// @desc    Submit feedback/review for a completed order
// @route   POST /api/v1/orders/:id/feedback
// @access  Private (Customer Only)
exports.createFeedback = async (req, res, next) => {
  try {
    const { rating, comment } = req.body;
    const orderId = req.params.id;

    // Fetch the order
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order record not found',
        timestamp: new Date().toISOString()
      });
    }

    // Verify requesting user is the customer of the order
    if (order.customer.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to submit feedback for this order',
        timestamp: new Date().toISOString()
      });
    }

    // Enforce feedback only on delivered orders
    if (order.status !== 'delivered') {
      return res.status(400).json({
        success: false,
        error: 'Feedback can only be submitted for successfully delivered orders',
        timestamp: new Date().toISOString()
      });
    }

    // Check if feedback already exists for this order
    const feedbackExists = await Feedback.findOne({ order: orderId });
    if (feedbackExists) {
      return res.status(400).json({
        success: false,
        error: 'You have already submitted feedback for this order',
        timestamp: new Date().toISOString()
      });
    }

    // Create feedback
    const feedback = await Feedback.create({
      order: orderId,
      customer: req.user.id,
      supplier: order.supplier,
      rating,
      comment: comment || ''
    });

    // Recalculate supplier average rating
    const stats = await Feedback.aggregate([
      { $match: { supplier: order.supplier } },
      { $group: { _id: '$supplier', avgRating: { $avg: '$rating' } } }
    ]);

    const avgRating = stats.length > 0 ? Math.round(stats[0].avgRating * 10) / 10 : rating;

    await Supplier.findOneAndUpdate(
      { user: order.supplier },
      { rating: avgRating },
      { new: true }
    );

    // Notify supplier of feedback
    await Notification.create({
      user: order.supplier,
      title: 'New Review Received',
      message: `A customer has rated your delivery service ${rating} stars.`,
      type: 'order'
    });

    // Audit log
    await logAudit({
      userId: req.user.id,
      action: 'feedback_submitted',
      entityType: 'Feedback',
      entityId: feedback._id,
      details: { orderId, rating, supplier: order.supplier },
      req
    });

    res.success(feedback, 201);
  } catch (error) {
    next(error);
  }
};

// @desc    Get all reviews/feedback for a specific supplier
// @route   GET /api/v1/suppliers/:id/feedback
// @access  Public
exports.getSupplierFeedback = async (req, res, next) => {
  try {
    const supplierId = req.params.id;

    // Verify if supplier profile exists
    const supplierExists = await Supplier.findOne({ user: supplierId });
    const profileId = supplierExists ? supplierExists.user : supplierId;

    const populateOptions = [
      { path: 'customer', select: 'name avatarUrl' }
    ];

    const paginatedResult = await paginate(
      Feedback,
      { supplier: profileId },
      req,
      populateOptions,
      '',
      { createdAt: -1 }
    );

    res.success(paginatedResult);
  } catch (error) {
    next(error);
  }
};
