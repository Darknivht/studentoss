
# Plan: `mobile-implementation/` Documentation Suite

Goal: create a new top-level folder `mobile-implementation/` containing every document a developer (or AI agent) needs to build a **pure React Native (Expo)** version of StudentOS — not Capacitor — that looks and feels identical to the web app, while unlocking native-only capabilities (app blocking, usage stats, system notifications, background services).

This plan only creates **markdown docs** in the repo. No app code is written here. The docs themselves contain the code recipes.

---

## 1. Folder Structure to Create

```text
mobile-implementation/
├── README.md                          # Entry point — read this first
├── ROADMAP.md                         # Master ordered checklist (Phases 0 → 8)
├── 00-foundation/
│   ├── 01-stack-decisions.md          # Expo SDK, RN 0.76+, Reanimated, Nativewind, React Navigation
│   ├── 02-project-init.md             # `npx create-expo-app`, folder layout, path aliases
│   ├── 03-files-to-copy.md            # Exact list of webapp files that copy 1:1 with zero edits
│   ├── 04-files-to-adapt.md           # Files that need light edits (DOM → RN primitives)
│   └── 05-files-to-rewrite.md         # Files that must be fully rewritten (any DOM/CSS/HTML)
├── 01-design-system/
│   ├── 01-colors-tokens.md            # HSL tokens copied from `src/index.css` → RN theme object
│   ├── 02-typography.md               # Space Grotesk + Inter via expo-google-fonts
│   ├── 03-nativewind-setup.md         # Tailwind config mirror so className works in RN
│   ├── 04-gradients-shadows.md        # expo-linear-gradient + shadow recipes per card
│   ├── 05-animations.md               # Reanimated 3 + Moti replacements for framer-motion
│   └── 06-icons.md                    # lucide-react-native (drop-in for lucide-react)
├── 02-infrastructure/
│   ├── 01-supabase-client.md          # Reuse `@supabase/supabase-js` + AsyncStorage adapter
│   ├── 02-auth-flow.md                # Port `useAuth.tsx` — only storage swap
│   ├── 03-deep-linking.md             # expo-linking for OAuth + reset-password
│   ├── 04-env-secrets.md              # `app.config.ts` + EAS secrets
│   └── 05-edge-functions.md           # Zero changes — same fetch URLs
├── 03-navigation/
│   ├── 01-react-navigation-setup.md   # Native Stack + Bottom Tabs
│   ├── 02-bottom-nav-port.md          # Recreate `BottomNav.tsx` with shared layoutId animation
│   ├── 03-back-button-handling.md     # Port `useMobileBackNavigation`
│   └── 04-route-map.md                # Web route → RN screen name table
├── 04-screens/                        # ONE FILE PER PAGE — exact pixel parity instructions
│   ├── 01-Auth.md
│   ├── 02-Onboarding.md               # All 7 steps, animations, copy
│   ├── 03-Dashboard.md                # Cards, streak, stats grid, banners
│   ├── 04-Study.md
│   ├── 05-SmartNotes.md
│   ├── 06-CoursePage.md
│   ├── 07-AITutor.md                  # Full-screen chat, KaTeX → react-native-math-view
│   ├── 08-Flashcards.md
│   ├── 09-Quizzes.md
│   ├── 10-ExamPrep.md                 # Selector → Subject → Topic → Session → Review
│   ├── 11-Plan.md                     # Timetable, Pomodoro, Sleep, Lofi
│   ├── 12-Social.md                   # Groups, Friends, Leaderboard, Challenges
│   ├── 13-Chat-and-GroupChat.md
│   ├── 14-Store.md
│   ├── 15-Career.md                   # Resume builder, Job search, Internships
│   ├── 16-Focus.md                    # Native-only deep-dive (see 06-native-features)
│   ├── 17-Safety.md                   # Parental controls, dashboard
│   ├── 18-Profile.md
│   ├── 19-Achievements.md
│   ├── 20-Upgrade.md                  # Paystack RN integration
│   ├── 21-Settings.md
│   └── 22-Misc-Privacy-Terms-NotFound.md
├── 05-shared-components/              # Per-component port notes
│   ├── 01-ui-primitives.md            # Button, Card, Input, Dialog, Sheet, Tabs… → RN equivalents
│   ├── 02-AppLayout-and-BottomNav.md
│   ├── 03-FeatureGateDialog.md
│   ├── 04-AnnouncementBanner.md
│   ├── 05-MarkdownRenderer-and-Math.md
│   ├── 06-FileUpload-and-MediaUpload.md
│   ├── 07-DocumentViewers.md          # PDF/DOCX → react-native-pdf + custom DOCX
│   ├── 08-Charts.md                   # recharts → victory-native / react-native-svg
│   └── 09-Toasts-and-Modals.md
├── 06-native-features/                # Things impossible on web
│   ├── 01-app-blocking-android.md     # UsageStatsManager + AccessibilityService (port from `android/`)
│   ├── 02-app-blocking-ios.md         # Screen Time API / FamilyControls (limitations)
│   ├── 03-usage-stats-tracking.md     # Reading per-app foreground time
│   ├── 04-background-services.md      # expo-task-manager, headless JS
│   ├── 05-push-notifications.md       # expo-notifications (streak, daily question)
│   ├── 06-local-notifications.md      # Scheduled reminders
│   ├── 07-haptics-and-audio.md        # expo-haptics, expo-av for Lofi radio
│   ├── 08-camera-ocr.md               # expo-camera + book scanner
│   ├── 09-voice-mode.md               # expo-speech + @react-native-voice/voice
│   └── 10-secure-storage.md           # expo-secure-store for tokens
├── 07-data-and-offline/
│   ├── 01-offline-sync.md             # Port `offlineSync.ts` using MMKV / WatermelonDB
│   ├── 02-realtime.md                 # Supabase realtime works as-is
│   ├── 03-file-storage.md             # expo-file-system + Supabase Storage
│   └── 04-quotas-and-subscription.md  # Reuse `useSubscription` hook verbatim
├── 08-testing-and-release/
│   ├── 01-eas-build.md                # EAS Build profiles (dev, preview, production)
│   ├── 02-play-store-checklist.md
│   ├── 03-app-store-checklist.md
│   ├── 04-ota-updates.md              # expo-updates
│   └── 05-monitoring.md               # Sentry RN
└── _APPENDIX/
    ├── A-component-map.md             # Web component → RN component lookup table
    ├── B-package-equivalents.md       # Every npm dep → RN equivalent
    ├── C-css-to-style-map.md          # Tailwind class → Nativewind / StyleSheet notes
    └── D-troubleshooting.md
```

Total: ~70 markdown files.

---

## 2. What Each Doc Type Contains

**ROADMAP.md** — single source of truth. Ordered phases:

```text
Phase 0 — Setup           (00-foundation)        ~1 day
Phase 1 — Design System   (01-design-system)     ~2 days
Phase 2 — Infrastructure  (02-infrastructure)    ~1 day
Phase 3 — Navigation      (03-navigation)        ~1 day
Phase 4 — Auth + Onboard  (04-screens 01-02)     ~2 days
Phase 5 — Core Screens    (04-screens 03-15)     ~2 weeks
Phase 6 — Native Features (06-native-features)   ~1 week
Phase 7 — Offline + Data  (07-data-and-offline)  ~3 days
Phase 8 — Release         (08-testing-and-release) ~1 week
```
Each phase lists exact files to create/copy, dependencies to install, acceptance criteria, and links to the detailed docs.

**files-to-copy.md** — concrete list with copy commands. Examples that port verbatim:
- `src/integrations/supabase/types.ts`
- `src/hooks/useSubscription.ts`, `useAchievements.ts`, `useWeeklyXP.ts`, `useStudyTimeTracker.ts`, `useCourseProgress.ts`
- `src/lib/streak.ts`, `subscriptionConfig.ts`, `educationConfig.ts`, `paystackConfig.ts`, `formatters.ts`, `parseAIResponse.ts`, `resilientFetch.ts`, `ai.ts`
- All `supabase/functions/**` (zero changes)

**files-to-adapt.md** — needs `localStorage` → `AsyncStorage`, `window` → `Platform`, etc:
- `src/hooks/useAuth.tsx`
- `src/hooks/useNotifications.ts`
- `src/hooks/useOfflineSync.ts`, `useOfflineStatus.ts`

**files-to-rewrite.md** — anything DOM/CSS/HTML/framer-motion heavy:
- All `src/pages/*.tsx`
- All `src/components/**` UI
- `BottomNav`, `AppLayout`, viewers, ad banners, dropdowns

**Each `04-screens/XX-*.md` contains**:
1. Screenshot reference + visual description
2. Exact color tokens, gradients, spacing, radii, shadows from web version
3. Layout breakdown (header, body, FAB, etc.) as RN component tree
4. State management + hooks used (which port directly, which adapt)
5. Animations (framer-motion source → Reanimated equivalent with code)
6. Native-only enhancements (haptics on tap, gesture handling)
7. Edge cases, loading/error states
8. Acceptance checklist

**Each `05-shared-components/*.md` contains**: shadcn primitive → RN equivalent (`react-native-paper` / `tamagui` / custom), with code stub.

**Each `06-native-features/*.md` contains**: permission flow, plugin choice (custom Expo module vs existing package), code recipe, fallback when permission denied. The Android `FocusModeService.java` / `FocusModePlugin.java` already in `android/` is documented as the reference implementation to wrap as an Expo Config Plugin.

---

## 3. Key Technical Decisions Embedded in Docs

- **Framework**: Expo SDK 52 + React Native 0.76 (New Architecture on)
- **Styling**: Nativewind v4 — keeps `className=` syntax, mirrors `tailwind.config.ts` so the existing semantic token system (`bg-primary`, `text-foreground`, `bg-gradient-to-br`) works almost unchanged
- **Animations**: Reanimated 3 + Moti (framer-motion-style API)
- **Navigation**: React Navigation 7 (Native Stack + Bottom Tabs) with shared element transitions matching `layoutId` from web
- **Icons**: `lucide-react-native` (1:1 API)
- **Math**: `react-native-math-view` for KaTeX
- **Markdown**: `react-native-markdown-display`
- **PDF**: `react-native-pdf` for viewing, `react-native-html-to-pdf` for the existing dual-mode export
- **Storage**: `react-native-mmkv` (sync, fast) + `expo-secure-store` for tokens
- **Backend**: Same Supabase project, same edge functions, zero backend changes
- **Native modules**: Existing `android/app/src/main/java/com/studentoss/app/Focus*` files become an Expo Config Plugin — doc shows exact migration

---

## 4. Native-Only Features (Why RN, not Capacitor)

Documented in `06-native-features/`:
1. **App blocking** via AccessibilityService (already prototyped in `android/`)
2. **Usage stats** via `UsageStatsManager` — read time per app to detect distraction patterns
3. **System-level notifications** with action buttons (snooze, claim XP)
4. **Background tasks** — streak reminders fire even when app is killed
5. **Lock screen widgets** (Android 13+ / iOS 17+)
6. **Foreground service** for active focus sessions with persistent notification

---

## 5. Deliverable

After approval I will create the `mobile-implementation/` directory and write all ~70 markdown files (no app source code — those instructions live inside the docs). The user can then hand the folder + their existing webapp repo to any developer or AI agent and get a pixel-perfect React Native build.

Estimated doc size: ~6,000–8,000 lines of markdown total.

