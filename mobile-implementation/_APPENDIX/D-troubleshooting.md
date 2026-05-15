# D — Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Reanimated babel error | plugin not last in `babel.config.js` | move `react-native-reanimated/plugin` to end |
| Nativewind classes not applied | `metro.config.js` not wrapped or `global.css` not imported | re-check both |
| Supabase auth not persisting | wrong storage adapter | verify `AsyncStorage` passed to createClient |
| OAuth opens browser but never returns | scheme mismatch | check `app.config.ts` `scheme` and Linking redirect |
| Push notification token undefined | permission not granted | call `Notifications.requestPermissionsAsync()` first |
| Focus mode permission dialog never appears | not using dev client | rebuild with `eas build --profile development` (Expo Go can't load custom plugins) |
| App crashes on Android cold start | largeHeap missing | set `largeHeap: true` in `app.config.ts` android section |
| KaTeX symbols missing | font not loaded in math-view | `react-native-math-view` bundles MathJax fonts; rebuild dev client |
| White flash on launch | splash misconfigured | set `SplashScreen.preventAutoHideAsync()` in App.tsx until fonts loaded |
| Hardware back exits app | back handler not registered or canGoBack=false | mount `useMobileBackNavigation` near root |
| Realtime channel doesn't fire | RLS blocks SELECT | check policies; channel needs SELECT permission to receive |
| EAS build fails: "missing google-services.json" | not needed unless using FCM directly; using Expo push | remove FCM config or add file |
| Slow FlatList | not using `keyExtractor` or fixed `getItemLayout` | provide both for long lists |
