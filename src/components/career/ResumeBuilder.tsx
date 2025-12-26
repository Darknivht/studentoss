import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { streamAIChat } from '@/lib/ai';
import { FileText, Plus, Trash2, Download, Sparkles, Briefcase, Award, GraduationCap } from 'lucide-react';

interface Skill {
  name: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  source: string;
}

const ResumeBuilder = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [skills, setSkills] = useState<Skill[]>([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [summary, setSummary] = useState('');
  const [generating, setGenerating] = useState(false);
  const [coursesCompleted, setCoursesCompleted] = useState<string[]>([]);

  useEffect(() => {
    if (user) {
      fetchLearnedSkills();
    }
  }, [user]);

  const fetchLearnedSkills = async () => {
    try {
      // Fetch user's courses with progress
      const { data: courses } = await supabase
        .from('courses')
        .select('name, progress')
        .eq('user_id', user?.id)
        .gte('progress', 50);

      if (courses) {
        const autoSkills: Skill[] = courses.map((c) => ({
          name: c.name,
          level: c.progress >= 90 ? 'Advanced' : c.progress >= 70 ? 'Intermediate' : 'Beginner',
          source: 'Course',
        }));
        setSkills(autoSkills);
        setCoursesCompleted(courses.map((c) => c.name));
      }

      // Fetch profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name, full_name')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (profile) {
        setName(profile.full_name || profile.display_name || '');
      }
    } catch (error) {
      console.error('Error fetching skills:', error);
    }
  };

  const addSkill = () => {
    setSkills([...skills, { name: '', level: 'Beginner', source: 'Manual' }]);
  };

  const removeSkill = (index: number) => {
    setSkills(skills.filter((_, i) => i !== index));
  };

  const updateSkill = (index: number, field: keyof Skill, value: string) => {
    const updated = [...skills];
    updated[index] = { ...updated[index], [field]: value };
    setSkills(updated);
  };

  const generateSummary = async () => {
    if (skills.length === 0) {
      toast({ title: 'Add some skills first', variant: 'destructive' });
      return;
    }

    setGenerating(true);
    setSummary('');

    try {
      const skillList = skills.map((s) => `${s.name} (${s.level})`).join(', ');
      const prompt = `Write a professional resume summary (2-3 sentences) for a student with these skills: ${skillList}. 
Make it confident but not arrogant. Focus on learning ability and potential. Don't use "I" - write in third person or implied first person suitable for a resume.`;

      await streamAIChat({
        messages: [{ role: 'user', content: prompt }],
        onDelta: (chunk) => setSummary((prev) => prev + chunk),
        onDone: () => setGenerating(false),
        onError: (error) => {
          toast({ title: error, variant: 'destructive' });
          setGenerating(false);
        },
      });
    } catch (error) {
      console.error('Error:', error);
      toast({ title: 'Failed to generate summary', variant: 'destructive' });
      setGenerating(false);
    }
  };

  const exportResume = () => {
    const resumeContent = `
${name}
${email}

SUMMARY
${summary}

SKILLS
${skills.map((s) => `• ${s.name} - ${s.level}`).join('\n')}

COURSES COMPLETED
${coursesCompleted.map((c) => `• ${c}`).join('\n')}
    `.trim();

    const blob = new Blob([resumeContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'resume.txt';
    a.click();
    URL.revokeObjectURL(url);

    toast({ title: '📄 Resume exported!' });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <Card className="p-6 bg-card border-border">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center">
            <FileText className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Resume Builder</h3>
            <p className="text-sm text-muted-foreground">
              Auto-add skills from your courses
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Input
              placeholder="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                <Award className="w-4 h-4" />
                Skills
              </label>
              <Button size="sm" variant="outline" onClick={addSkill}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-2">
              {skills.map((skill, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    placeholder="Skill name"
                    value={skill.name}
                    onChange={(e) => updateSkill(index, 'name', e.target.value)}
                    className="flex-1"
                  />
                  <select
                    value={skill.level}
                    onChange={(e) => updateSkill(index, 'level', e.target.value)}
                    className="px-3 py-2 bg-background border border-input rounded-md text-sm"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => removeSkill(index)}
                    className="text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-foreground">Summary</label>
              <Button
                size="sm"
                variant="outline"
                onClick={generateSummary}
                disabled={generating}
              >
                <Sparkles className="w-4 h-4 mr-1" />
                {generating ? 'Generating...' : 'AI Generate'}
              </Button>
            </div>
            <Textarea
              placeholder="Professional summary..."
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={4}
            />
          </div>

          <Button
            onClick={exportResume}
            className="w-full gradient-primary text-primary-foreground"
          >
            <Download className="w-4 h-4 mr-2" />
            Export Resume
          </Button>
        </div>
      </Card>

      {coursesCompleted.length > 0 && (
        <Card className="p-4 bg-muted/30 border-border">
          <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-primary" />
            Courses with 50%+ Progress
          </h4>
          <div className="flex flex-wrap gap-2">
            {coursesCompleted.map((course, i) => (
              <span
                key={i}
                className="px-3 py-1 bg-primary/10 text-primary text-sm rounded-full"
              >
                {course}
              </span>
            ))}
          </div>
        </Card>
      )}
    </motion.div>
  );
};

export default ResumeBuilder;
