const Video = require('../models/Video');
const User = require('../models/User');

// Upload Video (Create new video reel)
exports.uploadVideo = async (req, res) => {
  try {
    const { title, description, tags, duration } = req.body;
    const userId = req.userId; // From auth middleware

    // Check if file exists
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a video file',
      });
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Construct video URL
    const videoUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

    // Parse tags if string
    let parsedTags = [];
    if (tags) {
      try {
        parsedTags = typeof tags === 'string' ? JSON.parse(tags) : tags;
      } catch (err) {
        parsedTags = typeof tags === 'string' ? tags.split(',') : tags;
      }
    }

    // Create video document
    const video = new Video({
      title,
      description,
      videoUrl,
      userId,
      tags: parsedTags,
      duration: duration || 0,
    });

    await video.save();

    // Populate userId to get user details
    await video.populate('userId', 'name email');

    res.status(201).json({
      success: true,
      message: 'Video uploaded successfully',
      data: video,
    });
  } catch (error) {
    console.error('Error uploading video:', error);
    
    // Handle Multer file size error specifically
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: `File size exceeds the maximum limit of 500MB. Your file is ${Math.round(error.size / (1024 * 1024))}MB`,
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error uploading video',
      error: error.message,
    });
  }
};

// Get all videos
exports.getAllVideos = async (req, res) => {
  try {
    const { page = 1, limit = 100, sortBy = '-createdAt' } = req.query; // Changed default limit to 100

    // Disable caching - always fetch fresh data
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');

    console.log('=== GET ALL VIDEOS DEBUG ===');
    console.log('Page:', page);
    console.log('Limit:', limit);
    console.log('Sort:', sortBy);

    // FIXED: Only filter by isPublished (Video model doesn't have 'visible' field)
    const videos = await Video.find({ 
      isPublished: true
    })
      .populate('userId', 'name email')
      .populate('likedBy', 'name')
      .sort(sortBy)
      .limit(parseInt(limit)) // Make sure limit is integer
      .skip((page - 1) * limit)
      .exec();

    console.log('Videos found:', videos.length);
    console.log('Video IDs:', videos.map(v => v._id));

    const count = await Video.countDocuments({ 
      isPublished: true
    });

    console.log('Total count:', count);

    res.status(200).json({
      success: true,
      data: videos,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      totalVideos: count,
    });
  } catch (error) {
    console.error('Error fetching videos:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching videos',
      error: error.message,
    });
  }
};

// Get video by ID
exports.getVideoById = async (req, res) => {
  try {
    const { id } = req.params;

    const video = await Video.findById(id)
      .populate('userId', 'name email')
      .populate('likedBy', 'name');

    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found',
      });
    }

    // Increment views
    video.views += 1;
    await video.save();

    res.status(200).json({
      success: true,
      data: video,
    });
  } catch (error) {
    console.error('Error fetching video:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching video',
      error: error.message,
    });
  }
};

// Get videos by user
exports.getVideosByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const videos = await Video.find({ userId, isPublished: true })
      .populate('userId', 'name email')
      .populate('likedBy', 'name')
      .sort('-createdAt')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await Video.countDocuments({ userId, isPublished: true });

    res.status(200).json({
      success: true,
      data: videos,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      totalVideos: count,
    });
  } catch (error) {
    console.error('Error fetching user videos:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user videos',
      error: error.message,
    });
  }
};

// Update video (title, description)
exports.updateVideo = async (req, res) => {
  try {
    console.log('=== UPDATE VIDEO DEBUG ===');
    console.log('Request body:', req.body);
    console.log('Request files:', req.file);
    console.log('Video ID:', req.params.id);
    
    const { id } = req.params;
    const userId = req.userId;

    // Get fields from FormData (parsed by Multer into req.body)
    const title = req.body.title;
    const description = req.body.description;
    const tags = req.body.tags;

    console.log('Title:', title);
    console.log('Description:', description);
    console.log('Tags:', tags);

    const video = await Video.findById(id);

    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found',
      });
    }

    // Check if user owns the video
    if (video.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update this video',
      });
    }

    // Build update object with only provided fields
    const updateData = {};
    
    if (title !== undefined && title !== null && title !== '') {
      updateData.title = title;
    }
    
    if (description !== undefined && description !== null && description !== '') {
      updateData.description = description;
    }
    
    if (tags !== undefined && tags !== null && tags !== '') {
      try {
        updateData.tags = typeof tags === 'string' ? JSON.parse(tags) : tags.split(',').filter(t => t.trim());
      } catch (err) {
        updateData.tags = typeof tags === 'string' ? tags.split(',') : [];
      }
    }

    console.log('Update data:', updateData);

    // Update using findByIdAndUpdate
    const updatedVideo = await Video.findByIdAndUpdate(
      id,
      updateData,
      { 
        new: true,           // Return updated document
        runValidators: true  // Run schema validators
      }
    );

    console.log('Updated video:', updatedVideo._id);
    console.log('Updated at:', updatedVideo.updatedAt);

    res.status(200).json({
      success: true,
      message: 'Video updated successfully',
      data: updatedVideo,
    });
  } catch (error) {
    console.error('Error updating video:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating video',
      error: error.message,
    });
  }
};

// Update video visibility (toggle isPublished)
exports.updateVideoVisibility = async (req, res) => {
  try {
    const { id } = req.params;
    const { isVisible, visible, isPublished } = req.body;

    // Accept both 'isVisible', 'visible', or 'isPublished' field names
    const newVisibility = isVisible !== undefined ? isVisible : (visible !== undefined ? visible : isPublished);

    if (newVisibility === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Visibility status required',
      });
    }

    const video = await Video.findByIdAndUpdate(
      id,
      { isPublished: newVisibility },
      { new: true }
    );

    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Video visibility updated',
      data: video,
    });
  } catch (error) {
    console.error('Error updating video visibility:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating video visibility',
      error: error.message,
    });
  }
};

// Delete video
exports.deleteVideo = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const video = await Video.findById(id);

    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found',
      });
    }

    // Check if user owns the video
    if (video.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this video',
      });
    }

    await Video.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Video deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting video:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting video',
      error: error.message,
    });
  }
};

// Like/Unlike video
exports.toggleVideoLike = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const video = await Video.findById(id);

    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found',
      });
    }

    const likeIndex = video.likedBy.indexOf(userId);

    if (likeIndex > -1) {
      // Unlike
      video.likedBy.splice(likeIndex, 1);
      video.likes -= 1;
    } else {
      // Like
      video.likedBy.push(userId);
      video.likes += 1;
    }

    await video.save();

    res.status(200).json({
      success: true,
      message: likeIndex > -1 ? 'Video unliked' : 'Video liked',
      data: video,
    });
  } catch (error) {
    console.error('Error liking video:', error);
    res.status(500).json({
      success: false,
      message: 'Error liking video',
      error: error.message,
    });
  }
};

// Search videos by title or tags
exports.searchVideos = async (req, res) => {
  try {
    const { query, page = 1, limit = 10 } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a search query',
      });
    }

    const videos = await Video.find({
      isPublished: true,
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { tags: { $regex: query, $options: 'i' } },
      ],
    })
      .populate('userId', 'name email')
      .populate('likedBy', 'name')
      .sort('-createdAt')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await Video.countDocuments({
      isPublished: true,
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { tags: { $regex: query, $options: 'i' } },
      ],
    });

    res.status(200).json({
      success: true,
      data: videos,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      totalVideos: count,
    });
  } catch (error) {
    console.error('Error searching videos:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching videos',
      error: error.message,
    });
  }
};
