# StudentOS — Development Plan (Vibe-Coded Rebuild)

> Methodology: **Practical Vibe Coding with AI** (Idea → Design Research → Assets → Stack → Setup → AGENTS.md → Feature-by-Feature → Test/Ship).
> Goal: Rebuild StudentOS from scratch with a **brand-new UI**, shipping a working **MVP in 5 days max**, then growing incrementally — one feature, one prompt, one commit at a time.

---

## 0. One-Sentence App Idea

> **StudentOS is a bright, 3D-flavored study companion for Nigerian high-school and university students that turns their notes into AI-powered tutoring, flashcards, quizzes, exam prep, and a focus environment — in one app.**

Visual direction (one sentence): *"Bright candy-pop palette, soft rounded cards, playful 3D mascot, generous whitespace, springy micro-animations — think Duolingo × Notion × Linear."*

---

## 1. Lesson 1 — Idea & Design Research

### Core screens (MVP shortlist — 6 screens)
1. Onboarding (3 slides + role pick)
2. Auth (email + Google)
3. Home / Dashboard (greeting, streak, quick actions)
4. Notes (upload + list + viewer)
5. AI Tutor chat (single chat screen, note-grounded)
6. Profile / Settings

### Reference moodboard (save 20+ from these)
| Source | Search query | Link |
|---|---|---|
| Dribbble | "Studly student app" | https://dribbble.com/shots/17726302-Studly-Mobile-App-for-Students |
| Behance | "Study Planner mobile UI" | https://www.behance.net/gallery/76105493/Mobile-app-Study-Planner-UI-Ux-design |
| Unsplash | "education app interface" | https://unsplash.com/photos/mobile-app-interface-with-educational-content-llsp7CSktio |
| Unsplash gallery | mobile UI | https://unsplash.com/s/photos/mobile-ui |
| Mobbin | "education", "study", "Duolingo" flows | https://mobbin.com (sign in required) |
| Pinterest | "duolingo style mobile app" | https://www.pinterest.com/search/pins/?q=duolingo%20style%20mobile%20app |
| Pinterest | "3D mascot education app" | https://www.pinterest.com/search/pins/?q=3d%20mascot%20education%20app |

**Done when:** `/design/references/` folder has ≥25 screenshots + a single sentence describing the direction.

---

## 2. Lesson 2 — Generate the Visuals (BEFORE coding screens)

### Asset checklist
- [ ] **Mascot** ("Sage" — friendly 3D owl/star, Pixar-style). This is the brand anchor — generate first.
- [ ] App logo (wordmark + icon variant)
- [ ] Onboarding illustrations × 3 (Learn / Practice / Win)
- [ ] Empty states × 4 (no notes / no flashcards / no quiz / offline)
- [ ] Success state (confetti + mascot cheering)
- [ ] Error state (mascot with question mark)
- [ ] App icon (1024×1024) + adaptive icon (Android foreground/background)
- [ ] Splash screen

### Free image sources (use as references / placeholders until you generate your own)
| Asset | Source link |
|---|---|
| 3D character refs | https://iconscout.com/3d-illustrations/education |
| Duolingo-style mascot ref | https://sketchfab.com/3d-models/duolingo-mascot-3d-model-c8d8ba401ee345279ea3834e448c309c |
| Free 3D education icons | https://www.freepik.com/free-photos-vectors/3d-education |
| Storyset (free illustrations) | https://storyset.com/education |
| Lottie animations (study/celebrate) | https://lottiefiles.com/search?q=study |
| Mascot generator | https://mascoteer.com/industries/edtech |
| Pixar-style mascot generator | https://mascotmaker.io/mascot-maker/style/3d-pixar/e-learning |
| Unsplash education photos | https://unsplash.com/s/photos/student-studying |

### Generation prompt template (paste into ChatGPT-Image / Nano-Banana / Midjourney)
```
Create a bright, friendly 3D Pixar-style illustration of [SUBJECT] for the StudentOS [SCREEN].
Color palette: warm coral #FF6B6B, sunshine yellow #FFD93D, mint #6BCB77, soft sky #4D96FF, cream background #FFF8F0.
Soft global lighting, chunky rounded forms, thick subtle outlines, subsurface scattering.
Square 1024x1024, transparent background, mobile-ready.
Match the attached mascot reference for character proportions and palette.
[attach 2–3 references]
```

Save to: `assets/images/<feature>_<state>.png` (2× and 3×).

**Done when:** every MVP screen has its hero asset saved BEFORE that screen is coded.

---

## 3. Lesson 3 — Stack (locked, no debates)

| Layer | Choice | Why |
|---|---|---|
| Framework | **Expo SDK 52 + React Native 0.76 (New Architecture)** | Fastest dev loop, OTA, EAS Build |
| Language | TypeScript strict | Required by AGENTS.md |
| Styling | **NativeWind v4** | Tailwind parity with existing web brand |
| Animation | **Reanimated 3 + Moti** | framer-motion-like ergonomics |
| Navigation | **Expo Router v4** (file-based) | Standard, well-documented |
| State | **Zustand** + React Query | Simple global state + server cache |
| Persistence | **MMKV** (sync) + AsyncStorage (fallback) | Fast |
| Backend | **Supabase** (Lovable Cloud project already exists) | Reuse DB, auth, storage, edge functions |
| Auth | Supabase Auth (email + Google OAuth) | Reuse existing users |
| AI | Lovable AI Gateway (`google/gemini-2.5-flash`, `openai/gpt-5-mini`) | No extra keys |
| Payments | Paystack (existing edge functions) | Already wired |
| Notifications | `expo-notifications` | Standard |
| Analytics | PostHog React Native | Lightweight |
| Crash | Sentry Expo | Standard |

**Done when:** `package.json` is committed with all of these and `npx expo start` boots a blank screen on a real device.

---

## 4. Lesson 4 — Project Setup (Day 1 morning)

```bash
npx create-expo-app@latest studentos-mobile -t expo-template-blank-typescript
cd studentos-mobile
npx expo install expo-router expo-linking expo-constants expo-status-bar expo-splash-screen \
  expo-secure-store expo-notifications expo-image expo-image-picker expo-document-picker \
  expo-haptics expo-av react-native-reanimated react-native-gesture-handler \
  react-native-safe-area-context react-native-screens react-native-svg
bun add nativewind@^4 tailwindcss@^3.4 zustand @tanstack/react-query \
  @supabase/supabase-js react-native-mmkv moti lucide-react-native \
  react-native-keyboard-aware-scroll-view zod react-hook-form
```

Folder layout:
```
app/                 # expo-router routes
  (auth)/login.tsx
  (auth)/signup.tsx
  (onboarding)/index.tsx
  (tabs)/_layout.tsx
  (tabs)/index.tsx           # Dashboard
  (tabs)/notes.tsx
  (tabs)/tutor.tsx
  (tabs)/profile.tsx
components/          # presentational
  ui/                # Button, Card, Input, Avatar, Skeleton...
  mascot/            # <Sage variant="happy" />
  notes/
  tutor/
constants/
  images.ts          # centralized image map (RULE)
  colors.ts          # design tokens
  spacing.ts
hooks/
lib/
  supabase.ts
  ai.ts
  storage.ts         # MMKV wrapper
store/               # zustand slices
types/
assets/images/
AGENTS.md
```

Wire `lint`, `typecheck`, `format`. Push to GitHub. **Done.**

---

## 5. Lesson 5 — AGENTS.md (paste verbatim into repo root)

```md
You are an expert React Native + Expo engineer building StudentOS,
a study companion for Nigerian students.

## Stack (do not change without asking)
- Expo SDK 52, React Native 0.76, TypeScript strict
- Expo Router v4, NativeWind v4, Reanimated 3, Moti
- Zustand, React Query, MMKV
- Supabase (auth, db, storage, edge functions), Lovable AI Gateway

## Philosophy
Build feature by feature. For every feature:
1. Read this file first.
2. State the files you will touch BEFORE editing.
3. Make the smallest change that satisfies the prompt.
4. Verify on device/sim. Commit. Stop.

Never introduce a new major library without asking.
Never refactor unrelated code.
Never expose secrets in the client bundle.

## Architecture
Use the folder layout in DEVELOPMENT_PLAN.md §4. Do not invent new top-level folders.

## UI Rules
- Replicate provided designs exactly (layout, spacing, radius, shadows, type).
- NativeWind first. Fall back to StyleSheet only for: SafeArea, Modal, Animated views, platform-specific shadows.
- All colors via tokens in `constants/colors.ts`. No raw hex in components.
- All images via `constants/images.ts`. No inline `require()` in screens.
- Touch targets ≥ 44pt. Haptic on every primary action.

## State Rules
- Local component state by default.
- Zustand only for cross-screen state (auth user, subscription tier, focus mode).
- React Query for all Supabase reads/writes.
- MMKV for: auth session cache, onboarding-done flag, theme.

## TypeScript
Strict, no `any`, no `as unknown as`. Prefer `zod` schemas at API boundaries.

## Communication
Be concise. List files changed and how to test.
```

---

## 6. The 5-Day MVP (Lesson 6 in action)

> **MVP success = a student can sign up, upload a note, and chat with the AI tutor about that note, on a real Android device.**

### Day 1 — Foundation
- [ ] Project setup (§4) + AGENTS.md (§5)
- [ ] Design tokens (`constants/colors.ts`, `spacing.ts`, `typography.ts`)
- [ ] Centralized `constants/images.ts`
- [ ] `<Button>`, `<Card>`, `<Input>`, `<Text>`, `<Mascot>` primitives
- [ ] Supabase client + session persistence (MMKV)
- [ ] Bottom tab navigator skeleton (4 tabs, no screens yet)

**Done when:** App boots, tabs switch, mascot renders on a placeholder Home.

### Day 2 — Onboarding + Auth
- [ ] 3-slide onboarding (swipeable, Moti fade/scale, "Get Started" CTA)
- [ ] Role pick (High School / University) → store in profile
- [ ] Sign-up / login screens (email + Google OAuth via Supabase)
- [ ] Auth gate: unauth → `(auth)`, authed → `(tabs)`
- [ ] Persisted session restore on cold start

**Done when:** New install → onboarding → signup → Home. Kill app → reopen → lands on Home directly.

### Day 3 — Dashboard + Notes (upload + list + viewer)
- [ ] Dashboard: greeting, streak pill, 4 quick-action cards (Notes, Tutor, Quiz, Focus — last two stubbed)
- [ ] Notes list screen (FlatList, empty state with mascot)
- [ ] Upload note: `expo-document-picker` (PDF/DOCX/TXT/MD) → Supabase Storage → row in `notes` table
- [ ] Note viewer: title + extracted text (call existing `extract-pdf-text` edge function)
- [ ] Pull-to-refresh, skeleton loaders

**Done when:** Upload a PDF → it appears in the list → tap → see extracted text.

### Day 4 — AI Tutor (the killer feature)
- [ ] Tutor tab: list of notes → pick one → opens chat
- [ ] Chat UI (inverted FlatList, bubbles, typing indicator, Markdown + LaTeX rendering with `react-native-math-view`)
- [ ] System prompt that grounds answers in the selected note's extracted text (reuse `ai-study` edge function)
- [ ] Stream responses (SSE via `fetch` + `ReadableStream` polyfill OR poll if streaming is hard on day 4)
- [ ] Quota check: free tier = 5 messages/day, enforced client + server

**Done when:** Ask "summarize this note" → get a grounded answer in < 8 seconds.

### Day 5 — Profile, Polish, Ship
- [ ] Profile screen: avatar, name, role, streak, "Upgrade" CTA (links to web Paystack for now)
- [ ] Settings: theme toggle, sign out, delete account
- [ ] Haptics on every primary tap
- [ ] Sentry + PostHog wired
- [ ] App icon + splash from §2 assets
- [ ] EAS internal build → install on real device → run the full happy path
- [ ] Submit to Play Store internal testing

**Done when:** A teammate installs the internal build, signs up, uploads a note, chats with the tutor — without you touching their phone.

---

## 7. Incremental Roadmap — After the MVP

Each phase = ~1 week. **Never start phase N+1 until phase N is shipped to internal testing and verified.**

### Phase 6 (Week 2) — Active Learning Core
- Flashcards (generate from a note via AI, swipe deck, SRS schedule)
- Quizzes (MCQ from a note, scoring, history)
- Streak engine + daily XP

### Phase 7 (Week 3) — Exam Crusher (Nigeria)
- Exam types: JAMB, WAEC, NECO, Post-UTME (regional pick)
- Practice mode (subject → topic → MCQ, 5 options for JAMB)
- Mock exam with timer + CBT-style multi-subject nav
- Difficulty adaptation (per memory rules)

### Phase 8 (Week 4) — Plan & Productivity
- Smart timetable, sleep calculator (Wake-Up / Sleep-Now / Nap), Lo-fi radio (ad-free)
- Daily challenges, weekly XP chart

### Phase 9 (Week 5) — Social & Sharing
- Study groups, group chat (realtime), 1:1 chat, media uploads with lightbox
- Achievements (50+ milestones)

### Phase 10 (Week 6) — Career Tools
- Resume builder (gated templates), job search proxy, internship matcher
- "Real-World Why" explainer

### Phase 11 (Week 7) — Monetization & Safety
- Paystack in-app webview + tier gating (`FeatureGateDialog` equivalent)
- Parental controls + Focus Mode (Android AccessibilityService — see existing `mobile-implementation/06-native-features/`)
- Ads (Google Mobile Ads) on Free tier only

### Phase 12 (Week 8) — Resource Store + Admin
- Textbook store filtered by grade
- Admin dashboard (lazy-mounted tabs), banner system, revenue estimator

### Phase 13 — Polish & Launch
- Offline sync (MMKV mutation queue), realtime channels, push notifications (daily question, streak reminders)
- Onboarding tour v2, force-update banner, OTA channel
- Play Store + App Store production submission

---

## 8. The Prompt Template (use for EVERY feature)

```
[ANCHOR]  Read AGENTS.md first and follow it strictly.

[TASK]    Build <feature name>.
          User story: As a <role>, I can <action> so that <outcome>.
          Acceptance: <bullet list, max 5 items>.

[CONSTRAINTS]
- Touch only these files: <list> (or "you decide, but list them before editing").
- Do not refactor unrelated code.
- Do not add new libraries.
- Match the attached design exactly.
- Reuse existing Supabase tables: <list>. Do not create new tables without asking.

[REFERENCE]
- Design: <attach screenshot or Figma link>
- API: <paste edge function signature / SQL>
- Related code: <file paths>
```

---

## 9. Test, Polish, Ship Checklist (Lesson 7)

Before every internal release:
- [ ] Cold start < 2s on mid-range Android
- [ ] Lint + typecheck clean
- [ ] No secrets in client bundle (`grep -r "sk_" .`)
- [ ] Hardware back button handled on every screen
- [ ] Light + dark mode visually QA'd
- [ ] Offline → online transitions don't crash
- [ ] EAS build installs and runs on a real device
- [ ] Sentry receives a test event
- [ ] Posted to Play Store internal track

---

## 10. Cheatsheet

- **One sentence** before you start a feature.
- **One prompt** with all four parts (Anchor / Task / Constraints / Reference).
- **One commit** per working feature.
- **Generate the asset before the screen.**
- **Read AGENTS.md every single prompt.**
- **If the AI offers 3 alternatives, the spec is too vague — tighten it.**

---

*Source methodology: "Practical Vibe Coding with AI" (JS Mastery). Adapted for StudentOS rebuild — Sun 17 May 2026.*
