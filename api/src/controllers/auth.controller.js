const User = require('../models/User');
const Supplier = require('../models/Supplier');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { logAudit } = require('../utils/auditLogger');

// Helper to generate and sign JWT token
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

// @desc    Register a new user
// @route   POST /api/v1/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, phone, role, pincode, address, businessName, referredByCode } = req.body;

    // Check if user already exists
    const log = req.logger || require('../utils/logger');
    log.info({ email, role, name, phone }, '[REGISTER] Attempt received');

    const userExists = await User.findOne({ email });
    if (userExists) {
      log.warn({ email }, '[REGISTER] Failed — duplicate email');
      return res.status(400).json({
        success: false,
        error: 'A user with this email address already exists',
        timestamp: new Date().toISOString()
      });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      phone,
      role: ['customer', 'supplier'].includes(role) ? role : 'customer',
      pincode: pincode || '',
      address: address || ''
    });

    // Handle referral if referredByCode is provided
    if (referredByCode) {
      const referrer = await User.findOne({ referralCode: referredByCode.toUpperCase(), deletedAt: null });
      if (referrer) {
        const Referral = require('../models/Referral');
        await Referral.create({
          referrer: referrer._id,
          referred: user._id,
          status: 'pending',
          rewardAmount: 50 // standard reward value
        });
      }
    }

    // If role is supplier, create default supplier profile
    if (user.role === 'supplier') {
      await Supplier.create({
        user: user._id,
        businessName: businessName || `${user.name} Water Services`,
        serviceAreas: pincode ? [pincode] : []
      });
    }

    // Generate token
    const token = signToken(user._id);

    // Remove password from response payload
    const userResponse = user.toObject();
    delete userResponse.password;

    await logAudit({
      userId: user._id,
      action: 'user_registered',
      entityType: 'User',
      entityId: user._id,
      details: { role: user.role, email: user.email },
      req
    });

    log.info({ userId: user._id, email: user.email, role: user.role }, '[REGISTER] Success — new user created');

    res.success({
      token,
      user: userResponse
    }, 201);
  } catch (error) {
    const log = req.logger || require('../utils/logger');
    log.error({ err: error.message, email: req.body?.email }, '[REGISTER] Unexpected error');
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/v1/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const log = req.logger || require('../utils/logger');
    log.info({ email }, '[LOGIN] Attempt received');

    // Validate email & password inputs
    if (!email || !password) {
      log.warn({ email: email || '(empty)' }, '[LOGIN] Failed — missing email or password');
      return res.status(400).json({
        success: false,
        error: 'Please provide email and password',
        timestamp: new Date().toISOString()
      });
    }

    // Check user in database (explicitly select password)
    const user = await User.findOne({ email, deletedAt: null }).select('+password');
    if (!user) {
      log.warn({ email }, '[LOGIN] Failed — user not found in database');
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password credentials',
        timestamp: new Date().toISOString()
      });
    }

    // Verify password matches hashed one
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      log.warn({ email }, '[LOGIN] Failed — incorrect password');
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password credentials',
        timestamp: new Date().toISOString()
      });
    }

    if (user.status === 'suspended') {
      log.warn({ email, userId: user._id }, '[LOGIN] Failed — account suspended');
      return res.status(403).json({
        success: false,
        error: 'Your account is currently suspended.',
        timestamp: new Date().toISOString()
      });
    }

    // Generate token
    const token = signToken(user._id);

    const userResponse = user.toObject();
    delete userResponse.password;

    await logAudit({
      userId: user._id,
      action: 'user_logged_in',
      entityType: 'User',
      entityId: user._id,
      details: { email: user.email, role: user.role },
      req
    });

    log.info({ userId: user._id, email: user.email, role: user.role }, '[LOGIN] Success');

    res.success({
      token,
      user: userResponse
    });
  } catch (error) {
    const log = req.logger || require('../utils/logger');
    log.error({ err: error.message, email: req.body?.email }, '[LOGIN] Unexpected error');
    next(error);
  }
};

// @desc    Get currently logged in user profile details
// @route   GET /api/v1/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    let supplierProfile = null;

    if (user.role === 'supplier') {
      supplierProfile = await Supplier.findOne({ user: user._id });
    }

    res.success({
      user,
      supplierProfile
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile
// @route   PUT /api/v1/auth/profile
// @access  Private
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, phone, address, pincode, avatarUrl } = req.body;

    const fieldsToUpdate = {};
    if (name) fieldsToUpdate.name = name;
    if (phone) fieldsToUpdate.phone = phone;
    if (address) fieldsToUpdate.address = address;
    if (pincode) fieldsToUpdate.pincode = pincode;
    if (avatarUrl !== undefined) fieldsToUpdate.avatarUrl = avatarUrl;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: fieldsToUpdate },
      { new: true, runValidators: true }
    );

    await logAudit({
      userId: req.user.id,
      action: 'user_profile_updated',
      entityType: 'User',
      entityId: req.user.id,
      details: { updatedFields: Object.keys(fieldsToUpdate) },
      req
    });

    res.success({ user });
  } catch (error) {
    next(error);
  }
};

// @desc    Forgot password request
// @route   POST /api/v1/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email, deletedAt: null });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'There is no active user registered with this email address',
        timestamp: new Date().toISOString()
      });
    }

    // Get reset token
    const resetToken = user.getResetPasswordToken();

    await user.save({ validateBeforeSave: false });

    // Generate reset URL for debug / testing purposes
    const resetUrl = `${req.protocol}://${req.get('host')}/api/v1/auth/reset-password/${resetToken}`;
    const logger = req.logger || require('../utils/logger');
    logger.info(`Password reset link generated for ${email}: ${resetUrl}`);

    await logAudit({
      userId: user._id,
      action: 'password_reset_requested',
      entityType: 'User',
      entityId: user._id,
      details: { email },
      req
    });

    res.success({
      message: 'Password reset link generated successfully',
      resetToken, // Returned for testing purposes since email verification is disabled/deferred
      resetUrl
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reset password
// @route   POST /api/v1/auth/reset-password/:token
// @access  Public
exports.resetPassword = async (req, res, next) => {
  try {
    // Get hashed token
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
      deletedAt: null
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired password reset token',
        timestamp: new Date().toISOString()
      });
    }

    // Set new password
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    await logAudit({
      userId: user._id,
      action: 'password_reset_completed',
      entityType: 'User',
      entityId: user._id,
      details: { email: user.email },
      req
    });

    res.success({
      message: 'Password reset completed successfully. You can now login with your new credentials.'
    });
  } catch (error) {
    next(error);
  }
};
