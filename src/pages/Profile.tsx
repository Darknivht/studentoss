import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { LogOut, User, School, GraduationCap, Save, Sparkles, Trophy, ChevronRight } from 'lucide-react';

const STUDY_PERSONAS = [
  { id: 'chill', name: 'Chill Bro', emoji: '😎', description: 'Relaxed and encouraging' },
  { id: 'strict', name: 'Strict Prof', emoji: '👨‍🏫', description: 'Disciplined and focused' },
  { id: 'fun', name: 'Fun Tutor', emoji: '🎉', description: 'Playful and engaging' },
  { id: 'motivator', name: 'Motivator', emoji: '💪', description: 'Pumped and inspiring' },
];

const Profile = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [fullName, setFullName] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [gradeLevel, setGradeLevel] = useState('');
  const [studyPersona, setStudyPersona] = useState('chill');
  const [saving, setSaving] = useState(false);
  const [achievementCount, setAchievementCount] = useState(0);
  const [totalXP, setTotalXP] = useState(0);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchAchievementStats();
    }
  }, [user]);

  const fetchProfile = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user?.id)
      .single();

    if (data) {
      setFullName(data.full_name || '');
      setSchoolName(data.school_name || '');
      setGradeLevel(data.grade_level || '');
      setStudyPersona(data.study_persona || 'chill');
      setTotalXP(data.total_xp || 0);
    }
  };

  const fetchAchievementStats = async () => {
    const { count } = await supabase
      .from('user_achievements')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user?.id);
    
    setAchievementCount(count || 0);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          school_name: schoolName,
          grade_level: gradeLevel,
          study_persona: studyPersona,
        })
        .eq('user_id', user?.id);

      if (error) throw error;

      toast({
        title: 'Profile updated! ✨',
        description: 'Your changes have been saved.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update profile. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: 'Signed out',
      description: 'See you next time! 👋',
    });
  };

  return (
    <div className="p-6 space-y-6">
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-display font-bold text-foreground">Profile</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Customize your experience
        </p>
      </motion.header>

      {/* Profile Avatar */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center"
      >
        <div className="w-24 h-24 rounded-full gradient-primary flex items-center justify-center text-4xl glow-primary">
          {fullName ? fullName.charAt(0).toUpperCase() : '👤'}
        </div>
        <p className="text-muted-foreground text-sm mt-3">{user?.email}</p>
        <p className="text-primary font-semibold">{totalXP} XP</p>
      </motion.div>

      {/* Achievements Link */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Link to="/achievements">
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 flex items-center justify-between hover:bg-amber-500/20 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
                <Trophy className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Achievements</p>
                <p className="text-sm text-muted-foreground">{achievementCount} unlocked</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </div>
        </Link>
      </motion.div>

      {/* Profile Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <div>
          <Label htmlFor="fullName" className="flex items-center gap-2">
            <User size={14} />
            Full Name
          </Label>
          <Input
            id="fullName"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Alex Johnson"
            className="mt-1.5"
          />
        </div>

        <div>
          <Label htmlFor="school" className="flex items-center gap-2">
            <School size={14} />
            School Name
          </Label>
          <Input
            id="school"
            value={schoolName}
            onChange={(e) => setSchoolName(e.target.value)}
            placeholder="Lincoln High School"
            className="mt-1.5"
          />
        </div>

        <div>
          <Label htmlFor="grade" className="flex items-center gap-2">
            <GraduationCap size={14} />
            Grade Level
          </Label>
          <Input
            id="grade"
            value={gradeLevel}
            onChange={(e) => setGradeLevel(e.target.value)}
            placeholder="10th Grade / Sophomore"
            className="mt-1.5"
          />
        </div>
      </motion.div>

      {/* Study Persona */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Label className="flex items-center gap-2 mb-3">
          <Sparkles size={14} />
          AI Study Persona
        </Label>
        <div className="grid grid-cols-2 gap-3">
          {STUDY_PERSONAS.map((persona) => (
            <motion.button
              key={persona.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setStudyPersona(persona.id)}
              className={`p-4 rounded-xl border text-left transition-all ${
                studyPersona === persona.id
                  ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                  : 'border-border bg-card hover:bg-muted/50'
              }`}
            >
              <span className="text-2xl">{persona.emoji}</span>
              <p className="font-medium mt-2">{persona.name}</p>
              <p className="text-xs text-muted-foreground">{persona.description}</p>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-3 pt-4"
      >
        <Button
          onClick={handleSave}
          disabled={saving}
          className="w-full gradient-primary text-primary-foreground"
        >
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
        <Button
          variant="outline"
          onClick={handleSignOut}
          className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </motion.div>
    </div>
  );
};

export default Profile;