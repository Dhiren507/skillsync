const mongoose = require('mongoose');

const playlistSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  title: {
    type: String,
    required: [true, 'Playlist title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  url: {
    type: String,
    required: [true, 'Playlist URL is required'],
    trim: true,
    validate: {
      validator: function(v) {
        // YouTube playlist URL validation
        return /^https?:\/\/(www\.)?(youtube\.com\/playlist\?list=|youtu\.be\/playlist\?list=)[\w-]+/.test(v);
      },
      message: 'Please provide a valid YouTube playlist URL'
    }
  },
  ytPlaylistId: {
    type: String,
    required: [true, 'YouTube playlist ID is required'],
    trim: true,
    index: true
  },
  thumbnail: {
    type: String,
    trim: true
  },
  channelTitle: {
    type: String,
    trim: true,
    maxlength: [100, 'Channel title cannot exceed 100 characters']
  },
  videos: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Video'
  }],
  totalVideos: {
    type: Number,
    default: 0
  },
  completedVideos: {
    type: Number,
    default: 0
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  category: {
    type: String,
    enum: ['programming', 'design', 'marketing', 'business', 'personal-development', 'other'],
    default: 'other'
  },
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner'
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  estimatedDuration: {
    type: Number, // in minutes
    default: 0
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index for user playlists
playlistSchema.index({ userId: 1, createdAt: -1 });

// Virtual for completion percentage
playlistSchema.virtual('completionPercentage').get(function() {
  if (this.totalVideos === 0) return 0;
  return Math.round((this.completedVideos / this.totalVideos) * 100);
});

// Virtual for status
playlistSchema.virtual('status').get(function() {
  if (this.completedVideos === 0) return 'not_started';
  if (this.completedVideos === this.totalVideos) return 'completed';
  return 'in_progress';
});

// Method to update video counts
playlistSchema.methods.updateVideoCount = async function() {
  const Video = mongoose.model('Video');
  
  // Count total videos
  this.totalVideos = await Video.countDocuments({ playlistId: this._id });
  
  // Count completed videos
  this.completedVideos = await Video.countDocuments({ 
    playlistId: this._id, 
    status: 'completed' 
  });
  
  // Calculate estimated duration
  const videos = await Video.find({ playlistId: this._id }, 'duration');
  this.estimatedDuration = videos.reduce((total, video) => {
    return total + (video.duration || 0);
  }, 0);
  
  this.lastUpdated = new Date();
  
  return this.save();
};

// Method to add video to playlist
playlistSchema.methods.addVideo = function(videoId) {
  if (!this.videos.includes(videoId)) {
    this.videos.push(videoId);
    this.totalVideos += 1;
  }
  return this.save();
};

// Method to remove video from playlist
playlistSchema.methods.removeVideo = function(videoId) {
  this.videos = this.videos.filter(id => !id.equals(videoId));
  this.totalVideos = Math.max(0, this.totalVideos - 1);
  return this.save();
};

// Static method to find user playlists
playlistSchema.statics.findByUser = function(userId, options = {}) {
  const { page = 1, limit = 10, sort = '-createdAt' } = options;
  const skip = (page - 1) * limit;
  
  return this.find({ userId })
    .populate('videos', 'title status duration')
    .sort(sort)
    .skip(skip)
    .limit(limit);
};

// Static method to get playlist with video details
playlistSchema.statics.findWithVideos = function(playlistId, userId) {
  return this.findOne({ _id: playlistId, userId })
    .populate({
      path: 'videos',
      select: 'title description duration status ytVideoId thumbnail summary quiz',
      options: { sort: { createdAt: 1 } }
    });
};

// Pre-remove middleware to clean up associated videos
playlistSchema.pre('deleteOne', { document: true, query: false }, async function() {
  const Video = mongoose.model('Video');
  await Video.deleteMany({ playlistId: this._id });
});

// Ensure virtual fields are serialized
playlistSchema.set('toJSON', { virtuals: true });
playlistSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Playlist', playlistSchema);
