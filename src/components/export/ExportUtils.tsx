import { markdownToHtml, stripMarkdown } from '@/lib/formatters';

const KATEX_CSS_CDN = 'https://cdn.jsdelivr.net/npm/katex@0.16.28/dist/katex.min.css';
const KATEX_JS_CDN = 'https://cdn.jsdelivr.net/npm/katex@0.16.28/dist/katex.min.js';
const KATEX_AUTO_CDN = 'https://cdn.jsdelivr.net/npm/katex@0.16.28/dist/contrib/auto-render.min.js';

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
  .katex-display { overflow-x: auto; max-width: 100%; }
  @media print {
    body { padding: 0; font-size: 9pt; }
    table { page-break-inside: auto; }
    tr { page-break-inside: avoid; }
    h1, h2, h3 { page-break-after: avoid; }
  }
  @media (max-width: 600px) {
    body { padding: 12px; font-size: 10pt; }
    th, td { padding: 4px 6px; font-size: 9pt; }
  }
</style>
</head>
<body>
<h1>${title}</h1>
${htmlContent}
<script src="${KATEX_JS_CDN}"><\/script>
<script src="${KATEX_AUTO_CDN}"><\/script>
<script>
document.addEventListener("DOMContentLoaded", function() {
  renderMathInElement(document.body, {
    delimiters: [
      {left: "$$", right: "$$", display: true},
      {left: "$", right: "$", display: false},
      {left: "\\\\(", right: "\\\\)", display: false},
      {left: "\\\\[", right: "\\\\]", display: true}
    ],
    throwOnError: false
  });
});
<\/script>
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
 * Download markdown content as a styled HTML file (works reliably on all mobile browsers).
 * This directly downloads the file instead of using window.print() which produces
 * screen-like output on many mobile browsers.
 */
export const downloadAsHTML = (markdownContent: string, title: string, _filename?: string) => {
  const htmlContent = markdownToHtml(markdownContent);
  const fullHtml = buildHtmlDoc(title, htmlContent);

  // Determine filename - strip any existing extension and use .html
  let baseName = _filename || sanitizeFilename(title);
  baseName = baseName.replace(/\.(html|pdf)$/i, '');

  const blob = new Blob([fullHtml], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${baseName}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
};

/**
 * One-click download of markdown content as a styled HTML document.
 * Direct file download - no print dialog, works on all devices including mobile.
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
