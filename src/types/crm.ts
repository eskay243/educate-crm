export type BuiltInRole = 'super_admin' | 'program_officer' | 'admissions' | 'mentor' | 'finance' | 'student' | 'approver';
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
  canScheduleClasses?: boolean;
  canApproveTopics?: boolean;
  canManageUsers?: boolean;
  canViewBiodata?: boolean;
  canModifyStudentBiodata?: boolean;
  canModifyMentorBiodata?: boolean;
  canDisburseApprovedFunds?: boolean;
  canViewStandupReports?: boolean;
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

export interface TicketAttachment {
  name: string;
  url: string;
  size?: number;
  type?: string;
}

export interface TicketComment {
  id: string;
  ticketId: string;
  authorName: string;
  authorEmail: string;
  authorRole: string;
  content: string;
  attachments?: TicketAttachment[];
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
  attachments?: TicketAttachment[];
  createdBy: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    roleTitle: string;
  };
  assignedTo?: string;
  assignedToRole?: UserRole | string;
  assignedToName?: string;
  assignedToEmail?: string;
  createdAt: string;
  updatedAt: string;
  comments: TicketComment[];
  resolutionNotes?: string;
  isArchived?: boolean;
  resolvedAt?: string;
  resolvedBy?: { id: string; name: string; role: string };
  statusRequestedAt?: string;
  statusRequestedBy?: { id: string; name: string; role: string };
  statusRequestNote?: string;
}

// Nigerian Standard 3-Tier KYC & Civil Demographics (CBN CDD Compliance)
export interface NigerianBiodataKYC {
  // Tier 1: Civil Demographics
  dateOfBirth?: string;
  gender?: 'Male' | 'Female' | 'Other';
  nationality?: string;
  stateOfOrigin?: string;
  lga?: string;
  avatarUrl?: string;
  bio?: string;
  phone?: string;
  email?: string;

  // Tier 2: Government Identification
  idType?: 'NIN' | 'BVN' | 'Driver License' | 'Voter Card' | 'International Passport';
  idNumber?: string;
  isIdVerified?: boolean;
  idDocumentUrl?: string;
  idDocumentName?: string;

  // Tier 3: Residential Address & Emergency Guarantor
  residentialAddress?: string;
  city?: string;
  stateOfResidence?: string;
  proofOfAddressUrl?: string;
  proofOfAddressName?: string;
  nextOfKinName?: string;
  nextOfKinRelationship?: string;
  nextOfKinPhone?: string;
  nextOfKinAddress?: string;

  // Personal Settlement Bank KYC (NUBAN)
  bankName?: string;
  bankCode?: string;
  accountNumber?: string;
  accountName?: string;
  isBankVerified?: boolean;
  bvn?: string;

  // Compliance Tracking
  kycTier?: 'Tier 1' | 'Tier 2' | 'Tier 3' | 1 | 2 | 3;
  kycStatus?: 'Verified' | 'Pending Review' | 'Pending' | 'Incomplete';
  kycSubmittedAt?: string;
  kycApprovedBy?: string;
  kycApprovedAt?: string;
  kycRejectionReason?: string;
}

export interface AuthUser extends NigerianBiodataKYC {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  roleTitle: string;
  avatar?: string;
  password?: string;
  department?: string;

  mentorId?: string; // Links to mentor profile if role is 'mentor'
  studentId?: string; // Links to student record if role is 'student'
  isActive?: boolean; // Defaults to true; false = deactivated / suspended
  status?: 'Active' | 'Deactivated';
  deactivatedAt?: string;
  deactivatedReason?: string;
  isApprover?: boolean; // Super Admin assigned official Approver authority
  assignedModules?: string[]; // e.g. ['leads', 'expenses', 'lms', 'billing', 'mentors', 'students', 'attendance', 'tickets']
}

export type LeadStatus = 'Qualified' | 'Negotiation' | 'Discovery' | 'Overdue' | 'Contacted' | 'New' | 'Converted' | 'Lost';

export interface LeadFollowUpActivity {
  id: string;
  timestamp: string;
  repName: string;
  outcome: string; // e.g. "Call Answered - Interested", "Left Voicemail", "Requested Callback", "Sent WhatsApp Info"
  notes: string;
  nextScheduledDate?: string;
  nextScheduledTime?: string;
}

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
  // Follow-up attributes
  nextFollowUpDate?: string; // YYYY-MM-DD
  nextFollowUpTime?: string; // e.g. "10:30 AM"
  followUpPriority?: 'High' | 'Medium' | 'Low';
  preferredChannel?: 'phone' | 'whatsapp' | 'email' | 'in_person';
  followUpStatus?: 'Due Today' | 'Upcoming' | 'Overdue' | 'Followed Up' | 'Requires Call' | 'None';
  followUpHistory?: LeadFollowUpActivity[];
}

export type StudentStatus = 'Active' | 'Pending' | 'Completed' | 'Paused' | 'Deactivated';
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
  learningObjectives?: string[];
  // Outline Teaching & PO Approval Lifecycle
  completedByMentor?: boolean;
  completedByMentorName?: string;
  completedByMentorAt?: string;
  completionNotes?: string;
  approvedByProgramOfficer?: boolean;
  approvedByProgramOfficerName?: string;
  approvedAt?: string;
  approvalStatus?: 'Not Started' | 'Taught (Pending PO Approval)' | 'Approved & Published';
  dayNumber?: number;
  practicalLabTask?: string;
  submissionRequired?: boolean;
}

export type CourseDurationTrack = '30-Day Sprint' | '60-Day Practitioner' | '90-Day Diploma' | '120-Day Enterprise';

export interface LearningGuideline {
  prerequisites?: string[];
  competencyOutcome: string;
  expectedDeliverables: string[];
  dayRange?: string; // e.g. "Days 1 - 15"
  theoryHours?: number;
  practicalHours?: number;
}

export interface LMSModule {
  id: string;
  courseTitle: string;
  title: string;
  description: string;
  order: number;
  lessons: LMSLesson[];
  durationTrack?: CourseDurationTrack;
  durationDays?: number; // 30, 60, 90, 120
  nsqfLevel?: string; // e.g. "NSQF Level 4"
  nitdaStandardCode?: string; // e.g. "NITDA-SWE-MOD-01"
  theoryHours?: number;
  practicalHours?: number;
  learningGuideline?: LearningGuideline;
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

export interface Student extends NigerianBiodataKYC {
  id: string;
  studentCode: string;
  name: string;
  email: string;
  phone: string;
  password?: string;
  avatarUrl?: string;
  program: string;
  mentorId?: string;
  mentorName: string;
  status: StudentStatus;
  isActive?: boolean;
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
  defaultPassword?: string;
  mustResetPassword?: boolean;
  curriculumDriveUrl?: string;
  handbookDriveUrl?: string;
  admissionLetterUrl?: string;
}

export type MentorStatus = 'Active' | 'Available' | 'On Leave' | 'Deactivated';
export type PayoutStatus = 'Completed' | 'Processing' | 'Pending';

export interface Mentor extends NigerianBiodataKYC {
  id: string;
  mentorCode: string;
  name: string;
  email: string;
  phone: string;
  password?: string;
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
  isActive?: boolean;
  lecturedHours?: number; // Cumulative hours of classes & coaching delivered to students
  minimumRequiredHours?: number; // Minimum lectured hours required before eligible for payouts (default: 20)
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
  officeHours?: MentorAvailabilitySlot[];
}

export interface MentorAvailabilitySlot {
  id: string;
  dayOfWeek: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
  startTime: string; // e.g. "14:00"
  endTime: string;   // e.g. "17:00"
  slotDurationMinutes: number; // e.g. 30
  meetingLink?: string; // e.g. "https://meet.google.com/nex-codelab-1on1"
  locationType: 'Google Meet (Online)' | 'Zoom' | 'Campus Hub Lab';
  isActive: boolean;
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
  | 'Faculty Mentorship & Payout'
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
  createdAt?: string;
  department: string;
  paymentMethod: string;
  status: ExpenseStatus;
  vendor: string;
  requestedBy?: string;
  requesterEmail?: string;
  receiptName?: string;
  receiptUrl?: string;
  description?: string;
  rejectionReason?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  urgency?: 'Standard' | 'Urgent' | 'Emergency';
  disbursementBankName?: string;
  disbursementAccountNumber?: string;
  disbursementAccountName?: string;
  disbursementBankCode?: string;
  isDisbursedViaWallet?: boolean;
  transferReference?: string;
  disbursedAt?: string;
  disbursementMethod?: 'corporate_nip' | 'paystack_api';
  nipSessionId?: string;
  mentorId?: string;
  mentorName?: string;
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
  durationDays?: number; // 30, 60, 90, 120
  durationTrack?: CourseDurationTrack;
  tuitionFee: number;
  syllabusModules: string[];
  leadInstructor: string;
  enrolledCount: number;
  status: 'Active' | 'Draft';
  rating: number;
  minimumRequiredHours?: number; // Minimum learning session attendance hours required for graduation
  nsqfLevel?: string; // e.g. "NSQF Level 4 (National Vocational Certificate)"
  nitdaTrack?: string; // e.g. "NITDA Digital Skills Initiative (Software Engineering)"
  theoryHours?: number; // e.g. 25h (30% Theory)
  practicalHours?: number; // e.g. 60h (70% Practical Hands-on Labs)
  learningGuidelinesSummary?: string;
  curriculumDriveUrl?: string; // Google Drive link to official course curriculum
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
  instructorId?: string;
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
  meetingLink?: string;
  locationType?: string;
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
  tickets: boolean;    // Support & Tickets Feedback Hub (/tickets)
  reports: boolean;    // Executive Reports & Analytics (/reports)
  billing: boolean;    // Student Tuition & Invoicing Portal (/student/billing)
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
  budgetRolloverEnabled?: boolean; // When true, unspent monthly operating budget is rolled over to next month
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
  mentorMinimumLecturedHours?: number; // Default 20 hours
  campusLocationsList?: CampusLocation[];
  customRoles?: CustomRoleDefinition[];
  expenseWallet?: ExpenseAndBudgetWallet;
  studentHandbookUrl?: string; // Google Drive link to universal student handbook
  defaultCurriculumUrl?: string; // Fallback Google Drive link for course curriculum
}

export interface VirtualAccountDetails {
  accountNumber: string;
  accountName: string;
  bankName: string;
  bankCode?: string;
  customerCode?: string;
  customerEmail?: string;
  assignedAt: string;
  status: 'active' | 'pending' | 'simulated';
  provider: string;
}

export type WalletTransactionType = 'credit' | 'debit';
export type WalletTransactionCategory = 
  | 'dva_bank_deposit' 
  | 'card_topup' 
  | 'expense_payout' 
  | 'mentor_payout' 
  | 'refund'
  | 'adjustment';

export type BankDeliveryStatus = 
  | 'received_by_bank' 
  | 'disbursed_corporate_nip' 
  | 'processing_at_switch' 
  | 'failed' 
  | 'reversed' 
  | 'simulated';

export type DisbursementMethod = 'corporate_nip' | 'paystack_api';

export interface WalletTransaction {
  id: string;
  type: WalletTransactionType;
  category: WalletTransactionCategory;
  amount: number;
  reference: string;
  description: string;
  timestamp: string;
  balanceAfter: number;
  initiatedBy?: string;
  recipientName?: string;
  recipientBank?: string;
  recipientAccountNumber?: string;
  senderName?: string;
  senderBank?: string;
  senderAccountNumber?: string;
  receiverAccountNumber?: string;
  receiverBank?: string;
  fee?: number;
  status?: string;
  paystackTransferCode?: string;
  bankDeliveryStatus?: BankDeliveryStatus;
  bankDeliveryMessage?: string;
  nipSessionId?: string;
  lastBankCheckAt?: string;
  disbursementMethod?: DisbursementMethod;
  channel?: string;
}

export interface ExpenseAndBudgetWallet {
  balance: number;
  virtualAccount: VirtualAccountDetails | null;
  monthlyBudgetLimit: number;
  transactions: WalletTransaction[];
  lastSyncedAt?: string;
  paystackLiveBalance?: number;
  totalInflow?: number;
  totalOutflow?: number;
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

export interface TimetableAttendanceRecord {
  studentId: string;
  studentName: string;
  studentCode?: string;
  status: 'Attended' | 'Absent';
  markedAt?: string;
  hoursCredited?: number;
}

export interface TimetableSlot {
  id: string;
  courseId: string;
  courseTitle: string;
  cohortId: string;
  cohortName: string;
  mentorId: string;
  mentorName: string;
  topic: string;
  dayOfWeek: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  date: string; // YYYY-MM-DD
  startTime: string; // e.g. "10:00 AM"
  endTime: string; // e.g. "12:00 PM"
  durationHours: number; // e.g. 2
  venue: string; // e.g. "Lagos Hub Lab 1 / Google Meet"
  meetingLink?: string;
  status: 'Scheduled' | 'In Progress' | 'Completed' | 'Cancelled';
  attendanceMarked: boolean;
  attendanceRecords?: TimetableAttendanceRecord[];
  createdAt: string;
  createdBy: string;
  notes?: string;
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
  | 'edit-student' 
  | 'edit-staff'
  | 'change-password'
  | 'clock-in'
  | 'clock-out'
  | 'pay-tuition'
  | 'submit-assignment'
  | 'review-assignment'
  | 'submit-payment-proof'
  | 'view-certificate'
  | 'submit-performance-report'
  | 'top-up-wallet'
  | 'disburse-expense'
  | 'disburse-mentor'
  | 'schedule-class'
  | 'take-attendance'
  | 'course-outline'
  | 'reset-user-password'
  | 'request-payout'
  | 'bulk-upload-courses'
  | 'view-biodata'
  | 'log-follow-up'
  | 'record-installment'
  | 'create-subgroup'
  | 'forward-message'
  | 'daily-standup'
  | null;

export interface DailyStandupTask {
  id: string;
  description: string;
  moduleId: string; // e.g. 'leads' | 'expenses' | 'lms' | 'billing' | 'mentors' | 'students' | 'attendance' | 'tickets'
  status: 'completed' | 'in_progress' | 'blocked';
  estimatedHours?: number;
  blockerDetails?: string;
}

export interface DailyStandupReport {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole | string;
  date: string; // YYYY-MM-DD
  tasksYesterday: DailyStandupTask[];
  tasksToday: DailyStandupTask[];
  blockers: string[];
  taggedModuleIds: string[];
  aiAgentFeedback?: string;
  sentiment: 'positive' | 'neutral' | 'blocked';
  submittedAt: string;
  updatedAt?: string;
  updateCount?: number;
}

export interface WeeklyScrumPerformance {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  weekNumber: number;
  weekStartDate: string;
  weekEndDate: string;
  overallScore: number; // 0 - 100
  letterGrade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  metrics: {
    completionRatePercent: number;
    moduleCoverageScore: number;
    blockerResolutionScore: number;
    consistencyScore: number;
    totalTasksLogged: number;
    totalTasksCompleted: number;
  };
  moduleBreakdown: Record<string, { tasksCompleted: number; tasksPlanned: number }>;
  aiExecutiveSummary: string;
  aiStrengths: string[];
  aiGrowthAreas: string[];
  generatedAt: string;
}

export interface RecordInstallmentPayload {
  studentId: string;
  installmentId?: string;
  amount: number;
  paymentDate: string;
  paymentMethod: 'Bank Transfer' | 'Paystack' | 'POS' | 'Cash' | 'Cheque';
  reference: string;
  bankName?: string;
  bankAccountNumber?: string;
  notes?: string;
  receiptUrl?: string;
}

export interface MentorPayoutRequest {
  id: string;
  mentorId: string;
  mentorName: string;
  mentorEmail: string;
  amount: number;
  lecturedHours: number;
  minimumRequiredHours: number;
  bankName: string;
  accountNumber: string;
  accountName: string;
  bankCode?: string;
  status: 'Pending' | 'Approved' | 'Disbursed' | 'Rejected';
  whtRatePercent?: number;
  whtDeductedAmount?: number;
  netDisbursedAmount?: number;
  voucherNumber?: string;
  requestedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  disbursedAt?: string;
  disburseReference?: string;
  rejectionReason?: string;
  notes?: string;
}

export interface PushSubscriptionItem {
  id: string;
  userId: string;
  userEmail?: string;
  userRole?: string;
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  userAgent?: string;
  createdAt: string;
}



