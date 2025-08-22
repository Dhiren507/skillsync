const { body, param, validationResult } = require('express-validator');

/**
 * Validation rules for video ID parameter
 */
const videoIdValidation = [
  param('id').isMongoId().withMessage('Invalid video ID')
];

/**
 * Validation rules for updating video status
 */
const updateVideoStatusValidation = [
  param('id').isMongoId().withMessage('Invalid video ID'),
  body('status').isIn(['not_started', 'watching', 'completed']).withMessage('Invalid status'),
  body('currentTime').optional().isNumeric().withMessage('Current time must be a number'),
  body('duration').optional().isNumeric().withMessage('Duration must be a number')
];

/**
 * Validation rules for updating video progress
 */
const updateVideoProgressValidation = [
  param('id').isMongoId().withMessage('Invalid video ID'),
  body('currentTime').isNumeric().withMessage('Current time must be a number'),
  body('duration').optional().isNumeric().withMessage('Duration must be a number'),
  body('percentage').optional().isNumeric().withMessage('Percentage must be a number')
];

/**
 * Handle validation errors middleware
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array().map(err => ({
        field: err.path,
        message: err.msg,
        value: err.value
      }))
    });
  }
  next();
};

module.exports = {
  videoIdValidation,
  updateVideoStatusValidation,
  updateVideoProgressValidation,
  handleValidationErrors
};
