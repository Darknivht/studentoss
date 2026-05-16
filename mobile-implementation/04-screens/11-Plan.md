# 11 — Plan

> **Web source of truth:** `src/pages/Plan.tsx`
> **RN target:** `src/screens/PlanScreen.tsx`
> **Route name:** `Plan`
> **Auth:** Required
> **Bottom nav visible:** Yes

---

## 1. Purpose

Planning hub: Smart Scheduler, Study Timetable, Sleep Calculator, Lofi Radio, Weakness Detector, Pomodoro, Progress Tracker.

## 2. Data dependencies

Open the web file and copy **every hook call** into the RN screen unchanged. The data layer does not change.

- `supabase.from('study_schedules').select()`
- `supabase.from('sleep_logs').select()`
- Lofi tracks served from edge function or hardcoded list

## 3. Layout (top → bottom)

Tabs along top: Schedule | Timetable | Sleep | Lofi | Pomodoro. Each tab renders its component.

## 4. Component tree mapping

| Web element | RN replacement | Notes |
|---|---|---|
| tabs | top tabs (Material) | swipeable |
| LofiRadio | audio player UI; uses `expo-av` Sound | minimized mini-player persists across tabs |
| SleepCalculator | port logic, render with sliders + bedtime/wake selectors | |
| Pomodoro | port `PomodoroTimer.tsx`, run via `expo-background-fetch` or local notification when done | |

## 5. Animations

- Lofi: rotating vinyl record (Reanimated infinite rotate)
- Pomodoro: progress ring fills around timer
- Sleep calculator: moon icon morphs as time changes

## 6. Interactions & navigation

- Lofi mini-player visible in all tabs while playing
- Pomodoro plays sound + haptic on phase change
- Schedule items: tap to edit, swipe to delete

## 7. Edge cases (MUST handle)

- Lofi network drop → buffer warning, fallback to cached track
- Pomodoro killed by OS → local notification at scheduled end
- Sleep calc with crazy values → clamp 0-24h

## 8. Native enhancements (mobile-only wins)

- Background audio playback (`expo-av` w/ `staysActiveInBackground: true`)
- Media controls in lockscreen / control center
- Local notification for Pomodoro end

## 9. Performance

- Wrap large lists in `FlashList` (Shopify) instead of `FlatList` when item count > 50.
- Memoize cards with `React.memo` and stable keys.
- Hoist `renderItem` out of render; never inline arrow inside `FlatList`.
- Use `removeClippedSubviews` on long scroll views.
- Defer offscreen image loads with `expo-image` `priority="low"`.

## 10. Acceptance checklist

- [ ] Lofi plays in background
- [ ] Pomodoro completes even when app backgrounded
- [ ] Schedule CRUD works
- [ ] Sleep calc matches web formulas

## 11. Implementation order (for the agent)

1. Create the screen file with hooks copied verbatim from the web page.
2. Render a bare `<View>` with a `<Text>` of the title — verify route works.
3. Port the header / hero section.
4. Port each section top-to-bottom, one commit per section.
5. Wire animations LAST (only after layout is correct).
6. Test offline, slow 3G, and dark mode before marking done.

