const express = require('express');
const videoController = require('../controller/videoController');
const { authMiddleware } = require('../middleware/auth');
const { validateVideoUpload, validateVideoUpdate } = require('../validators/videoValidator');
const uploadVideo = require('../middleware/uploadVideo');

const router = express.Router();

// Public routes
router.get('/videos', videoController.getAllVideos);
router.get('/videos/search', videoController.searchVideos);
router.get('/videos/:id', videoController.getVideoById);
router.get('/users/:userId/videos', videoController.getVideosByUser);

// Protected routes (require authentication)
router.post('/videos/upload', authMiddleware, uploadVideo, validateVideoUpload, videoController.uploadVideo);
router.put('/videos/:id', authMiddleware, uploadVideo, validateVideoUpdate, videoController.updateVideo);
router.patch('/videos/:id', authMiddleware, videoController.updateVideoVisibility); // For visibility toggle
router.delete('/videos/:id', authMiddleware, videoController.deleteVideo);
router.post('/videos/:id/like', authMiddleware, videoController.toggleVideoLike);

module.exports = router;
