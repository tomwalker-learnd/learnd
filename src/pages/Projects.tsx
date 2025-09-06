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
import { 
  Plus, 
  Search, 
  Download, 
  Filter, 
  FileText, 
  BarChart3,
  Lock,
  Calendar
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type BudgetStatus = "under" | "on" | "over";
type TimelineStatus = "early" | "on" | "late";

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
};

export default function Projects() {
  const { user } = useAuth();
  const { canAccessExports } = useUserTier();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBudgetStatus, setSelectedBudgetStatus] = useState<BudgetStatus | "all">("all");
  const [selectedTimelineStatus, setSelectedTimelineStatus] = useState<TimelineStatus | "all">("all");
  const [exportingCSV, setExportingCSV] = useState(false);
  const [exportingPDF, setExportingPDF] = useState(false);

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
      
      return matchesSearch && matchesBudget && matchesTimeline;
    });
  }, [lessons, searchTerm, selectedBudgetStatus, selectedTimelineStatus]);

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

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Project Portfolio</h1>
        <p className="text-muted-foreground">
          Comprehensive project management and tracking.
        </p>
        <div className="mt-3 flex gap-2">
          <Button onClick={() => navigate("/submit-wizard")}>
            <Plus className="mr-2 h-4 w-4" />
            Add Project
          </Button>
          
          <PremiumFeature 
            requiredTier="team"
            fallback={
              <Button variant="outline" disabled className="gap-2">
                <Lock className="h-4 w-4" />
                Export (Paid Feature)
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

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-4">
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
            <Label>Budget Status</Label>
            <Select value={selectedBudgetStatus} onValueChange={(value) => setSelectedBudgetStatus(value as BudgetStatus | "all")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="under">Under Budget</SelectItem>
                <SelectItem value="on">On Budget</SelectItem>
                <SelectItem value="over">Over Budget</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label>Timeline Status</Label>
            <Select value={selectedTimelineStatus} onValueChange={(value) => setSelectedTimelineStatus(value as TimelineStatus | "all")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="early">Early</SelectItem>
                <SelectItem value="on">On Time</SelectItem>
                <SelectItem value="late">Late</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end">
            <Button variant="outline" onClick={() => {
              setSearchTerm("");
              setSelectedBudgetStatus("all");
              setSelectedTimelineStatus("all");
            }}>
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Projects Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Projects ({filteredLessons.length})</CardTitle>
              <CardDescription>
                {filtersFromURL.project_name && `Filtered by: ${filtersFromURL.project_name}`}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Loading projects...</div>
          ) : filteredLessons.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No projects found. <Button variant="link" onClick={() => navigate("/submit-wizard")}>Add your first project</Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Satisfaction</TableHead>
                  <TableHead>Budget</TableHead>
                  <TableHead>Timeline</TableHead>
                  <TableHead>Scope Change</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLessons.map((lesson) => (
                  <TableRow key={lesson.id}>
                    <TableCell className="font-medium">
                      {lesson.project_name || "Untitled Project"}
                    </TableCell>
                    <TableCell>{lesson.client_name || "—"}</TableCell>
                    <TableCell>{lesson.role || "—"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        {new Date(lesson.created_at).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {lesson.satisfaction ? (
                          <Badge variant="outline">
                            {lesson.satisfaction}/5
                          </Badge>
                        ) : "—"}
                      </div>
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
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}