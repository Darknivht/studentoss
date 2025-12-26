import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Timer, AlertTriangle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FocusModeOverlayProps {
  isActive: boolean;
  timeLeft: string;
  onEmergencyExit: () => void;
}

const FocusModeOverlay = ({ isActive, timeLeft, onEmergencyExit }: FocusModeOverlayProps) => {
  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] pointer-events-auto"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.85)' }}
        >
          <div className="flex flex-col items-center justify-center h-full text-center p-6">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="mb-8"
            >
              <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                <Lock className="w-12 h-12 text-primary" />
              </div>
              <h2 className="text-3xl font-display font-bold text-white mb-2">Focus Mode Active</h2>
              <p className="text-gray-400 max-w-sm">
                Stay focused! Navigation is blocked during your study session.
              </p>
            </motion.div>

            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: [0.9, 1, 0.9] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="mb-8"
            >
              <div className="flex items-center gap-3 text-primary">
                <Timer className="w-8 h-8" />
                <span className="text-5xl font-display font-bold">{timeLeft}</span>
              </div>
              <p className="text-gray-500 mt-2">remaining</p>
            </motion.div>

            <div className="space-y-4 max-w-sm">
              <div className="flex items-start gap-3 text-left p-4 bg-yellow-500/10 rounded-xl border border-yellow-500/20">
                <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-gray-300">
                  Leaving focus mode will reset your current session progress.
                </p>
              </div>

              <Button
                variant="ghost"
                onClick={onEmergencyExit}
                className="text-gray-500 hover:text-red-400 hover:bg-red-500/10"
              >
                <X className="w-4 h-4 mr-2" />
                Emergency Exit
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FocusModeOverlay;
