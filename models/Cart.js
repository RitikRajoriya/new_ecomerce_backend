const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    items: [{
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
      },
      size: {
        type: String,
        required: true,
        enum: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'],
      },
      quantity: {
        type: Number,
        required: true,
        min: [1, 'Quantity must be at least 1'],
      },
      price: {
        type: Number,
        required: true,
        min: [0, 'Price cannot be negative'],
      },
      addedAt: {
        type: Date,
        default: Date.now,
      },
    }],
    totalAmount: {
      type: Number,
      default: 0,
      min: [0, 'Total amount cannot be negative'],
    },
  },
  { timestamps: true }
);

// Ensure one cart per user
cartSchema.index({ user: 1 }, { unique: true });

// Calculate total amount before saving
cartSchema.pre('save', function(next) {
  this.totalAmount = this.items.reduce((total, item) => {
    return total + (item.price * item.quantity);
  }, 0);
  next();
});

module.exports = mongoose.model('Cart', cartSchema);