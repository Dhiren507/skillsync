import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { playlistAPI, videoAPI, Video, Playlist } from '@/lib/api';

export function useVideoPlayer() {
  const { playlistId, videoId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Fetch video and playlist data
  const { data: videoResp, isLoading: videoLoading } = useQuery({ 
    queryKey: ['video', videoId], 
    queryFn: () => videoAPI.getVideo(videoId!), 
    enabled: !!videoId, 
    select: (data) => {
      const video = data.data.video as Video;
      if (process.env.NODE_ENV === 'development' && video?.quiz?.questions) {
        console.log('Video quiz data:', video.quiz.questions.length, 'questions');
      }
      return video;
    }
  });

  const { data: playlistResp, isLoading: playlistLoading } = useQuery({ 
    queryKey: ['playlist', playlistId], 
    queryFn: () => playlistAPI.getPlaylist(playlistId!), 
    enabled: !!playlistId, 
    select: (data) => data.data.playlist as Playlist 
  });

  const video = videoResp;
  const playlist = playlistResp;

  // Video navigation logic
  const videoIndex = useMemo(() => 
    playlist?.videos?.findIndex(v => v._id === videoId) ?? -1, 
    [playlist, videoId]
  );

  const prevVideo = useMemo(() => 
    (playlist?.videos && videoIndex > 0) ? playlist.videos[videoIndex - 1] : null, 
    [playlist, videoIndex]
  );

  const nextVideo = useMemo(() => 
    (playlist?.videos && videoIndex >= 0 && videoIndex < (playlist.videos.length - 1)) 
      ? playlist.videos[videoIndex + 1] : null, 
    [playlist, videoIndex]
  );

  // Mark complete mutation
  const markCompleteMutation = useMutation({ 
    mutationFn: () => videoAPI.updateVideoStatus(videoId!, { 
      status: video?.status === 'completed' ? 'not_started' : 'completed' 
    }), 
    onSuccess: () => { 
      queryClient.invalidateQueries({ queryKey: ['video', videoId] }); 
      queryClient.invalidateQueries({ queryKey: ['playlist', playlistId] }); 
    }, 
  });

  // Navigation handlers
  const handlePrev = () => { 
    if (prevVideo) navigate(`/playlist/${playlistId}/video/${prevVideo._id}`); 
  };

  const handleNext = () => { 
    if (nextVideo) navigate(`/playlist/${playlistId}/video/${nextVideo._id}`); 
  };

  const handleMarkComplete = () => { 
    markCompleteMutation.mutate(); 
  };

  return {
    // Data
    video,
    playlist,
    videoIndex,
    prevVideo,
    nextVideo,
    
    // Loading states
    isLoading: videoLoading || playlistLoading,
    
    // Handlers
    handlePrev,
    handleNext,
    handleMarkComplete,
    
    // Navigation
    navigate,
    playlistId,
    videoId,
  };
}
