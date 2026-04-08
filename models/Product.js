const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a product name'],
      trim: true,
      maxlength: [100, 'Product name cannot be more than 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot be more than 1000 characters'],
    },
    subcategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subcategory',
      required: [true, 'Please provide a subcategory'],
    },
    productType: {
      type: String,
      enum: ['SIZE', 'UNIT', 'SINGLE'],
      default: 'SINGLE',
    },
    images: {
      type: [String],
      default: [],
      validate: {
        validator: function(v) {
          return !v || v.every(url => /^https?:\/\/.+/.test(url));
        },
        message: 'Image must be a valid URL'
      }
    },
    banner: {
      type: String,
      default: null,
    },
    variations: {
      type: [{
        size: {
          type: String,
          required: function() {
            return this.productType === 'SIZE' || this.productType === 'UNIT';
          },
        },
        unit: {
          type: String,
          required: function() {
            return this.productType === 'UNIT';
          },
        },
        value: {
          type: Number,
          required: function() {
            return this.productType === 'UNIT';
          },
        },
        price: {
          type: Number,
          required: true,
          min: [0, 'Price cannot be negative'],
        },
        stock: {
          type: Number,
          required: true,
          min: [0, 'Stock cannot be negative'],
          default: 0,
        },
      }],
      default: [],
    },
    brand: {
      type: String,
      trim: true,
      maxlength: [50, 'Brand name cannot be more than 50 characters'],
    },
    taxRate: {
      type: Number,
      enum: [0, 3, 5, 12, 18, 28],
      default: 5,
    },
    deliveryCharge: {
      type: Number,
      default: 0,
      min: [0, 'Delivery charge cannot be negative'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isSpecialDeal: {
      type: Boolean,
      default: false,
    },
    dealDiscount: {
      type: Number,
      min: [0, 'Discount cannot be negative'],
      max: [100, 'Discount cannot be more than 100%'],
      default: 0,
    },
    dealStartDate: {
      type: Date,
      default: null,
    },
    dealEndDate: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Product', productSchema);