import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, Download, Loader2 } from 'lucide-react';
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
}

const NoteViewerDialog = ({ open, onOpenChange, note }: NoteViewerDialogProps) => {
  const [fileUrl, setFileUrl] = useState<string | null>(null);

  useEffect(() => {
    if (note.file_url && open) {
      getSignedUrl();
    }
  }, [note.file_url, open]);

  const getSignedUrl = async () => {
    if (!note.file_url) return;
    
    const { data } = await supabase.storage
      .from('note-files')
      .createSignedUrl(note.file_url, 3600); // 1 hour expiry
    
    if (data?.signedUrl) {
      setFileUrl(data.signedUrl);
    }
  };

  const handleDownload = () => {
    if (fileUrl) {
      window.open(fileUrl, '_blank');
    }
  };

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
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">{note.original_filename}</span>
              </div>
              {fileUrl && (
                <Button variant="outline" size="sm" onClick={handleDownload}>
                  <Download className="w-4 h-4 mr-1" />
                  Download
                </Button>
              )}
            </div>
          )}

          {/* Content */}
          <ScrollArea className="h-[50vh] rounded-lg border border-border p-4">
            <div className="prose prose-sm dark:prose-invert max-w-none">
              {note.content ? (
                <pre className="whitespace-pre-wrap font-sans text-sm text-foreground">
                  {note.content}
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
            <span>{note.content?.length || 0} characters</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NoteViewerDialog;
