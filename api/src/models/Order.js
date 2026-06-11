const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema(
  {
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
    products: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
          required: true
        },
        name: {
          type: String,
          required: true
        },
        price: {
          type: Number,
          required: true
        },
        quantity: {
          type: Number,
          required: true
        }
      }
    ],
    totalAmount: {
      type: Number,
      required: true
    },
    status: {
      type: String,
      enum: ['placed', 'confirmed', 'out_for_delivery', 'delivered', 'cancelled'],
      default: 'placed'
    },
    deliveryAddress: {
      type: String,
      required: [true, 'Delivery address is required']
    },
    deliveryPincode: {
      type: String,
      required: [true, 'Delivery pincode is required']
    },
    phone: {
      type: String,
      required: [true, 'Contact phone number is required']
    },
    deliveryDate: {
      type: Date,
      required: [true, 'Delivery date is required']
    },
    deliveryTimeSlot: {
      type: String,
      required: [true, 'Delivery time slot is required']
    },
    otp: {
      type: String,
      required: true
    },
    otpExpiresAt: {
      type: Date,
      required: true
    },
    otpAttempts: {
      type: Number,
      default: 0
    },
    otpVerified: {
      type: Boolean,
      default: false
    },
    paymentMethod: {
      type: String,
      enum: ['cod', 'online'],
      default: 'cod'
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed'],
      default: 'pending'
    },
    razorpayOrderId: {
      type: String,
      default: ''
    },
    razorpayPaymentId: {
      type: String,
      default: ''
    },
    notes: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

// Indexes for fast history and active queues lookup
OrderSchema.index({ customer: 1, createdAt: -1 });
OrderSchema.index({ supplier: 1, status: 1, createdAt: -1 });
OrderSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Order', OrderSchema);
