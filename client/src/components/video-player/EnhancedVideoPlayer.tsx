import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardBody, Chip, Progress } from '@heroui/react';
import { 
  Clock, PlayCircle, Brain, ClipboardList, Trophy 
} from 'lucide-react';
import VideoPlayer from '@/components/ui/VideoPlayer';
import { Video } from '@/lib/api';
import { formatDuration, formatDurationWords } from '@/utils/timeFormat';

interface EnhancedVideoPlayerProps {
  video: Video;
  onPrev: () => void;
  onNext: () => void;
  onMarkComplete: () => void;
  disablePrev: boolean;
  disableNext: boolean;
  onControlsMouseEnter?: () => void;
  onControlsMouseLeave?: () => void;
}

export default function EnhancedVideoPlayer({
  video,
  onPrev,
  onNext,
  onMarkComplete,
  disablePrev,
  disableNext,
  onControlsMouseEnter,
  onControlsMouseLeave,
}: EnhancedVideoPlayerProps) {
  return (
    <div className="w-full md:w-1/2 min-w-[400px] max-w-[700px] flex flex-col border-r border-divider/50 bg-background/95 backdrop-blur-lg overflow-hidden">
      <div className="flex flex-col p-4 gap-4 min-h-0">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="flex flex-col gap-4 min-h-0"
        >
          {/* Video Player Card - Updated for focus */}
          <Card className="shadow-xl backdrop-blur-lg border-none bg-background/90 glass-effect flex-shrink-0">
            <CardBody className="p-0 pb-0">
              {/* Video Player */}
              <VideoPlayer
                videoId={video.ytVideoId}
                title={video.title}
                onPrev={onPrev}
                onNext={onNext}
                onMarkComplete={onMarkComplete}
                disablePrev={disablePrev}
                disableNext={disableNext}
                isCompleted={video.status === 'completed'}
                onControlsMouseEnter={onControlsMouseEnter}
                onControlsMouseLeave={onControlsMouseLeave}
              />
            </CardBody>
          </Card>

          {/* Compact Video Information Card */}
          <Card className="shadow-lg backdrop-blur-lg border-none bg-background/90 glass-effect flex-shrink-0">
            <CardBody className="p-4">
              {/* Video Title */}
              <h2 className="font-bold text-lg text-foreground line-clamp-2 leading-tight mb-3">
                {video.title}
              </h2>
              
              {/* Compact Stats Grid */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                {/* Duration */}
                {video.duration && (
                  <Chip 
                    size="sm" 
                    variant="flat" 
                    color="default"
                    startContent={<Clock className="w-3 h-3" />}
                    className="glass-effect bg-default/20 justify-start"
                  >
                    {formatDurationWords(video.duration)}
                  </Chip>
                )}
                
                {/* Completion Status */}
                <Chip 
                  size="sm" 
                  variant="flat" 
                  color={video.status === 'completed' ? 'success' : 'primary'}
                  startContent={video.status === 'completed' ? <Trophy className="w-3 h-3" /> : <PlayCircle className="w-3 h-3" />}
                  className="justify-start"
                >
                  {video.status === 'completed' ? 'Completed' : 'Watching'}
                </Chip>
                
                {/* AI Content Indicators */}
                {video.summary?.content && (
                  <Chip 
                    size="sm" 
                    variant="flat" 
                    color="secondary"
                    startContent={<Brain className="w-3 h-3" />}
                    className="justify-start"
                  >
                    AI Summary
                  </Chip>
                )}
                
                {video.quiz?.questions && video.quiz.questions.length > 0 && (
                  <Chip 
                    size="sm" 
                    variant="flat" 
                    color="warning"
                    startContent={<ClipboardList className="w-3 h-3" />}
                    className="justify-start"
                  >
                    {video.quiz.questions.length} Questions
                  </Chip>
                )}
              </div>
              
              {/* Progress Bar - Compact */}
              {video.watchProgress?.percentage > 0 && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-default-500">
                    <span>Progress</span>
                    <span>{Math.round(video.watchProgress.percentage)}%</span>
                  </div>
                  <Progress 
                    value={video.watchProgress.percentage} 
                    className="h-1.5"
                    color="primary"
                    size="sm"
                  />
                </div>
              )}
            </CardBody>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
