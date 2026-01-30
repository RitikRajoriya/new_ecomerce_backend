const express = require('express');
const orderController = require('../controller/orderController');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const { validateCreateOrder, validateUpdateOrderStatus } = require('../validators/commerceValidator');

const router = express.Router();

// User routes (require authentication)
router.post('/', authMiddleware, validateCreateOrder, orderController.createOrder);
router.get('/my-orders', authMiddleware, orderController.getUserOrders);
router.get('/:id', authMiddleware, orderController.getOrder);
router.put('/:id/cancel', authMiddleware, orderController.cancelOrder);

// Admin routes (require admin authentication)
router.get('/', authMiddleware, adminMiddleware, orderController.getAllOrders);
router.put('/:id/status', authMiddleware, adminMiddleware, validateUpdateOrderStatus, orderController.updateOrderStatus);

module.exports = router;