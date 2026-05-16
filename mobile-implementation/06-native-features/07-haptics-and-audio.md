# haptics-and-audio — Haptics & Audio Feedback

## Haptics

`expo-haptics`:
- `selectionAsync()` — tab change, toggle
- `impactAsync(Light)` — button press
- `impactAsync(Medium)` — card press / important confirm
- `impactAsync(Heavy)` — destructive confirm
- `notificationAsync(Success | Warning | Error)` — quiz result, save, error

Wrap in a helper to no-op when user disables haptics in Settings.

## Audio cues

`expo-av` Sound:
- `correct.mp3` (quiz correct answer)
- `wrong.mp3` (quiz wrong)
- `pomodoro-ding.mp3`
- `level-up.mp3`
- `achievement-unlock.mp3`

Preload in app start:
```ts
const sounds = await Promise.all([Audio.Sound.createAsync(require('./assets/sfx/correct.mp3')), ...]);
```

Respect device silent mode UNLESS user explicitly enabled 'always-on sound'.

## Acceptance
- [ ] Haptic on every interactive surface
- [ ] Sounds preload and play with < 50ms latency
- [ ] User can disable both globally

