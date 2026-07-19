# Build log

Append-only. Newest at top.

---

## [B3] Theme provider + dark mode toggle
- Wrote `mobile/src/context/ThemeContext.tsx` with `light | dark | system` preference, persisted to AsyncStorage under `studentos.theme`. Listens to `Appearance` for OS-level changes and syncs `nativewind`'s `setColorScheme` so `.dark` variant classes flip live.
- Exposed `useTheme()` returning `{ theme, resolved, setTheme, toggle }`.
- Wrapped `<ThemeProvider>` around the whole app in `App.tsx` and added a `ThemedStatusBar` that flips light/dark based on resolved theme. Tailwind `darkMode: "class"` + global.css `.dark:root` tokens already in place from setup.
- Next: `advance` for B4 (Providers wrapper + toast).

---

## [B2] Deep linking + OAuth callback
- Wrote `mobile/src/lib/linking.ts` with React Navigation `linking` config covering all 29 routes + `handleOAuthCallback(url)` helper that handles both implicit (access_token/refresh_token) and PKCE (code) Supabase flows.
- Updated `mobile/app.json`: added iOS `associatedDomains` for `studentoss.lovable.app` and Android `intentFilters` with `autoVerify` for universal links. Scheme `studentos` already set.
- Wired `linking` into `<NavigationContainer>` in `mobile/App.tsx`.

## [B1] Auth provider + useAuth hook (RN adaptation)
- Wrote `mobile/src/hooks/useAuth.tsx`: verbatim port of web `useAuth` with RN adaptations — dropped `window.location.origin` from `signUp.emailRedirectTo` (RN uses deep links), added `AppState` listener that calls `supabase.auth.startAutoRefresh`/`stopAutoRefresh` on foreground/background per infra doc §01. Same context API (`user`, `session`, `loading`, `authReady`, `signUp`, `signIn`, `signOut`) so downstream screens copied from web work unchanged.
- Wrapped `<AuthProvider>` around `<NavigationContainer>` in `mobile/App.tsx` (outside so router can read auth).
- Next: `advance` for B3 (Theme provider).

---

## [A1] Copy verbatim hooks + lib + supabase types
- Copied 6 hooks → `mobile/src/hooks/`: useSubscription, useAchievements, useWeeklyXP, useStudyTimeTracker, useCourseProgress, useActivityTracking
- Copied 9 lib files → `mobile/src/lib/`: streak, subscriptionConfig, educationConfig, paystackConfig, formatters, parseAIResponse, resilientFetch, ai, utils
- Overwrote `mobile/src/integrations/supabase/types.ts` with real generated types from web
- No edits made — pure verbatim copies. Next: `advance` to run B1 (Auth provider).

---

## [SETUP] `/mobile` skeleton initialized
- Created Expo 52 + RN + NativeWind v4 project at `/mobile/`
- Wired Supabase client with AsyncStorage adapter
- Copied verbatim hooks + lib per `10-shared-logic/README.md`
- Placeholder screens for all 29 routes
- Bottom tabs + stack navigation shell
- Message-log workflow live at `mobile-implementation/12-message-log/`

Next: drop your first `## Next request` in `INBOX.md`.
