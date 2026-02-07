
-- =============================================
-- Phase 1: All Schema Changes
-- =============================================

-- 1. peer_challenges table
CREATE TABLE public.peer_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenger_id UUID NOT NULL,
  challenged_id UUID NOT NULL,
  note_id UUID REFERENCES public.notes(id) ON DELETE SET NULL,
  quiz_data JSONB NOT NULL DEFAULT '[]'::jsonb,
  challenger_score INT,
  challenged_score INT,
  status TEXT NOT NULL DEFAULT 'pending',
  xp_reward INT NOT NULL DEFAULT 100,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '48 hours')
);

ALTER TABLE public.peer_challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own challenges"
  ON public.peer_challenges FOR SELECT
  USING (auth.uid() = challenger_id OR auth.uid() = challenged_id);

CREATE POLICY "Users can create challenges"
  ON public.peer_challenges FOR INSERT
  WITH CHECK (auth.uid() = challenger_id);

CREATE POLICY "Participants can update challenges"
  ON public.peer_challenges FOR UPDATE
  USING (auth.uid() = challenger_id OR auth.uid() = challenged_id);

CREATE POLICY "Challenger can delete challenges"
  ON public.peer_challenges FOR DELETE
  USING (auth.uid() = challenger_id);

-- 2. challenge_claims table
CREATE TABLE public.challenge_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  challenge_id TEXT NOT NULL,
  claimed_date DATE NOT NULL DEFAULT CURRENT_DATE,
  xp_earned INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, challenge_id, claimed_date)
);

ALTER TABLE public.challenge_claims ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own claims"
  ON public.challenge_claims FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own claims"
  ON public.challenge_claims FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 3. Add image_url column to messages
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS image_url TEXT;

-- 4. Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true)
  ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('chat-media', 'chat-media', true)
  ON CONFLICT (id) DO NOTHING;

-- 5. Storage RLS policies for avatars
CREATE POLICY "Avatar images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own avatar"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own avatar"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 6. Storage RLS policies for chat-media
CREATE POLICY "Chat media is publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'chat-media');

CREATE POLICY "Authenticated users can upload chat media"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'chat-media' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete their own chat media"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'chat-media' AND auth.uid()::text = (storage.foldername(name))[1]);
