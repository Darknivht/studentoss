import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { format, addHours, addMinutes, setHours, setMinutes } from 'date-fns';
import { Moon, Sun, Clock, Zap, AlertTriangle } from 'lucide-react';

const SleepCalculator = () => {
  const [wakeUpHour, setWakeUpHour] = useState(7);
  const [wakeUpMinute, setWakeUpMinute] = useState(0);
  const [targetSleepHours, setTargetSleepHours] = useState(8);
  const [calculatedTimes, setCalculatedTimes] = useState<Date[]>([]);

  const calculateSleepTimes = () => {
    const now = new Date();
    let wakeUpTime = setHours(setMinutes(now, wakeUpMinute), wakeUpHour);
    
    // If wake up time is in the past today, set it for tomorrow
    if (wakeUpTime <= now) {
      wakeUpTime = addHours(wakeUpTime, 24);
    }

    // Calculate optimal sleep times based on 90-minute sleep cycles
    // Average time to fall asleep is 14 minutes
    const fallAsleepTime = 14;
    const sleepCycle = 90;

    const times: Date[] = [];
    
    // Calculate for 4, 5, 6, and 7.5 hour sleeps (common optimal times)
    [4, 5, 6].forEach(cycles => {
      const totalSleepMinutes = cycles * sleepCycle;
      const bedtime = addMinutes(wakeUpTime, -(totalSleepMinutes + fallAsleepTime));
      times.push(bedtime);
    });

    setCalculatedTimes(times.reverse());
  };

  const formatTime = (date: Date) => {
    return format(date, 'h:mm a');
  };

  const getSleepHours = (bedtime: Date) => {
    const now = new Date();
    let wakeUp = setHours(setMinutes(now, wakeUpMinute), wakeUpHour);
    if (wakeUp <= now) wakeUp = addHours(wakeUp, 24);
    
    const diff = (wakeUp.getTime() - bedtime.getTime()) / (1000 * 60 * 60);
    return Math.round(diff * 10) / 10;
  };

  const isCurrentlyStudyTime = (bedtime: Date) => {
    return new Date() < bedtime;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Moon className="w-5 h-5 text-indigo-500" />
        <h3 className="font-display font-semibold">Sleep Calculator</h3>
      </div>

      <div className="p-4 rounded-xl bg-card border border-border space-y-4">
        <div className="space-y-3">
          <Label className="flex items-center gap-2">
            <Sun className="w-4 h-4 text-yellow-500" />
            I need to wake up at:
          </Label>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <p className="text-sm text-muted-foreground mb-1">Hour</p>
              <Slider
                value={[wakeUpHour]}
                onValueChange={([v]) => setWakeUpHour(v)}
                min={4}
                max={12}
                step={1}
              />
              <p className="text-center font-bold mt-1">{wakeUpHour}:00</p>
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground mb-1">Minute</p>
              <Slider
                value={[wakeUpMinute]}
                onValueChange={([v]) => setWakeUpMinute(v)}
                min={0}
                max={45}
                step={15}
              />
              <p className="text-center font-bold mt-1">:{wakeUpMinute.toString().padStart(2, '0')}</p>
            </div>
          </div>
          <p className="text-center text-lg font-display">
            Wake up: {wakeUpHour}:{wakeUpMinute.toString().padStart(2, '0')} AM
          </p>
        </div>

        <div className="space-y-3">
          <Label className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            Target sleep: {targetSleepHours} hours
          </Label>
          <Slider
            value={[targetSleepHours]}
            onValueChange={([v]) => setTargetSleepHours(v)}
            min={6}
            max={9}
            step={0.5}
          />
        </div>

        <Button onClick={calculateSleepTimes} className="w-full">
          Calculate Bedtimes
        </Button>
      </div>

      {calculatedTimes.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          <p className="text-sm text-muted-foreground">
            Go to bed at one of these times to wake up feeling refreshed:
          </p>

          {calculatedTimes.map((bedtime, idx) => {
            const sleepHours = getSleepHours(bedtime);
            const isOptimal = sleepHours >= 7 && sleepHours <= 9;
            const canStudyMore = isCurrentlyStudyTime(bedtime);
            const hoursUntilBed = (bedtime.getTime() - new Date().getTime()) / (1000 * 60 * 60);

            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className={`p-4 rounded-xl border ${
                  isOptimal 
                    ? 'bg-green-500/10 border-green-500/30' 
                    : sleepHours < 6 
                    ? 'bg-red-500/10 border-red-500/30'
                    : 'bg-card border-border'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      isOptimal ? 'bg-green-500/20' : 'bg-muted'
                    }`}>
                      <Moon className={`w-5 h-5 ${isOptimal ? 'text-green-500' : 'text-muted-foreground'}`} />
                    </div>
                    <div>
                      <p className="font-bold text-lg">{formatTime(bedtime)}</p>
                      <p className="text-sm text-muted-foreground">
                        {sleepHours} hours of sleep ({Math.round(sleepHours / 1.5)} cycles)
                      </p>
                    </div>
                  </div>
                  {isOptimal && <Zap className="w-5 h-5 text-green-500" />}
                  {sleepHours < 6 && <AlertTriangle className="w-5 h-5 text-red-500" />}
                </div>

                {canStudyMore && hoursUntilBed > 0 && (
                  <div className="mt-3 pt-3 border-t border-border/50">
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      You have {Math.floor(hoursUntilBed)} hours {Math.round((hoursUntilBed % 1) * 60)} minutes left to study
                    </p>
                  </div>
                )}
              </motion.div>
            );
          })}

          <div className="p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">
            <p className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              <strong>Pro tip:</strong> Sleep cycles last ~90 minutes. Waking up between cycles helps you feel more refreshed!
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default SleepCalculator;
