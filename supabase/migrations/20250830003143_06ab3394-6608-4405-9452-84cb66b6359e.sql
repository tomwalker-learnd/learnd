-- Fix security vulnerability in ai_responses table
-- Remove the overly permissive policy that allows all users to see all responses
DROP POLICY IF EXISTS "ai_responses_all_read" ON public.ai_responses;

-- Create a secure policy that only allows users to see responses to their own requests
CREATE POLICY "Users can only view responses to their own requests" 
ON public.ai_responses 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.ai_requests 
    WHERE ai_requests.id = ai_responses.request_id 
    AND ai_requests.user_id = auth.uid()
  )
);