import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserTier } from "@/hooks/useUserTier";
import { useUsageTracking } from "@/hooks/useUsageTracking";
import { useOnboarding } from "@/hooks/useOnboarding";
import { AIInsightModal } from "@/components/AIInsightModal";
import { CountdownTimer } from "@/components/CountdownTimer";
import { supabase } from "@/integrations/supabase/client";
import PremiumFeature from "@/components/premium/PremiumFeature";
import { FeatureBadge, UsageIndicator, FeatureRestriction } from "@/components/premium";
import { 
  getActiveProjectHealthDistribution, 
  getCompletedProjectHealthDistribution,
  isActiveProject,
  isCompletedProject,
  type ProjectWithStatus 
} from "@/lib/statusUtils";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
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
  Activity,
  FileText,
  Brain,
  Plus,
  ChevronDown
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
  project_status?: 'active' | 'on_hold' | 'completed' | 'cancelled';
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
  const { usage, trackUsage, getUpgradeOpportunity } = useUsageTracking();
  const { isOnboarding, sampleData, trackInteraction, completeStep } = useOnboarding();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [busy, setBusy] = useState(false);
  const [recent, setRecent] = useState<LessonRow[]>([]);
  const [aiInsightModalOpen, setAiInsightModalOpen] = useState(false);
  const [showCountdown, setShowCountdown] = useState(false);
  const [collapsedInsights, setCollapsedInsights] = useState<Set<string>>(new Set(['active-portfolio-health', 'completed-performance', 'satisfaction-trend', 'active-budget-performance', 'active-timeline-performance', 'onboarding-ai-insight']));
  const [kpis, setKpis] = useState({
    // Active projects
    activeTotal: 0,
    activeHealthy: 0,
    activeAtRisk: 0,
    activeCritical: 0,
    activeBudgetPct: 0,
    activeTimelinePct: 0,
    // Completed projects
    completedQuarter: 0,
    completedSuccessful: 0,
    completedUnderperformed: 0,
    completedMixed: 0,
    // Overall metrics
    avgSatisfaction: 0,
    satisfactionTrend: 0,
  });

  // Sample KPIs for onboarding mode
  const sampleKpis = useMemo(() => ({
    activeTotal: 8,
    activeHealthy: 4,
    activeAtRisk: 3,
    activeCritical: 1,
    activeBudgetPct: 62,
    activeTimelinePct: 87,
    completedQuarter: 7,
    completedSuccessful: 4,
    completedUnderperformed: 2,
    completedMixed: 1,
    avgSatisfaction: 4.2,
    satisfactionTrend: 8.5,
  }), []);

  // Use sample KPIs in onboarding mode
  const displayKpis = isOnboarding ? sampleKpis : kpis;

  useEffect(() => {
    console.log('[DEBUG] Overview useEffect triggered:', { 
      loading, 
      hasUser: !!user, 
      userId: user?.id, 
      isOnboarding,
      pathname: window.location.pathname
    });
    if (!loading && (user || isOnboarding)) {
      refresh();
      if (user) trackUsage('overview_page_visit');
      if (isOnboarding) {
        trackInteraction('page_visit', '/overview');
        completeStep('overview');
      }
    }
  }, [loading, user, isOnboarding, trackUsage, trackInteraction, completeStep]);

  const refresh = async () => {
    console.log('[DEBUG] Overview refresh called:', { hasUser: !!user, userId: user?.id, isOnboarding });
    try {
      setBusy(true);

      // Use sample data in onboarding mode
      if (isOnboarding) {
        const sampleLessons = sampleData.projects.map(project => ({
          id: project.id,
          satisfaction: project.satisfaction,
          budget_status: project.budget_status,
          timeline_status: project.timeline_status,
          created_at: project.created_at,
          project_status: project.project_status
        }));
        
        processSameLessonsData(sampleLessons);
        setBusy(false);
        return;
      }

      // Normal mode - load from Supabase
      const dataRetentionDays = usage.dataRetentionDays;
      let lessonsQuery = supabase
        .from("lessons")
        .select("id, satisfaction, budget_status, timeline_status, created_at")
        .eq("created_by", user!.id);

      // Apply data retention filter for free users
      if (tier === 'free' || !tier) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - dataRetentionDays);
        lessonsQuery = lessonsQuery.gte('created_at', cutoffDate.toISOString());
      }

      lessonsQuery = lessonsQuery.order("created_at", { ascending: false });

      const { data: lessons, error } = await lessonsQuery;

      if (error) throw error;

      processSameLessonsData(lessons || []);
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

  const processSameLessonsData = async (lessonsData: any[]) => {
    const projects = lessonsData.map(lesson => ({
      ...lesson,
      project_status: lesson.project_status || 'active' as const
    })) as ProjectWithStatus[];
      
    // Separate active and completed projects
    const activeProjects = projects.filter(p => isActiveProject(p.project_status || 'active'));
    const completedProjects = projects.filter(p => isCompletedProject(p.project_status || 'active'));
    
    // Get health distributions
    const activeHealth = getActiveProjectHealthDistribution(activeProjects);
    const completedHealth = getCompletedProjectHealthDistribution(completedProjects);
    
    // Calculate active project budget/timeline health
    const activeOnBudget = activeProjects.filter(p => p.budget_status === "on").length;
    const activeOnTime = activeProjects.filter(p => 
      p.timeline_status === "on-time" || p.timeline_status === "early"
    ).length;
    
    // Get completed projects from last quarter (90 days)
    const quarterAgo = new Date();
    quarterAgo.setDate(quarterAgo.getDate() - 90);
    const quarterCompleted = completedProjects.filter(p => 
      new Date(p.created_at || '') > quarterAgo
    );

    // Overall satisfaction (all projects)
    const totalProjects = projects.length;
    const avgSatisfaction = totalProjects > 0
      ? projects.reduce((s, p) => s + (Number(p.satisfaction) || 0), 0) / totalProjects
      : 0;

    // Calculate trends (last 30 days vs previous 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const recentLessons = projects.filter(p => 
      new Date(p.created_at || '') > thirtyDaysAgo
    );
    const previousLessons = projects.filter(p => 
      new Date(p.created_at || '') > sixtyDaysAgo && new Date(p.created_at || '') <= thirtyDaysAgo
    );

    const recentAvgSat = recentLessons.length > 0 
      ? recentLessons.reduce((s, p) => s + (Number(p.satisfaction) || 0), 0) / recentLessons.length
      : 0;
    const prevAvgSat = previousLessons.length > 0
      ? previousLessons.reduce((s, p) => s + (Number(p.satisfaction) || 0), 0) / previousLessons.length
      : 0;

    const satisfactionTrend = prevAvgSat > 0 ? ((recentAvgSat - prevAvgSat) / prevAvgSat) * 100 : 0;

    setKpis({
      // Active projects
      activeTotal: activeProjects.length,
      activeHealthy: activeHealth.healthy,
      activeAtRisk: activeHealth['at-risk'],
      activeCritical: activeHealth.critical,
      activeBudgetPct: activeProjects.length ? Math.round((activeOnBudget / activeProjects.length) * 100) : 0,
      activeTimelinePct: activeProjects.length ? Math.round((activeOnTime / activeProjects.length) * 100) : 0,
      // Completed projects
      completedQuarter: quarterCompleted.length,
      completedSuccessful: completedHealth.successful,
      completedUnderperformed: completedHealth.underperformed,
      completedMixed: completedHealth.mixed,
      // Overall metrics
      avgSatisfaction: Number(avgSatisfaction.toFixed(2)),
      satisfactionTrend: Number(satisfactionTrend.toFixed(1)),
    });

    // Recent lessons data
    if (isOnboarding) {
      const recentSampleData = sampleData.projects
        .slice(0, 5)
        .map(project => ({
          id: project.id,
          project_name: project.project_name,
          client_name: project.client_name,
          created_at: project.created_at,
          satisfaction: project.satisfaction,
          budget_status: project.budget_status,
          timeline_status: project.timeline_status,
          notes: project.notes
        }));
      setRecent(recentSampleData as unknown as LessonRow[]);
    } else {
      // Load real recent data
      const dataRetentionDays = usage.dataRetentionDays;
      let recentQuery = supabase
        .from("lessons")
        .select("id, project_name, client_name, created_at, satisfaction, budget_status, timeline_status, notes")
        .eq("created_by", user!.id);

      // Apply data retention filter for free users
      if (tier === 'free' || !tier) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - dataRetentionDays);
        recentQuery = recentQuery.gte('created_at', cutoffDate.toISOString());
      }

      recentQuery = recentQuery.order("created_at", { ascending: false }).limit(5);

      const { data: recentRows, error: rErr } = await recentQuery;

      if (rErr) throw rErr;
      setRecent((recentRows as unknown as LessonRow[]) || []);
    }
  };

  // Generate key insights based on data
  const keyInsights = useMemo((): KeyInsight[] => {
    const currentKpis = isOnboarding ? sampleKpis : kpis;
    
    if (!currentKpis.activeTotal && !currentKpis.completedQuarter && !isOnboarding) return [];

    const insights: KeyInsight[] = [];

    // Sample insights for onboarding mode
    if (isOnboarding) {
      insights.push({
        id: 'onboarding-ai-insight',
        title: 'Budget Pattern Discovery',
        description: 'Your tech projects are 40% more likely to go over budget than consulting projects. This pattern emerged in Q3 and correlates with team size.',
        trend: 'down',
        severity: 'warning',
        action: 'View AI Analysis',
        link: '#',
        metric: '40% higher risk'
      });
      
      insights.push({
        id: 'onboarding-timeline-insight',
        title: 'Strong Timeline Performance',
        description: '87% of your active projects are on schedule - well above industry average of 65%.',
        trend: 'up',
        severity: 'success',
        action: 'Review Success Factors',
        link: '/projects?filter=active&timeline=on-time',
        metric: '87% on-time'
      });

      return insights;
    }

    const totalAtRisk = currentKpis.activeAtRisk + currentKpis.activeCritical;

    // Active Portfolio Health
    if (totalAtRisk > 0) {
      insights.push({
        id: 'active-portfolio-health',
        title: 'Active Portfolio Health Alert',
        description: `${totalAtRisk} of ${currentKpis.activeTotal} active projects need attention`,
        trend: 'down',
        severity: totalAtRisk > currentKpis.activeTotal * 0.3 ? 'critical' : 'warning',
        action: 'Review At-Risk Projects',
        link: '/projects?filter=active&health=at-risk',
        metric: `${Math.round((totalAtRisk / currentKpis.activeTotal) * 100)}% at risk`
      });
    } else if (currentKpis.activeTotal > 0) {
      insights.push({
        id: 'active-portfolio-health',
        title: 'Active Portfolio Performing Well',
        description: 'All active projects are on track with healthy metrics',
        trend: 'up',
        severity: 'success',
        action: 'View Active Portfolio',
        link: '/projects?filter=active',
        metric: '0% at risk'
      });
    }

    // Recent Completions Performance
    if (currentKpis.completedQuarter > 0) {
      const underperformanceRate = (currentKpis.completedUnderperformed / currentKpis.completedQuarter) * 100;
      if (underperformanceRate > 30) {
        insights.push({
          id: 'completion-performance',
          title: 'Recent Completions Analysis Needed',
          description: `${currentKpis.completedUnderperformed} of ${currentKpis.completedQuarter} recent completions underperformed`,
          trend: 'down',
          severity: underperformanceRate > 50 ? 'critical' : 'warning',
          action: 'Analyze Underperformed Projects',
          link: '/projects?filter=completed&health=underperformed',
          metric: `${Math.round(underperformanceRate)}% underperformed`
        });
      } else {
        insights.push({
          id: 'completion-performance',
          title: 'Strong Completion Performance',
          description: `${currentKpis.completedSuccessful} of ${currentKpis.completedQuarter} recent projects were successful`,
          trend: 'up',
          severity: 'success',
          action: 'Review Success Patterns',
          link: '/projects?filter=completed&health=successful',
          metric: `${Math.round((currentKpis.completedSuccessful / currentKpis.completedQuarter) * 100)}% successful`
        });
      }
    }

    // Satisfaction trend insight
    if (Math.abs(currentKpis.satisfactionTrend) > 5) {
      insights.push({
        id: 'satisfaction-trend',
        title: `Client Satisfaction ${currentKpis.satisfactionTrend > 0 ? 'Improving' : 'Declining'}`,
        description: `${Math.abs(currentKpis.satisfactionTrend)}% ${currentKpis.satisfactionTrend > 0 ? 'increase' : 'decrease'} this month`,
        trend: currentKpis.satisfactionTrend > 0 ? 'up' : 'down',
        severity: currentKpis.satisfactionTrend > 0 ? 'success' : currentKpis.satisfactionTrend < -10 ? 'critical' : 'warning',
        action: 'Analyze Satisfaction Trends',
        link: '/insights?metric=satisfaction',
        metric: `${currentKpis.avgSatisfaction}/5 average`
      });
    }

    // Active Budget performance insight
    if (currentKpis.activeTotal > 0 && currentKpis.activeBudgetPct < 70) {
      insights.push({
        id: 'active-budget-performance',
        title: 'Active Budget Performance Review Needed',
        description: `Only ${currentKpis.activeBudgetPct}% of active projects are on budget`,
        trend: 'down',
        severity: currentKpis.activeBudgetPct < 50 ? 'critical' : 'warning',
        action: 'Review Budget Issues',
        link: '/projects?filter=active&budget=over',
        metric: `${100 - currentKpis.activeBudgetPct}% over budget`
      });
    }

    // Active Timeline performance insight
    if (currentKpis.activeTotal > 0 && currentKpis.activeTimelinePct < 80) {
      insights.push({
        id: 'active-timeline-performance',
        title: 'Active Timeline Challenges Detected',
        description: `${100 - currentKpis.activeTimelinePct}% of active projects are behind schedule`,
        trend: 'down',
        severity: currentKpis.activeTimelinePct < 60 ? 'critical' : 'warning',
        action: 'Address Timeline Issues',
        link: '/projects?filter=active&timeline=late',
        metric: `${currentKpis.activeTimelinePct}% on time`
      });
    }

    return insights.slice(0, 4); // Limit to 4 insights
  }, [kpis, isOnboarding, sampleKpis]);

  // Handle AI insight interaction for onboarding
  const handleAIInsightClick = (insightId: string) => {
    if (isOnboarding && insightId === 'onboarding-ai-insight') {
      trackInteraction('ai_click', { context: 'overview_ai_insight' });
      setAiInsightModalOpen(true);
    } else {
      // Normal behavior for non-onboarding users
      const insight = keyInsights.find(i => i.id === insightId);
      if (insight && insight.link !== '#') {
        navigate(insight.link);
      }
    }
  };

  // Toggle insight collapse state
  const toggleInsightCollapse = (insightId: string) => {
    setCollapsedInsights(prev => {
      const newSet = new Set(prev);
      if (newSet.has(insightId)) {
        newSet.delete(insightId);
      } else {
        newSet.add(insightId);
      }
      return newSet;
    });
  };

  const handleAIModalInteractionComplete = () => {
    if (isOnboarding) {
      completeStep('overview');
      setShowCountdown(true);
      // Auto-advance to projects after 3 seconds
      setTimeout(() => {
        setAiInsightModalOpen(false);
        navigate('/projects?onboarding=true');
      }, 3000);
    }
  };

  // Get upgrade opportunity for proactive prompts
  const upgradeOpportunity = getUpgradeOpportunity();

  if (!user && !loading && !isOnboarding) return null;

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
            <h1 className="text-3xl font-bold tracking-tight">
              Executive Overview
              {isOnboarding && <Badge variant="secondary" className="ml-2">Demo Mode</Badge>}
            </h1>
            <p className="text-muted-foreground">
              Strategic intelligence dashboard for data-driven decision making
              {isOnboarding && " (showing sample data)"}
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

      {/* Usage & Upgrade Opportunity */}
      {(tier === 'free' || !tier) && (
        <div className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <UsageIndicator
              title="Project Insights"
              used={usage.lessonsUsed}
              limit={usage.lessonsLimit}
              unit="lessons"
              onUpgrade={() => trackUsage('upgrade_prompt_clicked', { context: 'lessons_limit' })}
              upgradeMessage="Upgrade to capture unlimited project insights"
            />
            
            {upgradeOpportunity && (
              <div className="p-4 bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Brain className="h-4 w-4 text-primary" />
                  <span className="font-medium text-sm">Upgrade Opportunity</span>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  {upgradeOpportunity.message}
                </p>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => trackUsage('proactive_upgrade_clicked', { trigger: upgradeOpportunity.trigger })}
                >
                  Learn More
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Key Insights */}
      {keyInsights.length > 0 && (
        <div className="mb-8" data-onboarding="key-insights">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Key Business Insights
            {isOnboarding && <Badge variant="secondary" className="text-xs">AI-Powered</Badge>}
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {keyInsights.map((insight) => {
              const isCollapsed = collapsedInsights.has(insight.id);
              return (
                <Collapsible key={insight.id} open={!isCollapsed} onOpenChange={() => toggleInsightCollapse(insight.id)}>
                  <Card className={`transition-all border-l-4 h-[180px] ${getSeverityColor(insight.severity)} ${
                    isOnboarding && insight.id === 'onboarding-ai-insight' ? 'ring-2 ring-primary/20 shadow-lg' : ''
                  } ${isCollapsed ? 'h-[40px]' : 'h-[180px]'}`}
                    data-onboarding={insight.id === 'onboarding-ai-insight' ? 'ai-insight-card' : undefined}
                  >
                    <CardHeader className="pb-3 overflow-hidden">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {getSeverityIcon(insight.severity)}
                          <div className="min-w-0 flex-1">
                            <CardTitle className="text-sm md:text-base font-semibold truncate">{insight.title}</CardTitle>
                            <CollapsibleContent>
                              <CardDescription className="text-xs md:text-sm mt-1 line-clamp-2">
                                {insight.description}
                              </CardDescription>
                            </CollapsibleContent>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <CollapsibleContent>
                            {insight.trend === 'up' && <TrendingUp className="h-4 w-4 text-emerald-600" />}
                            {insight.trend === 'down' && <TrendingDown className="h-4 w-4 text-rose-600" />}
                            <Badge variant="outline" className="text-[0.625rem] md:text-xs">
                              {insight.metric}
                            </Badge>
                          </CollapsibleContent>
                          <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-background/50">
                              <ChevronDown className={`h-4 w-4 transition-transform ${isCollapsed ? 'rotate-180' : ''}`} />
                            </Button>
                          </CollapsibleTrigger>
                        </div>
                      </div>
                    </CardHeader>
                    <CollapsibleContent>
                      <CardContent className="pt-0">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-auto p-0 font-medium text-primary text-xs md:text-sm"
                          onClick={() => handleAIInsightClick(insight.id)}
                        >
                          {insight.action} →
                        </Button>
                        {isOnboarding && insight.id === 'onboarding-ai-insight' && (
                          <div className="mt-2 text-[0.625rem] md:text-xs text-muted-foreground flex items-center gap-1">
                            <Brain className="h-3 w-3" />
                            Click to explore AI analysis
                          </div>
                        )}
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              );
            })}
          </div>
        </div>
      )}

      {/* Smart Metrics */}
      <div className="mb-8" data-onboarding="portfolio-metrics">
        <h2 className="text-xl font-semibold mb-4">
          Performance Metrics
          {isOnboarding && <Badge variant="outline" className="ml-2 text-xs">Sample Portfolio</Badge>}
        </h2>
        <div className="grid grid-cols-1 gap-6">
          
          {/* Active Projects Section */}
          <div data-onboarding="active-projects-section">
            <h3 className="text-lg font-medium mb-3 text-blue-600">Active Project Health</h3>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4" data-onboarding="project-kpis">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{displayKpis.activeTotal}</div>
                  <p className="text-xs text-muted-foreground">
                    {isOnboarding ? "8 projects in portfolio" : "Total in progress"}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Healthy</CardTitle>
                  <CheckCircle className="h-4 w-4 text-emerald-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-emerald-600">{displayKpis.activeHealthy}</div>
                  <p className="text-xs text-muted-foreground">
                    On track projects
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">At Risk</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-amber-600">{displayKpis.activeAtRisk}</div>
                  <p className="text-xs text-muted-foreground">
                    Need attention
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Critical</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-rose-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-rose-600">{displayKpis.activeCritical}</div>
                  <p className="text-xs text-muted-foreground">
                    Urgent action needed
                  </p>
                </CardContent>
              </Card>

              <PremiumFeature requiredTier="team" fallback={
                <FeatureRestriction
                  title="Budget Health (Active)"
                  description="Track budget performance across your active portfolio"
                  restrictionType="blur"
                  upgradeContext="advanced_analytics"
                  requiredTier="team"
                  previewMessage="Upgrade to monitor budget health across your active projects"
                >
                  <Card className="opacity-60">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Budget Health (Active)</CardTitle>
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-muted-foreground">—</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        <FeatureBadge tier="team" /> required
                      </div>
                    </CardContent>
                  </Card>
                </FeatureRestriction>
              }>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Budget Health (Active)</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{kpis.activeBudgetPct}%</div>
                    <div className="text-xs text-muted-foreground">
                      {kpis.activeBudgetPct >= 80 ? (
                        <>
                          <CheckCircle className="inline h-3 w-3 text-emerald-500 mr-1" />
                          Strong performance
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="inline h-3 w-3 text-amber-500 mr-1" />
                          Needs attention
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </PremiumFeature>

              <PremiumFeature requiredTier="team" fallback={
                <Card className="opacity-60">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      Timeline Health (Active)
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
                    <CardTitle className="text-sm font-medium">Timeline Health (Active)</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{kpis.activeTimelinePct}%</div>
                    <div className="text-xs text-muted-foreground mt-1">on schedule</div>
                  </CardContent>
                </Card>
              </PremiumFeature>
            </div>
          </div>

          {/* Completed Projects Section */}
          <div>
            <h3 className="text-lg font-medium mb-3 text-emerald-600">Completed Project Performance</h3>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Completed This Quarter</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{kpis.completedQuarter}</div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                    {kpis.completedSuccessful > 0 && (
                      <>
                        <CheckCircle className="h-3 w-3 text-emerald-500" />
                        {kpis.completedSuccessful} successful
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Overall Satisfaction */}
          <div>
            <h3 className="text-lg font-medium mb-3 text-purple-600">Overall Performance</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Client Satisfaction</CardTitle>
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
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Button 
            variant="outline" 
            onClick={() => navigate("/projects?filter=active&health=at-risk")}
            className="h-auto p-4 flex flex-col items-start gap-2"
          >
            <div className="flex items-center gap-2 w-full">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <span className="font-medium">Review At-Risk Projects</span>
            </div>
            <span className="text-xs text-muted-foreground text-left">
              Intervene on active projects needing attention
            </span>
          </Button>

          <Button 
            variant="outline" 
            onClick={() => navigate("/projects?filter=completed&health=underperformed")}
            className="h-auto p-4 flex flex-col items-start gap-2"
          >
            <div className="flex items-center gap-2 w-full">
              <BarChart3 className="h-4 w-4 text-orange-500" />
              <span className="font-medium">Analyze Completion Trends</span>
            </div>
            <span className="text-xs text-muted-foreground text-left">
              Learn from completed project patterns
            </span>
          </Button>

          <Button 
            variant="outline" 
            onClick={() => navigate("/reports")}
            className="h-auto p-4 flex flex-col items-start gap-2"
          >
            <div className="flex items-center gap-2 w-full">
              <FileText className="h-4 w-4 text-blue-500" />
              <span className="font-medium">Executive Report</span>
            </div>
            <span className="text-xs text-muted-foreground text-left">
              Combined active status & completion learnings
            </span>
          </Button>

          <PremiumFeature requiredTier="team" fallback={
            <Button 
              variant="outline" 
              disabled
              className="h-auto p-4 flex flex-col items-start gap-2 opacity-60"
            >
              <div className="flex items-center gap-2 w-full">
                <Brain className="h-4 w-4 text-purple-500" />
                <span className="font-medium flex items-center gap-1">
                  AI Analysis
                  <FeatureBadge tier="team" />
                </span>
              </div>
              <span className="text-xs text-muted-foreground text-left">
                Context-aware insights based on project mix
              </span>
            </Button>
          }>
            <Button 
              variant="outline" 
              onClick={() => navigate("/insights?ai=true")}
              className="h-auto p-4 flex flex-col items-start gap-2"
            >
              <div className="flex items-center gap-2 w-full">
                <Brain className="h-4 w-4 text-purple-500" />
                <span className="font-medium">AI Analysis</span>
              </div>
              <span className="text-xs text-muted-foreground text-left">
                Context-aware insights based on project mix
              </span>
            </Button>
          </PremiumFeature>
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Latest Project Updates</CardTitle>
            <CardDescription>
              Mix of active project updates and recent completions with context
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recent.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No recent activity</p>
                <p className="text-sm">Add your first project update to get started</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recent.map((item) => {
                  const projectStatus = item.project_status || 'active';
                  const isActive = isActiveProject(projectStatus);
                  const statusColor = isActive ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800';
                  const actionPrompt = isActive ? 'Review progress →' : 'Analyze completion →';
                  
                  return (
                    <div 
                      key={item.id} 
                      className="flex items-start gap-3 p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/projects?highlight=${item.id}`)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm truncate">
                            {item.project_name || "Untitled Project"}
                          </span>
                          <Badge variant="outline" className={`text-xs ${statusColor} border-current`}>
                            {projectStatus.replace('_', ' ')}
                          </Badge>
                          {item.client_name && (
                            <>
                              <span className="text-muted-foreground">•</span>
                              <span className="text-sm text-muted-foreground truncate">
                                {item.client_name}
                              </span>
                            </>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          {item.satisfaction && (
                            <Badge variant="outline" className="text-xs">
                              {item.satisfaction}/5 satisfaction
                            </Badge>
                          )}
                          {item.budget_status && (
                            <Badge variant="outline" className={`text-xs ${badgeTone(item.budget_status)}`}>
                              {item.budget_status} budget
                            </Badge>
                          )}
                          {item.timeline_status && (
                            <Badge variant="outline" className={`text-xs ${badgeTone(item.timeline_status)}`}>
                              {item.timeline_status} timeline
                            </Badge>
                          )}
                        </div>
                        {item.notes && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {item.notes}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-xs text-muted-foreground">
                          {fmtDate(item.created_at)}
                        </span>
                        <span className="text-xs font-medium text-primary">
                          {actionPrompt}
                        </span>
                      </div>
                    </div>
                  );
                })}
                
                <div className="pt-4 border-t">
                  <Button 
                    variant="ghost" 
                    onClick={() => navigate("/projects")}
                    className="w-full"
                  >
                    View All Projects →
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
         </Card>
       </div>

       {/* AI Insight Modal */}
       <AIInsightModal
         isOpen={aiInsightModalOpen}
         onClose={() => setAiInsightModalOpen(false)}
         onInteractionComplete={handleAIModalInteractionComplete}
       />
     </div>
   );
 }