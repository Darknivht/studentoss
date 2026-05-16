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

