const mongoose = require('mongoose');

const FeedbackSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      unique: true // Unique feedback per order
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
    rating: {
      type: Number,
      required: [true, 'Please provide a rating (1 to 5)'],
      min: 1,
      max: 5
    },
    comment: {
      type: String,
      trim: true,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

FeedbackSchema.index({ supplier: 1, rating: -1 });

module.exports = mongoose.model('Feedback', FeedbackSchema);
