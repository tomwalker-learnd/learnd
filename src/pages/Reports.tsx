import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useUserTier } from "@/hooks/useUserTier";
import { useOnboarding } from "@/hooks/useOnboarding";
import { supabase } from "@/integrations/supabase/client";
import { PremiumFeature, FeatureBadge } from "@/components/premium";
import { 
  getProjectHealth,
  getActiveProjectHealthDistribution,
  getCompletedProjectHealthDistribution,
  isActiveProject,
  isCompletedProject,
  type ProjectWithStatus,
  type ProjectLifecycleStatus,
  type ProjectHealth
} from "@/lib/statusUtils";
import { 
  LifecycleReportGenerator, 
  type ReportTemplate, 
  type ReportAudience, 
  type ReportConfig,
  type ProjectData,
  type ReportAnalytics
} from "@/utils/reportTemplates";

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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Download, 
  FileText, 
  Mail, 
  Share2, 
  Calendar,
  Lock,
  RefreshCw,
  BarChart3,
  TrendingUp,
  Target,
  CheckCircle,
  AlertTriangle,
  Activity
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type ReportFormat = "pdf" | "csv" | "excel";

type Lesson = ProjectData;

export default function Reports() {
  const { user } = useAuth();
  const { canAccessExports } = useUserTier();
  const { isOnboarding, sampleData, trackInteraction, completeStep } = useOnboarding();
  const { toast } = useToast();

  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [reportTemplate, setReportTemplate] = useState<ReportTemplate>("executive_portfolio");
  const [reportAudience, setReportAudience] = useState<ReportAudience>("executive");
  const [reportFormat, setReportFormat] = useState<ReportFormat>("pdf");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [clientFilter, setClientFilter] = useState("");
  const [projectStatusFilter, setProjectStatusFilter] = useState<ProjectLifecycleStatus[]>(["active", "completed"]);
  const [healthFilter, setHealthFilter] = useState<ProjectHealth[]>([]);
  const [includeRisks, setIncludeRisks] = useState(true);
  const [includeRecommendations, setIncludeRecommendations] = useState(true);

  useEffect(() => {
    if (user || isOnboarding) {
      loadData();
      if (isOnboarding) {
        trackInteraction('page_visit', '/reports');
        completeStep('reports');
      }
    }
    
    // Set default date range to last 90 days for better lifecycle analysis
    const today = new Date();
    const ninetyDaysAgo = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000);
    setDateTo(today.toISOString().split('T')[0]);
    setDateFrom(ninetyDaysAgo.toISOString().split('T')[0]);
  }, [user, isOnboarding, trackInteraction, completeStep]);

  const loadData = async () => {
    if (!user && !isOnboarding) return;
    
    try {
      setLoading(true);
      
      // Use sample data in onboarding mode
      if (isOnboarding) {
        setLessons(sampleData.projects as unknown as Lesson[]);
        setLoading(false);
        return;
      }
      
      const { data, error } = await supabase
        .from("lessons")
        .select("*")
        .eq("created_by", user.id)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      
      setLessons((data as Lesson[]) || []);
    } catch (error: any) {
      toast({
        title: "Error loading data",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredLessons = useMemo(() => {
    return lessons.filter(lesson => {
      const lessonDate = new Date(lesson.created_at);
      const fromDate = dateFrom ? new Date(dateFrom) : null;
      const toDate = dateTo ? new Date(dateTo) : null;
      
      const dateMatch = (!fromDate || lessonDate >= fromDate) && 
                       (!toDate || lessonDate <= toDate);
      
      const clientMatch = !clientFilter || 
                         lesson.client_name?.toLowerCase().includes(clientFilter.toLowerCase());
      
      const statusMatch = projectStatusFilter.length === 0 || 
                         projectStatusFilter.includes((lesson as any).project_status || 'active');
      
      return dateMatch && clientMatch && statusMatch;
    });
  }, [lessons, dateFrom, dateTo, clientFilter, projectStatusFilter]);

  const analytics = useMemo((): ReportAnalytics | null => {
    if (!filteredLessons.length) return null;

    const total = filteredLessons.length;
    const avgSatisfaction = filteredLessons.reduce((sum, l) => sum + (l.satisfaction || 0), 0) / total;
    
    const onBudget = filteredLessons.filter(l => l.budget_status === 'on' || l.budget_status === 'under').length;
    const onTime = filteredLessons.filter(l => l.timeline_status === 'on-time' || l.timeline_status === 'early').length;
    const scopeChanges = filteredLessons.filter(l => l.scope_change).length;
    
    const clients = [...new Set(filteredLessons.map(l => l.client_name).filter(Boolean))];
    
    // Lifecycle analysis
    const activeProjects = filteredLessons.filter(l => isActiveProject((l as any).project_status || 'active')).length;
    const completedProjects = filteredLessons.filter(l => isCompletedProject((l as any).project_status || 'active')).length;
    
    // Health distribution
    const projectsWithStatus = filteredLessons.map(lesson => ({
      ...lesson,
      project_status: (lesson as any).project_status || 'active'
    })) as ProjectWithStatus[];
    
    const activeHealthDist = getActiveProjectHealthDistribution(projectsWithStatus.filter(p => isActiveProject(p.project_status)));
    const completedHealthDist = getCompletedProjectHealthDistribution(projectsWithStatus.filter(p => isCompletedProject(p.project_status)));
    
    return {
      total,
      avgSatisfaction,
      onBudgetRate: (onBudget / total) * 100,
      onTimeRate: (onTime / total) * 100,
      scopeChangeRate: (scopeChanges / total) * 100,
      clientCount: clients.length,
      activeProjects,
      completedProjects,
      healthDistribution: {
        healthy: activeHealthDist.healthy,
        atRisk: activeHealthDist["at-risk"],
        critical: activeHealthDist.critical,
        successful: completedHealthDist.successful,
        underperformed: completedHealthDist.underperformed,
        mixed: completedHealthDist.mixed
      }
    };
  }, [filteredLessons]);

  const generateReport = async () => {
    if (!canAccessExports || !analytics) return;
    
    setGenerating(true);
    try {
      const config: ReportConfig = {
        template: reportTemplate,
        audience: reportAudience,
        projectStatus: projectStatusFilter,
        healthFilter,
        dateFrom,
        dateTo,
        clientFilter,
        includeRisks,
        includeRecommendations
      };

      if (reportFormat === "csv") {
        const csvContent = LifecycleReportGenerator.generateCSVExport(filteredLessons, config);
        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${reportTemplate}-${reportAudience}-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        URL.revokeObjectURL(url);
      } else {
        let doc: any;
        
        switch (reportTemplate) {
          case "active_portfolio_health":
            doc = LifecycleReportGenerator.generateActivePortfolioHealthReport(filteredLessons, analytics, config);
            break;
          case "completion_analysis":
            doc = LifecycleReportGenerator.generateCompletionAnalysisReport(filteredLessons, analytics, config);
            break;
          case "executive_portfolio":
            doc = LifecycleReportGenerator.generateExecutivePortfolioReport(filteredLessons, analytics, config);
            break;
          case "client_performance":
            doc = LifecycleReportGenerator.generateClientPerformanceReport(filteredLessons, analytics, config);
            break;
          default:
            doc = LifecycleReportGenerator.generateExecutivePortfolioReport(filteredLessons, analytics, config);
        }
        
        const filename = `${reportTemplate}-${reportAudience}-${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(filename);
      }
      
      toast({
        title: "Report generated",
        description: "Your lifecycle-aware report has been downloaded successfully"
      });
    } catch (error) {
      toast({
        title: "Report generation failed",
        description: "An error occurred while generating the report",
        variant: "destructive"
      });
    } finally {
      setGenerating(false);
    }
  };

  const getTemplateRecommendations = () => {
    if (!analytics) return [];
    
    const recommendations = [];
    
    if (analytics.activeProjects > 0 && analytics.healthDistribution.critical > 0) {
      recommendations.push("🚨 Active Portfolio Health Report recommended - critical issues detected");
    }
    
    if (analytics.completedProjects > 0 && analytics.healthDistribution.underperformed > 0) {
      recommendations.push("📊 Completion Analysis recommended - patterns need investigation");
    }
    
    if (analytics.activeProjects > 0 && analytics.completedProjects > 0) {
      recommendations.push("🔄 Executive Portfolio Summary ideal for cross-lifecycle insights");
    }
    
    if (clientFilter && filteredLessons.length > 0) {
      recommendations.push("👥 Client Performance Review recommended for stakeholder communication");
    }
    
    return recommendations;
  };

  const templateInfo = LifecycleReportGenerator.getTemplateInfo(reportTemplate);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">
          Lifecycle-Aware Reports
          {isOnboarding && <Badge variant="secondary" className="ml-2">Demo Mode</Badge>}
        </h1>
        <p className="text-muted-foreground">
          Generate professional reports tailored to different project lifecycle stages and stakeholder needs.
          {isOnboarding && " (showing sample portfolio report)"}
        </p>
        <div className="mt-3 flex gap-2">
          <Button variant="outline" onClick={loadData} disabled={loading}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh Data
          </Button>
        </div>
      </div>

      {!canAccessExports ? (
        <Card className="p-8 text-center">
          <CardContent className="space-y-4">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
            <div>
              <h3 className="text-lg font-semibold">Professional Lifecycle Reports</h3>
              <p className="text-muted-foreground">
                Generate executive summaries, portfolio health reports, and stakeholder deliverables with lifecycle awareness.
              </p>
            </div>
            <div className="flex justify-center">
              <FeatureBadge tier="team" />
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Q4 Portfolio Health Report Preview for Onboarding */}
          {isOnboarding && (
            <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent" data-onboarding="report-preview">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Q4 Portfolio Health Report
                  <Badge variant="secondary" className="text-xs">Live Preview</Badge>
                </CardTitle>
                <CardDescription>
                  Professional report showing your portfolio's performance with executive summary
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-white rounded-lg border">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">8</div>
                    <div className="text-xs text-muted-foreground">Active Projects</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">7</div>
                    <div className="text-xs text-muted-foreground">Completed This Quarter</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-amber-600">3</div>
                    <div className="text-xs text-muted-foreground">At Risk</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">4.2/5</div>
                    <div className="text-xs text-muted-foreground">Avg Satisfaction</div>
                  </div>
                </div>
                
                <div className="p-4 bg-slate-50 rounded-lg">
                  <h4 className="font-semibold mb-2">Executive Summary</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Q4 portfolio performance shows strong momentum with 87% on-time delivery rate. 
                    Three projects require immediate attention due to budget variances. Technology 
                    projects consistently outperform timeline estimates while marketing initiatives 
                    deliver superior client satisfaction scores.
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Professional formatting ready for stakeholders</p>
                    <p className="text-xs text-muted-foreground">
                      Includes charts, risk analysis, and recommendations
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled className="gap-1">
                      <Share2 className="h-3 w-3" />
                      Share with Team
                      <Badge variant="secondary" className="text-xs ml-1">Premium</Badge>
                    </Button>
                    <Button variant="outline" size="sm" disabled className="gap-1">
                      <Download className="h-3 w-3" />
                      Export PDF
                      <Badge variant="secondary" className="text-xs ml-1">Premium</Badge>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          {/* Template Recommendations */}
          {getTemplateRecommendations().length > 0 && (
            <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Smart Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {getTemplateRecommendations().map((rec, index) => (
                    <div key={index} className="text-sm flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                      {rec}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Report Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Report Configuration</CardTitle>
              <CardDescription>
                Configure your lifecycle-aware report parameters and stakeholder focus
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Template Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="report-template">Report Template</Label>
                  <Select value={reportTemplate} onValueChange={(value) => setReportTemplate(value as ReportTemplate)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active_portfolio_health">
                        <div className="flex items-center gap-2">
                          <Activity className="h-4 w-4" />
                          Active Portfolio Health
                        </div>
                      </SelectItem>
                      <SelectItem value="completion_analysis">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4" />
                          Project Completion Analysis
                        </div>
                      </SelectItem>
                      <SelectItem value="executive_portfolio">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4" />
                          Executive Portfolio Summary
                        </div>
                      </SelectItem>
                      <SelectItem value="client_performance">
                        <div className="flex items-center gap-2">
                          <Target className="h-4 w-4" />
                          Client Performance Review
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    {templateInfo.description}
                  </p>
                </div>

                <div>
                  <Label htmlFor="report-audience">Target Audience</Label>
                  <Select value={reportAudience} onValueChange={(value) => setReportAudience(value as ReportAudience)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="internal">Internal Team</SelectItem>
                      <SelectItem value="executive">Executive Leadership</SelectItem>
                      <SelectItem value="client">Client Stakeholders</SelectItem>
                      <SelectItem value="team">Project Team</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Adjusts content tone and detail level
                  </p>
                </div>
              </div>

              {/* Project Lifecycle Filter */}
              <div>
                <Label>Project Lifecycle Focus</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {(["active", "completed", "on_hold", "cancelled"] as ProjectLifecycleStatus[]).map((status) => (
                    <div key={status} className="flex items-center space-x-2">
                      <Checkbox
                        id={`status-${status}`}
                        checked={projectStatusFilter.includes(status)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setProjectStatusFilter([...projectStatusFilter, status]);
                          } else {
                            setProjectStatusFilter(projectStatusFilter.filter(s => s !== status));
                          }
                        }}
                      />
                      <Label htmlFor={`status-${status}`} className="text-sm capitalize">
                        {status.replace('_', ' ')}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Date Range and Filters */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="date-from">From Date</Label>
                  <Input
                    id="date-from"
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="date-to">To Date</Label>
                  <Input
                    id="date-to"
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="report-format">Format</Label>
                  <Select value={reportFormat} onValueChange={(value) => setReportFormat(value as ReportFormat)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">PDF Report</SelectItem>
                      <SelectItem value="csv">CSV Data Export</SelectItem>
                      <SelectItem value="excel" disabled>Excel (Coming Soon)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {(reportTemplate === "client_performance" || reportAudience === "client") && (
                <div>
                  <Label htmlFor="client-filter">Client Name</Label>
                  <Input
                    id="client-filter"
                    placeholder="Enter client name for focused analysis..."
                    value={clientFilter}
                    onChange={(e) => setClientFilter(e.target.value)}
                  />
                </div>
              )}

              {/* Report Options */}
              <div className="space-y-3">
                <Label>Report Content Options</Label>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="include-risks"
                      checked={includeRisks}
                      onCheckedChange={(checked) => setIncludeRisks(checked as boolean)}
                    />
                    <Label htmlFor="include-risks" className="text-sm">
                      Include risk analysis
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="include-recommendations"
                      checked={includeRecommendations}
                      onCheckedChange={(checked) => setIncludeRecommendations(checked as boolean)}
                    />
                    <Label htmlFor="include-recommendations" className="text-sm">
                      Include strategic recommendations
                    </Label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Data Preview */}
          {analytics && (
            <Card>
              <CardHeader>
                <CardTitle>Portfolio Overview</CardTitle>
                <CardDescription>
                  Preview of lifecycle data that will be included in your report
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{analytics.activeProjects}</div>
                    <div className="text-xs text-muted-foreground">Active Projects</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{analytics.completedProjects}</div>
                    <div className="text-xs text-muted-foreground">Completed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-emerald-600">{analytics.healthDistribution.healthy}</div>
                    <div className="text-xs text-muted-foreground">Healthy</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-amber-600">{analytics.healthDistribution.atRisk}</div>
                    <div className="text-xs text-muted-foreground">At Risk</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-rose-600">{analytics.healthDistribution.critical}</div>
                    <div className="text-xs text-muted-foreground">Critical</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{analytics.avgSatisfaction.toFixed(1)}</div>
                    <div className="text-xs text-muted-foreground">Avg Satisfaction</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{analytics.onBudgetRate.toFixed(1)}%</div>
                    <div className="text-xs text-muted-foreground">On Budget</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{analytics.clientCount}</div>
                    <div className="text-xs text-muted-foreground">Clients</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Generate Report */}
          <Card>
            <CardHeader>
              <CardTitle>Generate Report</CardTitle>
              <CardDescription>
                Create your lifecycle-aware professional report
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="font-medium">
                    {templateInfo.title} ({reportFormat.toUpperCase()})
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {filteredLessons.length} projects • {analytics?.activeProjects || 0} active, {analytics?.completedProjects || 0} completed
                    {clientFilter && ` • Client: ${clientFilter}`}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Target: {reportAudience} • {dateFrom || 'All time'} to {dateTo || 'Present'}
                  </p>
                </div>
                <Button 
                  onClick={generateReport}
                  disabled={generating || !analytics || analytics.total === 0}
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  {generating ? "Generating..." : "Generate Report"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}