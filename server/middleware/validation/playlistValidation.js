const { body, query, param, validationResult } = require('express-validator');
const youtubeAPI = require('../../utils/youtubeApi');

/**
 * Validation rules for adding a new playlist
 */
const addPlaylistValidation = [
  body('url')
    .notEmpty()
    .withMessage('Playlist URL is required')
    .isURL()
    .withMessage('Please provide a valid URL')
    .custom((value) => {
      const playlistId = youtubeAPI.extractPlaylistId(value);
      if (!playlistId) {
        throw new Error('Please provide a valid YouTube playlist URL');
      }
      return true;
    }),
  body('category')
    .optional()
    .isIn(['programming', 'design', 'marketing', 'business', 'personal-development', 'other'])
    .withMessage('Invalid category'),
  body('difficulty')
    .optional()
    .isIn(['beginner', 'intermediate', 'advanced'])
    .withMessage('Invalid difficulty level'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array')
    .custom((tags) => {
      if (tags.length > 10) {
        throw new Error('Maximum 10 tags allowed');
      }
      for (const tag of tags) {
        if (typeof tag !== 'string' || tag.length > 30) {
          throw new Error('Each tag must be a string with maximum 30 characters');
        }
      }
      return true;
    })
];

/**
 * Validation rules for updating a playlist
 */
const updatePlaylistValidation = [
  body('category')
    .optional()
    .isIn(['programming', 'design', 'marketing', 'business', 'personal-development', 'other'])
    .withMessage('Invalid category'),
  body('difficulty')
    .optional()
    .isIn(['beginner', 'intermediate', 'advanced'])
    .withMessage('Invalid difficulty level'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array')
    .custom((tags) => {
      if (tags.length > 10) {
        throw new Error('Maximum 10 tags allowed');
      }
      for (const tag of tags) {
        if (typeof tag !== 'string' || tag.length > 30) {
          throw new Error('Each tag must be a string with maximum 30 characters');
        }
      }
      return true;
    }),
  body('isPublic')
    .optional()
    .isBoolean()
    .withMessage('isPublic must be a boolean')
];

/**
 * Validation rules for playlist query parameters
 */
const getPlaylistsValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),
  query('category')
    .optional()
    .isIn(['programming', 'design', 'marketing', 'business', 'personal-development', 'other'])
    .withMessage('Invalid category'),
  query('status')
    .optional()
    .isIn(['not_started', 'in_progress', 'completed'])
    .withMessage('Invalid status'),
  query('sort')
    .optional()
    .isIn(['newest', 'oldest', 'title', 'progress'])
    .withMessage('Invalid sort option')
];

/**
 * Validation rules for playlist ID parameter
 */
const playlistIdValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid playlist ID format')
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
  addPlaylistValidation,
  updatePlaylistValidation,
  getPlaylistsValidation,
  playlistIdValidation,
  handleValidationErrors
};
