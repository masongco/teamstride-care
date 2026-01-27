import { Employee, LeaveRequest, Certification, DashboardMetrics, TimesheetEntry } from '@/types/hrms';

// Helper function to get dates
const daysFromNow = (days: number): string => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
};

const daysAgo = (days: number): string => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split('T')[0];
};

export const mockEmployees: Employee[] = [
  {
    id: '1',
    firstName: 'Sarah',
    lastName: 'Mitchell',
    email: 'sarah.mitchell@socialplus.com.au',
    phone: '0412 345 678',
    employmentType: 'part_time',
    position: 'Senior Support Worker',
    department: 'Community Support',
    startDate: '2022-03-15',
    status: 'active',
    complianceStatus: 'compliant',
    payRate: 42.50,
    awardClassification: 'Level 3.1',
    emergencyContact: {
      name: 'James Mitchell',
      phone: '0423 456 789',
      relationship: 'Spouse',
    },
    documents: [],
    certifications: [
      { id: 'c1', name: 'NDIS Worker Screening', type: 'ndis_screening', issueDate: daysAgo(180), expiryDate: daysFromNow(185), status: 'compliant' },
      { id: 'c2', name: 'First Aid Certificate', type: 'first_aid', issueDate: daysAgo(365), expiryDate: daysFromNow(730), status: 'compliant' },
      { id: 'c3', name: 'Police Check', type: 'police_check', issueDate: daysAgo(200), expiryDate: daysFromNow(165), status: 'compliant' },
    ],
  },
  {
    id: '2',
    firstName: 'Michael',
    lastName: 'Chen',
    email: 'michael.chen@socialplus.com.au',
    phone: '0423 456 789',
    employmentType: 'casual',
    position: 'Support Worker',
    department: 'Disability Services',
    startDate: '2023-08-01',
    status: 'active',
    complianceStatus: 'expiring',
    payRate: 38.75,
    awardClassification: 'Level 2.2',
    documents: [],
    certifications: [
      { id: 'c4', name: 'NDIS Worker Screening', type: 'ndis_screening', issueDate: daysAgo(350), expiryDate: daysFromNow(15), status: 'expiring' },
      { id: 'c5', name: 'CPR Certificate', type: 'cpr', issueDate: daysAgo(300), expiryDate: daysFromNow(65), status: 'compliant' },
    ],
  },
  {
    id: '3',
    firstName: 'Emma',
    lastName: 'Thompson',
    email: 'emma.thompson@socialplus.com.au',
    phone: '0434 567 890',
    employmentType: 'full_time',
    position: 'Team Coordinator',
    department: 'Operations',
    startDate: '2021-01-10',
    status: 'active',
    complianceStatus: 'compliant',
    payRate: 55.00,
    awardClassification: 'Level 4.1',
    documents: [],
    certifications: [
      { id: 'c6', name: 'NDIS Worker Screening', type: 'ndis_screening', issueDate: daysAgo(100), expiryDate: daysFromNow(265), status: 'compliant' },
      { id: 'c7', name: 'First Aid Certificate', type: 'first_aid', issueDate: daysAgo(200), expiryDate: daysFromNow(530), status: 'compliant' },
      { id: 'c8', name: 'Mental Health First Aid', type: 'training', issueDate: daysAgo(50), expiryDate: daysFromNow(680), status: 'compliant' },
    ],
  },
  {
    id: '4',
    firstName: 'David',
    lastName: 'Williams',
    email: 'david.williams@socialplus.com.au',
    phone: '0445 678 901',
    employmentType: 'casual',
    position: 'Support Worker',
    department: 'Community Support',
    startDate: '2024-01-15',
    status: 'active',
    complianceStatus: 'expired',
    payRate: 36.50,
    awardClassification: 'Level 1.3',
    documents: [],
    certifications: [
      { id: 'c9', name: 'Police Check', type: 'police_check', issueDate: daysAgo(400), expiryDate: daysAgo(35), status: 'expired' },
      { id: 'c10', name: 'NDIS Worker Screening', type: 'ndis_screening', issueDate: daysAgo(90), expiryDate: daysFromNow(275), status: 'compliant' },
    ],
  },
  {
    id: '5',
    firstName: 'Jessica',
    lastName: 'Brown',
    email: 'jessica.brown@socialplus.com.au',
    phone: '0456 789 012',
    employmentType: 'part_time',
    position: 'Senior Support Worker',
    department: 'Disability Services',
    startDate: '2022-06-20',
    status: 'active',
    complianceStatus: 'compliant',
    payRate: 44.00,
    awardClassification: 'Level 3.2',
    documents: [],
    certifications: [
      { id: 'c11', name: 'NDIS Worker Screening', type: 'ndis_screening', issueDate: daysAgo(150), expiryDate: daysFromNow(215), status: 'compliant' },
      { id: 'c12', name: 'First Aid Certificate', type: 'first_aid', issueDate: daysAgo(100), expiryDate: daysFromNow(630), status: 'compliant' },
      { id: 'c13', name: 'Manual Handling', type: 'training', issueDate: daysAgo(60), expiryDate: daysFromNow(305), status: 'compliant' },
    ],
  },
  {
    id: '6',
    firstName: 'Alex',
    lastName: 'Nguyen',
    email: 'alex.nguyen@socialplus.com.au',
    phone: '0467 890 123',
    employmentType: 'contractor',
    position: 'Specialist Support',
    department: 'Allied Health',
    startDate: '2023-11-01',
    status: 'active',
    complianceStatus: 'pending',
    payRate: 65.00,
    documents: [],
    certifications: [
      { id: 'c14', name: 'NDIS Worker Screening', type: 'ndis_screening', issueDate: '', expiryDate: '', status: 'pending' },
    ],
  },
];

export const mockLeaveRequests: LeaveRequest[] = [
  {
    id: 'l1',
    employeeId: '1',
    type: 'annual',
    startDate: daysFromNow(14),
    endDate: daysFromNow(21),
    hours: 56,
    reason: 'Family vacation',
    status: 'pending',
    createdAt: daysAgo(2),
  },
  {
    id: 'l2',
    employeeId: '3',
    type: 'personal',
    startDate: daysFromNow(3),
    endDate: daysFromNow(3),
    hours: 8,
    reason: 'Medical appointment',
    status: 'approved',
    approvedBy: 'HR Manager',
    createdAt: daysAgo(5),
  },
  {
    id: 'l3',
    employeeId: '5',
    type: 'annual',
    startDate: daysFromNow(30),
    endDate: daysFromNow(35),
    hours: 40,
    status: 'pending',
    createdAt: daysAgo(1),
  },
];

export const mockTimesheets: TimesheetEntry[] = [
  { id: 't1', employeeId: '1', date: daysAgo(0), clockIn: '08:30', clockOut: '16:30', breakMinutes: 30, totalHours: 7.5, status: 'pending' },
  { id: 't2', employeeId: '2', date: daysAgo(0), clockIn: '09:00', clockOut: '17:00', breakMinutes: 30, totalHours: 7.5, status: 'pending' },
  { id: 't3', employeeId: '3', date: daysAgo(0), clockIn: '08:00', clockOut: '16:00', breakMinutes: 30, totalHours: 7.5, status: 'approved' },
  { id: 't4', employeeId: '1', date: daysAgo(1), clockIn: '08:00', clockOut: '14:00', breakMinutes: 30, totalHours: 5.5, status: 'approved' },
  { id: 't5', employeeId: '5', date: daysAgo(1), clockIn: '10:00', clockOut: '18:00', breakMinutes: 30, totalHours: 7.5, status: 'approved' },
];

export const mockDashboardMetrics: DashboardMetrics = {
  totalEmployees: mockEmployees.length,
  activeToday: 4,
  pendingLeaveRequests: mockLeaveRequests.filter(l => l.status === 'pending').length,
  complianceAlerts: mockEmployees.filter(e => e.complianceStatus === 'expired' || e.complianceStatus === 'expiring').length,
  expiringCertifications: mockEmployees.flatMap(e => e.certifications.filter(c => c.status === 'expiring')),
  upcomingBirthdays: [mockEmployees[0], mockEmployees[4]],
  recentHires: [mockEmployees[5], mockEmployees[3]],
};

export const getEmployeeById = (id: string): Employee | undefined => {
  return mockEmployees.find(e => e.id === id);
};

export const getEmployeeLeaves = (employeeId: string): LeaveRequest[] => {
  return mockLeaveRequests.filter(l => l.employeeId === employeeId);
};

export const getEmployeeTimesheets = (employeeId: string): TimesheetEntry[] => {
  return mockTimesheets.filter(t => t.employeeId === employeeId);
};
