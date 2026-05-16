# realtime — Realtime

## Use cases
- Chat (messages, typing, read receipts)
- Friend requests
- Group activity (new member, challenge sent)
- Live leaderboard updates (throttled)

## Setup

```ts
const channel = supabase
  .channel(`chat:${threadId}`)
  .on('postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages', filter: `thread_id=eq.${threadId}` },
      payload => { addMessage(payload.new); })
  .on('broadcast', { event: 'typing' }, p => setTyping(p.payload.userId, true))
  .subscribe();
```

Unsubscribe on screen unfocus to save bandwidth: `useEffect(() => { ... return () => supabase.removeChannel(channel); }, [])`.

## App state handling
On `AppState` 'background', remove all channels. On 'active', recreate. Avoids stale connections after long sleep.

## Connection resilience
Wrap reconnects with exponential backoff. Show subtle 'reconnecting...' banner if disconnected > 5s.

## RLS reminder
Realtime respects RLS. Make sure policies allow SELECT on the rows you broadcast.

## Acceptance
- [ ] Messages arrive < 500ms
- [ ] Channels cleaned up on unmount
- [ ] Reconnect after airplane mode toggle works

