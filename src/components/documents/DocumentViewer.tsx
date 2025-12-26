import { lazy, Suspense } from 'react';
import { Loader2, FileText } from 'lucide-react';

const PDFViewer = lazy(() => import('./PDFViewer'));
const DOCXViewer = lazy(() => import('./DOCXViewer'));

interface DocumentViewerProps {
  fileUrl: string;
  filename: string;
  className?: string;
}

const DocumentViewer = ({ fileUrl, filename, className = '' }: DocumentViewerProps) => {
  const extension = filename.toLowerCase().split('.').pop();

  const LoadingFallback = () => (
    <div className="flex items-center justify-center p-8">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
      <span className="ml-2 text-muted-foreground">Loading viewer...</span>
    </div>
  );

  if (extension === 'pdf') {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <PDFViewer fileUrl={fileUrl} className={className} />
      </Suspense>
    );
  }

  if (extension === 'docx' || extension === 'doc') {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <DOCXViewer fileUrl={fileUrl} className={className} />
      </Suspense>
    );
  }

  // Fallback for unsupported types
  return (
    <div className={`flex flex-col items-center justify-center p-8 text-muted-foreground ${className}`}>
      <FileText className="w-12 h-12 mb-2" />
      <p>Preview not available for {extension?.toUpperCase()} files</p>
      <p className="text-sm">Use the download button to view this file</p>
    </div>
  );
};

export default DocumentViewer;
