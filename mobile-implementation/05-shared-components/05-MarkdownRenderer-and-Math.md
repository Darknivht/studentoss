# MarkdownRenderer-and-Math — MarkdownRenderer + LaTeX/Math

> **Web source:** various places using ReactMarkdown + KaTeX
> **RN target:** `src/components/MarkdownRenderer.tsx`

## Stack

- **Markdown:** `react-native-marked` (preferred — themable + fast) OR `react-native-markdown-display`
- **Math:** `react-native-math-view` (uses MathJax/KaTeX bridge) OR WebView-based fallback

## API

```ts
<MarkdownRenderer content={text} theme='dark' />
```

## Preprocessing

Must mirror web preprocessing (see memory `formatting-and-math-specs`):

1. Convert inline `\(...\)` and `\[...\]` to `$...$` and `$$...$$`
2. Trim hidden chars: `\u200b`, `\ufeff`
3. Escape lone `$` not in math context
4. Fix common AI mistakes: `frac{a}{b}` (missing backslash) → `\frac{a}{b}` when inside math delimiters

```ts
function preprocessMath(s: string): string {
  return s
    .replace(/\\\((.+?)\\\)/g, '$$$1$$')
    .replace(/\\\[(.+?)\\\]/gs, '$$$$$$1$$$$$$')
    .replace(/[\u200b\ufeff]/g, '');
}
```

## Rendering math

Split content by `$$...$$` and `$...$` boundaries; render text via marked, math via `<MathView />`.
Block math is centered, full-width; inline math sits in line with text (`baseline` alignment).

## Code blocks

Use `react-native-syntax-highlighter` with Prism. Allow horizontal scroll. Copy button via long-press.

## Performance

For long messages, memoize render. For very long (>10k chars), virtualize paragraphs with FlashList.

## Acceptance
- [ ] All web math examples render identically
- [ ] Code blocks scroll horizontally
- [ ] No jank on long messages

<!-- STYLES_APPENDIX -->

## Styles & className mapping (NativeWind v4)

These are the **exact Tailwind class strings** used by the web counterpart(s). NativeWind v4 understands the same grammar — copy them straight into your RN component's `className=` and only swap the web-only utilities listed in `_APPENDIX/C-css-to-style-map.md` (e.g. `hover:*`, `backdrop-blur-*`, `transition-*` for non-Reanimated transitions).


### From `src/components/notes/NoteViewerDialog.tsx`

```text
space-y-4
text-sm font-semibold mb-3 flex items-center gap-2
w-4 h-4 text-primary
space-y-2
flex items-center gap-3
w-5 h-5 animate-spin
w-5 h-5
font-medium text-sm
text-xs opacity-70
text-sm font-semibold mb-3
flex gap-2 flex-wrap
flex-1 min-w-[100px]
w-4 h-4 mr-1
p-3 rounded-lg bg-amber-500/10 border border-amber-500/20
text-xs text-amber-600 dark:text-amber-400
max-w-5xl max-h-[90vh] overflow-hidden p-0
p-4 pb-0
flex items-center justify-between gap-2 pr-8
flex items-center gap-2 truncate text-base
w-5 h-5 text-primary flex-shrink-0
truncate
flex items-center gap-2 flex-shrink-0
w-[140px] h-8 text-xs
flex items-center gap-2
gap-1.5
w-4 h-4
h-[70vh] rounded-t-2xl
pb-4
w-5 h-5 text-primary
h-[calc(70vh-80px)]
pr-4
mb-4
text-sm font-medium mb-2 block
w-full
p-4 pt-2 overflow-hidden
grid grid-cols-1 lg:grid-cols-[1fr,260px] gap-4 overflow-hidden
space-y-3 overflow-hidden
flex items-center justify-between p-2.5 rounded-lg bg-muted gap-2 flex-wrap
flex items-center gap-2 min-w-0
w-4 h-4 text-muted-foreground flex-shrink-0
text-sm font-medium truncate
flex items-center gap-2 flex-wrap
h-7 text-xs px-2
w-3.5 h-3.5 mr-1 animate-spin
w-3.5 h-3.5 mr-1
overflow-x-auto -mx-1 px-1
flex items-center gap-1.5 text-xs px-3 whitespace-nowrap
w-3.5 h-3.5
hidden xs:inline
xs:hidden
mt-3
max-h-[40vh] md:max-h-[45vh]
h-[40vh] md:h-[45vh] rounded-lg border border-border p-3
prose prose-sm dark:prose-invert max-w-none
whitespace-pre-wrap font-sans text-sm text-foreground
text-muted-foreground text-center py-8
flex flex-col items-center justify-center py-12 text-center
w-12 h-12 text-muted-foreground/30 mb-4
font-semibold text-lg mb-2
text-muted-foreground text-sm mb-6 max-w-xs
```

### Conversion checklist

- Keep colour utilities (`bg-primary`, `text-foreground`, `border-border/50`) — defined in `01-design-system/01-colors-tokens.md`.
- Keep spacing, sizing, radius, flex, grid (when supported by NativeWind).
- Replace `hover:*` → use `Pressable`'s `pressed` state or Reanimated.
- Replace `backdrop-blur-*` → `expo-blur` `<BlurView>`.
- Replace `transition-*` / `animate-*` → Moti / Reanimated.
- Replace `cursor-*`, `select-*`, `pointer-events-*` → not needed on RN.
- Replace `grid grid-cols-N gap-X` → `<View className="flex-row flex-wrap gap-X">` or `FlashList numColumns={N}`.
