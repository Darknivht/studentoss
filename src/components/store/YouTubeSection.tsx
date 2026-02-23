import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Play, X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface Video {
  id: string;
  title: string;
  thumbnail: string;
  channelName: string;
}

export const YouTubeSection = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Video[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeVideo, setActiveVideo] = useState<string | null>(null);
  const [curatedVideos, setCuratedVideos] = useState<any[]>([]);

  const searchYouTube = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-study', {
        body: {
          action: 'youtube-search',
          query: query.trim(),
        },
      });
      if (error) throw error;
      if (data?.results) {
        setResults(data.results.map((item: any) => ({
          id: item.id?.videoId || item.videoId || item.id,
          title: item.title || item.snippet?.title || '',
          thumbnail: item.thumbnail || item.snippet?.thumbnails?.medium?.url || '',
          channelName: item.channelName || item.snippet?.channelTitle || '',
        })));
      }
    } catch (err: any) {
      toast({ title: "Search failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search educational videos..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && searchYouTube()}
            className="pl-9"
          />
        </div>
        <Button onClick={searchYouTube} disabled={loading} size="sm">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Search"}
        </Button>
      </div>

      {/* Active Video Player */}
      {activeVideo && (
        <div className="relative rounded-lg overflow-hidden bg-black aspect-video">
          <Button
            size="icon"
            variant="ghost"
            className="absolute top-2 right-2 z-10 bg-black/50 text-white hover:bg-black/70"
            onClick={() => setActiveVideo(null)}
          >
            <X className="w-4 h-4" />
          </Button>
          <iframe
            src={`https://www.youtube.com/embed/${activeVideo}?autoplay=1`}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}

      {/* Search Results */}
      {results.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-3">Search Results</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {results.map((video) => (
              <Card
                key={video.id}
                className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setActiveVideo(video.id)}
              >
                <div className="aspect-video relative bg-muted">
                  {video.thumbnail ? (
                    <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Play className="w-8 h-8 text-muted-foreground" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <Play className="w-10 h-10 text-white fill-white" />
                  </div>
                </div>
                <CardContent className="p-3">
                  <h4 className="text-sm font-medium line-clamp-2">{video.title}</h4>
                  <p className="text-xs text-muted-foreground mt-1">{video.channelName}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {results.length === 0 && !loading && (
        <div className="text-center py-12 text-muted-foreground">
          <Play className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Search for educational videos above</p>
          <p className="text-xs mt-1">Find tutorials, lectures, and study materials</p>
        </div>
      )}
    </div>
  );
};
