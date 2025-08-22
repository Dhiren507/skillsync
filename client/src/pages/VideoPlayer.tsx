import React from 'react';
import { Spinner, Card, CardBody, Button } from '@heroui/react';
import { FileText, Home } from 'lucide-react';
import { motion } from 'framer-motion';

// Custom Hooks
import { useVideoPlayer } from '@/hooks/useVideoPlayer';

// Components
import VideoPlayerHeader from '@/components/video-player/VideoPlayerHeader';
import EnhancedVideoPlayer from '@/components/video-player/EnhancedVideoPlayer';
import AIContentTabs from '@/components/ai-content/AIContentTabs';
import AnimatedBackground from '@/components/video-player/AnimatedBackground';

// Utils
import { customStyles } from '@/utils/videoPlayerConstants';

/**
 * VideoPlayer page - Main video player with AI content tabs
 */
export default function VideoPlayer() {
  const {
    video,
    playlist,
    videoIndex,
    prevVideo,
    nextVideo,
    isLoading,
    handlePrev,
    handleNext,
    handleMarkComplete,
    navigate,
    playlistId,
    videoId,
  } = useVideoPlayer();
  
  // State to track hover on video controls
  const [controlsHovered, setControlsHovered] = React.useState(false);
  
  // Mouse event handlers for video controls
  const handleControlsMouseEnter = () => setControlsHovered(true);
  const handleControlsMouseLeave = () => setControlsHovered(false);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <Spinner size="lg" color="primary" />
        <p className="mt-4 text-default-500 animate-pulse">Loading content...</p>
      </div>
    );
  }

  // Missing data state
  if (!video || !playlist) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardBody className="text-center py-8">
            <div className="text-3xl mb-4">😕</div>
            <h2 className="text-xl font-bold mb-2">Content Not Found</h2>
            <p className="text-default-500 mb-6">
              The video or playlist you're looking for doesn't exist or you don't have access to it.
            </p>
            <Button 
              color="primary" 
              onClick={() => navigate('/dashboard')}
              startContent={<Home className="w-4 h-4" />}
            >
              Back to Dashboard
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <>
      {/* Custom Styles */}
      <style>{customStyles}</style>
      
      {/* Animated Background */}
      <AnimatedBackground />

      {/* Header */}
      <VideoPlayerHeader 
        video={video}
        playlist={playlist}
        videoIndex={videoIndex}
        playlistId={playlistId!}
      />

      {/* Main Content Split */}
      <div className="flex flex-col md:flex-row flex-1 min-h-0 relative z-10 animate-fade-in-up">
        {/* Left: Video Player - Full Height with Scrollable Content */}
        <EnhancedVideoPlayer
          video={video}
          onPrev={handlePrev}
          onNext={handleNext}
          onMarkComplete={handleMarkComplete}
          disablePrev={!prevVideo}
          disableNext={!nextVideo}
          onControlsMouseEnter={handleControlsMouseEnter}
          onControlsMouseLeave={handleControlsMouseLeave}
        />

        {/* Right: AI Tabs - Full Height Scrollable */}
        <AIContentTabs video={video} videoId={videoId!} />
      </div>
    </>
  );
}
