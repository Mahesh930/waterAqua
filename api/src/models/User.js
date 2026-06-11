const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const UserSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Please provide an email address'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email address'
      ]
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false // Exclude from query results by default
    },
    name: {
      type: String,
      required: [true, 'Please provide a name'],
      trim: true
    },
    phone: {
      type: String,
      required: [true, 'Please provide a phone number'],
      trim: true
    },
    role: {
      type: String,
      enum: ['customer', 'supplier', 'admin'],
      default: 'customer'
    },
    avatarUrl: {
      type: String,
      default: ''
    },
    address: {
      type: String,
      trim: true,
      default: ''
    },
    pincode: {
      type: String,
      trim: true,
      default: ''
    },
    status: {
      type: String,
      enum: ['active', 'suspended'],
      default: 'active'
    },
    deletedAt: {
      type: Date,
      default: null
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    referralCode: {
      type: String,
      unique: true,
      sparse: true
    }
  },
  {
    timestamps: true
  }
);

// Encrypt password and generate referral code before saving
UserSchema.pre('save', async function (next) {
  // Generate referral code if not present
  if (!this.referralCode) {
    const namePart = (this.name || 'USER').substring(0, 4).toUpperCase().replace(/[^A-Z]/g, '');
    const randPart = Math.floor(1000 + Math.random() * 9000).toString();
    this.referralCode = `${namePart}${randPart}`;
  }

  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate and hash password token
UserSchema.methods.getResetPasswordToken = function () {
  // Generate token
  const resetToken = crypto.randomBytes(20).toString('hex');

  // Hash token and set to resetPasswordToken field
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Set expire (10 minutes)
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

module.exports = mongoose.model('User', UserSchema);
