import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileText, File, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface FileUploadProps {
  onFileContent: (content: string, filename: string, fileUrl: string) => void;
  userId: string;
  disabled?: boolean;
}

const FileUpload = ({ onFileContent, userId, disabled }: FileUploadProps) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = [
      'application/pdf',
      'text/plain',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
    ];

    if (!allowedTypes.includes(file.type)) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload a PDF, TXT, or DOCX file.',
        variant: 'destructive',
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please upload a file smaller than 10MB.',
        variant: 'destructive',
      });
      return;
    }

    setSelectedFile(file);
    await processFile(file);
  };

  const processFile = async (file: File) => {
    setUploading(true);

    try {
      let content = '';

      if (file.type === 'text/plain') {
        content = await file.text();
      } else if (file.type === 'application/pdf') {
        // For PDF, we'll extract text on the server or use a simple approach
        content = await extractPDFText(file);
      } else if (
        file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        file.type === 'application/msword'
      ) {
        content = await extractDocxText(file);
      }

      // Upload file to storage
      const { supabase } = await import('@/integrations/supabase/client');
      const fileExt = file.name.split('.').pop();
      const filePath = `${userId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('note-files')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('note-files')
        .getPublicUrl(filePath);

      onFileContent(content, file.name, filePath);

      toast({
        title: 'File processed! 📄',
        description: `Extracted ${content.length} characters from ${file.name}`,
      });
    } catch (error) {
      console.error('File processing error:', error);
      toast({
        title: 'Error processing file',
        description: 'Could not extract text from the file.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const extractPDFText = async (file: File): Promise<string> => {
    // Simple approach: read as text (works for text-based PDFs)
    // For complex PDFs, you'd use pdf.js or server-side processing
    try {
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      let text = '';
      
      // Basic text extraction from PDF binary
      const decoder = new TextDecoder('utf-8', { fatal: false });
      const rawText = decoder.decode(uint8Array);
      
      // Extract text between stream markers (simplified)
      const streamMatches = rawText.match(/stream[\s\S]*?endstream/g);
      if (streamMatches) {
        for (const match of streamMatches) {
          const cleaned = match
            .replace(/stream|endstream/g, '')
            .replace(/[^\x20-\x7E\n\r]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
          if (cleaned.length > 10) {
            text += cleaned + '\n';
          }
        }
      }

      // If no text extracted, return a placeholder
      if (text.length < 50) {
        return `[PDF Content from: ${file.name}]\n\nThis PDF contains images or complex formatting. The raw text extraction found limited content. Consider copying the text manually for better results.`;
      }

      return text.trim();
    } catch {
      return `[PDF: ${file.name}] - Could not extract text automatically.`;
    }
  };

  const extractDocxText = async (file: File): Promise<string> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const JSZip = (await import('jszip')).default;
      const zip = await JSZip.loadAsync(arrayBuffer);
      
      const docXml = await zip.file('word/document.xml')?.async('string');
      if (!docXml) throw new Error('No document.xml found');

      // Extract text from XML
      const textMatches = docXml.match(/<w:t[^>]*>([^<]*)<\/w:t>/g);
      if (!textMatches) return '';

      const text = textMatches
        .map((match) => match.replace(/<[^>]+>/g, ''))
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();

      return text;
    } catch (error) {
      console.error('DOCX extraction error:', error);
      return `[DOCX: ${file.name}] - Could not extract text.`;
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-3">
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.txt,.docx,.doc"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || uploading}
      />

      {!selectedFile ? (
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || uploading}
          className="w-full p-4 rounded-xl border-2 border-dashed border-border hover:border-primary/50 transition-colors flex flex-col items-center gap-2 text-muted-foreground hover:text-foreground disabled:opacity-50"
        >
          <Upload className="w-6 h-6" />
          <span className="text-sm font-medium">Upload PDF, TXT, or DOCX</span>
          <span className="text-xs">Max 10MB</span>
        </motion.button>
      ) : (
        <div className="p-3 rounded-xl bg-muted flex items-center gap-3">
          {uploading ? (
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
          ) : (
            <FileText className="w-5 h-5 text-primary" />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {selectedFile.name}
            </p>
            <p className="text-xs text-muted-foreground">
              {uploading ? 'Processing...' : 'Ready'}
            </p>
          </div>
          {!uploading && (
            <Button
              variant="ghost"
              size="icon"
              onClick={clearFile}
              className="h-8 w-8"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default FileUpload;
