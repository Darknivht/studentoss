# 02 — Onboarding

> **Web source of truth:** `src/pages/Onboarding.tsx`
> **RN target:** `src/screens/OnboardingScreen.tsx`
> **Route name:** `Onboarding`
> **Auth:** Required (just-signed-up users)
> **Bottom nav visible:** No

---

## 1. Purpose

7-step interactive onboarding that captures education level, school, goals, study habits, notification preferences, and shows a celebratory finale.

## 2. Data dependencies

Open the web file and copy **every hook call** into the RN screen unchanged. The data layer does not change.

- `useAuth()` for user
- `supabase.from('profiles').update(...)` to persist answers
- `useNotifications()` to request permission at step 6
- AsyncStorage flag `onboarding_complete` (use MMKV)

## 3. Layout (top → bottom)

Full-screen card with progress dots at top, content in middle, primary CTA at bottom. Swipe-left/right gestures advance steps. Each step is a `<View>` switched by `currentStep` state.

## 4. Component tree mapping

| Web element | RN replacement | Notes |
|---|---|---|
| step container | `<View>` with `Animated.View` | crossfade between steps |
| progress dots | custom row of 7 dots, active = wider w/ spring | |
| confetti | `react-native-confetti-cannon` | only on step 7 |
| chip selectors | `<Pressable>` rows with check mark | multi-select for goals |

## 5. Animations

- Step transition: outgoing slides left + fades, incoming slides in from right (PanGestureHandler for swipe)
- Progress dot grows with `withSpring({damping:14})`
- Confetti on finale step + haptic notification success

## 6. Interactions & navigation

- Next button disabled until required input filled
- 'Skip' top-right writes minimal defaults
- Back button (Android hardware) goes to previous step, exits to Auth on step 1 with confirmation
- On finish: write `onboarded_at = now()`, `navigation.reset` to `Main`

## 7. Edge cases (MUST handle)

- User backgrounds app mid-flow → resume on last step (persist `currentStep` to MMKV)
- Profile update fails → keep on step, show toast, allow retry
- Notification permission denied → continue anyway, set `notifications_enabled=false`

## 8. Native enhancements (mobile-only wins)

- Request notification permission at the natural step (not on launch)
- Schedule the first daily streak reminder right after onboarding
- Haptic on every Next press

## 9. Performance

- Wrap large lists in `FlashList` (Shopify) instead of `FlatList` when item count > 50.
- Memoize cards with `React.memo` and stable keys.
- Hoist `renderItem` out of render; never inline arrow inside `FlatList`.
- Use `removeClippedSubviews` on long scroll views.
- Defer offscreen image loads with `expo-image` `priority="low"`.

## 10. Acceptance checklist

- [ ] All 7 steps render and persist correctly
- [ ] Skip writes a valid profile
- [ ] Confetti fires once on finale
- [ ] Resumes mid-flow after app kill

## 11. Implementation order (for the agent)

1. Create the screen file with hooks copied verbatim from the web page.
2. Render a bare `<View>` with a `<Text>` of the title — verify route works.
3. Port the header / hero section.
4. Port each section top-to-bottom, one commit per section.
5. Wire animations LAST (only after layout is correct).
6. Test offline, slow 3G, and dark mode before marking done.

