import { useState, useEffect, useCallback } from 'react';
import { offlineSyncManager, SyncStatus } from '@/lib/offlineSync';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export const useOfflineSync = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    pendingCount: 0,
    lastSyncAttempt: 0,
    isSyncing: false,
  });

  useEffect(() => {
    const unsubConnectivity = offlineSyncManager.onConnectivityChange((online) => {
      setIsOnline(online);
      if (online) {
        toast({
          title: '🌐 Back Online',
          description: 'Syncing your offline changes...',
        });
      } else {
        toast({
          title: '📴 You\'re Offline',
          description: 'Changes will sync when you\'re back online.',
        });
      }
    });

    const unsubSync = offlineSyncManager.onSyncStatusChange((status) => {
      setSyncStatus(status);
    });

    // Initial sync status
    setSyncStatus({
      pendingCount: offlineSyncManager.getPendingActions().length,
      lastSyncAttempt: Date.now(),
      isSyncing: false,
    });

    return () => {
      unsubConnectivity();
      unsubSync();
    };
  }, [toast]);

  const queueAction = useCallback(
    async (table: string, action: 'insert' | 'update' | 'delete', data: any) => {
      if (!user) {
        throw new Error('User not authenticated');
      }

      const result = await offlineSyncManager.queueAction(table, action, data, user.id);

      if (result.offlineQueued) {
        toast({
          title: '📝 Saved Offline',
          description: 'This change will sync when you\'re online.',
        });
      }

      return result;
    },
    [user, toast]
  );

  const syncNow = useCallback(async () => {
    if (!isOnline) {
      toast({
        title: 'Cannot Sync',
        description: 'You need an internet connection to sync.',
        variant: 'destructive',
      });
      return;
    }

    const results = await offlineSyncManager.attemptSync();

    if (results.synced > 0) {
      toast({
        title: '✅ Sync Complete',
        description: `${results.synced} change${results.synced !== 1 ? 's' : ''} synced successfully.`,
      });
    }

    if (results.failed > 0) {
      toast({
        title: '⚠️ Some Changes Failed',
        description: `${results.failed} change${results.failed !== 1 ? 's' : ''} couldn't be synced.`,
        variant: 'destructive',
      });
    }

    return results;
  }, [isOnline, toast]);

  const clearPending = useCallback(() => {
    offlineSyncManager.clearPendingActions();
    toast({
      title: 'Pending Changes Cleared',
      description: 'All offline changes have been discarded.',
    });
  }, [toast]);

  return {
    isOnline,
    syncStatus,
    queueAction,
    syncNow,
    clearPending,
    pendingActions: offlineSyncManager.getPendingActions(),
  };
};
