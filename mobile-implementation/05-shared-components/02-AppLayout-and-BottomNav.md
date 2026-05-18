# AppLayout-and-BottomNav — AppLayout & BottomNav

> **Web source:** `src/components/layout/AppLayout.tsx`, `BottomNav.tsx`
> **RN target:** `src/components/layout/AppLayout.tsx`, `BottomNav.tsx`

## AppLayout

Wraps every authenticated screen. Provides:
- `SafeAreaView` (top + bottom edges)
- `KeyboardAvoidingView` (iOS only, behavior='padding')
- Pull-down to refresh prop forwarding
- Optional `headerTitle`, `headerRight`, `showBack` props
- `padding` toggle (some screens like Chat are edge-to-edge)

```tsx
export function AppLayout({ children, title, showBack = false, headerRight, scroll = true, padding = true }) {
  const Wrapper = scroll ? ScrollView : View;
  return (
    <SafeAreaView className='flex-1 bg-background'>
      <Header title={title} showBack={showBack} right={headerRight} />
      <Wrapper className={padding ? 'flex-1 px-4' : 'flex-1'}>
        {children}
      </Wrapper>
    </SafeAreaView>
  );
}
```

## BottomNav (Tab Navigator)

Custom `tabBar` prop on `createBottomTabNavigator`. Five tabs: Dashboard, Study, Plan, Social, More.
'More' opens a bottom sheet listing: Career, Store, Focus, Safety, Achievements, Settings.

### Animated pill indicator
Reanimated `useSharedValue` for active tab index. Pill `translateX` interpolates between tab centers.
Tab icon scale 1 → 1.15 when active. Label only renders when active (saves space).

### Haptics
`Haptics.selectionAsync()` on tab change.

### Hide on certain routes
Use `tabBarStyle: { display: 'none' }` from screen options for: Auth, Onboarding, AITutor, Chat, FocusSession.

## Acceptance
- [ ] Layout works in all device safe-area configs (notch, dynamic island)
- [ ] Pill animation is smooth at 60fps
- [ ] Bottom nav hides on full-screen routes

<!-- STYLES_APPENDIX -->

## Styles & className mapping (NativeWind v4)

These are the **exact Tailwind class strings** used by the web counterpart(s). NativeWind v4 understands the same grammar — copy them straight into your RN component's `className=` and only swap the web-only utilities listed in `_APPENDIX/C-css-to-style-map.md` (e.g. `hover:*`, `backdrop-blur-*`, `transition-*` for non-Reanimated transitions).


### From `src/components/layout/AppLayout.tsx`

```text
min-h-screen flex items-center justify-center bg-background
flex flex-col items-center gap-4
w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center glow-primary
w-8 h-8 text-primary-foreground animate-spin
text-muted-foreground animate-pulse
flex flex-col items-center gap-4 text-center px-6
w-16 h-16 rounded-2xl bg-muted flex items-center justify-center
w-8 h-8 text-muted-foreground
text-foreground font-medium
text-muted-foreground text-sm
gradient-primary text-primary-foreground
w-4 h-4 mr-2
min-h-screen bg-background pb-24
sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border
max-w-lg mx-auto px-4 py-3 flex items-center justify-between
flex items-center gap-2
w-8 h-8 rounded-lg gradient-primary flex items-center justify-center
text-sm font-bold text-primary-foreground
font-display font-bold text-foreground
flex items-center gap-1
rounded-full
w-5 h-5
w-80
mt-6 space-y-2
flex items-center gap-3 p-3 rounded-xl hover:bg-muted transition-colors
w-5 h-5 text-primary
max-w-lg mx-auto

### From `src/components/layout/BottomNav.tsx`

```text
fixed bottom-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-xl border-t border-border safe-area-pb
flex items-center justify-around py-2 px-1 max-w-lg mx-auto
relative flex flex-col items-center gap-0.5 py-1.5 px-2 rounded-xl transition-colors
absolute inset-0 bg-primary/10 rounded-xl
relative z-10
absolute -bottom-0.5 w-1 h-1 rounded-full bg-primary
```

### Conversion checklist

- Keep colour utilities (`bg-primary`, `text-foreground`, `border-border/50`) — defined in `01-design-system/01-colors-tokens.md`.
- Keep spacing, sizing, radius, flex, grid (when supported by NativeWind).
- Replace `hover:*` → use `Pressable`'s `pressed` state or Reanimated.
- Replace `backdrop-blur-*` → `expo-blur` `<BlurView>`.
- Replace `transition-*` / `animate-*` → Moti / Reanimated.
- Replace `cursor-*`, `select-*`, `pointer-events-*` → not needed on RN.
- Replace `grid grid-cols-N gap-X` → `<View className="flex-row flex-wrap gap-X">` or `FlashList numColumns={N}`.
