import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { BookOpen, Sparkles, Brain, Rocket, Eye, EyeOff, ArrowLeft, Loader2 } from 'lucide-react';
import { z } from 'zod';

const emailSchema = z.string().email('Please enter a valid email');
const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; fullName?: string }>({});
  const [forgotPassword, setForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);
  
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const validateForm = () => {
    const newErrors: { email?: string; password?: string; fullName?: string } = {};
    
    try {
      emailSchema.parse(email);
    } catch (e) {
      if (e instanceof z.ZodError) {
        newErrors.email = e.errors[0].message;
      }
    }
    
    try {
      passwordSchema.parse(password);
    } catch (e) {
      if (e instanceof z.ZodError) {
        newErrors.password = e.errors[0].message;
      }
    }
    
    if (!isLogin && !fullName.trim()) {
      newErrors.fullName = 'Please enter your name';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            toast({
              title: "Login failed",
              description: "Invalid email or password. Please try again.",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Login failed",
              description: error.message,
              variant: "destructive",
            });
          }
        } else {
          toast({
            title: "Welcome back! 🎉",
            description: "You've successfully logged in.",
          });
          navigate('/');
        }
      } else {
        const { error } = await signUp(email, password, fullName);
        if (error) {
          if (error.message.includes('already registered')) {
            toast({
              title: "Account exists",
              description: "This email is already registered. Try logging in instead.",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Sign up failed",
              description: error.message,
              variant: "destructive",
            });
          }
        } else {
          toast({
            title: "Welcome to StudentOS! 🚀",
            description: "Your account has been created successfully.",
          });
          navigate('/');
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const floatingIcons = [
    { icon: BookOpen, delay: 0, x: '10%', y: '20%' },
    { icon: Brain, delay: 0.5, x: '80%', y: '15%' },
    { icon: Sparkles, delay: 1, x: '15%', y: '70%' },
    { icon: Rocket, delay: 1.5, x: '85%', y: '75%' },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-background">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-accent/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Floating icons */}
      {floatingIcons.map((item, index) => (
        <motion.div
          key={index}
          className="absolute text-primary/30"
          style={{ left: item.x, top: item.y }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ 
            opacity: 1, 
            scale: 1,
            y: [0, -20, 0],
          }}
          transition={{ 
            delay: item.delay,
            y: { duration: 3, repeat: Infinity, ease: 'easeInOut' }
          }}
        >
          <item.icon size={40} />
        </motion.div>
      ))}

      {/* Auth card */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="glass-card p-8 shadow-elevated">
          {/* Logo */}
          <motion.div 
            className="text-center mb-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-primary mb-4 glow-primary">
              <BookOpen className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-display font-bold text-gradient">StudentOS</h1>
            <p className="text-muted-foreground mt-2">
              {isLogin ? 'Welcome back, scholar!' : 'Start your learning journey'}
            </p>
          </motion.div>

          {/* Toggle */}
          <div className="flex bg-muted rounded-xl p-1 mb-6">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                isLogin 
                  ? 'bg-card text-foreground shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Log In
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                !isLogin 
                  ? 'bg-card text-foreground shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatePresence mode="wait">
              {!isLogin && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Label htmlFor="fullName" className="text-sm font-medium">
                    Full Name
                  </Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Alex Johnson"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="mt-1.5"
                  />
                  {errors.fullName && (
                    <p className="text-destructive text-xs mt-1">{errors.fullName}</p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              <Label htmlFor="email" className="text-sm font-medium">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@school.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5"
              />
              {errors.email && (
                <p className="text-destructive text-xs mt-1">{errors.email}</p>
              )}
            </div>

            <div>
              <Label htmlFor="password" className="text-sm font-medium">
                Password
              </Label>
              <div className="relative mt-1.5">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-destructive text-xs mt-1">{errors.password}</p>
              )}
            </div>

            {isLogin && (
              <button
                type="button"
                onClick={() => setForgotPassword(true)}
                className="text-xs text-primary hover:underline w-full text-right -mt-1"
              >
                Forgot password?
              </button>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full gradient-primary text-primary-foreground hover:opacity-90 transition-opacity h-12 text-base font-medium"
            >
              {isLoading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full"
                />
              ) : (
                <>
                  {isLogin ? 'Log In' : 'Create Account'}
                  <Sparkles className="ml-2 w-4 h-4" />
                </>
              )}
            </Button>
          </form>

          {/* Forgot Password Modal */}
          <AnimatePresence>
            {forgotPassword && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-20 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-2xl"
              >
                <div className="p-6 space-y-4 w-full">
                  <button onClick={() => { setForgotPassword(false); setResetSent(false); }} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
                    <ArrowLeft size={16} /> Back to login
                  </button>
                  <h2 className="text-xl font-bold">Reset Password</h2>
                  {resetSent ? (
                    <p className="text-sm text-muted-foreground">Check your email for a password reset link. You can close this now.</p>
                  ) : (
                    <>
                      <p className="text-sm text-muted-foreground">Enter your email and we'll send you a reset link.</p>
                      <Input placeholder="you@school.edu" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} />
                      <Button
                        className="w-full"
                        disabled={isLoading}
                        onClick={async () => {
                          setIsLoading(true);
                          const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
                            redirectTo: `${window.location.origin}/reset-password`,
                          });
                          setIsLoading(false);
                          if (error) {
                            toast({ title: "Failed", description: error.message, variant: "destructive" });
                          } else {
                            setResetSent(true);
                            toast({ title: "Email sent!", description: "Check your inbox for the reset link." });
                          }
                        }}
                      >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send Reset Link"}
                      </Button>
                    </>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Features preview */}
          <motion.div 
            className="mt-8 pt-6 border-t border-border"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <p className="text-xs text-center text-muted-foreground mb-4">
              Unlock your potential with
            </p>
            <div className="flex justify-center gap-4">
              {['📚 Smart Notes', '🧠 AI Tutor', '📊 Tracking'].map((feature, i) => (
                <motion.span
                  key={feature}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                  className="text-xs bg-muted px-3 py-1.5 rounded-full"
                >
                  {feature}
                </motion.span>
              ))}
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default Auth;