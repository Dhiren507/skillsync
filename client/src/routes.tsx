import { ReactNode } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';

// Pages
import LoginHeroUI from '@/pages/LoginHeroUI';
import RegisterHeroUI from '@/pages/RegisterHeroUI';
import DashboardHeroUI from '@/pages/DashboardHeroUI';
import Playlists from '@/pages/Playlists';
import AddPlaylistHeroUI from '@/pages/AddPlaylistHeroUI';
import PlaylistDetail from '@/pages/PlaylistDetail';
import VideoPlayer from '@/pages/VideoPlayer';
import Settings from '@/pages/Settings';

/**
 * Protected Route Component - Redirects to login if not authenticated
 */
const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background dark">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

/**
 * Public Route Component - Redirects to dashboard if already authenticated
 */
const PublicRoute = ({ children }: { children: ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background dark">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

/**
 * Application Routes
 */
export default function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginHeroUI />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <RegisterHeroUI />
          </PublicRoute>
        }
      />

      {/* Protected Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardHeroUI />
          </ProtectedRoute>
        }
      />
      <Route
        path="/playlists"
        element={
          <ProtectedRoute>
            <Playlists />
          </ProtectedRoute>
        }
      />
      <Route
        path="/add-playlist"
        element={
          <ProtectedRoute>
            <AddPlaylistHeroUI />
          </ProtectedRoute>
        }
      />
      <Route
        path="/playlist/:id"
        element={
          <ProtectedRoute>
            <PlaylistDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/playlist/:playlistId/video/:videoId"
        element={
          <ProtectedRoute>
            <VideoPlayer />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        }
      />

      {/* Redirect root to dashboard */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      
      {/* Catch all route */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
