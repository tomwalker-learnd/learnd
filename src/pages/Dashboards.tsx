// src/pages/Dashboards.tsx
// src/pages/Dashboards.tsx
import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import jsPDF from "jspdf";
import "jspdf-autotable";

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
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw, Plus, Trash, Eye, Download } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type BudgetStatus = "under" | "on" | "over";
type TimelineStatus = "early" | "on" | "late";

type LessonRow = {
  id: string;

  // possible project-ish fields
  project?: string | null;
  project_name?: string | null;
  title?: string | null;
  name?: string | null;

  customer?: string | null;
  date?: string | null;
  created_at?: string | null;
  satisfaction?: number | null;
  budget_status?: BudgetStatus | null;
  timeline_status?: TimelineStatus | null;
  owner?: string | null;

  // possible identity columns in your schema:
  user_id?: string | null;
  profile_id?: string | null;
  owner_id?: string | null;
  created_by?: string | null;
  created_by_id?: string | null;
  created_by_user_id?: string | null;

  tags?: string[] | null;
};

type CustomFilters = {
  dateFrom?: string;
  dateTo?: string;
  customer?: string;
  project?: string;
  budgetStatus?: BudgetStatus;
  timelineStatus?: TimelineStatus;
  satisfactionMin?: number;
  owner?: string;
  tags?: string[];
};

type CustomDashboard = {
  id: string;
  name: string;
  filters: CustomFilters;

  // optional owner fields (used for client-side filtering)
  user_id?: string | null;
  profile_id?: string | null;
  owner_id?: string | null;
  created_by?: string | null;
  created_by_id?: string | null;
  created_by_user_id?: string | null;

  created_at?: string | null;
};

type PresetKey = "last_7" | "last_30" | "last_90" | "this_year";

const todayISO = () => new Date().toISOString().slice(0, 10);
const addDays = (iso: string, d: number) => {
  const x = new Date(iso);
  x.setDate(x.getDate() + d);
  return x.toISOString().slice(0, 10);
};

const PRESETS: Record<
  PresetKey,
  { label: string; dateFrom: string; dateTo: string }
> = (() => {
  const t = todayISO();
  return {
    last_7: { label: "Last 7 days", dateFrom: addDays(t, -7), dateTo: t },
    last_30: { label: "Last 30 days", dateFrom: addDays(t, -30), dateTo: t },
    last_90: { label: "Last 90 days", dateFrom: addDays(t, -90), dateTo: t },
    this_year: {
      label: "This calendar year",
      dateFrom: new Date(new Date().getFullYear(), 0, 1)
        .toISOString()
        .slice(0, 10),
      dateTo: t,
    },
  };
})();

function mergeFilters(
  preset: { dateFrom: string; dateTo: string },
  custom?: CustomFilters | null
): CustomFilters {
  const base = { dateFrom: preset.dateFrom, dateTo: preset.dateTo };
  if (!custom) return base;
  return {
    ...base,
    ...custom,
    dateFrom: custom.dateFrom ?? base.dateFrom,
    dateTo: custom.dateTo ?? base.dateTo,
  };
}

const buildLessonsQuery = (filters: CustomFilters) => {
  const payload = encodeURIComponent(JSON.stringify(filters));
  return `/lessons?${new URLSearchParams({ f: payload }).toString()}`;
};

// Candidate columns to try when filtering
const CANDIDATE_USER_COLS = [
  "user_id",
  "profile_id",
  "owner_id",
  "created_by",
  "created_by_id",
  "created_by_user_id",
] as const;

const CANDIDATE_DATE_COLS = ["date", "created_at"] as const;

export default function Dashboards() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();

  // state
  const [presetKey, setPresetKey] = useState<PresetKey>("last_30");

  const [customList, setCustomList] = useState<CustomDashboard[]>([]);
  const [selectedCustomId, setSelectedCustomId] = useState<string | "">("");
  const [customsError, setCustomsError] = useState<string | null>(null);

  const [lessons, setLessons] = useState<LessonRow[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [dataError, setDataError] = useState<string | null>(null);

  const [activeUserCol, setActiveUserCol] = useState<string>("-");
  const [activeDateCol, setActiveDateCol] = useState<string>("-");
  const [exportingCSV, setExportingCSV] = useState(false);
  const [exportingPDF, setExportingPDF] = useState(false);

  const hasToastedCustomErr = useRef(false);
  const hasToastedDataErr = useRef(false);

  // pick up ?select=<customDashboardId> from URL
  useEffect(() => {
    const sel = searchParams.get("select");
    if (sel) setSelectedCustomId(sel);
  }, [searchParams]);

  // --------- Custom dashboards (presets) ----------
  const fetchCustoms = useCallback(async () => {
    setCustomsError(null);
    // TODO: Re-enable when saved_dashboards table is properly typed
    setCustomList([]);
    return;
  }, [user, toast]);

  useEffect(() => {
    fetchCustoms();
    const onFocus = () => fetchCustoms();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [fetchCustoms]);

  const effectiveFilters = useMemo(() => {
    const preset = PRESETS[presetKey];
    const selected =
      customList.find((c) => c.id === selectedCustomId)?.filters ?? null;
    return mergeFilters(preset, selected);
  }, [presetKey, customList, selectedCustomId]);

  const fetchLessons = useCallback(async () => {
    setLoadingData(true);
    setDataError(null);

    const filters = effectiveFilters;
    console.log("Fetching lessons with filters:", filters);

    try {
      let q = supabase.from("lessons").select("*");

      // Apply user filter (should always be applied for RLS)
      if (user) {
        q = q.eq("created_by", user.id);
      }

      // Apply date filters
      if (filters.dateFrom) {
        const fromDate = filters.dateFrom + "T00:00:00.000Z";
        console.log("Applying dateFrom filter:", fromDate);
        q = q.gte("created_at", fromDate);
      }
      if (filters.dateTo) {
        const toDate = filters.dateTo + "T23:59:59.999Z";
        console.log("Applying dateTo filter:", toDate);
        q = q.lte("created_at", toDate);
      }

      // Other filters
      if (filters.customer) {
        q = q.ilike("client_name", `%${filters.customer}%`);
      }
      if (filters.project) {
        q = q.ilike("project_name", `%${filters.project}%`);
      }
      if (filters.budgetStatus) {
        q = q.eq("budget_status", filters.budgetStatus);
      }
      if (filters.timelineStatus) {
        q = q.eq("timeline_status", filters.timelineStatus);
      }
      if (typeof filters.satisfactionMin === "number") {
        q = q.gte("satisfaction", filters.satisfactionMin);
      }

      const { data, error } = await q.order("created_at", { ascending: false });
      
      if (error) {
        throw error;
      }
      
      console.log("Fetched lessons count:", data?.length || 0);
      setLessons((data || []) as LessonRow[]);
      setActiveUserCol("created_by");
      setActiveDateCol("created_at");
      
    } catch (e: any) {
      const errorMsg = e.message || "Unknown error";
      console.error("Lessons load failed:", errorMsg);
      setLessons([]);
      setDataError(errorMsg);
      if (!hasToastedDataErr.current) {
        toast({ variant: "destructive", title: "Failed to load dashboard data" });
        hasToastedDataErr.current = true;
      }
    } finally {
      setLoadingData(false);
    }
  }, [effectiveFilters, user, toast]);

  useEffect(() => {
    fetchLessons();
  }, [fetchLessons]);

  // --------- Metrics ----------
  const metrics = useMemo(() => {
    const total = lessons.length;

    const satisfVals = lessons
      .map((r) => (typeof r.satisfaction === "number" ? r.satisfaction : null))
      .filter((v): v is number => v !== null);

    const avgSatisfaction = satisfVals.length
      ? Math.round(
          ((satisfVals.reduce((s, v) => s + v, 0) / satisfVals.length) +
            Number.EPSILON) *
            100
        ) / 100
      : 0;

    const onBudgetCount = lessons.filter(
      (l) => l.budget_status === "on" || l.budget_status === "under"
    ).length;
    const onTimeCount = lessons.filter(
      (l) => l.timeline_status === "on" || l.timeline_status === "early"
    ).length;

    return {
      total,
      avgSatisfaction,
      onBudgetPct: total ? Math.round((onBudgetCount / total) * 100) : 0,
      onTimePct: total ? Math.round((onTimeCount / total) * 100) : 0,
    };
  }, [lessons]);

  // --------- Actions ----------
  const handleCreate = () => navigate("/dashboard-customizer");

  const handleDelete = async (id: string) => {
    // TODO: Re-enable when saved_dashboards table is properly typed
    toast({ variant: "destructive", title: "Dashboard deletion temporarily disabled" });
  };

  const handleViewInLessons = () => navigate(buildLessonsQuery(effectiveFilters));

  const getProject = (l: LessonRow): string => {
    const val =
      (l.project && l.project.trim()) ||
      (l.project_name && l.project_name.trim()) ||
      (l.title && l.title.trim()) ||
      (l.name && l.name.trim()) ||
      "";
    return val || "—";
  };

  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        month: '2-digit', 
        day: '2-digit', 
        year: 'numeric' 
      });
    } catch {
      return dateString.slice(0, 10);
    }
  };

  const generateTimestamp = (): string => {
    const now = new Date();
    return now.toISOString()
      .slice(0, 16)
      .replace(/T/, '-')
      .replace(/:/g, '-');
  };

  const getFiltersSummary = (): string[] => {
    const summary = [];
    const preset = PRESETS[presetKey];
    const selectedCustom = customList.find((c) => c.id === selectedCustomId);
    
    summary.push(`Preset: ${preset.label}`);
    if (selectedCustom) {
      summary.push(`Custom Dashboard: ${selectedCustom.name}`);
    }
    summary.push(`Date Range: ${formatDate(effectiveFilters.dateFrom)} - ${formatDate(effectiveFilters.dateTo)}`);
    
    if (effectiveFilters.customer) summary.push(`Customer: ${effectiveFilters.customer}`);
    if (effectiveFilters.project) summary.push(`Project: ${effectiveFilters.project}`);
    if (effectiveFilters.budgetStatus) summary.push(`Budget Status: ${effectiveFilters.budgetStatus}`);
    if (effectiveFilters.timelineStatus) summary.push(`Timeline Status: ${effectiveFilters.timelineStatus}`);
    if (typeof effectiveFilters.satisfactionMin === 'number') {
      summary.push(`Min Satisfaction: ${effectiveFilters.satisfactionMin}`);
    }
    
    return summary;
  };

  const handleExportCSV = async () => {
    if (lessons.length === 0) {
      toast({
        variant: "destructive",
        title: "No data to export",
        description: "There are no lessons in the current view.",
      });
      return;
    }

    setExportingCSV(true);
    try {
      const headers = [
        "Project",
        "Client",
        "Date",
        "Satisfaction",
        "Budget Status", 
        "Timeline Status",
        "Role",
        "Description",
        "Quality Rating",
        "Budget Amount",
        "Final Budget",
        "Scope Changes",
        "Notes",
        "Tags",
        "Created By"
      ];

      const csvContent = [
        headers.join(","),
        ...lessons.map(lesson => [
          `"${getProject(lesson)}"`,
          `"${(lesson as any).client_name || ''}"`,
          `"${formatDate((lesson as any)[activeDateCol] || lesson.created_at || lesson.date)}"`,
          `"${lesson.satisfaction || ''}"`,
          `"${lesson.budget_status || ''}"`,
          `"${lesson.timeline_status || ''}"`,
          `"${(lesson as any).role || ''}"`,
          `"${((lesson as any).description || '').replace(/"/g, '""')}"`,
          `"${(lesson as any).quality_rating || ''}"`,
          `"${(lesson as any).budget_amount || ''}"`,
          `"${(lesson as any).final_budget || ''}"`,
          `"${(lesson as any).scope_changes || ''}"`,
          `"${((lesson as any).notes || '').replace(/"/g, '""')}"`,
          `"${Array.isArray(lesson.tags) ? lesson.tags.join('; ') : ''}"`,
          `"${lesson.created_by || lesson.owner || ''}"`,
        ].join(","))
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `dashboard-export-${generateTimestamp()}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Export successful",
        description: `Exported ${lessons.length} lessons to CSV`,
      });
    } catch (error) {
      console.error("CSV export failed:", error);
      toast({
        variant: "destructive",
        title: "Export failed",
        description: "An error occurred while exporting to CSV",
      });
    } finally {
      setExportingCSV(false);
    }
  };

  const handleExportPDF = async () => {
    if (lessons.length === 0) {
      toast({
        variant: "destructive", 
        title: "No data to export",
        description: "There are no lessons in the current view.",
      });
      return;
    }

    setExportingPDF(true);
    try {
      const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm", 
        format: "a4"
      });

      // Header
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("Dashboard Export Report", 14, 20);
      
      // Export info
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);

      // Filters Summary
      const filtersSummary = getFiltersSummary();
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Applied Filters:", 14, 45);
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      let yPos = 52;
      filtersSummary.forEach(filter => {
        doc.text(`• ${filter}`, 14, yPos);
        yPos += 5;
      });

      // KPI Summary
      yPos += 10;
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Summary Metrics:", 14, yPos);
      
      yPos += 10;
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Total Lessons: ${metrics.total}`, 14, yPos);
      doc.text(`Avg. Satisfaction: ${metrics.avgSatisfaction.toFixed(2)}`, 80, yPos);
      doc.text(`On Budget: ${metrics.onBudgetPct}%`, 160, yPos);
      doc.text(`On Time: ${metrics.onTimePct}%`, 220, yPos);

      // Lessons Table
      yPos += 15;
      const tableData = lessons.map(lesson => [
        getProject(lesson),
        (lesson as any).client_name || '',
        formatDate((lesson as any)[activeDateCol] || lesson.created_at || lesson.date),
        lesson.satisfaction?.toString() || '',
        lesson.budget_status || '',
        lesson.timeline_status || ''
      ]);

      (doc as any).autoTable({
        head: [["Project", "Client", "Date", "Satisfaction", "Budget", "Timeline"]],
        body: tableData,
        startY: yPos,
        styles: { 
          fontSize: 9,
          cellPadding: 2,
        },
        headStyles: { 
          fillColor: [64, 64, 64],
          textColor: 255,
          fontStyle: "bold"
        },
        alternateRowStyles: { 
          fillColor: [240, 240, 240] 
        },
        margin: { left: 14, right: 14 },
        columnStyles: {
          0: { cellWidth: 50 },
          1: { cellWidth: 40 },
          2: { cellWidth: 25 },
          3: { cellWidth: 20 },
          4: { cellWidth: 20 },
          5: { cellWidth: 20 }
        }
      });

      doc.save(`dashboard-export-${generateTimestamp()}.pdf`);

      toast({
        title: "Export successful",
        description: `Exported dashboard report with ${lessons.length} lessons to PDF`,
      });
    } catch (error) {
      console.error("PDF export failed:", error);
      toast({
        variant: "destructive",
        title: "Export failed", 
        description: "An error occurred while exporting to PDF",
      });
    } finally {
      setExportingPDF(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 text-sm text-muted-foreground">Checking session…</div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <DashboardHeader
        title="Dashboards"
        description="Preset cuts of your lessons data. Filter here, or jump to the Lessons page for finer control."
      />

      <Card className="mt-4">
        <CardHeader className="pb-2">
          <CardTitle>Preset</CardTitle>
          <CardDescription>
            All lessons from the selected window (plus any custom filters).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-3 justify-between">
            {/* LEFT: selectors */}
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <div className="text-sm mb-1 font-medium text-muted-foreground">
                  Select preset
                </div>
                <Select
                  value={presetKey}
                  onValueChange={(v: PresetKey) => setPresetKey(v)}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select…" />
                  </SelectTrigger>
                  <SelectContent className="z-50">
                    {(Object.keys(PRESETS) as PresetKey[]).map((k) => (
                      <SelectItem key={k} value={k}>
                        {PRESETS[k].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Custom dashboards + inline error */}
              <div>
                <div className="text-sm mb-1 font-medium text-muted-foreground">
                  Custom dashboards
                </div>
                <div className="flex items-center gap-2">
                  <Select
                    value={selectedCustomId}
                    onValueChange={(v) => setSelectedCustomId(v)}
                    disabled={!!customsError || customList.length === 0}
                  >
                    <SelectTrigger className="w-[260px]">
                      <SelectValue
                        placeholder={
                          customsError
                            ? "Error loading"
                            : customList.length
                            ? "Choose a custom dashboard"
                            : "No custom dashboards yet"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent className="z-[60] max-h-72">
                      {customList.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {customsError && (
                    <span className="text-xs text-destructive whitespace-nowrap">
                      Could not load custom dashboards.
                    </span>
                  )}
                </div>
              </div>

              {selectedCustomId && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setDeleteId(selectedCustomId)}
                    >
                      <Trash className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete this dashboard?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => deleteId && handleDelete(deleteId)}
                        className="bg-destructive text-destructive-foreground hover:opacity-95"
                      >
                        Yes, delete it
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>

            {/* RIGHT: actions */}
            <div className="flex flex-wrap items-center gap-2">
              <Button 
                onClick={fetchLessons}
                style={{ backgroundColor: '#fa7c0b', color: 'white' }}
                className="hover:opacity-90"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
              <Button 
                onClick={handleViewInLessons}
                style={{ backgroundColor: '#e13f40', color: 'white' }}
                className="hover:opacity-90"
              >
                <Eye className="mr-2 h-4 w-4" />
                View in Lessons
              </Button>
              
              {/* Export Dropdown */}
              <div className="relative group">
                <Button
                  style={{ backgroundColor: '#0d3240', color: 'white' }}
                  className="hover:opacity-90"
                  disabled={loadingData || lessons.length === 0}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export Current View
                </Button>
                <div className="absolute right-0 top-full mt-1 bg-background border rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 min-w-[140px]">
                  <button
                    onClick={handleExportCSV}
                    disabled={exportingCSV || loadingData || lessons.length === 0}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-accent rounded-t-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {exportingCSV ? "Exporting..." : "Export as CSV"}
                  </button>
                  <button
                    onClick={handleExportPDF}
                    disabled={exportingPDF || loadingData || lessons.length === 0}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-accent rounded-b-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {exportingPDF ? "Exporting..." : "Export as PDF"}
                  </button>
                </div>
              </div>

              <Button
                onClick={handleCreate}
                style={{ backgroundColor: '#ca0573', color: 'white' }}
                className="hover:opacity-90"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Custom Dashboard
              </Button>
            </div>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <Card>
              <CardContent className="p-6">
                <div className="text-sm text-muted-foreground">Total</div>
                <div className="text-5xl font-semibold mt-2">
                  {loadingData ? "…" : metrics.total}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="text-sm text-muted-foreground">
                  Avg. Satisfaction
                </div>
                <div className="text-5xl font-semibold mt-2">
                  {loadingData
                    ? "…"
                    : metrics.avgSatisfaction.toFixed(2).replace(/\.00$/, "")}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="text-sm text-muted-foreground">On Budget</div>
                <div className="text-5xl font-semibold mt-2">
                  {loadingData ? "…" : `${metrics.onBudgetPct}%`}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="text-sm text-muted-foreground">On Time</div>
                <div className="text-5xl font-semibold mt-2">
                  {loadingData ? "…" : `${metrics.onTimePct}%`}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent list */}
          <div className="pt-4">
            <div className="text-sm font-medium text-muted-foreground mb-2">
              Recent items
            </div>
            <div className="rounded-lg border">
              <div className="grid grid-cols-5 text-xs uppercase tracking-wide text-muted-foreground border-b px-3 py-2">
                <div className="col-span-2">Project</div>
                <div>Date</div>
                <div>Budget</div>
                <div>Timeline</div>
              </div>
              {lessons.slice(0, 6).map((l) => {
                const dateVal =
                  ((l as any)[activeDateCol] as string | undefined) ??
                  l.created_at ??
                  l.date ??
                  "";
                return (
                  <div
                    key={l.id}
                    className="grid grid-cols-5 px-3 py-2 border-b last:border-b-0 text-sm"
                  >
                    <div className="col-span-2 truncate">{getProject(l)}</div>
                    <div>{(dateVal || "").slice(0, 10)}</div>
                    <div>{l.budget_status?.toUpperCase?.() ?? "—"}</div>
                    <div>{l.timeline_status?.toUpperCase?.() ?? "—"}</div>
                  </div>
                );
              })}
              {lessons.length === 0 && !loadingData && (
                <div className="px-3 py-6 text-sm text-muted-foreground">
                  {dataError
                    ? "No data due to a query error. Check table/column names or RLS."
                    : "No data in this view."}
                </div>
              )}
            </div>
            {dataError && (
              <div className="text-xs text-destructive mt-2">
                Error loading lessons. Check column names or RLS.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
