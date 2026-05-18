# 05 — SmartNotes

> **Web source:** `src/pages/SmartNotes.tsx`  
> **RN target:** `src/screens/SmartNotesScreen.tsx`  
> **Route name:** `SmartNotes`  
> **Nav type:** Stack (push from Study)  
> **Auth required:** Yes

## 0. One-liner

Upload, organise, view and AI-summarise notes.

## 1. Web imports → mobile equivalents

Copy the data layer **verbatim** where possible. Swap UI imports per the table.

| Web import | Type | Mobile equivalent |
|---|---|---|
| `useAuth` from `@/hooks/useAuth` | hook | **keep as-is** (data hooks are platform-agnostic) |
| `useToast` from `@/hooks/use-toast` | hook | **keep as-is** (data hooks are platform-agnostic) |
| `updateCourseProgress` from `@/hooks/useCourseProgress` | hook | **keep as-is** (data hooks are platform-agnostic) |
| `runAchievementCheck` from `@/hooks/useAchievements` | hook | **keep as-is** (data hooks are platform-agnostic) |
| `useOfflineSync` from `@/hooks/useOfflineSync` | hook | **keep as-is** (data hooks are platform-agnostic) |
| `useOfflineData` from `@/hooks/useOfflineData` | hook | **keep as-is** (data hooks are platform-agnostic) |
| `useSubscription` from `@/hooks/useSubscription` | hook | **keep as-is** (data hooks are platform-agnostic) |
| `supabase` from `@/integrations/supabase/client` | lib | **keep as-is** (supabase client / formatters / config) |
| `streamAIChat` from `@/lib/ai` | lib | **keep as-is** (supabase client / formatters / config) |
| `updateStreak` from `@/lib/streak` | lib | **keep as-is** (supabase client / formatters / config) |
| `Button` from `@/components/ui/button` | component | src/components/ui/Button.tsx (RN port — see 05-shared-components/01-ui-primitives.md) |
| `Textarea` from `@/components/ui/textarea` | component | port to `src/components/ui/textarea.tsx` (RN) |
| `Input` from `@/components/ui/input` | component | port to `src/components/ui/input.tsx` (RN) |
| `Select, SelectContent, SelectItem, SelectTrigger, SelectValue` from `@/components/ui/select` | component | react-native-picker-select or custom bottom-sheet picker |
| `NoteCard` from `@/components/notes/NoteCard` | component | port to `src/components/notes/NoteCard.tsx` (RN) |
| `SocraticTutor` from `@/components/notes/SocraticTutor` | component | port to `src/components/notes/SocraticTutor.tsx` (RN) |
| `AISummaryDialog` from `@/components/notes/AISummaryDialog` | component | port to `src/components/notes/AISummaryDialog.tsx` (RN) |
| `FileUpload` from `@/components/notes/FileUpload` | component | port to `src/components/notes/FileUpload.tsx` (RN) |
| `NoteViewerDialog` from `@/components/notes/NoteViewerDialog` | component | port to `src/components/notes/NoteViewerDialog.tsx` (RN) |
| `UpgradePrompt` from `@/components/subscription/UpgradePrompt` | component | port to `src/components/subscription/UpgradePrompt.tsx` (RN) |
| `Plus, FileText, Sparkles, Loader2, WifiOff` (lucide) | icons | swap import to `lucide-react-native` |
| `motion, AnimatePresence` (framer-motion) | animation | rewrite with `moti` + `react-native-reanimated` |
| `useLocation` from `react-router-dom` | other | @react-navigation/native (useNavigation, useRoute) |

## 2. Connected sub-components (port these too)

This screen consumes components from the directories below. Every file listed must be ported to the mobile codebase under the same path (`src/components/<dir>/<Name>.tsx`) using RN primitives + NativeWind.

### `src/components/notes/`

- `AISummaryDialog.tsx`
- `FileUpload.tsx`
- `NoteCard.tsx`
- `NoteViewerDialog.tsx`
- `SocraticTutor.tsx`

### `src/components/subscription/`

- `FeatureGateDialog.tsx`
- `UpgradePrompt.tsx`

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
text-2xl font-display font-bold text-foreground
inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs
w-3 h-3
text-muted-foreground text-sm mt-1
gradient-primary text-primary-foreground
w-4 h-4 mr-1
overflow-hidden
p-5 rounded-2xl bg-card border border-border shadow-sm space-y-4
text-lg font-medium
text-center text-xs text-muted-foreground
resize-none
flex gap-2
w-4 h-4 mr-2
p-4 rounded-2xl gradient-primary text-primary-foreground
flex items-center gap-3
w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center
w-5 h-5
font-semibold
text-sm opacity-90
w-full
text-lg font-display font-semibold mb-4
space-y-3
h-24 rounded-2xl bg-muted animate-pulse
text-center py-12
w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-4
w-8 h-8 text-primary
font-semibold text-lg mb-2
text-muted-foreground text-sm mb-4
relative
absolute inset-0 bg-background/80 rounded-2xl flex items-center justify-center z-10
w-6 h-6 animate-spin text-primary
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

1. Create `src/screens/SmartNotesScreen.tsx` — copy every hook call from the web page verbatim.
2. Render a stub `<View><Text>SmartNotes</Text></View>` and verify the route works in the navigator.
3. Port each connected sub-component listed in §2 — one commit per component.
4. Assemble the layout top-to-bottom following §4.
5. Add animations LAST (only once layout is pixel-correct).
6. Run the §10 acceptance checklist before marking done.
