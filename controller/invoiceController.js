const Order = require('../models/Order');
const { createNotification } = require('./notificationController');
const path = require('path');
const fs = require('fs');

// Upload invoice PDF (Admin only)
exports.uploadInvoice = async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a PDF file',
      });
    }

    // Validate file type
    if (req.file.mimetype !== 'application/pdf') {
      // Clean up uploaded file
      fs.unlinkSync(req.file.path);
      return res.status(400).json({
        success: false,
        message: 'Only PDF files are allowed',
      });
    }

    // Validate file size (10MB max)
    if (req.file.size > 10 * 1024 * 1024) {
      // Clean up uploaded file
      fs.unlinkSync(req.file.path);
      return res.status(400).json({
        success: false,
        message: 'File size must be less than 10MB',
      });
    }

    // Find order
    const order = await Order.findById(orderId);
    if (!order) {
      // Clean up uploaded file
      fs.unlinkSync(req.file.path);
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Delete old invoice if exists
    if (order.invoiceFile) {
      // Support both old format (uploads/invoices/file.pdf) and new format (file.pdf)
      const oldFilename = path.basename(order.invoiceFile);
      const oldFilePath = path.join(__dirname, '..', 'uploads', 'invoices', oldFilename);
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }
    }

    // Update order with invoice filename (just the filename, not full path)
    order.invoiceFile = req.file.filename;
    await order.save();

    console.log('✅ Invoice uploaded:', order.invoiceFile);

    // Create notification for user
    await createNotification(
      order.user,
      'Invoice Available',
      `Your invoice is ready for Order #${order._id.toString().slice(-8)}`,
      'invoice',
      orderId
    );

    res.status(200).json({
      success: true,
      message: 'Invoice uploaded successfully',
      invoiceFile: order.invoiceFile,
    });
  } catch (error) {
    // Clean up uploaded file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    console.error('Upload invoice error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// Download invoice (User can only download their own)
exports.downloadInvoice = async (req, res) => {
  try {
    const { orderId } = req.params;

    console.log('=== DOWNLOAD INVOICE REQUEST ===');
    console.log('Order ID:', orderId);
    console.log('User ID:', req.userId);
    console.log('User Role:', req.userRole);

    const order = await Order.findById(orderId);
    if (!order) {
      console.log('❌ Order not found');
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    console.log('✅ Order found:', order._id);
    console.log('Order user:', order.user);
    console.log('Invoice file:', order.invoiceFile);

    // Check if user owns this order (unless admin)
    if (req.userRole !== 'admin' && order.user.toString() !== req.userId) {
      console.log('❌ Access denied - user does not own this order');
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    if (!order.invoiceFile) {
      console.log('❌ Invoice not available - no file uploaded for this order');
      return res.status(404).json({
        success: false,
        message: 'Invoice not available. Admin has not uploaded an invoice for this order yet.',
      });
    }

    // Extract filename from invoiceFile (support both old and new formats)
    // Old format: uploads/invoices/filename.pdf
    // New format: filename.pdf
    const filename = path.basename(order.invoiceFile);
    
    const filePath = path.join(__dirname, '..', 'uploads', 'invoices', filename);
    console.log('Invoice file (stored):', order.invoiceFile);
    console.log('Extracted filename:', filename);
    console.log('File path:', filePath);
    
    if (!fs.existsSync(filePath)) {
      console.log('❌ Invoice file not found on disk:', filePath);
      return res.status(404).json({
        success: false,
        message: 'Invoice file not found',
      });
    }

    console.log('✅ Downloading invoice file');
    res.download(filePath, `invoice-${orderId}.pdf`);
  } catch (error) {
    console.error('❌ Download invoice error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};
