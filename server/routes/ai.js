const express = require('express');
const aiController = require('../controllers/ai/aiController');
const { 
  summaryValidation, 
  quizValidation, 
  notesValidation, 
  tutorValidation, 
  handleValidationErrors 
} = require('../middleware/validation/aiValidation');
const { createRateLimiter } = require('../middleware/rateLimit/rateLimiters');

const router = express.Router();

// Rate limiter for AI operations
const aiLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 AI operations per hour
  message: {
    error: 'Too many AI operations',
    message: 'Please try again later'
  }
});

// Generate summary for a video
router.post('/summary/:videoId',
  aiLimiter,
  summaryValidation,
  handleValidationErrors,
  aiController.generateSummary
);

// Generate quiz for a video
router.post('/quiz/:videoId',
  aiLimiter,
  quizValidation,
  handleValidationErrors,
  aiController.generateQuiz
);

// Generate notes for a video
router.post('/notes/:videoId',
  aiLimiter,
  notesValidation,
  handleValidationErrors,
  aiController.generateNotes
);

// Ask AI tutor about video content
router.post('/tutor/:videoId',
  tutorValidation,
  handleValidationErrors,
  aiController.askTutor
);

// Clear quiz data
router.delete('/quiz/:videoId',
  aiController.clearQuiz
);

// Get available AI providers
router.get('/providers',
  aiController.getProviders
);

module.exports = router;
