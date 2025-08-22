const Playlist = require('../../models/Playlist');
const Video = require('../../models/Video');
const User = require('../../models/User');

/**
 * Get user's playlists with pagination and filtering
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getPlaylists = async (req, res) => {
  try {
    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const { category, status, sort = 'newest' } = req.query;

    // Build query
    const query = { userId };
    if (category) query.category = category;

    // Build sort object
    let sortObj = {};
    switch (sort) {
      case 'oldest':
        sortObj = { createdAt: 1 };
        break;
      case 'title':
        sortObj = { title: 1 };
        break;
      case 'progress':
        sortObj = { completedVideos: -1, totalVideos: -1 };
        break;
      default: // newest
        sortObj = { createdAt: -1 };
    }

    const skip = (page - 1) * limit;

    // Get playlists with pagination
    let playlists = await Playlist.find(query)
      .populate('videos', 'title status duration ytVideoId thumbnail')
      .sort(sortObj)
      .skip(skip)
      .limit(limit)
      .lean();

    // Filter by status if provided
    if (status) {
      playlists = playlists.filter(playlist => {
        const playlistStatus = playlist.completedVideos === 0 ? 'not_started' :
                             playlist.completedVideos === playlist.totalVideos ? 'completed' : 
                             'in_progress';
        return playlistStatus === status;
      });
    }

    // Get total count for pagination
    const totalPlaylists = await Playlist.countDocuments(query);
    const totalPages = Math.ceil(totalPlaylists / limit);

    // Add computed fields
    playlists = playlists.map(playlist => ({
      ...playlist,
      completionPercentage: playlist.totalVideos > 0 ? 
        Math.round((playlist.completedVideos / playlist.totalVideos) * 100) : 0,
      status: playlist.completedVideos === 0 ? 'not_started' :
              playlist.completedVideos === playlist.totalVideos ? 'completed' : 
              'in_progress'
    }));

    res.json({
      message: 'Playlists retrieved successfully',
      playlists,
      pagination: {
        currentPage: page,
        totalPages,
        totalPlaylists,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Get playlists error:', error);
    res.status(500).json({
      error: 'Failed to fetch playlists',
      message: 'Internal server error'
    });
  }
};

/**
 * Get a single playlist with its videos
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getPlaylist = async (req, res) => {
  try {
    const playlistId = req.params.id;
    const userId = req.user._id;

    const playlist = await Playlist.findOne({ _id: playlistId, userId })
      .populate({
        path: 'videos',
        select: 'title description duration status ytVideoId thumbnail summary quiz notes rating publishedAt position',
        options: { sort: { position: 1, createdAt: 1 } }  // Sort by position first, then creation time as fallback
      });

    if (!playlist) {
      return res.status(404).json({
        error: 'Playlist not found',
        message: 'Playlist not found or you do not have access to it'
      });
    }

    // Check if any videos are missing position data and fix them
    const videosWithoutPosition = playlist.videos.filter(video => video.position === undefined || video.position === null);
    if (videosWithoutPosition.length > 0) {
      try {
        console.log(`Found ${videosWithoutPosition.length} videos without position data, fetching from YouTube...`);
        const youtubeAPI = require('../../utils/youtubeApi');
        const youtubeVideos = await youtubeAPI.getPlaylistVideos(playlist.ytPlaylistId, 200);
        
        // Create a map of ytVideoId to position from YouTube
        const positionMap = new Map();
        youtubeVideos.forEach(ytVideo => {
          positionMap.set(ytVideo.ytVideoId, ytVideo.position);
        });

        // Update videos with missing positions
        const updatePromises = videosWithoutPosition.map(async (video) => {
          const ytPosition = positionMap.get(video.ytVideoId);
          if (ytPosition !== undefined) {
            await Video.findByIdAndUpdate(video._id, { position: ytPosition });
            video.position = ytPosition; // Update the in-memory object too
          }
        });

        await Promise.all(updatePromises);
        
        // Re-sort the videos array by position
        playlist.videos.sort((a, b) => (a.position || 999) - (b.position || 999));
        
        console.log('Successfully updated positions for videos');
      } catch (error) {
        console.error('Error updating video positions:', error);
        // Continue with the request even if position update fails
      }
    }

    res.json({
      message: 'Playlist retrieved successfully',
      playlist
    });

  } catch (error) {
    console.error('Get playlist error:', error);
    res.status(500).json({
      error: 'Failed to fetch playlist',
      message: 'Internal server error'
    });
  }
};

/**
 * Update playlist details
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updatePlaylist = async (req, res) => {
  try {
    const playlistId = req.params.id;
    const userId = req.user._id;
    const { category, difficulty, tags, isPublic } = req.body;

    const playlist = await Playlist.findOne({ _id: playlistId, userId });
    if (!playlist) {
      return res.status(404).json({
        error: 'Playlist not found',
        message: 'Playlist not found or you do not have access to it'
      });
    }

    // Update fields
    if (category !== undefined) playlist.category = category;
    if (difficulty !== undefined) playlist.difficulty = difficulty;
    if (tags !== undefined) playlist.tags = tags.map(tag => tag.toLowerCase().trim());
    if (isPublic !== undefined) playlist.isPublic = isPublic;

    playlist.lastUpdated = new Date();
    await playlist.save();

    res.json({
      message: 'Playlist updated successfully',
      playlist
    });

  } catch (error) {
    console.error('Update playlist error:', error);
    res.status(500).json({
      error: 'Failed to update playlist',
      message: 'Internal server error'
    });
  }
};

/**
 * Delete playlist and all associated videos
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const deletePlaylist = async (req, res) => {
  try {
    const playlistId = req.params.id;
    const userId = req.user._id;

    const playlist = await Playlist.findOne({ _id: playlistId, userId });
    if (!playlist) {
      return res.status(404).json({
        error: 'Playlist not found',
        message: 'Playlist not found or you do not have access to it'
      });
    }

    // Delete all associated videos
    await Video.deleteMany({ playlistId });

    // Remove playlist from user's playlists array
    await User.findByIdAndUpdate(userId, {
      $pull: { playlists: playlistId }
    });

    // Delete playlist
    await playlist.deleteOne();

    res.json({
      message: 'Playlist deleted successfully'
    });

  } catch (error) {
    console.error('Delete playlist error:', error);
    res.status(500).json({
      error: 'Failed to delete playlist',
      message: 'Internal server error'
    });
  }
};

module.exports = {
  getPlaylists,
  getPlaylist,
  updatePlaylist,
  deletePlaylist
};
