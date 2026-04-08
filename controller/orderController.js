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

// Create Razorpay order - optimized for fast response
exports.createRazorpayOrder = async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount) {
      return res.status(400).json({
        success: false,
        message: 'Amount required',
      });
    }

    // Initialize Razorpay (cached instance for performance)
    const Razorpay = require('razorpay');
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    // Create order with minimal fields
    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100), // Convert to paise
      currency: 'INR',
    });

    // Return only necessary fields for faster response
    res.json({
      success: true,
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
      },
    });
  } catch (err) {
    console.error('Razorpay order creation error:', err);
    res.status(500).json({
      success: false,
      message: err.message,
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