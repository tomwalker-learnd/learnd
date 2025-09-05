/**
 * ============================================================================
 * EXPORT UTILITIES - Reusable data formatting and export operations
 * ============================================================================
 * 
 * FEATURES:
 * - CSV Export: Generate comma-separated values files with proper escaping
 * - PDF Export: Create professional reports with tables, filters, and statistics
 * - Data Formatting: Standardize lesson data for consistent export output
 * - File Management: Handle browser downloads with timestamped filenames
 * - Error Handling: Consistent error reporting with toast notifications
 * - Filter Integration: Include applied filters in export documentation
 * - Statistics: Calculate and include summary statistics in PDF reports
 * 
 * EXPORT FORMATS:
 * - CSV: Spreadsheet-compatible format for data analysis
 * - PDF: Professional reports with formatting and context
 * 
 * USAGE:
 * - Imported by Lessons page and Dashboard pages
 * - Reduces code duplication across export implementations
 * - Provides consistent export experience across the application
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================
// Complete lesson data structure for export operations
export interface LessonExportData {
  id: string;
  project_name: string | null;
  client_name: string | null;
  role: string | null;
  created_at: string;
  updated_at: string;
  satisfaction: number | null; // 1-5 rating
  budget_status: string | null; // under/on/over
  timeline_status: string | null; // early/on/late
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
  requirements_clarity: number | null; // 1-5 rating
  stakeholder_engagement: number | null; // 1-5 rating
  team_morale: number | null; // 1-5 rating
  tooling_effectiveness: number | null; // 1-5 rating
  internal_comms_effectiveness: number | null; // 1-5 rating
}

// Filter configuration for documenting applied filters in exports
export interface ExportFilters {
  projectName?: string; // Project name search filter
  clientName?: string; // Client name search filter
  budget?: string; // Budget status filter
  timeline?: string; // Timeline status filter
  minSatisfaction?: string; // Minimum satisfaction rating
  dateWindow?: { // Date range from dashboard integration
    from?: string;
    to?: string;
  } | null;
}

// PDF export customization options
export interface PDFExportOptions {
  title?: string; // Report title
  subtitle?: string; // Report subtitle/description
  includeFilters?: boolean; // Include applied filters section
  includeSummary?: boolean; // Include statistics summary
  orientation?: 'portrait' | 'landscape'; // Page orientation
  pageSize?: 'a4' | 'letter'; // Page size format
}

// CSV export customization options
export interface CSVExportOptions {
  filename?: string; // Custom filename (without extension)
  includeHeaders?: boolean; // Include column headers
}

// Toast notification function interface for consistent user feedback
export interface ToastFunction {
  (options: {
    title: string;
    description: string;
    variant?: 'default' | 'destructive';
  }): void;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================
// Consistent date formatting for all export operations
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric'
  });
};

// CSV value escaping to handle quotes and special characters
const escapeCSVValue = (value: string): string => {
  return `\"${value.replace(/\"/g, '\"\"')}\"`;
};

// ============================================================================
// DATA FORMATTING FUNCTIONS
// ============================================================================
// Transform raw lesson data into export-ready format with consistent null handling
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

// ============================================================================
// CSV EXPORT FUNCTIONS
// ============================================================================
// Generate CSV content with proper headers and data formatting
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

// ============================================================================
// PDF EXPORT FUNCTIONS
// ============================================================================
// Generate comprehensive PDF report with tables, filters, and statistics
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

// ============================================================================
// FILE MANAGEMENT FUNCTIONS
// ============================================================================
// Handle browser file downloads with proper cleanup
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

// Create unique filenames with timestamps to prevent overwrites
export const generateTimestampedFilename = (baseName: string, extension: string): string => {
  const timestamp = new Date().toISOString().slice(0, 16).replace('T', '-').replace(':', '-');
  return `${baseName}-${timestamp}.${extension}`;
};

// ============================================================================
// ERROR HANDLING FUNCTIONS
// ============================================================================
// Centralized export error handling with logging and user notification
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

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================
// Determine if any filters are currently active for documentation purposes
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

// Consistent success notifications for export operations
export const handleExportSuccess = (exportType: 'CSV' | 'PDF', recordCount: number, toast?: ToastFunction): void => {
  if (toast) {
    toast({
      title: "Export Complete",
      description: `Exported ${recordCount} lessons to ${exportType}`,
    });
  }
};
