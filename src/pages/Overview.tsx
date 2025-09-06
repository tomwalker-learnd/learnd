import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserTier } from "@/hooks/useUserTier";
import { supabase } from "@/integrations/supabase/client";
import { PremiumFeature, FeatureBadge } from "@/components/premium";

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
import { RefreshCw, TrendingUp, BarChart3, Users, Target } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type BudgetStatus = "under" | "on" | "over";
type TimelineStatus = "early" | "on" | "late";

type LessonRow = {
  id: string;
  project_name: string | null;
  client_name: string | null;
  date: string;
  created_at?: string;
  satisfaction: number | null;
  budget_status: BudgetStatus | null;
  timeline_status: TimelineStatus | null;
};

export default function Overview() {
  const { user, loading } = useAuth();
  const { canAccessAdvancedAnalytics } = useUserTier();
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

  useEffect(() => {
    if (!loading && user) refresh();
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

      // Recent lessons
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
        title: "Couldn't refresh",
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
        <h1 className="text-3xl font-bold tracking-tight">Executive Overview</h1>
        <p className="text-muted-foreground">
          High-level intelligence dashboard for strategic decision making.
        </p>
        <div className="mt-3 flex gap-2">
          <Button variant="outline" onClick={refresh} disabled={busy}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <PremiumFeature requiredTier="team">
            <Button variant="default" onClick={() => navigate("/insights")}>
              <TrendingUp className="mr-2 h-4 w-4" />
              Advanced Insights
            </Button>
          </PremiumFeature>
        </div>
      </div>

      {/* Core KPIs */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Satisfaction</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.avgSatisfaction}</div>
          </CardContent>
        </Card>
        
        <PremiumFeature requiredTier="team" fallback={
          <Card className="opacity-60">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                On Budget
                <FeatureBadge tier="team" />
              </CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-muted-foreground">—</div>
            </CardContent>
          </Card>
        }>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">On Budget</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpis.onBudgetPct}%</div>
            </CardContent>
          </Card>
        </PremiumFeature>

        <PremiumFeature requiredTier="team" fallback={
          <Card className="opacity-60">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                On Time
                <FeatureBadge tier="team" />
              </CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-muted-foreground">—</div>
            </CardContent>
          </Card>
        }>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">On Time</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpis.onTimePct}%</div>
            </CardContent>
          </Card>
        </PremiumFeature>
      </div>

      {/* Recent Activity */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-2xl font-semibold tracking-tight">Recent Activity</h2>
          <Button variant="outline" onClick={() => navigate("/projects")}>
            View All Projects
          </Button>
        </div>

        {/* MOBILE: cards */}
        <div className="md:hidden space-y-3">
          {recent.length === 0 ? (
            <Card><CardContent className="py-6 text-muted-foreground">No recent activity.</CardContent></Card>
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
                        No recent activity.
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