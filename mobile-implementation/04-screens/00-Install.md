# Install (web-only) — Mobile equivalent

The web `src/pages/Install.tsx` is a PWA install landing page. **Not ported to mobile** — the mobile app IS the installed experience.

## Mobile equivalent
Replace with a **first-launch splash + permissions primer** screen:

- Route: `Splash` (shown once, then jumps to Auth or Dashboard)
- Requests: notifications, usage access (Android), overlay permission (for AppBlocker)
- Uses `expo-splash-screen` + a custom `PermissionsPrimerScreen`

See `../06-native-features/` for each permission request.

## Files to create
- `mobile/src/screens/SplashScreen.tsx`
- `mobile/src/screens/PermissionsPrimerScreen.tsx`
- `mobile/src/lib/firstLaunch.ts` (AsyncStorage flag)

No connections file needed — no web parity.
