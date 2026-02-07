import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function searchJSearch(query: string, location: string, jobType: string, remote: string, apiKey: string) {
  let searchQuery = query;
  if (location) searchQuery += ` in ${location}`;

  const params = new URLSearchParams({
    query: searchQuery,
    page: "1",
    num_pages: "1",
    date_posted: "all",
  });

  if (jobType && jobType !== "all") {
    const typeMap: Record<string, string> = {
      "full-time": "FULLTIME",
      "part-time": "PARTTIME",
      "internship": "INTERN",
      "contract": "CONTRACTOR",
    };
    if (typeMap[jobType]) params.set("employment_types", typeMap[jobType]);
  }

  if (remote === "remote") params.set("remote_jobs_only", "true");

  const response = await fetch(
    `https://jsearch.p.rapidapi.com/search?${params.toString()}`,
    {
      method: "GET",
      headers: {
        "X-RapidAPI-Key": apiKey,
        "X-RapidAPI-Host": "jsearch.p.rapidapi.com",
      },
    }
  );

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`JSearch API error ${response.status}: ${errText}`);
  }

  const data = await response.json();

  return (data.data || []).map((job: any) => ({
    title: job.job_title || "Untitled",
    company: job.employer_name || "Unknown",
    companyLogo: job.employer_logo || null,
    location: [job.job_city, job.job_state, job.job_country].filter(Boolean).join(", ") || "Not specified",
    type: job.job_employment_type || "Not specified",
    description: job.job_description ? job.job_description.substring(0, 300) + "..." : "No description available",
    applyUrl: job.job_apply_link || null,
    jobUrl: job.job_google_link || null,
    isRemote: job.job_is_remote || false,
    postedDate: job.job_posted_at_datetime_utc || null,
    salaryMin: job.job_min_salary || null,
    salaryMax: job.job_max_salary || null,
    salaryCurrency: job.job_salary_currency || "USD",
    salaryPeriod: job.job_salary_period || null,
    publisher: job.job_publisher || null,
    highlights: job.job_highlights?.Qualifications?.slice(0, 5) || [],
  }));
}

async function searchRemotive(query: string) {
  const response = await fetch(`https://remotive.com/api/remote-jobs?search=${encodeURIComponent(query)}&limit=20`);

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Remotive API error ${response.status}: ${errText}`);
  }

  const data = await response.json();

  return (data.jobs || []).map((job: any) => ({
    title: job.title || "Untitled",
    company: job.company_name || "Unknown",
    companyLogo: job.company_logo || null,
    location: job.candidate_required_location || "Remote",
    type: job.job_type || "Not specified",
    description: job.description ? job.description.replace(/<[^>]*>/g, '').substring(0, 300) + "..." : "No description",
    applyUrl: job.url || null,
    jobUrl: job.url || null,
    isRemote: true,
    postedDate: job.publication_date || null,
    salaryMin: null,
    salaryMax: null,
    salaryCurrency: "USD",
    salaryPeriod: null,
    publisher: "Remotive",
    highlights: job.tags || [],
  }));
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, location, jobType, remote } = await req.json();

    if (!query) {
      return new Response(
        JSON.stringify({ success: false, error: "Query is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const RAPIDAPI_KEY = Deno.env.get("RAPIDAPI_KEY");
    let jobs: any[] = [];
    let source = "";

    // Try JSearch first, fall back to Remotive
    if (RAPIDAPI_KEY) {
      try {
        console.log("Trying JSearch API...");
        jobs = await searchJSearch(query, location || "", jobType || "all", remote || "all", RAPIDAPI_KEY);
        source = "jsearch";
        console.log(`JSearch returned ${jobs.length} results`);
      } catch (err) {
        console.warn("JSearch failed, falling back to Remotive:", err);
      }
    }

    if (jobs.length === 0) {
      try {
        console.log("Using Remotive API...");
        jobs = await searchRemotive(query);
        source = "remotive";
        console.log(`Remotive returned ${jobs.length} results`);
      } catch (err) {
        console.error("Remotive also failed:", err);
      }
    }

    return new Response(
      JSON.stringify({ success: true, jobs, total: jobs.length, source }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Job search error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Search failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
