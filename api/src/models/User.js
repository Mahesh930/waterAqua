const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

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
    }
  },
  {
    timestamps: true
  }
);

// Encrypt password before saving
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
