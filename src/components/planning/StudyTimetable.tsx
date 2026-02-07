import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Calendar, Clock, BookOpen } from 'lucide-react';

interface ScheduleEntry {
  id: string;
  title: string;
  courseName?: string;
  courseColor?: string;
  dueDate: Date;
  dayOfWeek: number;
  hour: number;
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21];

const StudyTimetable = () => {
  const { user } = useAuth();
  const [entries, setEntries] = useState<ScheduleEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchSchedule();
  }, [user]);

  const fetchSchedule = async () => {
    if (!user) return;

    try {
      const now = new Date();
      const dayOfWeek = now.getDay();
      const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
      const weekStart = new Date(now.getFullYear(), now.getMonth(), diff);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);

      const { data: goals } = await supabase
        .from('study_goals')
        .select('id, title, due_date, course_id')
        .eq('user_id', user.id)
        .eq('completed', false)
        .gte('due_date', weekStart.toISOString())
        .lte('due_date', weekEnd.toISOString());

      if (goals && goals.length > 0) {
        const courseIds = [...new Set(goals.filter(g => g.course_id).map(g => g.course_id!))];
        const { data: courses } = courseIds.length > 0
          ? await supabase.from('courses').select('id, name, color').in('id', courseIds)
          : { data: [] };

        const courseMap = new Map(courses?.map(c => [c.id, c]));

        const mapped: ScheduleEntry[] = goals.map(g => {
          const date = new Date(g.due_date);
          const course = g.course_id ? courseMap.get(g.course_id) : null;
          let dow = date.getDay() - 1;
          if (dow < 0) dow = 6;
          return {
            id: g.id,
            title: g.title,
            courseName: course?.name,
            courseColor: course?.color || 'hsl(var(--primary))',
            dueDate: date,
            dayOfWeek: dow,
            hour: date.getHours() || 9,
          };
        });

        setEntries(mapped);
      }
    } catch (error) {
      console.error('Error fetching schedule:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEntriesForSlot = (day: number, hour: number) =>
    entries.filter(e => e.dayOfWeek === day && e.hour === hour);

  const today = new Date().getDay() - 1 < 0 ? 6 : new Date().getDay() - 1;

  if (loading) {
    return <div className="h-40 rounded-xl bg-muted animate-pulse" />;
  }

  return (
    <Card className="p-4 bg-card border-border">
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-foreground">Weekly Timetable</h3>
      </div>

      {entries.length === 0 ? (
        <div className="text-center py-6 text-muted-foreground">
          <Clock className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No goals this week</p>
          <p className="text-xs">Add study goals in the Schedule tab to see them here</p>
        </div>
      ) : (
        <div className="overflow-x-auto -mx-4 px-4">
          <div className="min-w-[600px]">
            {/* Day headers */}
            <div className="grid grid-cols-8 gap-1 mb-1">
              <div className="text-xs text-muted-foreground p-1" />
              {DAYS.map((day, i) => (
                <div
                  key={day}
                  className={`text-xs font-medium text-center p-1 rounded ${
                    i === today ? 'bg-primary/10 text-primary' : 'text-muted-foreground'
                  }`}
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Time slots */}
            {HOURS.map(hour => {
              const hasEntries = DAYS.some((_, dayIdx) => getEntriesForSlot(dayIdx, hour).length > 0);
              if (!hasEntries) return null;

              return (
                <div key={hour} className="grid grid-cols-8 gap-1 mb-1">
                  <div className="text-xs text-muted-foreground p-1 text-right">
                    {hour}:00
                  </div>
                  {DAYS.map((_, dayIdx) => {
                    const slotEntries = getEntriesForSlot(dayIdx, hour);
                    return (
                      <div key={dayIdx} className="min-h-[32px]">
                        {slotEntries.map(entry => (
                          <motion.div
                            key={entry.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-[10px] p-1 rounded truncate font-medium"
                            style={{
                              backgroundColor: `${entry.courseColor}20`,
                              color: entry.courseColor,
                              borderLeft: `2px solid ${entry.courseColor}`,
                            }}
                            title={entry.title}
                          >
                            {entry.title}
                          </motion.div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Card>
  );
};

export default StudyTimetable;
