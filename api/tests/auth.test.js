process.env.JWT_SECRET = 'test_jwt_secret_value_2026';
process.env.JWT_EXPIRES_IN = '7d';
process.env.RAZORPAY_KEY_ID = 'rzp_test_dummy';
process.env.RAZORPAY_KEY_SECRET = 'dummy_secret';
process.env.MONGODB_URI = 'mongodb://localhost:27017/aquahome_test';
process.env.NODE_ENV = 'test';

const request = require('supertest');
const { app } = require('../src/server');
const User = require('../src/models/User');
const Supplier = require('../src/models/Supplier');

jest.mock('../src/models/User');
jest.mock('../src/models/Supplier');
jest.mock('../src/models/Referral');
jest.mock('../src/utils/auditLogger', () => ({
  logAudit: jest.fn().mockResolvedValue(true)
}));

describe('Auth Controller Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register a new customer user successfully', async () => {
      const mockUser = {
        _id: 'user_123',
        name: 'Test Customer',
        email: 'customer@example.com',
        phone: '1234567890',
        role: 'customer',
        toObject: function() { return this; }
      };

      User.findOne.mockResolvedValue(null);
      User.create.mockResolvedValue(mockUser);

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Test Customer',
          email: 'customer@example.com',
          password: 'Password123',
          phone: '1234567890',
          role: 'customer'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.email).toBe('customer@example.com');
      expect(User.findOne).toHaveBeenCalledWith({ email: 'customer@example.com' });
      expect(User.create).toHaveBeenCalled();
    });

    it('should not register if email already exists', async () => {
      User.findOne.mockResolvedValue({ _id: 'existing_user_id' });

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Test Customer',
          email: 'customer@example.com',
          password: 'Password123',
          phone: '1234567890',
          role: 'customer'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('already exists');
    });

    it('should reject registration if admin role is requested', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Malicious Admin',
          email: 'admin_attempt@example.com',
          password: 'Password123',
          phone: '1234567890',
          role: 'admin'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('role');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should log in a user with correct credentials', async () => {
      const mockUser = {
        _id: 'user_123',
        name: 'Test Customer',
        email: 'customer@example.com',
        role: 'customer',
        status: 'active',
        matchPassword: jest.fn().mockResolvedValue(true),
        toObject: function() { return this; }
      };

      // Mock chainable query select('+password')
      User.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser)
      });

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'customer@example.com',
          password: 'Password123'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(mockUser.matchPassword).toHaveBeenCalledWith('Password123');
    });

    it('should reject invalid credentials', async () => {
      User.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(null)
      });

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'customer@example.com',
          password: 'wrongpassword'
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Invalid email or password');
    });
  });

  describe('POST /api/v1/auth/forgot-password', () => {
    it('should generate reset token if user exists', async () => {
      const mockGetResetToken = jest.fn().mockReturnValue('dummy_reset_token');
      const mockSave = jest.fn().mockResolvedValue(true);
      const mockUser = {
        _id: 'user_123',
        email: 'customer@example.com',
        getResetPasswordToken: mockGetResetToken,
        save: mockSave
      };

      User.findOne.mockResolvedValue(mockUser);

      const res = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'customer@example.com' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(mockGetResetToken).toHaveBeenCalled();
      expect(mockSave).toHaveBeenCalled();
    });

    it('should return 404 if user not found for password reset', async () => {
      User.findOne.mockResolvedValue(null);

      const res = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'nonexistent@example.com' });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });
});
