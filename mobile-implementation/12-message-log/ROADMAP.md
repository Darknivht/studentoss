# Build Roadmap (agent-driven)

I (Lovable) pre-wrote every task below. You do **nothing** but type `advance` (or `@ROADMAP.md advance`) in chat. Each turn I:

1. Find the first task with `- [ ]`.
2. Read only the files listed under its **Mentions**.
3. Build/patch files under `/mobile/` only.
4. Mark the task `- [x]` here and append an entry to `LOG.md`.
5. **Stop.** Wait for your next `advance`.

If a task fails or needs a decision, I stop early and ask — no auto-skip.

---

## Legend
- `- [ ]` pending
- `- [~]` in progress (only appears mid-turn; should never persist)
- `- [x]` complete
- `BLOCKED:` needs your input before I continue

---

## Phase A — Foundation copy-over (1 task)

- [x] **A1. Copy verbatim hooks + lib + supabase types from web**
  - Mentions: `@mobile-implementation/00-foundation/03-files-to-copy.md` `@mobile-implementation/10-shared-logic/README.md` `@src/lib/` `@src/hooks/useSubscription.ts` `@src/hooks/useAchievements.ts` `@src/hooks/useWeeklyXP.ts` `@src/hooks/useStudyTimeTracker.ts` `@src/hooks/useCourseProgress.ts` `@src/hooks/useActivityTracking.ts` `@src/integrations/supabase/types.ts`
  - Output: files land in `mobile/src/hooks/`, `mobile/src/lib/`, `mobile/src/integrations/supabase/types.ts`. Run tsgo on `/mobile`.

## Phase B — Core infrastructure (4 tasks)

- [x] **B1. Auth provider + useAuth hook (RN adaptation)**
  - Mentions: `@mobile-implementation/02-infrastructure/02-auth-flow.md` `@src/hooks/useAuth.tsx` `@mobile/src/integrations/supabase/client.ts`
  - Output: `mobile/src/hooks/useAuth.tsx`, wire `<AuthProvider>` in `mobile/App.tsx`.

- [x] **B2. Deep linking + OAuth callback**
  - Mentions: `@mobile-implementation/02-infrastructure/03-deep-linking.md` `@mobile/app.json`
  - Output: `mobile/src/lib/linking.ts`, updated `app.json` scheme, OAuth handler.

- [x] **B3. Theme provider + dark mode toggle**
  - Mentions: `@mobile-implementation/01-design-system/01-colors-tokens.md` `@mobile/global.css` `@mobile/tailwind.config.js`
  - Output: `mobile/src/context/ThemeContext.tsx`, hook `useTheme`, wired in `App.tsx`.

- [x] **B4. React Query + toast + shared providers wrapper**
  - Mentions: `@mobile-implementation/05-shared-components/09-Toasts-and-Modals.md` `@src/App.tsx`
  - Output: `mobile/src/providers/AppProviders.tsx` (QueryClient, Theme, Auth, Toast), replace tree in `App.tsx`.

## Phase C — Shared UI primitives (3 tasks)

- [x] **C1. UI primitives (Button, Card, Input, Badge, Skeleton, Progress, Dialog, Sheet)** ✅
  - Mentions: `@mobile-implementation/05-shared-components/01-ui-primitives.md` `@src/components/ui/`
  - Output: `mobile/src/components/ui/*` NativeWind versions.

- [ ] **C2. AppLayout + BottomNav (real, styled)**
  - Mentions: `@mobile-implementation/05-shared-components/02-AppLayout-and-BottomNav.md` `@src/components/AppLayout.tsx` `@mobile/src/navigation/BottomTabs.tsx`
  - Output: styled bottom tabs matching web colors + gradient.

- [ ] **C3. FeatureGateDialog + AnnouncementBanner**
  - Mentions: `@mobile-implementation/05-shared-components/03-FeatureGateDialog.md` `@mobile-implementation/05-shared-components/04-AnnouncementBanner.md` `@src/components/FeatureGateDialog.tsx`
  - Output: `mobile/src/components/FeatureGateDialog.tsx`, `AnnouncementBanner.tsx`.

## Phase D — Auth + Onboarding flow (3 tasks)

- [ ] **D1. Auth screen (email + Google + Apple)**
  - Mentions: `@screen:Auth` `@src/pages/Auth.tsx`
- [ ] **D2. Reset password screen**
  - Mentions: `@screen:ResetPassword` `@src/pages/ResetPassword.tsx`
- [ ] **D3. Onboarding (7 steps)**
  - Mentions: `@screen:Onboarding` `@src/pages/Onboarding.tsx`

## Phase E — Core tabs (6 tasks)

- [ ] **E1. Dashboard** — `@screen:Dashboard` `@src/pages/Dashboard.tsx` `@src/components/dashboard/`
- [ ] **E2. Study hub** — `@screen:Study` `@src/pages/Study.tsx`
- [ ] **E3. Plan tab** — `@screen:Plan` `@src/pages/Plan.tsx`
- [ ] **E4. Social tab** — `@screen:Social` `@src/pages/Social.tsx`
- [ ] **E5. Store tab** — `@screen:Store` `@src/pages/Store.tsx`
- [ ] **E6. Career tab** — `@screen:Career` `@src/pages/Career.tsx`

## Phase F — Study feature screens (7 tasks)

- [ ] **F1. SmartNotes** — `@screen:SmartNotes` `@src/pages/SmartNotes.tsx`
- [ ] **F2. CoursePage** — `@screen:CoursePage` `@src/pages/CoursePage.tsx`
- [ ] **F3. AITutor** — `@screen:AITutor` `@src/pages/AITutor.tsx`
- [ ] **F4. Flashcards** — `@screen:Flashcards` `@src/pages/Flashcards.tsx`
- [ ] **F5. Quizzes** — `@screen:Quizzes` `@src/pages/Quizzes.tsx`
- [ ] **F6. ExamPrep (multi-step stack)** — `@screen:ExamPrep` `@src/pages/ExamPrep.tsx`
- [ ] **F7. Achievements** — `@screen:Achievements` `@src/pages/Achievements.tsx`

## Phase G — Social + Chat (3 tasks)

- [ ] **G1. Chat (DM)** — `@screen:Chat` `@src/pages/Chat.tsx`
- [ ] **G2. GroupChat** — `@screen:GroupChat` `@src/pages/GroupChat.tsx`
- [ ] **G3. Realtime wiring** — `@mobile-implementation/07-data-and-offline/02-realtime.md`

## Phase H — Focus + native modules (4 tasks)

- [ ] **H1. Focus screen** — `@screen:Focus` `@src/pages/Focus.tsx`
- [ ] **H2. FocusSession (full-screen lock)** — `@screen:FocusSession` `@src/pages/FocusSession.tsx`
- [ ] **H3. Usage stats native module (Android)** — `@mobile-implementation/06-native-features/03-usage-stats-tracking.md` `@mobile-implementation/11-native-modules/README.md`
- [ ] **H4. App blocker native module (Android)** — `@mobile-implementation/06-native-features/01-app-blocking-android.md`

## Phase I — Profile + settings + legal (5 tasks)

- [ ] **I1. Profile** — `@screen:Profile` `@src/pages/Profile.tsx`
- [ ] **I2. Settings** — `@screen:Settings` `@mobile-implementation/04-screens/21-Settings.md`
- [ ] **I3. Upgrade / Paystack** — `@screen:Upgrade` `@src/pages/Upgrade.tsx`
- [ ] **I4. Safety (parental controls)** — `@screen:Safety` `@src/pages/Safety.tsx`
- [ ] **I5. Privacy + Terms + NotFound** — `@screen:Privacy` `@screen:Terms` `@screen:NotFound`

## Phase J — Notifications + offline + polish (4 tasks)

- [ ] **J1. Push notifications setup** — `@mobile-implementation/06-native-features/05-push-notifications.md`
- [ ] **J2. Local notifications (streak, daily Q)** — `@mobile-implementation/06-native-features/06-local-notifications.md`
- [ ] **J3. Offline sync + MMKV cache** — `@mobile-implementation/07-data-and-offline/01-offline-sync.md`
- [ ] **J4. Haptics, splash, permissions primer** — `@mobile-implementation/06-native-features/07-haptics-and-audio.md` `@mobile-implementation/04-screens/00-Install.md`

## Phase K — Release (3 tasks)

- [ ] **K1. EAS build config** — `@mobile-implementation/08-testing-and-release/01-eas-build.md`
- [ ] **K2. Play Store checklist pass** — `@mobile-implementation/08-testing-and-release/02-play-store-checklist.md`
- [ ] **K3. Monitoring + OTA updates** — `@mobile-implementation/08-testing-and-release/04-ota-updates.md` `@mobile-implementation/08-testing-and-release/05-monitoring.md`

---

## Total: 42 tasks across 11 phases

Say `advance` to start with **A1**.
