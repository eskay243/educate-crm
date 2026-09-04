export type UserRole = 'super_admin' | 'admissions' | 'mentor' | 'finance';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  roleTitle: string;
  password?: string;
  avatarUrl?: string;
  department?: string;
  mentorId?: string; // Links to mentor profile if role is 'mentor'
}

export type LeadStatus = 'Qualified' | 'Negotiation' | 'Discovery' | 'Overdue' | 'Contacted' | 'New' | 'Converted' | 'Lost';

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  programInterest: string;
  status: LeadStatus;
  score: number;
  source: string;
  lastContactDate: string;
  lastContactChannel: string;
  assignedRep: string;
  dateAdded: string;
  initials?: string;
  avatarUrl?: string;
  notes?: string;
  dealValue?: number;
}

export type StudentStatus = 'Active' | 'Pending' | 'Completed' | 'Paused';
export type TuitionStatus = 'Paid' | 'Partial' | 'Overdue';

export interface EnrolledCourse {
  id: string;
  code: string;
  name: string;
  semester: string;
  instructor: string;
  fee: number;
  billedDate: string;
}

export interface PaymentInstallment {
  id: string;
  description: string;
  dueDate: string;
  amount: number;
  status: 'Paid' | 'Scheduled' | 'Pending';
}

export interface Student {
  id: string;
  studentCode: string;
  name: string;
  email: string;
  phone: string;
  avatarUrl?: string;
  program: string;
  mentorId?: string;
  mentorName: string;
  status: StudentStatus;
  attendanceRate: number;
  tuitionStatus: TuitionStatus;
  cohort: string;
  enrolledDate: string;
  totalFees: number;
  outstandingBalance: number;
  courses: EnrolledCourse[];
  installments: PaymentInstallment[];
}

export type MentorStatus = 'Active' | 'Available' | 'On Leave';
export type PayoutStatus = 'Completed' | 'Processing' | 'Pending';

export interface Mentor {
  id: string;
  mentorCode: string;
  name: string;
  email: string;
  phone: string;
  avatarUrl?: string;
  role: string;
  department: string;
  expertise: string[];
  hourlyRate: number;
  maxCapacity: number;
  activeMentees: number;
  rating: number;
  sessionsCount: number;
  commissionRate: number; // e.g. 37 for 37%
  pendingPayout: number;
  payoutStatus: PayoutStatus;
  status: MentorStatus;
  joinedDate: string;
  bio?: string;
}

export type ExpenseCategory = 
  | 'Software & Tools' 
  | 'Marketing & Ads' 
  | 'Office & Ops' 
  | 'Salaries & Stipends' 
  | 'Hosting & Cloud' 
  | 'Software' 
  | 'Payroll' 
  | 'Marketing' 
  | 'Facilities' 
  | 'Operations' 
  | 'Equipment';

export type ExpenseStatus = 
  | 'Awaiting Approval' 
  | 'Approved' 
  | 'Rejected' 
  | 'Pending' 
  | 'Flagged' 
  | 'Paid' 
  | 'In Review';

export interface Expense {
  id: string;
  expenseCode: string;
  title: string;
  category: ExpenseCategory;
  amount: number;
  date: string;
  department: string;
  paymentMethod: string;
  status: ExpenseStatus;
  vendor: string;
  requestedBy?: string;
  receiptName?: string;
  description?: string;
  rejectionReason?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  urgency?: 'Standard' | 'Urgent' | 'Emergency';
}

export interface ExecutiveKPIs {
  totalRevenue: number;
  revenueGrowth: number;
  activeStudents: number;
  studentGrowth: number;
  mentorPayouts: number;
  mentorGrowth: number;
  totalExpenses: number;
  expensesGrowth: number;
  leadConversionRate: number;
  operatingMargin: number;
}

export interface CourseProgram {
  id: string;
  code: string;
  title: string;
  category: string;
  description: string;
  durationWeeks: number;
  tuitionFee: number;
  syllabusModules: string[];
  leadInstructor: string;
  enrolledCount: number;
  status: 'Active' | 'Draft';
  rating: number;
}

export interface Cohort {
  id: string;
  cohortCode: string;
  name: string;
  programId: string;
  programName: string;
  startDate: string;
  endDate: string;
  maxCapacity: number;
  enrolledCount: number;
  instructorName: string;
  status: 'Upcoming' | 'In Progress' | 'Completed';
}

export interface InvoiceItem {
  id: string;
  description: string;
  amount: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  programName: string;
  issueDate: string;
  dueDate: string;
  totalAmount: number;
  paidAmount: number;
  status: 'Paid' | 'Partial' | 'Overdue' | 'Unpaid';
  items: InvoiceItem[];
  paymentReference?: string;
  nibssBankName?: string;
}

export interface MentorshipSession {
  id: string;
  sessionCode: string;
  mentorId: string;
  mentorName: string;
  studentId: string;
  studentName: string;
  date: string;
  time: string;
  durationHours: number;
  topic: string;
  notes?: string;
  status: 'Scheduled' | 'Completed' | 'Cancelled';
  compensationAmount: number;
}

export interface OrganizationSettings {
  instituteName: string;
  portalTitle: string;
  address: string;
  campusLocations: string[];
  email: string;
  phone: string;
  tinNumber: string;
  cacNumber: string;
  defaultCurrency: string;
  defaultNIBSSBank: {
    bankName: string;
    accountNumber: string;
    accountName: string;
  };
  emailAlertsEnabled: boolean;
  autoInvoiceGeneration: boolean;
  operatingBudget?: number;
  showBudgetToStaff?: boolean;
  smtp?: {
    host: string;
    port: number;
    user: string;
    pass: string;
    from: string;
    secure: boolean;
  };
}

export interface ActivityLogItem {
  id: string;
  timestamp: string;
  title: string;
  description: string;
  type: 'lead' | 'student' | 'finance' | 'mentor' | 'system';
  user: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'admissions' | 'finance' | 'mentor' | 'system';
  timestamp: string;
  read: boolean;
  link?: string;
}

export interface ToastMessage {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'info' | 'warning' | 'error';
  duration?: number;
}

export type ModalType = 
  | 'create-hub' 
  | 'recruit-mentor' 
  | 'enroll-student' 
  | 'add-lead' 
  | 'log-expense' 
  | 'export-report' 
  | 'view-invoice' 
  | 'book-session' 
  | 'create-cohort' 
  | 'create-course' 
  | 'edit-course' 
  | 'assign-mentor' 
  | 'edit-mentor' 
  | 'change-password'
  | null;


