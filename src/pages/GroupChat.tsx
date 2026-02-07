import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Users, Copy, Check, Share2, FileText, BookOpen, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import ChatRoom from '@/components/chat/ChatRoom';
import NoteViewerDialog from '@/components/notes/NoteViewerDialog';

interface GroupInfo {
  id: string;
  name: string;
  description: string | null;
  topic: string | null;
  creator_id: string;
  is_public: boolean;
  invitation_code: string;
  member_count: number;
}

interface Member {
  user_id: string;
  role: string;
  profile: { display_name: string | null; full_name: string | null; avatar_url: string | null; username: string | null; };
}

interface Resource {
  id: string;
  resource_type: string;
  resource_id: string;
  created_at: string;
  shared_by: string;
  resource_name?: string;
}

const GroupChat = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [group, setGroup] = useState<GroupInfo | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [viewingNoteId, setViewingNoteId] = useState<string | null>(null);
  const [viewingNote, setViewingNote] = useState<any>(null);

  useEffect(() => {
    if (groupId && user) fetchGroupData();
  }, [groupId, user]);

  const fetchGroupData = async () => {
    if (!groupId) return;
    try {
      const { data: groupData } = await supabase.from('study_groups').select('*').eq('id', groupId).single();
      if (!groupData) { navigate('/social'); return; }

      const { count } = await supabase.from('study_group_members').select('*', { count: 'exact', head: true }).eq('group_id', groupId);
      setGroup({ ...groupData, member_count: count || 0 });

      const { data: membersData } = await supabase.from('study_group_members').select('user_id, role').eq('group_id', groupId);
      if (membersData) {
        const userIds = membersData.map(m => m.user_id);
        const { data: profiles } = await supabase.from('profiles').select('user_id, display_name, full_name, avatar_url, username').in('user_id', userIds);
        const profileMap = new Map(profiles?.map(p => [p.user_id, p]));
        setMembers(membersData.map(m => ({ ...m, profile: profileMap.get(m.user_id) || { display_name: null, full_name: null, avatar_url: null, username: null } })));
      }

      const { data: resourcesData } = await supabase.from('group_resources').select('*').eq('group_id', groupId).order('created_at', { ascending: false });
      if (resourcesData) {
        const enriched = await Promise.all(resourcesData.map(async (r) => {
          if (r.resource_type === 'note') {
            const { data } = await supabase.from('notes').select('title').eq('id', r.resource_id).single();
            return { ...r, resource_name: data?.title || 'Unknown Note' };
          } else if (r.resource_type === 'course') {
            const { data } = await supabase.from('courses').select('name').eq('id', r.resource_id).single();
            return { ...r, resource_name: data?.name || 'Unknown Course' };
          }
          return r;
        }));
        setResources(enriched);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyInviteCode = async () => {
    if (!group?.invitation_code) return;
    await navigator.clipboard.writeText(group.invitation_code);
    setCopied(true);
    toast({ title: 'Invite code copied!' });
    setTimeout(() => setCopied(false), 2000);
  };

  const shareInvite = async () => {
    if (!group) return;
    if (navigator.share) {
      try {
        await navigator.share({ title: `Join ${group.name}`, text: `Join my study group "${group.name}" with code: ${group.invitation_code}` });
      } catch {}
    } else {
      copyInviteCode();
    }
  };

  const openResource = async (resource: Resource) => {
    if (resource.resource_type === 'note') {
      const { data } = await supabase.from('notes').select('*').eq('id', resource.resource_id).single();
      if (data) {
        setViewingNote(data);
      }
    } else if (resource.resource_type === 'course') {
      navigate(`/course/${resource.resource_id}`);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (!group) return <div className="min-h-screen flex flex-col items-center justify-center gap-4"><p className="text-muted-foreground">Group not found</p><Button onClick={() => navigate('/social')}>Go to Social</Button></div>;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <motion.header initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 p-4 border-b border-border bg-card">
        <Button variant="ghost" size="icon" onClick={() => navigate('/social')}><ArrowLeft className="w-5 h-5" /></Button>
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center"><Users className="w-5 h-5 text-primary" /></div>
        <div className="flex-1">
          <h1 className="font-semibold text-foreground">{group.name}</h1>
          <p className="text-xs text-muted-foreground">{group.member_count} members • {group.topic || 'General'}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={shareInvite}>{copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}</Button>
      </motion.header>

      <Tabs defaultValue="chat" className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="mx-4 mt-2">
          <TabsTrigger value="chat" className="flex-1">Chat</TabsTrigger>
          <TabsTrigger value="resources" className="flex-1">Resources</TabsTrigger>
          <TabsTrigger value="members" className="flex-1">Members</TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="flex-1 overflow-hidden m-0">
          <ChatRoom groupId={groupId} />
        </TabsContent>

        <TabsContent value="resources" className="flex-1 overflow-auto p-4 m-0">
          <div className="space-y-3">
            {resources.length === 0 ? (
              <Card className="p-8 text-center"><FileText className="w-12 h-12 mx-auto text-muted-foreground mb-3" /><p className="text-muted-foreground">No shared resources yet</p></Card>
            ) : (
              resources.map(resource => (
                <Card key={resource.id} className="p-4 flex items-center gap-3 cursor-pointer hover:border-primary/50 transition-colors" onClick={() => openResource(resource)}>
                  {resource.resource_type === 'note' ? <FileText className="w-5 h-5 text-primary" /> : <BookOpen className="w-5 h-5 text-primary" />}
                  <div className="flex-1">
                    <p className="font-medium">{resource.resource_name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{resource.resource_type}</p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-muted-foreground" />
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="members" className="flex-1 overflow-auto p-4 m-0">
          <div className="space-y-3">
            {members.map(member => (
              <Card key={member.user_id} className="p-4 flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={member.profile.avatar_url || undefined} />
                  <AvatarFallback>{(member.profile.username || member.profile.display_name || member.profile.full_name)?.[0]?.toUpperCase() || '?'}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium">{member.profile.display_name || member.profile.full_name || 'User'}
                    {member.user_id === user?.id && <span className="text-xs text-primary ml-2">(You)</span>}
                  </p>
                  {member.profile.username && <p className="text-xs text-primary">@{member.profile.username}</p>}
                </div>
                {member.role === 'admin' && <span className="text-xs px-2 py-0.5 bg-amber-500/10 text-amber-500 rounded-full">Admin</span>}
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {!group.is_public && (
        <div className="p-4 bg-primary/10 border-t border-primary/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Private Group</p>
              <p className="text-xs text-muted-foreground">Share code: <span className="font-mono text-primary">{group.invitation_code}</span></p>
            </div>
            <Button size="sm" variant="outline" onClick={copyInviteCode}>{copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}</Button>
          </div>
        </div>
      )}

      {/* Note Viewer Dialog */}
      {viewingNote && (
        <NoteViewerDialog
          note={viewingNote}
          open={!!viewingNote}
          onOpenChange={(open) => { if (!open) { setViewingNote(null); } }}
        />
      )}
    </div>
  );
};

export default GroupChat;
