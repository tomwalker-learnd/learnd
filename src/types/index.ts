export interface Profile {
  id: string;
  email: string;
  role: 'admin' | 'power_user' | 'basic_user';
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
  user_id: string;
  project_name: string;
  role: string;
  client_id?: string | null;
  client?: Client | null;
  satisfaction_rating: number;
  budget_status: string;
  scope_changes: boolean;
  timeline_status: string;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface LessonFilters {
  project?: string;
  role?: string;
  client?: string;
  satisfaction?: number[];
  budget_status?: string[];
  scope_changes?: boolean;
  timeline_status?: string[];
}

export interface ChartData {
  satisfaction: { rating: number; count: number }[];
  budget: { status: string; count: number }[];
  scope: { changes: boolean; count: number }[];
}