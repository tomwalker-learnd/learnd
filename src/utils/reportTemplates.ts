/**
 * ============================================================================
 * LIFECYCLE-AWARE REPORT TEMPLATES
 * ============================================================================
 */

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { ProjectLifecycleStatus, ProjectHealth } from "@/lib/statusUtils";

export type ReportTemplate = 
  | "active_portfolio_health" 
  | "completion_analysis" 
  | "executive_portfolio" 
  | "client_performance"
  | "executive" 
  | "detailed" 
  | "client" 
  | "custom";

export type ReportAudience = "internal" | "client" | "executive" | "team";

export interface ProjectData {
  id: string;
  project_name: string | null;
  client_name: string | null;
  satisfaction: number | null;
  budget_status: "under" | "on" | "over" | null;
  timeline_status: "early" | "on-time" | "late" | null;
  project_status?: ProjectLifecycleStatus;
  scope_change: boolean | null;
  created_at: string;
  role: string | null;
  notes: string | null;
}

export interface ReportAnalytics {
  total: number;
  avgSatisfaction: number;
  onBudgetRate: number;
  onTimeRate: number;
  scopeChangeRate: number;
  clientCount: number;
  activeProjects: number;
  completedProjects: number;
  healthDistribution: {
    healthy: number;
    atRisk: number;
    critical: number;
    successful: number;
    underperformed: number;
    mixed: number;
  };
}

export interface ReportConfig {
  template: ReportTemplate;
  audience: ReportAudience;
  projectStatus: ProjectLifecycleStatus[];
  healthFilter: ProjectHealth[];
  dateFrom?: string;
  dateTo?: string;
  clientFilter?: string;
  includeRisks: boolean;
  includeRecommendations: boolean;
}

export class LifecycleReportGenerator {
  
  static getTemplateInfo(template: ReportTemplate) {
    const templates = {
      active_portfolio_health: {
        title: "Active Portfolio Health Report",
        description: "Current project status and interventions needed",
        audience: ["internal", "executive", "team"],
        focus: "Active projects requiring attention and optimization"
      },
      completion_analysis: {
        title: "Project Completion Analysis",
        description: "Lessons learned from recently finished work",
        audience: ["internal", "executive", "team"],
        focus: "Completed projects patterns and learnings"
      },
      executive_portfolio: {
        title: "Executive Portfolio Summary",
        description: "Combines active status with completion trends",
        audience: ["executive", "client"],
        focus: "High-level cross-lifecycle portfolio overview"
      },
      client_performance: {
        title: "Client Performance Review",
        description: "Both ongoing work and completed project outcomes",
        audience: ["client", "executive"],
        focus: "Client-specific active and completed project performance"
      },
      executive: {
        title: "Executive Summary",
        description: "Traditional high-level overview",
        audience: ["executive"],
        focus: "Overall performance metrics"
      },
      detailed: {
        title: "Detailed Analysis",
        description: "Comprehensive project listing",
        audience: ["internal", "team"],
        focus: "Complete project details"
      },
      client: {
        title: "Client Report",
        description: "Client-specific analysis",
        audience: ["client"],
        focus: "Client relationship management"
      },
      custom: {
        title: "Custom Report",
        description: "Configurable metrics and timeframes",
        audience: ["internal", "executive", "team", "client"],
        focus: "User-defined parameters"
      }
    };
    
    return templates[template];
  }

  static generateActivePortfolioHealthReport(
    data: ProjectData[], 
    analytics: ReportAnalytics, 
    config: ReportConfig
  ): jsPDF {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("Active Portfolio Health Report", 20, 25);
    
    // Subtitle
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 35);
    doc.text(`Active Projects: ${analytics.activeProjects} | Report Period: ${config.dateFrom || 'All time'} to ${config.dateTo || 'Present'}`, 20, 45);
    
    // Health Status Overview
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Portfolio Health Status", 20, 65);
    
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    const healthMetrics = [
      `🟢 Healthy Projects: ${analytics.healthDistribution.healthy}`,
      `🟡 At-Risk Projects: ${analytics.healthDistribution.atRisk}`,
      `🔴 Critical Projects: ${analytics.healthDistribution.critical}`,
      `📊 Average Satisfaction: ${analytics.avgSatisfaction.toFixed(1)}/5.0`,
      `💰 On Budget Rate: ${analytics.onBudgetRate.toFixed(1)}%`,
      `⏱️ On Time Rate: ${analytics.onTimeRate.toFixed(1)}%`
    ];
    
    healthMetrics.forEach((metric, index) => {
      doc.text(metric, 25, 80 + (index * 10));
    });
    
    // Intervention Recommendations
    if (config.includeRecommendations) {
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("Immediate Action Required", 20, 160);
      
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      const interventions = [];
      
      if (analytics.healthDistribution.critical > 0) {
        interventions.push(`🚨 URGENT: ${analytics.healthDistribution.critical} critical projects need immediate intervention`);
      }
      if (analytics.healthDistribution.atRisk > 0) {
        interventions.push(`⚠️ Monitor: ${analytics.healthDistribution.atRisk} at-risk projects require close attention`);
      }
      if (analytics.onBudgetRate < 80) {
        interventions.push("💰 Budget Review: Multiple projects showing cost overrun patterns");
      }
      if (analytics.onTimeRate < 80) {
        interventions.push("⏱️ Timeline Review: Delivery schedule requires optimization");
      }
      
      if (interventions.length === 0) {
        interventions.push("✅ Portfolio is performing within acceptable parameters");
      }
      
      interventions.forEach((intervention, index) => {
        doc.text(intervention, 25, 175 + (index * 10));
      });
    }
    
    return doc;
  }

  static generateCompletionAnalysisReport(
    data: ProjectData[], 
    analytics: ReportAnalytics, 
    config: ReportConfig
  ): jsPDF {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("Project Completion Analysis", 20, 25);
    
    // Subtitle
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 35);
    doc.text(`Completed Projects: ${analytics.completedProjects} | Analysis Period: ${config.dateFrom || 'All time'} to ${config.dateTo || 'Present'}`, 20, 45);
    
    // Success Patterns
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Completion Performance Analysis", 20, 65);
    
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    const completionMetrics = [
      `✅ Successful Completions: ${analytics.healthDistribution.successful}`,
      `⚠️ Underperformed Projects: ${analytics.healthDistribution.underperformed}`,
      `📊 Mixed Results: ${analytics.healthDistribution.mixed}`,
      `⭐ Average Final Satisfaction: ${analytics.avgSatisfaction.toFixed(1)}/5.0`,
      `💰 Budget Adherence: ${analytics.onBudgetRate.toFixed(1)}%`,
      `⏱️ Timeline Performance: ${analytics.onTimeRate.toFixed(1)}%`
    ];
    
    completionMetrics.forEach((metric, index) => {
      doc.text(metric, 25, 80 + (index * 10));
    });
    
    // Lessons Learned
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Key Learnings & Patterns", 20, 160);
    
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    const lessons = [];
    
    if (analytics.healthDistribution.successful > analytics.healthDistribution.underperformed) {
      lessons.push("✅ Strong delivery track record with consistent success patterns");
    } else {
      lessons.push("⚠️ Delivery performance shows room for improvement");
    }
    
    if (analytics.scopeChangeRate > 30) {
      lessons.push("📋 Scope changes are a significant factor in project outcomes");
    }
    
    if (analytics.avgSatisfaction >= 4.0) {
      lessons.push("⭐ Client satisfaction levels indicate strong delivery quality");
    } else {
      lessons.push("📈 Client satisfaction improvement opportunities identified");
    }
    
    lessons.push("🔄 Apply successful project patterns to current active portfolio");
    
    lessons.forEach((lesson, index) => {
      doc.text(lesson, 25, 175 + (index * 10));
    });
    
    return doc;
  }

  static generateExecutivePortfolioReport(
    data: ProjectData[], 
    analytics: ReportAnalytics, 
    config: ReportConfig
  ): jsPDF {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("Executive Portfolio Summary", 20, 25);
    
    // Subtitle
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 35);
    doc.text(`Portfolio Overview: ${analytics.total} Total Projects (${analytics.activeProjects} Active, ${analytics.completedProjects} Completed)`, 20, 45);
    
    // Portfolio Status
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Portfolio Performance Dashboard", 20, 65);
    
    // Active vs Completed Performance
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Active Projects Status:", 25, 85);
    
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    if (analytics.activeProjects > 0) {
      const activeMetrics = [
        `• Healthy: ${analytics.healthDistribution.healthy} projects`,
        `• At-Risk: ${analytics.healthDistribution.atRisk} projects requiring attention`,
        `• Critical: ${analytics.healthDistribution.critical} projects needing intervention`
      ];
      activeMetrics.forEach((metric, index) => {
        doc.text(metric, 30, 100 + (index * 10));
      });
    } else {
      doc.text("• No active projects in portfolio", 30, 100);
    }
    
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Completed Projects Analysis:", 25, 140);
    
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    if (analytics.completedProjects > 0) {
      const completedMetrics = [
        `• Successful: ${analytics.healthDistribution.successful} projects`,
        `• Underperformed: ${analytics.healthDistribution.underperformed} projects`,
        `• Mixed Results: ${analytics.healthDistribution.mixed} projects`
      ];
      completedMetrics.forEach((metric, index) => {
        doc.text(metric, 30, 155 + (index * 10));
      });
    } else {
      doc.text("• No completed projects in analysis period", 30, 155);
    }
    
    // Strategic Overview
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Strategic Insights", 20, 200);
    
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    const insights = [
      `📊 Overall Portfolio Health: ${analytics.activeProjects > 0 ? 
        (analytics.healthDistribution.healthy / Math.max(analytics.activeProjects, 1) * 100).toFixed(0) + '% healthy active projects' 
        : 'No active projects'}`,
      `🎯 Delivery Track Record: ${analytics.completedProjects > 0 ? 
        (analytics.healthDistribution.successful / Math.max(analytics.completedProjects, 1) * 100).toFixed(0) + '% successful completions'
        : 'No completed projects'}`,
      `💼 Client Relationships: ${analytics.clientCount} active client relationships`,
      `📈 Performance Trend: ${analytics.avgSatisfaction >= 4.0 ? 'Positive' : 'Improvement Needed'} (${analytics.avgSatisfaction.toFixed(1)}/5.0 satisfaction)`
    ];
    
    insights.forEach((insight, index) => {
      doc.text(insight, 25, 215 + (index * 10));
    });
    
    return doc;
  }

  static generateClientPerformanceReport(
    data: ProjectData[], 
    analytics: ReportAnalytics, 
    config: ReportConfig
  ): jsPDF {
    const doc = new jsPDF();
    
    const clientName = config.clientFilter || "All Clients";
    
    // Header
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text(`Client Performance Review`, 20, 25);
    
    // Subtitle
    doc.setFontSize(14);
    doc.setFont("helvetica", "normal");
    doc.text(`Client: ${clientName}`, 20, 40);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 50);
    
    // Current Active Work
    if (analytics.activeProjects > 0) {
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("Current Active Projects", 20, 70);
      
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      const activeWork = [
        `🎯 Active Projects: ${analytics.activeProjects}`,
        `📊 Current Health: ${analytics.healthDistribution.healthy} healthy, ${analytics.healthDistribution.atRisk} at-risk`,
        `💰 Budget Status: ${analytics.onBudgetRate.toFixed(1)}% on track`,
        `⏱️ Timeline Status: ${analytics.onTimeRate.toFixed(1)}% on schedule`,
        `📋 Scope Management: ${analytics.scopeChangeRate.toFixed(1)}% change rate`
      ];
      
      activeWork.forEach((item, index) => {
        doc.text(item, 25, 85 + (index * 10));
      });
    }
    
    // Historical Performance
    if (analytics.completedProjects > 0) {
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("Historical Performance", 20, 150);
      
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      const historical = [
        `✅ Completed Projects: ${analytics.completedProjects}`,
        `🏆 Success Rate: ${((analytics.healthDistribution.successful / Math.max(analytics.completedProjects, 1)) * 100).toFixed(1)}%`,
        `⭐ Average Satisfaction: ${analytics.avgSatisfaction.toFixed(1)}/5.0`,
        `📈 Delivery Excellence: ${analytics.onTimeRate.toFixed(1)}% on-time delivery`,
        `💼 Partnership Duration: ${config.dateFrom ? 'Since ' + config.dateFrom : 'Long-term partnership'}`
      ];
      
      historical.forEach((item, index) => {
        doc.text(item, 25, 165 + (index * 10));
      });
    }
    
    // Partnership Summary
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Partnership Summary", 20, 230);
    
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    if (config.audience === "client") {
      // Client-facing summary
      const summary = [
        `🤝 Strong partnership with consistent delivery quality`,
        `📊 Proactive project management with regular status updates`,
        `🎯 Commitment to meeting project objectives and timelines`,
        `📈 Continuous improvement in service delivery`
      ];
      summary.forEach((item, index) => {
        doc.text(item, 25, 245 + (index * 10));
      });
    } else {
      // Internal summary
      const summary = [
        `💰 Revenue Performance: ${analytics.total} total projects`,
        `📊 Client Health: ${analytics.avgSatisfaction >= 4.0 ? 'Strong' : 'Needs Attention'}`,
        `🔄 Repeat Business: ${analytics.completedProjects > 1 ? 'Yes' : 'First-time client'}`,
        `⚠️ Risk Factors: ${analytics.healthDistribution.critical > 0 ? 'Active issues present' : 'Low risk'}`
      ];
      summary.forEach((item, index) => {
        doc.text(item, 25, 245 + (index * 10));
      });
    }
    
    return doc;
  }

  static generateCSVExport(data: ProjectData[], config: ReportConfig): string {
    const headers = [
      "Project Name",
      "Client",
      "Project Status",
      "Health Status",
      "Role",
      "Satisfaction",
      "Budget Status",
      "Timeline Status",
      "Scope Change",
      "Created Date",
      "Notes"
    ];
    
    const rows = data.map(project => [
      project.project_name || "Untitled",
      project.client_name || "—",
      project.project_status || "active",
      this.calculateHealthStatus(project),
      project.role || "—",
      project.satisfaction?.toString() || "—",
      project.budget_status || "—",
      project.timeline_status || "—",
      project.scope_change ? "Yes" : "No",
      new Date(project.created_at).toLocaleDateString(),
      project.notes?.replace(/[\r\n]+/g, " ") || "—"
    ]);
    
    return [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(","))
      .join("\n");
  }
  
  private static calculateHealthStatus(project: ProjectData): string {
    if (project.project_status === 'completed') {
      if (project.satisfaction && project.satisfaction >= 4 && 
          project.budget_status !== 'over' && project.timeline_status !== 'late') {
        return 'successful';
      } else if (project.satisfaction && project.satisfaction < 3) {
        return 'underperformed';
      } else {
        return 'mixed';
      }
    } else {
      if (project.satisfaction && project.satisfaction >= 4 && 
          project.budget_status !== 'over' && project.timeline_status !== 'late') {
        return 'healthy';
      } else if (project.satisfaction && project.satisfaction < 3 || 
                 project.budget_status === 'over' || project.timeline_status === 'late') {
        return 'critical';
      } else {
        return 'at-risk';
      }
    }
  }
}