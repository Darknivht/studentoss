# 03 — Dashboard

> **Web source:** `src/pages/Dashboard.tsx`  
> **RN target:** `src/screens/DashboardScreen.tsx`  
> **Route name:** `Dashboard`  
> **Nav type:** Tab  
> **Auth required:** Yes

## 0. One-liner

Home tab — greeting, streak, daily quiz, courses.

## 1. Web imports → mobile equivalents

Copy the data layer **verbatim** where possible. Swap UI imports per the table.

| Web import | Type | Mobile equivalent |
|---|---|---|
| `useAuth` from `@/hooks/useAuth` | hook | **keep as-is** (data hooks are platform-agnostic) |
| `useToast` from `@/hooks/use-toast` | hook | **keep as-is** (data hooks are platform-agnostic) |
| `useOfflineData, cacheDataLocally, getCachedData` from `@/hooks/useOfflineData` | hook | **keep as-is** (data hooks are platform-agnostic) |
| `updateAllCoursesProgress` from `@/hooks/useCourseProgress` | hook | **keep as-is** (data hooks are platform-agnostic) |
| `supabase` from `@/integrations/supabase/client` | lib | **keep as-is** (supabase client / formatters / config) |
| `checkAndResetStreak` from `@/lib/streak` | lib | **keep as-is** (supabase client / formatters / config) |
| `CourseCard` from `@/components/dashboard/CourseCard` | component | port to `src/components/dashboard/CourseCard.tsx` (RN) |
| `AddCourseDialog` from `@/components/dashboard/AddCourseDialog` | component | port to `src/components/dashboard/AddCourseDialog.tsx` (RN) |
| `StreakCard` from `@/components/dashboard/StreakCard` | component | port to `src/components/dashboard/StreakCard.tsx` (RN) |
| `StudyProgressWidget` from `@/components/dashboard/StudyProgressWidget` | component | port to `src/components/dashboard/StudyProgressWidget.tsx` (RN) |
| `StudyTimeWidget` from `@/components/dashboard/StudyTimeWidget` | component | port to `src/components/dashboard/StudyTimeWidget.tsx` (RN) |
| `DailyQuizChallenge` from `@/components/gamification/DailyQuizChallenge` | component | port to `src/components/gamification/DailyQuizChallenge.tsx` (RN) |
| `AdBanner` from `@/components/ads/AdBanner` | component | port to `src/components/ads/AdBanner.tsx` (RN) |
| `AnnouncementBanner` from `@/components/dashboard/AnnouncementBanner` | component | port to `src/components/dashboard/AnnouncementBanner.tsx` (RN) |
| `Button` from `@/components/ui/button` | component | src/components/ui/Button.tsx (RN port — see 05-shared-components/01-ui-primitives.md) |
| `Settings, WifiOff, RefreshCw` (lucide) | icons | swap import to `lucide-react-native` |
| `Target, ChevronRight` (lucide) | icons | swap import to `lucide-react-native` |
| `motion` (framer-motion) | animation | rewrite with `moti` + `react-native-reanimated` |
| `useNavigate` from `react-router-dom` | other | @react-navigation/native (useNavigation, useRoute) |
| `Link` from `react-router-dom` | other | @react-navigation/native (useNavigation, useRoute) |

## 2. Connected sub-components (port these too)

This screen consumes components from the directories below. Every file listed must be ported to the mobile codebase under the same path (`src/components/<dir>/<Name>.tsx`) using RN primitives + NativeWind.

### `src/components/ads/`

- `AdBanner.tsx`
- `GoogleAdBanner.tsx`

### `src/components/dashboard/`

- `AddCourseDialog.tsx`
- `AnnouncementBanner.tsx`
- `CourseCard.tsx`
- `StatsCard.tsx`
- `StreakCard.tsx`
- `StudyProgressWidget.tsx`
- `StudyTimeWidget.tsx`

### `src/components/gamification/`

- `DailyChallenges.tsx`
- `DailyQuizChallenge.tsx`

### `src/components/ui/`

- `accordion.tsx`
- `alert-dialog.tsx`
- `alert.tsx`
- `aspect-ratio.tsx`
- `avatar.tsx`
- `badge.tsx`
- `breadcrumb.tsx`
- `button.tsx`
- `calendar.tsx`
- `card.tsx`
- `carousel.tsx`
- `chart.tsx`
- `checkbox.tsx`
- `collapsible.tsx`
- `command.tsx`
- `context-menu.tsx`
- `dialog.tsx`
- `drawer.tsx`
- `dropdown-menu.tsx`
- `form.tsx`
- `hover-card.tsx`
- `input-otp.tsx`
- `input.tsx`
- `label.tsx`
- `markdown-renderer.tsx`
- `menubar.tsx`
- `navigation-menu.tsx`
- `pagination.tsx`
- `popover.tsx`
- `progress.tsx`
- `radio-group.tsx`
- `resizable.tsx`
- `scroll-area.tsx`
- `select.tsx`
- `separator.tsx`
- `sheet.tsx`
- `sidebar.tsx`
- `skeleton.tsx`
- `slider.tsx`
- `sonner.tsx`
- `switch.tsx`
- `table.tsx`
- `tabs.tsx`
- `textarea.tsx`
- `toast.tsx`
- `toaster.tsx`
- `toggle-group.tsx`
- `toggle.tsx`
- `tooltip.tsx`

## 3. Tailwind classNames preserved from web

These exact class strings appear in the web page. **Re-use them verbatim** in the RN `className=` (NativeWind v4 understands the same Tailwind grammar). Anything Tailwind-only-for-web (see `_APPENDIX/C-css-to-style-map.md`) must be swapped, but everything below is portable as-is.

```text
p-6 space-y-6
flex items-center justify-between
flex items-center gap-2
text-muted-foreground text-sm
inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs
w-3 h-3
text-2xl font-display font-bold text-foreground
w-10 h-10 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors
text-muted-foreground
flex items-center justify-between p-3 rounded-xl bg-destructive/10 border border-destructive/20
text-sm text-foreground
text-xs gap-1
p-4 rounded-2xl border border-primary/30 bg-gradient-to-r from-primary/10 to-primary/5 flex items-center gap-4
w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center
text-primary
flex-1
font-display font-bold text-sm text-foreground
text-xs text-muted-foreground
flex items-center justify-between mb-4
text-lg font-display font-semibold text-foreground
text-sm text-muted-foreground
grid grid-cols-2 gap-3
text-center py-8
```

## 4. Layout (top → bottom)

> Re-read the web JSX in the source file — the structure below is the canonical mobile order.

1. `SafeAreaView` root (`flex-1 bg-background`)
2. `StatusBar` themed to current colour scheme
3. Screen header (title + back / settings icons)
4. Scrollable body — port each section of the web JSX in source order
5. Floating action buttons / bottom-anchored CTA (if any)
6. Keyboard-aware wrapper (`KeyboardAvoidingView`) when the screen has inputs

## 5. Animations

Every `motion.div`/`AnimatePresence` in the web file maps to `<MotiView>` / `<AnimatePresence>` from `moti`. See `01-design-system/05-animations.md`.

- Mount fade-up: `from={{ opacity: 0, translateY: 8 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', duration: 220 }}`
- Stagger lists: add `delay: index * 60` per item
- Press feedback: wrap `Pressable` in `Animated.View` with `useAnimatedStyle` scaling 1 → 0.97
- Page transitions: handled by React Navigation `slide_from_right` (iOS) / `slide_from_bottom` (Android modals)

## 6. Interactions & navigation

- Replace every `navigate('/x')` with `navigation.navigate('XScreen', params)`
- Replace every `<Link to>` with `<Pressable onPress={() => navigation.navigate(...)}>` (or `<TouchableOpacity>`)
- Hardware back button: handled globally in `useMobileBackNavigation` port — see `03-navigation/03-back-button-handling.md`
- Add haptic feedback (`expo-haptics`) on every primary tap

## 7. Edge cases (MUST handle)

- **Loading**: show skeleton matching final layout (use `moti-skeleton`)
- **Empty**: friendly illustration + primary CTA
- **Error / no network**: render cached data from MMKV, banner reads *Showing offline data*
- **Unauthorised**: redirect to `Auth` screen
- **Subscription-gated action**: wrap in `<FeatureGate tier="plus">` — see `05-shared-components/03-FeatureGateDialog.md`
- **Dark mode**: every colour must come from the design tokens, never hard-coded

## 8. Native enhancements (mobile-only wins)

- Pull-to-refresh on lists (`RefreshControl`)
- Swipe-back gesture (`gestureEnabled: true`)
- Share extensions where the web uses `navigator.share`
- Long-press → context menu via `@react-native-menu/menu`
- Tab-press scroll-to-top using `navigation.addListener('tabPress')`

## 9. Performance

- `FlashList` for any list > 50 rows
- `React.memo` every row component; stable keys
- Hoist `renderItem` out of the parent render
- `expo-image` with `cachePolicy='memory-disk'` for all images
- Defer animations until after first paint with `InteractionManager.runAfterInteractions`

## 10. Acceptance checklist

- [ ] Side-by-side screenshot vs web is visually indistinguishable
- [ ] All hooks fetch real data from Supabase
- [ ] Pull-to-refresh re-fetches
- [ ] Hardware-back behaves correctly
- [ ] Dark mode passes
- [ ] No console warnings (key prop, deprecated APIs)
- [ ] Subscription gates fire for the right tiers

## 11. Implementation order (for the agent)

1. Create `src/screens/DashboardScreen.tsx` — copy every hook call from the web page verbatim.
2. Render a stub `<View><Text>Dashboard</Text></View>` and verify the route works in the navigator.
3. Port each connected sub-component listed in §2 — one commit per component.
4. Assemble the layout top-to-bottom following §4.
5. Add animations LAST (only once layout is pixel-correct).
6. Run the §10 acceptance checklist before marking done.
