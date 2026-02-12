import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { BookOpen, Brain, Layers, Clock, Trophy, Users, Rocket, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

const slides = [
  {
    title: 'Welcome to StudentOS',
    description: 'The smartest way to study. Built by students, for students.',
    icon: BookOpen,
    bg: 'from-violet-600 via-purple-600 to-indigo-700',
    iconBg: 'from-violet-400 to-purple-500',
    particles: ['#A78BFA', '#C4B5FD', '#818CF8'],
  },
  {
    title: 'AI-Powered Learning',
    description: 'Smart notes, AI tutor, math solver — AI that actually understands your homework.',
    icon: Brain,
    bg: 'from-blue-600 via-cyan-600 to-teal-600',
    iconBg: 'from-blue-400 to-cyan-400',
    particles: ['#67E8F9', '#22D3EE', '#06B6D4'],
  },
  {
    title: 'Never Forget Again',
    description: 'Spaced-repetition flashcards and quizzes that adapt to how you learn.',
    icon: Layers,
    bg: 'from-emerald-600 via-green-600 to-teal-600',
    iconBg: 'from-emerald-400 to-green-400',
    particles: ['#6EE7B7', '#34D399', '#10B981'],
  },
  {
    title: 'Stay in the Zone',
    description: 'Pomodoro timer, lofi radio, and app blocking to keep distractions away.',
    icon: Clock,
    bg: 'from-orange-500 via-amber-500 to-yellow-500',
    iconBg: 'from-orange-400 to-amber-400',
    particles: ['#FCD34D', '#FBBF24', '#F59E0B'],
  },
  {
    title: 'Track Your Growth',
    description: 'Streaks, XP, levels, and achievements — watch yourself level up every day.',
    icon: Trophy,
    bg: 'from-pink-600 via-rose-500 to-red-500',
    iconBg: 'from-pink-400 to-rose-400',
    particles: ['#FDA4AF', '#FB7185', '#F43F5E'],
  },
  {
    title: 'Study Together',
    description: 'Join study groups, challenge friends, and climb the global leaderboard.',
    icon: Users,
    bg: 'from-indigo-600 via-blue-600 to-violet-600',
    iconBg: 'from-indigo-400 to-blue-400',
    particles: ['#A5B4FC', '#818CF8', '#6366F1'],
  },
  {
    title: 'Ready to Begin?',
    description: 'Join thousands of students already crushing their goals with StudentOS.',
    icon: Rocket,
    bg: 'from-fuchsia-600 via-purple-600 to-violet-700',
    iconBg: 'from-fuchsia-400 to-purple-500',
    particles: ['#E879F9', '#D946EF', '#C026D3'],
  },
];

const swipeThreshold = 8000;
const swipePower = (offset: number, velocity: number) => Math.abs(offset) * velocity;

const FloatingParticles = ({ colors }: { colors: string[] }) => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {Array.from({ length: 20 }).map((_, i) => (
      <motion.div
        key={i}
        className="absolute rounded-full"
        style={{
          width: Math.random() * 6 + 3,
          height: Math.random() * 6 + 3,
          backgroundColor: colors[i % colors.length],
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          opacity: 0.4,
        }}
        animate={{
          y: [0, -30 - Math.random() * 40, 0],
          x: [0, (Math.random() - 0.5) * 30, 0],
          opacity: [0.2, 0.6, 0.2],
          scale: [1, 1.3, 1],
        }}
        transition={{
          duration: 3 + Math.random() * 4,
          repeat: Infinity,
          delay: Math.random() * 3,
          ease: 'easeInOut',
        }}
      />
    ))}
  </div>
);

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 300 : -300, opacity: 0, scale: 0.9 }),
  center: { x: 0, opacity: 1, scale: 1 },
  exit: (dir: number) => ({ x: dir < 0 ? 300 : -300, opacity: 0, scale: 0.9 }),
};

const Onboarding = () => {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(0);
  const navigate = useNavigate();
  const isLast = current === slides.length - 1;
  const slide = slides[current];
  const Icon = slide.icon;

  const paginate = useCallback((dir: number) => {
    const next = current + dir;
    if (next < 0 || next >= slides.length) return;
    setDirection(dir);
    setCurrent(next);
  }, [current]);

  const finish = useCallback(() => {
    localStorage.setItem('onboarding_seen', 'true');
    navigate('/auth');
  }, [navigate]);

  const handleDragEnd = (_: any, { offset, velocity }: PanInfo) => {
    const swipe = swipePower(offset.x, velocity.x);
    if (swipe < -swipeThreshold) paginate(1);
    else if (swipe > swipeThreshold) paginate(-1);
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br ${slide.bg} flex flex-col items-center justify-between relative overflow-hidden transition-all duration-700`}>
      <FloatingParticles colors={slide.particles} />

      {/* Top bar: progress + skip */}
      <div className="w-full px-6 pt-8 pb-4 z-10">
        {/* Progress bar */}
        <div className="h-1 bg-white/20 rounded-full overflow-hidden mb-4">
          <motion.div
            className="h-full bg-white/80 rounded-full"
            animate={{ width: `${((current + 1) / slides.length) * 100}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
        <div className="flex justify-end">
          <button onClick={finish} className="text-sm text-white/70 hover:text-white transition-colors font-medium">
            Skip
          </button>
        </div>
      </div>

      {/* Main slide content */}
      <div className="flex-1 flex items-center justify-center w-full max-w-md px-6 z-10">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={current}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: 'spring', stiffness: 250, damping: 28, opacity: { duration: 0.25 } }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={1}
            onDragEnd={handleDragEnd}
            className="flex flex-col items-center text-center gap-8 w-full cursor-grab active:cursor-grabbing select-none"
          >
            {/* Icon container with glow */}
            <motion.div className="relative">
              <motion.div
                className="absolute inset-0 rounded-[2rem] blur-2xl opacity-40"
                style={{ background: `linear-gradient(135deg, ${slide.particles[0]}, ${slide.particles[2]})` }}
                animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.5, 0.3] }}
                transition={{ duration: 3, repeat: Infinity }}
              />
              <motion.div
                className={`relative w-32 h-32 rounded-[2rem] bg-gradient-to-br ${slide.iconBg} flex items-center justify-center shadow-2xl`}
                initial={{ scale: 0.5, rotate: -15 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 180, delay: 0.1 }}
              >
                <Icon className="w-16 h-16 text-white drop-shadow-lg" />

                {/* Sparkle accents */}
                <motion.div
                  className="absolute -top-2 -right-2"
                  animate={{ rotate: [0, 20, 0], scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Sparkles className="w-6 h-6 text-white/80" />
                </motion.div>
              </motion.div>
            </motion.div>

            {/* First slide: show logo */}
            {current === 0 && (
              <motion.img
                src="/studentos-icon.png"
                alt="StudentOS"
                className="w-12 h-12 rounded-xl"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              />
            )}

            {/* Text */}
            <div className="space-y-3">
              <motion.h1
                className="text-3xl sm:text-4xl font-bold text-white drop-shadow-md"
                initial={{ y: 25, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.15 }}
              >
                {slide.title}
              </motion.h1>
              <motion.p
                className="text-white/80 text-base sm:text-lg leading-relaxed max-w-xs mx-auto"
                initial={{ y: 25, opacity: 0 }}
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
      <div className="w-full max-w-md px-6 pb-10 z-10 space-y-6">
        {/* Dot indicators */}
        <div className="flex items-center justify-center gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => { setDirection(i > current ? 1 : -1); setCurrent(i); }}
              className={`rounded-full transition-all duration-300 ${
                i === current
                  ? 'w-8 h-2.5 bg-white'
                  : 'w-2.5 h-2.5 bg-white/30 hover:bg-white/50'
              }`}
            />
          ))}
        </div>

        {/* Navigation buttons */}
        <div className="flex gap-3">
          {current > 0 && (
            <Button
              onClick={() => paginate(-1)}
              variant="ghost"
              className="h-12 px-5 text-base text-white/80 hover:text-white hover:bg-white/10 border border-white/20 rounded-2xl"
            >
              Back
            </Button>
          )}
          {isLast ? (
            <motion.div
              animate={{ boxShadow: ['0 0 0px rgba(255,255,255,0.3)', '0 0 25px rgba(255,255,255,0.5)', '0 0 0px rgba(255,255,255,0.3)'] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="rounded-2xl flex-1"
            >
              <Button
                onClick={finish}
                className="w-full h-14 text-lg font-bold bg-white text-purple-700 hover:bg-white/90 rounded-2xl shadow-xl"
              >
                Get Started <Rocket className="w-5 h-5 ml-2" />
              </Button>
            </motion.div>
          ) : (
            <Button
              onClick={() => paginate(1)}
              className="flex-1 h-12 text-base bg-white/20 hover:bg-white/30 text-white border border-white/20 backdrop-blur-sm rounded-2xl"
            >
              Next <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
