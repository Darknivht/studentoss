# How to Actually Build StudentOS Mobile — File by File

You said the UI keeps coming out wrong and services don't connect. This guide fixes both by making the work **mechanical**: for every screen there is one connections file (in this folder) that tells you exactly which web files to touch and what to do with each. No guessing.

## The single rule that prevents the UI from breaking

> **Keep all data/business logic verbatim. Only swap the rendering layer.**

If you follow that, the only things that change between web and mobile are:

| Web | Mobile |
|---|---|
| `div`, `span`, `p`, `h1..h6` | `View`, `Text` |
| `button`, `a` | `Pressable` (+ `navigation.navigate`) |
| `input`, `textarea` | `TextInput` |
| `img` | `Image` from `expo-image` |
| `className="..."` Tailwind | **Same string**, NativeWind v4 reads it |
| `motion.div` (framer-motion) | `MotiView` (moti) |
| `lucide-react` icons | `lucide-react-native` icons (same API) |
| `useNavigate` / `useParams` / `<Link>` | `useNavigation` / `useRoute` / `<Pressable onPress={...}>` |
| `react-markdown` | `react-native-markdown-display` + `react-native-math-view` |
| `recharts` | `victory-native` |
| `sonner` toast | `burnt` toast (wrap so existing `toast()` calls keep working) |
| `localStorage` (Supabase client) | `AsyncStorage` (see `02-infrastructure/01`) |

Everything else — hooks, lib helpers, Supabase queries, edge function calls, parsing, formatters, AI prompts, subscription gating, achievements logic — **is copied byte-for-byte**.

## The build loop (do this for every screen)

For screen X (say `Dashboard`):

1. Open `mobile-implementation/09-connections/03-Dashboard-connections.md`.
2. Open `mobile-implementation/04-screens/03-Dashboard.md` next to it.
3. Open the web source `src/pages/Dashboard.tsx`.
4. Work through the **import table** in the connections file top to bottom. For each row, do exactly what the "Action" column says:
   - **COPY** → paste the file into `mobile/` at the same path.
   - **PORT** → paste, then run the JSX swap table above.
   - **REWRITE** → use the named RN library; signature stays the same where possible.
   - **DROP** → delete the import and any usage.
   - **KEEP** → leave the npm import as-is (install RN-compatible version).
5. Render the screen on a device. Compare to the web preview at 390×844.
6. Check the **Acceptance checklist** at the bottom of the connections file. Don't move on until every box is ticked.

## The build order across screens (so you never block yourself)

Follow this order — later screens reuse what you built earlier.

```
Foundations (00–03 docs)
  ├─ Project init (Expo SDK 52, NativeWind v4, Reanimated 3, Moti, Zustand, React Query)
  ├─ Design tokens (colors, typography, gradients, shadows)
  ├─ Supabase client with AsyncStorage
  └─ Navigation shell (Auth stack, Tab navigator, screen stubs)

UI primitives (build ONCE, reused by every screen)
  ├─ Button, Card, Input, Label, Textarea, Badge, Avatar, Tabs, Dialog/Modal, Sheet
  ├─ Toast wrapper (burnt)
  ├─ Skeleton, Progress, Switch, Slider, Select (bottom-sheet picker)
  ├─ Markdown + Math renderer
  └─ AppLayout + BottomNav

Pre-auth screens
  01 Auth → 01b ResetPassword → 02 Onboarding → 02b Index

Core tabs (in tab order)
  03 Dashboard → 04 Study → 05 SmartNotes → 06 CoursePage
  → 07 AITutor → 08 Flashcards → 09 Quizzes → 10 ExamPrep
  → 11 Plan → 12 Social → 13 Chat → 13b GroupChat
  → 14 Store → 15 Career → 18 Profile → 19 Achievements
  → 20 Upgrade → 21 Settings

Native-dependent (do last, they unblock the Play Store build but need native modules)
  16 Focus → 16b FocusSession → 17 Safety

Static fallback
  22a Privacy → 22b Terms → 22c NotFound → 23 AdminResources
```

## What goes where in the mobile repo

```
mobile/
├── app.json                       # Expo config, deep link scheme studentos://
├── src/
│   ├── integrations/supabase/
│   │   ├── client.ts              # REWRITTEN (AsyncStorage)
│   │   └── types.ts               # COPY verbatim
│   ├── lib/                       # COPY verbatim (formatters, ai, streak, …)
│   ├── hooks/                     # COPY verbatim (drop use-mobile)
│   ├── context/                   # COPY verbatim
│   ├── components/
│   │   ├── ui/                    # REBUILT primitives (NativeWind + cva)
│   │   ├── notes/                 # PORTED
│   │   ├── chat/                  # PORTED
│   │   ├── … (one folder per web folder)
│   ├── screens/                   # one file per page, e.g. DashboardScreen.tsx
│   ├── navigation/
│   │   ├── RootNavigator.tsx
│   │   ├── AuthStack.tsx
│   │   └── TabNavigator.tsx
│   └── native/                    # Expo modules for focus blocking, etc.
├── assets/                        # icons, splash, mascot, lottie
└── eas.json                       # build profiles
```

## Why the UI was breaking before — and how the connections files prevent it

1. **You were rewriting the className strings.** Don't. NativeWind v4 reads the exact Tailwind strings already in the web JSX. Copy them as-is.
2. **You were swapping libraries one-off per screen.** The connections file lists every library swap for the page in one table — no missed import.
3. **You were touching the hooks.** Hooks call Supabase, which works identically in RN. Touching them broke auth/data. The "COPY" rows say leave them alone.
4. **You were forgetting to register screens.** Step 11 in every connections file is the navigator registration — it's mandatory.

## Why services weren't connecting

The web uses `localStorage` for Supabase session persistence. In RN there is no `localStorage`, so the session is lost on cold start and every call fails with 401. The fix lives in `mobile-implementation/02-infrastructure/01-supabase-client.md`:

```ts
createClient(URL, KEY, {
  auth: { storage: AsyncStorage, persistSession: true, autoRefreshToken: true, detectSessionInUrl: false }
})
```

Plus the `AppState` listener so tokens refresh after backgrounding. If those two pieces are in place, **every** Supabase call, edge function invoke, storage upload, and realtime channel listed in any connections file works without further changes.

## Working with an AI agent on this

When you prompt the agent for a screen, paste exactly this:

```
Build the React Native screen `<ScreenName>Screen.tsx` for the StudentOS mobile app.

Hard rules:
- Read `mobile-implementation/09-connections/<NN>-<ScreenName>-connections.md` first and follow it row by row.
- Read `mobile-implementation/04-screens/<NN>-<ScreenName>.md` for the visual layout.
- Web source: `src/pages/<ScreenName>.tsx` — keep all hooks, lib calls, Supabase calls, and edge function invocations verbatim.
- Only swap rendering primitives per the table in HOW_TO_BUILD.md.
- Do not invent new logic, new tables, or new endpoints.
- When finished, run through the Acceptance checklist at the bottom of the connections file and report each item as ✅ or ❌.
```

That's it. One prompt per screen, 28 prompts total to ship the whole app.
