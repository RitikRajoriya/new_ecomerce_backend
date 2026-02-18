const express = require('express');
const analyticsController = require('../controller/analyticsController');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const router = express.Router();

// All analytics routes require admin authentication
router.get('/analytics/platform', authMiddleware, adminMiddleware, analyticsController.getPlatformAnalytics);
router.get('/analytics/detailed', authMiddleware, adminMiddleware, analyticsController.getDetailedAnalytics);
router.get('/analytics/users', authMiddleware, adminMiddleware, analyticsController.getUserStats);

module.exports = router;
