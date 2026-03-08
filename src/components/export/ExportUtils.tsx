import { markdownToHtml } from '@/lib/formatters';

/**
 * Fetch and cache KaTeX CSS for inline injection into PDF exports.
 */
let katexCssCache: string | null = null;
async function getKatexCss(): Promise<string> {
  if (katexCssCache) return katexCssCache;

  const fallbackCss = `.katex { font-size: 1.1em; } .katex-display { text-align: center; margin: 12px 0; }`;

  try {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 1800);

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
    // fall back quickly when CDN is blocked/unreachable
  }

  katexCssCache = fallbackCss;
  return katexCssCache;
}

const BASE_STYLES = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11pt; line-height: 1.5; padding: 24px; max-width: 800px; margin: 0 auto; color: #1a1a1a; }
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
`;

function buildHtmlDoc(title: string, htmlContent: string, inlineKatexCss?: string): string {
  const katexStyle = inlineKatexCss ? `<style>${inlineKatexCss}</style>` : '';
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
${katexStyle}
<style>${BASE_STYLES}</style>
</head>
<body>
<h1>${title}</h1>
${htmlContent}
</body>
</html>`;
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
  // Delay cleanup for Safari
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 200);
}

/**
 * Resolve html2pdf regardless of default/named export shape.
 */
async function getHtml2Pdf() {
  const html2pdfModule = await import('html2pdf.js');
  return (html2pdfModule as { default?: unknown }).default ?? html2pdfModule;
}

/**
 * Download markdown content as a PDF file.
 * Falls back to HTML download if PDF generation fails.
 */
export const downloadAsHTML = async (markdownContent: string, title: string, _filename?: string) => {
  const [htmlContent, katexCss] = await Promise.all([
    Promise.resolve(markdownToHtml(markdownContent)),
    getKatexCss(),
  ]);
  const fullHtml = buildHtmlDoc(title, htmlContent, katexCss);

  let baseName = _filename || sanitizeFilename(title);
  baseName = baseName.replace(/\.(html|pdf)$/i, '');

  let wrapper: HTMLDivElement | null = null;

  try {
    const html2pdf = (await getHtml2Pdf()) as {
      (): {
        set: (opt: unknown) => { from: (el: HTMLElement) => { save: () => Promise<void> } }
      }
    };

    wrapper = document.createElement('div');
    wrapper.innerHTML = `<h1 style="font-size:18pt;margin:0 0 8px;border-bottom:2px solid #333;padding-bottom:4px;">${title}</h1>${htmlContent}`;
    wrapper.style.fontFamily = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    wrapper.style.fontSize = '11pt';
    wrapper.style.lineHeight = '1.5';
    wrapper.style.color = '#1a1a1a';
    wrapper.style.padding = '0';

    const styleEl = document.createElement('style');
    styleEl.textContent = katexCss + BASE_STYLES;
    wrapper.prepend(styleEl);

    wrapper.style.position = 'fixed';
    wrapper.style.left = '-9999px';
    wrapper.style.top = '0';
    wrapper.style.width = '800px';
    wrapper.style.background = 'white';
    document.body.appendChild(wrapper);

    await new Promise((resolve) => setTimeout(resolve, 100));

    const opt = {
      margin: [10, 10, 10, 10] as [number, number, number, number],
      filename: `${baseName}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, letterRendering: true, logging: false },
      jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const },
    };

    await Promise.race([
      html2pdf().set(opt).from(wrapper).save(),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('PDF export timed out')), 12000)),
    ]);
  } catch (err) {
    console.error('PDF generation failed, falling back to HTML download:', err);
    downloadHtmlBlob(fullHtml, `${baseName}.html`);
  } finally {
    if (wrapper?.parentNode) document.body.removeChild(wrapper);
  }
};

/**
 * Generate a PDF from raw HTML string (e.g. resume templates).
 */
export const downloadHtmlAsPdf = async (htmlString: string, filename: string) => {
  try {
    const html2pdf = (await getHtml2Pdf()) as {
      (): {
        set: (opt: unknown) => { from: (el: HTMLElement) => { save: () => Promise<void> } }
      }
    };

    const wrapper = document.createElement('div');
    wrapper.innerHTML = htmlString;
    wrapper.style.position = 'fixed';
    wrapper.style.left = '-9999px';
    wrapper.style.top = '0';
    wrapper.style.width = '800px';
    wrapper.style.background = 'white';
    document.body.appendChild(wrapper);

    await new Promise((r) => setTimeout(r, 100));

    const opt = {
      margin: [5, 5, 5, 5] as [number, number, number, number],
      filename: filename.endsWith('.pdf') ? filename : `${filename}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, letterRendering: true, logging: false },
      jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const },
    };

    await html2pdf().set(opt).from(wrapper).save();

    if (wrapper.parentNode) document.body.removeChild(wrapper);
  } catch (err) {
    console.error('PDF generation failed:', err);
    const blob = new Blob([htmlString], { type: 'text/html;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename.replace('.pdf', '.html');
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(a.href);
    }, 200);
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
