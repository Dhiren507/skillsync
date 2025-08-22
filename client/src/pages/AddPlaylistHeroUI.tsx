import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Card, 
  CardBody, 
  CardHeader,
  Button, 
  Input, 
  Chip,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure
} from '@heroui/react';
import { playlistAPI } from '@/lib/api';
import { 
  ArrowLeft, 
  Plus, 
  Youtube, 
  AlertCircle, 
  Sparkles,
  BookOpen
} from 'lucide-react';

// Predefined categories with icons
const PREDEFINED_CATEGORIES = [
  { 
    key: 'programming', 
    label: 'Programming', 
    icon: '💻',
    description: 'Coding, development, and technical skills'
  },
  { 
    key: 'design', 
    label: 'Design', 
    icon: '🎨',
    description: 'UI/UX, graphic design, and creative tools'
  },
  { 
    key: 'marketing', 
    label: 'Marketing', 
    icon: '📈',
    description: 'Digital marketing, SEO, and growth strategies'
  },
  { 
    key: 'business', 
    label: 'Business', 
    icon: '💼',
    description: 'Entrepreneurship, management, and strategy'
  },
  { 
    key: 'personal-development', 
    label: 'Personal Development', 
    icon: '🌱',
    description: 'Self-improvement, productivity, and life skills'
  },
  { 
    key: 'other', 
    label: 'Other', 
    icon: '📚',
    description: 'Miscellaneous topics and general learning'
  }
];

export default function AddPlaylistHeroUI() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  
  // Form state
  const [url, setUrl] = useState('');
  const [category, setCategory] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [error, setError] = useState('');
  const [isCustomCategory, setIsCustomCategory] = useState(false);

  // Handle pre-filled data from search
  useEffect(() => {
    if (location.state) {
      const { prefillUrl } = location.state as any;
      
      if (prefillUrl) {
        setUrl(prefillUrl);
      }
    }
  }, [location.state]);

  const addPlaylistMutation = useMutation({
    mutationFn: async (data: {
      url: string;
      category: string;
      isPublic: boolean;
    }) => {
      const response = await playlistAPI.addPlaylist(data);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
      queryClient.invalidateQueries({ queryKey: ['user-stats'] });
      // Show success and navigate
      console.log('Playlist added successfully:', data.playlist);
      navigate('/dashboard');
    },
    onError: (error: any) => {
      setError(error.response?.data?.message || 'Failed to add playlist');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) {
      setError('Please enter a YouTube playlist URL');
      return;
    }
    
    if (!category && !customCategory) {
      setError('Please select or create a category');
      return;
    }
    
    setError('');
    addPlaylistMutation.mutate({
      url: url.trim(),
      category: customCategory || category,
      isPublic,
    });
  };

  const isValidYouTubeUrl = (url: string) => {
    return url.includes('youtube.com') && url.includes('list=');
  };

  const handleCustomCategoryModal = () => {
    if (customCategory.trim()) {
      setCategory('');
      setIsCustomCategory(true);
      onOpenChange();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMiI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMiIvPjxjaXJjbGUgY3g9IjQwIiBjeT0iNDAiIHI9IjIiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-40"></div>
      
      <div className="relative z-10 container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="light"
            size="sm"
            onPress={() => navigate('/dashboard')}
            startContent={<ArrowLeft size={18} />}
            className="text-white/70 hover:text-white"
          >
            Back to Dashboard
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500/20 rounded-lg">
              <Youtube className="text-red-400" size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Add New Playlist</h1>
              <p className="text-white/60">Import your favorite YouTube playlist to start learning</p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <Card className="bg-gray-800/50 border-gray-700/50 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2">
                  <Plus className="text-blue-400" size={20} />
                  <h2 className="text-xl font-semibold text-white">Playlist Details</h2>
                </div>
              </CardHeader>
              <CardBody className="space-y-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* URL Input */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white/80">
                      YouTube Playlist URL *
                    </label>
                    <Input
                      placeholder="https://www.youtube.com/playlist?list=..."
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      variant="bordered"
                      size="lg"
                      startContent={<Youtube className="text-red-400" size={20} />}
                      className="text-white"
                      classNames={{
                        input: "text-white placeholder:text-white/40",
                        inputWrapper: "border-gray-600 hover:border-gray-500 focus-within:border-blue-500 bg-gray-700/30"
                      }}
                      isInvalid={!!url && !isValidYouTubeUrl(url)}
                      errorMessage={url && !isValidYouTubeUrl(url) ? "Please enter a valid YouTube playlist URL" : ""}
                    />
                    <p className="text-xs text-white/50">
                      Paste the URL of any public YouTube playlist to import all videos
                    </p>
                  </div>

                  {/* Category Selection */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-white/80">
                      Category *
                    </label>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {PREDEFINED_CATEGORIES.map((cat) => (
                        <Card 
                          key={cat.key}
                          isPressable
                          isHoverable
                          onPress={() => {
                            setCategory(cat.key);
                            setCustomCategory('');
                            setIsCustomCategory(false);
                          }}
                          className={`cursor-pointer transition-all ${
                            category === cat.key && !isCustomCategory
                              ? 'border-blue-500 bg-blue-500/20' 
                              : 'border-gray-600 bg-gray-700/30 hover:border-gray-500'
                          }`}
                        >
                          <CardBody className="p-3">
                            <div className="flex items-center gap-3">
                              <span className="text-lg">{cat.icon}</span>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-white text-sm">{cat.label}</p>
                                <p className="text-xs text-white/60 truncate">{cat.description}</p>
                              </div>
                            </div>
                          </CardBody>
                        </Card>
                      ))}
                    </div>
                    
                    {/* Custom Category Option */}
                    <Button
                      variant="bordered"
                      size="sm"
                      onPress={onOpen}
                      startContent={<Sparkles size={16} />}
                      className="border-dashed border-gray-500 text-white/70 hover:text-white hover:border-gray-400"
                    >
                      Create Custom Category
                    </Button>
                    
                    {isCustomCategory && customCategory && (
                      <Chip
                        color="primary"
                        variant="flat"
                        onClose={() => {
                          setIsCustomCategory(false);
                          setCustomCategory('');
                        }}
                      >
                        Custom: {customCategory}
                      </Chip>
                    )}
                  </div>

                  {/* Error Display */}
                  {error && (
                    <Card className="bg-red-500/20 border-red-500/50">
                      <CardBody className="p-3">
                        <div className="flex items-center gap-2 text-red-400">
                          <AlertCircle size={16} />
                          <span className="text-sm">{error}</span>
                        </div>
                      </CardBody>
                    </Card>
                  )}

                  {/* Submit Button */}
                  <div className="pt-4">
                    <Button
                      type="submit"
                      size="lg"
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium"
                      isLoading={addPlaylistMutation.isPending}
                      startContent={!addPlaylistMutation.isPending && <Plus size={20} />}
                    >
                      {addPlaylistMutation.isPending ? 'Adding Playlist...' : 'Add Playlist'}
                    </Button>
                  </div>
                </form>
              </CardBody>
            </Card>
          </div>

          {/* Sidebar Info */}
          <div className="space-y-6">
            {/* How it Works */}
            <Card className="bg-gray-800/50 border-gray-700/50 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <BookOpen className="text-blue-400" size={20} />
                  How it works
                </h3>
              </CardHeader>
              <CardBody className="pt-0 space-y-3">
                <div className="space-y-3 text-sm text-white/70">
                  <div className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
                    <p>Paste your YouTube playlist URL</p>
                  </div>
                  <div className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
                    <p>Choose a category for organization</p>
                  </div>
                  <div className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
                    <p>We'll fetch all videos and track your progress</p>
                  </div>
                  <div className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">4</span>
                    <p>Start learning with AI-powered features</p>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Tips */}
            <Card className="bg-gray-800/50 border-gray-700/50 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Sparkles className="text-yellow-400" size={20} />
                  Pro Tips
                </h3>
              </CardHeader>
              <CardBody className="pt-0">
                <div className="space-y-2 text-sm text-white/70">
                  <p>• Categories help you organize your learning journey</p>
                  <p>• Use custom categories for specialized topics</p>
                  <p>• We support any public YouTube playlist</p>
                  <p>• Sort playlists by category on your dashboard</p>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      </div>

      {/* Custom Category Modal */}
      <Modal 
        isOpen={isOpen} 
        onOpenChange={onOpenChange}
        classNames={{
          backdrop: "bg-black/50 backdrop-blur-sm",
          base: "border-gray-700 bg-gray-800",
          header: "border-b border-gray-700",
          body: "py-6",
          footer: "border-t border-gray-700"
        }}
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <h3 className="text-white">Create Custom Category</h3>
            <p className="text-sm text-white/60">Add a new category for your playlists</p>
          </ModalHeader>
          <ModalBody>
            <Input
              placeholder="Enter category name..."
              value={customCategory}
              onChange={(e) => setCustomCategory(e.target.value)}
              variant="bordered"
              size="lg"
              autoFocus
              aria-label="Custom category name"
              classNames={{
                input: "text-white placeholder:text-white/40",
                inputWrapper: "border-gray-600 hover:border-gray-500 focus-within:border-blue-500 bg-gray-700/30"
              }}
              maxLength={50}
            />
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onOpenChange} className="text-white/70">
              Cancel
            </Button>
            <Button 
              color="primary" 
              onPress={handleCustomCategoryModal}
              isDisabled={!customCategory.trim()}
            >
              Create Category
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
