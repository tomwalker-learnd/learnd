import { useEffect, useState, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserTier } from "@/hooks/useUserTier";
import { supabase } from "@/integrations/supabase/client";
import { PremiumFeature, UpgradeButton } from "@/components/premium";

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
  Activity
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type BudgetStatus = "under" | "on" | "over";
type TimelineStatus = "early" | "on" | "late";
type ProjectHealth = "healthy" | "at-risk" | "critical";

type Lesson = {
  id: string;
  project_name: string | null;
  client_name: string | null;
  role: string | null;
  satisfaction: number | null;
  budget_status: BudgetStatus | null;
  timeline_status: TimelineStatus | null;
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
};

export default function Projects() {
  const { user } = useAuth();
  const { canAccessExports, canAccessAI } = useUserTier();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBudgetStatus, setSelectedBudgetStatus] = useState<BudgetStatus | "all">("all");
  const [selectedTimelineStatus, setSelectedTimelineStatus] = useState<TimelineStatus | "all">("all");
  const [selectedHealthStatus, setSelectedHealthStatus] = useState<ProjectHealth | "all">("all");
  const [viewMode, setViewMode] = useState<"cards" | "table" | "timeline">("cards");
  const [exportingCSV, setExportingCSV] = useState(false);
  const [dateFilter, setDateFilter] = useState("active"); // "active", "all", "recent"

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
    loadLessons();
  }, [user]);

  const loadLessons = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      let query = supabase
        .from("lessons")
        .select("*")
        .eq("created_by", user.id)
        .order("created_at", { ascending: false });

      // Apply date filter - default to active projects (last 60 days)
      if (dateFilter === "active") {
        const sixtyDaysAgo = new Date();
        sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
        query = query.gte("created_at", sixtyDaysAgo.toISOString());
      } else if (dateFilter === "recent") {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        query = query.gte("created_at", thirtyDaysAgo.toISOString());
      }

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

  // Calculate project health based on budget, timeline, and satisfaction
  const getProjectHealth = (lesson: Lesson): ProjectHealth => {
    const isBudgetOver = lesson.budget_status === "over";
    const isLate = lesson.timeline_status === "late";
    const lowSatisfaction = lesson.satisfaction && lesson.satisfaction <= 2;
    
    if ((isBudgetOver && isLate) || lowSatisfaction) return "critical";
    if (isBudgetOver || isLate || (lesson.satisfaction && lesson.satisfaction <= 3)) return "at-risk";
    return "healthy";
  };

  const filteredLessons = useMemo(() => {
    return lessons.filter((lesson) => {
      const matchesSearch = !searchTerm || 
        lesson.project_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lesson.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lesson.role?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesBudget = selectedBudgetStatus === "all" || lesson.budget_status === selectedBudgetStatus;
      const matchesTimeline = selectedTimelineStatus === "all" || lesson.timeline_status === selectedTimelineStatus;
      const projectHealth = getProjectHealth(lesson);
      const matchesHealth = selectedHealthStatus === "all" || projectHealth === selectedHealthStatus;
      
      return matchesSearch && matchesBudget && matchesTimeline && matchesHealth;
    });
  }, [lessons, searchTerm, selectedBudgetStatus, selectedTimelineStatus, selectedHealthStatus]);

  const handleExportCSV = async () => {
    if (!canAccessExports) return;
    
    setExportingCSV(true);
    try {
      const headers = ["Project", "Client", "Role", "Date", "Satisfaction", "Budget Status", "Timeline Status", "Scope Change", "Notes"];
      const csvContent = [
        headers.join(","),
        ...filteredLessons.map(lesson => [
          `"${lesson.project_name || ''}"`,
          `"${lesson.client_name || ''}"`,
          `"${lesson.role || ''}"`,
          `"${new Date(lesson.created_at).toLocaleDateString()}"`,
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
      link.download = `projects-export-${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(url);

      toast({ title: "Export successful", description: `Exported ${filteredLessons.length} projects to CSV` });
    } catch (error) {
      toast({ title: "Export failed", description: "Failed to export CSV", variant: "destructive" });
    } finally {
      setExportingCSV(false);
    }
  };

  const getBadgeVariant = (status: string | null) => {
    switch (status) {
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

  const getHealthColor = (health: ProjectHealth) => {
    switch (health) {
      case "healthy": return "text-emerald-600 bg-emerald-50 border-emerald-200";
      case "at-risk": return "text-amber-600 bg-amber-50 border-amber-200";
      case "critical": return "text-rose-600 bg-rose-50 border-rose-200";
    }
  };

  const getHealthIcon = (health: ProjectHealth) => {
    switch (health) {
      case "healthy": return <CheckCircle className="h-4 w-4" />;
      case "at-risk": return <AlertTriangle className="h-4 w-4" />;
      case "critical": return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const ProjectCard = ({ lesson }: { lesson: Lesson }) => {
    const health = getProjectHealth(lesson);
    return (
      <Card className={`transition-all hover:shadow-md border-l-4 ${
        health === "healthy" ? "border-l-emerald-500" :
        health === "at-risk" ? "border-l-amber-500" : "border-l-rose-500"
      }`}>
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
            <Badge className={`${getHealthColor(health)} border`}>
              {getHealthIcon(health)}
              {health === "at-risk" ? "At Risk" : health === "critical" ? "Critical" : "Healthy"}
            </Badge>
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
        </CardContent>
      </Card>
    );
  };

  const healthStats = useMemo(() => {
    const healthy = filteredLessons.filter(l => getProjectHealth(l) === "healthy").length;
    const atRisk = filteredLessons.filter(l => getProjectHealth(l) === "at-risk").length;
    const critical = filteredLessons.filter(l => getProjectHealth(l) === "critical").length;
    return { healthy, atRisk, critical };
  }, [filteredLessons]);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Project Portfolio</h1>
        <p className="text-muted-foreground">
          Business intelligence for your project outcomes and portfolio health.
        </p>
        
        {/* Health Overview */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">Total Projects</span>
              </div>
              <p className="text-2xl font-bold mt-1">{filteredLessons.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-600" />
                <span className="text-sm font-medium">Healthy</span>
              </div>
              <p className="text-2xl font-bold mt-1 text-emerald-600">{healthStats.healthy}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <span className="text-sm font-medium">At Risk</span>
              </div>
              <p className="text-2xl font-bold mt-1 text-amber-600">{healthStats.atRisk}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-rose-600" />
                <span className="text-sm font-medium">Critical</span>
              </div>
              <p className="text-2xl font-bold mt-1 text-rose-600">{healthStats.critical}</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mt-4 flex flex-wrap gap-2">
          <Button onClick={() => navigate("/submit-wizard")}>
            <Plus className="mr-2 h-4 w-4" />
            Add Update
          </Button>
          
          {healthStats.atRisk > 0 || healthStats.critical > 0 ? (
            <Button variant="outline" onClick={() => {
              setSelectedHealthStatus("at-risk");
              setViewMode("cards");
            }}>
              <AlertTriangle className="mr-2 h-4 w-4" />
              Review At-Risk Projects ({healthStats.atRisk + healthStats.critical})
            </Button>
          ) : null}

          <Button variant="outline" onClick={() => navigate("/reports")}>
            <FileText className="mr-2 h-4 w-4" />
            Generate Report
          </Button>

          <PremiumFeature 
            requiredTier="business"
            fallback={
              <Button variant="outline" disabled className="gap-2">
                <Lock className="h-4 w-4" />
                AI Analysis (Business+)
              </Button>
            }
          >
            <Button variant="outline" disabled={!canAccessAI || filteredLessons.length === 0}>
              <Brain className="mr-2 h-4 w-4" />
              Analyze Trends with AI
            </Button>
          </PremiumFeature>
          
          <PremiumFeature 
            requiredTier="team"
            fallback={
              <Button variant="outline" disabled className="gap-2">
                <Lock className="h-4 w-4" />
                Export (Team+)
              </Button>
            }
          >
            <Button 
              variant="outline" 
              onClick={handleExportCSV}
              disabled={exportingCSV || filteredLessons.length === 0}
            >
              <Download className="mr-2 h-4 w-4" />
              {exportingCSV ? "Exporting..." : "Export CSV"}
            </Button>
          </PremiumFeature>
        </div>
      </div>

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
          <div className="grid gap-4 md:grid-cols-5">
            <div>
              <Label>Time Period</Label>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active Projects (60 days)</SelectItem>
                  <SelectItem value="recent">Recent Projects (30 days)</SelectItem>
                  <SelectItem value="all">All Projects</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search projects..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            
            <div>
              <Label>Project Health</Label>
              <Select value={selectedHealthStatus} onValueChange={(value) => setSelectedHealthStatus(value as ProjectHealth | "all")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Health States</SelectItem>
                  <SelectItem value="healthy">Healthy Projects</SelectItem>
                  <SelectItem value="at-risk">At-Risk Projects</SelectItem>
                  <SelectItem value="critical">Critical Projects</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Delivery Status</Label>
              <Select value={selectedBudgetStatus} onValueChange={(value) => setSelectedBudgetStatus(value as BudgetStatus | "all")}>
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

            <div className="flex items-end">
              <Button variant="outline" onClick={() => {
                setSearchTerm("");
                setSelectedBudgetStatus("all");
                setSelectedTimelineStatus("all");
                setSelectedHealthStatus("all");
                setDateFilter("active");
              }}>
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* View Options */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">View:</span>
          <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as "cards" | "table" | "timeline")}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="cards" className="flex items-center gap-1">
                <Grid3X3 className="h-3 w-3" />
                Cards
              </TabsTrigger>
              <TabsTrigger value="table" className="flex items-center gap-1">
                <List className="h-3 w-3" />
                Table
              </TabsTrigger>
              <TabsTrigger value="timeline" className="flex items-center gap-1">
                <CalendarDays className="h-3 w-3" />
                Timeline
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Activity className="h-4 w-4" />
          {filteredLessons.length} projects
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <Card>
          <CardContent className="p-8">
            <div className="text-center text-muted-foreground">Loading projects...</div>
          </CardContent>
        </Card>
      ) : filteredLessons.length === 0 ? (
        <Card>
          <CardContent className="p-8">
            <div className="text-center text-muted-foreground">
              No projects found matching your filters. 
              <Button variant="link" onClick={() => navigate("/submit-wizard")}>
                Add your first project
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as "cards" | "table" | "timeline")}>
          <TabsContent value="cards">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredLessons.map((lesson) => (
                <ProjectCard key={lesson.id} lesson={lesson} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="table">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Project</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Health</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Satisfaction</TableHead>
                      <TableHead>Budget</TableHead>
                      <TableHead>Timeline</TableHead>
                      <TableHead>Scope Change</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLessons.map((lesson) => {
                      const health = getProjectHealth(lesson);
                      return (
                        <TableRow key={lesson.id}>
                          <TableCell className="font-medium">
                            {lesson.project_name || "Untitled Project"}
                          </TableCell>
                          <TableCell>{lesson.client_name || "—"}</TableCell>
                          <TableCell>
                            <Badge className={`${getHealthColor(health)} border`}>
                              {getHealthIcon(health)}
                              {health === "at-risk" ? "At Risk" : health === "critical" ? "Critical" : "Healthy"}
                            </Badge>
                          </TableCell>
                          <TableCell>{lesson.role || "—"}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3 text-muted-foreground" />
                              {new Date(lesson.created_at).toLocaleDateString()}
                            </div>
                          </TableCell>
                          <TableCell>
                            {lesson.satisfaction ? (
                              <Badge variant="outline">
                                {lesson.satisfaction}/5
                              </Badge>
                            ) : "—"}
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
                          <TableCell>
                            {lesson.scope_change ? (
                              <Badge variant="outline" className="bg-amber-600/10 text-amber-600 border-amber-600/20">
                                Yes
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-emerald-600/10 text-emerald-600 border-emerald-600/20">
                                No
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="timeline">
            <div className="space-y-4">
              {filteredLessons
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                .map((lesson, index) => {
                  const health = getProjectHealth(lesson);
                  const isLast = index === filteredLessons.length - 1;
                  
                  return (
                    <div key={lesson.id} className="relative">
                      {!isLast && <div className="absolute left-4 top-12 bottom-0 w-0.5 bg-border" />}
                      <div className="flex gap-4">
                        <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${getHealthColor(health)}`}>
                          {getHealthIcon(health)}
                        </div>
                        <div className="flex-1 pb-8">
                          <ProjectCard lesson={lesson} />
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}