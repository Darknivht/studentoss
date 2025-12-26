import { useState, useEffect, useRef } from 'react';
import { renderAsync } from 'docx-preview';
import { Loader2 } from 'lucide-react';

interface DOCXViewerProps {
  fileUrl: string;
  className?: string;
}

const DOCXViewer = ({ fileUrl, className = '' }: DOCXViewerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDocx = async () => {
      if (!containerRef.current || !fileUrl) return;

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(fileUrl);
        if (!response.ok) {
          throw new Error('Failed to fetch document');
        }

        const arrayBuffer = await response.arrayBuffer();

        // Clear previous content
        containerRef.current.innerHTML = '';

        await renderAsync(arrayBuffer, containerRef.current, undefined, {
          className: 'docx-wrapper',
          inWrapper: true,
          ignoreWidth: false,
          ignoreHeight: false,
          ignoreFonts: false,
          breakPages: true,
          renderHeaders: true,
          renderFooters: true,
          renderFootnotes: true,
          renderEndnotes: true,
        });
      } catch (err) {
        console.error('DOCX load error:', err);
        setError('Failed to load Word document');
      } finally {
        setLoading(false);
      }
    };

    loadDocx();
  }, [fileUrl]);

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading document...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center p-8 text-destructive ${className}`}>
        {error}
      </div>
    );
  }

  return (
    <div className={`overflow-auto border border-border rounded-lg bg-background ${className}`}>
      <div
        ref={containerRef}
        className="docx-container p-4"
        style={{ minHeight: '300px' }}
      />
      <style>{`
        .docx-wrapper {
          background: white;
          padding: 20px;
          box-shadow: 0 0 10px rgba(0,0,0,0.1);
          max-width: 100%;
        }
        .docx-wrapper section.docx {
          padding: 20px;
          margin-bottom: 20px;
        }
        .docx-wrapper p {
          margin: 0.5em 0;
        }
        .docx-wrapper table {
          border-collapse: collapse;
          width: 100%;
        }
        .docx-wrapper table td,
        .docx-wrapper table th {
          border: 1px solid #ddd;
          padding: 8px;
        }
        .docx-wrapper img {
          max-width: 100%;
          height: auto;
        }
      `}</style>
    </div>
  );
};

export default DOCXViewer;
