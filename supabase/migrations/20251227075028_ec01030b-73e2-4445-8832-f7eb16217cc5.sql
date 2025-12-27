-- Add invitation_code column to study_groups
ALTER TABLE public.study_groups ADD COLUMN IF NOT EXISTS invitation_code TEXT UNIQUE;

-- Create function to generate random invite codes
CREATE OR REPLACE FUNCTION public.generate_invite_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INT;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Update existing groups to have invite codes
UPDATE public.study_groups 
SET invitation_code = public.generate_invite_code() 
WHERE invitation_code IS NULL;

-- Make invitation_code NOT NULL after populating
ALTER TABLE public.study_groups ALTER COLUMN invitation_code SET NOT NULL;

-- Create trigger to auto-generate invite codes for new groups
CREATE OR REPLACE FUNCTION public.set_invite_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.invitation_code IS NULL THEN
    NEW.invitation_code := public.generate_invite_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER set_invite_code_trigger
BEFORE INSERT ON public.study_groups
FOR EACH ROW
EXECUTE FUNCTION public.set_invite_code();