# 02 — Auth Flow

Goal: the `useAuth` hook from web works **unchanged** in RN. The only changes are in the underlying client (Phase 02-01) and the OAuth redirect handler (Phase 02-03).

## Copy `src/hooks/useAuth.tsx` from web

It exports `AuthProvider` and `useAuth()`. Wraps the app in a context that listens to `supabase.auth.onAuthStateChange`. Verbatim port — works in RN as-is.

## Wrap the root

```tsx
// App.tsx
<ThemeProvider>
  <AuthProvider>
    <QueryClientProvider client={qc}>
      <RootNavigator />
    </QueryClientProvider>
  </AuthProvider>
</ThemeProvider>
```

## Email + password (default)

Same as web:

```ts
await supabase.auth.signUp({
  email, password,
  options: { data: { full_name: name } },
});
```

> **No `emailRedirectTo`** — RN apps don't have URLs. Email confirmation links open in the device browser, then deep-link back via the `studentos://` scheme (configured in `app.config.ts`). See [`03-deep-linking.md`](./03-deep-linking.md).

## Google OAuth

```ts
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';

const redirectTo = Linking.createURL('/oauth-callback');

const { data } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: { redirectTo, skipBrowserRedirect: true },
});

const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
if (result.type === 'success') {
  const { params } = Linking.parse(result.url);
  await supabase.auth.setSession({
    access_token: params.access_token,
    refresh_token: params.refresh_token,
  });
}
```

```bash
npx expo install expo-web-browser
```

## Apple sign-in (iOS only)

```bash
npx expo install expo-apple-authentication
```

```ts
import * as AppleAuthentication from 'expo-apple-authentication';
const cred = await AppleAuthentication.signInAsync({
  requestedScopes: [
    AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
    AppleAuthentication.AppleAuthenticationScope.EMAIL,
  ],
});
await supabase.auth.signInWithIdToken({ provider: 'apple', token: cred.identityToken! });
```

## Sign out

```ts
await supabase.auth.signOut();
// Clear MMKV caches
import { MMKV } from 'react-native-mmkv';
new MMKV().clearAll();
```

## Acceptance

- [ ] Email signup works, email confirmation deep-links back to app
- [ ] Google OAuth works on Android & iOS
- [ ] Apple sign-in works on iOS (required for App Store)
- [ ] Sign out clears local caches
