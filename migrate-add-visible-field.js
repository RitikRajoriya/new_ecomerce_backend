const mongoose = require('mongoose');
require('dotenv').config();

// Import Newsletter model
const Newsletter = require('./models/Newsletter');

async function addVisibleField() {
  try {
    // Connect to MongoDB
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce';
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✓ Connected to MongoDB');

    // Update all newsletters to have visible field set to true
    const result = await Newsletter.updateMany(
      { visible: { $exists: false } },
      { $set: { visible: true } }
    );

    console.log('\n========================================');
    console.log('✅ Migration Complete!');
    console.log('========================================');
    console.log(`Documents updated: ${result.nModified}`);
    console.log(`Total documents: ${result.n}`);
    console.log('========================================\n');

    // Verify by fetching one document
    const sample = await Newsletter.findOne();
    if (sample) {
      console.log('Sample newsletter:', {
        _id: sample._id,
        title: sample.title,
        visible: sample.visible,
        mediaCount: sample.media.length
      });
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error during migration:', error);
    process.exit(1);
  }
}

addVisibleField();
