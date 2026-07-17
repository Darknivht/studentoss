# 11 — Native modules (Expo config plugins)

Android-only native modules. iOS is out of scope for parity with web (which is Android-Capacitor).

| Module | Purpose | Package / plugin | Android API |
|---|---|---|---|
| AppBlocker | Block distracting apps during Focus | Custom Expo module `expo-app-blocker` | AccessibilityService + overlay |
| UsageStats | Read foreground app time | Custom `expo-usage-stats` | UsageStatsManager |
| Notifications | Push + local | `expo-notifications` | FCM |
| SecureStore | Auth tokens | `expo-secure-store` | EncryptedSharedPreferences |
| Camera/OCR | Scan notes | `expo-camera` + `expo-image-manipulator` + edge OCR | Camera2 |
| Speech | Voice Mode STT/TTS | `expo-speech` + `@react-native-voice/voice` | RecognizerIntent |
| Haptics | Feedback | `expo-haptics` | Vibrator |
| Sharing/FS | PDF export | `expo-file-system` + `expo-sharing` | Storage Access Framework |

Full specs live in `../06-native-features/`. This file is the top-level index; per-module implementation details stay in the numbered files there.

## Build order (in `/mobile`)
1. expo-notifications + expo-secure-store (Phase 2, foundation)
2. expo-camera + expo-file-system (Phase 5, notes screens)
3. expo-speech (Phase 6, AI Tutor voice)
4. Custom expo-usage-stats (Phase 7, Focus mode)
5. Custom expo-app-blocker (Phase 7, Focus mode)
