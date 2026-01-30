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
    images: [{
      type: String,
      validate: {
        validator: function(v) {
          return /^https?:\/\/.+/.test(v);
        },
        message: 'Image must be a valid URL'
      }
    }],
    variations: [{
      size: {
        type: String,
        required: true,
        enum: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'],
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
    brand: {
      type: String,
      trim: true,
      maxlength: [50, 'Brand name cannot be more than 50 characters'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Product', productSchema);