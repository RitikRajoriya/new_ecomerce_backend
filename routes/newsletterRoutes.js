const express = require('express');
const router = express.Router();
const newsletterController = require('../controller/newsletterController');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const uploadMedia = require('../middleware/uploadMedia');

// Routes for newsletters
router.post('/', authMiddleware, adminMiddleware, uploadMedia, newsletterController.createNewsletter);
router.get('/', newsletterController.getNewsletters);
router.get('/:id', newsletterController.getNewsletter);
router.put('/:id', authMiddleware, adminMiddleware, uploadMedia, newsletterController.updateNewsletter);
router.delete('/:id', authMiddleware, adminMiddleware, newsletterController.deleteNewsletter);

module.exports = router;