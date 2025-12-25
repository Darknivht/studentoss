import { motion } from 'framer-motion';
import { FileText, Sparkles, Brain, Trash2, MoreVertical, BookOpen, Layers } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

interface Note {
  id: string;
  title: string;
  content: string | null;
  summary: string | null;
  source_type: string;
  created_at: string;
  course_id?: string | null;
}

interface NoteCardProps {
  note: Note;
  index: number;
  onDelete: (id: string) => void;
  onSummarize: () => void;
  onTutor: () => void;
  onGenerateFlashcards?: () => void;
  onGenerateQuiz?: () => void;
  courseName?: string;
}

const NoteCard = ({ 
  note, 
  index, 
  onDelete, 
  onSummarize, 
  onTutor,
  onGenerateFlashcards,
  onGenerateQuiz,
  courseName 
}: NoteCardProps) => {
  const preview = note.content?.slice(0, 120) + (note.content && note.content.length > 120 ? '...' : '');
  const createdAt = new Date(note.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="p-4 rounded-2xl bg-card border border-border/50 shadow-sm hover:shadow-elevated transition-all group"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <FileText size={16} className="text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground truncate">{note.title}</h3>
              {courseName && (
                <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                  {courseName}
                </span>
              )}
            </div>
          </div>
          
          <p className="text-sm text-muted-foreground line-clamp-2 ml-10 mb-3">
            {preview || 'No content'}
          </p>

          {note.summary && (
            <div className="ml-10 mb-3 p-2 rounded-lg bg-success/10 border border-success/20">
              <p className="text-xs text-success font-medium mb-1">✨ AI Summary</p>
              <p className="text-xs text-muted-foreground line-clamp-2">{note.summary}</p>
            </div>
          )}

          <div className="flex items-center gap-2 ml-10 flex-wrap">
            <span className="text-xs text-muted-foreground">{createdAt}</span>
            <span className="text-muted-foreground/30">•</span>
            <button
              onClick={onSummarize}
              className="text-xs text-primary hover:text-primary/80 font-medium flex items-center gap-1 transition-colors"
            >
              <Sparkles size={12} />
              {note.summary ? 'Update' : 'Summarize'}
            </button>
            <span className="text-muted-foreground/30">•</span>
            <button
              onClick={onTutor}
              className="text-xs text-secondary hover:text-secondary/80 font-medium flex items-center gap-1 transition-colors"
            >
              <Brain size={12} />
              Tutor
            </button>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger className="p-2 rounded-lg hover:bg-muted transition-colors opacity-0 group-hover:opacity-100">
            <MoreVertical size={16} className="text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {onGenerateFlashcards && (
              <DropdownMenuItem onClick={onGenerateFlashcards}>
                <Layers className="w-4 h-4 mr-2" />
                Generate Flashcards
              </DropdownMenuItem>
            )}
            {onGenerateQuiz && (
              <DropdownMenuItem onClick={onGenerateQuiz}>
                <BookOpen className="w-4 h-4 mr-2" />
                Generate Quiz
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onDelete(note.id)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Note
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.div>
  );
};

export default NoteCard;