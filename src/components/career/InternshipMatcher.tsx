import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { streamAIChat } from '@/lib/ai';
import { Briefcase, MapPin, GraduationCap, ExternalLink, Sparkles, RefreshCw } from 'lucide-react';

interface Internship {
  title: string;
  company: string;
  description: string;
  skills: string[];
  location: string;
}

const InternshipMatcher = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [internships, setInternships] = useState<Internship[]>([]);
  const [loading, setLoading] = useState(false);
  const [userSkills, setUserSkills] = useState<string[]>([]);

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  const fetchUserData = async () => {
    try {
      const { data: courses } = await supabase
        .from('courses')
        .select('name')
        .eq('user_id', user?.id);

      if (courses) {
        setUserSkills(courses.map((c) => c.name));
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const findInternships = async () => {
    if (userSkills.length === 0) {
      toast({
        title: 'Add some courses first',
        description: 'Your courses help match you with relevant internships',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    setInternships([]);

    try {
      const prompt = `Based on a student studying these subjects: ${userSkills.join(', ')}, suggest 4 relevant internship opportunities. Return as valid JSON array only, no other text:
[
  {
    "title": "Internship Title",
    "company": "Example Company",
    "description": "Brief 1-2 sentence description",
    "skills": ["skill1", "skill2"],
    "location": "Remote/City"
  }
]

Make them realistic entry-level positions that match the student's coursework.`;

      let fullResponse = '';
      await streamAIChat({
        messages: [{ role: 'user', content: prompt }],
        onDelta: (chunk) => { fullResponse += chunk; },
        onDone: () => {
          const jsonMatch = fullResponse.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            try {
              const parsed = JSON.parse(jsonMatch[0]);
              setInternships(parsed);
            } catch {}
          }
          setLoading(false);
        },
        onError: (error) => {
          toast({ title: error, variant: 'destructive' });
          setLoading(false);
        },
      });
    } catch (error) {
      console.error('Error:', error);
      toast({ title: 'Failed to find internships', variant: 'destructive' });
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <Card className="p-6 bg-card border-border">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center">
            <Briefcase className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Internship Matcher</h3>
            <p className="text-sm text-muted-foreground">
              Find opportunities based on your courses
            </p>
          </div>
        </div>

        {userSkills.length > 0 && (
          <div className="mb-4">
            <p className="text-sm text-muted-foreground mb-2">Your skills:</p>
            <div className="flex flex-wrap gap-2">
              {userSkills.map((skill, i) => (
                <span
                  key={i}
                  className="px-3 py-1 bg-primary/10 text-primary text-sm rounded-full"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        <Button
          onClick={findInternships}
          disabled={loading}
          className="w-full gradient-primary text-primary-foreground"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Find Matching Internships
            </>
          )}
        </Button>
      </Card>

      {internships.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-foreground flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-primary" />
            AI-Suggested Internships
          </h4>
          <p className="text-xs text-muted-foreground">
            These are AI-generated suggestions based on your courses. Search for real opportunities on job boards.
          </p>

          {internships.map((internship, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="p-4 bg-card border-border hover:border-primary/50 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h5 className="font-semibold text-foreground">{internship.title}</h5>
                    <p className="text-sm text-primary">{internship.company}</p>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground mb-3">
                  {internship.description}
                </p>

                <div className="flex flex-wrap items-center gap-2 mb-2">
                  {internship.skills.map((skill, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 bg-muted text-muted-foreground text-xs rounded"
                    >
                      {skill}
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <MapPin className="w-3 h-3" />
                  {internship.location}
                </div>
              </Card>
            </motion.div>
          ))}

          <Button
            variant="outline"
            onClick={findInternships}
            className="w-full"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Find More
          </Button>
        </div>
      )}
    </motion.div>
  );
};

export default InternshipMatcher;
