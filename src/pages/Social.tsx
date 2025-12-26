import { useState } from 'react';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Users, Swords, Globe, MessageSquare } from 'lucide-react';
import Leaderboard from '@/components/social/Leaderboard';
import FriendsList from '@/components/social/FriendsList';
import StudyChallenges from '@/components/social/StudyChallenges';
import ChallengeAFriend from '@/components/social/ChallengeAFriend';
import StudyGroups from '@/components/social/StudyGroups';
import PeerFinder from '@/components/social/PeerFinder';

const Social = () => {
  const [activeTab, setActiveTab] = useState('leaderboard');

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

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-2">
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

        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="compete" className="flex items-center gap-1 text-xs">
            <Swords className="w-4 h-4" />
            Compete
          </TabsTrigger>
          <TabsTrigger value="groups" className="flex items-center gap-1 text-xs">
            <MessageSquare className="w-4 h-4" />
            Groups
          </TabsTrigger>
          <TabsTrigger value="discover" className="flex items-center gap-1 text-xs">
            <Globe className="w-4 h-4" />
            Discover
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

        <TabsContent value="compete" className="mt-4">
          <ChallengeAFriend />
        </TabsContent>

        <TabsContent value="groups" className="mt-4">
          <StudyGroups />
        </TabsContent>

        <TabsContent value="discover" className="mt-4">
          <PeerFinder />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Social;
