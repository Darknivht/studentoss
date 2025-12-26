import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.3466d826a12e410298a159cf4922e191',
  appName: 'studentoss',
  webDir: 'dist',
  server: {
    url: 'https://3466d826-a12e-4102-98a1-59cf4922e191.lovableproject.com?forceHideBadge=true',
    cleartext: true,
  },
  ios: {
    contentInset: 'automatic',
    preferredContentMode: 'mobile',
    allowsLinkPreview: false,
    backgroundColor: '#0f0f23',
  },
  android: {
    backgroundColor: '#0f0f23',
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#0f0f23',
      showSpinner: true,
      spinnerColor: '#7c3aed',
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#0f0f23',
    },
  },
};

export default config;
