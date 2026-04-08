const express = require('express');
const settingsController = require('../controller/settingsController');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const router = express.Router();

// Get settings (public)
router.get('/settings', settingsController.getSettings);

// Update settings (admin only)
router.put('/settings', authMiddleware, adminMiddleware, settingsController.updateSettings);

module.exports = router;
