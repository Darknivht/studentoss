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

