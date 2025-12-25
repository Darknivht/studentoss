import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileText, X, Loader2 } from 'lucide-react';
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
    try {
      const text = await file.text();
      
      // Simple PDF text extraction - look for text between stream objects
      const textContent: string[] = [];
      
      // Extract text from PDF by looking for readable strings
      const matches = text.match(/\(([^)]+)\)/g);
      if (matches) {
        matches.forEach(match => {
          const cleaned = match.slice(1, -1)
            .replace(/\\n/g, '\n')
            .replace(/\\r/g, '')
            .replace(/\\t/g, ' ')
            .replace(/\\\(/g, '(')
            .replace(/\\\)/g, ')')
            .replace(/\\\\/g, '\\');
          
          // Filter out binary/encoded content
          if (cleaned.length > 0 && !/^[\x00-\x1f\x80-\xff]+$/.test(cleaned)) {
            textContent.push(cleaned);
          }
        });
      }
      
      // Also try to find BT...ET blocks (text objects in PDF)
      const btBlocks = text.match(/BT[\s\S]*?ET/g);
      if (btBlocks) {
        btBlocks.forEach(block => {
          const tjMatches = block.match(/\(([^)]*)\)\s*Tj/g);
          if (tjMatches) {
            tjMatches.forEach(tj => {
              const content = tj.match(/\(([^)]*)\)/)?.[1];
              if (content && content.length > 0) {
                textContent.push(content);
              }
            });
          }
        });
      }

      const extractedText = textContent
        .filter(t => t.trim().length > 1)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();

      if (extractedText.length < 50) {
        return `[PDF: ${file.name}]\n\nThis PDF appears to contain primarily images or scanned content. For best results with AI features, please copy and paste the text content manually, or use a text-based PDF.`;
      }

      return extractedText;
    } catch (error) {
      console.error('PDF extraction error:', error);
      return `[PDF: ${file.name}] - Could not extract text. Please copy and paste the content manually for AI features to work.`;
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