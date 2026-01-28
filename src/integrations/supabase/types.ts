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
      audit_logs: {
        Row: {
          action: string
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: string | null
          new_values: Json | null
          old_values: Json | null
          user_agent: string | null
          user_email: string | null
          user_id: string | null
          user_name: string | null
        }
        Insert: {
          action: string
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: string | null
          new_values?: Json | null
          old_values?: Json | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
          user_name?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: string | null
          new_values?: Json | null
          old_values?: Json | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
          user_name?: string | null
        }
        Relationships: []
      }
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
      compliance_rules: {
        Row: {
          created_at: string
          document_type_id: string
          id: string
          is_required: boolean | null
          target_type: Database["public"]["Enums"]["assignment_target_type"]
          target_value: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          document_type_id: string
          id?: string
          is_required?: boolean | null
          target_type: Database["public"]["Enums"]["assignment_target_type"]
          target_value?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          document_type_id?: string
          id?: string
          is_required?: boolean | null
          target_type?: Database["public"]["Enums"]["assignment_target_type"]
          target_value?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "compliance_rules_document_type_id_fkey"
            columns: ["document_type_id"]
            isOneToOne: false
            referencedRelation: "document_types"
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
      course_assignments: {
        Row: {
          assigned_by: string | null
          assigned_by_name: string | null
          auto_assign_on_hire: boolean | null
          course_id: string
          created_at: string
          due_date: string | null
          id: string
          is_mandatory: boolean | null
          notes: string | null
          recurrence: Database["public"]["Enums"]["recurrence_type"] | null
          target_type: Database["public"]["Enums"]["assignment_target_type"]
          target_value: string | null
          updated_at: string
        }
        Insert: {
          assigned_by?: string | null
          assigned_by_name?: string | null
          auto_assign_on_hire?: boolean | null
          course_id: string
          created_at?: string
          due_date?: string | null
          id?: string
          is_mandatory?: boolean | null
          notes?: string | null
          recurrence?: Database["public"]["Enums"]["recurrence_type"] | null
          target_type: Database["public"]["Enums"]["assignment_target_type"]
          target_value?: string | null
          updated_at?: string
        }
        Update: {
          assigned_by?: string | null
          assigned_by_name?: string | null
          auto_assign_on_hire?: boolean | null
          course_id?: string
          created_at?: string
          due_date?: string | null
          id?: string
          is_mandatory?: boolean | null
          notes?: string | null
          recurrence?: Database["public"]["Enums"]["recurrence_type"] | null
          target_type?: Database["public"]["Enums"]["assignment_target_type"]
          target_value?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_assignments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_modules: {
        Row: {
          content_text: string | null
          content_url: string | null
          course_id: string
          created_at: string
          description: string | null
          display_order: number | null
          duration_minutes: number | null
          id: string
          is_required: boolean | null
          module_type: Database["public"]["Enums"]["module_type"]
          title: string
          updated_at: string
        }
        Insert: {
          content_text?: string | null
          content_url?: string | null
          course_id: string
          created_at?: string
          description?: string | null
          display_order?: number | null
          duration_minutes?: number | null
          id?: string
          is_required?: boolean | null
          module_type: Database["public"]["Enums"]["module_type"]
          title: string
          updated_at?: string
        }
        Update: {
          content_text?: string | null
          content_url?: string | null
          course_id?: string
          created_at?: string
          description?: string | null
          display_order?: number | null
          duration_minutes?: number | null
          id?: string
          is_required?: boolean | null
          module_type?: Database["public"]["Enums"]["module_type"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_modules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          estimated_duration_minutes: number | null
          id: string
          is_active: boolean | null
          is_published: boolean | null
          pass_mark: number | null
          thumbnail_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          estimated_duration_minutes?: number | null
          id?: string
          is_active?: boolean | null
          is_published?: boolean | null
          pass_mark?: number | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          estimated_duration_minutes?: number | null
          id?: string
          is_active?: boolean | null
          is_published?: boolean | null
          pass_mark?: number | null
          thumbnail_url?: string | null
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
      document_reviews: {
        Row: {
          action: Database["public"]["Enums"]["document_status"]
          comments: string | null
          created_at: string
          document_id: string
          id: string
          reviewer_email: string
          reviewer_id: string
          reviewer_name: string
        }
        Insert: {
          action: Database["public"]["Enums"]["document_status"]
          comments?: string | null
          created_at?: string
          document_id: string
          id?: string
          reviewer_email: string
          reviewer_id: string
          reviewer_name: string
        }
        Update: {
          action?: Database["public"]["Enums"]["document_status"]
          comments?: string | null
          created_at?: string
          document_id?: string
          id?: string
          reviewer_email?: string
          reviewer_id?: string
          reviewer_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_reviews_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "employee_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      document_types: {
        Row: {
          created_at: string
          description: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          is_required: boolean | null
          name: string
          updated_at: string
          validity_months: number | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          is_required?: boolean | null
          name: string
          updated_at?: string
          validity_months?: number | null
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          is_required?: boolean | null
          name?: string
          updated_at?: string
          validity_months?: number | null
        }
        Relationships: []
      }
      document_versions: {
        Row: {
          created_at: string
          document_id: string
          file_name: string
          file_url: string
          id: string
          uploaded_by: string
          version_number: number
        }
        Insert: {
          created_at?: string
          document_id: string
          file_name: string
          file_url: string
          id?: string
          uploaded_by: string
          version_number: number
        }
        Update: {
          created_at?: string
          document_id?: string
          file_name?: string
          file_url?: string
          id?: string
          uploaded_by?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "document_versions_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "employee_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_documents: {
        Row: {
          created_at: string
          current_version: number | null
          document_type_id: string
          expiry_date: string | null
          file_name: string
          file_url: string
          id: string
          issue_date: string | null
          status: Database["public"]["Enums"]["document_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_version?: number | null
          document_type_id: string
          expiry_date?: string | null
          file_name: string
          file_url: string
          id?: string
          issue_date?: string | null
          status?: Database["public"]["Enums"]["document_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_version?: number | null
          document_type_id?: string
          expiry_date?: string | null
          file_name?: string
          file_url?: string
          id?: string
          issue_date?: string | null
          status?: Database["public"]["Enums"]["document_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_documents_document_type_id_fkey"
            columns: ["document_type_id"]
            isOneToOne: false
            referencedRelation: "document_types"
            referencedColumns: ["id"]
          },
        ]
      }
      module_completions: {
        Row: {
          completed_at: string
          created_at: string
          id: string
          module_id: string
          policy_acknowledged_at: string | null
          time_spent_seconds: number | null
          user_assignment_id: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string
          created_at?: string
          id?: string
          module_id: string
          policy_acknowledged_at?: string | null
          time_spent_seconds?: number | null
          user_assignment_id?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string
          created_at?: string
          id?: string
          module_id?: string
          policy_acknowledged_at?: string | null
          time_spent_seconds?: number | null
          user_assignment_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "module_completions_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "course_modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "module_completions_user_assignment_id_fkey"
            columns: ["user_assignment_id"]
            isOneToOne: false
            referencedRelation: "user_course_assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          category: string | null
          created_at: string
          id: string
          is_read: boolean | null
          link: string | null
          message: string
          read_at: string | null
          title: string
          type: string | null
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          id?: string
          is_read?: boolean | null
          link?: string | null
          message: string
          read_at?: string | null
          title: string
          type?: string | null
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          id?: string
          is_read?: boolean | null
          link?: string | null
          message?: string
          read_at?: string | null
          title?: string
          type?: string | null
          user_id?: string
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
      quiz_attempts: {
        Row: {
          answers: Json | null
          attempt_number: number | null
          completed_at: string | null
          created_at: string
          id: string
          max_score: number | null
          module_id: string
          passed: boolean | null
          percentage: number | null
          score: number | null
          started_at: string
          time_spent_seconds: number | null
          user_assignment_id: string | null
          user_id: string
        }
        Insert: {
          answers?: Json | null
          attempt_number?: number | null
          completed_at?: string | null
          created_at?: string
          id?: string
          max_score?: number | null
          module_id: string
          passed?: boolean | null
          percentage?: number | null
          score?: number | null
          started_at?: string
          time_spent_seconds?: number | null
          user_assignment_id?: string | null
          user_id: string
        }
        Update: {
          answers?: Json | null
          attempt_number?: number | null
          completed_at?: string | null
          created_at?: string
          id?: string
          max_score?: number | null
          module_id?: string
          passed?: boolean | null
          percentage?: number | null
          score?: number | null
          started_at?: string
          time_spent_seconds?: number | null
          user_assignment_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "course_modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_attempts_user_assignment_id_fkey"
            columns: ["user_assignment_id"]
            isOneToOne: false
            referencedRelation: "user_course_assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_questions: {
        Row: {
          created_at: string
          display_order: number | null
          explanation: string | null
          id: string
          module_id: string
          options: Json
          points: number | null
          question_text: string
          question_type: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number | null
          explanation?: string | null
          id?: string
          module_id: string
          options?: Json
          points?: number | null
          question_text: string
          question_type?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number | null
          explanation?: string | null
          id?: string
          module_id?: string
          options?: Json
          points?: number | null
          question_text?: string
          question_type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_questions_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "course_modules"
            referencedColumns: ["id"]
          },
        ]
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
      user_course_assignments: {
        Row: {
          assignment_id: string | null
          completed_at: string | null
          course_id: string
          created_at: string
          due_date: string | null
          id: string
          progress_percentage: number | null
          started_at: string | null
          status: Database["public"]["Enums"]["assignment_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          assignment_id?: string | null
          completed_at?: string | null
          course_id: string
          created_at?: string
          due_date?: string | null
          id?: string
          progress_percentage?: number | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["assignment_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          assignment_id?: string | null
          completed_at?: string | null
          course_id?: string
          created_at?: string
          due_date?: string | null
          id?: string
          progress_percentage?: number | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["assignment_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_course_assignments_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "course_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_course_assignments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
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
      assignment_status: "assigned" | "in_progress" | "completed" | "overdue"
      assignment_target_type:
        | "individual"
        | "team"
        | "role"
        | "department"
        | "location"
        | "all"
      contract_status:
        | "draft"
        | "pending_signature"
        | "signed"
        | "expired"
        | "voided"
      document_status: "pending" | "approved" | "rejected" | "expired"
      feedback_type: "self" | "manager" | "peer" | "direct_report"
      module_type: "video" | "pdf" | "policy" | "quiz"
      recurrence_type: "none" | "annual" | "biannual" | "quarterly" | "monthly"
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
      assignment_status: ["assigned", "in_progress", "completed", "overdue"],
      assignment_target_type: [
        "individual",
        "team",
        "role",
        "department",
        "location",
        "all",
      ],
      contract_status: [
        "draft",
        "pending_signature",
        "signed",
        "expired",
        "voided",
      ],
      document_status: ["pending", "approved", "rejected", "expired"],
      feedback_type: ["self", "manager", "peer", "direct_report"],
      module_type: ["video", "pdf", "policy", "quiz"],
      recurrence_type: ["none", "annual", "biannual", "quarterly", "monthly"],
      review_status: ["draft", "in_progress", "pending_approval", "completed"],
      review_type: ["performance", "annual", "probation"],
    },
  },
} as const
