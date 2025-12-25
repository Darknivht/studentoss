import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import CourseCard from '@/components/dashboard/CourseCard';
import AddCourseDialog from '@/components/dashboard/AddCourseDialog';
import StatsCard from '@/components/dashboard/StatsCard';
import StreakCard from '@/components/dashboard/StreakCard';
import { BookOpen, Clock, Brain, Zap, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Course {
  id: string;
  name: string;
  icon: string;
  color: string;
  progress: number;
}

interface Profile {
  full_name: string | null;
  total_xp: number;
  current_streak: number;
  longest_streak: number;
}

const Dashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      // Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name, total_xp, current_streak, longest_streak')
        .eq('user_id', user?.id)
        .single();

      if (profileData) {
        setProfile(profileData);
      }

      // Fetch courses
      const { data: coursesData } = await supabase
        .from('courses')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: true });

      if (coursesData) {
        setCourses(coursesData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCourse = async (name: string, color: string, icon: string) => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .insert({
          user_id: user?.id,
          name,
          color,
          icon,
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setCourses([...courses, data]);
        toast({
          title: 'Course added! 📚',
          description: `${name} has been added to your dashboard.`,
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add course. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteCourse = async (id: string) => {
    try {
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setCourses(courses.filter((c) => c.id !== id));
      toast({
        title: 'Course deleted',
        description: 'The course has been removed from your dashboard.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete course. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const firstName = profile?.full_name?.split(' ')[0] || 'Student';

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <p className="text-muted-foreground text-sm">{getGreeting()}</p>
          <h1 className="text-2xl font-display font-bold text-foreground">
            {firstName} 👋
          </h1>
        </div>
        <Link 
          to="/profile"
          className="w-10 h-10 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
        >
          <Settings size={20} className="text-muted-foreground" />
        </Link>
      </motion.header>

      {/* Streak Card */}
      <StreakCard
        currentStreak={profile?.current_streak || 0}
        longestStreak={profile?.longest_streak || 0}
        totalXP={profile?.total_xp || 0}
      />

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3">
        <StatsCard
          icon={BookOpen}
          label="Courses"
          value={courses.length}
          color="#8B5CF6"
          index={0}
        />
        <StatsCard
          icon={Clock}
          label="Study Hours"
          value="0h"
          color="#0EA5E9"
          index={1}
        />
        <StatsCard
          icon={Brain}
          label="Cards Reviewed"
          value={0}
          color="#10B981"
          index={2}
        />
        <StatsCard
          icon={Zap}
          label="Quizzes Taken"
          value={0}
          color="#F59E0B"
          index={3}
        />
      </div>

      {/* Courses Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-display font-semibold text-foreground">
            My Courses
          </h2>
          <span className="text-sm text-muted-foreground">
            {courses.length} {courses.length === 1 ? 'course' : 'courses'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {courses.map((course, index) => (
            <CourseCard
              key={course.id}
              id={course.id}
              name={course.name}
              icon={course.icon}
              color={course.color}
              progress={course.progress}
              onDelete={handleDeleteCourse}
              onClick={() => {}}
              index={index}
            />
          ))}
          <AddCourseDialog onAdd={handleAddCourse} />
        </div>
      </section>

      {/* Empty state helper */}
      {courses.length === 0 && !loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center py-8"
        >
          <p className="text-muted-foreground text-sm">
            Start by adding your first course! 🎓
          </p>
        </motion.div>
      )}
    </div>
  );
};

export default Dashboard;