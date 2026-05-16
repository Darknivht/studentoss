# 04 — Study

> **Web source of truth:** `src/pages/Study.tsx`
> **RN target:** `src/screens/StudyScreen.tsx`
> **Route name:** `Study`
> **Auth:** Required
> **Bottom nav visible:** Yes

---

## 1. Purpose

Hub for active-learning tools: AI Tutor, Smart Notes, Flashcards, Quizzes, Mock Exam, Voice Mode, Audio Notes, Cheat Sheets, Mind Maps, Concept Linking, Mnemonics, Fill-in-the-blanks, Cram Mode, Debate Partner, Pomodoro.

## 2. Data dependencies

Open the web file and copy **every hook call** into the RN screen unchanged. The data layer does not change.

- `useSubscription()` to gate Pro/Plus tools
- `useStudyTimeTracker()` to log time on tool entry
- No direct DB query — this screen is a router/grid

## 3. Layout (top → bottom)

1. Header 'Study'
2. Search bar (filters tool tiles)
3. Featured tile: AI Tutor (full-width, gradient)
4. Grid of tool tiles (2 cols phone, 3 cols tablet) with icon + title + free/plus/pro badge
5. 'Recently used' horizontal scroller at bottom

## 4. Component tree mapping

| Web element | RN replacement | Notes |
|---|---|---|
| grid | `FlashList numColumns={2}` | item height 140dp |
| tile | custom `<Pressable>` with shadow + colored icon bg | scale 0.97 on press |
| badge | `<Badge>` primitive | locked tiles show padlock overlay |

## 5. Animations

- Tiles stagger in on mount
- Locked tile press → shake + open FeatureGateDialog
- Featured AI Tutor card has subtle floating animation (Moti loop translateY ±4dp)

## 6. Interactions & navigation

- Tap tile → navigate (gated by `useSubscription`)
- Recently used persists in MMKV (max 6)

## 7. Edge cases (MUST handle)

- Free user taps Pro tile → FeatureGateDialog
- Search returns nothing → 'No tools match' empty state

## 8. Native enhancements (mobile-only wins)

- Haptic light on every tile press
- Tablet: wider tiles, more cols

## 9. Performance

- Wrap large lists in `FlashList` (Shopify) instead of `FlatList` when item count > 50.
- Memoize cards with `React.memo` and stable keys.
- Hoist `renderItem` out of render; never inline arrow inside `FlatList`.
- Use `removeClippedSubviews` on long scroll views.
- Defer offscreen image loads with `expo-image` `priority="low"`.

## 10. Acceptance checklist

- [ ] All tools listed and route correctly
- [ ] Gate dialog appears for locked tools
- [ ] Search filters in real-time

## 11. Implementation order (for the agent)

1. Create the screen file with hooks copied verbatim from the web page.
2. Render a bare `<View>` with a `<Text>` of the title — verify route works.
3. Port the header / hero section.
4. Port each section top-to-bottom, one commit per section.
5. Wire animations LAST (only after layout is correct).
6. Test offline, slow 3G, and dark mode before marking done.

