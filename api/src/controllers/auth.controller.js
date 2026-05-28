const User = require('../models/User');
const Supplier = require('../models/Supplier');
const jwt = require('jsonwebtoken');

// Helper to generate and sign JWT token
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'aquahome_jwt_secret_key_2026_xyz', {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

// @desc    Register a new user
// @route   POST /api/v1/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, phone, role, pincode, address, businessName } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
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
      role: role || 'customer',
      pincode: pincode || '',
      address: address || ''
    });

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

    res.success({
      token,
      user: userResponse
    }, 201);
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/v1/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate email & password inputs
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide email and password',
        timestamp: new Date().toISOString()
      });
    }

    // Check user in database (explicitly select password)
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password credentials',
        timestamp: new Date().toISOString()
      });
    }

    // Verify password matches hashed one
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password credentials',
        timestamp: new Date().toISOString()
      });
    }

    if (user.status === 'suspended') {
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

    res.success({
      token,
      user: userResponse
    });
  } catch (error) {
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

    res.success({ user });
  } catch (error) {
    next(error);
  }
};
