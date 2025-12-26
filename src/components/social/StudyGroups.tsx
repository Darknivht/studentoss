import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Users, Plus, MessageSquare, Trash2, UserPlus } from 'lucide-react';

interface StudyGroup {
  id: string;
  name: string;
  description: string | null;
  topic: string | null;
  creator_id: string;
  is_public: boolean;
  max_members: number;
  member_count?: number;
  is_member?: boolean;
}

const StudyGroups = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [groupName, setGroupName] = useState('');
  const [topic, setTopic] = useState('');
  const [creating, setCreating] = useState(false);
  const [groups, setGroups] = useState<StudyGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchGroups();
    }
  }, [user]);

  const fetchGroups = async () => {
    try {
      // Fetch public groups
      const { data: groupsData, error: groupsError } = await supabase
        .from('study_groups')
        .select('*')
        .eq('is_public', true)
        .order('created_at', { ascending: false });

      if (groupsError) throw groupsError;

      // Fetch member counts and user membership
      const groupsWithData = await Promise.all((groupsData || []).map(async (group) => {
        const { count } = await supabase
          .from('study_group_members')
          .select('*', { count: 'exact', head: true })
          .eq('group_id', group.id);

        const { data: membership } = await supabase
          .from('study_group_members')
          .select('id')
          .eq('group_id', group.id)
          .eq('user_id', user?.id)
          .maybeSingle();

        return {
          ...group,
          member_count: count || 0,
          is_member: !!membership,
        };
      }));

      setGroups(groupsWithData);
    } catch (error) {
      console.error('Error fetching groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const createGroup = async () => {
    if (!groupName.trim() || !user) {
      toast({ title: 'Enter a group name', variant: 'destructive' });
      return;
    }

    setCreating(true);
    try {
      const { data: newGroup, error } = await supabase
        .from('study_groups')
        .insert({
          name: groupName.trim(),
          topic: topic.trim() || null,
          creator_id: user.id,
          is_public: true,
        })
        .select()
        .single();

      if (error) throw error;

      // Add creator as member
      await supabase
        .from('study_group_members')
        .insert({
          group_id: newGroup.id,
          user_id: user.id,
          role: 'admin',
        });

      toast({
        title: 'Study Group Created!',
        description: `"${groupName}" is ready. Invite friends to join!`,
      });
      
      setGroupName('');
      setTopic('');
      fetchGroups();
    } catch (error) {
      console.error('Error creating group:', error);
      toast({ title: 'Failed to create group', variant: 'destructive' });
    } finally {
      setCreating(false);
    }
  };

  const joinGroup = async (groupId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('study_group_members')
        .insert({
          group_id: groupId,
          user_id: user.id,
          role: 'member',
        });

      if (error) throw error;

      toast({ title: 'Joined group!' });
      fetchGroups();
    } catch (error) {
      console.error('Error joining group:', error);
      toast({ title: 'Failed to join group', variant: 'destructive' });
    }
  };

  const leaveGroup = async (groupId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('study_group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({ title: 'Left group' });
      fetchGroups();
    } catch (error) {
      console.error('Error leaving group:', error);
      toast({ title: 'Failed to leave group', variant: 'destructive' });
    }
  };

  const deleteGroup = async (groupId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('study_groups')
        .delete()
        .eq('id', groupId)
        .eq('creator_id', user.id);

      if (error) throw error;

      toast({ title: 'Group deleted' });
      fetchGroups();
    } catch (error) {
      console.error('Error deleting group:', error);
      toast({ title: 'Failed to delete group', variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

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
          <h3 className="font-semibold text-foreground">Create Study Group</h3>
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
            disabled={creating || !groupName.trim()}
            className="w-full gradient-primary text-primary-foreground"
          >
            {creating ? (
              <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Create Group
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* Groups List */}
      <div>
        <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          Study Groups ({groups.length})
        </h3>

        {groups.length === 0 ? (
          <Card className="p-8 bg-card border-border text-center">
            <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No study groups yet</p>
            <p className="text-sm text-muted-foreground">Create the first one!</p>
          </Card>
        ) : (
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
                        {group.is_member && (
                          <span className="px-2 py-0.5 bg-primary/20 text-primary text-xs rounded-full">
                            Joined
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {group.member_count}/{group.max_members}
                        </span>
                        {group.topic && (
                          <span className="truncate max-w-[150px]">{group.topic}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {group.creator_id === user?.id ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={() => deleteGroup(group.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      ) : group.is_member ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => leaveGroup(group.id)}
                        >
                          Leave
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => joinGroup(group.id)}
                          disabled={(group.member_count || 0) >= group.max_members}
                        >
                          <UserPlus className="w-4 h-4 mr-1" />
                          Join
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default StudyGroups;
