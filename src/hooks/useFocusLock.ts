import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import FocusModePlugin, { getPlatformCapabilities, POPULAR_DISTRACTION_APPS, AppInfo } from '@/plugins/FocusModePlugin';

interface FocusSession {
  id: string;
  startTime: Date;
  targetDuration: number;
  blockedApps: string[];
  status: 'active' | 'completed' | 'failed' | 'paused';
}

interface BlockedApp {
  id: string;
  packageName: string;
  appName: string;
  appIcon: string;
  isActive: boolean;
}

interface UseFocusLockResult {
  // State
  isLocked: boolean;
  isBlocking: boolean;
  permissionsGranted: boolean;
  platform: 'android' | 'ios' | 'web';
  blockedAppDetected: string | null;
  currentSession: FocusSession | null;
  blockedApps: BlockedApp[];
  availableApps: AppInfo[];
  isLoading: boolean;
  parentPinHash: string | null;

  // Methods
  checkPermissions: () => Promise<boolean>;
  requestPermissions: () => Promise<boolean>;
  startFocusSession: (durationMinutes: number) => Promise<boolean>;
  endFocusSession: (reason?: 'completed' | 'failed') => Promise<void>;
  pauseFocusSession: () => Promise<void>;
  resumeFocusSession: () => Promise<void>;
  emergencyExit: (pin: string) => Promise<boolean>;
  
  // App management
  loadAvailableApps: () => Promise<void>;
  toggleBlockedApp: (app: AppInfo) => Promise<void>;
  loadBlockedApps: () => Promise<void>;
  
  // PIN management
  setParentPin: (pin: string) => Promise<void>;
  verifyParentPin: (pin: string) => boolean;
}

const PARENT_PIN_KEY = 'focus_mode_parent_pin';

// Simple hash function for PIN (not cryptographically secure, but sufficient for this use case)
const hashPin = (pin: string): string => {
  let hash = 0;
  for (let i = 0; i < pin.length; i++) {
    const char = pin.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(36);
};

export function useFocusLock(): UseFocusLockResult {
  const { user } = useAuth();
  const [isLocked, setIsLocked] = useState(false);
  const [isBlocking, setIsBlocking] = useState(false);
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  const [blockedAppDetected, setBlockedAppDetected] = useState<string | null>(null);
  const [currentSession, setCurrentSession] = useState<FocusSession | null>(null);
  const [blockedApps, setBlockedApps] = useState<BlockedApp[]>([]);
  const [availableApps, setAvailableApps] = useState<AppInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [parentPinHash, setParentPinHash] = useState<string | null>(null);

  const capabilities = getPlatformCapabilities();
  const platform = capabilities.platform as 'android' | 'ios' | 'web';

  // Load parent PIN from storage
  useEffect(() => {
    const stored = localStorage.getItem(PARENT_PIN_KEY);
    if (stored) {
      setParentPinHash(stored);
    }
  }, []);

  // Check for active session on mount
  useEffect(() => {
    if (user) {
      checkActiveSession();
      loadBlockedApps();
    }
  }, [user]);

  const checkActiveSession = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('focus_sessions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (data) {
      setCurrentSession({
        id: data.id,
        startTime: new Date(data.start_time),
        targetDuration: data.target_duration_minutes,
        blockedApps: (data.blocked_apps as string[]) || [],
        status: data.status as FocusSession['status'],
      });
      setIsLocked(true);
      setIsBlocking(true);
    }
  };

  const checkPermissions = useCallback(async (): Promise<boolean> => {
    if (!capabilities.isNative) {
      setPermissionsGranted(true);
      return true;
    }

    try {
      const status = await FocusModePlugin.checkPermissions();
      setPermissionsGranted(status.all);
      return status.all;
    } catch (error) {
      console.error('Failed to check permissions:', error);
      return false;
    }
  }, [capabilities.isNative]);

  const requestPermissions = useCallback(async (): Promise<boolean> => {
    if (!capabilities.isNative) {
      setPermissionsGranted(true);
      return true;
    }

    try {
      const status = await FocusModePlugin.requestPermissions({ type: 'all' });
      setPermissionsGranted(status.all);
      return status.all;
    } catch (error) {
      console.error('Failed to request permissions:', error);
      return false;
    }
  }, [capabilities.isNative]);

  const loadAvailableApps = useCallback(async () => {
    setIsLoading(true);
    try {
      if (capabilities.isNative && capabilities.canBlockApps) {
        const { apps } = await FocusModePlugin.getInstalledApps();
        setAvailableApps(apps);
      } else {
        setAvailableApps(POPULAR_DISTRACTION_APPS);
      }
    } catch (error) {
      console.error('Failed to load apps:', error);
      setAvailableApps(POPULAR_DISTRACTION_APPS);
    } finally {
      setIsLoading(false);
    }
  }, [capabilities]);

  const loadBlockedApps = useCallback(async () => {
    if (!user) return;

    const { data } = await supabase
      .from('blocked_app_list')
      .select('*')
      .eq('user_id', user.id);

    if (data) {
      setBlockedApps(data.map(app => ({
        id: app.id,
        packageName: app.package_name,
        appName: app.app_name,
        appIcon: app.app_icon || '📱',
        isActive: app.is_active,
      })));
    }
  }, [user]);

  const toggleBlockedApp = useCallback(async (app: AppInfo) => {
    if (!user) return;

    const existing = blockedApps.find(b => b.packageName === app.packageName);
    
    if (existing) {
      // Toggle or remove
      await supabase
        .from('blocked_app_list')
        .delete()
        .eq('id', existing.id);
      
      setBlockedApps(prev => prev.filter(b => b.id !== existing.id));
    } else {
      // Add new
      const { data } = await supabase
        .from('blocked_app_list')
        .insert({
          user_id: user.id,
          package_name: app.packageName,
          app_name: app.name,
          app_icon: app.icon,
          is_active: true,
        })
        .select()
        .single();

      if (data) {
        setBlockedApps(prev => [...prev, {
          id: data.id,
          packageName: data.package_name,
          appName: data.app_name,
          appIcon: data.app_icon || '📱',
          isActive: data.is_active,
        }]);
      }
    }
  }, [user, blockedApps]);

  const startFocusSession = useCallback(async (durationMinutes: number): Promise<boolean> => {
    if (!user) return false;

    const activeBlockedApps = blockedApps.filter(app => app.isActive);
    const packageNames = activeBlockedApps.map(app => app.packageName);

    try {
      // Create session in database
      const { data, error } = await supabase
        .from('focus_sessions')
        .insert({
          user_id: user.id,
          target_duration_minutes: durationMinutes,
          blocked_apps: packageNames,
          status: 'active',
        })
        .select()
        .single();

      if (error || !data) {
        console.error('Failed to create focus session:', error);
        return false;
      }

      // Start native blocking if available
      if (capabilities.canBlockApps && packageNames.length > 0) {
        await FocusModePlugin.startBlocking({
          packages: packageNames,
          duration: durationMinutes * 60,
        });

        // Enter kiosk mode if available
        if (capabilities.canUseKiosk) {
          await FocusModePlugin.enterKioskMode();
        }
      }

      setCurrentSession({
        id: data.id,
        startTime: new Date(data.start_time),
        targetDuration: durationMinutes,
        blockedApps: packageNames,
        status: 'active',
      });
      setIsLocked(true);
      setIsBlocking(true);

      return true;
    } catch (error) {
      console.error('Failed to start focus session:', error);
      return false;
    }
  }, [user, blockedApps, capabilities]);

  const endFocusSession = useCallback(async (reason: 'completed' | 'failed' = 'completed') => {
    if (!currentSession || !user) return;

    const endTime = new Date();
    const actualMinutes = Math.floor(
      (endTime.getTime() - currentSession.startTime.getTime()) / 60000
    );

    try {
      // Update session in database
      await supabase
        .from('focus_sessions')
        .update({
          end_time: endTime.toISOString(),
          actual_duration_minutes: actualMinutes,
          status: reason,
        })
        .eq('id', currentSession.id);

      // Stop native blocking
      if (capabilities.canBlockApps) {
        await FocusModePlugin.stopBlocking();
      }

      // Exit kiosk mode
      if (capabilities.canUseKiosk) {
        await FocusModePlugin.exitKioskMode();
      }

      setCurrentSession(null);
      setIsLocked(false);
      setIsBlocking(false);
      setBlockedAppDetected(null);
    } catch (error) {
      console.error('Failed to end focus session:', error);
    }
  }, [currentSession, user, capabilities]);

  const pauseFocusSession = useCallback(async () => {
    if (!currentSession) return;

    await supabase
      .from('focus_sessions')
      .update({ status: 'paused' })
      .eq('id', currentSession.id);

    if (capabilities.canBlockApps) {
      await FocusModePlugin.stopBlocking();
    }

    setCurrentSession(prev => prev ? { ...prev, status: 'paused' } : null);
    setIsBlocking(false);
  }, [currentSession, capabilities]);

  const resumeFocusSession = useCallback(async () => {
    if (!currentSession) return;

    const packageNames = currentSession.blockedApps;
    const remainingMinutes = Math.max(
      1,
      currentSession.targetDuration - 
      Math.floor((Date.now() - currentSession.startTime.getTime()) / 60000)
    );

    await supabase
      .from('focus_sessions')
      .update({ status: 'active' })
      .eq('id', currentSession.id);

    if (capabilities.canBlockApps && packageNames.length > 0) {
      await FocusModePlugin.startBlocking({
        packages: packageNames,
        duration: remainingMinutes * 60,
      });
    }

    setCurrentSession(prev => prev ? { ...prev, status: 'active' } : null);
    setIsBlocking(true);
  }, [currentSession, capabilities]);

  const setParentPin = useCallback(async (pin: string) => {
    const hashed = hashPin(pin);
    localStorage.setItem(PARENT_PIN_KEY, hashed);
    setParentPinHash(hashed);
  }, []);

  const verifyParentPin = useCallback((pin: string): boolean => {
    if (!parentPinHash) return false;
    return hashPin(pin) === parentPinHash;
  }, [parentPinHash]);

  const emergencyExit = useCallback(async (pin: string): Promise<boolean> => {
    if (!verifyParentPin(pin)) return false;

    await endFocusSession('failed');
    return true;
  }, [verifyParentPin, endFocusSession]);

  return {
    isLocked,
    isBlocking,
    permissionsGranted,
    platform,
    blockedAppDetected,
    currentSession,
    blockedApps,
    availableApps,
    isLoading,
    parentPinHash,
    checkPermissions,
    requestPermissions,
    startFocusSession,
    endFocusSession,
    pauseFocusSession,
    resumeFocusSession,
    emergencyExit,
    loadAvailableApps,
    toggleBlockedApp,
    loadBlockedApps,
    setParentPin,
    verifyParentPin,
  };
}
