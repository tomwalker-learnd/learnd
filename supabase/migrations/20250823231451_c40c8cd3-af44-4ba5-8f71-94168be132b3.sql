-- Drop existing lessons table and recreate with the exact schema requested
DROP TABLE IF EXISTS public.lessons CASCADE;

-- Create the lessons table with the exact fields requested
CREATE TABLE public.lessons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_name TEXT NOT NULL,
  role TEXT NOT NULL, 
  client_name TEXT,
  satisfaction INTEGER NOT NULL CHECK (satisfaction >= 1 AND satisfaction <= 5),
  budget_status TEXT NOT NULL CHECK (budget_status IN ('under', 'on', 'over')),
  scope_change BOOLEAN NOT NULL DEFAULT false,
  timeline_status TEXT NOT NULL,
  notes TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user access
CREATE POLICY "Users can view their own lessons" 
ON public.lessons 
FOR SELECT 
USING (auth.uid() = created_by);

CREATE POLICY "Users can insert their own lessons" 
ON public.lessons 
FOR INSERT 
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own lessons" 
ON public.lessons 
FOR UPDATE 
USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own lessons" 
ON public.lessons 
FOR DELETE 
USING (auth.uid() = created_by);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_lessons_updated_at
BEFORE UPDATE ON public.lessons
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();