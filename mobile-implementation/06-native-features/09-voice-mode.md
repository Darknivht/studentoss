# voice-mode — Voice Mode (STT + TTS)

## Use case
Hands-free study: speak to AI tutor, hear responses read aloud, adjustable speed.

## TTS (Text to Speech)
`expo-speech`:
```ts
Speech.speak(text, { language: 'en-US', pitch: 1.0, rate: 1.0, voice: voiceId });
```
Allow user to pick voice (`Speech.getAvailableVoicesAsync()`) and rate (0.5×–2×).

## STT (Speech to Text)
Options:
- **`@react-native-voice/voice`** — uses native iOS Speech / Android SpeechRecognizer. Free, offline-capable on iOS.
- **`expo-speech-recognition`** (community) — Expo-friendly.
- **Cloud:** Whisper via edge function. Higher quality but slower + costs.

Preferred: native first, fallback to Whisper for long recordings.

## UI
- Big mic button: tap to start, tap again to stop. Or hold-to-talk.
- Live transcript above the button (Reanimated typewriter effect).
- Cancel button.
- Highlighter on words as TTS speaks (use `onBoundary` callback).

## Settings
- Voice picker
- Rate slider
- 'Auto-read AI responses' toggle
- Language

## Acceptance
- [ ] STT transcribes English clearly
- [ ] TTS reads with selected voice/rate
- [ ] Word-by-word highlight syncs with TTS
- [ ] Hands-free flow: speak → AI replies → TTS → ready for next

