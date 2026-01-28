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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      award_classifications: {
        Row: {
          base_hourly_rate: number
          created_at: string
          description: string | null
          evening_multiplier: number | null
          id: string
          name: string
          night_multiplier: number | null
          overtime_multiplier: number | null
          public_holiday_multiplier: number | null
          saturday_multiplier: number | null
          sunday_multiplier: number | null
          updated_at: string
        }
        Insert: {
          base_hourly_rate: number
          created_at?: string
          description?: string | null
          evening_multiplier?: number | null
          id?: string
          name: string
          night_multiplier?: number | null
          overtime_multiplier?: number | null
          public_holiday_multiplier?: number | null
          saturday_multiplier?: number | null
          sunday_multiplier?: number | null
          updated_at?: string
        }
        Update: {
          base_hourly_rate?: number
          created_at?: string
          description?: string | null
          evening_multiplier?: number | null
          id?: string
          name?: string
          night_multiplier?: number | null
          overtime_multiplier?: number | null
          public_holiday_multiplier?: number | null
          saturday_multiplier?: number | null
          sunday_multiplier?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      competencies: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          display_order: number | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      competency_ratings: {
        Row: {
          comments: string | null
          competency_id: string
          created_at: string
          id: string
          rating: number | null
          review_id: string
          updated_at: string
        }
        Insert: {
          comments?: string | null
          competency_id: string
          created_at?: string
          id?: string
          rating?: number | null
          review_id: string
          updated_at?: string
        }
        Update: {
          comments?: string | null
          competency_id?: string
          created_at?: string
          id?: string
          rating?: number | null
          review_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "competency_ratings_competency_id_fkey"
            columns: ["competency_id"]
            isOneToOne: false
            referencedRelation: "competencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competency_ratings_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "performance_reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_audit_log: {
        Row: {
          action: string
          actor_email: string | null
          actor_name: string | null
          contract_id: string
          created_at: string
          details: Json | null
          id: string
          ip_address: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_name?: string | null
          contract_id: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_name?: string | null
          contract_id?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contract_audit_log_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          content: string
          created_at: string
          created_by: string | null
          department: string | null
          description: string | null
          employee_email: string
          employee_name: string
          employment_type: string | null
          expires_at: string | null
          id: string
          pay_rate: number | null
          position: string
          signed_at: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["contract_status"]
          title: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by?: string | null
          department?: string | null
          description?: string | null
          employee_email: string
          employee_name: string
          employment_type?: string | null
          expires_at?: string | null
          id?: string
          pay_rate?: number | null
          position: string
          signed_at?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["contract_status"]
          title: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string | null
          department?: string | null
          description?: string | null
          employee_email?: string
          employee_name?: string
          employment_type?: string | null
          expires_at?: string | null
          id?: string
          pay_rate?: number | null
          position?: string
          signed_at?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["contract_status"]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      departments: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      performance_reviews: {
        Row: {
          areas_for_improvement: string | null
          completed_at: string | null
          created_at: string
          development_plan: string | null
          employee_comments: string | null
          employee_department: string | null
          employee_email: string
          employee_name: string
          employee_position: string | null
          id: string
          overall_feedback: string | null
          overall_rating: number | null
          review_period_end: string
          review_period_start: string
          review_type: Database["public"]["Enums"]["review_type"]
          reviewer_email: string
          reviewer_name: string
          status: Database["public"]["Enums"]["review_status"]
          strengths: string | null
          updated_at: string
        }
        Insert: {
          areas_for_improvement?: string | null
          completed_at?: string | null
          created_at?: string
          development_plan?: string | null
          employee_comments?: string | null
          employee_department?: string | null
          employee_email: string
          employee_name: string
          employee_position?: string | null
          id?: string
          overall_feedback?: string | null
          overall_rating?: number | null
          review_period_end: string
          review_period_start: string
          review_type?: Database["public"]["Enums"]["review_type"]
          reviewer_email: string
          reviewer_name: string
          status?: Database["public"]["Enums"]["review_status"]
          strengths?: string | null
          updated_at?: string
        }
        Update: {
          areas_for_improvement?: string | null
          completed_at?: string | null
          created_at?: string
          development_plan?: string | null
          employee_comments?: string | null
          employee_department?: string | null
          employee_email?: string
          employee_name?: string
          employee_position?: string | null
          id?: string
          overall_feedback?: string | null
          overall_rating?: number | null
          review_period_end?: string
          review_period_start?: string
          review_type?: Database["public"]["Enums"]["review_type"]
          reviewer_email?: string
          reviewer_name?: string
          status?: Database["public"]["Enums"]["review_status"]
          strengths?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      positions: {
        Row: {
          created_at: string
          department_id: string | null
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          department_id?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          department_id?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "positions_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      review_feedback: {
        Row: {
          additional_comments: string | null
          areas_for_improvement: string | null
          created_at: string
          feedback_type: Database["public"]["Enums"]["feedback_type"]
          id: string
          is_anonymous: boolean | null
          overall_rating: number | null
          relationship_to_employee: string | null
          responder_email: string
          responder_name: string
          review_id: string
          status: string | null
          strengths: string | null
          submitted_at: string | null
          updated_at: string
        }
        Insert: {
          additional_comments?: string | null
          areas_for_improvement?: string | null
          created_at?: string
          feedback_type: Database["public"]["Enums"]["feedback_type"]
          id?: string
          is_anonymous?: boolean | null
          overall_rating?: number | null
          relationship_to_employee?: string | null
          responder_email: string
          responder_name: string
          review_id: string
          status?: string | null
          strengths?: string | null
          submitted_at?: string | null
          updated_at?: string
        }
        Update: {
          additional_comments?: string | null
          areas_for_improvement?: string | null
          created_at?: string
          feedback_type?: Database["public"]["Enums"]["feedback_type"]
          id?: string
          is_anonymous?: boolean | null
          overall_rating?: number | null
          relationship_to_employee?: string | null
          responder_email?: string
          responder_name?: string
          review_id?: string
          status?: string | null
          strengths?: string | null
          submitted_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_feedback_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "performance_reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      review_goals: {
        Row: {
          created_at: string
          description: string | null
          employee_notes: string | null
          id: string
          manager_notes: string | null
          progress_percentage: number | null
          review_id: string
          status: string | null
          target_date: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          employee_notes?: string | null
          id?: string
          manager_notes?: string | null
          progress_percentage?: number | null
          review_id: string
          status?: string | null
          target_date?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          employee_notes?: string | null
          id?: string
          manager_notes?: string | null
          progress_percentage?: number | null
          review_id?: string
          status?: string | null
          target_date?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_goals_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "performance_reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      sidebar_settings: {
        Row: {
          created_at: string
          display_order: number
          id: string
          is_visible: boolean
          module_key: string
          module_label: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          is_visible?: boolean
          module_key: string
          module_label: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          is_visible?: boolean
          module_key?: string
          module_label?: string
          updated_at?: string
        }
        Relationships: []
      }
      signatures: {
        Row: {
          contract_id: string
          id: string
          ip_address: string | null
          signature_data: string
          signature_type: string
          signed_at: string
          signer_email: string
          signer_name: string
          user_agent: string | null
        }
        Insert: {
          contract_id: string
          id?: string
          ip_address?: string | null
          signature_data: string
          signature_type?: string
          signed_at?: string
          signer_email: string
          signer_name: string
          user_agent?: string | null
        }
        Update: {
          contract_id?: string
          id?: string
          ip_address?: string | null
          signature_data?: string
          signature_type?: string
          signed_at?: string
          signer_email?: string
          signer_name?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "signatures_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: true
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      supervision_sessions: {
        Row: {
          action_items: string | null
          created_at: string
          created_by: string | null
          duration_minutes: number | null
          follow_up_required: boolean | null
          id: string
          location: string | null
          next_session_date: string | null
          notes: string | null
          session_date: string
          supervision_id: string
          topics_discussed: string | null
          updated_at: string
        }
        Insert: {
          action_items?: string | null
          created_at?: string
          created_by?: string | null
          duration_minutes?: number | null
          follow_up_required?: boolean | null
          id?: string
          location?: string | null
          next_session_date?: string | null
          notes?: string | null
          session_date: string
          supervision_id: string
          topics_discussed?: string | null
          updated_at?: string
        }
        Update: {
          action_items?: string | null
          created_at?: string
          created_by?: string | null
          duration_minutes?: number | null
          follow_up_required?: boolean | null
          id?: string
          location?: string | null
          next_session_date?: string | null
          notes?: string | null
          session_date?: string
          supervision_id?: string
          topics_discussed?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "supervision_sessions_supervision_id_fkey"
            columns: ["supervision_id"]
            isOneToOne: false
            referencedRelation: "supervisions"
            referencedColumns: ["id"]
          },
        ]
      }
      supervisions: {
        Row: {
          created_at: string
          employee_email: string
          employee_name: string
          end_date: string | null
          id: string
          is_active: boolean
          notes: string | null
          start_date: string
          supervisor_email: string
          supervisor_name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          employee_email: string
          employee_name: string
          end_date?: string | null
          id?: string
          is_active?: boolean
          notes?: string | null
          start_date?: string
          supervisor_email: string
          supervisor_name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          employee_email?: string
          employee_name?: string
          end_date?: string | null
          id?: string
          is_active?: boolean
          notes?: string | null
          start_date?: string
          supervisor_email?: string
          supervisor_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "manager" | "employee"
      contract_status:
        | "draft"
        | "pending_signature"
        | "signed"
        | "expired"
        | "voided"
      feedback_type: "self" | "manager" | "peer" | "direct_report"
      review_status: "draft" | "in_progress" | "pending_approval" | "completed"
      review_type: "performance" | "annual" | "probation"
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
      app_role: ["admin", "manager", "employee"],
      contract_status: [
        "draft",
        "pending_signature",
        "signed",
        "expired",
        "voided",
      ],
      feedback_type: ["self", "manager", "peer", "direct_report"],
      review_status: ["draft", "in_progress", "pending_approval", "completed"],
      review_type: ["performance", "annual", "probation"],
    },
  },
} as const
