import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Type definitions for export utilities
export interface LessonExportData {
  id: string;
  project_name: string | null;
  client_name: string | null;
  role: string | null;
  created_at: string;
  updated_at: string;
  satisfaction: number | null;
  budget_status: string | null;
  timeline_status: string | null;
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
}

export interface ExportFilters {
  projectName?: string;
  clientName?: string;
  budget?: string;
  timeline?: string;
  minSatisfaction?: string;
  dateWindow?: {
    from?: string;
    to?: string;
  } | null;
}

export interface PDFExportOptions {
  title?: string;
  subtitle?: string;
  includeFilters?: boolean;
  includeSummary?: boolean;
  orientation?: 'portrait' | 'landscape';
  pageSize?: 'a4' | 'letter';
}

export interface CSVExportOptions {
  filename?: string;
  includeHeaders?: boolean;
}

export interface ToastFunction {
  (options: {
    title: string;
    description: string;
    variant?: 'default' | 'destructive';
  }): void;
}

// Utility function to format dates consistently
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric'
  });
};

// Utility function to escape CSV values
const escapeCSVValue = (value: string): string => {
  return `\"${value.replace(/\"/g, '\"\"')}\"`;
};

// Utility function to format lesson data for export
export const formatLessonForExport = (lesson: LessonExportData): Record<string, string | number> => {
  return {
    project_name: lesson.project_name || '—',
    client_name: lesson.client_name || '—',
    role: lesson.role || '—',
    created_at: formatDate(lesson.created_at),
    updated_at: formatDate(lesson.updated_at),
    satisfaction: lesson.satisfaction?.toString() || '—',
    budget_status: lesson.budget_status || '—',
    timeline_status: lesson.timeline_status || '—',
    scope_change: lesson.scope_change ? 'Yes' : 'No',
    notes: lesson.notes || '—',
    created_by: lesson.created_by || '—',
    project_type: lesson.project_type || '—',
    phase: lesson.phase || '—',
    industry: lesson.industry || '—',
    region: lesson.region || '—',
    billing_model: lesson.billing_model || '—',
    initial_budget_usd: lesson.initial_budget_usd?.toString() || '—',
    actual_days: lesson.actual_days?.toString() || '—',
    planned_days: lesson.planned_days?.toString() || '—',
    requirements_clarity: lesson.requirements_clarity?.toString() || '—',
    stakeholder_engagement: lesson.stakeholder_engagement?.toString() || '—',
    team_morale: lesson.team_morale?.toString() || '—',
    tooling_effectiveness: lesson.tooling_effectiveness?.toString() || '—',
    internal_comms_effectiveness: lesson.internal_comms_effectiveness?.toString() || '—'
  };
};

// Generate CSV content from lesson data
export const generateCSVContent = (
  lessons: LessonExportData[],
  options: CSVExportOptions = {}
): string => {
  const { includeHeaders = true } = options;
  
  const headers = [
    'Project Name', 'Client Name', 'Role', 'Date Created', 'Date Updated',
    'Satisfaction', 'Budget Status', 'Timeline Status', 'Scope Change', 'Notes',
    'Created By', 'Project Type', 'Phase', 'Industry', 'Region', 'Billing Model',
    'Initial Budget USD', 'Actual Days', 'Planned Days',
    'Requirements Clarity', 'Stakeholder Engagement', 'Team Morale',
    'Tooling Effectiveness', 'Internal Comms Effectiveness'
  ];
  
  const csvRows = lessons.map(lesson => [
    escapeCSVValue(lesson.project_name || ''),
    escapeCSVValue(lesson.client_name || ''),
    escapeCSVValue(lesson.role || ''),
    formatDate(lesson.created_at),
    formatDate(lesson.updated_at),
    lesson.satisfaction || '',
    lesson.budget_status || '',
    lesson.timeline_status || '',
    lesson.scope_change ? 'Yes' : 'No',
    escapeCSVValue(lesson.notes || ''),
    lesson.created_by || '',
    escapeCSVValue(lesson.project_type || ''),
    escapeCSVValue(lesson.phase || ''),
    escapeCSVValue(lesson.industry || ''),
    escapeCSVValue(lesson.region || ''),
    escapeCSVValue(lesson.billing_model || ''),
    lesson.initial_budget_usd || '',
    lesson.actual_days || '',
    lesson.planned_days || '',
    lesson.requirements_clarity || '',
    lesson.stakeholder_engagement || '',
    lesson.team_morale || '',
    lesson.tooling_effectiveness || '',
    lesson.internal_comms_effectiveness || ''
  ].join(','));

  const content = includeHeaders ? [headers.join(','), ...csvRows].join('\n') : csvRows.join('\n');
  return content;
};

// Generate PDF document from lesson data
export const generatePDFContent = (
  lessons: LessonExportData[],
  filters: ExportFilters = {},
  options: PDFExportOptions = {}
): jsPDF => {
  const {
    title = 'Lessons Learned Report',
    subtitle,
    includeFilters = true,
    includeSummary = true,
    orientation = 'landscape',
    pageSize = 'a4'
  } = options;

  const doc = new jsPDF(orientation === 'landscape' ? 'l' : 'p', 'mm', pageSize);
  let currentY = 20;

  // Title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 14, currentY);
  currentY += 15;

  // Subtitle and export info
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const exportInfo = subtitle || `Generated on: ${formatDate(new Date().toISOString())}`;
  doc.text(exportInfo, 14, currentY);
  currentY += 8;

  // Applied Filters Section
  if (includeFilters && hasActiveFilters(filters)) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Applied Filters:', 14, currentY);
    currentY += 8;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');

    // Date window filters
    if (filters.dateWindow && (filters.dateWindow.from || filters.dateWindow.to)) {
      const fromDate = filters.dateWindow.from ? formatDate(filters.dateWindow.from) : 'Not specified';
      const toDate = filters.dateWindow.to ? formatDate(filters.dateWindow.to) : 'Not specified';
      doc.text(`• Date Range: ${fromDate} to ${toDate}`, 18, currentY);
      currentY += 6;
    }

    // Other filters
    if (filters.projectName?.trim()) {
      doc.text(`• Project Name: \"${filters.projectName}\"`, 18, currentY);
      currentY += 6;
    }
    if (filters.clientName?.trim()) {
      doc.text(`• Client Name: \"${filters.clientName}\"`, 18, currentY);
      currentY += 6;
    }
    if (filters.budget && filters.budget !== 'any') {
      doc.text(`• Budget Status: ${filters.budget}`, 18, currentY);
      currentY += 6;
    }
    if (filters.timeline && filters.timeline !== 'any') {
      doc.text(`• Timeline Status: ${filters.timeline}`, 18, currentY);
      currentY += 6;
    }
    if (filters.minSatisfaction?.trim()) {
      doc.text(`• Minimum Satisfaction: ${filters.minSatisfaction}/5`, 18, currentY);
      currentY += 6;
    }
    currentY += 5;
  }

  // Summary statistics
  if (includeSummary) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Summary:', 14, currentY);
    currentY += 8;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total Records: ${lessons.length}`, 18, currentY);
    currentY += 6;

    // Calculate statistics
    const avgSatisfaction = lessons.length > 0 ?
      (lessons.reduce((sum, lesson) => sum + (lesson.satisfaction || 0), 0) / lessons.filter(l => l.satisfaction).length).toFixed(1) : 'N/A';

    const budgetBreakdown = lessons.reduce((acc, lesson) => {
      const status = lesson.budget_status || 'unknown';
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
  }

  // Prepare table data
  const tableData = lessons.map(lesson => [
    lesson.project_name || '—',
    lesson.client_name || '—',
    lesson.role || '—',
    formatDate(lesson.created_at),
    lesson.satisfaction?.toString() || '—',
    lesson.budget_status || '—',
    lesson.timeline_status || '—',
    lesson.scope_change ? 'Yes' : 'No',
    lesson.project_type || '—',
    lesson.industry || '—',
    lesson.initial_budget_usd ? `$${lesson.initial_budget_usd.toLocaleString()}` : '—',
    lesson.actual_days?.toString() || '—'
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

  return doc;
};

// Download file utility
export const downloadFile = (content: string | Blob, filename: string, mimeType?: string): void => {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType || 'text/plain;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Generate timestamped filename
export const generateTimestampedFilename = (baseName: string, extension: string): string => {
  const timestamp = new Date().toISOString().slice(0, 16).replace('T', '-').replace(':', '-');
  return `${baseName}-${timestamp}.${extension}`;
};

// Handle export errors consistently
export const handleExportError = (error: Error, exportType: 'CSV' | 'PDF', toast?: ToastFunction): void => {
  console.error(`${exportType} export error:`, error);
  
  if (toast) {
    toast({
      title: "Export Failed",
      description: `Failed to export ${exportType} file. Please try again.`,
      variant: "destructive",
    });
  }
};

// Check if filters are active
const hasActiveFilters = (filters: ExportFilters): boolean => {
  return !!(
    filters.projectName?.trim() ||
    filters.clientName?.trim() ||
    (filters.budget && filters.budget !== 'any') ||
    (filters.timeline && filters.timeline !== 'any') ||
    filters.minSatisfaction?.trim() ||
    (filters.dateWindow && (filters.dateWindow.from || filters.dateWindow.to))
  );
};

// Export success notification
export const handleExportSuccess = (exportType: 'CSV' | 'PDF', recordCount: number, toast?: ToastFunction): void => {
  if (toast) {
    toast({
      title: "Export Complete",
      description: `Exported ${recordCount} lessons to ${exportType}`,
    });
  }
};
