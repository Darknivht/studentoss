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

## B4 — React Query + toast + AppProviders wrapper
- Created `mobile/src/providers/AppProviders.tsx` centralizing GestureHandler → SafeArea → Theme → QueryClient → Auth → NavigationContainer → StatusBar + Toaster.
- QueryClient tuned: retry 1, staleTime 30s, no refetchOnWindowFocus (mobile-friendly).
- Toast layer: `sonner-native` (mirrors web `sonner` API 1:1). Theme follows resolved dark/light. Added `mobile/src/lib/toast.ts` re-export so screens import `{ toast }` identically to web.
- Slimmed `mobile/App.tsx` to just `<AppProviders><RootNavigator/></AppProviders>`.
- Added `sonner-native@^0.16.0` to `mobile/package.json`.

## C1 — UI primitives ✅
Created `mobile/src/components/ui/`:
- `Button.tsx` (CVA variants: default/destructive/outline/secondary/ghost/link/gradient; sizes sm/default/lg/icon; haptics; loading; gradient uses `expo-linear-gradient`)
- `Input.tsx`, `Textarea.tsx` (label + error support, forwardRef)
- `Card.tsx` (+ Header/Title/Description/Content/Footer)
- `Badge.tsx` (default/secondary/destructive/outline/success/warning)
- `Skeleton.tsx` (Moti pulse loop)
- `Progress.tsx` (animated width via Moti)
- `Separator.tsx`, `Avatar.tsx` (image + initials fallback)
- `Dialog.tsx` (RN `Modal` + backdrop dismiss, Header/Footer/Title/Description)
- `Sheet.tsx` (`Modal` + Moti slide from bottom/top/left/right)
- `index.ts` barrel export

Added deps to `mobile/package.json`: `clsx`, `tailwind-merge`, `class-variance-authority`.
All tokens use semantic classes (`bg-primary`, `text-foreground`, `border-border`) — theme-aware via NativeWind v4.

## C2 — AppLayout + styled BottomTabs
- Created `mobile/src/components/layout/AppLayout.tsx` (SafeArea + KeyboardAvoiding + optional header w/ back + pull-to-refresh).
- Rewrote `mobile/src/navigation/BottomTabs.tsx` with custom `tabBar`: BlurView, Reanimated pill + dot, haptics, 6 tabs matching web (Home, Study, Store, Plan, Social, Career).

## C3 — FeatureGateDialog + AnnouncementBanner
- Created `mobile/src/components/subscription/FeatureGateDialog.tsx` (SVG progress ring, Moti lock spin, 3-tier grid, gradient CTA → Upgrade screen).
- Created `mobile/src/components/dashboard/AnnouncementBanner.tsx` (Supabase fetch, AsyncStorage dismissal persistence, action_url deep-link/Linking).
- Added `expo-blur` to `mobile/package.json`.
