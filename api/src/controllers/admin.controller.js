const User = require('../models/User');
const Supplier = require('../models/Supplier');
const Order = require('../models/Order');
const AdminCommission = require('../models/AdminCommission');
const paginate = require('../utils/pagination');

// @desc    Get dashboard metrics overview
// @route   GET /api/v1/admin/overview
// @access  Private (Admin Only)
exports.getOverview = async (req, res, next) => {
  try {
    const totalCustomers = await User.countDocuments({ role: 'customer' });
    const totalSuppliers = await User.countDocuments({ role: 'supplier' });
    const totalOrders = await Order.countDocuments();

    // Aggregate total sales revenue
    const revenueStats = await Order.aggregate([
      { $match: { status: { $ne: 'cancelled' } } },
      { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' } } }
    ]);
    const totalRevenue = revenueStats.length > 0 ? revenueStats[0].totalRevenue : 0;

    // Aggregate total admin commissions collected
    const commissionStats = await AdminCommission.aggregate([
      { $group: { _id: null, totalCommissions: { $sum: '$commissionAmount' } } }
    ]);
    const totalCommissions = commissionStats.length > 0 ? commissionStats[0].totalCommissions : 0;

    // Aggregate sales monthly trend (last 6 months)
    const monthlySales = await Order.aggregate([
      {
        $match: {
          status: { $ne: 'cancelled' },
          createdAt: { $gte: new Date(new Date().setMonth(new Date().getMonth() - 6)) }
        }
      },
      {
        $group: {
          _id: { $month: '$createdAt' },
          sales: { $sum: '$totalAmount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.success({
      totalCustomers,
      totalSuppliers,
      totalOrders,
      totalRevenue,
      totalCommissions,
      monthlySales
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all users on platform
// @route   GET /api/v1/admin/users
// @access  Private (Admin Only)
exports.getUsers = async (req, res, next) => {
  try {
    const { role } = req.query;
    const filter = {};
    if (role) {
      filter.role = role;
    }

    const paginatedResult = await paginate(User, filter, req, [], '', { createdAt: -1 });
    res.success(paginatedResult);
  } catch (error) {
    next(error);
  }
};

// @desc    Get all supplier profiles with performance
// @route   GET /api/v1/admin/suppliers
// @access  Private (Admin Only)
exports.getSuppliers = async (req, res, next) => {
  try {
    const populateOptions = [{ path: 'user', select: 'name email phone avatarUrl address' }];
    const paginatedResult = await paginate(Supplier, {}, req, populateOptions, '', { rating: -1 });
    res.success(paginatedResult);
  } catch (error) {
    next(error);
  }
};

// @desc    Get all commission tracking logs
// @route   GET /api/v1/admin/commissions
// @access  Private (Admin Only)
exports.getCommissions = async (req, res, next) => {
  try {
    const populateOptions = [
      { path: 'order', select: 'status deliveryPincode' },
      { path: 'customer', select: 'name' },
      { path: 'supplier', select: 'name' }
    ];
    const paginatedResult = await paginate(AdminCommission, {}, req, populateOptions, '', { createdAt: -1 });
    res.success(paginatedResult);
  } catch (error) {
    next(error);
  }
};

// @desc    Suspend or activate user account
// @route   PATCH /api/v1/admin/users/:id/status
// @access  Private (Admin Only)
exports.toggleUserStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!['active', 'suspended'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status. Choose active or suspended.',
        timestamp: new Date().toISOString()
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        timestamp: new Date().toISOString()
      });
    }

    if (user._id.toString() === req.user.id) {
      return res.status(400).json({
        success: false,
        error: 'Cannot suspend your own active administrator account',
        timestamp: new Date().toISOString()
      });
    }

    user.status = status;
    await user.save();

    res.success({ id: user._id, status: user.status, message: `User account successfully ${status}` });
  } catch (error) {
    next(error);
  }
};
