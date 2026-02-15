import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format, addHours, addMinutes, setHours, setMinutes } from 'date-fns';
import { Moon, Sun, Clock, Zap, AlertTriangle, Coffee, BedDouble, Lightbulb } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { getEducationLevel } from '@/lib/educationConfig';

const CYCLE_MINUTES = 90;
const FALL_ASLEEP_MINUTES = 14;

const SleepCalculator = () => {
  const { user } = useAuth();
  const [wakeUpHour, setWakeUpHour] = useState(7);
  const [wakeUpMinute, setWakeUpMinute] = useState(0);
  const [isAM, setIsAM] = useState(true);
  const [calculatedTimes, setCalculatedTimes] = useState<{ bedtime: Date; cycles: number; hours: number }[]>([]);
  const [sleepNowTimes, setSleepNowTimes] = useState<{ wakeTime: Date; cycles: number; hours: number }[]>([]);
  const [recommendedHours, setRecommendedHours] = useState({ min: 7, max: 9 });
  const [mode, setMode] = useState<'wakeup' | 'sleepnow' | 'nap'>('wakeup');

  useEffect(() => {
    if (user) fetchGradeLevel();
  }, [user]);

  const fetchGradeLevel = async () => {
    const { data } = await supabase.from('profiles').select('grade_level').eq('user_id', user?.id).single();
    if (data?.grade_level) {
      const level = getEducationLevel(data.grade_level);
      if (level) setRecommendedHours(level.recommendedSleepHours);
    }
  };

  const get24Hour = () => {
    let h = wakeUpHour;
    if (!isAM && h < 12) h += 12;
    if (isAM && h === 12) h = 0;
    return h;
  };

  const calculateBedtimes = () => {
    const now = new Date();
    const hour24 = get24Hour();
    let wakeUpTime = setHours(setMinutes(now, wakeUpMinute), hour24);
    if (wakeUpTime <= now) wakeUpTime = addHours(wakeUpTime, 24);

    const times: { bedtime: Date; cycles: number; hours: number }[] = [];

    [3, 4, 5, 6, 7, 8].forEach(cycles => {
      const totalMin = cycles * CYCLE_MINUTES;
      const bedtime = addMinutes(wakeUpTime, -(totalMin + FALL_ASLEEP_MINUTES));
      const hours = Math.round((totalMin / 60) * 10) / 10;
      times.push({ bedtime, cycles, hours });
    });

    setCalculatedTimes(times.reverse());
  };

  const calculateSleepNow = () => {
    const now = new Date();
    const fallAsleep = addMinutes(now, FALL_ASLEEP_MINUTES);
    const times: { wakeTime: Date; cycles: number; hours: number }[] = [];

    [3, 4, 5, 6, 7, 8].forEach(cycles => {
      const totalMin = cycles * CYCLE_MINUTES;
      const wakeTime = addMinutes(fallAsleep, totalMin);
      const hours = Math.round((totalMin / 60) * 10) / 10;
      times.push({ wakeTime, cycles, hours });
    });

    setSleepNowTimes(times);
  };

  const getNapTimes = () => {
    const now = new Date();
    return [
      { label: 'Power Nap', minutes: 20, wakeTime: addMinutes(now, 20 + 5), description: 'Quick recharge' },
      { label: 'Short Nap', minutes: 30, wakeTime: addMinutes(now, 30 + 5), description: 'Light refresh' },
      { label: 'Full Cycle', minutes: 90, wakeTime: addMinutes(now, 90 + 10), description: 'Deep restoration' },
    ];
  };

  const isOptimalSleep = (hours: number) => hours >= recommendedHours.min && hours <= recommendedHours.max;
  const formatTime = (date: Date) => format(date, 'h:mm a');

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Moon className="w-5 h-5 text-indigo-500" />
        <h3 className="font-display font-semibold">Sleep Calculator</h3>
      </div>

      {/* Age-based recommendation */}
      <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-sm">
        <p className="text-foreground flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-indigo-500" />
          Recommended: <strong>{recommendedHours.min}-{recommendedHours.max} hours</strong> per night
        </p>
      </div>

      <Tabs value={mode} onValueChange={(v) => setMode(v as any)}>
        <TabsList className="w-full grid grid-cols-3">
          <TabsTrigger value="wakeup" className="text-xs">
            <Sun className="w-3.5 h-3.5 mr-1" /> Wake Up
          </TabsTrigger>
          <TabsTrigger value="sleepnow" className="text-xs">
            <BedDouble className="w-3.5 h-3.5 mr-1" /> Sleep Now
          </TabsTrigger>
          <TabsTrigger value="nap" className="text-xs">
            <Coffee className="w-3.5 h-3.5 mr-1" /> Nap
          </TabsTrigger>
        </TabsList>

        {/* Wake Up Mode */}
        <TabsContent value="wakeup" className="space-y-4 mt-4">
          <div className="p-4 rounded-xl bg-card border border-border space-y-4">
            <Label className="flex items-center gap-2">
              <Sun className="w-4 h-4 text-yellow-500" />
              I need to wake up at:
            </Label>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <p className="text-sm text-muted-foreground mb-1">Hour</p>
                <Slider value={[wakeUpHour]} onValueChange={([v]) => setWakeUpHour(v)} min={1} max={12} step={1} />
                <p className="text-center font-bold mt-1">{wakeUpHour}</p>
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground mb-1">Minute</p>
                <Slider value={[wakeUpMinute]} onValueChange={([v]) => setWakeUpMinute(v)} min={0} max={45} step={15} />
                <p className="text-center font-bold mt-1">:{wakeUpMinute.toString().padStart(2, '0')}</p>
              </div>
            </div>
            <div className="flex items-center justify-center gap-2">
              <Button size="sm" variant={isAM ? 'default' : 'outline'} onClick={() => setIsAM(true)} className="w-16">AM</Button>
              <Button size="sm" variant={!isAM ? 'default' : 'outline'} onClick={() => setIsAM(false)} className="w-16">PM</Button>
            </div>
            <p className="text-center text-lg font-display">
              Wake up: {wakeUpHour}:{wakeUpMinute.toString().padStart(2, '0')} {isAM ? 'AM' : 'PM'}
            </p>
            <Button onClick={calculateBedtimes} className="w-full">Calculate Bedtimes</Button>
          </div>

          {calculatedTimes.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
              <p className="text-sm text-muted-foreground">Go to bed at one of these times:</p>
              {calculatedTimes.map((item, idx) => (
                <TimeCard key={idx} time={formatTime(item.bedtime)} hours={item.hours} cycles={item.cycles} isOptimal={isOptimalSleep(item.hours)} delay={idx * 0.05} />
              ))}
            </motion.div>
          )}
        </TabsContent>

        {/* Sleep Now Mode */}
        <TabsContent value="sleepnow" className="space-y-4 mt-4">
          <div className="p-4 rounded-xl bg-card border border-border">
            <p className="text-sm text-muted-foreground mb-3">Going to bed now? Here are optimal wake-up times:</p>
            <Button onClick={calculateSleepNow} className="w-full">Calculate Wake-Up Times</Button>
          </div>

          {sleepNowTimes.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
              {sleepNowTimes.map((item, idx) => (
                <TimeCard key={idx} time={formatTime(item.wakeTime)} hours={item.hours} cycles={item.cycles} isOptimal={isOptimalSleep(item.hours)} delay={idx * 0.05} isWakeUp />
              ))}
            </motion.div>
          )}
        </TabsContent>

        {/* Nap Mode */}
        <TabsContent value="nap" className="space-y-3 mt-4">
          <p className="text-sm text-muted-foreground">Quick nap calculator — set an alarm for:</p>
          {getNapTimes().map((nap, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="p-4 rounded-xl border border-border bg-card flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                  <Coffee className="w-5 h-5 text-indigo-500" />
                </div>
                <div>
                  <p className="font-bold text-foreground">{nap.label} ({nap.minutes}min)</p>
                  <p className="text-xs text-muted-foreground">{nap.description}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-foreground">{formatTime(nap.wakeTime)}</p>
                <p className="text-xs text-muted-foreground">Wake up</p>
              </div>
            </motion.div>
          ))}
        </TabsContent>
      </Tabs>

      {/* Tips */}
      <div className="p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground space-y-1">
        <p className="flex items-center gap-2 font-medium text-foreground">
          <Zap className="w-4 h-4 text-primary" /> Sleep Tips
        </p>
        <p>• Sleep cycles are ~90 minutes. Waking between cycles feels more refreshing.</p>
        <p>• It takes ~14 minutes to fall asleep on average.</p>
        <p>• Avoid screens 30 minutes before bed for better sleep quality.</p>
        <p>• Keep a consistent sleep schedule, even on weekends.</p>
      </div>
    </div>
  );
};

const TimeCard = ({ time, hours, cycles, isOptimal, delay, isWakeUp }: {
  time: string; hours: number; cycles: number; isOptimal: boolean; delay: number; isWakeUp?: boolean;
}) => (
  <motion.div
    initial={{ opacity: 0, x: -10 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay }}
    className={`p-4 rounded-xl border ${
      isOptimal ? 'bg-emerald-500/10 border-emerald-500/30' : hours < 6 ? 'bg-red-500/10 border-red-500/30' : 'bg-card border-border'
    }`}
  >
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isOptimal ? 'bg-emerald-500/20' : 'bg-muted'}`}>
          {isWakeUp ? <Sun className={`w-5 h-5 ${isOptimal ? 'text-emerald-500' : 'text-muted-foreground'}`} /> :
            <Moon className={`w-5 h-5 ${isOptimal ? 'text-emerald-500' : 'text-muted-foreground'}`} />}
        </div>
        <div>
          <p className="font-bold text-lg">{time}</p>
          <p className="text-sm text-muted-foreground">{hours}h ({cycles} cycles)</p>
        </div>
      </div>
      {isOptimal && <Zap className="w-5 h-5 text-emerald-500" />}
      {hours < 6 && <AlertTriangle className="w-5 h-5 text-red-500" />}
    </div>
  </motion.div>
);

export default SleepCalculator;
