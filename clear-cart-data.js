// Utility to clear old cart data and fix incorrect totals
// Run this ONCE if you're experiencing wrong order totals

const mongoose = require('mongoose');
require('dotenv').config();

// Connect to database
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/your_database')
  .then(() => console.log('✅ Connected to database'))
  .catch(err => {
    console.error('❌ Database connection error:', err);
    process.exit(1);
  });

const Cart = require('./models/Cart');

async function clearOldCartData() {
  try {
    console.log('\n🔍 Checking for carts with incorrect data...\n');

    // Get all carts
    const carts = await Cart.find({}).populate('items.product');
    
    console.log(`Found ${carts.length} cart(s)\n`);

    let clearedCount = 0;

    for (const cart of carts) {
      console.log(`Cart ID: ${cart._id}`);
      console.log(`User: ${cart.user}`);
      console.log(`Items: ${cart.items.length}`);
      
      if (cart.items.length > 0) {
        console.log('Items in cart:');
        cart.items.forEach((item, index) => {
          console.log(`  ${index + 1}. Product: ${item.product?.name || 'Unknown'}`);
          console.log(`     Price: ₹${item.price}`);
          console.log(`     Quantity: ${item.quantity}`);
          console.log(`     Total: ₹${item.price * item.quantity}`);
        });
      }
      
      console.log('');
    }

    // Ask for confirmation
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    rl.question('⚠️  Do you want to clear ALL carts? (yes/no): ', async (answer) => {
      if (answer.toLowerCase() === 'yes') {
        // Clear all carts
        const result = await Cart.deleteMany({});
        console.log(`\n✅ Cleared ${result.deletedCount} cart(s)`);
        console.log('✅ Users will need to re-add items to cart\n');
      } else {
        console.log('\n❌ Operation cancelled. No carts were cleared.\n');
      }
      
      rl.close();
      mongoose.connection.close();
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    mongoose.connection.close();
    process.exit(1);
  }
}

clearOldCartData();
