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

// Category validation
const validateCategory = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Category name must be between 1 and 50 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot be more than 500 characters'),
  // image will be handled via file upload
  handleValidationErrors,
];

// Subcategory validation
const validateSubcategory = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Subcategory name must be between 1 and 50 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot be more than 500 characters'),
  body('category')
    .isMongoId()
    .withMessage('Category must be a valid ObjectId'),
  // image will be handled via file upload
  handleValidationErrors,
];

module.exports = {
  validateCategory,
  validateSubcategory,
};