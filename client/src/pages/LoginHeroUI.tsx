import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import {
  Button,
  Input,
  Card,
  CardBody,
  CardHeader,
  Chip,
  Divider,
} from '@heroui/react';
import { Eye, EyeOff, Mail, Lock, Play, Star, Trophy, Code } from 'lucide-react';

const LoginHeroUI: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        {/* Gradient Orbs */}
        <div className="absolute w-72 h-72 bg-gradient-to-r from-primary/15 to-secondary/15 rounded-full blur-3xl animate-pulse"
             style={{ left: '8%', top: '8%', transform: 'translate(-50%, -50%)' }}>
        </div>
        <div className="absolute w-60 h-60 bg-gradient-to-r from-secondary/15 to-success/15 rounded-full blur-3xl animate-pulse"
             style={{ right: '8%', bottom: '8%', transform: 'translate(50%, 50%)', animationDelay: '1s' }}>
        </div>
        <div className="absolute w-48 h-48 bg-gradient-to-r from-primary/20 to-warning/15 rounded-full blur-3xl animate-pulse"
             style={{ left: '18%', top: '55%', animationDelay: '2s' }}>
        </div>

        {/* Floating Icons */}
        <div className="absolute text-foreground/10"
             style={{ left: '10%', top: '20%', animation: '3s ease-in-out 0s infinite normal none running float' }}>
          <Code className="w-6 h-6" />
        </div>
        <div className="absolute text-foreground/10"
             style={{ right: '15%', top: '30%', animation: '4s ease-in-out 0.5s infinite normal none running float' }}>
          <Star className="w-6 h-6" />
        </div>
        <div className="absolute text-foreground/10"
             style={{ left: '55%', top: '50%', animation: '4.5s ease-in-out 1.5s infinite normal none running float' }}>
          <Trophy className="w-6 h-6" />
        </div>
        <div className="absolute text-foreground/10"
             style={{ left: '70%', top: '60%', animation: '3.8s ease-in-out 2s infinite normal none running float' }}>
          <Play className="w-6 h-6" />
        </div>

        {/* Grid Pattern */}
        <div className="absolute inset-0 opacity-[0.02]"
             style={{
               backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)`,
               backgroundSize: '50px 50px'
             }}>
        </div>
      </div>

      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-10 items-center">
          {/* Left Side - Hero Content */}
          <div className="space-y-6 text-center lg:text-left animate-fade-in-left">
            <div className="space-y-3">
              {/* Badge */}
              <div className="inline-flex items-center space-x-2 bg-primary/10 border border-primary/20 rounded-full px-3 py-1">
                <Play className="w-3 h-3 text-primary" />
                <span className="text-primary text-sm font-medium">SkillSync Learning</span>
              </div>

              {/* Title */}
              <h1 className="text-3xl lg:text-5xl font-bold leading-tight">
                <span className="bg-gradient-to-r from-foreground via-primary to-secondary bg-clip-text text-transparent">
                  Master Skills
                </span>
                <br />
                <span className="text-foreground">
                  Through Video
                </span>
              </h1>

              {/* Description */}
              <p className="text-lg text-default-500 max-w-lg">
                Join thousands of learners who are advancing their careers with 
                our curated video learning platform.
              </p>
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mx-auto lg:mx-0">
              <div className="flex items-center space-x-3 p-3 bg-content2/50 border border-divider/50 hover:border-divider transition-all duration-300 rounded-lg">
                <div className="w-8 h-8 bg-primary/20 flex items-center justify-center rounded">
                  <Play className="w-4 h-4 text-primary" />
                </div>
                <span className="text-foreground font-medium text-sm">Learn with Video</span>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-content2/50 border border-divider/50 hover:border-divider transition-all duration-300 rounded-lg">
                <div className="w-8 h-8 bg-secondary/20 flex items-center justify-center rounded">
                  <Trophy className="w-4 h-4 text-secondary" />
                </div>
                <span className="text-foreground font-medium text-sm">Track Progress</span>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto lg:mx-0">
              <div className="text-center">
                <div className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  1K+
                </div>
                <div className="text-default-500 text-xs">Users</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  500+
                </div>
                <div className="text-default-500 text-xs">Videos</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  95%
                </div>
                <div className="text-default-500 text-xs">Success Rate</div>
              </div>
            </div>
          </div>

          {/* Right Side - Login Form */}
          <div className="flex justify-center animate-fade-in-right">
            <Card className="w-full max-w-sm shadow-large">
              <CardHeader className="flex flex-col items-center justify-center text-center pb-3 pt-6 px-6">
                <div className="flex flex-col items-center justify-center space-y-1">
                  <h2 className="text-2xl font-bold text-foreground text-center">
                    Welcome Back
                  </h2>
                  <p className="text-default-500 text-sm text-center">
                    Sign in to continue your learning journey
                  </p>
                </div>
              </CardHeader>

              <CardBody className="px-6 pb-6">
                {error && (
                  <Chip color="danger" variant="flat" className="w-full text-sm mb-4">
                    {error}
                  </Chip>
                )}

                <form onSubmit={handleSubmit} className="space-y-3">
                  <Input
                    type="email"
                    label="Email"
                    placeholder="Enter your email"
                    value={email}
                    onValueChange={setEmail}
                    isRequired
                    isDisabled={loading}
                    size="sm"
                    variant="bordered"
                    startContent={<Mail className="w-4 h-4 text-default-400" />}
                  />

                  <Input
                    type={showPassword ? 'text' : 'password'}
                    label="Password"
                    placeholder="Enter your password"
                    value={password}
                    onValueChange={setPassword}
                    isRequired
                    isDisabled={loading}
                    size="sm"
                    variant="bordered"
                    startContent={<Lock className="w-4 h-4 text-default-400" />}
                    endContent={
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-default-400 hover:text-foreground transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    }
                  />

                  <Button
                    type="submit"
                    color="primary"
                    size="md"
                    className="w-full bg-gradient-to-r from-primary to-secondary text-white font-semibold mt-4"
                    isLoading={loading}
                    endContent={!loading ? <Play className="w-4 h-4" /> : null}
                  >
                    {loading ? 'Signing in...' : 'Sign in'}
                  </Button>
                </form>

                <Divider className="my-4" />

                <div className="text-center">
                  <p className="text-default-500 text-sm">
                    Don't have an account?{' '}
                    <Link
                      to="/register"
                      className="text-primary hover:text-primary-600 font-medium transition-colors"
                    >
                      Create an account
                    </Link>
                  </p>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginHeroUI;
