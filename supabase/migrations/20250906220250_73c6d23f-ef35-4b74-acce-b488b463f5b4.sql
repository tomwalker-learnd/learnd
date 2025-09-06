-- Drop and recreate the ai_messages_view to address security definer issues
-- This view combines AI requests and responses for the current authenticated user

DROP VIEW IF EXISTS public.ai_messages_view;

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
)
ORDER BY created_at;