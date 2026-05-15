# 04 — Files to Adapt (Light Edits)

These files have a small browser dependency that swaps cleanly for an RN equivalent.

## `useAuth.tsx` → `useAuth.tsx`

**Web:** uses `localStorage` via Supabase client default.
**Edit:** the Supabase client itself (in `integrations/supabase/client.ts`) is the only file that changes — see [`02-infrastructure/01-supabase-client.md`](../02-infrastructure/01-supabase-client.md). The `useAuth` hook itself is verbatim.

## `useNotifications.ts`

**Web:** Browser Notifications API + service worker.
**Edit:** swap to `expo-notifications`.

```ts
// web
new Notification(title, { body });

// rn
import * as Notifications from 'expo-notifications';
await Notifications.scheduleNotificationAsync({
  content: { title, body },
  trigger: null, // immediate
});
```

Full port template in [`06-native-features/05-push-notifications.md`](../06-native-features/05-push-notifications.md).

## `useOfflineStatus.ts`

**Web:** `navigator.onLine` + `online`/`offline` events.
**Edit:** `@react-native-community/netinfo`.

```ts
import NetInfo from '@react-native-community/netinfo';

export function useOfflineStatus() {
  const [online, setOnline] = useState(true);
  useEffect(() => {
    const unsub = NetInfo.addEventListener(s => setOnline(!!s.isConnected));
    return unsub;
  }, []);
  return !online;
}
```

## `useOfflineSync.ts` + `lib/offlineSync.ts`

**Web:** IndexedDB via `idb`.
**Edit:** Replace storage with **MMKV** (sync) + write a tiny adapter so the rest of the file is unchanged.

```ts
// src/lib/storage.ts
import { MMKV } from 'react-native-mmkv';
const mmkv = new MMKV();
export const storage = {
  get: <T,>(k: string): T | null => {
    const v = mmkv.getString(k);
    return v ? JSON.parse(v) : null;
  },
  set: (k: string, v: unknown) => mmkv.set(k, JSON.stringify(v)),
  del: (k: string) => mmkv.delete(k),
  keys: () => mmkv.getAllKeys(),
};
```

Replace every `idb.openDB(...)` call site with `storage.*`. See [`07-data-and-offline/01-offline-sync.md`](../07-data-and-offline/01-offline-sync.md).

## `useFocusMode.ts` / `useFocusLock.ts`

**Web:** No-op stubs (returns "feature unavailable").
**Edit:** Wire to the new Expo focus-mode plugin. See [`06-native-features/01-app-blocking-android.md`](../06-native-features/01-app-blocking-android.md).

## `useMobileBackNavigation.ts`

**Web:** Capacitor `App.addListener('backButton', ...)`.
**Edit:** Use React Navigation's `BackHandler` directly.

```ts
import { BackHandler } from 'react-native';
import { useNavigation } from '@react-navigation/native';

export function useMobileBackNavigation() {
  const nav = useNavigation();
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (nav.canGoBack()) { nav.goBack(); return true; }
      return false; // let OS exit
    });
    return () => sub.remove();
  }, [nav]);
}
```

## `useBackgroundDownload.ts`

**Web:** Service Worker `Cache` API.
**Edit:** `expo-file-system` `downloadAsync` + MMKV index.

## `usePWAUpdate.ts`

**Web:** Workbox `skipWaiting`.
**Edit:** Delete. Replaced by `expo-updates`. See [`08-testing-and-release/04-ota-updates.md`](../08-testing-and-release/04-ota-updates.md).

## Acceptance

- [ ] All 7 hooks compile in RN
- [ ] Auth survives app restart
- [ ] `useOfflineStatus` flips correctly when airplane mode toggled
