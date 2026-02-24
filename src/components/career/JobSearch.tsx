import { useState } from 'react';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { useSubscription } from '@/hooks/useSubscription';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { Search, MapPin, Briefcase, ExternalLink, Loader2, Globe, Clock, DollarSign, Building2, CalendarDays } from 'lucide-react';
import FeatureGateDialog from '@/components/subscription/FeatureGateDialog';

interface JobListing {
  title: string;
  company: string;
  companyLogo: string | null;
  location: string;
  type: string;
  description: string;
  applyUrl: string | null;
  jobUrl: string | null;
  isRemote: boolean;
  postedDate: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string;
  salaryPeriod: string | null;
  publisher: string | null;
  highlights: string[];
}

const JobSearch = () => {
  const { toast } = useToast();
  const { gateFeature, incrementUsage } = useSubscription();
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');
  const [jobType, setJobType] = useState('all');
  const [remote, setRemote] = useState('all');
  const [datePosted, setDatePosted] = useState('month');
  const [results, setResults] = useState<JobListing[]>([]);
  const [loading, setLoading] = useState(false);
  const [gateOpen, setGateOpen] = useState(false);
  const [gateData, setGateData] = useState<any>(null);

  const searchJobs = async () => {
    if (!query.trim()) {
      toast({ title: 'Enter a search query', variant: 'destructive' });
      return;
    }

    const gate = gateFeature('jobSearch');
    if (!gate.allowed) {
      setGateData(gate);
      setGateOpen(true);
      return;
    }

    setLoading(true);
    setResults([]);

    try {
      const { data, error } = await supabase.functions.invoke('job-search', {
        body: { query, location, jobType, remote, datePosted },
      });

      if (error) throw error;

      if (data?.success && data.jobs) {
        await incrementUsage('jobSearch');
        setResults(data.jobs);
        if (data.jobs.length === 0) {
          toast({ title: 'No results found. Try different keywords or filters.' });
        }
      } else {
        toast({ title: data?.error || 'Search failed', variant: 'destructive' });
      }
    } catch (err: any) {
      console.error('Job search error:', err);
      toast({ title: 'Search failed. Please try again.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Recently';
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  const formatSalary = (job: JobListing) => {
    if (!job.salaryMin && !job.salaryMax) return null;
    const fmt = (n: number) => n >= 1000 ? `${Math.round(n / 1000)}k` : String(n);
    const currency = job.salaryCurrency === 'USD' ? '$' : job.salaryCurrency + ' ';
    if (job.salaryMin && job.salaryMax) return `${currency}${fmt(job.salaryMin)} - ${currency}${fmt(job.salaryMax)}`;
    if (job.salaryMin) return `From ${currency}${fmt(job.salaryMin)}`;
    return `Up to ${currency}${fmt(job.salaryMax!)}`;
  };

  const formatType = (type: string) => {
    const map: Record<string, string> = {
      FULLTIME: 'Full-time', PARTTIME: 'Part-time', INTERN: 'Internship', CONTRACTOR: 'Contract',
    };
    return map[type] || type;
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <Card className="p-4">
        <h3 className="font-semibold text-foreground flex items-center gap-2 mb-3">
          <Search className="w-5 h-5 text-primary" />
          Search Real Jobs & Internships
        </h3>

        <div className="space-y-3">
          <Input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="e.g. Software Engineer, Data Analyst, Marketing Intern..."
            onKeyDown={e => e.key === 'Enter' && searchJobs()}
          />
          <div className="grid grid-cols-2 gap-2">
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
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Select value={remote} onValueChange={setRemote}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any Location</SelectItem>
                <SelectItem value="remote">Remote Only</SelectItem>
                <SelectItem value="onsite">On-site</SelectItem>
              </SelectContent>
            </Select>
            <Select value={datePosted} onValueChange={setDatePosted}>
              <SelectTrigger>
                <div className="flex items-center gap-1">
                  <CalendarDays className="w-3 h-3" />
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Past 24 hours</SelectItem>
                <SelectItem value="3days">Past 3 days</SelectItem>
                <SelectItem value="week">Past week</SelectItem>
                <SelectItem value="month">Past month</SelectItem>
                <SelectItem value="all">Any time</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={searchJobs} disabled={loading} className="w-full gradient-primary text-primary-foreground">
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}
            {loading ? 'Searching real listings...' : 'Search Jobs'}
          </Button>
        </div>
      </Card>

      {results.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            ✅ Showing {results.length} real job listings from across the web. Click "Apply" to visit the original posting.
          </p>
          {results.map((job, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}>
              <Card className="p-4 hover:border-primary/50 transition-colors">
                <div className="flex gap-3 items-start mb-2">
                  {job.companyLogo ? (
                    <img src={job.companyLogo} alt={job.company} className="w-10 h-10 rounded object-contain bg-muted p-1 flex-shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-5 h-5 text-primary" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h5 className="font-semibold text-foreground text-sm leading-tight">{job.title}</h5>
                    <p className="text-sm text-primary">{job.company}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary whitespace-nowrap">
                      {formatType(job.type)}
                    </span>
                    {job.isRemote && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 whitespace-nowrap flex items-center gap-1">
                        <Globe className="w-3 h-3" />Remote
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{job.description}</p>

                {job.highlights.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {job.highlights.slice(0, 4).map((h, hi) => (
                      <span key={hi} className="px-2 py-0.5 bg-muted text-muted-foreground text-xs rounded truncate max-w-[200px]">{h}</span>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{job.location}</span>
                    <span className="flex items-center gap-1 font-medium text-primary"><Clock className="w-3 h-3" />{formatDate(job.postedDate)}</span>
                    {formatSalary(job) && (
                      <span className="flex items-center gap-1 text-emerald-600"><DollarSign className="w-3 h-3" />{formatSalary(job)}</span>
                    )}
                    {job.publisher && <span className="text-muted-foreground/60">via {job.publisher}</span>}
                  </div>
                  {(job.applyUrl || job.jobUrl) && (
                    <a
                      href={job.applyUrl || job.jobUrl || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-primary font-medium hover:underline ml-2 whitespace-nowrap"
                    >
                      Apply <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {gateData && (
        <FeatureGateDialog
          open={gateOpen}
          onOpenChange={setGateOpen}
          feature="job searches this month"
          currentUsage={gateData.currentUsage}
          limit={gateData.limit}
          requiredTier={gateData.requiredTier}
        />
      )}
    </motion.div>
  );
};

export default JobSearch;
