import { useRef, useEffect } from 'react';
import { ResumeData, renderResumeHTML } from './ResumeTemplates';

interface ResumePreviewProps {
  data: ResumeData;
  templateId: string;
}

const ResumePreview = ({ data, templateId }: ResumePreviewProps) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (iframeRef.current) {
      const html = renderResumeHTML(data, templateId);
      const doc = iframeRef.current.contentDocument;
      if (doc) {
        doc.open();
        doc.write(html);
        doc.close();
      }
    }
  }, [data, templateId]);

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-white">
      <iframe
        ref={iframeRef}
        title="Resume Preview"
        className="w-full h-[500px] md:h-[600px]"
        sandbox="allow-same-origin"
      />
    </div>
  );
};

export default ResumePreview;
