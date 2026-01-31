import { registerPlugin, Capacitor } from '@capacitor/core';

export interface AppInfo {
  name: string;
  packageName: string;
  icon: string;
}

export interface PermissionStatus {
  usageStats: boolean;
  overlay: boolean;
  all: boolean;
}

export interface BlockingStatus {
  isBlocking: boolean;
  packages: string[];
  startTime?: number;
  duration?: number;
}

export interface FocusModePluginInterface {
  // Permission methods
  checkPermissions(): Promise<PermissionStatus>;
  requestPermissions(options?: { type: 'usageStats' | 'overlay' | 'all' }): Promise<PermissionStatus>;
  
  // App listing
  getInstalledApps(): Promise<{ apps: AppInfo[] }>;
  
  // Blocking control
  startBlocking(options: { packages: string[]; duration: number }): Promise<void>;
  stopBlocking(): Promise<void>;
  isBlocking(): Promise<BlockingStatus>;
  
  // Kiosk mode (locks user in app)
  enterKioskMode(): Promise<void>;
  exitKioskMode(): Promise<void>;
  isKioskModeActive(): Promise<{ active: boolean }>;
  
  // Event listeners
  addListener(
    eventName: 'blockedAppDetected',
    listenerFunc: (data: { packageName: string; appName: string }) => void
  ): Promise<{ remove: () => void }>;
}

// Register the plugin
const FocusModePlugin = registerPlugin<FocusModePluginInterface>('FocusMode', {
  web: () => import('./FocusModePluginWeb').then(m => new m.FocusModePluginWeb()),
});

// Helper to check platform capabilities
export const getPlatformCapabilities = () => {
  const platform = Capacitor.getPlatform();
  return {
    platform,
    isNative: Capacitor.isNativePlatform(),
    canBlockApps: platform === 'android', // Only Android can truly block
    canUseKiosk: platform === 'android',
    needsGuidedAccess: platform === 'ios',
    isWeb: platform === 'web',
  };
};

// Popular apps for web fallback
export const POPULAR_DISTRACTION_APPS: AppInfo[] = [
  { name: 'Instagram', packageName: 'com.instagram.android', icon: '📸' },
  { name: 'TikTok', packageName: 'com.zhiliaoapp.musically', icon: '🎵' },
  { name: 'Snapchat', packageName: 'com.snapchat.android', icon: '👻' },
  { name: 'Twitter/X', packageName: 'com.twitter.android', icon: '🐦' },
  { name: 'Facebook', packageName: 'com.facebook.katana', icon: '👤' },
  { name: 'YouTube', packageName: 'com.google.android.youtube', icon: '▶️' },
  { name: 'Reddit', packageName: 'com.reddit.frontpage', icon: '🔴' },
  { name: 'WhatsApp', packageName: 'com.whatsapp', icon: '💬' },
  { name: 'Messenger', packageName: 'com.facebook.orca', icon: '💭' },
  { name: 'Discord', packageName: 'com.discord', icon: '🎮' },
  { name: 'Telegram', packageName: 'org.telegram.messenger', icon: '✈️' },
  { name: 'Netflix', packageName: 'com.netflix.mediaclient', icon: '🎬' },
  { name: 'Twitch', packageName: 'tv.twitch.android.app', icon: '🎮' },
  { name: 'Pinterest', packageName: 'com.pinterest', icon: '📌' },
  { name: 'Spotify', packageName: 'com.spotify.music', icon: '🎧' },
];

export default FocusModePlugin;
