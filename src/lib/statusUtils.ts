/**
 * ============================================================================
 * STATUS UTILITIES - Project lifecycle and performance status logic
 * ============================================================================
 * 
 * FEATURES:
 * - Project Health Status: Calculate performance status based on metrics
 * - Lifecycle Status: Distinguish between active vs completed projects
 * - Status Mapping: Convert status codes to user-friendly labels
 * - Query Helpers: Default filters and status-based query builders
 * 
 * STATUS TYPES:
 * - Lifecycle: active, on_hold, completed, cancelled
 * - Performance: healthy, at-risk, critical, successful, underperformed, mixed
 */

import type { Lesson } from "@/types";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type ProjectLifecycleStatus = 'active' | 'on_hold' | 'completed' | 'cancelled';

export type ActiveProjectHealth = 'healthy' | 'at-risk' | 'critical';
export type CompletedProjectHealth = 'successful' | 'underperformed' | 'mixed';
export type ProjectHealth = ActiveProjectHealth | CompletedProjectHealth;

export interface ProjectWithStatus extends Lesson {
  project_status: ProjectLifecycleStatus;
}

// ============================================================================
// STATUS CALCULATION FUNCTIONS
// ============================================================================

/**
 * Calculate health status for active projects (active, on_hold)
 */
export const calculateActiveProjectHealth = (project: ProjectWithStatus): ActiveProjectHealth => {
  const isBehindSchedule = project.timeline_status === 'late';
  const isOverBudget = project.budget_status === 'over';
  const lowSatisfaction = project.satisfaction < 3;
  const veryLowSatisfaction = project.satisfaction < 2;
  
  // Critical: Multiple major issues
  if ((isBehindSchedule && isOverBudget && veryLowSatisfaction) ||
      (isBehindSchedule && isOverBudget) ||
      (isOverBudget && veryLowSatisfaction) ||
      (isBehindSchedule && veryLowSatisfaction)) {
    return 'critical';
  }
  
  // At Risk: Single major issue
  if (isBehindSchedule || isOverBudget || lowSatisfaction) {
    return 'at-risk';
  }
  
  // Healthy: On time, on budget, good satisfaction
  return 'healthy';
};

/**
 * Calculate health status for completed projects (completed, cancelled)
 */
export const calculateCompletedProjectHealth = (project: ProjectWithStatus): CompletedProjectHealth => {
  const isOnTimeOrEarly = project.timeline_status === 'on-time' || project.timeline_status === 'early';
  const isOnOrUnderBudget = project.budget_status === 'on' || project.budget_status === 'under';
  const highSatisfaction = project.satisfaction >= 4;
  const lowSatisfaction = project.satisfaction < 3;
  
  // Successful: Met objectives, good performance
  if (isOnTimeOrEarly && isOnOrUnderBudget && highSatisfaction) {
    return 'successful';
  }
  
  // Underperformed: Multiple issues
  if ((project.budget_status === 'over' || project.timeline_status === 'late' || lowSatisfaction)) {
    return 'underperformed';
  }
  
  // Mixed Results: Some objectives met
  return 'mixed';
};

/**
 * Get overall project health based on lifecycle status
 */
export const getProjectHealth = (project: ProjectWithStatus): ProjectHealth => {
  const isActive = project.project_status === 'active' || project.project_status === 'on_hold';
  
  if (isActive) {
    return calculateActiveProjectHealth(project);
  } else {
    return calculateCompletedProjectHealth(project);
  }
};

// ============================================================================
// STATUS MAPPING FUNCTIONS
// ============================================================================

/**
 * Get user-friendly label for lifecycle status
 */
export const getLifecycleStatusLabel = (status: ProjectLifecycleStatus): string => {
  const labels: Record<ProjectLifecycleStatus, string> = {
    active: 'Active',
    on_hold: 'On Hold',
    completed: 'Completed',
    cancelled: 'Cancelled'
  };
  
  return labels[status] || status;
};

/**
 * Get user-friendly label for health status
 */
export const getHealthStatusLabel = (health: ProjectHealth): string => {
  const labels: Record<ProjectHealth, string> = {
    healthy: 'Healthy',
    'at-risk': 'At Risk',
    critical: 'Critical',
    successful: 'Successful',
    underperformed: 'Underperformed',
    mixed: 'Mixed Results'
  };
  
  return labels[health] || health;
};

/**
 * Get CSS classes for health status styling
 */
export const getHealthStatusStyles = (health: ProjectHealth): string => {
  const styles: Record<ProjectHealth, string> = {
    healthy: 'bg-green-100 text-green-800 border-green-200',
    'at-risk': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    critical: 'bg-red-100 text-red-800 border-red-200',
    successful: 'bg-green-100 text-green-800 border-green-200',
    underperformed: 'bg-red-100 text-red-800 border-red-200',
    mixed: 'bg-blue-100 text-blue-800 border-blue-200'
  };
  
  return styles[health] || 'bg-gray-100 text-gray-800 border-gray-200';
};

// ============================================================================
// QUERY HELPER FUNCTIONS
// ============================================================================

/**
 * Default project status filter (show active projects)
 */
export const getDefaultProjectStatusFilter = (): ProjectLifecycleStatus[] => {
  return ['active', 'on_hold'];
};

/**
 * Get all active project statuses
 */
export const getActiveProjectStatuses = (): ProjectLifecycleStatus[] => {
  return ['active', 'on_hold'];
};

/**
 * Get all completed project statuses
 */
export const getCompletedProjectStatuses = (): ProjectLifecycleStatus[] => {
  return ['completed', 'cancelled'];
};

/**
 * Check if a project is in active lifecycle
 */
export const isActiveProject = (status: ProjectLifecycleStatus): boolean => {
  return getActiveProjectStatuses().includes(status);
};

/**
 * Check if a project is in completed lifecycle
 */
export const isCompletedProject = (status: ProjectLifecycleStatus): boolean => {
  return getCompletedProjectStatuses().includes(status);
};

// ============================================================================
// AGGREGATION HELPER FUNCTIONS
// ============================================================================

/**
 * Group projects by health status
 */
export const groupProjectsByHealth = (projects: ProjectWithStatus[]): Record<ProjectHealth, ProjectWithStatus[]> => {
  return projects.reduce((acc, project) => {
    const health = getProjectHealth(project);
    if (!acc[health]) {
      acc[health] = [];
    }
    acc[health].push(project);
    return acc;
  }, {} as Record<ProjectHealth, ProjectWithStatus[]>);
};

/**
 * Get health distribution for active projects
 */
export const getActiveProjectHealthDistribution = (projects: ProjectWithStatus[]) => {
  const activeProjects = projects.filter(p => isActiveProject(p.project_status));
  const grouped = groupProjectsByHealth(activeProjects);
  
  return {
    healthy: grouped.healthy?.length || 0,
    'at-risk': grouped['at-risk']?.length || 0,
    critical: grouped.critical?.length || 0,
    total: activeProjects.length
  };
};

/**
 * Get health distribution for completed projects
 */
export const getCompletedProjectHealthDistribution = (projects: ProjectWithStatus[]) => {
  const completedProjects = projects.filter(p => isCompletedProject(p.project_status));
  const grouped = groupProjectsByHealth(completedProjects);
  
  return {
    successful: grouped.successful?.length || 0,
    underperformed: grouped.underperformed?.length || 0,
    mixed: grouped.mixed?.length || 0,
    total: completedProjects.length
  };
};