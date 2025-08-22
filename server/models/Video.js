const mongoose = require('mongoose');

const timestampSchema = new mongoose.Schema({
  time: {
    type: String,
    required: true,
    trim: true,
    match: [/^\d{1,2}:\d{2}(:\d{2})?$/, 'Time must be in format MM:SS or HH:MM:SS']
  },
  seconds: {
    type: Number,
    required: true,
    min: 0
  },
  text: {
    type: String,
    required: true,
    trim: true,
    maxlength: [500, 'Timestamp text cannot exceed 500 characters']
  }
}, { _id: false });

const quizQuestionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
    trim: true,
    maxlength: [1000, 'Question cannot exceed 1000 characters']
  },
  options: [{
    type: String,
    required: true,
    trim: true,
    maxlength: [500, 'Option cannot exceed 500 characters']
  }],
  correctAnswer: {
    type: Number,
    required: true,
    min: 0,
    max: 3,
    validate: {
      validator: function(v) {
        return v < this.options.length;
      },
      message: 'Correct answer index must be valid for the options array'
    }
  },
  explanation: {
    type: String,
    trim: true,
    maxlength: [1000, 'Explanation cannot exceed 1000 characters']
  }
}, { _id: false });

const quizResultSchema = new mongoose.Schema({
  score: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  totalQuestions: {
    type: Number,
    required: true,
    min: 1
  },
  correctAnswers: {
    type: Number,
    required: true,
    min: 0
  },
  answers: [{
    questionIndex: Number,
    selectedAnswer: Number,
    isCorrect: Boolean,
    timeSpent: Number // in seconds
  }],
  completedAt: {
    type: Date,
    default: Date.now
  }
});

const videoSchema = new mongoose.Schema({
  playlistId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Playlist',
    required: [true, 'Playlist ID is required'],
    index: true
  },
  ytVideoId: {
    type: String,
    required: [true, 'YouTube video ID is required'],
    trim: true,
    index: true, // Keep index for performance, but remove unique constraint
    match: [/^[a-zA-Z0-9_-]{11}$/, 'Invalid YouTube video ID format']
  },
  title: {
    type: String,
    required: [true, 'Video title is required'],
    trim: true,
    maxlength: [500, 'Title cannot exceed 500 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [5000, 'Description cannot exceed 5000 characters']
  },
  thumbnail: {
    type: String,
    trim: true
  },
  duration: {
    type: Number, // in seconds
    min: 0,
    default: 0
  },
  channelTitle: {
    type: String,
    trim: true,
    maxlength: [200, 'Channel title cannot exceed 200 characters']
  },
  publishedAt: {
    type: Date
  },
  position: {
    type: Number,
    min: 0,
    index: true  // Index for efficient sorting
  },
  status: {
    type: String,
    enum: ['not_started', 'watching', 'completed'],
    default: 'not_started',
    index: true
  },
  watchProgress: {
    currentTime: {
      type: Number,
      default: 0,
      min: 0
    },
    percentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    lastWatched: {
      type: Date
    }
  },
  summary: {
    content: {
      type: String,
      trim: true,
      maxlength: [15000, 'Summary cannot exceed 15000 characters']
    },
    timestamps: [timestampSchema],
    generatedAt: {
      type: Date
    },
    aiProvider: {
      type: String,
      enum: ['gemini', 'openai', 'claude']
    }
  },
  quiz: {
    questions: [quizQuestionSchema],
    generatedAt: {
      type: Date
    },
    aiProvider: {
      type: String,
      enum: ['gemini', 'openai', 'claude']
    }
  },
  quizResults: [quizResultSchema],
  aiNotes: {
    content: {
      type: String,
      trim: true,
      maxlength: [15000, 'AI notes cannot exceed 15000 characters']
    },
    format: {
      type: String,
      enum: ['bullet', 'outline', 'detailed'],
      default: 'bullet'
    },
    sections: [{
      title: {
        type: String,
        trim: true,
        maxlength: [500, 'Section title cannot exceed 500 characters']
      },
      content: {
        type: String,
        trim: true,
        maxlength: [10000, 'Section content cannot exceed 10000 characters']
      },
      timestamp: {
        type: Number, // in seconds
        min: 0
      }
    }],
    generatedAt: {
      type: Date
    },
    aiProvider: {
      type: String,
      enum: ['gemini', 'openai', 'claude']
    }
  },
  notes: [{
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: [1000, 'Note cannot exceed 1000 characters']
    },
    timestamp: {
      type: Number, // in seconds
      min: 0
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced']
  },
  rating: {
    type: Number,
    min: 1,
    max: 5
  }
}, {
  timestamps: true
});

// Compound indexes for efficient queries
videoSchema.index({ playlistId: 1, status: 1 });
videoSchema.index({ ytVideoId: 1, playlistId: 1 });

// Virtual for formatted duration
videoSchema.virtual('formattedDuration').get(function() {
  if (!this.duration) return '0:00';
  
  const hours = Math.floor(this.duration / 3600);
  const minutes = Math.floor((this.duration % 3600) / 60);
  const seconds = this.duration % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
});

// Virtual for completion status
videoSchema.virtual('isCompleted').get(function() {
  return this.status === 'completed';
});

// Virtual for watch time percentage
videoSchema.virtual('watchTimePercentage').get(function() {
  if (!this.duration) return 0;
  return Math.round((this.watchProgress.currentTime / this.duration) * 100);
});

// Method to update watch progress
videoSchema.methods.updateProgress = function(currentTime, duration) {
  this.watchProgress.currentTime = currentTime;
  this.watchProgress.lastWatched = new Date();
  
  if (duration) {
    this.duration = duration;
    this.watchProgress.percentage = Math.round((currentTime / duration) * 100);
    
    // Auto-mark as completed if watched 90% or more
    if (this.watchProgress.percentage >= 90 && this.status !== 'completed') {
      this.status = 'completed';
    } else if (this.watchProgress.percentage > 0 && this.status === 'not_started') {
      this.status = 'watching';
    }
  }
  
  return this.save();
};

// Method to mark as completed
videoSchema.methods.markCompleted = async function() {
  this.status = 'completed';
  this.watchProgress.percentage = 100;
  this.watchProgress.lastWatched = new Date();
  
  // Update playlist completion count
  const Playlist = mongoose.model('Playlist');
  const playlist = await Playlist.findById(this.playlistId);
  if (playlist) {
    await playlist.updateVideoCount();
  }
  
  return this.save();
};

// Method to add note
videoSchema.methods.addNote = function(content, timestamp = 0) {
  this.notes.push({
    content,
    timestamp,
    createdAt: new Date()
  });
  return this.save();
};

// Method to generate summary
videoSchema.methods.generateSummary = function(summaryContent, timestamps = [], aiProvider = 'gemini') {
  this.summary = {
    content: summaryContent,
    timestamps: timestamps.map(ts => ({
      time: ts.time,
      seconds: this.parseTimeToSeconds(ts.time),
      text: ts.text
    })),
    generatedAt: new Date(),
    aiProvider
  };
  return this.save();
};

// Method to generate quiz
videoSchema.methods.generateQuiz = function(questions, aiProvider = 'gemini') {
  this.quiz = {
    questions,
    generatedAt: new Date(),
    aiProvider
  };
  return this.save();
};

// Method to save quiz result
videoSchema.methods.saveQuizResult = function(answers, score) {
  const totalQuestions = this.quiz.questions.length;
  const correctAnswers = answers.filter(a => a.isCorrect).length;
  
  this.quizResults.push({
    score,
    totalQuestions,
    correctAnswers,
    answers,
    completedAt: new Date()
  });
  
  return this.save();
};

// Method to generate AI notes
videoSchema.methods.generateNotes = function(notesContent, format = 'bullet', sections = [], aiProvider = 'gemini') {
  this.aiNotes = {
    content: notesContent,
    format,
    sections: sections.map(section => ({
      title: section.title,
      content: section.content,
      timestamp: section.timestamp || 0
    })),
    generatedAt: new Date(),
    aiProvider
  };
  return this.save();
};

// Helper method to parse time string to seconds
videoSchema.methods.parseTimeToSeconds = function(timeString) {
  const parts = timeString.split(':').map(Number);
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1]; // MM:SS
  } else if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2]; // HH:MM:SS
  }
  return 0;
};

// Static method to find videos by playlist
videoSchema.statics.findByPlaylist = function(playlistId, options = {}) {
  const { status, sort = 'createdAt' } = options;
  const query = { playlistId };
  
  if (status) {
    query.status = status;
  }
  
  return this.find(query).sort(sort);
};

// Static method to get video with full details
videoSchema.statics.findWithDetails = function(videoId, playlistId) {
  return this.findOne({ _id: videoId, playlistId })
    .populate('playlistId', 'title userId');
};

// Pre-save middleware to update playlist video count
videoSchema.post('save', async function(doc) {
  if (this.isModified('status')) {
    const Playlist = mongoose.model('Playlist');
    const playlist = await Playlist.findById(doc.playlistId);
    if (playlist) {
      await playlist.updateVideoCount();
    }
  }
});

// Ensure virtual fields are serialized
videoSchema.set('toJSON', { virtuals: true });
videoSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Video', videoSchema);
