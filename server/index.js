const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Import routes
console.log('📁 Loading routes...');
const authRoutes = require('./routes/auth');
const playlistRoutes = require('./routes/playlist');
const videoRoutes = require('./routes/video');
const aiRoutes = require('./routes/ai');

// Import middleware
console.log('📁 Loading middleware...');
const { authenticateToken } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
console.log('🛡️ Setting up security middleware...');
app.use(helmet());
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:5173'
  ],
  credentials: true
}));

// Rate limiting
console.log('⏱️ Setting up rate limiting...');
const { apiLimiter } = require('./middleware/rateLimit/rateLimiters');
app.use('/api/', apiLimiter);

// Body parsing middleware
console.log('📝 Setting up body parsing...');
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Database connection
console.log('🗄️ Connecting to MongoDB...');
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/skillsync')
.then(() => console.log('✅ MongoDB connected successfully'))
.catch(err => {
  console.error('❌ MongoDB connection error:', err);
  // Don't exit on MongoDB connection error for now
  console.log('⚠️ Continuing without MongoDB connection...');
});

// Routes
console.log('🌐 Setting up API routes...');
app.use('/api/auth', authRoutes);
app.use('/api/playlists', authenticateToken, playlistRoutes);
app.use('/api/videos', authenticateToken, videoRoutes);
app.use('/api/ai', authenticateToken, aiRoutes);
console.log('✅ All routes configured successfully');

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'SkillSync API is running',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  
  // Validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      details: Object.values(err.errors).map(e => e.message)
    });
  }
  
  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Invalid token'
    });
  }
  
  // MongoDB duplicate key error
  if (err.code === 11000) {
    return res.status(409).json({
      error: 'Resource already exists'
    });
  }
  
  // Default error
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `${req.method} ${req.originalUrl} not found`
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  mongoose.connection.close(() => {
    console.log('MongoDB connection closed.');
    process.exit(0);
  });
});

app.listen(PORT, () => {
  console.log(`🚀 SkillSync server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
