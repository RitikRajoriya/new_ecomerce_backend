const OrderHelp = require('../models/OrderHelp');
const Order = require('../models/Order');
const { createNotification } = require('./notificationController');

// Start help ticket for an order
exports.startHelp = async (req, res) => {
  try {
    const { orderId } = req.body;

    // Check if order exists
    const order = await Order.findById(orderId);
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

    // Check if help ticket already exists
    let helpTicket = await OrderHelp.findOne({
      order: orderId,
      user: req.userId,
      status: { $in: ['open', 'in_progress'] },
    });

    if (helpTicket) {
      return res.status(200).json({
        success: true,
        message: 'Help ticket already exists',
        ticket: helpTicket,
      });
    }

    // Create new help ticket
    helpTicket = new OrderHelp({
      user: req.userId,
      order: orderId,
      messages: [],
      status: 'open',
    });

    await helpTicket.save();

    // Notify admins
    const User = require('../models/User');
    const admins = await User.find({ role: 'admin' }, '_id');
    for (const admin of admins) {
      await createNotification(
        admin._id,
        'New Help Request',
        `New help request for Order #${orderId}`,
        'admin',
        orderId
      );
    }

    res.status(201).json({
      success: true,
      message: 'Help ticket created',
      ticket: helpTicket,
    });
  } catch (error) {
    console.error('Start help error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// Send message in help chat
exports.sendMessage = async (req, res) => {
  try {
    const { ticketId, message } = req.body;

    if (!ticketId || !message) {
      return res.status(400).json({
        success: false,
        message: 'Ticket ID and message are required',
      });
    }

    const helpTicket = await OrderHelp.findById(ticketId);
    if (!helpTicket) {
      return res.status(404).json({
        success: false,
        message: 'Help ticket not found',
      });
    }

    // Check permissions
    const isAdmin = req.userRole === 'admin';
    const isUserOwner = helpTicket.user.toString() === req.userId;

    if (!isAdmin && !isUserOwner) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    // Add message
    const sender = isAdmin ? 'admin' : 'user';
    helpTicket.messages.push({
      sender,
      message,
      time: new Date(),
    });

    helpTicket.lastMessage = message;
    helpTicket.lastMessageTime = new Date();

    // Update status if admin replies
    if (isAdmin && helpTicket.status === 'open') {
      helpTicket.status = 'in_progress';
    }

    await helpTicket.save();

    // Send notification
    if (isAdmin) {
      // Notify user
      await createNotification(
        helpTicket.user,
        'Admin Replied',
        `Admin replied to your help request for Order #${helpTicket.order}`,
        'user',
        helpTicket.order
      );
    } else {
      // Notify admins
      const User = require('../models/User');
      const admins = await User.find({ role: 'admin' }, '_id');
      for (const admin of admins) {
        await createNotification(
          admin._id,
          'New Help Message',
          `New message in help request for Order #${helpTicket.order}`,
          'admin',
          helpTicket.order
        );
      }
    }

    res.status(200).json({
      success: true,
      message: 'Message sent',
      ticket: helpTicket,
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// Get help chat for an order
exports.getHelpChat = async (req, res) => {
  try {
    const { orderId } = req.params;

    const helpTicket = await OrderHelp.findOne({
      order: orderId,
      user: req.userId,
    }).populate('order', 'orderStatus totalAmount');

    if (!helpTicket) {
      return res.status(404).json({
        success: false,
        message: 'Help ticket not found',
      });
    }

    res.status(200).json({
      success: true,
      ticket: helpTicket,
    });
  } catch (error) {
    console.error('Get help chat error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// Get all help requests (Admin only)
exports.getAllHelpRequests = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const query = {};
    if (status) {
      query.status = status;
    }

    const helpRequests = await OrderHelp.find(query)
      .populate('user', 'name email')
      .populate('order', 'orderStatus totalAmount items')
      .sort({ lastMessageTime: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await OrderHelp.countDocuments(query);

    res.status(200).json({
      success: true,
      count: helpRequests.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      helpRequests,
    });
  } catch (error) {
    console.error('Get all help requests error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// Update help ticket status (Admin only)
exports.updateHelpStatus = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { status } = req.body;

    const helpTicket = await OrderHelp.findById(ticketId);
    if (!helpTicket) {
      return res.status(404).json({
        success: false,
        message: 'Help ticket not found',
      });
    }

    helpTicket.status = status;
    await helpTicket.save();

    // Notify user
    await createNotification(
      helpTicket.user,
      'Help Request Updated',
      `Your help request for Order #${helpTicket.order} has been marked as ${status}`,
      'user',
      helpTicket.order
    );

    res.status(200).json({
      success: true,
      message: 'Status updated',
      ticket: helpTicket,
    });
  } catch (error) {
    console.error('Update help status error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// Delete help request (Admin only)
exports.deleteHelpRequest = async (req, res) => {
  try {
    const { ticketId } = req.params;
    
    const ticket = await OrderHelp.findById(ticketId);
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Help request not found'
      });
    }
    
    await OrderHelp.findByIdAndDelete(ticketId);
    
    res.status(200).json({
      success: true,
      message: 'Help request deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
