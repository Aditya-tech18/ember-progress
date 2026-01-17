-- Add combat_name to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS combat_name text;

-- Add short_id to teams for 6-digit team codes
ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS short_id text UNIQUE;

-- Create function to generate 6-digit team ID
CREATE OR REPLACE FUNCTION generate_team_short_id()
RETURNS TRIGGER AS $$
DECLARE
  new_id text;
  done bool;
BEGIN
  done := false;
  WHILE NOT done LOOP
    new_id := LPAD(FLOOR(random() * 1000000)::text, 6, '0');
    done := NOT EXISTS(SELECT 1 FROM public.teams WHERE short_id = new_id);
  END LOOP;
  NEW.short_id := new_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for auto-generating short_id
DROP TRIGGER IF EXISTS teams_short_id_trigger ON public.teams;
CREATE TRIGGER teams_short_id_trigger
BEFORE INSERT ON public.teams
FOR EACH ROW
WHEN (NEW.short_id IS NULL)
EXECUTE FUNCTION generate_team_short_id();

-- Generate short_id for existing teams that don't have one
UPDATE public.teams 
SET short_id = LPAD(FLOOR(random() * 1000000)::text, 6, '0')
WHERE short_id IS NULL;

-- Create team_notifications table for challenge notifications
CREATE TABLE IF NOT EXISTS public.team_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid REFERENCES public.teams(team_id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'challenge',
  is_read boolean DEFAULT false,
  challenge_id uuid REFERENCES public.team_challenges(challenge_id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on team_notifications
ALTER TABLE public.team_notifications ENABLE ROW LEVEL SECURITY;

-- Policies for team_notifications
CREATE POLICY "Users can view their own notifications"
ON public.team_notifications
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
ON public.team_notifications
FOR UPDATE
USING (auth.uid() = user_id);

-- Allow inserting notifications (for team challenge system)
CREATE POLICY "Authenticated users can create notifications for team members"
ON public.team_notifications
FOR INSERT
WITH CHECK (true);

-- Update team_challenges table with mock_test_id reference and more details
ALTER TABLE public.team_challenges 
ADD COLUMN IF NOT EXISTS mock_test_id text,
ADD COLUMN IF NOT EXISTS challenger_score integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS opponent_score integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS challenger_participants integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS opponent_participants integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS accepted boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS accepted_at timestamp without time zone;

-- Create team_challenge_results to store individual member results
CREATE TABLE IF NOT EXISTS public.team_challenge_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id uuid REFERENCES public.team_challenges(challenge_id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  team_id uuid REFERENCES public.teams(team_id) ON DELETE CASCADE,
  score integer DEFAULT 0,
  completed_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on team_challenge_results
ALTER TABLE public.team_challenge_results ENABLE ROW LEVEL SECURITY;

-- Policies for team_challenge_results
CREATE POLICY "Anyone can view challenge results"
ON public.team_challenge_results
FOR SELECT
USING (true);

CREATE POLICY "Users can insert their own results"
ON public.team_challenge_results
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Add RLS policy for UPDATE on team_challenges (for accepting challenges)
CREATE POLICY "Team leads can accept challenges"
ON public.team_challenges
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM team_members tm
    WHERE tm.team_id = team_challenges.opponent_team
    AND tm.user_id = auth.uid()
  )
);

-- Create contests entry for this Sunday's weekly contest
INSERT INTO public.contests (title, start_time, end_time, result_time)
VALUES (
  'JEE Main Weekly Contest - January 2025',
  '2025-01-19 14:00:00'::timestamp,
  '2025-01-19 17:00:00'::timestamp,
  '2025-01-19 17:30:00'::timestamp
)
ON CONFLICT DO NOTHING;