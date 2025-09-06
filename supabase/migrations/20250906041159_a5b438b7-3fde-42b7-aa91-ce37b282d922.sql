-- Add project_status column to lessons table to support project lifecycle management
ALTER TABLE public.lessons 
ADD COLUMN IF NOT EXISTS project_status TEXT DEFAULT 'active';

-- Add check constraint to ensure valid project status values
ALTER TABLE public.lessons 
ADD CONSTRAINT lessons_project_status_check 
CHECK (project_status IN ('active', 'on_hold', 'completed', 'cancelled'));

-- Create an index for better query performance on project_status
CREATE INDEX IF NOT EXISTS idx_lessons_project_status 
ON public.lessons(project_status);

-- Update existing lessons to have 'active' status (they default to this anyway)
UPDATE public.lessons 
SET project_status = 'active' 
WHERE project_status IS NULL;