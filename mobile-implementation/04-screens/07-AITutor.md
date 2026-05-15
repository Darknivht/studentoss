# 07 — AI Tutor (Full-screen chat)

**Web reference:** `src/pages/AITutor.tsx`, components in `src/components/study/*`

This is **the** flagship feature. Pixel parity is critical.

## Layout

```
┌─────────────────────────────┐
│ ←  AI Tutor    🎙 ⚙        │  header
├─────────────────────────────┤
│                             │
│   chat bubbles (FlatList,   │
│   inverted)                 │
│                             │
├─────────────────────────────┤
│ context chip(s)             │  e.g. "Note: Photosynthesis"
├─────────────────────────────┤
│ [+] Type a message...   ➤  │  input bar
└─────────────────────────────┘
```

## Bubbles

- User: right-aligned, `bg-primary text-primary-foreground rounded-3xl rounded-br-md p-3 max-w-[80%]`
- AI: left-aligned, `bg-muted text-foreground rounded-3xl rounded-bl-md p-3 max-w-[85%]`
- Markdown content via `react-native-markdown-display`
- Math: rule that detects `$$ ... $$` and renders via `react-native-math-view`
- Code: `<View className="bg-foreground/5 p-2 rounded-xl">` with monospace
- Each AI bubble has a footer with tap-to-copy + 👍 / 👎

## Input bar

- `+` button opens action sheet: attach note context / take photo / record voice
- Multi-line auto-grow input (max 6 lines)
- Send button has gradient when input non-empty
- Shows typing indicator while waiting

## Streaming

The `ai-study` edge function streams tokens. Use `EventSource` polyfill or a simple `fetch` with `ReadableStream` reader (RN supports it on Hermes).

```ts
const res = await fetch(`${SUPABASE_URL}/functions/v1/ai-study`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${jwt}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ mode: 'chat', messages, noteContext }),
});
const reader = res.body!.getReader();
const dec = new TextDecoder();
while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  const chunk = dec.decode(value);
  // parse SSE / JSON chunks → append to last AI message
}
```

## Persona-aware prompts

`useAuth().profile.study_persona` is passed to the edge function (same as web).

## Voice mode entry

Mic icon in header opens `VoiceMode` modal. See [`06-native-features/09-voice-mode.md`](../06-native-features/09-voice-mode.md).

## Quotas

`useSubscription` provides `aiCallsRemaining`. Show count above input bar in red when ≤ 1. Hard-block on 0 → open Upgrade modal.

## LaTeX delimiters

Pre-process AI text: collapse `\\(`, `\\[`, `\(` to `$`/`$$` consistent with web `parseAIResponse.ts`. The lib already does this — call it.

## Acceptance

- [ ] Streaming text appears character-by-character
- [ ] LaTeX renders correctly (no distortion like in PDF export issue)
- [ ] Code blocks have horizontal scroll
- [ ] Quota gate shows Upgrade modal when exceeded
