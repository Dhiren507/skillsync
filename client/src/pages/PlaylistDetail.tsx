import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  ArrowLeft, 
  Play, 
  CheckCircle, 
  Circle, 
  Clock, 
  Star, 
  BookOpen,
  Search,
  Filter,
  MoreVertical,
  Download,
  Share,
  Calendar,
  ChevronDown,
  Brain
} from 'lucide-react';
import {
  Button,
  Input,
  Card,
  CardBody,
  CardHeader,
  Chip,
  Progress,
  Avatar,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Divider,
  Badge
} from '@heroui/react';
import { playlistAPI } from '@/lib/api';
import { formatDuration, formatDurationWords } from '@/utils/timeFormat';

export default function PlaylistDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const { data: playlistResponse, isLoading } = useQuery({
    queryKey: ['playlist', id],
    queryFn: () => playlistAPI.getPlaylist(id!),
    enabled: !!id,
  });

  const playlist = playlistResponse?.data?.playlist;

  // Filter videos by search only (keep YouTube playlist order from backend)
  const filteredVideos = playlist?.videos?.filter((video: any) => {
    return video.title.toLowerCase().includes(searchTerm.toLowerCase());
  }) || [];

  // Separate completed videos for the bottom section (also keep original order)
  const completedVideosList = playlist?.videos?.filter((video: any) => 
    video.status === 'completed'
  ) || [];

  // Find the last watched video (most recent with progress or watching status)
  const lastWatchedVideo = playlist?.videos?.find((video: any) => 
    video.status === 'watching' || (video.watchProgress && video.watchProgress.currentTime > 0)
  );

  // Find the next video to watch (first non-completed video)
  const nextVideo = playlist?.videos?.find((video: any) => video.status !== 'completed');

  const completedVideos = playlist?.videos?.filter((video: any) => video.status === 'completed').length || 0;
  const inProgressVideos = playlist?.videos?.filter((video: any) => video.status === 'watching').length || 0;
  const totalVideos = playlist?.videos?.length || 0;
  const progressPercentage = totalVideos > 0 ? (completedVideos / totalVideos) * 100 : 0;

  // Calculate total duration and watched time
  const totalDuration = playlist?.videos?.reduce((acc: number, video: any) => acc + (video.duration || 0), 0) || 0;
  const watchedDuration = playlist?.videos?.reduce((acc: number, video: any) => {
    if (video.status === 'completed') return acc + (video.duration || 0);
    if (video.watchProgress?.currentTime) return acc + video.watchProgress.currentTime;
    return acc;
  }, 0) || 0;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'watching':
        return 'primary';
      default:
        return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'watching':
        return 'In Progress';
      default:
        return 'Not Started';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-default-500">Loading playlist...</p>
        </div>
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-xl font-semibold">Playlist not found</h2>
          <p className="text-default-500">The playlist you're looking for doesn't exist.</p>
          <Button 
            color="primary" 
            startContent={<ArrowLeft className="w-4 h-4" />}
            onPress={() => navigate('/dashboard')}
          >
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-divider">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Button 
              variant="light" 
              startContent={<ArrowLeft className="w-4 h-4" />}
              onPress={() => navigate('/dashboard')}
            >
              Back to Dashboard
            </Button>
            
            <div className="flex items-center space-x-2">
              <Button variant="flat" startContent={<Share className="w-4 h-4" />}>
                Share
              </Button>
              <Button variant="flat" startContent={<Download className="w-4 h-4" />}>
                Export
              </Button>
              <Dropdown>
                <DropdownTrigger>
                  <Button variant="flat" isIconOnly className="bg-background hover:bg-default-100">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownTrigger>
                <DropdownMenu className="bg-content1 text-foreground border border-divider/50 rounded-lg">
                  <DropdownItem key="edit" className="text-foreground">Edit Playlist</DropdownItem>
                  <DropdownItem key="delete" color="danger">Delete Playlist</DropdownItem>
                </DropdownMenu>
              </Dropdown>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Playlist Header */}
        <Card className="mb-8">
          <CardBody className="p-8">
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Playlist Thumbnail */}
              <div className="flex-shrink-0">
                <div className="w-48 h-32 lg:w-64 lg:h-40 bg-default-100 rounded-xl overflow-hidden">
                  {playlist.videos && playlist.videos.length > 0 ? (
                    <img
                      src={playlist.videos[0].thumbnail || `https://img.youtube.com/vi/${playlist.videos[0].ytVideoId}/hqdefault.jpg`}
                      alt={playlist.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BookOpen className="w-12 h-12 text-default-400" />
                    </div>
                  )}
                </div>
              </div>

              {/* Playlist Info */}
              <div className="flex-1 space-y-6">
                <div>
                  <h1 className="text-3xl lg:text-4xl font-bold mb-2">{playlist.title}</h1>
                  {playlist.description && (
                    <p className="text-default-600 text-lg">{playlist.description}</p>
                  )}
                </div>

                {/* Enhanced Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-content2/50 rounded-lg p-4 text-center hover:bg-content2/70 transition-colors">
                    <div className="text-2xl font-bold text-primary">{totalVideos}</div>
                    <div className="text-sm text-default-500">Total Videos</div>
                    <div className="text-xs text-default-400 mt-1">
                      {formatDuration(totalDuration)} total
                    </div>
                  </div>
                  <div className="bg-content2/50 rounded-lg p-4 text-center hover:bg-content2/70 transition-colors">
                    <div className="text-2xl font-bold text-success">{completedVideos}</div>
                    <div className="text-sm text-default-500">Completed</div>
                    <div className="text-xs text-default-400 mt-1">
                      {formatDuration(watchedDuration)} watched
                    </div>
                  </div>
                  <div className="bg-content2/50 rounded-lg p-4 text-center hover:bg-content2/70 transition-colors">
                    <div className="text-2xl font-bold text-warning">{inProgressVideos}</div>
                    <div className="text-sm text-default-500">In Progress</div>
                    <div className="text-xs text-default-400 mt-1">
                      {totalVideos - completedVideos - inProgressVideos} not started
                    </div>
                  </div>
                  <div className="bg-content2/50 rounded-lg p-4 text-center hover:bg-content2/70 transition-colors">
                    <div className="text-2xl font-bold text-secondary">{Math.round(progressPercentage)}%</div>
                    <div className="text-sm text-default-500">Complete</div>
                    <div className="text-xs text-default-400 mt-1">
                      {formatDuration(totalDuration - watchedDuration)} remaining
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-default-600">Overall Progress</span>
                    <span className="font-semibold">{Math.round(progressPercentage)}%</span>
                  </div>
                  <Progress 
                    value={progressPercentage} 
                    color="primary" 
                    size="lg"
                    className="w-full"
                  />
                </div>

                {/* Action Buttons */}
                <div className="space-y-4">
                  {/* Continue Learning Section */}
                  {lastWatchedVideo && (
                    <Card className="bg-gradient-to-r from-primary-50 to-secondary-50 border-primary-200">
                      <CardBody className="p-6">
                        <div className="flex items-center gap-4">
                          {/* Video Thumbnail */}
                          <div className="flex-shrink-0 relative">
                            <div className="w-24 h-16 bg-default-100 rounded-lg overflow-hidden">
                              <img
                                src={lastWatchedVideo.thumbnail || `https://img.youtube.com/vi/${lastWatchedVideo.ytVideoId}/hqdefault.jpg`}
                                alt={lastWatchedVideo.title}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="absolute inset-0 bg-black/20 rounded-lg flex items-center justify-center">
                              <Play className="w-6 h-6 text-white drop-shadow-lg" />
                            </div>
                          </div>

                          {/* Video Info */}
                          <div className="flex-1 min-w-0">
                            <p className="text-primary-600 font-medium text-sm mb-1">Continue Learning</p>
                            <h3 className="font-semibold text-lg line-clamp-2 mb-2">{lastWatchedVideo.title}</h3>
                            
                            {/* Progress */}
                            {lastWatchedVideo.watchProgress?.percentage > 0 ? (
                              <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-default-600">Progress</span>
                                  <span className="font-medium">{lastWatchedVideo.watchProgress.percentage}%</span>
                                </div>
                                <Progress 
                                  value={lastWatchedVideo.watchProgress.percentage} 
                                  color="primary" 
                                  size="md"
                                  className="w-full"
                                />
                              </div>
                            ) : (
                              <p className="text-default-500 text-sm">Ready to continue</p>
                            )}
                          </div>

                          {/* Continue Button */}
                          <div className="flex-shrink-0">
                            <Button
                              color="primary"
                              size="lg"
                              endContent={<Play className="w-5 h-5" />}
                              onPress={() => navigate(`/playlist/${id}/video/${lastWatchedVideo._id}`)}
                            >
                              Continue
                            </Button>
                          </div>
                        </div>
                      </CardBody>
                    </Card>
                  )}

                  {/* Main Action Buttons */}
                  <div className="flex gap-3">
                    <Button 
                      color="primary" 
                      size="lg"
                      startContent={<Play className="w-5 h-5" />}
                      onPress={() => {
                        if (nextVideo) {
                          navigate(`/playlist/${id}/video/${nextVideo._id}`);
                        }
                      }}
                    >
                      {completedVideos === 0 ? 'Start Learning' : 'Continue Learning'}
                    </Button>
                    
                    {lastWatchedVideo && lastWatchedVideo._id !== nextVideo?._id && (
                      <Button 
                        variant="bordered" 
                        size="lg"
                        startContent={<Clock className="w-5 h-5" />}
                        onPress={() => navigate(`/playlist/${id}/video/${lastWatchedVideo._id}`)}
                      >
                        Resume Last
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Filters and Search */}
        <Card className="mb-6">
          <CardBody className="p-6">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-4 flex-1">
                {/* Search */}
                <Input
                  placeholder="Search videos..."
                  value={searchTerm}
                  onValueChange={setSearchTerm}
                  startContent={<Search className="w-4 h-4 text-default-400" />}
                  className="max-w-xs"
                />
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Videos List */}
        <div className="space-y-4">
          {filteredVideos.length === 0 ? (
            <Card>
              <CardBody className="p-12 text-center">
                <BookOpen className="w-16 h-16 text-default-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No videos found</h3>
                <p className="text-default-500">
                  {searchTerm ? 'Try a different search term' : 'This playlist is empty'}
                </p>
              </CardBody>
            </Card>
          ) : (
            filteredVideos.map((video: any, index: number) => (
              <Card key={video._id} className="hover:shadow-md transition-shadow duration-200 group">
                <CardBody className="p-6">
                  <div className="flex gap-4">
                    {/* Video Number with Status */}
                    <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold relative">
                      {video.status === 'completed' ? (
                        <div className="w-8 h-8 bg-success rounded-full flex items-center justify-center">
                          <CheckCircle className="w-5 h-5 text-white" />
                        </div>
                      ) : video.status === 'watching' ? (
                        <div className="w-8 h-8 bg-warning rounded-full flex items-center justify-center text-white">
                          {index + 1}
                        </div>
                      ) : (
                        <div className="w-8 h-8 bg-default-100 rounded-full flex items-center justify-center">
                          {index + 1}
                        </div>
                      )}
                    </div>

                    {/* Video Thumbnail */}
                    <div className="flex-shrink-0 relative">
                      <div className="w-32 h-20 bg-default-100 rounded-lg overflow-hidden">
                        <img
                          src={video.thumbnail || `https://img.youtube.com/vi/${video.ytVideoId}/hqdefault.jpg`}
                          alt={video.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                          <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                            <Play className="w-4 h-4 text-primary ml-0.5" />
                          </div>
                        </div>
                        
                        {/* Progress bar for partially watched videos */}
                        {video.watchProgress?.percentage > 0 && video.status !== 'completed' && (
                          <div className="absolute bottom-0 left-0 right-0 h-1">
                            <div 
                              className="h-full bg-primary rounded-b-lg transition-all duration-300"
                              style={{ width: `${video.watchProgress.percentage}%` }}
                            />
                          </div>
                        )}
                        
                        {/* Completion badge */}
                        {video.status === 'completed' && (
                          <div className="absolute top-1 right-1">
                            <CheckCircle className="w-5 h-5 text-success bg-white rounded-full" />
                          </div>
                        )}
                      </div>
                      <Chip size="sm" className="absolute -bottom-1 -right-1 text-xs">{formatDuration(video.duration)}</Chip>
                    </div>

                    {/* Video Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                        {video.title}
                      </h3>
                      
                      <div className="flex items-center gap-4 text-sm text-default-500 mb-3">
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {formatDuration(video.duration)}
                        </span>
                        {video.rating > 0 && (
                          <span className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-warning fill-current" />
                            {video.rating}/5
                          </span>
                        )}
                        {video.watchProgress?.lastWatched && (
                          <span className="flex items-center gap-1 text-xs">
                            <Calendar className="w-3 h-3" />
                            {new Date(video.watchProgress.lastWatched).toLocaleDateString()}
                          </span>
                        )}
                      </div>

                      {/* Progress bar for watching videos */}
                      {video.watchProgress?.percentage > 0 && video.status !== 'completed' && (
                        <div className="mb-3">
                          <div className="flex items-center justify-between text-xs text-default-500 mb-1">
                            <span>Progress</span>
                            <span>{video.watchProgress.percentage}%</span>
                          </div>
                          <Progress 
                            value={video.watchProgress.percentage} 
                            color="primary" 
                            size="sm"
                            className="w-full"
                          />
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Chip 
                            color={getStatusColor(video.status)}
                            variant="flat"
                            size="sm"
                          >
                            {getStatusText(video.status)}
                          </Chip>
                          
                          {video === lastWatchedVideo && (
                            <Chip 
                              color="secondary"
                              variant="flat"
                              size="sm"
                            >
                              Last Watched
                            </Chip>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            color="primary"
                            size="sm"
                            endContent={<Play className="w-4 h-4" />}
                            onPress={() => navigate(`/playlist/${id}/video/${video._id}`)}
                          >
                            {video.status === 'completed' ? 'Rewatch' : 'Watch'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardBody>
              </Card>
            ))
          )}
        </div>

        {/* Completed Videos Section */}
        {completedVideosList.length > 0 && (
          <>
            <Divider className="my-8" />
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-4 text-default-800">
                Completed Videos ({completedVideosList.length})
              </h2>
              <div className="grid gap-3">
                {completedVideosList.map((video: any) => (
                  <Card key={`completed-${video._id}`} className="hover:shadow-md transition-shadow duration-200">
                    <CardBody className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Badge content="✓" color="success" size="sm">
                            <div className="w-12 h-8 bg-default-100 rounded flex items-center justify-center">
                              <Play className="w-4 h-4 text-default-500" />
                            </div>
                          </Badge>
                          <div>
                            <h4 className="font-medium text-sm line-clamp-1">{video.title}</h4>
                            <p className="text-xs text-default-500">
                              {formatDuration(video.duration)}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="flat"
                          size="sm"
                          onPress={() => navigate(`/playlist/${id}/video/${video._id}`)}
                        >
                          Rewatch
                        </Button>
                      </div>
                    </CardBody>
                  </Card>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
