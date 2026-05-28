const mongoose = require('mongoose');

const SupplierSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    businessName: {
      type: String,
      required: [true, 'Please provide a business name'],
      trim: true
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    reviewCount: {
      type: Number,
      default: 0
    },
    isActive: {
      type: Boolean,
      default: true
    },
    deliveryCharge: {
      type: Number,
      default: 0,
      min: 0
    },
    minOrder: {
      type: Number,
      default: 0,
      min: 0
    },
    businessHours: {
      open: { type: String, default: '08:00 AM' },
      close: { type: String, default: '08:00 PM' }
    },
    serviceAreas: {
      type: [String],
      default: []
    },
    pricePerCan: {
      type: Number,
      default: 40
    },
    pricePerTanker: {
      type: Number,
      default: 500
    },
    waterType: {
      type: String,
      default: 'RO Purified'
    },
    stock: {
      type: Number,
      default: 100
    },
    deliveryTime: {
      type: String,
      default: '30-45 min'
    },
    tankerCapacity: {
      type: Number,
      default: 5000
    },
    driverPhone: {
      type: String,
      default: ''
    },
    vehicleNumber: {
      type: String,
      default: ''
    },
    pincode: {
      type: String,
      default: ''
    },
    area: {
      type: String,
      default: ''
    },
    address: {
      type: String,
      default: ''
    },
    latitude: {
      type: Number,
      default: null
    },
    longitude: {
      type: Number,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Create compound index for geo/area searches by serviceAreas
SupplierSchema.index({ serviceAreas: 1 });

module.exports = mongoose.model('Supplier', SupplierSchema);
