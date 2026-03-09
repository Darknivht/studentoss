import { markdownToHtml } from '@/lib/formatters';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { toast } from 'sonner';

export type PdfMode = 'fast' | 'hq';

/**
 * Fetch and cache KaTeX CSS for inline injection into PDF exports.
 */
let katexCssCache: string | null = null;
async function getKatexCss(): Promise<string> {
  if (katexCssCache) return katexCssCache;

  const fallbackCss = `
    .katex { font-size: 1.1em; }
    .katex-display { text-align: center; margin: 12px 0; }
    .katex .base { display: inline-block; }
    .katex .strut { display: inline-block; }
    .katex .mord, .katex .mop, .katex .mbin, .katex .mrel, .katex .mopen, .katex .mclose, .katex .mpunct, .katex .minner { display: inline-block; }
    .katex .mfrac { display: inline-block; vertical-align: middle; }
    .katex .mfrac .frac-line { border-bottom: 1px solid; width: 100%; }
    .katex .msqrt { display: inline-block; }
    .katex .sqrt-sign { position: relative; }
  `;

  try {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 3000);

    const res = await fetch('https://cdn.jsdelivr.net/npm/katex@0.16.28/dist/katex.min.css', {
      signal: controller.signal,
      cache: 'force-cache',
    });

    window.clearTimeout(timeoutId);

    if (res.ok) {
      katexCssCache = await res.text();
      return katexCssCache;
    }
  } catch {
    // fall back quickly
  }

  katexCssCache = fallbackCss;
  return katexCssCache;
}

const BASE_STYLES = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Helvetica Neue', Arial, 'Segoe UI', sans-serif; font-size: 11pt; line-height: 1.6; color: #1a1a1a; }
  h1 { font-size: 18pt; margin: 16px 0 8px; border-bottom: 2px solid #333; padding-bottom: 4px; }
  h2 { font-size: 14pt; margin: 14px 0 6px; color: #333; }
  h3 { font-size: 12pt; margin: 10px 0 4px; color: #444; }
  p { margin: 6px 0; word-wrap: break-word; overflow-wrap: anywhere; }
  ul, ol { margin: 6px 0; padding-left: 20px; }
  li { margin: 3px 0; }
  strong { font-weight: 700; }
  code { background: #f4f4f4; padding: 1px 4px; border-radius: 3px; font-size: 10pt; }
  pre { background: #f4f4f4; padding: 12px; border-radius: 6px; overflow-x: auto; margin: 8px 0; }
  pre code { background: none; padding: 0; }
  .table-wrapper { overflow-x: auto; margin: 12px 0; }
  table { border-collapse: collapse; width: 100%; min-width: 400px; }
  th, td { border: 1px solid #ccc; padding: 8px 12px; text-align: left; font-size: 10pt; word-wrap: break-word; }
  th { background: #f0f0f0; font-weight: 600; }
  tr:nth-child(even) { background: #fafafa; }
  .katex-display { overflow-x: auto; max-width: 100%; margin: 12px 0; text-align: center; }
  .katex { font-size: 1.1em; }
  .katex-error, .katex-fallback { color: #333; font-family: 'Courier New', monospace; font-size: 10pt; background: #f4f4f4; padding: 1px 4px; border-radius: 3px; }
  blockquote { border-left: 3px solid #ccc; margin: 8px 0; padding: 4px 12px; color: #555; }
  hr { border: none; border-top: 1px solid #ddd; margin: 16px 0; }
  img { max-width: 100%; height: auto; }
  a { color: #1a73e8; text-decoration: underline; }
  [data-pdf-section] { page-break-inside: avoid; }
`;

const PRINT_STYLES = `
  @page { size: A4; margin: 15mm; }
  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    h1, h2, h3, h4 { page-break-after: avoid; }
    p, li, blockquote, pre, table, .katex-display { page-break-inside: avoid; }
    img { page-break-inside: avoid; max-width: 100%; }
  }
`;

function buildHtmlDoc(title: string, htmlContent: string, inlineKatexCss?: string, useLink = false): string {
  // Use CDN link for iframe/print so fonts load correctly; inline CSS for canvas mode
  const katexBlock = useLink
    ? `<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.28/dist/katex.min.css" crossorigin="anonymous">`
    : (inlineKatexCss ? `<style>${inlineKatexCss}</style>` : '');
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
${katexBlock}
<style>${BASE_STYLES}${PRINT_STYLES}</style>
</head>
<body>
<h1>${title}</h1>
${htmlContent}
</body>
</html>`;
}

/**
 * Fast PDF: uses browser's native print engine via a hidden iframe.
 * Instant, handles page breaks natively, no canvas overhead.
 */
async function generatePrintPDF(fullHtml: string): Promise<void> {
  const iframe = document.createElement('iframe');
  iframe.style.cssText = 'position:fixed;left:-9999px;top:0;width:794px;height:1123px;border:none;';
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument!;
  doc.open();
  doc.write(fullHtml);
  doc.close();

  await new Promise<void>((resolve) => {
    if (doc.readyState === 'complete') {
      resolve();
    } else {
      iframe.onload = () => resolve();
    }
  });

  // Wait for KaTeX fonts to load from CDN
  try {
    await iframe.contentDocument!.fonts.ready;
  } catch { /* ignore */ }
  // Extra buffer for complex equations
  await new Promise(r => setTimeout(r, 800));

  iframe.contentWindow!.focus();
  iframe.contentWindow!.print();

  setTimeout(() => {
    if (iframe.parentNode) document.body.removeChild(iframe);
  }, 2000);
}

/**
 * Wrap top-level HTML elements with data-pdf-section attributes
 */
function wrapSections(htmlContent: string): string {
  const temp = document.createElement('div');
  temp.innerHTML = htmlContent;

  const children = Array.from(temp.children);
  for (const child of children) {
    (child as HTMLElement).setAttribute('data-pdf-section', 'true');
  }

  const nodes = Array.from(temp.childNodes);
  const result = document.createElement('div');
  let currentGroup: HTMLElement | null = null;

  for (const node of nodes) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      if (currentGroup) {
        currentGroup.setAttribute('data-pdf-section', 'true');
        result.appendChild(currentGroup);
        currentGroup = null;
      }
      (node as HTMLElement).setAttribute('data-pdf-section', 'true');
      result.appendChild(node);
    } else if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) {
      if (!currentGroup) {
        currentGroup = document.createElement('div');
      }
      currentGroup.appendChild(node.cloneNode(true));
    }
  }
  if (currentGroup) {
    currentGroup.setAttribute('data-pdf-section', 'true');
    result.appendChild(currentGroup);
  }

  return result.innerHTML;
}

// A4 dimensions in mm
const A4_HEIGHT_MM = 297;
const MARGIN_MM = 15;
const A4_WIDTH_MM = 210;
const CONTENT_WIDTH_MM = A4_WIDTH_MM - (MARGIN_MM * 2);

/**
 * HQ PDF generation: single html2canvas capture then slice into A4 pages.
 */
async function generateCanvasPDF(container: HTMLElement, filename: string): Promise<void> {
  // Wait for any KaTeX fonts loaded via <link> tag
  try { await document.fonts.ready; } catch { /* ignore */ }
  await new Promise(r => setTimeout(r, 500));

  const canvas = await html2canvas(container, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
    logging: false,
    windowWidth: 794,
    allowTaint: false,
  });

  const imgWidth = canvas.width;
  const imgHeight = canvas.height;

  if (imgWidth === 0 || imgHeight === 0) throw new Error('Empty canvas');

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const scaleFactor = CONTENT_WIDTH_MM / imgWidth;
  const pageContentHeightPx = (A4_HEIGHT_MM - MARGIN_MM * 2) / scaleFactor;

  const totalPages = Math.ceil(imgHeight / pageContentHeightPx);

  for (let page = 0; page < totalPages; page++) {
    if (page > 0) pdf.addPage();

    const srcY = page * pageContentHeightPx;
    const srcH = Math.min(pageContentHeightPx, imgHeight - srcY);

    const sliceCanvas = document.createElement('canvas');
    sliceCanvas.width = imgWidth;
    sliceCanvas.height = srcH;
    const ctx = sliceCanvas.getContext('2d');
    if (!ctx) continue;

    ctx.drawImage(canvas, 0, srcY, imgWidth, srcH, 0, 0, imgWidth, srcH);
    const sliceHeightMM = srcH * scaleFactor;
    pdf.addImage(sliceCanvas.toDataURL('image/jpeg', 0.85), 'JPEG', MARGIN_MM, MARGIN_MM, CONTENT_WIDTH_MM, sliceHeightMM);
  }

  pdf.save(filename);
}

interface Flashcard {
  front: string;
  back: string;
}

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

export const generateFlashcardsPDF = (flashcards: Flashcard[], title: string): string => {
  const content = flashcards.map((card, i) => 
    `Card ${i + 1}\n─────────────────────\nQ: ${card.front}\nA: ${card.back}\n`
  ).join('\n');

  return `${title}\n${'═'.repeat(40)}\n\n${content}`;
};

export const generateQuizPDF = (questions: QuizQuestion[], title: string, score?: number): string => {
  const content = questions.map((q, i) => {
    const optionsList = q.options.map((opt, j) => 
      `  ${String.fromCharCode(65 + j)}. ${opt}${j === q.correctAnswer ? ' ✓' : ''}`
    ).join('\n');
    
    return `Question ${i + 1}\n${q.question}\n\n${optionsList}\n${q.explanation ? `\nExplanation: ${q.explanation}` : ''}\n`;
  }).join('\n─────────────────────\n\n');

  const scoreText = score !== undefined ? `\nScore: ${score}/${questions.length} (${Math.round((score / questions.length) * 100)}%)\n` : '';

  return `${title}${scoreText}\n${'═'.repeat(40)}\n\n${content}`;
};

export const downloadAsText = (content: string, filename: string) => {
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

function sanitizeFilename(title: string): string {
  return title
    .replace(/[^a-zA-Z0-9\s\-_]/g, '')
    .replace(/\s+/g, '_')
    .substring(0, 60) || 'document';
}

/**
 * Download as HTML file (reliable fallback)
 */
function downloadHtmlBlob(fullHtml: string, filename: string) {
  const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 200);
}

/**
 * Download markdown content as PDF.
 * mode='fast' (default): uses browser print dialog — instant.
 * mode='hq': uses canvas-based rendering — slower but pixel-perfect.
 */
export const downloadAsHTML = async (markdownContent: string, title: string, _filename?: string, mode: PdfMode = 'fast') => {
  const [htmlContent, katexCss] = await Promise.all([
    Promise.resolve(markdownToHtml(markdownContent)),
    getKatexCss(),
  ]);

  let baseName = _filename || sanitizeFilename(title);
  baseName = baseName.replace(/\.(html|pdf)$/i, '');

  if (mode === 'fast') {
    const fullHtml = buildHtmlDoc(title, htmlContent, katexCss);
    await generatePrintPDF(fullHtml);
    return;
  }

  // HQ mode: canvas-based
  const toastId = toast.loading('Generating HD PDF…', { description: 'Rendering content at high quality' });

  const sectionedHtml = wrapSections(`<h1 style="font-size:18pt;margin:0 0 8px;border-bottom:2px solid #333;padding-bottom:4px;">${title}</h1>${htmlContent}`);

  const container = document.createElement('div');
  container.style.cssText = 'position:absolute;left:-9999px;top:0;width:595px;padding:24px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:11pt;line-height:1.6;color:#1a1a1a;background:white;';
  container.innerHTML = `<style>${katexCss}${BASE_STYLES}</style>${sectionedHtml}`;
  document.body.appendChild(container);

  try {
    await document.fonts.ready;
    await new Promise(r => setTimeout(r, 200));

    await generateCanvasPDF(container, `${baseName}.pdf`);

    toast.success('HD PDF downloaded!', { id: toastId, description: `${baseName}.pdf`, duration: 3000 });
  } catch (err) {
    console.error('PDF generation failed, falling back to HTML:', err);
    const fullHtml = buildHtmlDoc(title, htmlContent, katexCss);
    downloadHtmlBlob(fullHtml, `${baseName}.html`);
    toast.warning('Downloaded as HTML instead', { id: toastId, description: 'PDF generation encountered an issue', duration: 3000 });
  } finally {
    document.body.removeChild(container);
  }
};

/**
 * Generate a PDF from raw HTML string (e.g. resume templates).
 * mode='fast': browser print dialog. mode='hq': canvas pipeline.
 */
export const downloadHtmlAsPdf = async (htmlString: string, filename: string, mode: PdfMode = 'fast') => {
  const pdfFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;

  if (mode === 'fast') {
    // Wrap in a full HTML doc with print styles
    const fullHtml = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>${pdfFilename}</title>
<style>${PRINT_STYLES}
body { margin: 0; padding: 0; }
</style></head>
<body>${htmlString}</body></html>`;
    await generatePrintPDF(fullHtml);
    return;
  }

  // HQ mode
  const toastId = toast.loading('Generating HD PDF…', { description: 'Rendering content at high quality' });

  const sectionedHtml = wrapSections(htmlString);

  const container = document.createElement('div');
  container.style.cssText = 'position:absolute;left:-9999px;top:0;width:595px;background:white;';
  container.innerHTML = sectionedHtml;
  document.body.appendChild(container);

  try {
    await document.fonts.ready;
    await new Promise(r => setTimeout(r, 200));

    await generateCanvasPDF(container, pdfFilename);

    toast.success('HD PDF downloaded!', { id: toastId, description: pdfFilename, duration: 3000 });
  } catch (err) {
    console.error('PDF generation failed:', err);
    const blob = new Blob([htmlString], { type: 'text/html;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename.replace('.pdf', '.html');
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(a.href); }, 200);
    toast.warning('Downloaded as HTML instead', { id: toastId, description: 'PDF generation encountered an issue', duration: 3000 });
  } finally {
    if (container.parentNode) document.body.removeChild(container);
  }
};

/**
 * Open a print dialog for markdown content.
 */
export const printMarkdownContent = async (markdownContent: string, title: string) => {
  const printWindow = window.open('', '_blank');

  if (!printWindow) {
    await downloadAsHTML(markdownContent, title);
    return;
  }

  printWindow.document.open();
  printWindow.document.write('<!doctype html><html><head><title>Preparing print…</title></head><body>Preparing print…</body></html>');
  printWindow.document.close();

  try {
    const [htmlContent, katexCss] = await Promise.all([
      Promise.resolve(markdownToHtml(markdownContent)),
      getKatexCss(),
    ]);
    const fullHtml = buildHtmlDoc(title, htmlContent, katexCss);

    printWindow.document.open();
    printWindow.document.write(fullHtml);
    printWindow.document.close();

    const triggerPrint = () => {
      printWindow.focus();
      printWindow.print();
    };

    if (printWindow.document.readyState === 'complete') {
      window.setTimeout(triggerPrint, 150);
    } else {
      printWindow.onload = () => window.setTimeout(triggerPrint, 150);
    }
  } catch (err) {
    console.error('Print preparation failed:', err);
    printWindow.close();
    await downloadAsHTML(markdownContent, title);
  }
};

export const shareContent = async (title: string, text: string): Promise<boolean> => {
  if (navigator.share) {
    try {
      await navigator.share({ title, text });
      return true;
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Share failed:', error);
      }
      return false;
    }
  }
  
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Clipboard failed:', error);
    return false;
  }
};

export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Clipboard failed:', error);
    return false;
  }
};
