# 10 — ExamPrep

> **Web source of truth:** `src/pages/ExamPrep.tsx`
> **RN target:** `src/screens/ExamPrepScreen.tsx`
> **Route name:** `ExamPrep`
> **Auth:** Required (gated by tier for some modes)
> **Bottom nav visible:** Yes

---

## 1. Purpose

Exam Crusher hub: WAEC/JAMB/NECO/SAT etc. Practice sessions, mock exams (CBT-style), guided learning, bookmarked questions, weakness reports, study plans, performance dashboards.

## 2. Data dependencies

Open the web file and copy **every hook call** into the RN screen unchanged. The data layer does not change.

- `supabase.functions.invoke('exam-practice', ...)`
- `supabase.from('exam_attempts').select()`
- `supabase.from('bookmarked_questions').select()`
- `useSubscription()` for mock exam limits

## 3. Layout (top → bottom)

1. Header + exam selector (currently selected exam pill — tap to change)
2. Grid of modes: Practice, Mock CBT, Guided Learning, Bookmarked, Weakness Report, Study Plan, Performance
3. Recently practiced subjects horizontal scroll

## 4. Component tree mapping

| Web element | RN replacement | Notes |
|---|---|---|
| mode tile | gradient card with icon + title + description | |
| ExamSelector | port from `src/components/exam-prep/ExamSelector.tsx` | bottom sheet on mobile |
| MultiSubjectCBT | dedicated screen — see CBT navigation memory | persistent timer in nav header |

## 5. Animations

- Tile entrance stagger
- Selected exam pill bounce on change
- Timer pulses red in last 5 min

## 6. Interactions & navigation

- Tap mode → subroute (`PracticeSession`, `MockExamMode`, etc.)
- CBT next-subject button → persists answers, navigates within stack

## 7. Edge cases (MUST handle)

- JAMB UTME = 5 options (not 4) — handle in option renderer
- Network drop during mock exam → auto-save to MMKV every question, resume
- Time up → auto-submit
- Pro-only mode for free user → FeatureGate

## 8. Native enhancements (mobile-only wins)

- Wake lock during exam
- Disable home gesture? (not possible on iOS; show warning on Android)
- Foreground service notification 'Exam in progress'

## 9. Performance

- Wrap large lists in `FlashList` (Shopify) instead of `FlatList` when item count > 50.
- Memoize cards with `React.memo` and stable keys.
- Hoist `renderItem` out of render; never inline arrow inside `FlatList`.
- Use `removeClippedSubviews` on long scroll views.
- Defer offscreen image loads with `expo-image` `priority="low"`.

## 10. Acceptance checklist

- [ ] All exam types selectable
- [ ] CBT multi-subject flow works
- [ ] Auto-save & resume works
- [ ] Difficulty adaptation persists

## 11. Implementation order (for the agent)

1. Create the screen file with hooks copied verbatim from the web page.
2. Render a bare `<View>` with a `<Text>` of the title — verify route works.
3. Port the header / hero section.
4. Port each section top-to-bottom, one commit per section.
5. Wire animations LAST (only after layout is correct).
6. Test offline, slow 3G, and dark mode before marking done.

