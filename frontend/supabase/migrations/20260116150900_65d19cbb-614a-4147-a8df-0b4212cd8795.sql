-- Add RLS policies for contest tables
ALTER TABLE contests ENABLE ROW LEVEL SECURITY;
ALTER TABLE contest_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE contest_questions ENABLE ROW LEVEL SECURITY;

-- Contests: Everyone can read, only admins can modify
CREATE POLICY "Anyone can view contests" ON contests FOR SELECT USING (true);

-- Contest participants: Authenticated users can join and view
CREATE POLICY "Anyone can view contest participants" ON contest_participants FOR SELECT USING (true);
CREATE POLICY "Authenticated users can join contests" ON contest_participants FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own participation" ON contest_participants FOR UPDATE USING (auth.uid() = user_id);

-- Contest questions: Everyone can read during contest
CREATE POLICY "Anyone can view contest questions" ON contest_questions FOR SELECT USING (true);

-- Add RLS policies for team tables
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_leaderboard ENABLE ROW LEVEL SECURITY;

-- Teams: Everyone can view, authenticated can create
CREATE POLICY "Anyone can view teams" ON teams FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create teams" ON teams FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Team creators can update teams" ON teams FOR UPDATE USING (auth.uid() = created_by);

-- Team members: Everyone can view, authenticated can join
CREATE POLICY "Anyone can view team members" ON team_members FOR SELECT USING (true);
CREATE POLICY "Authenticated users can join teams" ON team_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own membership" ON team_members FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can leave teams" ON team_members FOR DELETE USING (auth.uid() = user_id);

-- Team challenges: Everyone can view, team members can create
CREATE POLICY "Anyone can view team challenges" ON team_challenges FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create challenges" ON team_challenges FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM team_members WHERE team_id = challenger_team AND user_id = auth.uid())
);

-- Team leaderboard: Everyone can view
CREATE POLICY "Anyone can view team leaderboard" ON team_leaderboard FOR SELECT USING (true);

-- Create table for allowed contest testers
CREATE TABLE IF NOT EXISTS contest_testers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE contest_testers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view testers" ON contest_testers FOR SELECT USING (true);

-- Add initial testers
INSERT INTO contest_testers (email) VALUES 
  ('tomacwin9961@gmail.com'),
  ('prepixo.official@gmail.com')
ON CONFLICT (email) DO NOTHING;

-- Function to calculate and update ranks after contest ends
CREATE OR REPLACE FUNCTION update_contest_ranks(p_contest_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE contest_participants
  SET rank = sub.new_rank
  FROM (
    SELECT id, RANK() OVER (ORDER BY total_marks DESC, submitted_at ASC) AS new_rank
    FROM contest_participants
    WHERE contest_id = p_contest_id
    AND submitted_at IS NOT NULL
  ) AS sub
  WHERE contest_participants.id = sub.id
  AND contest_participants.contest_id = p_contest_id;
END;
$$;