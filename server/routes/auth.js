const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimit/rateLimiters');
const {
  registerValidation,
  loginValidation,
  profileUpdateValidation,
  passwordChangeValidation,
  accountDeleteValidation,
  handleValidationErrors
} = require('../middleware/validation/authValidation');

// Import controllers
const authController = require('../controllers/auth/authController');
const profileController = require('../controllers/auth/profileController');
const accountController = require('../controllers/auth/accountController');

const router = express.Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', authLimiter, registerValidation, handleValidationErrors, authController.register);
/**
 * @route   POST /api/auth/login
 * @desc    Login user and return JWT token
 * @access  Public
 */
router.post('/login', authLimiter, loginValidation, handleValidationErrors, authController.login);
/**
 * @route   GET /api/auth/profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/profile', authenticateToken, profileController.getProfile);

/**
 * @route   PUT /api/auth/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile', 
  authenticateToken, 
  profileUpdateValidation,
  handleValidationErrors,
  profileController.updateProfile
);

/**
 * @route   POST /api/auth/change-password
 * @desc    Change user password
 * @access  Private
 */
router.post('/change-password', 
  authenticateToken,
  passwordChangeValidation,
  handleValidationErrors,
  profileController.changePassword
);

/**
 * @route   POST /api/auth/refresh-token
 * @desc    Refresh JWT token
 * @access  Private
 */
router.post('/refresh-token', authenticateToken, authController.refreshToken);

/**
 * @route   DELETE /api/auth/account
 * @desc    Delete user account and all associated data
 * @access  Private
 */
router.delete('/account', 
  authenticateToken,
  accountDeleteValidation,
  handleValidationErrors,
  accountController.deleteAccount
);

/**
 * @route   GET /api/auth/stats
 * @desc    Get user statistics
 * @access  Private
 */
router.get('/stats', authenticateToken, accountController.getStats);

module.exports = router;
