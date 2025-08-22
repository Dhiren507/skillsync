import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Button, Chip, Divider, Avatar, 
  Dropdown, DropdownTrigger, DropdownMenu, DropdownItem 
} from '@heroui/react';
import { 
  ChevronLeft, Trophy, Play, User, Settings, LogOut 
} from 'lucide-react';
import { Video, Playlist } from '@/lib/api';

interface VideoPlayerHeaderProps {
  video: Video;
  playlist: Playlist;
  videoIndex: number;
  playlistId: string;
}

export default function VideoPlayerHeader({
  video,
  playlist,
  videoIndex,
  playlistId,
}: VideoPlayerHeaderProps) {
  const navigate = useNavigate();

  return (
    <header className="w-full bg-background/95 backdrop-blur-lg border-b border-divider/50 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-3">
        {/* Left Side - Navigation & Title */}
        <div className="flex items-center gap-3">
          <Button 
            variant="light" 
            size="sm"
            startContent={<ChevronLeft className="w-4 h-4" />}
            onClick={() => navigate(`/playlist/${playlistId}`)}
            className="hover:bg-default/10 transition-colors"
          >
            Back
          </Button>
          <Divider orientation="vertical" className="h-6" />
          <div className="flex items-center gap-2">
            <h1 className="font-semibold text-base text-foreground line-clamp-1">
              {playlist.title}
            </h1>
            <Chip size="sm" color="primary" variant="flat">
              {videoIndex + 1}/{playlist.videos?.length || 0}
            </Chip>
          </div>
        </div>

        {/* Right Side - Status & User Menu */}
        <div className="flex items-center gap-2">
          <Chip 
            size="sm" 
            color={video.status === 'completed' ? 'success' : 'warning'} 
            variant="flat"
            startContent={video.status === 'completed' ? <Trophy className="w-3 h-3" /> : <Play className="w-3 h-3" />}
          >
            {video.status === 'completed' ? 'Completed' : 'In Progress'}
          </Chip>
          <Dropdown placement="bottom-end">
            <DropdownTrigger>
              <Button isIconOnly variant="flat" aria-label="User menu" className="bg-background hover:bg-default-100">
                <Avatar 
                  name="User" 
                  size="sm" 
                  showFallback 
                  fallback={<User className="w-4 h-4" />} 
                  className="bg-default-100 text-foreground"
                />
              </Button>
            </DropdownTrigger>
            <DropdownMenu aria-label="User menu" className="bg-content1 text-foreground border border-divider/50 rounded-lg">
              <DropdownItem key="profile" startContent={<User className="w-4 h-4" />} className="text-foreground">
                Profile
              </DropdownItem>
              <DropdownItem key="settings" startContent={<Settings className="w-4 h-4" />} className="text-foreground">
                Settings
              </DropdownItem>
              <DropdownItem key="logout" color="danger" startContent={<LogOut className="w-4 h-4" />}>
                Logout
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </div>
      </div>
    </header>
  );
}
