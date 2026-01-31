import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, Plus, Trash2, Clock, Target, 
  Smartphone, Lock, Unlock, Info, ArrowLeft,
  KeyRound, Zap, Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { useStudyTimeTracker } from '@/hooks/useStudyTimeTracker';
import { useFocusLock } from '@/hooks/useFocusLock';
import { getPlatformCapabilities } from '@/plugins/FocusModePlugin';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import AppSelector from '@/components/focus/AppSelector';
import PermissionsSetup from '@/components/focus/PermissionsSetup';

interface BlockedApp {
  id: string;
  name: string;
  icon: string;
}

const BLOCKED_APPS_KEY = 'blocked_apps';
const APP_BLOCKER_ENABLED_KEY = 'app_blocker_enabled';

interface AppBlockerSettingsProps {
  onBack: () => void;
}

const POPULAR_APPS = [
  { name: 'Instagram', icon: '📸' },
  { name: 'TikTok', icon: '🎵' },
  { name: 'Snapchat', icon: '👻' },
  { name: 'Twitter/X', icon: '🐦' },
  { name: 'YouTube', icon: '▶️' },
  { name: 'Facebook', icon: '👤' },
  { name: 'WhatsApp', icon: '💬' },
  { name: 'Reddit', icon: '🤖' },
  { name: 'Discord', icon: '🎮' },
  { name: 'Netflix', icon: '🎬' },
];

const AppBlockerSettings = ({ onBack }: AppBlockerSettingsProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { dailyGoalMinutes, setDailyGoal, todayMinutes, isGoalMet } = useStudyTimeTracker();
  const { 
    blockedApps: nativeBlockedApps, 
    parentPinHash, 
    setParentPin,
    permissionsGranted,
    platform,
  } = useFocusLock();
  const capabilities = getPlatformCapabilities();
  
  const [blockerEnabled, setBlockerEnabled] = useState(false);
  const [blockedApps, setBlockedApps] = useState<BlockedApp[]>([]);
  const [customAppName, setCustomAppName] = useState('');
  const [goalMinutes, setGoalMinutes] = useState(dailyGoalMinutes);
  const [showAppSelector, setShowAppSelector] = useState(false);
  const [showPermissions, setShowPermissions] = useState(false);
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');

  // Load settings from localStorage
  useEffect(() => {
    const savedEnabled = localStorage.getItem(APP_BLOCKER_ENABLED_KEY);
    const savedApps = localStorage.getItem(BLOCKED_APPS_KEY);
    
    if (savedEnabled) setBlockerEnabled(savedEnabled === 'true');
    if (savedApps) {
      try {
        setBlockedApps(JSON.parse(savedApps));
      } catch {
        setBlockedApps([]);
      }
    }
  }, []);

  // Save settings when they change
  const saveSettings = (enabled: boolean, apps: BlockedApp[]) => {
    localStorage.setItem(APP_BLOCKER_ENABLED_KEY, enabled.toString());
    localStorage.setItem(BLOCKED_APPS_KEY, JSON.stringify(apps));
  };

  const handleToggleBlocker = (enabled: boolean) => {
    setBlockerEnabled(enabled);
    saveSettings(enabled, blockedApps);
    toast({
      title: enabled ? 'App Blocker Enabled' : 'App Blocker Disabled',
      description: enabled 
        ? 'Selected apps will be blocked until you complete your daily study goal.'
        : 'All apps are now accessible.',
    });
  };

  const addApp = (name: string, icon: string = '📱') => {
    const newApp: BlockedApp = {
      id: Date.now().toString(),
      name,
      icon,
    };
    const updated = [...blockedApps, newApp];
    setBlockedApps(updated);
    saveSettings(blockerEnabled, updated);
    setCustomAppName('');
    toast({ title: 'App Added', description: `${name} will be blocked until goal is met.` });
  };

  const removeApp = (id: string) => {
    const updated = blockedApps.filter(app => app.id !== id);
    setBlockedApps(updated);
    saveSettings(blockerEnabled, updated);
  };

  const handleGoalChange = async (value: number[]) => {
    const newGoal = value[0];
    setGoalMinutes(newGoal);
    await setDailyGoal(newGoal);
  };

  const handleSetPin = async () => {
    if (newPin.length < 4) {
      toast({ title: 'PIN too short', description: 'PIN must be at least 4 digits', variant: 'destructive' });
      return;
    }
    if (newPin !== confirmPin) {
      toast({ title: 'PINs do not match', description: 'Please make sure both PINs match', variant: 'destructive' });
      return;
    }
    await setParentPin(newPin);
    setShowPinSetup(false);
    setNewPin('');
    setConfirmPin('');
    toast({ title: 'PIN Set', description: 'Parent PIN has been configured' });
  };

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes} minutes`;
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hrs}h ${mins}m` : `${hrs} hour${hrs > 1 ? 's' : ''}`;
  };

  return (
    <div className="p-6 space-y-6 pb-24">
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft size={20} />
        </Button>
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">App Blocker</h1>
          <p className="text-muted-foreground text-sm">Block distracting apps until study goal is met</p>
        </div>
      </motion.header>

      {/* Quick Launch Focus Session */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Button 
          onClick={() => navigate('/focus-session')}
          className="w-full h-14 text-lg gradient-primary text-primary-foreground"
        >
          <Zap className="w-5 h-5 mr-2" />
          Start Focus Session
        </Button>
      </motion.div>

      {/* Info Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 rounded-2xl bg-primary/10 border border-primary/20"
      >
        <div className="flex gap-3">
          <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-foreground">How it works</p>
            <p className="text-muted-foreground mt-1">
              When enabled, selected apps will show a study reminder overlay each day until you 
              complete your daily study goal. Once you meet your goal, apps are unlocked for the 
              rest of the day.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Status Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className={`p-4 rounded-2xl border ${
          isGoalMet 
            ? 'bg-emerald-500/10 border-emerald-500/30' 
            : 'bg-amber-500/10 border-amber-500/30'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            isGoalMet ? 'bg-emerald-500/20' : 'bg-amber-500/20'
          }`}>
            {isGoalMet ? (
              <Unlock className="w-5 h-5 text-emerald-500" />
            ) : (
              <Lock className="w-5 h-5 text-amber-500" />
            )}
          </div>
          <div>
            <h3 className="font-semibold text-foreground">
              {isGoalMet ? 'Apps Unlocked! 🎉' : 'Apps Currently Blocked'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {isGoalMet 
                ? `You've studied ${formatTime(todayMinutes)} today`
                : `Study ${formatTime(dailyGoalMinutes - todayMinutes)} more to unlock`
              }
            </p>
          </div>
        </div>
      </motion.div>

      {/* Enable Toggle */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="p-4 rounded-2xl bg-card border border-border"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Enable App Blocker</h3>
              <p className="text-xs text-muted-foreground">Block apps until daily goal is met</p>
            </div>
          </div>
          <Switch 
            checked={blockerEnabled} 
            onCheckedChange={handleToggleBlocker}
          />
        </div>
      </motion.div>

      {/* Daily Study Goal */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="p-4 rounded-2xl bg-card border border-border space-y-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center">
            <Target className="w-5 h-5 text-secondary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Daily Study Goal</h3>
            <p className="text-xs text-muted-foreground">How long you need to study to unlock apps</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Goal:</span>
            <span className="font-semibold text-foreground">{formatTime(goalMinutes)}</span>
          </div>
          <Slider
            value={[goalMinutes]}
            onValueChange={handleGoalChange}
            min={15}
            max={180}
            step={15}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>15m</span>
            <span>1h</span>
            <span>2h</span>
            <span>3h</span>
          </div>
        </div>
      </motion.div>

      {/* Blocked Apps List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="space-y-3"
      >
        <h2 className="text-lg font-display font-semibold flex items-center gap-2">
          <Smartphone className="w-5 h-5 text-primary" />
          Blocked Apps
        </h2>

        {/* Quick Add Popular Apps */}
        <div className="flex flex-wrap gap-2">
          {POPULAR_APPS.filter(app => 
            !blockedApps.some(blocked => blocked.name === app.name)
          ).slice(0, 6).map((app) => (
            <button
              key={app.name}
              onClick={() => addApp(app.name, app.icon)}
              className="px-3 py-1.5 rounded-full bg-muted text-sm flex items-center gap-1.5 hover:bg-muted/80 transition-colors"
            >
              <span>{app.icon}</span>
              <span className="text-muted-foreground">{app.name}</span>
              <Plus className="w-3 h-3 text-muted-foreground" />
            </button>
          ))}
        </div>

        {/* Custom App Input */}
        <div className="flex gap-2">
          <Input
            value={customAppName}
            onChange={(e) => setCustomAppName(e.target.value)}
            placeholder="Add custom app..."
            className="flex-1"
          />
          <Button 
            variant="outline" 
            onClick={() => customAppName && addApp(customAppName)}
            disabled={!customAppName.trim()}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {/* Blocked Apps */}
        <AnimatePresence mode="popLayout">
          {blockedApps.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-8 text-muted-foreground"
            >
              <Lock className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No apps blocked yet</p>
              <p className="text-xs">Add apps above to block them during study time</p>
            </motion.div>
          ) : (
            <div className="space-y-2">
              {blockedApps.map((app) => (
                <motion.div
                  key={app.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="p-3 rounded-xl bg-card border border-border flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{app.icon}</span>
                    <span className="font-medium text-foreground">{app.name}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeApp(app.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Parent PIN Setup */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="p-4 rounded-2xl bg-card border border-border"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <KeyRound className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Parent PIN</h3>
              <p className="text-xs text-muted-foreground">
                {parentPinHash ? 'PIN configured' : 'Set a PIN for emergency exit'}
              </p>
            </div>
          </div>
          <Dialog open={showPinSetup} onOpenChange={setShowPinSetup}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                {parentPinHash ? 'Change' : 'Set PIN'}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Set Parent PIN</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <p className="text-sm text-muted-foreground">
                  This PIN allows emergency exit from focus sessions.
                </p>
                <Input
                  type="password"
                  placeholder="Enter PIN (min 4 digits)"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                  maxLength={6}
                />
                <Input
                  type="password"
                  placeholder="Confirm PIN"
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                  maxLength={6}
                />
                <Button onClick={handleSetPin} className="w-full">
                  Save PIN
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      {/* Permissions Setup (Native only) */}
      {capabilities.isNative && !permissionsGranted && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <Dialog open={showPermissions} onOpenChange={setShowPermissions}>
            <DialogTrigger asChild>
              <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20 cursor-pointer">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Settings className="w-5 h-5 text-destructive" />
                    <div>
                      <h3 className="font-semibold">Permissions Required</h3>
                      <p className="text-xs text-muted-foreground">
                        Grant permissions for full app blocking
                      </p>
                    </div>
                  </div>
                  <Button variant="destructive" size="sm">Setup</Button>
                </div>
              </div>
            </DialogTrigger>
            <DialogContent>
              <PermissionsSetup onComplete={() => setShowPermissions(false)} />
            </DialogContent>
          </Dialog>
        </motion.div>
      )}

      {/* Native App Selector (Android) */}
      {capabilities.canBlockApps && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Dialog open={showAppSelector} onOpenChange={setShowAppSelector}>
            <DialogTrigger asChild>
              <div className="p-4 rounded-2xl bg-card border border-border cursor-pointer hover:border-primary/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Smartphone className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Native App Selection</h3>
                      <p className="text-xs text-muted-foreground">
                        {nativeBlockedApps.length} apps configured for native blocking
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">Configure</Button>
                </div>
              </div>
            </DialogTrigger>
            <DialogContent className="max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Select Apps to Block</DialogTitle>
              </DialogHeader>
              <AppSelector onClose={() => setShowAppSelector(false)} />
            </DialogContent>
          </Dialog>
        </motion.div>
      )}

      {/* Native App Note */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className="p-4 rounded-2xl bg-muted/50 text-sm text-muted-foreground"
      >
        <p>
          <strong>Note:</strong> {capabilities.isNative 
            ? (platform === 'android' 
              ? 'Full app blocking is available on Android. Apps in your block list will be restricted during focus sessions.'
              : 'iOS uses Guided Access for app locking. Enable it in Settings → Accessibility → Guided Access.')
            : 'Full app blocking requires the native mobile app. In the web version, we\'ll show you a study reminder when you open distracting websites.'}
        </p>
      </motion.div>
    </div>
  );
};

export default AppBlockerSettings;
