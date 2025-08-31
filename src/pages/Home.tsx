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
import { RefreshCw, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type BudgetStatus = "under" | "on" | "over";
type TimelineStatus = "early" | "on" | "late";

type LessonRow = {
  id: string;
  project_name: string | null;
  client_name: string | null;
  // NOTE: we alias created_at -> date so existing UI can keep using `date`
  date: string; // ISO
  created_at?: string; // not used by UI, but may come back in other queries
  satisfaction: number | null;
  budget_status: BudgetStatus | null;
  timeline_status: TimelineStatus | null;
};

export default function Home() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [busy, setBusy] = useState(false);
  const [recent, setRecent] = useState<LessonRow[]>([]);
  const [kpis, setKpis] = useState({
    total: 0,
    avgSatisfaction: 0,
    onBudgetPct: 0,
    onTimePct: 0,
  });

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

      // KPIs
      const { data: lessons, error } = await supabase
        .from("lessons")
        .select("id, satisfaction, budget_status, timeline_status")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const total = lessons?.length ?? 0;
      const avgSatisfaction =
        total > 0
          ? (lessons!.reduce((s, r: any) => s + (Number(r.satisfaction) || 0), 0) / total)
          : 0;

      const onBudget = lessons?.filter((l: any) => l.budget_status === "on").length ?? 0;
      const onTime = lessons?.filter((l: any) => l.timeline_status === "on").length ?? 0;

      setKpis({
        total,
        avgSatisfaction: Number(avgSatisfaction.toFixed(2)),
        onBudgetPct: total ? Math.round((onBudget / total) * 100) : 0,
        onTimePct: total ? Math.round((onTime / total) * 100) : 0,
      });

      // Recent lessons (alias created_at -> date to avoid schema diff)
      const { data: recentRows, error: rErr } = await supabase
        .from("lessons")
        .select(
          "id, project_name, client_name, date:created_at, satisfaction, budget_status, timeline_status"
        )
        .order("created_at", { ascending: false })
        .limit(8);

      if (rErr) throw rErr;
      setRecent((recentRows as unknown as LessonRow[]) || []);
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

  if (!user && !loading) return null;

  const fmtDate = (iso?: string) => {
    if (!iso) return "";
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString();
  };

  const badgeTone = (val: BudgetStatus | TimelineStatus | null) => {
    switch (val) {
      case "under":
      case "early":
        return "bg-emerald-600/10 text-emerald-600 border-emerald-600/20";
      case "on":
        return "bg-blue-600/10 text-blue-600 border-blue-600/20";
      case "over":
      case "late":
        return "bg-rose-600/10 text-rose-600 border-rose-600/20";
      default:
        return "bg-muted text-muted-foreground border-transparent";
    }
  };

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
          <Button variant="analytics" onClick={() => navigate("/analytics")}>
            <TrendingUp className="mr-2 h-4 w-4" />
            Analytics
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card>
          <CardHeader>
            <CardDescription>Total</CardDescription>
            <CardTitle className="text-3xl">{kpis.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Avg Satisfaction</CardDescription>
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
          {recent.length === 0 ? (
            <Card><CardContent className="py-6 text-muted-foreground">No recent lessons.</CardContent></Card>
          ) : (
            recent.map((r) => (
              <Card key={r.id}>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{r.project_name || "Untitled Project"}</div>
                    <div className="text-xs text-muted-foreground">{fmtDate(r.date)}</div>
                  </div>
                  {r.client_name && (
                    <div className="text-sm text-muted-foreground mt-1">{r.client_name}</div>
                  )}
                  <div className="mt-2 flex items-center gap-2">
                    <Badge variant="outline" className={badgeTone(r.budget_status)}>{r.budget_status ?? "—"}</Badge>
                    <Badge variant="outline" className={badgeTone(r.timeline_status)}>{r.timeline_status ?? "—"}</Badge>
                    <span className="text-xs text-muted-foreground">Sat: {r.satisfaction ?? "—"}</span>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* DESKTOP: table */}
        <div className="hidden md:block">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Budget</TableHead>
                    <TableHead>Timeline</TableHead>
                    <TableHead>Satisfaction</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recent.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                        No recent lessons.
                      </TableCell>
                    </TableRow>
                  ) : (
                    recent.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium">{r.project_name || "Untitled Project"}</TableCell>
                        <TableCell>{r.client_name || "—"}</TableCell>
                        <TableCell>{fmtDate(r.date)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={badgeTone(r.budget_status)}>{r.budget_status ?? "—"}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={badgeTone(r.timeline_status)}>{r.timeline_status ?? "—"}</Badge>
                        </TableCell>
                        <TableCell>{r.satisfaction ?? "—"}</TableCell>
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
