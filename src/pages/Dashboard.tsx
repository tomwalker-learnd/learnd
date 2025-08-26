import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";

type LessonRow = {
  id: string;
  project_name: string | null;
  created_at: string;
  satisfaction: number | null;
  budget_status: "under" | "on" | "over" | null;
  timeline_status: "early" | "on" | "late" | null;
  created_by: string;
  // optional; not selected until your schema has them
  change_request_count?: number | null;
  change_orders_approved_count?: number | null;
  change_orders_revenue_usd?: number | null;
};

const Dashboard = () => {
  const { user, loading } = useAuth();
  const [rows, setRows] = useState<LessonRow[] | null>(null);
  const [recent, setRecent] = useState<LessonRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user?.id) {
      setRows([]);
      setRecent([]);
      return;
    }

    const run = async () => {
      setFetching(true);
      setError(null);

      // Recent 5
      const { data: recentData, error: rErr } = await supabase
        .from("lessons")
        .select(
          "id,project_name,created_at,satisfaction,budget_status,timeline_status,created_by"
        )
        .eq("created_by", user.id)
        .order("created_at", { ascending: false })
        .limit(5);

      if (rErr) {
        setError(rErr.message);
        setRecent([]);
      } else {
        setRecent((recentData as unknown as LessonRow[]) ?? []);
      }

      // Bulk set for aggregates
      const { data, error: aErr } = await supabase
        .from("lessons")
        .select(
          "id,project_name,created_at,satisfaction,budget_status,timeline_status,created_by"
        )
        .eq("created_by", user.id)
        .order("created_at", { ascending: false })
        .limit(2000);

      if (aErr) {
        setError(aErr.message);
        setRows([]);
      } else {
        setRows((data as unknown as LessonRow[]) ?? []);
      }

      setFetching(false);
    };

    run();
  }, [loading, user?.id]);

  // ---- Aggregates ----
  const delivery = useMemo(() => {
    if (!rows || rows.length === 0) return null;

    const count = rows.length;
    const rated = rows.filter((r) => r.satisfaction != null).length;
    const avgSatisfaction =
      rows.reduce((s, r) => s + (r.satisfaction ?? 0), 0) / Math.max(1, rated);

    const bud = { under: 0, on: 0, over: 0 } as Record<string, number>;
    const time = { early: 0, on: 0, late: 0 } as Record<string, number>;
    rows.forEach((r) => {
      if (r.budget_status && bud[r.budget_status] != null) bud[r.budget_status]++;
      if (r.timeline_status && time[r.timeline_status] != null) time[r.timeline_status]++;
    });

    const pct = (n: number) => (count ? Math.round((n / count) * 100) : 0);

    return {
      count,
      avgSatisfaction: Number.isFinite(avgSatisfaction) ? avgSatisfaction : 0,
      budgetPct: {
        under: pct(bud.under),
        on: pct(bud.on),
        over: pct(bud.over),
      },
      timelinePct: {
        early: pct(time.early),
        on: pct(time.on),
        late: pct(time.late),
      },
    };
  }, [rows]);

  const change = useMemo(() => {
    if (!rows || rows.length === 0) return null;
    // these will sum to 0 until you add those columns (or compute via a view/RPC)
    const totalCR = rows.reduce((s, r) => s + (r.change_request_count ?? 0), 0);
    const totalApproved = rows.reduce((s, r) => s + (r.change_orders_approved_count ?? 0), 0);
    const totalRev = rows.reduce((s, r) => s + (r.change_orders_revenue_usd ?? 0), 0);
    return { totalCR, totalApproved, totalRev };
  }, [rows]);

  const LoadingBlock = (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {[...Array(3)].map((_, i) => (
        <Card key={i} className="w-full overflow-hidden">
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent className="space-y-3 px-4 sm:px-6">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <main className="mx-auto w-full max-w-screen-sm md:max-w-4xl px-4 py-6 overflow-x-hidden">
        {/* HEADER (responsive) */}
        <div className="mb-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-2xl font-semibold">Dashboard</h1>
              {user?.email && (
                <p className="text-muted-foreground text-sm">
                  Welcome, <span className="font-medium break-words">{user.email}</span>. Quick
                  snapshot of your lessons and analytics.
                </p>
              )}
            </div>

            {/* Actions (≥ sm) */}
            <div className="hidden sm:flex gap-2 shrink-0">
              <Button asChild>
                <Link to="/submit">Capture New Lesson</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/analytics">View Analytics</Link>
              </Button>
            </div>
          </div>

          {/* Actions (mobile) */}
          <div className="mt-3 flex sm:hidden flex-col gap-2">
            <Button asChild size="lg" className="w-full">
              <Link to="/submit">Capture New Lesson</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="w-full">
              <Link to="/analytics">View Analytics</Link>
            </Button>
          </div>
        </div>

        {error && (
          <Card className="mb-4 w-full overflow-hidden">
            <CardContent className="text-sm text-red-600 py-4 px-4 sm:px-6">{error}</CardContent>
          </Card>
        )}

        {fetching && LoadingBlock}

        {!fetching && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Recent Lessons */}
            <Card className="w-full overflow-hidden">
              <CardHeader>
                <CardTitle>Recent Lessons</CardTitle>
              </CardHeader>
              <CardContent className="text-sm px-4 sm:px-6">
                {recent && recent.length > 0 ? (
                  <ul className="space-y-3">
                    {recent.map((r) => (
                      <li key={r.id} className="border rounded p-2">
                        <div className="font-medium">
                          {r.project_name || "Untitled project"}
                        </div>
                        <div className="text-muted-foreground">
                          {new Date(r.created_at).toLocaleDateString()} ·{" "}
                          {r.satisfaction != null ? `Satisfaction ${r.satisfaction}/5` : "No rating"}
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground">
                    Your latest submitted lessons will appear here.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Delivery Health */}
            <Card className="w-full overflow-hidden">
              <CardHeader>
                <CardTitle>Delivery Health</CardTitle>
              </CardHeader>
              <CardContent className="text-sm px-4 sm:px-6">
                {delivery ? (
                  <div className="space-y-3">
                    <div>
                      Records analyzed: <strong>{delivery.count}</strong>
                    </div>
                    <div>
                      Avg Satisfaction: <strong>{delivery.avgSatisfaction.toFixed(2)}</strong>
                    </div>

                    <div className="mt-2">
                      <div className="font-medium">Budget</div>
                      <div className="text-muted-foreground">
                        Under {delivery.budgetPct.under}% · On {delivery.budgetPct.on}% · Over{" "}
                        {delivery.budgetPct.over}%
                      </div>
                    </div>
                    <div className="mt-2">
                      <div className="font-medium">Timeline</div>
                      <div className="text-muted-foreground">
                        Early {delivery.timelinePct.early}% · On {delivery.timelinePct.on}% · Late{" "}
                        {delivery.timelinePct.late}%
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">
                    Aggregate satisfaction, timeline, and budget signals.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Change Control */}
            <Card className="w-full overflow-hidden">
              <CardHeader>
                <CardTitle>Change Control</CardTitle>
              </CardHeader>
              <CardContent className="text-sm px-4 sm:px-6">
                {change ? (
                  <div className="space-y-3">
                    <div>
                      Total Requests: <strong>{change.totalCR}</strong>
                    </div>
                    <div>
                      Approved: <strong>{change.totalApproved}</strong>
                    </div>
                    <div>
                      Revenue from Change Orders:{" "}
                      <strong>
                        {change.totalRev.toLocaleString(undefined, {
                          style: "currency",
                          currency: "USD",
                          maximumFractionDigits: 0,
                        })}
                      </strong>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">
                    Requests, approvals, and revenue from change orders.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
