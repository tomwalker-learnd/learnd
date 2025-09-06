import { useEffect, useState, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserTier } from "@/hooks/useUserTier";
import { useOnboarding } from "@/hooks/useOnboarding";
import { ProjectAIAnalysisModal } from "@/components/ProjectAIAnalysisModal";
import { supabase } from "@/integrations/supabase/client";
import { PremiumFeature, UpgradeButton } from "@/components/premium";
import { 
  getProjectHealth,
  getHealthStatusLabel,
  getHealthStatusStyles,
  getActiveProjectHealthDistribution,
  getCompletedProjectHealthDistribution,
  isActiveProject,
  isCompletedProject,
  type ProjectWithStatus,
  type ProjectLifecycleStatus,
  type ProjectHealth,
  type ActiveProjectHealth,
  type CompletedProjectHealth
} from "@/lib/statusUtils";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plus, 
  Search, 
  Download, 
  Filter, 
  FileText, 
  BarChart3,
  Lock,
  Calendar,
  Grid3X3,
  List,
  CalendarDays,
  Brain,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Activity,
  Target,
  Users,
  BookOpen,
  Lightbulb,
  Settings
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AIInsightsBanner } from "@/components/ai/AIInsightsBanner";
import { EnhancedLearndAI } from "@/components/ai/EnhancedLearndAI";

type BudgetStatus = "under" | "on" | "over";
type TimelineStatus = "early" | "on-time" | "late";

type Lesson = {
  id: string;
  project_name: string | null;
  client_name: string | null;
  role: string | null;
  satisfaction: number | null;
  budget_status: BudgetStatus | null;
  timeline_status: TimelineStatus | null;
  project_status?: ProjectLifecycleStatus;
  scope_change: boolean | null;
  notes: string | null;
  created_at: string;
  created_by: string;
};

type LessonFilters = {
  project_name?: string;
  role?: string;
  client_name?: string;
  satisfaction?: number[];
  budget_status?: BudgetStatus[];
  scope_change?: boolean;
  timeline_status?: string[];
  health?: ProjectHealth[];
  lifecycle?: ProjectLifecycleStatus[];
};

export default function Projects() {
  const { user, loading: authLoading } = useAuth();
  const { canAccessExports, canAccessAI } = useUserTier();
  const { isOnboarding, sampleData, trackInteraction, completeStep } = useOnboarding();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBudgetStatus, setSelectedBudgetStatus] = useState<BudgetStatus | "all">("all");
  const [selectedTimelineStatus, setSelectedTimelineStatus] = useState<TimelineStatus | "all">("all");
  const [selectedHealthStatus, setSelectedHealthStatus] = useState<ProjectHealth | "all">("all");
  const [selectedLifecycleStatus, setSelectedLifecycleStatus] = useState<ProjectLifecycleStatus | "all">("all");
  const [viewMode, setViewMode] = useState<"cards" | "table" | "timeline">("cards");
  const [exportingCSV, setExportingCSV] = useState(false);
  const [projectStatusTab, setProjectStatusTab] = useState<"active" | "completed" | "all">("active");
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null);
  const [aiAnalysisModalOpen, setAiAnalysisModalOpen] = useState(false);
  const [showCountdown, setShowCountdown] = useState(false);
  
  // AI Integration state
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiAction, setAiAction] = useState<"ask" | "trend" | "data_pack">("ask");

  // Parse filters from URL
  const filtersFromURL = useMemo(() => {
    const filtersParam = searchParams.get("f");
    if (!filtersParam) return {};
    
    try {
      return JSON.parse(decodeURIComponent(filtersParam)) as LessonFilters;
    } catch {
      return {};
    }
  }, [searchParams]);

  useEffect(() => {
    console.log('[DEBUG] Projects useEffect triggered:', { 
      authLoading, 
      hasUser: !!user, 
      userId: user?.id, 
      isOnboarding, 
      projectStatusTab,
      pathname: window.location.pathname
    });
    if (!authLoading && (user || isOnboarding)) {
      loadLessons();
      if (isOnboarding) {
        trackInteraction('page_visit', '/projects');
        completeStep('projects');
        
        // Auto-filter to at-risk projects in onboarding mode
        setProjectStatusTab('active');
        setSelectedHealthStatus('at-risk');
        
        // Auto-expand the first at-risk project after loading
        setTimeout(() => {
          const atRiskProject = sampleData.projects.find(p => 
            p.project_status === 'active' && 
            (p.budget_status === 'over' || p.timeline_status === 'late')
          );
          if (atRiskProject) {
            setExpandedProjectId(atRiskProject.id);
          }
        }, 1500);
      }
    }
  }, [authLoading, user, isOnboarding, projectStatusTab, trackInteraction, completeStep]);

  // Set filters from URL params on component mount
  useEffect(() => {
    const filter = searchParams.get("filter");
    const health = searchParams.get("health");
    const budget = searchParams.get("budget");
    const timeline = searchParams.get("timeline");

    if (filter === "active") setProjectStatusTab("active");
    if (filter === "completed") setProjectStatusTab("completed");
    if (health && health !== "all") setSelectedHealthStatus(health as ProjectHealth);
    if (budget && budget !== "all") setSelectedBudgetStatus(budget as BudgetStatus);
    if (timeline && timeline !== "all") setSelectedTimelineStatus(timeline as TimelineStatus);
  }, [searchParams]);

  const loadLessons = async () => {
    console.log('[DEBUG] Projects loadLessons called:', { hasUser: !!user, userId: user?.id, isOnboarding });
    if (!user && !isOnboarding) {
      console.log('[DEBUG] Projects loadLessons early return - no user and not onboarding');
      return;
    }
    
    try {
      setLoading(true);

      // Use sample data in onboarding mode
      if (isOnboarding) {
        let filteredSampleData = sampleData.projects;
        
        // Apply project status filter based on current tab
        if (projectStatusTab === "active") {
          filteredSampleData = filteredSampleData.filter(p => 
            p.project_status === "active" || p.project_status === "on_hold"
          );
        } else if (projectStatusTab === "completed") {
          filteredSampleData = filteredSampleData.filter(p => 
            p.project_status === "completed" || p.project_status === "cancelled"
          );
        }
        
        setLessons(filteredSampleData as unknown as Lesson[]);
        setLoading(false);
        return;
      }
      
      let query = supabase
        .from("lessons")
        .select("*")
        .eq("created_by", user.id)
        .order("created_at", { ascending: false });

      // Apply project status filter based on current tab
      if (projectStatusTab === "active") {
        query = query.in("project_status", ["active", "on_hold"]);
      } else if (projectStatusTab === "completed") {
        query = query.in("project_status", ["completed", "cancelled"]);
      }
      // "all" tab doesn't apply any project_status filter

      // Apply URL filters if present
      if (filtersFromURL.project_name) {
        query = query.ilike("project_name", `%${filtersFromURL.project_name}%`);
      }
      if (filtersFromURL.client_name) {
        query = query.ilike("client_name", `%${filtersFromURL.client_name}%`);
      }
      if (filtersFromURL.budget_status && filtersFromURL.budget_status.length > 0) {
        query = query.in("budget_status", filtersFromURL.budget_status);
      }
      if (filtersFromURL.timeline_status && filtersFromURL.timeline_status.length > 0) {
        query = query.in("timeline_status", filtersFromURL.timeline_status);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      
      setLessons((data as Lesson[]) || []);
    } catch (error: any) {
      toast({
        title: "Error loading projects",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredLessons = useMemo(() => {
    return lessons.filter((lesson) => {
      const matchesSearch = !searchTerm || 
        lesson.project_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lesson.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lesson.role?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesBudget = selectedBudgetStatus === "all" || lesson.budget_status === selectedBudgetStatus;
      const matchesTimeline = selectedTimelineStatus === "all" || lesson.timeline_status === selectedTimelineStatus;
      const matchesLifecycle = selectedLifecycleStatus === "all" || lesson.project_status === selectedLifecycleStatus;
      
      // Create project with status for health calculation
      const projectForHealth = { 
        ...lesson, 
        project_status: lesson.project_status || 'active',
        satisfaction: lesson.satisfaction || 0,
        budget_status: lesson.budget_status || 'on',
        timeline_status: lesson.timeline_status || 'on-time'
      } as any;
      
      const projectHealth = getProjectHealth(projectForHealth);
      const matchesHealth = selectedHealthStatus === "all" || projectHealth === selectedHealthStatus;
      
      return matchesSearch && matchesBudget && matchesTimeline && matchesLifecycle && matchesHealth;
    });
  }, [lessons, searchTerm, selectedBudgetStatus, selectedTimelineStatus, selectedLifecycleStatus, selectedHealthStatus]);

  const handleExportCSV = async () => {
    if (!canAccessExports) return;
    
    setExportingCSV(true);
    try {
      const headers = ["Project", "Client", "Role", "Date", "Project Status", "Satisfaction", "Budget Status", "Timeline Status", "Scope Change", "Notes"];
      const csvContent = [
        headers.join(","),
        ...filteredLessons.map(lesson => [
          `"${lesson.project_name || ''}"`,
          `"${lesson.client_name || ''}"`,
          `"${lesson.role || ''}"`,
          `"${new Date(lesson.created_at).toLocaleDateString()}"`,
          `"${lesson.project_status || 'active'}"`,
          `"${lesson.satisfaction || ''}"`,
          `"${lesson.budget_status || ''}"`,
          `"${lesson.timeline_status || ''}"`,
          `"${lesson.scope_change ? 'Yes' : 'No'}"`,
          `"${(lesson.notes || '').replace(/"/g, '""')}"`
        ].join(","))
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `projects-export-${projectStatusTab}-${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(url);

      toast({ title: "Export successful", description: `Exported ${filteredLessons.length} projects to CSV` });
    } catch (error) {
      toast({ title: "Export failed", description: "Failed to export CSV", variant: "destructive" });
    } finally {
      setExportingCSV(false);
    }
  };

  // AI Integration handlers
  const handleAIPromptSelect = (prompt: string, action: "ask" | "trend" | "data_pack") => {
    setAiPrompt(prompt);
    setAiAction(action);
  };

  const handleProjectAIAnalysis = (projectId: string) => {
    if (isOnboarding) {
      trackInteraction('ai_click', { context: 'projects_expanded_project', projectId });
      setAiAnalysisModalOpen(true);
    }
  };

  const handleAIAnalysisComplete = () => {
    if (isOnboarding) {
      completeStep('projects');
      setShowCountdown(true);
      // Auto-advance to insights after 3 seconds
      setTimeout(() => {
        setAiAnalysisModalOpen(false);
        navigate('/insights?onboarding=true');
      }, 3000);
    }
  };

  const getBadgeVariant = (status: string | null) => {
    switch (status) {
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

  const getLifecycleBadgeVariant = (status: ProjectLifecycleStatus) => {
    switch (status) {
      case "active":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "on_hold":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "cancelled":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-muted text-muted-foreground border-transparent";
    }
  };

  const getHealthColor = (health: ProjectHealth, isActive: boolean) => {
    if (isActive) {
      switch (health) {
        case "healthy": return "text-emerald-600 bg-emerald-50 border-emerald-200";
        case "at-risk": return "text-amber-600 bg-amber-50 border-amber-200";
        case "critical": return "text-rose-600 bg-rose-50 border-rose-200";
      }
    } else {
      switch (health) {
        case "successful": return "text-blue-600 bg-blue-50 border-blue-200";
        case "underperformed": return "text-orange-600 bg-orange-50 border-orange-200";
        case "mixed": return "text-gray-600 bg-gray-50 border-gray-200";
      }
    }
    return "text-gray-600 bg-gray-50 border-gray-200";
  };

  const getHealthIcon = (health: ProjectHealth, isActive: boolean) => {
    if (isActive) {
      switch (health) {
        case "healthy": return <CheckCircle className="h-4 w-4" />;
        case "at-risk": return <AlertTriangle className="h-4 w-4" />;
        case "critical": return <AlertTriangle className="h-4 w-4" />;
      }
    } else {
      switch (health) {
        case "successful": return <CheckCircle className="h-4 w-4" />;
        case "underperformed": return <AlertTriangle className="h-4 w-4" />;
        case "mixed": return <Activity className="h-4 w-4" />;
      }
    }
    return <Activity className="h-4 w-4" />;
  };

  const ProjectCard = ({ lesson }: { lesson: Lesson }) => {
    // Create project object for health calculation
    const projectForHealth = { 
      ...lesson, 
      project_status: lesson.project_status || 'active',
      satisfaction: lesson.satisfaction || 0,
      budget_status: lesson.budget_status || 'on',
      timeline_status: lesson.timeline_status || 'on-time'
    } as any;
    
    const health = getProjectHealth(projectForHealth);
    const isActive = isActiveProject(lesson.project_status || 'active');
    const statusLabel = (lesson.project_status || 'active').replace('_', ' ');
    const isExpanded = expandedProjectId === lesson.id;
    const isOnboardingProject = isOnboarding && lesson.project_name === "Mobile App Redesign";
    
    return (
      <Card className={`transition-all hover:shadow-md border-l-4 ${
        isActive ? (
          health === "healthy" ? "border-l-emerald-500" :
          health === "at-risk" ? "border-l-amber-500" : "border-l-rose-500"
        ) : (
          health === "successful" ? "border-l-blue-500" :
          health === "underperformed" ? "border-l-orange-500" : "border-l-gray-500"
        )
      } ${isExpanded ? 'shadow-lg ring-2 ring-primary/20' : ''}`}
      data-onboarding={isOnboardingProject ? 'expanded-project' : undefined}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="text-lg leading-none">
                {lesson.project_name || "Untitled Project"}
              </CardTitle>
              <CardDescription className="flex items-center gap-2">
                {lesson.client_name && (
                  <>
                    <span>{lesson.client_name}</span>
                    <span>•</span>
                  </>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(lesson.created_at).toLocaleDateString()}
                </span>
              </CardDescription>
            </div>
            <div className="flex flex-col gap-1">
              <Badge className={`${getHealthColor(health, isActive)} border`}>
                {getHealthIcon(health, isActive)}
                {getHealthStatusLabel(health)}
              </Badge>
              <Badge variant="outline" className={getLifecycleBadgeVariant(lesson.project_status || 'active')}>
                {statusLabel}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Role</span>
                <span>{lesson.role || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Satisfaction</span>
                <span>{lesson.satisfaction ? `${lesson.satisfaction}/5` : "—"}</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Budget</span>
                <Badge variant="outline" className={getBadgeVariant(lesson.budget_status)}>
                  {lesson.budget_status || "—"}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Timeline</span>
                <Badge variant="outline" className={getBadgeVariant(lesson.timeline_status)}>
                  {lesson.timeline_status || "—"}
                </Badge>
              </div>
            </div>
          </div>
          {lesson.scope_change && (
            <div className="mt-3 flex items-center gap-1 text-amber-600">
              <AlertTriangle className="h-3 w-3" />
              <span className="text-xs">Scope changes occurred</span>
            </div>
          )}
          
          {/* Expanded content for onboarding */}
          {isExpanded && isOnboardingProject && (
            <div className="mt-4 pt-4 border-t space-y-4">
              <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
                <h4 className="font-medium text-amber-900 mb-2 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Risk Factors Detected
                </h4>
                <ul className="text-sm text-amber-800 space-y-1">
                  <li>• Budget variance: 40% over original estimate</li>
                  <li>• Timeline delay: 3 weeks behind schedule</li>
                  <li>• Team size: 10 members (recommended: 5-6)</li>
                  <li>• Scope changes: 8 change requests submitted</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">Project Notes</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {lesson.notes || "Complex redesign project with TechCorp Solutions. Client requested significant UX changes mid-project, causing budget overruns. Large development team struggling with coordination. Timeline extended due to additional feature requests."}
                </p>
              </div>
              
              <Button 
                onClick={() => handleProjectAIAnalysis(lesson.id)}
                variant="default"
                className="w-full gap-2"
                data-onboarding="project-ai-analysis"
              >
                <Brain className="h-4 w-4" />
                Get AI Analysis
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  // Calculate health stats based on current tab
  const healthStats = useMemo(() => {
    const projectsForHealth = filteredLessons.map(lesson => ({
      ...lesson,
      project_status: lesson.project_status || 'active',
      satisfaction: lesson.satisfaction || 0,
      budget_status: lesson.budget_status || 'on',
      timeline_status: lesson.timeline_status || 'on-time'
    })) as any[];

    if (projectStatusTab === "active") {
      const activeProjects = projectsForHealth.filter(p => isActiveProject(p.project_status));
      const distribution = getActiveProjectHealthDistribution(activeProjects);
      return {
        total: activeProjects.length,
        primary: distribution.healthy,
        secondary: distribution['at-risk'],
        tertiary: distribution.critical,
        primaryLabel: "Healthy",
        secondaryLabel: "At Risk", 
        tertiaryLabel: "Critical"
      };
    } else if (projectStatusTab === "completed") {
      const completedProjects = projectsForHealth.filter(p => isCompletedProject(p.project_status));
      const distribution = getCompletedProjectHealthDistribution(completedProjects);
      return {
        total: completedProjects.length,
        primary: distribution.successful,
        secondary: distribution.underperformed,
        tertiary: distribution.mixed,
        primaryLabel: "Successful",
        secondaryLabel: "Underperformed",
        tertiaryLabel: "Mixed Results"
      };
    } else {
      // All projects - mixed stats
      const activeProjects = projectsForHealth.filter(p => isActiveProject(p.project_status));
      const completedProjects = projectsForHealth.filter(p => isCompletedProject(p.project_status));
      return {
        total: projectsForHealth.length,
        primary: activeProjects.length,
        secondary: completedProjects.length,
        tertiary: 0,
        primaryLabel: "Active",
        secondaryLabel: "Completed",
        tertiaryLabel: ""
      };
    }
  }, [filteredLessons, projectStatusTab]);

  // Dynamic filter options based on project status tab
  const availableHealthOptions = useMemo(() => {
    if (projectStatusTab === "active") {
      return [
        { value: "all", label: "All Health Statuses" },
        { value: "healthy", label: "Healthy" },
        { value: "at-risk", label: "At Risk" },
        { value: "critical", label: "Critical" }
      ];
    } else if (projectStatusTab === "completed") {
      return [
        { value: "all", label: "All Health Statuses" },
        { value: "successful", label: "Successful" },
        { value: "underperformed", label: "Underperformed" },
        { value: "mixed", label: "Mixed Results" }
      ];
    } else {
      return [
        { value: "all", label: "All Health Statuses" },
        { value: "healthy", label: "Healthy" },
        { value: "at-risk", label: "At Risk" },
        { value: "critical", label: "Critical" },
        { value: "successful", label: "Successful" },
        { value: "underperformed", label: "Underperformed" },
        { value: "mixed", label: "Mixed Results" }
      ];
    }
  }, [projectStatusTab]);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">
          Project Portfolio
          {isOnboarding && <Badge variant="secondary" className="ml-2">Demo Mode</Badge>}
        </h1>
        <p className="text-muted-foreground">
          Business intelligence for your project outcomes and portfolio health.
          {isOnboarding && " (showing sample data)"}
        </p>

        {/* Project Status Tabs */}
        <Tabs value={projectStatusTab} onValueChange={(value) => setProjectStatusTab(value as any)} className="mt-4">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="active" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Active Projects
            </TabsTrigger>
            <TabsTrigger value="completed" className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Completed Projects
            </TabsTrigger>
            <TabsTrigger value="all" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              All Projects
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="mt-4">
            {/* Active Projects Health Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium">Active Projects</span>
                  </div>
                  <p className="text-2xl font-bold mt-1">{healthStats.total}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-600" />
                    <span className="text-sm font-medium">Healthy</span>
                  </div>
                  <p className="text-2xl font-bold mt-1 text-emerald-600">{healthStats.primary}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <span className="text-sm font-medium">At Risk</span>
                  </div>
                  <p className="text-2xl font-bold mt-1 text-amber-600">{healthStats.secondary}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-rose-600" />
                    <span className="text-sm font-medium">Critical</span>
                  </div>
                  <p className="text-2xl font-bold mt-1 text-rose-600">{healthStats.tertiary}</p>
                </CardContent>
              </Card>
            </div>

            {/* Active Project Quick Actions */}
            <div className="mt-4 flex flex-wrap gap-2">
              <Button onClick={() => navigate("/submit-wizard")}>
                <Plus className="mr-2 h-4 w-4" />
                Add Update
              </Button>
              
              {(healthStats.secondary > 0 || healthStats.tertiary > 0) && (
                <Button variant="outline" onClick={() => setSelectedHealthStatus("at-risk")}>
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  Review At-Risk Projects ({healthStats.secondary + healthStats.tertiary})
                </Button>
              )}

              <Button variant="outline" onClick={() => navigate("/reports")}>
                <FileText className="mr-2 h-4 w-4" />
                Generate Report
              </Button>

              <PremiumFeature requiredTier="business" fallback={
                <Button variant="outline" disabled className="gap-2">
                  <Lock className="h-4 w-4" />
                  AI Analysis (Business+)
                </Button>
              }>
                <Button variant="outline" disabled={!canAccessAI || filteredLessons.length === 0}>
                  <Brain className="mr-2 h-4 w-4" />
                  Analyze Active Projects
                </Button>
              </PremiumFeature>
            </div>
          </TabsContent>

          <TabsContent value="completed" className="mt-4">
            {/* Completed Projects Performance Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium">Completed Projects</span>
                  </div>
                  <p className="text-2xl font-bold mt-1">{healthStats.total}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium">Successful</span>
                  </div>
                  <p className="text-2xl font-bold mt-1 text-blue-600">{healthStats.primary}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-orange-600" />
                    <span className="text-sm font-medium">Underperformed</span>
                  </div>
                  <p className="text-2xl font-bold mt-1 text-orange-600">{healthStats.secondary}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-gray-600" />
                    <span className="text-sm font-medium">Mixed Results</span>
                  </div>
                  <p className="text-2xl font-bold mt-1 text-gray-600">{healthStats.tertiary}</p>
                </CardContent>
              </Card>
            </div>

            {/* Completed Project Quick Actions */}
            <div className="mt-4 flex flex-wrap gap-2">
              <Button onClick={() => navigate("/submit-wizard")}>
                <Plus className="mr-2 h-4 w-4" />
                Add Update
              </Button>
              
              <Button variant="outline" onClick={() => setSelectedHealthStatus("successful")}>
                <BookOpen className="mr-2 h-4 w-4" />
                Analyze Patterns
              </Button>

              <Button variant="outline" onClick={() => setSelectedHealthStatus("underperformed")}>
                <Lightbulb className="mr-2 h-4 w-4" />
                Extract Learnings
              </Button>

              <Button variant="outline" onClick={() => navigate("/reports")}>
                <BarChart3 className="mr-2 h-4 w-4" />
                Benchmark Performance
              </Button>

              <PremiumFeature requiredTier="business" fallback={
                <Button variant="outline" disabled className="gap-2">
                  <Lock className="h-4 w-4" />
                  AI Analysis (Business+)
                </Button>
              }>
                <Button variant="outline" disabled={!canAccessAI || filteredLessons.length === 0}>
                  <Brain className="mr-2 h-4 w-4" />
                  Analyze Completion Trends
                </Button>
              </PremiumFeature>
            </div>
          </TabsContent>

          <TabsContent value="all" className="mt-4">
            {/* All Projects Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-purple-600" />
                    <span className="text-sm font-medium">Total Projects</span>
                  </div>
                  <p className="text-2xl font-bold mt-1">{healthStats.total}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium">Active</span>
                  </div>
                  <p className="text-2xl font-bold mt-1 text-blue-600">{healthStats.primary}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium">Completed</span>
                  </div>
                  <p className="text-2xl font-bold mt-1 text-green-600">{healthStats.secondary}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-gray-600" />
                    <span className="text-sm font-medium">Portfolio Health</span>
                  </div>
                  <p className="text-sm font-bold mt-1 text-gray-600">
                    {healthStats.total > 0 ? Math.round((healthStats.primary / healthStats.total) * 100) : 0}% Active
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* All Projects Quick Actions */}
            <div className="mt-4 flex flex-wrap gap-2">
              <Button onClick={() => navigate("/submit-wizard")}>
                <Plus className="mr-2 h-4 w-4" />
                Add Update
              </Button>
              
              <Button variant="outline" onClick={() => setProjectStatusTab("active")}>
                <Activity className="mr-2 h-4 w-4" />
                Focus on Active
              </Button>

              <Button variant="outline" onClick={() => setProjectStatusTab("completed")}>
                <BookOpen className="mr-2 h-4 w-4" />
                Review Completed
              </Button>

              <Button variant="outline" onClick={() => navigate("/reports")}>
                <FileText className="mr-2 h-4 w-4" />
                Executive Report
              </Button>

              <PremiumFeature requiredTier="business" fallback={
                <Button variant="outline" disabled className="gap-2">
                  <Lock className="h-4 w-4" />
                  AI Analysis (Business+)
                </Button>
              }>
                <Button variant="outline" disabled={!canAccessAI || filteredLessons.length === 0}>
                  <Brain className="mr-2 h-4 w-4" />
                  Portfolio Analysis
                </Button>
              </PremiumFeature>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* AI Insights Banner */}
      <AIInsightsBanner
        projectCount={filteredLessons.length}
        lifecycleFilter={projectStatusTab === 'active' ? ['active'] : projectStatusTab === 'completed' ? ['completed'] : ['active', 'completed', 'on_hold', 'cancelled']}
        healthFilter={selectedHealthStatus !== 'all' ? [selectedHealthStatus] : []}
        onPromptSelect={handleAIPromptSelect}
      />

      {/* Smart Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Smart Filters
          </CardTitle>
          <CardDescription>
            Filter using business language for better insights
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-6">
            <div className="space-y-2">
              <Label htmlFor="search">Search Projects</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Project name, client..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Project Lifecycle</Label>
              <Select value={selectedLifecycleStatus} onValueChange={(value) => setSelectedLifecycleStatus(value as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Lifecycles</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="on_hold">On Hold</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Project Health</Label>
              <Select 
                value={selectedHealthStatus} 
                onValueChange={(value) => setSelectedHealthStatus(value as any)}
                data-onboarding={isOnboarding && selectedHealthStatus === 'at-risk' ? 'risk-projects-filter' : undefined}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableHealthOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Delivery Status</Label>
              <Select value={selectedBudgetStatus} onValueChange={(value) => setSelectedBudgetStatus(value as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Budget Status</SelectItem>
                  <SelectItem value="under">Under Budget</SelectItem>
                  <SelectItem value="on">On Budget</SelectItem>
                  <SelectItem value="over">Over Budget</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Timeline Performance</Label>
              <Select value={selectedTimelineStatus} onValueChange={(value) => setSelectedTimelineStatus(value as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Timeline Status</SelectItem>
                  <SelectItem value="early">Early</SelectItem>
                  <SelectItem value="on-time">On Time</SelectItem>
                  <SelectItem value="late">Late</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Export & Tools</Label>
              <div className="flex gap-2">
                <PremiumFeature requiredTier="team" fallback={
                  <Button variant="outline" size="sm" disabled className="gap-1">
                    <Lock className="h-3 w-3" />
                    Export
                  </Button>
                }>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleExportCSV}
                    disabled={exportingCSV || filteredLessons.length === 0}
                  >
                    <Download className="h-3 w-3" />
                    {exportingCSV ? "..." : "CSV"}
                  </Button>
                </PremiumFeature>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* View Toggle */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">View Mode:</span>
          <div className="flex gap-1">
            <Button
              variant={viewMode === "cards" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("cards")}
            >
              <Grid3X3 className="h-4 w-4 mr-1" />
              Cards
            </Button>
            <Button
              variant={viewMode === "table" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("table")}
            >
              <List className="h-4 w-4 mr-1" />
              Table
            </Button>
            <Button
              variant={viewMode === "timeline" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("timeline")}
            >
              <CalendarDays className="h-4 w-4 mr-1" />
              Timeline
            </Button>
          </div>
        </div>
        
        <div className="text-sm text-muted-foreground">
          Showing {filteredLessons.length} of {lessons.length} projects
        </div>
      </div>

      {/* Content Views */}
      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-2 text-muted-foreground">Loading projects...</p>
        </div>
      ) : filteredLessons.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No projects found</h3>
            <p className="text-muted-foreground mb-4">
              {lessons.length === 0 
                ? "Get started by adding your first project update."
                : "Try adjusting your filters to see more results."
              }
            </p>
            <Button onClick={() => navigate("/submit-wizard")}>
              <Plus className="mr-2 h-4 w-4" />
              Add Project Update
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {viewMode === "cards" && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredLessons.map((lesson) => (
                <ProjectCard key={lesson.id} lesson={lesson} />
              ))}
            </div>
          )}

          {viewMode === "table" && (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Health</TableHead>
                    <TableHead>Budget</TableHead>
                    <TableHead>Timeline</TableHead>
                    <TableHead>Satisfaction</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLessons.map((lesson) => {
                    const projectForHealth = { 
                      ...lesson, 
                      project_status: lesson.project_status || 'active',
                      satisfaction: lesson.satisfaction || 0,
                      budget_status: lesson.budget_status || 'on',
                      timeline_status: lesson.timeline_status || 'on-time'
                    } as any;
                    const health = getProjectHealth(projectForHealth);
                    const isActive = isActiveProject(lesson.project_status || 'active');
                    
                    return (
                      <TableRow key={lesson.id}>
                        <TableCell className="font-medium">
                          {lesson.project_name || "Untitled Project"}
                        </TableCell>
                        <TableCell>{lesson.client_name || "—"}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getLifecycleBadgeVariant(lesson.project_status || 'active')}>
                            {(lesson.project_status || 'active').replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${getHealthColor(health, isActive)} border`}>
                            {getHealthStatusLabel(health)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getBadgeVariant(lesson.budget_status)}>
                            {lesson.budget_status || "—"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getBadgeVariant(lesson.timeline_status)}>
                            {lesson.timeline_status || "—"}
                          </Badge>
                        </TableCell>
                        <TableCell>{lesson.satisfaction ? `${lesson.satisfaction}/5` : "—"}</TableCell>
                        <TableCell>{new Date(lesson.created_at).toLocaleDateString()}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          )}

          {viewMode === "timeline" && (
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <CalendarDays className="h-5 w-5" />
                  Project Timeline View
                </h3>
                <div className="space-y-4">
                  {filteredLessons
                    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                    .map((lesson) => {
                      const projectForHealth = { 
                        ...lesson, 
                        project_status: lesson.project_status || 'active',
                        satisfaction: lesson.satisfaction || 0,
                        budget_status: lesson.budget_status || 'on',
                        timeline_status: lesson.timeline_status || 'on-time'
                      } as any;
                      const health = getProjectHealth(projectForHealth);
                      const isActive = isActiveProject(lesson.project_status || 'active');
                      
                      return (
                        <div key={lesson.id} className="flex items-start gap-4 pb-4 border-b border-border last:border-0">
                          <div className="flex flex-col items-center">
                            <div className={`w-3 h-3 rounded-full ${
                              isActive ? (
                                health === "healthy" ? "bg-emerald-500" :
                                health === "at-risk" ? "bg-amber-500" : "bg-rose-500"
                              ) : (
                                health === "successful" ? "bg-blue-500" :
                                health === "underperformed" ? "bg-orange-500" : "bg-gray-500"
                              )
                            }`} />
                            <div className="w-px h-8 bg-border mt-2" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div>
                                <h4 className="font-medium">{lesson.project_name || "Untitled Project"}</h4>
                                <p className="text-sm text-muted-foreground">
                                  {lesson.client_name && `${lesson.client_name} • `}
                                  {new Date(lesson.created_at).toLocaleDateString()}
                                </p>
                              </div>
                              <div className="flex gap-2">
                                <Badge className={`${getHealthColor(health, isActive)} border`}>
                                  {getHealthStatusLabel(health)}
                                </Badge>
                                <Badge variant="outline" className={getLifecycleBadgeVariant(lesson.project_status || 'active')}>
                                  {(lesson.project_status || 'active').replace('_', ' ')}
                                </Badge>
                              </div>
                            </div>
                            {lesson.notes && (
                              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                                {lesson.notes}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Enhanced AI Assistant */}
      <EnhancedLearndAI 
        lifecycleContext={projectStatusTab === 'active' ? ['active'] : projectStatusTab === 'completed' ? ['completed'] : ['active', 'completed', 'on_hold', 'cancelled']}
        healthContext={selectedHealthStatus !== 'all' ? [selectedHealthStatus] : []}
        projectData={filteredLessons}
        suggestedPrompt={aiPrompt}
        suggestedAction={aiAction}
      />

      {/* AI Analysis Modal for Onboarding */}
      <ProjectAIAnalysisModal
        isOpen={aiAnalysisModalOpen}
        onClose={() => setAiAnalysisModalOpen(false)}
        onInteractionComplete={handleAIAnalysisComplete}
      />
    </div>
  );
}