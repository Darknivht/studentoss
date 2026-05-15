# 01-offline-sync — Offline Sync

Port lib/offlineSync.ts replacing IndexedDB with MMKV. Queue mutations when offline (notes, flashcards, quiz attempts, study sessions). On reconnect, drain queue oldest-first, retry with exponential backoff. Show OfflineSyncIndicator with pending count.

## Acceptance
- [ ] Works in airplane mode then syncs on reconnect (where applicable)
- [ ] No race conditions on concurrent writes
