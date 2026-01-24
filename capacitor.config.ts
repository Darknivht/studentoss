import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.studentoss.app",
  appName: "studentoss",
  webDir: "dist",
  server: {
    url: "https://studentoss.lovable.app?forceHideBadge=true",
    cleartext: true,
  },
  ios: {
    contentInset: "automatic",
    preferredContentMode: "mobile",
    allowsLinkPreview: false,
    backgroundColor: "#0f0f23",
  },
  android: {
    backgroundColor: "#0f0f23",
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: "#0f0f23",
      showSpinner: true,
      spinnerColor: "#7c3aed",
    },
    Keyboard: {
      resize: "body",
      resizeOnFullScreen: true,
    },
    StatusBar: {
      style: "dark",
      backgroundColor: "#0f0f23",
    },
  },
};

export default config;
