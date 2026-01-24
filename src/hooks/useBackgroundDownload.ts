import { useEffect, useRef, useCallback } from 'react';
import { App, AppState } from '@capacitor/app';
import { LocalNotifications, ScheduleResult } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

interface BackgroundDownloadState {
  isActive: boolean;
  modelName: string;
  progress: number;
  downloadedBytes: number;
  totalBytes: number;
}

const NOTIFICATION_ID = 1001;
const DOWNLOAD_STATE_KEY = 'background_download_active';

// Format bytes helper
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function useBackgroundDownload() {
  const notificationScheduledRef = useRef(false);
  const lastProgressRef = useRef(0);
  const isBackgroundRef = useRef(false);
  const downloadStateRef = useRef<BackgroundDownloadState | null>(null);

  // Check if we're on a native platform
  const isNative = Capacitor.isNativePlatform();

  // Request notification permissions
  const requestPermissions = useCallback(async () => {
    if (!isNative) return false;
    
    try {
      const permission = await LocalNotifications.requestPermissions();
      return permission.display === 'granted';
    } catch (e) {
      console.warn('Could not request notification permissions:', e);
      return false;
    }
  }, [isNative]);

  // Show/update download progress notification
  const showProgressNotification = useCallback(async (
    modelName: string,
    progress: number,
    downloadedBytes: number,
    totalBytes: number
  ) => {
    if (!isNative) return;
    
    try {
      // Only update notification every 5% or if significant change
      if (Math.abs(progress - lastProgressRef.current) < 5 && progress < 100) {
        return;
      }
      lastProgressRef.current = progress;

      const progressText = `${formatBytes(downloadedBytes)} / ${formatBytes(totalBytes)}`;
      const percentText = `${Math.round(progress)}%`;

      await LocalNotifications.schedule({
        notifications: [
          {
            id: NOTIFICATION_ID,
            title: `Downloading ${modelName}`,
            body: `${percentText} - ${progressText}`,
            ongoing: progress < 100,
            autoCancel: false,
            smallIcon: 'ic_stat_cloud_download',
            largeIcon: 'ic_stat_cloud_download',
            channelId: 'download_progress',
            extra: {
              progress,
              downloadedBytes,
              totalBytes,
            },
          },
        ],
      });

      notificationScheduledRef.current = true;
    } catch (e) {
      console.warn('Could not show notification:', e);
    }
  }, [isNative]);

  // Show completion notification
  const showCompletionNotification = useCallback(async (modelName: string, success: boolean) => {
    if (!isNative) return;

    try {
      // Cancel the progress notification first
      await LocalNotifications.cancel({ notifications: [{ id: NOTIFICATION_ID }] });

      await LocalNotifications.schedule({
        notifications: [
          {
            id: NOTIFICATION_ID + 1,
            title: success ? 'Download Complete! 🧠' : 'Download Failed',
            body: success 
              ? `${modelName} is ready for offline use` 
              : 'Tap to retry the download',
            autoCancel: true,
            smallIcon: success ? 'ic_stat_check_circle' : 'ic_stat_error',
            largeIcon: success ? 'ic_stat_check_circle' : 'ic_stat_error',
            channelId: 'download_complete',
          },
        ],
      });

      notificationScheduledRef.current = false;
      localStorage.removeItem(DOWNLOAD_STATE_KEY);
    } catch (e) {
      console.warn('Could not show completion notification:', e);
    }
  }, [isNative]);

  // Cancel download notification
  const cancelNotification = useCallback(async () => {
    if (!isNative) return;

    try {
      await LocalNotifications.cancel({ notifications: [{ id: NOTIFICATION_ID }] });
      notificationScheduledRef.current = false;
      localStorage.removeItem(DOWNLOAD_STATE_KEY);
    } catch (e) {
      console.warn('Could not cancel notification:', e);
    }
  }, [isNative]);

  // Save download state for background continuity
  const saveDownloadState = useCallback((state: BackgroundDownloadState) => {
    downloadStateRef.current = state;
    try {
      localStorage.setItem(DOWNLOAD_STATE_KEY, JSON.stringify(state));
    } catch (e) {
      // Ignore
    }
  }, []);

  // Load download state
  const loadDownloadState = useCallback((): BackgroundDownloadState | null => {
    try {
      const saved = localStorage.getItem(DOWNLOAD_STATE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  }, []);

  // Check if download is in background
  const isInBackground = useCallback(() => isBackgroundRef.current, []);

  // Create notification channel (Android)
  const createNotificationChannel = useCallback(async () => {
    if (!isNative || Capacitor.getPlatform() !== 'android') return;

    try {
      await LocalNotifications.createChannel({
        id: 'download_progress',
        name: 'Download Progress',
        description: 'Shows AI model download progress',
        importance: 4, // HIGH - shows in notification shade
        visibility: 1, // PUBLIC
        vibration: false,
        sound: undefined,
      });

      await LocalNotifications.createChannel({
        id: 'download_complete',
        name: 'Download Complete',
        description: 'Notifies when AI model download completes',
        importance: 4,
        visibility: 1,
        vibration: true,
      });
    } catch (e) {
      console.warn('Could not create notification channels:', e);
    }
  }, [isNative]);

  // Listen for app state changes
  useEffect(() => {
    if (!isNative) return;

    let appStateListener: any = null;

    const setupListener = async () => {
      // Create channels first
      await createNotificationChannel();
      await requestPermissions();

      // Listen for app going to background/foreground
      appStateListener = await App.addListener('appStateChange', (state: AppState) => {
        isBackgroundRef.current = !state.isActive;

        if (!state.isActive) {
          // App went to background - show notification if downloading
          const downloadState = downloadStateRef.current || loadDownloadState();
          if (downloadState?.isActive) {
            showProgressNotification(
              downloadState.modelName,
              downloadState.progress,
              downloadState.downloadedBytes,
              downloadState.totalBytes
            );
          }
        } else {
          // App came to foreground - we can optionally hide notification
          // But keeping it visible is often better UX
        }
      });
    };

    setupListener();

    return () => {
      if (appStateListener) {
        appStateListener.remove();
      }
    };
  }, [isNative, createNotificationChannel, requestPermissions, loadDownloadState, showProgressNotification]);

  return {
    isNative,
    isInBackground,
    requestPermissions,
    showProgressNotification,
    showCompletionNotification,
    cancelNotification,
    saveDownloadState,
    loadDownloadState,
    createNotificationChannel,
  };
}
