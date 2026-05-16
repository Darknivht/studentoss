# secure-storage — Secure Storage

## Tools
- **`expo-secure-store`** — backed by iOS Keychain / Android Keystore. For: refresh tokens, biometric keys, sensitive flags.
- **`react-native-mmkv`** — fast key-value (NOT encrypted by default; can encrypt with key). For: theme, onboarding flag, dismissed announcements, cached data.

## Usage

```ts
import * as SecureStore from 'expo-secure-store';
await SecureStore.setItemAsync('supabase_refresh', token);
const t = await SecureStore.getItemAsync('supabase_refresh');
```

## Supabase auth storage adapter

```ts
import * as SecureStore from 'expo-secure-store';
const storage = {
  getItem: (k) => SecureStore.getItemAsync(k),
  setItem: (k, v) => SecureStore.setItemAsync(k, v),
  removeItem: (k) => SecureStore.deleteItemAsync(k),
};
createClient(url, key, { auth: { storage, persistSession: true, autoRefreshToken: true }});
```

(Note: SecureStore has a 2KB-per-value limit on iOS. Supabase session JSON is usually fine but if it grows, fall back to AsyncStorage for session and SecureStore for just refresh token.)

## Biometric gating

Use `expo-local-authentication`:
```ts
const result = await LocalAuthentication.authenticateAsync({ promptMessage: 'Unlock StudentOS' });
if (result.success) loadSession();
```

## Acceptance
- [ ] Tokens survive app reinstall? NO (keychain wipes by default on iOS reinstall — that's correct)
- [ ] Biometric gates app launch when enabled
- [ ] MMKV reads < 1ms

