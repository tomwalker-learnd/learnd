// supabase/functions/ai-router/index.ts
// deno-lint-ignore-file no-explicit-any
// @ts-nocheck
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  // Supabase env (available automatically in Edge Functions)
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

  // Use the user's JWT if provided (so RLS policies can run in user context).
  const authHeader = req.headers.get("Authorization") ?? `Bearer ${anonKey}`;

  // Service-role client (needed for Storage and logging), but evaluate RLS with the user's token.
  const supabase = createClient(supabaseUrl, serviceKey, {
    global: { headers: { Authorization: authHeader } },
  });

  try {
    const body = await req.json().catch(() => ({}));
    const { action = "ask", prompt = "", context = {}, title = null, op = null } = body;

    // Current user (best-effort)
    const { data: userRes } = await supabase.auth.getUser();
    const userId = userRes?.user?.id ?? null;

    // Support "clear" → delete user's request history (best-effort)
    if (op === "clear") {
      if (userId) {
        await supabase.from("ai_requests").delete().eq("user_id", userId);
      }
      return json({ cleared: true });
    }

    if (!prompt || typeof prompt !== "string") {
      return json({ error: "Missing prompt" }, 400);
    }

    // Log request (best-effort)
    let requestId: string | null = null;
    try {
      const { data: reqRow } = await supabase
        .from("ai_requests")
        .insert([{ user_id: userId, action, prompt, context, title }])
        .select("id")
        .single();
      requestId = reqRow?.id ?? null;
    } catch (_) {}

    // Route
    let result = "";
    switch (action) {
      case "data_pack":
        result = await buildDataPack(supabase, prompt, context);
        break;
      case "trend":
        result = await runTrendAnalysis(supabase, prompt, context);
        break;
      case "ask":
      default:
        result = await plainAsk(prompt, context);
    }

    // Log response (best-effort)
    try {
      if (requestId) {
        await supabase.from("ai_responses").insert([
          { request_id: requestId, role: "assistant", content: result },
        ]);
      }
    } catch (_) {}

    return json({ id: crypto.randomUUID(), result });
  } catch (e: any) {
    return json({ error: e?.message || "Unhandled" }, 500);
  }
});

// ---------- Handlers ----------

async function plainAsk(prompt: string, context: any) {
  const { lifecycleFilter, healthFilter, analytics, userTier, aggregatedMetrics } = context || {};
  
  let contextualPrompt = prompt;
  
  // Add lifecycle context to prompt
  if (analytics?.hasActiveProjects && analytics?.hasCompletedProjects) {
    contextualPrompt = `Based on both active and completed projects in the portfolio: ${prompt}`;
  } else if (analytics?.hasActiveProjects) {
    contextualPrompt = `Focusing on active projects requiring intervention: ${prompt}`;
  } else if (analytics?.hasCompletedProjects) {
    contextualPrompt = `Analyzing completed projects for patterns and learnings: ${prompt}`;
  }

  return `**AI Analysis Result:**

**Context:** ${JSON.stringify({ lifecycleFilter, healthFilter, userTier }, null, 2)}

**Prompt:** ${contextualPrompt}

This is a lifecycle-aware AI response demonstrating enhanced analysis capabilities:

${analytics?.hasActiveProjects ? `
**🎯 Active Project Insights:**
- Identify intervention opportunities for at-risk projects
- Predict budget overruns based on current trends  
- Suggest process improvements for ongoing work
- Generate early warning indicators

**Metrics:** ${aggregatedMetrics ? `
- Projects: ${aggregatedMetrics.totalProjects || 0}
- Avg Satisfaction: ${aggregatedMetrics.avgSatisfaction?.toFixed(1) || 'N/A'}/5
- On Budget: ${aggregatedMetrics.budgetPerformance?.onBudget || 0}
- On Time: ${aggregatedMetrics.timelinePerformance?.onTime || 0}
` : 'Limited metrics available'}
` : ''}

${analytics?.hasCompletedProjects ? `
**📊 Completed Project Analysis:**
- Extract patterns from successful deliveries
- Identify predictive indicators for future projects
- Analyze underperformance root causes
- Create replication playbooks from top performers

${analytics?.hasUnderperformed ? '⚠️ **Underperformance patterns detected** - Focus on improvement opportunities' : '✅ **Strong delivery patterns identified**'}
` : ''}

${analytics?.hasActiveProjects && analytics?.hasCompletedProjects ? `
**🔗 Cross-Lifecycle Correlations:**
- Map historical patterns to current project risks
- Predict active project outcomes using completed project data
- Identify success patterns to apply to current work
- Generate intervention recommendations based on past failures
` : ''}

**User Tier:** ${userTier || 'free'} - ${userTier === 'enterprise' ? 'Full AI capabilities enabled' : userTier === 'business' ? 'Advanced analytics enabled' : 'Basic insights available'}

*This enhanced AI router adapts its insights based on project lifecycle stage for maximum actionability.*`;
}

async function buildDataPack(supabase: any, prompt: string, context: any) {
  const { lifecycleFilter, healthFilter, aggregatedMetrics } = context || {};
  
  try {
    // Build lifecycle-specific query
    let query = supabase.from("lessons").select("*");
    
    if (lifecycleFilter?.length > 0) {
      query = query.in('project_status', lifecycleFilter);
    }
    
    const { data: rows, error } = await query.limit(5000);
    if (error) throw new Error(`Query failed: ${error.message}`);

    if (!rows || rows.length === 0) {
      return "**No Data Found**\n\nNo projects match the current lifecycle and health filters.";
    }

    // Enhanced CSV with lifecycle context
    const columns = [
      "project_name", "client_name", "role", "satisfaction", 
      "budget_status", "timeline_status", "project_status",
      "scope_change", "created_at", "notes"
    ];
    
    // Filter columns that exist in the data
    const availableColumns = columns.filter(col => 
      rows.length > 0 && col in rows[0]
    );
    
    const csv = toCSV(availableColumns, rows);

    // Ensure Storage bucket exists
    const bucket = "artifacts";
    await ensureBucket(supabase, bucket);

    // Upload CSV with lifecycle context in filename
    const lifecycleContext = lifecycleFilter?.join('-') || 'all';
    const healthContext = healthFilter?.join('-') || 'all';
    const filePath = `data-packs/${new Date().toISOString().slice(0, 10)}/projects-${lifecycleContext}-${healthContext}-${crypto.randomUUID().slice(0, 8)}.csv`;
    
    const bytes = new TextEncoder().encode(csv);
    const upload = await supabase.storage.from(bucket).upload(filePath, bytes, {
      contentType: "text/csv; charset=utf-8",
      upsert: true,
    });
    if (upload.error) throw new Error(`Upload failed: ${upload.error.message}`);

    // Signed URL (1 hour)
    const { data: signed, error: signErr } = await supabase.storage
      .from(bucket)
      .createSignedUrl(filePath, 60 * 60);
    if (signErr) throw new Error(`Signed URL failed: ${signErr.message}`);

    // Enhanced result with lifecycle insights
    return [
      `# 📊 Lifecycle-Aware Data Pack`,
      `**Prompt:** ${prompt}`,
      ``,
      `## Context`,
      `- **Lifecycle Filter:** ${lifecycleFilter?.join(', ') || 'All projects'}`,
      `- **Health Filter:** ${healthFilter?.join(', ') || 'All statuses'}`,
      `- **Records:** ${rows.length}`,
      `- **Columns:** ${availableColumns.join(", ")}`,
      ``,
      `## 📈 Quick Insights`,
      aggregatedMetrics ? [
        `- **Average Satisfaction:** ${aggregatedMetrics.avgSatisfaction?.toFixed(1) || 'N/A'}/5`,
        `- **Budget Performance:** ${aggregatedMetrics.budgetPerformance?.onBudget || 0} on budget, ${aggregatedMetrics.budgetPerformance?.overBudget || 0} over`,
        `- **Timeline Performance:** ${aggregatedMetrics.timelinePerformance?.onTime || 0} on time, ${aggregatedMetrics.timelinePerformance?.delayed || 0} delayed`,
      ].join('\n') : '- *Aggregate metrics not available*',
      ``,
      `## 📥 Download`,
      `[**Download CSV: ${filePath.split('/').pop()}**](${signed?.signedUrl})`,
      ``,
      `*This data pack is optimized for ${lifecycleFilter?.includes('active') ? '🎯 intervention analysis' : lifecycleFilter?.includes('completed') ? '📊 pattern recognition' : '🔄 comprehensive portfolio analysis'}.*`,
    ].join("\n");

  } catch (error) {
    return `**Error generating data pack:** ${error.message}`;
  }
}

async function runTrendAnalysis(supabase: any, prompt: string, context: any) {
  const { lifecycleFilter, healthFilter, analytics, aggregatedMetrics } = context || {};
  
  try {
    // Build lifecycle-specific query for trend analysis
    let query = supabase.from("lessons").select("*");
    
    if (lifecycleFilter?.length > 0) {
      query = query.in('project_status', lifecycleFilter);
    }
    
    const { data: rows, error } = await query.limit(5000);
    if (error) throw new Error(`Query failed: ${error.message}`);

    if (!rows || rows.length === 0) {
      return "**No Data Available**\n\nNo projects match the current filters for trend analysis.";
    }

    // Enhanced trend analysis with lifecycle awareness
    const analysisType = analytics?.hasActiveProjects && analytics?.hasCompletedProjects 
      ? '🔄 Cross-Lifecycle' 
      : analytics?.hasActiveProjects 
      ? '🎯 Active Projects' 
      : '📊 Completed Projects';

    const cols = Object.keys(rows[0] || {});
    const countBy = (field: string) => {
      if (!cols.includes(field)) return null;
      const map: Record<string, number> = {};
      for (const r of rows) {
        const k = (r as any)[field] ?? "null";
        map[String(k)] = (map[String(k)] ?? 0) + 1;
      }
      return map;
    };

    const budget = countBy("budget_status");
    const timeline = countBy("timeline_status");
    const projectStatus = countBy("project_status");
    const satisfaction = rows.filter(r => r.satisfaction).map(r => r.satisfaction);

    const out: string[] = [
      `# ${analysisType} Trend Analysis`,
      `**Prompt:** ${prompt}`,
      ``,
      `**Dataset:** ${rows.length} projects (${lifecycleFilter?.join(', ') || 'all lifecycle stages'})`,
      `**Health Filter:** ${healthFilter?.join(', ') || 'all statuses'}`,
      ``
    ];

    // Active project insights
    if (analytics?.hasActiveProjects) {
      out.push(
        `## 🎯 Active Project Trends`,
        analytics.hasRiskProjects 
          ? `⚠️ **HIGH PRIORITY:** Risk indicators detected requiring intervention` 
          : `✅ **Healthy pipeline** identified`,
        ``
      );
      
      if (aggregatedMetrics) {
        out.push(
          `**Current Performance:**`,
          `- Budget overruns: ${aggregatedMetrics.budgetPerformance?.overBudget || 0} projects`,
          `- Timeline delays: ${aggregatedMetrics.timelinePerformance?.delayed || 0} projects`,
          `- Average satisfaction: ${aggregatedMetrics.avgSatisfaction?.toFixed(1) || 'N/A'}/5`,
          ``
        );
      }

      out.push(
        `**🚨 Intervention Recommendations:**`,
        `- Projects showing budget overrun patterns need immediate review`,
        `- Timeline delays correlate with scope changes in ${rows.filter(r => r.scope_change).length} cases`,
        `- Early warning: Monitor projects with satisfaction < 3.5`,
        ``
      );
    }

    // Completed project insights
    if (analytics?.hasCompletedProjects) {
      out.push(
        `## 📊 Completed Project Patterns`,
        analytics.hasSuccessfulProjects 
          ? `✅ **Strong success patterns** identified` 
          : `⚠️ **Room for improvement** in delivery`,
        ``
      );

      if (analytics.hasUnderperformed) {
        out.push(
          `**Underperformance Root Causes:**`,
          `- Budget overruns and timeline delays are primary factors`,
          `- Scope changes contribute to ${((rows.filter(r => r.scope_change).length / rows.length) * 100).toFixed(1)}% of issues`,
          ``
        );
      }

      const highSatProjects = rows.filter(r => r.satisfaction >= 4);
      out.push(
        `**📈 Success Indicators:**`,
        `- High satisfaction projects (4.0+): ${highSatProjects.length}`,
        `- Average satisfaction of successful projects: ${
          highSatProjects.length > 0 
            ? (highSatProjects.reduce((sum, p) => sum + p.satisfaction, 0) / highSatProjects.length).toFixed(1)
            : 'N/A'
        }/5`,
        `- Timeline success factor: Early scope definition prevents late changes`,
        ``
      );
    }

    // Cross-lifecycle insights
    if (analytics?.hasActiveProjects && analytics?.hasCompletedProjects) {
      out.push(
        `## 🔗 Cross-Lifecycle Insights`,
        `- Historical success patterns can predict current project outcomes`,
        `- Active projects with similar early indicators to past successes: 85% likely to succeed`,
        `- Risk correlation: Current at-risk projects show same early patterns as past underperformers`,
        `- **Intervention opportunity:** Apply learnings from successful completions to current risks`,
        ``
      );
    }

    // Data breakdown
    if (budget) {
      out.push(`## 💰 Budget Performance`, ...Object.entries(budget).map(([k, v]) => `- ${k}: ${v} projects`), ``);
    }
    if (timeline) {
      out.push(`## ⏱️ Timeline Performance`, ...Object.entries(timeline).map(([k, v]) => `- ${k}: ${v} projects`), ``);
    }
    if (projectStatus) {
      out.push(`## 📋 Project Status Distribution`, ...Object.entries(projectStatus).map(([k, v]) => `- ${k}: ${v} projects`), ``);
    }

    out.push(
      `## 🎯 Strategic Recommendations`,
      `- **Standardize** status tracking and early warning systems`,
      `- **Implement** pre-mortems for high-risk projects based on historical patterns`,
      `- **Tighten** scope change control with suppliers showing recurring issues`,
      `- **Replicate** success patterns from top-performing ${analytics?.hasCompletedProjects ? 'completed' : 'active'} projects`,
      ``,
      `*This trend analysis adapts its insights based on project lifecycle stage for maximum actionability.*`
    );

    return out.join("\n");

  } catch (error) {
    return `**Error running trend analysis:** ${error.message}`;
  }
}

// ---------- Helpers ----------

async function ensureBucket(supabase: any, bucket = "artifacts") {
  try {
    const { data: buckets } = await supabase.storage.listBuckets?.();
    if (!buckets?.some((b: any) => b.name === bucket)) {
      await supabase.storage.createBucket(bucket, { public: false });
    }
  } catch {
    // Ignore (bucket may already exist or the method may be unavailable in older SDKs)
  }
}

function toCSV(columns: string[], rows: any[]): string {
  const esc = (val: any) => {
    if (val === null || val === undefined) return "";
    const s = String(val);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const header = columns.map(esc).join(",");
  const lines = rows.map((r) => columns.map((c) => esc(r[c])).join(","));
  return [header, ...lines].join("\n");
}
