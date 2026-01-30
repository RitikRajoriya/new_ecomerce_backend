const express = require('express');
const cartController = require('../controller/cartController');
const { authMiddleware } = require('../middleware/auth');
const { validateAddToCart, validateUpdateCart } = require('../validators/commerceValidator');

const router = express.Router();

// All cart routes require authentication
router.use(authMiddleware);

router.get('/', cartController.getCart);
router.post('/', validateAddToCart, cartController.addToCart);
router.put('/', validateUpdateCart, cartController.updateCartItem);
router.delete('/:productId/:size', cartController.removeFromCart);
router.delete('/', cartController.clearCart);

module.exports = router;