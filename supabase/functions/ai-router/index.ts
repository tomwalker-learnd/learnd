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
  return `You asked: ${prompt}\n\n(Context keys: ${Object.keys(context || {}).join(", ") || "none"})`;
}

async function buildDataPack(supabase: any, prompt: string, context: any) {
  // Pull data (adjust table if yours is named differently)
  const { data: rows, error } = await supabase.from("lessons").select("*").limit(5000);
  if (error) throw new Error(`Query failed: ${error.message}`);

  const columns: string[] = rows?.length ? Object.keys(rows[0]) : [];
  const csv = toCSV(columns, rows || []);

  // Ensure Storage bucket exists
  const bucket = "artifacts";
  await ensureBucket(supabase, bucket);

  // Upload CSV
  const filePath = `data-packs/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.csv`;
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

  // Friendly Markdown result for the UI
  return [
    `# Data Pack`,
    `Prompt: ${prompt}`,
    ``,
    `- Rows: ${rows?.length ?? 0}`,
    `- Columns: ${columns.length ? columns.join(", ") : "(none)"}`,
    `- Download CSV: ${signed?.signedUrl}`,
  ].join("\n");
}

async function runTrendAnalysis(supabase: any, prompt: string, context: any) {
  const { data: rows, error } = await supabase.from("lessons").select("*").limit(5000);
  if (error) throw new Error(`Query failed: ${error.message}`);

  const cols = rows?.length ? Object.keys(rows[0]) : [];
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
  const createdAt = cols.includes("created_at")
    ? rows.map((r: any) => String(r.created_at)).sort()
    : null;

  const out: string[] = [
    `# Trend Analysis`,
    `Prompt: ${prompt}`,
    ``,
    `Records analyzed: ${rows?.length ?? 0}`,
  ];
  if (budget) {
    out.push(``, `## Budget status`, ...Object.entries(budget).map(([k, v]) => `- ${k}: ${v}`));
  }
  if (timeline) {
    out.push(``, `## Timeline status`, ...Object.entries(timeline).map(([k, v]) => `- ${k}: ${v}`));
  }
  if (createdAt) {
    out.push(
      ``,
      `## Timeline`,
      `- First: ${createdAt[0]}`,
      `- Last: ${createdAt[createdAt.length - 1]}`
    );
  }
  if (!budget && !timeline && !createdAt) {
    out.push(
      ``,
      `*(No known status fields found; consider adding \`budget_status\`, \`timeline_status\`, and \`created_at\` to lessons.)*`
    );
  }
  out.push(
    ``,
    `**Recommendations**`,
    `- Standardize status fields;`,
    `- Pre-mortems for high-risk projects;`,
    `- Tighten change control with recurring-problem suppliers.`
  );

  return out.join("\n");
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
