// src/pages/Dashboards.tsx
import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

import { Button } from "@/components/ui/button";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw, Plus, Trash, Eye } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type BudgetStatus = "under" | "on" | "over";
type TimelineStatus = "early" | "on" | "late";

type LessonRow = {
  id: string;
  project?: string | null;
  customer?: string | null;
  date?: string | null;
  created_at?: string | null;
  satisfaction?: number | null;
  budget_status?: BudgetStatus | null;
  timeline_status?: TimelineStatus | null;
  owner?: string | null;
  user_id?: string | null;
  profile_id?: string | null;
  tags?: string[] | null;
};

type CustomFilters = {
  dateFrom?: string;
  dateTo?: string;
  customer?: string;
  project?: string;
  budgetStatus?: BudgetStatus;
  timelineStatus?: TimelineStatus;
  satisfactionMin?: number;
  owner?: string;
  tags?: string[];
};

type CustomDashboard = { id: string; name: string; filters: CustomFilters };
type PresetKey = "last_7" | "last_30" | "last_90" | "this_year";

const todayISO = () => new Date().toISOString().slice(0, 10);
const addDays = (iso: string, d: number) => { const x = new Date(iso); x.setDate(x.getDate() + d); return x.toISOString().slice(0, 10); };

const PRESETS: Record<PresetKey, { label: string; dateFrom: string; dateTo: string }> = (() => {
  const t = todayISO();
  return {
    last_7:  { label: "Last 7 days",  dateFrom: addDays(t, -7),  dateTo: t },
    last_30: { label: "Last 30 days", dateFrom: addDays(t, -30), dateTo: t },
    last_90: { label: "Last 90 days", dateFrom: addDays(t, -90), dateTo: t },
    this_year: { label: "This calendar year", dateFrom: new Date(new Date().getFullYear(),0,1).toISOString().slice(0,10), dateTo: t },
  };
})();

function mergeFilters(
  preset: { dateFrom: string; dateTo: string }, custom?: CustomFilters | null
) {
  const base = { dateFrom: preset.dateFrom, dateTo: preset.dateTo };
  if (!custom) return base;
  return { ...base, ...custom, dateFrom: custom.dateFrom ?? base.dateFrom, dateTo: custom.dateTo ?? base.dateTo };
}

const buildLessonsQuery = (filters: CustomFilters) => {
  const payload = encodeURIComponent(JSON.stringify(filters));
  return `/lessons?${new URLSearchParams({ f: payload }).toString()}`;
};

export default function Dashboards() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();

  const [presetKey, setPresetKey] = useState<PresetKey>("last_30");
  const [customList, setCustomList] = useState<CustomDashboard[]>([]);
  const [selectedCustomId, setSelectedCustomId] = useState<string | "">("");
  const [customsError, setCustomsError] = useState<string | null>(null);

  const [lessons, setLessons] = useState<LessonRow[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [dataError, setDataError] = useState<string | null>(null);

  const [activeUserCol, setActiveUserCol] = useState<string>("user_id");
  const [activeDateCol, setActiveDateCol] = useState<string>("date");

  const hasToastedCustomErr = useRef(false);
  const hasToastedDataErr = useRef(false);

  useEffect(() => {
    const sel = searchParams.get("select");
    if (sel) setSelectedCustomId(sel);
  }, [searchParams]);

  const fetchCustoms = useCallback(async () => {
    setCustomsError(null);
    if (!user) return;
    const { data, error } = await supabase
      .from("dashboard_presets")
      .select("id,name,filters")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      setCustomsError(error.message || "Could not load custom dashboards");
      if (!hasToastedCustomErr.current) {
        toast({ variant: "destructive", title: "Could not load custom dashboards" });
        hasToastedCustomErr.current = true;
      }
      setCustomList([]);
      return;
    }
    setCustomList((data || []) as CustomDashboard[]);
  }, [user, toast]);

  useEffect(() => {
    fetchCustoms();
    const onFocus = () => fetchCustoms();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [fetchCustoms]);

  const effectiveFilters = useMemo(() => {
    const preset = PRESETS[presetKey];
    const selected = customList.find((c) => c.id === selectedCustomId)?.filters ?? null;
    return mergeFilters(preset, selected);
  }, [presetKey, customList, selectedCustomId]);

  const candidateUserCols = ["user_id", "profile_id", "owner_id"];
  const candidateDateCols = ["date", "created_at"];

  const tryFetchLessons = useCallback(
    async (userCol: string, dateCol: string) => {
      let q = supabase.from("lessons").select("*").eq(userCol, user!.id);
      if (effectiveFilters.dateFrom) q = q.gte(dateCol, effectiveFilters.dateFrom);
      if (effectiveFilters.dateTo)   q = q.lte(dateCol, effectiveFilters.dateTo);

      const f = effectiveFilters;
      if (f.customer)       q = q.ilike("customer", f.customer);
      if (f.project)        q = q.ilike("project", f.project);
      if (f.owner)          q = q.ilike("owner", f.owner);
      if (f.budgetStatus)   q = q.eq("budget_status", f.budgetStatus);
      if (f.timelineStatus) q = q.eq("timeline_status", f.timelineStatus);
      if (typeof f.satisfactionMin === "number") q = q.gte("satisfaction", f.satisfactionMin);
      if (f.tags?.length)   q = q.contains("tags", f.tags);

      const orderCol = dateCol || "created_at";
      return await q.order(orderCol, { ascending: false });
    },
    [effectiveFilters, user]
  );

  const fetchLessons = useCallback(async () => {
    if (!user) return;
    setLoadingData(true);
    setDataError(null);

    let lastError: string | null = null;

    for (const ucol of candidateUserCols) {
      for (const dcol of candidateDateCols) {
        const { data, error } = await tryFetchLessons(ucol, dcol);
        if (!error) {
          setLessons((data || []) as LessonRow[]);
          setActiveUserCol(ucol);
          setActiveDateCol(dcol);
          setLoadingData(false);
          return;
        }
        lastError = error.message || "Unknown error";
      }
    }

    console.error("Lessons load failed:", lastError);
    setLessons([]);
    setDataError(lastError || "Failed to load data");
    if (!hasToastedDataErr.current) {
      toast({ variant: "destructive", title: "Failed to load dashboard data" });
      hasToastedDataErr.current = true;
    }
    setLoadingData(false);
  }, [user, tryFetchLessons, toast]);

  useEffect(() => { fetchLessons(); }, [fetchLessons]);

  const metrics = useMemo(() => {
    const total = lessons.length;
    const avgSatisfaction = total
      ? Math.round(((lessons.reduce((s, r) => s + (r.satisfaction ?? 0), 0) / total) + Number.EPSILON) * 100) / 100
      : 0;
    const onBudgetCount = lessons.filter(l => l.budget_status === "on" || l.budget_status === "under").length;
    const onTimeCount   = lessons.filter(l => l.timeline_status === "on" || l.timeline_status === "early").length;
    return {
      total,
      avgSatisfaction,
      onBudgetPct: total ? Math.round((onBudgetCount / total) * 100) : 0,
      onTimePct:   total ? Math.round((onTimeCount   / total) * 100) : 0,
    };
  }, [lessons]);

  const handleCreate = () => navigate("/dashboard-customizer");
  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("dashboard_presets").delete().eq("id", id).limit(1);
    if (error) {
      toast({ variant: "destructive", title: "Could not delete dashboard" });
    } else {
      toast({ title: "Dashboard deleted" });
      if (selectedCustomId === id) setSelectedCustomId("");
      fetchCustoms();
    }
  };
  const handleViewInLessons = () => navigate(buildLessonsQuery(effectiveFilters));

  if (loading) return <div className="p-6 text-sm text-muted-foreground">Checking session…</div>;

  return (
    <div className="container mx-auto px-4 py-6">
      <DashboardHeader
        title="Dashboards"
        description="Preset cuts of your lessons data. Filter here, or jump to the Lessons page for finer control."
      />

      <Card className="mt-4">
        <CardHeader className="pb-2">
          <CardTitle>Preset</CardTitle>
          <CardDescription>All lessons from the selected window (plus any custom filters).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">

          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-3 justify-between">
            {/* LEFT: selectors */}
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <div className="text-sm mb-1 font-medium text-muted-foreground">Select preset</div>
                <Select value={presetKey} onValueChange={(v: PresetKey) => setPresetKey(v)}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select…" />
                  </SelectTrigger>
                  <SelectContent className="z-50">
                    {(Object.keys(PRESETS) as PresetKey[]).map(k => (
                      <SelectItem key={k} value={k}>{PRESETS[k].label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Custom dashboards + inline error (to the RIGHT) */}
              <div>
                <div className="text-sm mb-1 font-medium text-muted-foreground">Custom dashboards</div>
                <div className="flex items-center gap-2">
                  <Select
                    value={selectedCustomId}
                    onValueChange={(v) => setSelectedCustomId(v)}
                    disabled={!!customsError || customList.length === 0}
                  >
                    <SelectTrigger className="w-[260px]">
                      <SelectValue
                        placeholder={
                          customsError
                            ? "Error loading"
                            : customList.length
                            ? "Choose a custom dashboard"
                            : "No custom dashboards yet"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent className="z-[60] max-h-72">
                      {customList.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {customsError && (
                    <span className="text-xs text-destructive whitespace-nowrap">
                      Could not load custom dashboards.
                    </span>
                  )}
                </div>
              </div>

              {selectedCustomId && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setDeleteId(selectedCustomId)}
                    >
                      <Trash className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete this dashboard?</AlertDialogTitle>
                      <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => deleteId && handleDelete(deleteId)}
                        className="bg-destructive text-destructive-foreground hover:opacity-95"
                      >
                        Yes, delete it
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>

            {/* RIGHT: actions */}
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="secondary" onClick={fetchLessons}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
              <Button onClick={handleViewInLessons}>
                <Eye className="mr-2 h-4 w-4" />
                View in Lessons
              </Button>
              <Button
                onClick={handleCreate}
                className="bg-gradient-to-r from-orange-400 to-fuchsia-500 hover:opacity-95"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Custom Dashboard
              </Button>
            </div>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <Card>
              <CardContent className="p-6">
                <div className="text-sm text-muted-foreground">Total</div>
                <div className="text-5xl font-semibold mt-2">{loadingData ? "…" : metrics.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="text-sm text-muted-foreground">Avg. Satisfaction</div>
                <div className="text-5xl font-semibold mt-2">
                  {loadingData ? "…" : metrics.avgSatisfaction.toFixed(2).replace(/\.00$/, "")}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="text-sm text-muted-foreground">On Budget</div>
                <div className="text-5xl font-semibold mt-2">
                  {loadingData ? "…" : `${metrics.onBudgetPct}%`}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="text-sm text-muted-foreground">On Time</div>
                <div className="text-5xl font-semibold mt-2">
                  {loadingData ? "…" : `${metrics.onTimePct}%`}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent list */}
          <div className="pt-4">
            <div className="text-sm font-medium text-muted-foreground mb-2">Recent items</div>
            <div className="rounded-lg border">
              <div className="grid grid-cols-5 text-xs uppercase tracking-wide text-muted-foreground border-b px-3 py-2">
                <div className="col-span-2">Project</div>
                <div>Date</div>
                <div>Budget</div>
                <div>Timeline</div>
              </div>
              {lessons.slice(0, 6).map((l) => {
                const dateVal = ((l as any)[activeDateCol] as string | undefined) ?? (l.created_at ?? l.date ?? "");
                return (
                  <div key={l.id} className="grid grid-cols-5 px-3 py-2 border-b last:border-b-0 text-sm">
                    <div className="col-span-2 truncate">{l.project ?? "—"}</div>
                    <div>{(dateVal || "").slice(0, 10)}</div>
                    <div>{l.budget_status?.toUpperCase?.() ?? "—"}</div>
                    <div>{l.timeline_status?.toUpperCase?.() ?? "—"}</div>
                  </div>
                );
              })}
              {lessons.length === 0 && !loadingData && (
                <div className="px-3 py-6 text-sm text-muted-foreground">
                  {dataError ? "No data due to a query error. Check table/column names." : "No data in this view."}
                </div>
              )}
            </div>
            {dataError && (
              <div className="text-xs text-destructive mt-2">
                Error loading lessons (tried {activeUserCol}/{activeDateCol}). Check column names or RLS.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
