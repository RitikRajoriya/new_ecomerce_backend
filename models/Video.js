const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide a video title'],
      trim: true,
      maxlength: [100, 'Title cannot be more than 100 characters'],
    },
    description: {
      type: String,
      required: [true, 'Please provide a video description'],
      trim: true,
      maxlength: [500, 'Description cannot be more than 500 characters'],
    },
    videoUrl: {
      type: String,
      required: [true, 'Please upload a video file'],
    },
    thumbnail: {
      type: String,
      default: null,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    views: {
      type: Number,
      default: 0,
    },
    likes: {
      type: Number,
      default: 0,
    },
    comments: {
      type: Number,
      default: 0,
    },
    shares: {
      type: Number,
      default: 0,
    },
    duration: {
      type: Number,
      default: 0, // in seconds
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
    tags: [{
      type: String,
      trim: true,
    }],
    likedBy: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Video', videoSchema);
