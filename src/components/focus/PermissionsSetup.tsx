import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Check, X, ExternalLink, Smartphone, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useFocusLock } from '@/hooks/useFocusLock';
import { getPlatformCapabilities } from '@/plugins/FocusModePlugin';

interface PermissionsSetupProps {
  onComplete?: () => void;
}

const PermissionsSetup = ({ onComplete }: PermissionsSetupProps) => {
  const { permissionsGranted, checkPermissions, requestPermissions } = useFocusLock();
  const capabilities = getPlatformCapabilities();
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    if (capabilities.isNative) {
      checkPermissions();
    }
  }, [capabilities.isNative, checkPermissions]);

  const handleRequestPermissions = async () => {
    setIsChecking(true);
    await requestPermissions();
    setIsChecking(false);
  };

  // iOS Guided Access Instructions
  if (capabilities.needsGuidedAccess) {
    return (
      <Card className="border-border">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg">iOS Guided Access</CardTitle>
          </div>
          <CardDescription>
            iOS uses Guided Access for app locking. Follow these steps:
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {[
              'Open Settings → Accessibility → Guided Access',
              'Turn on Guided Access',
              'Set a passcode for Guided Access',
              'Triple-click the side button to start Guided Access',
              'When in StudentOss, triple-click to lock the app',
            ].map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start gap-3"
              >
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-primary">{index + 1}</span>
                </div>
                <p className="text-sm text-muted-foreground">{step}</p>
              </motion.div>
            ))}
          </div>

          <div className="p-3 rounded-lg bg-muted">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-muted-foreground mt-0.5" />
              <p className="text-xs text-muted-foreground">
                Guided Access prevents you from leaving the app until you enter your passcode.
              </p>
            </div>
          </div>

          <Button 
            onClick={onComplete}
            className="w-full"
          >
            I've Set Up Guided Access
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Web Platform
  if (!capabilities.isNative) {
    return (
      <Card className="border-border">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg">Focus Reminders</CardTitle>
          </div>
          <CardDescription>
            Browser-based focus mode with overlay reminders
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 rounded-xl bg-muted">
            <p className="text-sm text-muted-foreground">
              Since you're using the web version, we can't block other apps directly. 
              However, we'll show you reminders if you try to leave during a focus session.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-medium">What you'll get:</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500" />
                Full-screen focus overlay
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500" />
                Exit confirmation warnings
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500" />
                Session tracking & stats
              </li>
            </ul>
          </div>

          <Button onClick={onComplete} className="w-full">
            Continue
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Android Permissions
  return (
    <Card className="border-border">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          <CardTitle className="text-lg">App Permissions</CardTitle>
        </div>
        <CardDescription>
          Grant permissions to enable app blocking
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Permission Status */}
        <div className="space-y-3">
          <PermissionItem
            title="Usage Stats Access"
            description="Detect which apps are running"
            granted={permissionsGranted}
          />
          <PermissionItem
            title="Display Over Apps"
            description="Show blocking overlay"
            granted={permissionsGranted}
          />
        </div>

        {/* Grant Button */}
        {!permissionsGranted && (
          <Button
            onClick={handleRequestPermissions}
            disabled={isChecking}
            className="w-full"
          >
            {isChecking ? 'Checking...' : 'Grant Permissions'}
          </Button>
        )}

        {permissionsGranted && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 text-emerald-500"
          >
            <Check className="w-5 h-5" />
            <span className="text-sm font-medium">All permissions granted!</span>
          </motion.div>
        )}

        {permissionsGranted && (
          <Button onClick={onComplete} className="w-full">
            Continue
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

// Permission Item Component
interface PermissionItemProps {
  title: string;
  description: string;
  granted: boolean;
}

const PermissionItem = ({ title, description, granted }: PermissionItemProps) => (
  <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
    <div>
      <p className="text-sm font-medium">{title}</p>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
    {granted ? (
      <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center">
        <Check className="w-4 h-4 text-emerald-500" />
      </div>
    ) : (
      <div className="w-6 h-6 rounded-full bg-destructive/10 flex items-center justify-center">
        <X className="w-4 h-4 text-destructive" />
      </div>
    )}
  </div>
);

export default PermissionsSetup;
