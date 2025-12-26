import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Trophy, Medal, Crown, TrendingUp, Flame } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface LeaderboardEntry {
  user_id: string;
  display_name: string;
  username: string | null;
  avatar_url: string | null;
  xp_earned: number;
  current_streak: number;
  total_xp: number;
  rank: number;
}

const Leaderboard = () => {
  const { user } = useAuth();
  const [weeklyLeaders, setWeeklyLeaders] = useState<LeaderboardEntry[]>([]);
  const [allTimeLeaders, setAllTimeLeaders] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboards();
  }, [user]);

  const getWeekStart = () => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const monday = new Date(now.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday.toISOString().split('T')[0];
  };

  const fetchLeaderboards = async () => {
    try {
      // Fetch all profiles for leaderboard
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, display_name, username, full_name, avatar_url, total_xp, current_streak')
        .order('total_xp', { ascending: false })
        .limit(50);

      if (profilesError) throw profilesError;

      // Fetch weekly XP
      const weekStart = getWeekStart();
      const { data: weeklyData } = await supabase
        .from('weekly_xp')
        .select('user_id, xp_earned')
        .eq('week_start', weekStart)
        .order('xp_earned', { ascending: false });

      if (profiles && profiles.length > 0) {
        // Create weekly leaderboard
        const weeklyMap = new Map(weeklyData?.map(w => [w.user_id, w.xp_earned]) || []);
        
        const weekly = profiles
          .map((p) => ({
            user_id: p.user_id,
            display_name: p.username || p.display_name || p.full_name || 'Student',
            username: p.username,
            avatar_url: p.avatar_url,
            xp_earned: weeklyMap.get(p.user_id) || 0,
            current_streak: p.current_streak || 0,
            total_xp: p.total_xp || 0,
            rank: 0,
          }))
          .sort((a, b) => b.xp_earned - a.xp_earned)
          .map((entry, idx) => ({ ...entry, rank: idx + 1 }));

        setWeeklyLeaders(weekly);

        // Create all-time leaderboard
        const allTime = profiles.map((p, idx) => ({
          user_id: p.user_id,
          display_name: p.username || p.display_name || p.full_name || 'Student',
          username: p.username,
          avatar_url: p.avatar_url,
          xp_earned: 0,
          current_streak: p.current_streak || 0,
          total_xp: p.total_xp || 0,
          rank: idx + 1,
        }));
        setAllTimeLeaders(allTime);
      }
    } catch (error) {
      console.error('Failed to fetch leaderboards:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-5 h-5 text-yellow-500" />;
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />;
      case 3:
        return <Medal className="w-5 h-5 text-amber-600" />;
      default:
        return <span className="w-5 text-center text-sm font-bold text-muted-foreground">{rank}</span>;
    }
  };

  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border-yellow-500/30';
      case 2:
        return 'bg-gradient-to-r from-gray-400/20 to-gray-500/20 border-gray-400/30';
      case 3:
        return 'bg-gradient-to-r from-amber-600/20 to-orange-600/20 border-amber-600/30';
      default:
        return 'bg-card border-border/50';
    }
  };

  const LeaderboardList = ({ entries, showWeeklyXP }: { entries: LeaderboardEntry[]; showWeeklyXP: boolean }) => (
    <div className="space-y-2">
      {entries.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Trophy className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No rankings yet</p>
          <p className="text-sm">Start studying to climb the leaderboard!</p>
        </div>
      ) : (
        entries.map((entry, idx) => (
          <motion.div
            key={entry.user_id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
            className={`flex items-center gap-3 p-3 rounded-xl border ${getRankStyle(entry.rank)} ${
              entry.user_id === user?.id ? 'ring-2 ring-primary' : ''
            }`}
          >
            <div className="w-8 flex justify-center">
              {getRankIcon(entry.rank)}
            </div>
            <Avatar className="h-10 w-10">
              <AvatarImage src={entry.avatar_url || undefined} />
              <AvatarFallback>{entry.display_name[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">
                {entry.display_name}
                {entry.user_id === user?.id && (
                  <span className="text-xs text-primary ml-2">(You)</span>
                )}
              </p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {entry.username && (
                  <span className="text-primary">@{entry.username}</span>
                )}
                <span className="flex items-center gap-1">
                  <Flame className="w-3 h-3 text-orange-500" />
                  {entry.current_streak} day streak
                </span>
              </div>
            </div>
            <div className="text-right">
              <p className="font-bold text-primary">
                {showWeeklyXP ? entry.xp_earned : entry.total_xp}
              </p>
              <p className="text-xs text-muted-foreground">XP</p>
            </div>
          </motion.div>
        ))
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Trophy className="w-5 h-5 text-yellow-500" />
        <h3 className="font-display font-semibold">Leaderboard</h3>
      </div>

      <Tabs defaultValue="weekly" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="weekly" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            This Week
          </TabsTrigger>
          <TabsTrigger value="alltime" className="flex items-center gap-2">
            <Trophy className="w-4 h-4" />
            All Time
          </TabsTrigger>
        </TabsList>
        <TabsContent value="weekly" className="mt-4">
          <LeaderboardList entries={weeklyLeaders} showWeeklyXP />
        </TabsContent>
        <TabsContent value="alltime" className="mt-4">
          <LeaderboardList entries={allTimeLeaders} showWeeklyXP={false} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Leaderboard;
