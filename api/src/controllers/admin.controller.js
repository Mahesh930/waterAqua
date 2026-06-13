const User = require('../models/User');
const Supplier = require('../models/Supplier');
const Order = require('../models/Order');
const AdminCommission = require('../models/AdminCommission');
const AuditLog = require('../models/AuditLog');
const { logAudit } = require('../utils/auditLogger');
const paginate = require('../utils/pagination');

// @desc    Get dashboard metrics overview
// @route   GET /api/v1/admin/overview
// @access  Private (Admin Only)
exports.getOverview = async (req, res, next) => {
  try {
    const totalCustomers = await User.countDocuments({ role: 'customer', deletedAt: null });
    const totalSuppliers = await User.countDocuments({ role: 'supplier', deletedAt: null });
    const totalOrders = await Order.countDocuments();
    const totalUsers = await User.countDocuments({ deletedAt: null });

    // Aggregate total sales revenue for delivered orders
    const revenueStats = await Order.aggregate([
      { $match: { status: 'delivered' } },
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

    // Additional metrics for Admin Dashboard
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const ordersToday = await Order.countDocuments({ createdAt: { $gte: startOfToday } });
    const pendingOrders = await Order.countDocuments({ status: 'placed' });
    const activeSuppliers = await Supplier.countDocuments({ isActive: true });

    // Aggregate orders count by status
    const orderStatusStats = await Order.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    const orderCounts = {
      placed: 0,
      confirmed: 0,
      out_for_delivery: 0,
      delivered: 0,
      cancelled: 0
    };
    orderStatusStats.forEach(stat => {
      if (orderCounts[stat._id] !== undefined) {
        orderCounts[stat._id] = stat.count;
      }
    });

    // Top 5 suppliers
    const topSuppliers = await Supplier.find({ isActive: true })
      .populate({ path: 'user', select: 'name email phone avatarUrl address status' })
      .sort({ rating: -1 })
      .limit(5);

    // Daily orders for the last 14 days
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 13);
    fourteenDaysAgo.setHours(0, 0, 0, 0);

    const dailyOrders = await Order.aggregate([
      { $match: { createdAt: { $gte: fourteenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "+05:30" } },
          count: { $sum: 1 }
        }
      }
    ]);

    const dailyData = [];
    for (let i = 0; i < 14; i++) {
      const d = new Date();
      d.setDate(d.getDate() - (13 - i));
      // Format as YYYY-MM-DD in local/timezone-adjusted string
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const date = String(d.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${date}`;
      const match = dailyOrders.find(o => o._id === dateStr);
      dailyData.push({
        date: d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
        orders: match ? match.count : 0
      });
    }

    // Monthly revenue and commission for the current year
    const currentYear = new Date().getFullYear();
    const monthlyOrdersStats = await Order.aggregate([
      {
        $match: {
          status: 'delivered',
          createdAt: {
            $gte: new Date(currentYear, 0, 1),
            $lt: new Date(currentYear + 1, 0, 1)
          }
        }
      },
      {
        $group: {
          _id: { $month: '$createdAt' },
          revenue: { $sum: '$totalAmount' }
        }
      }
    ]);

    const monthlyCommsStats = await AdminCommission.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(currentYear, 0, 1),
            $lt: new Date(currentYear + 1, 0, 1)
          }
        }
      },
      {
        $group: {
          _id: { $month: '$createdAt' },
          commission: { $sum: '$commissionAmount' }
        }
      }
    ]);

    const monthlyData = [];
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    for (let i = 0; i < 12; i++) {
      const monthNum = i + 1;
      const orderStat = monthlyOrdersStats.find(o => o._id === monthNum);
      const commStat = monthlyCommsStats.find(c => c._id === monthNum);
      monthlyData.push({
        month: monthNames[i],
        revenue: orderStat ? orderStat.revenue : 0,
        commission: commStat ? commStat.commission : 0
      });
    }

    res.success({
      totalCustomers,
      totalSuppliers,
      totalOrders,
      totalRevenue,
      totalCommissions,
      totalUsers,
      ordersToday,
      pendingOrders,
      activeSuppliers,
      topSuppliers,
      dailyData,
      monthlyData,
      monthlySales,
      orderCounts
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
    const { role, search } = req.query;
    const filter = { deletedAt: null };
    if (role) {
      filter.role = role;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
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
    const { search } = req.query;
    const filter = {};

    if (search) {
      // Find matching users if search matches name/email
      const matchingUsers = await User.find({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      }).select('_id');
      const matchingUserIds = matchingUsers.map(u => u._id);

      filter.$or = [
        { businessName: { $regex: search, $options: 'i' } },
        { area: { $regex: search, $options: 'i' } },
        { user: { $in: matchingUserIds } }
      ];
    }

    const populateOptions = [{ path: 'user', select: 'name email phone avatarUrl address status' }];
    const paginatedResult = await paginate(Supplier, filter, req, populateOptions, '', { rating: -1 });
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

    await logAudit({
      userId: req.user.id,
      action: status === 'suspended' ? 'user_suspended' : 'user_activated',
      entityType: 'User',
      entityId: user._id,
      details: { targetUserId: user._id, targetUserName: user.name, status },
      req
    });

    res.success({ id: user._id, status: user.status, message: `User account successfully ${status}` });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all audit logs
// @route   GET /api/v1/admin/logs
// @access  Private (Admin Only)
exports.getAuditLogs = async (req, res, next) => {
  try {
    const { action, search } = req.query;
    const filter = {};

    if (action && action !== 'all') {
      const actionList = action.split(',');
      filter.action = { $in: actionList };
    }

    if (search) {
      const matchingUsers = await User.find({
        name: { $regex: search, $options: 'i' }
      }).select('_id');
      const matchingUserIds = matchingUsers.map(u => u._id);

      filter.$or = [
        { action: { $regex: search, $options: 'i' } },
        { entityType: { $regex: search, $options: 'i' } },
        { user: { $in: matchingUserIds } }
      ];
    }

    const populateOptions = [{ path: 'user', select: 'name email role' }];
    const paginatedResult = await paginate(AuditLog, filter, req, populateOptions, '', { createdAt: -1 });
    res.success(paginatedResult);
  } catch (error) {
    next(error);
  }
};
