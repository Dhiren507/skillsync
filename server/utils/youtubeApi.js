const axios = require('axios');
const { YoutubeTranscript } = require('youtube-transcript');

class YouTubeAPI {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseURL = 'https://www.googleapis.com/youtube/v3';
  }

  /**
   * Extract playlist ID from YouTube URL
   * @param {string} url - YouTube playlist URL
   * @returns {string|null} - Playlist ID or null if invalid
   */
  extractPlaylistId(url) {
    try {
      const patterns = [
        /[?&]list=([a-zA-Z0-9_-]+)/,
        /\/playlist\?list=([a-zA-Z0-9_-]+)/,
        /youtu\.be\/.*[?&]list=([a-zA-Z0-9_-]+)/
      ];

      for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match && match[1]) {
          return match[1];
        }
      }

      return null;
    } catch (error) {
      console.error('Error extracting playlist ID:', error);
      return null;
    }
  }

  /**
   * Extract video ID from YouTube URL
   * @param {string} url - YouTube video URL
   * @returns {string|null} - Video ID or null if invalid
   */
  extractVideoId(url) {
    try {
      const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
        /youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/
      ];

      for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match && match[1]) {
          return match[1];
        }
      }

      return null;
    } catch (error) {
      console.error('Error extracting video ID:', error);
      return null;
    }
  }

  /**
   * Parse YouTube duration format (PT1H2M3S) to seconds
   * @param {string} duration - YouTube duration string
   * @returns {number} - Duration in seconds
   */
  parseDuration(duration) {
    try {
      const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
      if (!match) return 0;

      const hours = parseInt(match[1] || 0);
      const minutes = parseInt(match[2] || 0);
      const seconds = parseInt(match[3] || 0);

      return hours * 3600 + minutes * 60 + seconds;
    } catch (error) {
      console.error('Error parsing duration:', error);
      return 0;
    }
  }

  /**
   * Get playlist details from YouTube API
   * @param {string} playlistId - YouTube playlist ID
   * @returns {Object} - Playlist details
   */
  async getPlaylistDetails(playlistId) {
    try {
      const response = await axios.get(`${this.baseURL}/playlists`, {
        params: {
          key: this.apiKey,
          id: playlistId,
          part: 'snippet,contentDetails,status',
          maxResults: 1
        }
      });

      if (!response.data.items || response.data.items.length === 0) {
        throw new Error('Playlist not found or is private');
      }

      const playlist = response.data.items[0];
      
      return {
        id: playlist.id,
        title: playlist.snippet.title,
        description: playlist.snippet.description,
        channelTitle: playlist.snippet.channelTitle,
        channelId: playlist.snippet.channelId,
        thumbnail: this.getBestThumbnail(playlist.snippet.thumbnails),
        publishedAt: playlist.snippet.publishedAt,
        itemCount: playlist.contentDetails.itemCount,
        privacyStatus: playlist.status?.privacyStatus || 'public'
      };
    } catch (error) {
      console.error('Error fetching playlist details:', error);
      
      if (error.response) {
        if (error.response.status === 403) {
          throw new Error('YouTube API quota exceeded or invalid API key');
        }
        if (error.response.status === 404) {
          throw new Error('Playlist not found');
        }
      }
      
      throw new Error('Failed to fetch playlist details');
    }
  }

  /**
   * Get all videos from a playlist
   * @param {string} playlistId - YouTube playlist ID
   * @param {number} maxResults - Maximum number of videos to fetch (default: 50)
   * @returns {Array} - Array of video objects
   */
  async getPlaylistVideos(playlistId, maxResults = 50) {
    try {
      let videos = [];
      let nextPageToken = null;

      do {
        const response = await axios.get(`${this.baseURL}/playlistItems`, {
          params: {
            key: this.apiKey,
            playlistId: playlistId,
            part: 'snippet,contentDetails',
            maxResults: Math.min(maxResults - videos.length, 50), // YouTube API max is 50 per request
            pageToken: nextPageToken
          }
        });

        if (response.data.items) {
          // Filter out deleted/private videos
          const validVideos = response.data.items.filter(item => 
            item.snippet.title !== 'Deleted video' && 
            item.snippet.title !== 'Private video' &&
            item.contentDetails.videoId
          );

          videos.push(...validVideos);
        }

        nextPageToken = response.data.nextPageToken;
        
        // Stop if we've reached the desired number of videos
        if (videos.length >= maxResults) {
          videos = videos.slice(0, maxResults);
          break;
        }

      } while (nextPageToken && videos.length < maxResults);

      // Get video details (duration, etc.) in batches
      const videoDetails = await this.getVideoDetails(videos.map(v => v.contentDetails.videoId));

      // Combine playlist video data with detailed video data
      return videos.map((video, index) => {
        const details = videoDetails.find(d => d.id === video.contentDetails.videoId) || {};
        
        return {
          ytVideoId: video.contentDetails.videoId,
          title: video.snippet.title,
          description: video.snippet.description,
          thumbnail: this.getBestThumbnail(video.snippet.thumbnails),
          channelTitle: video.snippet.channelTitle,
          publishedAt: video.snippet.publishedAt,
          position: video.snippet.position,
          duration: details.duration || 0,
          viewCount: details.viewCount || 0,
          likeCount: details.likeCount || 0,
          tags: details.tags || []
        };
      });

    } catch (error) {
      console.error('Error fetching playlist videos:', error);
      
      if (error.response) {
        if (error.response.status === 403) {
          throw new Error('YouTube API quota exceeded or invalid API key');
        }
        if (error.response.status === 404) {
          throw new Error('Playlist not found or is private');
        }
      }
      
      throw new Error('Failed to fetch playlist videos');
    }
  }

  /**
   * Get detailed information for multiple videos
   * @param {Array} videoIds - Array of YouTube video IDs
   * @returns {Array} - Array of detailed video objects
   */
  async getVideoDetails(videoIds) {
    try {
      if (!videoIds || videoIds.length === 0) {
        return [];
      }

      const details = [];
      const batchSize = 50; // YouTube API allows up to 50 IDs per request

      // Process videos in batches
      for (let i = 0; i < videoIds.length; i += batchSize) {
        const batch = videoIds.slice(i, i + batchSize);
        
        const response = await axios.get(`${this.baseURL}/videos`, {
          params: {
            key: this.apiKey,
            id: batch.join(','),
            part: 'contentDetails,statistics,snippet'
          }
        });

        if (response.data.items) {
          const batchDetails = response.data.items.map(video => ({
            id: video.id,
            duration: this.parseDuration(video.contentDetails.duration),
            viewCount: parseInt(video.statistics.viewCount || 0),
            likeCount: parseInt(video.statistics.likeCount || 0),
            commentCount: parseInt(video.statistics.commentCount || 0),
            tags: video.snippet.tags || [],
            categoryId: video.snippet.categoryId,
            defaultLanguage: video.snippet.defaultLanguage
          }));

          details.push(...batchDetails);
        }
      }

      return details;
    } catch (error) {
      console.error('Error fetching video details:', error);
      return []; // Return empty array on error to not break the playlist import
    }
  }

  /**
   * Get video transcript
   * @param {string} videoId - YouTube video ID
   * @returns {Object} - Transcript data
   */
  async getVideoTranscript(videoId) {
    try {
      console.log(`Fetching transcript for video: ${videoId}`);
      
      const transcript = await YoutubeTranscript.fetchTranscript(videoId);
      
      if (!transcript || transcript.length === 0) {
        console.log('No transcript available for this video');
        return {
          text: '',
          segments: [],
          available: false
        };
      }

      // Combine all transcript segments into full text
      const fullText = transcript
        .map(segment => segment.text)
        .join(' ')
        .replace(/\[.*?\]/g, '') // Remove things like [Music], [Applause]
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim();

      console.log(`Transcript fetched successfully. Length: ${fullText.length} characters`);

      return {
        text: fullText,
        segments: transcript.map(segment => ({
          start: segment.offset / 1000, // Convert to seconds
          duration: segment.duration / 1000,
          text: segment.text.trim()
        })),
        available: true
      };

    } catch (error) {
      console.log(`Could not fetch transcript for video ${videoId}:`, error.message);
      return {
        text: '',
        segments: [],
        available: false,
        error: error.message
      };
    }
  }

  /**
   * Get the best quality thumbnail URL
   * @param {Object} thumbnails - YouTube thumbnails object
   * @returns {string} - Best thumbnail URL
   */
  getBestThumbnail(thumbnails) {
    if (!thumbnails) return null;

    // Priority: maxres > high > medium > default
    const qualities = ['maxres', 'high', 'medium', 'default'];
    
    for (const quality of qualities) {
      if (thumbnails[quality]) {
        return thumbnails[quality].url;
      }
    }

    return null;
  }

  /**
   * Search for playlists by query
   * @param {string} query - Search query
   * @param {number} maxResults - Maximum results to return
   * @returns {Array} - Array of playlist search results
   */
  async searchPlaylists(query, maxResults = 10) {
    try {
      const response = await axios.get(`${this.baseURL}/search`, {
        params: {
          key: this.apiKey,
          q: query,
          type: 'playlist',
          part: 'snippet',
          maxResults: maxResults
        }
      });

      if (!response.data.items) {
        return [];
      }

      return response.data.items.map(item => ({
        id: item.id.playlistId,
        title: item.snippet.title,
        description: item.snippet.description,
        channelTitle: item.snippet.channelTitle,
        channelId: item.snippet.channelId,
        thumbnail: this.getBestThumbnail(item.snippet.thumbnails),
        publishedAt: item.snippet.publishedAt
      }));

    } catch (error) {
      console.error('Error searching playlists:', error);
      throw new Error('Failed to search playlists');
    }
  }

  /**
   * Validate YouTube API key
   * @returns {boolean} - True if API key is valid
   */
  async validateApiKey() {
    try {
      await axios.get(`${this.baseURL}/search`, {
        params: {
          key: this.apiKey,
          q: 'test',
          type: 'video',
          part: 'snippet',
          maxResults: 1
        }
      });
      return true;
    } catch (error) {
      console.error('YouTube API key validation failed:', error);
      return false;
    }
  }
}

// Create singleton instance
const youtubeAPI = new YouTubeAPI(process.env.YOUTUBE_API_KEY);

module.exports = youtubeAPI;
