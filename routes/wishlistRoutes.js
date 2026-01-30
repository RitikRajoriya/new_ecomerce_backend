const express = require('express');
const wishlistController = require('../controller/wishlistController');
const { authMiddleware } = require('../middleware/auth');
const { validateAddToWishlist } = require('../validators/commerceValidator');

const router = express.Router();

// All wishlist routes require authentication
router.use(authMiddleware);

router.get('/', wishlistController.getWishlist);
router.post('/', validateAddToWishlist, wishlistController.addToWishlist);
router.delete('/:productId', wishlistController.removeFromWishlist);

module.exports = router;