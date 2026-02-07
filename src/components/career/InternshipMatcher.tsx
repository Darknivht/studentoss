import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { streamAIChat } from '@/lib/ai';
import { Briefcase, MapPin, GraduationCap, Sparkles, RefreshCw, Plus, X, Search } from 'lucide-react';
import JobSearch from './JobSearch';

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
  const [newSkill, setNewSkill] = useState('');

  useEffect(() => { if (user) fetchUserData(); }, [user]);

  const fetchUserData = async () => {
    try {
      const { data: courses } = await supabase.from('courses').select('name').eq('user_id', user?.id);
      if (courses) setUserSkills(courses.map(c => c.name));
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const addSkill = () => {
    if (newSkill.trim() && !userSkills.includes(newSkill.trim())) {
      setUserSkills(prev => [...prev, newSkill.trim()]);
      setNewSkill('');
    }
  };

  const removeSkill = (skill: string) => setUserSkills(prev => prev.filter(s => s !== skill));

  const findInternships = async () => {
    if (userSkills.length === 0) {
      toast({ title: 'Add some skills first', variant: 'destructive' });
      return;
    }
    setLoading(true);
    setInternships([]);

    try {
      let fullResponse = '';
      await streamAIChat({
        messages: [{ role: 'user', content: `Based on a student studying: ${userSkills.join(', ')}, suggest 6 relevant internship opportunities. Return as valid JSON array only:\n[{"title":"","company":"","description":"","skills":[""],"location":""}]\nMake them realistic entry-level positions.` }],
        onDelta: (chunk) => { fullResponse += chunk; },
        onDone: () => {
          const m = fullResponse.match(/\[[\s\S]*\]/);
          if (m) { try { setInternships(JSON.parse(m[0])); } catch {} }
          setLoading(false);
        },
        onError: (err) => { toast({ title: err, variant: 'destructive' }); setLoading(false); },
      });
    } catch {
      toast({ title: 'Failed to find internships', variant: 'destructive' });
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <Tabs defaultValue="matched">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="matched" className="flex items-center gap-1 text-xs">
            <Sparkles className="w-4 h-4" />AI-Matched
          </TabsTrigger>
          <TabsTrigger value="search" className="flex items-center gap-1 text-xs">
            <Search className="w-4 h-4" />Live Search
          </TabsTrigger>
        </TabsList>

        <TabsContent value="matched" className="space-y-4">
          <Card className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-sm">AI Internship Matcher</h3>
                <p className="text-xs text-muted-foreground">Based on your skills</p>
              </div>
            </div>

            {/* Skills management */}
            <div className="mb-3">
              <p className="text-xs text-muted-foreground mb-2">Your skills:</p>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {userSkills.map((skill, i) => (
                  <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary/10 text-primary text-xs rounded-full">
                    {skill}
                    <button onClick={() => removeSkill(skill)} className="hover:text-destructive"><X className="w-3 h-3" /></button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <Input value={newSkill} onChange={e => setNewSkill(e.target.value)} placeholder="Add a skill..." className="flex-1 h-8 text-xs"
                  onKeyDown={e => e.key === 'Enter' && addSkill()} />
                <Button size="sm" variant="outline" onClick={addSkill} className="h-8"><Plus className="w-3 h-3" /></Button>
              </div>
            </div>

            <Button onClick={findInternships} disabled={loading} className="w-full gradient-primary text-primary-foreground" size="sm">
              {loading ? <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" /> : <><Sparkles className="w-4 h-4 mr-1" />Find Matches</>}
            </Button>
          </Card>

          {internships.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                ⚠️ AI-generated suggestions. Verify on actual job boards.
              </p>
              {internships.map((internship, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                  <Card className="p-4 hover:border-primary/50 transition-colors">
                    <h5 className="font-semibold text-foreground">{internship.title}</h5>
                    <p className="text-sm text-primary">{internship.company}</p>
                    <p className="text-sm text-muted-foreground my-2">{internship.description}</p>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {internship.skills.map((s, si) => <span key={si} className="px-2 py-0.5 bg-muted text-muted-foreground text-xs rounded">{s}</span>)}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="w-3 h-3" />{internship.location}</div>
                  </Card>
                </motion.div>
              ))}
              <Button variant="outline" onClick={findInternships} className="w-full"><RefreshCw className="w-4 h-4 mr-2" />Find More</Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="search">
          <JobSearch />
        </TabsContent>
      </Tabs>
    </motion.div>
  );
};

export default InternshipMatcher;
