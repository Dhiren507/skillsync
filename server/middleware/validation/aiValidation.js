const { body, param, validationResult } = require('express-validator');

/**
 * Validation rules for summary generation
 */
const summaryValidation = [
  param('videoId').isMongoId().withMessage('Invalid video ID'),
  body('provider').optional().isIn(['gemini', 'openai', 'claude']).withMessage('Invalid AI provider')
];

/**
 * Validation rules for quiz generation
 */
const quizValidation = [
  param('videoId').isMongoId().withMessage('Invalid video ID'),
  body('provider').optional().isIn(['gemini', 'openai', 'claude']).withMessage('Invalid AI provider'),
  body('questionCount').optional().isInt({ min: 3, max: 10 }).withMessage('Question count must be between 3 and 10')
];

/**
 * Validation rules for notes generation
 */
const notesValidation = [
  param('videoId').isMongoId().withMessage('Invalid video ID'),
  body('provider').optional().isIn(['gemini', 'openai', 'claude']).withMessage('Invalid AI provider'),
  body('format').optional().isIn(['bullet', 'outline', 'detailed']).withMessage('Invalid notes format')
];

/**
 * Validation rules for tutor questions
 */
const tutorValidation = [
  param('videoId').isMongoId().withMessage('Invalid video ID'),
  body('message').notEmpty().withMessage('Message is required'),
  body('provider').optional().isIn(['gemini', 'openai', 'claude']).withMessage('Invalid AI provider')
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
  summaryValidation,
  quizValidation,
  notesValidation,
  tutorValidation,
  handleValidationErrors
};
