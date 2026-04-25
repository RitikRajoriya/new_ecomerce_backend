const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { createNotification } = require('./notificationController');

// Create order from cart (checkout)
exports.createOrder = async (req, res) => {
  try {
    const { shippingAddress, paymentMethod } = req.body;

    // Get user's cart
    const cart = await Cart.findOne({ user: req.userId }).populate('items.product');

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cart is empty',
      });
    }

    // Validate stock and prepare order items
    const orderItems = [];
    let itemsPrice = 0;
    // NO tax calculation - taxAmount remains 0
    let taxAmount = 0;

    for (const item of cart.items) {
      const product = item.product;
      
      if (!product) {
        return res.status(400).json({
          success: false,
          message: 'Invalid cart item: product not found',
        });
      }
      
      // Validate price exists
      if (!item.price && item.price !== 0) {
        return res.status(400).json({
          success: false,
          message: `Price not set for ${product.name}`,
        });
      }
      
      // Validate quantity exists
      if (!item.quantity || item.quantity < 1) {
        return res.status(400).json({
          success: false,
          message: `Invalid quantity for ${product.name}`,
        });
      }
      
      // Determine price - use cart's stored price (what user saw and paid for)
      // This ensures consistency between cart total and order total
      let price;
      
      // ALWAYS use the price stored in cart item (user's perspective)
      price = Number(item.price || 0);
      
      // Validation: ensure price is valid
      if (isNaN(price) || price < 0) {
        return res.status(400).json({
          success: false,
          message: `Invalid price for ${product.name}`,
        });
      }
      
      // Calculate item total safely with validation
      const quantity = Number(item.quantity || 1);
      const itemTotal = Number(price) * quantity;
      
      if (isNaN(itemTotal) || itemTotal < 0) {
        return res.status(400).json({
          success: false,
          message: `Calculation error for ${product.name}`,
        });
      }
      
      itemsPrice += itemTotal;
      
      // NO automatic tax calculation - tax is 0
      // Tax can be added manually if needed in future
      
      // Check stock
      let stockToCheck;
      if (product.productType === 'SINGLE' || item.size === 'single') {
        stockToCheck = product.stock || Infinity;
      } else {
        let variation;
        if (product.productType === 'UNIT') {
          variation = product.variations?.find(v => v.unit === item.unit && v.value == item.size);
        } else {
          variation = product.variations?.find(v => v.size === item.size);
        }
        stockToCheck = variation ? variation.stock : (product.stock || Infinity);
      }
      
      if (stockToCheck < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name}`,
        });
      }

      orderItems.push({
        product: product._id,
        size: item.size,
        unit: item.unit,
        quantity: item.quantity,
        price: price,
        total: itemTotal,
        taxRate: 0, // NO tax applied
      });

      // Reduce stock
      if (product.productType === 'SINGLE' || item.size === 'single') {
        if (product.stock !== undefined) {
          product.stock -= item.quantity;
        }
      } else {
        let variation;
        if (product.productType === 'UNIT') {
          variation = product.variations?.find(v => v.unit === item.unit && v.value == item.size);
        } else {
          variation = product.variations?.find(v => v.size === item.size);
        }
        
        if (variation) {
          variation.stock -= item.quantity;
        } else if (product.stock !== undefined) {
          product.stock -= item.quantity;
        }
      }
      await product.save();
    }

    // NO automatic shipping/delivery charge - set to 0
    // Shipping can be added manually if needed in future
    const shippingCost = 0;
    
    // Calculate final total with validation
    const finalItemsPrice = Number(itemsPrice || 0);
    const finalTaxAmount = Number(taxAmount || 0);
    const finalShippingCost = Number(shippingCost || 0);
    const totalAmount = finalItemsPrice + finalShippingCost + finalTaxAmount;
    
    // Ensure no NaN values
    if (isNaN(finalItemsPrice) || isNaN(finalTaxAmount) || isNaN(totalAmount)) {
      return res.status(500).json({
        success: false,
        message: 'Order calculation error. Please try again.',
      });
    }

    // Create order
    const order = new Order({
      user: req.userId,
      items: orderItems,
      shippingAddress,
      paymentMethod,
      itemsPrice: finalItemsPrice,
      taxAmount: finalTaxAmount,
      shippingCost: finalShippingCost,
      totalAmount,
      tracking: [{
        status: 'Placed',
        date: new Date(),
        message: 'Your order has been placed successfully',
      }],
    });

    await order.save();

    // Clear cart
    cart.items = [];
    await cart.save();

    // Create notification for user
    await createNotification(
      req.userId,
      'Order placed successfully',
      'Your order has been placed successfully.',
      'order',
      order._id
    );

    // Create notification for admin (get all admin users)
    const User = require('../models/User');
    const admins = await User.find({ role: 'admin' }, '_id');
    for (const admin of admins) {
      await createNotification(
        admin._id,
        'New order received',
        `New order placed by ${req.userId}`,
        'admin',
        order._id
      );
    }

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      order,
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// Get user's orders
exports.getUserOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const orders = await Order.find({ user: req.userId })
      .populate('items.product', 'name images')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Order.countDocuments({ user: req.userId });

    res.status(200).json({
      success: true,
      count: orders.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      orders,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// Get single order
exports.getOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('items.product', 'name images');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Check if user owns this order or is admin
    if (order.user.toString() !== req.userId && req.userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// Get all orders (Admin only)
exports.getAllOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, paymentStatus } = req.query;

    let query = {};

    if (status) query.orderStatus = status;
    if (paymentStatus) query.paymentStatus = paymentStatus;

    const orders = await Order.find(query)
      .populate('user', 'name email')
      .populate('items.product', 'name')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Order.countDocuments(query);

    res.status(200).json({
      success: true,
      count: orders.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      orders,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// Update order status (Admin only)
exports.updateOrderStatus = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    const newStatus = req.body.orderStatus;

    if (!newStatus) {
      return res.status(400).json({
        success: false,
        message: 'orderStatus is required',
      });
    }

    order.orderStatus = newStatus;

    // Save tracking number if status is "Out for Delivery"
    if (newStatus === 'Out for Delivery' && req.body.trackingNumber) {
      order.trackingNumber = req.body.trackingNumber;
    }

    await order.save();

    // Create notification for user based on status
    const statusMessages = {
      'Confirmed': {
        title: 'Order confirmed',
        message: 'Your order has been confirmed.',
      },
      'Shipped': {
        title: 'Order shipped',
        message: 'Your order has been shipped.',
      },
      'Out for Delivery': {
        title: 'Out for delivery',
        message: `Your order is out for delivery. Tracking number: ${order.trackingNumber || 'N/A'}. Track at: https://www.indiapost.gov.in`,
      },
      'Delivered': {
        title: 'Order delivered',
        message: 'Your order has been delivered.',
      },
      'Cancelled': {
        title: 'Order cancelled',
        message: 'Your order has been cancelled.',
      },
    };

    if (statusMessages[newStatus]) {
      await createNotification(
        order.user.toString(),
        statusMessages[newStatus].title,
        statusMessages[newStatus].message,
        'status',
        order._id
      );
    }

    // If tracking number added, create separate tracking notification
    if (newStatus === 'Out for Delivery' && req.body.trackingNumber) {
      await createNotification(
        order.user.toString(),
        'Tracking number added',
        `Your order has been shipped via India Post. Tracking number: ${req.body.trackingNumber}. Track at: https://www.indiapost.gov.in`,
        'tracking',
        order._id
      );
    }

    res.json({
      success: true,
      order,
    });
  } catch (err) {
    console.log('Update order status error:', err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// Cancel order (User only, if not shipped)
exports.cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Check if user owns this order
    if (order.user.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    // Check if order can be cancelled
    if (['Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'].includes(order.orderStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Order cannot be cancelled at this stage',
      });
    }

    // Restore stock
    for (const item of order.items) {
      const product = await Product.findById(item.product);
      
      let variation;
      // Skip variation lookup for SINGLE products or 'single' size
      if (product.productType === 'SINGLE' || item.size === 'single') {
        variation = null;
      } else if (product.productType === 'UNIT') {
        variation = product.variations?.find(v => v.unit === item.unit && v.value == item.size);
      } else {
        variation = product.variations?.find(v => v.size === item.size);
      }
      
      if (variation) {
        variation.stock += item.quantity;
        await product.save();
      } else if (product.stock !== undefined) {
        product.stock += item.quantity;
      }
    }

    order.orderStatus = 'Cancelled';
    await order.save();

    res.status(200).json({
      success: true,
      message: 'Order cancelled successfully',
      order,
    });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// Track order (User only)
exports.trackOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('items.product', 'name images price')
      .populate('user', 'name email');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Check if user owns this order or is admin
    if (order.user._id.toString() !== req.userId && req.userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    res.status(200).json({
      success: true,
      order: {
        _id: order._id,
        orderId: order._id,
        orderStatus: order.orderStatus,
        items: order.items,
        shippingAddress: order.shippingAddress,
        totalAmount: order.totalAmount,
        createdAt: order.createdAt,
        estimatedDelivery: order.estimatedDelivery,
        trackingNumber: order.trackingNumber,
        tracking: order.tracking,
      },
    });
  } catch (error) {
    console.error('Track order error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// Create Cashfree order - optimized for fast response
exports.createCashfreeOrder = async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount) {
      return res.status(400).json({
        success: false,
        message: 'Amount required',
      });
    }

    // Environment-based configuration
    const cashfreeEnv = process.env.CASHFREE_ENV || 'sandbox';
    
    let appId, secretKey, baseUrl;
    
    if (cashfreeEnv === 'production') {
      appId = process.env.CASHFREE_PROD_APP_ID || process.env.CASHFREE_APP_ID;
      secretKey = process.env.CASHFREE_PROD_SECRET_KEY || process.env.CASHFREE_SECRET_KEY;
      baseUrl = 'https://api.cashfree.com/pg';
    } else {
      appId = process.env.CASHFREE_SANDBOX_APP_ID || process.env.CASHFREE_APP_ID;
      secretKey = process.env.CASHFREE_SANDBOX_SECRET_KEY || process.env.CASHFREE_SECRET_KEY;
      baseUrl = 'https://sandbox.cashfree.com/pg';
    }

    // Validate Cashfree credentials
    if (!appId || !secretKey) {
      console.error('Cashfree credentials missing in .env file');
      return res.status(500).json({
        success: false,
        message: 'Payment gateway not configured. Please contact support.',
      });
    }

    console.log('Creating Cashfree order:', {
      env: cashfreeEnv,
      amount,
      baseUrl,
      appId: appId.substring(0, 10) + '***'
    });

    // Use Cashfree REST API directly with axios
    const axios = require('axios');

    // Create order request
    const orderData = {
      order_id: `ORD_${Date.now()}_${req.userId}`,
      order_amount: parseFloat(amount),
      order_currency: 'INR',
      customer_details: {
        customer_id: req.userId || 'guest',
        customer_phone: '9999999999', // Default phone, can be updated from user profile
      },
      order_meta: {
        return_url: `${(process.env.FRONTEND_URL || 'https://indianhandicraftshop.com').replace('http://', 'https://')}/orders?order_id={order_id}`,
      },
    };

    console.log('Cashfree order request:', orderData);

    console.log('=== Cashfree Order Creation ===');
    console.log('Cashfree ENV:', cashfreeEnv);
    console.log('Cashfree URL:', `${baseUrl}/orders`);
    console.log('App ID:', appId);
    console.log('Amount:', amount);
    console.log('Order Data:', orderData);

    // Create order with Cashfree API
    const response = await axios.post(`${baseUrl}/orders`, orderData, {
      headers: {
        'Content-Type': 'application/json',
        'x-client-id': appId,
        'x-client-secret': secretKey,
        'x-api-version': '2023-08-01',
      },
    });

    console.log('Cashfree order created successfully:', response.data.order_id);
    console.log('Payment Session ID:', response.data.payment_session_id);
    
    // Verify payment_session_id exists
    if (!response.data.payment_session_id) {
      console.error('ERROR: Cashfree did not return payment_session_id');
      console.error('Full Cashfree response:', response.data);
      return res.status(500).json({
        success: false,
        message: 'Payment gateway error. Please try again.',
      });
    }
    
    // Return necessary fields
    res.json({
      success: true,
      order_id: response.data.order_id,
      payment_session_id: response.data.payment_session_id,
      order_amount: response.data.order_amount,
      order_currency: response.data.order_currency,
    });
  } catch (err) {
    // Enhanced error logging
    console.error('=== Cashfree Order Creation Error ===');
    console.error('Cashfree ENV:', process.env.CASHFREE_ENV);
    console.error('Cashfree URL:', `${baseUrl}/orders`);
    console.error('Cashfree error status:', err.response?.status);
    console.error('Cashfree error data:', err.response?.data);
    console.error('Error message:', err.message);
    console.error('Full Error:', err);
    console.error('=====================================');
    
    // Provide user-friendly error messages
    let errorMessage = 'Failed to create payment order';
    
    if (err.response?.data?.message) {
      errorMessage = err.response.data.message;
    } else if (err.response?.status === 401) {
      errorMessage = 'Payment gateway authentication failed. Please check configuration.';
    } else if (err.message.includes('auth') || err.message.includes('invalid')) {
      errorMessage = 'Payment gateway authentication failed';
    } else if (err.message.includes('network')) {
      errorMessage = 'Network error connecting to payment gateway';
    } else if (err.message) {
      errorMessage = err.message;
    }
    
    res.status(500).json({
      success: false,
      message: errorMessage,
      details: process.env.NODE_ENV === 'development' ? err.response?.data : undefined,
    });
  }
};

// Verify Cashfree payment and create order
exports.verifyCashfreePayment = async (req, res) => {
  try {
    const { orderId, paymentSessionId } = req.body;

    if (!orderId || !paymentSessionId) {
      return res.status(400).json({
        success: false,
        message: 'Order ID and Payment Session ID required',
      });
    }

    console.log('=== Verifying Cashfree Payment ===');
    console.log('Order ID:', orderId);
    console.log('Payment Session ID:', paymentSessionId);

    // Environment-based configuration
    const cashfreeEnv = process.env.CASHFREE_ENV || 'sandbox';
    
    let appId, secretKey, baseUrl;
    
    if (cashfreeEnv === 'production') {
      appId = process.env.CASHFREE_PROD_APP_ID || process.env.CASHFREE_APP_ID;
      secretKey = process.env.CASHFREE_PROD_SECRET_KEY || process.env.CASHFREE_SECRET_KEY;
      baseUrl = 'https://api.cashfree.com/pg';
    } else {
      appId = process.env.CASHFREE_SANDBOX_APP_ID || process.env.CASHFREE_APP_ID;
      secretKey = process.env.CASHFREE_SANDBOX_SECRET_KEY || process.env.CASHFREE_SECRET_KEY;
      baseUrl = 'https://sandbox.cashfree.com/pg';
    }

    // Verify payment with Cashfree API
    const axios = require('axios');
    const response = await axios.get(`${baseUrl}/orders/${orderId}/payments`, {
      headers: {
        'Content-Type': 'application/json',
        'x-client-id': appId,
        'x-client-secret': secretKey,
        'x-api-version': '2023-08-01',
      },
    });

    console.log('Cashfree payment verification response:', response.data);

    // Check if payment was successful
    const payments = response.data;
    const successfulPayment = payments.find(
      p => p.payment_status === 'SUCCESS' && p.cf_payment_id
    );

    if (!successfulPayment) {
      return res.status(400).json({
        success: false,
        message: 'Payment not completed or failed',
      });
    }

    console.log('✅ Payment verified successfully');
    console.log('Payment ID:', successfulPayment.cf_payment_id);
    console.log('Amount:', successfulPayment.payment_amount);

    // Get user's cart
    const cart = await Cart.findOne({ user: req.userId }).populate('items.product');

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cart is empty',
      });
    }

    // Validate stock and prepare order items
    const orderItems = [];
    let itemsPrice = 0;
    let taxAmount = 0;

    for (const item of cart.items) {
      const product = item.product;
      
      if (!product) {
        return res.status(400).json({
          success: false,
          message: 'Invalid cart item: product not found',
        });
      }
      
      let price = Number(item.price || 0);
      const quantity = Number(item.quantity || 1);
      const itemTotal = Number(price) * quantity;
      
      itemsPrice += itemTotal;
      
      // Check stock
      let stockToCheck;
      if (product.productType === 'SINGLE' || item.size === 'single') {
        stockToCheck = product.stock || Infinity;
      } else {
        let variation;
        if (product.productType === 'UNIT') {
          variation = product.variations?.find(v => v.unit === item.unit && v.value == item.size);
        } else {
          variation = product.variations?.find(v => v.size === item.size);
        }
        stockToCheck = variation ? variation.stock : (product.stock || Infinity);
      }
      
      if (stockToCheck < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name}`,
        });
      }

      orderItems.push({
        product: product._id,
        name: product.name,
        price: price,
        quantity: quantity,
        size: item.size,
        unit: item.unit,
        image: product.images?.[0] || '',
      });
    }

    const shippingCost = 0; // Free shipping
    const totalAmount = itemsPrice + taxAmount + shippingCost;

    // Create order
    const order = new Order({
      user: req.userId,
      items: orderItems,
      shippingAddress: req.body.shippingAddress || {},
      paymentMethod: 'online',
      paymentStatus: 'paid',
      paymentId: successfulPayment.cf_payment_id,
      cashfreeOrderId: orderId,
      itemsPrice: itemsPrice,
      taxAmount: taxAmount,
      shippingCost: shippingCost,
      totalAmount: totalAmount,
      tracking: [{
        status: 'Placed',
        date: new Date(),
        message: 'Your order has been placed successfully',
      }],
    });

    await order.save();
    console.log('✅ Order created successfully:', order._id);

    // Clear cart
    cart.items = [];
    await cart.save();

    // Create notification for user
    await createNotification(
      req.userId,
      'Order placed successfully',
      'Your order has been placed successfully.',
      'order',
      order._id
    );

    // Create notification for admin
    const User = require('../models/User');
    const admins = await User.find({ role: 'admin' }, '_id');
    for (const admin of admins) {
      await createNotification(
        admin._id,
        'New order received',
        `New order placed by ${req.userId}`,
        'admin',
        order._id
      );
    }

    res.json({
      success: true,
      message: 'Payment verified and order created successfully',
      order: order,
    });

  } catch (error) {
    console.error('=== Payment Verification Error ===');
    console.error('Error:', error.message);
    console.error('Full Error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Payment verification failed: ' + error.message,
    });
  }
};

// Delete Order (Admin only) - Cascade delete related data
exports.deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const path = require('path');
    const fs = require('fs');
    const OrderHelp = require('../models/OrderHelp');
    const Notification = require('../models/Notification');
    
    // Find order
    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    // Delete invoice file if exists
    if (order.invoiceFile) {
      const filename = path.basename(order.invoiceFile);
      const invoicePath = path.join(__dirname, '..', 'uploads', 'invoices', filename);
      if (fs.existsSync(invoicePath)) {
        fs.unlinkSync(invoicePath);
      }
    }
    
    // Delete related help requests and notifications
    await OrderHelp.deleteMany({ order: id });
    await Notification.deleteMany({ relatedId: id });
    
    // Delete order
    await Order.findByIdAndDelete(id);
    
    res.status(200).json({
      success: true,
      message: 'Order deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @route   POST /api/orders/cashfree/webhook
 * @desc    Cashfree webhook to automatically create orders on payment success
 * @access  Public (Cashfree server calls this)
 */
exports.cashfreeWebhook = async (req, res) => {
  try {
    const { type, data } = req.body;
    
    console.log('🔔 Cashfree Webhook Received:', type, data?.order_id);

    // Only process payment success events
    if (type !== 'Payment' || data?.payment_status !== 'SUCCESS') {
      console.log('⏭️ Skipping webhook - not a successful payment');
      return res.status(200).json({ success: true, message: 'Webhook received' });
    }

    const orderId = data.order_id;
    const paymentId = data.cf_payment_id;
    const paymentAmount = data.payment_amount;

    console.log('✅ Processing successful payment:', orderId, paymentId);

    // Check if order already exists for this payment
    const Order = require('../models/Order');
    const existingOrder = await Order.findOne({ 
      $or: [
        { cashfreeOrderId: orderId },
        { paymentId: paymentId }
      ]
    });

    if (existingOrder) {
      console.log('✅ Order already exists:', existingOrder._id);
      return res.status(200).json({ 
        success: true, 
        message: 'Order already created',
        orderId: existingOrder._id 
      });
    }

    // Extract user ID from order_id (format: ORD_timestamp_userId)
    const parts = orderId.split('_');
    const userId = parts[parts.length - 1];

    if (!userId) {
      console.error('❌ Could not extract userId from orderId:', orderId);
      return res.status(400).json({ success: false, message: 'Invalid order format' });
    }

    console.log('👤 User ID:', userId);

    // Get user's cart
    const Cart = require('../models/Cart');
    const cart = await Cart.findOne({ user: userId }).populate('items.product');

    if (!cart || cart.items.length === 0) {
      console.warn('⚠️ Cart is empty for user:', userId);
      // Still create a minimal order with payment info
      const order = new Order({
        user: userId,
        items: [{
          product: new (require('mongoose').Types.ObjectId)(),
          name: 'Online Payment',
          price: paymentAmount,
          quantity: 1,
          size: 'single',
          total: paymentAmount,
        }],
        paymentMethod: 'online',
        paymentStatus: 'paid',
        paymentId: paymentId,
        cashfreeOrderId: orderId,
        itemsPrice: paymentAmount,
        taxAmount: 0,
        shippingCost: 0,
        totalAmount: paymentAmount,
        tracking: [
          {
            status: 'Placed',
            date: new Date(),
            message: 'Payment received. Order details pending.',
          },
        ],
      });

      await order.save();
      console.log('✅ Minimal order created:', order._id);
    } else {
      // Create order from cart
      const orderItems = cart.items.map(item => {
        // Handle case where product might not be populated
        const productId = item.product ? item.product._id : new (require('mongoose').Types.ObjectId)();
        const productName = item.product ? item.product.name : 'Product';
        
        return {
          product: productId,
          name: productName,
          price: item.price,
          quantity: item.quantity,
          total: item.price * item.quantity,
          size: item.size || 'default',
        };
      });

      const order = new Order({
        user: userId,
        items: orderItems,
        paymentMethod: 'online',
        paymentStatus: 'paid',
        paymentId: paymentId,
        cashfreeOrderId: orderId,
        itemsPrice: cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0),
        taxAmount: 0,
        shippingCost: 0,
        totalAmount: cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0),
        tracking: [
          {
            status: 'Placed',
            date: new Date(),
            message: 'Your order has been placed successfully',
          },
        ],
      });

      await order.save();
      console.log('✅ Order created from cart:', order._id);

      // Clear cart
      await Cart.findOneAndDelete({ user: userId });
    }

    // Send notifications
    const Notification = require('../models/Notification');
    const User = require('../models/User');

    await Notification.create({
      user: userId,
      title: 'Order Placed Successfully',
      message: `Your order has been confirmed.`,
      type: 'order',
    });

    // Notify admin
    const adminUsers = await User.find({ role: 'admin' });
    for (const admin of adminUsers) {
      await Notification.create({
        user: admin._id,
        title: 'New Order Received',
        message: `New order worth ₹${paymentAmount} received.`,
        type: 'order',
      });
    }

    console.log('✅ Webhook processing completed successfully');
    res.status(200).json({ 
      success: true, 
      message: 'Order created via webhook',
      orderId: order?._id 
    });
  } catch (error) {
    console.error('❌ Webhook error:', error);
    // Still return 200 to Cashfree to prevent retries
    res.status(200).json({ 
      success: false, 
      message: 'Webhook error: ' + error.message 
    });
  }
};
