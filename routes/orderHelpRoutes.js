const express = require('express');
const orderHelpController = require('../controller/orderHelpController');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const router = express.Router();

// User routes
router.post('/start', authMiddleware, orderHelpController.startHelp);
router.post('/message', authMiddleware, orderHelpController.sendMessage);
router.get('/:orderId', authMiddleware, orderHelpController.getHelpChat);

// Admin routes
router.get('/', authMiddleware, adminMiddleware, orderHelpController.getAllHelpRequests);
router.put('/:ticketId/status', authMiddleware, adminMiddleware, orderHelpController.updateHelpStatus);
router.delete('/:ticketId', authMiddleware, adminMiddleware, orderHelpController.deleteHelpRequest);

module.exports = router;
