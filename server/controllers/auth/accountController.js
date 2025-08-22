const User = require('../../models/User');

/**
 * Delete user account and all associated data
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const deleteAccount = async (req, res) => {
  try {
    const { password } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User not found'
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Account deletion failed',
        message: 'Password is incorrect'
      });
    }

    // Delete all user's playlists and videos
    const Playlist = require('../../models/Playlist');
    const Video = require('../../models/Video');

    const userPlaylists = await Playlist.find({ userId: user._id });
    for (const playlist of userPlaylists) {
      await Video.deleteMany({ playlistId: playlist._id });
      await playlist.deleteOne();
    }

    // Delete user
    await user.deleteOne();

    res.json({
      message: 'Account deleted successfully'
    });

  } catch (error) {
    console.error('Account deletion error:', error);
    res.status(500).json({
      error: 'Account deletion failed',
      message: 'Internal server error'
    });
  }
};

/**
 * Get user statistics
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getStats = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('playlists', 'totalVideos completedVideos category');

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User not found'
      });
    }

    // Calculate additional stats
    const totalPlaylists = user.playlists.length;
    const totalVideos = user.playlists.reduce((sum, playlist) => sum + playlist.totalVideos, 0);
    const completedVideos = user.playlists.reduce((sum, playlist) => sum + playlist.completedVideos, 0);
    const overallProgress = totalVideos > 0 ? Math.round((completedVideos / totalVideos) * 100) : 0;

    const stats = {
      ...user.stats.toObject(),
      totalPlaylists,
      totalVideos,
      completedVideos,
      overallProgress,
      playlistsByCategory: user.playlists.reduce((acc, playlist) => {
        acc[playlist.category] = (acc[playlist.category] || 0) + 1;
        return acc;
      }, {})
    };

    res.json({
      message: 'Statistics retrieved successfully',
      stats
    });

  } catch (error) {
    console.error('Stats fetch error:', error);
    res.status(500).json({
      error: 'Stats fetch failed',
      message: 'Internal server error'
    });
  }
};

module.exports = {
  deleteAccount,
  getStats
};
