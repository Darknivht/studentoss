import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  ArrowLeft, MessageSquare, BookOpen, Users, Plus, 
  FileText, Trash2, Share2 
} from 'lucide-react';
import ChatRoom from '@/components/chat/ChatRoom';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface GroupResource {
  id: string;
  resource_type: 'note' | 'course';
  resource_id: string;
  shared_by: string;
  created_at: string;
  resource?: {
    title?: string;
    name?: string;
  };
  sharer?: {
    display_name: string | null;
    username: string | null;
  };
}

interface GroupMember {
  id: string;
  user_id: string;
  role: string;
  profile?: {
    display_name: string | null;
    username: string | null;
    avatar_url: string | null;
  };
}

interface GroupDetailProps {
  groupId: string;
  groupName: string;
  onBack: () => void;
}

const GroupDetail = ({ groupId, groupName, onBack }: GroupDetailProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('chat');
  const [resources, setResources] = useState<GroupResource[]>([]);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [userNotes, setUserNotes] = useState<{ id: string; title: string }[]>([]);
  const [userCourses, setUserCourses] = useState<{ id: string; name: string }[]>([]);
  const [selectedNote, setSelectedNote] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchGroupData();
      fetchUserResources();
    }
  }, [user, groupId]);

  const fetchGroupData = async () => {
    try {
      // Fetch members
      const { data: membersData } = await supabase
        .from('study_group_members')
        .select('*')
        .eq('group_id', groupId);

      if (membersData && membersData.length > 0) {
        const userIds = membersData.map(m => m.user_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, display_name, username, avatar_url')
          .in('user_id', userIds);

        const profileMap = new Map(profiles?.map(p => [p.user_id, p]));
        const enrichedMembers = membersData.map(m => ({
          ...m,
          profile: profileMap.get(m.user_id),
        }));
        setMembers(enrichedMembers);
      }

      // Fetch resources
      const { data: resourcesData } = await supabase
        .from('group_resources')
        .select('*')
        .eq('group_id', groupId)
        .order('created_at', { ascending: false });

      if (resourcesData && resourcesData.length > 0) {
        // Fetch note titles
        const noteIds = resourcesData.filter(r => r.resource_type === 'note').map(r => r.resource_id);
        const courseIds = resourcesData.filter(r => r.resource_type === 'course').map(r => r.resource_id);
        const sharerIds = resourcesData.map(r => r.shared_by);

        const [notesRes, coursesRes, sharersRes] = await Promise.all([
          noteIds.length > 0 ? supabase.from('notes').select('id, title').in('id', noteIds) : { data: [] },
          courseIds.length > 0 ? supabase.from('courses').select('id, name').in('id', courseIds) : { data: [] },
          supabase.from('profiles').select('user_id, display_name, username').in('user_id', sharerIds),
        ]);

        const noteMap = new Map<string, any>(notesRes.data?.map(n => [n.id, n]) || []);
        const courseMap = new Map<string, any>(coursesRes.data?.map(c => [c.id, c]) || []);
        const sharerMap = new Map<string, any>(sharersRes.data?.map(s => [s.user_id, s]) || []);

        const enrichedResources = resourcesData.map(r => ({
          ...r,
          resource_type: r.resource_type as 'note' | 'course',
          resource: r.resource_type === 'note' ? noteMap.get(r.resource_id) : courseMap.get(r.resource_id),
          sharer: sharerMap.get(r.shared_by),
        }));
        setResources(enrichedResources);
      }
    } catch (error) {
      console.error('Error fetching group data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserResources = async () => {
    try {
      const [notesRes, coursesRes] = await Promise.all([
        supabase.from('notes').select('id, title').eq('user_id', user?.id).order('created_at', { ascending: false }),
        supabase.from('courses').select('id, name').eq('user_id', user?.id),
      ]);

      setUserNotes(notesRes.data || []);
      setUserCourses(coursesRes.data || []);
    } catch (error) {
      console.error('Error fetching user resources:', error);
    }
  };

  const shareResource = async (type: 'note' | 'course', resourceId: string) => {
    if (!resourceId) return;

    try {
      const { error } = await supabase
        .from('group_resources')
        .insert({
          group_id: groupId,
          shared_by: user?.id,
          resource_type: type,
          resource_id: resourceId,
        });

      if (error) throw error;

      toast({ title: `${type === 'note' ? 'Note' : 'Course'} shared!` });
      fetchGroupData();
      setSelectedNote('');
      setSelectedCourse('');
    } catch (error) {
      console.error('Error sharing resource:', error);
      toast({ title: 'Failed to share', variant: 'destructive' });
    }
  };

  const removeResource = async (resourceId: string) => {
    try {
      const { error } = await supabase
        .from('group_resources')
        .delete()
        .eq('id', resourceId);

      if (error) throw error;

      toast({ title: 'Resource removed' });
      fetchGroupData();
    } catch (error) {
      toast({ title: 'Failed to remove', variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-3 mb-4">
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h3 className="font-semibold text-foreground">{groupName}</h3>
              <p className="text-xs text-muted-foreground">{members.length} members</p>
            </div>
          </div>

          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="chat" className="flex items-center gap-1">
              <MessageSquare className="w-4 h-4" />
              Chat
            </TabsTrigger>
            <TabsTrigger value="resources" className="flex items-center gap-1">
              <BookOpen className="w-4 h-4" />
              Resources
            </TabsTrigger>
            <TabsTrigger value="members" className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              Members
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="chat" className="flex-1 m-0">
          <ChatRoom
            type="group"
            targetId={groupId}
            targetName={groupName}
            onBack={onBack}
          />
        </TabsContent>

        <TabsContent value="resources" className="flex-1 m-0 p-4 space-y-4">
          {/* Share Resources */}
          <Card className="p-4 bg-card border-border">
            <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
              <Share2 className="w-4 h-4" />
              Share with Group
            </h4>
            <div className="space-y-3">
              <div className="flex gap-2">
                <Select value={selectedNote} onValueChange={setSelectedNote}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select a note..." />
                  </SelectTrigger>
                  <SelectContent>
                    {userNotes.map(note => (
                      <SelectItem key={note.id} value={note.id}>{note.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={() => shareResource('note', selectedNote)} disabled={!selectedNote}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex gap-2">
                <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select a course..." />
                  </SelectTrigger>
                  <SelectContent>
                    {userCourses.map(course => (
                      <SelectItem key={course.id} value={course.id}>{course.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={() => shareResource('course', selectedCourse)} disabled={!selectedCourse}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>

          {/* Shared Resources */}
          <div className="space-y-2">
            <h4 className="font-medium text-foreground">Shared Resources</h4>
            {resources.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No resources shared yet</p>
            ) : (
              resources.map((resource) => (
                <motion.div
                  key={resource.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 rounded-xl bg-card border border-border flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      {resource.resource_type === 'note' ? (
                        <FileText className="w-5 h-5 text-primary" />
                      ) : (
                        <BookOpen className="w-5 h-5 text-primary" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-foreground text-sm">
                        {resource.resource?.title || resource.resource?.name || 'Untitled'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        by {resource.sharer?.username ? `@${resource.sharer.username}` : resource.sharer?.display_name || 'User'}
                      </p>
                    </div>
                  </div>
                  {resource.shared_by === user?.id && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => removeResource(resource.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </motion.div>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="members" className="flex-1 m-0 p-4">
          <ScrollArea className="h-full">
            <div className="space-y-2">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="p-3 rounded-xl bg-card border border-border flex items-center gap-3"
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="font-medium">
                      {(member.profile?.username || member.profile?.display_name)?.[0]?.toUpperCase() || '?'}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">
                      {member.profile?.display_name || 'User'}
                      {member.user_id === user?.id && (
                        <span className="text-xs text-primary ml-2">(You)</span>
                      )}
                    </p>
                    {member.profile?.username && (
                      <p className="text-xs text-primary">@{member.profile.username}</p>
                    )}
                  </div>
                  {member.role === 'admin' && (
                    <span className="text-xs px-2 py-0.5 bg-amber-500/10 text-amber-500 rounded-full">
                      Admin
                    </span>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GroupDetail;
