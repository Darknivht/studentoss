import { useState, useEffect, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Video } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ResourceCard } from "@/components/store/ResourceCard";
import { ResourceFilters } from "@/components/store/ResourceFilters";
import { YouTubeSection } from "@/components/store/YouTubeSection";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";

const Store = () => {
  const { user } = useAuth();
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [subject, setSubject] = useState("all");
  const [gradeLevel, setGradeLevel] = useState("all");
  const [userGrade, setUserGrade] = useState<string | null>(null);

  useEffect(() => {
    fetchResources();
    fetchUserGrade();
  }, []);

  const fetchUserGrade = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('profiles')
      .select('grade_level')
      .eq('user_id', user.id)
      .single();
    if (data?.grade_level) {
      setUserGrade(data.grade_level);
      setGradeLevel(data.grade_level);
    }
  };

  const fetchResources = async () => {
    const { data, error } = await supabase
      .from('store_resources' as any)
      .select('*')
      .neq('category', 'video')
      .order('created_at', { ascending: false });
    if (!error && data) setResources(data as any[]);
    setLoading(false);
  };

  const subjects = useMemo(() => 
    [...new Set(resources.map(r => r.subject))].sort(),
    [resources]
  );

  const grades = useMemo(() => 
    [...new Set(resources.map(r => r.grade_level))].sort(),
    [resources]
  );

  const filtered = useMemo(() => {
    return resources.filter(r => {
      if (search && !r.title.toLowerCase().includes(search.toLowerCase()) &&
          !r.subject.toLowerCase().includes(search.toLowerCase())) return false;
      if (category !== 'all' && r.category !== category) return false;
      if (subject !== 'all' && r.subject !== subject) return false;
      if (gradeLevel !== 'all' && r.grade_level !== gradeLevel) return false;
      return true;
    });
  }, [resources, search, category, subject, gradeLevel]);

  return (
    <div className="p-4 pb-24 max-w-4xl mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Resource Store</h1>
        <p className="text-sm text-muted-foreground">Browse textbooks, books, and educational videos</p>
      </div>

      <Tabs defaultValue="books" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="books" className="flex items-center gap-1.5">
            <BookOpen className="w-4 h-4" />
            Books
          </TabsTrigger>
          <TabsTrigger value="videos" className="flex items-center gap-1.5">
            <Video className="w-4 h-4" />
            Videos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="books" className="space-y-4 mt-4">
          <ResourceFilters
            search={search}
            onSearchChange={setSearch}
            category={category}
            onCategoryChange={setCategory}
            subject={subject}
            onSubjectChange={setSubject}
            gradeLevel={gradeLevel}
            onGradeLevelChange={setGradeLevel}
            subjects={subjects}
            grades={grades}
          />

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="aspect-[3/4] rounded-lg" />
              ))}
            </div>
          ) : filtered.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {filtered.map(resource => (
                <ResourceCard key={resource.id} resource={resource} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No resources found</p>
              <p className="text-xs mt-1">Try adjusting your filters</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="videos" className="mt-4">
          <YouTubeSection />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Store;
