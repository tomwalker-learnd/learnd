// src/pages/Home.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw, TrendingUp } from "lucide-react";

type Lesson = {
  id: string;
  project_name?: string | null;
  created_at?: string | null;
  date?: string | null;            // some rows may have a dedicated date field
  satisfaction?: number | null;
  budget_status?: "under" | "on" | "over" | null;
  timeline_status?: "early" | "on" | "late" | null;
};

const fmtDate = (iso?: string | null) => {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return d.toLocaleDateString();
  } catch {
    return iso;
  }
};

const statusBadge = (v?: string | null) => {
  if (!v) return null;
  const map: Record<string, string> = {
    under: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
    on: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300",
    over: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
    early: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
    late: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
  };
  return map[v] ?? "bg-muted text-foreground";
};

export default function Home() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [kpis, setKpis] = useState({
    total: 0,
    avgSatisfaction: 0,
    onBudgetPct: 0,
    onTimePct: 0,
  });
  const [recent, setRecent] = useState<Lesson[]>([]);
  const [busy, setBusy] = useState(false);

  const initial = useMemo(() => {
    const src = user?.user_metadata?.full_name || user?.email || "U";
    return (src as string).trim()[0]?.toUpperCase() ?? "U";
  }, [user]);

  useEffect(() => {
    if (!loading && user) refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, user]);

  const refresh = async () => {
    try {
      setBusy(true);

      // KPIs (adjust table/columns to match your schema)
      const { data: lessons, error } = await supabase
        .from("lessons")
        .select("id, satisfaction, budget_status, timeline_status")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const total = lessons?.length ?? 0;
      const avgSatisfaction =
        total > 0
          ? (lessons!.reduce((s, r) => s + (Number(r.satisfaction) || 0), 0) / total)
          : 0;

      const onBudget = lessons?.filter((l) => l.budget_status === "on").length ?? 0;
      const onTime = lessons?.filter((l) => l.timeline_status === "on").length ?? 0;

      setKpis({
        total,
        avgSatisfaction: Number(avgSatisfaction.toFixed(2)),
        onBudgetPct: total ? Math.round((onBudget / total) * 100) : 0,
        onTimePct: total ? Math.round((onTime / total) * 100) : 0,
      });

      // Recent lessons (limit 8 so mobile cards scroll nicely)
      const { data: recentRows, error: rErr } = await supabase
        .from("lessons")
        .select(
          "id, project_name, created_at, date, satisfaction, budget_status, timeline_status"
        )
        .order("created_at", { ascending: false })
        .limit(8);

      if (rErr) throw rErr;
      setRecent(recentRows || []);
    } catch (e: any) {
      toast({
        title: "Couldn’t refresh",
        description: e?.message ?? "Unexpected error",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-sm text-muted-foreground">Checking session…</div>;
  }

  if (!user) {
    navigate("/auth");
    return null;
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Home</h1>
        <p className="text-muted-foreground">
          High-level KPIs and your most recent lessons.
        </p>
        <div className="mt-3 flex gap-2">
          <Button variant="outline" onClick={refresh} disabled={busy}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={() => navigate("/analytics")}>
            <TrendingUp className="mr-2 h-4 w-4" />
            Analytics
          </Button>
        </div>
      </div>

      {/* KPI tiles */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
        <Card>
          <CardHeader>
            <CardDescription>Total Lessons</CardDescription>
            <CardTitle className="text-3xl">{kpis.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Avg. Satisfaction</CardDescription>
            <CardTitle className="text-3xl">{kpis.avgSatisfaction}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>On Budget</CardDescription>
            <CardTitle className="text-3xl">{kpis.onBudgetPct}%</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>On Time</CardDescription>
            <CardTitle className="text-3xl">{kpis.onTimePct}%</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Recent Lessons */}
      <div className="mt-8">
        <h2 className="mb-3 text-2xl font-semibold tracking-tight">Recent Lessons</h2>

        {/* MOBILE: cards */}
        <div className="md:hidden space-y-3">
          {recent.length === 0 && (
            <Card>
              <CardContent className="py-6 text-sm text-muted-foreground">
                No lessons yet.
              </CardContent>
            </Card>
          )}
          {recent.map((l) => (
            <Card key={l.id} className="overflow-hidden">
              <CardContent className="py-4">
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <div className="truncate text-base font-semibold">
                      {l.project_name || "Untitled Project"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {fmtDate(l.date || l.created_at)}
                    </div>
                  </div>
                  {typeof l.satisfaction === "number" && (
                    <div className="ml-3 shrink-0 text-right">
                      <div className="text-xs text-muted-foreground">Satisfaction</div>
                      <div className="text-lg font-semibold">{l.satisfaction}</div>
                    </div>
                  )}
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {l.budget_status && (
                    <Badge className={statusBadge(l.budget_status)}>
                      Budget: {l.budget_status}
                    </Badge>
                  )}
                  {l.timeline_status && (
                    <Badge className={statusBadge(l.timeline_status)}>
                      Timeline: {l.timeline_status}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* DESKTOP: table */}
        <div className="hidden md:block">
          <Card>
            <CardContent className="p-0">
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
                  {recent.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-sm text-muted-foreground">
                        No lessons yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    recent.map((l) => (
                      <TableRow key={l.id}>
                        <TableCell className="font-medium">
                          {l.project_name || "Untitled Project"}
                        </TableCell>
                        <TableCell>{fmtDate(l.date || l.created_at)}</TableCell>
                        <TableCell>{l.satisfaction ?? ""}</TableCell>
                        <TableCell>
                          {l.budget_status ? (
                            <Badge className={statusBadge(l.budget_status)}>
                              {l.budget_status}
                            </Badge>
                          ) : (
                            ""
                          )}
                        </TableCell>
                        <TableCell>
                          {l.timeline_status ? (
                            <Badge className={statusBadge(l.timeline_status)}>
                              {l.timeline_status}
                            </Badge>
                          ) : (
                            ""
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
