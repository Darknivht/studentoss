# 06 — CoursePage

> **Web source of truth:** `src/pages/CoursePage.tsx`
> **RN target:** `src/screens/CoursePageScreen.tsx`
> **Route name:** `CoursePage (params: { courseId })`
> **Auth:** Required
> **Bottom nav visible:** No (back arrow header)

---

## 1. Purpose

Single-course detail: progress %, notes for this course, flashcards, quizzes, attached resources, study sessions log.

## 2. Data dependencies

Open the web file and copy **every hook call** into the RN screen unchanged. The data layer does not change.

- `useCourseProgress(courseId)`
- `supabase.from('courses').select().eq('id', courseId).single()`
- `supabase.from('notes').select().eq('course_id', courseId)`
- `supabase.from('flashcards').select().eq('course_id', courseId)`
- `supabase.from('study_sessions').select().eq('course_id', courseId)`

## 3. Layout (top → bottom)

1. Header with back arrow, course name, edit pencil
2. Hero: course color gradient + emoji icon + progress ring (Reanimated SVG)
3. Tab bar: Notes / Flashcards / Quizzes / Sessions
4. Tab content (lazy-loaded via React Navigation Material Top Tabs)
5. FAB for adding new content to current tab

## 4. Component tree mapping

| Web element | RN replacement | Notes |
|---|---|---|
| top tabs | `@react-navigation/material-top-tabs` | swipeable |
| progress ring | `react-native-svg` Circle with Reanimated `useAnimatedProps` | |

## 5. Animations

- Progress ring fills from 0 → actual on mount (1s ease-out)
- Tab indicator slides between tabs
- Hero parallax: as user scrolls, hero scales down + sticks header

## 6. Interactions & navigation

- Edit pencil → bottom sheet to rename / change color / delete
- Tap Note/Flashcard → opens viewer
- Delete course → confirm dialog, cascades via Supabase

## 7. Edge cases (MUST handle)

- Course not found → fallback screen with 'Back to Dashboard'
- Empty tab → tab-specific empty state
- Long course name → ellipsize

## 8. Native enhancements (mobile-only wins)

- Shared element transition: tap course card on Dashboard → hero expands (react-navigation `screenAnimation`)
- Haptic on tab change

## 9. Performance

- Wrap large lists in `FlashList` (Shopify) instead of `FlatList` when item count > 50.
- Memoize cards with `React.memo` and stable keys.
- Hoist `renderItem` out of render; never inline arrow inside `FlatList`.
- Use `removeClippedSubviews` on long scroll views.
- Defer offscreen image loads with `expo-image` `priority="low"`.

## 10. Acceptance checklist

- [ ] All 4 tabs render correct filtered data
- [ ] Progress ring animates to actual %
- [ ] Edit + delete work
- [ ] Back navigates correctly

## 11. Implementation order (for the agent)

1. Create the screen file with hooks copied verbatim from the web page.
2. Render a bare `<View>` with a `<Text>` of the title — verify route works.
3. Port the header / hero section.
4. Port each section top-to-bottom, one commit per section.
5. Wire animations LAST (only after layout is correct).
6. Test offline, slow 3G, and dark mode before marking done.

