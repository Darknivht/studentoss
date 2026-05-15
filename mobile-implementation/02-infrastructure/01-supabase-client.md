# 01 — Supabase Client (RN)

The web client lives at `src/integrations/supabase/client.ts`. We replace it with an AsyncStorage-backed version.

## Create `src/integrations/supabase/client.ts`

```ts
import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import type { Database } from './types';

const SUPABASE_URL = Constants.expoConfig!.extra!.supabaseUrl as string;
const SUPABASE_ANON_KEY = Constants.expoConfig!.extra!.supabaseAnonKey as string;

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false, // we handle deep-link OAuth manually
  },
});
```

```bash
npx expo install react-native-url-polyfill
```

## Key differences from web

| Setting | Web | RN |
|---|---|---|
| `storage` | `localStorage` | `AsyncStorage` |
| `detectSessionInUrl` | `true` (default) | **`false`** — we parse the OAuth callback ourselves via `expo-linking` |

## Handling refresh on app focus

Supabase auto-refreshes tokens, but RN apps need a nudge after coming from background:

```ts
// App.tsx
import { AppState } from 'react-native';
AppState.addEventListener('change', (state) => {
  if (state === 'active') supabase.auth.startAutoRefresh();
  else supabase.auth.stopAutoRefresh();
});
```

## Acceptance

- [ ] Sign up → log out → log in works
- [ ] Kill app, reopen, still logged in
- [ ] Toggle airplane mode, restore — token refreshes successfully
