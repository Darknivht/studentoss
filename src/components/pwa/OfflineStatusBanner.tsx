import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, Wifi } from 'lucide-react';
import { useOfflineStatus } from '@/hooks/useOfflineStatus';

const OfflineStatusBanner = () => {
  const { isOnline, wasOffline } = useOfflineStatus();

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="bg-amber-500 text-amber-950 px-4 py-2 flex items-center gap-2 text-sm z-50"
        >
          <WifiOff className="w-4 h-4" />
          <span>You're offline. Some features may be limited.</span>
        </motion.div>
      )}
      {isOnline && wasOffline && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="bg-green-500 text-green-950 px-4 py-2 flex items-center gap-2 text-sm z-50"
        >
          <Wifi className="w-4 h-4" />
          <span>You're back online! Syncing data...</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default OfflineStatusBanner;
