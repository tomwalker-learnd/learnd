import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserTier } from "@/hooks/useUserTier";
import { supabase } from "@/integrations/supabase/client";
import PremiumFeature from "@/components/premium/PremiumFeature";
import { FeatureBadge } from "@/components/premium";

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
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  RefreshCw, 
  TrendingUp, 
  TrendingDown,
  BarChart3, 
  Users, 
  Target,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  FileText,
  Brain,
  Plus
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type BudgetStatus = "under" | "on" | "over";
type TimelineStatus = "early" | "on-time" | "late";

type LessonRow = {
  id: string;
  project_name: string | null;
  client_name: string | null;
  date: string;
  created_at?: string;
  satisfaction: number | null;
  budget_status: BudgetStatus | null;
  timeline_status: TimelineStatus | null;
  notes?: string | null;
};

interface KeyInsight {
  id: string;
  title: string;
  description: string;
  trend: 'up' | 'down' | 'neutral';
  severity: 'success' | 'warning' | 'critical';
  action: string;
  link: string;
  metric?: string;
}

export default function Overview() {
  const { user, loading } = useAuth();
  const { tier, canAccessAdvancedAnalytics } = useUserTier();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [busy, setBusy] = useState(false);
  const [recent, setRecent] = useState<LessonRow[]>([]);
  const [kpis, setKpis] = useState({
    total: 0,
    avgSatisfaction: 0,
    onBudgetPct: 0,
    onTimePct: 0,
    atRiskCount: 0,
    satisfactionTrend: 0, // Change from last period
    budgetTrend: 0,
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
        .select("id, satisfaction, budget_status, timeline_status, created_at")
        .eq("created_by", user!.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const total = lessons?.length ?? 0;
      const avgSatisfaction =
        total > 0
          ? (lessons!.reduce((s, r: any) => s + (Number(r.satisfaction) || 0), 0) / total)
          : 0;

      const onBudget = lessons?.filter((l: any) => l.budget_status === "on").length ?? 0;
      const onTime = lessons?.filter((l: any) => 
        l.timeline_status === "on-time" || l.timeline_status === "early"
      ).length ?? 0;

      // Calculate at-risk projects (low satisfaction OR over budget OR late)
      const atRisk = lessons?.filter((l: any) => 
        (l.satisfaction && l.satisfaction < 3) || 
        l.budget_status === "over" || 
        l.timeline_status === "late"
      ).length ?? 0;

      // Calculate trends (last 30 days vs previous 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const sixtyDaysAgo = new Date();
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

      const recentLessons = lessons?.filter((l: any) => 
        new Date(l.created_at) > thirtyDaysAgo
      ) || [];
      const previousLessons = lessons?.filter((l: any) => 
        new Date(l.created_at) > sixtyDaysAgo && new Date(l.created_at) <= thirtyDaysAgo
      ) || [];

      const recentAvgSat = recentLessons.length > 0 
        ? recentLessons.reduce((s, r: any) => s + (Number(r.satisfaction) || 0), 0) / recentLessons.length
        : 0;
      const prevAvgSat = previousLessons.length > 0
        ? previousLessons.reduce((s, r: any) => s + (Number(r.satisfaction) || 0), 0) / previousLessons.length
        : 0;

      const satisfactionTrend = prevAvgSat > 0 ? ((recentAvgSat - prevAvgSat) / prevAvgSat) * 100 : 0;

      setKpis({
        total,
        avgSatisfaction: Number(avgSatisfaction.toFixed(2)),
        onBudgetPct: total ? Math.round((onBudget / total) * 100) : 0,
        onTimePct: total ? Math.round((onTime / total) * 100) : 0,
        atRiskCount: atRisk,
        satisfactionTrend: Number(satisfactionTrend.toFixed(1)),
        budgetTrend: 0, // Could calculate similar to satisfaction
      });

      // Recent lessons
      const { data: recentRows, error: rErr } = await supabase
        .from("lessons")
        .select("id, project_name, client_name, created_at, satisfaction, budget_status, timeline_status, notes")
        .eq("created_by", user!.id)
        .order("created_at", { ascending: false })
        .limit(5);

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

  // Generate key insights based on data
  const keyInsights = useMemo((): KeyInsight[] => {
    if (!kpis.total) return [];

    const insights: KeyInsight[] = [];

    // Portfolio health insight
    if (kpis.atRiskCount > 0) {
      insights.push({
        id: 'portfolio-health',
        title: 'Portfolio Health Alert',
        description: `${kpis.atRiskCount} of ${kpis.total} projects need attention`,
        trend: 'down',
        severity: kpis.atRiskCount > kpis.total * 0.3 ? 'critical' : 'warning',
        action: 'Review At-Risk Projects',
        link: '/projects?filter=at-risk',
        metric: `${Math.round((kpis.atRiskCount / kpis.total) * 100)}% at risk`
      });
    } else {
      insights.push({
        id: 'portfolio-health',
        title: 'Portfolio Performing Well',
        description: 'All projects are on track with healthy metrics',
        trend: 'up',
        severity: 'success',
        action: 'View Portfolio',
        link: '/projects',
        metric: '0% at risk'
      });
    }

    // Satisfaction trend insight
    if (Math.abs(kpis.satisfactionTrend) > 5) {
      insights.push({
        id: 'satisfaction-trend',
        title: `Client Satisfaction ${kpis.satisfactionTrend > 0 ? 'Improving' : 'Declining'}`,
        description: `${Math.abs(kpis.satisfactionTrend)}% ${kpis.satisfactionTrend > 0 ? 'increase' : 'decrease'} this month`,
        trend: kpis.satisfactionTrend > 0 ? 'up' : 'down',
        severity: kpis.satisfactionTrend > 0 ? 'success' : kpis.satisfactionTrend < -10 ? 'critical' : 'warning',
        action: 'Analyze Satisfaction Trends',
        link: '/insights?metric=satisfaction',
        metric: `${kpis.avgSatisfaction}/5 average`
      });
    }

    // Budget performance insight
    if (kpis.onBudgetPct < 70) {
      insights.push({
        id: 'budget-performance',
        title: 'Budget Performance Needs Review',
        description: `Only ${kpis.onBudgetPct}% of projects are on budget`,
        trend: 'down',
        severity: kpis.onBudgetPct < 50 ? 'critical' : 'warning',
        action: 'Review Budget Issues',
        link: '/projects?filter=over-budget',
        metric: `${100 - kpis.onBudgetPct}% over budget`
      });
    }

    // Timeline performance insight
    if (kpis.onTimePct < 80) {
      insights.push({
        id: 'timeline-performance',
        title: 'Timeline Challenges Detected',
        description: `${100 - kpis.onTimePct}% of projects are behind schedule`,
        trend: 'down',
        severity: kpis.onTimePct < 60 ? 'critical' : 'warning',
        action: 'Address Timeline Issues',
        link: '/projects?filter=late',
        metric: `${kpis.onTimePct}% on time`
      });
    }

    return insights.slice(0, 4); // Limit to 4 insights
  }, [kpis]);

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
      case "on-time":
        return "bg-blue-600/10 text-blue-600 border-blue-600/20";
      case "over":
      case "late":
        return "bg-rose-600/10 text-rose-600 border-rose-600/20";
      default:
        return "bg-muted text-muted-foreground border-transparent";
    }
  };

  const getSeverityColor = (severity: KeyInsight['severity']) => {
    switch (severity) {
      case 'success': return 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950';
      case 'warning': return 'border-amber-500 bg-amber-50 dark:bg-amber-950';
      case 'critical': return 'border-rose-500 bg-rose-50 dark:bg-rose-950';
      default: return 'border-border';
    }
  };

  const getSeverityIcon = (severity: KeyInsight['severity']) => {
    switch (severity) {
      case 'success': return <CheckCircle className="h-5 w-5 text-emerald-600" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-amber-600" />;
      case 'critical': return <AlertTriangle className="h-5 w-5 text-rose-600" />;
      default: return <Activity className="h-5 w-5 text-muted-foreground" />;
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Executive Overview</h1>
            <p className="text-muted-foreground">
              Strategic intelligence dashboard for data-driven decision making
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={refresh} disabled={busy}>
              <RefreshCw className={`mr-2 h-4 w-4 ${busy ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="default" onClick={() => navigate("/project-wizard")}>
              <Plus className="mr-2 h-4 w-4" />
              Add Project
            </Button>
          </div>
        </div>
      </div>

      {/* Key Insights */}
      {keyInsights.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Key Business Insights
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {keyInsights.map((insight) => (
              <Card 
                key={insight.id} 
                className={`cursor-pointer transition-all hover:shadow-md border-l-4 ${getSeverityColor(insight.severity)}`}
                onClick={() => navigate(insight.link)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {getSeverityIcon(insight.severity)}
                      <div>
                        <CardTitle className="text-base font-semibold">{insight.title}</CardTitle>
                        <CardDescription className="text-sm mt-1">
                          {insight.description}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {insight.trend === 'up' && <ArrowUpRight className="h-4 w-4 text-emerald-600" />}
                      {insight.trend === 'down' && <ArrowDownRight className="h-4 w-4 text-rose-600" />}
                      <Badge variant="outline" className="text-xs">
                        {insight.metric}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <Button variant="ghost" size="sm" className="h-auto p-0 font-medium text-primary">
                    {insight.action} →
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Smart Metrics */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Performance Metrics</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpis.total}</div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                {kpis.atRiskCount > 0 && (
                  <>
                    <AlertTriangle className="h-3 w-3 text-amber-500" />
                    {kpis.atRiskCount} at risk
                  </>
                )}
                {kpis.atRiskCount === 0 && kpis.total > 0 && (
                  <>
                    <CheckCircle className="h-3 w-3 text-emerald-500" />
                    All healthy
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Satisfaction</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpis.avgSatisfaction}/5</div>
              <div className="flex items-center gap-1 text-xs mt-1">
                {kpis.satisfactionTrend !== 0 && (
                  <>
                    {kpis.satisfactionTrend > 0 ? (
                      <TrendingUp className="h-3 w-3 text-emerald-500" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-rose-500" />
                    )}
                    <span className={kpis.satisfactionTrend > 0 ? 'text-emerald-600' : 'text-rose-600'}>
                      {Math.abs(kpis.satisfactionTrend)}% this month
                    </span>
                  </>
                )}
                {kpis.satisfactionTrend === 0 && (
                  <span className="text-muted-foreground">Industry avg: 3.8</span>
                )}
              </div>
            </CardContent>
          </Card>
          
          <PremiumFeature requiredTier="team" fallback={
            <Card className="opacity-60">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  Budget Health
                  <FeatureBadge tier="team" />
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-muted-foreground">—</div>
                <div className="text-xs text-muted-foreground mt-1">Upgrade to view</div>
              </CardContent>
            </Card>
          }>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Budget Health</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpis.onBudgetPct}%</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {kpis.onBudgetPct > 75 ? 'Excellent control' : 
                   kpis.onBudgetPct > 60 ? 'Good performance' : 'Needs attention'}
                </div>
              </CardContent>
            </Card>
          </PremiumFeature>

          <PremiumFeature requiredTier="team" fallback={
            <Card className="opacity-60">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  Timeline Health
                  <FeatureBadge tier="team" />
                </CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-muted-foreground">—</div>
                <div className="text-xs text-muted-foreground mt-1">Upgrade to view</div>
              </CardContent>
            </Card>
          }>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Timeline Health</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpis.onTimePct}%</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {kpis.onTimePct > 80 ? 'On track' : 
                   kpis.onTimePct > 60 ? 'Some delays' : 'Review needed'}
                </div>
              </CardContent>
            </Card>
          </PremiumFeature>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Button 
            variant="outline" 
            className="h-auto p-4 flex flex-col items-start gap-2"
            onClick={() => navigate('/projects?filter=at-risk')}
            disabled={kpis.atRiskCount === 0}
          >
            <div className="flex items-center gap-2 w-full">
              <AlertTriangle className="h-4 w-4" />
              <span className="font-medium">Review At-Risk</span>
            </div>
            <span className="text-xs text-muted-foreground text-left">
              {kpis.atRiskCount} projects need attention
            </span>
          </Button>

          <PremiumFeature requiredTier="business" fallback={
            <Button 
              variant="outline" 
              className="h-auto p-4 flex flex-col items-start gap-2 opacity-60"
              disabled
            >
              <div className="flex items-center gap-2 w-full">
                <FileText className="h-4 w-4" />
                <span className="font-medium">Executive Report</span>
                <FeatureBadge tier="business" />
              </div>
              <span className="text-xs text-muted-foreground text-left">
                Generate stakeholder reports
              </span>
            </Button>
          }>
            <Button 
              variant="outline" 
              className="h-auto p-4 flex flex-col items-start gap-2"
              onClick={() => navigate('/reports?template=executive')}
            >
              <div className="flex items-center gap-2 w-full">
                <FileText className="h-4 w-4" />
                <span className="font-medium">Executive Report</span>
              </div>
              <span className="text-xs text-muted-foreground text-left">
                Generate stakeholder reports
              </span>
            </Button>
          </PremiumFeature>

          <PremiumFeature requiredTier="enterprise" fallback={
            <Button 
              variant="outline" 
              className="h-auto p-4 flex flex-col items-start gap-2 opacity-60"
              disabled
            >
              <div className="flex items-center gap-2 w-full">
                <Brain className="h-4 w-4" />
                <span className="font-medium">AI Analysis</span>
                <FeatureBadge tier="enterprise" />
              </div>
              <span className="text-xs text-muted-foreground text-left">
                Get intelligent insights
              </span>
            </Button>
          }>
            <Button 
              variant="outline" 
              className="h-auto p-4 flex flex-col items-start gap-2"
              onClick={() => navigate('/insights?ai=true')}
            >
              <div className="flex items-center gap-2 w-full">
                <Brain className="h-4 w-4" />
                <span className="font-medium">AI Analysis</span>
              </div>
              <span className="text-xs text-muted-foreground text-left">
                Get intelligent insights
              </span>
            </Button>
          </PremiumFeature>

          <Button 
            variant="outline" 
            className="h-auto p-4 flex flex-col items-start gap-2"
            onClick={() => navigate('/project-wizard')}
          >
            <div className="flex items-center gap-2 w-full">
              <Plus className="h-4 w-4" />
              <span className="font-medium">Add Project</span>
            </div>
            <span className="text-xs text-muted-foreground text-left">
              Quick lesson entry
            </span>
          </Button>
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Activity
          </h2>
          <Button variant="outline" onClick={() => navigate("/projects")}>
            View All Projects
          </Button>
        </div>

        {recent.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="space-y-3">
                <Target className="h-12 w-12 text-muted-foreground mx-auto" />
                <div>
                  <h3 className="font-medium">No project data yet</h3>
                  <p className="text-sm text-muted-foreground">
                    Start by adding your first project to see insights here.
                  </p>
                </div>
                <Button onClick={() => navigate("/project-wizard")}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Project
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {recent.map((r, index) => (
              <Card key={r.id} className="cursor-pointer hover:shadow-md transition-all">
                <CardContent className="py-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="font-medium text-base">{r.project_name || "Untitled Project"}</div>
                        {index === 0 && <Badge variant="secondary" className="text-xs">Latest</Badge>}
                      </div>
                      
                      {r.client_name && (
                        <div className="text-sm text-muted-foreground mb-2">{r.client_name}</div>
                      )}
                      
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className={badgeTone(r.budget_status)}>
                          Budget: {r.budget_status ?? "—"}
                        </Badge>
                        <Badge variant="outline" className={badgeTone(r.timeline_status)}>
                          Timeline: {r.timeline_status ?? "—"}
                        </Badge>
                        <Badge variant="outline">
                          Satisfaction: {r.satisfaction ?? "—"}
                        </Badge>
                      </div>
                      
                      {r.notes && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {r.notes}
                        </p>
                      )}
                    </div>
                    
                    <div className="text-xs text-muted-foreground ml-4">
                      {fmtDate(r.date)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}