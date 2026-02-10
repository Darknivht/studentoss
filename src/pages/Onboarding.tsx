import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { BookOpen, Brain, Target, Trophy, Users, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const slides = [
  {
    title: 'Welcome to StudentOS',
    description: 'Your AI-powered study companion that helps you learn smarter, not harder.',
    icon: BookOpen,
    gradient: 'from-primary to-accent',
  },
  {
    title: 'AI-Powered Learning',
    description: 'Smart notes, AI tutor, math solver, and more — all powered by AI to help you understand any subject.',
    icon: Brain,
    gradient: 'from-secondary to-primary',
  },
  {
    title: 'Stay Focused',
    description: 'Pomodoro timer, focus radio, and app blocking keep you on track during study sessions.',
    icon: Target,
    gradient: 'from-accent to-warning',
  },
  {
    title: 'Track Your Progress',
    description: 'Achievements, streaks, XP, and detailed stats to keep you motivated every day.',
    icon: Trophy,
    gradient: 'from-warning to-success',
  },
  {
    title: 'Study Together',
    description: 'Join study groups, challenge friends, and climb the leaderboard.',
    icon: Users,
    gradient: 'from-success to-secondary',
  },
];

const swipeConfidenceThreshold = 10000;
const swipePower = (offset: number, velocity: number) => Math.abs(offset) * velocity;

const variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({
    x: direction < 0 ? 300 : -300,
    opacity: 0,
  }),
};

const Onboarding = () => {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(0);
  const navigate = useNavigate();
  const isLast = current === slides.length - 1;

  const paginate = (newDirection: number) => {
    const next = current + newDirection;
    if (next < 0 || next >= slides.length) return;
    setDirection(newDirection);
    setCurrent(next);
  };

  const finish = () => {
    localStorage.setItem('onboarding_seen', 'true');
    navigate('/auth');
  };

  const handleDragEnd = (_: any, { offset, velocity }: PanInfo) => {
    const swipe = swipePower(offset.x, velocity.x);
    if (swipe < -swipeConfidenceThreshold) paginate(1);
    else if (swipe > swipeConfidenceThreshold) paginate(-1);
  };

  const slide = slides[current];
  const Icon = slide.icon;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-between px-6 py-12 overflow-hidden">
      {/* Skip */}
      <div className="w-full flex justify-end max-w-md">
        <button onClick={finish} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          Skip
        </button>
      </div>

      {/* Slide content */}
      <div className="flex-1 flex items-center justify-center w-full max-w-md">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={current}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ x: { type: 'spring', stiffness: 300, damping: 30 }, opacity: { duration: 0.2 } }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={1}
            onDragEnd={handleDragEnd}
            className="flex flex-col items-center text-center gap-8 w-full cursor-grab active:cursor-grabbing"
          >
            {/* Icon */}
            <motion.div
              className={`w-28 h-28 rounded-3xl bg-gradient-to-br ${slide.gradient} flex items-center justify-center shadow-lg`}
              initial={{ scale: 0.5, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
            >
              <Icon className="w-14 h-14 text-primary-foreground" />
            </motion.div>

            {/* Text */}
            <div className="space-y-3">
              <motion.h1
                className="text-2xl sm:text-3xl font-bold font-display text-foreground"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.15 }}
              >
                {slide.title}
              </motion.h1>
              <motion.p
                className="text-muted-foreground text-base sm:text-lg leading-relaxed max-w-xs mx-auto"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.25 }}
              >
                {slide.description}
              </motion.p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom controls */}
      <div className="w-full max-w-md space-y-6">
        {/* Dots */}
        <div className="flex items-center justify-center gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => { setDirection(i > current ? 1 : -1); setCurrent(i); }}
              className={`rounded-full transition-all duration-300 ${
                i === current
                  ? 'w-8 h-2.5 bg-primary'
                  : 'w-2.5 h-2.5 bg-muted-foreground/30 hover:bg-muted-foreground/50'
              }`}
            />
          ))}
        </div>

        {/* Button */}
        <Button
          onClick={isLast ? finish : () => paginate(1)}
          className="w-full h-12 text-base gradient-primary text-primary-foreground rounded-xl"
        >
          {isLast ? 'Get Started' : 'Next'}
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </div>
    </div>
  );
};

export default Onboarding;
