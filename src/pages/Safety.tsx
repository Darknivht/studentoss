import { useState } from 'react';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Eye, WifiOff, User, Lock } from 'lucide-react';
import ParentalControls from '@/components/safety/ParentalControls';
import ParentDashboard from '@/components/safety/ParentDashboard';
import OfflineMode from '@/components/safety/OfflineMode';
import AppBlockerSettings from '@/components/settings/AppBlockerSettings';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const Safety = () => {
  const [activeTab, setActiveTab] = useState('controls');
  const [showAppBlocker, setShowAppBlocker] = useState(false);

  if (showAppBlocker) {
    return <AppBlockerSettings onBack={() => setShowAppBlocker(false)} />;
  }

  return (
    <div className="p-6 space-y-6 pb-24">
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Safety & Access</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Parental controls and offline features
          </p>
        </div>
        <Button variant="ghost" size="icon" asChild>
          <Link to="/profile">
            <User className="w-5 h-5" />
          </Link>
        </Button>
      </motion.header>

      {/* App Blocker Quick Access */}
      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={() => setShowAppBlocker(true)}
        className="w-full p-4 rounded-2xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center gap-3"
      >
        <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
          <Lock className="w-5 h-5 text-amber-500" />
        </div>
        <div className="flex-1 text-left">
          <h3 className="font-semibold text-foreground">App Blocker</h3>
          <p className="text-xs text-muted-foreground">Block distracting apps until study goal is met</p>
        </div>
      </motion.button>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="controls" className="flex items-center gap-1 text-xs">
            <Shield className="w-4 h-4" />
            Controls
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center gap-1 text-xs">
            <Eye className="w-4 h-4" />
            Activity
          </TabsTrigger>
          <TabsTrigger value="offline" className="flex items-center gap-1 text-xs">
            <WifiOff className="w-4 h-4" />
            Offline
          </TabsTrigger>
        </TabsList>

        <TabsContent value="controls" className="space-y-6">
          <ParentalControls />
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <ParentDashboard />
        </TabsContent>

        <TabsContent value="offline" className="space-y-6">
          <OfflineMode />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Safety;
