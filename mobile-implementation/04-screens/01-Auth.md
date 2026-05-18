# 01 — Auth

> **Web source:** `src/pages/Auth.tsx`  
> **RN target:** `src/screens/AuthScreen.tsx`  
> **Route name:** `Auth`  
> **Nav type:** Stack (pre-auth)  
> **Auth required:** No

## 0. One-liner

Email/password + Google OAuth sign-in and sign-up.

## 1. Web imports → mobile equivalents

Copy the data layer **verbatim** where possible. Swap UI imports per the table.

| Web import | Type | Mobile equivalent |
|---|---|---|
| `useAuth` from `@/hooks/useAuth` | hook | **keep as-is** (data hooks are platform-agnostic) |
| `useToast` from `@/hooks/use-toast` | hook | **keep as-is** (data hooks are platform-agnostic) |
| `supabase` from `@/integrations/supabase/client` | lib | **keep as-is** (supabase client / formatters / config) |
| `Button` from `@/components/ui/button` | component | src/components/ui/Button.tsx (RN port — see 05-shared-components/01-ui-primitives.md) |
| `Input` from `@/components/ui/input` | component | port to `src/components/ui/input.tsx` (RN) |
| `Label` from `@/components/ui/label` | component | port to `src/components/ui/label.tsx` (RN) |
| `BookOpen, Sparkles, Brain, Rocket, Eye, EyeOff, ArrowLeft, Loader2` (lucide) | icons | swap import to `lucide-react-native` |
| `motion, AnimatePresence` (framer-motion) | animation | rewrite with `moti` + `react-native-reanimated` |
| `useNavigate` from `react-router-dom` | other | @react-navigation/native (useNavigation, useRoute) |
| `z` from `zod` | other | — |

## 2. Connected sub-components (port these too)

This screen consumes components from the directories below. Every file listed must be ported to the mobile codebase under the same path (`src/components/<dir>/<Name>.tsx`) using RN primitives + NativeWind.

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
min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-background
absolute inset-0 overflow-hidden
absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse
absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-3xl animate-pulse
absolute top-1/2 left-1/2 w-64 h-64 bg-accent/20 rounded-full blur-3xl animate-pulse
absolute text-primary/30
w-full max-w-md relative z-10
glass-card p-8 shadow-elevated
text-center mb-8
inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-primary mb-4 glow-primary
w-8 h-8 text-primary-foreground
text-3xl font-display font-bold text-gradient
text-muted-foreground mt-2
flex bg-muted rounded-xl p-1 mb-6
space-y-4
text-sm font-medium
mt-1.5
text-destructive text-xs mt-1
relative mt-1.5
pr-10
absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors
text-xs text-primary hover:underline w-full text-right -mt-1
w-full gradient-primary text-primary-foreground hover:opacity-90 transition-opacity h-12 text-base font-medium
w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full
ml-2 w-4 h-4
absolute inset-0 z-20 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-2xl
p-6 space-y-4 w-full
flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground
text-xl font-bold
text-sm text-muted-foreground
w-full
w-4 h-4 animate-spin
mt-8 pt-6 border-t border-border
text-xs text-center text-muted-foreground mb-4
flex justify-center gap-4
text-xs bg-muted px-3 py-1.5 rounded-full
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

1. Create `src/screens/AuthScreen.tsx` — copy every hook call from the web page verbatim.
2. Render a stub `<View><Text>Auth</Text></View>` and verify the route works in the navigator.
3. Port each connected sub-component listed in §2 — one commit per component.
4. Assemble the layout top-to-bottom following §4.
5. Add animations LAST (only once layout is pixel-correct).
6. Run the §10 acceptance checklist before marking done.
