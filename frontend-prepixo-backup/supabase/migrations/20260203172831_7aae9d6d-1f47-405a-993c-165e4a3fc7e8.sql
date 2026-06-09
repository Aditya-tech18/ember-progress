-- Create planner_tasks table for daily/weekly tasks
CREATE TABLE public.planner_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL CHECK (subject IN ('Physics', 'Chemistry', 'Mathematics')),
  task_name TEXT NOT NULL,
  task_type TEXT DEFAULT 'custom' CHECK (task_type IN ('custom', 'pyq', 'revision', 'video', 'test')),
  due_date DATE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'backlog')),
  is_backlog BOOLEAN DEFAULT false,
  original_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create syllabus_mastery table for chapter tracking
CREATE TABLE public.syllabus_mastery (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  chapter_id UUID REFERENCES public.chapters(id),
  chapter_name TEXT NOT NULL,
  subject TEXT NOT NULL CHECK (subject IN ('Physics', 'Chemistry', 'Mathematics')),
  mastery_status TEXT DEFAULT 'weak' CHECK (mastery_status IN ('weak', 'average', 'strong', 'mastered')),
  completed_at TIMESTAMP WITH TIME ZONE,
  next_revision_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, chapter_name)
);

-- Create daily_aggregates table for analytics
CREATE TABLE public.daily_aggregates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  tasks_total INTEGER DEFAULT 0,
  tasks_completed INTEGER DEFAULT 0,
  completion_score NUMERIC(5,2) DEFAULT 0,
  focus_minutes INTEGER DEFAULT 0,
  pyqs_solved INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Create user_goals table for target setting
CREATE TABLE public.user_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
  target_exam TEXT DEFAULT 'JEE Mains 2026',
  target_session TEXT DEFAULT 'Session 1',
  target_percentile INTEGER DEFAULT 95 CHECK (target_percentile >= 1 AND target_percentile <= 100),
  exam_date DATE DEFAULT '2026-04-02',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create focus_sessions table for Pomodoro tracking
CREATE TABLE public.focus_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  subject TEXT,
  duration_minutes INTEGER DEFAULT 25,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  focus_points INTEGER DEFAULT 0
);

-- Enable RLS on all tables
ALTER TABLE public.planner_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.syllabus_mastery ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_aggregates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.focus_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for planner_tasks
CREATE POLICY "Users can manage own tasks" ON public.planner_tasks
  FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for syllabus_mastery
CREATE POLICY "Users can manage own mastery" ON public.syllabus_mastery
  FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for daily_aggregates
CREATE POLICY "Users can manage own aggregates" ON public.daily_aggregates
  FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for user_goals
CREATE POLICY "Users can manage own goals" ON public.user_goals
  FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for focus_sessions
CREATE POLICY "Users can manage own focus sessions" ON public.focus_sessions
  FOR ALL USING (auth.uid() = user_id);

-- Create function to auto-migrate backlog tasks at midnight
CREATE OR REPLACE FUNCTION public.migrate_backlog_tasks()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE planner_tasks
  SET 
    is_backlog = true,
    original_date = COALESCE(original_date, due_date),
    due_date = CURRENT_DATE,
    status = 'backlog'
  WHERE status = 'pending' 
    AND due_date < CURRENT_DATE;
END;
$$;

-- Create function to schedule revision tasks
CREATE OR REPLACE FUNCTION public.schedule_revision_task()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.mastery_status = 'mastered' AND (OLD.mastery_status IS NULL OR OLD.mastery_status != 'mastered') THEN
    NEW.next_revision_date := CURRENT_DATE + INTERVAL '7 days';
    NEW.completed_at := now();
    
    -- Auto-create revision task
    INSERT INTO planner_tasks (user_id, subject, task_name, task_type, due_date)
    VALUES (NEW.user_id, NEW.subject, 'Revise: ' || NEW.chapter_name, 'revision', CURRENT_DATE + INTERVAL '7 days');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_schedule_revision
  BEFORE UPDATE ON public.syllabus_mastery
  FOR EACH ROW
  EXECUTE FUNCTION public.schedule_revision_task();

-- Create indexes for performance
CREATE INDEX idx_planner_tasks_user_date ON public.planner_tasks(user_id, due_date);
CREATE INDEX idx_daily_aggregates_user_date ON public.daily_aggregates(user_id, date);
CREATE INDEX idx_syllabus_mastery_user ON public.syllabus_mastery(user_id);
CREATE INDEX idx_focus_sessions_user ON public.focus_sessions(user_id);