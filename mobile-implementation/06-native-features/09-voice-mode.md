# 09-voice-mode — Voice Mode

Speech-to-text: @react-native-voice/voice (free) or whisper via edge fn. Text-to-speech: expo-speech with rate/pitch from settings. Loop: STT → AI tutor → TTS. Auto-detect end-of-speech with silence timer.

## Permissions to declare (app.config.ts)

See the relevant Android permissions in 00-foundation/02-project-init.md.

## Fallback

Always check `Platform.OS` and feature-detect. If unavailable, hide the UI or show a graceful "Available on Android" message. Never crash.

## Acceptance
- [ ] Permission flow runs first time
- [ ] Feature works on real device (not just emulator where applicable)
- [ ] Denial path is graceful
