import { ReactNode, useState, useEffect } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import BottomNav from './BottomNav';
import { motion } from 'framer-motion';
import { Loader2, User, Settings, Bell, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import AdBanner from '@/components/ads/AdBanner';

interface AppLayoutProps {
  children: ReactNode;
}

const LOADING_TIMEOUT_MS = 8000;

const AppLayout = ({ children }: AppLayoutProps) => {
  const { user, loading } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (!loading) {
      setTimedOut(false);
      return;
    }
    const timer = setTimeout(() => setTimedOut(true), LOADING_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [loading]);

  if (loading && !timedOut) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center glow-primary">
            <Loader2 className="w-8 h-8 text-primary-foreground animate-spin" />
          </div>
          <p className="text-muted-foreground animate-pulse">Loading StudentOS...</p>
        </motion.div>
      </div>
    );
  }

  if (loading && timedOut) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-4 text-center px-6">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
            <RefreshCw className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-foreground font-medium">Taking longer than expected</p>
          <p className="text-muted-foreground text-sm">The app is having trouble loading.</p>
          <Button onClick={() => window.location.reload()} className="gradient-primary text-primary-foreground">
            <RefreshCw className="w-4 h-4 mr-2" /> Reload App
          </Button>
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <span className="text-sm font-bold text-primary-foreground">S</span>
            </div>
            <span className="font-display font-bold text-foreground">StudentOS</span>
          </Link>
          
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="rounded-full" asChild>
              <Link to="/profile">
                <User className="w-5 h-5" />
              </Link>
            </Button>
            
            <Sheet open={showMenu} onOpenChange={setShowMenu}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Settings className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <SheetHeader>
                  <SheetTitle>Settings</SheetTitle>
                </SheetHeader>
                <div className="mt-6 space-y-2">
                  <Link to="/profile" onClick={() => setShowMenu(false)} className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted transition-colors">
                    <User className="w-5 h-5 text-primary" /><span>Profile</span>
                  </Link>
                  <Link to="/achievements" onClick={() => setShowMenu(false)} className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted transition-colors">
                    <Bell className="w-5 h-5 text-primary" /><span>Achievements</span>
                  </Link>
                  <Link to="/safety" onClick={() => setShowMenu(false)} className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted transition-colors">
                    <Settings className="w-5 h-5 text-primary" /><span>Safety & Offline</span>
                  </Link>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto">
        {children}
      </main>
      <AdBanner variant="banner" />
      <BottomNav />
    </div>
  );
};

export default AppLayout;
