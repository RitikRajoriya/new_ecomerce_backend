const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    size: {
      type: String,
      required: true,
    },
    unit: {
      type: String,
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
    total: {
      type: Number,
      required: true,
      min: [0, 'Total cannot be negative'],
    },
    taxRate: {
      type: Number,
      default: 0,
    },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    items: [orderItemSchema],
    shippingAddress: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      zipCode: { type: String, required: true },
      country: { type: String, required: true },
    },
    paymentMethod: {
      type: String,
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
    },
    orderStatus: {
      type: String,
      enum: ['Placed', 'Confirmed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'],
      default: 'Placed',
    },
    itemsPrice: {
      type: Number,
      default: 0,
      min: [0, 'Items price cannot be negative'],
    },
    taxAmount: {
      type: Number,
      default: 0,
      min: [0, 'Tax amount cannot be negative'],
    },
    shippingCost: {
      type: Number,
      default: 0,
      min: [0, 'Shipping cost cannot be negative'],
    },
    totalAmount: {
      type: Number,
      required: true,
      min: [0, 'Total amount cannot be negative'],
    },
    invoiceFile: {
      type: String,
      default: null,
    },
    trackingNumber: {
      type: String,
      default: null,
    },
    estimatedDelivery: {
      type: Date,
      default: null,
    },
    tracking: [
      {
        status: {
          type: String,
          enum: ['Placed', 'Confirmed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'],
          required: true,
        },
        date: {
          type: Date,
          default: Date.now,
        },
        message: {
          type: String,
          required: true,
        },
      },
    ],
  },
  { timestamps: true }
);

// Calculate totals before saving
orderSchema.pre('save', function(next) {
  this.totalAmount = this.items.reduce((total, item) => {
    return total + item.total;
  }, 0) + this.shippingCost + this.taxAmount;
  next();
});

// Auto-add tracking entry when orderStatus changes
orderSchema.pre('save', function(next) {
  // Check if orderStatus was modified
  if (this.isModified('orderStatus')) {
    const statusMessages = {
      'Placed': 'Your order has been placed successfully',
      'Confirmed': 'Your order has been confirmed by the seller',
      'Shipped': 'Your order has been shipped and is on its way',
      'Out for Delivery': 'Your order is out for delivery',
      'Delivered': 'Your order has been delivered successfully',
      'Cancelled': 'Your order has been cancelled',
    };

    // Add new tracking entry
    this.tracking.push({
      status: this.orderStatus,
      date: new Date(),
      message: statusMessages[this.orderStatus] || 'Order status updated',
    });
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);