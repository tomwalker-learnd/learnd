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
  created_by: string;
};

const COLORS = {
  bar: "#6366f1",   // Satisfaction bars (indigo-500)
  under: "#16a34a", // Green-600
  on: "#3b82f6",    // Blue-500
  over: "#ef4444",  // Red-500
};

export default function Analytics() {
  const { user, loading } = useAuth();
  const [rows, setRows] = useState<LessonRow[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user?.id) {
      setRows([]);
      return;
    }
    (async () => {
      setFetching(true);
      setErr(null);
      const { data, error } = await supabase
        .from("lessons")
        .select(
          "id,project_name,created_at,satisfaction,budget_status,timeline_status,created_by"
        )
        .eq("created_by", user.id)
        .order("created_at", { ascending: true }) // ascending for trends
        .limit(5000);
      if (error) {
        setErr(error.message);
        setRows([]);
      } else {
        setRows((data ?? []) as LessonRow[]);
      }
      setFetching(false);
    })();
  }, [loading, user?.id]);

  // KPIs
  const kpis = useMemo(() => {
    if (!rows || rows.length === 0) return null;
    const total = rows.length;
    const rated = rows.filter((r) => r.satisfaction != null);
    const avgSat =
      rated.reduce((s, r) => s + (r.satisfaction ?? 0), 0) / Math.max(1, rated.length);

    const bud = { under: 0, on: 0, over: 0 } as Record<string, number>;
    const tim = { early: 0, on: 0, late: 0 } as Record<string, number>;
    for (const r of rows) {
      if (r.budget_status && bud[r.budget_status] != null) bud[r.budget_status]++;
      if (r.timeline_status && tim[r.timeline_status] != null) tim[r.timeline_status]++;
    }
    const pct = (n: number) => (total ? Math.round((n / total) * 100) : 0);

    return {
      total,
      avgSatisfaction: Number.isFinite(avgSat) ? avgSat : 0,
      budgetPct: { under: pct(bud.under), on: pct(bud.on), over: pct(bud.over) },
      timelinePct: { early: pct(tim.early), on: pct(tim.on), late: pct(tim.late) },
    };
  }, [rows]);

  // Satisfaction by month (avg)
  const satTrend = useMemo(() => {
    if (!rows || rows.length === 0) return [];
    const byMonth: Record<string, { month: string; sum: number; cnt: number }> = {};
    for (const r of rows) {
      const d = new Date(r.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (!byMonth[key]) byMonth[key] = { month: key, sum: 0, cnt: 0 };
      if (r.satisfaction != null) {
        byMonth[key].sum += r.satisfaction;
        byMonth[key].cnt++;
      }
    }
    return Object.values(byMonth)
      .sort((a, b) => a.month.localeCompare(b.month))
      .map((x) => ({
        month: x.month,
        avgSatisfaction: x.cnt ? +(x.sum / x.cnt).toFixed(2) : 0,
      }));
  }, [rows]);

  // Budget status by month (stacked)
  const budgetByMonth = useMemo(() => {
    if (!rows || rows.length === 0) return [];
    const acc: Record<string, any> = {};
    for (const r of rows) {
      const d = new Date(r.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (!acc[key]) acc[key] = { month: key, under: 0, on: 0, over: 0 };
      if (r.budget_status && acc[key][r.budget_status] != null) {
        acc[key][r.budget_status]++;
      }
    }
    return Object.values(acc).sort((a: any, b: any) => a.month.localeCompare(b.month));
  }, [rows]);

  // Outliers
  const outliers = useMemo(() => {
    if (!rows || rows.length === 0) return [];
    return rows
      .filter(
        (r) =>
          (r.satisfaction != null && r.satisfaction <= 2) ||
          r.budget_status === "over" ||
          r.timeline_status === "late"
      )
      .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at))
      .slice(0, 10);
  }, [rows]);

  const LoadingBlock = (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {[...Array(3)].map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Analytics</h1>
        <div className="text-sm text-muted-foreground">
          {rows ? `${rows.length} records` : "—"}
        </div>
      </div>

      {err && (
        <Card>
          <CardContent className="py-4 text-sm text-red-600">{err}</CardContent>
        </Card>
      )}

      {fetching && LoadingBlock}

      {!fetching && (
        <>
          {/* OVERVIEW */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Total Projects</CardTitle>
              </CardHeader>
              <CardContent className="text-3xl font-semibold">
                {kpis ? kpis.total : "—"}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Avg Satisfaction</CardTitle>
              </CardHeader>
              <CardContent className="text-3xl font-semibold">
                {kpis ? kpis.avgSatisfaction.toFixed(2) : "—"}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>On Budget</CardTitle>
              </CardHeader>
              <CardContent className="text-3xl font-semibold">
                {kpis ? `${kpis.budgetPct.on}%` : "—"}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>On Time</CardTitle>
              </CardHeader>
              <CardContent className="text-3xl font-semibold">
                {kpis ? `${kpis.timelinePct.on}%` : "—"}
              </CardContent>
            </Card>
          </div>

          {/* TRENDS */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {/* Satisfaction (Monthly) — BAR */}
            <Card>
              <CardHeader>
                <CardTitle>Satisfaction (Monthly)</CardTitle>
              </CardHeader>
              <CardContent style={{ height: 320 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={satTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis domain={[0, 5]} allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Bar
                      name="Avg Satisfaction"
                      dataKey="avgSatisfaction"
                      fill={COLORS.bar}
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Budget Status by Month — COLORED STACK */}
            <Card>
              <CardHeader>
                <CardTitle>Budget Status by Month</CardTitle>
              </CardHeader>
              <CardContent style={{ height: 320 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={budgetByMonth}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Bar name="Under" dataKey="under" stackId="b" fill={COLORS.under} radius={[4,4,0,0]} />
                    <Bar name="On"    dataKey="on"    stackId="b" fill={COLORS.on}    radius={[4,4,0,0]} />
                    <Bar name="Over"  dataKey="over"  stackId="b" fill={COLORS.over}  radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* OUTLIERS */}
          <Card>
            <CardHeader>
              <CardTitle>Outliers (Last 10)</CardTitle>
            </CardHeader>
            <CardContent>
              {outliers.length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  No red flags found (≤2 satisfaction, over budget, or late).
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-left text-muted-foreground">
                      <tr>
                        <th className="py-2 pr-4">Date</th>
                        <th className="py-2 pr-4">Project</th>
                        <th className="py-2 pr-4">Satisfaction</th>
                        <th className="py-2 pr-4">Budget</th>
                        <th className="py-2 pr-0">Timeline</th>
                      </tr>
                    </thead>
                    <tbody>
                      {outliers.map((r) => (
                        <tr key={r.id} className="border-t">
                          <td className="py-2 pr-4">
                            {new Date(r.created_at).toLocaleDateString()}
                          </td>
                          <td className="py-2 pr-4">{r.project_name || "Untitled"}</td>
                          <td className="py-2 pr-4">{r.satisfaction ?? "—"}</td>
                          <td className="py-2 pr-4 capitalize">{r.budget_status || "—"}</td>
                          <td className="py-2 pr-0 capitalize">{r.timeline_status || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
