const mongoose = require('mongoose');

const ReferralSchema = new mongoose.Schema(
  {
    referrer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    referred: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true // A user can only be referred once
    },
    status: {
      type: String,
      enum: ['pending', 'completed'],
      default: 'pending'
    },
    rewardAmount: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Referral', ReferralSchema);
