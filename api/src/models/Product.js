const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema(
  {
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    name: {
      type: String,
      required: [true, 'Please provide a product name'],
      trim: true
    },
    category: {
      type: String,
      required: [true, 'Please provide a category'],
      enum: ['Water Can', 'Water Bottle', 'Dispenser', 'Other'],
      default: 'Water Can'
    },
    price: {
      type: Number,
      required: [true, 'Please provide a product price'],
      min: [0, 'Price cannot be negative']
    },
    capacityLiters: {
      type: Number,
      required: [true, 'Please provide product capacity in liters'],
      min: [0, 'Capacity cannot be negative']
    },
    imageUrl: {
      type: String,
      default: ''
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    isActive: {
      type: Boolean,
      default: true
    },
    stock: {
      type: Number,
      default: 999,
      min: [0, 'Stock cannot be negative']
    }
  },
  {
    timestamps: true
  }
);

// Create compound index for listing products by supplier
ProductSchema.index({ supplier: 1, category: 1 });

module.exports = mongoose.model('Product', ProductSchema);
