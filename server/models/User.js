const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  passwordHash: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long']
  },
  name: {
    type: String,
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  playlists: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Playlist'
  }],
  preferences: {
    aiProvider: {
      type: String,
      enum: ['gemini', 'openai', 'claude'],
      default: 'gemini'
    },
    autoGenerateSummary: {
      type: Boolean,
      default: false
    },
    reminderFrequency: {
      type: String,
      enum: ['daily', 'weekly', 'never'],
      default: 'weekly'
    }
  },
  stats: {
    totalVideosWatched: {
      type: Number,
      default: 0
    },
    totalPlaylistsAdded: {
      type: Number,
      default: 0
    },
    currentStreak: {
      type: Number,
      default: 0
    },
    longestStreak: {
      type: Number,
      default: 0
    },
    lastActivity: {
      type: Date,
      default: Date.now
    }
  }
}, {
  timestamps: true
});

// Index is already created by unique: true in schema field definition
// userSchema.index({ email: 1 }); // Removed duplicate index

// Virtual for playlist count
userSchema.virtual('playlistCount').get(function() {
  return this.playlists.length;
});

// Method to check password
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.passwordHash);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

// Method to update activity streak
userSchema.methods.updateStreak = function() {
  const today = new Date();
  const lastActivity = this.stats.lastActivity;
  
  // Check if last activity was yesterday
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  if (this.isSameDay(lastActivity, yesterday)) {
    // Continue streak
    this.stats.currentStreak += 1;
  } else if (!this.isSameDay(lastActivity, today)) {
    // Reset streak if not today
    this.stats.currentStreak = 1;
  }
  
  // Update longest streak
  if (this.stats.currentStreak > this.stats.longestStreak) {
    this.stats.longestStreak = this.stats.currentStreak;
  }
  
  this.stats.lastActivity = today;
};

// Helper method to check if two dates are the same day
userSchema.methods.isSameDay = function(date1, date2) {
  return date1.getDate() === date2.getDate() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getFullYear() === date2.getFullYear();
};

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('passwordHash')) {
    return next();
  }

  try {
    // Hash password with cost of 12
    const saltRounds = 12;
    this.passwordHash = await bcrypt.hash(this.passwordHash, saltRounds);
    next();
  } catch (error) {
    next(error);
  }
});

// Static method to find user by email
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

// Remove passwordHash from JSON output
userSchema.methods.toJSON = function() {
  const userObject = this.toObject();
  delete userObject.passwordHash;
  return userObject;
};

module.exports = mongoose.model('User', userSchema);
