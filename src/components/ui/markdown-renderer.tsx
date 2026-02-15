import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

const MarkdownRenderer = ({ content, className = '' }: MarkdownRendererProps) => {
  return (
    <div className={`prose prose-sm dark:prose-invert max-w-none ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          h1: ({ children }) => <h1 className="text-2xl font-bold text-foreground mt-4 mb-2">{children}</h1>,
          h2: ({ children }) => <h2 className="text-xl font-semibold text-foreground mt-3 mb-2">{children}</h2>,
          h3: ({ children }) => <h3 className="text-lg font-medium text-foreground mt-2 mb-1">{children}</h3>,
          p: ({ children }) => <p className="text-foreground leading-relaxed my-1">{children}</p>,
          ul: ({ children }) => <ul className="list-disc list-inside space-y-1 my-2">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 my-2">{children}</ol>,
          li: ({ children }) => <li className="text-foreground">{children}</li>,
          strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
          code: ({ className: codeClassName, children, ...props }) => {
            const isInline = !codeClassName;
            if (isInline) {
              return (
                <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
                  {children}
                </code>
              );
            }
            return (
              <code className="text-sm font-mono text-foreground" {...props}>
                {children}
              </code>
            );
          },
          pre: ({ children }) => (
            <pre className="bg-muted p-4 rounded-lg overflow-x-auto my-3">{children}</pre>
          ),
          table: ({ children }) => (
            <table className="w-full border-collapse text-sm">{children}</table>
          ),
          th: ({ children }) => (
            <th className="bg-muted px-3 py-2 text-left font-semibold text-foreground text-xs whitespace-nowrap border-b-2 border-border">{children}</th>
          ),
          td: ({ children }) => (
            <td className="px-3 py-2 border-b border-border text-foreground text-xs">{children}</td>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;
