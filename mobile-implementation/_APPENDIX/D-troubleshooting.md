# Appendix D — Troubleshooting

## Build fails: "Could not find a build script"
Run `eas build:configure`. Make sure `app.config.ts` exports a function or object.

## Reanimated: "Failed to create a worklet"
Babel plugin missing. Add `react-native-reanimated/plugin` as LAST in `babel.config.js` plugins.

## Nativewind classes have no effect
Ensure `import './global.css'` is at top of `App.tsx`. Restart Metro with `--clear`.

## Supabase: "TypeError: Network request failed"
RN doesn't trust self-signed certs. Check URL is HTTPS. Ensure `setAuthSession` not called before SecureStore loaded.

## Push notifications never arrive on iOS
- APNs key uploaded in EAS credentials?
- Built with `production` profile (development profile uses sandbox APNs)?
- Notification permission granted?
- Token saved to DB?

## Focus mode blocking doesn't work
- AccessibilityService enabled in system settings?
- Foreground service notification visible?
- `usesPermissionFlags` in AndroidManifest set to `neverForLocation` where needed?
- Check `adb logcat | grep FocusService`

## OTA update doesn't apply
- Runtime version matches between build and update?
- User restarted app (or `Updates.reloadAsync()` called)?
- Branch correct? `eas update:list --branch production`

## App rejected by Apple for "uses 3rd-party payment"
You must use IAP for digital subscriptions. Move Paystack flow behind Android-only flag.

## Crash: "Native module RNFocusMode is null"
Forgot to rebuild dev client after adding native code. Run `eas build --profile development`.

## TextInput keyboard covers input
Wrap screen in `KeyboardAvoidingView behavior={Platform.OS==='ios'?'padding':'height'}`. Or use `react-native-keyboard-controller`.

## FlashList warning "estimatedItemSize"
Always provide `estimatedItemSize` prop with average item height in pixels.

## Splash screen never hides
Call `SplashScreen.hideAsync()` after first frame ready (in root useEffect).

## Deep link doesn't open app
Check `scheme` in `app.config.ts` matches the URL. iOS needs `applinks:` for universal links; Android needs `intent-filter` with `autoVerify`.

## "Cannot read property 'X' of undefined" only on release builds
Hermes optimizations. Check that you're not destructuring from null. Test with `EXPO_PUBLIC_USE_HERMES=false` to confirm.

## Dark mode flicker on launch
Read theme from MMKV synchronously BEFORE first render (MMKV is sync; AsyncStorage isn't).

