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
