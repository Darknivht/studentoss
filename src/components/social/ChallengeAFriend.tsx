import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Swords, Send, Trophy, User, CheckCircle, XCircle } from 'lucide-react';

interface Friend {
  id: string;
  display_name: string | null;
  total_xp: number | null;
}

interface Note {
  id: string;
  title: string;
}

const ChallengeAFriend = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedFriend, setSelectedFriend] = useState<string>('');
  const [selectedNote, setSelectedNote] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (user) {
      fetchFriendsAndNotes();
    }
  }, [user]);

  const fetchFriendsAndNotes = async () => {
    try {
      // Fetch accepted friends
      const { data: friendships } = await supabase
        .from('friendships')
        .select('friend_id')
        .eq('user_id', user?.id)
        .eq('status', 'accepted');

      if (friendships && friendships.length > 0) {
        const friendIds = friendships.map((f) => f.friend_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, display_name, total_xp')
          .in('user_id', friendIds);

        setFriends(
          (profiles || []).map((p) => ({
            id: p.user_id,
            display_name: p.display_name,
            total_xp: p.total_xp,
          }))
        );
      }

      // Fetch user's notes
      const { data: notesData } = await supabase
        .from('notes')
        .select('id, title')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      setNotes(notesData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendChallenge = async () => {
    if (!selectedFriend || !selectedNote) {
      toast({
        title: 'Select both a friend and a note',
        variant: 'destructive',
      });
      return;
    }

    setSending(true);
    try {
      // In a full implementation, this would create a quiz from the note
      // and send a challenge notification to the friend
      // For now, we'll simulate the challenge being sent
      
      const friend = friends.find((f) => f.id === selectedFriend);
      const note = notes.find((n) => n.id === selectedNote);

      toast({
        title: '⚔️ Challenge Sent!',
        description: `${friend?.display_name || 'Friend'} has been challenged to a quiz on "${note?.title}"!`,
      });

      setSelectedFriend('');
      setSelectedNote('');
    } catch (error) {
      console.error('Error sending challenge:', error);
      toast({
        title: 'Failed to send challenge',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

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
      className="space-y-4"
    >
      <Card className="p-6 bg-card border-border">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center">
            <Swords className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Challenge a Friend</h3>
            <p className="text-sm text-muted-foreground">
              Send a quiz challenge based on your notes
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Select Friend
            </label>
            <Select value={selectedFriend} onValueChange={setSelectedFriend}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a friend to challenge" />
              </SelectTrigger>
              <SelectContent>
                {friends.length === 0 ? (
                  <SelectItem value="none" disabled>
                    No friends yet
                  </SelectItem>
                ) : (
                  friends.map((friend) => (
                    <SelectItem key={friend.id} value={friend.id}>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        {friend.display_name || 'Anonymous'}
                        <span className="text-xs text-muted-foreground">
                          ({friend.total_xp || 0} XP)
                        </span>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Select Note for Quiz
            </label>
            <Select value={selectedNote} onValueChange={setSelectedNote}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a note to quiz on" />
              </SelectTrigger>
              <SelectContent>
                {notes.length === 0 ? (
                  <SelectItem value="none" disabled>
                    No notes available
                  </SelectItem>
                ) : (
                  notes.map((note) => (
                    <SelectItem key={note.id} value={note.id}>
                      {note.title}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={sendChallenge}
            disabled={sending || !selectedFriend || !selectedNote}
            className="w-full gradient-primary text-primary-foreground"
          >
            {sending ? (
              <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Send Challenge
              </>
            )}
          </Button>
        </div>
      </Card>

      <Card className="p-4 bg-muted/30 border-border">
        <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-primary" />
          How Challenges Work
        </h4>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
            Select a friend and a note to generate a quiz
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
            Your friend will receive the challenge
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
            Whoever scores higher wins bonus XP!
          </li>
        </ul>
      </Card>
    </motion.div>
  );
};

export default ChallengeAFriend;
