import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Play, Clock, Users, ExternalLink, Trash2 } from 'lucide-react';
import { Button, Input, Card } from '@heroui/react';
import { playlistAPI } from '@/lib/api';
import type { Playlist } from '@/lib/api';

export default function Playlists() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const { data: playlistsResponse, isLoading } = useQuery({
    queryKey: ['playlists'],
    queryFn: () => playlistAPI.getPlaylists(),
  });

  const playlists = playlistsResponse?.data.playlists || [];

  const addPlaylistMutation = useMutation({
    mutationFn: (url: string) => playlistAPI.addPlaylist({ url }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
      setYoutubeUrl('');
      setIsAdding(false);
    },
  });

  const deletePlaylistMutation = useMutation({
    mutationFn: (id: string) => playlistAPI.deletePlaylist(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
    },
  });

  const filteredPlaylists = playlists.filter(playlist =>
    playlist.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddPlaylist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!youtubeUrl.trim()) return;
    addPlaylistMutation.mutate(youtubeUrl);
  };

  const handleDeletePlaylist = (playlist: Playlist) => {
    if (window.confirm(`Are you sure you want to delete "${playlist.title}"? This action cannot be undone.`)) {
      deletePlaylistMutation.mutate(playlist._id);
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            My Playlists
          </h1>
          <p className="text-gray-600">Manage your YouTube learning playlists</p>
        </div>

        {/* Search and Add Section */}
        <div className="mb-8 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              placeholder="Search playlists..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white/80 backdrop-blur-sm border-white/20"
            />
          </div>

          {/* Add Playlist */}
          <Card className="bg-white/80 backdrop-blur-sm border-white/20">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  <h2 className="text-lg font-semibold">Add New Playlist</h2>
                </div>
              </div>

              {!isAdding ? (
                <Button 
                  onClick={() => setIsAdding(true)}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add YouTube Playlist
                </Button>
              ) : (
                <form onSubmit={handleAddPlaylist} className="space-y-4">
                  <Input
                    placeholder="Enter YouTube playlist URL..."
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <Button 
                      type="submit" 
                      disabled={addPlaylistMutation.isPending}
                      className="bg-gradient-to-r from-blue-600 to-purple-600"
                    >
                      {addPlaylistMutation.isPending ? 'Adding...' : 'Add Playlist'}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        setIsAdding(false);
                        setYoutubeUrl('');
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </Card>
        </div>

        {/* Playlists Grid */}
        {filteredPlaylists.length === 0 ? (
          <Card className="bg-white/80 backdrop-blur-sm border-white/20">
            <div className="p-4 text-center">
              <div className="text-gray-400 mb-4">
                <Play className="h-16 w-16 mx-auto mb-4" />
              </div>
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No playlists found</h3>
              <p className="text-gray-500 mb-4">
                {searchTerm ? 'Try adjusting your search terms' : 'Add your first YouTube playlist to get started'}
              </p>
              {!searchTerm && (
                <Button 
                  onClick={() => setIsAdding(true)}
                  className="bg-gradient-to-r from-blue-600 to-purple-600"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Playlist
                </Button>
              )}
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPlaylists.map((playlist) => (
              <Card 
                key={playlist._id} 
                className="bg-white/80 backdrop-blur-sm border-white/20 hover:shadow-lg transition-all duration-300 hover:scale-105"
              >
                <div className="p-4">
                  <div className="aspect-video bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
                    {playlist.thumbnail ? (
                      <img 
                        src={playlist.thumbnail} 
                        alt={playlist.title}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <Play className="h-12 w-12 text-blue-600" />
                    )}
                  </div>
                  <h2 className="line-clamp-2 text-lg font-semibold mb-2">{playlist.title}</h2>
                  {playlist.description && (
                    <p className="text-sm text-gray-600 line-clamp-2 mb-4">{playlist.description}</p>
                  )}

                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>{playlist.videos?.length || 0} videos</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{formatDuration(playlist.estimatedDuration || 0)}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={() => navigate(`/playlist/${playlist._id}`)}
                    >
                      <Play className="h-4 w-4 mr-2" />
                      View Playlist
                    </Button>
                    
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="flex-1"
                        onClick={() => window.open(playlist.url, '_blank')}
                        title="Open on YouTube"
                      >
                        <ExternalLink className="h-4 w-4 mr-1" />
                        YouTube
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeletePlaylist(playlist)}
                        disabled={deletePlaylistMutation.isPending}
                        className="flex-1 text-red-600 hover:text-red-800 hover:bg-red-50 border-red-300"
                        title="Delete playlist"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
