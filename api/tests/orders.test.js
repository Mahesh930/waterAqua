process.env.JWT_SECRET = 'test_jwt_secret_value_2026';
process.env.JWT_EXPIRES_IN = '7d';
process.env.RAZORPAY_KEY_ID = 'rzp_test_dummy';
process.env.RAZORPAY_KEY_SECRET = 'dummy_secret';
process.env.MONGODB_URI = 'mongodb://localhost:27017/aquahome_test';
process.env.NODE_ENV = 'test';

// Mock variables must be prefixed with 'mock' (case-insensitive) to be allowed in jest.mock scope
let mockCurrentUser = {
  _id: 'customer_123',
  id: 'customer_123',
  name: 'Test Customer',
  email: 'customer@example.com',
  role: 'customer',
  status: 'active'
};

jest.mock('../src/middleware/auth.middleware', () => {
  return {
    protect: (req, res, next) => {
      req.user = mockCurrentUser;
      next();
    },
    restrictTo: (...roles) => (req, res, next) => {
      if (!mockCurrentUser || !roles.includes(mockCurrentUser.role)) {
        return res.status(403).json({
          success: false,
          error: `User role '${mockCurrentUser ? mockCurrentUser.role : 'guest'}' is not authorized`
        });
      }
      next();
    }
  };
});

const request = require('supertest');
const mongoose = require('mongoose');
const { app } = require('../src/server');
const Order = require('../src/models/Order');
const CartItem = require('../src/models/CartItem');
const Product = require('../src/models/Product');
const Notification = require('../src/models/Notification');
const Referral = require('../src/models/Referral');
const AdminCommission = require('../src/models/AdminCommission');

jest.mock('../src/models/Order');
jest.mock('../src/models/CartItem');
jest.mock('../src/models/Product');
jest.mock('../src/models/Notification');
jest.mock('../src/models/Referral');
jest.mock('../src/models/AdminCommission');
jest.mock('../src/utils/auditLogger', () => ({
  logAudit: jest.fn().mockResolvedValue(true)
}));

describe('Orders Controller Tests', () => {
  let mockSession;

  beforeEach(() => {
    jest.clearAllMocks();

    mockSession = {
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      abortTransaction: jest.fn(),
      endSession: jest.fn()
    };

    jest.spyOn(mongoose, 'startSession').mockResolvedValue(mockSession);

    // Default mock user is a customer
    mockCurrentUser = {
      _id: 'customer_123',
      id: 'customer_123',
      name: 'Test Customer',
      email: 'customer@example.com',
      role: 'customer',
      status: 'active'
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('POST /api/v1/orders - createOrder', () => {
    it('should create order and deduct stock atomically', async () => {
      const mockCartItems = [
        {
          _id: 'cart_item_1',
          user: 'customer_123',
          product: {
            _id: 'product_1',
            name: '20L Pure Water',
            price: 50,
            stock: 10,
            isActive: true
          },
          quantity: 2,
          supplier: 'supplier_123'
        }
      ];

      CartItem.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          session: jest.fn().mockResolvedValue(mockCartItems)
        })
      });

      Product.findOneAndUpdate.mockResolvedValue({
        _id: 'product_1',
        name: '20L Pure Water',
        price: 50,
        stock: 8,
        isActive: true
      });

      const mockCreatedOrder = {
        _id: 'order_123',
        customer: 'customer_123',
        supplier: 'supplier_123',
        products: [
          {
            product: 'product_1',
            name: '20L Pure Water',
            price: 50,
            quantity: 2
          }
        ],
        totalAmount: 100,
        status: 'placed',
        otp: '123456',
        toObject: function() { return this; },
        save: jest.fn().mockResolvedValue(true)
      };

      Order.create.mockImplementation((arr, opts) => {
        return Promise.resolve([mockCreatedOrder]);
      });

      CartItem.deleteMany.mockResolvedValue({ deletedCount: 1 });
      AdminCommission.create.mockResolvedValue(true);

      const res = await request(app)
        .post('/api/v1/orders')
        .send({
          deliveryAddress: '123 Test Street',
          deliveryPincode: '400001',
          phone: '1234567890',
          deliveryDate: new Date(Date.now() + 86400000).toISOString(),
          deliveryTimeSlot: '10:00 AM - 12:00 PM',
          paymentMethod: 'cod'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(mockSession.startTransaction).toHaveBeenCalled();
      expect(mockSession.commitTransaction).toHaveBeenCalled();
      expect(Product.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: 'product_1', stock: { $gte: 2 } },
        { $inc: { stock: -2 } },
        { session: mockSession, new: true }
      );
    });

    it('should fail if stock is insufficient', async () => {
      const mockCartItems = [
        {
          _id: 'cart_item_1',
          user: 'customer_123',
          product: {
            _id: 'product_1',
            name: '20L Pure Water',
            price: 50,
            stock: 1, // Available stock is 1
            isActive: true
          },
          quantity: 2, // Requesting 2
          supplier: 'supplier_123'
        }
      ];

      CartItem.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          session: jest.fn().mockResolvedValue(mockCartItems)
        })
      });

      const res = await request(app)
        .post('/api/v1/orders')
        .send({
          deliveryAddress: '123 Test Street',
          deliveryPincode: '400001',
          phone: '1234567890',
          deliveryDate: new Date(Date.now() + 86400000).toISOString(),
          deliveryTimeSlot: '10:00 AM - 12:00 PM',
          paymentMethod: 'cod'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('insufficient stock');
      expect(mockSession.abortTransaction).toHaveBeenCalled();
    });
  });

  describe('PATCH /api/v1/orders/:id/cancel - cancelOrder', () => {
    it('should cancel placing/confirmed order and restore stock', async () => {
      const mockOrder = {
        _id: 'order_123',
        customer: 'customer_123',
        supplier: 'supplier_123',
        status: 'placed',
        products: [
          {
            product: 'product_1',
            quantity: 3
          }
        ],
        totalAmount: 150,
        toObject: function() { return this; },
        save: jest.fn().mockResolvedValue(true),
        populate: jest.fn().mockResolvedValue({
          _id: 'order_123',
          status: 'cancelled',
          customer: { name: 'Test Customer' },
          supplier: { name: 'Supplier' }
        })
      };

      Order.findById.mockReturnValue({
        session: jest.fn().mockResolvedValue(mockOrder)
      });

      Product.findByIdAndUpdate.mockResolvedValue(true);
      Notification.create.mockResolvedValue(true);

      const res = await request(app)
        .patch('/api/v1/orders/order_123/cancel')
        .send();

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(mockOrder.status).toBe('cancelled');
      expect(Product.findByIdAndUpdate).toHaveBeenCalledWith(
        'product_1',
        { $inc: { stock: 3 } },
        { session: mockSession }
      );
      expect(mockSession.commitTransaction).toHaveBeenCalled();
    });

    it('should not allow cancelling completed/delivered order', async () => {
      const mockOrder = {
        _id: 'order_123',
        customer: 'customer_123',
        status: 'delivered',
        products: []
      };

      Order.findById.mockReturnValue({
        session: jest.fn().mockResolvedValue(mockOrder)
      });

      const res = await request(app)
        .patch('/api/v1/orders/order_123/cancel')
        .send();

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Cannot cancel order');
      expect(mockSession.abortTransaction).toHaveBeenCalled();
    });
  });

  describe('POST /api/v1/orders/:id/verify-otp - verifyOtp', () => {
    beforeEach(() => {
      // Simulate supplier role for this route group
      mockCurrentUser = {
        _id: 'supplier_123',
        id: 'supplier_123',
        role: 'supplier'
      };
    });

    it('should verify OTP and deliver order successfully', async () => {
      const mockOrder = {
        _id: 'order_123',
        customer: 'customer_123',
        supplier: 'supplier_123',
        status: 'confirmed',
        otp: '123456',
        otpAttempts: 0,
        otpExpiresAt: new Date(Date.now() + 600000), // active
        paymentMethod: 'cod',
        toObject: function() { return this; },
        save: jest.fn().mockResolvedValue(true),
        populate: jest.fn().mockResolvedValue({
          _id: 'order_123',
          status: 'delivered',
          customer: { name: 'Test' },
          supplier: { name: 'Supplier' }
        })
      };

      Order.findById.mockResolvedValue(mockOrder);
      Order.countDocuments.mockResolvedValue(1); // Customer's 1st order
      Referral.findOne.mockResolvedValue(null);

      const res = await request(app)
        .post('/api/v1/orders/order_123/verify-otp')
        .send({ otp: '123456' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(mockOrder.status).toBe('delivered');
      expect(mockOrder.otpVerified).toBe(true);
      expect(mockOrder.paymentStatus).toBe('paid');
    });

    it('should block if max attempts exceeded', async () => {
      const mockOrder = {
        _id: 'order_123',
        supplier: 'supplier_123',
        otpAttempts: 5
      };

      Order.findById.mockResolvedValue(mockOrder);

      const res = await request(app)
        .post('/api/v1/orders/order_123/verify-otp')
        .send({ otp: '123456' });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('attempts exceeded');
    });

    it('should block if OTP is expired', async () => {
      const mockOrder = {
        _id: 'order_123',
        supplier: 'supplier_123',
        otpAttempts: 2,
        otpExpiresAt: new Date(Date.now() - 10000) // expired
      };

      Order.findById.mockResolvedValue(mockOrder);

      const res = await request(app)
        .post('/api/v1/orders/order_123/verify-otp')
        .send({ otp: '123456' });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('OTP has expired');
    });

    it('should increment attempts and fail on invalid OTP', async () => {
      const mockOrder = {
        _id: 'order_123',
        supplier: 'supplier_123',
        otp: '123456',
        otpAttempts: 1,
        otpExpiresAt: new Date(Date.now() + 600000),
        save: jest.fn().mockResolvedValue(true)
      };

      Order.findById.mockResolvedValue(mockOrder);

      const res = await request(app)
        .post('/api/v1/orders/order_123/verify-otp')
        .send({ otp: '999999' }); // incorrect

      expect(res.status).toBe(400);
      expect(mockOrder.otpAttempts).toBe(2);
      expect(mockOrder.save).toHaveBeenCalled();
    });
  });
});
