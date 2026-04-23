require('dotenv').config();
const mongoose = require('mongoose');
const Cart = require('./models/Cart');
const Order = require('./models/Order');

const userId = '69ddcafb6897d846941c8cf3';
const cashfreeOrderId = 'ORD_1776933723549_69ddcafb6897d846941c8cf3';
const paymentId = '5423187106';

mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ecommerce')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // Get user's cart
    const cart = await Cart.findOne({ user: userId }).populate('items.product');
    
    if (!cart || cart.items.length === 0) {
      console.log('Cart is empty - checking for recent orders...');
      const recentOrder = await Order.findOne({ cashfreeOrderId });
      if (recentOrder) {
        console.log('Order already exists:', recentOrder._id);
        console.log('Order ID:', recentOrder._id);
        console.log('Total Amount:', recentOrder.totalAmount);
        console.log('Payment Status:', recentOrder.paymentStatus);
      } else {
        console.log('No order found. Creating order with test data...');
        
        // Create a simple order since cart is empty
        const order = new Order({
          user: userId,
          items: [{
            name: 'Test Product',
            price: 1,
            quantity: 1,
            total: 1
          }],
          shippingAddress: {
            street: '93/652, Gandhi Chowk , Pachmarhi (461881)',
            city: 'Pachmarhi',
            state: 'Madhya Pradesh',
            zipCode: '461881',
            country: 'India'
          },
          paymentMethod: 'online',
          paymentStatus: 'paid',
          paymentId: paymentId,
          cashfreeOrderId: cashfreeOrderId,
          itemsPrice: 1,
          taxAmount: 0,
          shippingCost: 0,
          totalAmount: 1,
          orderStatus: 'confirmed',
          tracking: [{
            status: 'Placed',
            date: new Date(),
            message: 'Your order has been placed successfully via Cashfree payment'
          }]
        });
        
        await order.save();
        console.log('✅ Order created successfully!');
        console.log('Order ID:', order._id);
        console.log('You can view it at: https://indianhandicraftshop.com/orders');
      }
    } else {
      console.log('Cart has', cart.items.length, 'items');
      console.log('Cart ID:', cart._id);
    }
    
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
  });
