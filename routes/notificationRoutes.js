const express = require('express');
const router = express.Router();
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const notificationController = require('../controller/notificationController');

// User routes
router.get('/', authMiddleware, notificationController.getNotifications);
router.put('/:id/read', authMiddleware, notificationController.markAsRead);
router.put('/read-all', authMiddleware, notificationController.markAllAsRead);
router.delete('/:id', authMiddleware, notificationController.deleteNotification);

// Admin routes
router.post('/broadcast', authMiddleware, adminMiddleware, notificationController.broadcastNotification);

module.exports = router;
