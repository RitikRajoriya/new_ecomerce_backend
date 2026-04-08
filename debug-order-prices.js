// Debug script to check cart and order prices
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
const Order = require('./models/Order');
const Product = require('./models/Product');

async function debugPrices() {
  try {
    console.log('\n🔍 DEBUGGING CART AND ORDER PRICES\n');

    // Check carts
    const carts = await Cart.find({}).populate('items.product');
    console.log(`Found ${carts.length} cart(s)\n`);

    for (const cart of carts) {
      console.log('='.repeat(60));
      console.log(`CART ID: ${cart._id}`);
      console.log(`User: ${cart.user}`);
      console.log(`Cart Total: ₹${cart.totalAmount}`);
      console.log('');

      if (cart.items.length > 0) {
        console.log('Items in cart:');
        cart.items.forEach((item, index) => {
          console.log(`\n  Item ${index + 1}:`);
          console.log(`    Product: ${item.product?.name || 'Unknown'}`);
          console.log(`    Product Base Price: ₹${item.product?.price}`);
          console.log(`    Cart Item Price: ₹${item.price}`);
          console.log(`    Quantity: ${item.quantity}`);
          console.log(`    Item Total: ₹${item.price * item.quantity}`);
          
          // Check if product has variations
          if (item.product?.variations && item.product.variations.length > 0) {
            console.log(`    Variations:`);
            item.product.variations.forEach(v => {
              console.log(`      - Size: ${v.size}, Price: ₹${v.price}`);
            });
          }
        });
      }
      console.log('');
    }

    // Check recent orders
    const orders = await Order.find({}).populate('items.product').sort({ createdAt: -1 }).limit(5);
    console.log('\n' + '='.repeat(60));
    console.log(`RECENT ORDERS (Last 5)\n`);

    for (const order of orders) {
      console.log('='.repeat(60));
      console.log(`ORDER ID: ${order._id}`);
      console.log(`User: ${order.user}`);
      console.log(`Items Price: ₹${order.itemsPrice}`);
      console.log(`Shipping: ₹${order.shippingCost}`);
      console.log(`Tax: ₹${order.taxAmount}`);
      console.log(`Total Amount: ₹${order.totalAmount}`);
      console.log('');

      if (order.items.length > 0) {
        console.log('Order Items:');
        order.items.forEach((item, index) => {
          console.log(`\n  Item ${index + 1}:`);
          console.log(`    Product: ${item.product?.name || 'Unknown'}`);
          console.log(`    Item Price: ₹${item.price}`);
          console.log(`    Quantity: ${item.quantity}`);
          console.log(`    Item Total: ₹${item.total}`);
          console.log(`    Expected Total: ₹${item.price * item.quantity}`);
        });
      }
      console.log('');
    }

    mongoose.connection.close();
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    mongoose.connection.close();
    process.exit(1);
  }
}

debugPrices();
