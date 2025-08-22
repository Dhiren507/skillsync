const express = require('express');
const { createRateLimiter } = require('../middleware/rateLimit/rateLimiters');
const playlistController = require('../controllers/playlist/playlistController');
const youtubeController = require('../controllers/playlist/youtubeController');
const { 
  addPlaylistValidation, 
  updatePlaylistValidation, 
  getPlaylistsValidation, 
  playlistIdValidation,
  handleValidationErrors 
} = require('../middleware/validation/playlistValidation');

const router = express.Router();

// Rate limiting for playlist operations
const playlistLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 playlist operations per windowMs
  message: {
    error: 'Too many playlist operations',
    message: 'Please try again later'
  }
});

// Get all playlists with pagination and filtering
router.get('/', 
  getPlaylistsValidation,
  handleValidationErrors,
  playlistController.getPlaylists
);

// Get a single playlist with videos
router.get('/:id', 
  playlistIdValidation,
  handleValidationErrors,
  playlistController.getPlaylist
);

// Add a new playlist
router.post('/',
  playlistLimiter,
  addPlaylistValidation,
  handleValidationErrors,
  youtubeController.addPlaylist
);

// Update playlist details
router.put('/:id',
  playlistIdValidation,
  updatePlaylistValidation,
  handleValidationErrors,
  playlistController.updatePlaylist
);

// Delete playlist and its videos
router.delete('/:id',
  playlistIdValidation,
  handleValidationErrors,
  playlistController.deletePlaylist
);

// Refresh playlist from YouTube
router.post('/:id/refresh',
  playlistLimiter,
  playlistIdValidation,
  handleValidationErrors,
  youtubeController.refreshPlaylist
);

// Search YouTube for playlists
router.get('/search/youtube',
  youtubeController.searchYouTube
);

module.exports = router;
