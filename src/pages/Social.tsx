import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Users, Swords } from 'lucide-react';
import Leaderboard from '@/components/social/Leaderboard';
import FriendsList from '@/components/social/FriendsList';
import StudyChallenges from '@/components/social/StudyChallenges';

const Social = () => {
  return (
    <div className="p-6 space-y-6 pb-24">
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-display font-bold text-foreground">Social</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Compete with friends and climb the rankings
        </p>
      </motion.header>

      <Tabs defaultValue="leaderboard" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="leaderboard" className="flex items-center gap-1 text-xs">
            <Trophy className="w-4 h-4" />
            Ranks
          </TabsTrigger>
          <TabsTrigger value="friends" className="flex items-center gap-1 text-xs">
            <Users className="w-4 h-4" />
            Friends
          </TabsTrigger>
          <TabsTrigger value="challenges" className="flex items-center gap-1 text-xs">
            <Swords className="w-4 h-4" />
            Challenges
          </TabsTrigger>
        </TabsList>

        <TabsContent value="leaderboard" className="mt-4">
          <Leaderboard />
        </TabsContent>

        <TabsContent value="friends" className="mt-4">
          <FriendsList />
        </TabsContent>

        <TabsContent value="challenges" className="mt-4">
          <StudyChallenges />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Social;
