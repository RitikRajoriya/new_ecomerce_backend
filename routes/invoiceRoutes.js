const express = require('express');
const invoiceController = require('../controller/invoiceController');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Create uploads/invoices directory if not exists
const invoicesDir = path.join(__dirname, '../uploads/invoices');
if (!fs.existsSync(invoicesDir)) {
  fs.mkdirSync(invoicesDir, { recursive: true });
}

// Configure upload for PDF invoices only
const invoiceStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, invoicesDir);
  },
  filename: function (req, file, cb) {
    const uniqueName = 'invoice-' + Date.now() + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

const invoiceUpload = multer({
  storage: invoiceStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: function (req, file, cb) {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  }
}).single('invoice');

// Admin routes
router.post('/:orderId/invoice',
  authMiddleware, 
  adminMiddleware, 
  invoiceUpload, 
  invoiceController.uploadInvoice
);

// User/Admin download
router.get('/:orderId/invoice', 
  authMiddleware, 
  invoiceController.downloadInvoice
);

module.exports = router;
