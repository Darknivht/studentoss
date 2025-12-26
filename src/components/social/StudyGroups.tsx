import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Users, Plus, Video, MessageSquare, Clipboard, ExternalLink } from 'lucide-react';

interface StudyGroup {
  id: string;
  name: string;
  members: number;
  isLive: boolean;
  topic: string;
}

const StudyGroups = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [groupName, setGroupName] = useState('');
  const [topic, setTopic] = useState('');
  const [creating, setCreating] = useState(false);

  // Mock study groups for demo
  const [groups] = useState<StudyGroup[]>([
    { id: '1', name: 'Calculus Study Crew', members: 5, isLive: true, topic: 'Integration' },
    { id: '2', name: 'History Buffs', members: 3, isLive: false, topic: 'World War II' },
    { id: '3', name: 'Physics Lab', members: 8, isLive: true, topic: 'Quantum Mechanics' },
  ]);

  const createGroup = async () => {
    if (!groupName.trim()) {
      toast({ title: 'Enter a group name', variant: 'destructive' });
      return;
    }

    setCreating(true);
    try {
      // In a full implementation, this would create a real group
      toast({
        title: '✅ Study Group Created!',
        description: `"${groupName}" is ready. Share the link with friends!`,
      });
      setGroupName('');
      setTopic('');
    } finally {
      setCreating(false);
    }
  };

  const joinGroup = (group: StudyGroup) => {
    toast({
      title: `Joining ${group.name}...`,
      description: `Connecting to ${group.members} members studying ${group.topic}`,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Create Group */}
      <Card className="p-6 bg-card border-border">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Plus className="w-5 h-5 text-primary" />
          </div>
          <h3 className="font-semibold text-foreground">Create Study Room</h3>
        </div>

        <div className="space-y-3">
          <Input
            placeholder="Group name..."
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
          />
          <Input
            placeholder="Study topic (optional)"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
          />
          <Button
            onClick={createGroup}
            disabled={creating}
            className="w-full gradient-primary text-primary-foreground"
          >
            <Video className="w-4 h-4 mr-2" />
            Create Virtual Room
          </Button>
        </div>
      </Card>

      {/* Active Groups */}
      <div>
        <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          Active Study Groups
        </h3>

        <div className="space-y-3">
          {groups.map((group) => (
            <motion.div
              key={group.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <Card className="p-4 bg-card border-border hover:border-primary/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-foreground">{group.name}</h4>
                      {group.isLive && (
                        <span className="px-2 py-0.5 bg-green-500/20 text-green-500 text-xs rounded-full animate-pulse">
                          LIVE
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {group.members}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clipboard className="w-3 h-3" />
                        {group.topic}
                      </span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant={group.isLive ? 'default' : 'outline'}
                    onClick={() => joinGroup(group)}
                  >
                    <ExternalLink className="w-4 h-4 mr-1" />
                    Join
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Features */}
      <Card className="p-4 bg-muted/30 border-border">
        <h4 className="font-medium text-foreground mb-3">Room Features</h4>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Video className="w-4 h-4 text-primary" />
            Video Chat
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <MessageSquare className="w-4 h-4 text-primary" />
            Text Chat
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clipboard className="w-4 h-4 text-primary" />
            Shared Whiteboard
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="w-4 h-4 text-primary" />
            Screen Share
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

export default StudyGroups;
