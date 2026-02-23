import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, Lock, BookOpen, FileText, Video } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { useState } from "react";
import FeatureGateDialog from "@/components/subscription/FeatureGateDialog";
import { supabase } from "@/integrations/supabase/client";

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
  const [gateOpen, setGateOpen] = useState(false);
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
      // Increment download count
      await supabase
        .from('store_resources' as any)
        .update({ download_count: resource.download_count + 1 } as any)
        .eq('id', resource.id);
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
          <Badge className="absolute top-2 right-2 capitalize text-xs">{resource.category.replace('_', ' ')}</Badge>
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
            {resource.file_url && (
              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={handleDownload}>
                <Download className="w-3 h-3 mr-1" />
                Download
              </Button>
            )}
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
