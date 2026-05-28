const Order = require('../models/Order');
const CartItem = require('../models/CartItem');
const Product = require('../models/Product');
const AdminCommission = require('../models/AdminCommission');
const Notification = require('../models/Notification');
const Razorpay = require('razorpay');
const crypto = require('crypto');

// @desc    Place a new order
// @route   POST /api/v1/orders
// @access  Private (Customer Only)
exports.createOrder = async (req, res, next) => {
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
    const cartItems = await CartItem.find({ user: req.user.id }).populate('product');

    if (!cartItems || cartItems.length === 0) {
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
        return res.status(400).json({
          success: false,
          error: `Product ${item.product ? item.product.name : 'Unknown'} is no longer available`,
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

      // Decrement catalog stock
      item.product.stock = Math.max(0, item.product.stock - item.quantity);
      await item.product.save();
    }

    // Generate secure 4-digit OTP for delivery verification
    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    // Generate unique Razorpay Order ID for online payments
    let razorpayOrderId = '';
    if (paymentMethod === 'online') {
      try {
        const razorpayInstance = new Razorpay({
          key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_MaheshAquahome2026',
          key_secret: process.env.RAZORPAY_KEY_SECRET || 'aquahomesecret1234567890'
        });
        const rpOrder = await razorpayInstance.orders.create({
          amount: Math.round(totalAmount * 100), // lowest unit (paise)
          currency: 'INR',
          receipt: `receipt_order_${Date.now()}`
        });
        razorpayOrderId = rpOrder.id;
      } catch (err) {
        console.error('Razorpay Order Creation Error:', err);
        return res.status(500).json({
          success: false,
          error: 'Failed to initialize online payment session with Razorpay',
          timestamp: new Date().toISOString()
        });
      }
    }

    // Create the order
    const order = await Order.create({
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
      paymentMethod: paymentMethod || 'cod',
      razorpayOrderId,
      notes: notes || ''
    });

    // Clear user's cart
    await CartItem.deleteMany({ user: req.user.id });

    // Calculate admin commission
    const orderHour = new Date().getHours();
    const isPeakHour = orderHour >= 18 && orderHour <= 21; // 6 PM to 9 PM is peak hour
    const commissionRate = isPeakHour ? 0.08 : 0.05; // 8% during peak hours, otherwise 5%
    const commissionAmount = totalAmount * commissionRate;

    await AdminCommission.create({
      order: order._id,
      customer: req.user.id,
      supplier: supplierId,
      orderAmount: totalAmount,
      commissionRate,
      commissionAmount,
      isPeakHour,
      orderHour,
      pincode: deliveryPincode,
      formulaBreakdown: `${totalAmount} * ${commissionRate * 100}% = ${commissionAmount} (Peak Hour: ${isPeakHour ? 'Yes' : 'No'})`
    });

    // Create delivery/placed notifications
    await Notification.create({
      user: supplierId,
      title: 'New Order Received',
      message: `You have received a new order for ${totalAmount} Rs. OTP generated is sent to customer.`,
      type: 'order'
    });

    await Notification.create({
      user: req.user.id,
      title: 'Order Placed Successfully',
      message: `Your water order has been placed. Share OTP ${otp} with supplier only upon delivery.`,
      type: 'order'
    });

    // Emit live event to supplier
    if (req.io) {
      req.io.emit('newOrder', { supplierId, orderId: order._id });
    }

    res.success(order, 201);
  } catch (error) {
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

    const orders = await Order.find(filter)
      .populate({ path: 'customer', select: 'name email phone avatarUrl address' })
      .populate({ path: 'supplier', select: 'name email phone' })
      .sort({ createdAt: -1 });

    res.success(orders);
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
      .populate({ path: 'customer', select: 'name email phone avatarUrl address' })
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

    res.success(order);
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

    // Notify customer about status change
    await Notification.create({
      user: order.customer,
      title: `Order Status Update`,
      message: `Your water delivery order is now ${status.replace(/_/g, ' ')}.`,
      type: 'order'
    });

    // Populate user references for WebSocket payload
    order = await order.populate([
      { path: 'customer', select: 'name email phone avatarUrl address' },
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

    // Check if OTP matches
    if (order.otp !== otp) {
      return res.status(400).json({
        success: false,
        error: 'Invalid 4-digit OTP code. Delivery verification failed.',
        timestamp: new Date().toISOString()
      });
    }

    order.status = 'delivered';
    order.otpVerified = true;
    if (order.paymentMethod === 'cod') {
      order.paymentStatus = 'paid';
    }
    await order.save();

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
      { path: 'customer', select: 'name email phone avatarUrl address' },
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
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'aquahomesecret1234567890')
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

