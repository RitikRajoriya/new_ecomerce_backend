const mongoose = require('mongoose');

const subcategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a subcategory name'],
      trim: true,
      maxlength: [50, 'Subcategory name cannot be more than 50 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot be more than 500 characters'],
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Please provide a category'],
    },
    image: {
      type: String,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Subcategory', subcategorySchema);