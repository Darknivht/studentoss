# 03 — Back Button Handling

Port of `src/hooks/useMobileBackNavigation.ts`. The web version intercepts Capacitor's back button and prevents accidental app exit.

## RN version

```ts
// src/hooks/useMobileBackNavigation.ts
import { useEffect } from 'react';
import { BackHandler, ToastAndroid, Platform } from 'react-native';
import { useNavigation, useNavigationState } from '@react-navigation/native';

let lastBackPress = 0;

export function useMobileBackNavigation() {
  const nav = useNavigation();
  const isAtRoot = useNavigationState((s) => s.index === 0);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (nav.canGoBack()) {
        nav.goBack();
        return true;
      }
      // double-tap to exit at root
      const now = Date.now();
      if (now - lastBackPress < 2000) return false; // OS exits
      lastBackPress = now;
      if (Platform.OS === 'android') {
        ToastAndroid.show('Tap back again to exit', ToastAndroid.SHORT);
      }
      return true;
    });
    return () => sub.remove();
  }, [nav, isAtRoot]);
}
```

Mount once near the navigator root. Per-screen overrides can use the `useFocusEffect` + `BackHandler` pattern.

## Per-screen back interception

For screens like AI Tutor with unsaved drafts:

```ts
useFocusEffect(useCallback(() => {
  const sub = BackHandler.addEventListener('hardwareBackPress', () => {
    if (hasUnsavedChanges) {
      showConfirmDialog();
      return true;
    }
    return false;
  });
  return () => sub.remove();
}, [hasUnsavedChanges]));
```

## iOS

iOS has no hardware back. The React Navigation header back button + edge swipe handles everything. No extra code needed.

## Acceptance

- [ ] Android back goes back through stack history
- [ ] Double-tap back at root exits with toast on first tap
- [ ] Edge swipe back works on iOS
