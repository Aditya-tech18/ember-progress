
-- Focus Rooms table
CREATE TABLE public.focus_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_name text NOT NULL,
  room_type text NOT NULL DEFAULT 'JEE',
  created_by uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  is_public boolean NOT NULL DEFAULT true,
  duration_minutes integer NOT NULL DEFAULT 120,
  started_at timestamptz DEFAULT now(),
  ends_at timestamptz,
  active boolean NOT NULL DEFAULT true,
  max_participants integer NOT NULL DEFAULT 50,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Focus Participants table
CREATE TABLE public.focus_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid REFERENCES public.focus_rooms(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  is_leader boolean NOT NULL DEFAULT false,
  joined_at timestamptz NOT NULL DEFAULT now(),
  left_at timestamptz,
  UNIQUE(room_id, user_id)
);

-- Focus Messages table (leader-only chat)
CREATE TABLE public.focus_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid REFERENCES public.focus_rooms(id) ON DELETE CASCADE NOT NULL,
  sender_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.focus_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.focus_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.focus_messages ENABLE ROW LEVEL SECURITY;

-- Focus Rooms policies
CREATE POLICY "Anyone can view active public rooms" ON public.focus_rooms
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create rooms" ON public.focus_rooms
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Room creator can update" ON public.focus_rooms
  FOR UPDATE TO authenticated USING (auth.uid() = created_by);

CREATE POLICY "Room creator can delete" ON public.focus_rooms
  FOR DELETE TO authenticated USING (auth.uid() = created_by);

-- Focus Participants policies
CREATE POLICY "Anyone can view participants" ON public.focus_participants
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can join" ON public.focus_participants
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave rooms" ON public.focus_participants
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can update own participation" ON public.focus_participants
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Focus Messages policies
CREATE POLICY "Participants can view room messages" ON public.focus_messages
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.focus_participants WHERE room_id = focus_messages.room_id AND user_id = auth.uid() AND left_at IS NULL)
  );

CREATE POLICY "Leaders can send messages" ON public.focus_messages
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.focus_participants WHERE room_id = focus_messages.room_id AND user_id = auth.uid() AND is_leader = true AND left_at IS NULL)
  );

-- Indexes
CREATE INDEX idx_focus_rooms_active ON public.focus_rooms(active) WHERE active = true;
CREATE INDEX idx_focus_participants_room ON public.focus_participants(room_id) WHERE left_at IS NULL;
CREATE INDEX idx_focus_messages_room ON public.focus_messages(room_id);
