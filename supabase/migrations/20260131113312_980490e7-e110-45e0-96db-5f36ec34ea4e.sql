-- Add course_id column to chat_messages for Course Mode conversations
ALTER TABLE public.chat_messages 
ADD COLUMN course_id uuid REFERENCES public.courses(id) ON DELETE CASCADE;

-- Create index for faster course-based queries
CREATE INDEX idx_chat_messages_course_id ON public.chat_messages(course_id);

-- Update RLS policy for delete to allow users to delete their own messages
CREATE POLICY "Users can delete own chat messages" 
ON public.chat_messages 
FOR DELETE 
USING (auth.uid() = user_id);