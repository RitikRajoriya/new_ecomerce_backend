const mongoose = require('mongoose');
require('dotenv').config();

// Connect to database
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/pachmarhi')
  .then(() => console.log('MongoDB connected'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

const Order = require('./models/Order');

async function migrateOrders() {
  try {
    console.log('Starting order migration...');

    // Map old status values to new ones
    const statusMap = {
      'pending': 'Placed',
      'processing': 'Confirmed',
      'shipped': 'Shipped',
      'delivered': 'Delivered',
      'cancelled': 'Cancelled',
    };

    // Get all orders
    const orders = await Order.find({});
    console.log(`Found ${orders.length} orders to migrate`);

    let updated = 0;
    let skipped = 0;

    for (const order of orders) {
      const oldStatus = order.orderStatus;
      const newStatus = statusMap[oldStatus];

      if (!newStatus) {
        console.log(`Skipping order ${order._id} - unknown status: ${oldStatus}`);
        skipped++;
        continue;
      }

      // Update order status
      order.orderStatus = newStatus;
      
      // Add initial tracking entry if no tracking exists
      if (!order.tracking || order.tracking.length === 0) {
        order.tracking = [{
          status: newStatus,
          date: order.createdAt || new Date(),
          message: `Order ${newStatus.toLowerCase()} successfully`,
        }];
      }

      await order.save();
      updated++;
      console.log(`Updated order ${order._id}: ${oldStatus} -> ${newStatus}`);
    }

    console.log(`\n✅ Migration complete!`);
    console.log(`- Updated: ${updated} orders`);
    console.log(`- Skipped: ${skipped} orders`);

    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrateOrders();
