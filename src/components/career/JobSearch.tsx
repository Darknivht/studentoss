import { useState } from 'react';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { streamAIChat } from '@/lib/ai';
import { Search, MapPin, Briefcase, ExternalLink, Loader2, Globe, Clock } from 'lucide-react';

interface JobListing {
  title: string;
  company: string;
  location: string;
  type: string;
  description: string;
  skills: string[];
  url: string;
  posted: string;
}

const JobSearch = () => {
  const { toast } = useToast();
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');
  const [jobType, setJobType] = useState('all');
  const [remote, setRemote] = useState('all');
  const [results, setResults] = useState<JobListing[]>([]);
  const [loading, setLoading] = useState(false);

  const searchJobs = async () => {
    if (!query.trim()) { toast({ title: 'Enter a search query', variant: 'destructive' }); return; }

    setLoading(true);
    setResults([]);

    const filters = [
      jobType !== 'all' ? `Type: ${jobType}` : '',
      location ? `Location: ${location}` : '',
      remote !== 'all' ? `Remote: ${remote}` : '',
    ].filter(Boolean).join(', ');

    const prompt = `You are a job search assistant. Search for real, current job listings matching: "${query}"${filters ? `. Filters: ${filters}` : ''}.

Return exactly 6 job listings as a JSON array. Use REAL company names and realistic job details. Each listing must have:
- title: exact job title
- company: real company name
- location: city/country or "Remote"
- type: "Full-time" | "Part-time" | "Internship" | "Contract"
- description: 2-3 sentence description
- skills: array of 3-5 required skills
- url: a Google search URL like "https://www.google.com/search?q=COMPANY+JOB_TITLE+careers" (URL-encoded)
- posted: realistic posting date like "2 days ago" or "1 week ago"

Return ONLY the JSON array, no other text.`;

    try {
      let fullResponse = '';
      await streamAIChat({
        messages: [{ role: 'user', content: prompt }],
        onDelta: (chunk) => { fullResponse += chunk; },
        onDone: () => {
          const jsonMatch = fullResponse.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            try { setResults(JSON.parse(jsonMatch[0])); } catch {}
          }
          setLoading(false);
        },
        onError: (err) => { toast({ title: err, variant: 'destructive' }); setLoading(false); },
      });
    } catch {
      toast({ title: 'Search failed', variant: 'destructive' });
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <Card className="p-4">
        <h3 className="font-semibold text-foreground flex items-center gap-2 mb-3">
          <Search className="w-5 h-5 text-primary" />
          Search Jobs & Internships
        </h3>

        <div className="space-y-3">
          <Input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search: e.g. Software Engineer, Data Analyst..."
            onKeyDown={e => e.key === 'Enter' && searchJobs()}
          />
          <div className="grid grid-cols-3 gap-2">
            <Input value={location} onChange={e => setLocation(e.target.value)} placeholder="Location" />
            <Select value={jobType} onValueChange={setJobType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="internship">Internship</SelectItem>
                <SelectItem value="full-time">Full-time</SelectItem>
                <SelectItem value="part-time">Part-time</SelectItem>
                <SelectItem value="contract">Contract</SelectItem>
              </SelectContent>
            </Select>
            <Select value={remote} onValueChange={setRemote}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any</SelectItem>
                <SelectItem value="remote">Remote</SelectItem>
                <SelectItem value="onsite">On-site</SelectItem>
                <SelectItem value="hybrid">Hybrid</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={searchJobs} disabled={loading} className="w-full gradient-primary text-primary-foreground">
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}
            {loading ? 'Searching...' : 'Search'}
          </Button>
        </div>
      </Card>

      {results.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            ⚠️ AI-suggested listings based on your search. Verify opportunities on actual job boards before applying.
          </p>
          {results.map((job, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className="p-4 hover:border-primary/50 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <h5 className="font-semibold text-foreground">{job.title}</h5>
                    <p className="text-sm text-primary">{job.company}</p>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary whitespace-nowrap">{job.type}</span>
                </div>
                <p className="text-sm text-muted-foreground mb-3">{job.description}</p>
                <div className="flex flex-wrap gap-1 mb-2">
                  {job.skills?.map((s, si) => (
                    <span key={si} className="px-2 py-0.5 bg-muted text-muted-foreground text-xs rounded">{s}</span>
                  ))}
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{job.location}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{job.posted}</span>
                  </div>
                  <a href={job.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline">
                    Search <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default JobSearch;
