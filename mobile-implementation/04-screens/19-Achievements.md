# 19 — Achievements

> **Web source:** `src/pages/Achievements.tsx`  
> **RN target:** `src/screens/AchievementsScreen.tsx`  
> **Route name:** `Achievements`  
> **Nav type:** Stack  
> **Auth required:** Yes

## 0. One-liner

50+ achievement milestones grid with XP & rarity tiers.

## 1. Web imports → mobile equivalents

Copy the data layer **verbatim** where possible. Swap UI imports per the table.

| Web import | Type | Mobile equivalent |
|---|---|---|
| `useAuth` from `@/hooks/useAuth` | hook | **keep as-is** (data hooks are platform-agnostic) |
| `useToast` from `@/hooks/use-toast` | hook | **keep as-is** (data hooks are platform-agnostic) |
| `fetchUserStats, checkAndUnlockAchievements` from `@/hooks/useAchievements` | hook | **keep as-is** (data hooks are platform-agnostic) |
| `supabase` from `@/integrations/supabase/client` | lib | **keep as-is** (supabase client / formatters / config) |
| `Trophy, Lock, CheckCircle, Flame, Star, Zap, Award, Target` (lucide) | icons | swap import to `lucide-react-native` |
| `motion, AnimatePresence` (framer-motion) | animation | rewrite with `moti` + `react-native-reanimated` |
| `confetti` from `canvas-confetti` | other | — |

## 3. Tailwind classNames preserved from web

These exact class strings appear in the web page. **Re-use them verbatim** in the RN `className=` (NativeWind v4 understands the same Tailwind grammar). Anything Tailwind-only-for-web (see `_APPENDIX/C-css-to-style-map.md`) must be swapped, but everything below is portable as-is.

```text
p-6 flex items-center justify-center min-h-[60vh]
w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin
p-6 space-y-6 pb-24
text-2xl font-display font-bold text-foreground
text-muted-foreground text-sm mt-1
relative overflow-hidden rounded-3xl
absolute inset-0 overflow-hidden
absolute w-2 h-2 bg-white/30 rounded-full
relative z-10 flex items-center gap-4
w-20 h-20 rounded-2xl bg-white/20 flex items-center justify-center text-4xl
text-white
text-5xl font-bold
text-lg opacity-90
text-sm font-medium bg-white/20 px-2 py-1 rounded-full mt-1 inline-block
mt-4 relative z-10
flex items-center justify-between text-white/80 text-sm mb-1
h-2 bg-white/20 rounded-full overflow-hidden
h-full bg-white rounded-full
font-semibold text-foreground mb-3 flex items-center gap-2
w-5 h-5 text-orange-500
grid grid-cols-3 gap-2
p-5 rounded-3xl gradient-primary text-primary-foreground
flex items-center gap-4
w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center
w-8 h-8
text-3xl font-bold
text-sm opacity-90
mt-4 h-2 bg-white/20 rounded-full overflow-hidden
h-full bg-white
grid grid-cols-2 gap-3
absolute inset-0 bg-gradient-to-br from-amber-500/20 to-orange-500/20 z-10
absolute inset-0 bg-white/20 rounded-2xl
flex items-start justify-between mb-2 relative z-20
text-2xl
w-5 h-5 text-primary
w-4 h-4 text-muted-foreground
font-semibold text-foreground text-sm relative z-20
text-xs text-muted-foreground mt-1 relative z-20
mt-2 relative z-20
h-1 bg-muted rounded-full overflow-hidden
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

1. Create `src/screens/AchievementsScreen.tsx` — copy every hook call from the web page verbatim.
2. Render a stub `<View><Text>Achievements</Text></View>` and verify the route works in the navigator.
3. Port each connected sub-component listed in §2 — one commit per component.
4. Assemble the layout top-to-bottom following §4.
5. Add animations LAST (only once layout is pixel-correct).
6. Run the §10 acceptance checklist before marking done.
