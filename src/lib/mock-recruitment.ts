import { 
  JobPosting, 
  Applicant, 
  OnboardingTask, 
  OnboardingProgress,
  ApplicantStage 
} from '@/types/recruitment';

const daysAgo = (days: number): string => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split('T')[0];
};

const daysFromNow = (days: number): string => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
};

export const mockJobPostings: JobPosting[] = [
  {
    id: 'job-1',
    title: 'Support Worker',
    department: 'Disability Services',
    location: 'Melbourne, VIC',
    employmentType: 'casual',
    payRateMin: 35,
    payRateMax: 42,
    description: 'We are looking for compassionate and dedicated Support Workers to join our team providing high-quality disability support services.',
    requirements: [
      'Certificate III in Individual Support or equivalent',
      'Current NDIS Worker Screening Check',
      'Valid drivers licence and reliable vehicle',
      'First Aid and CPR certification',
      'Experience working with people with disabilities (preferred)',
    ],
    status: 'active',
    applicantCount: 12,
    createdAt: daysAgo(14),
    closingDate: daysFromNow(16),
  },
  {
    id: 'job-2',
    title: 'Senior Support Worker',
    department: 'Community Support',
    location: 'Sydney, NSW',
    employmentType: 'part_time',
    payRateMin: 42,
    payRateMax: 50,
    description: 'Experienced Senior Support Worker needed to mentor junior staff and provide complex support services.',
    requirements: [
      'Certificate IV in Disability or equivalent',
      'Minimum 3 years experience in disability support',
      'Leadership experience',
      'Current NDIS Worker Screening Check',
      'Advanced First Aid certification',
    ],
    status: 'active',
    applicantCount: 5,
    createdAt: daysAgo(7),
    closingDate: daysFromNow(23),
  },
  {
    id: 'job-3',
    title: 'Team Coordinator',
    department: 'Operations',
    location: 'Brisbane, QLD',
    employmentType: 'full_time',
    payRateMin: 55,
    payRateMax: 65,
    description: 'Lead a team of support workers and ensure delivery of exceptional support services.',
    requirements: [
      'Diploma in Community Services or equivalent',
      'Minimum 5 years in disability sector',
      'Team management experience',
      'Strong communication and organizational skills',
    ],
    status: 'paused',
    applicantCount: 3,
    createdAt: daysAgo(21),
    closingDate: daysFromNow(9),
  },
  {
    id: 'job-4',
    title: 'Allied Health Assistant',
    department: 'Allied Health',
    location: 'Melbourne, VIC',
    employmentType: 'contractor',
    payRateMin: 45,
    payRateMax: 55,
    description: 'Support our allied health professionals in delivering therapy services to NDIS participants.',
    requirements: [
      'Certificate IV in Allied Health Assistance',
      'Experience in therapy support',
      'NDIS Worker Screening Check',
    ],
    status: 'draft',
    applicantCount: 0,
    createdAt: daysAgo(2),
  },
];

export const mockApplicants: Applicant[] = [
  {
    id: 'app-1',
    firstName: 'James',
    lastName: 'Wilson',
    email: 'james.wilson@email.com',
    phone: '0412 111 222',
    jobId: 'job-1',
    jobTitle: 'Support Worker',
    stage: 'interview',
    rating: 4,
    appliedAt: daysAgo(5),
    notes: [
      { id: 'n1', content: 'Strong application, relevant experience', author: 'HR Manager', createdAt: daysAgo(4) },
      { id: 'n2', content: 'Phone screening completed - very articulate', author: 'HR Manager', createdAt: daysAgo(3) },
    ],
    documents: [
      { id: 'd1', name: 'Resume - James Wilson.pdf', type: 'resume', url: '#', uploadedAt: daysAgo(5) },
    ],
  },
  {
    id: 'app-2',
    firstName: 'Sophie',
    lastName: 'Anderson',
    email: 'sophie.a@email.com',
    phone: '0423 222 333',
    jobId: 'job-1',
    jobTitle: 'Support Worker',
    stage: 'offer',
    rating: 5,
    appliedAt: daysAgo(10),
    notes: [
      { id: 'n3', content: 'Excellent candidate, 4 years experience', author: 'HR Manager', createdAt: daysAgo(9) },
      { id: 'n4', content: 'Interview went exceptionally well', author: 'Team Lead', createdAt: daysAgo(6) },
      { id: 'n5', content: 'References checked - all positive', author: 'HR Manager', createdAt: daysAgo(2) },
    ],
    documents: [
      { id: 'd2', name: 'Resume - Sophie Anderson.pdf', type: 'resume', url: '#', uploadedAt: daysAgo(10) },
      { id: 'd3', name: 'Cover Letter.pdf', type: 'cover_letter', url: '#', uploadedAt: daysAgo(10) },
    ],
  },
  {
    id: 'app-3',
    firstName: 'Marcus',
    lastName: 'Lee',
    email: 'marcus.lee@email.com',
    phone: '0434 333 444',
    jobId: 'job-1',
    jobTitle: 'Support Worker',
    stage: 'screening',
    rating: 3,
    appliedAt: daysAgo(2),
    notes: [],
    documents: [
      { id: 'd4', name: 'Resume - Marcus Lee.pdf', type: 'resume', url: '#', uploadedAt: daysAgo(2) },
    ],
  },
  {
    id: 'app-4',
    firstName: 'Emma',
    lastName: 'Roberts',
    email: 'emma.r@email.com',
    phone: '0445 444 555',
    jobId: 'job-1',
    jobTitle: 'Support Worker',
    stage: 'applied',
    rating: 0,
    appliedAt: daysAgo(1),
    notes: [],
    documents: [
      { id: 'd5', name: 'Resume.pdf', type: 'resume', url: '#', uploadedAt: daysAgo(1) },
    ],
  },
  {
    id: 'app-5',
    firstName: 'David',
    lastName: 'Kim',
    email: 'david.kim@email.com',
    phone: '0456 555 666',
    jobId: 'job-2',
    jobTitle: 'Senior Support Worker',
    stage: 'reference_check',
    rating: 4,
    appliedAt: daysAgo(6),
    notes: [
      { id: 'n6', content: 'Great leadership potential', author: 'HR Manager', createdAt: daysAgo(4) },
    ],
    documents: [
      { id: 'd6', name: 'Resume - David Kim.pdf', type: 'resume', url: '#', uploadedAt: daysAgo(6) },
      { id: 'd7', name: 'Certificates.pdf', type: 'certificate', url: '#', uploadedAt: daysAgo(6) },
    ],
  },
  {
    id: 'app-6',
    firstName: 'Rachel',
    lastName: 'Green',
    email: 'rachel.g@email.com',
    phone: '0467 666 777',
    jobId: 'job-1',
    jobTitle: 'Support Worker',
    stage: 'rejected',
    rating: 2,
    appliedAt: daysAgo(12),
    notes: [
      { id: 'n7', content: 'Does not meet minimum requirements', author: 'HR Manager', createdAt: daysAgo(11) },
    ],
    documents: [],
  },
  {
    id: 'app-7',
    firstName: 'Tom',
    lastName: 'Harris',
    email: 'tom.h@email.com',
    phone: '0478 777 888',
    jobId: 'job-1',
    jobTitle: 'Support Worker',
    stage: 'hired',
    rating: 5,
    appliedAt: daysAgo(20),
    notes: [
      { id: 'n8', content: 'Offer accepted!', author: 'HR Manager', createdAt: daysAgo(8) },
    ],
    documents: [],
  },
];

export const mockOnboardingTasks: OnboardingTask[] = [
  { id: 'task-1', title: 'Submit ID Documents', description: 'Upload proof of identity (passport or drivers licence)', category: 'documents', dueInDays: 1, required: true },
  { id: 'task-2', title: 'Sign Employment Contract', description: 'Review and digitally sign your employment contract', category: 'documents', dueInDays: 1, required: true },
  { id: 'task-3', title: 'Complete Tax Declaration', description: 'Submit TFN declaration and superannuation choice form', category: 'admin', dueInDays: 3, required: true },
  { id: 'task-4', title: 'NDIS Worker Screening', description: 'Provide NDIS Worker Screening clearance or apply for one', category: 'compliance', dueInDays: 7, required: true },
  { id: 'task-5', title: 'Police Check', description: 'Submit current police check or apply for a new one', category: 'compliance', dueInDays: 7, required: true },
  { id: 'task-6', title: 'First Aid Certificate', description: 'Upload current First Aid certificate', category: 'compliance', dueInDays: 14, required: true },
  { id: 'task-7', title: 'Workplace Induction', description: 'Complete online workplace induction training', category: 'training', dueInDays: 7, required: true },
  { id: 'task-8', title: 'NDIS Orientation', description: 'Complete NDIS Worker Orientation Module', category: 'training', dueInDays: 14, required: true },
  { id: 'task-9', title: 'Manual Handling Training', description: 'Complete manual handling safety training', category: 'training', dueInDays: 14, required: false },
  { id: 'task-10', title: 'IT System Setup', description: 'Set up work email and access to internal systems', category: 'setup', dueInDays: 3, required: true },
  { id: 'task-11', title: 'Uniform Collection', description: 'Collect work uniform from office', category: 'setup', dueInDays: 7, required: false },
  { id: 'task-12', title: 'Emergency Contact Form', description: 'Submit emergency contact details', category: 'admin', dueInDays: 3, required: true },
];

export const mockOnboardingProgress: OnboardingProgress[] = [
  {
    employeeId: 'emp-new-1',
    employeeName: 'Alex Nguyen',
    startDate: daysFromNow(7),
    tasks: [
      { taskId: 'task-1', status: 'completed', completedAt: daysAgo(2) },
      { taskId: 'task-2', status: 'completed', completedAt: daysAgo(1) },
      { taskId: 'task-3', status: 'in_progress' },
      { taskId: 'task-4', status: 'pending' },
      { taskId: 'task-5', status: 'pending' },
      { taskId: 'task-6', status: 'pending' },
      { taskId: 'task-7', status: 'pending' },
      { taskId: 'task-8', status: 'pending' },
      { taskId: 'task-9', status: 'pending' },
      { taskId: 'task-10', status: 'pending' },
      { taskId: 'task-11', status: 'pending' },
      { taskId: 'task-12', status: 'pending' },
    ],
    completionPercentage: 17,
  },
  {
    employeeId: 'emp-new-2',
    employeeName: 'Tom Harris',
    startDate: daysFromNow(3),
    tasks: [
      { taskId: 'task-1', status: 'completed', completedAt: daysAgo(5) },
      { taskId: 'task-2', status: 'completed', completedAt: daysAgo(4) },
      { taskId: 'task-3', status: 'completed', completedAt: daysAgo(3) },
      { taskId: 'task-4', status: 'completed', completedAt: daysAgo(2) },
      { taskId: 'task-5', status: 'completed', completedAt: daysAgo(2) },
      { taskId: 'task-6', status: 'completed', completedAt: daysAgo(1) },
      { taskId: 'task-7', status: 'in_progress' },
      { taskId: 'task-8', status: 'pending' },
      { taskId: 'task-9', status: 'pending' },
      { taskId: 'task-10', status: 'completed', completedAt: daysAgo(1) },
      { taskId: 'task-11', status: 'pending' },
      { taskId: 'task-12', status: 'completed', completedAt: daysAgo(3) },
    ],
    completionPercentage: 67,
  },
];

export const getApplicantsByJob = (jobId: string): Applicant[] => {
  return mockApplicants.filter(a => a.jobId === jobId);
};

export const getApplicantsByStage = (stage: ApplicantStage): Applicant[] => {
  return mockApplicants.filter(a => a.stage === stage);
};

export const getActiveJobPostings = (): JobPosting[] => {
  return mockJobPostings.filter(j => j.status === 'active');
};
