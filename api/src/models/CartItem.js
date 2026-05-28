const mongoose = require('mongoose');

const CartItemSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      default: 1,
      min: [1, 'Quantity must be at least 1']
    }
  },
  {
    timestamps: true
  }
);

// Unique cart item per user and product
CartItemSchema.index({ user: 1, product: 1 }, { unique: true });

module.exports = mongoose.model('CartItem', CartItemSchema);
