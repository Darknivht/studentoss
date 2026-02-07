import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, location, jobType, remote, page } = await req.json();

    const RAPIDAPI_KEY = Deno.env.get("RAPIDAPI_KEY");
    if (!RAPIDAPI_KEY) {
      return new Response(
        JSON.stringify({ success: false, error: "RAPIDAPI_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!query) {
      return new Response(
        JSON.stringify({ success: false, error: "Query is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build JSearch API query
    let searchQuery = query;
    if (location) searchQuery += ` in ${location}`;

    const params = new URLSearchParams({
      query: searchQuery,
      page: String(page || 1),
      num_pages: "1",
      date_posted: "all",
    });

    // Map job type filter
    if (jobType && jobType !== "all") {
      const typeMap: Record<string, string> = {
        "full-time": "FULLTIME",
        "part-time": "PARTTIME",
        "internship": "INTERN",
        "contract": "CONTRACTOR",
      };
      if (typeMap[jobType]) {
        params.set("employment_types", typeMap[jobType]);
      }
    }

    // Map remote filter
    if (remote && remote !== "all") {
      params.set("remote_jobs_only", remote === "remote" ? "true" : "false");
    }

    console.log("Searching JSearch API:", searchQuery);

    const response = await fetch(
      `https://jsearch.p.rapidapi.com/search?${params.toString()}`,
      {
        method: "GET",
        headers: {
          "X-RapidAPI-Key": RAPIDAPI_KEY,
          "X-RapidAPI-Host": "jsearch.p.rapidapi.com",
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("JSearch API error:", data);
      return new Response(
        JSON.stringify({ success: false, error: data.message || "JSearch API error" }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Format results
    const jobs = (data.data || []).map((job: any) => ({
      title: job.job_title || "Untitled",
      company: job.employer_name || "Unknown",
      companyLogo: job.employer_logo || null,
      location: [job.job_city, job.job_state, job.job_country]
        .filter(Boolean)
        .join(", ") || "Not specified",
      type: job.job_employment_type || "Not specified",
      description: job.job_description
        ? job.job_description.substring(0, 300) + "..."
        : "No description available",
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

    return new Response(
      JSON.stringify({ success: true, jobs, total: data.data?.length || 0 }),
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
