// src/pages/Dashboards.tsx
import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw } from "lucide-react";

type BudgetStatus = "under" | "on" | "over" | null;
type TimelineStatus = "early" | "on" | "late" | null;

type RawLesson = {
  id: string;
  project_name?: string | null;
  satisfaction?: number | null;
  budget_status?: BudgetStatus;
  timeline_status?: TimelineStatus;
  // possible date columns
  lesson_date?: string | null;
  occurred_on?: string | null;
  created_at?: string | null;
  date?: string | null;
};

type LessonRow = {
  id: string;
  project_name: string;
  normalizedDate: string | null;
  satisfaction: number | null;
  budget_status: BudgetStatus;
  timeline_status: TimelineStatus;
};

type PresetKey = "30d" | "90d" | "ytd" | "all";

const PRESETS: Record<
  PresetKey,
  { label: string; getRange: () => { from?: string; to?: string } }
> = {
  "30d": {
    label: "Last 30 days",
    getRange: () => {
      const to = new Date();
      const from = new Date();
      from.setDate(to.getDate() - 30);
      return { from: from.toISOString(), to: to.toISOString() };
    },
  },
  "90d": {
    label: "Last 90 days",
    getRange: () => {
      const to = new Date();
      const from = new Date();
      from.setDate(to.getDate() - 90);
      return { from: from.toISOString(), to: to.toISOString() };
    },
  },
  ytd: {
    label: "Year to date",
    getRange: () => {
      const to = new Date();
      const from = new Date(to.getFullYear(), 0, 1);
      return { from: from.toISOString(), to: to.toISOString() };
    },
  },
  all: { label: "All time", getRange: () => ({}) },
};

export default function Dashboards() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [preset, setPreset] = useState<PresetKey>("30d");
  const [rows, setRows] = useState<LessonRow[]>([]);
  const [busy, setBusy] = useState(false);

  const range = useMemo(() => PRESETS[preset].getRange(), [preset]);

  const pickFirstDate = (r: RawLesson): string | null => {
    const candidate = r.lesson_date ?? r.occurred_on ?? r.date ?? r.created_at ?? null;
    if (!candidate) return null;
    const d = new Date(candidate);
    return isNaN(d.getTime()) ? null : d.toISOString();
  };

  const fetchData = async () => {
    try {
      setBusy(true);

      const { data, error } = await supabase
        .from("lessons")
        .select(
          [
            "id",
            "project_name",
            "satisfaction",
            "budget_status",
            "timeline_status",
            "lesson_date",
            "occurred_on",
            "created_at",
            "date",
          ].join(", ")
        )
        .order("created_at", { ascending: false });

      if (error) throw error;

      const normalized: LessonRow[] = (data as RawLesson[]).map((r) => ({
        id: r.id,
        project_name: r.project_name ?? "",
        normalizedDate: pickFirstDate(r),
        satisfaction: typeof r.satisfaction === "number" ? r.satisfaction : null,
        budget_status: (r.budget_status as BudgetStatus) ?? null,
        timeline_status: (r.timeline_status as TimelineStatus) ?? null,
      }));

      // client-side date filtering
      const filtered = normalized.filter((r) => {
        if (!range.from && !range.to) return true;
        if (!r.normalizedDate) return false;
        const t = new Date(r.normalizedDate).getTime();
        if (range.from && t < new Date(range.from).getTime()) return false;
        if (range.to && t > new Date(range.to).getTime()) return false;
        return true;
      });

      setRows(filtered);
    } catch (err: any) {
      toast({
        title: "Load failed",
        description: err?.message ?? "Could not load dashboard data.",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (user) fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, preset]);

  const handleRefresh = () => fetchData();

  const handleViewInLessons = () => {
    const params = new URLSearchParams();
    if (range.from) params.set("from", range.from);
    if (range.to) params.set("to", range.to);
    navigate(`/lessons${params.toString() ? `?${params.toString()}` : ""}`);
  };

  // KPIs
  const total = rows.length;

  const avgSatisfaction = useMemo(() => {
    const nums = rows
      .map((r) => r.satisfaction)
      .filter((n): n is number => typeof n === "number");
    if (!nums.length) return 0;
    const sum = nums.reduce((a, b) => a + b, 0);
    return Math.round((sum / nums.length) * 100) / 100;
  }, [rows]);

  const onBudgetPct = useMemo(() => {
    if (!rows.length) return 0;
    const good = rows.filter(
      (r) => r.budget_status === "under" || r.budget_status === "on"
    ).length;
    return Math.round((good / rows.length) * 100);
  }, [rows]);

  const onTimePct = useMemo(() => {
    if (!rows.length) return 0;
    const good = rows.filter(
      (r) => r.timeline_status === "early" || r.timeline_status === "on"
    ).length;
    return Math.round((good / rows.length) * 100);
  }, [rows]);

  if (loading) {
    return <div className="p-6 text-sm text-muted-foreground">Checking session…</div>;
  }
  if (!user) return <Navigate to="/auth" replace />;

  return (
    <div className="mx-auto max-w-6xl px-4 pb-10 pt-6">
      {/* Page header */}
      <div className="mb-4">
        <h1 className="text-3xl font-bold tracking-tight">Dashboards</h1>
        <p className="text-muted-foreground">
          Preset cuts of your lessons data. Filter here, or jump to the Lessons page for finer control.
        </p>
      </div>

      {/* Preset card */}
      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle>Preset</CardTitle>
          <CardDescription>
            {preset === "30d" && "All lessons from the past month."}
            {preset === "90d" && "All lessons from the past 90 days."}
            {preset === "ytd" && "All lessons from the current year to date."}
            {preset === "all" && "All lessons in the workspace."}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Controls: mobile stack / desktop row */}
          <div className="w-full">
            {/* Mobile layout */}
            <div className="md:hidden space-y-3">
              <div className="grid grid-cols-1 gap-2">
                <Button onClick={handleRefresh} className="w-full" disabled={busy}>
                  <RefreshCw className={`mr-2 h-4 w-4 ${busy ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
                <Button
                  onClick={handleViewInLessons}
                  variant="secondary"
                  className="w-full"
                >
                  View in Lessons
                </Button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="preset">Select preset</Label>
                <Select value={preset} onValueChange={(v) => setPreset(v as PresetKey)}>
                  <SelectTrigger id="preset" className="w-full">
                    <SelectValue placeholder="Choose a preset" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PRESETS).map(([key, p]) => (
                      <SelectItem key={key} value={key}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Desktop layout */}
            <div className="hidden md:flex md:items-end md:gap-3">
              <div className="flex-1">
                <Label htmlFor="preset-desktop">Select preset</Label>
                <Select value={preset} onValueChange={(v) => setPreset(v as PresetKey)}>
                  <SelectTrigger id="preset-desktop" className="w-full md:w-64">
                    <SelectValue placeholder="Choose a preset" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PRESETS).map(([key, p]) => (
                      <SelectItem key={key} value={key}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleRefresh} disabled={busy}>
                  <RefreshCw className={`mr-2 h-4 w-4 ${busy ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
                <Button onClick={handleViewInLessons} variant="secondary">
                  View in Lessons
                </Button>
              </div>
            </div>
          </div>

          {/* KPI Tiles */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Card>
              <CardContent className="p-5">
                <div className="text-sm font-medium text-muted-foreground">Total</div>
                <div className="mt-2 text-4xl font-semibold">{total}</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <div className="text-sm font-medium text-muted-foreground">
                  Avg. Satisfaction
                </div>
                <div className="mt-2 text-4xl font-semibold">
                  {avgSatisfaction.toFixed(2)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <div className="text-sm font-medium text-muted-foreground">On Budget</div>
                <div className="mt-2 text-4xl font-semibold">{onBudgetPct}%</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <div className="text-sm font-medium text-muted-foreground">On Time</div>
                <div className="mt-2 text-4xl font-semibold">{onTimePct}%</div>
              </CardContent>
            </Card>
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Satisfaction</TableHead>
                  <TableHead>Budget</TableHead>
                  <TableHead>Timeline</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => {
                  const dateStr = r.normalizedDate
                    ? new Date(r.normalizedDate).toLocaleDateString()
                    : "";
                  const budgetStr =
                    r.budget_status ? r.budget_status.charAt(0).toUpperCase() : "";
                  const timeStr =
                    r.timeline_status ? r.timeline_status.charAt(0).toUpperCase() : "";

                  return (
                    <TableRow key={r.id}>
                      <TableCell className="whitespace-pre-wrap">
                        {r.project_name || "Untitled"}
                      </TableCell>
                      <TableCell>{dateStr}</TableCell>
                      <TableCell>{r.satisfaction ?? ""}</TableCell>
                      <TableCell>{budgetStr}</TableCell>
                      <TableCell>{timeStr}</TableCell>
                    </TableRow>
                  );
                })}
                {!rows.length && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      No lessons found for this preset.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
