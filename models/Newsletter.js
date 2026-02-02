const mongoose = require('mongoose');

const newsletterSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide a newsletter title'],
      trim: true,
      maxlength: [200, 'Title cannot be more than 200 characters'],
    },
    content: {
      type: String,
      trim: true,
      maxlength: [5000, 'Content cannot be more than 5000 characters'],
    },
    media: [{
      type: String,
      validate: {
        validator: function(v) {
          return /^https?:\/\/.+/.test(v) || /^\/uploads\/.+/.test(v);
        },
        message: 'Media must be a valid URL or local path'
      }
    }],
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Newsletter', newsletterSchema);