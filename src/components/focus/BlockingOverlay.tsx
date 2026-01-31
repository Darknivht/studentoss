import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Brain, ArrowLeft, Shield, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { useFocusLock } from '@/hooks/useFocusLock';
import { useNavigate } from 'react-router-dom';

interface BlockingOverlayProps {
  onReturn?: () => void;
}

const BlockingOverlay = ({ onReturn }: BlockingOverlayProps) => {
  const navigate = useNavigate();
  const {
    currentSession,
    isBlocking,
    endFocusSession,
    emergencyExit,
    parentPinHash,
  } = useFocusLock();

  const [showPinInput, setShowPinInput] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState(false);
  const [tapCount, setTapCount] = useState(0);
  const [elapsedMinutes, setElapsedMinutes] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState('');

  // Calculate time remaining
  useEffect(() => {
    if (!currentSession) return;

    const updateTime = () => {
      const now = Date.now();
      const elapsed = Math.floor((now - currentSession.startTime.getTime()) / 60000);
      const remaining = Math.max(0, currentSession.targetDuration - elapsed);
      
      setElapsedMinutes(elapsed);
      
      const hours = Math.floor(remaining / 60);
      const mins = remaining % 60;
      setTimeRemaining(hours > 0 ? `${hours}h ${mins}m` : `${mins}m`);

      // Auto-end if time is up
      if (remaining <= 0) {
        endFocusSession('completed');
        navigate('/focus');
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [currentSession, endFocusSession, navigate]);

  // Triple tap to show PIN
  const handleSecretTap = useCallback(() => {
    const newCount = tapCount + 1;
    setTapCount(newCount);

    if (newCount >= 3) {
      setShowPinInput(true);
      setTapCount(0);
    }

    // Reset tap count after 2 seconds
    setTimeout(() => setTapCount(0), 2000);
  }, [tapCount]);

  const handlePinSubmit = async () => {
    if (!parentPinHash) {
      // No PIN set, allow exit with warning
      await endFocusSession('failed');
      navigate('/focus');
      return;
    }

    const success = await emergencyExit(pin);
    if (success) {
      navigate('/focus');
    } else {
      setPinError(true);
      setPin('');
      setTimeout(() => setPinError(false), 2000);
    }
  };

  const handleReturn = () => {
    if (onReturn) {
      onReturn();
    } else {
      navigate('/focus');
    }
  };

  if (!currentSession || !isBlocking) {
    return null;
  }

  const progress = (elapsedMinutes / currentSession.targetDuration) * 100;

  const motivationalQuotes = [
    "Stay focused, stay strong! 💪",
    "You're doing great! Keep going!",
    "Every minute of focus counts!",
    "Distraction-free = Success!",
    "Your future self will thank you!",
  ];

  const randomQuote = motivationalQuotes[Math.floor(Date.now() / 60000) % motivationalQuotes.length];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-background flex flex-col items-center justify-center p-6"
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)',
          backgroundSize: '32px 32px',
        }} />
      </div>

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-sm space-y-8 text-center">
        {/* Lock Icon */}
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="mx-auto w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center"
        >
          <Lock className="w-10 h-10 text-primary" />
        </motion.div>

        {/* Title */}
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground mb-2">
            Focus Mode Active
          </h1>
          <p className="text-muted-foreground">
            {randomQuote}
          </p>
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <Progress value={progress} className="h-3" />
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{elapsedMinutes}m done</span>
            <span className="font-medium text-foreground">{timeRemaining} left</span>
          </div>
        </div>

        {/* Blocked Apps */}
        {currentSession.blockedApps.length > 0 && (
          <div className="p-4 rounded-xl bg-muted">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Apps Blocked</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {currentSession.blockedApps.length} apps are currently blocked
            </p>
          </div>
        )}

        {/* Return Button */}
        <Button
          onClick={handleReturn}
          size="lg"
          className="w-full gradient-primary text-primary-foreground"
        >
          <Brain className="w-5 h-5 mr-2" />
          Return to Study
        </Button>

        {/* Hidden Emergency Exit Trigger */}
        <div 
          className="absolute bottom-4 left-4 w-12 h-12 opacity-0"
          onClick={handleSecretTap}
        />

        {/* PIN Input Modal */}
        <AnimatePresence>
          {showPinInput && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
            >
              <div className="w-full max-w-xs p-6 rounded-2xl bg-card border border-border shadow-lg space-y-4">
                <div className="flex items-center gap-2 text-amber-500">
                  <AlertTriangle className="w-5 h-5" />
                  <h3 className="font-semibold">Emergency Exit</h3>
                </div>

                <p className="text-sm text-muted-foreground">
                  {parentPinHash 
                    ? 'Enter parent PIN to end the session early.'
                    : 'No PIN set. Are you sure you want to exit?'}
                </p>

                {parentPinHash ? (
                  <>
                    <Input
                      type="password"
                      placeholder="Enter PIN"
                      value={pin}
                      onChange={(e) => setPin(e.target.value)}
                      className={pinError ? 'border-destructive' : ''}
                      maxLength={6}
                    />
                    {pinError && (
                      <p className="text-xs text-destructive">Incorrect PIN</p>
                    )}
                  </>
                ) : null}

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowPinInput(false);
                      setPin('');
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handlePinSubmit}
                    className="flex-1"
                  >
                    Exit
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default BlockingOverlay;
