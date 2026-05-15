# 02-realtime — Realtime

supabase.channel('group:'+groupId).on('postgres_changes', ...).subscribe() — works identically to web. Used by GroupChat, Leaderboard, peer challenges. Unsubscribe in screen blur.

## Acceptance
- [ ] Works in airplane mode then syncs on reconnect (where applicable)
- [ ] No race conditions on concurrent writes
