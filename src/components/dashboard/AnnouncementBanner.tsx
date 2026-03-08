import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { X, Megaphone, AlertTriangle, Gift } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Announcement {
  id: string;
  title: string;
  content: string;
  type: string;
}

const typeConfig: Record<string, { icon: React.ReactNode; className: string }> = {
  info: { icon: <Megaphone className="w-4 h-4" />, className: "bg-primary/10 border-primary/20 text-primary" },
  warning: { icon: <AlertTriangle className="w-4 h-4" />, className: "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400" },
  promo: { icon: <Gift className="w-4 h-4" />, className: "bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400" },
};

const AnnouncementBanner = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const { data } = await supabase
          .from('announcements' as any)
          .select('id, title, content, type')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(3);
        if (data) setAnnouncements(data as any[]);
      } catch {
        // Silently fail — announcements are non-critical
      }
    };
    fetchAnnouncements();
  }, []);

  const visible = announcements.filter(a => !dismissed.has(a.id));
  if (visible.length === 0) return null;

  return (
    <div className="space-y-2">
      <AnimatePresence>
        {visible.map(a => {
          const config = typeConfig[a.type] || typeConfig.info;
          return (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className={`flex items-start gap-3 p-3 rounded-lg border ${config.className}`}
            >
              <span className="mt-0.5">{config.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{a.title}</p>
                <p className="text-xs opacity-80 mt-0.5">{a.content}</p>
              </div>
              <button onClick={() => setDismissed(prev => new Set(prev).add(a.id))} className="opacity-60 hover:opacity-100">
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

export default AnnouncementBanner;
