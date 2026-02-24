import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  BookOpen, Brain, FileText, Sparkles, Timer, Calculator, 
  Sigma, Microscope, Bug, Languages, Youtube, Mic, Zap, 
  ClipboardList, GraduationCap, Lightbulb, Volume2, MessageCircle,
  Swords, FileCheck, Network, Shield, Quote, Search, Target
} from 'lucide-react';
import MathSolver from '@/components/ai-tools/MathSolver';
import OCRToLatex from '@/components/ai-tools/OCRToLatex';
import DiagramInterpreter from '@/components/ai-tools/DiagramInterpreter';
import CodeDebugger from '@/components/ai-tools/CodeDebugger';
import LanguageTranslator from '@/components/ai-tools/LanguageTranslator';
import YouTubeSummarizer from '@/components/ai-tools/YouTubeSummarizer';
import BookScanner from '@/components/ai-tools/BookScanner';
import LectureRecorder from '@/components/ai-tools/LectureRecorder';
import FillBlanks from '@/components/study/FillBlanks';
import MockExam from '@/components/study/MockExam';
import CramMode from '@/components/study/CramMode';
import MnemonicGenerator from '@/components/study/MnemonicGenerator';
import AudioNotes from '@/components/study/AudioNotes';
import VoiceMode from '@/components/study/VoiceMode';
import DebatePartner from '@/components/study/DebatePartner';
import CheatSheetCreator from '@/components/study/CheatSheetCreator';
import ConceptLinking from '@/components/study/ConceptLinking';
import EssayGrader from '@/components/academic/EssayGrader';
import PlagiarismChecker from '@/components/academic/PlagiarismChecker';
import CitationMachine from '@/components/academic/CitationMachine';
import BibliographyBuilder from '@/components/academic/BibliographyBuilder';
import ResearchAssistant from '@/components/academic/ResearchAssistant';
import ThesisGenerator from '@/components/academic/ThesisGenerator';
import DailyChallenges from '@/components/gamification/DailyChallenges';

type ToolType = 'math' | 'latex' | 'diagram' | 'code' | 'translate' | 'youtube' | 'book' | 'lecture' | 'fillblanks' | 'mockexam' | 'cram' | 'mnemonic' | 'audio' | 'voice' | 'debate' | 'cheatsheet' | 'concept' | 'essay' | 'plagiarism' | 'citation' | 'bibliography' | 'research' | 'thesis' | null;

const studyTools = [
  { icon: FileText, label: 'Smart Notes', description: 'Upload & AI summaries', color: '#8B5CF6', path: '/notes' },
  { icon: Brain, label: 'AI Tutor', description: 'Socratic learning', color: '#0EA5E9', path: '/tutor' },
  { icon: Sparkles, label: 'Flashcards', description: 'Spaced repetition', color: '#10B981', path: '/flashcards' },
  { icon: BookOpen, label: 'Quizzes', description: 'Test yourself', color: '#F59E0B', path: '/quizzes' },
  { icon: Timer, label: 'Focus Timer', description: 'Pomodoro sessions', color: '#EC4899', path: '/focus' },
];

const studyModes = [
  { id: 'fillblanks', icon: ClipboardList, label: 'Fill in Blanks', description: 'AI removes key terms', color: '#8b5cf6' },
  { id: 'mockexam', icon: GraduationCap, label: 'Mock Exam', description: 'Timed tests', color: '#ef4444' },
  { id: 'cram', icon: Zap, label: 'Cram Mode', description: 'Rapid-fire review', color: '#f59e0b' },
  { id: 'mnemonic', icon: Lightbulb, label: 'Mnemonics', description: 'Memory tricks', color: '#10b981' },
  { id: 'audio', icon: Volume2, label: 'Audio Notes', description: 'Listen to summaries', color: '#3b82f6' },
  { id: 'voice', icon: MessageCircle, label: 'Voice Mode', description: 'Talk to AI tutor', color: '#ec4899' },
  { id: 'debate', icon: Swords, label: 'Debate Partner', description: 'AI argues opposite', color: '#6366f1' },
  { id: 'cheatsheet', icon: FileText, label: 'Cheat Sheets', description: 'Printable guides', color: '#14b8a6' },
  { id: 'concept', icon: Network, label: 'Mind Maps', description: 'Link concepts', color: '#8b5cf6' },
];

const academicTools = [
  { id: 'essay', icon: FileCheck, label: 'Essay Grader', description: 'Rubric feedback', color: '#6366f1' },
  { id: 'plagiarism', icon: Shield, label: 'Plagiarism Check', description: 'Originality scan', color: '#ef4444' },
  { id: 'citation', icon: Quote, label: 'Citations', description: 'APA/MLA format', color: '#f59e0b' },
  { id: 'bibliography', icon: BookOpen, label: 'Bibliography', description: 'Reference lists', color: '#10b981' },
  { id: 'research', icon: Search, label: 'Research Help', description: 'Find papers', color: '#3b82f6' },
  { id: 'thesis', icon: Lightbulb, label: 'Thesis Builder', description: 'Refine arguments', color: '#ec4899' },
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
  const [challengeRefreshKey, setChallengeRefreshKey] = useState(0);

  const toolMap: Record<string, JSX.Element> = {
    math: <MathSolver onBack={() => setActiveTool(null)} />,
    latex: <OCRToLatex onBack={() => setActiveTool(null)} />,
    diagram: <DiagramInterpreter onBack={() => setActiveTool(null)} />,
    code: <CodeDebugger onBack={() => setActiveTool(null)} />,
    translate: <LanguageTranslator onBack={() => setActiveTool(null)} />,
    youtube: <YouTubeSummarizer onBack={() => setActiveTool(null)} />,
    book: <BookScanner onBack={() => setActiveTool(null)} />,
    lecture: <LectureRecorder onBack={() => setActiveTool(null)} />,
    fillblanks: <FillBlanks onBack={() => setActiveTool(null)} />,
    mockexam: <MockExam onBack={() => setActiveTool(null)} />,
    cram: <CramMode onBack={() => setActiveTool(null)} />,
    mnemonic: <MnemonicGenerator onBack={() => setActiveTool(null)} />,
    audio: <AudioNotes onBack={() => setActiveTool(null)} />,
    voice: <VoiceMode onBack={() => setActiveTool(null)} />,
    debate: <DebatePartner onBack={() => setActiveTool(null)} />,
    cheatsheet: <CheatSheetCreator onBack={() => setActiveTool(null)} />,
    concept: <ConceptLinking onBack={() => setActiveTool(null)} />,
    essay: <EssayGrader onBack={() => setActiveTool(null)} />,
    plagiarism: <PlagiarismChecker onBack={() => setActiveTool(null)} />,
    citation: <CitationMachine onBack={() => setActiveTool(null)} />,
    bibliography: <BibliographyBuilder onBack={() => setActiveTool(null)} />,
    research: <ResearchAssistant onBack={() => setActiveTool(null)} />,
    thesis: <ThesisGenerator onBack={() => setActiveTool(null)} />,
  };

  if (activeTool && toolMap[activeTool]) return toolMap[activeTool];

  const ToolGrid = ({ tools, onClick }: { tools: typeof aiTools; onClick: (id: string) => void }) => (
    <div className="grid grid-cols-2 gap-3">
      {tools.map((tool, index) => (
        <motion.button key={tool.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }} whileTap={{ scale: 0.98 }} onClick={() => onClick(tool.id)} className="p-4 rounded-2xl bg-card border border-border text-left hover:border-primary/50 transition-all">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-2" style={{ backgroundColor: `${tool.color}20` }}>
            <tool.icon size={20} style={{ color: tool.color }} />
          </div>
          <h3 className="font-semibold text-foreground text-sm">{tool.label}</h3>
          <p className="text-xs text-muted-foreground">{tool.description}</p>
        </motion.button>
      ))}
    </div>
  );

  return (
    <div className="p-6 space-y-6 pb-24">
      <motion.header initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-display font-bold text-foreground">Study Tools</h1>
        <p className="text-muted-foreground text-sm mt-1">AI-powered tools to supercharge your learning</p>
      </motion.header>

      <DailyChallenges compact refreshKey={challengeRefreshKey} />

      <div className="grid grid-cols-2 gap-3">
        {studyTools.map((tool, index) => (
          <Link key={tool.label} to={tool.path}>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }} whileTap={{ scale: 0.98 }} className="p-4 rounded-2xl border border-border/50 bg-card" style={{ background: `linear-gradient(135deg, ${tool.color}10 0%, transparent 100%)` }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-2" style={{ backgroundColor: `${tool.color}20` }}>
                <tool.icon size={20} style={{ color: tool.color }} />
              </div>
              <h3 className="font-semibold text-foreground text-sm">{tool.label}</h3>
              <p className="text-xs text-muted-foreground">{tool.description}</p>
            </motion.div>
          </Link>
        ))}
      </div>

      <h2 className="text-lg font-display font-semibold text-foreground pt-2">Study Modes</h2>
      <ToolGrid tools={studyModes} onClick={(id) => setActiveTool(id as ToolType)} />

      <h2 className="text-lg font-display font-semibold text-foreground pt-2">Academic Tools</h2>
      <ToolGrid tools={academicTools} onClick={(id) => setActiveTool(id as ToolType)} />

      <h2 className="text-lg font-display font-semibold text-foreground pt-2">AI Tools</h2>
      <ToolGrid tools={aiTools} onClick={(id) => setActiveTool(id as ToolType)} />
    </div>
  );
};

export default Study;
