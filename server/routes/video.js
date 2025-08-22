const express = require('express');
const videoController = require('../controllers/video/videoController');
const { 
  videoIdValidation, 
  updateVideoStatusValidation, 
  updateVideoProgressValidation, 
  handleValidationErrors 
} = require('../middleware/validation/videoValidation');

const router = express.Router();

// Get last watched video for the current user
router.get('/last-watched', videoController.getLastWatchedVideo);

// Get a single video by ID
router.get('/:id', 
  videoIdValidation,
  handleValidationErrors,
  videoController.getVideo
);

// Update video status
router.put('/:id/status',
  updateVideoStatusValidation,
  handleValidationErrors,
  videoController.updateVideoStatus
);

// Update video progress (for real-time tracking)
router.put('/:id/progress',
  updateVideoProgressValidation,
  handleValidationErrors,
  videoController.updateVideoProgress
);

module.exports = router;
