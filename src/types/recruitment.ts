// Job Posting Types
export type JobStatus = 'draft' | 'active' | 'paused' | 'closed';
export type EmploymentType = 'casual' | 'part_time' | 'full_time' | 'contractor';

export interface JobPosting {
  id: string;
  title: string;
  department: string;
  location: string;
  employmentType: EmploymentType;
  payRateMin: number;
  payRateMax: number;
  description: string;
  requirements: string[];
  status: JobStatus;
  applicantCount: number;
  createdAt: string;
  closingDate?: string;
}

// Applicant Types
export type ApplicantStage = 
  | 'applied' 
  | 'screening' 
  | 'interview' 
  | 'reference_check' 
  | 'offer' 
  | 'hired' 
  | 'rejected';

export interface Applicant {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  jobId: string;
  jobTitle: string;
  stage: ApplicantStage;
  rating: number; // 1-5
  appliedAt: string;
  resumeUrl?: string;
  notes: ApplicantNote[];
  documents: ApplicantDocument[];
}

export interface ApplicantNote {
  id: string;
  content: string;
  author: string;
  createdAt: string;
}

export interface ApplicantDocument {
  id: string;
  name: string;
  type: 'resume' | 'cover_letter' | 'certificate' | 'id' | 'other';
  url: string;
  uploadedAt: string;
}

// Offer Letter Types
export type OfferStatus = 'draft' | 'sent' | 'viewed' | 'accepted' | 'declined' | 'expired';

export interface OfferLetter {
  id: string;
  applicantId: string;
  jobId: string;
  status: OfferStatus;
  salary: number;
  startDate: string;
  expiryDate: string;
  createdAt: string;
  sentAt?: string;
  respondedAt?: string;
}

// Onboarding Types
export type OnboardingTaskStatus = 'pending' | 'in_progress' | 'completed' | 'overdue';

export interface OnboardingTask {
  id: string;
  title: string;
  description: string;
  category: 'documents' | 'training' | 'compliance' | 'setup' | 'admin';
  dueInDays: number;
  required: boolean;
}

export interface OnboardingProgress {
  employeeId: string;
  employeeName: string;
  startDate: string;
  tasks: {
    taskId: string;
    status: OnboardingTaskStatus;
    completedAt?: string;
  }[];
  completionPercentage: number;
}
