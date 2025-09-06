import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface StatusChangeNotification {
  project_id: string;
  project_name: string;
  client_name?: string;
  old_status: string;
  new_status: string;
  changed_by: string;
  reason: string;
  timestamp: string;
  completion_summary?: string;
  blockers?: string;
  restart_conditions?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      project_id, 
      project_name, 
      client_name,
      old_status, 
      new_status, 
      changed_by, 
      reason,
      completion_summary,
      blockers,
      restart_conditions
    }: StatusChangeNotification = await req.json();

    console.log('Processing status change notification:', {
      project_id,
      project_name,
      old_status,
      new_status,
      changed_by
    });

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Log the status change for audit trail
    const auditEntry = {
      action: 'project_status_change',
      project_id,
      metadata: {
        project_name,
        client_name,
        old_status,
        new_status,
        reason,
        completion_summary,
        blockers,
        restart_conditions,
        timestamp: new Date().toISOString()
      },
      user_id: changed_by
    };

    console.log('Creating audit entry:', auditEntry);

    // In a real implementation, you might want to:
    // 1. Send email notifications to stakeholders
    // 2. Create dashboard notifications
    // 3. Update project dashboards
    // 4. Trigger automated workflows based on status changes

    // For now, we'll just log the status change and return success
    const notification = {
      id: crypto.randomUUID(),
      type: 'status_change',
      title: `Project ${new_status.replace('_', ' ')}`,
      message: `${project_name} has been marked as ${new_status.replace('_', ' ')}`,
      project_id,
      project_name,
      client_name,
      status_change: {
        from: old_status,
        to: new_status,
        reason
      },
      timestamp: new Date().toISOString(),
      user_id: changed_by
    };

    console.log('Status change notification created:', notification);

    // Generate status-specific insights
    let insights = [];
    
    if (new_status === 'completed') {
      insights.push({
        type: 'completion',
        message: 'Consider extracting key learnings for future projects',
        action: 'Review completion summary and update knowledge base'
      });
      
      if (completion_summary) {
        insights.push({
          type: 'knowledge',
          message: 'Completion summary available for team learning',
          action: 'Share insights with relevant team members'
        });
      }
    }
    
    if (new_status === 'on_hold') {
      insights.push({
        type: 'attention',
        message: 'Project requires attention to resolve blockers',
        action: 'Review blockers and assign resolution tasks'
      });
      
      if (restart_conditions) {
        insights.push({
          type: 'planning',
          message: 'Restart conditions defined for future reactivation',
          action: 'Monitor conditions and plan for restart'
        });
      }
    }
    
    if (new_status === 'cancelled') {
      insights.push({
        type: 'analysis',
        message: 'Analyze cancellation reasons for process improvement',
        action: 'Conduct post-mortem analysis'
      });
    }

    const response = {
      success: true,
      notification,
      insights,
      audit_trail: auditEntry,
      message: `Status change notification processed for ${project_name}`
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error('Error in project-status-notification function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      {
        status: 500,
        headers: { 
          'Content-Type': 'application/json', 
          ...corsHeaders 
        },
      }
    );
  }
};

serve(handler);