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

type BudgetStatus = "under" | "on" | "over";
type TimelineStatus = "early" | "on" | "late";

type LessonRow = {
  id: string;
  created_at: string;
  project_name: string | null;
  satisfaction: number | null;
  budget_status: BudgetStatus | null;
  timeline_status: TimelineStatus | null;
};

const SELECT_FIELDS = [
  "id",
  "created_at",
  "project_name",
  "satisfaction",
  "budget_status",
  "timeline_status",
].join(", ");

/** Simple preset system — only uses columns that exist */
type PresetParams = {
  timeRangeDays?: number;
  budget_status?: BudgetStatus;
  timeline_status?: TimelineStatus;
  min_satisfaction?: number;
  max_satisfaction?: number;
};

const PRESETS: Array<{
  id: string;
  label: string;
  description?: string;
  params: PresetParams;
}> = [
  {
    id: "recent-30",
    label: "Last 30 days",
    description: "All lessons from the past month.",
    params: { timeRangeDays: 30 },
  },
  {
    id: "high-sat",
    label: "High satisfaction (≥4)",
    description: "Quality signals at a glance.",
    params: { min_satisfaction: 4 },
  },
  {
    id: "budget-over",
    label: "Over budget (all time)",
    params: { budget_status: "over" },
  },
  {
    id: "late",
    label: "Late timeline (all time)",
    params: { timeline_status: "late" },
  },
];

export default function Dashboards() {
  const navigate = useNavigate();

  const [presetId, setPresetId] = useState<string>(PRESETS[0].id);
  const selectedPreset = useMemo(
    () => PRESETS.find((p) => p.id === presetId) ?? PRESETS[0],
    [presetId]
  );

  const [rows, setRows] = useState<LessonRow[] | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const params = selectedPreset.params;

      let query = supabase
        .from("lessons")
        .select(SELECT_FIELDS)
        .order("created_at", { ascending: false })
        .limit(500);

      if (params.timeRangeDays && params.timeRangeDays > 0) {
        const since = new Date(
          Date.now() - params.timeRangeDays * 24 * 60 * 60 * 1000
        ).toISOString();
        query = query.gte("created_at", since);
      }
      if (params.budget_status) query = query.eq("budget_status", params.budget_status);
      if (params.timeline_status) query = query.eq("timeline_status", params.timeline_status);
      if (typeof params.min_satisfaction === "number")
        query = query.gte("satisfaction", params.min_satisfaction);
      if (typeof params.max_satisfaction === "number")
        query = query.lte("satisfaction", params.max_satisfaction);

      const { data, error } = await query;
      if (error) throw error;
      setRows((data as unknown as LessonRow[]) ?? []);
    } catch (e: any) {
      console.error("Dashboards load failed:", e);
      setError(e?.message ?? "Failed to load data.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [presetId]);

  /** Build deep-link to Lessons using the params this preset applied */
  function openInLessons() {
    const qs = new URLSearchParams();
    const p = selectedPreset.params;
    if (p.budget_status) qs.set("budget", p.budget_status);
    if (p.timeline_status) qs.set("timeline", p.timeline_status);
    if (typeof p.min_satisfaction === "number") qs.set("minSat", String(p.min_satisfaction));
    if (typeof p.max_satisfaction === "number") qs.set("maxSat", String(p.max_satisfaction));
    if (typeof p.timeRangeDays === "number") qs.set("periodDays", String(p.timeRangeDays));
    navigate(`/lessons?${qs.toString()}`);
  }

  const kpi = useMemo(() => {
    const total = rows?.length ?? 0;
    const avg =
      total > 0
        ? Number(
            (
              rows!.reduce((s, r) => s + (Number(r.satisfaction) || 0), 0) / total
            ).toFixed(2)
          )
        : 0;
    const onBudget = rows?.filter((r) => r.budget_status === "on").length ?? 0;
    const onTime = rows?.filter((r) => r.timeline_status === "on").length ?? 0;
    return {
      total,
      avgSatisfaction: avg,
      onBudgetPct: total ? Math.round((onBudget / total) * 100) : 0,
      onTimePct: total ? Math.round((onTime / total) * 100) : 0,
    };
  }, [rows]);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6">
      <DashboardHeader
        title="Dashboards"
        description="Preset cuts of your lessons data. Filter here, or jump to the Lessons page for finer control."
      />

      <Card className="mt-4">
        <CardHeader>
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <CardTitle>Preset</CardTitle>
              <p className="text-sm text-muted-foreground">
                {selectedPreset.description ?? "Choose a preset view"}
              </p>
            </div>
            <div className="flex items-end gap-3">
              <div className="space-y-2">
                <Label htmlFor="preset">Select preset</Label>
                <Select value={presetId} onValueChange={setPresetId}>
                  <SelectTrigger id="preset" className="w-64">
                    <SelectValue placeholder="Pick a preset" />
                  </SelectTrigger>
                  <SelectContent>
                    {PRESETS.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={load} disabled={loading}>
                  Refresh
                </Button>
                <Button onClick={openInLessons} disabled={loading}>
                  View in Lessons
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* KPIs */}
          {loading ? (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Total</CardTitle>
                </CardHeader>
                <CardContent className="text-3xl">{kpi.total}</CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Avg. Satisfaction</CardTitle>
                </CardHeader>
                <CardContent className="text-3xl">{kpi.avgSatisfaction}</CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">On Budget</CardTitle>
                </CardHeader>
                <CardContent className="text-3xl">{kpi.onBudgetPct}%</CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">On Time</CardTitle>
                </CardHeader>
                <CardContent className="text-3xl">{kpi.onTimePct}%</CardContent>
              </Card>
            </div>
          )}

          {/* Table */}
          <div className="mt-6 overflow-x-auto">
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-10" />
                <Skeleton className="h-10" />
                <Skeleton className="h-10" />
              </div>
            ) : error ? (
              <div className="text-sm text-destructive">{error}</div>
            ) : rows && rows.length > 0 ? (
              <table className="w-full text-sm">
                <thead className="border-b">
                  <tr>
                    <th className="py-2 pr-4 text-left font-medium">Project</th>
                    <th className="py-2 pr-4 text-left font-medium">Date</th>
                    <th className="py-2 pr-4 text-left font-medium">Satisfaction</th>
                    <th className="py-2 pr-4 text-left font-medium">Budget</th>
                    <th className="py-2 pr-4 text-left font-medium">Timeline</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} className="border-b last:border-0">
                      <td className="py-2 pr-4">{r.project_name ?? "—"}</td>
                      <td className="py-2 pr-4">
                        {new Date(r.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-2 pr-4">
                        {typeof r.satisfaction === "number" ? r.satisfaction : "—"}
                      </td>
                      <td className="py-2 pr-4 capitalize">{r.budget_status ?? "—"}</td>
                      <td className="py-2 pr-4 capitalize">{r.timeline_status ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-sm text-muted-foreground">No results.</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
