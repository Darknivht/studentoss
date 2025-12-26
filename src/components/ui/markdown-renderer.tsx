import React from 'react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

const MarkdownRenderer = ({ content, className = '' }: MarkdownRendererProps) => {
  const renderMarkdown = (text: string) => {
    // Split into lines for processing
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];
    let listItems: string[] = [];
    let inCodeBlock = false;
    let codeContent = '';
    let codeLanguage = '';

    const flushList = () => {
      if (listItems.length > 0) {
        elements.push(
          <ul key={`list-${elements.length}`} className="list-disc list-inside space-y-1 my-2">
            {listItems.map((item, i) => (
              <li key={i} className="text-foreground">{renderInlineMarkdown(item)}</li>
            ))}
          </ul>
        );
        listItems = [];
      }
    };

    const flushCodeBlock = () => {
      if (codeContent) {
        elements.push(
          <pre key={`code-${elements.length}`} className="bg-muted p-4 rounded-lg overflow-x-auto my-3">
            <code className="text-sm font-mono text-foreground">{codeContent.trim()}</code>
          </pre>
        );
        codeContent = '';
        codeLanguage = '';
      }
    };

    const renderInlineMarkdown = (line: string): React.ReactNode => {
      // Process inline markdown
      const parts: React.ReactNode[] = [];
      let remaining = line;
      let partIndex = 0;

      // Bold and italic
      while (remaining) {
        // Bold (**text** or __text__)
        const boldMatch = remaining.match(/(\*\*|__)(.+?)\1/);
        // Italic (*text* or _text_)
        const italicMatch = remaining.match(/(\*|_)(.+?)\1/);
        // Inline code (`code`)
        const codeMatch = remaining.match(/`([^`]+)`/);
        // LaTeX inline ($...$)
        const latexMatch = remaining.match(/\$([^$]+)\$/);

        const matches = [
          boldMatch && { type: 'bold', match: boldMatch, index: remaining.indexOf(boldMatch[0]) },
          italicMatch && { type: 'italic', match: italicMatch, index: remaining.indexOf(italicMatch[0]) },
          codeMatch && { type: 'code', match: codeMatch, index: remaining.indexOf(codeMatch[0]) },
          latexMatch && { type: 'latex', match: latexMatch, index: remaining.indexOf(latexMatch[0]) },
        ].filter(Boolean).sort((a, b) => (a?.index ?? 0) - (b?.index ?? 0));

        if (matches.length > 0 && matches[0]) {
          const first = matches[0];
          const beforeText = remaining.slice(0, first.index);
          if (beforeText) {
            parts.push(<span key={partIndex++}>{beforeText}</span>);
          }

          switch (first.type) {
            case 'bold':
              parts.push(<strong key={partIndex++} className="font-semibold">{first.match![2]}</strong>);
              break;
            case 'italic':
              parts.push(<em key={partIndex++}>{first.match![2]}</em>);
              break;
            case 'code':
              parts.push(
                <code key={partIndex++} className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">
                  {first.match![1]}
                </code>
              );
              break;
            case 'latex':
              parts.push(
                <span key={partIndex++} className="font-mono text-primary">{first.match![1]}</span>
              );
              break;
          }
          remaining = remaining.slice(first.index + first.match![0].length);
        } else {
          parts.push(<span key={partIndex++}>{remaining}</span>);
          break;
        }
      }

      return parts.length > 0 ? parts : line;
    };

    lines.forEach((line, index) => {
      // Handle code blocks
      if (line.startsWith('```')) {
        if (inCodeBlock) {
          flushCodeBlock();
          inCodeBlock = false;
        } else {
          flushList();
          inCodeBlock = true;
          codeLanguage = line.slice(3).trim();
        }
        return;
      }

      if (inCodeBlock) {
        codeContent += line + '\n';
        return;
      }

      // Headers
      const h1Match = line.match(/^# (.+)$/);
      const h2Match = line.match(/^## (.+)$/);
      const h3Match = line.match(/^### (.+)$/);

      if (h1Match) {
        flushList();
        elements.push(
          <h1 key={`h1-${index}`} className="text-2xl font-bold text-foreground mt-4 mb-2">
            {renderInlineMarkdown(h1Match[1])}
          </h1>
        );
        return;
      }

      if (h2Match) {
        flushList();
        elements.push(
          <h2 key={`h2-${index}`} className="text-xl font-semibold text-foreground mt-3 mb-2">
            {renderInlineMarkdown(h2Match[1])}
          </h2>
        );
        return;
      }

      if (h3Match) {
        flushList();
        elements.push(
          <h3 key={`h3-${index}`} className="text-lg font-medium text-foreground mt-2 mb-1">
            {renderInlineMarkdown(h3Match[1])}
          </h3>
        );
        return;
      }

      // List items
      const listMatch = line.match(/^[\-\*•] (.+)$/);
      const numberedMatch = line.match(/^\d+\. (.+)$/);

      if (listMatch) {
        listItems.push(listMatch[1]);
        return;
      }

      if (numberedMatch) {
        listItems.push(numberedMatch[1]);
        return;
      }

      // Empty line
      if (line.trim() === '') {
        flushList();
        elements.push(<div key={`br-${index}`} className="h-2" />);
        return;
      }

      // Regular paragraph
      flushList();
      elements.push(
        <p key={`p-${index}`} className="text-foreground leading-relaxed my-1">
          {renderInlineMarkdown(line)}
        </p>
      );
    });

    flushList();
    flushCodeBlock();

    return elements;
  };

  return (
    <div className={`prose prose-sm dark:prose-invert max-w-none ${className}`}>
      {renderMarkdown(content)}
    </div>
  );
};

export default MarkdownRenderer;