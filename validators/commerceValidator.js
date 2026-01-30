const { body, param, validationResult } = require('express-validator');

// Middleware to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array(),
    });
  }
  next();
};

// Wishlist validation
const validateAddToWishlist = [
  body('productId')
    .isMongoId()
    .withMessage('Valid product ID is required'),
  handleValidationErrors,
];

// Cart validation
const validateAddToCart = [
  body('productId')
    .isMongoId()
    .withMessage('Valid product ID is required'),
  body('size')
    .isIn(['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'])
    .withMessage('Valid size is required'),
  body('quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be at least 1'),
  handleValidationErrors,
];

const validateUpdateCart = [
  body('productId')
    .isMongoId()
    .withMessage('Valid product ID is required'),
  body('size')
    .isIn(['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'])
    .withMessage('Valid size is required'),
  body('quantity')
    .isInt({ min: 0 })
    .withMessage('Quantity must be 0 or more'),
  handleValidationErrors,
];

// Order validation
const validateCreateOrder = [
  body('shippingAddress.street')
    .trim()
    .notEmpty()
    .withMessage('Street address is required'),
  body('shippingAddress.city')
    .trim()
    .notEmpty()
    .withMessage('City is required'),
  body('shippingAddress.state')
    .trim()
    .notEmpty()
    .withMessage('State is required'),
  body('shippingAddress.zipCode')
    .trim()
    .notEmpty()
    .withMessage('Zip code is required'),
  body('shippingAddress.country')
    .trim()
    .notEmpty()
    .withMessage('Country is required'),
  body('paymentMethod')
    .isIn(['card', 'paypal', 'bank_transfer'])
    .withMessage('Valid payment method is required'),
  handleValidationErrors,
];

const validateUpdateOrderStatus = [
  body('orderStatus')
    .optional()
    .isIn(['pending', 'processing', 'shipped', 'delivered', 'cancelled'])
    .withMessage('Valid order status is required'),
  body('paymentStatus')
    .optional()
    .isIn(['pending', 'paid', 'failed', 'refunded'])
    .withMessage('Valid payment status is required'),
  body('trackingNumber')
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage('Tracking number is required'),
  body('estimatedDelivery')
    .optional()
    .isISO8601()
    .withMessage('Valid estimated delivery date is required'),
  handleValidationErrors,
];

module.exports = {
  validateAddToWishlist,
  validateAddToCart,
  validateUpdateCart,
  validateCreateOrder,
  validateUpdateOrderStatus,
};