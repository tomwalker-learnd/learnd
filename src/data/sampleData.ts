import { Lesson } from "@/types";

// Sample data for onboarding - 15 realistic projects across 3 industries
// Active projects (8): 3 at-risk, 1 critical, 4 healthy  
// Completed projects (7): 4 successful, 2 underperformed, 1 mixed
export const sampleProjects: Lesson[] = [
  // ACTIVE PROJECTS (8 total)
  
  // At-risk projects (3)
  {
    id: "sample-1",
    project_name: "Mobile App Redesign",
    role: "UX Designer",
    client_name: "TechCorp Solutions",
    satisfaction: 2,
    budget_status: "over",
    scope_change: true,
    timeline_status: "behind_schedule",
    project_status: "active",
    notes: "Client keeps requesting additional features. Budget exceeded by 30%.",
    created_by: "demo-user",
    created_at: "2024-08-15T10:00:00Z",
    updated_at: "2024-12-01T15:30:00Z"
  },
  {
    id: "sample-2",
    project_name: "Healthcare Portal Development",
    role: "Full Stack Developer",
    client_name: "MedLife Partners",
    satisfaction: 2,
    budget_status: "over",
    scope_change: true,
    timeline_status: "behind_schedule",
    project_status: "active",
    notes: "Compliance requirements keep changing. Timeline pushed back 3 weeks.",
    created_by: "demo-user",
    created_at: "2024-07-20T09:00:00Z",
    updated_at: "2024-12-01T14:20:00Z"
  },
  {
    id: "sample-3",
    project_name: "E-commerce Platform Migration",
    role: "Technical Lead",
    client_name: "Fashion Forward Inc",
    satisfaction: 2,
    budget_status: "on",
    scope_change: true,
    timeline_status: "behind_schedule",
    project_status: "active",
    notes: "Legacy system integration more complex than expected.",
    created_by: "demo-user",
    created_at: "2024-09-01T11:00:00Z",
    updated_at: "2024-12-01T16:45:00Z"
  },

  // Critical project (1)
  {
    id: "sample-4",
    project_name: "Financial Trading Dashboard",
    role: "Frontend Developer",
    client_name: "Capital Investments LLC",
    satisfaction: 1,
    budget_status: "over",
    scope_change: true,
    timeline_status: "behind_schedule",
    project_status: "active",
    notes: "Major performance issues. Client threatening contract termination.",
    created_by: "demo-user",
    created_at: "2024-10-01T08:00:00Z",
    updated_at: "2024-12-01T17:00:00Z"
  },

  // Healthy projects (4)
  {
    id: "sample-5",
    project_name: "Corporate Website Refresh",
    role: "Web Designer",
    client_name: "GreenTech Industries",
    satisfaction: 5,
    budget_status: "under",
    scope_change: false,
    timeline_status: "on_schedule",
    project_status: "active",
    notes: "Excellent collaboration. Ahead of schedule and under budget.",
    created_by: "demo-user",
    created_at: "2024-10-15T09:30:00Z",
    updated_at: "2024-12-01T12:00:00Z"
  },
  {
    id: "sample-6",
    project_name: "Inventory Management System",
    role: "Backend Developer",
    client_name: "Retail Solutions Co",
    satisfaction: 4,
    budget_status: "on",
    scope_change: false,
    timeline_status: "on_schedule",
    project_status: "active",
    notes: "Smooth progress. Client happy with regular updates.",
    created_by: "demo-user",
    created_at: "2024-11-01T10:00:00Z",
    updated_at: "2024-12-01T13:15:00Z"
  },
  {
    id: "sample-7",
    project_name: "Marketing Automation Tool",
    role: "Full Stack Developer",
    client_name: "Digital Marketing Pro",
    satisfaction: 4,
    budget_status: "under",
    scope_change: false,
    timeline_status: "ahead_of_schedule",
    project_status: "active",
    notes: "Great team chemistry. Delivering ahead of timeline.",
    created_by: "demo-user",
    created_at: "2024-11-10T11:00:00Z",
    updated_at: "2024-12-01T14:30:00Z"
  },
  {
    id: "sample-8",
    project_name: "Learning Management Platform",
    role: "UX/UI Designer",
    client_name: "EduTech Solutions",
    satisfaction: 5,
    budget_status: "on",
    scope_change: false,
    timeline_status: "on_schedule",
    project_status: "active",
    notes: "Perfect project execution. Client loves the design approach.",
    created_by: "demo-user",
    created_at: "2024-11-15T09:00:00Z",
    updated_at: "2024-12-01T11:45:00Z"
  },

  // COMPLETED PROJECTS (7 total)

  // Successful projects (4)
  {
    id: "sample-9",
    project_name: "Customer Support Portal",
    role: "Frontend Developer",
    client_name: "ServiceFirst Inc",
    satisfaction: 5,
    budget_status: "under",
    scope_change: false,
    timeline_status: "on_schedule",
    project_status: "completed",
    notes: "Delivered 2 days early. Client extremely satisfied with quality.",
    created_by: "demo-user",
    created_at: "2024-05-01T09:00:00Z",
    updated_at: "2024-07-15T16:00:00Z"
  },
  {
    id: "sample-10",
    project_name: "Data Analytics Dashboard",
    role: "Data Visualization Specialist",
    client_name: "InsightCorp",
    satisfaction: 5,
    budget_status: "on",
    scope_change: false,
    timeline_status: "ahead_of_schedule",
    project_status: "completed",
    notes: "Exceeded client expectations. Resulted in additional contract.",
    created_by: "demo-user",
    created_at: "2024-04-10T10:00:00Z",
    updated_at: "2024-06-20T15:30:00Z"
  },
  {
    id: "sample-11",
    project_name: "Social Media Management App",
    role: "Mobile Developer",
    client_name: "SocialBuzz Agency",
    satisfaction: 4,
    budget_status: "under",
    scope_change: false,
    timeline_status: "on_schedule",
    project_status: "completed",
    notes: "Solid delivery. Client happy with performance and features.",
    created_by: "demo-user",
    created_at: "2024-03-15T11:00:00Z",
    updated_at: "2024-05-30T14:00:00Z"
  },
  {
    id: "sample-12",
    project_name: "Restaurant POS System",
    role: "Full Stack Developer",
    client_name: "Hospitality Tech",
    satisfaction: 4,
    budget_status: "on",
    scope_change: false,
    timeline_status: "on_schedule",
    project_status: "completed",
    notes: "Met all requirements. Good working relationship maintained.",
    created_by: "demo-user",
    created_at: "2024-02-20T08:30:00Z",
    updated_at: "2024-04-25T17:00:00Z"
  },

  // Underperformed projects (2)
  {
    id: "sample-13",
    project_name: "Legacy System Modernization",
    role: "Technical Architect",
    client_name: "OldTech Industries",
    satisfaction: 2,
    budget_status: "over",
    scope_change: true,
    timeline_status: "behind_schedule",
    project_status: "completed",
    notes: "Technical debt underestimated. Delivered 6 weeks late.",
    created_by: "demo-user",
    created_at: "2024-01-10T09:00:00Z",
    updated_at: "2024-04-15T16:30:00Z"
  },
  {
    id: "sample-14",
    project_name: "Real Estate CRM",
    role: "Backend Developer",
    client_name: "Property Solutions LLC",
    satisfaction: 2,
    budget_status: "over",
    scope_change: true,
    timeline_status: "behind_schedule",
    project_status: "completed",
    notes: "Scope creep led to budget overrun. Client dissatisfied with timeline.",
    created_by: "demo-user",
    created_at: "2023-12-01T10:00:00Z",
    updated_at: "2024-03-10T15:00:00Z"
  },

  // Mixed result project (1)
  {
    id: "sample-15",
    project_name: "Multi-tenant SaaS Platform",
    role: "DevOps Engineer",
    client_name: "CloudFirst Solutions",
    satisfaction: 3,
    budget_status: "on",
    scope_change: true,
    timeline_status: "on_schedule",
    project_status: "completed",
    notes: "Technical challenges resolved but client relationship strained by communication issues.",
    created_by: "demo-user",
    created_at: "2023-11-15T09:00:00Z",
    updated_at: "2024-02-28T14:45:00Z"
  }
];

// Sample clients for consistency
export const sampleClients = [
  { id: "client-1", name: "TechCorp Solutions", industry: "Technology" },
  { id: "client-2", name: "MedLife Partners", industry: "Healthcare" },
  { id: "client-3", name: "Fashion Forward Inc", industry: "E-commerce" },
  { id: "client-4", name: "Capital Investments LLC", industry: "Finance" },
  { id: "client-5", name: "GreenTech Industries", industry: "Technology" },
  { id: "client-6", name: "Retail Solutions Co", industry: "Retail" },
  { id: "client-7", name: "Digital Marketing Pro", industry: "Marketing" },
  { id: "client-8", name: "EduTech Solutions", industry: "Education" },
  { id: "client-9", name: "ServiceFirst Inc", industry: "Technology" },
  { id: "client-10", name: "InsightCorp", industry: "Analytics" },
  { id: "client-11", name: "SocialBuzz Agency", industry: "Marketing" },
  { id: "client-12", name: "Hospitality Tech", industry: "Hospitality" },
  { id: "client-13", name: "OldTech Industries", industry: "Technology" },
  { id: "client-14", name: "Property Solutions LLC", industry: "Real Estate" },
  { id: "client-15", name: "CloudFirst Solutions", industry: "Technology" }
];

// Helper function to get sample data based on onboarding state
export const getSampleData = () => ({
  projects: sampleProjects,
  clients: sampleClients
});

// Portfolio intelligence insights that the sample data demonstrates
export const sampleInsights = {
  patterns: [
    "Scope changes occur in 60% of troubled projects",
    "Technology projects show highest success rate (75%)",
    "Projects over 3 months duration have 40% higher risk",
    "Client satisfaction correlates strongly with timeline adherence"
  ],
  recommendations: [
    "Implement stricter scope change management process",
    "Consider shorter project cycles to reduce risk",
    "Increase communication frequency for complex projects",
    "Establish clear milestone checkpoints for budget tracking"
  ]
};