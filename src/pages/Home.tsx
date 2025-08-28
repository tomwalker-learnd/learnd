// src/pages/Home.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw, TrendingUp } from "lucide-react";

type BudgetStatus = "under" | "on" | "over" | null;
type TimelineStatus = "early" | "on" | "late" | null;

type LessonRow = {
  id: string;
  project_name: string | null;
  created_at: string;
  satisfaction: number | null;
  budget_status: BudgetStatus;
  timeline_status: TimelineStatus;
  change_request_count: number | null;
  change_orders_approved_count: number | null;
  change_orders_revenue_usd: number | null;
  created_by: string;
};

export default function Home() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [dataLoading, setDataLoading] = useState<boolean>(true);
  const [rows, setRows] = useState<LessonRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fetchedOnce = useRef(false);

  const fetchData = async () => {
    try {
      setDataLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("lessons")
        .select(
          [
            "id",
            "project_name",
            "created_at",
            "satisfaction",
            "budget_status",
            "timeline_status",
            "change_request_count",
            "change_orders_approved_count",
            "change_orders_revenue_usd",
            "created_by",
          ].join(", ")
        )
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      setRows((data as unknown as LessonRow[]) ?? []);
    } catch (e: any) {
      // eslint-disable-next-line no-console
      console.warn("[Home] fetchData error:", e?.message || e);
      setError(e?.message ?? "Failed to load data.");
      setRows([]);
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user && !fetchedOnce.current) {
      fetchedOnce.current = true;
      fetchData();
    }
  }, [authLoading, user]);

  const onRefresh = () => {
    fetchedOnce.current = true;
    fetchData();
  };

  // KPIs on full dataset
  const { totalLessons, avgSatisfaction, onBudgetRate, onTimeRate } = useMemo(() => {
    const data = rows ?? [];
    const totalLessons = data.length;

    const sats = data
      .map((r) => (typeof r.satisfaction === "number" ? r.satisfaction : null))
      .filter((x): x is number => x !== null);
    const avgSatisfaction = sats.length
      ? +(sats.reduce((a, b) => a + b, 0) / sats.length).toFixed(2)
      : null;

    const budgetCounts = data.reduce(
      (acc, r) => {
        if (r.budget_status === "on") acc.on += 1;
        acc.total += 1;
        return acc;
      },
      { on: 0, total: 0 }
    );
    const onBudgetRate = budgetCounts.total
      ? Math.round((budgetCounts.on / budgetCounts.total) * 100)
      : null;

    const timeCounts = data.reduce(
      (acc, r) => {
        if (r.timeline_status === "on") acc.on += 1;
        acc.total += 1;
        return acc;
      },
      { on: 0, total: 0 }
    );
    const onTimeRate = timeCounts.total
      ? Math.round((timeCounts.on / timeCounts.total) * 100)
      : null;

    return { totalLessons, avgSatisfaction, onBudgetRate, onTimeRate };
  }, [rows]);

  const kpiValue = (v: number | null) => (v === null ? "—" : v);

  // Only show 10 most recent
  const recentRows = useMemo(() => (rows ?? []).slice(0, 10), [rows]);

  return (
    <div className="space-y-6">
      <DashboardHeader
        title="Home"
        description="High-level KPIs and your most recent lessons."
        actions={
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={onRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>

            {/* Gradient Analytics button */}
            <Button
              size="sm"
              onClick={() => navigate("/analytics")}
              className={[
                "relative overflow-hidden",
                "text-white shadow-sm",
                "transition-opacity",
                "hover:opacity-95 active:opacity-90",
                // gradient fill across full button
                "bg-gradient-to-r from-fuchsia-500 via-pink-500 to-orange-400",
                // ensure full coverage (fixes 'mostly orange' look)
                "[background-size:200%_200%] animate-[gradientShift_6s_ease_infinite]",
                // rounded + border for consistency with theme
                "border border-transparent",
              ].join(" ")}
              aria-label="Open Analytics"
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Analytics
            </Button>
          </div>
        }
      />

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total Lessons</CardTitle>
          </CardHeader>
          <CardContent>
            {dataLoading ? (
              <Skeleton className="h-7 w-24" />
            ) : (
              <div className="text-3xl font-semibold">{kpiValue(totalLessons)}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Avg. Satisfaction</CardTitle>
          </CardHeader>
          <CardContent>
            {dataLoading ? (
              <Skeleton className="h-7 w-24" />
            ) : (
              <div className="text-3xl font-semibold">{kpiValue(avgSatisfaction ?? null)}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">On Budget</CardTitle>
          </CardHeader>
          <CardContent>
            {dataLoading ? (
              <Skeleton className="h-7 w-24" />
            ) : (
              <div className="text-3xl font-semibold">
                {onBudgetRate === null ? "—" : `${onBudgetRate}%`}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">On Time</CardTitle>
          </CardHeader>
          <CardContent>
            {dataLoading ? (
              <Skeleton className="h-7 w-24" />
            ) : (
              <div className="text-3xl font-semibold">
                {onTimeRate === null ? "—" : `${onTimeRate}%`}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Lessons (max 10) */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Lessons</CardTitle>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="text-sm text-red-600">{error}</div>
          ) : dataLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : recentRows.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs text-muted-foreground">
                  <tr>
                    <th className="text-left py-2 pr-4">Project</th>
                    <th className="text-left py-2 pr-4">Date</th>
                    <th className="text-left py-2 pr-4">Satisfaction</th>
                    <th className="text-left py-2 pr-4">Budget</th>
                    <th className="text-left py-2 pr-0">Timeline</th>
                  </tr>
                </thead>
                <tbody>
                  {recentRows.map((r) => (
                    <tr key={r.id} className="border-t">
                      <td className="py-2 pr-4">{r.project_name ?? "—"}</td>
                      <td className="py-2 pr-4">
                        {new Date(r.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-2 pr-4">
                        {typeof r.satisfaction === "number" ? r.satisfaction : "—"}
                      </td>
                      <td className="py-2 pr-4 capitalize">{r.budget_status ?? "—"}</td>
                      <td className="py-2 pr-0 capitalize">{r.timeline_status ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">No lessons yet.</div>
          )}
        </CardContent>
      </Card>

      {/* Keyframes for smooth gradient motion (scoped via arbitrary class above) */}
      <style>{`
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
    </div>
  );
}
