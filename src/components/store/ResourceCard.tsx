import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, Lock, BookOpen, FileText, Video, Bookmark, Share2 } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import FeatureGateDialog from "@/components/subscription/FeatureGateDialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface ResourceCardProps {
  resource: {
    id: string;
    title: string;
    description: string | null;
    category: string;
    subject: string;
    grade_level: string;
    file_url: string | null;
    youtube_url: string | null;
    thumbnail_url: string | null;
    author: string | null;
    is_free: boolean;
    required_tier: string;
    download_count: number;
  };
}

const categoryIcons: Record<string, any> = {
  textbook: BookOpen,
  book: BookOpen,
  past_paper: FileText,
  video: Video,
};

export const ResourceCard = ({ resource }: ResourceCardProps) => {
  const { subscription } = useSubscription();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [gateOpen, setGateOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const tier = subscription?.tier || 'free';

  const isLocked = !resource.is_free && (
    (resource.required_tier === 'plus' && tier === 'free') ||
    (resource.required_tier === 'pro' && tier !== 'pro')
  );

  const Icon = categoryIcons[resource.category] || BookOpen;

  const handleDownload = async () => {
    if (isLocked) {
      setGateOpen(true);
      return;
    }
    if (resource.file_url) {
      window.open(resource.file_url, '_blank');
      await supabase
        .from('store_resources')
        .update({ download_count: resource.download_count + 1 })
        .eq('id', resource.id);
    }
  };

  const handleSaveAsNote = async () => {
    if (!user || isLocked) return;
    setSaving(true);
    try {
      const link = resource.file_url || resource.youtube_url || '';
      const content = [
        `# ${resource.title}`,
        resource.author ? `**Author:** ${resource.author}` : '',
        `**Subject:** ${resource.subject}`,
        `**Grade:** ${resource.grade_level}`,
        `**Category:** ${resource.category.replace('_', ' ')}`,
        resource.description ? `\n${resource.description}` : '',
        link ? `\n**Link:** [Open Resource](${link})` : '',
      ].filter(Boolean).join('\n');

      const { error } = await supabase.from('notes').insert({
        title: resource.title,
        content,
        source_type: 'store',
        user_id: user.id,
      });
      if (error) throw error;
      toast({
        title: "Saved as note!",
        description: "Resource saved to your Smart Notes.",
        action: (
          <Button variant="outline" size="sm" onClick={() => navigate('/notes')}>
            View Notes
          </Button>
        ),
      });
    } catch (err: any) {
      toast({ title: "Failed to save", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({ title: resource.title, url: resource.file_url || resource.youtube_url || '' });
    } else {
      await navigator.clipboard.writeText(resource.file_url || resource.youtube_url || '');
      toast({ title: "Link copied!" });
    }
  };

  return (
    <>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow relative group">
        {isLocked && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center gap-2">
            <Lock className="w-8 h-8 text-muted-foreground" />
            <Badge variant="outline" className="capitalize">{resource.required_tier} required</Badge>
          </div>
        )}
        <div className="aspect-[3/2] bg-muted flex items-center justify-center relative overflow-hidden">
          {resource.thumbnail_url ? (
            <img src={resource.thumbnail_url} alt={resource.title} className="w-full h-full object-cover" />
          ) : (
            <Icon className="w-12 h-12 text-muted-foreground/50" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          <Badge className="absolute top-2 right-2 capitalize text-xs">{resource.category.replace('_', ' ')}</Badge>
          {resource.is_free && (
            <Badge className="absolute top-2 left-2 text-xs bg-green-600 text-white hover:bg-green-700">FREE</Badge>
          )}
        </div>
        <CardContent className="p-3 space-y-2">
          <h3 className="font-semibold text-sm line-clamp-2">{resource.title}</h3>
          {resource.author && (
            <p className="text-xs text-muted-foreground">by {resource.author}</p>
          )}
          <div className="flex items-center gap-1.5 flex-wrap">
            <Badge variant="secondary" className="text-xs">{resource.subject}</Badge>
            <Badge variant="outline" className="text-xs">{resource.grade_level}</Badge>
          </div>
          {resource.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">{resource.description}</p>
          )}
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-muted-foreground">{resource.download_count} downloads</span>
            <div className="flex items-center gap-1">
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7"
                onClick={handleSaveAsNote}
                disabled={isLocked || saving || !user}
                title="Save as Note"
              >
                <Bookmark className="w-3.5 h-3.5" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7"
                onClick={handleShare}
                title="Share"
              >
                <Share2 className="w-3.5 h-3.5" />
              </Button>
              {resource.file_url && (
                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={handleDownload}>
                  <Download className="w-3 h-3 mr-1" />
                  Download
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <FeatureGateDialog
        open={gateOpen}
        onOpenChange={setGateOpen}
        feature="Premium Resources"
        currentUsage={0}
        limit={0}
        isLifetime
        requiredTier={resource.required_tier as 'plus' | 'pro'}
      />
    </>
  );
};
