import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  BookOpen, Brain, FileText, Sparkles, Timer, Calculator, 
  Sigma, Microscope, Bug, Languages, Youtube, Mic 
} from 'lucide-react';
import MathSolver from '@/components/ai-tools/MathSolver';
import OCRToLatex from '@/components/ai-tools/OCRToLatex';
import DiagramInterpreter from '@/components/ai-tools/DiagramInterpreter';
import CodeDebugger from '@/components/ai-tools/CodeDebugger';
import LanguageTranslator from '@/components/ai-tools/LanguageTranslator';
import YouTubeSummarizer from '@/components/ai-tools/YouTubeSummarizer';
import BookScanner from '@/components/ai-tools/BookScanner';
import LectureRecorder from '@/components/ai-tools/LectureRecorder';

type ToolType = 'math' | 'latex' | 'diagram' | 'code' | 'translate' | 'youtube' | 'book' | 'lecture' | null;

const studyTools = [
  { icon: FileText, label: 'Smart Notes', description: 'Upload & AI summaries', color: '#8B5CF6', path: '/notes' },
  { icon: Brain, label: 'AI Tutor', description: 'Socratic learning', color: '#0EA5E9', path: '/tutor' },
  { icon: Sparkles, label: 'Flashcards', description: 'Spaced repetition', color: '#10B981', path: '/flashcards' },
  { icon: BookOpen, label: 'Quizzes', description: 'Test yourself', color: '#F59E0B', path: '/quizzes' },
  { icon: Timer, label: 'Focus Timer', description: 'Pomodoro sessions', color: '#EC4899', path: '/focus' },
];

const aiTools = [
  { id: 'math', icon: Calculator, label: 'Math Solver', description: 'Photo → solution', color: '#6366f1' },
  { id: 'latex', icon: Sigma, label: 'OCR to LaTeX', description: 'Handwritten → formulas', color: '#8b5cf6' },
  { id: 'diagram', icon: Microscope, label: 'Diagram Explainer', description: 'Science diagrams', color: '#10b981' },
  { id: 'code', icon: Bug, label: 'Code Debugger', description: 'AI explains fixes', color: '#f59e0b' },
  { id: 'translate', icon: Languages, label: 'Translator', description: 'Any language', color: '#3b82f6' },
  { id: 'youtube', icon: Youtube, label: 'YouTube Summary', description: 'Video → notes', color: '#ef4444' },
  { id: 'book', icon: BookOpen, label: 'Book Scanner', description: 'Extract definitions', color: '#ec4899' },
  { id: 'lecture', icon: Mic, label: 'Lecture Recorder', description: 'Audio → text', color: '#14b8a6' },
];

const Study = () => {
  const [activeTool, setActiveTool] = useState<ToolType>(null);

  if (activeTool === 'math') return <MathSolver onBack={() => setActiveTool(null)} />;
  if (activeTool === 'latex') return <OCRToLatex onBack={() => setActiveTool(null)} />;
  if (activeTool === 'diagram') return <DiagramInterpreter onBack={() => setActiveTool(null)} />;
  if (activeTool === 'code') return <CodeDebugger onBack={() => setActiveTool(null)} />;
  if (activeTool === 'translate') return <LanguageTranslator onBack={() => setActiveTool(null)} />;
  if (activeTool === 'youtube') return <YouTubeSummarizer onBack={() => setActiveTool(null)} />;
  if (activeTool === 'book') return <BookScanner onBack={() => setActiveTool(null)} />;
  if (activeTool === 'lecture') return <LectureRecorder onBack={() => setActiveTool(null)} />;

  return (
    <div className="p-6 space-y-6">
      <motion.header initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-display font-bold text-foreground">Study Tools</h1>
        <p className="text-muted-foreground text-sm mt-1">AI-powered tools to supercharge your learning</p>
      </motion.header>

      <div className="grid grid-cols-2 gap-3">
        {studyTools.map((tool, index) => (
          <Link key={tool.label} to={tool.path}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="p-4 rounded-2xl border border-border/50 bg-card"
              style={{ background: `linear-gradient(135deg, ${tool.color}10 0%, transparent 100%)` }}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-2" style={{ backgroundColor: `${tool.color}20` }}>
                <tool.icon size={20} style={{ color: tool.color }} />
              </div>
              <h3 className="font-semibold text-foreground text-sm">{tool.label}</h3>
              <p className="text-xs text-muted-foreground">{tool.description}</p>
            </motion.div>
          </Link>
        ))}
      </div>

      <h2 className="text-lg font-display font-semibold text-foreground pt-2">AI Tools</h2>

      <div className="grid grid-cols-2 gap-3">
        {aiTools.map((tool, index) => (
          <motion.button
            key={tool.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveTool(tool.id as ToolType)}
            className="p-4 rounded-2xl bg-card border border-border text-left hover:border-primary/50 transition-all"
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-2" style={{ backgroundColor: `${tool.color}20` }}>
              <tool.icon size={20} style={{ color: tool.color }} />
            </div>
            <h3 className="font-semibold text-foreground text-sm">{tool.label}</h3>
            <p className="text-xs text-muted-foreground">{tool.description}</p>
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default Study;
