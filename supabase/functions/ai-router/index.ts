// supabase/functions/ai-router/index.ts
// deno-lint-ignore-file no-explicit-any
// @ts-nocheck
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { action, prompt, context, title, op } = await req.json();

    if (op === "clear") {
      // No-op placeholder (you can also wipe per-user history in DB if desired)
      return new Response(JSON.stringify({ cleared: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!prompt || typeof prompt !== "string") {
      return new Response(JSON.stringify({ error: "Missing prompt" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let result = "";
    switch (action) {
      case "data_pack":
        result = await buildDataPack(prompt, context);
        break;
      case "trend":
        result = await runTrendAnalysis(prompt, context);
        break;
      case "ask":
      default:
        result = await plainAsk(prompt, context);
    }

    // TODO: Optionally persist request/response rows here.
    return new Response(JSON.stringify({ id: crypto.randomUUID(), result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e?.message || "Unhandled" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function plainAsk(prompt: string, context: any) {
  // In production: call your LLM + RAG. This is a simple echo for wiring tests.
  return `You asked: ${prompt}\n\n(Context keys: ${Object.keys(context || {}).join(", ") || "none"})`;
}

async function buildDataPack(prompt: string, context: any) {
  // Replace with real SQL queries → shape as CSV/JSON and optionally upload to Storage.
  const mock = {
    name: "Data Pack",
    prompt,
    generated_at: new Date().toISOString(),
    tables: [
      {
        name: "lessons",
        columns: ["id", "customer", "project", "budget_status", "timeline_status", "created_at"],
        rows: [
          ["uuid-1", "Savencia", "WH Upgrades", "over", "late", "2025-07-23"],
          ["uuid-2", "Creek Hill", "Conveyor", "on", "on", "2025-08-01"],
        ],
      },
    ],
  };
  return JSON.stringify(mock, null, 2);
}

async function runTrendAnalysis(prompt: string, context: any) {
  // Replace with real insights; you can output Markdown for the UI to render.
  return [
    `# Trend Analysis`,
    `Prompt: ${prompt}`,
    `- Budget overruns increasing in July–Aug.`,
    `- Timeline delays cluster around Supplier X.`,
    `- Recommendation: pre-mortems + tighter change control.`,
  ].join("\n");
}
