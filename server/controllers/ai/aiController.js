const Video = require('../../models/Video');
const aiHelper = require('../../utils/aiHelper');
const youtubeAPI = require('../../utils/youtubeApi');

/**
 * Generate a summary for a video
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const generateSummary = async (req, res) => {
  try {
    const { videoId } = req.params;
    const { provider = 'gemini' } = req.body || {};
    const userId = req.user._id;

    const video = await Video.findById(videoId).populate('playlistId');
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    if (!video.playlistId.userId.equals(userId)) {
      return res.status(403).json({ error: 'Access denied - not your playlist' });
    }

    if (video.summary && video.summary.content) {
      return res.status(200).json({
        message: 'Summary already exists',
        summary: video.summary,
        cached: true
      });
    }

    console.log(`Generating summary for video: ${video.title}`);
    
    // Fetch transcript for better summary generation
    const transcript = await youtubeAPI.getVideoTranscript(video.ytVideoId);
    
    const videoData = {
      title: video.title,
      description: video.description,
      transcript: transcript.text || '',
      transcriptSegments: transcript.segments || [],
      videoDuration: video.duration || 0
    };

    console.log(`Video data prepared. Transcript length: ${transcript.text?.length || 0} characters`);

    const summaryResult = await aiHelper.generateSummary(videoData, provider);
    
    await video.generateSummary(
      summaryResult.content,
      summaryResult.timestamps,
      provider
    );

    res.status(200).json({
      message: 'Summary generated successfully',
      summary: video.summary
    });

  } catch (error) {
    console.error('AI summary generation error:', error);
    res.status(500).json({
      error: 'Failed to generate summary',
      message: error.message
    });
  }
};

/**
 * Generate a quiz for a video
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const generateQuiz = async (req, res) => {
  try {
    const { videoId } = req.params;
    const { provider = 'gemini', questionCount = 5 } = req.body || {};
    const userId = req.user._id;

    const video = await Video.findById(videoId).populate('playlistId');
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    if (!video.playlistId.userId.equals(userId)) {
      return res.status(403).json({ error: 'Access denied - not your playlist' });
    }

    // Check if quiz already exists with the same question count
    if (video.quiz && video.quiz.questions && video.quiz.questions.length === questionCount) {
      return res.status(200).json({
        message: 'Quiz already exists with same question count',
        quiz: video.quiz,
        cached: true
      });
    }

    // Generate quiz based on video summary or description
    let summaryContent = video.summary?.content;
    
    // If no summary exists, create one first for better quiz generation
    if (!summaryContent) {
      console.log('No summary found, generating summary first for quiz creation');
      
      const transcript = await youtubeAPI.getVideoTranscript(video.ytVideoId);
      const videoData = {
        title: video.title,
        description: video.description,
        transcript: transcript.text || '',
        transcriptSegments: transcript.segments || [],
        videoDuration: video.duration || 0
      };
      
      const summaryResult = await aiHelper.generateSummary(videoData, provider);
      summaryContent = summaryResult.content;
      
      console.log(`Generated summary for quiz: ${summaryContent.substring(0, 100)}...`);
    }
    
    if (!summaryContent) {
      return res.status(400).json({ 
        error: 'No content available for quiz generation',
        message: 'Unable to generate summary or get video content for quiz creation'
      });
    }

    const quizResult = await aiHelper.generateQuiz(summaryContent, provider, questionCount);
    
    // Update video with quiz - handle both array and object formats
    const quizQuestions = Array.isArray(quizResult) ? quizResult : quizResult.questions;
    
    video.quiz = {
      questions: quizQuestions,
      provider: provider,
      generatedAt: new Date()
    };
    
    console.log('Saving quiz to database with', quizQuestions.length, 'questions');
    await video.save();
    console.log('Quiz saved successfully');

    res.status(200).json({
      message: 'Quiz generated successfully',
      quiz: video.quiz
    });

  } catch (error) {
    console.error('AI quiz generation error:', error);
    res.status(500).json({
      error: 'Failed to generate quiz',
      message: error.message
    });
  }
};

/**
 * Generate notes for a video
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const generateNotes = async (req, res) => {
  try {
    const { videoId } = req.params;
    const { provider = 'gemini', format = 'bullet' } = req.body || {};
    const userId = req.user._id;

    const video = await Video.findById(videoId).populate('playlistId');
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    if (!video.playlistId.userId.equals(userId)) {
      return res.status(403).json({ error: 'Access denied - not your playlist' });
    }

    // Check if notes already exist for this format
    if (video.aiNotes && video.aiNotes.content && video.aiNotes.format === format) {
      return res.status(200).json({
        message: 'Notes already exist for this format',
        notes: video.aiNotes,
        cached: true
      });
    }

    console.log(`Generating notes for video: ${video.title} with format: ${format}`);
    
    // Fetch transcript for better notes generation
    const transcript = await youtubeAPI.getVideoTranscript(video.ytVideoId);
    
    const videoData = {
      title: video.title,
      description: video.description,
      transcript: transcript.text || ''
    };

    const notesResult = await aiHelper.generateNotes(videoData, provider, format);
    
    await video.generateNotes(
      notesResult.content,
      format,
      notesResult.sections,
      provider
    );

    res.status(200).json({
      message: 'Notes generated successfully',
      notes: video.aiNotes
    });

  } catch (error) {
    console.error('AI notes generation error:', error);
    res.status(500).json({
      error: 'Failed to generate notes',
      message: error.message
    });
  }
};

/**
 * Get AI tutor response
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const askTutor = async (req, res) => {
  try {
    const { videoId } = req.params;
    const { message, provider = 'gemini' } = req.body || {};
    const userId = req.user._id;

    const video = await Video.findById(videoId).populate('playlistId');
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    if (!video.playlistId.userId.equals(userId)) {
      return res.status(403).json({ error: 'Access denied - not your playlist' });
    }

    console.log(`AI Tutor question: ${message}`);
    
    // Use general tutor for all questions
    const tutorResponse = await aiHelper.askGeneralTutor(message, provider);

    res.status(200).json({
      message: 'Tutor response generated successfully',
      response: tutorResponse
    });

  } catch (error) {
    console.error('AI tutor error:', error);
    res.status(500).json({
      error: 'Failed to get tutor response',
      message: error.message
    });
  }
};

/**
 * Clear quiz data for a video
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const clearQuiz = async (req, res) => {
  try {
    const { videoId } = req.params;
    const userId = req.user._id;

    const video = await Video.findById(videoId).populate('playlistId');
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    if (!video.playlistId.userId.equals(userId)) {
      return res.status(403).json({ error: 'Access denied - not your playlist' });
    }

    // Clear quiz data
    video.quiz = undefined;
    await video.save();

    res.status(200).json({
      message: 'Quiz cleared successfully'
    });

  } catch (error) {
    console.error('Clear quiz error:', error);
    res.status(500).json({
      error: 'Failed to clear quiz',
      message: error.message
    });
  }
};

/**
 * Get available AI providers
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getProviders = async (req, res) => {
  try {
    const providers = aiHelper.getAvailableProviders();
    
    res.status(200).json({
      providers,
      default: aiHelper.defaultProvider
    });
  } catch (error) {
    console.error('Get providers error:', error);
    res.status(500).json({
      error: 'Failed to get providers',
      message: error.message
    });
  }
};

module.exports = {
  generateSummary,
  generateQuiz,
  generateNotes,
  askTutor,
  clearQuiz,
  getProviders
};
