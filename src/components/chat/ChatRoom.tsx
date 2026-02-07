import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Send, ArrowLeft, Reply, X } from 'lucide-react';
import MediaUpload from '@/components/chat/MediaUpload';
import { format, isToday, isYesterday } from 'date-fns';

interface Message {
  id: string;
  sender_id: string;
  recipient_id?: string;
  content: string;
  image_url?: string | null;
  reply_to_id?: string | null;
  created_at: string;
  sender?: {
    display_name: string | null;
    username: string | null;
    avatar_url: string | null;
  };
}

interface ChatRoomProps {
  type?: 'group' | 'dm';
  targetId?: string;
  targetName?: string;
  onBack?: () => void;
  groupId?: string;
  recipientId?: string;
}

const ChatRoom = ({ type, targetId, targetName, onBack, groupId, recipientId }: ChatRoomProps) => {
  const chatType = type || (groupId ? 'group' : 'dm');
  const chatTargetId = targetId || groupId || recipientId || '';
  const chatTargetName = targetName || '';
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (user) {
      fetchMessages();
      subscribeToMessages();
    }
    return () => { if (channelRef.current) supabase.removeChannel(channelRef.current); };
  }, [user, chatTargetId]);

  useEffect(() => { scrollToBottom(); }, [messages]);

  const scrollToBottom = () => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  };

  const fetchMessages = async () => {
    try {
      let query = supabase.from('messages').select('*').order('created_at', { ascending: true }).limit(100);
      if (chatType === 'group') {
        query = query.eq('group_id', chatTargetId);
      } else {
        query = query.is('group_id', null)
          .or(`and(sender_id.eq.${user?.id},recipient_id.eq.${chatTargetId}),and(sender_id.eq.${chatTargetId},recipient_id.eq.${user?.id})`);
      }
      const { data, error } = await query;
      if (error) throw error;

      const senderIds = [...new Set(data?.map(m => m.sender_id) || [])];
      const { data: profiles } = await supabase.from('profiles').select('user_id, display_name, username, avatar_url').in('user_id', senderIds);
      const profileMap = new Map(profiles?.map(p => [p.user_id, p]));

      setMessages((data || []).map(m => ({ ...m, sender: profileMap.get(m.sender_id) || null })));
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToMessages = () => {
    const channelName = chatType === 'group' ? `group_${chatTargetId}` : `dm_${[user?.id, chatTargetId].sort().join('_')}`;
    channelRef.current = supabase.channel(channelName)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: chatType === 'group' ? `group_id=eq.${chatTargetId}` : undefined },
        async (payload) => {
          const newMsg = payload.new as Message;
          if (chatType === 'dm') {
            const isRelevant = (newMsg.sender_id === user?.id && newMsg.recipient_id === chatTargetId) || (newMsg.sender_id === chatTargetId && newMsg.recipient_id === user?.id);
            if (!isRelevant) return;
          }
          const { data: profile } = await supabase.from('profiles').select('user_id, display_name, username, avatar_url').eq('user_id', newMsg.sender_id).single();
          setMessages(prev => [...prev, { ...newMsg, sender: profile }]);
        }
      ).subscribe();
  };

  const sendMessage = async (imageUrl?: string) => {
    if ((!newMessage.trim() && !imageUrl) || !user || sending) return;

    setSending(true);
    try {
      const messageData: any = { sender_id: user.id, content: newMessage.trim() || (imageUrl ? '📷 Image' : '') };
      if (imageUrl) messageData.image_url = imageUrl;
      if (replyingTo) messageData.reply_to_id = replyingTo.id;
      if (chatType === 'group') messageData.group_id = chatTargetId;
      else messageData.recipient_id = chatTargetId;

      const { error } = await supabase.from('messages').insert(messageData);
      if (error) throw error;
      setNewMessage('');
      setReplyingTo(null);
    } catch (error) {
      console.error('Error sending message:', error);
      toast({ title: 'Failed to send message', variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  const getDateLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'MMM d, yyyy');
  };

  const formatTime = (dateStr: string) => format(new Date(dateStr), 'h:mm a');

  const getRepliedMessage = (replyToId: string | null | undefined): Message | undefined => {
    if (!replyToId) return undefined;
    return messages.find(m => m.id === replyToId);
  };

  // Group messages by date
  const groupedMessages: { label: string; messages: Message[] }[] = [];
  let currentLabel = '';
  messages.forEach(m => {
    const label = getDateLabel(m.created_at);
    if (label !== currentLabel) {
      currentLabel = label;
      groupedMessages.push({ label, messages: [m] });
    } else {
      groupedMessages[groupedMessages.length - 1].messages.push(m);
    }
  });

  if (loading) return <div className="h-full flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="flex flex-col h-full">
      {onBack && (
        <div className="flex items-center gap-3 p-4 border-b border-border flex-shrink-0">
          <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="w-5 h-5" /></Button>
          <div>
            <h3 className="font-semibold text-foreground">{chatTargetName}</h3>
            <p className="text-xs text-muted-foreground">{chatType === 'group' ? 'Group Chat' : 'Direct Message'}</p>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4" ref={scrollRef}>
        <div className="space-y-1">
          {groupedMessages.map((group, gi) => (
            <div key={gi}>
              <div className="flex justify-center my-4">
                <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">{group.label}</span>
              </div>
              <AnimatePresence>
                {group.messages.map((message) => {
                  const isOwn = message.sender_id === user?.id;
                  const repliedMsg = getRepliedMessage(message.reply_to_id);
                  return (
                    <motion.div
                      key={message.id}
                      id={`msg-${message.id}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex gap-2 mb-3 group relative ${isOwn ? 'flex-row-reverse' : ''}`}
                    >
                      {!isOwn && (
                        <Avatar className="h-8 w-8 shrink-0">
                          <AvatarImage src={message.sender?.avatar_url || undefined} />
                          <AvatarFallback className="text-xs">{(message.sender?.username || message.sender?.display_name)?.[0]?.toUpperCase() || '?'}</AvatarFallback>
                        </Avatar>
                      )}
                      <div className={`max-w-[75%] ${isOwn ? 'items-end' : 'items-start'}`}>
                        {!isOwn && chatType === 'group' && (
                          <p className="text-xs text-primary mb-0.5 font-medium">
                            {message.sender?.username ? `@${message.sender.username}` : message.sender?.display_name || 'User'}
                          </p>
                        )}

                        {/* Replied message quote - clickable to scroll */}
                        {repliedMsg && (
                          <div
                            onClick={() => {
                              const el = document.getElementById(`msg-${repliedMsg.id}`);
                              if (el) {
                                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                el.classList.add('ring-2', 'ring-primary/50', 'rounded-xl');
                                setTimeout(() => el.classList.remove('ring-2', 'ring-primary/50', 'rounded-xl'), 2000);
                              }
                            }}
                            className={`mb-1 px-3 py-1.5 rounded-lg border-l-2 border-primary/60 bg-muted/50 text-xs max-w-full cursor-pointer hover:bg-muted/80 transition-colors ${isOwn ? 'ml-auto' : ''}`}
                          >
                            <p className="text-primary/80 font-medium truncate">
                              {repliedMsg.sender_id === user?.id ? 'You' : (repliedMsg.sender?.username ? `@${repliedMsg.sender.username}` : repliedMsg.sender?.display_name || 'User')}
                            </p>
                            <p className="text-muted-foreground truncate">{repliedMsg.content}</p>
                          </div>
                        )}

                        <div className={`px-4 py-2.5 rounded-2xl ${isOwn ? 'bg-primary text-primary-foreground rounded-br-md' : 'bg-muted text-foreground rounded-bl-md'}`}>
                          {message.image_url && (
                            <img
                              src={message.image_url}
                              alt="Shared"
                              className="rounded-lg max-w-full max-h-48 object-cover mb-1 cursor-pointer"
                              onClick={() => setLightboxImage(message.image_url!)}
                            />
                          )}
                          {message.content && message.content !== '📷 Image' && (
                            <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                          )}
                        </div>
                        <p className={`text-[10px] text-muted-foreground mt-0.5 ${isOwn ? 'text-right' : ''}`}>
                          {formatTime(message.created_at)}
                        </p>
                      </div>

                      {/* Reply button on hover */}
                      <button
                        onClick={() => setReplyingTo(message)}
                        className={`opacity-0 group-hover:opacity-100 transition-opacity self-center p-1 rounded-full hover:bg-muted ${isOwn ? 'order-first' : ''}`}
                        title="Reply"
                      >
                        <Reply className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          ))}
          {messages.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <p>No messages yet</p>
              <p className="text-sm">Start the conversation!</p>
            </div>
          )}
        </div>
      </div>

      {/* Reply preview bar */}
      {replyingTo && (
        <div className="px-3 pt-2 pb-1 border-t border-border bg-muted/30 flex items-center gap-2 flex-shrink-0">
          <Reply className="w-4 h-4 text-primary shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-primary">
              {replyingTo.sender_id === user?.id ? 'You' : (replyingTo.sender?.username ? `@${replyingTo.sender.username}` : replyingTo.sender?.display_name || 'User')}
            </p>
            <p className="text-xs text-muted-foreground truncate">{replyingTo.content}</p>
          </div>
          <button onClick={() => setReplyingTo(null)} className="p-1 rounded hover:bg-muted">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      )}

      {/* Input - always visible */}
      <div className="p-3 border-t border-border flex-shrink-0 bg-background">
        <div className="flex items-center gap-2">
          {user && <MediaUpload userId={user.id} onUploaded={(url) => sendMessage(url)} />}
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            className="flex-1"
          />
          <Button onClick={() => sendMessage()} disabled={sending || !newMessage.trim()} size="icon">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Lightbox */}
      <Dialog open={!!lightboxImage} onOpenChange={() => setLightboxImage(null)}>
        <DialogContent className="max-w-[90vw] max-h-[90vh] p-2">
          {lightboxImage && <img src={lightboxImage} alt="Full size" className="w-full h-full object-contain rounded-lg" />}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ChatRoom;
