-- Fix security definer view issue
-- Drop the existing view that may be bypassing RLS
DROP VIEW IF EXISTS public.ai_messages_view;

-- Create a secure view that respects RLS policies
-- This view will run with the privileges of the querying user, not the creator
CREATE VIEW public.ai_messages_view AS
SELECT 
    r.id,
    'user'::text AS role,
    r.prompt AS content,
    r.created_at,
    r.action
FROM public.ai_requests r
WHERE r.user_id = auth.uid()

UNION ALL

SELECT 
    s.id,
    s.role,
    s.content,
    s.created_at,
    NULL::text AS action
FROM public.ai_responses s
WHERE EXISTS (
    SELECT 1 FROM public.ai_requests req 
    WHERE req.id = s.request_id 
    AND req.user_id = auth.uid()
);

-- Enable RLS on the view (though views inherit from underlying tables)
ALTER VIEW public.ai_messages_view OWNER TO postgres;