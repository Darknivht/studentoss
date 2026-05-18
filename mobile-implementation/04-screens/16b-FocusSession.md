# 16b — FocusSession

> **Web source:** `src/pages/FocusSession.tsx`  
> **RN target:** `src/screens/FocusSessionScreen.tsx`  
> **Route name:** `FocusSession`  
> **Nav type:** Modal full-screen kiosk  
> **Auth required:** Yes

## 0. One-liner

Active focus session timer with blocking overlay.

## 1. Web imports → mobile equivalents

Copy the data layer **verbatim** where possible. Swap UI imports per the table.

| Web import | Type | Mobile equivalent |
|---|---|---|
| `useFocusLock` from `@/hooks/useFocusLock` | hook | **keep as-is** (data hooks are platform-agnostic) |
| `useToast` from `@/hooks/use-toast` | hook | **keep as-is** (data hooks are platform-agnostic) |
| `Button` from `@/components/ui/button` | component | src/components/ui/Button.tsx (RN port — see 05-shared-components/01-ui-primitives.md) |
| `Progress` from `@/components/ui/progress` | component | react-native-progress |
| `Card, CardContent, CardHeader, CardTitle` from `@/components/ui/card` | component | src/components/ui/Card.tsx (RN View + NativeWind) |
| `Slider` from `@/components/ui/slider` | component | port to `src/components/ui/slider.tsx` (RN) |
| `Badge` from `@/components/ui/badge` | component | port to `src/components/ui/badge.tsx` (RN) |
| `Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger` from `@/components/ui/dialog` | component | react-native-modal or @gorhom/bottom-sheet |
| `AppSelector` from `@/components/focus/AppSelector` | component | port to `src/components/focus/AppSelector.tsx` (RN) |
| `PermissionsSetup` from `@/components/focus/PermissionsSetup` | component | port to `src/components/focus/PermissionsSetup.tsx` (RN) |
| `Play, Pause, StopCircle, Lock, Shield, Clock, Settings, ChevronRight, Zap, Target` (lucide) | icons | swap import to `lucide-react-native` |
| `motion` (framer-motion) | animation | rewrite with `moti` + `react-native-reanimated` |

## 2. Connected sub-components (port these too)

This screen consumes components from the directories below. Every file listed must be ported to the mobile codebase under the same path (`src/components/<dir>/<Name>.tsx`) using RN primitives + NativeWind.

### `src/components/focus/`

- `AppSelector.tsx`
- `BlockingOverlay.tsx`
- `FocusModeOverlay.tsx`
- `PermissionsSetup.tsx`

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
p-6 space-y-6 pb-24
text-2xl font-display font-bold text-foreground
text-muted-foreground text-sm mt-1
border-primary/50 bg-primary/5
pb-2
flex items-center justify-between
flex items-center gap-2
w-5 h-5 text-primary
text-lg
space-y-4
text-center py-4
text-5xl font-display font-bold text-foreground mb-2
text-sm text-muted-foreground
space-y-2
h-3
flex justify-between text-xs text-muted-foreground
flex items-center justify-center gap-2 text-sm text-muted-foreground
w-4 h-4
flex gap-3
flex-1
w-4 h-4 mr-2
text-lg flex items-center gap-2
text-center
text-4xl font-display font-bold text-foreground
text-lg text-muted-foreground ml-2
py-4
flex gap-2
cursor-pointer hover:border-primary/50 transition-colors
flex items-center justify-between p-4
flex items-center gap-3
w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center
font-medium
w-5 h-5 text-muted-foreground
max-h-[80vh] overflow-y-auto
cursor-pointer border-amber-500/50 bg-amber-500/5
w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center
w-5 h-5 text-amber-500
w-full h-14 text-lg gradient-primary text-primary-foreground
w-5 h-5 mr-2
p-4 rounded-2xl bg-muted
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

1. Create `src/screens/FocusSessionScreen.tsx` — copy every hook call from the web page verbatim.
2. Render a stub `<View><Text>FocusSession</Text></View>` and verify the route works in the navigator.
3. Port each connected sub-component listed in §2 — one commit per component.
4. Assemble the layout top-to-bottom following §4.
5. Add animations LAST (only once layout is pixel-correct).
6. Run the §10 acceptance checklist before marking done.
