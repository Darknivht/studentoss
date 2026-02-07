import { useState } from 'react';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Clock, TrendingUp } from 'lucide-react';
import SmartScheduler from '@/components/planning/SmartScheduler';
import WeaknessDetector from '@/components/planning/WeaknessDetector';
import StudyTimetable from '@/components/planning/StudyTimetable';
import SleepCalculator from '@/components/planning/SleepCalculator';
import LofiRadio from '@/components/planning/LofiRadio';
import ProgressTracker from '@/components/planning/ProgressTracker';
import PomodoroTimer from '@/components/study/PomodoroTimer';
import StreakCalendar from '@/components/study/StreakCalendar';

const MOTIVATIONAL_QUOTES = [
  "📚 The expert in anything was once a beginner.",
  "🧠 Your brain is a muscle — train it daily.",
  "🔥 Small progress is still progress.",
  "💪 Discipline is choosing what you want most over what you want now.",
  "🎯 Focus on progress, not perfection.",
];

const Plan = () => {
  const [activeTab, setActiveTab] = useState('schedule');
  const randomQuote = MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)];

  return (
    <div className="p-6 space-y-6 pb-24">
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-display font-bold text-foreground">Plan & Focus</h1>
        <p className="text-muted-foreground text-sm mt-1">{randomQuote}</p>
      </motion.header>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="schedule" className="flex items-center gap-1 text-xs">
            <Calendar className="w-4 h-4" />
            Schedule
          </TabsTrigger>
          <TabsTrigger value="focus" className="flex items-center gap-1 text-xs">
            <Clock className="w-4 h-4" />
            Focus
          </TabsTrigger>
          <TabsTrigger value="progress" className="flex items-center gap-1 text-xs">
            <TrendingUp className="w-4 h-4" />
            Progress
          </TabsTrigger>
        </TabsList>

        <TabsContent value="schedule" className="space-y-6">
          <StudyTimetable />
          <SmartScheduler />
          <WeaknessDetector />
        </TabsContent>

        <TabsContent value="focus" className="space-y-6">
          <PomodoroTimer />
          <LofiRadio />
          <SleepCalculator />
        </TabsContent>

        <TabsContent value="progress" className="space-y-6">
          <StreakCalendar />
          <ProgressTracker />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Plan;
