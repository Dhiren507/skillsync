import React from 'react';
import { Button, Tooltip } from '@heroui/react';
import { Play, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react';

interface VideoPlayerProps {
  videoId: string;
  title?: string;
  onPrev?: () => void;
  onNext?: () => void;
  onMarkComplete?: () => void;
  disablePrev?: boolean;
  disableNext?: boolean;
  isCompleted?: boolean;
  onControlsMouseEnter?: () => void;
  onControlsMouseLeave?: () => void;
}

const YT_EMBED_URL = (id: string) => `https://www.youtube.com/embed/${id}?rel=0&showinfo=0`;

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videoId,
  title,
  onPrev,
  onNext,
  onMarkComplete,
  disablePrev,
  disableNext,
  isCompleted,
  onControlsMouseEnter,
  onControlsMouseLeave,
}) => {
  return (
    <div className="flex flex-col items-center">
      {/* Video Only - Focused Viewing Experience */}
      <div className="w-full aspect-video rounded-xl overflow-hidden shadow-xl border border-divider/50 bg-gray-900 relative group transition-all duration-300 hover:shadow-2xl mb-3">
        <iframe
          src={YT_EMBED_URL(videoId)}
          title="YouTube video player"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full min-h-[320px]"
        />
        {/* Improved visual focus overlay - simplified */}
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      {/* Separated Navigation Controls - moved away from video */}
      <div 
        className="flex items-center justify-between w-full max-w-md relative mt-2 bg-content1/40 p-3 rounded-lg backdrop-blur-sm"
        onMouseEnter={onControlsMouseEnter}
        onMouseLeave={onControlsMouseLeave}
      >
        <Tooltip content="Previous Video" placement="bottom" delay={500} closeDelay={0}>
          <Button
            variant="flat"
            color="default"
            onClick={onPrev}
            disabled={disablePrev}
            className="flex items-center gap-1.5 transition-all duration-300 hover:bg-primary/10 hover:scale-105 shadow-sm video-control-btn"
            size="sm"
            isIconOnly
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
        </Tooltip>

        {/* Dynamic Complete/Completed Button */}
        <Button
          onClick={onMarkComplete}
          color={isCompleted ? "success" : "primary"}
          variant={isCompleted ? "flat" : "solid"}
          className={`flex items-center gap-2 transition-all duration-300 shadow-md video-btn-hover ${
            isCompleted 
              ? "hover:bg-success/20 hover:text-success" 
              : "bg-gradient-to-r from-primary to-secondary text-white hover:shadow-lg"
          }`}
          size="md"
        >
          {isCompleted ? <CheckCircle className="w-4 h-4 mr-1" /> : <Play className="w-4 h-4 mr-1" />}
          {isCompleted ? 'Completed' : 'Complete'}
        </Button>

        <Tooltip content="Next Video" placement="bottom" delay={500} closeDelay={0}>
          <Button
            variant="flat"
            color="default"
            onClick={onNext}
            disabled={disableNext}
            className="flex items-center gap-1.5 transition-all duration-300 hover:bg-primary/10 hover:scale-105 shadow-sm video-control-btn"
            size="sm"
            isIconOnly
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </Tooltip>
      </div>
    </div>
  );
};

export default VideoPlayer;
