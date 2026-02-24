
-- 1. exam_types
CREATE TABLE public.exam_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  icon text DEFAULT '📝',
  country text DEFAULT 'Nigeria',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.exam_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view active exam types"
  ON public.exam_types FOR SELECT TO authenticated
  USING (is_active = true);

-- 2. exam_subjects
CREATE TABLE public.exam_subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_type_id uuid NOT NULL REFERENCES public.exam_types(id) ON DELETE CASCADE,
  name text NOT NULL,
  icon text DEFAULT '📘',
  topics_count integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.exam_subjects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view active exam subjects"
  ON public.exam_subjects FOR SELECT TO authenticated
  USING (is_active = true);

-- 3. exam_topics
CREATE TABLE public.exam_topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id uuid NOT NULL REFERENCES public.exam_subjects(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  difficulty text NOT NULL DEFAULT 'medium',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.exam_topics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view active exam topics"
  ON public.exam_topics FOR SELECT TO authenticated
  USING (is_active = true);

-- 4. exam_questions
CREATE TABLE public.exam_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id uuid REFERENCES public.exam_topics(id) ON DELETE SET NULL,
  subject_id uuid NOT NULL REFERENCES public.exam_subjects(id) ON DELETE CASCADE,
  exam_type_id uuid NOT NULL REFERENCES public.exam_types(id) ON DELETE CASCADE,
  question text NOT NULL,
  options jsonb NOT NULL DEFAULT '[]',
  correct_index integer NOT NULL DEFAULT 0,
  explanation text,
  difficulty text NOT NULL DEFAULT 'medium',
  year text,
  source text NOT NULL DEFAULT 'admin_added',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.exam_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view active exam questions"
  ON public.exam_questions FOR SELECT TO authenticated
  USING (is_active = true);

-- 5. exam_attempts
CREATE TABLE public.exam_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  exam_type_id uuid NOT NULL REFERENCES public.exam_types(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES public.exam_subjects(id) ON DELETE CASCADE,
  topic_id uuid REFERENCES public.exam_topics(id) ON DELETE SET NULL,
  question_id uuid REFERENCES public.exam_questions(id) ON DELETE SET NULL,
  selected_index integer NOT NULL,
  is_correct boolean NOT NULL,
  time_spent_seconds integer DEFAULT 0,
  session_id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.exam_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own exam attempts"
  ON public.exam_attempts FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own exam attempts"
  ON public.exam_attempts FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- 6. exam_subscriptions
CREATE TABLE public.exam_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  exam_type_id uuid REFERENCES public.exam_types(id) ON DELETE SET NULL,
  plan text NOT NULL DEFAULT 'monthly',
  status text NOT NULL DEFAULT 'active',
  starts_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  payment_reference text,
  amount_paid integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.exam_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own exam subscriptions"
  ON public.exam_subscriptions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_exam_subjects_exam_type ON public.exam_subjects(exam_type_id);
CREATE INDEX idx_exam_topics_subject ON public.exam_topics(subject_id);
CREATE INDEX idx_exam_questions_subject ON public.exam_questions(subject_id);
CREATE INDEX idx_exam_questions_topic ON public.exam_questions(topic_id);
CREATE INDEX idx_exam_questions_exam_type ON public.exam_questions(exam_type_id);
CREATE INDEX idx_exam_attempts_user ON public.exam_attempts(user_id);
CREATE INDEX idx_exam_attempts_session ON public.exam_attempts(session_id);
CREATE INDEX idx_exam_subscriptions_user ON public.exam_subscriptions(user_id);
