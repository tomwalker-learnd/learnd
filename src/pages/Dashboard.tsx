// src/pages/Dashboard.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import AnalyticsCta from "@/components/AnalyticsCta";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw, ArrowRight } from "lucide-react";

type BudgetStatus = "under" | "on" | "over";
type TimelineStatus = "early" | "on" | "late";

type LessonRow = {
  id: string;
  project_name: string | null;
  client_name: string | null;
  created_at: string;
  satisfaction: number | null; // 1..5
  budget_status: BudgetStatus | null;
  timeline_status: TimelineStatus | null;
  change_request_count: number | null;
  change_orders_approved_count: number | null;
  change_orders_revenue_usd: number | null;
  created_by: string;
};

const SELECT_FIELDS = [
  "id",
  "project_name",
  "client_name",
  "created_at",
  "satisfaction",
  "budget_status",
  "timeline_status",
  "change_request_count",
  "change_orders_approved_count",
  "change_orders_revenue_usd",
  "created_by",
].join(", ");

const KPI_WINDOW_DAYS = 90;
const RECENT_LIMIT = 10;

export default function Dashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [rows, setRows] = useState<LessonRow[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("lessons")
        .select(SELECT_FIELDS)
        .order("created_at", { ascending: false })
        .limit(500);

      if (error) throw error;
      setRows((data as unknown as LessonRow[]) ?? []);
    } catch (e: any) {
      const msg = e?.message ?? "Failed to load dashboard data.";
      setError(msg);
      toast({ title: "Load failed", description: msg, variant: "destructive" });
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onRefresh = () => load();

  // KPIs over last KPI_WINDOW_DAYS
  const { kpi, recent } = useMemo(() => {
    const all = rows ?? [];
    const sinceMs = Date.now() - KPI_WINDOW_DAYS * 24 * 60 * 60 * 1000;

    const windowed = all.filter((r) => new Date(r.created_at).getTime() >= sinceMs);

    const total = windowed.length;

    const sats = windowed
      .map((r) => (typeof r.satisfaction === "number" ? r.satisfaction : null))
      .filter((x): x is number => x !== null);
    const avgSat = sats.length ? +(sats.reduce((a, b) => a + b, 0) / sats.length).toFixed(2) : null;

    const budgetCounts = windowed.reduce(
      (acc, r) => {
        if (r.budget_status === "under") acc.under += 1;
        else if (r.budget_status === "on") acc.on += 1;
        else if (r.budget_status === "over") acc.over += 1;
        return acc;
      },
      { under: 0, on: 0, over: 0 }
    );

    const timelineCounts = windowed.reduce(
      (acc, r) => {
        if (r.timeline_status === "early") acc.early += 1;
        else if (r.timeline_status === "on") acc.on += 1;
        else if (r.timeline_status === "late") acc.late += 1;
        return acc;
      },
      { early: 0, on: 0, late: 0 }
    );

    const revenue = windowed
      .map((r) =>
        typeof r.change_orders_revenue_usd === "number" ? r.change_orders_revenue_usd : 0
      )
      .reduce((a, b) => a + b, 0);

    const recent = all.slice(0, RECENT_LIMIT);

    return {
      kpi: { total, avgSat, budgetCounts, timelineCounts, revenue },
      recent,
    };
  }, [rows]);

  return (
    <div className="space-y-6">
      <DashboardHeader
        title="Home"
        description="High-level delivery health at a glance."
        actions={
          <div className="flex items-center gap-2">
            <AnalyticsCta size="sm" />
            <Button variant="outline" onClick={() => navigate("/dashboards")}>
              View Dashboards
            </Button>
            <Button variant="ghost" size="icon" onClick={onRefresh} title="Refresh">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        }
      />

      {/* KPIs */}
      <Card>
        <CardHeader>
          <CardTitle>Key Metrics</CardTitle>
          <CardDescription>
            Last {KPI_WINDOW_DAYS} days · based on {rows?.length ?? 0} total records loaded
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : error ? (
            <div className="text-sm text-red-600">{error}</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <KpiCard label="Total lessons" value={kpi.total ?? "—"} />
              <KpiCard label="Avg. satisfaction" value={kpi.avgSat ?? "—"} />
              <KpiCard label="On budget" value={kpi.budgetCounts.on} />
              <KpiCard label="On time" value={kpi.timelineCounts.on} />
              <KpiCard
                label="Change order revenue"
                value={
                  typeof kpi.revenue === "number" ? `$${kpi.revenue.toLocaleString()}` : "—"
                }
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Lessons (limit 10) */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Lessons</CardTitle>
            <CardDescription>Latest {RECENT_LIMIT} entries</CardDescription>
          </div>
          <Button variant="gradient" onClick={() => navigate("/lessons")}>
            View all lessons <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : rows && rows.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Satisfaction</TableHead>
                    <TableHead>Budget</TableHead>
                    <TableHead>Timeline</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recent.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="whitespace-nowrap">
                        {r.project_name ?? "—"}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {r.client_name ?? "—"}
                      </TableCell>
                      <TableCell>
                        {new Date(r.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {typeof r.satisfaction === "number" ? r.satisfaction : "—"}
                      </TableCell>
                      <TableCell className="capitalize">
                        {r.budget_status ?? "—"}
                      </TableCell>
                      <TableCell className="capitalize">
                        {r.timeline_status ?? "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">No lessons yet.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function KpiCard({ label, value }: { label: string; value: number | string | null }) {
  return (
    <div className="border rounded-lg p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-2xl font-semibold mt-1">{value ?? "—"}</div>
    </div>
  );
}
