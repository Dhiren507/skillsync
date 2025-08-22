const Video = require('../../models/Video');
const Playlist = require('../../models/Playlist');

/**
 * Get the last watched video for the current user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getLastWatchedVideo = async (req, res) => {
  try {
    const userId = req.user._id;

    // Find the most recent video with status 'watching', 'completed', or highest watch progress
    const lastWatchedVideo = await Video.findOne({
      $and: [
        { 'playlistId': { $in: await Playlist.find({ userId }).select('_id') } },
        { 
          $or: [
            { status: 'watching' },
            { status: 'completed' },
            { 'watchProgress.percentage': { $gt: 0 } }
          ] 
        }
      ]
    })
    .populate('playlistId', 'title')
    .sort({ 'watchProgress.lastWatched': -1 })
    .limit(1);

    res.status(200).json({ 
      video: lastWatchedVideo 
    });

  } catch (error) {
    console.error('Get last watched video error:', error);
    res.status(500).json({
      error: 'Failed to get last watched video',
      message: error.message
    });
  }
};

/**
 * Get a single video by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getVideo = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const video = await Video.findById(id).populate('playlistId', 'title userId');
    
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    if (!video.playlistId.userId.equals(userId)) {
      return res.status(403).json({ error: 'Access denied - not your playlist' });
    }

    res.status(200).json({ video });

  } catch (error) {
    console.error('Get video error:', error);
    res.status(500).json({
      error: 'Failed to get video',
      message: error.message
    });
  }
};

/**
 * Update video status
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateVideoStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, currentTime, duration } = req.body;
    const userId = req.user._id;

    const video = await Video.findById(id).populate('playlistId');
    
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    if (!video.playlistId.userId.equals(userId)) {
      return res.status(403).json({ error: 'Access denied - not your playlist' });
    }

    // Update status
    video.status = status;

    // Update lastWatched timestamp when status changes to 'watching' or 'completed'
    if (status === 'watching' || status === 'completed') {
      video.watchProgress.lastWatched = new Date();
    }

    // Update watch progress if provided
    if (currentTime !== undefined) {
      video.watchProgress.currentTime = currentTime;
      
      if (duration) {
        video.watchProgress.percentage = Math.min(Math.round((currentTime / duration) * 100), 100);
      }
    }

    await video.save();

    if (status === 'completed') {
      req.user.stats.totalVideosWatched += 1;
      req.user.updateStreak();
      await req.user.save();
    }

    res.status(200).json({
      message: 'Video status updated successfully',
      video: {
        _id: video._id,
        status: video.status,
        watchProgress: video.watchProgress
      }
    });

  } catch (error) {
    console.error('Update video status error:', error);
    res.status(500).json({
      error: 'Failed to update video status',
      message: error.message
    });
  }
};

/**
 * Update video progress (for real-time tracking)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateVideoProgress = async (req, res) => {
  try {
    const videoId = req.params.id;
    const userId = req.user._id;
    const { currentTime, duration, percentage } = req.body;

    const video = await Video.findById(videoId).populate('playlistId');
    
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    if (!video.playlistId.userId.equals(userId)) {
      return res.status(403).json({ error: 'Access denied - not your playlist' });
    }

    // Update progress
    video.watchProgress.currentTime = currentTime;
    video.watchProgress.lastWatched = new Date();
    
    if (duration) {
      video.duration = duration;
    }
    
    if (percentage) {
      video.watchProgress.percentage = percentage;
    } else if (video.duration) {
      video.watchProgress.percentage = Math.min(Math.round((currentTime / video.duration) * 100), 100);
    }

    // Auto-update status based on progress
    if (video.watchProgress.percentage >= 90 && video.status !== 'completed') {
      video.status = 'completed';
    } else if (video.watchProgress.percentage > 0 && video.status === 'not_started') {
      video.status = 'watching';
    }

    await video.save();

    res.status(200).json({
      message: 'Video progress updated successfully',
      video: {
        _id: video._id,
        watchProgress: video.watchProgress,
        status: video.status
      }
    });

  } catch (error) {
    console.error('Update video progress error:', error);
    res.status(500).json({
      error: 'Failed to update video progress',
      message: error.message
    });
  }
};

module.exports = {
  getLastWatchedVideo,
  getVideo,
  updateVideoStatus,
  updateVideoProgress
};
