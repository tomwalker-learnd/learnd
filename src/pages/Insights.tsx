import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useUserTier } from "@/hooks/useUserTier";
import { supabase } from "@/integrations/supabase/client";
import { PremiumFeature, FeatureBadge } from "@/components/premium";
import LearndAI from "@/components/LearndAI";

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
  RefreshCw
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
  created_at: string;
};

type InsightPeriod = "7d" | "30d" | "90d" | "1y";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function Insights() {
  const { user } = useAuth();
  const { canAccessAdvancedAnalytics, canAccessAI } = useUserTier();
  const { toast } = useToast();

  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<InsightPeriod>("30d");

  useEffect(() => {
    if (user) loadData();
  }, [user, period]);

  const loadData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
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

      const { data, error } = await supabase
        .from("lessons")
        .select("*")
        .eq("created_by", user.id)
        .gte("created_at", startDate.toISOString())
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

  const analytics = useMemo(() => {
    if (!lessons.length) return null;

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

  if (!canAccessAdvancedAnalytics) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">AI-Powered Insights</h1>
          <p className="text-muted-foreground">
            Advanced analytics and predictive intelligence.
          </p>
        </div>

        <Card className="p-8 text-center">
          <CardContent className="space-y-4">
            <Brain className="mx-auto h-12 w-12 text-muted-foreground" />
            <div>
              <h3 className="text-lg font-semibold">Advanced Insights</h3>
              <p className="text-muted-foreground">
                Unlock AI-powered analytics, trend analysis, and predictive insights with a paid plan.
              </p>
            </div>
            <div className="flex justify-center">
              <FeatureBadge tier="team" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">AI-Powered Insights</h1>
        <p className="text-muted-foreground">
          Advanced analytics and predictive intelligence for strategic decision making.
        </p>
        <div className="mt-3 flex gap-2">
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
            Refresh
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Loading insights...</div>
      ) : !analytics ? (
        <div className="text-center py-8 text-muted-foreground">
          No data available for the selected period.
        </div>
      ) : (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

          {/* AI Assistant */}
          <PremiumFeature requiredTier="business">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  AI Analysis Assistant
                </CardTitle>
                <CardDescription>
                  Get intelligent insights and recommendations based on your data.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <LearndAI context={{ 
                  from: "insights",
                  data: {
                    period,
                    totalProjects: analytics.total,
                    avgSatisfaction: analytics.avgSatisfaction,
                    scopeChangeRate: analytics.scopeChangeRate
                  }
                }} />
              </CardContent>
            </Card>
          </PremiumFeature>
        </div>
      )}
    </div>
  );
}