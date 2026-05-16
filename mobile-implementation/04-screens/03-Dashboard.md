# 03 — Dashboard

> **Web source of truth:** `src/pages/Dashboard.tsx`
> **RN target:** `src/screens/DashboardScreen.tsx`
> **Route name:** `Dashboard`
> **Auth:** Required
> **Bottom nav visible:** Yes

---

## 1. Purpose

Home tab. Shows greeting, streak, daily challenge, study time widget, courses, progress, announcements banner.

## 2. Data dependencies

Open the web file and copy **every hook call** into the RN screen unchanged. The data layer does not change.

- `useAuth()`, `useSubscription()`, `useAchievements()`
- `useStudyTimeTracker()` for weekly minutes
- `useStreak()` (from lib/streak.ts)
- `supabase.from('courses').select('*').eq('user_id', user.id)`
- `supabase.from('announcements').select('*').eq('active', true)`

## 3. Layout (top → bottom)

1. AnnouncementBanner (conditional)
2. Header: 'Good {morning/afternoon}, {name}' + avatar (tap → Profile)
3. StreakCard (flame icon, current/best, weekly grid)
4. DailyQuizChallenge widget
5. StatsCards row: XP, Level, Rank
6. StudyTimeWidget (this week chart)
7. StudyProgressWidget
8. 'My Courses' header + 'Add' button → CourseCard grid (2 cols on phone, 3 on tablet)
9. Pull-to-refresh wraps everything

## 4. Component tree mapping

| Web element | RN replacement | Notes |
|---|---|---|
| outer | `<ScrollView refreshControl={<RefreshControl/>}>` | |
| course grid | `<View flexDirection='row' flexWrap='wrap'>` or `FlashList numColumns={2}` | |
| StreakCard | port from `src/components/dashboard/StreakCard.tsx` | replace SVG flame with `lucide-react-native` Flame |
| AnnouncementBanner | port | swipeable to dismiss (Reanimated PanGesture) |

## 5. Animations

- Streak flame pulse (Moti loop scale 1 → 1.08)
- Stats cards stagger on mount (delay 100ms each)
- Pull-to-refresh uses native RefreshControl tinted with primary

## 6. Interactions & navigation

- Tap CourseCard → navigate to `CoursePage` with `courseId`
- Tap StudyTimeWidget → opens stats modal
- Long-press CourseCard → context menu (Edit / Delete) via `@react-native-menu/menu`

## 7. Edge cases (MUST handle)

- No courses → empty state with 'Add your first course' CTA
- Offline → render cached data from MMKV, banner 'Showing offline data'
- New user (no streak) → show '0 day streak — start today!'
- Subscription free + ads enabled → show `AdBanner` between sections 5 and 6

## 8. Native enhancements (mobile-only wins)

- App-icon badge with unread chat count
- Background fetch refreshes streak before user opens app
- Quick action (long-press app icon): 'Continue studying'

## 9. Performance

- Wrap large lists in `FlashList` (Shopify) instead of `FlatList` when item count > 50.
- Memoize cards with `React.memo` and stable keys.
- Hoist `renderItem` out of render; never inline arrow inside `FlatList`.
- Use `removeClippedSubviews` on long scroll views.
- Defer offscreen image loads with `expo-image` `priority="low"`.

## 10. Acceptance checklist

- [ ] All widgets render with real data
- [ ] Pull-to-refresh re-fetches
- [ ] Empty state when no courses
- [ ] Offline shows cached snapshot

## 11. Implementation order (for the agent)

1. Create the screen file with hooks copied verbatim from the web page.
2. Render a bare `<View>` with a `<Text>` of the title — verify route works.
3. Port the header / hero section.
4. Port each section top-to-bottom, one commit per section.
5. Wire animations LAST (only after layout is correct).
6. Test offline, slow 3G, and dark mode before marking done.

