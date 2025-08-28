// src/pages/Dashboards.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

type PresetParams = {
  timeRangeDays?: number;
  budget_status?: "under" | "on" | "over";
  timeline_status?: "early" | "on" | "late";
  min_satisfaction?: number;
  max_satisfaction?: number;
  min_change_requests?: number;
  min_change_revenue_usd?: number;
};

type Preset = { id: string; name: string; description: string; params: PresetParams };

const PRESET_DASHBOARDS: Preset[] = [
  {
    id: "overall_health",
    name: "Overall Delivery Health",
    description: "All lessons from the last 90 days to assess satisfaction, budget, and timeline health.",
    params: { timeRangeDays: 90 },
  },
  { id: "budget_risk", name: "Budget at Risk", description: "Lessons marked Over budget in the last 90 days.", params: { timeRangeDays: 90, budget_status: "over" } },
  { id: "timeline_risk", name: "Timeline at Risk", description: "Lessons marked Late in the last 90 days.", params: { timeRangeDays: 90, timeline_status: "late" } },
  { id: "low_satisfaction", name: "Low Satisfaction", description: "Satisfaction ≤ 2 over the last 60 days.", params: { timeRangeDays: 60, max_satisfaction: 2 } },
  { id: "change_orders_impact", name: "Change Orders Impact", description: "Lessons with non-zero change order revenue in the last 180 days.", params: { timeRangeDays: 180, min_change_revenue_usd: 1 } },
  { id: "high_change_requests", name: "High Change Requests", description: "Lessons with 3+ change requests in the last 90 days.", params: { timeRangeDays: 90, min_change_requests: 3 } },
];

type LessonRow = {
  id: string;
  created_at: string;
  project_name: string | null;
  satisfaction: number | null; // 1..5
  budget_status: "under" | "on" | "over" | null;
  timeline_status: "early" | "on" | "late" | null;
  change_request_count: number | null;
  change_orders_approved_count: number | null;
  change_orders_revenue_usd: number | null;
  created_by: string;
};

const SELECT_FIELDS = [
  "id",
  "created_at",
  "project_name",
  "satisfaction",
  "budget_status",
  "timeline_status",
  "change_request_count",
  "change_orders_approved_count",
  "change_orders_revenue_usd",
  "created_by",
].join(", ");

type CustomDashboard = { id: string; name: string; params?: PresetParams }; // params optional for now

export default function Dashboards() {
  const navigate = useNavigate();

  // TODO: replace with real data when you persist custom dashboards
  const customDashboards: CustomDashboard[] = [];

  // State for dropdown selections
  const [presetId, setPresetId] = useState<string | null>(null);
  const [customId, setCustomId] = useState<string | null>(null);

  // Loaded rows for selected preset preview
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<LessonRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedPreset = useMemo(
    () => PRESET_DASHBOARDS.find((p) => p.id === presetId) || null,
    [presetId]
  );
  const selectedCustom = useMemo(
    () => customDashboards.find((c) => c.id === customId) || null,
    [customId, customDashboards]
  );

  // Build a query string for Lessons.tsx based on params
  function buildLessonsQuery(params: PresetParams, source: "preset" | "custom", id?: string) {
    const qs = new URLSearchParams();
    qs.set("source", source);
    if (id) qs.set("id", id);
    if (params.budget_status) qs.set("budget", params.budget_status);
    if (params.timeline_status) qs.set("timeline", params.timeline_status);
    if (typeof params.min_satisfaction === "number") qs.set("minSat", String(params.min_satisfaction));
    if (typeof params.max_satisfaction === "number") qs.set("maxSat", String(params.max_satisfaction));
    if (typeof params.timeRangeDays === "number") qs.set("periodDays", String(params.timeRangeDays));
    if (typeof params.min_change_requests === "number") qs.set("minChangeReqs", String(params.min_change_requests));
    if (typeof params.min_change_revenue_usd === "number") qs.set("minChangeRevenue", String(params.min_change_revenue_usd));
    return `/lessons?${qs.toString()}`;
  }

  // Load data for preset preview (simple KPIs)
  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!selectedPreset) {
        setRows(null);
        setError(null);
        return;
      }
      try {
        setLoading(true);
        setError(null);
        const params = selectedPreset.params;

        let query = supabase.from("lessons").select(SELECT_FIELDS).order("created_at", { ascending: false }).limit(500);

        if (params.timeRangeDays && params.timeRangeDays > 0) {
          const since = new Date(Date.now() - params.timeRangeDays * 24 * 60 * 60 * 1000).toISOString();
          query = query.gte("created_at", since);
        }
        if (params.budget_status) query = query.eq("budget_status", params.budget_status);
        if (params.timeline_status) query = query.eq("timeline_status", params.timeline_status);
        if (typeof params.min_satisfaction === "number") query = query.gte("satisfaction", params.min_satisfaction);
        if (typeof params.max_satisfaction === "number") query = query.lte("satisfaction", params.max_satisfaction);
        if (typeof params.min_change_requests === "number") query = query.gte("change_request_count", params.min_change_requests);
        if (typeof params.min_change_revenue_usd === "number") query = query.gte("change_orders_revenue_usd", params.min_change_revenue_usd);

        const { data, error } = await query;
        if (error) throw error;
        if (!cancelled) setRows((data as unknown as LessonRow[]) ?? []);
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? "Failed to load dashboard data.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [selectedPreset]);

  // Simple KPI summary for preview
  const kpis = useMemo(() => {
    const data = rows ?? [];
    const total = data.length;
    const sats = data
      .map((r) => (typeof r.satisfaction === "number" ? r.satisfaction : null))
      .filter((x): x is number => x !== null);
    const avgSat = sats.length ? +(sats.reduce((a, b) => a + b, 0) / sats.length).toFixed(2) : null;

    const budget = data.reduce(
      (acc, r) => {
        if (r.budget_status === "under") acc.under += 1;
        else if (r.budget_status === "on") acc.on += 1;
        else if (r.budget_status === "over") acc.over += 1;
        return acc;
      },
      { under: 0, on: 0, over: 0 }
    );

    const timeline = data.reduce(
      (acc, r) => {
        if (r.timeline_status === "early") acc.early += 1;
        else if (r.timeline_status === "on") acc.on += 1;
        else if (r.timeline_status === "late") acc.late += 1;
        return acc;
      },
      { early: 0, on: 0, late: 0 }
    );

    return { total, avgSat, budget, timeline };
  }, [rows]);

  return (
    <div className="space-y-6">
      <DashboardHeader
        title="Dashboards"
        description="Select a standard dashboard or work with your custom dashboards."
      />

      {/* STANDARD DASHBOARDS */}
      <Card>
        <CardHeader>
          <CardTitle>Standard</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            {/* Selector row */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Label className="text-sm">Standard dashboard</Label>
                <Select value={presetId ?? ""} onValueChange={(v) => setPresetId(v || null)}>
                  <SelectTrigger className="w-[280px]">
                    <SelectValue placeholder="Select a standard dashboard" />
                  </SelectTrigger>
                  <SelectContent>
                    {PRESET_DASHBOARDS.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                {selectedPreset && (
                  <>
                    <Button
                      variant="outline"
                      onClick={() =>
                        navigate(`/dashboards/customize?preset=${encodeURIComponent(selectedPreset.id)}`)
                      }
                    >
                      Open in Customizer
                    </Button>
                    <Button
                      onClick={() =>
                        navigate(buildLessonsQuery(selectedPreset.params, "preset", selectedPreset.id))
                      }
                    >
                      View lessons
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Preview pane */}
            {!selectedPreset ? (
              <div className="border rounded-lg p-6 text-sm text-muted-foreground">
                No dashboard selected.
              </div>
            ) : loading ? (
              <div className="border rounded-lg p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              </div>
            ) : error ? (
              <div className="border rounded-lg p-6 text-sm text-red-600">{error}</div>
            ) : (
              <div className="border rounded-lg p-6">
                <div className="mb-3">
                  <div className="font-medium">{selectedPreset.name}</div>
                  <div className="text-sm text-muted-foreground">{selectedPreset.description}</div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <KpiCard label="Total lessons" value={kpis.total ?? "—"} />
                  <KpiCard label="Avg. satisfaction" value={kpis.avgSat ?? "—"} />
                  <KpiCard label="On budget" value={kpis.budget.on} />
                  <KpiCard label="On time" value={kpis.timeline.on} />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* CUSTOM DASHBOARDS */}
      <Card>
        <CardHeader>
          <CardTitle>Custom</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            {/* Selector row */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Label className="text-sm">Custom dashboard</Label>
                <Select
                  value={customId ?? ""}
                  onValueChange={(v) => setCustomId(v || null)}
                  disabled={customDashboards.length === 0}
                >
                  <SelectTrigger className="w-[280px]">
                    <SelectValue
                      placeholder={
                        customDashboards.length === 0
                          ? "No custom dashboards"
                          : "Select a custom dashboard"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {customDashboards.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Button onClick={() => navigate("/dashboards/customize")}>Create dashboard</Button>
                {selectedCustom?.params && (
                  <Button
                    variant="outline"
                    onClick={() =>
                      navigate(buildLessonsQuery(selectedCustom.params!, "custom", selectedCustom.id))
                    }
                  >
                    View lessons
                  </Button>
                )}
              </div>
            </div>

            {/* Preview pane */}
            {!customId ? (
              <div className="border rounded-lg p-6 text-sm text-muted-foreground">
                No dashboard selected.
              </div>
            ) : (
              <div className="border rounded-lg p-6 text-sm">
                Selected custom dashboard: <span className="font-medium">{customId}</span>
                {/* TODO: render saved KPIs when custom definitions are persisted */}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function KpiCard({ label, value }: { label: string; value: number | string | null }) {
  return (
    <div className="border rounded-lg p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-2xl font-semibold mt-1">{value === null ? "—" : value}</div>
    </div>
  );
}
