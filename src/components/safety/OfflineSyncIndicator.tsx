import { motion, AnimatePresence } from 'framer-motion';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { Wifi, WifiOff, Cloud, CloudOff, RefreshCw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const OfflineSyncIndicator = () => {
  const { isOnline, syncStatus, syncNow, pendingActions } = useOfflineSync();

  return (
    <AnimatePresence>
      {(!isOnline || syncStatus.pendingCount > 0) && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-0 left-0 right-0 z-50 p-2 bg-background/95 backdrop-blur border-b border-border"
        >
          <div className="max-w-md mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isOnline ? (
                <Wifi className="w-4 h-4 text-green-500" />
              ) : (
                <WifiOff className="w-4 h-4 text-amber-500" />
              )}
              <span className="text-sm text-foreground">
                {isOnline ? 'Online' : 'Offline'}
              </span>

              {syncStatus.pendingCount > 0 && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <CloudOff className="w-3 h-3" />
                  {syncStatus.pendingCount} pending
                </span>
              )}
            </div>

            {isOnline && syncStatus.pendingCount > 0 && (
              <Button
                size="sm"
                variant="ghost"
                onClick={syncNow}
                disabled={syncStatus.isSyncing}
                className="h-7 text-xs"
              >
                {syncStatus.isSyncing ? (
                  <Loader2 className="w-3 h-3 animate-spin mr-1" />
                ) : (
                  <RefreshCw className="w-3 h-3 mr-1" />
                )}
                Sync Now
              </Button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default OfflineSyncIndicator;
