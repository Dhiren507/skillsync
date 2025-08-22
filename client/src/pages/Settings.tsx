import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Button, 
  Input, 
  Card, 
  CardHeader, 
  CardBody, 
  Divider, 
  Badge, 
  Chip
} from '@heroui/react';
import { useAuth } from '@/lib/auth';
import { 
  ArrowLeft, 
  User, 
  Save, 
  Moon, 
  Shield, 
  CheckCircle
} from 'lucide-react';

export default function Settings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Profile settings
  const [profile, setProfile] = useState({
    name: user?.name || '',
    email: user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSave = async () => {
    setIsLoading(true);
    setMessage('');
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      setMessage('Settings saved successfully!');
      setTimeout(() => setMessage(''), 3000);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button 
              variant="light" 
              onClick={() => navigate('/dashboard')}
              startContent={<ArrowLeft className="h-4 w-4" />}
            >
              Back to Dashboard
            </Button>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Account Settings
            </h1>
          </div>
        </div>

        <div className="space-y-6">
          {/* Success Message */}
          {message && (
            <div className="p-4 flex items-center gap-2 text-sm text-green-700 bg-green-50 dark:text-green-300 dark:bg-green-900/20 rounded-lg border border-green-100 dark:border-green-800">
              <CheckCircle className="h-5 w-5" />
              {message}
            </div>
          )}

          {/* Profile Settings */}
          <Card className="shadow-sm">
            <CardHeader className="flex gap-3 px-6 pt-6 pb-2">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold">Profile Settings</h2>
              </div>
              <Chip color="primary" variant="flat" size="sm">Personal</Chip>
            </CardHeader>
            
            <CardBody className="px-6 py-4">
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Full Name
                    </label>
                    <Input
                      value={profile.name}
                      onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter your full name"
                      variant="bordered"
                      size="md"
                      fullWidth
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Email
                    </label>
                    <Input
                      type="email"
                      value={profile.email}
                      onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="Enter your email"
                      variant="bordered"
                      size="md"
                      fullWidth
                    />
                  </div>
                </div>

                <Divider />

                <div className="pt-2">
                  <h3 className="text-md font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Shield className="h-4 w-4 text-primary" />
                    Change Password
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Current Password
                      </label>
                      <Input
                        type="password"
                        value={profile.currentPassword}
                        onChange={(e) => setProfile(prev => ({ ...prev, currentPassword: e.target.value }))}
                        placeholder="Enter current password"
                        variant="bordered"
                        size="md"
                        fullWidth
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          New Password
                        </label>
                        <Input
                          type="password"
                          value={profile.newPassword}
                          onChange={(e) => setProfile(prev => ({ ...prev, newPassword: e.target.value }))}
                          placeholder="Enter new password"
                          variant="bordered"
                          size="md"
                          fullWidth
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Confirm New Password
                        </label>
                        <Input
                          type="password"
                          value={profile.confirmPassword}
                          onChange={(e) => setProfile(prev => ({ ...prev, confirmPassword: e.target.value }))}
                          placeholder="Confirm new password"
                          variant="bordered"
                          size="md"
                          fullWidth
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button
                    onClick={handleSave}
                    color="primary"
                    isLoading={isLoading}
                    startContent={!isLoading && <Save className="h-4 w-4" />}
                  >
                    {isLoading ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Theme Settings */}
          <Card className="shadow-sm">
            <CardHeader className="flex gap-3 px-6 pt-6 pb-2">
              <div className="flex items-center gap-2">
                <Moon className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold">Appearance</h2>
              </div>
              <Chip color="secondary" variant="flat" size="sm">Interface</Chip>
            </CardHeader>
            
            <CardBody className="px-6 py-4">
              <div className="p-4 bg-youtube-dark-secondary rounded-lg border border-youtube-dark-tertiary">
                <h3 className="text-md font-medium text-white flex items-center gap-2">
                  <Badge color="secondary" variant="flat" size="sm">
                    Active
                  </Badge>
                  Dark Mode (Fixed)
                </h3>
                <p className="text-sm text-youtube-light-gray mt-2">
                  SkillSync uses YouTube's dark theme for comfortable learning and reduced eye strain during long study sessions.
                </p>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
