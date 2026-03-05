/**
 * Universal text formatting utilities
 * Called before displaying any AI-generated content
 */

import katex from 'katex';

/**
 * Format AI response text for proper markdown rendering
 */
export function formatAIResponse(content: string): string {
  if (!content) return '';
  
  let formatted = content;
  
  // Remove excessive whitespace (more than 2 newlines)
  formatted = formatted.replace(/\n{3,}/g, '\n\n');
  
  // Ensure proper markdown header spacing
  formatted = formatted.replace(/^(#+)([^\s#])/gm, '$1 $2');
  
  // Clean up list formatting - normalize to markdown dashes
  formatted = formatted.replace(/^[•●○◦]\s*/gm, '- ');
  
  // Ensure proper spacing around headers
  formatted = formatted.replace(/([^\n])(#{1,6}\s)/g, '$1\n\n$2');
  
  // Clean up extra spaces at end of lines
  formatted = formatted.replace(/[ \t]+$/gm, '');
  
  // Fix table formatting: ensure proper spacing around pipe characters
  const lines = formatted.split('\n');
  const cleanedLines = lines.map(line => {
    if (line.includes('|') && (line.trim().startsWith('|') || line.match(/^[^|]*\|/))) {
      if (line.match(/^\|?\s*:?-+:?\s*\|/)) {
        return line;
      }
      return line.replace(/\|\s*/g, '| ').replace(/\s*\|/g, ' |').replace(/\|\s+\|/g, '| |');
    }
    return line;
  });
  formatted = cleanedLines.join('\n');
  
  return formatted.trim();
}

/**
 * Strip markdown formatting for plain text contexts (audio, etc.)
 */
export function stripMarkdown(content: string): string {
  if (!content) return '';
  
  return content
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/_(.+?)_/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/^>\s+/gm, '')
    .replace(/^[-*_]{3,}$/gm, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
    .replace(/^\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)*\|?\s*$/gm, '')
    .replace(/\|/g, ' — ')
    .replace(/^[-*+]\s+/gm, '')
    .replace(/^\d+\.\s+/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Truncate text to a maximum length with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Convert markdown content to HTML for PDF/print with proper table, math, and formatting support
 */
export function markdownToHtml(content: string): string {
  if (!content) return '';

  let html = content;

  // 1. Protect code blocks — replace with placeholders
  const codeBlocks: string[] = [];
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_match, lang, code) => {
    const idx = codeBlocks.length;
    codeBlocks.push(`<pre><code class="language-${lang || 'text'}">${escapeHtml(code.trimEnd())}</code></pre>`);
    return `%%CODEBLOCK_${idx}%%`;
  });

  // Protect inline code
  const inlineCodes: string[] = [];
  html = html.replace(/`([^`\n]+)`/g, (_match, code) => {
    const idx = inlineCodes.length;
    inlineCodes.push(`<code>${escapeHtml(code)}</code>`);
    return `%%INLINECODE_${idx}%%`;
  });

  // 2. Render math with KaTeX — display math first, then inline
  html = html.replace(/\$\$([\s\S]+?)\$\$/g, (_match, tex) => {
    try {
      return katex.renderToString(tex.trim(), { displayMode: true, throwOnError: false });
    } catch {
      return `<div class="katex-error">${escapeHtml(tex)}</div>`;
    }
  });

  html = html.replace(/\$([^\$\n]+?)\$/g, (_match, tex) => {
    try {
      return katex.renderToString(tex.trim(), { displayMode: false, throwOnError: false });
    } catch {
      return `<span class="katex-error">${escapeHtml(tex)}</span>`;
    }
  });

  // 3. Process tables
  html = processMarkdownTables(html);

  // 4. Process headers (h1-h6)
  html = html.replace(/^######\s+(.+)$/gm, '<h6>$1</h6>');
  html = html.replace(/^#####\s+(.+)$/gm, '<h5>$1</h5>');
  html = html.replace(/^####\s+(.+)$/gm, '<h4>$1</h4>');
  html = html.replace(/^###\s+(.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^##\s+(.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^#\s+(.+)$/gm, '<h1>$1</h1>');

  // 5. Horizontal rules
  html = html.replace(/^[-*_]{3,}\s*$/gm, '<hr>');

  // 6. Blockquotes
  html = html.replace(/^>\s+(.+)$/gm, '<blockquote>$1</blockquote>');
  // Merge consecutive blockquotes
  html = html.replace(/<\/blockquote>\n<blockquote>/g, '\n');

  // 7. Bold and italic (multi-line safe with [\s\S])
  html = html.replace(/\*\*\*(.+?)\*\*\*/gs, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.+?)\*\*/gs, '<strong>$1</strong>');
  html = html.replace(/(?<!\*)\*([^\*\n]+?)\*(?!\*)/g, '<em>$1</em>');
  html = html.replace(/__(.+?)__/gs, '<strong>$1</strong>');
  html = html.replace(/(?<!_)_([^_\n]+?)_(?!_)/g, '<em>$1</em>');

  // 8. Links and images
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width:100%;">');
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

  // 9. Lists — process line by line for proper <ul>/<ol> wrapping
  html = processLists(html);

  // 10. Paragraphs: wrap standalone text lines
  html = html.replace(/^(?!<[a-z/]|%%)((?!^\s*$).+)$/gm, '<p>$1</p>');

  // 11. Restore code blocks and inline code
  codeBlocks.forEach((block, idx) => {
    html = html.replace(`%%CODEBLOCK_${idx}%%`, block);
  });
  inlineCodes.forEach((code, idx) => {
    html = html.replace(`%%INLINECODE_${idx}%%`, code);
  });

  // 12. Clean up empty paragraphs and excessive newlines
  html = html.replace(/<p>\s*<\/p>/g, '');
  html = html.replace(/\n{3,}/g, '\n\n');

  return html.trim();
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function processLists(html: string): string {
  const lines = html.split('\n');
  const result: string[] = [];
  let inUl = false;
  let inOl = false;

  for (const line of lines) {
    const ulMatch = line.match(/^[-*+]\s+(.+)$/);
    const olMatch = line.match(/^\d+\.\s+(.+)$/);

    if (ulMatch) {
      if (inOl) { result.push('</ol>'); inOl = false; }
      if (!inUl) { result.push('<ul>'); inUl = true; }
      result.push(`<li>${ulMatch[1]}</li>`);
    } else if (olMatch) {
      if (inUl) { result.push('</ul>'); inUl = false; }
      if (!inOl) { result.push('<ol>'); inOl = true; }
      result.push(`<li>${olMatch[1]}</li>`);
    } else {
      if (inUl) { result.push('</ul>'); inUl = false; }
      if (inOl) { result.push('</ol>'); inOl = false; }
      result.push(line);
    }
  }

  if (inUl) result.push('</ul>');
  if (inOl) result.push('</ol>');

  return result.join('\n');
}

function processMarkdownTables(content: string): string {
  const lines = content.split('\n');
  let result = '';
  let inTable = false;
  let tableHtml = '';
  let isHeader = true;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line.startsWith('|') && line.endsWith('|')) {
      if (line.match(/^\|[\s:]*-+[\s:]*(\|[\s:]*-+[\s:]*)*\|$/)) {
        isHeader = false;
        continue;
      }
      
      if (!inTable) {
        inTable = true;
        tableHtml = '<div class="table-wrapper"><table><thead>';
        isHeader = true;
      }
      
      const cells = line.split('|').filter((_, idx, arr) => idx > 0 && idx < arr.length - 1).map(c => c.trim());
      
      if (isHeader) {
        tableHtml += '<tr>' + cells.map(c => `<th>${c}</th>`).join('') + '</tr></thead><tbody>';
      } else {
        tableHtml += '<tr>' + cells.map(c => `<td>${c}</td>`).join('') + '</tr>';
      }
    } else {
      if (inTable) {
        tableHtml += '</tbody></table></div>';
        result += tableHtml + '\n';
        tableHtml = '';
        inTable = false;
        isHeader = true;
      }
      result += line + '\n';
    }
  }
  
  if (inTable) {
    tableHtml += '</tbody></table></div>';
    result += tableHtml;
  }
  
  return result;
}
