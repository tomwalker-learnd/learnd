export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      ai_requests: {
        Row: {
          action: string
          context: Json | null
          created_at: string | null
          id: string
          prompt: string
          title: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          context?: Json | null
          created_at?: string | null
          id?: string
          prompt: string
          title?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          context?: Json | null
          created_at?: string | null
          id?: string
          prompt?: string
          title?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      ai_responses: {
        Row: {
          content: string
          created_at: string | null
          id: string
          request_id: string | null
          role: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          request_id?: string | null
          role: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          request_id?: string | null
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_responses_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "ai_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          created_at: string
          id: string
          logo_url: string | null
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      lessons: {
        Row: {
          acceptance_criteria_completeness: number | null
          actual_days: number | null
          assumptions_documented: boolean | null
          avoid_this: string | null
          billing_model: string | null
          budget_status: string
          change_approval_avg_days: number | null
          change_control_effectiveness: number | null
          change_control_process_used: boolean | null
          change_orders_approved_count: number | null
          change_orders_revenue_usd: number | null
          change_request_count: number | null
          client_name: string | null
          client_responsiveness: number | null
          created_at: string
          created_by: string
          discounts_concessions_usd: number | null
          effort_variance_pct: number | null
          expectation_alignment: number | null
          id: string
          industry: string | null
          initial_budget_usd: number | null
          internal_comms_effectiveness: number | null
          notes: string | null
          phase: string | null
          planned_days: number | null
          project_name: string
          project_type: string | null
          region: string | null
          repeat_this: string | null
          requirements_clarity: number | null
          requirements_volatility_count: number | null
          resource_availability: number | null
          rework_pct: number | null
          role: string
          satisfaction: number
          scope_authority_clarity: number | null
          scope_baseline_quality: number | null
          scope_change: boolean
          scope_dispute_occurred: boolean | null
          scope_dispute_resolution_days: number | null
          scope_dispute_severity: number | null
          skill_alignment: number | null
          stakeholder_engagement: number | null
          suggested_improvement_area: string | null
          team_morale: number | null
          timeline_status: string
          tooling_effectiveness: number | null
          updated_at: string
        }
        Insert: {
          acceptance_criteria_completeness?: number | null
          actual_days?: number | null
          assumptions_documented?: boolean | null
          avoid_this?: string | null
          billing_model?: string | null
          budget_status: string
          change_approval_avg_days?: number | null
          change_control_effectiveness?: number | null
          change_control_process_used?: boolean | null
          change_orders_approved_count?: number | null
          change_orders_revenue_usd?: number | null
          change_request_count?: number | null
          client_name?: string | null
          client_responsiveness?: number | null
          created_at?: string
          created_by: string
          discounts_concessions_usd?: number | null
          effort_variance_pct?: number | null
          expectation_alignment?: number | null
          id?: string
          industry?: string | null
          initial_budget_usd?: number | null
          internal_comms_effectiveness?: number | null
          notes?: string | null
          phase?: string | null
          planned_days?: number | null
          project_name: string
          project_type?: string | null
          region?: string | null
          repeat_this?: string | null
          requirements_clarity?: number | null
          requirements_volatility_count?: number | null
          resource_availability?: number | null
          rework_pct?: number | null
          role: string
          satisfaction: number
          scope_authority_clarity?: number | null
          scope_baseline_quality?: number | null
          scope_change?: boolean
          scope_dispute_occurred?: boolean | null
          scope_dispute_resolution_days?: number | null
          scope_dispute_severity?: number | null
          skill_alignment?: number | null
          stakeholder_engagement?: number | null
          suggested_improvement_area?: string | null
          team_morale?: number | null
          timeline_status: string
          tooling_effectiveness?: number | null
          updated_at?: string
        }
        Update: {
          acceptance_criteria_completeness?: number | null
          actual_days?: number | null
          assumptions_documented?: boolean | null
          avoid_this?: string | null
          billing_model?: string | null
          budget_status?: string
          change_approval_avg_days?: number | null
          change_control_effectiveness?: number | null
          change_control_process_used?: boolean | null
          change_orders_approved_count?: number | null
          change_orders_revenue_usd?: number | null
          change_request_count?: number | null
          client_name?: string | null
          client_responsiveness?: number | null
          created_at?: string
          created_by?: string
          discounts_concessions_usd?: number | null
          effort_variance_pct?: number | null
          expectation_alignment?: number | null
          id?: string
          industry?: string | null
          initial_budget_usd?: number | null
          internal_comms_effectiveness?: number | null
          notes?: string | null
          phase?: string | null
          planned_days?: number | null
          project_name?: string
          project_type?: string | null
          region?: string | null
          repeat_this?: string | null
          requirements_clarity?: number | null
          requirements_volatility_count?: number | null
          resource_availability?: number | null
          rework_pct?: number | null
          role?: string
          satisfaction?: number
          scope_authority_clarity?: number | null
          scope_baseline_quality?: number | null
          scope_change?: boolean
          scope_dispute_occurred?: boolean | null
          scope_dispute_resolution_days?: number | null
          scope_dispute_severity?: number | null
          skill_alignment?: number | null
          stakeholder_engagement?: number | null
          suggested_improvement_area?: string | null
          team_morale?: number | null
          timeline_status?: string
          tooling_effectiveness?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          first_name: string | null
          id: string
          last_name: string | null
          role: Database["public"]["Enums"]["user_role"]
          subscription_tier: Database["public"]["Enums"]["subscription_tier"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          first_name?: string | null
          id: string
          last_name?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          subscription_tier?: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          subscription_tier?: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string
        }
        Relationships: []
      }
      saved_dashboards: {
        Row: {
          config: Json
          created_at: string
          description: string | null
          id: string
          is_favorite: boolean
          name: string
          owner_user_id: string
          tags: string[] | null
          updated_at: string
          visibility: string
        }
        Insert: {
          config: Json
          created_at?: string
          description?: string | null
          id?: string
          is_favorite?: boolean
          name: string
          owner_user_id: string
          tags?: string[] | null
          updated_at?: string
          visibility?: string
        }
        Update: {
          config?: Json
          created_at?: string
          description?: string | null
          id?: string
          is_favorite?: boolean
          name?: string
          owner_user_id?: string
          tags?: string[] | null
          updated_at?: string
          visibility?: string
        }
        Relationships: []
      }
    }
    Views: {
      ai_messages_view: {
        Row: {
          action: string | null
          content: string | null
          created_at: string | null
          id: string | null
          role: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      can_update_role: {
        Args: { target_user_id: string }
        Returns: boolean
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
    }
    Enums: {
      subscription_tier: "free" | "team" | "business" | "enterprise"
      user_role: "admin" | "power_user" | "basic_user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      subscription_tier: ["free", "team", "business", "enterprise"],
      user_role: ["admin", "power_user", "basic_user"],
    },
  },
} as const
