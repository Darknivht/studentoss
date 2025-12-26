import { supabase } from '@/integrations/supabase/client';

interface PendingAction {
  id: string;
  table: string;
  action: 'insert' | 'update' | 'delete';
  data: any;
  timestamp: number;
  userId: string;
}

const PENDING_ACTIONS_KEY = 'offline_pending_actions';
const SYNC_STATUS_KEY = 'offline_sync_status';

class OfflineSyncManager {
  private isOnline: boolean = navigator.onLine;
  private isSyncing: boolean = false;
  private listeners: Set<(isOnline: boolean) => void> = new Set();
  private syncListeners: Set<(status: SyncStatus) => void> = new Set();

  constructor() {
    this.setupEventListeners();
    this.attemptSync();
  }

  private setupEventListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.notifyListeners();
      this.attemptSync();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.notifyListeners();
    });
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.isOnline));
  }

  private notifySyncListeners(status: SyncStatus) {
    this.syncListeners.forEach(listener => listener(status));
  }

  onConnectivityChange(callback: (isOnline: boolean) => void) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  onSyncStatusChange(callback: (status: SyncStatus) => void) {
    this.syncListeners.add(callback);
    return () => this.syncListeners.delete(callback);
  }

  getIsOnline(): boolean {
    return this.isOnline;
  }

  getPendingActions(): PendingAction[] {
    try {
      const stored = localStorage.getItem(PENDING_ACTIONS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  private savePendingActions(actions: PendingAction[]) {
    localStorage.setItem(PENDING_ACTIONS_KEY, JSON.stringify(actions));
    this.updateSyncStatus();
  }

  private updateSyncStatus() {
    const pending = this.getPendingActions();
    const status: SyncStatus = {
      pendingCount: pending.length,
      lastSyncAttempt: Date.now(),
      isSyncing: this.isSyncing,
    };
    localStorage.setItem(SYNC_STATUS_KEY, JSON.stringify(status));
    this.notifySyncListeners(status);
  }

  async queueAction(
    table: string,
    action: 'insert' | 'update' | 'delete',
    data: any,
    userId: string
  ): Promise<{ success: boolean; offlineQueued: boolean }> {
    // Try online first
    if (this.isOnline) {
      try {
        const result = await this.executeAction(table, action, data);
        if (result.success) {
          return { success: true, offlineQueued: false };
        }
      } catch (error) {
        console.log('Online action failed, queueing for later:', error);
      }
    }

    // Queue for offline sync
    const pendingAction: PendingAction = {
      id: crypto.randomUUID(),
      table,
      action,
      data,
      timestamp: Date.now(),
      userId,
    };

    const actions = this.getPendingActions();
    actions.push(pendingAction);
    this.savePendingActions(actions);

    return { success: true, offlineQueued: true };
  }

  private async executeAction(
    table: string,
    action: 'insert' | 'update' | 'delete',
    data: any
  ): Promise<{ success: boolean; error?: string }> {
    try {
      let result;

      // Type assertion to handle dynamic table names
      const tableRef = supabase.from(table as any);

      switch (action) {
        case 'insert':
          result = await tableRef.insert(data);
          break;
        case 'update':
          const { id, ...updateData } = data;
          result = await tableRef.update(updateData).eq('id', id);
          break;
        case 'delete':
          result = await tableRef.delete().eq('id', data.id);
          break;
      }

      if (result.error) {
        return { success: false, error: result.error.message };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async attemptSync(): Promise<{ synced: number; failed: number }> {
    if (!this.isOnline || this.isSyncing) {
      return { synced: 0, failed: 0 };
    }

    this.isSyncing = true;
    this.updateSyncStatus();

    const actions = this.getPendingActions();
    const results = { synced: 0, failed: 0 };
    const remainingActions: PendingAction[] = [];

    for (const action of actions) {
      try {
        const result = await this.executeAction(action.table, action.action, action.data);
        if (result.success) {
          results.synced++;
        } else {
          console.error(`Failed to sync action ${action.id}:`, result.error);
          remainingActions.push(action);
          results.failed++;
        }
      } catch (error) {
        console.error(`Error syncing action ${action.id}:`, error);
        remainingActions.push(action);
        results.failed++;
      }
    }

    this.savePendingActions(remainingActions);
    this.isSyncing = false;
    this.updateSyncStatus();

    return results;
  }

  clearPendingActions() {
    localStorage.removeItem(PENDING_ACTIONS_KEY);
    this.updateSyncStatus();
  }
}

export interface SyncStatus {
  pendingCount: number;
  lastSyncAttempt: number;
  isSyncing: boolean;
}

export const offlineSyncManager = new OfflineSyncManager();
