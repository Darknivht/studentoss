import { useState, useEffect } from 'react';
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
import MultiSubjectCBT from '@/components/exam-prep/MultiSubjectCBT';
import YearSelector from '@/components/exam-prep/YearSelector';
import BookmarkedQuestions from '@/components/exam-prep/BookmarkedQuestions';
import StudyPlanView from '@/components/exam-prep/StudyPlanView';
import FeatureGateDialog from '@/components/subscription/FeatureGateDialog';
import { useSubscription } from '@/hooks/useSubscription';

interface SelectedExam {
  id: string;
  name: string;
  exam_mode: string;
  subjects_required: number;
  time_limit_minutes: number;
  questions_per_subject: number;
}

interface SelectedSubject {
  id: string;
  name: string;
}

type View = 'exams' | 'subjects' | 'topic-select' | 'year-select' | 'practice' | 'mock' | 'performance' | 'weakness' | 'multi-cbt' | 'bookmarks' | 'study-plan';

const ExamPrep = () => {
  const navigate = useNavigate();
  const { subscription, loading: subLoading } = useSubscription();
  const [view, setView] = useState<View>('exams');
  const [exam, setExam] = useState<SelectedExam | null>(null);
  const [subject, setSubject] = useState<SelectedSubject | null>(null);
  const [topicId, setTopicId] = useState<string | undefined>();
  const [year, setYear] = useState<string | undefined>();
  const [source, setSource] = useState<string | undefined>();
  const [gateOpen, setGateOpen] = useState(false);

  useEffect(() => {
    if (!subLoading && subscription.tier === 'free') {
      setGateOpen(true);
    }
  }, [subLoading, subscription.tier]);

  const resetToSubjects = () => {
    setView('subjects');
    setTopicId(undefined);
    setYear(undefined);
    setSource(undefined);
  };

  const resetToExams = () => {
    setView('exams');
    setExam(null);
    setSubject(null);
    setTopicId(undefined);
    setYear(undefined);
    setSource(undefined);
  };

  return (
    <div className="p-6 space-y-5 pb-24">
      <motion.header initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
        {view === 'exams' ? (
          <button onClick={() => navigate('/')} className="text-primary">
            <ArrowLeft size={20} />
          </button>
        ) : (
          <button onClick={view === 'subjects' || view === 'multi-cbt' ? resetToExams : resetToSubjects} className="text-primary">
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
        <ExamSelector onSelect={(e) => {
          const selectedExam: SelectedExam = {
            id: e.id,
            name: e.name,
            exam_mode: e.exam_mode || 'per_subject',
            subjects_required: e.subjects_required || 1,
            time_limit_minutes: e.time_limit_minutes || 60,
            questions_per_subject: e.questions_per_subject || 40,
          };
          setExam(selectedExam);
          setView('subjects');
        }} />
      )}

      {view === 'multi-cbt' && exam && (
        <MultiSubjectCBT
          examTypeId={exam.id}
          examName={exam.name}
          subjectsRequired={exam.subjects_required}
          timeLimitMinutes={exam.time_limit_minutes}
          questionsPerSubject={exam.questions_per_subject}
          onBack={resetToSubjects}
        />
      )}

      {view === 'subjects' && exam && (
        <SubjectSelector
          examTypeId={exam.id}
          examName={exam.name}
          examMode={exam.exam_mode}
          onSelectMode={(subj, mode) => {
            setSubject({ id: subj.id, name: subj.name });
            if (mode === 'quick') setView('practice');
            else if (mode === 'topic') setView('topic-select');
            else if (mode === 'mock') setView('mock');
            else if (mode === 'performance') setView('performance');
            else if (mode === 'weakness') setView('weakness');
            else if (mode === 'year') setView('year-select');
            else if (mode === 'bookmarks') setView('bookmarks');
            else if (mode === 'study-plan') setView('study-plan');
            else if (mode === 'study-material') {
              setSource('pdf_extracted');
              setView('practice');
            }
          }}
          onStartCBT={() => setView('multi-cbt')}
        />
      )}

      {view === 'year-select' && exam && subject && (
        <YearSelector
          examTypeId={exam.id}
          subjectId={subject.id}
          subjectName={subject.name}
          onSelect={(y) => {
            setYear(y || undefined);
            setView('practice');
          }}
          onBack={resetToSubjects}
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
          year={year}
          source={source}
          questionCount={10}
          onBack={resetToSubjects}
          onRetryTopic={(tId) => { setTopicId(tId); setSource(undefined); setYear(undefined); }}
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

      {view === 'bookmarks' && exam && subject && (
        <BookmarkedQuestions
          examTypeId={exam.id}
          subjectId={subject.id}
          subjectName={subject.name}
          onBack={resetToSubjects}
        />
      )}

      {view === 'study-plan' && exam && subject && (
        <StudyPlanView
          examTypeId={exam.id}
          subjectId={subject.id}
          subjectName={subject.name}
          onBack={resetToSubjects}
        />
      )}

      <FeatureGateDialog
        open={gateOpen}
        onOpenChange={(open) => {
          setGateOpen(open);
          if (!open && subscription.tier === 'free') navigate('/');
        }}
        feature="Exam Prep access"
        currentUsage={0}
        limit={0}
        requiredTier="plus"
      />
    </div>
  );
};

export default ExamPrep;
