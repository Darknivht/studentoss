# Toasts-and-Modals — Toasts & Modals

> **Web source:** shadcn `useToast`, Dialog
> **RN target:** `src/components/ui/Toast.tsx`, `Dialog.tsx`

## Toasts

Use **`burnt`** (native iOS UIView/Android Snackbar wrappers — feel native) OR **`react-native-toast-message`** (more customizable).

API matches web:
```ts
const { toast } = useToast();
toast({ title: 'Saved', description: '...', variant: 'default' | 'destructive' });
```

Position: top on iOS (under safe area), bottom on Android (above bottom nav).
Auto-dismiss after 3s. Swipe to dismiss.

## Modals / Dialogs

Use RN `Modal` with custom animated overlay (Moti).

```tsx
<Modal transparent animationType='none' visible={open} onRequestClose={onClose}>
  <MotiView from={{opacity:0}} animate={{opacity:1}} className='absolute inset-0 bg-black/60' />
  <MotiView from={{translateY:300, opacity:0}} animate={{translateY:0, opacity:1}}
            transition={{type:'spring', damping:18}}
            className='absolute bottom-0 left-0 right-0 bg-card rounded-t-3xl p-6'>
    {children}
  </MotiView>
</Modal>
```

## Bottom sheets

Use `@gorhom/bottom-sheet` for anything with snap points or drag-to-dismiss.

## Hardware back button

Always handle: register `BackHandler.addEventListener('hardwareBackPress', ...)` to close on Android.

## Acceptance
- [ ] Toasts appear correctly on both platforms
- [ ] Dialogs trap focus and dismiss on backdrop
- [ ] Android back closes top-most modal

