export interface Profile {
  id: string;
  email: string;
  role: 'admin' | 'power_user' | 'basic_user';
  subscription_tier: 'free' | 'team' | 'business' | 'enterprise';
  first_name?: string;
  last_name?: string;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  name: string;
  logo_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Lesson {
  id: string;
  project_name: string;
  role: string;
  client_name?: string;
  satisfaction: number; // 1-5
  budget_status: 'under' | 'on' | 'over';
  scope_change: boolean;
  timeline_status: string;
  notes?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface LessonFilters {
  project_name?: string;
  role?: string;
  client_name?: string;
  satisfaction?: number[];
  budget_status?: ('under' | 'on' | 'over')[];
  scope_change?: boolean;
  timeline_status?: string[];
}

export interface ChartData {
  satisfaction: { rating: number; count: number }[];
  budget: { status: string; count: number }[];
}