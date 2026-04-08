const Settings = require('../models/Settings');

// Get settings
exports.getSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne();
    
    // If no settings exist, create default ones
    if (!settings) {
      settings = await Settings.create({
        siteTitle: 'Pachmarhi Admin',
        siteDescription: '',
        contactEmail: '',
        contactPhone: '',
        address: '',
        socialMedia: {
          facebook: '',
          instagram: '',
          twitter: '',
          youtube: ''
        },
        logo: '',
        favicon: '',
        enableListings: false,
        defaultListingDurationDays: 30
      });
    }
    
    res.status(200).json({
      success: true,
      settings
    });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch settings',
      error: error.message
    });
  }
};

// Update settings
exports.updateSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne();
    
    if (!settings) {
      settings = await Settings.create(req.body);
    } else {
      settings = await Settings.findByIdAndUpdate(
        settings._id,
        req.body,
        { new: true, runValidators: true }
      );
    }
    
    res.status(200).json({
      success: true,
      settings
    });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update settings',
      error: error.message
    });
  }
};
