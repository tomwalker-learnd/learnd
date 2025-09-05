// src/pages/Lessons.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Autocomplete } from "@/components/ui/autocomplete";
import { Badge } from "@/components/ui/badge";
import { useAutocomplete } from "@/hooks/useAutocomplete";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw, Download, FileText, FileSpreadsheet, Plus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type BudgetStatus = "under" | "on" | "over";
type TimelineStatus = "early" | "on" | "late";

type LessonRow = {
  id: string;
  project_name: string | null;
  client_name: string | null;
  role: string | null;
  created_at: string; // ISO
  updated_at: string; // ISO
  satisfaction: number | null; // 1..5
  budget_status: BudgetStatus | string | null;
  timeline_status: TimelineStatus | string | null;
  scope_change: boolean | null;
  notes: string | null;
  created_by: string | null;
  project_type: string | null;
  phase: string | null;
  industry: string | null;
  region: string | null;
  billing_model: string | null;
  initial_budget_usd: number | null;
  actual_days: number | null;
  planned_days: number | null;
  requirements_clarity: number | null;
  stakeholder_engagement: number | null;
  team_morale: number | null;
  tooling_effectiveness: number | null;
  internal_comms_effectiveness: number | null;
};

type LessonFilters = {
  projectName: string;
  clientName: string;
  budget: BudgetStatus | "any";
  timeline: TimelineStatus | "any";
  minSatisfaction: string; // UI field
};

type DateWindow = { from?: string; to?: string } | null;

const DEFAULT_FILTERS: LessonFilters = {
  projectName: "",
  clientName: "",
  budget: "any",
  timeline: "any",
  minSatisfaction: "",
};

const SELECT_FIELDS = [
  "id",
  "project_name",
  "client_name", 
  "role",
  "created_at",
  "updated_at",
  "satisfaction",
  "budget_status",
  "timeline_status",
  "scope_change",
  "notes",
  "created_by",
  "project_type",
  "phase", 
  "industry",
  "region",
  "billing_model",
  "initial_budget_usd",
  "actual_days",
  "planned_days",
  "requirements_clarity",
  "stakeholder_engagement", 
  "team_morale",
  "tooling_effectiveness",
  "internal_comms_effectiveness"
].join(", ");

// helpers
const normStr = (v: unknown) =>
  (typeof v === "string" ? v : v == null ? "" : String(v)).trim();

const normBudget = (v: unknown): BudgetStatus | null => {
  const s = normStr(v).toLowerCase();
  return s === "under" || s === "on" || s === "over" ? (s as BudgetStatus) : null;
};

const normTimeline = (v: unknown): TimelineStatus | null => {
  const s = normStr(v).toLowerCase();
  return s === "early" || s === "on" || s === "late" ? (s as TimelineStatus) : null;
};

// Color coding functions
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

const satisfactionColor = (satisfaction: number | null) => {
  if (typeof satisfaction !== "number") return "text-muted-foreground";
  if (satisfaction >= 4) return "text-emerald-600 font-medium";
  if (satisfaction >= 3) return "text-blue-600 font-medium";
  return "text-rose-600 font-medium";
};

export default function Lessons() {
  const { toast } = useToast();
  const [searchParams] = useSearchParams();

  // Autocomplete hooks
  const projectAutocomplete = useAutocomplete({ table: "lessons", column: "project_name" });
  const clientAutocomplete = useAutocomplete({ table: "lessons", column: "client_name" });

  const [rows, setRows] = useState<LessonRow[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<LessonFilters>(DEFAULT_FILTERS);

  const [pageSize, setPageSize] = useState<number>(10);
  const [page, setPage] = useState<number>(1);
  
  // Export states
  const [isExportingCSV, setIsExportingCSV] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  const [dateWindow, setDateWindow] = useState<DateWindow>(null);
  const appliedFromUrlOnce = useRef(false);

  // Parse incoming params from Dashboards/custom dashboards
  const incoming = useMemo(() => {
    const get = (k: string) => (searchParams.get(k) ?? "").trim();
    return {
      from: get("from"),
      to: get("to"),
      q: get("q"),
      b: get("b"), // under|on|over
      t: get("t"), // early|on|late
      min: get("min"), // number as string
      apply: get("apply") === "1",
    };
  }, [searchParams]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from("lessons")
          .select(SELECT_FIELDS)
          .order("created_at", { ascending: false });
        if (error) throw error;
        if (!cancelled) setRows((data as unknown as LessonRow[]) ?? []);
      } catch (e: any) {
        console.error("Lessons load failed:", e);
        toast({
          title: "Load failed",
          description: e?.message ?? "Unable to load lessons.",
          variant: "destructive",
        });
        if (!cancelled) setRows([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [toast]);

  // Prefill from URL; only APPLY the date window when apply=1
  useEffect(() => {
    const hasAny =
      incoming.from || incoming.to || incoming.q || incoming.b || incoming.t || incoming.min;

    if (!hasAny) return;

    // Prefill controls - map single 'q' to both project and client for backward compatibility
    setFilters((prev) => ({
      ...prev,
      projectName: incoming.q || "",
      clientName: "",
      budget: (incoming.b as any) || "any",
      timeline: (incoming.t as any) || "any",
      minSatisfaction: incoming.min || "",
    }));

    if (incoming.apply && !appliedFromUrlOnce.current) {
      setDateWindow({
        from: incoming.from || undefined,
        to: incoming.to || undefined,
      });
      appliedFromUrlOnce.current = true;
    }
  }, [incoming]);

  // Is the user actively filtering?
  const hasUiFilters = useMemo(() => {
    return (
      filters.projectName.trim() !== "" ||
      filters.clientName.trim() !== "" ||
      filters.budget !== "any" ||
      filters.timeline !== "any" ||
      filters.minSatisfaction.trim() !== ""
    );
  }, [filters]);

  // Show ALL rows by default; only narrow when UI filters are used,
  // or when a dateWindow was explicitly applied via apply=1.
  const filtered = useMemo(() => {
    if (!rows) return [];

    const useDateWindow = !!(dateWindow && (dateWindow.from || dateWindow.to));
    if (!hasUiFilters && !useDateWindow) return rows;

    const projectSearch = filters.projectName.trim().toLowerCase();
    const clientSearch = filters.clientName.trim().toLowerCase();
    const uiMinSat =
      filters.minSatisfaction.trim() === "" ? null : Number(filters.minSatisfaction);
    const useUiMinSat = Number.isFinite(uiMinSat as number) ? (uiMinSat as number) : null;

    const fromT = useDateWindow && dateWindow?.from ? new Date(dateWindow.from).getTime() : null;
    const toT = useDateWindow && dateWindow?.to ? new Date(dateWindow.to).getTime() : null;

    return rows.filter((r) => {
      // Date window from dashboards (only if applied)
      if (useDateWindow) {
        const t = new Date(r.created_at).getTime();
        if (fromT && t < fromT) return false;
        if (toT && t > toT) return false;
      }

      // project name search
      if (projectSearch) {
        const projectName = (r.project_name ?? "").toLowerCase();
        if (!projectName.includes(projectSearch)) return false;
      }

      // client name search
      if (clientSearch) {
        const clientName = (r.client_name ?? "").toLowerCase();
        if (!clientName.includes(clientSearch)) return false;
      }

      // budget
      if (filters.budget !== "any") {
        const b = normBudget(r.budget_status);
        if (b !== filters.budget) return false;
      }

      // timeline
      if (filters.timeline !== "any") {
        const tl = normTimeline(r.timeline_status);
        if (tl !== filters.timeline) return false;
      }

      // min satisfaction
      if (useUiMinSat !== null) {
        if (typeof r.satisfaction !== "number" || r.satisfaction < useUiMinSat) return false;
      }

      return true;
    });
  }, [rows, filters, dateWindow, hasUiFilters]);

  // Pagination
  useEffect(() => {
    setPage(1);
  }, [filters, pageSize, dateWindow]);

  const total = filtered.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, pageCount);
  const startIndex = (safePage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, total);
  const pageRows = useMemo(() => filtered.slice(startIndex, endIndex), [filtered, startIndex, endIndex]);

  const onRefresh = () => setFilters({ ...filters });

  // Export functions
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: '2-digit', 
      day: '2-digit', 
      year: 'numeric' 
    });
  };

  const exportToCSV = async () => {
    setIsExportingCSV(true);
    try {
      const headers = [
        'Project Name', 'Client Name', 'Role', 'Created Date', 'Updated Date', 
        'Satisfaction', 'Budget Status', 'Timeline Status', 'Scope Change', 
        'Notes', 'Created By', 'Project Type', 'Phase', 'Industry', 'Region',
        'Billing Model', 'Initial Budget (USD)', 'Actual Days', 'Planned Days',
        'Requirements Clarity', 'Stakeholder Engagement', 'Team Morale', 
        'Tooling Effectiveness', 'Internal Comms Effectiveness'
      ];
      
      const csvContent = [
        headers.join(','),
        ...filtered.map(row => [
          `"${(row.project_name || '').replace(/"/g, '""')}"`,
          `"${(row.client_name || '').replace(/"/g, '""')}"`,
          `"${(row.role || '').replace(/"/g, '""')}"`,
          formatDate(row.created_at),
          formatDate(row.updated_at),
          row.satisfaction || '',
          row.budget_status || '',
          row.timeline_status || '',
          row.scope_change ? 'Yes' : 'No',
          `"${(row.notes || '').replace(/"/g, '""')}"`,
          row.created_by || '',
          `"${(row.project_type || '').replace(/"/g, '""')}"`,
          `"${(row.phase || '').replace(/"/g, '""')}"`,
          `"${(row.industry || '').replace(/"/g, '""')}"`,
          `"${(row.region || '').replace(/"/g, '""')}"`,
          `"${(row.billing_model || '').replace(/"/g, '""')}"`,
          row.initial_budget_usd || '',
          row.actual_days || '',
          row.planned_days || '',
          row.requirements_clarity || '',
          row.stakeholder_engagement || '',
          row.team_morale || '',
          row.tooling_effectiveness || '',
          row.internal_comms_effectiveness || ''
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      const timestamp = new Date().toISOString().slice(0, 16).replace('T', '-').replace(':', '-');
      link.setAttribute('download', `lessons-export-${timestamp}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Export Complete",
        description: `Exported ${filtered.length} lessons to CSV`,
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export CSV file",
        variant: "destructive",
      });
    } finally {
      setIsExportingCSV(false);
    }
  };

  const exportToPDF = async () => {
    setIsExportingPDF(true);
    try {
      const doc = new jsPDF('l', 'mm', 'a4'); // landscape orientation for more columns
      let currentY = 20;
      
      // Title
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('Lessons Learned Report', 14, currentY);
      currentY += 15;
      
      // Subtitle and export info
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Generated on: ${formatDate(new Date().toISOString())}`, 14, currentY);
      currentY += 8;
      
      // Applied Filters Section
      if (hasUiFilters || (dateWindow && (dateWindow.from || dateWindow.to))) {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Applied Filters:', 14, currentY);
        currentY += 8;
        
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        
        // Date window filters
        if (dateWindow && (dateWindow.from || dateWindow.to)) {
          const fromDate = dateWindow.from ? formatDate(dateWindow.from) : 'Not specified';
          const toDate = dateWindow.to ? formatDate(dateWindow.to) : 'Not specified';
          doc.text(`• Date Range: ${fromDate} to ${toDate}`, 18, currentY);
          currentY += 6;
        }
        
        // UI filters
        if (filters.projectName.trim()) {
          doc.text(`• Project Name: "${filters.projectName}"`, 18, currentY);
          currentY += 6;
        }
        if (filters.clientName.trim()) {
          doc.text(`• Client Name: "${filters.clientName}"`, 18, currentY);
          currentY += 6;
        }
        if (filters.budget !== 'any') {
          doc.text(`• Budget Status: ${filters.budget}`, 18, currentY);
          currentY += 6;
        }
        if (filters.timeline !== 'any') {
          doc.text(`• Timeline Status: ${filters.timeline}`, 18, currentY);
          currentY += 6;
        }
        if (filters.minSatisfaction.trim()) {
          doc.text(`• Minimum Satisfaction: ${filters.minSatisfaction}/5`, 18, currentY);
          currentY += 6;
        }
        currentY += 5;
      }
      
      // Summary statistics
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Summary:', 14, currentY);
      currentY += 8;
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`Total Records: ${filtered.length} ${rows ? `of ${rows.length}` : ''}`, 18, currentY);
      currentY += 6;
      
      // Calculate some basic stats
      const avgSatisfaction = filtered.length > 0 ? 
        (filtered.reduce((sum, row) => sum + (row.satisfaction || 0), 0) / filtered.filter(r => r.satisfaction).length).toFixed(1) : 'N/A';
      const budgetBreakdown = filtered.reduce((acc, row) => {
        const status = row.budget_status || 'unknown';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      doc.text(`Average Satisfaction: ${avgSatisfaction}/5`, 18, currentY);
      currentY += 6;
      
      const budgetText = Object.entries(budgetBreakdown)
        .map(([status, count]) => `${status}: ${count}`)
        .join(', ');
      if (budgetText) {
        doc.text(`Budget Status Distribution: ${budgetText}`, 18, currentY);
        currentY += 10;
      }

      // Prepare table data
      const tableData = filtered.map(row => [
        row.project_name || '—',
        row.client_name || '—',
        row.role || '—',
        formatDate(row.created_at),
        row.satisfaction?.toString() || '—',
        row.budget_status || '—',
        row.timeline_status || '—',
        row.scope_change ? 'Yes' : 'No',
        row.project_type || '—',
        row.industry || '—',
        row.initial_budget_usd ? `$${row.initial_budget_usd.toLocaleString()}` : '—',
        row.actual_days?.toString() || '—'
      ]);

      // Table with professional styling
      autoTable(doc, {
        head: [[
          'Project', 'Client', 'Role', 'Date Created', 'Satisfaction', 'Budget Status', 
          'Timeline', 'Scope Change', 'Project Type', 'Industry', 'Budget', 'Days'
        ]],
        body: tableData,
        startY: currentY,
        styles: { 
          fontSize: 8,
          cellPadding: 3,
          lineColor: [200, 200, 200],
          lineWidth: 0.1
        },
        headStyles: {
          fillColor: [66, 139, 202],
          textColor: 255,
          fontStyle: 'bold',
          fontSize: 8
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245]
        },
        columnStyles: {
          0: { cellWidth: 24 }, // Project
          1: { cellWidth: 20 }, // Client  
          2: { cellWidth: 16 }, // Role
          3: { cellWidth: 18 }, // Date
          4: { cellWidth: 14 }, // Satisfaction
          5: { cellWidth: 18 }, // Budget Status
          6: { cellWidth: 16 }, // Timeline
          7: { cellWidth: 16 }, // Scope Change
          8: { cellWidth: 18 }, // Project Type
          9: { cellWidth: 16 }, // Industry
          10: { cellWidth: 18 }, // Budget
          11: { cellWidth: 12 }  // Days
        },
        margin: { left: 14, right: 14 },
        didDrawPage: (data) => {
          // Add page numbers
          doc.setFontSize(8);
          doc.text(`Page ${data.pageNumber}`, doc.internal.pageSize.width - 25, doc.internal.pageSize.height - 10);
        }
      });

      const timestamp = new Date().toISOString().slice(0, 16).replace('T', '-').replace(':', '-');
      doc.save(`lessons-report-${timestamp}.pdf`);

      toast({
        title: "Export Complete",
        description: `Exported ${filtered.length} lessons to PDF`,
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export PDF file",
        variant: "destructive",
      });
    } finally {
      setIsExportingPDF(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <div>
              <CardTitle>Lessons</CardTitle>
              <CardDescription>Filter, browse, and analyze recent lessons.</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {dateWindow && (dateWindow.from || dateWindow.to) ? (
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-muted px-2 py-1 text-xs">
                    From dashboard:{" "}
                    {dateWindow.from ? new Date(dateWindow.from).toLocaleDateString() : "…"}
                    {" – "}
                    {dateWindow.to ? new Date(dateWindow.to).toLocaleDateString() : "…"}
                  </span>
                  <Button size="sm" variant="ghost" onClick={() => setDateWindow(null)}>
                    Clear
                  </Button>
                </div>
              ) : null}
              
              {/* Export buttons */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={filtered.length === 0}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem 
                    onClick={exportToCSV}
                    disabled={isExportingCSV || filtered.length === 0}
                  >
                    {isExportingCSV ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Exporting CSV...
                      </>
                    ) : (
                      <>
                        <FileSpreadsheet className="h-4 w-4 mr-2" />
                        Export as CSV
                      </>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={exportToPDF}
                    disabled={isExportingPDF || filtered.length === 0}
                  >
                    {isExportingPDF ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Exporting PDF...
                      </>
                    ) : (
                      <>
                        <FileText className="h-4 w-4 mr-2" />
                        Export as PDF
                      </>
                    )}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <Button
                onClick={() => {
                  setFilters(DEFAULT_FILTERS);
                  setDateWindow(null);
                }}
                style={{ backgroundColor: '#0d3240', color: 'white' }}
                className="hover:opacity-90"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters (UI) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Project</Label>
              <Autocomplete
                value={filters.projectName}
                onValueChange={(value) => {
                  setFilters((prev) => ({ ...prev, projectName: value }));
                  projectAutocomplete.getSuggestions(value);
                }}
                placeholder="Search projects..."
                suggestions={projectAutocomplete.suggestions}
                loading={projectAutocomplete.loading}
              />
            </div>

            <div className="space-y-2">
              <Label>Client</Label>
              <Autocomplete
                value={filters.clientName}
                onValueChange={(value) => {
                  setFilters((prev) => ({ ...prev, clientName: value }));
                  clientAutocomplete.getSuggestions(value);
                }}
                placeholder="Search clients..."
                suggestions={clientAutocomplete.suggestions}
                loading={clientAutocomplete.loading}
              />
            </div>

            <div className="space-y-2">
              <Label>Budget</Label>
              <Select
                value={filters.budget}
                onValueChange={(v) =>
                  setFilters((prev) => ({
                    ...prev,
                    budget: (normStr(v).toLowerCase() as LessonFilters["budget"]) || "any",
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Any" />
                </SelectTrigger>
                <SelectContent className="bg-background border shadow-lg z-50">
                  <SelectItem value="any">Any</SelectItem>
                  <SelectItem value="under">Under</SelectItem>
                  <SelectItem value="on">On</SelectItem>
                  <SelectItem value="over">Over</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Timeline</Label>
              <Select
                value={filters.timeline}
                onValueChange={(v) =>
                  setFilters((prev) => ({
                    ...prev,
                    timeline: (normStr(v).toLowerCase() as LessonFilters["timeline"]) || "any",
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Any" />
                </SelectTrigger>
                <SelectContent className="bg-background border shadow-lg z-50">
                  <SelectItem value="any">Any</SelectItem>
                  <SelectItem value="early">Early</SelectItem>
                  <SelectItem value="on">On</SelectItem>
                  <SelectItem value="late">Late</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="minSat">Min Satisfaction</Label>
              <Input
                id="minSat"
                type="number"
                min={1}
                max={5}
                step={1}
                inputMode="numeric"
                placeholder="1–5 (e.g., 4)"
                value={filters.minSatisfaction}
                onChange={(e) => setFilters((prev) => ({ ...prev, minSatisfaction: e.target.value }))}
              />
            </div>
          </div>

          <div className="mt-4">
            <Button
              style={{ backgroundColor: '#ca0573', color: 'white' }}
              className="hover:opacity-90"
            >
              <Plus className="mr-2 h-4 w-4" />
              Submit
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Results</CardTitle>
            <div className="text-sm text-muted-foreground">
              {rows === null ? "Loading…" : `${total} of ${rows.length} shown`}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* MOBILE: cards */}
          <div className="md:hidden space-y-3">
            {pageRows.length === 0 ? (
              <Card><CardContent className="py-6 text-muted-foreground">No lessons found.</CardContent></Card>
            ) : (
              pageRows.map((r) => (
                <Card key={r.id}>
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="font-medium">{r.project_name || "Untitled Project"}</div>
                      <div className="text-xs text-muted-foreground">{formatDate(r.created_at)}</div>
                    </div>
                    {r.client_name && (
                      <div className="text-sm text-muted-foreground mt-1">{r.client_name}</div>
                    )}
                    <div className="mt-2 flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className={badgeTone(normBudget(r.budget_status))}>
                        {normBudget(r.budget_status) ?? "—"}
                      </Badge>
                      <Badge variant="outline" className={badgeTone(normTimeline(r.timeline_status))}>
                        {normTimeline(r.timeline_status) ?? "—"}
                      </Badge>
                      <span className={`text-xs ${satisfactionColor(r.satisfaction)}`}>
                        Satisfaction: {typeof r.satisfaction === "number" ? r.satisfaction : "—"}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* DESKTOP: table */}
          <div className="hidden md:block">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Satisfaction</TableHead>
                    <TableHead>Budget</TableHead>
                    <TableHead>Timeline</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pageRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                        No lessons found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    pageRows.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="whitespace-nowrap font-medium">{r.project_name ?? "—"}</TableCell>
                        <TableCell className="whitespace-nowrap">{r.client_name ?? "—"}</TableCell>
                        <TableCell className="text-muted-foreground">{formatDate(r.created_at)}</TableCell>
                        <TableCell className={satisfactionColor(r.satisfaction)}>
                          {typeof r.satisfaction === "number" ? r.satisfaction : "—"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={badgeTone(normBudget(r.budget_status))}>
                            {normBudget(r.budget_status) ?? "—"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={badgeTone(normTimeline(r.timeline_status))}>
                            {normTimeline(r.timeline_status) ?? "—"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Pagination */}
          <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Label className="text-sm">Rows per page</Label>
                <Select value={String(pageSize)} onValueChange={(v) => setPageSize(Number(v))}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                    <SelectItem value="250">250</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="text-xs text-muted-foreground">
                {total === 0 ? "0 of 0" : `${startIndex + 1}–${endIndex} of ${total}`}
              </div>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(1)}
                disabled={safePage <= 1}
                aria-label="First page"
                title="First page"
              >
                «
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage <= 1}
              >
                Prev
              </Button>
              <div className="px-2 text-sm text-muted-foreground">
                Page {safePage} of {pageCount}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                disabled={safePage >= pageCount}
              >
                Next
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(pageCount)}
                disabled={safePage >= pageCount}
                aria-label="Last page"
                title="Last page"
              >
                »
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
