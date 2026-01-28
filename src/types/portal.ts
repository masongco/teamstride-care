// Document Management Types
export type DocumentStatus = 'pending' | 'approved' | 'rejected' | 'expired';
export type ModuleType = 'video' | 'pdf' | 'policy' | 'quiz';
export type AssignmentStatus = 'assigned' | 'in_progress' | 'completed' | 'overdue';
export type AssignmentTargetType = 'individual' | 'team' | 'role' | 'department' | 'location' | 'all';
export type RecurrenceType = 'none' | 'annual' | 'biannual' | 'quarterly' | 'monthly';

export interface DocumentType {
  id: string;
  name: string;
  description: string | null;
  validity_months: number | null;
  is_required: boolean;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface EmployeeDocument {
  id: string;
  user_id: string;
  document_type_id: string;
  file_url: string;
  file_name: string;
  issue_date: string | null;
  expiry_date: string | null;
  status: DocumentStatus;
  current_version: number;
  created_at: string;
  updated_at: string;
  document_type?: DocumentType;
}

export interface DocumentVersion {
  id: string;
  document_id: string;
  version_number: number;
  file_url: string;
  file_name: string;
  uploaded_by: string;
  created_at: string;
}

export interface DocumentReview {
  id: string;
  document_id: string;
  reviewer_id: string;
  reviewer_name: string;
  reviewer_email: string;
  action: DocumentStatus;
  comments: string | null;
  created_at: string;
}

export interface ComplianceRule {
  id: string;
  document_type_id: string;
  target_type: AssignmentTargetType;
  target_value: string | null;
  is_required: boolean;
  created_at: string;
  updated_at: string;
  document_type?: DocumentType;
}

// LMS Types
export interface Course {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  estimated_duration_minutes: number | null;
  pass_mark: number;
  is_published: boolean;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  modules?: CourseModule[];
}

export interface CourseModule {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  module_type: ModuleType;
  content_url: string | null;
  content_text: string | null;
  is_required: boolean;
  display_order: number;
  duration_minutes: number | null;
  created_at: string;
  updated_at: string;
  questions?: QuizQuestion[];
}

export interface QuizQuestion {
  id: string;
  module_id: string;
  question_text: string;
  question_type: string;
  options: QuizOption[];
  explanation: string | null;
  points: number;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface QuizOption {
  text: string;
  is_correct: boolean;
}

export interface CourseAssignment {
  id: string;
  course_id: string;
  target_type: AssignmentTargetType;
  target_value: string | null;
  assigned_by: string | null;
  assigned_by_name: string | null;
  due_date: string | null;
  recurrence: RecurrenceType;
  auto_assign_on_hire: boolean;
  is_mandatory: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
  course?: Course;
}

export interface UserCourseAssignment {
  id: string;
  user_id: string;
  course_id: string;
  assignment_id: string | null;
  status: AssignmentStatus;
  due_date: string | null;
  started_at: string | null;
  completed_at: string | null;
  progress_percentage: number;
  created_at: string;
  updated_at: string;
  course?: Course;
}

export interface ModuleCompletion {
  id: string;
  user_id: string;
  module_id: string;
  user_assignment_id: string | null;
  completed_at: string;
  policy_acknowledged_at: string | null;
  time_spent_seconds: number | null;
  created_at: string;
}

export interface QuizAttempt {
  id: string;
  user_id: string;
  module_id: string;
  user_assignment_id: string | null;
  attempt_number: number;
  score: number | null;
  max_score: number | null;
  percentage: number | null;
  passed: boolean | null;
  answers: QuizAnswer[];
  started_at: string;
  completed_at: string | null;
  time_spent_seconds: number | null;
  created_at: string;
}

export interface QuizAnswer {
  question_id: string;
  selected_option: number;
  is_correct: boolean;
}

// Notification Types
export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  category: string | null;
  link: string | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

// Audit Log Types
export interface AuditLog {
  id: string;
  user_id: string | null;
  user_email: string | null;
  user_name: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  old_values: Record<string, any> | null;
  new_values: Record<string, any> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

// Compliance Dashboard Types
export interface ComplianceStatus {
  user_id: string;
  user_email: string;
  user_name: string;
  total_required_documents: number;
  approved_documents: number;
  pending_documents: number;
  expired_documents: number;
  expiring_soon_documents: number;
  missing_documents: number;
  is_compliant: boolean;
  total_assigned_training: number;
  completed_training: number;
  overdue_training: number;
  training_compliance_percentage: number;
}
