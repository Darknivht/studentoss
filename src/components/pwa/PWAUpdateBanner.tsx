import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePWAUpdate } from '@/hooks/usePWAUpdate';

const PWAUpdateBanner = () => {
  const { isUpdateAvailable, updateServiceWorker } = usePWAUpdate();

  return (
    <AnimatePresence>
      {isUpdateAvailable && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="bg-primary text-primary-foreground px-4 py-2 flex items-center justify-between gap-3 text-sm z-50"
        >
          <span className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            A new version is available!
          </span>
          <Button
            size="sm"
            variant="secondary"
            onClick={updateServiceWorker}
            className="text-xs h-7"
          >
            Update Now
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PWAUpdateBanner;
