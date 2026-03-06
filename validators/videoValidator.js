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

// Video upload validation
const validateVideoUpload = [
  body('title')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Title must be between 3 and 100 characters'),
  body('description')
    .trim()
    .isLength({ min: 3, max: 500 })
    .withMessage('Description must be between 3 and 500 characters'),
  body('duration')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Duration must be a non-negative integer'),
  body('tags')
    .optional()
    .custom((value) => {
      if (typeof value === 'string') {
        try {
          JSON.parse(value);
        } catch (err) {
          // If it's not JSON, it might be comma-separated, which is fine
        }
      }
      return true;
    })
    .withMessage('Tags must be in valid format'),
  handleValidationErrors,
];

// Video update validation
const validateVideoUpdate = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Title must be between 3 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ min: 3, max: 500 })
    .withMessage('Description must be between 3 and 500 characters'),
  body('tags')
    .optional()
    .custom((value) => {
      if (typeof value === 'string') {
        try {
          JSON.parse(value);
        } catch (err) {
          // If it's not JSON, it might be comma-separated, which is fine
        }
      }
      return true;
    })
    .withMessage('Tags must be in valid format'),
  handleValidationErrors,
];

module.exports = {
  validateVideoUpload,
  validateVideoUpdate,
  handleValidationErrors,
};
