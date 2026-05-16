# offline-sync — Offline Sync

## Goal
Allow mutations while offline; sync to server when online.

## Storage
- **MMKV** for the queue
- **expo-file-system** for binary payloads (images, audio)

## Queue shape

```ts
type QueueItem = {
  id: string;            // uuid
  op: 'insert' | 'update' | 'delete' | 'upload';
  table?: string;
  payload: any;
  filePath?: string;     // for uploads
  bucket?: string;
  retries: number;
  createdAt: number;
};
```

Stored under MMKV key `offline_queue` as JSON array.

## Operations covered
- Note create/update/delete
- Flashcard reviews (SM-2 ratings)
- Quiz attempts
- Study session logs (start/stop times + duration)
- Chat messages
- File uploads

## Drain logic

```ts
async function drainQueue() {
  const queue = getQueue();
  for (const item of queue) {
    try {
      await execute(item);
      removeFromQueue(item.id);
    } catch (e) {
      item.retries += 1;
      if (item.retries > 5) moveToDeadLetter(item);
      else updateInQueue(item);
      const backoff = Math.min(60000, 1000 * 2 ** item.retries);
      await sleep(backoff);
    }
  }
}
```

Trigger drain:
- On `NetInfo` connectivity restored
- On app foreground (`AppState` 'active')
- Every 30s if items present

## Conflict resolution
Last-write-wins by `updated_at`. For notes, server returns latest — show conflict UI if local newer than server but server has divergent edits (rare; OK to overwrite for v1).

## UI indicator
`OfflineSyncIndicator` shows pending count. Tap → list of queued items.

## Acceptance
- [ ] All mutation types queue offline
- [ ] Drain on reconnect within 5s
- [ ] Dead letter visible to user with retry button
- [ ] No data loss on app kill mid-drain

