import axios, { AxiosResponse } from 'axios';

const API_BASE_URL = (import.meta as any).env.VITE_API_URL || 'http://localhost:5000/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log(`🌐 API Request: ${config.method?.toUpperCase()} ${config.url}`, config);
    return config;
  },
  (error) => {
    console.error('🚫 API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url}`, response);
    return response;
  },
  (error) => {
    console.error(`❌ API Response Error: ${error.config?.method?.toUpperCase()} ${error.config?.url}`, error);
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Types
export interface User {
  _id: string;
  email: string;
  name: string;
  preferences: {
    aiProvider: 'gemini' | 'openai' | 'claude';
    autoGenerateSummary: boolean;
    reminderFrequency: 'daily' | 'weekly' | 'never';
  };
  stats: {
    totalPlaylistsAdded: number;
    totalVideosWatched: number;
    currentStreak: number;
    longestStreak: number;
    lastActivity: string;
  };
}

export interface Playlist {
  _id: string;
  title: string;
  description: string;
  url: string;
  thumbnail: string;
  channelTitle: string;
  category: 'programming' | 'design' | 'marketing' | 'business' | 'personal-development' | 'other';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
  totalVideos: number;
  completedVideos: number;
  estimatedDuration: number;
  completionPercentage: number;
  status: 'not_started' | 'in_progress' | 'completed';
  createdAt: string;
  videos?: Video[];
}

export interface Video {
  _id: string;
  title: string;
  description: string;
  ytVideoId: string;
  thumbnail: string;
  duration: number;
  status: 'not_started' | 'watching' | 'completed';
  watchProgress: {
    currentTime: number;
    percentage: number;
    lastWatched?: string;
  };
  summary?: {
    content: string;
    keyPoints: string[];
    timestamps: Array<{
      time: string;
      text: string;
    }>;
  };
  quiz?: {
    questions: Array<{
      question: string;
      options: string[];
      correctAnswer: number;
      explanation?: string;
    }>;
    provider: string;
    generatedAt: string;
  };
  aiNotes?: {
    content: string;
    format: 'bullet' | 'outline' | 'detailed';
    sections: Array<{
      title: string;
      content: string;
      timestamp?: number;
    }>;
    provider: 'gemini' | 'openai' | 'claude';
    generatedAt: string;
  };
  tutorContent?: {
    content: string;
    provider: 'gemini' | 'openai' | 'claude';
    generatedAt: string;
  };
  notes: Array<{
    _id: string;
    content: string;
    timestamp: number;
    createdAt: string;
  }>;
  rating?: number;
}

// Auth API
export const authAPI = {
  register: (data: { email: string; password: string; name?: string }) =>
    api.post<{ user: User; token: string }>('/auth/register', data),
  
  login: (data: { email: string; password: string }) =>
    api.post<{ user: User; token: string }>('/auth/login', data),
  
  getProfile: () =>
    api.get<{ user: User }>('/auth/profile'),
  
  updateProfile: (data: Partial<User>) =>
    api.put<{ user: User }>('/auth/profile', data),
  
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.post('/auth/change-password', data),
  
  getStats: () =>
    api.get<{ stats: User['stats'] }>('/auth/stats'),
};

// Playlist API
export const playlistAPI = {
  getPlaylists: (params?: {
    page?: number;
    limit?: number;
    category?: string;
    status?: string;
    sort?: string;
  }) =>
    api.get<{
      playlists: Playlist[];
      pagination: {
        currentPage: number;
        totalPages: number;
        totalPlaylists: number;
        hasNext: boolean;
        hasPrev: boolean;
      };
    }>('/playlists', { params }),
  
  getPlaylist: (id: string) =>
    api.get<{ playlist: Playlist }>(`/playlists/${id}`),
  
  addPlaylist: (data: {
    url: string;
    category?: string;
    difficulty?: string;
    tags?: string[];
    isPublic?: boolean;
  }) =>
    api.post<{ playlist: Playlist }>('/playlists', data),
  
  updatePlaylist: (id: string, data: Partial<Playlist>) =>
    api.put<{ playlist: Playlist }>(`/playlists/${id}`, data),
  
  deletePlaylist: (id: string) =>
    api.delete(`/playlists/${id}`),
  
  refreshPlaylist: (id: string) =>
    api.post(`/playlists/${id}/refresh`),
  
  searchYouTube: (query: string, maxResults?: number) =>
    api.get<{ results: any[] }>('/playlists/search/youtube', {
      params: { q: query, maxResults },
    }),
};

// Video API
export const videoAPI = {
  getVideo: (id: string) =>
    api.get<{ video: Video }>(`/videos/${id}`),
  
  getLastWatchedVideo: () =>
    api.get<{ video: Video | null }>('/videos/last-watched'),
  
  updateVideoStatus: (id: string, data: {
    status: 'not_started' | 'watching' | 'completed';
    currentTime?: number;
    duration?: number;
  }) =>
    api.put(`/videos/${id}/status`, data),

  updateVideoProgress: (id: string, data: {
    currentTime: number;
    duration?: number;
    percentage?: number;
  }) =>
    api.put(`/videos/${id}/progress`, data),
  
  addNote: (id: string, data: { content: string; timestamp?: number }) =>
    api.post(`/videos/${id}/notes`, data),
  
  deleteNote: (videoId: string, noteId: string) =>
    api.delete(`/videos/${videoId}/notes/${noteId}`),
  
  rateVideo: (id: string, rating: number) =>
    api.put(`/videos/${id}/rating`, { rating }),
};

// AI API
export const aiAPI = {
  generateSummary: (videoId: string, provider?: string) =>
    api.post<{ summary: Video['summary'] }>(`/ai/summary/${videoId}`, { provider }),
  
  generateQuiz: (videoId: string, options?: { 
    provider?: string;
    questionCount?: number;
  }) =>
    api.post(`/ai/quiz/${videoId}`, options || {}),
  
  clearQuiz: (videoId: string) =>
    api.delete(`/ai/quiz/${videoId}`),
  
  generateNotes: (videoId: string, options?: { 
    format?: 'bullet' | 'outline' | 'detailed';
    provider?: string;
  }) =>
    api.post<{ notes: Video['aiNotes'] }>(`/ai/notes/${videoId}`, options || {}),
  
  askTutor: (videoId: string, message: string) =>
    api.post<{ response: string }>(`/ai/tutor/${videoId}`, { message }),
  
  getProviders: () =>
    api.get<{ providers: string[]; default: string }>('/ai/providers'),
};

export default api;
