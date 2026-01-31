import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Check, Loader2, Shield, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useFocusLock } from '@/hooks/useFocusLock';
import { AppInfo, getPlatformCapabilities } from '@/plugins/FocusModePlugin';

interface AppSelectorProps {
  onClose?: () => void;
}

const AppSelector = ({ onClose }: AppSelectorProps) => {
  const {
    availableApps,
    blockedApps,
    isLoading,
    loadAvailableApps,
    toggleBlockedApp,
    platform,
    permissionsGranted,
    requestPermissions,
  } = useFocusLock();

  const [searchQuery, setSearchQuery] = useState('');
  const capabilities = getPlatformCapabilities();

  useEffect(() => {
    loadAvailableApps();
  }, [loadAvailableApps]);

  const filteredApps = availableApps.filter(app =>
    app.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isAppBlocked = (packageName: string) => {
    return blockedApps.some(app => app.packageName === packageName && app.isActive);
  };

  const handleToggleApp = async (app: AppInfo) => {
    await toggleBlockedApp(app);
  };

  return (
    <div className="space-y-4">
      {/* Platform Notice */}
      {!capabilities.canBlockApps && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20"
        >
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
                {platform === 'ios' 
                  ? 'iOS uses Guided Access for app blocking'
                  : 'App blocking requires the native app'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {platform === 'ios'
                  ? 'You can still select apps here, but you\'ll need to enable Guided Access in Settings.'
                  : 'Selected apps will show as reminders during focus sessions.'}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Permissions Check */}
      {capabilities.isNative && !permissionsGranted && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-destructive" />
              <p className="text-sm font-medium">Permissions Required</p>
            </div>
            <Button size="sm" onClick={requestPermissions}>
              Grant Access
            </Button>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search apps..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Selected Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {blockedApps.length} apps selected to block
        </p>
        {blockedApps.length > 0 && (
          <Badge variant="secondary">
            {blockedApps.length} blocked
          </Badge>
        )}
      </div>

      {/* App List */}
      <ScrollArea className="h-[400px] pr-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {filteredApps.map((app, index) => {
              const isBlocked = isAppBlocked(app.packageName);
              return (
                <motion.button
                  key={app.packageName}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.02 }}
                  onClick={() => handleToggleApp(app)}
                  className={`relative p-3 rounded-xl border transition-all ${
                    isBlocked
                      ? 'bg-primary/10 border-primary'
                      : 'bg-card border-border hover:border-primary/50'
                  }`}
                >
                  {/* Check mark for selected */}
                  {isBlocked && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                      <Check className="w-3 h-3 text-primary-foreground" />
                    </div>
                  )}
                  
                  {/* App Icon */}
                  <div className="text-2xl mb-1">{app.icon}</div>
                  
                  {/* App Name */}
                  <p className="text-xs font-medium text-foreground truncate">
                    {app.name}
                  </p>
                </motion.button>
              );
            })}
          </div>
        )}
      </ScrollArea>

      {/* Done Button */}
      {onClose && (
        <Button onClick={onClose} className="w-full">
          Done
        </Button>
      )}
    </div>
  );
};

export default AppSelector;
