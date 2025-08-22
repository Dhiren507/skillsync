const { body, validationResult } = require('express-validator');

/**
 * Validation rules for user registration
 */
const registerValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
    // Relaxed password requirements for development
    // .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    // .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters')
];

/**
 * Validation rules for user login
 */
const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

/**
 * Validation rules for profile update
 */
const profileUpdateValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('preferences.aiProvider')
    .optional()
    .isIn(['gemini', 'openai', 'claude'])
    .withMessage('AI provider must be gemini, openai, or claude'),
  body('preferences.autoGenerateSummary')
    .optional()
    .isBoolean()
    .withMessage('Auto generate summary must be a boolean'),
  body('preferences.reminderFrequency')
    .optional()
    .isIn(['daily', 'weekly', 'never'])
    .withMessage('Reminder frequency must be daily, weekly, or never')
];

/**
 * Validation rules for password change
 */
const passwordChangeValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long')
    // Relaxed password requirements for development
    // .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    // .withMessage('New password must contain at least one uppercase letter, one lowercase letter, and one number')
];

/**
 * Validation rules for account deletion
 */
const accountDeleteValidation = [
  body('password')
    .notEmpty()
    .withMessage('Password is required to delete account')
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
  registerValidation,
  loginValidation,
  profileUpdateValidation,
  passwordChangeValidation,
  accountDeleteValidation,
  handleValidationErrors
};
