import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw, Plus, Trash, Eye } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// -----------------------------
// Types
// -----------------------------
type BudgetStatus = "under" | "on" | "over";
type TimelineStatus = "early" | "on" | "late";

type LessonRow = {
  id: string;
  project?: string | null;
  customer?: string | null;
  date?: string | null;          // ISO date string
  created_at?: string | null;    // fallback if date is not present
  satisfaction?: number | null;  // 1-5
  budget_status?: BudgetStatus | null;
  timeline_status?: TimelineStatus | null;
  owner?: string | null;
  tags?: string[] | null;
};

type CustomFilters = {
  dateFrom?: string; // ISO "YYYY-MM-DD"
  dateTo?: string;   // ISO "YYYY-MM-DD"
  customer?: string;
  project?: string;
  budgetStatus?: BudgetStatus;
  timelineStatus?: TimelineStatus;
  satisfactionMin?: number;
  owner?: string;
  tags?: string[];
};

type CustomDashboard = {
  id: string;
  name: string;
  filters: CustomFilters;
};

type PresetKey = "last_7" | "last_30" | "last_90" | "this_year";

// -----------------------------
// Helpers
// -----------------------------
const startOfToday = () => new Date().toISOString().slice(0, 10);

function addDays(baseISO: string, delta: number) {
  const d = new Date(baseISO);
  d.setDate(d.getDate() + delta);
  return d.toISOString().slice(0, 10);
}

const PRESETS: Record<PresetKey, { label: string; dateFrom: string; dateTo: string }> = (() => {
  const today = startOfToday();
  return {
    last_7: { label: "Last 7 days", dateFrom: addDays(today, -7), dateTo: today },
    last_30: { label: "Last 30 days", dateFrom: addDays(today, -30), dateTo: today },
    last_90: { label: "Last 90 days", dateFrom: addDays(today, -90), dateTo: today },
    this_year: { label: "This calendar year", dateFrom: new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10), dateTo: today },
  };
})();

// Compose effective filters: preset window + optional custom filters
function mergeFilters(
  preset: { dateFrom: string; dateTo: string },
  custom?: CustomFilters | null
): Required<Pick<CustomFilters, "dateFrom" | "dateTo">> & CustomFilters {
  const base = { dateFrom: preset.dateFrom, dateTo: preset.dateTo };
  if (!custom) return base;
  return {
    ...base,
    ...custom,
    // ensure date window always respected by preset unless custom explicitly widens/narrows
    dateFrom: custom.dateFrom ?? base.dateFrom,
    dateTo: custom.dateTo ?? base.dateTo,
  };
}

// Build URL-safe query for Lessons page
function buildLessonsQuery(filters: CustomFilters) {
  const payload = encodeURIComponent(JSON.stringify(filters));
  const params = new URLSearchParams({ f: payload });
  return `/lessons?${params.toString()}`;
}

// -----------------------------
// Page
// -----------------------------
export default function Dashboards() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();

  // Preset and custom selection
  const [presetKey, setPresetKey] = useState<PresetKey>("last_30");
  const [customList, setCustomList] = useState<CustomDashboard[]>([]);
  const [selectedCustomId, setSelectedCustomId] = useState<string | "">( "");

  // Lessons + metrics
  const [lessons, setLessons] = useState<LessonRow[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // Deletion dialog
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // On return from builder, allow selecting the newly created one via query ?select=<id>
  useEffect(() => {
    const sel = searchParams.get("select");
    if (sel) setSelectedCustomId(sel);
  }, [searchParams]);

  // Fetch custom dashboards
  const fetchCustoms = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("dashboard_presets")
      .select("id,name,filters")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Could not load custom dashboards" });
      return;
    }
    setCustomList((data || []) as CustomDashboard[]);
  }, [user, toast]);

  // Load on mount + when window refocuses (so save/return from builder shows up)
  useEffect(() => {
    fetchCustoms();
    const onFocus = () => fetchCustoms();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [fetchCustoms]);

  // Build effective filters for data query
  const effectiveFilters = useMemo(() => {
    const preset = PRESETS[presetKey];
    const selected = customList.find((c) => c.id === selectedCustomId)?.filters ?? null;
    return mergeFilters(preset, selected);
  }, [presetKey, customList, selectedCustomId]);

  // Fetch lessons according to filters
  const fetchLessons = useCallback(async () => {
    if (!user) return;
    setLoadingData(true);

    // Base query
    let q = supabase.from("lessons").select("*").eq("user_id", user.id);

    // Date window: prefer 'date' column; if your schema uses 'created_at' instead, keep both guards
    if (effectiveFilters.dateFrom) {
      q = q.gte("date", effectiveFilters.dateFrom);
    }
    if (effectiveFilters.dateTo) {
      q = q.lte("date", effectiveFilters.dateTo);
    }

    // Optional filters
    const f = effectiveFilters;
    if (f.customer) q = q.ilike("customer", f.customer);
    if (f.project) q = q.ilike("project", f.project);
    if (f.owner) q = q.ilike("owner", f.owner);
    if (f.budgetStatus) q = q.eq("budget_status", f.budgetStatus);
    if (f.timelineStatus) q = q.eq("timeline_status", f.timelineStatus);
    if (typeof f.satisfactionMin === "number") q = q.gte("satisfaction", f.satisfactionMin);
    if (f.tags && f.tags.length > 0) q = q.contains("tags", f.tags);

    const { data, error } = await q.order("date", { ascending: false });

    if (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Failed to load dashboard data" });
      setLessons([]);
    } else {
      setLessons((data || []) as LessonRow[]);
    }
    setLoadingData(false);
  }, [user, effectiveFilters, toast]);

  useEffect(() => {
    fetchLessons();
  }, [fetchLessons]);

  // Metrics
  const metrics = useMemo(() => {
    const total = lessons.length;
    const avgSatisfaction =
      total === 0
        ? 0
        : Math.round(
            ((lessons.reduce((s, r) => s + (r.satisfaction ?? 0), 0) / total) + Number.EPSILON) *
              100
          ) / 100;

    const onBudgetCount = lessons.filter((l) => l.budget_status === "on" || l.budget_status === "under").length;
    const onTimeCount = lessons.filter((l) => l.timeline_status === "on" || l.timeline_status === "early").length;

    const onBudgetPct = total ? Math.round((onBudgetCount / total) * 100) : 0;
    const onTimePct = total ? Math.round((onTimeCount / total) * 100) : 0;

    return { total, avgSatisfaction, onBudgetPct, onTimePct };
  }, [lessons]);

  // Actions
  const handleCreate = () => {
    navigate("/dashboard-customizer");
  };

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

  const handleViewInLessons = () => {
    navigate(buildLessonsQuery(effectiveFilters));
  };

  if (loading) {
    return <div className="p-6 text-sm text-muted-foreground">Checking session…</div>;
  }

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

          {/* Row: Preset + Custom selector + actions */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Preset window */}
              <div>
                <div className="text-sm mb-1 font-medium text-muted-foreground">Select preset</div>
                <Select value={presetKey} onValueChange={(v: PresetKey) => setPresetKey(v)}>
                  <SelectTrigger className="w-[240px]">
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(PRESETS) as PresetKey[]).map((k) => (
                      <SelectItem key={k} value={k}>
                        {PRESETS[k].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Custom dashboards */}
              <div>
                <div className="text-sm mb-1 font-medium text-muted-foreground">Custom dashboards</div>
                <Select
                  value={selectedCustomId}
                  onValueChange={(v) => setSelectedCustomId(v)}
                >
                  <SelectTrigger className="w-[280px]">
                    <SelectValue placeholder={customList.length ? "Choose a custom dashboard" : "No custom dashboards yet"} />
                  </SelectTrigger>
                  <SelectContent>
                    {customList.length === 0 ? (
                      <div className="px-3 py-2 text-sm text-muted-foreground">None yet. Create one below.</div>
                    ) : (
                      customList.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2">
              <Button variant="secondary" onClick={fetchLessons}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>

              <Button onClick={handleViewInLessons}>
                <Eye className="mr-2 h-4 w-4" />
                View in Lessons
              </Button>

              <Button onClick={handleCreate} className="bg-gradient-to-r from-orange-400 to-fuchsia-500 hover:opacity-95">
                <Plus className="mr-2 h-4 w-4" />
                Create Custom Dashboard
              </Button>
            </div>
          </div>

          {/* If a custom is selected, offer delete with confirm */}
          {selectedCustomId && (
            <div className="flex items-center gap-3 pt-1">
              <span className="text-sm text-muted-foreground">
                Selected: <span className="font-medium">{customList.find((c) => c.id === selectedCustomId)?.name}</span>
              </span>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="ml-1"
                    onClick={() => setDeleteId(selectedCustomId)}
                  >
                    <Trash className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete this dashboard?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. The custom dashboard will be permanently removed.
                    </AlertDialogDescription>
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
            </div>
          )}

          {/* Metrics pane */}
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
                <div className="text-5xl font-semibold mt-2">{loadingData ? "…" : `${metrics.onBudgetPct}%`}</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="text-sm text-muted-foreground">On Time</div>
                <div className="text-5xl font-semibold mt-2">{loadingData ? "…" : `${metrics.onTimePct}%`}</div>
              </CardContent>
            </Card>
          </div>

          {/* Lightweight recent list (optional, keeps page feeling alive) */}
          <div className="pt-4">
            <div className="text-sm font-medium text-muted-foreground mb-2">Recent items</div>
            <div className="rounded-lg border">
              <div className="grid grid-cols-5 text-xs uppercase tracking-wide text-muted-foreground border-b px-3 py-2">
                <div className="col-span-2">Project</div>
                <div>Date</div>
                <div>Budget</div>
                <div>Timeline</div>
              </div>
              {lessons.slice(0, 6).map((l) => (
                <div key={l.id} className="grid grid-cols-5 px-3 py-2 border-b last:border-b-0 text-sm">
                  <div className="col-span-2 truncate">{l.project ?? "—"}</div>
                  <div>{(l.date ?? l.created_at ?? "").slice(0, 10)}</div>
                  <div>{l.budget_status?.toUpperCase?.() ?? "—"}</div>
                  <div>{l.timeline_status?.toUpperCase?.() ?? "—"}</div>
                </div>
              ))}
              {lessons.length === 0 && (
                <div className="px-3 py-6 text-sm text-muted-foreground">No data in this view.</div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
