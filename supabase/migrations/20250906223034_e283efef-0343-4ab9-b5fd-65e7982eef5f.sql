-- Create AI client normalization function for edge functions
-- This will store normalization requests and responses for tracking

CREATE TABLE IF NOT EXISTS public.client_normalization_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  original_name text NOT NULL,
  existing_clients text[] NOT NULL,
  suggested_name text,
  confidence_score numeric,
  user_choice text, -- 'accept', 'reject', 'edit'
  final_name text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.client_normalization_requests ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can insert their own normalization requests" 
ON public.client_normalization_requests 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own normalization requests" 
ON public.client_normalization_requests 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own normalization requests" 
ON public.client_normalization_requests 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_client_normalization_requests_updated_at
BEFORE UPDATE ON public.client_normalization_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();