# SkillSync - AI-Powered YouTube Learning Platform

SkillSync is a modern, full-stack web application that transforms YouTube playlists into focused, AI-enhanced learning experiences. It provides a distraction-free environment for educational content consumption with powerful AI features.

## 🌟 Features

### Core Functionality
- **Distraction-Free Video Player**: Watch YouTube videos without recommendations and distractions
- **Playlist Management**: Import YouTube playlists and track learning progress
- **Progress Tracking**: Monitor video completion, watch time, and learning streaks
- **User Authentication**: Secure JWT-based authentication system

### AI-Powered Features
- **Smart Summaries**: AI-generated key points and content overviews
- **Interactive Quizzes**: Generated questions with explanations to test understanding
- **AI Notes**: Structured notes in bullet points, outlines, or detailed formats
- **AI Tutor**: Ask questions about video content and get intelligent responses

### Modern UI/UX
- **Dark/Light Mode**: Complete theme system with smooth transitions
- **Responsive Design**: Mobile-first design with optimized layouts
- **Glassmorphism Design**: Modern aesthetic with backdrop blur effects
- **Micro-interactions**: Smooth animations and hover effects

## 🏗️ Tech Stack

### Frontend
- **React 18** with TypeScript for type safety
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **HeroUI** (formerly NextUI) for UI components
- **TanStack Query** (React Query) for server state management
- **React Router DOM** for navigation
- **Framer Motion** for animations
- **Axios** for API communication

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **JWT** authentication with bcryptjs
- **Express Validator** for input validation
- **Helmet, CORS, Rate Limiting** for security
- **Google Gemini Pro & OpenAI APIs** for AI features

## 📁 Project Structure

```
skillsync/
├── client/                 # React frontend application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Route-based page components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # API client and utilities
│   │   ├── types/          # TypeScript type definitions
│   │   └── utils/          # Helper functions
│   ├── package.json
│   └── vite.config.ts
│
└── server/                 # Node.js backend API
    ├── controllers/        # Business logic controllers
    ├── models/            # MongoDB data models
    ├── routes/            # API route definitions
    ├── middleware/        # Custom middleware
    ├── utils/             # Helper utilities
    └── package.json
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- MongoDB (local or cloud)
- YouTube Data API key
- AI API keys (Google Gemini Pro, OpenAI)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Dhiren507/skillsync.git
   cd skillsync
   ```

2. **Setup Backend**
   ```bash
   cd server
   npm install
   
   # Create .env file with your configuration
   cp .env.example .env
   # Edit .env with your API keys and database URL
   
   npm run dev
   ```

3. **Setup Frontend**
   ```bash
   cd ../client
   npm install
   npm run dev
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

### Environment Variables

#### Server (.env)
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/skillsync
JWT_SECRET=your-jwt-secret-key
YOUTUBE_API_KEY=your-youtube-api-key
GEMINI_API_KEY=your-gemini-api-key
OPENAI_API_KEY=your-openai-api-key
```

## 🎯 Core Features Explained

### Authentication System
- Secure user registration and login
- JWT-based session management
- Profile management and statistics tracking

### Playlist Management
- Import YouTube playlists via URL
- Automatic metadata extraction
- Progress tracking and completion status
- Category-based organization

### AI-Enhanced Learning
- **On-Demand Generation**: AI features activate during video watching
- **Multi-Provider Support**: Fallback between Gemini Pro and OpenAI
- **Cost Control**: Smart usage patterns to optimize API costs
- **Real-time Processing**: Streaming responses for better UX

### Video Player Experience
- **Custom YouTube Integration**: Embedded player without distractions
- **Progress Synchronization**: Real-time progress tracking
- **Navigation Controls**: Smooth playlist navigation
- **Responsive Layout**: Optimized for all screen sizes

## 🛠️ Development

### Available Scripts

#### Frontend
```bash
npm run dev          # Development server
npm run build        # Production build
npm run preview      # Preview build
npm run lint         # ESLint checking
```

#### Backend
```bash
npm run dev          # Development with nodemon
npm run start        # Production server
npm run debug        # Debug mode
```

### Project Architecture

The application follows a modular MVC architecture:

- **Controllers**: Handle business logic and request processing
- **Models**: Define data structures and database interactions  
- **Routes**: Define API endpoints and middleware
- **Middleware**: Handle authentication, validation, and security
- **Services**: External API integrations (YouTube, AI providers)

## 🔐 Security Features

- JWT authentication with secure token handling
- Password hashing with bcrypt
- Input validation and sanitization
- Rate limiting for API protection
- CORS configuration
- Security headers with Helmet

## 📊 Database Schema

### User Collection
- Authentication credentials
- Profile information and preferences
- Learning statistics and activity tracking
- AI provider settings

### Playlist Collection
- YouTube playlist metadata
- Video references and completion tracking
- Categories, tags, and difficulty levels
- Public/private settings

### Video Collection
- YouTube video data and metadata
- Watch progress and completion status
- AI-generated content (summaries, quizzes, notes)
- User notes and ratings

## 🤖 AI Integration

The application integrates with multiple AI providers:

### Supported Providers
- **Google Gemini Pro**: Primary AI provider for content generation
- **OpenAI GPT**: Fallback provider with advanced capabilities
- **Claude**: Additional provider support (configurable)

### AI Features
- **Smart Summaries**: Extract key concepts and learning objectives
- **Interactive Quizzes**: Generate contextual questions with explanations
- **Structured Notes**: Create organized notes in multiple formats
- **AI Tutor**: Provide intelligent responses to user questions

## 🚀 Deployment

### Frontend Deployment (Vercel/Netlify)
```bash
cd client
npm run build
# Deploy the dist/ folder
```

### Backend Deployment (Railway/Heroku/DigitalOcean)
```bash
cd server
npm install --production
npm start
```

### Environment Configuration
- Set all required environment variables
- Configure CORS for production domains
- Set up MongoDB connection (MongoDB Atlas recommended)
- Configure API rate limits for production

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- HeroUI for the beautiful component library
- YouTube API for playlist and video data
- Google Gemini Pro and OpenAI for AI capabilities
- The open-source community for various tools and libraries

## 📞 Contact

Dhiren Patel - [@Dhiren507](https://github.com/Dhiren507)

Project Link: [https://github.com/Dhiren507/skillsync](https://github.com/Dhiren507/skillsync)

---

Built with ❤️ for enhanced learning experiences
