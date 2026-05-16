# 07 — AITutor

> **Web source of truth:** `src/pages/AITutor.tsx`
> **RN target:** `src/screens/AITutorScreen.tsx`
> **Route name:** `AITutor (params: { noteId? })`
> **Auth:** Required
> **Bottom nav visible:** No (chat full-screen)

---

## 1. Purpose

Conversational AI tutor. Uses note context if provided. Streams responses. Supports voice input & TTS playback.

## 2. Data dependencies

Open the web file and copy **every hook call** into the RN screen unchanged. The data layer does not change.

- `supabase.functions.invoke('ai-study', { body: { mode:'tutor', messages, noteId } })`
- `useSubscription()` for daily quota (5/30/100)
- `useNoteContext(noteId)` if noteId param exists

## 3. Layout (top → bottom)

1. Header: 'AI Tutor' + note pill (if context) + menu (clear chat / export)
2. Messages list (inverted FlatList — newest at bottom)
3. Typing indicator (3 dots Moti)
4. Input bar (sticky bottom): mic button | text input | send button
5. Quick prompts horizontal scroll above input ('Explain', 'Quiz me', 'Simplify')

## 4. Component tree mapping

| Web element | RN replacement | Notes |
|---|---|---|
| messages | `FlatList inverted` | `keyboardShouldPersistTaps='handled'` |
| message bubble | custom; user=primary bg, ai=card bg | render markdown + LaTeX via `react-native-marked` + `react-native-mathjax` |
| input | `<TextInput multiline maxHeight={120}>` | auto-grows |
| mic | hold-to-record (expo-av) | sends to STT |

## 5. Animations

- New message slide-up + fade
- Typing dots loop
- Send button fly-up arc on tap
- Voice waveform during recording (Reanimated bars)

## 6. Interactions & navigation

- Long-press message → copy / regenerate / read aloud (TTS)
- Mic: hold to talk → on release, transcribe → send
- Pull-down on header → clear chat (with confirm)

## 7. Edge cases (MUST handle)

- Quota hit mid-stream → cut response, show FeatureGateDialog
- Network drop mid-stream → mark message 'incomplete' with retry button
- Empty message → disable send
- Very long context (>8192 tokens) → trim oldest user messages, warn

## 8. Native enhancements (mobile-only wins)

- `expo-speech` for TTS
- `expo-speech-recognition` for STT
- `react-native-keyboard-controller` for smooth keyboard handling
- Hardware back button = exit chat with autosave

## 9. Performance

- Wrap large lists in `FlashList` (Shopify) instead of `FlatList` when item count > 50.
- Memoize cards with `React.memo` and stable keys.
- Hoist `renderItem` out of render; never inline arrow inside `FlatList`.
- Use `removeClippedSubviews` on long scroll views.
- Defer offscreen image loads with `expo-image` `priority="low"`.

## 10. Acceptance checklist

- [ ] Streaming works
- [ ] LaTeX renders correctly (e.g. `$$\frac{a}{b}$$`)
- [ ] Voice in & out work
- [ ] Quota enforced

## 11. Implementation order (for the agent)

1. Create the screen file with hooks copied verbatim from the web page.
2. Render a bare `<View>` with a `<Text>` of the title — verify route works.
3. Port the header / hero section.
4. Port each section top-to-bottom, one commit per section.
5. Wire animations LAST (only after layout is correct).
6. Test offline, slow 3G, and dark mode before marking done.

