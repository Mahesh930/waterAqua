const Order = require('../models/Order');
const CartItem = require('../models/CartItem');
const Product = require('../models/Product');
const AdminCommission = require('../models/AdminCommission');
const Notification = require('../models/Notification');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const mongoose = require('mongoose');
const paginate = require('../utils/pagination');
const { logAudit } = require('../utils/auditLogger');

// @desc    Place a new order
// @route   POST /api/v1/orders
// @access  Private (Customer Only)
exports.createOrder = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const {
      deliveryAddress,
      deliveryPincode,
      phone,
      deliveryDate,
      deliveryTimeSlot,
      paymentMethod,
      notes
    } = req.body;

    // Fetch customer's cart items
    const cartItems = await CartItem.find({ user: req.user.id }).populate('product').session(session);

    if (!cartItems || cartItems.length === 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        error: 'Your shopping cart is empty',
        timestamp: new Date().toISOString()
      });
    }

    // Verify all cart items belong to the same supplier (AquaHome rule)
    const supplierId = cartItems[0].supplier.toString();
    const allSameSupplier = cartItems.every(item => item.supplier.toString() === supplierId);

    if (!allSameSupplier) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        error: 'All items in your cart must belong to the same supplier for checkout',
        timestamp: new Date().toISOString()
      });
    }

    // Map cart items to order items and calculate totals
    let totalAmount = 0;
    const products = [];

    for (const item of cartItems) {
      if (!item.product || !item.product.isActive) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({
          success: false,
          error: `Product ${item.product ? item.product.name : 'Unknown'} is no longer available`,
          timestamp: new Date().toISOString()
        });
      }

      if (item.product.stock < item.quantity) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({
          success: false,
          error: `Product ${item.product.name} has insufficient stock. Available: ${item.product.stock}`,
          timestamp: new Date().toISOString()
        });
      }

      const itemTotal = item.product.price * item.quantity;
      totalAmount += itemTotal;

      products.push({
        product: item.product._id,
        name: item.product.name,
        price: item.product.price,
        quantity: item.quantity
      });

      // Decrement catalog stock atomically
      const updatedProduct = await Product.findOneAndUpdate(
        { _id: item.product._id, stock: { $gte: item.quantity } },
        { $inc: { stock: -item.quantity } },
        { session, new: true }
      );

      if (!updatedProduct) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({
          success: false,
          error: `Failed to secure stock for product ${item.product.name}. Stock was modified by another request.`,
          timestamp: new Date().toISOString()
        });
      }
    }

    // Generate secure 4-digit OTP for delivery verification
    const otp = crypto.randomInt(0, 10000).toString().padStart(4, '0');
    const otpExpiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour expiry

    // Generate unique Razorpay Order ID for online payments
    let razorpayOrderId = '';
    if (paymentMethod === 'online') {
      try {
        const razorpayInstance = new Razorpay({
          key_id: process.env.RAZORPAY_KEY_ID,
          key_secret: process.env.RAZORPAY_KEY_SECRET
        });
        const rpOrder = await razorpayInstance.orders.create({
          amount: Math.round(totalAmount * 100), // lowest unit (paise)
          currency: 'INR',
          receipt: `receipt_order_${Date.now()}`
        });
        razorpayOrderId = rpOrder.id;
      } catch (err) {
        await session.abortTransaction();
        session.endSession();
        console.error('Razorpay Order Creation Error:', err);
        return res.status(500).json({
          success: false,
          error: 'Failed to initialize online payment session with Razorpay',
          timestamp: new Date().toISOString()
        });
      }
    }

    // Create the order
    const order = await Order.create([{
      customer: req.user.id,
      supplier: supplierId,
      products,
      totalAmount,
      deliveryAddress,
      deliveryPincode,
      phone,
      deliveryDate: new Date(deliveryDate),
      deliveryTimeSlot,
      otp,
      otpExpiresAt,
      otpAttempts: 0,
      paymentMethod: paymentMethod || 'cod',
      razorpayOrderId,
      notes: notes || ''
    }], { session });

    const newOrder = order[0];

    // Clear user's cart
    await CartItem.deleteMany({ user: req.user.id }, { session });

    // Calculate admin commission
    const orderHour = new Date().getHours();
    const isPeakHour = orderHour >= 18 && orderHour <= 21; // 6 PM to 9 PM is peak hour
    const commissionRate = isPeakHour ? 0.08 : 0.05; // 8% during peak hours, otherwise 5%
    const commissionAmount = totalAmount * commissionRate;

    await AdminCommission.create([{
      order: newOrder._id,
      customer: req.user.id,
      supplier: supplierId,
      orderAmount: totalAmount,
      commissionRate,
      commissionAmount,
      isPeakHour,
      orderHour,
      pincode: deliveryPincode,
      formulaBreakdown: `${totalAmount} * ${commissionRate * 100}% = ${commissionAmount} (Peak Hour: ${isPeakHour ? 'Yes' : 'No'})`
    }], { session });

    // Create delivery/placed notifications (without raw OTP in text)
    await Notification.create([{
      user: supplierId,
      title: 'New Order Received',
      message: `You have received a new order for ${totalAmount} Rs. OTP generated is sent to customer.`,
      type: 'order'
    }], { session });

    await Notification.create([{
      user: req.user.id,
      title: 'Order Placed Successfully',
      message: `Your water order has been placed. Please share the delivery verification OTP with the supplier only upon delivery. You can view the OTP on the order tracking page.`,
      type: 'order'
    }], { session });

    // Commit transaction
    await session.commitTransaction();
    session.endSession();

    await logAudit({
      userId: req.user.id,
      action: 'order_placed',
      entityType: 'Order',
      entityId: newOrder._id,
      details: { supplierId, totalAmount, paymentMethod },
      req
    });

    // Emit live event to supplier room
    if (req.io) {
      req.io.to(`supplier:${supplierId}`).emit('newOrder', { supplierId, orderId: newOrder._id });
    }

    const orderData = newOrder.toObject ? newOrder.toObject() : newOrder;
    if (paymentMethod === 'online') {
      orderData.razorpayKeyId = process.env.RAZORPAY_KEY_ID;
    }

    res.success(orderData, 201);
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

// @desc    Get all orders
// @route   GET /api/v1/orders
// @access  Private
exports.getOrders = async (req, res, next) => {
  try {
    const filter = {};

    if (req.user.role === 'customer') {
      filter.customer = req.user.id;
    } else if (req.user.role === 'supplier') {
      filter.supplier = req.user.id;
    }

    const { status, search } = req.query;

    if (status) {
      if (status.includes(',')) {
        filter.status = { $in: status.split(',') };
      } else {
        filter.status = status;
      }
    }

    if (search) {
      const isObjectId = mongoose.Types.ObjectId.isValid(search);
      const orConditions = [];

      if (isObjectId) {
        orConditions.push({ _id: search });
      }

      // Check if search matches customer name
      const matchingCustomers = await User.find({
        name: { $regex: search, $options: 'i' }
      }).select('_id');
      const matchingCustomerIds = matchingCustomers.map(u => u._id);
      if (matchingCustomerIds.length > 0) {
        orConditions.push({ customer: { $in: matchingCustomerIds } });
      }

      // Check if search matches supplier businessName
      const Supplier = require('../models/Supplier');
      const matchingSuppliers = await Supplier.find({
        businessName: { $regex: search, $options: 'i' }
      }).select('user');
      const matchingSupplierUserIds = matchingSuppliers.map(s => s.user);
      if (matchingSupplierUserIds.length > 0) {
        orConditions.push({ supplier: { $in: matchingSupplierUserIds } });
      }

      if (orConditions.length > 0) {
        filter.$or = orConditions;
      } else if (!isObjectId) {
        // If search doesn't match any customers/suppliers and isn't ObjectId, return empty results by matching a non-existent ObjectId
        filter._id = new mongoose.Types.ObjectId();
      }
    }

    const populateOptions = [
      { path: 'customer', select: 'name email phone avatarUrl address status createdAt' },
      { path: 'supplier', select: 'name email phone' }
    ];

    const paginatedResult = await paginate(Order, filter, req, populateOptions, '', { createdAt: -1 });

    // Sanitize orders for supplier to hide OTP
    const sanitizedResults = paginatedResult.results.map(order => {
      const oObj = order.toObject();
      if (req.user.role === 'supplier' && !oObj.otpVerified) {
        delete oObj.otp;
      }
      return oObj;
    });

    res.success({
      results: sanitizedResults,
      pagination: paginatedResult.pagination
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single order details
// @route   GET /api/v1/orders/:id
// @access  Private
exports.getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate({ path: 'customer', select: 'name email phone avatarUrl address status createdAt' })
      .populate({ path: 'supplier', select: 'name email phone' });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order record not found',
        timestamp: new Date().toISOString()
      });
    }

    // Verify authorized user
    if (
      order.customer._id.toString() !== req.user.id &&
      order.supplier._id.toString() !== req.user.id &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to view this order details',
        timestamp: new Date().toISOString()
      });
    }

    // Sanitize order for supplier to hide OTP
    const orderObj = order.toObject();
    if (req.user.role === 'supplier' && !orderObj.otpVerified) {
      delete orderObj.otp;
    }

    res.success(orderObj);
  } catch (error) {
    next(error);
  }
};

// @desc    Update order status
// @route   PATCH /api/v1/orders/:id/status
// @access  Private (Supplier Only)
exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const allowedStatuses = ['confirmed', 'out_for_delivery', 'cancelled'];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid order status transition from this endpoint',
        timestamp: new Date().toISOString()
      });
    }

    let order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order record not found',
        timestamp: new Date().toISOString()
      });
    }

    // Verify requesting user is the supplier who received the order
    if (order.supplier.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to manage this order',
        timestamp: new Date().toISOString()
      });
    }

    order.status = status;
    await order.save();

    await logAudit({
      userId: req.user.id,
      action: 'order_status_updated',
      entityType: 'Order',
      entityId: order._id,
      details: { status },
      req
    });

    // Notify customer about status change
    await Notification.create({
      user: order.customer,
      title: `Order Status Update`,
      message: `Your water delivery order is now ${status.replace(/_/g, ' ')}.`,
      type: 'order'
    });

    // Populate user references for WebSocket payload
    order = await order.populate([
      { path: 'customer', select: 'name email phone avatarUrl address status createdAt' },
      { path: 'supplier', select: 'name email phone' }
    ]);

    // Emit live WebSockets update to order tracking room
    if (req.io) {
      req.io.to(`order:${order._id}`).emit('orderStatusChanged', order);
      console.log(`Websocket emitted orderStatusChanged for order:${order._id}`);
    }

    res.success(order);
  } catch (error) {
    next(error);
  }
};

// @desc    Verify delivery OTP and complete order
// @route   POST /api/v1/orders/:id/verify-otp
// @access  Private (Supplier Only)
exports.verifyOtp = async (req, res, next) => {
  try {
    const { otp } = req.body;

    let order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order record not found',
        timestamp: new Date().toISOString()
      });
    }

    // Verify supplier
    if (order.supplier.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to manage this order',
        timestamp: new Date().toISOString()
      });
    }

    // Check if OTP attempts exceeded
    if (order.otpAttempts >= 5) {
      return res.status(400).json({
        success: false,
        error: 'Maximum OTP verification attempts exceeded. Please contact support.',
        timestamp: new Date().toISOString()
      });
    }

    // Check if OTP has expired
    if (new Date() > order.otpExpiresAt) {
      return res.status(400).json({
        success: false,
        error: 'The delivery verification OTP has expired. Please contact support.',
        timestamp: new Date().toISOString()
      });
    }

    // Check if OTP matches
    if (order.otp !== otp) {
      order.otpAttempts += 1;
      await order.save();
      return res.status(400).json({
        success: false,
        error: `Invalid OTP code. ${5 - order.otpAttempts} attempts remaining.`,
        timestamp: new Date().toISOString()
      });
    }

    order.status = 'delivered';
    order.otpVerified = true;
    if (order.paymentMethod === 'cod') {
      order.paymentStatus = req.body.paymentStatus || 'paid';
    }
    await order.save();

    // Check if this is the customer's first completed order to claim referral bonus
    const completedOrdersCount = await Order.countDocuments({
      customer: order.customer,
      status: 'delivered'
    });

    if (completedOrdersCount === 1) {
      const Referral = require('../models/Referral');
      const pendingReferral = await Referral.findOne({ referred: order.customer, status: 'pending' });
      if (pendingReferral) {
        pendingReferral.status = 'completed';
        await pendingReferral.save();

        await Notification.create({
          user: pendingReferral.referrer,
          title: 'Referral Reward Earned!',
          message: `Your referral reward of ${pendingReferral.rewardAmount} Rs has been credited as your friend completed their first order!`,
          type: 'order'
        });

        await Notification.create({
          user: pendingReferral.referred,
          title: 'Referral Reward Earned!',
          message: `Your signup referral reward of ${pendingReferral.rewardAmount} Rs has been credited!`,
          type: 'order'
        });
      }
    }

    await logAudit({
      userId: req.user.id,
      action: 'order_otp_verified',
      entityType: 'Order',
      entityId: order._id,
      details: { paymentMethod: order.paymentMethod, status: order.status },
      req
    });

    // Create completion alerts
    await Notification.create({
      user: order.customer,
      title: 'Water Order Delivered',
      message: `Your order of ${order.totalAmount} Rs has been successfully delivered and verified via OTP. Thank you!`,
      type: 'order'
    });

    await Notification.create({
      user: order.supplier,
      title: 'Order Completed',
      message: `Order #${order._id} successfully delivered. Commission calculation completed.`,
      type: 'order'
    });

    order = await order.populate([
      { path: 'customer', select: 'name email phone avatarUrl address status createdAt' },
      { path: 'supplier', select: 'name email phone' }
    ]);

    // Emit live WebSockets updates to tracking room
    if (req.io) {
      req.io.to(`order:${order._id}`).emit('orderStatusChanged', order);
      console.log(`Websocket completed orderStatusChanged emit for order:${order._id}`);
    }

    res.success(order);
  } catch (error) {
    next(error);
  }
};

// @desc    Verify Razorpay online payment signature
// @route   POST /api/v1/orders/verify-payment
// @access  Private (Customer Only)
exports.verifyRazorpayPayment = async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        error: 'Missing Razorpay payment parameters for verification',
        timestamp: new Date().toISOString()
      });
    }

    // Cryptographic signature check
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    const isSignatureValid = expectedSignature === razorpay_signature;

    if (!isSignatureValid) {
      return res.status(400).json({
        success: false,
        error: 'Invalid payment signature. Verification failed.',
        timestamp: new Date().toISOString()
      });
    }

    // Find and update the order in database
    const order = await Order.findOneAndUpdate(
      { razorpayOrderId: razorpay_order_id },
      { 
        paymentStatus: 'paid',
        razorpayPaymentId: razorpay_payment_id
      },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order associated with this Razorpay session not found',
        timestamp: new Date().toISOString()
      });
    }

    // Create success notification
    await Notification.create({
      user: order.customer,
      title: 'Online Payment Successful',
      message: `Your payment of ${order.totalAmount} Rs has been successfully processed via Razorpay.`,
      type: 'order'
    });

    res.success(order);
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel order by customer
// @route   PATCH /api/v1/orders/:id/cancel
// @access  Private (Customer Only)
exports.cancelOrder = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    let order = await Order.findById(req.params.id).session(session);

    if (!order) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        error: 'Order record not found',
        timestamp: new Date().toISOString()
      });
    }

    // Verify authorized user (customer who placed it)
    if (order.customer.toString() !== req.user.id) {
      await session.abortTransaction();
      session.endSession();
      return res.status(403).json({
        success: false,
        error: 'Not authorized to cancel this order',
        timestamp: new Date().toISOString()
      });
    }

    // Allowed to cancel only if placed or confirmed
    if (!['placed', 'confirmed'].includes(order.status)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        error: `Cannot cancel order in state: ${order.status}. Only placed or confirmed orders can be cancelled.`,
        timestamp: new Date().toISOString()
      });
    }

    // Restore stock
    for (const item of order.products) {
      await Product.findByIdAndUpdate(
        item.product,
        { $inc: { stock: item.quantity } },
        { session }
      );
    }

    order.status = 'cancelled';
    await order.save({ session });

    // Create notifications for customer and supplier
    await Notification.create([{
      user: order.customer,
      title: 'Order Cancelled Successfully',
      message: `Your order of ${order.totalAmount} Rs has been cancelled and products stock restored.`,
      type: 'order'
    }], { session });

    await Notification.create([{
      user: order.supplier,
      title: 'Order Cancelled by Customer',
      message: `Order #${order._id} was cancelled by the customer. Stock has been restored automatically.`,
      type: 'order'
    }], { session });

    await session.commitTransaction();
    session.endSession();

    await logAudit({
      userId: req.user.id,
      action: 'order_cancelled_by_customer',
      entityType: 'Order',
      entityId: order._id,
      details: { originalStatus: order.status, restoredProducts: order.products.map(p => ({ product: p.product, quantity: p.quantity })) },
      req
    });

    order = await order.populate([
      { path: 'customer', select: 'name email phone avatarUrl address status createdAt' },
      { path: 'supplier', select: 'name email phone' }
    ]);

    // Emit live WebSockets updates
    if (req.io) {
      req.io.to(`order:${order._id}`).emit('orderStatusChanged', order);
    }

    res.success(order);
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

