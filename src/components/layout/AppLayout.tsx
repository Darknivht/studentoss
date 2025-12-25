import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import BottomNav from './BottomNav';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

interface AppLayoutProps {
  children: ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  const { user, loading } = useAuth();

  if (loading) {
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
          <p className="text-muted-foreground animate-pulse">Loading studentOS...</p>
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <main className="max-w-lg mx-auto">
        {children}
      </main>
      <BottomNav />
    </div>
  );
};

export default AppLayout;