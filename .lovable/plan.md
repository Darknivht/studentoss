

# Fix Blank Exports, Red Math Errors, and Poor Equation Rendering

## Problems Identified

1. **Blank/broken PDF exports**: `html2pdf.js` renders from a temporary DOM element, but KaTeX CSS from the CDN `<link>` in `buildHtmlDoc` is never actually loaded into that element — html2pdf only sees unstyled KaTeX HTML, producing blank or garbled math.

2. **Red font color at end of math content**: The `.katex-error` CSS class uses `color: #c00` (red). When KaTeX fails to parse a LaTeX expression (often due to truncated AI output), it renders error spans in red.

3. **Truncated AI output**: The `ai-study` edge function sends no `max_tokens` parameter, so the model may use a low default and cut off mid-expression — causing both incomplete content and KaTeX parse failures.

4. **Basic equation symbols not rendering**: The AI sometimes outputs raw math symbols without wrapping them in `$...$` delimiters, so neither ReactMarkdown+rehypeKatex (in-app) nor `markdownToHtml` (export) can detect and render them.

## Plan

### 1. Increase `max_tokens` in `ai-study` edge function
**File:** `supabase/functions/ai-study/index.ts`
- Add `max_tokens: 8192` to the API request body alongside `stream: true`
- This prevents mid-expression truncation that causes red error text

### 2. Fix PDF export KaTeX rendering
**File:** `src/components/export/ExportUtils.tsx`
- Inject KaTeX CSS as an inline `<style>` tag into the wrapper element (fetched or bundled) so html2pdf can see it
- Simpler approach: import KaTeX CSS at module level and inject it as a `<style>` element into the wrapper before html2pdf runs

### 3. Fix `katex-error` styling
**File:** `src/components/export/ExportUtils.tsx` (in `buildHtmlDoc`)
**File:** `src/index.css`
- Change `.katex-error` from red (`#c00`) to a neutral dark color so failed expressions don't alarm users
- Add a monospace fallback so raw LaTeX is at least readable

### 4. Strengthen math prompt for proper LaTeX delimiters
**File:** `supabase/functions/ai-study/index.ts`
- Add explicit instruction to the `math_solver` system prompt: "Always wrap ALL mathematical expressions in LaTeX delimiters — use `$...$` for inline and `$$...$$` for display. Never output raw mathematical symbols without delimiters."

### 5. Make `markdownToHtml` more resilient to common math patterns
**File:** `src/lib/formatters.ts`
- Add a pre-processing step that detects common undelimited math patterns (e.g., `x^2`, `\frac`, `\sqrt`) and wraps them in `$...$` before KaTeX rendering

## Files to modify
- `supabase/functions/ai-study/index.ts` — add `max_tokens`, improve math prompt
- `src/components/export/ExportUtils.tsx` — inline KaTeX CSS for PDF, fix error color
- `src/lib/formatters.ts` — auto-wrap undelimited LaTeX
- `src/index.css` — fix `.katex-error` color

