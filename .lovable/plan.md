

# Plan: Dual-Mode PDF Export (Fast + High-Quality)

## Problem
The current `html2canvas`-based PDF generation is too slow. Users wait 10+ minutes for large documents.

## Solution
Offer two export modes:
1. **Fast PDF** (default) — Uses the browser's native print-to-PDF via an iframe + `window.print()`. Instant, no canvas rendering. Outputs via the browser's "Save as PDF" print dialog.
2. **High-Quality PDF** — Uses the existing `html2canvas` + `jsPDF` pipeline with optimizations (scale 1.5, JPEG compression). For users who want pixel-perfect output.

## Architecture

```text
User clicks Download
    ├── Fast PDF (default)
    │     → Build HTML string with inline styles + KaTeX CSS
    │     → Open hidden iframe, write HTML
    │     → iframe.contentWindow.print()  (browser print dialog → Save as PDF)
    │     → Remove iframe
    │     └── ~instant, 0-2 seconds
    │
    └── High-Quality PDF (optional)
          → Current html2canvas + jsPDF pipeline
          → Single-capture, slice into pages
          └── ~5-15 seconds depending on content
```

## Changes

### 1. `src/components/export/ExportUtils.tsx`
- Add `generatePrintPDF(htmlDoc: string, title: string)` — creates a hidden iframe, writes the full HTML document (with `@media print` styles and `@page` rules for A4), calls `print()`, then removes iframe
- Update `downloadAsHTML` to accept an optional `mode: 'fast' | 'hq'` parameter (default `'fast'`)
  - `'fast'` → calls `generatePrintPDF`
  - `'hq'` → calls existing `generateFastPDF` (the canvas pipeline)
- Same for `downloadHtmlAsPdf`
- Add print-specific CSS: `@page { size: A4; margin: 15mm; }`, page-break rules

### 2. Caller components (AIToolLayout, ResumeBuilder, academic tools, etc.)
- Replace single Download button with a small dropdown or two buttons:
  - **Download PDF** (fast, default) — triggers print dialog
  - **HD PDF** — triggers canvas-based generation with loading toast
- Minimal UI change: use a DropdownMenu on the existing Download button

### 3. Components to update
- `src/components/ai-tools/AIToolLayout.tsx` — Download button gets dropdown
- `src/components/career/ResumeBuilder.tsx` — PDF export button gets dropdown
- `src/components/academic/ResearchAssistant.tsx`, `PlagiarismChecker.tsx`, `EssayGrader.tsx`, `BibliographyBuilder.tsx`, `ThesisGenerator.tsx` — same pattern
- `src/components/study/CheatSheetCreator.tsx` — same

## Technical Details

**Fast PDF (print-based)**:
```typescript
async function generatePrintPDF(fullHtml: string): Promise<void> {
  const iframe = document.createElement('iframe');
  iframe.style.cssText = 'position:fixed;left:-9999px;width:0;height:0;border:none;';
  document.body.appendChild(iframe);
  const doc = iframe.contentDocument!;
  doc.open();
  doc.write(fullHtml); // includes @page CSS, KaTeX styles, inline styles
  doc.close();
  await new Promise(r => iframe.contentWindow!.onload = r);
  await document.fonts.ready;
  iframe.contentWindow!.print();
  setTimeout(() => document.body.removeChild(iframe), 1000);
}
```

The `@page` and `@media print` CSS handles pagination natively — no canvas, no slicing, no text cutting. The browser's print engine handles page breaks correctly with `page-break-inside: avoid` on sections.

**High-Quality PDF**: Keep existing `generateFastPDF` as-is (canvas approach) but rename for clarity.

