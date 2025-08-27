// src/pages/Dashboard.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, TrendingUp } from "lucide-react";

type BudgetStatus = "under" | "on" | "over" | null;
type TimelineStatus = "early" | "on" | "late" | null;

type LessonRow = {
  id: string;
  project_name: string | null;
  created_at: string;
  satisfaction: number | null; // 1-5 or 1-10 in your schema; we'll average non-null
  budget_status: BudgetStatus;
  timeline_status: TimelineStatus;
  change_request_count: number | null;
  change_orders_approved_count: number | null;
  change_orders_revenue_usd: number | null;
  created_by: string;
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [rows, setRows] = useState<LessonRow[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Pull the latest lessons; adjust 'limit' to taste
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
      setError(e?.message ?? "Failed to load dashboard data.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  // ---- KPIs (computed safely over non-null rows) ----
  const {
    totalLessons,
    avgSatisfaction,
    onBudgetRate,
    onTimeRate,
  } = useMemo(() => {
    const data = rows ?? [];

    const totalLessons = data.length;

    const satisfactions = data
      .map((r) => (typeof r.satisfaction === "number" ? r.satisfaction : null))
      .filter((v): v is number => v !== null);
    const avgSatisfaction =
      satisfactions.length > 0
        ? Number(
            (satisfactions.reduce((a, b) => a + b, 0) / satisfactions.length).toFixed(2)
          )
        : null;

    const budgetDenom = data.filter((r) => r.budget_status !== null).length;
    const onBudgetCount = data.filter((r) => r.budget_status === "on").length;
    const onBudgetRate =
      budgetDenom > 0 ? Number(((onBudgetCount / budgetDenom) * 100).toFixed(1)) : null;

    const timeDenom = data.filter((r) => r.timeline_status !== null).length;
    const onTimeCount = data.filter((r) => r.timeline_status === "on").length;
    const onTimeRate =
      timeDenom > 0 ? Number(((onTimeCount / timeDenom) * 100).toFixed(1)) : null;

    return { totalLessons, avgSatisfaction, onBudgetRate, onTimeRate };
  }, [rows]);

  const kpiValue = (v: number | null | undefined, suffix = "") =>
    v === null || v === undefined ? "—" : `${v}${suffix}`;

  return (
    <div className="space-y-6">
      <DashboardHeader
        title="Home"
        description="Overview of your current project stats."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate("/dashboards")}>
              View Dashboards
            </Button>
            <Button variant="ghost" size="icon" onClick={fetchData} title="Refresh">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total Lessons</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-7 w-16" />
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
            {loading ? (
              <Skeleton className="h-7 w-24" />
            ) : (
              <div className="text-3xl font-semibold">
                {kpiValue(avgSatisfaction ?? null)}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">On-Budget Rate</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-7 w-20" />
            ) : (
              <div className="text-3xl font-semibold">
                {kpiValue(onBudgetRate ?? null, "%")}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">On-Time Rate</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-7 w-20" />
            ) : (
              <div className="text-3xl font-semibold">
                {kpiValue(onTimeRate ?? null, "%")}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Lessons */}
      <Card className="shadow-sm">
        <CardHeader className="flex items-center justify-between gap-2 sm:flex-row">
          <div>
            <CardTitle className="text-xl">Recent Lessons</CardTitle>
            <p className="text-sm text-muted-foreground">
              Latest records (up to 100). Add filters or links as needed.
            </p>
          </div>
          <TrendingUp className="h-5 w-5 opacity-70" />
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
            </div>
          ) : error ? (
            <div className="text-sm text-destructive">{error}</div>
          ) : rows && rows.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-muted-foreground">
                  <tr className="border-b">
                    <th className="py-2 pr-3 text-left">Project</th>
                    <th className="py-2 px-3 text-left">Created</th>
                    <th className="py-2 px-3 text-left">Satisfaction</th>
                    <th className="py-2 px-3 text-left">Budget</th>
                    <th className="py-2 pl-3 text-left">Timeline</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 12).map((r) => (
                    <tr key={r.id} className="border-b last:border-0">
                      <td className="py-2 pr-3">{r.project_name ?? "—"}</td>
                      <td className="py-2 px-3">
                        {new Date(r.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-2 px-3">{r.satisfaction ?? "—"}</td>
                      <td className="py-2 px-3">
                        {r.budget_status ? (
                          <Badge
                            variant={
                              r.budget_status === "on"
                                ? "secondary"
                                : r.budget_status === "under"
                                ? "default"
                                : "destructive"
                            }
                          >
                            {r.budget_status}
                          </Badge>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="py-2 pl-3">
                        {r.timeline_status ? (
                          <Badge
                            variant={
                              r.timeline_status === "on"
                                ? "secondary"
                                : r.timeline_status === "early"
                                ? "default"
                                : "destructive"
                            }
                          >
                            {r.timeline_status}
                          </Badge>
                        ) : (
                          "—"
                        )}
                      </td>
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
    </div>
  );
}
