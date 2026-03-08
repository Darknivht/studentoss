

# Fix PDF Formatting, Math Rendering, and Achievement Dropdown

## Problems Found

1. **PDF shows raw asterisks and bad formatting**: The `markdownToHtml()` function in `formatters.ts` uses fragile regex that fails on multi-line bold, nested formatting, and doesn't strip `**` properly in many cases. The bold regex `\*\*(.+?)\*\*` is non-greedy single-line only and runs after headers, causing conflicts.

2. **Math equations not rendered in PDFs**: The HTML doc includes KaTeX CSS but the `markdownToHtml()` never converts `$...$` or `$$...$$` to KaTeX HTML. The `katex` package is already installed and has a `renderToString()` API we can use directly.

3. **Achievement requirement_type is a free text Input**: Admin can type anything, but only 12 specific keys from `UserStats` are valid (`notes_count`, `quizzes_count`, `flashcards_reviewed`, `streak`, `focus_sessions`, `total_xp`, `groups_joined`, `messages_sent`, `challenges_sent`, `perfect_quizzes`, `study_minutes`, `subjects_with_notes`).

---

## Plan

### A. Fix `markdownToHtml()` in `src/lib/formatters.ts`

- Rewrite the conversion pipeline with correct ordering: code blocks first (escape them), then math, then tables, then headers, then bold/italic, then lists, then paragraphs
- Add math rendering: use `katex.renderToString()` for `$$...$$` (display) and `$...$` (inline) blocks before other processing
- Fix bold/italic regex to handle multi-line and nested cases properly
- Add blockquote support (`>` lines)
- Handle numbered lists properly (wrap in `<ol>` not just `<li>`)

### B. Achievement Requirement Type Dropdown in `src/pages/AdminResources.tsx`

- Replace the `<Input>` on line 606 with a `<Select>` dropdown
- Options: all 12 keys from UserStats with human-readable labels (e.g., `notes_count` → "Notes Count", `study_minutes` → "Study Minutes", `perfect_quizzes` → "Perfect Quizzes")

### C. Minor Improvements

- In the PDF `buildHtmlDoc` styles (`ExportUtils.tsx`), add `.katex-display` margin and `.katex` inline styling for better math presentation
- Ensure `downloadAsHTML` appends the wrapper to `document.body` temporarily so html2pdf can measure it (fixes blank PDFs on some browsers)

---

## Files Modified

| File | Change |
|------|--------|
| `src/lib/formatters.ts` | Rewrite `markdownToHtml` with KaTeX math rendering, fix bold/italic/list conversion |
| `src/components/export/ExportUtils.tsx` | Add KaTeX CSS styles to `buildHtmlDoc`, fix wrapper visibility for html2pdf |
| `src/pages/AdminResources.tsx` | Replace requirement_type Input with Select dropdown (12 options) |

