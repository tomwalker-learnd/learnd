import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useUserTier } from "@/hooks/useUserTier";
import { supabase } from "@/integrations/supabase/client";
import { PremiumFeature, FeatureBadge } from "@/components/premium";

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
import { 
  Download, 
  FileText, 
  Mail, 
  Share2, 
  Calendar,
  Lock,
  RefreshCw,
  BarChart3,
  TrendingUp
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type ReportType = "executive" | "detailed" | "client" | "custom";
type ReportFormat = "pdf" | "csv" | "excel";

type Lesson = {
  id: string;
  project_name: string | null;
  client_name: string | null;
  satisfaction: number | null;
  budget_status: "under" | "on" | "over" | null;
  timeline_status: "early" | "on" | "late" | null;
  scope_change: boolean | null;
  created_at: string;
  role: string | null;
  notes: string | null;
};

export default function Reports() {
  const { user } = useAuth();
  const { canAccessExports } = useUserTier();
  const { toast } = useToast();

  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [reportType, setReportType] = useState<ReportType>("executive");
  const [reportFormat, setReportFormat] = useState<ReportFormat>("pdf");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [clientFilter, setClientFilter] = useState("");

  useEffect(() => {
    if (user) loadData();
    
    // Set default date range to last 30 days
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    setDateTo(today.toISOString().split('T')[0]);
    setDateFrom(thirtyDaysAgo.toISOString().split('T')[0]);
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
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
      
      return dateMatch && clientMatch;
    });
  }, [lessons, dateFrom, dateTo, clientFilter]);

  const analytics = useMemo(() => {
    if (!filteredLessons.length) return null;

    const total = filteredLessons.length;
    const avgSatisfaction = filteredLessons.reduce((sum, l) => sum + (l.satisfaction || 0), 0) / total;
    
    const onBudget = filteredLessons.filter(l => l.budget_status === 'on' || l.budget_status === 'under').length;
    const onTime = filteredLessons.filter(l => l.timeline_status === 'on' || l.timeline_status === 'early').length;
    const scopeChanges = filteredLessons.filter(l => l.scope_change).length;
    
    const clients = [...new Set(filteredLessons.map(l => l.client_name).filter(Boolean))];
    
    return {
      total,
      avgSatisfaction: avgSatisfaction.toFixed(1),
      onBudgetRate: ((onBudget / total) * 100).toFixed(1),
      onTimeRate: ((onTime / total) * 100).toFixed(1),
      scopeChangeRate: ((scopeChanges / total) * 100).toFixed(1),
      clientCount: clients.length
    };
  }, [filteredLessons]);

  const generateExecutiveReport = () => {
    if (!analytics) return;

    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("Executive Summary Report", 20, 25);
    
    // Date range
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(`Report Period: ${dateFrom || 'All time'} to ${dateTo || 'Present'}`, 20, 40);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 50);
    
    // Key metrics
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Key Performance Indicators", 20, 70);
    
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    const metrics = [
      `Total Projects: ${analytics.total}`,
      `Average Satisfaction: ${analytics.avgSatisfaction}/5.0`,
      `On Budget Rate: ${analytics.onBudgetRate}%`,
      `On Time Rate: ${analytics.onTimeRate}%`,
      `Scope Change Rate: ${analytics.scopeChangeRate}%`,
      `Active Clients: ${analytics.clientCount}`
    ];
    
    metrics.forEach((metric, index) => {
      doc.text(metric, 25, 85 + (index * 10));
    });
    
    // Recommendations section
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Strategic Recommendations", 20, 160);
    
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    const recommendations = [];
    
    if (parseFloat(analytics.avgSatisfaction) < 4.0) {
      recommendations.push("• Focus on client satisfaction improvement initiatives");
    }
    if (parseFloat(analytics.onBudgetRate) < 80) {
      recommendations.push("• Review budget estimation and project scoping processes");
    }
    if (parseFloat(analytics.scopeChangeRate) > 30) {
      recommendations.push("• Implement stronger change control procedures");
    }
    if (recommendations.length === 0) {
      recommendations.push("• Performance metrics are within target ranges");
      recommendations.push("• Continue current operational practices");
    }
    
    recommendations.forEach((rec, index) => {
      doc.text(rec, 25, 175 + (index * 10));
    });
    
    doc.save(`executive-report-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const generateDetailedReport = () => {
    const doc = new jsPDF({ orientation: 'landscape' });
    
    // Header
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Detailed Project Report", 20, 20);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 30);
    
    // Table data
    const tableData = filteredLessons.map(lesson => [
      lesson.project_name || 'Untitled',
      lesson.client_name || '—',
      lesson.role || '—',
      new Date(lesson.created_at).toLocaleDateString(),
      lesson.satisfaction?.toString() || '—',
      lesson.budget_status || '—',
      lesson.timeline_status || '—',
      lesson.scope_change ? 'Yes' : 'No'
    ]);
    
    autoTable(doc, {
      head: [['Project', 'Client', 'Role', 'Date', 'Satisfaction', 'Budget', 'Timeline', 'Scope Change']],
      body: tableData,
      startY: 40,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [66, 139, 202] }
    });
    
    doc.save(`detailed-report-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const generateClientReport = () => {
    if (!clientFilter) {
      toast({
        title: "Client filter required",
        description: "Please select a specific client for client reports",
        variant: "destructive"
      });
      return;
    }

    const clientLessons = filteredLessons.filter(l => 
      l.client_name?.toLowerCase().includes(clientFilter.toLowerCase())
    );

    if (clientLessons.length === 0) {
      toast({
        title: "No data found",
        description: "No projects found for the specified client",
        variant: "destructive"
      });
      return;
    }

    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text(`Client Report: ${clientFilter}`, 20, 25);
    
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(`Report Period: ${dateFrom || 'All time'} to ${dateTo || 'Present'}`, 20, 40);
    
    // Client metrics
    const clientAvgSatisfaction = clientLessons.reduce((sum, l) => sum + (l.satisfaction || 0), 0) / clientLessons.length;
    const clientOnBudget = clientLessons.filter(l => l.budget_status === 'on' || l.budget_status === 'under').length;
    const clientOnTime = clientLessons.filter(l => l.timeline_status === 'on' || l.timeline_status === 'early').length;
    
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Performance Summary", 20, 60);
    
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    const clientMetrics = [
      `Total Projects: ${clientLessons.length}`,
      `Average Satisfaction: ${clientAvgSatisfaction.toFixed(1)}/5.0`,
      `On Budget Rate: ${((clientOnBudget / clientLessons.length) * 100).toFixed(1)}%`,
      `On Time Rate: ${((clientOnTime / clientLessons.length) * 100).toFixed(1)}%`
    ];
    
    clientMetrics.forEach((metric, index) => {
      doc.text(metric, 25, 75 + (index * 10));
    });
    
    doc.save(`client-report-${clientFilter.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const generateReport = async () => {
    if (!canAccessExports) return;
    
    setGenerating(true);
    try {
      switch (reportType) {
        case "executive":
          generateExecutiveReport();
          break;
        case "detailed":
          generateDetailedReport();
          break;
        case "client":
          generateClientReport();
          break;
        case "custom":
          // For now, use detailed report
          generateDetailedReport();
          break;
      }
      
      toast({
        title: "Report generated",
        description: "Your report has been downloaded successfully"
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

  const reportDescriptions = {
    executive: "High-level summary with KPIs and strategic recommendations",
    detailed: "Comprehensive project listing with full details",
    client: "Client-specific performance analysis and insights",
    custom: "Customizable report with selected metrics and timeframes"
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Reports & Deliverables</h1>
        <p className="text-muted-foreground">
          Generate professional reports and client deliverables.
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
              <h3 className="text-lg font-semibold">Professional Reports</h3>
              <p className="text-muted-foreground">
                Generate executive summaries, detailed analyses, and client deliverables with a paid plan.
              </p>
            </div>
            <div className="flex justify-center">
              <FeatureBadge tier="team" />
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Report Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Report Configuration</CardTitle>
              <CardDescription>
                Configure your report parameters and filters
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="report-type">Report Type</Label>
                  <Select value={reportType} onValueChange={(value) => setReportType(value as ReportType)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="executive">Executive Summary</SelectItem>
                      <SelectItem value="detailed">Detailed Analysis</SelectItem>
                      <SelectItem value="client">Client Report</SelectItem>
                      <SelectItem value="custom">Custom Report</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    {reportDescriptions[reportType]}
                  </p>
                </div>

                <div>
                  <Label htmlFor="report-format">Format</Label>
                  <Select value={reportFormat} onValueChange={(value) => setReportFormat(value as ReportFormat)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">PDF Report</SelectItem>
                      <SelectItem value="csv">CSV Data</SelectItem>
                      <SelectItem value="excel" disabled>Excel (Coming Soon)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

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
              </div>

              {reportType === "client" && (
                <div>
                  <Label htmlFor="client-filter">Client Name</Label>
                  <Input
                    id="client-filter"
                    placeholder="Enter client name..."
                    value={clientFilter}
                    onChange={(e) => setClientFilter(e.target.value)}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Data Preview */}
          {analytics && (
            <Card>
              <CardHeader>
                <CardTitle>Data Preview</CardTitle>
                <CardDescription>
                  Preview of data that will be included in your report
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{analytics.total}</div>
                    <div className="text-xs text-muted-foreground">Projects</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{analytics.avgSatisfaction}</div>
                    <div className="text-xs text-muted-foreground">Avg Satisfaction</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{analytics.onBudgetRate}%</div>
                    <div className="text-xs text-muted-foreground">On Budget</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{analytics.onTimeRate}%</div>
                    <div className="text-xs text-muted-foreground">On Time</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{analytics.scopeChangeRate}%</div>
                    <div className="text-xs text-muted-foreground">Scope Changes</div>
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
                Create your professional report based on the configuration above
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="font-medium">
                    {reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report ({reportFormat.toUpperCase()})
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {filteredLessons.length} projects • {dateFrom || 'All time'} to {dateTo || 'Present'}
                    {clientFilter && ` • Client: ${clientFilter}`}
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