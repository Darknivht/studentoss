# 23 — AdminResources

> **Web source:** `src/pages/AdminResources.tsx`  
> **RN target:** `src/screens/AdminResourcesScreen.tsx`  
> **Route name:** `AdminResources`  
> **Nav type:** Stack (admin only)  
> **Auth required:** Yes

## 0. One-liner

Admin-only resource & textbook management (gated; mobile ships read-only).

## 1. Web imports → mobile equivalents

Copy the data layer **verbatim** where possible. Swap UI imports per the table.

| Web import | Type | Mobile equivalent |
|---|---|---|
| `toast` from `@/hooks/use-toast` | hook | **keep as-is** (data hooks are platform-agnostic) |
| `supabase` from `@/integrations/supabase/client` | lib | **keep as-is** (supabase client / formatters / config) |
| `Input` from `@/components/ui/input` | component | port to `src/components/ui/input.tsx` (RN) |
| `Button` from `@/components/ui/button` | component | src/components/ui/Button.tsx (RN port — see 05-shared-components/01-ui-primitives.md) |
| `Card, CardContent, CardHeader, CardTitle` from `@/components/ui/card` | component | src/components/ui/Card.tsx (RN View + NativeWind) |
| `Label` from `@/components/ui/label` | component | port to `src/components/ui/label.tsx` (RN) |
| `Textarea` from `@/components/ui/textarea` | component | port to `src/components/ui/textarea.tsx` (RN) |
| `Select, SelectContent, SelectItem, SelectTrigger, SelectValue` from `@/components/ui/select` | component | react-native-picker-select or custom bottom-sheet picker |
| `Switch` from `@/components/ui/switch` | component | port to `src/components/ui/switch.tsx` (RN) |
| `Table, TableBody, TableCell, TableHead, TableHeader, TableRow` from `@/components/ui/table` | component | port to `src/components/ui/table.tsx` (RN) |
| `Badge` from `@/components/ui/badge` | component | port to `src/components/ui/badge.tsx` (RN) |
| `Tabs, TabsContent, TabsList, TabsTrigger` from `@/components/ui/tabs` | component | react-native-tab-view or custom segmented control |
| `Dialog, DialogContent, DialogHeader, DialogTitle` from `@/components/ui/dialog` | component | react-native-modal or @gorhom/bottom-sheet |
| `Lock, Plus, Trash2, Edit, Loader2, LogOut, Megaphone, Trophy, Users, BarChart3, CreditCard, Search, BookOpen, Upload, Eye, Ban, ShieldCheck, RefreshCw` (lucide) | icons | swap import to `lucide-react-native` |
| `LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend` from `recharts` | other | — |

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
min-h-screen flex items-center justify-center p-4 bg-background
w-full max-w-sm
text-center
w-10 h-10 mx-auto mb-2 text-muted-foreground
space-y-4
w-full
w-4 h-4 animate-spin mr-2
min-h-screen bg-background p-2 sm:p-4 max-w-6xl mx-auto space-y-4
flex items-center justify-between px-1
text-lg sm:text-2xl font-bold
w-4 h-4 mr-1
overflow-x-auto -mx-2 px-2 pb-1
inline-flex w-auto min-w-full sm:grid sm:grid-cols-7 gap-0.5
text-xs whitespace-nowrap px-2 sm:px-3
w-3 h-3 mr-1 hidden sm:inline
space-y-6
flex justify-center py-12
w-6 h-6 animate-spin
grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3
pt-4 pb-3 text-center
text-2xl mb-0.5
text-xl font-bold
text-xs text-muted-foreground
grid grid-cols-1 md:grid-cols-4 gap-4
border-primary/30 bg-primary/5
pb-1
text-sm
text-3xl font-bold text-primary
text-xs text-muted-foreground mt-1
border-amber-500/30 bg-amber-500/5
text-3xl font-bold text-amber-600
md:col-span-2
text-xs
space-y-1.5 max-h-[200px] overflow-y-auto
flex justify-between items-center text-sm
truncate max-w-[60%]
flex gap-2
w-3 h-3 mr-1
text-lg
grid grid-cols-1 sm:grid-cols-2 gap-4
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

1. Create `src/screens/AdminResourcesScreen.tsx` — copy every hook call from the web page verbatim.
2. Render a stub `<View><Text>AdminResources</Text></View>` and verify the route works in the navigator.
3. Port each connected sub-component listed in §2 — one commit per component.
4. Assemble the layout top-to-bottom following §4.
5. Add animations LAST (only once layout is pixel-correct).
6. Run the §10 acceptance checklist before marking done.
