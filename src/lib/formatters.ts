/**
 * Universal text formatting utilities
 * Called before displaying any AI-generated content
 */

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
  // Detect markdown table lines and clean them up
  const lines = formatted.split('\n');
  const cleanedLines = lines.map(line => {
    // If line looks like a table row (contains |)
    if (line.includes('|') && (line.trim().startsWith('|') || line.match(/^[^|]*\|/))) {
      // Clean up separator rows
      if (line.match(/^\|?\s*:?-+:?\s*\|/)) {
        return line;
      }
      // Ensure cells are properly spaced
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
    // Remove bold
    .replace(/\*\*(.+?)\*\*/g, '$1')
    // Remove italic
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/_(.+?)_/g, '$1')
    // Remove headers
    .replace(/^#{1,6}\s+/gm, '')
    // Remove inline code
    .replace(/`([^`]+)`/g, '$1')
    // Remove code blocks
    .replace(/```[\s\S]*?```/g, '')
    // Remove blockquotes
    .replace(/^>\s+/gm, '')
    // Remove horizontal rules
    .replace(/^[-*_]{3,}$/gm, '')
    // Remove links but keep text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Remove images
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
    // Remove table separators
    .replace(/^\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)*\|?\s*$/gm, '')
    // Convert table rows to readable format
    .replace(/\|/g, ' — ')
    // Clean up list markers
    .replace(/^[-*+]\s+/gm, '')
    .replace(/^\d+\.\s+/gm, '')
    // Clean up extra whitespace
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
 * Convert markdown content to HTML for PDF/print with proper table support
 */
export function markdownToHtml(content: string): string {
  if (!content) return '';
  
  let html = content;
  
  // Process code blocks first (before other processing)
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>');
  
  // Process tables
  html = processMarkdownTables(html);
  
  // Process headers
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
  
  // Process bold and italic
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  
  // Process lists
  html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');
  
  // Process numbered lists
  html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');
  
  // Process inline code
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  
  // Process paragraphs (lines not already wrapped in tags)
  html = html.replace(/^(?!<[a-z])((?!^\s*$).+)$/gm, '<p>$1</p>');
  
  // Clean up double paragraphs
  html = html.replace(/<p><\/p>/g, '');
  
  return html;
}

function processMarkdownTables(content: string): string {
  const lines = content.split('\n');
  let result = '';
  let inTable = false;
  let tableHtml = '';
  let isHeader = true;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Check if this is a table row
    if (line.startsWith('|') && line.endsWith('|')) {
      // Check if it's a separator row
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
