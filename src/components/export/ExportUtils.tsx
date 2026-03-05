import { markdownToHtml, stripMarkdown } from '@/lib/formatters';
import html2pdf from 'html2pdf.js';

const KATEX_CSS_CDN = 'https://cdn.jsdelivr.net/npm/katex@0.16.28/dist/katex.min.css';

function buildHtmlDoc(title: string, htmlContent: string): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<link rel="stylesheet" href="${KATEX_CSS_CDN}">
<style>
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
  td { word-wrap: break-word; }
  tr:nth-child(even) { background: #fafafa; }
  .katex-display { overflow-x: auto; max-width: 100%; margin: 12px 0; text-align: center; }
  .katex { font-size: 1.1em; }
  .katex-error { color: #c00; font-family: monospace; font-size: 10pt; }
  blockquote { border-left: 3px solid #ccc; margin: 8px 0; padding: 4px 12px; color: #555; }
  hr { border: none; border-top: 1px solid #ddd; margin: 16px 0; }
  img { max-width: 100%; height: auto; }
  a { color: #1a73e8; text-decoration: underline; }
</style>
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

/**
 * Sanitize a title for use as a filename.
 */
function sanitizeFilename(title: string): string {
  return title
    .replace(/[^a-zA-Z0-9\s\-_]/g, '')
    .replace(/\s+/g, '_')
    .substring(0, 60) || 'document';
}

/**
 * Download markdown content as a real PDF file using html2pdf.js.
 * Works reliably on all browsers including mobile.
 */
export const downloadAsHTML = async (markdownContent: string, title: string, _filename?: string) => {
  const htmlContent = markdownToHtml(markdownContent);
  const fullHtml = buildHtmlDoc(title, htmlContent);

  let baseName = _filename || sanitizeFilename(title);
  baseName = baseName.replace(/\.(html|pdf)$/i, '');

  // Create a temporary container to render the HTML
  const container = document.createElement('div');
  container.innerHTML = fullHtml;
  // Extract just the body content for html2pdf
  const bodyContent = container.querySelector('body');
  const wrapper = document.createElement('div');
  wrapper.innerHTML = bodyContent ? bodyContent.innerHTML : htmlContent;
  wrapper.style.fontFamily = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  wrapper.style.fontSize = '11pt';
  wrapper.style.lineHeight = '1.5';
  wrapper.style.color = '#1a1a1a';
  wrapper.style.padding = '0';

  // Append to DOM temporarily so html2pdf can measure dimensions
  wrapper.style.position = 'absolute';
  wrapper.style.left = '-9999px';
  wrapper.style.top = '0';
  document.body.appendChild(wrapper);

  const opt = {
    margin: [10, 10, 10, 10] as [number, number, number, number],
    filename: `${baseName}.pdf`,
    image: { type: 'jpeg' as const, quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, letterRendering: true },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const },
  };

  try {
    await html2pdf().set(opt).from(wrapper).save();
  } catch (err) {
    console.error('PDF generation failed, falling back to HTML download:', err);
    const blob = new Blob([fullHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${baseName}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  } finally {
    // Clean up the temporary wrapper
    if (wrapper.parentNode) {
      document.body.removeChild(wrapper);
    }
  }
};

/**
 * Generate a PDF from raw HTML string (e.g. resume templates).
 */
export const downloadHtmlAsPdf = async (htmlString: string, filename: string) => {
  const wrapper = document.createElement('div');
  wrapper.innerHTML = htmlString;

  const opt = {
    margin: [5, 5, 5, 5] as [number, number, number, number],
    filename: filename.endsWith('.pdf') ? filename : `${filename}.pdf`,
    image: { type: 'jpeg' as const, quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, letterRendering: true },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const },
  };

  try {
    await html2pdf().set(opt).from(wrapper).save();
  } catch (err) {
    console.error('PDF generation failed:', err);
    // Fallback
    const blob = new Blob([htmlString], { type: 'text/html' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename.replace('.pdf', '.html');
    a.click();
    URL.revokeObjectURL(a.href);
  }
};

/**
 * One-click download of markdown content as PDF.
 */
export const printMarkdownContent = (markdownContent: string, title: string) => {
  downloadAsHTML(markdownContent, title);
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
  
  // Fallback to clipboard
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
