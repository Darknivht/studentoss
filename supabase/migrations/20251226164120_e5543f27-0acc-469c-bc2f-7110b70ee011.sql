-- Create messages table for both group chat and DMs
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id uuid NOT NULL,
  content text NOT NULL,
  message_type text DEFAULT 'text',
  -- For group messages
  group_id uuid REFERENCES public.study_groups(id) ON DELETE CASCADE,
  -- For direct messages
  recipient_id uuid,
  -- Timestamps
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  is_read boolean DEFAULT false
);

-- Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- RLS policies for messages
CREATE POLICY "Users can view group messages they are members of"
ON public.messages
FOR SELECT
USING (
  (group_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM study_group_members WHERE group_id = messages.group_id AND user_id = auth.uid()
  ))
  OR
  (group_id IS NULL AND (sender_id = auth.uid() OR recipient_id = auth.uid()))
);

CREATE POLICY "Users can send group messages to groups they are members of"
ON public.messages
FOR INSERT
WITH CHECK (
  sender_id = auth.uid() AND (
    (group_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM study_group_members WHERE group_id = messages.group_id AND user_id = auth.uid()
    ))
    OR
    (group_id IS NULL AND recipient_id IS NOT NULL)
  )
);

-- Create group_resources table for sharing notes/courses in groups
CREATE TABLE IF NOT EXISTS public.group_resources (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id uuid NOT NULL REFERENCES public.study_groups(id) ON DELETE CASCADE,
  shared_by uuid NOT NULL,
  resource_type text NOT NULL, -- 'note' or 'course'
  resource_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.group_resources ENABLE ROW LEVEL SECURITY;

-- RLS policies for group_resources
CREATE POLICY "Members can view group resources"
ON public.group_resources
FOR SELECT
USING (
  EXISTS (SELECT 1 FROM study_group_members WHERE group_id = group_resources.group_id AND user_id = auth.uid())
);

CREATE POLICY "Members can share resources"
ON public.group_resources
FOR INSERT
WITH CHECK (
  shared_by = auth.uid() AND
  EXISTS (SELECT 1 FROM study_group_members WHERE group_id = group_resources.group_id AND user_id = auth.uid())
);

CREATE POLICY "Users can remove their shared resources"
ON public.group_resources
FOR DELETE
USING (shared_by = auth.uid());

-- Add feature limits tracking
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS quizzes_today integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS flashcards_generated_today integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS notes_today integer DEFAULT 0;

-- Create index for message queries
CREATE INDEX IF NOT EXISTS idx_messages_group_id ON public.messages(group_id);
CREATE INDEX IF NOT EXISTS idx_messages_dm ON public.messages(sender_id, recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);