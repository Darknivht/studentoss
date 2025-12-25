import { motion } from 'framer-motion';
import { BookOpen, Brain, FileText, Sparkles, Mic, Calculator } from 'lucide-react';

const studyTools = [
  { icon: FileText, label: 'Smart Notes', description: 'Upload & organize notes', color: '#8B5CF6', soon: false },
  { icon: Brain, label: 'AI Tutor', description: 'Ask anything', color: '#0EA5E9', soon: false },
  { icon: Sparkles, label: 'Flashcards', description: 'Study with cards', color: '#10B981', soon: true },
  { icon: BookOpen, label: 'Quizzes', description: 'Test yourself', color: '#F59E0B', soon: true },
  { icon: Mic, label: 'Voice Mode', description: 'Talk to learn', color: '#EC4899', soon: true },
  { icon: Calculator, label: 'Math Solver', description: 'Solve equations', color: '#14B8A6', soon: true },
];

const Study = () => {
  return (
    <div className="p-6 space-y-6">
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-display font-bold text-foreground">Study Tools</h1>
        <p className="text-muted-foreground text-sm mt-1">
          AI-powered tools to supercharge your learning
        </p>
      </motion.header>

      <div className="grid grid-cols-2 gap-4">
        {studyTools.map((tool, index) => (
          <motion.div
            key={tool.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.02, y: -4 }}
            whileTap={{ scale: 0.98 }}
            className={`relative p-5 rounded-2xl border border-border/50 bg-card shadow-sm cursor-pointer transition-all ${
              tool.soon ? 'opacity-60' : ''
            }`}
            style={{ 
              background: `linear-gradient(135deg, ${tool.color}10 0%, transparent 100%)`,
            }}
          >
            {tool.soon && (
              <span className="absolute top-3 right-3 text-[10px] bg-muted px-2 py-0.5 rounded-full font-medium">
                Soon
              </span>
            )}
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center mb-3"
              style={{ backgroundColor: `${tool.color}20` }}
            >
              <tool.icon size={24} style={{ color: tool.color }} />
            </div>
            <h3 className="font-display font-semibold text-foreground">{tool.label}</h3>
            <p className="text-xs text-muted-foreground mt-1">{tool.description}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default Study;