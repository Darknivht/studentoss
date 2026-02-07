import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Users, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import ChatRoom from '@/components/chat/ChatRoom';

const Chat = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const groupId = searchParams.get('group');
  const recipientId = searchParams.get('user');
  
  const [chatInfo, setChatInfo] = useState<{ name: string; type: 'group' | 'dm' } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChatInfo = async () => {
      if (!user) return;

      if (groupId) {
        const { data } = await supabase
          .from('study_groups')
          .select('name')
          .eq('id', groupId)
          .single();
        
        if (data) {
          setChatInfo({ name: data.name, type: 'group' });
        }
      } else if (recipientId) {
        const { data } = await supabase
          .from('profiles')
          .select('display_name, full_name')
          .eq('user_id', recipientId)
          .single();
        
        if (data) {
          setChatInfo({ 
            name: data.display_name || data.full_name || 'User', 
            type: 'dm' 
          });
        }
      }
      setLoading(false);
    };

    fetchChatInfo();
  }, [user, groupId, recipientId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!chatInfo) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Chat not found</p>
        <Button onClick={() => navigate('/social')}>Go to Social</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 p-4 border-b border-border bg-card"
      >
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          {chatInfo.type === 'group' ? (
            <Users className="w-5 h-5 text-primary" />
          ) : (
            <MessageCircle className="w-5 h-5 text-primary" />
          )}
        </div>
        <div className="flex-1">
          <h1 className="font-semibold text-foreground">{chatInfo.name}</h1>
          <p className="text-xs text-muted-foreground">
            {chatInfo.type === 'group' ? 'Group Chat' : 'Direct Message'}
          </p>
        </div>
      </motion.header>

      {/* Chat Room */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <ChatRoom 
          groupId={groupId || undefined}
          recipientId={recipientId || undefined}
        />
      </div>
    </div>
  );
};

export default Chat;
