
-- Study Sessions table
CREATE TABLE public.study_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  start_time timestamptz NOT NULL DEFAULT now(),
  end_time timestamptz,
  duration_minutes integer DEFAULT 0,
  date date NOT NULL DEFAULT CURRENT_DATE,
  status text NOT NULL DEFAULT 'running',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT fk_study_sessions_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);

ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own study sessions"
  ON public.study_sessions FOR ALL
  USING (auth.uid() = user_id);

-- Study Stats Daily table
CREATE TABLE public.study_stats_daily (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  date date NOT NULL,
  total_minutes integer DEFAULT 0,
  goal_minutes integer DEFAULT 360,
  completion_pct numeric DEFAULT 0,
  streak_count integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT fk_study_stats_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE,
  CONSTRAINT unique_user_date UNIQUE (user_id, date)
);

ALTER TABLE public.study_stats_daily ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own study stats"
  ON public.study_stats_daily FOR ALL
  USING (auth.uid() = user_id);

-- Index for faster queries
CREATE INDEX idx_study_sessions_user_date ON public.study_sessions (user_id, date);
CREATE INDEX idx_study_stats_daily_user_date ON public.study_stats_daily (user_id, date);
