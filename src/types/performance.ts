export type ReviewType = 'performance' | 'annual' | 'probation';
export type ReviewStatus = 'draft' | 'in_progress' | 'pending_approval' | 'completed';
export type FeedbackType = 'self' | 'manager' | 'peer' | 'direct_report';

export interface Supervision {
  id: string;
  supervisor_name: string;
  supervisor_email: string;
  employee_name: string;
  employee_email: string;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface SupervisionSession {
  id: string;
  supervision_id: string;
  session_date: string;
  duration_minutes: number | null;
  location: string | null;
  topics_discussed: string | null;
  action_items: string | null;
  follow_up_required: boolean | null;
  next_session_date: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Competency {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  display_order: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PerformanceReview {
  id: string;
  employee_name: string;
  employee_email: string;
  employee_position: string | null;
  employee_department: string | null;
  reviewer_name: string;
  reviewer_email: string;
  review_type: ReviewType;
  review_period_start: string;
  review_period_end: string;
  status: ReviewStatus;
  overall_rating: number | null;
  overall_feedback: string | null;
  strengths: string | null;
  areas_for_improvement: string | null;
  development_plan: string | null;
  employee_comments: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReviewGoal {
  id: string;
  review_id: string;
  title: string;
  description: string | null;
  target_date: string | null;
  progress_percentage: number | null;
  status: 'not_started' | 'in_progress' | 'completed' | 'deferred' | null;
  manager_notes: string | null;
  employee_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CompetencyRating {
  id: string;
  review_id: string;
  competency_id: string;
  rating: number | null;
  comments: string | null;
  created_at: string;
  updated_at: string;
  competency?: Competency;
}

export interface ReviewFeedback {
  id: string;
  review_id: string;
  feedback_type: FeedbackType;
  responder_name: string;
  responder_email: string;
  relationship_to_employee: string | null;
  overall_rating: number | null;
  strengths: string | null;
  areas_for_improvement: string | null;
  additional_comments: string | null;
  is_anonymous: boolean | null;
  submitted_at: string | null;
  status: 'pending' | 'submitted' | null;
  created_at: string;
  updated_at: string;
}
