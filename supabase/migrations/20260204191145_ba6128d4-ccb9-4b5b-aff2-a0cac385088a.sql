-- Drop the restrictive subject check constraint
ALTER TABLE public.planner_tasks DROP CONSTRAINT IF EXISTS planner_tasks_subject_check;

-- Add task_type 'habit' to the allowed values
ALTER TABLE public.planner_tasks DROP CONSTRAINT IF EXISTS planner_tasks_task_type_check;
ALTER TABLE public.planner_tasks ADD CONSTRAINT planner_tasks_task_type_check 
CHECK (task_type = ANY (ARRAY['custom'::text, 'pyq'::text, 'revision'::text, 'video'::text, 'test'::text, 'habit'::text]));