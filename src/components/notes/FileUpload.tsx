import { useState, useRef, type ChangeEvent } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileText, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface FileUploadProps {
  onFileContent: (content: string, filename: string, fileUrl: string) => void;
  userId: string;
  disabled?: boolean;
}

const ALLOWED_TYPES = [
  'application/pdf',
  'text/plain',
  'text/markdown',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/rtf',
];

const ALLOWED_EXTENSIONS = ['.pdf', '.txt', '.md', '.docx', '.doc', '.pptx', '.xlsx', '.rtf'];

const FileUpload = ({ onFileContent, userId, disabled }: FileUploadProps) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const isAllowedFile = (file: File): boolean => {
    if (ALLOWED_TYPES.includes(file.type)) return true;
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    return ALLOWED_EXTENSIONS.includes(ext);
  };

  const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!isAllowedFile(file)) {
      toast({
        title: 'Invalid file type',
        description: 'Supported: PDF, TXT, DOCX, PPTX, XLSX, RTF, MD',
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
      const fileExt = file.name.split('.').pop();
      const filePath = `${userId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('note-files')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      let content = '';
      const ext = file.name.split('.').pop()?.toLowerCase();

      if (file.type === 'text/plain' || ext === 'txt' || ext === 'md') {
        content = await file.text();
      } else if (file.type === 'application/pdf' || ext === 'pdf') {
        content = await extractPdfTextFromBackend(filePath, file.name);
      } else if (ext === 'docx' || file.type.includes('wordprocessingml')) {
        content = await extractDocxText(file);
      } else if (ext === 'pptx' || file.type.includes('presentationml')) {
        content = await extractPptxText(file);
      } else if (ext === 'xlsx' || file.type.includes('spreadsheetml')) {
        content = await extractXlsxText(file);
      } else if (ext === 'rtf' || file.type === 'application/rtf') {
        content = await extractRtfText(file);
      } else if (file.type === 'application/msword') {
        content = await extractDocxText(file);
      }

      onFileContent(content, file.name, filePath);

      toast({
        title: 'File processed! 📄',
        description: `Extracted ${content.length} characters from ${file.name}`,
      });
    } catch (error) {
      console.error('File processing error:', error);
      toast({
        title: 'Error processing file',
        description: error instanceof Error ? error.message : 'Could not extract text from the file.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const extractPdfTextFromBackend = async (filePath: string, filename: string): Promise<string> => {
    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session?.access_token) {
      throw new Error('You must be signed in to extract PDF text.');
    }

    const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/extract-pdf-text`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${data.session.access_token}`,
      },
      body: JSON.stringify({ bucket: 'note-files', path: filePath, filename }),
    });

    const payload = await resp.json().catch(() => ({}));
    if (!resp.ok) throw new Error(payload.error || 'Failed to extract PDF text.');
    return (payload.text || '').toString();
  };

  const extractDocxText = async (file: File): Promise<string> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const JSZip = (await import('jszip')).default;
      const zip = await JSZip.loadAsync(arrayBuffer);
      const docXml = await zip.file('word/document.xml')?.async('string');
      if (!docXml) throw new Error('No document.xml found');
      const textMatches = docXml.match(/<w:t[^>]*>([^<]*)<\/w:t>/g);
      if (!textMatches) return '';
      return textMatches.map((m) => m.replace(/<[^>]+>/g, '')).join(' ').replace(/\s+/g, ' ').trim();
    } catch (error) {
      console.error('DOCX extraction error:', error);
      return `[DOCX: ${file.name}] - Could not extract text.`;
    }
  };

  const extractPptxText = async (file: File): Promise<string> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const JSZip = (await import('jszip')).default;
      const zip = await JSZip.loadAsync(arrayBuffer);
      const texts: string[] = [];

      // Get all slide files sorted
      const slideFiles = Object.keys(zip.files)
        .filter(f => f.match(/^ppt\/slides\/slide\d+\.xml$/))
        .sort((a, b) => {
          const numA = parseInt(a.match(/slide(\d+)/)?.[1] || '0');
          const numB = parseInt(b.match(/slide(\d+)/)?.[1] || '0');
          return numA - numB;
        });

      for (const slidePath of slideFiles) {
        const slideXml = await zip.file(slidePath)?.async('string');
        if (!slideXml) continue;
        // Extract text from <a:t> tags
        const matches = slideXml.match(/<a:t>([^<]*)<\/a:t>/g);
        if (matches) {
          const slideText = matches.map(m => m.replace(/<[^>]+>/g, '')).join(' ');
          if (slideText.trim()) {
            texts.push(`[Slide ${texts.length + 1}] ${slideText.trim()}`);
          }
        }
      }

      return texts.join('\n\n') || `[PPTX: ${file.name}] - No text content found.`;
    } catch (error) {
      console.error('PPTX extraction error:', error);
      return `[PPTX: ${file.name}] - Could not extract text.`;
    }
  };

  const extractXlsxText = async (file: File): Promise<string> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const JSZip = (await import('jszip')).default;
      const zip = await JSZip.loadAsync(arrayBuffer);

      // Extract shared strings
      const sharedStringsXml = await zip.file('xl/sharedStrings.xml')?.async('string');
      const strings: string[] = [];
      if (sharedStringsXml) {
        const matches = sharedStringsXml.match(/<t[^>]*>([^<]*)<\/t>/g);
        if (matches) {
          matches.forEach(m => {
            const text = m.replace(/<[^>]+>/g, '').trim();
            if (text) strings.push(text);
          });
        }
      }

      // Also try to get sheet data for structure
      const sheet1Xml = await zip.file('xl/worksheets/sheet1.xml')?.async('string');
      if (sheet1Xml && strings.length > 0) {
        return `[Spreadsheet Data]\n${strings.join(' | ')}`;
      }

      return strings.join(' | ') || `[XLSX: ${file.name}] - No text content found.`;
    } catch (error) {
      console.error('XLSX extraction error:', error);
      return `[XLSX: ${file.name}] - Could not extract text.`;
    }
  };

  const extractRtfText = async (file: File): Promise<string> => {
    try {
      const rawText = await file.text();
      // Strip RTF control words and groups
      let text = rawText
        .replace(/\\[a-z]+[-]?\d*\s?/gi, '') // Remove control words
        .replace(/[{}]/g, '') // Remove braces
        .replace(/\\'[0-9a-f]{2}/gi, '') // Remove hex chars
        .replace(/\\[^a-z]/gi, '') // Remove escaped special chars
        .replace(/\s+/g, ' ')
        .trim();
      return text || `[RTF: ${file.name}] - Could not extract text.`;
    } catch (error) {
      console.error('RTF extraction error:', error);
      return `[RTF: ${file.name}] - Could not extract text.`;
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-3">
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.txt,.docx,.doc,.pptx,.xlsx,.rtf,.md"
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
          <span className="text-sm font-medium">Upload PDF, DOCX, PPTX, XLSX, TXT, RTF, or MD</span>
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
            <p className="text-sm font-medium text-foreground truncate">{selectedFile.name}</p>
            <p className="text-xs text-muted-foreground">{uploading ? 'Processing...' : 'Ready'}</p>
          </div>
          {!uploading && (
            <Button variant="ghost" size="icon" onClick={clearFile} className="h-8 w-8">
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default FileUpload;
