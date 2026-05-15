# ROADMAP — StudentOS Mobile (React Native + Expo)

Master ordered checklist. Work top-to-bottom. Each phase has acceptance criteria — do not advance until they pass.

Estimated total time for one developer: **4–5 weeks** to feature parity, +1 week to store-ready.

---

## Phase 0 — Foundation (1 day)

**Goal:** A blank Expo app boots on a real device with hot reload, path aliases, and TypeScript strict.

1. Read [`00-foundation/01-stack-decisions.md`](./00-foundation/01-stack-decisions.md) — understand *why* every package is chosen.
2. Run [`00-foundation/02-project-init.md`](./00-foundation/02-project-init.md) end-to-end.
3. Skim [`00-foundation/03-files-to-copy.md`](./00-foundation/03-files-to-copy.md), [`04-files-to-adapt.md`](./00-foundation/04-files-to-adapt.md), [`05-files-to-rewrite.md`](./00-foundation/05-files-to-rewrite.md) — you will reference these constantly.

**Acceptance:**
- [ ] `npx expo start` launches Expo Go / dev client on Android & iOS
- [ ] `@/` import alias resolves
- [ ] TypeScript builds with zero errors on the bare template
- [ ] EAS account created and `eas.json` committed

---

## Phase 1 — Design System (2 days)

**Goal:** A `<Button variant="primary">` in RN looks **byte-identical** to the web `<Button variant="default">`.

1. [`01-design-system/01-colors-tokens.md`](./01-design-system/01-colors-tokens.md) — port `src/index.css` HSL tokens into a typed RN theme + Nativewind config.
2. [`01-design-system/02-typography.md`](./01-design-system/02-typography.md) — load Space Grotesk + Inter via `expo-google-fonts`.
3. [`01-design-system/03-nativewind-setup.md`](./01-design-system/03-nativewind-setup.md) — mirror `tailwind.config.ts` so `className=` works.
4. [`01-design-system/04-gradients-shadows.md`](./01-design-system/04-gradients-shadows.md) — `expo-linear-gradient` + per-card shadow recipes.
5. [`01-design-system/05-animations.md`](./01-design-system/05-animations.md) — Reanimated 3 + Moti as framer-motion drop-in.
6. [`01-design-system/06-icons.md`](./01-design-system/06-icons.md) — install `lucide-react-native`.

**Acceptance:**
- [ ] Side-by-side screenshot of the web `<Button>` and RN `<Button>` are pixel-identical at 2× DPR
- [ ] Dark mode toggle works and matches web
- [ ] A test screen renders Space Grotesk H1 + Inter body identical to web

---

## Phase 2 — Infrastructure (1 day)

**Goal:** Auth works. User can sign up, log in, sign out. Session survives app restart.

1. [`02-infrastructure/01-supabase-client.md`](./02-infrastructure/01-supabase-client.md) — install `@supabase/supabase-js` with `AsyncStorage` adapter.
2. [`02-infrastructure/02-auth-flow.md`](./02-infrastructure/02-auth-flow.md) — port `src/hooks/useAuth.tsx` (only storage swap needed).
3. [`02-infrastructure/03-deep-linking.md`](./02-infrastructure/03-deep-linking.md) — `expo-linking` for OAuth callback + password reset.
4. [`02-infrastructure/04-env-secrets.md`](./02-infrastructure/04-env-secrets.md) — `app.config.ts` reads EAS secrets.
5. [`02-infrastructure/05-edge-functions.md`](./02-infrastructure/05-edge-functions.md) — confirm zero changes needed.

**Acceptance:**
- [ ] Email/password signup → auto-login → app restart preserves session
- [ ] Google OAuth round-trip works on both platforms
- [ ] One edge function call (`ai-study` chat mode) returns text successfully

---

## Phase 3 — Navigation (1 day)

**Goal:** The bottom tab bar from `src/components/layout/BottomNav.tsx` is recreated with identical animations.

1. [`03-navigation/01-react-navigation-setup.md`](./03-navigation/01-react-navigation-setup.md)
2. [`03-navigation/02-bottom-nav-port.md`](./03-navigation/02-bottom-nav-port.md)
3. [`03-navigation/03-back-button-handling.md`](./03-navigation/03-back-button-handling.md)
4. [`03-navigation/04-route-map.md`](./03-navigation/04-route-map.md)

**Acceptance:**
- [ ] All 6 bottom tabs render with active-pill animation matching web
- [ ] Hardware back button on Android exits app from Home tab, otherwise goes back
- [ ] Deep link to `/dashboard` opens the Dashboard tab

---

## Phase 4 — Auth + Onboarding (2 days)

**Goal:** A new user can install the app, sign up, complete the 7-step onboarding, and land on Dashboard.

1. [`04-screens/01-Auth.md`](./04-screens/01-Auth.md)
2. [`04-screens/02-Onboarding.md`](./04-screens/02-Onboarding.md)

**Acceptance:**
- [ ] Auth screen pixel-matches web Auth page
- [ ] Onboarding 7 steps animate identically
- [ ] Profile is created in Supabase with grade level, school, persona

---

## Phase 5 — Core Screens (2 weeks)

**Goal:** Every web page has a working RN equivalent. Build in this order — earlier screens unblock later ones.

| # | Screen | Doc | Days |
|---|---|---|---|
| 1 | Dashboard | [03](./04-screens/03-Dashboard.md) | 1 |
| 2 | Profile + Settings | [18](./04-screens/18-Profile.md), [21](./04-screens/21-Settings.md) | 0.5 |
| 3 | Study (hub) | [04](./04-screens/04-Study.md) | 0.5 |
| 4 | SmartNotes + CoursePage | [05](./04-screens/05-SmartNotes.md), [06](./04-screens/06-CoursePage.md) | 1.5 |
| 5 | AI Tutor | [07](./04-screens/07-AITutor.md) | 1 |
| 6 | Flashcards | [08](./04-screens/08-Flashcards.md) | 1 |
| 7 | Quizzes | [09](./04-screens/09-Quizzes.md) | 0.5 |
| 8 | ExamPrep flow | [10](./04-screens/10-ExamPrep.md) | 2 |
| 9 | Plan (Timetable, Pomodoro, Sleep, Lofi) | [11](./04-screens/11-Plan.md) | 1 |
| 10 | Social (Groups, Friends, Leaderboard) | [12](./04-screens/12-Social.md) | 1 |
| 11 | Chat + GroupChat | [13](./04-screens/13-Chat-and-GroupChat.md) | 1 |
| 12 | Store | [14](./04-screens/14-Store.md) | 0.5 |
| 13 | Career (Resume, Jobs, Internships) | [15](./04-screens/15-Career.md) | 1.5 |
| 14 | Achievements | [19](./04-screens/19-Achievements.md) | 0.5 |
| 15 | Upgrade (Paystack) | [20](./04-screens/20-Upgrade.md) | 0.5 |
| 16 | Misc (Privacy, Terms, NotFound) | [22](./04-screens/22-Misc-Privacy-Terms-NotFound.md) | 0.25 |

(Focus + Safety screens are built in Phase 6 because they depend on native modules.)

**Acceptance per screen:**
- [ ] Side-by-side screenshot vs web is visually indistinguishable
- [ ] All hooks & data fetches work
- [ ] All navigation transitions work
- [ ] Dark mode passes

---

## Phase 6 — Native Features (1 week)

**Goal:** The reasons we chose RN over Capacitor.

1. [`06-native-features/01-app-blocking-android.md`](./06-native-features/01-app-blocking-android.md) — port `android/.../FocusMode*` Java code into an Expo Config Plugin
2. [`06-native-features/02-app-blocking-ios.md`](./06-native-features/02-app-blocking-ios.md) — Screen Time / FamilyControls
3. [`06-native-features/03-usage-stats-tracking.md`](./06-native-features/03-usage-stats-tracking.md) — `UsageStatsManager`
4. [`06-native-features/04-background-services.md`](./06-native-features/04-background-services.md) — `expo-task-manager`
5. [`06-native-features/05-push-notifications.md`](./06-native-features/05-push-notifications.md)
6. [`06-native-features/06-local-notifications.md`](./06-native-features/06-local-notifications.md)
7. [`06-native-features/07-haptics-and-audio.md`](./06-native-features/07-haptics-and-audio.md)
8. [`06-native-features/08-camera-ocr.md`](./06-native-features/08-camera-ocr.md)
9. [`06-native-features/09-voice-mode.md`](./06-native-features/09-voice-mode.md)
10. [`06-native-features/10-secure-storage.md`](./06-native-features/10-secure-storage.md)
11. Build screens that depend on these:
    - [`04-screens/16-Focus.md`](./04-screens/16-Focus.md)
    - [`04-screens/17-Safety.md`](./04-screens/17-Safety.md)

**Acceptance:**
- [ ] Selecting Instagram in app-blocker actually prevents it from opening during a focus session
- [ ] Usage stats show last 7 days of per-app foreground time
- [ ] Daily streak push notification fires at 7pm even when app is killed

---

## Phase 7 — Offline + Data (3 days)

1. [`07-data-and-offline/01-offline-sync.md`](./07-data-and-offline/01-offline-sync.md)
2. [`07-data-and-offline/02-realtime.md`](./07-data-and-offline/02-realtime.md)
3. [`07-data-and-offline/03-file-storage.md`](./07-data-and-offline/03-file-storage.md)
4. [`07-data-and-offline/04-quotas-and-subscription.md`](./07-data-and-offline/04-quotas-and-subscription.md)

**Acceptance:**
- [ ] Notes created offline sync up when network returns
- [ ] Group chat messages stream in real-time
- [ ] AI quotas enforced both client and server side

---

## Phase 8 — Testing & Release (1 week)

1. [`08-testing-and-release/01-eas-build.md`](./08-testing-and-release/01-eas-build.md)
2. [`08-testing-and-release/02-play-store-checklist.md`](./08-testing-and-release/02-play-store-checklist.md)
3. [`08-testing-and-release/03-app-store-checklist.md`](./08-testing-and-release/03-app-store-checklist.md)
4. [`08-testing-and-release/04-ota-updates.md`](./08-testing-and-release/04-ota-updates.md)
5. [`08-testing-and-release/05-monitoring.md`](./08-testing-and-release/05-monitoring.md)

**Acceptance:**
- [ ] Production AAB uploads to Play Console internal testing
- [ ] iOS TestFlight build distributes to 5 testers
- [ ] Sentry captures a forced crash with full stack trace
- [ ] OTA update pushes a JS-only fix without store re-submission

---

## Done = Definition of Pixel Parity

Take the same Dashboard screenshot on:
1. Chrome desktop @ 390×844 (iPhone 14 viewport)
2. Real iPhone running RN app
3. Real Pixel running RN app

Diff the screenshots. < 5% pixel difference (excluding status bar) = ship it.
