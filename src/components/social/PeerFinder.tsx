import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Globe, Search, UserPlus, Star, BookOpen, Trophy } from 'lucide-react';

interface PeerProfile {
  user_id: string;
  display_name: string | null;
  school_name: string | null;
  grade_level: string | null;
  study_persona: string | null;
  total_xp: number | null;
}

const PeerFinder = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [peers, setPeers] = useState<PeerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGrade, setFilterGrade] = useState<string>('all');

  useEffect(() => {
    fetchPeers();
  }, [user]);

  const fetchPeers = async () => {
    try {
      let query = supabase
        .from('profiles')
        .select('user_id, display_name, school_name, grade_level, study_persona, total_xp')
        .neq('user_id', user?.id || '')
        .order('total_xp', { ascending: false })
        .limit(20);

      const { data, error } = await query;

      if (error) throw error;
      setPeers(data || []);
    } catch (error) {
      console.error('Error fetching peers:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendFriendRequest = async (peerId: string) => {
    try {
      const { error } = await supabase.from('friendships').insert({
        user_id: user?.id,
        friend_id: peerId,
        status: 'pending',
      });

      if (error) {
        if (error.code === '23505') {
          toast({ title: 'Request already sent!', variant: 'destructive' });
        } else {
          throw error;
        }
      } else {
        toast({
          title: '✅ Friend Request Sent!',
          description: 'Waiting for them to accept.',
        });
      }
    } catch (error) {
      console.error('Error sending request:', error);
      toast({ title: 'Failed to send request', variant: 'destructive' });
    }
  };

  const filteredPeers = peers.filter((peer) => {
    const matchesSearch =
      !searchTerm ||
      peer.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      peer.school_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesGrade = filterGrade === 'all' || peer.grade_level === filterGrade;
    
    return matchesSearch && matchesGrade;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <Card className="p-4 bg-card border-border">
        <div className="flex items-center gap-3 mb-4">
          <Globe className="w-6 h-6 text-primary" />
          <div>
            <h3 className="font-semibold text-foreground">Find Study Partners</h3>
            <p className="text-sm text-muted-foreground">
              Connect with students globally
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or school..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterGrade} onValueChange={setFilterGrade}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Grade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Grades</SelectItem>
              <SelectItem value="high_school">High School</SelectItem>
              <SelectItem value="college">College</SelectItem>
              <SelectItem value="graduate">Graduate</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      <div className="space-y-3">
        {filteredPeers.length === 0 ? (
          <Card className="p-8 bg-card border-border text-center">
            <Globe className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No peers found</p>
          </Card>
        ) : (
          filteredPeers.map((peer, index) => (
            <motion.div
              key={peer.user_id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="p-4 bg-card border-border hover:border-primary/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-lg">
                        {peer.display_name?.[0]?.toUpperCase() || '?'}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground">
                        {peer.display_name || 'Anonymous Student'}
                      </h4>
                      <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-muted-foreground">
                        {peer.school_name && (
                          <span className="flex items-center gap-1">
                            <BookOpen className="w-3 h-3" />
                            {peer.school_name}
                          </span>
                        )}
                        {peer.grade_level && (
                          <span className="px-2 py-0.5 bg-muted rounded-full">
                            {peer.grade_level}
                          </span>
                        )}
                        <span className="flex items-center gap-1 text-primary">
                          <Trophy className="w-3 h-3" />
                          {peer.total_xp || 0} XP
                        </span>
                      </div>
                      {peer.study_persona && (
                        <span className="inline-flex items-center gap-1 mt-1 text-xs text-accent">
                          <Star className="w-3 h-3" />
                          {peer.study_persona}
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => sendFriendRequest(peer.user_id)}
                  >
                    <UserPlus className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  );
};

export default PeerFinder;
