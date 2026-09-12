export type BuiltInRole = 'super_admin' | 'admissions' | 'mentor' | 'finance' | 'student';
export type UserRole = BuiltInRole | string;

export interface RoleCapabilities {
  canAddCourses: boolean;
  canAddCohorts: boolean;
  canAddLeads: boolean;
  canEnrollStudents: boolean;
  canLogExpenses: boolean;
  canApproveExpenses: boolean;
  canIssueCertificates: boolean;
  canViewBilling: boolean;
  canManageSettings: boolean;
  canManageAttendance: boolean;
  canSubmitReports: boolean;
}

export interface CustomRoleDefinition {
  id: string;
  name: string;
  description: string;
  isSystem?: boolean;
  badgeColor?: string;
  allowedModules: string[];
  permissions: RoleCapabilities;
}

export type TicketCategory = 'bug' | 'feature_request' | 'academic' | 'billing' | 'welfare' | 'observation' | 'general';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export interface TicketComment {
  id: string;
  ticketId: string;
  authorName: string;
  authorEmail: string;
  authorRole: string;
  content: string;
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  ticketNumber: string;
  title: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  createdBy: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    roleTitle: string;
  };
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
  comments: TicketComment[];
  resolutionNotes?: string;
}

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
  studentId?: string; // Links to student record if role is 'student'
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

export interface LMSLesson {
  id: string;
  moduleId: string;
  title: string;
  durationMinutes: number;
  type: 'video' | 'reading' | 'lab';
  videoUrl?: string;
  contentMarkdown?: string;
  resources?: { title: string; url: string }[];
}

export interface LMSModule {
  id: string;
  courseTitle: string;
  title: string;
  description: string;
  order: number;
  lessons: LMSLesson[];
}

export interface StudentAssignmentSubmission {
  id: string;
  studentId: string;
  studentName: string;
  courseTitle: string;
  moduleTitle: string;
  taskTitle: string;
  githubUrl?: string;
  liveUrl?: string;
  notes?: string;
  submittedAt: string;
  status: 'Pending' | 'Passed' | 'Needs Revision' | 'Exceptional';
  grade?: number;
  mentorFeedback?: string;
  reviewedBy?: string;
  reviewedAt?: string;
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
  tuitionAmount?: number;
  paidAmount?: number;
  courses: EnrolledCourse[];
  installments: PaymentInstallment[];
  progressPercent?: number;
  completedLessonIds?: string[];
  assignmentSubmissions?: StudentAssignmentSubmission[];
  attendedLearningHours?: number;
  minimumRequiredHours?: number;
  performanceScore?: number; // 0 - 100%
  performanceTier?: 'Exceeding' | 'On Track' | 'Needs Support' | 'At Risk';
  welfareNotes?: string;
  certificateIssued?: boolean;
  certificateNumber?: string;
  certificateIssuedAt?: string;
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
  courses?: string[];
  track?: string;
  specializedDepartments?: string[];
  hourlyRate?: number; // Deprecated - replaced by 37% enrollment commission
  monthlyBasePay?: number;
  maxCapacity: number;
  activeMentees: number;
  rating: number;
  sessionsCount: number;
  commissionRate: number; // 37% of course tuition per enrolled student
  assignedEnrollmentsCount?: number;
  pendingPayout: number;
  paidPayout?: number;
  totalEarned?: number;
  payoutStatus: PayoutStatus;
  status: MentorStatus;
  joinedDate: string;
  bio?: string;
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
  bankCode?: string;
  bankVerified?: boolean;
  isAccountVerified?: boolean;
  accountVerificationSource?: string;
  accountVerifiedAt?: string;
}

// ----------------------------------------------------
// Employee Hybrid Attendance & Hours Tracking
// ----------------------------------------------------
export type WorkMode = 'On-Site / Hub' | 'Remote' | 'Hybrid';
export type PunctualityStatus = 'On-Time' | 'Late' | 'Overtime' | 'Standard';
export type GeoVerificationStatus = 
  | 'Verified On-Site' 
  | 'Remote Verified' 
  | 'Location Mismatch' 
  | 'GPS Unavailable';

export interface AttendanceRecord {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userRole: UserRole;
  roleTitle?: string;
  department?: string;
  staffId?: string;
  staffName?: string;
  staffEmail?: string;
  date: string; // YYYY-MM-DD
  clockInTime: string; // e.g. "08:55 AM"
  clockInTimestamp: number;
  clockOutTime?: string; // e.g. "05:15 PM"
  clockOutTimestamp?: number;
  totalHoursWorked?: number; // e.g. 8.3
  workMode: WorkMode;
  locationName: string; // e.g. "Yaba Tech Hub", "Remote - Lekki"
  latitude?: number;
  longitude?: number;
  distanceFromOfficeMeters?: number;
  geoStatus: GeoVerificationStatus;
  punctuality: PunctualityStatus;
  punctualityStatus?: PunctualityStatus;
  shiftFocus: string; // Office chores, tasks, and daily objectives
  dailyTasksFocus?: string;
  workSummary?: string; // End of day completed deliverables
  status: 'Clocked In' | 'Clocked Out' | 'On-Duty' | 'Completed';
  verifiedBy?: string;
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
  requesterEmail?: string;
  receiptName?: string;
  description?: string;
  rejectionReason?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  urgency?: 'Standard' | 'Urgent' | 'Emergency';
}

export type EmailTemplateType = 
  | 'student_welcome' 
  | 'mentor_welcome' 
  | 'staff_welcome' 
  | 'password_reset' 
  | 'payment_reminder' 
  | 'invoice_receipt' 
  | 'session_confirmation'
  | 'expense_approval_request'
  | 'expense_approved'
  | 'expense_rejected'
  | 'mentor_commission_earned'
  | 'mentor_payout_disbursed'
  | 'lab_assignment_submitted'
  | 'lab_assignment_graded'
  | 'new_mentee_assigned'
  | 'proof_of_payment_alert'
  | 'tuition_payment_alert'
  | 'mentor_student_performance_report'
  | 'student_certificate_issued';

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
  minimumRequiredHours?: number; // Minimum learning session attendance hours required for graduation
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
  studentEmail?: string;
  programName?: string;
  program?: string;
  description?: string;
  issueDate?: string;
  dueDate: string;
  totalAmount: number;
  amount?: number;
  paidAmount: number;
  status: 'Paid' | 'Partial' | 'Overdue' | 'Unpaid' | 'Pending';
  items: InvoiceItem[];
  paymentReference?: string;
  nibssBankName?: string;
  paidDate?: string;
  createdDate?: string;
}

export interface MentorshipSession {
  id: string;
  sessionCode: string;
  mentorId: string;
  mentorName: string;
  studentId: string;
  studentName: string;
  courseName?: string;
  date: string;
  time: string;
  durationHours: number;
  topic: string;
  notes?: string;
  status: 'Scheduled' | 'Completed' | 'Cancelled';
  compensationAmount: number;
  studentAttendance?: 'Attended' | 'Absent' | 'Pending';
  attendanceMarkedAt?: string;
  attendanceMarkedBy?: string;
  hoursCredited?: number;
}

export interface StudentPerformanceReport {
  id: string;
  reportCode: string;
  studentId: string;
  studentName: string;
  studentCode: string;
  program: string;
  mentorId: string;
  mentorName: string;
  submittedAt: string;
  performanceScore: number; // 0 - 100%
  performanceTier: 'Exceeding' | 'On Track' | 'Needs Support' | 'At Risk';
  attendanceRating: 'Consistent' | 'Irregular' | 'Passive';
  technicalMasteryNotes: string;
  welfareObservations: string;
  recommendations: string;
  managementFollowUpStatus: 'Pending Review' | 'In Progress' | 'Resolved';
  managementNotes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

export interface CampusLocation {
  id: string;
  name: string;
  code: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  isActive: boolean;
}

export interface StudentCertificate {
  id: string;
  certificateNumber: string; // e.g. CERT-CDL-2026-8492
  studentId: string;
  studentName: string;
  studentCode: string;
  program: string;
  issueDate: string;
  distinction: string; // e.g. "With Technical Honors"
  learningHoursLogged: number;
  syllabusMasteryPercent: number;
  verified: boolean;
  verificationUrl: string;
}

export interface EnabledModules {
  lms: boolean;        // Classroom LMS & Student Portal (/student/courses, lab assignments, syllabus)
  leads: boolean;      // Admissions & Lead Kanban Pipeline (/leads)
  courses: boolean;    // Academic Programs & Cohorts (/courses)
  students: boolean;   // Enrolled Students Management (/students)
  mentors: boolean;    // Faculty Mentors Hub & 37% Revenue Share (/mentors, /student/mentor)
  attendance: boolean; // Geofenced Staff Attendance & Clock-In (/attendance)
  expenses: boolean;   // OpEx Requisitions & Financial Approvals (/expenses)
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
  officeLocation?: {
    name: string;
    latitude: number;
    longitude: number;
    radiusMeters: number; // e.g. 250m geofence radius
  };
  workHoursPolicy?: {
    expectedClockInTime: string; // e.g. "09:00"
    expectedClockOutTime: string; // e.g. "17:00"
    gracePeriodMinutes: number; // e.g. 15 mins
  };
  smtp?: {
    host: string;
    port: number;
    user: string;
    pass: string;
    from: string;
    secure: boolean;
  };
  courseCategories?: string[];
  logoUrl?: string;
  customEmailTemplates?: Record<string, {
    subject?: string;
    data?: Record<string, any>;
  }>;
  paystackPublicKey?: string;
  paystackSecretKey?: string;
  paystackLiveMode?: boolean;
  enabledModules?: EnabledModules;
  defaultMinimumLearningHours?: number; // Default 40 hours
  campusLocationsList?: CampusLocation[];
  customRoles?: CustomRoleDefinition[];
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
  | 'clock-in'
  | 'clock-out'
  | 'pay-tuition'
  | 'submit-assignment'
  | 'review-assignment'
  | 'submit-payment-proof'
  | 'view-certificate'
  | 'submit-performance-report'
  | null;


