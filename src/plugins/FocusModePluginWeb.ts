import { WebPlugin } from '@capacitor/core';
import type { FocusModePluginInterface, PermissionStatus, BlockingStatus, AppInfo } from './FocusModePlugin';
import { POPULAR_DISTRACTION_APPS } from './FocusModePlugin';

/**
 * Web implementation of FocusModePlugin
 * Since web browsers can't actually block apps, this provides a mock implementation
 * that tracks blocking state and can trigger overlay reminders
 */
export class FocusModePluginWeb extends WebPlugin implements FocusModePluginInterface {
  private blockingState: BlockingStatus = {
    isBlocking: false,
    packages: [],
  };
  private kioskActive = false;

  async checkPermissions(): Promise<PermissionStatus> {
    // Web always has "permissions" since it can't actually block
    return {
      usageStats: true,
      overlay: true,
      all: true,
    };
  }

  async requestPermissions(): Promise<PermissionStatus> {
    return this.checkPermissions();
  }

  async getInstalledApps(): Promise<{ apps: AppInfo[] }> {
    // Return popular apps list as fallback
    return { apps: POPULAR_DISTRACTION_APPS };
  }

  async startBlocking(options: { packages: string[]; duration: number }): Promise<void> {
    this.blockingState = {
      isBlocking: true,
      packages: options.packages,
      startTime: Date.now(),
      duration: options.duration,
    };
    console.log('[FocusModePlugin Web] Started mock blocking:', options.packages);
  }

  async stopBlocking(): Promise<void> {
    this.blockingState = {
      isBlocking: false,
      packages: [],
    };
    console.log('[FocusModePlugin Web] Stopped blocking');
  }

  async isBlocking(): Promise<BlockingStatus> {
    return this.blockingState;
  }

  async enterKioskMode(): Promise<void> {
    this.kioskActive = true;
    console.log('[FocusModePlugin Web] Entered mock kiosk mode');
    // In web, we can try to prevent navigation
    if (typeof window !== 'undefined') {
      window.onbeforeunload = () => 'Focus session in progress. Are you sure you want to leave?';
    }
  }

  async exitKioskMode(): Promise<void> {
    this.kioskActive = false;
    console.log('[FocusModePlugin Web] Exited kiosk mode');
    if (typeof window !== 'undefined') {
      window.onbeforeunload = null;
    }
  }

  async isKioskModeActive(): Promise<{ active: boolean }> {
    return { active: this.kioskActive };
  }
}
