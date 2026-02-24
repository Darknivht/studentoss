import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ExamSelector from '@/components/exam-prep/ExamSelector';
import SubjectSelector from '@/components/exam-prep/SubjectSelector';
import PracticeSession from '@/components/exam-prep/PracticeSession';
import MockExamMode from '@/components/exam-prep/MockExamMode';
import ExamPerformance from '@/components/exam-prep/ExamPerformance';
import WeaknessReport from '@/components/exam-prep/WeaknessReport';
import TopicSelector from '@/components/exam-prep/TopicSelector';

interface SelectedExam {
  id: string;
  name: string;
}

interface SelectedSubject {
  id: string;
  name: string;
}

type View = 'exams' | 'subjects' | 'topic-select' | 'practice' | 'mock' | 'performance' | 'weakness';

const ExamPrep = () => {
  const navigate = useNavigate();
  const [view, setView] = useState<View>('exams');
  const [exam, setExam] = useState<SelectedExam | null>(null);
  const [subject, setSubject] = useState<SelectedSubject | null>(null);
  const [topicId, setTopicId] = useState<string | undefined>();

  const resetToSubjects = () => {
    setView('subjects');
    setTopicId(undefined);
  };

  const resetToExams = () => {
    setView('exams');
    setExam(null);
    setSubject(null);
    setTopicId(undefined);
  };

  return (
    <div className="p-6 space-y-5 pb-24">
      <motion.header initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
        {view !== 'exams' && (
          <button onClick={view === 'subjects' ? resetToExams : resetToSubjects} className="text-primary">
            <ArrowLeft size={20} />
          </button>
        )}
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Exam Prep</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {exam ? exam.name : 'Practice past questions & ace your exams'}
          </p>
        </div>
      </motion.header>

      {view === 'exams' && (
        <ExamSelector onSelect={(e) => { setExam({ id: e.id, name: e.name }); setView('subjects'); }} />
      )}

      {view === 'subjects' && exam && (
        <SubjectSelector
          examTypeId={exam.id}
          examName={exam.name}
          onSelectMode={(subj, mode) => {
            setSubject({ id: subj.id, name: subj.name });
            if (mode === 'quick') setView('practice');
            else if (mode === 'topic') setView('topic-select');
            else if (mode === 'mock') setView('mock');
            else if (mode === 'performance') setView('performance');
            else if (mode === 'weakness') setView('weakness');
          }}
        />
      )}

      {view === 'topic-select' && exam && subject && (
        <TopicSelector
          subjectId={subject.id}
          subjectName={subject.name}
          onSelect={(tId) => { setTopicId(tId); setView('practice'); }}
          onBack={resetToSubjects}
        />
      )}

      {view === 'practice' && exam && subject && (
        <PracticeSession
          examTypeId={exam.id}
          subjectId={subject.id}
          subjectName={subject.name}
          topicId={topicId}
          questionCount={10}
          onBack={resetToSubjects}
        />
      )}

      {view === 'mock' && exam && subject && (
        <MockExamMode
          examTypeId={exam.id}
          subjectId={subject.id}
          subjectName={subject.name}
          onBack={resetToSubjects}
        />
      )}

      {view === 'performance' && exam && subject && (
        <ExamPerformance
          examTypeId={exam.id}
          subjectId={subject.id}
          subjectName={subject.name}
          onBack={resetToSubjects}
        />
      )}

      {view === 'weakness' && exam && subject && (
        <WeaknessReport
          examTypeId={exam.id}
          subjectId={subject.id}
          subjectName={subject.name}
          onBack={resetToSubjects}
          onPracticeTopic={(tId) => { setTopicId(tId); setView('practice'); }}
        />
      )}
    </div>
  );
};

export default ExamPrep;
