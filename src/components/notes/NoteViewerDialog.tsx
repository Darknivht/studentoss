import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, Download, Loader2, RefreshCw, Sparkles, Eye, Type, 
  MessageCircle, BookOpen, ClipboardList, Brain, Copy, Share2, Pencil
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { streamAIChat } from '@/lib/ai';
import { updateCourseProgress } from '@/hooks/useCourseProgress';
import DocumentViewer from '@/components/documents/DocumentViewer';

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
  onTutor?: () => void;
  onGenerateFlashcards?: () => void;
  onGenerateQuiz?: () => void;
  onSummarize?: () => void;
}

const NoteViewerDialog = ({ 
  open, 
  onOpenChange, 
  note, 
  onContentUpdated,
  onTutor,
  onGenerateFlashcards,
  onGenerateQuiz,
  onSummarize
}: NoteViewerDialogProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [reextracting, setReextracting] = useState(false);
  const [ocrExtracting, setOcrExtracting] = useState(false);
  const [localContent, setLocalContent] = useState<string | null>(note.content);
  const [activeTab, setActiveTab] = useState<string>('preview');
  const [generatingFlashcards, setGeneratingFlashcards] = useState(false);

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

  const handleCopyContent = async () => {
    if (localContent) {
      await navigator.clipboard.writeText(localContent);
      toast({
        title: 'Copied!',
        description: 'Note content copied to clipboard.',
      });
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

  const extractJsonFromAI = (raw: string) => {
    const fence = raw.match(/```json\s*([\s\S]*?)\s*```/i);
    if (fence?.[1]) return fence[1].trim();

    const trimmed = raw.trim();
    const objStart = trimmed.indexOf('{');
    const objEnd = trimmed.lastIndexOf('}');
    if (objStart !== -1 && objEnd !== -1 && objEnd > objStart) {
      return trimmed.slice(objStart, objEnd + 1);
    }

    const arrStart = trimmed.indexOf('[');
    const arrEnd = trimmed.lastIndexOf(']');
    if (arrStart !== -1 && arrEnd !== -1 && arrEnd > arrStart) {
      return trimmed.slice(arrStart, arrEnd + 1);
    }

    return trimmed;
  };

  const handleQuickFlashcards = async () => {
    if (!localContent || !user) return;
    
    if (onGenerateFlashcards) {
      onOpenChange(false);
      onGenerateFlashcards();
      return;
    }

    setGeneratingFlashcards(true);
    try {
      let fullResponse = '';
      await streamAIChat({
        messages: [],
        mode: 'flashcards',
        content: localContent,
        onDelta: (chunk) => {
          fullResponse += chunk;
        },
        onDone: async () => {
          try {
            const jsonStr = extractJsonFromAI(fullResponse);
            const parsed = JSON.parse(jsonStr);
            const flashcardsData = Array.isArray(parsed)
              ? parsed
              : (parsed.flashcards || []);
            
            const flashcardsToInsert = flashcardsData
              .filter((fc: any) => fc?.front && fc?.back)
              .map((fc: { front: string; back: string }) => ({
                user_id: user.id,
                note_id: note.id,
                course_id: (note as any).course_id,
                front: fc.front,
                back: fc.back,
              }));

            if (flashcardsToInsert.length > 0) {
              await supabase.from('flashcards').insert(flashcardsToInsert);
              
              if ((note as any).course_id && user.id) {
                updateCourseProgress(user.id, (note as any).course_id);
              }
            }

            toast({
              title: `Created ${flashcardsToInsert.length} flashcards! 🎴`,
              description: 'Go to Flashcards to start studying.',
            });
          } catch (e) {
            console.error('Failed to parse/insert flashcards:', e, fullResponse);
            toast({
              title: 'Error',
              description: 'AI response was not valid flashcard JSON. Please try again.',
              variant: 'destructive',
            });
          }
          setGeneratingFlashcards(false);
        },
        onError: (err) => {
          toast({ title: 'Error', description: err, variant: 'destructive' });
          setGeneratingFlashcards(false);
        },
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to generate flashcards.',
        variant: 'destructive',
      });
      setGeneratingFlashcards(false);
    }
  };

  const handleQuickQuiz = () => {
    if (onGenerateQuiz) {
      onOpenChange(false);
      onGenerateQuiz();
    } else {
      window.location.href = `/quizzes?noteId=${note.id}`;
    }
  };

  const handleQuickTutor = () => {
    if (onTutor) {
      onOpenChange(false);
      onTutor();
    }
  };

  const handleQuickSummary = () => {
    if (onSummarize) {
      onOpenChange(false);
      onSummarize();
    }
  };

  const isPdf = note.original_filename?.toLowerCase().endsWith('.pdf');
  const isDocx = note.original_filename?.toLowerCase().endsWith('.docx') || note.original_filename?.toLowerCase().endsWith('.doc');
  const canPreview = isPdf || isDocx;
  const isProcessing = reextracting || ocrExtracting || generatingFlashcards;
  const hasContent = !!localContent && localContent.length > 50;

  const quickActions = [
    {
      label: 'Socratic Tutor',
      icon: MessageCircle,
      onClick: handleQuickTutor,
      disabled: !hasContent || !onTutor,
      description: 'Learn through guided questions',
      color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    },
    {
      label: 'Generate Flashcards',
      icon: BookOpen,
      onClick: handleQuickFlashcards,
      disabled: !hasContent || generatingFlashcards,
      description: 'Create study cards from content',
      color: 'bg-green-500/10 text-green-600 dark:text-green-400',
      loading: generatingFlashcards,
    },
    {
      label: 'Take Quiz',
      icon: ClipboardList,
      onClick: handleQuickQuiz,
      disabled: !hasContent,
      description: 'Test your knowledge',
      color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
    },
    {
      label: 'AI Summary',
      icon: Brain,
      onClick: handleQuickSummary,
      disabled: !hasContent || !onSummarize,
      description: 'Get a quick overview',
      color: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
    },
  ];

  const utilityActions = [
    {
      label: 'Copy Text',
      icon: Copy,
      onClick: handleCopyContent,
      disabled: !localContent,
    },
    {
      label: 'Download',
      icon: Download,
      onClick: handleDownload,
      disabled: !fileUrl,
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            {note.title}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr,280px] gap-4 overflow-hidden">
          {/* Main Content Area */}
          <div className="space-y-4 overflow-hidden">
            {/* File Info & Extraction Actions */}
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
                </div>
              </div>
            )}

            {/* Content with Tabs for Preview/Text */}
            {canPreview && fileUrl ? (
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="preview" className="flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    Document Preview
                  </TabsTrigger>
                  <TabsTrigger value="text" className="flex items-center gap-2">
                    <Type className="w-4 h-4" />
                    Extracted Text
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="preview" className="mt-4">
                  <DocumentViewer 
                    fileUrl={fileUrl} 
                    filename={note.original_filename || ''} 
                    className="max-h-[45vh]"
                  />
                </TabsContent>
                
                <TabsContent value="text" className="mt-4">
                  <ScrollArea className="h-[45vh] rounded-lg border border-border p-4">
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      {localContent ? (
                        <pre className="whitespace-pre-wrap font-sans text-sm text-foreground">
                          {localContent}
                        </pre>
                      ) : (
                        <p className="text-muted-foreground text-center py-8">
                          No text content extracted yet. Try the Re-extract or OCR buttons.
                        </p>
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            ) : (
              <ScrollArea className="h-[45vh] rounded-lg border border-border p-4">
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
            )}

            {/* Metadata */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>Source: {note.source_type === 'file' ? 'Uploaded file' : 'Manual entry'}</span>
              <span>•</span>
              <span>{localContent?.length || 0} characters</span>
            </div>
          </div>

          {/* Quick Actions Sidebar */}
          <div className="space-y-4 lg:border-l lg:pl-4 border-border">
            <div>
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                Quick Actions
              </h3>
              <div className="space-y-2">
                {quickActions.map((action) => (
                  <button
                    key={action.label}
                    onClick={action.onClick}
                    disabled={action.disabled}
                    className={`w-full p-3 rounded-lg text-left transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 ${action.color} border border-transparent hover:border-border/50`}
                  >
                    <div className="flex items-center gap-3">
                      {action.loading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <action.icon className="w-5 h-5" />
                      )}
                      <div>
                        <p className="font-medium text-sm">{action.label}</p>
                        <p className="text-xs opacity-70">{action.description}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Utility Actions */}
            <div>
              <h3 className="text-sm font-semibold mb-3">Utilities</h3>
              <div className="flex gap-2 flex-wrap">
                {utilityActions.map((action) => (
                  <Button
                    key={action.label}
                    variant="outline"
                    size="sm"
                    onClick={action.onClick}
                    disabled={action.disabled}
                    className="flex-1 min-w-[100px]"
                  >
                    <action.icon className="w-4 h-4 mr-1" />
                    {action.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Tip */}
            {!hasContent && (
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  <strong>Tip:</strong> Extract text from your document first to enable AI features.
                </p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NoteViewerDialog;
