const rateLimit = require('express-rate-limit');

/**
 * Create a rate limiter with custom settings
 * @param {Object} options - Rate limiting options
 * @returns {Function} Express middleware
 */
const createRateLimiter = ({ windowMs, max, message }) => {
  return rateLimit({
    windowMs: windowMs || 15 * 60 * 1000, // Default: 15 minutes
    max: max || 100, // Default: 100 requests per window
    message: message || {
      error: 'Too many requests',
      message: 'Please try again later'
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
};

/**
 * Rate limiter for auth routes (login, register)
 */
const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per window (increased for development)
  message: {
    error: 'Too many authentication attempts',
    message: 'Please try again later'
  }
});

/**
 * Rate limiter for API requests
 */
const apiLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: {
    error: 'Too many requests',
    message: 'Please try again later'
  }
});

module.exports = {
  createRateLimiter,
  authLimiter,
  apiLimiter
};
