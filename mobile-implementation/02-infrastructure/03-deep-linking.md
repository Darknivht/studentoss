# 03 — Deep Linking

## Scheme

Already set in `app.config.ts`:
```ts
scheme: 'studentos'
```

Now `studentos://...` opens the app. URLs:

| Path | Purpose |
|---|---|
| `studentos://oauth-callback` | OAuth provider returns here |
| `studentos://reset-password?token=...` | Email reset link |
| `studentos://exam/jamb/physics` | Marketing deep link |
| `studentos://group/INVCODE` | Group invite |

## Universal links (recommended for prod)

Add to `app.config.ts`:

```ts
ios: {
  associatedDomains: ['applinks:studentoss.lovable.app'],
},
android: {
  intentFilters: [{
    action: 'VIEW',
    data: [{ scheme: 'https', host: 'studentoss.lovable.app' }],
    category: ['BROWSABLE', 'DEFAULT'],
    autoVerify: true,
  }],
},
```

Host the Apple `apple-app-site-association` and Android `assetlinks.json` files at `https://studentoss.lovable.app/.well-known/`.

## Wire to React Navigation

```ts
// src/navigation/linking.ts
import * as Linking from 'expo-linking';

export const linking = {
  prefixes: [Linking.createURL('/'), 'https://studentoss.lovable.app'],
  config: {
    screens: {
      OAuthCallback: 'oauth-callback',
      ResetPassword: 'reset-password',
      ExamPrep: 'exam/:examType?/:subject?',
      GroupChat: 'group/:code',
      MainTabs: {
        screens: {
          Dashboard: '',
          Study: 'study',
          Plan: 'plan',
          Social: 'social',
          Career: 'career',
          Store: 'store',
        },
      },
    },
  },
};
```

In `App.tsx`:

```tsx
<NavigationContainer linking={linking}>
  <RootNavigator />
</NavigationContainer>
```

## Reset password screen

Mobile equivalent of web `/reset-password`:

```tsx
function ResetPasswordScreen({ route }) {
  const { token } = route.params;
  // Set session from recovery token, then show new-password form
  useEffect(() => { supabase.auth.exchangeCodeForSession(token); }, []);
  // ... form that calls supabase.auth.updateUser({ password })
}
```

## Acceptance

- [ ] `npx uri-scheme open studentos://group/ABC --android` opens GroupChat
- [ ] OAuth round-trip lands inside the app, not external browser
