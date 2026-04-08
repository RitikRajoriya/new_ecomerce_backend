const mongoose = require('mongoose');
require('dotenv').config();
const path = require('path');

// Connect to database
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/pachmarhi')
  .then(() => console.log('MongoDB connected'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

const Order = require('./models/Order');

async function migrateInvoiceFiles() {
  try {
    console.log('=== Starting Invoice File Path Migration ===\n');

    // Find all orders that have invoiceFile with path (contains '/')
    const ordersWithPaths = await Order.find({
      invoiceFile: { $regex: '/', $ne: null }
    });

    console.log(`Found ${ordersWithPaths.length} orders with full path in invoiceFile\n`);

    let updated = 0;
    let skipped = 0;
    let errors = 0;

    for (const order of ordersWithPaths) {
      const oldPath = order.invoiceFile;
      
      try {
        // Extract just the filename using path.basename
        const filename = path.basename(oldPath);
        
        // Update the order with just the filename
        order.invoiceFile = filename;
        await order.save();
        
        updated++;
        console.log(`✅ Order ${order._id.toString().slice(-8)}`);
        console.log(`   Old: ${oldPath}`);
        console.log(`   New: ${filename}\n`);
      } catch (error) {
        errors++;
        console.error(`❌ Error updating order ${order._id}:`, error.message);
      }
    }

    // Also check for any orders with 'uploads\\' (Windows path)
    const ordersWithWindowsPaths = await Order.find({
      invoiceFile: { $regex: 'uploads\\\\', $ne: null }
    });

    if (ordersWithWindowsPaths.length > 0) {
      console.log(`\nFound ${ordersWithWindowsPaths.length} additional orders with Windows paths\n`);
      
      for (const order of ordersWithWindowsPaths) {
        const oldPath = order.invoiceFile;
        
        try {
          // Extract filename (handle both / and \)
          const filename = oldPath.split(/[\\/]/).pop();
          
          order.invoiceFile = filename;
          await order.save();
          
          updated++;
          console.log(`✅ Order ${order._id.toString().slice(-8)}`);
          console.log(`   Old: ${oldPath}`);
          console.log(`   New: ${filename}\n`);
        } catch (error) {
          errors++;
          console.error(`❌ Error updating order ${order._id}:`, error.message);
        }
      }
    }

    console.log('\n=== Migration Summary ===');
    console.log(`✅ Successfully updated: ${updated} orders`);
    console.log(`⏭️  Skipped: ${skipped} orders`);
    console.log(`❌ Errors: ${errors} orders`);
    console.log('\n✅ Migration complete!');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

migrateInvoiceFiles();
