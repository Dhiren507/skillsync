import React, { useState, useEffect, Fragment } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import { playlistAPI, authAPI, videoAPI, Playlist, User as ApiUser, Video } from '@/lib/api';
import { formatDuration, formatDurationWords } from '@/utils/timeFormat';
import {
  Button,
  Input,
  Card,
  CardBody,
  CardHeader,
  Chip,
  Divider,
  Avatar,
  Progress,
  Badge,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Tabs,
  Tab,
  Spinner,
} from '@heroui/react';
import {
  Play,
  Plus,
  Search,
  Bell,
  Settings,
  BookOpen,
  Trophy,
  Clock,
  Flame,
  Star,
  Code,
  Palette,
  Briefcase,
  Zap,
  Target,
  TrendingUp,
  Calendar,
  Eye,
  ThumbsUp,
  MoreVertical,
  Edit3,
  Trash2,
  ExternalLink,
  User,
  LogOut,
  Moon,
  Sun,
  RefreshCw,
} from 'lucide-react';

const DashboardHeroUI: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isDarkMode, setIsDarkMode] = useState(true);
  
  // Debounce search query to prevent too many API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.length > 2) {
        setDebouncedSearchQuery(searchQuery);
      } else {
        setDebouncedSearchQuery('');
      }
    }, 1500); // 1.5 seconds delay to be more conservative

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const searchContainer = document.querySelector('[data-search-container]');
      if (searchContainer && !searchContainer.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // React Query for playlists
  const { data: playlistsData, isLoading: playlistsLoading, error: playlistsError } = useQuery({
    queryKey: ['playlists'],
    queryFn: () => playlistAPI.getPlaylists({ limit: 50 }),
    select: (data) => data.data.playlists,
  });

  // React Query for user stats
  const { data: userStats, isLoading: statsLoading, error: statsError } = useQuery({
    queryKey: ['user-stats'],
    queryFn: () => authAPI.getStats(),
    select: (data) => data.data.stats,
  });

  // React Query for last watched video
  const { data: lastWatchedVideo, isLoading: lastVideoLoading, error: lastVideoError } = useQuery({
    queryKey: ['last-watched-video'],
    queryFn: () => videoAPI.getLastWatchedVideo(),
    select: (data) => data.data.video,
    staleTime: 0, // Always consider data stale so it refetches
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  // React Query for YouTube playlist search
  const { data: searchResults, isLoading: searchLoading, error: searchError } = useQuery({
    queryKey: ['youtube-playlist-search', debouncedSearchQuery],
    queryFn: () => playlistAPI.searchYouTube(debouncedSearchQuery, 3), // Reduced to 3 results
    enabled: debouncedSearchQuery.length > 4, // Increased minimum to 4 characters
    staleTime: 5 * 60 * 1000, // 5 minutes
    select: (data) => data.data,
  });

  const playlists = playlistsData || [];
  const loading = playlistsLoading || statsLoading || lastVideoLoading;
  const error = playlistsError || statsError || lastVideoError;

  // Get categories dynamically from playlists
  const categories = ['all', ...new Set(playlists.map((p: Playlist) => p.category))];
  
  // Continue watching - get most recent in-progress playlist
  const continueWatching = playlists
    .filter((p: Playlist) => p.status === 'in_progress')
    .sort((a: Playlist, b: Playlist) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

  // Format duration helper for videos
  const formatVideoDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Calculate accurate playlist statistics
  const calculatePlaylistStats = (playlist: Playlist) => {
    if (!playlist.videos || playlist.videos.length === 0) {
      return {
        totalVideos: playlist.totalVideos || 0,
        completedVideos: playlist.completedVideos || 0,
        totalDuration: playlist.estimatedDuration || 0,
        completionPercentage: playlist.completionPercentage || 0
      };
    }

    // Calculate from actual video data
    const totalVideos = playlist.videos.length;
    const completedVideos = playlist.videos.filter(video => video.status === 'completed').length;
    const totalDuration = playlist.videos.reduce((total, video) => total + video.duration, 0) / 60; // Convert to minutes
    const completionPercentage = totalVideos > 0 ? Math.round((completedVideos / totalVideos) * 100) : 0;

    return {
      totalVideos,
      completedVideos,
      totalDuration: Math.round(totalDuration),
      completionPercentage
    };
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleCreatePlaylist = () => {
    navigate('/add-playlist');
  };

  const handleAddPlaylistFromSearch = (playlist: any) => {
    // Navigate to add playlist page with pre-filled data
    const playlistUrl = `https://www.youtube.com/playlist?list=${playlist.id}`;
    navigate('/add-playlist', { 
      state: { 
        prefillUrl: playlistUrl,
        prefillTitle: playlist.title,
        prefillDescription: playlist.description,
        prefillThumbnail: playlist.thumbnail,
        prefillChannel: playlist.channelTitle
      }
    });
    setShowSearchResults(false);
    setSearchQuery('');
  };

  const filteredPlaylists = selectedCategory === 'all' 
    ? playlists 
    : playlists.filter((playlist: Playlist) => playlist.category === selectedCategory);

  // Helper functions for displaying data
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    const days = Math.floor(diffInHours / 24);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  };

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-default-500">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // --- HEADER (TOP BAR) ---
  const Header = () => (
    <header className="w-full bg-background border-b border-divider sticky top-0 z-30">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-3">
            {/* Logo */}
        <div className="flex items-center gap-2 font-bold text-xl text-primary">
          <BookOpen className="w-7 h-7 text-primary" />
                SkillSync
            </div>
        {/* Search Bar */}
        <div className="flex-1 mx-8 max-w-lg">
              <Input
            placeholder="Search playlists, videos, or topics..."
                value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            size="md"
            variant="bordered"
            className="w-full"
            startContent={<Search className="w-5 h-5 text-default-400" />}
              />
            </div>
              {/* User Menu */}
              <Dropdown>
                <DropdownTrigger>
                  <Button isIconOnly variant="flat" aria-label="User menu" className="bg-background hover:bg-default-100">
                    <Avatar 
                      name={user?.email || 'User'} 
                      size="sm"
                      className="bg-default-100 text-foreground"
                    />
                  </Button>
                </DropdownTrigger>
                <DropdownMenu aria-label="User menu" className="bg-content1 text-foreground border border-divider/50 rounded-lg">
                  <DropdownItem key="profile" startContent={<User className="w-4 h-4" />} className="text-foreground">Profile</DropdownItem>
                  <DropdownItem key="settings" startContent={<Settings className="w-4 h-4" />} className="text-foreground">Settings</DropdownItem>
                  <DropdownItem key="logout" color="danger" startContent={<LogOut className="w-4 h-4" />} onClick={handleLogout}>Logout</DropdownItem>
                </DropdownMenu>
              </Dropdown>
        </div>
      </header>
  );

  // --- MAIN CONTENT ---
  return (
    <Fragment>
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Welcome & Progress */}
        <section className="mb-10">
          <Card className="bg-gradient-to-r from-primary/10 via-secondary/10 to-success/10 rounded-2xl p-8 border-none shadow-none">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
              <div className="space-y-4 flex-1">
                  <h1 className="text-3xl lg:text-4xl font-bold">
                    Welcome back, <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">{user?.email?.split('@')[0] || 'Learner'}!</span>
                  </h1>
                  <p className="text-lg text-default-600">
                  Track your progress through your curated YouTube playlists. You're on a <span className="font-semibold text-primary">{userStats?.currentStreak || 0}-day</span> learning streak! 🔥
                  </p>
                {/* Progress Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
                  <Card className="text-center p-4 bg-background/80 border-none shadow-sm">
                      <div className="text-2xl font-bold text-primary">{userStats?.totalVideosWatched || 0}</div>
                      <div className="text-sm text-default-500">Videos Completed</div>
                  </Card>
                  <Card className="text-center p-4 bg-background/80 border-none shadow-sm">
                      <div className="text-2xl font-bold text-secondary">{playlists.length}</div>
                      <div className="text-sm text-default-500">Your Playlists</div>
                  </Card>
                  <Card className="text-center p-4 bg-background/80 border-none shadow-sm">
                      <div className="text-2xl font-bold text-success">{userStats?.currentStreak || 0}</div>
                      <div className="text-sm text-default-500">Day Streak</div>
                  </Card>
                  <Card className="text-center p-4 bg-background/80 border-none shadow-sm">
                      <div className="text-2xl font-bold text-warning">
                        {playlists.length > 0 
                        ? Math.round(playlists.reduce((acc: number, p: Playlist) => acc + calculatePlaylistStats(p).completionPercentage, 0) / playlists.length)
                          : 0
                        }%
                      </div>
                      <div className="text-sm text-default-500">Avg Progress</div>
                  </Card>
                </div>
              </div>
              {/* Continue Learning */}
              <div className="flex-1 min-w-[320px]">
                  {lastWatchedVideo ? (
                  <Card className="bg-card border rounded-xl p-6 hover:shadow-md transition-shadow duration-200">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                              <Play className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold">Continue Learning</h3>
                          <p className="text-sm text-default-500">Your Learning Path</p>
                            </div>
                          </div>
                          <div className="text-xs text-default-400">
                            {lastWatchedVideo.watchProgress?.lastWatched 
                              ? formatTimeAgo(lastWatchedVideo.watchProgress.lastWatched) 
                          : 'recently'}
                          </div>
                        </div>
                        <div className="flex gap-4">
                          <div className="relative flex-shrink-0">
                            <div className="w-32 h-20 sm:w-40 sm:h-24 rounded-lg overflow-hidden">
                              <img
                                src={lastWatchedVideo.thumbnail}
                                alt={lastWatchedVideo.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                                  <Play className="w-4 h-4 text-primary ml-0.5" />
                                </div>
                              </div>
                            </div>
                            <div className="absolute -bottom-1 -right-1 bg-background/90 text-xs px-2 py-0.5 rounded-md border text-foreground">
                              {formatDurationWords(lastWatchedVideo.duration)}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0 space-y-3">
                        <h4 className="font-medium leading-tight line-clamp-2">{lastWatchedVideo.title}</h4>
                            {lastWatchedVideo.watchProgress?.percentage > 0 && (
                              <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-default-600">Progress</span>
                                  <span className="font-medium">{lastWatchedVideo.watchProgress.percentage}%</span>
                                </div>
                                <div className="w-full bg-default-200 rounded-full h-2">
                                  <div 
                                    className="h-full bg-primary rounded-full transition-all duration-300"
                                    style={{ width: `${lastWatchedVideo.watchProgress.percentage}%` }}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="mt-4 pt-4 border-t">
                          <Button 
                            color="primary" 
                            size="md"
                            className="w-full"
                            endContent={<Play className="w-4 h-4" />}
                        onPress={() => {
                          const playlistId = (lastWatchedVideo && 'playlistId' in (lastWatchedVideo as any))
                            ? (typeof (lastWatchedVideo as any).playlistId === 'object' && (lastWatchedVideo as any).playlistId !== null
                                ? (lastWatchedVideo as any).playlistId._id
                                : (lastWatchedVideo as any).playlistId)
                            : undefined;
                          if (playlistId) {
                            navigate(`/playlist/${playlistId}/video/${lastWatchedVideo._id}`);
                          }
                        }}
                          >
                            Continue Watching
                          </Button>
                    </div>
                  </Card>
                  ) : (
                  <Card className="bg-gradient-to-br from-default-100 to-default-200/50 rounded-2xl p-8 text-center border border-divider">
                        <div className="space-y-4">
                          <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto">
                            <Play className="w-8 h-8 text-primary" />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold mb-2">Start Learning</h3>
                        <p className="text-default-600 mb-6">Add your first YouTube playlist and begin your learning journey!</p>
                            <Button 
                              color="primary" 
                              size="lg"
                              className="px-8 font-semibold"
                              onPress={handleCreatePlaylist}
                              endContent={<Plus className="w-5 h-5" />}
                            >
                              Add Playlist
                            </Button>
                          </div>
                        </div>
                  </Card>
                )}
                      </div>
                    </div>
          </Card>
        </section>

        {/* Main Grid: My Playlists + Sidebar Cards (Quick Actions, Progress, Activity) */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* My Playlists (2/3 width on desktop) */}
          <div className="lg:col-span-2 space-y-8">
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Your YouTube Playlists</h2>
                <div className="flex items-center space-x-4">
                  <Tabs 
                    selectedKey={selectedCategory}
                    onSelectionChange={(key) => setSelectedCategory(key as string)}
                    size="sm"
                    variant="bordered"
                    aria-label="Filter playlists by category"
                  >
                    <Tab key="all" title="All" />
                    {categories.filter(cat => cat !== 'all').map((category: string) => (
                      <Tab 
                        key={category} 
                        title={category.charAt(0).toUpperCase() + category.slice(1).replace('-', ' ')} 
                      />
                    ))}
                  </Tabs>
                  <Button 
                    color="primary" 
                    size="sm"
                    startContent={<Plus className="w-4 h-4" />}
                    onPress={handleCreatePlaylist}
                  >
                    Add Playlist
                  </Button>
                </div>
              </div>
              {/* Playlist Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredPlaylists.map((playlist: Playlist) => (
                  <Card key={playlist._id} className="hover:shadow-lg transition-all duration-300 group">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start w-full">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{playlist.title}</h3>
                        </div>
                        <Dropdown>
                          <DropdownTrigger>
                            <Button isIconOnly size="sm" variant="flat" aria-label="Playlist options" className="bg-background hover:bg-default-100">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownTrigger>
                          <DropdownMenu aria-label="Playlist actions" className="bg-content1 text-foreground border border-divider/50 rounded-lg">
                            <DropdownItem key="edit" startContent={<Edit3 className="w-4 h-4" />} className="text-foreground">Edit</DropdownItem>
                            <DropdownItem key="delete" color="danger" startContent={<Trash2 className="w-4 h-4" />}>Delete</DropdownItem>
                          </DropdownMenu>
                        </Dropdown>
                      </div>
                    </CardHeader>
                    <CardBody className="pt-0">
                      <div className="relative mb-4 group-hover:scale-[1.02] transition-transform duration-300">
                        <img
                          src={playlist.thumbnail}
                          alt={playlist.title}
                          className="w-full h-40 object-cover rounded-lg"
                        />
                        <div className="absolute inset-0 bg-black/30 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            isIconOnly
                            color="primary"
                            size="lg"
                            className="scale-110"
                            aria-label="Play playlist"
                            onPress={() => navigate(`/playlist/${playlist._id}`)}
                          >
                            <Play className="w-6 h-6" />
                          </Button>
                        </div>
                        <div className="absolute top-3 right-3">
                          <Chip size="sm" className="bg-black/50 text-white">
                            {calculatePlaylistStats(playlist).totalVideos} videos
                          </Chip>
                        </div>
                      </div>
                      <div className="space-y-3">
                        {(() => {
                          const stats = calculatePlaylistStats(playlist);
                          return (
                            <>
                              <Progress 
                                value={stats.completionPercentage} 
                                color="primary" 
                                size="sm"
                                className="mb-2"
                              />
                              <div className="flex justify-between items-center text-sm">
                                <div className="flex items-center space-x-4 text-default-500">
                                  <span className="flex items-center">
                                    <Clock className="w-4 h-4 mr-1" />
                                    {formatDuration(stats.totalDuration)}
                                  </span>
                                  <span className="flex items-center">
                                    <Eye className="w-4 h-4 mr-1" />
                                    {stats.completionPercentage}%
                                  </span>
                                </div>
                                <span className="text-default-400">{formatTimeAgo(playlist.createdAt)}</span>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                      <div className="flex space-x-2 mt-4">
                        <Button 
                          color="primary" 
                          size="sm" 
                          className="flex-1"
                          endContent={<Play className="w-4 h-4" />}
                          onPress={() => navigate(`/playlist/${playlist._id}`)}
                        >
                          {playlist.status === 'not_started' ? 'Start' : 'Continue'}
                        </Button>
                        <Button 
                          variant="bordered" 
                          size="sm"
                          endContent={<ExternalLink className="w-4 h-4" />}
                          onPress={() => navigate(`/playlist/${playlist._id}`)}
                        >
                          Details
                        </Button>
                      </div>
                    </CardBody>
                  </Card>
                ))}
              </div>
              {filteredPlaylists.length === 0 && (
                <Card className="text-center py-12">
                  <CardBody>
                    <BookOpen className="w-12 h-12 text-default-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No playlists found</h3>
                    <p className="text-default-500 mb-6">
                      {selectedCategory === 'all' 
                        ? "Add your first YouTube playlist to start learning!"
                        : `No ${selectedCategory} playlists yet. Add one from YouTube to get started!`
                      }
                    </p>
                    <Button 
                      color="primary" 
                      onPress={handleCreatePlaylist}
                      endContent={<Plus className="w-4 h-4" />}
                    >
                      Add Your First YouTube Playlist
                    </Button>
                  </CardBody>
                </Card>
              )}
              {filteredPlaylists.length > 0 && (
                <div className="text-center mt-8">
                  <Button variant="bordered" size="lg">
                    Load More Playlists
                  </Button>
                </div>
              )}
            </div>
          </div>
          {/* Sidebar Cards (Quick Actions, Playlist Progress, Recent Activity) */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Quick Actions</h3>
              </CardHeader>
              <CardBody className="space-y-3">
                <Button
                  variant="bordered"
                  className="w-full justify-start"
                  startContent={<Target className="w-4 h-4" />}
                >
                  Set Progress Goal
                </Button>
                <Button
                  variant="bordered"
                  className="w-full justify-start"
                  startContent={<Settings className="w-4 h-4" />}
                  onPress={() => navigate('/settings')}
                >
                  Settings
                </Button>
              </CardBody>
            </Card>
            {/* Playlist Progress */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold flex items-center">
                  <Trophy className="w-5 h-5 mr-2" />
                  Playlist Progress
                </h3>
              </CardHeader>
              <CardBody className="space-y-3">
                {playlists.slice(0, 3).map((playlist: Playlist) => {
                  const stats = calculatePlaylistStats(playlist);
                  return (
                    <div key={playlist._id} className="flex items-center justify-between p-3 bg-content2/50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center">
                          <BookOpen className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-sm">{playlist.title}</div>
                          <div className="text-xs text-default-500">{stats.totalVideos} videos</div>
                        </div>
                      </div>
                      <Chip size="sm" color="primary" variant="flat">
                        {stats.completionPercentage}%
                      </Chip>
                    </div>
                  );
                })}
                <Button variant="light" size="sm" className="w-full">
                  View All Playlists
                </Button>
              </CardBody>
            </Card>
            {/* Recent Activity (Optional) */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold flex items-center">
                  <Clock className="w-5 h-5 mr-2" />
                  Recent Activity
                </h3>
              </CardHeader>
              <CardBody className="space-y-3">
                {lastWatchedVideo ? (
                  <>
                    <div className="flex items-center space-x-3 p-3 bg-content2/50 rounded-lg">
                      <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center">
                        <Play className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-sm">Watched {lastWatchedVideo.title}</div>
                        <div className="text-xs text-default-500">In progress • {lastWatchedVideo.watchProgress?.lastWatched ? formatTimeAgo(lastWatchedVideo.watchProgress.lastWatched) : 'Recently'}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-content2/50 rounded-lg">
                      <div className="w-8 h-8 bg-secondary/20 rounded-lg flex items-center justify-center">
                        <Plus className="w-4 h-4 text-secondary" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-sm">Added {playlists.length > 0 ? playlists[0].title : 'New Playlist'}</div>
                        <div className="text-xs text-default-500">1 day ago</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-content2/50 rounded-lg">
                      <div className="w-8 h-8 bg-success/20 rounded-lg flex items-center justify-center">
                        <Trophy className="w-4 h-4 text-success" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-sm">{userStats?.currentStreak || 0}-day learning streak!</div>
                        <div className="text-xs text-default-500">Keep it up!</div>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center space-x-3 p-3 bg-content2/50 rounded-lg">
                      <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center">
                        <BookOpen className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-sm">Welcome to SkillSync!</div>
                        <div className="text-xs text-default-500">Add your first playlist to get started</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-content2/50 rounded-lg">
                      <div className="w-8 h-8 bg-secondary/20 rounded-lg flex items-center justify-center">
                        <Plus className="w-4 h-4 text-secondary" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-sm">Ready to learn?</div>
                        <div className="text-xs text-default-500">Import YouTube playlists to track progress</div>
                      </div>
                    </div>
                  </>
                )}
              </CardBody>
            </Card>
          </div>
        </section>
      </main>
    </Fragment>
  );
};

export default DashboardHeroUI;
