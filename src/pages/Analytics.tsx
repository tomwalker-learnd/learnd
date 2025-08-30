// src/pages/Analytics.tsx
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";

type LessonRow = {
  id: string;
  project_name: string | null;
  created_at: string;
  satisfaction: number | null;
  budget_status: "under" | "on" | "over" | null;
  timeline_status: "early" | "on" | "late" | null;
};

export default function Analytics() {
  const { user, loading: authLoading } = useAuth();
  const [rows, setRows] = useState<LessonRow[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // Load once auth is ready
  useEffect(() => {
    if (authLoading) return;
    if (!user) return;

    let cancelled = false;

    async function run() {
      setLoading(true);
      setErr(null);
      try {
        const { data, error } = await supabase
          .from("lessons")
          .select("id, project_name, created_at, satisfaction, budget_status, timeline_status")
          .order("created_at", { ascending: false })
          .limit(500);

        if (error) throw error;
        if (!cancelled) {
          setRows((data as unknown as LessonRow[]) ?? []);
        }
      } catch (e: any) {
        if (!cancelled) setErr(e?.message ?? "Failed to load analytics data.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [authLoading, user]);

  const byMonth = useMemo(() => {
    if (!rows || rows.length === 0) return [];
    const map = new Map<
      string,
      { month: string; sum: number; cnt: number; under: number; on: number; over: number }
    >();
    for (const r of rows) {
      const d = new Date(r.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (!map.has(key)) map.set(key, { month: key, sum: 0, cnt: 0, under: 0, on: 0, over: 0 });
      const bucket = map.get(key)!;
      if (typeof r.satisfaction === "number") {
        bucket.sum += r.satisfaction;
        bucket.cnt += 1;
      }
      if (r.budget_status && (r.budget_status === "under" || r.budget_status === "on" || r.budget_status === "over")) {
        bucket[r.budget_status] += 1;
      }
    }
    return [...map.values()]
      .sort((a, b) => a.month.localeCompare(b.month))
      .map((x) => ({
        month: x.month,
        avgSatisfaction: x.cnt ? +(x.sum / x.cnt).toFixed(2) : 0,
        under: x.under,
        on: x.on,
        over: x.over,
      }));
  }, [rows]);

  const recentSample = useMemo(() => (rows ? rows.slice(0, 20) : []), [rows]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Overview</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-8 w-32" />
          ) : err ? (
            <div className="text-sm text-red-600">{err}</div>
          ) : (
            <div className="text-sm text-muted-foreground">
              {rows && rows.length > 0
                ? `${rows.length} lessons total`
                : "No lessons yet."}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Average Satisfaction by Month */}
        <Card>
          <CardHeader>
            <CardTitle>Average Satisfaction by Month</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-64 w-full" />
            ) : byMonth.length === 0 ? (
              <div className="text-sm text-muted-foreground">No data.</div>
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={byMonth}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis domain={[0, 10]} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="avgSatisfaction" name="Avg Satisfaction" /* distinct color */ fill="hsl(262, 83%, 58%)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Budget Status by Month (stacked) */}
        <Card>
          <CardHeader>
            <CardTitle>Budget Status by Month</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-64 w-full" />
            ) : byMonth.length === 0 ? (
              <div className="text-sm text-muted-foreground">No data.</div>
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={byMonth}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="under" stackId="a" name="Under" fill="hsl(142, 71%, 45%)" />
                    <Bar dataKey="on" stackId="a" name="On" fill="hsl(217, 91%, 60%)" />
                    <Bar dataKey="over" stackId="a" name="Over" fill="hsl(0, 84%, 60%)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent rows table (small excerpt) */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Lessons</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-32 w-full" />
          ) : recentSample.length === 0 ? (
            <div className="text-sm text-muted-foreground">No recent lessons.</div>
           ) : (
            <>
              {/* Desktop table view */}
              <div className="hidden md:block overflow-x-auto">
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
                    {recentSample.map((r) => (
                      <tr key={r.id} className="border-t">
                        <td className="py-2 pr-4">{r.project_name ?? "—"}</td>
                        <td className="py-2 pr-4">
                          {new Date(r.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-2 pr-4">{typeof r.satisfaction === "number" ? r.satisfaction : "—"}</td>
                        <td className="py-2 pr-4 capitalize">{r.budget_status ?? "—"}</td>
                        <td className="py-2 pr-0 capitalize">{r.timeline_status ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile card view */}
              <div className="block md:hidden space-y-3">
                {recentSample.map((r) => (
                  <div key={r.id} className="border rounded-lg p-4 bg-card">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-sm">{r.project_name ?? "—"}</h4>
                      <span className="text-xs text-muted-foreground">
                        {new Date(r.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-xs">
                      <div>
                        <span className="text-muted-foreground block">Satisfaction</span>
                        <span className="font-medium">{typeof r.satisfaction === "number" ? r.satisfaction : "—"}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block">Budget</span>
                        <span className="font-medium capitalize">{r.budget_status ?? "—"}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block">Timeline</span>
                        <span className="font-medium capitalize">{r.timeline_status ?? "—"}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
            
          )}
        </CardContent>
      </Card>
    </div>
  );
}
