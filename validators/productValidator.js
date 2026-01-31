const { body, validationResult } = require('express-validator');

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

// Product validation
const validateProduct = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Product name must be between 1 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description cannot be more than 1000 characters'),
  body('subcategory')
    .isMongoId()
    .withMessage('Subcategory must be a valid ObjectId'),
  // images will be handled via file upload
  body('variations')
    .isArray({ min: 1 })
    .withMessage('At least one variation is required'),
  body('variations.*.size')
    .isIn(['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'])
    .withMessage('Size must be one of: XS, S, M, L, XL, XXL, XXXL'),
  body('variations.*.price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('variations.*.stock')
    .isInt({ min: 0 })
    .withMessage('Stock must be a non-negative integer'),
  body('brand')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Brand name cannot be more than 50 characters'),
  handleValidationErrors,
];

module.exports = {
  validateProduct,
};