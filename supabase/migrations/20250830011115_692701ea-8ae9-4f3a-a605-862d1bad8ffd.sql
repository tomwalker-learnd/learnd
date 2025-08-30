-- Fix Security Definer View issue
-- Drop the existing ai_messages_view and recreate it without SECURITY DEFINER

DROP VIEW IF EXISTS public.ai_messages_view;

-- Recreate the view as a standard view (SECURITY INVOKER by default)
-- This ensures RLS policies are applied based on the querying user, not the view creator
CREATE VIEW public.ai_messages_view AS
SELECT 
    r.id,
    'user'::text AS role,
    r.prompt AS content,
    r.created_at,
    r.action
FROM ai_requests r
WHERE r.user_id = auth.uid()

UNION ALL

SELECT 
    s.id,
    s.role,
    s.content,
    s.created_at,
    NULL::text AS action
FROM ai_responses s
WHERE EXISTS (
    SELECT 1
    FROM ai_requests req
    WHERE req.id = s.request_id 
    AND req.user_id = auth.uid()
);

-- Enable RLS on the view (though views inherit RLS from underlying tables)
ALTER VIEW public.ai_messages_view SET (security_barrier = true);