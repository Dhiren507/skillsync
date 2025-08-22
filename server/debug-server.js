const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

console.log('🔍 Debugging server startup...');

// Import routes
console.log('📁 Loading auth routes...');
const authRoutes = require('./routes/auth');

console.log('📁 Loading playlist routes...');
const playlistRoutes = require('./routes/playlist');

console.log('📁 Loading video routes...');
const videoRoutes = require('./routes/video');

console.log('📁 Loading ai routes...');
const aiRoutes = require('./routes/ai');

console.log('📁 Loading middleware...');
const { authenticateToken } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 5000;

console.log('🛠️ Setting up middleware...');
app.use(cors());
app.use(express.json());

console.log('🌐 Adding auth routes...');
app.use('/api/auth', authRoutes);

console.log('🌐 Adding playlist routes...');
app.use('/api/playlists', authenticateToken, playlistRoutes);

console.log('🌐 Adding video routes...');
app.use('/api/videos', authenticateToken, videoRoutes);

console.log('🌐 Adding AI routes...');
app.use('/api/ai', authenticateToken, aiRoutes);

console.log('✅ All routes added successfully');

console.log('🗄️ Connecting to MongoDB...');
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/skillsync')
.then(() => {
  console.log('✅ MongoDB connected successfully');
  app.listen(PORT, () => {
    console.log(`🚀 Debug server running on port ${PORT}`);
  });
})
.catch(err => {
  console.error('❌ MongoDB connection error:', err.message);
  console.log('⚠️ Starting server without MongoDB...');
  app.listen(PORT, () => {
    console.log(`🚀 Debug server running on port ${PORT} (no DB)`);
  });
});
