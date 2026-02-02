const Newsletter = require('../models/Newsletter');

// Create Newsletter (Admin only)
exports.createNewsletter = async (req, res) => {
  try {
    const { title, content } = req.body;

    // Build media URLs
    const media = req.files ? req.files.map(file => `${req.protocol}://${req.get('host')}/uploads/${file.filename}`) : [];

    // Create new newsletter
    const newsletter = new Newsletter({
      title,
      content,
      media,
      createdBy: req.userId, // Assuming req.userId is set by auth middleware
    });

    await newsletter.save();

    res.status(201).json({
      success: true,
      message: 'Newsletter created successfully',
      data: newsletter,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// Get all newsletters
exports.getNewsletters = async (req, res) => {
  try {
    const newsletters = await Newsletter.find({ isActive: true }).populate('createdBy', 'name email').sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: newsletters,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// Get single newsletter
exports.getNewsletter = async (req, res) => {
  try {
    const newsletter = await Newsletter.findById(req.params.id).populate('createdBy', 'name email');

    if (!newsletter) {
      return res.status(404).json({
        success: false,
        message: 'Newsletter not found',
      });
    }

    res.status(200).json({
      success: true,
      data: newsletter,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// Update newsletter (Admin only)
exports.updateNewsletter = async (req, res) => {
  try {
    const { title, content } = req.body;

    const newsletter = await Newsletter.findById(req.params.id);

    if (!newsletter) {
      return res.status(404).json({
        success: false,
        message: 'Newsletter not found',
      });
    }

    // Build media URLs if new files uploaded
    const media = req.files ? req.files.map(file => `${req.protocol}://${req.get('host')}/uploads/${file.filename}`) : newsletter.media;

    newsletter.title = title || newsletter.title;
    newsletter.content = content || newsletter.content;
    newsletter.media = media;

    await newsletter.save();

    res.status(200).json({
      success: true,
      message: 'Newsletter updated successfully',
      data: newsletter,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// Delete newsletter (Admin only)
exports.deleteNewsletter = async (req, res) => {
  try {
    const newsletter = await Newsletter.findById(req.params.id);

    if (!newsletter) {
      return res.status(404).json({
        success: false,
        message: 'Newsletter not found',
      });
    }

    newsletter.isActive = false;
    await newsletter.save();

    res.status(200).json({
      success: true,
      message: 'Newsletter deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};