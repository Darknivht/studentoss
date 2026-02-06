import { markdownToHtml, stripMarkdown } from '@/lib/formatters';

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
 * Download markdown content as a formatted HTML file (renders tables properly)
 */
export const downloadAsHTML = (markdownContent: string, title: string, filename: string) => {
  const htmlContent = markdownToHtml(markdownContent);
  const fullHtml = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11pt; line-height: 1.5; padding: 24px; max-width: 800px; margin: 0 auto; color: #1a1a1a; }
  h1 { font-size: 18pt; margin: 16px 0 8px; border-bottom: 2px solid #333; padding-bottom: 4px; }
  h2 { font-size: 14pt; margin: 14px 0 6px; color: #333; }
  h3 { font-size: 12pt; margin: 10px 0 4px; color: #444; }
  p { margin: 6px 0; }
  ul, ol { margin: 6px 0; padding-left: 20px; }
  li { margin: 3px 0; }
  strong { font-weight: 700; }
  code { background: #f4f4f4; padding: 1px 4px; border-radius: 3px; font-size: 10pt; }
  pre { background: #f4f4f4; padding: 12px; border-radius: 6px; overflow-x: auto; margin: 8px 0; }
  pre code { background: none; padding: 0; }
  .table-wrapper { overflow-x: auto; margin: 12px 0; }
  table { border-collapse: collapse; width: 100%; min-width: 400px; }
  th, td { border: 1px solid #ccc; padding: 8px 12px; text-align: left; font-size: 10pt; }
  th { background: #f0f0f0; font-weight: 600; white-space: nowrap; }
  td { word-wrap: break-word; }
  tr:nth-child(even) { background: #fafafa; }
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
</body>
</html>`;

  const blob = new Blob([fullHtml], { type: 'text/html' });
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
 * Print markdown content with proper table formatting
 */
export const printMarkdownContent = (markdownContent: string, title: string) => {
  const htmlContent = markdownToHtml(markdownContent);
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;
  
  printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>${title}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 10pt; padding: 20px; line-height: 1.4; color: #000; }
  h1 { font-size: 16pt; margin-bottom: 10px; border-bottom: 2px solid #000; padding-bottom: 4px; }
  h2 { font-size: 13pt; margin: 12px 0 6px; }
  h3 { font-size: 11pt; margin: 8px 0 4px; }
  p { margin: 4px 0; }
  ul, ol { margin: 4px 0; padding-left: 18px; }
  li { margin: 2px 0; }
  .table-wrapper { overflow: visible; margin: 8px 0; }
  table { border-collapse: collapse; width: 100%; }
  th, td { border: 1px solid #333; padding: 6px 10px; text-align: left; font-size: 9pt; }
  th { background: #e8e8e8; font-weight: 600; }
  tr:nth-child(even) { background: #f5f5f5; }
  code { background: #eee; padding: 1px 3px; border-radius: 2px; font-size: 9pt; }
  pre { background: #f4f4f4; padding: 8px; border-radius: 4px; font-size: 9pt; overflow-x: auto; }
  @media print {
    body { padding: 0; }
    table { page-break-inside: auto; }
    tr { page-break-inside: avoid; }
  }
</style>
</head>
<body>
<h1>${title}</h1>
${htmlContent}
</body>
</html>`);
  printWindow.document.close();
  printWindow.print();
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
