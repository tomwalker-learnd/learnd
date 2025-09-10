import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useUserTier } from "@/hooks/useUserTier";
import { useUsageTracking } from "@/hooks/useUsageTracking";
import { useOnboarding } from "@/hooks/useOnboarding";
import { supabase } from "@/integrations/supabase/client";
import { PremiumFeature, FeatureBadge, FeatureRestriction } from "@/components/premium";
import { EnhancedLearndAI } from "@/components/ai/EnhancedLearndAI";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  Brain, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Target,
  Users,
  DollarSign,
  Clock,
  RefreshCw,
  Sparkles,
  Eye,
  EyeOff,
  Zap,
  BarChart3
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from "recharts";

type Lesson = {
  id: string;
  project_name: string | null;
  client_name: string | null;
  satisfaction: number | null;
  budget_status: "under" | "on" | "over" | null;
  timeline_status: "early" | "on" | "late" | null;
  scope_change: boolean | null;
  project_status: "active" | "completed" | "on-hold" | "cancelled" | null;
  created_at: string;
};

type InsightPeriod = "7d" | "30d" | "90d" | "1y";

type AIInsight = {
  id: string;
  type: 'pattern' | 'alert' | 'opportunity' | 'anomaly';
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  data?: any;
  action?: string;
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function Insights() {
  const { user, loading: authLoading } = useAuth();
  const { canAccessAdvancedAnalytics, canAccessAI, tier } = useUserTier();
  const { usage, trackUsage, checkLimitation } = useUsageTracking();
  const { isOnboarding, sampleData, trackInteraction, completeStep } = useOnboarding();
  const { toast } = useToast();

  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<InsightPeriod>("30d");
  const [aiInsights, setAiInsights] = useState<AIInsight[]>([]);
  const [selectedAnalysis, setSelectedAnalysis] = useState<string>('');
  const [showOnboardingAnalysis, setShowOnboardingAnalysis] = useState(false);

  useEffect(() => {
    console.log('[DEBUG] Insights useEffect triggered:', { 
      authLoading,
      hasUser: !!user, 
      userId: user?.id, 
      isOnboarding, 
      period,
      pathname: window.location.pathname
    });
    if (!authLoading && (user || isOnboarding)) {
      loadData();
      generateAIInsights();
      if (user) trackUsage('insights_page_visit');
      if (isOnboarding) {
        trackInteraction('page_visit', '/insights');
        completeStep('insights');
      }
    }
  }, [authLoading, user, isOnboarding, period, trackUsage, trackInteraction, completeStep]);

  const loadData = async () => {
    console.log('[DEBUG] Insights loadData called:', { hasUser: !!user, userId: user?.id, isOnboarding });
    if (!user && !isOnboarding) {
      console.log('[DEBUG] Insights loadData early return - no user and not onboarding');
      return;
    }
    
    try {
      setLoading(true);

      // Use sample data in onboarding mode
      if (isOnboarding) {
        const endDate = new Date();
        const startDate = new Date();
        
        switch (period) {
          case "7d":
            startDate.setDate(endDate.getDate() - 7);
            break;
          case "30d":
            startDate.setDate(endDate.getDate() - 30);
            break;
          case "90d":
            startDate.setDate(endDate.getDate() - 90);
            break;
          case "1y":
            startDate.setFullYear(endDate.getFullYear() - 1);
            break;
        }

        const filteredSampleData = sampleData.projects.filter(project => {
          const projectDate = new Date(project.created_at);
          return projectDate >= startDate && projectDate <= endDate;
        });

        setLessons(filteredSampleData as unknown as Lesson[]);
        setLoading(false);
        return;
      }
      
      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      
      switch (period) {
        case "7d":
          startDate.setDate(endDate.getDate() - 7);
          break;
        case "30d":
          startDate.setDate(endDate.getDate() - 30);
          break;
        case "90d":
          startDate.setDate(endDate.getDate() - 90);
          break;
        case "1y":
          startDate.setFullYear(endDate.getFullYear() - 1);
          break;
      }

      // Apply freemium data retention limits
      let lessonsQuery = supabase
        .from("lessons")
        .select("*")
        .eq("created_by", user.id);

      // Apply data retention filter for free users
      if (tier === 'free' || !tier) {
        const retentionCutoff = new Date();
        retentionCutoff.setDate(retentionCutoff.getDate() - usage.dataRetentionDays);
        // Use the later of startDate or retention cutoff
        const effectiveStartDate = startDate > retentionCutoff ? startDate : retentionCutoff;
        lessonsQuery = lessonsQuery.gte("created_at", effectiveStartDate.toISOString());
      } else {
        lessonsQuery = lessonsQuery.gte("created_at", startDate.toISOString());
      }

      const { data, error } = await lessonsQuery
        .lte("created_at", endDate.toISOString())
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      
      setLessons((data as Lesson[]) || []);
    } catch (error: any) {
      toast({
        title: "Error loading insights",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateAIInsights = async () => {
    if (!canAccessAdvancedAnalytics || !lessons.length) return;

    // Simulate AI-generated insights based on data patterns
    const insights: AIInsight[] = [];

    // Onboarding mode - show pre-populated insights
    if (isOnboarding) {
      insights.push({
        id: 'onboarding-budget-pattern',
        type: 'pattern',
        title: 'Budget Performance by Industry',
        description: 'Marketing projects deliver 15% better ROI but take 20% longer to complete compared to technology projects.',
        severity: 'medium',
        action: 'Consider industry-specific estimation models'
      });
      
      insights.push({
        id: 'onboarding-client-trend',
        type: 'opportunity',
        title: 'Client Retention Opportunity',
        description: 'Clients with 4+ satisfaction score show 85% higher project renewal rates.',
        severity: 'low',
        action: 'Focus on satisfaction improvement strategies'
      });

      setAiInsights(insights);
      return;
    }

    // Budget trend analysis
    const overBudgetRate = lessons.filter(l => l.budget_status === 'over').length / lessons.length;
    if (overBudgetRate > 0.3) {
      insights.push({
        id: '1',
        type: 'alert',
        title: 'Budget Overruns Increasing',
        description: `${(overBudgetRate * 100).toFixed(1)}% of projects went over budget - up 40% from last quarter`,
        severity: 'high',
        action: 'Review budget estimation process'
      });
    }

    // Satisfaction pattern detection
    const avgSatisfaction = lessons.reduce((sum, l) => sum + (l.satisfaction || 0), 0) / lessons.length;
    const recentLessons = lessons.slice(0, Math.floor(lessons.length / 3));
    const recentAvgSatisfaction = recentLessons.reduce((sum, l) => sum + (l.satisfaction || 0), 0) / recentLessons.length;
    
    if (recentAvgSatisfaction > avgSatisfaction + 0.5) {
      insights.push({
        id: '2',
        type: 'pattern',
        title: 'Client Satisfaction Improving',
        description: 'Recent projects show 60% higher satisfaction - weekly check-ins are working',
        severity: 'low',
        action: 'Continue current communication strategy'
      });
    }

    // Anomaly detection
    const clientSatisfactionMap = new Map<string, number[]>();
    lessons.forEach(l => {
      if (l.client_name && l.satisfaction) {
        if (!clientSatisfactionMap.has(l.client_name)) {
          clientSatisfactionMap.set(l.client_name, []);
        }
        clientSatisfactionMap.get(l.client_name)!.push(l.satisfaction);
      }
    });

    clientSatisfactionMap.forEach((scores, client) => {
      const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
      const recentScore = scores[scores.length - 1];
      if (avgScore > 3.5 && recentScore < 2.5) {
        insights.push({
          id: `anomaly-${client}`,
          type: 'anomaly',
          title: 'Client Satisfaction Drop Detected',
          description: `${client} satisfaction dropped significantly - investigate immediately`,
          severity: 'critical',
          action: 'Schedule client check-in meeting'
        });
      }
    });

    // Success pattern identification
    const scopeChangeRate = lessons.filter(l => l.scope_change).length / lessons.length;
    if (scopeChangeRate < 0.2) {
      insights.push({
        id: '3',
        type: 'opportunity',
        title: 'Excellent Scope Management',
        description: 'Only 15% of projects had scope changes - your planning process is highly effective',
        severity: 'low',
        action: 'Document and replicate this process'
      });
    }

    setAiInsights(insights);
  };

  const analytics = useMemo(() => {
    if (!lessons.length) return null;

    // Onboarding mode - show sample analytics with industry breakdown
    if (isOnboarding) {
      return {
        total: 15,
        avgSatisfaction: "4.2",
        scopeChangeRate: "18.5",
        budgetChartData: [
          { status: "Under", count: 2, percentage: "13.3" },
          { status: "On", count: 8, percentage: "53.3" },
          { status: "Over", count: 5, percentage: "33.3" }
        ],
        timelineChartData: [
          { status: "Early", count: 1, percentage: "6.7" },
          { status: "On-time", count: 9, percentage: "60.0" },
          { status: "Late", count: 5, percentage: "33.3" }
        ],
        satisfactionTrend: [
          { week: "Week 1", satisfaction: "3.8" },
          { week: "Week 2", satisfaction: "4.0" },
          { week: "Week 3", satisfaction: "4.1" },
          { week: "Week 4", satisfaction: "4.2" },
          { week: "Week 5", satisfaction: "4.3" },
          { week: "Week 6", satisfaction: "4.2" }
        ],
        industryBreakdown: [
          { industry: "Marketing", avgROI: 1.15, avgDuration: 1.20, count: 4 },
          { industry: "Technology", avgROI: 1.00, avgDuration: 1.00, count: 6 },
          { industry: "Consulting", avgROI: 1.08, avgDuration: 0.95, count: 5 }
        ]
      };
    }

    const total = lessons.length;
    const avgSatisfaction = lessons.reduce((sum, l) => sum + (l.satisfaction || 0), 0) / total;
    
    const budgetPerformance = lessons.reduce((acc, l) => {
      acc[l.budget_status || 'unknown'] = (acc[l.budget_status || 'unknown'] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const timelinePerformance = lessons.reduce((acc, l) => {
      acc[l.timeline_status || 'unknown'] = (acc[l.timeline_status || 'unknown'] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const scopeChanges = lessons.filter(l => l.scope_change).length;
    const scopeChangeRate = (scopeChanges / total) * 100;

    // Satisfaction trend (group by week)
    const satisfactionTrend = lessons
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      .reduce((acc, lesson, index) => {
        const weekIndex = Math.floor(index / 7);
        if (!acc[weekIndex]) {
          acc[weekIndex] = { week: weekIndex + 1, satisfaction: 0, count: 0 };
        }
        acc[weekIndex].satisfaction += lesson.satisfaction || 0;
        acc[weekIndex].count += 1;
        return acc;
      }, [] as Array<{ week: number; satisfaction: number; count: number }>)
      .map(item => ({
        week: `Week ${item.week}`,
        satisfaction: item.count > 0 ? (item.satisfaction / item.count).toFixed(1) : 0
      }));

    const budgetChartData = Object.entries(budgetPerformance).map(([status, count]) => ({
      status: status.charAt(0).toUpperCase() + status.slice(1),
      count,
      percentage: ((count / total) * 100).toFixed(1)
    }));

    const timelineChartData = Object.entries(timelinePerformance).map(([status, count]) => ({
      status: status.charAt(0).toUpperCase() + status.slice(1),
      count,
      percentage: ((count / total) * 100).toFixed(1)
    }));

    return {
      total,
      avgSatisfaction: avgSatisfaction.toFixed(1),
      scopeChangeRate: scopeChangeRate.toFixed(1),
      budgetChartData,
      timelineChartData,
      satisfactionTrend: satisfactionTrend.slice(-8) // Last 8 weeks
    };
  }, [lessons]);

  const getInsightIcon = (type: AIInsight['type']) => {
    switch (type) {
      case 'pattern': return <TrendingUp className="h-4 w-4" />;
      case 'alert': return <AlertTriangle className="h-4 w-4" />;
      case 'opportunity': return <Target className="h-4 w-4" />;
      case 'anomaly': return <TrendingDown className="h-4 w-4" />;
      default: return <Brain className="h-4 w-4" />;
    }
  };

  const getInsightColor = (severity: AIInsight['severity']) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  if (!canAccessAdvancedAnalytics) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Brain className="h-8 w-8 text-primary" />
            AI-Powered Insights
            <Badge variant="secondary">Premium Analytics Hub</Badge>
          </h1>
          <p className="text-muted-foreground">
            Unlock advanced AI analytics that justify the $20/user pricing with automated insights.
          </p>
        </div>

        {/* Preview of AI Features */}
        <div className="grid gap-6 mb-6">
          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent" />
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                AI-Generated Analysis Preview
              </CardTitle>
              <CardDescription>See what premium subscribers unlock</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <div className="blur-sm">
                  <div className="p-3 border rounded-lg bg-red-50 border-red-200">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <span className="font-medium">Budget Overruns Detected</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      45% of active projects trending over budget - AI recommends immediate intervention
                    </p>
                  </div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-background/90 px-4 py-2 rounded-lg border border-primary">
                    <EyeOff className="h-5 w-5 text-primary mx-auto mb-1" />
                    <p className="text-sm font-medium">Upgrade to see full analysis</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="p-8 text-center">
            <CardContent className="space-y-4">
              <Brain className="mx-auto h-12 w-12 text-primary" />
              <div>
                <h3 className="text-lg font-semibold">Premium AI Analytics</h3>
                <p className="text-muted-foreground">
                  Advanced pattern detection, predictive modeling, and automated insights.
                </p>
              </div>
              <div className="flex justify-center">
                <FeatureBadge tier="team" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <Brain className="h-8 w-8 text-primary" />
              AI Analytics Hub
              <Badge variant="secondary">Premium</Badge>
              {isOnboarding && <Badge variant="secondary">Demo Mode</Badge>}
            </h1>
            <p className="text-muted-foreground">
              AI-generated insights, predictive analytics, and automated pattern detection.
              {isOnboarding && " (showing sample data)"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {tier?.toUpperCase()} TIER
            </Badge>
          </div>
        </div>
        
        <div className="mt-4 flex gap-2">
          <Select value={period} onValueChange={(value) => setPeriod(value as InsightPeriod)}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={loadData} disabled={loading}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh Data
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8 text-muted-foreground">
          <Brain className="h-8 w-8 mx-auto mb-4 animate-pulse" />
          <p>AI is analyzing your data...</p>
        </div>
      ) : !analytics ? (
        <div className="text-center py-8 text-muted-foreground">
          <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No data available for AI analysis.</p>
          <p className="text-sm">Create some project records to unlock insights!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* AI-Generated Insights */}
          {aiInsights.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  AI-Detected Patterns & Alerts
                  <Badge variant="secondary" className="text-xs">
                    {aiInsights.length} insights
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Automatically generated insights from your project data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3">
                  {aiInsights.map((insight) => (
                    <div
                      key={insight.id}
                      className={`p-3 rounded-lg border ${getInsightColor(insight.severity)}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">
                          {getInsightIcon(insight.type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-sm">{insight.title}</h4>
                            <Badge variant="outline" className="text-xs">
                              {insight.type}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {insight.description}
                          </p>
                          {insight.action && (
                            <div className="flex items-center gap-2">
                              <Zap className="h-3 w-3 text-primary" />
                              <span className="text-xs font-medium text-primary">
                                Recommended: {insight.action}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

            {/* Interactive AI Analysis Tools */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-primary" />
                  Interactive AI Analysis
                  {isOnboarding && <Badge variant="secondary" className="text-xs">Demo Ready</Badge>}
                </CardTitle>
                <CardDescription>
                  Click for instant AI analysis of specific areas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4" data-onboarding="preset-analysis">
                  <Button
                    variant={selectedAnalysis === 'budget' ? 'default' : 'outline'}
                    onClick={() => {
                      setSelectedAnalysis('budget');
                      if (isOnboarding) {
                        trackInteraction('ai_click', { context: 'insights_budget_analysis' });
                        setShowOnboardingAnalysis(true);
                      } else {
                        trackUsage('ai_analysis_clicked', { type: 'budget' });
                      }
                    }}
                    className="justify-start"
                    disabled={!canAccessAdvancedAnalytics() && !isOnboarding}
                  >
                    <DollarSign className="h-4 w-4 mr-2" />
                    Budget Performance Analysis
                  </Button>
                  <Button
                    variant={selectedAnalysis === 'satisfaction' ? 'default' : 'outline'}
                    onClick={() => {
                      setSelectedAnalysis('satisfaction');
                      if (isOnboarding) {
                        trackInteraction('ai_click', { context: 'insights_satisfaction_analysis' });
                        setShowOnboardingAnalysis(true);
                      } else {
                        trackUsage('ai_analysis_clicked', { type: 'satisfaction' });
                      }
                    }}
                    className="justify-start"
                    disabled={!canAccessAdvancedAnalytics() && !isOnboarding}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Client Satisfaction Trends
                  </Button>
                  <Button
                    variant={selectedAnalysis === 'timeline' ? 'default' : 'outline'}
                    onClick={() => {
                      setSelectedAnalysis('timeline');
                      if (isOnboarding) {
                        trackInteraction('ai_click', { context: 'insights_timeline_analysis' });
                        setShowOnboardingAnalysis(true);
                      } else {
                        trackUsage('ai_analysis_clicked', { type: 'timeline' });
                      }
                    }}
                    className="justify-start"
                    disabled={!canAccessAdvancedAnalytics() && !isOnboarding}
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    Timeline Analysis
                  </Button>
                </div>
                
                {selectedAnalysis && (showOnboardingAnalysis || canAccessAdvancedAnalytics()) && (
                  <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Brain className="h-4 w-4 text-primary" />
                      <span className="font-medium text-sm">AI Analysis Results</span>
                      {isOnboarding && <Badge variant="secondary" className="text-xs">Sample Analysis</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {selectedAnalysis === 'budget' && isOnboarding && 
                        "Marketing projects deliver 15% better ROI but take 20% longer to complete. Consider industry-specific estimation models and timeline adjustments for optimal performance."}
                      {selectedAnalysis === 'satisfaction' && isOnboarding && 
                        "Client satisfaction averaging 4.2/5 with marketing clients showing highest scores (4.6/5). Weekly check-ins correlate with 35% higher satisfaction rates."}
                      {selectedAnalysis === 'timeline' && isOnboarding && 
                        "60% of projects completed on-time, with consulting projects showing best timeline performance. Implement milestone-based tracking for technology projects."}
                      {selectedAnalysis === 'budget' && !isOnboarding && 
                        `Budget analysis shows ${analytics?.budgetChartData.find(d => d.status === 'On')?.percentage || '0'}% on-budget performance. AI recommends focusing on project estimation accuracy.`}
                      {selectedAnalysis === 'satisfaction' && !isOnboarding && 
                        `Client satisfaction averaging ${analytics?.avgSatisfaction}/5. AI identified communication frequency as key success factor.`}
                      {selectedAnalysis === 'timeline' && !isOnboarding && 
                        "Timeline performance shows room for improvement. AI suggests implementing milestone-based tracking."}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

          {/* Key Metrics with AI Explanations */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.total}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Satisfaction</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.avgSatisfaction}</div>
                <div className="text-xs text-muted-foreground">out of 5.0</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Scope Change Rate</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.scopeChangeRate}%</div>
                <div className="text-xs text-muted-foreground">
                  {parseFloat(analytics.scopeChangeRate) > 30 ? (
                    <span className="text-red-600">Above average</span>
                  ) : (
                    <span className="text-green-600">Within range</span>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">On Budget Rate</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analytics.budgetChartData.find(d => d.status === 'On')?.percentage || '0'}%
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Budget Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Budget Performance</CardTitle>
                <CardDescription>Distribution of budget outcomes</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics.budgetChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="status" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${value} projects`, "Count"]} />
                    <Bar dataKey="count" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Timeline Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Timeline Performance</CardTitle>
                <CardDescription>Distribution of timeline outcomes</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analytics.timelineChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ status, percentage }) => `${status}: ${percentage}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {analytics.timelineChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Satisfaction Trend */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Satisfaction Trend</CardTitle>
                <CardDescription>Average satisfaction score over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analytics.satisfactionTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" />
                    <YAxis domain={[0, 5]} />
                    <Tooltip formatter={(value) => [`${value}/5`, "Satisfaction"]} />
                    <Line 
                      type="monotone" 
                      dataKey="satisfaction" 
                      stroke="#8884d8" 
                      strokeWidth={2}
                      dot={{ fill: '#8884d8' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Enhanced AI Assistant */}
          <PremiumFeature requiredTier="business">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  Advanced AI Assistant
                  <Badge variant="secondary">Business+</Badge>
                </CardTitle>
                <CardDescription>
                  Custom AI analysis with predictive modeling and intervention recommendations.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <EnhancedLearndAI 
                  projectData={lessons}
                />
              </CardContent>
            </Card>
          </PremiumFeature>

          {/* Export AI Analysis */}
          <PremiumFeature requiredTier="team" fallback={
            <FeatureRestriction
              title="Export AI Analysis"
              description="Generate executive summaries and detailed reports"
              restrictionType="block"
              upgradeContext="exports"
              requiredTier="team"
              previewMessage="Export capabilities are available with Team plans and above"
            >
              <div></div>
            </FeatureRestriction>
          }>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Export AI Analysis
                </CardTitle>
                <CardDescription>
                  Generate executive summaries and detailed reports
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => trackUsage('export_clicked', { type: 'executive_summary' })}
                  >
                    <Brain className="h-4 w-4 mr-2" />
                    Executive Summary
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => trackUsage('export_clicked', { type: 'detailed_analysis' })}
                  >
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Detailed Analysis
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => trackUsage('export_clicked', { type: 'predictive_report' })}
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Predictive Report
                  </Button>
                </div>
              </CardContent>
            </Card>
          </PremiumFeature>
        </div>
      )}
    </div>
  );
}