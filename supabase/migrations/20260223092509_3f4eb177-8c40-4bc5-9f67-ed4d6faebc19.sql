
-- Create store_resources table
CREATE TABLE public.store_resources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'textbook',
  subject TEXT NOT NULL,
  grade_level TEXT NOT NULL,
  file_url TEXT,
  youtube_url TEXT,
  thumbnail_url TEXT,
  author TEXT,
  is_free BOOLEAN NOT NULL DEFAULT true,
  required_tier TEXT NOT NULL DEFAULT 'free',
  download_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.store_resources ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view resources
CREATE POLICY "Authenticated users can view resources"
ON public.store_resources FOR SELECT
USING (auth.uid() IS NOT NULL);

-- No INSERT/UPDATE/DELETE policies - admin uses service role key

-- Create trigger for updated_at
CREATE TRIGGER update_store_resources_updated_at
BEFORE UPDATE ON public.store_resources
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for resource files
INSERT INTO storage.buckets (id, name, public) VALUES ('store-resources', 'store-resources', true);

-- Storage policies: anyone can view, no direct uploads (admin edge function uses service role)
CREATE POLICY "Public can view store resources"
ON storage.objects FOR SELECT
USING (bucket_id = 'store-resources');
