const express = require('express');
const orderController = require('../controller/orderController');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const { validateCreateOrder, validateUpdateOrderStatus } = require('../validators/commerceValidator');

const router = express.Router();

// Debug: Log route registration
console.log('✅ Order routes registered');

// User routes (require authentication)
router.post('/', authMiddleware, validateCreateOrder, orderController.createOrder);
router.get('/my-orders', authMiddleware, orderController.getUserOrders);
router.get('/:id', authMiddleware, orderController.getOrder);
router.get('/:id/track', authMiddleware, orderController.trackOrder);
router.put('/:id/cancel', authMiddleware, orderController.cancelOrder);

// Cashfree payment route
router.post('/cashfree/create', authMiddleware, (req, res, next) => {
  console.log('💳 Cashfree order creation request received');
  console.log('User ID:', req.userId);
  console.log('Request body:', req.body);
  next();
}, orderController.createCashfreeOrder);

// Admin routes (require admin authentication)
router.get('/', authMiddleware, adminMiddleware, orderController.getAllOrders);
router.put('/:id/status', authMiddleware, adminMiddleware, validateUpdateOrderStatus, orderController.updateOrderStatus);
router.delete('/:id', authMiddleware, adminMiddleware, orderController.deleteOrder);


module.exports = router;