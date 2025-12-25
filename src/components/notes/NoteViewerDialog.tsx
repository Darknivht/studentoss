import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, Download, Loader2, RefreshCw, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Note {
  id: string;
  title: string;
  content: string | null;
  file_url?: string | null;
  original_filename?: string | null;
  source_type: string;
}

interface NoteViewerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  note: Note;
  onContentUpdated?: (noteId: string, newContent: string) => void;
}

const NoteViewerDialog = ({ open, onOpenChange, note, onContentUpdated }: NoteViewerDialogProps) => {
  const { toast } = useToast();
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [reextracting, setReextracting] = useState(false);
  const [ocrExtracting, setOcrExtracting] = useState(false);
  const [localContent, setLocalContent] = useState<string | null>(note.content);

  useEffect(() => {
    setLocalContent(note.content);
  }, [note.content]);

  useEffect(() => {
    if (note.file_url && open) {
      getSignedUrl();
    }
  }, [note.file_url, open]);

  const getSignedUrl = async () => {
    if (!note.file_url) return;
    
    const { data } = await supabase.storage
      .from('note-files')
      .createSignedUrl(note.file_url, 3600);
    
    if (data?.signedUrl) {
      setFileUrl(data.signedUrl);
    }
  };

  const handleDownload = () => {
    if (fileUrl) {
      window.open(fileUrl, '_blank');
    }
  };

  const handleReextract = async () => {
    if (!note.file_url) return;
    
    setReextracting(true);
    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData.session?.access_token) {
        throw new Error('You must be signed in.');
      }

      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/extract-pdf-text`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionData.session.access_token}`,
        },
        body: JSON.stringify({
          bucket: 'note-files',
          path: note.file_url,
          filename: note.original_filename,
        }),
      });

      const payload = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        throw new Error(payload.error || 'Failed to extract PDF text.');
      }

      const newContent = payload.text || '';
      
      // Update the note in the database
      const { error: updateError } = await supabase
        .from('notes')
        .update({ content: newContent })
        .eq('id', note.id);

      if (updateError) throw updateError;

      setLocalContent(newContent);
      onContentUpdated?.(note.id, newContent);

      toast({
        title: 'Text re-extracted!',
        description: `Extracted ${newContent.length} characters.`,
      });
    } catch (error) {
      console.error('Re-extraction error:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to re-extract text.',
        variant: 'destructive',
      });
    } finally {
      setReextracting(false);
    }
  };

  const handleOcrExtract = async () => {
    if (!note.file_url) return;
    
    setOcrExtracting(true);
    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData.session?.access_token) {
        throw new Error('You must be signed in.');
      }

      toast({
        title: 'Running OCR...',
        description: 'This may take a moment for scanned documents.',
      });

      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/extract-pdf-text-ocr`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionData.session.access_token}`,
        },
        body: JSON.stringify({
          bucket: 'note-files',
          path: note.file_url,
          filename: note.original_filename,
        }),
      });

      const payload = await resp.json().catch(() => ({}));
      if (!resp.ok && !payload.text) {
        throw new Error(payload.error || 'Failed to extract text with OCR.');
      }

      const newContent = payload.text || '';
      
      // Update the note in the database
      const { error: updateError } = await supabase
        .from('notes')
        .update({ content: newContent })
        .eq('id', note.id);

      if (updateError) throw updateError;

      setLocalContent(newContent);
      onContentUpdated?.(note.id, newContent);

      toast({
        title: 'OCR complete!',
        description: `Extracted ${newContent.length} characters using AI vision.`,
      });
    } catch (error) {
      console.error('OCR error:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to run OCR.',
        variant: 'destructive',
      });
    } finally {
      setOcrExtracting(false);
    }
  };

  const isPdf = note.original_filename?.toLowerCase().endsWith('.pdf');
  const isProcessing = reextracting || ocrExtracting;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            {note.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* File Info */}
          {note.original_filename && (
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">{note.original_filename}</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {isPdf && (
                  <>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleReextract}
                      disabled={isProcessing}
                    >
                      {reextracting ? (
                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4 mr-1" />
                      )}
                      Re-extract
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleOcrExtract}
                      disabled={isProcessing}
                    >
                      {ocrExtracting ? (
                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      ) : (
                        <Sparkles className="w-4 h-4 mr-1" />
                      )}
                      OCR
                    </Button>
                  </>
                )}
                {fileUrl && (
                  <Button variant="outline" size="sm" onClick={handleDownload}>
                    <Download className="w-4 h-4 mr-1" />
                    Download
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Content */}
          <ScrollArea className="h-[50vh] rounded-lg border border-border p-4">
            <div className="prose prose-sm dark:prose-invert max-w-none">
              {localContent ? (
                <pre className="whitespace-pre-wrap font-sans text-sm text-foreground">
                  {localContent}
                </pre>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No text content available
                </p>
              )}
            </div>
          </ScrollArea>

          {/* Metadata */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>Source: {note.source_type === 'file' ? 'Uploaded file' : 'Manual entry'}</span>
            <span>•</span>
            <span>{localContent?.length || 0} characters</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NoteViewerDialog;
