const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');

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
    for (const item of cart.items) {
      const product = item.product;
      const variation = product.variations.find(v => v.size === item.size);

      if (!variation) {
        return res.status(400).json({
          success: false,
          message: `Size ${item.size} not available for ${product.name}`,
        });
      }

      if (variation.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name} (${item.size})`,
        });
      }

      orderItems.push({
        product: product._id,
        size: item.size,
        quantity: item.quantity,
        price: variation.price,
        total: variation.price * item.quantity,
      });

      // Reduce stock
      variation.stock -= item.quantity;
      await product.save();
    }

    // Calculate totals
    const subtotal = orderItems.reduce((total, item) => total + item.total, 0);
    const shippingCost = subtotal > 100 ? 0 : 10; // Free shipping over $100
    const taxAmount = subtotal * 0.08; // 8% tax
    const totalAmount = subtotal + shippingCost + taxAmount;

    // Create order
    const order = new Order({
      user: req.userId,
      items: orderItems,
      shippingAddress,
      paymentMethod,
      totalAmount,
      shippingCost,
      taxAmount,
    });

    await order.save();

    // Clear cart
    cart.items = [];
    await cart.save();

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
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
    const { orderStatus, paymentStatus, trackingNumber, estimatedDelivery } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    if (orderStatus) order.orderStatus = orderStatus;
    if (paymentStatus) order.paymentStatus = paymentStatus;
    if (trackingNumber) order.trackingNumber = trackingNumber;
    if (estimatedDelivery) order.estimatedDelivery = new Date(estimatedDelivery);

    await order.save();

    res.status(200).json({
      success: true,
      message: 'Order updated successfully',
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
    if (['shipped', 'delivered', 'cancelled'].includes(order.orderStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Order cannot be cancelled at this stage',
      });
    }

    // Restore stock
    for (const item of order.items) {
      const product = await Product.findById(item.product);
      const variation = product.variations.find(v => v.size === item.size);
      if (variation) {
        variation.stock += item.quantity;
        await product.save();
      }
    }

    order.orderStatus = 'cancelled';
    await order.save();

    res.status(200).json({
      success: true,
      message: 'Order cancelled successfully',
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