import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Play, Pause, StopCircle, Lock, Shield, Clock, 
  Settings, ChevronRight, Zap, Target
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { useFocusLock } from '@/hooks/useFocusLock';
import AppSelector from '@/components/focus/AppSelector';
import PermissionsSetup from '@/components/focus/PermissionsSetup';
import { useToast } from '@/hooks/use-toast';

const FocusSession = () => {
  const { toast } = useToast();
  const {
    currentSession, blockedApps, platform, permissionsGranted,
    startFocusSession, endFocusSession, pauseFocusSession, resumeFocusSession, loadBlockedApps,
  } = useFocusLock();

  const [duration, setDuration] = useState(25);
  const [showAppSelector, setShowAppSelector] = useState(false);
  const [showPermissions, setShowPermissions] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const isNative = platform === 'android' || platform === 'ios';

  useEffect(() => { loadBlockedApps(); }, [loadBlockedApps]);

  useEffect(() => {
    if (!currentSession || currentSession.status !== 'active') { setElapsedSeconds(0); return; }
    const updateElapsed = () => {
      const elapsed = Math.floor((Date.now() - currentSession.startTime.getTime()) / 1000);
      setElapsedSeconds(elapsed);
      if (elapsed >= currentSession.targetDuration * 60) {
        endFocusSession('completed');
        toast({ title: 'Focus Session Complete! 🎉', description: `You focused for ${currentSession.targetDuration} minutes!` });
      }
    };
    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);
    return () => clearInterval(interval);
  }, [currentSession, endFocusSession, toast]);

  const handleStartSession = async () => {
    if (isNative && blockedApps.length === 0) {
      toast({ title: 'Select apps to block', description: 'Choose which apps to block.', variant: 'destructive' });
      setShowAppSelector(true);
      return;
    }
    const success = await startFocusSession(duration);
    if (success) toast({ title: 'Focus Session Started! 🎯', description: `${duration} minute session active.` });
    else toast({ title: 'Failed to start', description: 'Please try again.', variant: 'destructive' });
  };

  const handleEndSession = async () => {
    await endFocusSession('completed');
    toast({ title: 'Session Ended', description: 'Great work! Progress saved.' });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const totalSeconds = currentSession ? currentSession.targetDuration * 60 : duration * 60;
  const progress = currentSession ? (elapsedSeconds / totalSeconds) * 100 : 0;
  const remainingSeconds = totalSeconds - elapsedSeconds;

  return (
    <div className="p-6 space-y-6 pb-24">
      <motion.header initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-display font-bold text-foreground">Focus Session</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {isNative ? 'Block distractions and stay focused' : 'Set a timer and stay focused'}
        </p>
      </motion.header>

      {currentSession ? (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
          <Card className="border-primary/50 bg-primary/5">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Lock className="w-5 h-5 text-primary" />
                  <CardTitle className="text-lg">Session Active</CardTitle>
                </div>
                <Badge variant={currentSession.status === 'paused' ? 'secondary' : 'default'}>
                  {currentSession.status === 'paused' ? 'Paused' : 'Focusing'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center py-4">
                <div className="text-5xl font-display font-bold text-foreground mb-2">{formatTime(remainingSeconds)}</div>
                <p className="text-sm text-muted-foreground">remaining</p>
              </div>
              <div className="space-y-2">
                <Progress value={progress} className="h-3" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{formatTime(elapsedSeconds)} elapsed</span>
                  <span>{currentSession.targetDuration}m goal</span>
                </div>
              </div>
              {isNative && currentSession.blockedApps.length > 0 && (
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Shield className="w-4 h-4" /><span>{currentSession.blockedApps.length} apps blocked</span>
                </div>
              )}
              <div className="flex gap-3">
                {currentSession.status === 'paused' ? (
                  <Button onClick={resumeFocusSession} className="flex-1"><Play className="w-4 h-4 mr-2" />Resume</Button>
                ) : (
                  <Button onClick={pauseFocusSession} variant="outline" className="flex-1"><Pause className="w-4 h-4 mr-2" />Pause</Button>
                )}
                <Button onClick={handleEndSession} variant="destructive"><StopCircle className="w-4 h-4 mr-2" />End</Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <>
          {/* Duration Selector */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2"><Clock className="w-5 h-5 text-primary" />Session Duration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <span className="text-4xl font-display font-bold text-foreground">{duration}</span>
                  <span className="text-lg text-muted-foreground ml-2">minutes</span>
                </div>
                <Slider value={[duration]} onValueChange={v => setDuration(v[0])} min={5} max={120} step={5} className="py-4" />
                <div className="flex gap-2">
                  {[15, 25, 45, 60].map(mins => (
                    <Button key={mins} variant={duration === mins ? 'default' : 'outline'} size="sm" onClick={() => setDuration(mins)} className="flex-1">{mins}m</Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* App Selection - Native only */}
          {isNative && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Dialog open={showAppSelector} onOpenChange={setShowAppSelector}>
                <DialogTrigger asChild>
                  <Card className="cursor-pointer hover:border-primary/50 transition-colors">
                    <CardContent className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"><Shield className="w-5 h-5 text-primary" /></div>
                        <div>
                          <h3 className="font-medium">Apps to Block</h3>
                          <p className="text-sm text-muted-foreground">{blockedApps.length === 0 ? 'No apps selected' : `${blockedApps.length} apps selected`}</p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </CardContent>
                  </Card>
                </DialogTrigger>
                <DialogContent className="max-h-[80vh] overflow-y-auto">
                  <DialogHeader><DialogTitle>Select Apps to Block</DialogTitle></DialogHeader>
                  <AppSelector onClose={() => setShowAppSelector(false)} />
                </DialogContent>
              </Dialog>
            </motion.div>
          )}

          {/* Permissions - Native only */}
          {isNative && !permissionsGranted && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Dialog open={showPermissions} onOpenChange={setShowPermissions}>
                <DialogTrigger asChild>
                  <Card className="cursor-pointer border-amber-500/50 bg-amber-500/5">
                    <CardContent className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center"><Settings className="w-5 h-5 text-amber-500" /></div>
                        <div><h3 className="font-medium">Setup Required</h3><p className="text-sm text-muted-foreground">Grant permissions for app blocking</p></div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </CardContent>
                  </Card>
                </DialogTrigger>
                <DialogContent><PermissionsSetup onComplete={() => setShowPermissions(false)} /></DialogContent>
              </Dialog>
            </motion.div>
          )}

          {/* Start Button */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Button onClick={handleStartSession} size="lg" className="w-full h-14 text-lg gradient-primary text-primary-foreground">
              <Zap className="w-5 h-5 mr-2" />Start Focus Session
            </Button>
          </motion.div>
        </>
      )}

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="p-4 rounded-2xl bg-muted">
        <h3 className="font-semibold text-sm mb-2"><Target className="w-4 h-4 inline mr-1" />Focus Tips</h3>
        <ul className="text-xs text-muted-foreground space-y-1">
          <li>• Put your phone on Do Not Disturb</li>
          <li>• Close unnecessary browser tabs</li>
          <li>• Take short breaks between sessions</li>
          <li>• Stay hydrated during focus time</li>
        </ul>
      </motion.div>
    </div>
  );
};

export default FocusSession;
