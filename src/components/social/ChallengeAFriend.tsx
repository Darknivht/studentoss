import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { callAI } from '@/lib/ai';
import { awardXP } from '@/hooks/useWeeklyXP';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Swords, Send, Trophy, User, CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react';

interface Friend { id: string; display_name: string | null; total_xp: number | null; }
interface Note { id: string; title: string; content: string | null; }
interface PeerChallenge {
  id: string;
  challenger_id: string;
  challenged_id: string;
  note_id: string | null;
  quiz_data: any;
  challenger_score: number | null;
  challenged_score: number | null;
  status: string;
  xp_reward: number;
  created_at: string;
  expires_at: string;
  challenger_name?: string;
  challenged_name?: string;
}

const ChallengeAFriend = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedFriend, setSelectedFriend] = useState('');
  const [selectedNote, setSelectedNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [challenges, setChallenges] = useState<PeerChallenge[]>([]);
  const [activeQuiz, setActiveQuiz] = useState<PeerChallenge | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      // Fetch friends
      const { data: friendships } = await supabase
        .from('friendships')
        .select('user_id, friend_id')
        .or(`user_id.eq.${user?.id},friend_id.eq.${user?.id}`)
        .eq('status', 'accepted');

      if (friendships && friendships.length > 0) {
        const friendIds = friendships.map(f => f.user_id === user?.id ? f.friend_id : f.user_id);
        const { data: profiles } = await supabase.from('profiles').select('user_id, display_name, total_xp').in('user_id', friendIds);
        setFriends((profiles || []).map(p => ({ id: p.user_id, display_name: p.display_name, total_xp: p.total_xp })));
      }

      // Fetch notes
      const { data: notesData } = await supabase.from('notes').select('id, title, content').eq('user_id', user?.id).order('created_at', { ascending: false });
      setNotes(notesData || []);

      // Fetch peer challenges
      await fetchChallenges();
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchChallenges = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('peer_challenges')
      .select('*')
      .or(`challenger_id.eq.${user.id},challenged_id.eq.${user.id}`)
      .order('created_at', { ascending: false })
      .limit(10);

    if (data && data.length > 0) {
      const userIds = [...new Set(data.flatMap(c => [c.challenger_id, c.challenged_id]))];
      const { data: profiles } = await supabase.from('profiles').select('user_id, display_name').in('user_id', userIds);
      const nameMap = new Map(profiles?.map(p => [p.user_id, p.display_name || 'Student']));

      setChallenges(data.map(c => ({
        ...c,
        challenger_name: nameMap.get(c.challenger_id) || 'Student',
        challenged_name: nameMap.get(c.challenged_id) || 'Student',
      })));
    }
  };

  const sendChallenge = async () => {
    if (!selectedFriend || !selectedNote || !user) {
      toast({ title: 'Select both a friend and a note', variant: 'destructive' });
      return;
    }

    setSending(true);
    try {
      const note = notes.find(n => n.id === selectedNote);
      if (!note?.content) {
        toast({ title: 'This note has no content to quiz on', variant: 'destructive' });
        setSending(false);
        return;
      }

      // Generate quiz from note content
      const quizJson = await callAI('quiz', note.content.substring(0, 3000));
      let quizData;
      try {
        quizData = JSON.parse(quizJson);
      } catch {
        const match = quizJson.match(/\{[\s\S]*\}/);
        if (match) quizData = JSON.parse(match[0]);
        else throw new Error('Failed to parse quiz');
      }

      // Limit to 5 questions
      if (quizData.questions) quizData.questions = quizData.questions.slice(0, 5);

      const { error } = await supabase.from('peer_challenges').insert({
        challenger_id: user.id,
        challenged_id: selectedFriend,
        note_id: selectedNote,
        quiz_data: quizData,
        status: 'pending',
        xp_reward: 100,
      });

      if (error) throw error;

      const friend = friends.find(f => f.id === selectedFriend);
      toast({ title: '⚔️ Challenge Sent!', description: `${friend?.display_name || 'Friend'} has been challenged on "${note.title}"!` });
      setSelectedFriend('');
      setSelectedNote('');
      fetchChallenges();
    } catch (error) {
      console.error('Error:', error);
      toast({ title: 'Failed to create challenge', variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  const startQuiz = (challenge: PeerChallenge) => {
    setActiveQuiz(challenge);
    setAnswers({});
  };

  const submitQuiz = async () => {
    if (!activeQuiz || !user) return;
    setSubmitting(true);

    try {
      const questions = activeQuiz.quiz_data?.questions || [];
      let score = 0;
      questions.forEach((q: any, i: number) => {
        if (answers[i] === q.correct) score++;
      });

      const isChallenger = activeQuiz.challenger_id === user.id;
      const updateData: any = isChallenger
        ? { challenger_score: score }
        : { challenged_score: score };

      // Check if both have answered
      const otherScore = isChallenger ? activeQuiz.challenged_score : activeQuiz.challenger_score;
      if (otherScore !== null) {
        updateData.status = 'completed';
      } else {
        updateData.status = 'active';
      }

      await supabase.from('peer_challenges').update(updateData).eq('id', activeQuiz.id);

      // If completed, award XP
      if (updateData.status === 'completed') {
        const myScore = score;
        const theirScore = otherScore!;
        if (myScore > theirScore) {
          await awardXP(user.id, activeQuiz.xp_reward);
          await awardXP(isChallenger ? activeQuiz.challenged_id : activeQuiz.challenger_id, Math.floor(activeQuiz.xp_reward / 2));
        } else if (myScore < theirScore) {
          await awardXP(user.id, Math.floor(activeQuiz.xp_reward / 2));
          await awardXP(isChallenger ? activeQuiz.challenged_id : activeQuiz.challenger_id, activeQuiz.xp_reward);
        } else {
          await awardXP(user.id, Math.floor(activeQuiz.xp_reward * 0.75));
          await awardXP(isChallenger ? activeQuiz.challenged_id : activeQuiz.challenger_id, Math.floor(activeQuiz.xp_reward * 0.75));
        }
      }

      toast({ title: `Score: ${score}/${questions.length}`, description: otherScore !== null ? 'Challenge complete!' : 'Waiting for opponent...' });
      setActiveQuiz(null);
      fetchChallenges();
    } catch (error) {
      console.error('Error:', error);
      toast({ title: 'Failed to submit', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center py-8"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  // Active quiz view
  if (activeQuiz) {
    const questions = activeQuiz.quiz_data?.questions || [];
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-foreground">⚔️ Peer Challenge Quiz</h3>
          <Button variant="ghost" size="sm" onClick={() => setActiveQuiz(null)}>Cancel</Button>
        </div>
        {questions.map((q: any, i: number) => (
          <Card key={i} className="p-4 bg-card border-border">
            <p className="font-medium mb-3">{i + 1}. {q.question}</p>
            <RadioGroup value={answers[i]?.toString()} onValueChange={(v) => setAnswers(prev => ({ ...prev, [i]: parseInt(v) }))}>
              {q.options?.map((opt: string, j: number) => (
                <div key={j} className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50">
                  <RadioGroupItem value={j.toString()} id={`q${i}-o${j}`} />
                  <Label htmlFor={`q${i}-o${j}`} className="flex-1 cursor-pointer text-sm">{opt}</Label>
                </div>
              ))}
            </RadioGroup>
          </Card>
        ))}
        <Button onClick={submitQuiz} disabled={submitting || Object.keys(answers).length < questions.length} className="w-full gradient-primary text-primary-foreground">
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit Answers'}
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      {/* Send Challenge Form */}
      <Card className="p-6 bg-card border-border">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center">
            <Swords className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Challenge a Friend</h3>
            <p className="text-sm text-muted-foreground">AI generates a quiz from your notes</p>
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Select Friend</label>
            <Select value={selectedFriend} onValueChange={setSelectedFriend}>
              <SelectTrigger><SelectValue placeholder="Choose a friend" /></SelectTrigger>
              <SelectContent>
                {friends.length === 0 ? <SelectItem value="none" disabled>No friends yet</SelectItem> :
                  friends.map(f => (
                    <SelectItem key={f.id} value={f.id}>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        {f.display_name || 'Anonymous'} <span className="text-xs text-muted-foreground">({f.total_xp || 0} XP)</span>
                      </div>
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Select Note</label>
            <Select value={selectedNote} onValueChange={setSelectedNote}>
              <SelectTrigger><SelectValue placeholder="Choose a note" /></SelectTrigger>
              <SelectContent>
                {notes.length === 0 ? <SelectItem value="none" disabled>No notes available</SelectItem> :
                  notes.map(n => <SelectItem key={n.id} value={n.id}>{n.title}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={sendChallenge} disabled={sending || !selectedFriend || !selectedNote} className="w-full gradient-primary text-primary-foreground">
            {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Send className="w-4 h-4 mr-2" />Send Challenge</>}
          </Button>
        </div>
      </Card>

      {/* Active Challenges */}
      {challenges.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium flex items-center gap-2">
            <Trophy className="w-4 h-4 text-primary" /> Your Challenges
          </h4>
          {challenges.map(c => {
            const isChallenger = c.challenger_id === user?.id;
            const myScore = isChallenger ? c.challenger_score : c.challenged_score;
            const theirScore = isChallenger ? c.challenged_score : c.challenger_score;
            const opponentName = isChallenger ? c.challenged_name : c.challenger_name;
            const canPlay = c.status !== 'completed' && myScore === null;
            const totalQ = c.quiz_data?.questions?.length || 5;

            return (
              <Card key={c.id} className="p-4 bg-card border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">
                      {isChallenger ? `You → ${opponentName}` : `${opponentName} → You`}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                      {c.status === 'completed' ? (
                        <span className="text-green-500 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Completed</span>
                      ) : c.status === 'pending' ? (
                        <span className="text-yellow-500 flex items-center gap-1"><Clock className="w-3 h-3" /> Pending</span>
                      ) : (
                        <span className="text-blue-500 flex items-center gap-1"><Clock className="w-3 h-3" /> In Progress</span>
                      )}
                      {myScore !== null && <span>Your score: {myScore}/{totalQ}</span>}
                      {theirScore !== null && <span>Their score: {theirScore}/{totalQ}</span>}
                    </div>
                  </div>
                  {canPlay && (
                    <Button size="sm" onClick={() => startQuiz(c)} className="gradient-primary text-primary-foreground">
                      <Swords className="w-4 h-4 mr-1" /> Play
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </motion.div>
  );
};

export default ChallengeAFriend;
