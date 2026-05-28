const mongoose = require('mongoose');

const AdminCommissionSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      unique: true // One commission calculation per order
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    orderAmount: {
      type: Number,
      required: true
    },
    commissionRate: {
      type: Number,
      required: true, // E.g. 0.05 for 5%
      default: 0.05
    },
    commissionAmount: {
      type: Number,
      required: true
    },
    isPeakHour: {
      type: Boolean,
      default: false
    },
    orderHour: {
      type: Number,
      required: true
    },
    area: {
      type: String,
      default: ''
    },
    pincode: {
      type: String,
      default: ''
    },
    formulaBreakdown: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

AdminCommissionSchema.index({ supplier: 1, createdAt: -1 });

module.exports = mongoose.model('AdminCommission', AdminCommissionSchema);
