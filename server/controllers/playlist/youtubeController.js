const Playlist = require('../../models/Playlist');
const Video = require('../../models/Video');
const User = require('../../models/User');
const youtubeAPI = require('../../utils/youtubeApi');

/**
 * Add a new playlist from YouTube
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const addPlaylist = async (req, res) => {
  try {
    const { url, category, difficulty, tags = [], isPublic = false } = req.body;
    const userId = req.user._id;

    // Extract playlist ID from URL
    const ytPlaylistId = youtubeAPI.extractPlaylistId(url);
    if (!ytPlaylistId) {
      return res.status(400).json({
        error: 'Invalid playlist URL',
        message: 'Could not extract playlist ID from the provided URL'
      });
    }

    // Check if playlist already exists for this user
    const existingPlaylist = await Playlist.findOne({ ytPlaylistId, userId });
    if (existingPlaylist) {
      return res.status(409).json({
        error: 'Playlist already exists',
        message: 'You have already added this playlist',
        playlistId: existingPlaylist._id
      });
    }

    // Fetch playlist details from YouTube
    console.log(`Fetching playlist data from YouTube for ID: ${ytPlaylistId}`);
    const playlistData = await youtubeAPI.getPlaylistDetails(ytPlaylistId);
    
    if (!playlistData) {
      return res.status(404).json({
        error: 'Playlist not found',
        message: 'Could not find the playlist on YouTube or it might be private'
      });
    }

    // Fetch videos from the playlist
    console.log(`Fetching videos for playlist: ${playlistData.title}`);
    const youtubeVideos = await youtubeAPI.getPlaylistVideos(ytPlaylistId);
    
    if (!youtubeVideos.length) {
      return res.status(400).json({
        error: 'Empty playlist',
        message: 'The playlist does not contain any videos or they might be private'
      });
    }

    // Calculate estimated duration (in seconds)
    const estimatedDuration = youtubeVideos.reduce(
      (total, video) => total + (video.duration || 0), 
      0
    );

    // Create new playlist
    const playlist = new Playlist({
      userId,
      ytPlaylistId,
      url: `https://www.youtube.com/playlist?list=${ytPlaylistId}`,
      title: playlistData.title,
      description: playlistData.description,
      thumbnail: playlistData.thumbnail,
      channelTitle: playlistData.channelTitle,
      category: category || 'other',
      difficulty: difficulty || 'intermediate',
      tags: tags.map(tag => tag.toLowerCase().trim()),
      totalVideos: youtubeVideos.length,
      estimatedDuration,
      isPublic
    });

    // Create videos for the playlist
    const videoModels = youtubeVideos.map(video => new Video({
      playlistId: playlist._id,
      ytVideoId: video.ytVideoId,
      title: video.title,
      description: video.description || '',
      thumbnail: video.thumbnail,
      duration: video.duration || 0,
      channelTitle: video.channelTitle,
      publishedAt: video.publishedAt,
      position: video.position
    }));

    // Save videos
    const savedVideos = await Video.insertMany(videoModels);
    
    // Store video IDs in playlist
    playlist.videos = savedVideos.map(video => video._id);
    
    // Save playlist
    await playlist.save();
    
    // Add playlist to user's playlists array
    await User.findByIdAndUpdate(userId, {
      $push: { playlists: playlist._id },
      $inc: { 'stats.totalPlaylistsAdded': 1 }
    });

    // Update user's activity and streak
    req.user.updateStreak();
    await req.user.save();

    console.log(`Successfully added playlist: ${playlist.title} with ${savedVideos.length} videos`);
    
    res.status(201).json({
      message: 'Playlist added successfully',
      playlist: {
        ...playlist.toObject(),
        completionPercentage: 0,
        status: 'not_started'
      }
    });

  } catch (error) {
    console.error('Add playlist error:', error);
    res.status(500).json({
      error: 'Failed to add playlist',
      message: error.message || 'Internal server error'
    });
  }
};

/**
 * Refresh playlist data from YouTube
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const refreshPlaylist = async (req, res) => {
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

    console.log(`Refreshing playlist: ${playlist.title}`);

    // Fetch updated playlist info
    const playlistData = await youtubeAPI.getPlaylistDetails(playlist.ytPlaylistId);
    if (!playlistData) {
      return res.status(404).json({
        error: 'Playlist not found on YouTube',
        message: 'Could not find the playlist on YouTube. It might have been deleted or made private.'
      });
    }

    // Update playlist details
    playlist.title = playlistData.title || playlist.title;
    playlist.description = playlistData.description || playlist.description;
    playlist.thumbnail = playlistData.thumbnail || playlist.thumbnail;
    playlist.channelTitle = playlistData.channelTitle || playlist.channelTitle;
    playlist.lastUpdated = new Date();

    // Fetch all videos from YouTube
    const youtubeVideos = await youtubeAPI.getPlaylistVideos(playlist.ytPlaylistId, 200);
    if (!youtubeVideos.length) {
      return res.status(400).json({
        error: 'Empty playlist',
        message: 'The playlist does not contain any videos or they might be private'
      });
    }

    console.log(`Found ${youtubeVideos.length} videos on YouTube for playlist`);

    // Get current videos in the playlist
    const currentVideos = await Video.find({ playlistId: playlist._id });
    
    // Map of existing videos by YouTube video ID
    const existingVideosMap = new Map();
    currentVideos.forEach(video => {
      existingVideosMap.set(video.ytVideoId, video);
    });

    // Track new videos added
    const newVideos = [];
    
    // Update existing videos and add new ones
    for (const ytVideo of youtubeVideos) {
      const existingVideo = existingVideosMap.get(ytVideo.ytVideoId);
      
      if (existingVideo) {
        // Update existing video
        existingVideo.title = ytVideo.title;
        existingVideo.description = ytVideo.description || existingVideo.description;
        existingVideo.thumbnail = ytVideo.thumbnail || existingVideo.thumbnail;
        existingVideo.channelTitle = ytVideo.channelTitle || existingVideo.channelTitle;
        existingVideo.duration = ytVideo.duration || existingVideo.duration;
        existingVideo.position = ytVideo.position;
        existingVideo.lastUpdated = new Date();
        
        await existingVideo.save();
        existingVideosMap.delete(ytVideo.ytVideoId); // Remove from map to track which videos to delete
      } else {
        // Create new video
        const newVideo = new Video({
          playlistId: playlist._id,
          ytVideoId: ytVideo.ytVideoId,
          title: ytVideo.title,
          description: ytVideo.description || '',
          thumbnail: ytVideo.thumbnail,
          duration: ytVideo.duration || 0,
          channelTitle: ytVideo.channelTitle,
          publishedAt: ytVideo.publishedAt,
          position: ytVideo.position
        });
        
        await newVideo.save();
        newVideos.push(newVideo);
        
        // Add to playlist's videos array
        playlist.videos.push(newVideo._id);
      }
    }

    // Remove videos that are no longer in the playlist
    const videosToRemove = Array.from(existingVideosMap.values());
    
    if (videosToRemove.length > 0) {
      console.log(`Removing ${videosToRemove.length} videos that are no longer in the playlist`);
      
      const videoIdsToRemove = videosToRemove.map(video => video._id);
      
      // Update playlist's videos array
      playlist.videos = playlist.videos.filter(videoId => 
        !videoIdsToRemove.some(idToRemove => idToRemove.equals(videoId))
      );
      
      // Delete the videos
      await Video.deleteMany({
        _id: { $in: videoIdsToRemove }
      });
    }

    // Update playlist stats
    const allVideos = await Video.find({ playlistId: playlist._id });
    
    playlist.totalVideos = allVideos.length;
    playlist.completedVideos = allVideos.filter(v => v.status === 'completed').length;
    
    // Recalculate estimated duration
    playlist.estimatedDuration = allVideos.reduce(
      (total, video) => total + (video.duration || 0),
      0
    );

    await playlist.save();

    res.json({
      message: 'Playlist refreshed successfully',
      playlist: {
        ...playlist.toObject(),
        newVideosAdded: newVideos.length,
        videosRemoved: videosToRemove.length,
        completionPercentage: playlist.totalVideos > 0 ? 
          Math.round((playlist.completedVideos / playlist.totalVideos) * 100) : 0,
        status: playlist.completedVideos === 0 ? 'not_started' :
                playlist.completedVideos === playlist.totalVideos ? 'completed' : 
                'in_progress'
      }
    });

  } catch (error) {
    console.error('Refresh playlist error:', error);
    res.status(500).json({
      error: 'Failed to refresh playlist',
      message: error.message || 'Internal server error'
    });
  }
};

/**
 * Search for YouTube playlists
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const searchYouTube = async (req, res) => {
  try {
    const { q, maxResults = 10 } = req.query;
    
    if (!q || q.trim().length < 3) {
      return res.status(400).json({
        error: 'Invalid search query',
        message: 'Search query must be at least 3 characters long'
      });
    }

    console.log(`Searching YouTube for playlists: ${q}`);
    const results = await youtubeAPI.searchPlaylists(q, parseInt(maxResults));
    
    res.json({
      message: 'Search completed successfully',
      results
    });
    
  } catch (error) {
    console.error('YouTube search error:', error);
    res.status(500).json({
      error: 'Failed to search YouTube',
      message: error.message || 'Internal server error'
    });
  }
};

module.exports = {
  addPlaylist,
  refreshPlaylist,
  searchYouTube
};
