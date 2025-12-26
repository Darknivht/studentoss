import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Users, UserPlus, Check, X, Clock, Search, Flame, MessageCircle 
} from 'lucide-react';
import ChatRoom from '@/components/chat/ChatRoom';

interface Friend {
  id: string;
  user_id: string;
  friend_id: string;
  status: string;
  profile: {
    display_name: string;
    username: string | null;
    full_name: string;
    avatar_url: string | null;
    current_streak: number;
    total_xp: number;
    user_id: string;
  };
}

const FriendsList = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Friend[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [chatFriend, setChatFriend] = useState<Friend | null>(null);

  useEffect(() => {
    if (user) {
      fetchFriends();
    }
  }, [user]);

  const fetchFriends = async () => {
    if (!user) return;

    try {
      // Get friendships where user is either sender or receiver
      const { data: friendships } = await supabase
        .from('friendships')
        .select('*')
        .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`);

      if (!friendships) return;

      // Get all unique user IDs from friendships (excluding current user)
      const userIds = friendships.map(f => 
        f.user_id === user.id ? f.friend_id : f.user_id
      );

      if (userIds.length === 0) {
        setFriends([]);
        setPendingRequests([]);
        setLoading(false);
        return;
      }

      // Fetch profiles for those users
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name, username, full_name, avatar_url, current_streak, total_xp')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]));

      const enrichedFriendships = friendships.map(f => {
        const friendUserId = f.user_id === user.id ? f.friend_id : f.user_id;
        const profile = profileMap.get(friendUserId);
        return {
          ...f,
          profile: profile ? { ...profile } : {
            display_name: 'Unknown',
            username: null as string | null,
            full_name: 'Unknown User',
            avatar_url: null as string | null,
            current_streak: 0,
            total_xp: 0,
            user_id: friendUserId,
          },
        };
      }) as Friend[];

      setFriends(enrichedFriendships.filter(f => f.status === 'accepted'));
      setPendingRequests(enrichedFriendships.filter(
        f => f.status === 'pending' && f.friend_id === user.id
      ));
    } catch (error) {
      console.error('Failed to fetch friends:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchUsers = async () => {
    if (!searchQuery.trim() || !user) return;
    
    setSearching(true);
    try {
      // Search by username, display_name, or full_name
      const { data } = await supabase
        .from('profiles')
        .select('user_id, display_name, username, full_name, avatar_url')
        .or(`username.ilike.%${searchQuery}%,display_name.ilike.%${searchQuery}%,full_name.ilike.%${searchQuery}%`)
        .neq('user_id', user.id)
        .limit(10);

      // Filter out existing friends and pending requests
      const existingIds = new Set([
        ...friends.map(f => f.user_id === user.id ? f.friend_id : f.user_id),
        ...pendingRequests.map(f => f.user_id === user.id ? f.friend_id : f.user_id),
      ]);

      const filtered = (data || []).filter(p => !existingIds.has(p.user_id));
      setSearchResults(filtered);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setSearching(false);
    }
  };

  const sendFriendRequest = async (friendId: string) => {
    if (!user) return;

    try {
      // Check if request already exists
      const { data: existing } = await supabase
        .from('friendships')
        .select('id')
        .or(`and(user_id.eq.${user.id},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${user.id})`)
        .maybeSingle();

      if (existing) {
        toast({ title: 'Request already exists', variant: 'destructive' });
        return;
      }

      await supabase.from('friendships').insert({
        user_id: user.id,
        friend_id: friendId,
        status: 'pending',
      });

      toast({
        title: 'Friend request sent!',
        description: 'Waiting for them to accept.',
      });

      setSearchResults(prev => prev.filter(r => r.user_id !== friendId));
    } catch (error) {
      console.error('Failed to send request:', error);
      toast({
        title: 'Failed to send request',
        variant: 'destructive',
      });
    }
  };

  const respondToRequest = async (friendshipId: string, accept: boolean) => {
    try {
      if (accept) {
        await supabase
          .from('friendships')
          .update({ status: 'accepted' })
          .eq('id', friendshipId);

        toast({
          title: 'Friend added!',
          description: 'You can now see each other on the leaderboard.',
        });
      } else {
        await supabase
          .from('friendships')
          .delete()
          .eq('id', friendshipId);
      }

      fetchFriends();
    } catch (error) {
      console.error('Failed to respond:', error);
    }
  };

  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search for friends */}
      <div className="space-y-3">
        <div className="flex gap-2">
          <Input
            placeholder="Search by username or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && searchUsers()}
          />
          <Button onClick={searchUsers} disabled={searching}>
            <Search className="w-4 h-4" />
          </Button>
        </div>

        {searchResults.length > 0 && (
          <div className="space-y-2">
            {searchResults.map((result) => (
              <motion.div
                key={result.user_id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border"
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage src={result.avatar_url || undefined} />
                  <AvatarFallback>
                    {(result.username || result.display_name || result.full_name)?.[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium">
                    {result.display_name || result.full_name || 'User'}
                  </p>
                  {result.username && (
                    <p className="text-xs text-primary">@{result.username}</p>
                  )}
                </div>
                <Button
                  size="sm"
                  onClick={() => sendFriendRequest(result.user_id)}
                >
                  <UserPlus className="w-4 h-4 mr-1" />
                  Add
                </Button>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-medium flex items-center gap-2">
            <Clock className="w-4 h-4 text-yellow-500" />
            Pending Requests ({pendingRequests.length})
          </h3>
          {pendingRequests.map((request) => (
            <motion.div
              key={request.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/30"
            >
              <Avatar className="h-10 w-10">
                <AvatarImage src={request.profile.avatar_url || undefined} />
                <AvatarFallback>
                  {(request.profile.username || request.profile.display_name)?.[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-medium">
                  {request.profile.display_name || request.profile.full_name}
                </p>
                {request.profile.username && (
                  <p className="text-xs text-primary">@{request.profile.username}</p>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  size="icon"
                  variant="outline"
                  className="h-8 w-8 rounded-full"
                  onClick={() => respondToRequest(request.id, true)}
                >
                  <Check className="w-4 h-4 text-green-500" />
                </Button>
                <Button
                  size="icon"
                  variant="outline"
                  className="h-8 w-8 rounded-full"
                  onClick={() => respondToRequest(request.id, false)}
                >
                  <X className="w-4 h-4 text-red-500" />
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Friends List */}
      <div className="space-y-3">
        <h3 className="font-medium flex items-center gap-2">
          <Users className="w-4 h-4 text-primary" />
          Friends ({friends.length})
        </h3>
        {friends.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No friends yet</p>
            <p className="text-sm">Search for users to add!</p>
          </div>
        ) : (
          friends.map((friend) => {
            const friendUserId = friend.user_id === user?.id ? friend.friend_id : friend.user_id;
            return (
              <motion.div
                key={friend.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border"
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage src={friend.profile.avatar_url || undefined} />
                  <AvatarFallback>
                    {(friend.profile.username || friend.profile.display_name)?.[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium">
                    {friend.profile.display_name || friend.profile.full_name}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {friend.profile.username && (
                      <span className="text-primary">@{friend.profile.username}</span>
                    )}
                    <span className="flex items-center gap-1">
                      <Flame className="w-3 h-3 text-orange-500" />
                      {friend.profile.current_streak} day streak
                    </span>
                    <span>•</span>
                    <span>{friend.profile.total_xp} XP</span>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setChatFriend({ ...friend, profile: { ...friend.profile, user_id: friendUserId } })}
                >
                  <MessageCircle className="w-4 h-4" />
                </Button>
              </motion.div>
            );
          })
        )}
      </div>

      {/* DM Chat Dialog */}
      <Dialog open={!!chatFriend} onOpenChange={(open) => !open && setChatFriend(null)}>
        <DialogContent className="max-w-lg max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              Chat with {chatFriend?.profile.display_name || chatFriend?.profile.full_name}
            </DialogTitle>
          </DialogHeader>
          {chatFriend && (
            <ChatRoom recipientId={chatFriend.profile.user_id} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FriendsList;
