# 03-file-storage — File Storage

expo-file-system for cache dir + downloads. Supabase storage SDK same API. Background downloads via FileSystem.createDownloadResumable. Cache PDFs by URL hash, evict LRU when >200MB.

## Acceptance
- [ ] Works in airplane mode then syncs on reconnect (where applicable)
- [ ] No race conditions on concurrent writes
