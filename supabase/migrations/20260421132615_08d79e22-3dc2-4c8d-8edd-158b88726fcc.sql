
-- Create neet_questions table matching questions schema
CREATE TABLE public.neet_questions (
  id integer NOT NULL,
  chapter_id uuid DEFAULT NULL,
  subject text DEFAULT NULL,
  chapter text DEFAULT NULL,
  exam_shift text DEFAULT NULL,
  exam_year integer DEFAULT NULL,
  question_text text NOT NULL,
  options_list text DEFAULT NULL,
  correct_answer text DEFAULT NULL,
  solution text DEFAULT NULL,
  question_image_url text DEFAULT NULL,
  PRIMARY KEY (id)
);

-- Enable RLS
ALTER TABLE public.neet_questions ENABLE ROW LEVEL SECURITY;

-- Public read access (same as questions table)
CREATE POLICY "read_neet_questions" ON public.neet_questions
  FOR SELECT TO public USING (true);
