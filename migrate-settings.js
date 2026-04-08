const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Settings = require('./models/Settings');

// Load environment variables
dotenv.config();

// Connect to database
const connectDB = require('./config/database');

const initializeSettings = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    
    // Check if settings already exist
    const existingSettings = await Settings.findOne();
    
    if (existingSettings) {
      console.log('✅ Settings already exist in database');
      console.log('Current site title:', existingSettings.siteTitle);
      process.exit(0);
    }
    
    // Create default settings
    const settings = await Settings.create({
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
    
    console.log('✅ Settings initialized successfully!');
    console.log('Site Title:', settings.siteTitle);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error initializing settings:', error.message);
    process.exit(1);
  }
};

initializeSettings();
