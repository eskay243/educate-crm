import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { 
  Lead, 
  LeadFollowUpActivity, 
  Student, 
  EnrolledCourse,
  Mentor, 
  Expense, 
  CourseProgram, 
  Cohort, 
  Invoice, 
  MentorshipSession, 
  OrganizationSettings, 
  ActivityLogItem, 
  NotificationItem,
  ToastMessage,
  ModalType, 
  ExecutiveKPIs, 
  LeadStatus, 
  StudentStatus, 
  ExpenseStatus,
  UserRole,
  AuthUser,
  AttendanceRecord,
  AttendanceVerificationStatus,
  ShiftBreakEntry,
  ShiftDeliverableItem,
  WorkMode,
  GeoVerificationStatus,
  PunctualityStatus,
  LMSModule,
  StudentAssignmentSubmission,
  EnabledModules,
  CampusLocation,
  StudentPerformanceReport,
  SupportTicket,
  TicketAttachment,
  TicketComment,
  CustomRoleDefinition,
  RoleCapabilities,
  TicketStatus,
  ExpenseAndBudgetWallet,
  VirtualAccountDetails,
  TimetableSlot,
  MentorPayoutRequest,
  WalletTransaction,
  RecordInstallmentPayload,
  DailyStandupReport,
  DailyStandupTask,
  WeeklyScrumPerformance,
  MentorChangeRecord,
  StudentSessionAttendance,
  MentorFeedbackEntry,
  StudentFeedbackEntry,
  StudentDocumentItem
} from '../types/crm';
import { ChatMessage } from '../types/chat';
import { 
  initialLeads, 
  initialStudents, 
  initialMentors, 
  initialExpenses, 
  initialCourses, 
  initialCohorts, 
  initialInvoices, 
  initialSessions, 
  initialAttendance,
  initialSettings, 
  initialActivityLogs, 
  initialNotifications,
  demoUsers,
  defaultAuthUser,
  initialLMSModules,
  initialAssignments,
  initialStudentPerformanceReports,
  defaultRoleDefinitions,
  initialTickets,
  initialTimetables,
  initialPayoutRequests,
  initialCampuses
} from '../data/mockData';
import { apiService } from '../services/api';
import { emailService } from '../services/emailService';
import { calculateDistanceMeters } from '../utils/geo';
import { launchPaystackPayment } from '../services/paystackService';
import { APP_BASE_URL } from '../utils/url';
import { safeLocalStorage, safeSessionStorage } from '../utils/safeStorage';


export const formatNaira = (amount: number, fractionDigits = 0): string => {
  const safeAmount = (typeof amount === 'number' && !isNaN(amount)) ? amount : 0;
  return '₦ ' + new Intl.NumberFormat('en-NG', {
    maximumFractionDigits: fractionDigits,
    minimumFractionDigits: fractionDigits,
  }).format(safeAmount);
};

export const formatNairaCompact = (amount: number): string => {
  const safeAmount = (typeof amount === 'number' && !isNaN(amount)) ? amount : 0;
  if (safeAmount >= 1_000_000) {
    const val = (safeAmount / 1_000_000).toFixed(1).replace(/\.0$/, '');
    return `₦ ${val}M`;
  }
  if (safeAmount >= 1_000) {
    const val = (safeAmount / 1_000).toFixed(0);
    return `₦ ${val}K`;
  }
  return `₦ ${safeAmount}`;
};

export const resolveRoleTitle = (roleId: string, customRolesList?: any[]): string => {
  const staticMap: Record<string, string> = {
    super_admin: 'Super Admin / Managing Director',
    admissions: 'Admissions Officer',
    finance: 'Finance Officer & Bursar',
    approver: 'Institutional Approver & Authorizer',
    instructor: 'Instructor / Faculty Lead',
    student: 'Enrolled Scholar / Student',
    program_officer: 'Academic Program Officer & Curriculum Lead',
    mentor: 'Faculty Mentor & Instructor',
    it_support: 'IT & Systems Operations',
    customer_service: 'Customer Support & Scholar Welfare',
  };
  if (staticMap[roleId]) return staticMap[roleId];
  if (Array.isArray(customRolesList)) {
    const custom = customRolesList.find((r: any) => r.id === roleId);
    if (custom?.name) return custom.name;
  }
  return 'Staff Member';
};

interface CRMContextType {
  currentUser: AuthUser | null;
  staffUsers: AuthUser[];
  leads: Lead[];
  students: Student[];
  mentors: Mentor[];
  expenses: Expense[];
  courses: CourseProgram[];
  cohorts: Cohort[];
  invoices: Invoice[];
  sessions: MentorshipSession[];
  attendanceRecords: AttendanceRecord[];
  activeAttendanceSession: AttendanceRecord | null;
  staleAttendanceSession: AttendanceRecord | null;
  todayCompletedSession: AttendanceRecord | null;
  settings: OrganizationSettings;
  activityLogs: ActivityLogItem[];
  notifications: NotificationItem[];
  toasts: ToastMessage[];
  unreadNotificationCount: number;
  isBackendConnected: boolean;
  activeModal: ModalType;
  globalSearch: string;
  selectedStudentId: string;
  selectedInvoiceId: string | null;
  selectedMentorForBookingId: string | null;
  selectedStudentForAssignmentId: string | null;
  selectedCourseForEditId: string | null;
  selectedMentorForEditId: string | null;
  selectedMentorForProfileId: string | null;
  setSelectedMentorForProfileId: (id: string | null) => void;
  openMentorProfileModal: (mentorOrId: Mentor | string) => void;
  selectedBiodataUser: { category: 'staff' | 'mentor' | 'student'; id: string; data: any } | null;
  setSelectedBiodataUser: (user: { category: 'staff' | 'mentor' | 'student'; id: string; data: any } | null) => void;
  openBiodataModal: (categoryOrTarget: 'staff' | 'mentor' | 'student' | any, id?: string, data?: any) => void;
  kpis: ExecutiveKPIs;

  // LMS & Student state
  lmsModules: LMSModule[];
  assignments: StudentAssignmentSubmission[];
  currentStudentProfile: Student | null;
  studentPerformanceReports: StudentPerformanceReport[];

  // Student Actions & Paystack
  completeLesson: (lessonId: string) => Promise<void>;
  submitAssignment: (payload: { taskTitle: string; courseTitle?: string; moduleTitle?: string; githubUrl?: string; liveUrl?: string; notes?: string }) => Promise<void>;
  gradeAssignment: (id: string, grade: number, mentorFeedback: string, status?: 'Passed' | 'Needs Revision' | 'Exceptional') => Promise<void>;
  payTuitionWithPaystack: (options: { amountNaira: number; invoiceId?: string }) => Promise<void>;
  submitProofOfPayment: (payload: { amount: number; bankName: string; referenceNumber: string; receiptProofUrl?: string; notes?: string }) => Promise<void>;
  disburseMentorPayout: (mentorId: string, amount: number, reason?: string) => Promise<void>;
  
  // Operational Expense & Budget Wallet
  wallet: ExpenseAndBudgetWallet;
  selectedExpenseForDisburse: Expense | null;
  setSelectedExpenseForDisburse: (expense: Expense | null) => void;
  selectedMentorForDisburse: Mentor | null;
  setSelectedMentorForDisburse: (mentor: Mentor | null) => void;
  generateVirtualAccount: () => Promise<VirtualAccountDetails | null>;
  topUpWallet: (amountNaira: number, reference?: string) => Promise<boolean>;
  disburseExpenseFromWallet: (payload: {
    expenseId: string;
    bankCode: string;
    bankName: string;
    accountNumber: string;
    accountName: string;
    reason?: string;
    disbursementMethod?: 'corporate_nip' | 'paystack_api';
    nipSessionId?: string;
    bankReference?: string;
  }) => Promise<boolean>;
  verifyBankTransferStatus: (reference: string) => Promise<WalletTransaction | null>;
  disburseMentorFromWallet: (mentorId: string, amount: number, reason?: string, payoutRequestId?: string) => Promise<boolean>;
  updateWalletBudgetLimit: (limit: number) => Promise<void>;
  refreshWalletSummary: () => Promise<void>;
  reconcileWalletWithPaystack: () => Promise<void>;
  isSyncingWallet: boolean;
  
  // Mentor Payout Requests & Rev-Share Calculation
  payoutRequests: MentorPayoutRequest[];
  requestMentorPayout: (amount: number, notes?: string) => Promise<{ success: boolean; message: string }>;
  reviewMentorPayout: (requestId: string, status: 'Approved' | 'Rejected', reason?: string) => Promise<boolean>;
  calculateMentorTuitionCommission: (mentorId: string) => {
    totalTuitionPool: number;
    totalCommission: number;
    courseBreakdown: Array<{
      courseId: string;
      courseCode: string;
      courseTitle: string;
      role: string;
      sharePercentage: number;
      enrolledStudentsCount: number;
      totalTuitionPaid: number;
      courseFacultyPool: number;
      mentorCommission: number;
    }>;
  };
  
  // Attendance, Reports & Graduation Gatekeeping
  markSessionAttendance: (sessionId: string, status: 'Attended' | 'Absent', hoursCredited?: number) => Promise<void>;
  submitStudentPerformanceReport: (report: Omit<StudentPerformanceReport, 'id' | 'reportCode' | 'submittedAt'>) => Promise<void>;
  updateReportFollowUpStatus: (reportId: string, status: 'Pending Review' | 'In Progress' | 'Resolved', notes?: string) => Promise<void>;
  issueCertificate: (studentId: string) => Promise<{ success: boolean; certificateNumber?: string; message?: string }>;
  calculatePerformanceTier: (score: number) => 'Exceeding' | 'On Track' | 'Needs Support' | 'At Risk';
  
  // Auth actions
  login: (role: UserRole, email?: string, password?: string) => Promise<{ success: boolean; message?: string; user?: AuthUser }>;
  logout: () => void;
  sessionWarningSeconds: number | null;
  resetActivityTimer: () => void;
  hasPermission: (requiredRole: UserRole | UserRole[], moduleName?: keyof EnabledModules | string) => boolean;
  hasModulePermission: (moduleName: string) => boolean;
  toggleRoleModule: (roleId: string, moduleName: string) => Promise<void>;
  isSuperAdmin: boolean;
  isSimulatingRole: boolean;
  originSuperAdmin: AuthUser | null;
  switchRole: (role: UserRole, targetMentorId?: string) => void;
  addStaffUser: (user: Omit<AuthUser, 'id'>) => void;
  updateUserRole: (userId: string, role: UserRole, mentorId?: string) => void;
  toggleUserApproverStatus: (userId: string, isApprover?: boolean) => void;
  deleteStaffUser: (id: string) => Promise<boolean>;
  deleteMentorUser: (id: string) => Promise<boolean>;
  transferTasksAndDeleteUser: (sourceUserId: string, targetUserId: string) => Promise<{ success: boolean; message: string }>;
  activeMentors: Mentor[];
  activeStaffUsers: AuthUser[];
  getUserTaskFootprint: (userId: string, userName?: string, userEmail?: string) => {
    totalTasks: number;
    studentsCount: number;
    cohortsCount: number;
    timetablesCount: number;
    ticketsCount: number;
    leadsCount: number;
    coursesCount: number;
    assignedStudents: Student[];
    assignedCohorts: Cohort[];
    assignedTimetables: TimetableSlot[];
    assignedTickets: SupportTicket[];
    assignedLeads: Lead[];
    assignedCourses: CourseProgram[];
  };
  editStaffUser: (id: string, updates: Partial<AuthUser>) => Promise<boolean>;
  renameCustomRole: (roleId: string, newName: string, newDescription?: string) => Promise<boolean>;
  changePassword: (newPassword: string, email?: string) => Promise<{ success: boolean; message?: string }>;

  // Notifications & Toasts
  addNotification: (notif: Omit<NotificationItem, 'id' | 'timestamp' | 'read'>) => void;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  clearNotifications: () => void;
  showToast: (title: string, message: string, type?: ToastMessage['type']) => void;
  removeToast: (id: string) => void;
  sendPaymentReminder: (studentId: string) => void;
  updateUserProfile: (data: Partial<AuthUser>) => Promise<boolean>;

  // Modal controllers
  openModal: (modal: ModalType) => void;
  closeModal: () => void;
  setGlobalSearch: (term: string) => void;
  setSelectedStudentId: (id: string) => void;
  setSelectedInvoiceId: (id: string | null) => void;
  setSelectedMentorForBookingId: (id: string | null) => void;
  setSelectedStudentForAssignmentId: (id: string | null) => void;
  setSelectedCourseForEditId: (id: string | null) => void;
  setSelectedMentorForEditId: (id: string | null) => void;
  selectedStaffForEditId: string | null;
  setSelectedStaffForEditId: (id: string | null) => void;
  reviewUserKYC: (userId: string, category: 'staff' | 'mentor' | 'student', status: 'Verified' | 'Pending Review' | 'Incomplete', notes?: string) => Promise<boolean>;
  selectedLeadForFollowUp: Lead | null;
  setSelectedLeadForFollowUp: (lead: Lead | null) => void;
  openFollowUpModal: (lead: Lead) => void;
  selectedStudentForPayment: Student | null;
  setSelectedStudentForPayment: (student: Student | null) => void;
  openRecordPaymentModal: (student: Student) => void;
  recordStudentInstallmentPayment: (studentId: string, payload: RecordInstallmentPayload) => Promise<boolean>;

  // Chat message management
  selectedMessageForForward: ChatMessage | null;
  setSelectedMessageForForward: (msg: ChatMessage | null) => void;
  openForwardModal: (msg: ChatMessage) => void;
  forwardChatMessage: (targetConversationId: string, message: ChatMessage) => Promise<boolean>;
  editChatMessage: (messageId: string, content: string) => Promise<boolean>;
  deleteChatMessage: (messageId: string) => Promise<boolean>;

  // Payout request editing
  selectedPayoutRequestForEdit: MentorPayoutRequest | null;
  setSelectedPayoutRequestForEdit: (req: MentorPayoutRequest | null) => void;
  openEditPayoutRequestModal: (req: MentorPayoutRequest) => void;
  updateMentorPayoutRequest: (requestId: string, payload: Partial<MentorPayoutRequest>) => Promise<boolean>;

  // AI Daily Standup & Weekly Scrum
  dailyStandups: DailyStandupReport[];
  weeklyScrumReports: WeeklyScrumPerformance[];
  todayStandup: DailyStandupReport | null;
  fetchTodayStandup: () => Promise<void>;
  submitDailyStandup: (data: { tasksYesterday: DailyStandupTask[]; tasksToday: DailyStandupTask[]; blockers: string[]; taggedModuleIds: string[]; }) => Promise<boolean>;
  generateWeeklyScrumEvaluation: (userId?: string) => Promise<WeeklyScrumPerformance | null>;
  triggerStandupReminders: () => Promise<{ success: boolean; remindersSent: number } | null>;

  // Mutators
  addLead: (lead: Omit<Lead, 'id' | 'dateAdded'>) => void;
  updateLeadStatus: (id: string, status: LeadStatus, lossReason?: string) => void;
  updateLeadNotes: (id: string, notes: string) => void;
  scheduleLeadFollowUp: (leadId: string, payload: {
    nextFollowUpDate?: string;
    nextFollowUpTime?: string;
    outcome: string;
    notes: string;
    priority?: 'High' | 'Medium' | 'Low';
    preferredChannel?: 'phone' | 'whatsapp' | 'email' | 'in_person';
    newStatus?: LeadStatus;
  }) => Promise<void>;
  convertLeadToStudent: (leadId: string, program: string, mentorName: string) => void;
  
  enrollStudent: (student: Omit<Student, 'id' | 'enrolledDate' | 'studentCode'>) => Student;
  updateStudent: (id: string, updatedData: Partial<Student>) => void;
  updateStudentStatus: (id: string, status: StudentStatus) => void;
  assignMentorToStudent: (studentId: string, mentorId: string, reason?: string) => void;
  updateStudentAttendanceRecord: (studentId: string, record: StudentSessionAttendance) => Promise<void>;
  submitStudentFeedback: (feedback: Omit<StudentFeedbackEntry, 'id' | 'submittedAt'>) => Promise<void>;
  addMentorFeedbackNote: (studentId: string, note: Omit<MentorFeedbackEntry, 'id' | 'date'>) => Promise<void>;
  toggleStudentAtRisk: (studentId: string, isAtRisk: boolean) => Promise<void>;
  toggleStudentGoalStatus: (studentId: string, goalId: string, newStatus?: 'In Progress' | 'Achieved' | 'Deferred') => Promise<void>;
  uploadStudentDocument: (studentId: string, doc: Omit<StudentDocumentItem, 'id' | 'uploadedAt'>) => Promise<void>;
  
  recruitMentor: (mentor: Omit<Mentor, 'id' | 'joinedDate' | 'mentorCode' | 'sessionsCount'>) => void;
  updateMentorStatus: (id: string, status: Mentor['status']) => void;
  updateMentor: (id: string, updatedData: Partial<Mentor>) => void;
  
  logExpense: (expense: Omit<Expense, 'id' | 'expenseCode'>) => void;
  updateExpenseStatus: (id: string, status: ExpenseStatus, extra?: { rejectionReason?: string; reviewedBy?: string; reviewedAt?: string }) => void;
  approveExpense: (id: string) => void;
  rejectExpense: (id: string, reason: string) => void;

  addCourse: (course: Omit<CourseProgram, 'id' | 'enrolledCount' | 'rating'>) => void;
  updateCourse: (id: string, updatedData: Partial<CourseProgram>) => void;
  deleteCourse: (id: string) => Promise<void>;
  addCourseCategory: (category: string) => void;
  addCohort: (cohort: Omit<Cohort, 'id' | 'enrolledCount'>) => void;
  bookSession: (session: Omit<MentorshipSession, 'id' | 'sessionCode'>) => void;
  generateInvoice: (invoice: Omit<Invoice, 'id' | 'invoiceNumber'>) => void;
  updateSettings: (newSettings: Partial<OrganizationSettings>) => void;
  saveCampusLocations: (campuses: CampusLocation[]) => Promise<boolean>;
  logActivity: (activity: Omit<ActivityLogItem, 'id' | 'timestamp'>) => void;

  // Attendance & Time Tracking
  clockIn: (options: {
    workMode: WorkMode;
    locationName?: string;
    campusId?: string;
    campusName?: string;
    dailyTasksFocus?: string;
    standupTasks?: DailyStandupTask[];
    lat?: number;
    lng?: number;
    gpsAccuracyMeters?: number;
    geoExceptionReason?: string;
  }) => Promise<{ success: boolean; message: string; record?: AttendanceRecord }>;
  clockOut: (options: {
    endOfDaySummary?: string;
    deliverablesChecklist?: ShiftDeliverableItem[];
    completedStandupTasks?: DailyStandupTask[];
    crmActivitiesCount?: number;
    targetRecordId?: string;
    retroactiveClockOutTime?: string;
    retroactiveNote?: string;
  }) => Promise<{ success: boolean; message: string; record?: AttendanceRecord }>;
  toggleShiftBreak: (action: 'start' | 'end', reason?: string) => Promise<boolean>;
  resumeTodayShift: (recordId?: string) => Promise<boolean>;
  verifyAttendanceShift: (recordId: string, updates: Partial<AttendanceRecord>) => Promise<boolean>;

  // Backups, Restore & Production Flush
  exportDatabaseBackup: () => void;
  restoreDatabaseBackup: (backupData: any) => Promise<boolean>;
  flushProductionData: () => Promise<void>;
  sendStaffWelcomeEmail: (staffId: string) => Promise<void>;

  // Module feature flag check
  isModuleEnabled: (module: keyof EnabledModules) => boolean;

  // Support Tickets & Helpdesk
  tickets: SupportTicket[];
  createTicket: (ticketData: Omit<SupportTicket, 'id' | 'ticketNumber' | 'createdAt' | 'updatedAt' | 'comments'>) => Promise<void>;
  updateTicketStatus: (ticketId: string, status: TicketStatus, resolutionNotes?: string) => Promise<void>;
  assignTicket: (ticketId: string, assignedToRole: string, assignedToName?: string, assignedToEmail?: string) => Promise<void>;
  addTicketComment: (ticketId: string, content: string, attachments?: TicketAttachment[]) => Promise<void>;
  markTicketDone: (ticketId: string, resolutionNotes?: string) => Promise<void>;
  requestTicketStatus: (ticketId: string, note?: string) => Promise<void>;
  toggleTicketArchive: (ticketId: string, isArchived: boolean) => Promise<void>;
  markTicketRead: (ticketId: string) => Promise<void>;

  // Custom Roles & Permission Architecture
  customRoles: CustomRoleDefinition[];
  createCustomRole: (roleData: Omit<CustomRoleDefinition, 'id'> | CustomRoleDefinition) => Promise<void>;
  updateRolePermissions: (roleId: string, updates: Partial<CustomRoleDefinition>) => Promise<void>;
  deleteCustomRole: (roleId: string) => Promise<boolean>;
  hasFeaturePermission: (permission: keyof RoleCapabilities) => boolean;

  // Reset to seed data
  resetAllData: () => void;

  // Academic Timetables & Scheduling
  timetables: TimetableSlot[];
  scheduleClass: (slot: Omit<TimetableSlot, 'id' | 'createdAt' | 'attendanceMarked' | 'attendanceRecords'>) => Promise<void>;
  updateTimetableSlot: (id: string, updates: Partial<TimetableSlot>) => Promise<void>;
  deleteTimetableSlot: (id: string) => Promise<void>;
  markClassAttendance: (slotId: string, attendanceRecords: { studentId: string; studentName: string; studentCode?: string; status: 'Attended' | 'Absent' }[], notes?: string) => Promise<void>;
  selectedSlotForAttendance: TimetableSlot | null;
  setSelectedSlotForAttendance: (slot: TimetableSlot | null) => void;
  selectedSlotForRecording: TimetableSlot | null;
  setSelectedSlotForRecording: (slot: TimetableSlot | null) => void;
  attachTimetableRecording: (payload: {
    slotId: string;
    recordingUrl: string;
    recordingNotes?: string;
    aiTranscriptSummary?: any;
    syncToLmsLesson?: boolean;
    lessonId?: string;
  }) => Promise<void>;
  createSipcoreMeeting: (meetingParams: {
    title: string;
    description?: string;
    createdByExtension?: string;
    participantExtensions?: string[];
    externalParticipants?: { name: string; email: string }[];
    isInstant?: boolean;
    startDateTime?: string;
    endDateTime?: string;
    isRecorded?: boolean;
    enableAiNotetaker?: boolean;
    allowGuestJoin?: boolean;
  }) => Promise<any>;

  // Course Outline Teaching & Program Officer Approval Gateway
  markTopicAsTaught: (lessonId: string, notes?: string) => Promise<void>;
  approveTopicByProgramOfficer: (lessonId: string, courseTitle?: string) => Promise<void>;
  returnTopicByProgramOfficer: (lessonId: string, reason: string, courseTitle?: string) => Promise<void>;
  reviewMentorWeeklyReport: (mentorId: string, reportId: string, reviewNotes: string) => Promise<void>;
  logCourseIQAAudit: (courseId: string, stage: 1 | 2 | 3, notes: string, status?: 'Verified' | 'Action Required') => Promise<void>;

  // Super Admin User Administration
  toggleUserActiveStatus: (userId: string, isActive: boolean, reason?: string) => Promise<void>;
  adminResetUserPassword: (userId: string, newPassword: string) => Promise<boolean>;
  selectedUserForPasswordReset: { id: string; name: string; email: string; role: string; category?: string } | null;
  setSelectedUserForPasswordReset: (user: { id: string; name: string; email: string; role: string; category?: string } | null) => void;

  // Team Chat & Unread Indicator
  unreadChatCount: number;
  refreshUnreadChatCount: () => Promise<void>;
  isChatPopoutOpen: boolean;
  setIsChatPopoutOpen: (open: boolean) => void;
}

const CRMContext = createContext<CRMContextType | undefined>(undefined);

const STORAGE_KEYS = {
  AUTH: 'nexus_clean_prod_auth_v1',
  ORIGIN_SUPER_ADMIN: 'nexus_origin_super_admin_user',
  STAFF: 'nexus_clean_prod_staff_v1',
  LEADS: 'nexus_clean_prod_leads_v1',
  STUDENTS: 'nexus_clean_prod_students_v1',
  MENTORS: 'nexus_clean_prod_mentors_v1',
  EXPENSES: 'nexus_clean_prod_expenses_v1',
  COURSES: 'nexus_clean_prod_courses_v1',
  COHORTS: 'nexus_clean_prod_cohorts_v1',
  INVOICES: 'nexus_clean_prod_invoices_v1',
  SESSIONS: 'nexus_clean_prod_sessions_v1',
  ATTENDANCE: 'nexus_clean_prod_attendance_v1',
  SETTINGS: 'nexus_clean_prod_settings_v1',
  LOGS: 'nexus_clean_prod_logs_v1',
  NOTIFICATIONS: 'nexus_clean_prod_notifications_v1',
  TICKETS: 'nexus_clean_prod_tickets_v1',
  ROLES: 'nexus_clean_prod_roles_v1',
  WALLET: 'nexus_clean_prod_wallet_v2',
  TIMETABLES: 'nexus_clean_prod_timetables_v1',
  PAYOUT_REQUESTS: 'nexus_clean_prod_payout_requests_v1',
  STANDUPS: 'nexus_clean_prod_standups_v1',
  SCRUM_REPORTS: 'nexus_clean_prod_scrum_reports_v1',
};

export const defaultWalletState: ExpenseAndBudgetWallet = {
  balance: 0,
  monthlyBudgetLimit: 1500000,
  virtualAccount: {
    accountNumber: '9817707007',
    accountName: 'CODELABEDUCAR/WALLET NEXUS',
    bankName: 'Wema Bank',
    bankCode: '035',
    customerCode: 'CUS_0urz9hjjax0fyuv',
    customerEmail: 'wallet-operations@growpot.cloud',
    assignedAt: '2026-09-26T16:17:45.955Z',
    status: 'active',
    provider: 'wema-bank',
  },
  transactions: [],
  lastSyncedAt: new Date().toISOString()
};

export const CRMProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    const isExplicitlyLoggedOut = safeLocalStorage.getItem('nexus_logged_out') === 'true';
    if (isExplicitlyLoggedOut) return null;
    const saved = safeLocalStorage.getItem(STORAGE_KEYS.AUTH);
    if (!saved) return null;
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse saved auth state:', e);
      return null;
    }
  });

  const [staffUsers, setStaffUsers] = useState<AuthUser[]>(() => {
    const saved = safeLocalStorage.getItem(STORAGE_KEYS.STAFF);
    let parsed: AuthUser[] = demoUsers;
    if (saved) {
      try {
        const json = JSON.parse(saved);
        if (Array.isArray(json)) parsed = json;
      } catch (e) {}
    }
    // Deduplicate by email so duplicate entries never accumulate
    const seen = new Set<string>();
    const uniqueList: AuthUser[] = [];
    for (const u of parsed) {
      const emailKey = u.email?.toLowerCase().trim();
      if (!emailKey || !seen.has(emailKey)) {
        if (emailKey) seen.add(emailKey);
        uniqueList.push(u);
      }
    }
    return uniqueList;
  });

  const [leads, setLeads] = useState<Lead[]>(() => {
    const saved = safeLocalStorage.getItem(STORAGE_KEYS.LEADS);
    return saved ? JSON.parse(saved) : initialLeads;
  });

  const [students, setStudents] = useState<Student[]>(() => {
    const saved = safeLocalStorage.getItem(STORAGE_KEYS.STUDENTS);
    return saved ? JSON.parse(saved) : initialStudents;
  });

  const [mentors, setMentors] = useState<Mentor[]>(() => {
    const saved = safeLocalStorage.getItem(STORAGE_KEYS.MENTORS);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const existingIds = new Set(parsed.map((m: any) => m.id || m.email));
          const missing = initialMentors.filter(m => !existingIds.has(m.id) && !existingIds.has(m.email));
          return [...parsed, ...missing];
        }
      } catch (e) {}
    }
    return initialMentors;
  });

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = safeLocalStorage.getItem(STORAGE_KEYS.EXPENSES);
    return saved ? JSON.parse(saved) : initialExpenses;
  });

  const [courses, setCourses] = useState<CourseProgram[]>(() => {
    const saved = safeLocalStorage.getItem(STORAGE_KEYS.COURSES);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const existingIds = new Set(parsed.map((c: any) => c.id || c.title));
          const missing = initialCourses.filter(c => !existingIds.has(c.id) && !existingIds.has(c.title));
          return [...parsed, ...missing];
        }
      } catch (e) {}
    }
    return initialCourses;
  });

  const [cohorts, setCohorts] = useState<Cohort[]>(() => {
    const saved = safeLocalStorage.getItem(STORAGE_KEYS.COHORTS);
    return saved ? JSON.parse(saved) : initialCohorts;
  });

  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    const saved = safeLocalStorage.getItem(STORAGE_KEYS.INVOICES);
    return saved ? JSON.parse(saved) : initialInvoices;
  });

  const [sessions, setSessions] = useState<MentorshipSession[]>(() => {
    const saved = safeLocalStorage.getItem(STORAGE_KEYS.SESSIONS);
    return saved ? JSON.parse(saved) : initialSessions;
  });

  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(() => {
    const saved = safeLocalStorage.getItem(STORAGE_KEYS.ATTENDANCE);
    return saved ? JSON.parse(saved) : initialAttendance;
  });

  const [settings, setSettings] = useState<OrganizationSettings>(() => {
    const saved = safeLocalStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!saved) return initialSettings;
    try {
      const parsed = JSON.parse(saved);
      return {
        ...initialSettings,
        ...parsed,
        instituteName: (!parsed.instituteName || parsed.instituteName === 'Nexus Institute of Technology & Management') ? 'CODELAB EDUCARE LTD' : parsed.instituteName,
        portalTitle: (!parsed.portalTitle || parsed.portalTitle === 'Edu-Business Operations Enterprise Portal') ? 'CODELAB EDUCARE Enterprise Portal' : parsed.portalTitle,
        courseCategories: (parsed.courseCategories && parsed.courseCategories.length > 0) ? parsed.courseCategories : initialSettings.courseCategories,
        defaultNIBSSBank: {
          ...initialSettings.defaultNIBSSBank,
          ...(parsed.defaultNIBSSBank || {}),
          accountName: 'CODELAB EDUCARE LTD',
        },
        smtp: {
          ...initialSettings.smtp,
          ...(parsed.smtp || {}),
          user: parsed.smtp?.user || initialSettings.smtp?.user,
          pass: parsed.smtp?.pass || initialSettings.smtp?.pass,
          host: (parsed.smtp?.host === 'smtppro.zoho.com' || parsed.smtp?.host === 'smtp.hostinger.com') ? 'smtp.zoho.com' : (parsed.smtp?.host || initialSettings.smtp?.host),
          from: (parsed.smtp?.from && !parsed.smtp.from.includes('Nexus')) ? parsed.smtp.from : initialSettings.smtp?.from,
        }
      };
    } catch {
      return initialSettings;
    }
  });

  const [activityLogs, setActivityLogs] = useState<ActivityLogItem[]>(() => {
    const saved = safeLocalStorage.getItem(STORAGE_KEYS.LOGS);
    return saved ? JSON.parse(saved) : initialActivityLogs;
  });

  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    const saved = safeLocalStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    return saved ? JSON.parse(saved) : initialNotifications;
  });

  const [lmsModules, setLmsModules] = useState<LMSModule[]>(() => {
    const saved = safeLocalStorage.getItem('nexus_clean_prod_lms_modules_v2');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const existingIds = new Set(parsed.map((m: any) => m.id));
          const missing = initialLMSModules.filter(m => !existingIds.has(m.id));
          return [...parsed, ...missing];
        }
      } catch (e) {}
    }
    return initialLMSModules;
  });

  const [assignments, setAssignments] = useState<StudentAssignmentSubmission[]>(() => {
    const saved = safeLocalStorage.getItem('nexus_clean_prod_assignments_v1');
    return saved ? JSON.parse(saved) : initialAssignments;
  });

  const [studentPerformanceReports, setStudentPerformanceReports] = useState<StudentPerformanceReport[]>(() => {
    const saved = safeLocalStorage.getItem('nexus_clean_prod_student_reports_v1');
    return saved ? JSON.parse(saved) : initialStudentPerformanceReports;
  });

  const [tickets, setTickets] = useState<SupportTicket[]>(() => {
    const saved = safeLocalStorage.getItem(STORAGE_KEYS.TICKETS);
    return saved ? JSON.parse(saved) : initialTickets;
  });

  const [customRoles, setCustomRoles] = useState<CustomRoleDefinition[]>(() => {
    const saved = safeLocalStorage.getItem(STORAGE_KEYS.ROLES);
    if (!saved) return defaultRoleDefinitions;
    try {
      const parsed: CustomRoleDefinition[] = JSON.parse(saved);
      const merged = [...parsed];
      for (const sysRole of defaultRoleDefinitions) {
        if (!merged.some(r => r.id === sysRole.id)) {
          merged.push(sysRole);
        }
      }
      return merged;
    } catch {
      return defaultRoleDefinitions;
    }
  });

  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isBackendConnected, setIsBackendConnected] = useState<boolean>(false);

  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [globalSearch, setGlobalSearch] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('stu-1');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>('inv-1');
  const [selectedMentorForBookingId, setSelectedMentorForBookingId] = useState<string | null>(null);
  const [selectedStudentForAssignmentId, setSelectedStudentForAssignmentId] = useState<string | null>(null);
  const [selectedCourseForEditId, setSelectedCourseForEditId] = useState<string | null>(null);
  const [selectedMentorForEditId, setSelectedMentorForEditId] = useState<string | null>(null);
  const [selectedMentorForProfileId, setSelectedMentorForProfileId] = useState<string | null>(null);
  const [selectedStaffForEditId, setSelectedStaffForEditId] = useState<string | null>(null);

  const openMentorProfileModal = (mentorOrId: Mentor | string) => {
    const id = typeof mentorOrId === 'string' ? mentorOrId : mentorOrId.id;
    setSelectedMentorForProfileId(id);
    openModal('mentor-profile');
  };
  const [selectedLeadForFollowUp, setSelectedLeadForFollowUp] = useState<Lead | null>(null);

  const openFollowUpModal = (lead: Lead) => {
    setSelectedLeadForFollowUp(lead);
    setActiveModal('log-follow-up');
  };

  const [selectedStudentForPayment, setSelectedStudentForPayment] = useState<Student | null>(null);

  const openRecordPaymentModal = (student: Student) => {
    setSelectedStudentForPayment(student);
    setActiveModal('record-installment');
  };
  const [selectedBiodataUser, setSelectedBiodataUser] = useState<{
    category: 'staff' | 'mentor' | 'student';
    id: string;
    data: any;
  } | null>(null);

  // Timetables and Academic Administration state
  const [timetables, setTimetables] = useState<TimetableSlot[]>(() => {
    const saved = safeLocalStorage.getItem(STORAGE_KEYS.TIMETABLES);
    return saved ? JSON.parse(saved) : initialTimetables;
  });
  const [selectedUserForPasswordReset, setSelectedUserForPasswordReset] = useState<{ id: string; name: string; email: string; role: string; category?: string } | null>(null);
  const [selectedSlotForAttendance, setSelectedSlotForAttendance] = useState<TimetableSlot | null>(null);
  const [selectedSlotForRecording, setSelectedSlotForRecording] = useState<TimetableSlot | null>(null);

  // Operational Expense & Budget Wallet state
  const [wallet, setWallet] = useState<ExpenseAndBudgetWallet>(() => {
    const saved = safeLocalStorage.getItem(STORAGE_KEYS.WALLET);
    return saved ? JSON.parse(saved) : defaultWalletState;
  });
  const [selectedExpenseForDisburse, setSelectedExpenseForDisburse] = useState<Expense | null>(null);
  const [selectedMentorForDisburse, setSelectedMentorForDisburse] = useState<Mentor | null>(null);
  const [payoutRequests, setPayoutRequests] = useState<MentorPayoutRequest[]>(() => {
    const saved = safeLocalStorage.getItem(STORAGE_KEYS.PAYOUT_REQUESTS);
    return saved ? JSON.parse(saved) : initialPayoutRequests;
  });

  // Chat message management state
  const [selectedMessageForForward, setSelectedMessageForForward] = useState<ChatMessage | null>(null);
  const openForwardModal = (msg: ChatMessage) => {
    setSelectedMessageForForward(msg);
    setActiveModal('forward-message');
  };

  // Payout request edit state
  const [selectedPayoutRequestForEdit, setSelectedPayoutRequestForEdit] = useState<MentorPayoutRequest | null>(null);
  const openEditPayoutRequestModal = (req: MentorPayoutRequest) => {
    setSelectedPayoutRequestForEdit(req);
    setActiveModal('request-payout');
  };

  // AI Daily Standup & Weekly Scrum state
  const [dailyStandups, setDailyStandups] = useState<DailyStandupReport[]>(() => {
    const saved = safeLocalStorage.getItem(STORAGE_KEYS.STANDUPS);
    return saved ? JSON.parse(saved) : [];
  });
  const [weeklyScrumReports, setWeeklyScrumReports] = useState<WeeklyScrumPerformance[]>(() => {
    const saved = safeLocalStorage.getItem(STORAGE_KEYS.SCRUM_REPORTS);
    return saved ? JSON.parse(saved) : [];
  });
  const [todayStandup, setTodayStandup] = useState<DailyStandupReport | null>(null);

  useEffect(() => {
    safeLocalStorage.setItem(STORAGE_KEYS.STANDUPS, JSON.stringify(dailyStandups));
  }, [dailyStandups]);

  useEffect(() => {
    safeLocalStorage.setItem(STORAGE_KEYS.SCRUM_REPORTS, JSON.stringify(weeklyScrumReports));
  }, [weeklyScrumReports]);

  // Team Chat Live Unread Counter & Floating Dock State
  const [unreadChatCount, setUnreadChatCount] = useState<number>(0);
  const [isChatPopoutOpen, setIsChatPopoutOpen] = useState<boolean>(false);

  const refreshUnreadChatCount = useCallback(async () => {
    if (!currentUser) {
      setUnreadChatCount(0);
      return;
    }
    try {
      const res = await fetch(`/api/chat/conversations?userId=${encodeURIComponent(currentUser.id)}&role=${encodeURIComponent(currentUser.role)}&email=${encodeURIComponent(currentUser.email)}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        const total = data.data.reduce((sum: number, c: any) => sum + (c.unreadCount || 0), 0);
        setUnreadChatCount(total);
      }
    } catch {
      // Background poll silently catches offline states
    }
  }, [currentUser]);

  useEffect(() => {
    refreshUnreadChatCount();
    const interval = setInterval(refreshUnreadChatCount, 4000);
    return () => clearInterval(interval);
  }, [refreshUnreadChatCount]);

  // Bootstrap from backend on mount
  useEffect(() => {
    let isMounted = true;
    const syncWithBackend = async () => {
      const data = await apiService.bootstrap();
      if (data && isMounted) {
        setIsBackendConnected(true);
        if (data.leads) setLeads(data.leads);
        if (data.students) setStudents(data.students);
        if (data.mentors) setMentors(data.mentors);
        if (data.expenses) setExpenses(data.expenses);
        
        // Permanent Course Persistence: Reconcile backend courses with localStorage
        if (data.courses && Array.isArray(data.courses) && data.courses.length > 0) {
          setCourses(data.courses);
        } else {
          const localSaved = safeLocalStorage.getItem(STORAGE_KEYS.COURSES);
          if (localSaved) {
            try {
              const parsed = JSON.parse(localSaved);
              if (Array.isArray(parsed) && parsed.length > 0) {
                setCourses(parsed);
                parsed.forEach((c: any) => apiService.createCourse(c));
              }
            } catch (e) {}
          }
        }

        if (data.cohorts) setCohorts(data.cohorts);
        if (data.invoices) setInvoices(data.invoices);
        if (data.sessions) setSessions(data.sessions);
        if (data.attendance) setAttendanceRecords(data.attendance);
        if (data.settings) setSettings(data.settings);
        if (data.notifications) setNotifications(data.notifications);
        if (data.staffUsers) {
          const seen = new Set<string>();
          const uniqueStaff = data.staffUsers.filter(u => {
            const k = u.email?.toLowerCase().trim();
            if (!k || seen.has(k)) return false;
            seen.add(k);
            return true;
          });
          setStaffUsers(uniqueStaff);

          // Dynamically synchronize active currentUser session with fresh role, isApprover, and permissions
          // Supports Staff, Faculty Mentors (e.g. God'smiracle, Obas), and Enrolled Students
          setCurrentUser(prevUser => {
            if (!prevUser) return null;
            const normEmail = prevUser.email?.toLowerCase().trim();
            const match = uniqueStaff.find(u => 
              u.id === prevUser.id || 
              (normEmail && (
                u.email?.toLowerCase().trim() === normEmail ||
                (u as any).secondaryEmail?.toLowerCase().trim() === normEmail ||
                (normEmail.includes('humu') && u.email?.toLowerCase().includes('humu'))
              ))
            );
            const mentorMatch = (data.mentors || []).find((m: any) =>
              m.id === prevUser.id ||
              (prevUser.mentorId && m.id === prevUser.mentorId) ||
              (normEmail && (
                m.email?.toLowerCase().trim() === normEmail ||
                m.secondaryEmail?.toLowerCase().trim() === normEmail
              ))
            );
            const studentMatch = (data.students || []).find((s: any) =>
              s.id === prevUser.id ||
              (prevUser.studentId && s.id === prevUser.studentId) ||
              (normEmail && (
                s.email?.toLowerCase().trim() === normEmail ||
                s.secondaryEmail?.toLowerCase().trim() === normEmail
              ))
            );

            const sourceRecord: any = match || mentorMatch || studentMatch;
            if (sourceRecord) {
              // Merge mentorMatch fields if user exists in both or in mentors
              const mergedSource: any = {
                ...(studentMatch || {}),
                ...(mentorMatch || {}),
                ...(match || {}),
              };
              const resolvedRole = match?.role || (mentorMatch as any)?.systemRole || prevUser.role;
              const resolvedRoleTitle = match?.roleTitle || (resolvedRole === 'mentor' ? (mentorMatch?.role || prevUser.roleTitle || 'Faculty Mentor') : prevUser.roleTitle);
              const resolvedAccountNumber = mergedSource.accountNumber || prevUser.accountNumber;
              const resolvedBankVerified = Boolean(
                mergedSource.isBankVerified ??
                mergedSource.isAccountVerified ??
                mergedSource.bankVerified ??
                prevUser.isBankVerified ??
                (resolvedAccountNumber && String(resolvedAccountNumber).length === 10)
              );

              const updated: AuthUser = { 
                ...prevUser, 
                ...mergedSource,
                id: prevUser.id,
                role: resolvedRole,
                roleTitle: resolvedRoleTitle,
                mentorId: prevUser.mentorId || mentorMatch?.id,
                studentId: prevUser.studentId || studentMatch?.id,
                avatarUrl: mergedSource.avatarUrl || prevUser.avatarUrl,
                phone: mergedSource.phone || prevUser.phone,
                bio: mergedSource.bio || prevUser.bio,
                dateOfBirth: mergedSource.dateOfBirth || prevUser.dateOfBirth,
                gender: mergedSource.gender || prevUser.gender,
                nationality: mergedSource.nationality || prevUser.nationality,
                stateOfOrigin: mergedSource.stateOfOrigin || prevUser.stateOfOrigin,
                lga: mergedSource.lga || prevUser.lga,
                residentialAddress: mergedSource.residentialAddress || prevUser.residentialAddress,
                city: mergedSource.city || prevUser.city,
                stateOfResidence: mergedSource.stateOfResidence || prevUser.stateOfResidence,
                proofOfAddressUrl: mergedSource.proofOfAddressUrl || prevUser.proofOfAddressUrl,
                proofOfAddressName: mergedSource.proofOfAddressName || prevUser.proofOfAddressName,
                idType: mergedSource.idType || prevUser.idType,
                idNumber: mergedSource.idNumber || prevUser.idNumber,
                idDocumentUrl: mergedSource.idDocumentUrl || prevUser.idDocumentUrl,
                idDocumentName: mergedSource.idDocumentName || prevUser.idDocumentName,
                isIdVerified: mergedSource.isIdVerified ?? prevUser.isIdVerified,
                nextOfKinName: mergedSource.nextOfKinName || prevUser.nextOfKinName,
                nextOfKinRelationship: mergedSource.nextOfKinRelationship || prevUser.nextOfKinRelationship,
                nextOfKinPhone: mergedSource.nextOfKinPhone || prevUser.nextOfKinPhone,
                nextOfKinAddress: mergedSource.nextOfKinAddress || prevUser.nextOfKinAddress,
                bankName: mergedSource.bankName || prevUser.bankName,
                bankCode: mergedSource.bankCode || prevUser.bankCode,
                accountNumber: resolvedAccountNumber,
                accountName: mergedSource.accountName || prevUser.accountName,
                bvn: mergedSource.bvn || prevUser.bvn,
                isBankVerified: resolvedBankVerified,
                kycTier: mergedSource.kycTier || prevUser.kycTier || (resolvedAccountNumber ? 3 : (mergedSource.idNumber || prevUser.idNumber ? 2 : 1)),
                kycStatus: mergedSource.kycStatus || prevUser.kycStatus || (match ? 'Verified' : 'Incomplete'),
                password: prevUser.password || mergedSource.password,
                isApprover: mergedSource.isApprover ?? prevUser.isApprover
              };
              safeLocalStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(updated));
              return updated;
            }
            return prevUser;
          });
        }
        if (data.lmsModules) setLmsModules(data.lmsModules);
        if (data.assignments) setAssignments(data.assignments);
        if ((data as any).studentPerformanceReports) setStudentPerformanceReports((data as any).studentPerformanceReports);
        if ((data as any).tickets) setTickets((data as any).tickets);
        if ((data as any).customRoles) {
          const fetchedRoles: CustomRoleDefinition[] = (data as any).customRoles;
          const merged = [...fetchedRoles];
          for (const sysRole of defaultRoleDefinitions) {
            if (!merged.some(r => r.id === sysRole.id)) {
              merged.push(sysRole);
            }
          }
          setCustomRoles(merged);
        }
        if ((data as any).wallet) setWallet((data as any).wallet);
        if ((data as any).payoutRequests) setPayoutRequests((data as any).payoutRequests);
        console.log('🚀 Synchronized live data with Express REST backend.');
      } else if (isMounted) {
        setIsBackendConnected(false);
      }
    };
    syncWithBackend();

    // Also fetch dedicated wallet summary from /api/wallet/summary
    const fetchWallet = async () => {
      const summary = await apiService.getWalletSummary();
      if (summary && isMounted) {
        setWallet(summary);
      }
    };
    fetchWallet();

    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    safeLocalStorage.setItem(STORAGE_KEYS.WALLET, JSON.stringify(wallet));
  }, [wallet]);


  // Persist state to localStorage as fallback
  useEffect(() => { 
    if (currentUser) {
      safeLocalStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(currentUser)); 
    } else {
      safeLocalStorage.removeItem(STORAGE_KEYS.AUTH);
    }
  }, [currentUser]);

  useEffect(() => { safeLocalStorage.setItem(STORAGE_KEYS.STAFF, JSON.stringify(staffUsers)); }, [staffUsers]);
  useEffect(() => { safeLocalStorage.setItem(STORAGE_KEYS.LEADS, JSON.stringify(leads)); }, [leads]);
  useEffect(() => { safeLocalStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students)); }, [students]);
  useEffect(() => { safeLocalStorage.setItem(STORAGE_KEYS.MENTORS, JSON.stringify(mentors)); }, [mentors]);
  useEffect(() => { safeLocalStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses)); }, [expenses]);
  useEffect(() => { safeLocalStorage.setItem(STORAGE_KEYS.COURSES, JSON.stringify(courses)); }, [courses]);
  useEffect(() => { safeLocalStorage.setItem(STORAGE_KEYS.COHORTS, JSON.stringify(cohorts)); }, [cohorts]);
  useEffect(() => { safeLocalStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(invoices)); }, [invoices]);
  useEffect(() => { safeLocalStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions)); }, [sessions]);
  useEffect(() => { safeLocalStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(attendanceRecords)); }, [attendanceRecords]);
  useEffect(() => { safeLocalStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings)); }, [settings]);
  useEffect(() => { safeLocalStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(activityLogs)); }, [activityLogs]);
  useEffect(() => { safeLocalStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications)); }, [notifications]);
  useEffect(() => { safeLocalStorage.setItem('nexus_clean_prod_lms_modules_v2', JSON.stringify(lmsModules)); }, [lmsModules]);
  useEffect(() => { safeLocalStorage.setItem('nexus_clean_prod_assignments_v1', JSON.stringify(assignments)); }, [assignments]);
  useEffect(() => { safeLocalStorage.setItem('nexus_clean_prod_student_reports_v1', JSON.stringify(studentPerformanceReports)); }, [studentPerformanceReports]);
  useEffect(() => { safeLocalStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(tickets)); }, [tickets]);
  useEffect(() => { safeLocalStorage.setItem(STORAGE_KEYS.ROLES, JSON.stringify(customRoles)); }, [customRoles]);
  useEffect(() => { safeLocalStorage.setItem(STORAGE_KEYS.TIMETABLES, JSON.stringify(timetables)); }, [timetables]);
  useEffect(() => { safeLocalStorage.setItem(STORAGE_KEYS.PAYOUT_REQUESTS, JSON.stringify(payoutRequests)); }, [payoutRequests]);

  // Current active student profile when logged in as a student
  const currentStudentProfile = useMemo(() => {
    if (!currentUser) return null;
    if (currentUser.role === 'student') {
      const cleanEmail = currentUser.email?.toLowerCase().trim();
      const match = students.find(s => 
        (currentUser.studentId && (s.id === currentUser.studentId || s.studentCode === currentUser.studentId)) || 
        (cleanEmail && s.email?.toLowerCase().trim() === cleanEmail) ||
        (currentUser.name && s.name?.toLowerCase().trim() === currentUser.name?.toLowerCase().trim())
      );
      if (match) return match;

      // Safe fallback using currentUser's identity rather than a hardcoded different student
      const fallbackStudent: Student = {
        id: currentUser.id || currentUser.studentId || 'stu-session',
        studentCode: currentUser.studentId || `STU-${currentUser.id ? currentUser.id.slice(-4) : '2026'}`,
        name: currentUser.name || 'Enrolled Student',
        email: currentUser.email || 'student@codelab.institute',
        phone: currentUser.phone || '+234 800 000 0000',
        program: (currentUser as any).program || 'Diploma in Financial Trading',
        cohort: (currentUser as any).cohort || 'Cohort Alpha 2026',
        mentorId: currentUser.mentorId,
        mentorName: (currentUser as any).mentorName || 'Faculty Mentor',
        attendanceRate: 100,
        attendedLearningHours: 0,
        minimumRequiredHours: 25,
        tuitionStatus: 'Paid',
        tuitionAmount: 0,
        totalFees: 0,
        paidAmount: 0,
        outstandingBalance: 0,
        progressPercent: 0,
        status: 'Active',
        isActive: true,
        enrolledDate: new Date().toISOString().split('T')[0],
        courses: [],
        installments: [],
      };
      return fallbackStudent;
    }
    return null;
  }, [currentUser, students]);

  // Current active clock-in session for currentUser (Today only)
  const activeAttendanceSession = useMemo(() => {
    if (!currentUser) return null;
    const todayStr = new Date().toISOString().split('T')[0];
    return attendanceRecords.find(r => {
      const isUser =
        (r.staffId || r.userId) === currentUser.id ||
        (r.staffEmail || r.userEmail)?.toLowerCase() === currentUser.email?.toLowerCase();
      return isUser && !r.clockOutTime && r.date === todayStr;
    }) || null;
  }, [attendanceRecords, currentUser]);

  // Any unclosed shift from a previous day requiring retroactive clock-out reconciliation
  const staleAttendanceSession = useMemo(() => {
    if (!currentUser) return null;
    const todayStr = new Date().toISOString().split('T')[0];
    return attendanceRecords.find(r => {
      const isUser =
        (r.staffId || r.userId) === currentUser.id ||
        (r.staffEmail || r.userEmail)?.toLowerCase() === currentUser.email?.toLowerCase();
      return isUser && !r.clockOutTime && r.date < todayStr;
    }) || null;
  }, [attendanceRecords, currentUser]);

  // Completed shift earlier today (enables same-day shift resumption)
  const todayCompletedSession = useMemo(() => {
    if (!currentUser || activeAttendanceSession) return null;
    const todayStr = new Date().toISOString().split('T')[0];
    return attendanceRecords.find(r => {
      const isUser =
        (r.staffId || r.userId) === currentUser.id ||
        (r.staffEmail || r.userEmail)?.toLowerCase() === currentUser.email?.toLowerCase();
      return isUser && !!r.clockOutTime && r.date === todayStr;
    }) || null;
  }, [attendanceRecords, currentUser, activeAttendanceSession]);

  // Notifications & Toasts
  const addNotification = (notif: Omit<NotificationItem, 'id' | 'timestamp' | 'read'>) => {
    const newNotif: NotificationItem = {
      ...notif,
      id: `notif-${Date.now()}`,
      timestamp: 'Just now',
      read: false,
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    apiService.markNotificationRead(id);
  };

  const markAllNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    apiService.markAllNotificationsRead();
  };

  const clearNotifications = () => {
    setNotifications([]);
    apiService.clearNotifications();
  };

  const showToast = (title: string, message: string, type: ToastMessage['type'] = 'info') => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    const newToast: ToastMessage = { id, title, message, type };
    setToasts(prev => [...prev, newToast]);

    setTimeout(() => {
      removeToast(id);
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const unreadNotificationCount = useMemo(() => {
    return notifications.filter(n => !n.read).length;
  }, [notifications]);

  // Super Admin session tracking for role switching & identity lock (e.g. Abiola stays locked to Abiola)
  const [isSuperAdminSession, setIsSuperAdminSession] = useState<boolean>(() => {
    return safeSessionStorage.getItem('nexus_super_admin_session') === 'true' ||
           safeLocalStorage.getItem('nexus_super_admin_session_persistent') === 'true';
  });

  const [originSuperAdmin, setOriginSuperAdmin] = useState<AuthUser | null>(() => {
    const savedOrigin = safeLocalStorage.getItem(STORAGE_KEYS.ORIGIN_SUPER_ADMIN);
    if (savedOrigin) {
      try {
        return JSON.parse(savedOrigin);
      } catch {}
    }
    if (currentUser?.role === 'super_admin') {
      return currentUser;
    }
    return null;
  });

  useEffect(() => {
    if (currentUser && currentUser.role === 'super_admin') {
      setOriginSuperAdmin(currentUser);
      safeLocalStorage.setItem(STORAGE_KEYS.ORIGIN_SUPER_ADMIN, JSON.stringify(currentUser));
    }
  }, [currentUser]);

  const isSuperAdmin = currentUser ? (currentUser.role === 'super_admin' || isSuperAdminSession) : false;
  const isSimulatingRole = isSuperAdmin && currentUser?.role !== 'super_admin';

  // Auth actions
  const login = async (role: UserRole, email?: string, password?: string): Promise<{ success: boolean; message?: string; user?: AuthUser }> => {
    if (!password || !password.trim()) {
      return { success: false, message: 'Password is required to authenticate.' };
    }

    const cleanEmail = email ? email.trim().toLowerCase() : '';
    const isSuperAdminAlias = cleanEmail === 'admin@codelab.institute' || cleanEmail === 'superadmin@codelab.institute';

    // 1. Try Backend Authentication if connected
    if (isBackendConnected) {
      try {
        const backendRes = await apiService.login({
          email: cleanEmail,
          password: password.trim(),
          role: isSuperAdminAlias ? 'super_admin' : role,
        });

        if (backendRes && backendRes.success && backendRes.user) {
          const authUser: AuthUser = backendRes.user;
          safeLocalStorage.removeItem('nexus_logged_out');

          if (authUser.role === 'super_admin') {
            safeSessionStorage.setItem('nexus_super_admin_session', 'true');
            safeLocalStorage.setItem('nexus_super_admin_session_persistent', 'true');
            setIsSuperAdminSession(true);
            setOriginSuperAdmin(authUser);
            safeLocalStorage.setItem(STORAGE_KEYS.ORIGIN_SUPER_ADMIN, JSON.stringify(authUser));
          } else {
            safeSessionStorage.removeItem('nexus_super_admin_session');
            safeLocalStorage.removeItem('nexus_super_admin_session_persistent');
            setIsSuperAdminSession(false);
            setOriginSuperAdmin(null);
            safeLocalStorage.removeItem(STORAGE_KEYS.ORIGIN_SUPER_ADMIN);
          }

          setCurrentUser(authUser);
          showToast('Signed In', `Welcome, ${authUser.name} (${authUser.roleTitle}).`, 'info');
          logActivity({
            title: 'User Authenticated',
            description: `${authUser.name} signed in as ${authUser.roleTitle}.`,
            type: 'system',
            user: authUser.name,
          });

          return { success: true, user: authUser };
        } else if (backendRes && backendRes.message && backendRes.message !== 'Could not connect to authentication server.') {
          return { success: false, message: backendRes.message };
        }
      } catch (err: any) {
        console.warn('Backend login error, falling back to local authentication:', err);
      }
    }

    // 2. Local State Fallback Authentication
    let matched: AuthUser | undefined;

    if (cleanEmail) {
      // Check Super Admin aliases
      if (isSuperAdminAlias) {
        matched = staffUsers.find(u => u.id === 'user-admin' || u.name?.toLowerCase().includes('abiola')) ||
                  staffUsers.find(u => u.role === 'super_admin') ||
                  demoUsers.find(u => u.role === 'super_admin');
      }

      // 1. Check staffUsers by email (including secondaryEmail and aliases)
      if (!matched) {
        matched = staffUsers.find(u => 
          u.email?.trim().toLowerCase() === cleanEmail ||
          (u as any).secondaryEmail?.trim().toLowerCase() === cleanEmail ||
          (u.name?.toLowerCase().includes('oyinkonsola') && (cleanEmail === 'oyinojobo@gmail.com' || cleanEmail === 'oyinojobor@gmail.com'))
        );
      }

      // 2. Check mentors by email
      if (!matched) {
        const mentor = mentors.find(m => 
          m.email?.trim().toLowerCase() === cleanEmail ||
          (m as any).secondaryEmail?.trim().toLowerCase() === cleanEmail
        );
        if (mentor) {
          matched = {
            ...(mentor as any),
            id: mentor.id,
            name: mentor.name,
            email: mentor.email,
            role: ((mentor as any).systemRole as UserRole) || 'mentor',
            roleTitle: mentor.role || 'Faculty Mentor',
            mentorId: mentor.id,
            department: mentor.department,
            password: mentor.password,
            isActive: mentor.isActive !== false && mentor.status !== 'Deactivated',
            status: mentor.status === 'Deactivated' ? 'Deactivated' : 'Active',
            isBankVerified: Boolean((mentor as any).isBankVerified || mentor.isAccountVerified || mentor.bankVerified || (mentor.accountNumber && String(mentor.accountNumber).length === 10)),
          };
        }
      }

      // 3. Check students by email
      if (!matched) {
        const student = students.find(s => 
          s.email?.trim().toLowerCase() === cleanEmail ||
          (s as any).secondaryEmail?.trim().toLowerCase() === cleanEmail
        );
        if (student) {
          matched = {
            ...(student as any),
            id: student.id,
            name: student.name,
            email: student.email,
            role: 'student',
            roleTitle: 'Enrolled Scholar / Student',
            studentId: student.id,
            password: student.password,
            isActive: student.isActive !== false && student.status !== 'Deactivated',
            status: student.status === 'Deactivated' ? 'Deactivated' : 'Active',
          };
        }
      }

      // 4. Check demoUsers by email
      if (!matched) {
        matched = demoUsers.find(u => u.email?.trim().toLowerCase() === cleanEmail);
      }

      // If an email was specified but no account matched, strictly fail authentication
      if (!matched) {
        return { success: false, message: `No registered institutional account found matching email "${cleanEmail}".` };
      }
    } else if (role) {
      // Only match by role if NO email was provided at all (e.g. headless simulation)
      matched = staffUsers.find(u => u.role === role) || demoUsers.find(u => u.role === role);
    }

    if (!matched) {
      return { success: false, message: 'No registered institutional account found matching the provided details.' };
    }

    // Credential Verification:
    const demoUser = demoUsers.find(u => u.id === matched?.id || u.email.toLowerCase() === matched?.email.toLowerCase());
    const expectedPassword = matched.password || demoUser?.password || 'password123';
    if (password.trim() !== expectedPassword.trim()) {
      return { success: false, message: 'Invalid password. Please check your credentials and try again.' };
    }

    // Check account status
    if (matched.isActive === false || matched.status === 'Deactivated') {
      return { 
        success: false, 
        message: 'This account has been deactivated by the Super Admin. Please contact administration for assistance.' 
      };
    }

    // Clear explicit logout flag
    safeLocalStorage.removeItem('nexus_logged_out');

    // Set or clear super admin session flag based on authenticated account
    if (matched.role === 'super_admin') {
      safeSessionStorage.setItem('nexus_super_admin_session', 'true');
      safeLocalStorage.setItem('nexus_super_admin_session_persistent', 'true');
      setIsSuperAdminSession(true);
      setOriginSuperAdmin(matched);
      safeLocalStorage.setItem(STORAGE_KEYS.ORIGIN_SUPER_ADMIN, JSON.stringify(matched));
    } else {
      safeSessionStorage.removeItem('nexus_super_admin_session');
      safeLocalStorage.removeItem('nexus_super_admin_session_persistent');
      setIsSuperAdminSession(false);
      setOriginSuperAdmin(null);
      safeLocalStorage.removeItem(STORAGE_KEYS.ORIGIN_SUPER_ADMIN);
    }

    setCurrentUser(matched);
    showToast('Signed In', `Welcome, ${matched.name} (${matched.roleTitle}).`, 'info');
    logActivity({
      title: 'User Authenticated',
      description: `${matched.name} signed in as ${matched.roleTitle}.`,
      type: 'system',
      user: matched.name,
    });

    return { success: true, user: matched };
  };

  const switchRole = (newRole: UserRole, targetMentorId?: string) => {
    // Strictly only allow role switching if user is a Super Admin
    if (!isSuperAdmin) {
      showToast('Permission Denied', 'Role switching is restricted exclusively to the Super Admin.', 'error');
      return;
    }

    // Lock the originating Super Admin account before switching into simulation
    let lockedSuperAdmin = originSuperAdmin;
    if (currentUser?.role === 'super_admin') {
      lockedSuperAdmin = currentUser;
      setOriginSuperAdmin(currentUser);
      safeLocalStorage.setItem(STORAGE_KEYS.ORIGIN_SUPER_ADMIN, JSON.stringify(currentUser));
    } else if (!lockedSuperAdmin) {
      const savedOriginStr = safeLocalStorage.getItem(STORAGE_KEYS.ORIGIN_SUPER_ADMIN);
      if (savedOriginStr) {
        try { lockedSuperAdmin = JSON.parse(savedOriginStr); } catch {}
      }
    }

    // Ensure session remembers that Super Admin originated this session
    safeSessionStorage.setItem('nexus_super_admin_session', 'true');
    safeLocalStorage.setItem('nexus_super_admin_session_persistent', 'true');
    setIsSuperAdminSession(true);

    if (newRole === 'super_admin') {
      // Revert back exclusively to the exact originating Super Admin account (e.g., Abiola Adefowope)
      const matchedFromStaff = lockedSuperAdmin
        ? staffUsers.find(u =>
            u.id === lockedSuperAdmin!.id ||
            (lockedSuperAdmin!.email && u.email?.toLowerCase().trim() === lockedSuperAdmin!.email.toLowerCase().trim())
          )
        : undefined;

      const superAdminUser =
        matchedFromStaff ||
        lockedSuperAdmin ||
        staffUsers.find(u => u.id === 'user-admin' || u.name?.toLowerCase().includes('abiola')) ||
        staffUsers.find(u => u.role === 'super_admin') ||
        demoUsers[0];

      setCurrentUser(superAdminUser);
      setOriginSuperAdmin(superAdminUser);
      safeLocalStorage.setItem(STORAGE_KEYS.ORIGIN_SUPER_ADMIN, JSON.stringify(superAdminUser));
      showToast('Super Admin Restored', `Returned to ${superAdminUser.name} (${superAdminUser.roleTitle}).`, 'success');
      logActivity({
        title: 'Role Reverted to Super Admin',
        description: `${superAdminUser.name} exited role simulation mode.`,
        type: 'system',
        user: superAdminUser.name,
      });
      return;
    }

    // Find persona for target role
    let targetUser: AuthUser | undefined;
    if (newRole === 'mentor') {
      const mentor = (targetMentorId ? mentors.find(m => m.id === targetMentorId) : null) || mentors[0];
      if (mentor) {
        targetUser = {
          ...(mentor as any),
          id: mentor.id,
          name: mentor.name,
          email: mentor.email,
          role: 'mentor',
          roleTitle: `Faculty Mentor (${mentor.name})`,
          mentorId: mentor.id,
          department: mentor.department,
        };
      }
    } else if (newRole === 'student') {
      const student = students[0];
      if (student) {
        targetUser = {
          ...(student as any),
          id: student.id,
          name: student.name,
          email: student.email,
          role: 'student',
          roleTitle: 'Enrolled Student (Simulated)',
          studentId: student.id,
        };
      }
    } else {
      targetUser = staffUsers.find(u => u.role === newRole) || demoUsers.find(u => u.role === newRole);
    }

    if (!targetUser) {
      targetUser = {
        id: `sim-${newRole}`,
        name: `${newRole.toUpperCase()} Persona`,
        email: `${newRole}@codelab.institute`,
        role: newRole,
        roleTitle: `${newRole.replace('_', ' ')} (Simulated)`,
      };
    }

    setCurrentUser(targetUser);
    showToast('Role Switched (Simulation)', `Now previewing portal as ${targetUser.name} (${targetUser.roleTitle}).`, 'info');
    logActivity({
      title: 'Role Simulated by Super Admin',
      description: `Super Admin switched active view to ${targetUser.roleTitle}.`,
      type: 'system',
      user: lockedSuperAdmin?.name || 'Super Admin (Simulation)',
    });
  };

  const logout = () => {
    setCurrentUser(null);
    setOriginSuperAdmin(null);
    safeSessionStorage.removeItem('nexus_super_admin_session');
    safeLocalStorage.removeItem('nexus_super_admin_session_persistent');
    safeLocalStorage.removeItem(STORAGE_KEYS.ORIGIN_SUPER_ADMIN);
    setIsSuperAdminSession(false);
    safeLocalStorage.removeItem(STORAGE_KEYS.AUTH);
    safeLocalStorage.setItem('nexus_logged_out', 'true');
    showToast('Signed Out', 'You have been signed out of the portal.', 'info');
    logActivity({
      title: 'User Signed Out',
      description: 'Session ended successfully.',
      type: 'system',
      user: 'System',
    });
  };

  // Inactivity Session Security Timeout
  const lastActivityTimeRef = useRef<number>(Date.now());
  const [sessionWarningSeconds, setSessionWarningSeconds] = useState<number | null>(null);

  const resetActivityTimer = useCallback(() => {
    lastActivityTimeRef.current = Date.now();
    setSessionWarningSeconds(null);
  }, []);

  useEffect(() => {
    if (!currentUser) {
      setSessionWarningSeconds(null);
      return;
    }

    const timeoutMinutes = settings.sessionTimeoutMinutes ?? 30;
    if (timeoutMinutes <= 0) {
      setSessionWarningSeconds(null);
      return;
    }

    const timeoutMs = timeoutMinutes * 60 * 1000;
    const warningMs = Math.max(0, timeoutMs - 60000); // 60s warning threshold

    let lastThrottleTime = 0;
    const handleUserActivity = () => {
      const now = Date.now();
      if (now - lastThrottleTime > 1500) {
        lastThrottleTime = now;
        lastActivityTimeRef.current = now;
        setSessionWarningSeconds(prev => (prev !== null ? null : prev));
      }
    };

    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];
    events.forEach(evt => window.addEventListener(evt, handleUserActivity, { passive: true }));

    const intervalId = setInterval(() => {
      const now = Date.now();
      const idleTime = now - lastActivityTimeRef.current;

      if (idleTime >= timeoutMs) {
        clearInterval(intervalId);
        setSessionWarningSeconds(null);
        logout();
        showToast('Session Expired', `You were logged out after ${timeoutMinutes} minutes of inactivity for your security.`, 'warning');
      } else if (idleTime >= warningMs) {
        const remainingSec = Math.max(1, Math.ceil((timeoutMs - idleTime) / 1000));
        setSessionWarningSeconds(remainingSec);
      } else {
        setSessionWarningSeconds(null);
      }
    }, 1000);

    return () => {
      clearInterval(intervalId);
      events.forEach(evt => window.removeEventListener(evt, handleUserActivity));
    };
  }, [currentUser, settings.sessionTimeoutMinutes, logout, showToast]);

  const updateUserProfile = async (data: Partial<AuthUser>): Promise<boolean> => {
    if (!currentUser) return false;

    const updatedUser: AuthUser = {
      ...currentUser,
      ...data,
    };

    setCurrentUser(updatedUser);
    safeLocalStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(updatedUser));

    // 1. Update in staffUsers if present
    setStaffUsers(prev => prev.map(u => 
      (u.id === currentUser.id || u.email.toLowerCase() === currentUser.email.toLowerCase())
        ? { ...u, ...data }
        : u
    ));

    // 2. If mentor, sync KYC & bank details into mentors
    const mentorIdToSync = currentUser.mentorId;
    if (mentorIdToSync || currentUser.role === 'mentor') {
      setMentors(prev => prev.map(m => {
        if ((mentorIdToSync && m.id === mentorIdToSync) || m.id === currentUser.id || m.email.toLowerCase() === currentUser.email.toLowerCase()) {
          return {
            ...m,
            ...data,
            isAccountVerified: data.isBankVerified ?? m.isAccountVerified,
            bankVerified: data.isBankVerified ?? m.bankVerified,
          };
        }
        return m;
      }));
    }

    // 3. If student, sync KYC into students
    const studentIdToSync = currentUser.studentId;
    if (studentIdToSync || currentUser.role === 'student') {
      setStudents(prev => prev.map(s => {
        if ((studentIdToSync && s.id === studentIdToSync) || s.id === currentUser.id || s.email.toLowerCase() === currentUser.email.toLowerCase()) {
          return {
            ...s,
            ...data,
          };
        }
        return s;
      }));
    }

    // 4. Persist to backend server so changes survive reloads and sync to production database
    try {
      if (currentUser.role === 'student') {
        const targetId = studentIdToSync || currentUser.id;
        await apiService.updateStudent(targetId, data as any);
      } else if (currentUser.role === 'mentor') {
        const targetId = mentorIdToSync || currentUser.id;
        await apiService.updateMentor(targetId, data as any);
      } else {
        await apiService.updateStaff(currentUser.id, { ...data, email: currentUser.email });
      }
    } catch (err) {
      console.warn('Backend sync for profile update deferred:', err);
    }

    showToast('Profile & KYC Saved', 'Your profile information and settlement bank details have been saved.', 'success');
    logActivity({
      title: 'Profile Updated',
      description: `${currentUser.name} updated personal profile and settlement bank details.`,
      type: 'system',
      user: currentUser.name,
    });

    return true;
  };

  const hasModulePermission = (moduleName: string): boolean => {
    if (!currentUser) return false;
    if (currentUser.role === 'super_admin') return true;

    // 1. Look in customRoles
    let matchedRole = customRoles.find(r => r.id === currentUser.role);
    // 2. Fallback to defaultRoleDefinitions
    if (!matchedRole) {
      matchedRole = defaultRoleDefinitions.find(r => r.id === currentUser.role);
    }
    // 3. Fallback for custom role instances that map to standard roles
    if (!matchedRole && currentUser.role.includes('program_officer')) {
      matchedRole = defaultRoleDefinitions.find(r => r.id === 'program_officer');
    }

    if (matchedRole?.allowedModules) {
      return matchedRole.allowedModules.includes(moduleName);
    }
    return false;
  };

  const hasPermission = (requiredRole: UserRole | UserRole[], moduleName?: keyof EnabledModules | string): boolean => {
    if (!currentUser) return false;
    if (currentUser.role === 'super_admin') return true;

    const rolesArray = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    
    // 1. Direct role match
    if (rolesArray.includes(currentUser.role)) return true;

    // 2. Custom role pattern matching (e.g. role_program_officer_4739 matches program_officer)
    if (rolesArray.some(role => currentUser.role.includes(role))) return true;

    // 3. Module permission match (if module is allowed for role, grant access)
    if (moduleName && hasModulePermission(moduleName)) {
      return true;
    }

    return false;
  };

  const toggleRoleModule = async (roleId: string, moduleName: string) => {
    const role = customRoles.find(r => r.id === roleId);
    if (!role) return;
    const currentModules = role.allowedModules || [];
    const isCurrentlyGranted = currentModules.includes(moduleName);
    const updatedModules = isCurrentlyGranted
      ? currentModules.filter(m => m !== moduleName)
      : [...currentModules, moduleName];

    setCustomRoles(prev => prev.map(r => r.id === roleId ? { ...r, allowedModules: updatedModules } : r));
    await apiService.updateRole(roleId, { ...role, allowedModules: updatedModules });
    showToast(
      'Role Updated', 
      `${isCurrentlyGranted ? 'Revoked' : 'Granted'} "${moduleName}" access for ${role.name}.`, 
      'info'
    );
    logActivity({
      title: 'Module Permission Changed',
      description: `Super Admin ${isCurrentlyGranted ? 'revoked' : 'granted'} module "${moduleName}" for role "${role.name}".`,
      type: 'system',
      user: currentUser?.name || 'Super Admin',
    });
  };

  const hasFeaturePermission = (permission: keyof RoleCapabilities): boolean => {
    if (!currentUser) return false;
    if (currentUser.role === 'super_admin') return true;

    // Direct check for Admissions having permission to add courses (per user requirement)
    if (permission === 'canAddCourses' && currentUser.role === 'admissions') return true;

    // Direct check for official Approver designation and Finance controller
    if (permission === 'canApproveExpenses' && (currentUser.role === 'approver' || currentUser.isApprover === true || currentUser.role === 'finance')) return true;

    const matchedRole = customRoles.find(r => r.id === currentUser.role);
    if (matchedRole && matchedRole.permissions) {
      return Boolean(matchedRole.permissions[permission]);
    }

    return false;
  };

  const createCustomRole = async (roleData: Omit<CustomRoleDefinition, 'id'> | CustomRoleDefinition) => {
    const id = ('id' in roleData && roleData.id) ? roleData.id : `role_${roleData.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now().toString().slice(-4)}`;
    const fullRole: CustomRoleDefinition = {
      ...roleData,
      id,
      isSystem: false,
    };
    setCustomRoles(prev => [...prev.filter(r => r.id !== id), fullRole]);
    await apiService.saveRole(fullRole);
    showToast('Role Created', `Custom role "${fullRole.name}" successfully configured.`, 'success');
    logActivity({
      title: 'Custom Role Created',
      description: `Role "${fullRole.name}" created with custom module permissions.`,
      type: 'system',
      user: currentUser?.name || 'Super Admin',
    });
  };

  const updateRolePermissions = async (roleId: string, updates: Partial<CustomRoleDefinition>) => {
    setCustomRoles(prev => prev.map(r => r.id === roleId ? { ...r, ...updates } : r));
    const targetRole = customRoles.find(r => r.id === roleId);
    if (targetRole) {
      await apiService.updateRole(roleId, { ...targetRole, ...updates });
    } else {
      await apiService.updateRole(roleId, updates);
    }
    showToast('Permissions Updated', `Permissions for role updated successfully.`, 'info');
    logActivity({
      title: 'Role Permissions Modified',
      description: `Capabilities for role "${roleId}" updated by Super Admin.`,
      type: 'system',
      user: currentUser?.name || 'Super Admin',
    });
  };

  const deleteCustomRole = async (roleId: string): Promise<boolean> => {
    const targetRole = customRoles.find(r => r.id === roleId);
    if (!targetRole) return false;
    if (targetRole.isSystem) {
      showToast('System Role Protected', 'Core institutional roles cannot be deleted.', 'error');
      return false;
    }

    setCustomRoles(prev => prev.filter(r => r.id !== roleId));
    // Reassign any staff members holding the deleted custom role to program_officer
    setStaffUsers(prev => prev.map(u => {
      if (u.role === roleId) {
        const fallbackRole: UserRole = 'program_officer';
        const fallbackTitle = resolveRoleTitle(fallbackRole, customRoles);
        apiService.updateStaff(u.id, { role: fallbackRole, roleTitle: fallbackTitle });
        return { ...u, role: fallbackRole, roleTitle: fallbackTitle };
      }
      return u;
    }));

    await apiService.deleteRole(roleId);
    showToast('Role Deleted', `Custom role "${targetRole.name}" has been removed.`, 'info');
    logActivity({
      title: 'Custom Role Deleted',
      description: `Custom role "${targetRole.name}" (${roleId}) deleted by Super Admin.`,
      type: 'system',
      user: currentUser?.name || 'Super Admin',
    });
    return true;
  };

  // Support Tickets & Helpdesk Actions
  const createTicket = async (ticketData: Omit<SupportTicket, 'id' | 'ticketNumber' | 'createdAt' | 'updatedAt' | 'comments'>) => {
    const ticketCount = tickets.length + 1;
    const nowIso = new Date().toISOString();
    const newTicket: SupportTicket = {
      ...ticketData,
      id: `tkt-${Date.now()}`,
      ticketNumber: `TKT-${1000 + ticketCount}`,
      assignedToRole: ticketData.assignedToRole || 'super_admin',
      responseState: 'awaiting_staff_reply',
      unreadByStaff: true,
      unreadByCreator: false,
      createdAt: nowIso,
      updatedAt: nowIso,
      comments: [],
    };

    setTickets(prev => [newTicket, ...prev]);
    await apiService.createTicket(newTicket);
    showToast('Ticket Submitted', `Ticket #${newTicket.ticketNumber} logged. Support has been alerted.`, 'success');
    addNotification({
      title: `🎫 Ticket #${newTicket.ticketNumber} Logged`,
      message: `${newTicket.createdBy.name} (${newTicket.createdBy.roleTitle}): "${newTicket.title}"`,
      type: 'ticket',
      link: `/tickets?ticketId=${newTicket.id}`,
    });
    logActivity({
      title: 'Support Ticket Logged',
      description: `Ticket #${newTicket.ticketNumber}: "${newTicket.title}" raised by ${newTicket.createdBy.name}.`,
      type: 'system',
      user: newTicket.createdBy.name,
    });
  };

  const updateTicketStatus = async (ticketId: string, status: TicketStatus, resolutionNotes?: string) => {
    const nextResponseState = (status === 'resolved' || status === 'closed')
      ? 'resolved'
      : status === 'in_progress'
      ? 'awaiting_user_reply'
      : 'awaiting_staff_reply';

    setTickets(prev => prev.map(t => {
      if (t.id === ticketId || t.ticketNumber === ticketId) {
        return {
          ...t,
          status,
          responseState: nextResponseState,
          unreadByStaff: (status === 'resolved' || status === 'closed' || status === 'in_progress') ? false : t.unreadByStaff,
          resolutionNotes: resolutionNotes || t.resolutionNotes,
          updatedAt: new Date().toISOString(),
        };
      }
      return t;
    }));

    await apiService.updateTicket(ticketId, {
      status,
      responseState: nextResponseState,
      unreadByStaff: (status === 'resolved' || status === 'closed' || status === 'in_progress') ? false : undefined,
      resolutionNotes
    });
    showToast('Ticket Updated', `Ticket status set to ${status.toUpperCase().replace('_', ' ')}.`, 'info');
  };

  const assignTicket = async (ticketId: string, assignedToRole: string, assignedToName?: string, assignedToEmail?: string) => {
    setTickets(prev => prev.map(t => {
      if (t.id === ticketId || t.ticketNumber === ticketId) {
        return {
          ...t,
          assignedToRole,
          assignedToName: assignedToName || t.assignedToName,
          assignedToEmail: assignedToEmail || t.assignedToEmail,
          updatedAt: new Date().toISOString(),
        };
      }
      return t;
    }));

    await apiService.updateTicket(ticketId, { assignedToRole, assignedToName, assignedToEmail });
    showToast('Ticket Reassigned', `Ticket assigned to ${assignedToName || assignedToRole.toUpperCase().replace('_', ' ')}.`, 'info');
  };

  const addTicketComment = async (ticketId: string, content: string, attachments?: TicketAttachment[]) => {
    if (!currentUser || (!content.trim() && (!attachments || attachments.length === 0))) return;
    const nowIso = new Date().toISOString();
    const commentData: TicketComment = {
      id: `comm-${Date.now()}`,
      ticketId,
      authorName: currentUser.name,
      authorEmail: currentUser.email,
      authorRole: currentUser.roleTitle,
      content,
      attachments: attachments && attachments.length > 0 ? attachments : undefined,
      createdAt: nowIso,
    };

    const targetTicket = tickets.find(t => t.id === ticketId || t.ticketNumber === ticketId);
    const isFromCreator = Boolean(
      targetTicket && (
        targetTicket.createdBy.email?.toLowerCase() === currentUser.email?.toLowerCase() ||
        targetTicket.createdBy.id === currentUser.id
      )
    );

    setTickets(prev => prev.map(t => {
      if (t.id === ticketId || t.ticketNumber === ticketId) {
        const nextStatus: TicketStatus = isFromCreator
          ? ((t.status === 'resolved' || t.status === 'closed') ? 'in_progress' : t.status)
          : (t.status === 'open' ? 'in_progress' : t.status);

        return {
          ...t,
          status: nextStatus,
          isArchived: isFromCreator && (t.status === 'resolved' || t.status === 'closed') ? false : t.isArchived,
          responseState: isFromCreator ? 'awaiting_staff_reply' : 'awaiting_user_reply',
          unreadByStaff: isFromCreator ? true : false,
          unreadByCreator: isFromCreator ? false : true,
          lastReplyAt: nowIso,
          lastReplyBy: {
            id: currentUser.id,
            name: currentUser.name,
            email: currentUser.email,
            role: currentUser.roleTitle,
            isCreator: isFromCreator,
          },
          statusRequestedAt: isFromCreator ? undefined : t.statusRequestedAt,
          comments: [...t.comments, commentData],
          updatedAt: nowIso,
        };
      }
      return t;
    }));

    await apiService.addTicketComment(ticketId, commentData);

    if (targetTicket) {
      if (isFromCreator) {
        addNotification({
          title: `🔴 User Replied: Ticket #${targetTicket.ticketNumber}`,
          message: `${currentUser.name} responded on "${targetTicket.title}": "${(content || 'Attached file(s)').slice(0, 90)}"`,
          type: 'ticket',
          link: `/tickets?ticketId=${targetTicket.id}`,
        });
      } else {
        addNotification({
          userId: targetTicket.createdBy.id,
          title: `💬 Support Replied: Ticket #${targetTicket.ticketNumber}`,
          message: `${currentUser.name} replied to "${targetTicket.title}": "${(content || 'Attached file(s)').slice(0, 90)}"`,
          type: 'ticket',
          link: `/tickets?ticketId=${targetTicket.id}`,
        });
      }
    }

    showToast(
      isFromCreator ? 'Response Sent to Support' : 'Support Reply Posted',
      isFromCreator
        ? 'Support has been notified of your response.'
        : 'Ticket creator has been notified of your reply.',
      'success'
    );
  };

  const markTicketRead = async (ticketId: string) => {
    if (!currentUser) return;
    const targetTicket = tickets.find(t => t.id === ticketId || t.ticketNumber === ticketId);
    if (!targetTicket) return;

    const isCreator = targetTicket.createdBy.email?.toLowerCase() === currentUser.email?.toLowerCase() || targetTicket.createdBy.id === currentUser.id;
    const isStaffViewer = currentUser.role === 'super_admin' || (!isCreator && currentUser.role !== 'student');

    const updates: Partial<SupportTicket> & { onlyMarkRead?: boolean } = { onlyMarkRead: true };
    let needsUpdate = false;

    if (isStaffViewer && targetTicket.unreadByStaff) {
      updates.unreadByStaff = false;
      needsUpdate = true;
    }
    if (isCreator && targetTicket.unreadByCreator) {
      updates.unreadByCreator = false;
      needsUpdate = true;
    }

    if (!needsUpdate) return;

    setTickets(prev => prev.map(t => {
      if (t.id === ticketId || t.ticketNumber === ticketId) {
        return {
          ...t,
          unreadByStaff: updates.unreadByStaff !== undefined ? updates.unreadByStaff : t.unreadByStaff,
          unreadByCreator: updates.unreadByCreator !== undefined ? updates.unreadByCreator : t.unreadByCreator,
        };
      }
      return t;
    }));

    await apiService.updateTicket(ticketId, updates);
  };

  const markTicketDone = async (ticketId: string, resolutionNotes?: string) => {
    const resolvedAt = new Date().toISOString();
    const resolvedBy = currentUser ? { id: currentUser.id, name: currentUser.name, role: currentUser.roleTitle } : undefined;

    setTickets(prev => prev.map(t => {
      if (t.id === ticketId || t.ticketNumber === ticketId) {
        return {
          ...t,
          status: 'resolved' as TicketStatus,
          responseState: 'resolved',
          unreadByStaff: false,
          isArchived: true,
          resolvedAt,
          resolvedBy,
          resolutionNotes: resolutionNotes || t.resolutionNotes,
          updatedAt: resolvedAt,
        };
      }
      return t;
    }));

    await apiService.updateTicket(ticketId, {
      status: 'resolved',
      responseState: 'resolved',
      unreadByStaff: false,
      isArchived: true,
      resolvedAt,
      resolvedBy,
      resolutionNotes
    });
    showToast('Ticket Resolved & Archived', 'Ticket marked as done and moved to Archive to declutter your active view.', 'success');
  };

  const requestTicketStatus = async (ticketId: string, note?: string) => {
    const statusRequestedAt = new Date().toISOString();
    const statusRequestedBy = currentUser ? { id: currentUser.id, name: currentUser.name, role: currentUser.roleTitle } : undefined;

    setTickets(prev => prev.map(t => {
      if (t.id === ticketId || t.ticketNumber === ticketId) {
        return {
          ...t,
          statusRequestedAt,
          statusRequestedBy,
          statusRequestNote: note,
          updatedAt: statusRequestedAt,
        };
      }
      return t;
    }));

    await apiService.updateTicket(ticketId, {
      statusRequestedAt,
      statusRequestedBy,
      statusRequestNote: note
    });
    showToast('Status Confirmation Requested', 'Sent verification request to the ticket creator.', 'info');
  };

  const toggleTicketArchive = async (ticketId: string, isArchived: boolean) => {
    const now = new Date().toISOString();
    setTickets(prev => prev.map(t => {
      if (t.id === ticketId || t.ticketNumber === ticketId) {
        return {
          ...t,
          isArchived,
          status: isArchived ? t.status : (t.status === 'resolved' ? 'open' : t.status),
          updatedAt: now,
        };
      }
      return t;
    }));

    await apiService.updateTicket(ticketId, {
      isArchived,
      status: isArchived ? undefined : 'open'
    });
    showToast(isArchived ? 'Ticket Archived' : 'Ticket Reopened', isArchived ? 'Moved to archived view.' : 'Restored to Active Tickets queue.', 'info');
  };

  const addStaffUser = (userData: Omit<AuthUser, 'id'>) => {
    const cleanEmail = userData.email?.toLowerCase().trim();
    if (cleanEmail && staffUsers.some(u => u.email?.toLowerCase().trim() === cleanEmail)) {
      showToast('Account Exists', `A staff member with email "${userData.email}" already exists.`, 'error');
      return;
    }

    const resolvedTitle = userData.roleTitle || resolveRoleTitle(userData.role, customRoles);
    const newUser: AuthUser = {
      ...userData,
      id: `user-${Date.now()}`,
      roleTitle: resolvedTitle,
      password: userData.password || 'password123',
    };
    setStaffUsers(prev => [newUser, ...prev]);
    apiService.createStaff(newUser).then(res => {
      if (res && (res as any).id && (res as any).id !== newUser.id) {
        setStaffUsers(prev => prev.map(u => u.id === newUser.id ? { ...u, id: (res as any).id } : u));
      }
    }).catch(err => {
      console.warn('Backend createStaff error:', err);
    });
    showToast('Staff Provisioned', `${newUser.name} added as ${resolvedTitle}.`, 'success');
    addNotification({
      title: 'New Staff Provisioned',
      message: `${newUser.name} provisioned as ${resolvedTitle} in ${newUser.department}.`,
      type: 'system',
      link: '/settings',
    });
    logActivity({
      title: 'Staff Member Provisioned',
      description: `${newUser.name} created as ${resolvedTitle}.`,
      type: 'system',
      user: currentUser?.name || 'Super Admin',
    });
  };

  const updateUserRole = (userId: string, role: UserRole, mentorId?: string) => {
    const newTitle = resolveRoleTitle(role, customRoles);
    const existingStaff = staffUsers.find(u => u.id === userId || u.mentorId === userId);
    const existingMentor = mentors.find(m => m.id === userId || (existingStaff?.email && m.email?.toLowerCase() === existingStaff.email.toLowerCase()));

    if (existingStaff) {
      setStaffUsers(prev => prev.map(u => {
        if (u.id === existingStaff.id || u.id === userId) {
          return {
            ...u,
            role,
            roleTitle: newTitle,
            mentorId: role === 'mentor' ? (mentorId || u.mentorId || existingMentor?.id || 'men-1') : u.mentorId,
          };
        }
        return u;
      }));
    } else if (existingMentor) {
      // Mentor promoted/assigned a role: ensure they are also added to staffUsers so they appear in staff directory & permissions
      const promotedStaff: AuthUser = {
        ...(existingMentor as any),
        id: existingMentor.id,
        name: existingMentor.name,
        email: existingMentor.email,
        role,
        roleTitle: newTitle,
        mentorId: existingMentor.id,
        department: existingMentor.department || 'Academic Faculty',
        isActive: existingMentor.isActive !== false && existingMentor.status !== 'Deactivated',
        status: existingMentor.status === 'Deactivated' ? 'Deactivated' : 'Active',
      };
      setStaffUsers(prev => [promotedStaff, ...prev]);
    }

    if (existingMentor) {
      setMentors(prev => prev.map(m => {
        if (m.id === existingMentor.id) {
          return {
            ...m,
            systemRole: role,
          } as any;
        }
        return m;
      }));
    }

    if (currentUser?.id === userId) {
      setCurrentUser(prev => prev ? {
        ...prev,
        role,
        roleTitle: newTitle,
        mentorId: role === 'mentor' ? (mentorId || prev.mentorId || existingMentor?.id || 'men-1') : prev.mentorId,
      } : null);
    }

    apiService.updateStaff(userId, {
      role,
      roleTitle: newTitle,
      mentorId: role === 'mentor' ? (mentorId || existingStaff?.mentorId || existingMentor?.id) : existingStaff?.mentorId,
      email: existingStaff?.email || existingMentor?.email,
    });
    showToast('Role Assigned', `${existingStaff?.name || existingMentor?.name || 'User'} assigned to ${newTitle}.`, 'success');
    logActivity({
      title: 'User Role Assigned',
      description: `${existingStaff?.name || existingMentor?.name || userId} role updated to ${newTitle}.`,
      type: 'system',
      user: currentUser?.name || 'Super Admin',
    });
  };

  const toggleUserApproverStatus = (userId: string, isApprover?: boolean) => {
    const target = staffUsers.find(u => u.id === userId);
    if (!target) return;

    const currentlyApprover = Boolean(target.isApprover || target.role === 'approver');
    const nextVal = isApprover !== undefined ? isApprover : !currentlyApprover;

    // If revoking approver authority and user's role is 'approver', revert role to 'program_officer'
    const shouldRevertRole = !nextVal && target.role === 'approver';
    const nextRole: UserRole = shouldRevertRole ? 'program_officer' : target.role;
    const nextRoleTitle = shouldRevertRole ? 'Program Officer' : (target.roleTitle || resolveRoleTitle(nextRole));

    setStaffUsers(prev => prev.map(u => {
      if (u.id === userId) {
        return {
          ...u,
          isApprover: nextVal,
          role: nextRole,
          roleTitle: nextRoleTitle,
        };
      }
      return u;
    }));

    if (currentUser?.id === userId) {
      setCurrentUser(prev => prev ? {
        ...prev,
        isApprover: nextVal,
        role: nextRole,
        roleTitle: nextRoleTitle,
      } : null);
    }

    apiService.updateStaff(userId, { 
      isApprover: nextVal,
      ...(shouldRevertRole ? { role: nextRole, roleTitle: nextRoleTitle } : {})
    });

    showToast(
      'Approver Authority Updated', 
      `${target.name} ${nextVal ? 'granted' : 'relieved of'} official approver authority.`, 
      'success'
    );
    logActivity({
      title: 'Approver Authority Updated',
      description: `${target.name} was ${nextVal ? 'designated as' : 'removed as'} an official Institutional Approver.`,
      type: 'system',
      user: currentUser?.name || 'Super Admin',
    });
  };

  const activeMentors = useMemo(() => {
    return mentors.filter(m => m.isActive !== false && m.status !== 'Deactivated');
  }, [mentors]);

  const activeStaffUsers = useMemo(() => {
    return staffUsers.filter(u => u.isActive !== false && u.status !== 'Deactivated');
  }, [staffUsers]);

  const getUserTaskFootprint = (userId: string, userName?: string, userEmail?: string) => {
    const normName = (userName || '').trim().toLowerCase();
    const normEmail = (userEmail || '').trim().toLowerCase();

    const assignedStudents = students.filter(s => 
      s.mentorId === userId || 
      (normName && (s.mentorName || '').trim().toLowerCase() === normName)
    );

    const assignedCohorts = cohorts.filter(c => 
      c.instructorId === userId || 
      (normName && (c.instructorName || '').trim().toLowerCase() === normName)
    );

    const assignedTimetables = (timetables || []).filter(t => 
      t.status !== 'Completed' && (
        t.mentorId === userId || 
        (normName && (t.mentorName || '').trim().toLowerCase() === normName)
      )
    );

    const assignedTickets = (tickets || []).filter(t => 
      t.status !== 'resolved' && t.status !== 'closed' && (
        t.assignedTo === userId || 
        (normEmail && (t.assignedToEmail || '').trim().toLowerCase() === normEmail)
      )
    );

    const assignedLeads = (leads || []).filter(l => 
      l.status !== 'Converted' && l.status !== 'Lost' && (
        (normName && (l.assignedRep || '').trim().toLowerCase() === normName) ||
        (normEmail && (l.assignedRep || '').trim().toLowerCase() === normEmail)
      )
    );

    const assignedCourses = (courses || []).filter(c =>
      normName && (c.leadInstructor || '').trim().toLowerCase() === normName
    );

    const totalTasks = 
      assignedStudents.length + 
      assignedCohorts.length + 
      assignedTimetables.length + 
      assignedTickets.length + 
      assignedLeads.length + 
      assignedCourses.length;

    return {
      totalTasks,
      studentsCount: assignedStudents.length,
      cohortsCount: assignedCohorts.length,
      timetablesCount: assignedTimetables.length,
      ticketsCount: assignedTickets.length,
      leadsCount: assignedLeads.length,
      coursesCount: assignedCourses.length,
      assignedStudents,
      assignedCohorts,
      assignedTimetables,
      assignedTickets,
      assignedLeads,
      assignedCourses,
    };
  };

  const deleteStaffUser = async (id: string): Promise<boolean> => {
    const target = staffUsers.find(u => u.id === id);
    if (!target) return false;
    if (target.role === 'super_admin' && (target.id === 'user-admin' || target.email === 'admin@codelab.institute' || staffUsers.filter(u => u.role === 'super_admin').length <= 1)) {
      showToast('Action Blocked', 'The primary Super Admin institutional account cannot be deleted.', 'error');
      return false;
    }

    const footprint = getUserTaskFootprint(target.id, target.name, target.email);
    if (footprint.totalTasks > 0) {
      showToast('Action Blocked', `Cannot delete ${target.name} because they have ${footprint.totalTasks} active assignment(s). Please transfer tasks first.`, 'warning');
      return false;
    }

    try {
      await apiService.deleteStaff(id);
      setStaffUsers(prev => prev.filter(u => u.id !== id));
      showToast('Staff Deleted', `${target.name} has been removed from staff directory.`, 'success');
      logActivity({
        title: 'Staff Member Removed',
        description: `Staff profile for ${target.name} (${target.email}) was removed.`,
        type: 'system',
        user: currentUser?.name || 'Super Admin',
      });
      return true;
    } catch (err: any) {
      showToast('Delete Failed', err.message || 'Unable to delete staff member.', 'error');
      return false;
    }
  };

  const deleteMentorUser = async (id: string): Promise<boolean> => {
    const target = mentors.find(m => m.id === id || m.mentorCode === id);
    if (!target) return false;

    const footprint = getUserTaskFootprint(target.id, target.name, target.email);
    if (footprint.totalTasks > 0) {
      showToast('Action Blocked', `Cannot delete ${target.name} because they have ${footprint.totalTasks} active assignment(s). Please transfer tasks first.`, 'warning');
      return false;
    }

    try {
      if (isBackendConnected) {
        await apiService.deleteMentor(target.id);
      }
      setMentors(prev => prev.filter(m => m.id !== target.id && m.mentorCode !== target.mentorCode));
      setStaffUsers(prev => prev.filter(u => u.id !== target.id && u.email !== target.email));
      showToast('Faculty Deleted', `Mentor profile for ${target.name} was removed.`, 'success');
      logActivity({
        title: 'Faculty Member Removed',
        description: `Mentor profile for ${target.name} (${target.email}) was removed.`,
        type: 'system',
        user: currentUser?.name || 'Super Admin',
      });
      return true;
    } catch (err: any) {
      showToast('Delete Failed', err.message || 'Unable to delete mentor profile.', 'error');
      return false;
    }
  };

  const transferTasksAndDeleteUser = async (sourceUserId: string, targetUserId: string): Promise<{ success: boolean; message: string }> => {
    const source = staffUsers.find(u => u.id === sourceUserId) || mentors.find(m => m.id === sourceUserId || m.mentorCode === sourceUserId);
    const target = staffUsers.find(u => u.id === targetUserId) || mentors.find(m => m.id === targetUserId || m.mentorCode === targetUserId);

    if (!source || !target) {
      const msg = 'Invalid source or replacement user specified.';
      showToast('Transfer Failed', msg, 'error');
      return { success: false, message: msg };
    }

    try {
      if (isBackendConnected) {
        const res = await apiService.transferTasksAndDeleteUser(sourceUserId, targetUserId);
        if (!res.success) {
          throw new Error(res.message || 'Transfer failed on server');
        }
      }

      const sourceNameNorm = (source.name || '').trim().toLowerCase();
      const sourceEmailNorm = (source.email || '').trim().toLowerCase();

      // Client-side state sync
      // Reassign students
      setStudents(prev => prev.map(s => {
        const matchId = s.mentorId === source.id;
        const matchName = sourceNameNorm && (s.mentorName || '').trim().toLowerCase() === sourceNameNorm;
        if (matchId || matchName) {
          return { ...s, mentorId: target.id, mentorName: target.name };
        }
        return s;
      }));

      // Reassign cohorts
      setCohorts(prev => prev.map(c => {
        const matchId = c.instructorId === source.id;
        const matchName = sourceNameNorm && (c.instructorName || '').trim().toLowerCase() === sourceNameNorm;
        if (matchId || matchName) {
          return { ...c, instructorId: target.id, instructorName: target.name };
        }
        return c;
      }));

      // Reassign timetables
      setTimetables(prev => prev.map(t => {
        if (t.status !== 'Completed') {
          const matchId = t.mentorId === source.id;
          const matchName = sourceNameNorm && (t.mentorName || '').trim().toLowerCase() === sourceNameNorm;
          if (matchId || matchName) {
            return { ...t, mentorId: target.id, mentorName: target.name };
          }
        }
        return t;
      }));

      // Reassign tickets
      setTickets(prev => prev.map(t => {
        if (t.status !== 'resolved' && t.status !== 'closed') {
          const matchId = t.assignedTo === source.id;
          const matchEmail = sourceEmailNorm && (t.assignedToEmail || '').trim().toLowerCase() === sourceEmailNorm;
          if (matchId || matchEmail) {
            return { ...t, assignedTo: target.id, assignedToName: target.name, assignedToEmail: target.email };
          }
        }
        return t;
      }));

      // Reassign leads
      setLeads(prev => prev.map(l => {
        if (l.status !== 'Converted' && l.status !== 'Lost') {
          const matchName = sourceNameNorm && (l.assignedRep || '').trim().toLowerCase() === sourceNameNorm;
          const matchEmail = sourceEmailNorm && (l.assignedRep || '').trim().toLowerCase() === sourceEmailNorm;
          if (matchName || matchEmail) {
            return { ...l, assignedRep: target.name };
          }
        }
        return l;
      }));

      // Reassign courses
      setCourses(prev => prev.map(c => {
        const matchName = sourceNameNorm && (c.leadInstructor || '').trim().toLowerCase() === sourceNameNorm;
        if (matchName) {
          return { ...c, leadInstructor: target.name };
        }
        return c;
      }));

      // Reassign sessions
      setSessions(prev => prev.map(sess => {
        const matchId = sess.mentorId === source.id;
        const matchName = sourceNameNorm && (sess.mentorName || '').trim().toLowerCase() === sourceNameNorm;
        if (matchId || matchName) {
          return { ...sess, mentorId: target.id, mentorName: target.name };
        }
        return sess;
      }));

      // Remove source user
      setStaffUsers(prev => prev.filter(u => u.id !== source.id));
      setMentors(prev => prev.filter(m => m.id !== source.id && m.mentorCode !== (source as any).mentorCode));

      const successMsg = `Successfully transferred all responsibilities from ${source.name} to ${target.name} and removed ${source.name}.`;
      showToast('Responsibilities Transferred', successMsg, 'success');

      logActivity({
        title: 'Account Responsibilities Transferred & User Deleted',
        description: successMsg,
        type: 'system',
        user: currentUser?.name || 'Super Admin',
      });

      return { success: true, message: successMsg };
    } catch (err: any) {
      const errText = err.message || 'Failed to transfer responsibilities and delete account.';
      showToast('Transfer Failed', errText, 'error');
      return { success: false, message: errText };
    }
  };

  const editStaffUser = async (id: string, updates: Partial<AuthUser>): Promise<boolean> => {
    if (updates.email) {
      const clean = updates.email.toLowerCase().trim();
      const conflict = staffUsers.some(u => u.id !== id && u.email?.toLowerCase().trim() === clean);
      if (conflict) {
        showToast('Email Conflict', 'Another staff account is already registered with this email address.', 'error');
        return false;
      }
    }

    const resolvedUpdates: Partial<AuthUser> = { ...updates };
    if (updates.role) {
      resolvedUpdates.roleTitle = resolveRoleTitle(updates.role, customRoles);
    }

    try {
      await apiService.updateStaff(id, resolvedUpdates);
      setStaffUsers(prev => prev.map(u => u.id === id ? { ...u, ...resolvedUpdates } : u));
      if (currentUser?.id === id) {
        const updatedCurrent = { ...currentUser, ...resolvedUpdates };
        setCurrentUser(updatedCurrent);
        safeLocalStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(updatedCurrent));
      }
      showToast('Staff Updated', 'Staff profile details updated successfully.', 'success');
      logActivity({
        title: 'Staff Profile Updated',
        description: `Updated profile details for staff member ${id}.`,
        type: 'system',
        user: currentUser?.name || 'Super Admin',
      });
      return true;
    } catch (err: any) {
      showToast('Update Failed', err.message || 'Failed to update staff member.', 'error');
      return false;
    }
  };

  const reviewUserKYC = async (
    userId: string,
    category: 'staff' | 'mentor' | 'student',
    status: 'Verified' | 'Pending Review' | 'Incomplete',
    notes?: string
  ): Promise<boolean> => {
    try {
      const reviewerName = currentUser?.name || 'Super Admin';
      const approvedAt = new Date().toISOString();
      await apiService.reviewKYC(userId, {
        status,
        notes,
        approvedBy: reviewerName,
        kycTier: status === 'Verified' ? 'Tier 3' : undefined,
      });

      // Update in-memory collections
      if (category === 'staff') {
        setStaffUsers(prev => prev.map(u => (u.id === userId || u.email?.toLowerCase() === userId.toLowerCase()) ? {
          ...u,
          kycStatus: status,
          isBankVerified: status === 'Verified' ? true : u.isBankVerified,
          kycTier: status === 'Verified' ? 'Tier 3' : u.kycTier,
          kycApprovedBy: status === 'Verified' ? reviewerName : undefined,
          kycApprovedAt: status === 'Verified' ? approvedAt : undefined,
          kycRejectionReason: status === 'Incomplete' ? notes : undefined,
        } : u));
      } else if (category === 'mentor') {
        setMentors(prev => prev.map(m => (m.id === userId || m.email?.toLowerCase() === userId.toLowerCase()) ? {
          ...m,
          kycStatus: status,
          isAccountVerified: status === 'Verified' ? true : m.isAccountVerified,
          bankVerified: status === 'Verified' ? true : m.bankVerified,
          kycTier: status === 'Verified' ? 'Tier 3' : m.kycTier,
          kycApprovedBy: status === 'Verified' ? reviewerName : undefined,
          kycApprovedAt: status === 'Verified' ? approvedAt : undefined,
          kycRejectionReason: status === 'Incomplete' ? notes : undefined,
        } : m));
      } else if (category === 'student') {
        setStudents(prev => prev.map(s => (s.id === userId || s.email?.toLowerCase() === userId.toLowerCase()) ? {
          ...s,
          kycStatus: status,
          isBankVerified: status === 'Verified' ? true : s.isBankVerified,
          kycTier: status === 'Verified' ? 'Tier 3' : s.kycTier,
          kycApprovedBy: status === 'Verified' ? reviewerName : undefined,
          kycApprovedAt: status === 'Verified' ? approvedAt : undefined,
          kycRejectionReason: status === 'Incomplete' ? notes : undefined,
        } : s));
      }

      if (currentUser?.id === userId) {
        const updatedCurrent: AuthUser = {
          ...currentUser,
          kycStatus: status,
          isBankVerified: status === 'Verified' ? true : currentUser.isBankVerified,
          kycTier: status === 'Verified' ? 'Tier 3' : currentUser.kycTier,
          kycApprovedBy: status === 'Verified' ? reviewerName : undefined,
          kycApprovedAt: status === 'Verified' ? approvedAt : undefined,
          kycRejectionReason: status === 'Incomplete' ? notes : undefined,
        };
        setCurrentUser(updatedCurrent);
        safeLocalStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(updatedCurrent));
      }

      setSelectedBiodataUser(prev => {
        if (!prev || !prev.data) return prev;
        if (prev.id === userId || prev.data.id === userId) {
          return {
            ...prev,
            data: {
              ...prev.data,
              kycStatus: status,
              isBankVerified: status === 'Verified' ? true : prev.data.isBankVerified,
              kycTier: status === 'Verified' ? 'Tier 3' : prev.data.kycTier,
              kycApprovedBy: status === 'Verified' ? reviewerName : undefined,
              kycApprovedAt: status === 'Verified' ? approvedAt : undefined,
              kycRejectionReason: status === 'Incomplete' ? notes : undefined,
            }
          };
        }
        return prev;
      });

      const actionText = status === 'Verified' ? 'Approved & Marked Verified' : status === 'Incomplete' ? 'Rejected with Change Request' : 'Set to Pending Review';
      showToast('KYC Compliance Updated', `Dossier for user has been ${actionText}.`, 'success');
      logActivity({
        title: 'KYC Compliance Review',
        description: `${reviewerName} ${actionText} for user ${userId}.`,
        type: 'system',
        user: reviewerName,
      });

      return true;
    } catch (err: any) {
      showToast('Review Failed', err.message || 'Could not update KYC compliance status.', 'error');
      return false;
    }
  };

  const renameCustomRole = async (roleId: string, newName: string, newDescription?: string): Promise<boolean> => {
    if (!newName || !newName.trim()) {
      showToast('Invalid Name', 'Role name cannot be empty.', 'error');
      return false;
    }

    try {
      const payload: Partial<CustomRoleDefinition> = { name: newName.trim() };
      if (newDescription !== undefined) payload.description = newDescription.trim();

      await apiService.updateRole(roleId, payload);

      setCustomRoles(prev => prev.map(r => r.id === roleId ? { ...r, ...payload } : r));
      setStaffUsers(prev => prev.map(u => u.role === roleId ? { ...u, roleTitle: newName.trim() } : u));

      if (currentUser?.role === roleId) {
        const updatedUser = { ...currentUser, roleTitle: newName.trim() };
        setCurrentUser(updatedUser);
        safeLocalStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(updatedUser));
      }

      showToast('Role Renamed', `Role title updated to "${newName.trim()}".`, 'success');
      logActivity({
        title: 'Custom Role Renamed',
        description: `Role ${roleId} was renamed to "${newName.trim()}".`,
        type: 'system',
        user: currentUser?.name || 'Super Admin',
      });
      return true;
    } catch (err: any) {
      showToast('Rename Failed', err.message || 'Failed to rename custom role.', 'error');
      return false;
    }
  };

  // Modal actions
  const openModal = (modal: ModalType) => setActiveModal(modal);
  const closeModal = () => {
    setActiveModal(null);
    if (typeof window !== 'undefined' && window.location.search.includes('action=')) {
      const url = new URL(window.location.href);
      url.searchParams.delete('action');
      window.history.replaceState(window.history.state, '', url.pathname + (url.searchParams.toString() ? `?${url.searchParams.toString()}` : ''));
    }
  };

  const openBiodataModal = (categoryOrTarget: 'staff' | 'mentor' | 'student' | any, id?: string, data?: any) => {
    let resolvedCategory: 'staff' | 'mentor' | 'student' = 'student';
    let resolvedId: string = '';
    let resolvedData: any = null;

    if (typeof categoryOrTarget === 'object' && categoryOrTarget !== null) {
      resolvedData = categoryOrTarget;
      resolvedId = categoryOrTarget.id || categoryOrTarget.studentCode || categoryOrTarget.mentorCode || '';
      resolvedCategory = (categoryOrTarget.category as any) || (categoryOrTarget.role === 'mentor' ? 'mentor' : (categoryOrTarget.role === 'student' ? 'student' : 'staff'));
    } else {
      resolvedCategory = categoryOrTarget;
      resolvedId = id || '';
      resolvedData = data;
    }

    if (!resolvedData) {
      if (resolvedCategory === 'student') {
        resolvedData = students.find(s => s.id === resolvedId || s.studentCode === resolvedId);
      } else if (resolvedCategory === 'mentor') {
        resolvedData = mentors.find(m => m.id === resolvedId || m.mentorCode === resolvedId);
      } else if (resolvedCategory === 'staff') {
        resolvedData = staffUsers.find(u => u.id === resolvedId || u.email?.toLowerCase() === resolvedId.toLowerCase());
      }
    }
    setSelectedBiodataUser({
      category: resolvedCategory,
      id: resolvedId,
      data: resolvedData,
    });
    setActiveModal('view-biodata');
  };

  const logActivity = (activity: Omit<ActivityLogItem, 'id' | 'timestamp'>) => {
    const newLog: ActivityLogItem = {
      ...activity,
      id: `act-${Date.now()}`,
      timestamp: 'Just now',
    };
    setActivityLogs(prev => [newLog, ...prev]);
  };

  // Lead mutations
  const addLead = (newLeadData: Omit<Lead, 'id' | 'dateAdded'>) => {
    const initials = newLeadData.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
    const newLead: Lead = {
      ...newLeadData,
      id: `lead-${Date.now()}`,
      initials,
      dateAdded: new Date().toISOString().split('T')[0],
      lastContactDate: 'Today',
      lastContactChannel: 'via Email',
    };
    setLeads(prev => [newLead, ...prev]);
    apiService.createLead(newLead as any);
    showToast('Lead Added', `${newLead.name} added to pipeline.`, 'success');
    addNotification({
      title: 'New Lead Registered',
      message: `${newLead.name} (${newLead.company}) registered for ${newLead.programInterest}.`,
      type: 'admissions',
      link: '/leads',
    });
    logActivity({
      title: 'New Lead Registered',
      description: `${newLead.name} (${newLead.company}) added to pipeline.`,
      type: 'lead',
      user: newLead.assignedRep,
    });
  };

  const updateLeadStatus = (id: string, status: LeadStatus, lossReason?: string) => {
    const targetLead = leads.find(l => l.id === id);
    setLeads(prev => prev.map(l => {
      if (l.id === id) {
        return { 
          ...l, 
          status,
          notes: lossReason ? `${l.notes ? l.notes + ' | ' : ''}Loss Reason: ${lossReason}` : l.notes,
        };
      }
      return l;
    }));

    apiService.updateLead(id, { 
      status, 
      notes: lossReason ? `${targetLead?.notes ? targetLead.notes + ' | ' : ''}Loss Reason: ${lossReason}` : targetLead?.notes 
    });

    if (targetLead && status !== targetLead.status) {
      showToast('Lead Progressed', `${targetLead.name} moved to ${status}.`, 'info');
    }

    logActivity({
      title: 'Lead Stage Updated',
      description: `Lead status progressed to ${status}.`,
      type: 'lead',
      user: 'Operations',
    });
  };

  const updateLeadNotes = (id: string, notes: string) => {
    setLeads(prev => prev.map(l => l.id === id ? { ...l, notes } : l));
    apiService.updateLead(id, { notes });
    showToast('Notes Saved', 'Discovery notes updated successfully.', 'success');
  };

  const scheduleLeadFollowUp = async (leadId: string, payload: {
    nextFollowUpDate?: string;
    nextFollowUpTime?: string;
    outcome: string;
    notes: string;
    priority?: 'High' | 'Medium' | 'Low';
    preferredChannel?: 'phone' | 'whatsapp' | 'email' | 'in_person';
    newStatus?: LeadStatus;
  }) => {
    const targetLead = leads.find(l => l.id === leadId);
    if (!targetLead) return;

    const repName = currentUser?.name || targetLead.assignedRep || 'Admissions Officer';
    const newActivity: LeadFollowUpActivity = {
      id: `act-${Date.now()}`,
      timestamp: new Date().toISOString(),
      repName,
      outcome: payload.outcome,
      notes: payload.notes,
      nextScheduledDate: payload.nextFollowUpDate,
      nextScheduledTime: payload.nextFollowUpTime,
    };

    const existingHistory = targetLead.followUpHistory || [];
    const updatedHistory = [newActivity, ...existingHistory];

    const updatedLeadFields: Partial<Lead> = {
      nextFollowUpDate: payload.nextFollowUpDate,
      nextFollowUpTime: payload.nextFollowUpTime,
      followUpPriority: payload.priority || targetLead.followUpPriority || 'Medium',
      preferredChannel: payload.preferredChannel || targetLead.preferredChannel || 'phone',
      followUpHistory: updatedHistory,
      lastContactDate: 'Today',
      lastContactChannel: payload.preferredChannel ? `via ${payload.preferredChannel.charAt(0).toUpperCase() + payload.preferredChannel.slice(1)}` : 'via Phone',
      notes: payload.notes ? `${targetLead.notes ? targetLead.notes + '\n' : ''}[${new Date().toLocaleDateString('en-NG')}] ${payload.outcome}: ${payload.notes}` : targetLead.notes,
      ...(payload.newStatus ? { status: payload.newStatus } : {}),
    };

    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, ...updatedLeadFields } : l));
    try {
      await apiService.updateLead(leadId, updatedLeadFields as any);
    } catch (e) {
      console.error('Failed to update lead follow-up on backend:', e);
    }

    showToast('Follow-Up Logged', `Follow-up recorded for ${targetLead.name}.`, 'success');
    logActivity({
      title: 'Lead Follow-up Recorded',
      description: `${payload.outcome} with ${targetLead.name}. Next scheduled: ${payload.nextFollowUpDate || 'None'}.`,
      type: 'lead',
      user: repName,
    });
  };

  const convertLeadToStudent = async (leadId: string, program?: string, mentorName?: string) => {
    const lead = leads.find(l => l.id === leadId);
    if (!lead) return;

    updateLeadStatus(leadId, 'Converted');

    const effectiveProgram = program || lead.programInterest || 'Professional Technology Immersive';
    const matchedCourse = courses.find(c => c.title.toLowerCase() === effectiveProgram.toLowerCase()) || courses[0];
    const matchedCohort = cohorts[0];
    const matchedMentor = mentors.find(m => m.name === mentorName) || mentors[0];
    
    const feeAmount = lead.dealValue || matchedCourse?.tuitionFee || 850000;
    const effectiveMentorName = mentorName || matchedMentor?.name || matchedCourse?.leadInstructor || 'Faculty Mentor Assigned';
    const effectiveCohortName = matchedCohort ? `${matchedCohort.name} (${matchedCohort.cohortCode})` : `Cohort ${new Date().getFullYear()}-Q${Math.floor((new Date().getMonth() + 3) / 3)}`;

    const studentCode = `STU-${Math.floor(1000 + Math.random() * 9000)}`;
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    const defaultPassword = `Edu#${studentCode.replace('STU-', '')}!${randomDigits}`;
    const curriculumUrl = matchedCourse?.curriculumDriveUrl || settings.defaultCurriculumUrl;
    const handbookUrl = settings.studentHandbookUrl;

    const cleanEmailSlug = (lead.name || 'scholar').toLowerCase().replace(/[^a-z0-9]/g, '');
    const effectiveEmail = lead.email?.trim() || `${cleanEmailSlug}${Math.floor(100 + Math.random() * 900)}@student.codelab.institute`;

    const newStudent: Student = {
      id: `stu-${Date.now()}`,
      studentCode,
      defaultPassword,
      password: defaultPassword,
      mustResetPassword: true,
      curriculumDriveUrl: curriculumUrl,
      handbookDriveUrl: handbookUrl,
      name: lead.name,
      email: effectiveEmail,
      phone: lead.phone,
      program: effectiveProgram,
      mentorName: effectiveMentorName,
      status: 'Active',
      attendanceRate: 100,
      tuitionStatus: 'Paid',
      cohort: effectiveCohortName,
      enrolledDate: new Date().toISOString().split('T')[0],
      totalFees: feeAmount,
      outstandingBalance: 0,
      courses: [
        {
          id: `c-${Date.now()}`,
          code: matchedCourse?.code || 'TECH-101',
          name: effectiveProgram,
          semester: `Term ${new Date().getFullYear()}`,
          instructor: effectiveMentorName,
          fee: feeAmount,
          billedDate: new Date().toISOString().split('T')[0],
        }
      ],
      installments: [
        {
          id: `inst-${Date.now()}`,
          description: 'Full Course Tuition Settlement',
          dueDate: new Date().toISOString().split('T')[0],
          amount: feeAmount,
          status: 'Paid',
        }
      ]
    };
    setStudents(prev => [newStudent, ...prev]);

    // Create corresponding invoice
    const newInv: Invoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber: `INV-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`,
      studentId: newStudent.id,
      studentName: newStudent.name,
      studentEmail: newStudent.email,
      programName: newStudent.program,
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      totalAmount: feeAmount,
      paidAmount: feeAmount,
      status: 'Paid',
      items: [{ id: `item-1`, description: `${newStudent.program} Tuition`, amount: feeAmount }],
      paymentReference: `NIBSS-TRX-${Math.floor(1000000 + Math.random() * 9000000)}`,
      nibssBankName: settings.defaultNIBSSBank?.bankName || 'Access Bank Nigeria PLC',
    };
    setInvoices(prev => [newInv, ...prev]);

    apiService.convertLead(leadId, effectiveProgram, effectiveMentorName);

    // Dispatch automated student onboarding welcome email via Zoho SMTP
    if (lead.email) {
      emailService.sendEmail({
        to: lead.email,
        recipientName: lead.name,
        subject: `🎓 Welcome to CODELAB EDUCARE LTD — Admission Confirmation (${newStudent.studentCode})`,
        type: 'student_welcome',
        data: {
          studentCode: newStudent.studentCode,
          program: newStudent.program,
          cohort: newStudent.cohort || 'Executive Cohort',
          mentorName: newStudent.mentorName,
          paidAmount: feeAmount,
          balance: 0,
          defaultPassword: newStudent.defaultPassword,
          mustResetPassword: true,
          curriculumDriveUrl: newStudent.curriculumDriveUrl,
          handbookDriveUrl: newStudent.handbookDriveUrl,
          portalUrl: `${APP_BASE_URL}/login?role=student&email=${encodeURIComponent(lead.email || '')}`,
        }
      }).catch(err => console.error('Error sending student welcome email:', err));
    }

    showToast(
      '🎉 Student Admitted & Welcome Email Sent!',
      `${lead.name} admitted to ${newStudent.program}. Welcome onboarding email sent to ${lead.email}.`,
      'success'
    );

    addNotification({
      title: 'Lead Converted & Welcome Email Sent',
      message: `${lead.name} enrolled in ${newStudent.program}. Welcome email dispatched to ${lead.email}.`,
      type: 'admissions',
      link: '/students',
    });

    logActivity({
      title: 'Lead Converted to Student',
      description: `${lead.name} officially enrolled in ${newStudent.program} and sent onboarding pack.`,
      type: 'student',
      user: 'Admissions Office',
    });
  };

  // Student mutations
  const enrollStudent = (studentData: Omit<Student, 'id' | 'enrolledDate' | 'studentCode'>) => {
    const studentCode = `STU-${Math.floor(1000 + Math.random() * 9000)}`;
    const randomChars = Math.random().toString(36).substring(2, 6).toUpperCase();
    const defaultPassword = studentData.password || `Edu#${studentCode.replace(/\D/g, '')}!${randomChars}`;

    const matchedCourse = courses.find(c => c.title?.toLowerCase() === studentData.program?.toLowerCase() || (c as any).name?.toLowerCase() === studentData.program?.toLowerCase());
    const curriculumUrl = studentData.curriculumDriveUrl || matchedCourse?.curriculumDriveUrl || settings.defaultCurriculumUrl;
    const handbookUrl = studentData.handbookDriveUrl || settings.studentHandbookUrl;

    const cleanEmail = studentData.email ? studentData.email.trim().toLowerCase() : '';
    const existingStudent = cleanEmail ? students.find(s => s.email?.trim().toLowerCase() === cleanEmail) : null;

    // Multi-Program support: if scholar is already enrolled in another cohort/course, append new course to existing profile
    if (existingStudent) {
      const feeAmount = studentData.totalFees || studentData.tuitionAmount || 850000;
      const paidAmount = feeAmount - (studentData.outstandingBalance ?? 0);
      const invoiceStatus: 'Paid' | 'Partial' | 'Overdue' = (studentData.outstandingBalance ?? 0) === 0 ? 'Paid' : (paidAmount > 0 ? 'Partial' : 'Overdue');

      const newCourseEntry: EnrolledCourse = {
        id: `c-${Date.now()}`,
        code: matchedCourse?.code || 'TECH-101',
        name: studentData.program,
        semester: `Term ${new Date().getFullYear()}`,
        instructor: studentData.mentorName || 'Faculty Mentor Assigned',
        fee: feeAmount,
        billedDate: new Date().toISOString().split('T')[0],
        cohort: studentData.cohort || existingStudent.cohort,
        mentorName: studentData.mentorName,
        status: 'Active',
        totalFees: feeAmount,
        paidAmount: paidAmount,
        outstandingBalance: studentData.outstandingBalance || 0,
        tuitionStatus: invoiceStatus,
      };

      const updatedCourses = [...(existingStudent.courses || []), newCourseEntry];
      const updatedInstallments = [...(existingStudent.installments || []), ...(studentData.installments || [])];
      const updatedTotalFees = (Number(existingStudent.totalFees) || 0) + feeAmount;
      const updatedOutstanding = (Number(existingStudent.outstandingBalance) || 0) + (studentData.outstandingBalance ?? 0);
      const updatedPaid = updatedTotalFees - updatedOutstanding;

      const updatedStudent: Student = {
        ...existingStudent,
        courses: updatedCourses,
        installments: updatedInstallments,
        totalFees: updatedTotalFees,
        outstandingBalance: updatedOutstanding,
        paidAmount: updatedPaid,
        tuitionStatus: updatedOutstanding === 0 ? 'Paid' : (updatedPaid > 0 ? 'Partial' : 'Overdue'),
      };

      setStudents(prev => prev.map(s => s.id === existingStudent.id ? updatedStudent : s));

      const newInv: Invoice = {
        id: `inv-${Date.now()}`,
        invoiceNumber: `INV-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`,
        studentId: existingStudent.id,
        studentName: existingStudent.name,
        studentEmail: existingStudent.email,
        programName: studentData.program,
        issueDate: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
        totalAmount: feeAmount,
        paidAmount: paidAmount,
        status: invoiceStatus,
        items: [{ id: `item-1`, description: `${studentData.program} Tuition Enrollment`, amount: feeAmount }],
        paymentReference: paidAmount > 0 ? `NIBSS-TRX-${Math.floor(1000000 + Math.random() * 9000000)}` : undefined,
        nibssBankName: settings.defaultNIBSSBank?.bankName || 'Access Bank Nigeria PLC',
      };
      setInvoices(prev => [newInv, ...prev]);

      apiService.createStudent(studentData as any);
      return updatedStudent;
    }

    const newStudent: Student = {
      ...studentData,
      id: `stu-${Date.now()}`,
      studentCode,
      defaultPassword,
      password: studentData.password || defaultPassword,
      mustResetPassword: studentData.mustResetPassword !== undefined ? studentData.mustResetPassword : true,
      curriculumDriveUrl: curriculumUrl,
      handbookDriveUrl: handbookUrl,
      enrolledDate: new Date().toISOString().split('T')[0],
    };
    setStudents(prev => [newStudent, ...prev]);

    // Create authentic dynamic invoice for student enrollment
    const feeAmount = newStudent.totalFees || newStudent.tuitionAmount || 850000;
    const paidAmount = feeAmount - (newStudent.outstandingBalance ?? 0);
    const invoiceStatus = (newStudent.outstandingBalance ?? 0) === 0 ? 'Paid' : (paidAmount > 0 ? 'Partial' : 'Pending');

    const newInv: Invoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber: `INV-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`,
      studentId: newStudent.id,
      studentName: newStudent.name,
      studentEmail: newStudent.email,
      programName: newStudent.program,
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      totalAmount: feeAmount,
      paidAmount: paidAmount,
      status: invoiceStatus,
      items: [{ id: `item-1`, description: `${newStudent.program} Tuition Enrollment`, amount: feeAmount }],
      paymentReference: paidAmount > 0 ? `NIBSS-TRX-${Math.floor(1000000 + Math.random() * 9000000)}` : undefined,
      nibssBankName: settings.defaultNIBSSBank?.bankName || 'Access Bank Nigeria PLC',
    };
    setInvoices(prev => [newInv, ...prev]);

    apiService.createStudent(newStudent);

    // Dispatch automated student onboarding welcome email via Zoho SMTP
    if (newStudent.email) {
      emailService.sendEmail({
        to: newStudent.email,
        recipientName: newStudent.name,
        subject: settings.customEmailTemplates?.student_welcome?.subject || `🎓 Welcome to CODELAB EDUCARE LTD — Admission Confirmation (${newStudent.studentCode})`,
        type: 'student_welcome',
        data: {
          studentCode: newStudent.studentCode,
          program: newStudent.program,
          cohort: newStudent.cohort || 'Executive Cohort',
          mentorName: newStudent.mentorName,
          paidAmount: (newStudent.totalFees || 0) - (newStudent.outstandingBalance || 0),
          balance: newStudent.outstandingBalance || 0,
          defaultPassword: newStudent.defaultPassword,
          mustResetPassword: newStudent.mustResetPassword,
          curriculumDriveUrl: newStudent.curriculumDriveUrl,
          handbookDriveUrl: newStudent.handbookDriveUrl,
          portalUrl: `${APP_BASE_URL}/login?role=student&email=${encodeURIComponent(newStudent.email || '')}`,
        }
      }).catch(err => console.error('Error sending student welcome email:', err));
    }

    // If course has multi-mentor split, allocate 37% faculty pool proportionally across all assigned mentors
    const enrolledCourse = courses.find(c => c.title === newStudent.program || c.id === (studentData as any).courseId);
    if (enrolledCourse?.assignedMentors && enrolledCourse.assignedMentors.length > 1) {
      const totalPool = Math.round(((newStudent.totalFees || 0) * 37) / 100);
      enrolledCourse.assignedMentors.forEach(share => {
        const shareAmount = Math.round(totalPool * (share.sharePercentage / 100));
        setMentors(prev => prev.map(m => {
          if (m.id !== share.mentorId && m.name !== share.mentorName) return m;
          return {
            ...m,
            activeMentees: (m.activeMentees || 0) + 1,
            assignedEnrollmentsCount: (m.assignedEnrollmentsCount || 0) + 1,
            pendingPayout: (m.pendingPayout || 0) + shareAmount,
            totalEarned: (m.totalEarned || 0) + shareAmount,
          };
        }));
        const target = mentors.find(m => m.id === share.mentorId || m.name === share.mentorName);
        if (target) {
          apiService.updateMentor(target.id, {
            activeMentees: (target.activeMentees || 0) + 1,
            assignedEnrollmentsCount: (target.assignedEnrollmentsCount || 0) + 1,
            pendingPayout: (target.pendingPayout || 0) + shareAmount,
            totalEarned: (target.totalEarned || 0) + shareAmount,
          });
        }
      });
    } else if (newStudent.mentorName || (studentData as any).mentorId) {
      const assignedMentor = mentors.find(m => 
        (studentData as any).mentorId ? m.id === (studentData as any).mentorId : m.name === newStudent.mentorName
      );
      if (assignedMentor) {
        const rate = assignedMentor.commissionRate ?? 37;
        const commissionAmount = Math.round(((newStudent.totalFees || 0) * rate) / 100);
        setMentors(prev => prev.map(m => m.id === assignedMentor.id ? {
          ...m,
          activeMentees: (m.activeMentees || 0) + 1,
          assignedEnrollmentsCount: (m.assignedEnrollmentsCount || 0) + 1,
          pendingPayout: (m.pendingPayout || 0) + commissionAmount,
          totalEarned: (m.totalEarned || 0) + commissionAmount,
        } : m));
        apiService.updateMentor(assignedMentor.id, {
          activeMentees: (assignedMentor.activeMentees || 0) + 1,
          assignedEnrollmentsCount: (assignedMentor.assignedEnrollmentsCount || 0) + 1,
          pendingPayout: (assignedMentor.pendingPayout || 0) + commissionAmount,
          totalEarned: (assignedMentor.totalEarned || 0) + commissionAmount,
        });
      }
    }

    showToast('Student Enrolled & Welcome Sent', `${newStudent.name} admitted (#${newStudent.studentCode}). Welcome email sent.`, 'success');
    addNotification({
      title: 'New Student Enrolled & Onboarded',
      message: `${newStudent.name} admitted to ${newStudent.program} (#${newStudent.studentCode}). Welcome email dispatched.`,
      type: 'admissions',
      link: '/students',
    });
    logActivity({
      title: 'New Student Enrolled',
      description: `${newStudent.name} admitted with ID #${newStudent.studentCode}.`,
      type: 'student',
      user: 'Admissions Office',
    });

    return newStudent;
  };

  const updateStudent = (id: string, updatedData: Partial<Student>) => {
    setStudents(prev => prev.map(s => s.id === id ? { ...s, ...updatedData } : s));
    apiService.updateStudent(id, updatedData);
    addNotification({
      title: 'Student Biodata Updated',
      message: 'Student profile information was successfully updated.',
      type: 'admissions',
    });
  };

  const updateStudentStatus = (id: string, status: StudentStatus) => {
    setStudents(prev => prev.map(s => s.id === id ? { ...s, status } : s));
    apiService.updateStudent(id, { status });
  };

  const assignMentorToStudent = (studentId: string, mentorId: string, reason?: string) => {
    const mentor = mentors.find(m => m.id === mentorId);
    if (!mentor) return;

    let studentName = 'Student';
    let studentFees = 0;
    let newHistory: MentorChangeRecord[] = [];

    setStudents(prev => prev.map(s => {
      if (s.id === studentId) {
        studentName = s.name;
        studentFees = s.totalFees || 0;
        
        const history = s.mentorHistory ? [...s.mentorHistory] : [];
        if (s.mentorName && s.mentorName !== mentor.name) {
          history.unshift({
            id: `mh-${Date.now()}`,
            previousMentorId: s.mentorId,
            previousMentorName: s.mentorName,
            newMentorId: mentor.id,
            newMentorName: mentor.name,
            reassignedAt: new Date().toISOString(),
            reassignedBy: currentUser?.name || 'Administrator',
            reason: reason || 'Academic reassignment',
          });
        }
        newHistory = history;

        return {
          ...s,
          mentorName: mentor.name,
          mentorId: mentor.id,
          mentorHistory: history,
        };
      }
      return s;
    }));

    // Credit 37% enrollment commission to mentor
    const rate = mentor.commissionRate ?? 37;
    const commissionAmount = Math.round((studentFees * rate) / 100);

    setMentors(prev => prev.map(m => {
      if (m.id === mentorId) {
        return {
          ...m,
          activeMentees: (m.activeMentees || 0) + 1,
          assignedEnrollmentsCount: (m.assignedEnrollmentsCount || 0) + 1,
          pendingPayout: (m.pendingPayout || 0) + commissionAmount,
          totalEarned: (m.totalEarned || 0) + commissionAmount,
        };
      }
      return m;
    }));

    apiService.updateStudent(studentId, { 
      mentorName: mentor.name, 
      mentorId: mentor.id,
      mentorHistory: newHistory 
    });
    apiService.updateMentor(mentorId, { 
      activeMentees: (mentor.activeMentees || 0) + 1,
      assignedEnrollmentsCount: (mentor.assignedEnrollmentsCount || 0) + 1,
      pendingPayout: (mentor.pendingPayout || 0) + commissionAmount,
      totalEarned: (mentor.totalEarned || 0) + commissionAmount,
    });

    showToast('Mentor Assigned', `${mentor.name} paired with ${studentName} (${rate}% commission credited: ${formatNaira(commissionAmount)}).`, 'success');
    addNotification({
      title: 'Lead Faculty Mentor Paired',
      message: `${mentor.name} assigned to coach ${studentName}. 37% tuition share (${formatNaira(commissionAmount)}) credited.`,
      type: 'mentor',
      link: '/students',
    });

    logActivity({
      title: 'Faculty Mentor Assigned',
      description: `${studentName} assigned to ${mentor.name} (${mentor.department}) with 37% tuition share credited.`,
      type: 'mentor',
      user: currentUser?.name || 'Super Admin',
    });
  };

  // Student 360 Attendance, Feedback, and Dossier Handlers
  const updateStudentAttendanceRecord = async (studentId: string, record: StudentSessionAttendance) => {
    let studentName = '';
    let newAttendanceRate = 100;
    let newTotalHours = 0;

    setStudents(prev => prev.map(s => {
      if (s.id !== studentId) return s;
      studentName = s.name;
      const existingAttendance = s.sessionAttendance ? [...s.sessionAttendance] : [];
      const index = existingAttendance.findIndex(r => r.id === record.id || r.sessionId === record.sessionId);
      
      if (index >= 0) {
        existingAttendance[index] = record;
      } else {
        existingAttendance.unshift(record);
      }

      // Recalculate attendance rate (Percentage present)
      const validRecords = existingAttendance.filter(r => r.status !== 'Excused');
      const presentCount = validRecords.filter(r => r.status === 'Present').length;
      newAttendanceRate = validRecords.length > 0 ? Math.round((presentCount / validRecords.length) * 100) : 100;

      // Recalculate total hours credited
      newTotalHours = existingAttendance.reduce((acc, r) => acc + (r.hoursCredited || 0), 0);

      const updated = {
        ...s,
        sessionAttendance: existingAttendance,
        attendanceRate: newAttendanceRate,
        attendedLearningHours: Math.max(s.attendedLearningHours || 0, newTotalHours),
      };

      if (isBackendConnected) {
        apiService.updateStudent(studentId, {
          sessionAttendance: existingAttendance,
          attendanceRate: newAttendanceRate,
          attendedLearningHours: updated.attendedLearningHours
        }).catch(err => console.warn('Attendance backend sync error:', err));
      }

      return updated;
    }));

    showToast('Attendance Logged', `Marked ${record.status} for ${studentName} (${newAttendanceRate}% overall attendance).`, 'success');
  };

  const submitStudentFeedback = async (feedbackData: Omit<StudentFeedbackEntry, 'id' | 'submittedAt'>) => {
    const newEntry: StudentFeedbackEntry = {
      ...feedbackData,
      id: `sf-${Date.now()}`,
      submittedAt: new Date().toISOString(),
    };

    setStudents(prev => prev.map(s => {
      if (s.id !== feedbackData.studentId) return s;
      const updatedList = [newEntry, ...(s.studentFeedbackHistory || [])];
      
      if (isBackendConnected) {
        apiService.updateStudent(s.id, { studentFeedbackHistory: updatedList }).catch(e => console.warn(e));
      }

      return {
        ...s,
        studentFeedbackHistory: updatedList,
      };
    }));

    showToast('Feedback Submitted', 'Thank you! Your feedback for mentor & course has been recorded.', 'success');
  };

  const addMentorFeedbackNote = async (studentId: string, noteData: Omit<MentorFeedbackEntry, 'id' | 'date'>) => {
    const newEntry: MentorFeedbackEntry = {
      ...noteData,
      id: `mfn-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
    };

    setStudents(prev => prev.map(s => {
      if (s.id !== studentId) return s;
      const updatedNotes = [newEntry, ...(s.mentorFeedbackNotes || [])];
      const isAtRisk = noteData.isAtRiskWarning ? true : s.isAtRisk;

      if (isBackendConnected) {
        apiService.updateStudent(studentId, { 
          mentorFeedbackNotes: updatedNotes,
          isAtRisk
        }).catch(e => console.warn(e));
      }

      return {
        ...s,
        mentorFeedbackNotes: updatedNotes,
        isAtRisk
      };
    }));

    showToast('Mentor Note Logged', `Note recorded as ${noteData.feedbackType.toUpperCase()}.`, 'success');
  };

  const toggleStudentAtRisk = async (studentId: string, isAtRisk: boolean) => {
    setStudents(prev => prev.map(s => {
      if (s.id !== studentId) return s;
      if (isBackendConnected) {
        apiService.updateStudent(studentId, { isAtRisk }).catch(e => console.warn(e));
      }
      return { ...s, isAtRisk };
    }));

    showToast('At-Risk Status Updated', isAtRisk ? 'Student flagged as At-Risk for welfare review.' : 'Student cleared from At-Risk list.', 'info');
  };

  const toggleStudentGoalStatus = async (studentId: string, goalId: string, newStatus?: 'In Progress' | 'Achieved' | 'Deferred') => {
    let targetStatus: 'In Progress' | 'Achieved' | 'Deferred' = 'Achieved';
    setStudents(prev => prev.map(s => {
      if (s.id !== studentId) return s;
      const existingGoals = s.mentorGoals || [];
      const updatedGoals = existingGoals.map(g => {
        if (g.id === goalId) {
          targetStatus = newStatus || (g.status === 'Achieved' ? 'In Progress' : 'Achieved');
          return {
            ...g,
            status: targetStatus,
            achievedAt: targetStatus === 'Achieved' ? new Date().toISOString() : undefined,
          };
        }
        return g;
      });

      if (isBackendConnected) {
        apiService.updateStudent(studentId, { mentorGoals: updatedGoals }).catch(e => console.warn(e));
      }

      return {
        ...s,
        mentorGoals: updatedGoals,
      };
    }));

    showToast('Milestone Goal Updated', `Goal milestone marked as ${targetStatus}.`, 'success');
  };

  const uploadStudentDocument = async (studentId: string, docData: Omit<StudentDocumentItem, 'id' | 'uploadedAt'>) => {
    const newDoc: StudentDocumentItem = {
      ...docData,
      id: `doc-${Date.now()}`,
      uploadedAt: new Date().toISOString(),
      uploadedBy: currentUser?.name || 'Administrator',
    };

    setStudents(prev => prev.map(s => {
      if (s.id !== studentId) return s;
      const updatedDocs = [newDoc, ...(s.documents || [])];

      if (isBackendConnected) {
        apiService.updateStudent(studentId, { documents: updatedDocs }).catch(e => console.warn(e));
      }

      return {
        ...s,
        documents: updatedDocs,
      };
    }));

    showToast('Document Saved', `${newDoc.title} is now visible to the student in their Document Vault.`, 'success');
  };

  const sendPaymentReminder = (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return;

    apiService.sendPaymentReminder(studentId);

    addNotification({
      title: 'Payment Reminder Dispatched',
      message: `Automated reminder dispatched to ${student.name} for ${formatNaira(student.outstandingBalance)} via ${settings.defaultNIBSSBank.bankName}.`,
      type: 'finance',
      link: '/students',
    });

    showToast(
      'Payment Reminder Sent',
      `Dispatched alert to ${student.name} for ${formatNaira(student.outstandingBalance)}.`,
      'success'
    );

    logActivity({
      title: 'Payment Reminder Sent',
      description: `Automated payment reminder sent to ${student.name} (#${student.studentCode}).`,
      type: 'finance',
      user: currentUser?.name || 'Account Officer',
    });
  };

  const recordStudentInstallmentPayment = async (studentId: string, payload: RecordInstallmentPayload): Promise<boolean> => {
    try {
      const res = await fetch(`/api/students/${studentId}/installment-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...payload,
          recordedByName: currentUser?.name || 'Finance Officer'
        })
      });
      const result = await res.json();
      if (!res.ok || !result.success) {
        showToast('Payment Recording Failed', result.message || 'Could not record installment payment.', 'error');
        return false;
      }

      // Update student in state
      setStudents(prev => prev.map(s => {
        if (s.id === studentId || s.studentCode === studentId) {
          return {
            ...s,
            paidAmount: result.data.paidAmount,
            outstandingBalance: result.data.outstandingBalance,
            tuitionStatus: result.data.tuitionStatus,
            installments: result.data.installments,
            paymentHistory: result.data.paymentHistory
          };
        }
        return s;
      }));

      // Update invoice in state
      setInvoices(prev => prev.map(inv => {
        if (inv.studentId === studentId || (inv as any).studentCode === studentId || (inv.studentName && result.data.name && inv.studentName.toLowerCase() === result.data.name.toLowerCase())) {
          return {
            ...inv,
            paidAmount: result.data.paidAmount,
            balanceDue: result.data.outstandingBalance,
            status: result.data.outstandingBalance === 0 ? 'Paid' : 'Partial',
            paidDate: result.data.outstandingBalance === 0 ? (payload.paymentDate || new Date().toISOString().split('T')[0]) : inv.paidDate
          };
        }
        return inv;
      }));

      showToast(
        'Installment Recorded!',
        `₦${Number(payload.amount).toLocaleString()} credited for ${result.data.name}. Remaining balance: ₦${Number(result.data.outstandingBalance).toLocaleString()}`,
        'success'
      );

      closeModal();
      return true;
    } catch (err: any) {
      console.error('Error recording student installment:', err);
      showToast('Network Error', err.message || 'Failed to submit installment payment.', 'error');
      return false;
    }
  };

  // Mentor mutations
  const recruitMentor = (mentorData: Omit<Mentor, 'id' | 'joinedDate' | 'mentorCode' | 'sessionsCount'>) => {
    const newMentor: Mentor = {
      ...mentorData,
      id: `men-${Date.now()}`,
      mentorCode: `MN-${Math.floor(1000 + Math.random() * 9000)}`,
      joinedDate: new Date().toISOString().split('T')[0],
      sessionsCount: 0,
    };
    setMentors(prev => [newMentor, ...prev]);
    apiService.createMentor(mentorData);

    // Dispatch automated mentor welcome / faculty appointment email via Zoho SMTP
    if (newMentor.email) {
      emailService.sendEmail({
        to: newMentor.email,
        recipientName: newMentor.name,
        subject: settings.customEmailTemplates?.mentor_welcome?.subject || `💼 Faculty Appointment & Onboarding — CODELAB EDUCARE LTD (${newMentor.mentorCode})`,
        type: 'mentor_welcome',
        data: {
          facultyId: newMentor.mentorCode,
          department: newMentor.department,
          courses: Array.isArray(newMentor.courses) ? newMentor.courses.join(', ') : (newMentor.expertise?.join(', ') || 'Academic Track'),
          commissionRate: `${newMentor.commissionRate || 37}% per student enrollment`,
          bankDetails: `${newMentor.bankName || ''} - ${newMentor.accountNumber || ''} (${newMentor.accountName || newMentor.name})`,
          portalUrl: `${APP_BASE_URL}/login?role=mentor&email=${encodeURIComponent(newMentor.email || '')}`,
        }
      }).catch(err => console.error('Error sending mentor welcome email:', err));
    }

    showToast('Mentor Recruited & Appointment Sent', `${newMentor.name} joined faculty. Welcome email dispatched.`, 'success');
    addNotification({
      title: 'Faculty Mentor Recruited & Onboarded',
      message: `${newMentor.name} joined as ${newMentor.role} (${newMentor.department}). Welcome email sent.`,
      type: 'mentor',
      link: '/mentors',
    });
    logActivity({
      title: 'Faculty Mentor Recruited',
      description: `${newMentor.name} joined as ${newMentor.role}. Appointment email dispatched.`,
      type: 'mentor',
      user: 'Academic Director',
    });
  };

  const updateMentorStatus = (id: string, status: Mentor['status']) => {
    const isActive = status !== 'Deactivated';
    setMentors(prev => prev.map(m => m.id === id ? { ...m, status, isActive } : m));
    apiService.updateMentor(id, { status, isActive });
  };

  const updateMentor = (id: string, updatedData: Partial<Mentor>) => {
    setMentors(prev => prev.map(m => {
      if (m.id === id) {
        return { ...m, ...updatedData };
      }
      return m;
    }));

    apiService.updateMentor(id, updatedData);
    showToast('Mentor Updated', 'Faculty profile updated successfully.', 'info');
    logActivity({
      title: 'Faculty Profile Updated',
      description: `Mentor profile #${updatedData.mentorCode || id} updated by Administrator.`,
      type: 'mentor',
      user: 'Super Admin',
    });
  };

  // Expense & OpEx mutations
  const logExpense = (expenseData: Omit<Expense, 'id' | 'expenseCode'>) => {
    const newExpense: Expense = {
      ...expenseData,
      status: expenseData.status || 'Awaiting Approval',
      id: `exp-${Date.now()}`,
      expenseCode: `EXP-${Math.floor(1000 + Math.random() * 9000)}`,
      createdAt: expenseData.createdAt || new Date().toISOString(),
      date: expenseData.date || new Date().toISOString().split('T')[0],
    };
    setExpenses(prev => [newExpense, ...prev]);
    apiService.createExpense(newExpense);
    showToast('OpEx Requisition Submitted', `${newExpense.title} (${formatNaira(newExpense.amount)}) submitted for Super Admin review.`, 'info');
    addNotification({
      title: 'OpEx Requisition Awaiting Approval',
      message: `${newExpense.title} (${formatNaira(newExpense.amount)}) submitted by ${newExpense.requestedBy || 'Staff'}. Awaiting Super Admin review.`,
      type: 'finance',
      link: '/expenses',
    });
    logActivity({
      title: 'OpEx Requisition Submitted',
      description: `${newExpense.title} (${formatNaira(newExpense.amount)}) submitted for funding release.`,
      type: 'finance',
      user: newExpense.requestedBy || currentUser?.name || 'Staff Requester',
    });

    // Automated dispatch to Approver (Super Admin / Finance)
    emailService.sendEmail({
      to: settings.email || 'admin@codelab.institute',
      recipientName: 'Super Admin & Finance Controller',
      subject: `🔔 OpEx Approval Required: ${newExpense.title} (${formatNaira(newExpense.amount)}) - ${newExpense.department}`,
      type: 'expense_approval_request',
      data: {
        expenseCode: newExpense.expenseCode,
        title: newExpense.title,
        amount: newExpense.amount,
        category: newExpense.category,
        department: newExpense.department,
        requestedBy: newExpense.requestedBy,
        requesterEmail: newExpense.requesterEmail,
        vendor: newExpense.vendor,
        urgency: newExpense.urgency,
        receiptName: newExpense.receiptName,
        description: newExpense.description,
        actionUrl: `${APP_BASE_URL}/expenses`,
      }
    }).catch(err => console.error('Error sending expense approval request email:', err));
  };

  const updateExpenseStatus = (
    id: string, 
    status: ExpenseStatus, 
    extra?: { rejectionReason?: string; reviewedBy?: string; reviewedAt?: string }
  ) => {
    const expense = expenses.find(e => e.id === id);
    setExpenses(prev => prev.map(e => e.id === id ? { ...e, status, ...extra } : e));
    apiService.updateExpenseStatus(id, status, extra);
    if (expense) {
      showToast('Expense Updated', `${expense.title} status changed to ${status}.`, status === 'Approved' ? 'success' : 'info');
      addNotification({
        title: `Expense ${status}`,
        message: `${expense.title} (${formatNaira(expense.amount)}) status updated to ${status}.`,
        type: 'finance',
        link: '/expenses',
      });
    }
    logActivity({
      title: 'Expense Status Updated',
      description: `Expense #${expense?.expenseCode || id} status updated to ${status}.`,
      type: 'finance',
      user: currentUser?.name || 'Super Admin',
    });
  };

  const approveExpense = (id: string) => {
    const expense = expenses.find(e => e.id === id);
    if (!expense) return;

    const reviewer = currentUser?.name || 'Super Admin';
    const timestamp = new Date().toISOString();

    setExpenses(prev => prev.map(e => e.id === id ? {
      ...e,
      status: 'Approved',
      reviewedBy: reviewer,
      reviewedAt: timestamp,
    } : e));

    apiService.updateExpenseStatus(id, 'Approved', {
      reviewedBy: reviewer,
      reviewedAt: timestamp,
    });

    showToast('OpEx Request Approved', `${expense.title} approved. Amount deducted from monthly operating budget.`, 'success');
    addNotification({
      title: 'OpEx Request Approved',
      message: `${expense.title} (${formatNaira(expense.amount)}) was approved by ${reviewer}. Funds allocated.`,
      type: 'finance',
      link: '/expenses',
    });
    logActivity({
      title: 'OpEx Requisition Approved',
      description: `${expense.title} (${formatNaira(expense.amount)}) approved by ${reviewer}.`,
      type: 'finance',
      user: reviewer,
    });

    // Dispatch approval confirmation to requester
    const targetEmail = expense.requesterEmail || currentUser?.email || settings.email || 'admin@codelab.institute';
    emailService.sendEmail({
      to: targetEmail,
      recipientName: expense.requestedBy || 'Staff Requester',
      subject: `✅ OpEx Request Approved: ${expense.title} (${formatNaira(expense.amount)})`,
      type: 'expense_approved',
      data: {
        expenseCode: expense.expenseCode,
        title: expense.title,
        amount: expense.amount,
        reviewedBy: reviewer,
        reviewedAt: timestamp,
        actionUrl: `${APP_BASE_URL}/expenses`,
      }
    }).catch(err => console.error('Error sending expense approved email:', err));
  };

  const rejectExpense = (id: string, reason: string) => {
    const expense = expenses.find(e => e.id === id);
    if (!expense) return;

    const reviewer = currentUser?.name || 'Super Admin';
    const timestamp = new Date().toISOString();

    setExpenses(prev => prev.map(e => e.id === id ? {
      ...e,
      status: 'Rejected',
      rejectionReason: reason,
      reviewedBy: reviewer,
      reviewedAt: timestamp,
    } : e));

    apiService.updateExpenseStatus(id, 'Rejected', {
      rejectionReason: reason,
      reviewedBy: reviewer,
      reviewedAt: timestamp,
    });

    showToast('OpEx Request Rejected', `Requisition #${expense.expenseCode} rejected. Reason logged.`, 'warning');
    addNotification({
      title: 'OpEx Request Rejected',
      message: `${expense.title} (${formatNaira(expense.amount)}) was rejected by ${reviewer}. Reason: ${reason}`,
      type: 'finance',
      link: '/expenses',
    });
    logActivity({
      title: 'OpEx Requisition Rejected',
      description: `${expense.title} rejected by ${reviewer}. Note: ${reason}`,
      type: 'finance',
      user: reviewer,
    });

    // Dispatch decline notification to requester with reason
    const targetEmail = expense.requesterEmail || currentUser?.email || settings.email || 'admin@codelab.institute';
    emailService.sendEmail({
      to: targetEmail,
      recipientName: expense.requestedBy || 'Staff Requester',
      subject: `❌ OpEx Request Declined: ${expense.title} (${expense.expenseCode})`,
      type: 'expense_rejected',
      data: {
        expenseCode: expense.expenseCode,
        title: expense.title,
        amount: expense.amount,
        reviewedBy: reviewer,
        reviewedAt: timestamp,
        rejectionReason: reason,
        actionUrl: `${APP_BASE_URL}/expenses`,
      }
    }).catch(err => console.error('Error sending expense rejected email:', err));
  };

  // Courses & Cohorts
  const addCourse = async (courseData: Omit<CourseProgram, 'id' | 'enrolledCount' | 'rating'>) => {
    const newCourse: CourseProgram = {
      ...courseData,
      id: `course-${Date.now()}`,
      enrolledCount: 0,
      rating: 5.0,
    };

    setCourses(prev => {
      const updated = [newCourse, ...prev.filter(c => c.code !== newCourse.code)];
      safeLocalStorage.setItem(STORAGE_KEYS.COURSES, JSON.stringify(updated));
      return updated;
    });

    try {
      await apiService.createCourse(newCourse);
    } catch (err) {
      console.error('[CRM] Could not persist course to server:', err);
    }

    showToast('Course Added', `${newCourse.title} added to catalog permanently.`, 'success');
    logActivity({
      title: 'New Program Curriculum Created',
      description: `${newCourse.title} added to curriculum catalog.`,
      type: 'system',
      user: currentUser?.name || 'Academic Director',
    });
  };

  const updateCourse = (id: string, updatedData: Partial<CourseProgram>) => {
    setCourses(prev => prev.map(c => {
      if (c.id === id) {
        return { ...c, ...updatedData };
      }
      return c;
    }));

    if (updatedData.title) {
      setCohorts(prev => prev.map(coh => {
        if (coh.programId === id) {
          return { ...coh, programName: updatedData.title! };
        }
        return coh;
      }));
    }

    apiService.updateCourse(id, updatedData);
    showToast('Course Updated', 'Curriculum track updated.', 'info');
    logActivity({
      title: 'Course Curriculum Updated',
      description: `Academic program #${updatedData.code || id} updated by Administrator.`,
      type: 'system',
      user: 'Super Admin',
    });
  };

  const deleteCourse = async (id: string) => {
    const targetCourse = courses.find(c => c.id === id);
    setCourses(prev => {
      const updated = prev.filter(c => c.id !== id);
      safeLocalStorage.setItem(STORAGE_KEYS.COURSES, JSON.stringify(updated));
      return updated;
    });

    try {
      await apiService.deleteCourse(id);
    } catch (err) {
      console.warn('[CRM] Backend deleteCourse error:', err);
    }

    showToast('Course Deleted', `"${targetCourse?.title || id}" has been permanently removed from the catalog.`, 'info');
    logActivity({
      title: 'Course Deleted',
      description: `Course "${targetCourse?.title || id}" (${targetCourse?.code || id}) was deleted by ${currentUser?.name || 'Super Admin'}.`,
      type: 'system',
      user: currentUser?.name || 'Super Admin',
    });
  };

  const addCourseCategory = (category: string) => {
    const trimmed = category.trim();
    if (!trimmed) return;
    setSettings(prev => {
      const existing = prev.courseCategories || initialSettings.courseCategories || [];
      if (existing.some(c => c.toLowerCase() === trimmed.toLowerCase())) return prev;
      const updated = {
        ...prev,
        courseCategories: [...existing, trimmed],
      };
      apiService.updateSettings(updated);
      return updated;
    });
    showToast('Category Added', `Course track category "${trimmed}" saved.`, 'success');
  };

  const addCohort = (cohortData: Omit<Cohort, 'id' | 'enrolledCount'>) => {
    const newCohort: Cohort = {
      ...cohortData,
      id: `cohort-${Date.now()}`,
      enrolledCount: 0,
    };
    setCohorts(prev => [newCohort, ...prev]);
    apiService.createCohort(cohortData);
    showToast('Cohort Published', `${newCohort.name} schedule published.`, 'success');
    logActivity({
      title: 'New Cohort Launched',
      description: `${newCohort.name} schedule published.`,
      type: 'system',
      user: 'Admissions Office',
    });
  };

  // Sessions & Invoices
  const bookSession = (sessionData: Omit<MentorshipSession, 'id' | 'sessionCode'>) => {
    const newSession: MentorshipSession = {
      ...sessionData,
      id: `sess-${Date.now()}`,
      sessionCode: `SES-${Math.floor(1000 + Math.random() * 9000)}`,
    };
    setSessions(prev => [newSession, ...prev]);

    // Update mentor sessions count (covered under 37% enrollment commission agreement)
    setMentors(prev => prev.map(m => {
      if (m.id === newSession.mentorId) {
        return {
          ...m,
          sessionsCount: m.sessionsCount + 1,
        };
      }
      return m;
    }));

    apiService.createSession(sessionData);

    showToast(
      'Session Logged',
      `1-on-1 coaching session logged for ${newSession.studentName} with ${newSession.mentorName}.`,
      'success'
    );

    addNotification({
      title: '1-on-1 Mentorship Session Completed',
      message: `${newSession.mentorName} completed ${newSession.durationHours}h coaching with ${newSession.studentName}.`,
      type: 'mentor',
      link: '/mentors',
    });

    logActivity({
      title: 'Mentorship Session Logged',
      description: `${newSession.mentorName} completed ${newSession.durationHours}h coaching with ${newSession.studentName}.`,
      type: 'mentor',
      user: newSession.mentorName,
    });

    // Dispatch calendar confirmations to Mentor and Student
    const assignedMentor = mentors.find(m => m.id === newSession.mentorId || m.name === newSession.mentorName);
    const targetStudent = students.find(s => s.id === newSession.studentId || s.name === newSession.studentName);

    if (assignedMentor?.email) {
      emailService.sendEmail({
        to: assignedMentor.email,
        recipientName: assignedMentor.name,
        subject: `📅 1-on-1 Coaching Session Confirmed with ${newSession.studentName} (${newSession.topic})`,
        type: 'session_confirmation',
        data: {
          mentorName: newSession.mentorName,
          studentName: newSession.studentName,
          topic: newSession.topic,
          durationHours: newSession.durationHours,
          sessionLocation: 'Google Meet / Lagos Innovation Lab 3',
          compensationAmount: newSession.compensationAmount,
        }
      }).catch(err => console.error('Error sending session confirmation to mentor:', err));
    }

    if (targetStudent?.email) {
      emailService.sendEmail({
        to: targetStudent.email,
        recipientName: targetStudent.name,
        subject: `📅 1-on-1 Coaching Session Confirmed with ${newSession.mentorName} (${newSession.topic})`,
        type: 'session_confirmation',
        data: {
          mentorName: newSession.mentorName,
          studentName: newSession.studentName,
          topic: newSession.topic,
          durationHours: newSession.durationHours,
          sessionLocation: 'Google Meet / Lagos Innovation Lab 3',
          compensationAmount: newSession.compensationAmount,
        }
      }).catch(err => console.error('Error sending session confirmation to student:', err));
    }
  };

  // Staff Attendance & Hybrid Time Tracking
  const clockIn = async (options: {
    workMode: WorkMode;
    locationName?: string;
    campusId?: string;
    campusName?: string;
    dailyTasksFocus?: string;
    standupTasks?: DailyStandupTask[];
    lat?: number;
    lng?: number;
    gpsAccuracyMeters?: number;
    geoExceptionReason?: string;
  }): Promise<{ success: boolean; message: string; record?: AttendanceRecord }> => {
    if (!currentUser) {
      showToast('Clock-In Failed', 'No active user session detected.', 'error');
      return { success: false, message: 'No active user session.' };
    }

    if (staleAttendanceSession) {
      showToast(
        'Reconciliation Required',
        `Please complete retroactive clock-out for your ${staleAttendanceSession.date} shift first.`,
        'warning'
      );
      return { success: false, message: 'Unclosed prior-day shift requires retroactive clock-out.' };
    }

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    const dateStr = now.toISOString().split('T')[0];

    // Multi-campus Geo-verification calculation
    let geoStatus: GeoVerificationStatus = 'GPS Unavailable';
    let distanceMeters: number | undefined;

    const activeCampuses =
      settings.campusLocationsList && settings.campusLocationsList.length > 0
        ? settings.campusLocationsList.filter(c => c.isActive)
        : initialCampuses.filter(c => c.isActive);

    const fallbackOffice = settings.officeLocation || {
      name: 'Lagos Headquarters Hub (Yaba, Lagos)',
      latitude: 6.5181,
      longitude: 3.3768,
      radiusMeters: 400,
    };

    let matchedCampus = activeCampuses.find(c => c.id === options.campusId) || activeCampuses[0];

    if (options.workMode === 'Remote') {
      geoStatus = 'Remote Verified';
    } else if (options.lat !== undefined && options.lng !== undefined) {
      if (options.campusId && matchedCampus) {
        distanceMeters = calculateDistanceMeters(
          options.lat,
          options.lng,
          matchedCampus.latitude,
          matchedCampus.longitude
        );
        geoStatus = distanceMeters <= matchedCampus.radiusMeters ? 'Verified On-Site' : 'Location Mismatch';
      } else if (activeCampuses.length > 0) {
        const distances = activeCampuses
          .map(c => ({
            campus: c,
            dist: calculateDistanceMeters(options.lat!, options.lng!, c.latitude, c.longitude),
          }))
          .sort((a, b) => a.dist - b.dist);
        const inside = distances.find(d => d.dist <= d.campus.radiusMeters);
        const chosen = inside || distances[0];
        matchedCampus = chosen.campus;
        distanceMeters = chosen.dist;
        geoStatus = inside ? 'Verified On-Site' : 'Location Mismatch';
      } else {
        distanceMeters = calculateDistanceMeters(
          options.lat,
          options.lng,
          fallbackOffice.latitude,
          fallbackOffice.longitude
        );
        geoStatus = distanceMeters <= fallbackOffice.radiusMeters ? 'Verified On-Site' : 'Location Mismatch';
      }
    } else {
      geoStatus = 'GPS Unavailable';
    }

    // Punctuality check: Flexible / Scheduled for Mentors vs WorkHoursPolicy for Internal Staff
    const [expHour, expMin] = (settings.workHoursPolicy?.expectedClockInTime || '09:00').split(':').map(Number);
    const grace = settings.workHoursPolicy?.gracePeriodMinutes ?? 15;
    const strictMinutes = expHour * 60 + expMin;
    const graceLimitMinutes = strictMinutes + grace;
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    let punctualityStatus: PunctualityStatus = 'On-Time';
    if (currentUser.role === 'mentor') {
      punctualityStatus = currentMinutes <= graceLimitMinutes ? 'On-Time' : 'Flexible / Faculty';
    } else {
      if (currentMinutes <= strictMinutes) {
        punctualityStatus = 'On-Time';
      } else if (currentMinutes <= graceLimitMinutes) {
        punctualityStatus = 'Grace Period';
      } else {
        punctualityStatus = 'Late';
      }
    }

    const verificationStatus: AttendanceVerificationStatus =
      options.workMode === 'On-Site / Hub' &&
      (geoStatus === 'Location Mismatch' || geoStatus === 'GPS Unavailable')
        ? 'Pending Verification'
        : 'Verified';

    const resolvedCampusName =
      options.workMode === 'On-Site / Hub'
        ? options.campusName || matchedCampus?.name || fallbackOffice.name
        : 'Remote Workstation';

    const cleanStandupTasks = (options.standupTasks || []).filter(t => t.description.trim().length > 0);
    const synthesizedFocus =
      options.dailyTasksFocus?.trim() ||
      (cleanStandupTasks.length > 0
        ? cleanStandupTasks.map(t => t.description.trim()).join('; ')
        : 'General office operations and scheduled daily chores.');

    const initialDeliverables: ShiftDeliverableItem[] = cleanStandupTasks.map(t => ({
      id: t.id,
      moduleId: t.moduleId || 'leads',
      description: t.description.trim(),
      completed: t.status === 'completed',
      source: 'standup',
    }));

    const newRecord: AttendanceRecord = {
      id: `att-${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      userEmail: currentUser.email,
      userRole: currentUser.role,
      roleTitle: currentUser.roleTitle || currentUser.role,
      department: currentUser.department || (currentUser.role === 'mentor' ? 'Academic Faculty' : 'Operations'),
      staffId: currentUser.id,
      staffName: currentUser.name,
      staffEmail: currentUser.email,
      date: dateStr,
      clockInTime: timeStr,
      clockInTimestamp: now.getTime(),
      workMode: options.workMode,
      locationName: options.locationName || resolvedCampusName,
      campusId: options.workMode === 'On-Site / Hub' ? options.campusId || matchedCampus?.id : undefined,
      campusName: options.workMode === 'On-Site / Hub' ? resolvedCampusName : undefined,
      latitude: options.lat,
      longitude: options.lng,
      gpsAccuracyMeters: options.gpsAccuracyMeters,
      distanceFromOfficeMeters: distanceMeters !== undefined ? Math.round(distanceMeters) : undefined,
      geoStatus,
      geoExceptionReason: options.geoExceptionReason?.trim() || undefined,
      verificationStatus,
      punctuality: punctualityStatus,
      punctualityStatus,
      shiftFocus: synthesizedFocus,
      dailyTasksFocus: synthesizedFocus,
      isOnBreak: false,
      breaks: [],
      totalBreakMinutes: 0,
      deliverablesChecklist: initialDeliverables,
      status: 'Clocked In',
    };

    setAttendanceRecords(prev => [newRecord, ...prev]);
    try {
      const saved = await apiService.clockIn(newRecord);
      if (saved && saved.id && saved.id !== newRecord.id) {
        setAttendanceRecords(prev => prev.map(r => (r.id === newRecord.id ? { ...newRecord, id: saved.id } : r)));
      }
    } catch (e) {
      console.warn('[Attendance] Offline fallback for clockIn:', e);
    }

    // Two-Way Sync with AI Daily Standup
    const standupCommitments: DailyStandupTask[] =
      cleanStandupTasks.length > 0
        ? cleanStandupTasks
        : synthesizedFocus
            .split(';')
            .map(s => s.trim())
            .filter(Boolean)
            .map((desc, idx) => ({
              id: `t-${Date.now()}-${idx + 1}`,
              description: desc,
              moduleId: currentUser.assignedModules?.[0] || (currentUser.role === 'mentor' ? 'lms' : 'leads'),
              status: 'in_progress' as const,
            }));

    if (standupCommitments.length > 0) {
      const existingYesterday = todayStandup?.tasksYesterday || [];
      const existingBlockers = todayStandup?.blockers || [];
      const taggedModules = Array.from(
        new Set([
          ...(todayStandup?.taggedModuleIds || []),
          ...standupCommitments.map(t => t.moduleId),
        ])
      );
      fetch('/api/scrum/standup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          userName: currentUser.name,
          userRole: currentUser.role,
          userEmail: currentUser.email,
          tasksYesterday: existingYesterday,
          tasksToday: standupCommitments,
          blockers: existingBlockers,
          taggedModuleIds: taggedModules,
        }),
      })
        .then(r => r.json())
        .then(resData => {
          if (resData?.success && resData.data) {
            setTodayStandup(resData.data);
            setDailyStandups(prev => [resData.data, ...prev.filter(s => s.id !== resData.data.id)]);
          }
        })
        .catch(err => console.warn('[Standup Sync] Could not auto-sync clock-in tasks:', err));
    }

    showToast(
      'Clocked In & Standup Synced',
      `${currentUser.name} is now On-Duty (${options.workMode} • ${punctualityStatus}).`,
      verificationStatus === 'Pending Verification' ? 'warning' : 'success'
    );

    addNotification({
      title: 'Staff Clock-In Logged',
      message: `${currentUser.name} clocked in at ${timeStr} (${options.workMode} • ${punctualityStatus} • ${geoStatus}).`,
      type: 'system',
      link: '/attendance',
    });

    logActivity({
      title: 'Staff Member Clocked In',
      description: `${currentUser.name} clocked in for ${options.workMode} duty (${resolvedCampusName}). Focus: ${synthesizedFocus.slice(0, 75)}`,
      type: 'system',
      user: currentUser.name,
    });

    return { success: true, message: 'Clocked in successfully', record: newRecord };
  };

  const clockOut = async (options: {
    endOfDaySummary?: string;
    deliverablesChecklist?: ShiftDeliverableItem[];
    completedStandupTasks?: DailyStandupTask[];
    crmActivitiesCount?: number;
    targetRecordId?: string;
    retroactiveClockOutTime?: string;
    retroactiveNote?: string;
  }): Promise<{ success: boolean; message: string; record?: AttendanceRecord }> => {
    if (!currentUser) {
      showToast('Clock-Out Failed', 'No active user session.', 'error');
      return { success: false, message: 'No active user session.' };
    }

    const targetSession = options.targetRecordId
      ? attendanceRecords.find(r => r.id === options.targetRecordId) || staleAttendanceSession || activeAttendanceSession
      : activeAttendanceSession || staleAttendanceSession;

    if (!targetSession) {
      showToast('Clock-Out Error', 'No active shift found to clock out of.', 'error');
      return { success: false, message: 'No active shift found.' };
    }

    const isRetroactive = Boolean(options.retroactiveClockOutTime || targetSession.date < new Date().toISOString().split('T')[0]);
    const now = new Date();

    let outTimestamp = now.getTime();
    let timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

    if (options.retroactiveClockOutTime) {
      // Parse HH:mm on the targetSession.date
      const [hh, mm] = options.retroactiveClockOutTime.split(':').map(Number);
      const retroDate = new Date(`${targetSession.date}T00:00:00`);
      if (!isNaN(hh) && !isNaN(mm)) {
        retroDate.setHours(hh, mm, 0, 0);
        outTimestamp = Math.max(targetSession.clockInTimestamp + 60000, retroDate.getTime());
        timeStr = retroDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
      }
    }

    // Close any open break
    const breaks: ShiftBreakEntry[] = Array.isArray(targetSession.breaks) ? [...targetSession.breaks] : [];
    if (targetSession.isOnBreak && breaks.length > 0) {
      const lastIdx = breaks.length - 1;
      if (!breaks[lastIdx].endTimestamp) {
        const endTs = Math.max(breaks[lastIdx].startTimestamp + 60000, outTimestamp);
        const durMin = Math.max(1, Math.round((endTs - breaks[lastIdx].startTimestamp) / 60000));
        breaks[lastIdx] = {
          ...breaks[lastIdx],
          endTimestamp: endTs,
          durationMinutes: durMin,
        };
      }
    }
    const totalBreakMinutes = breaks.reduce((sum, b) => sum + (Number(b.durationMinutes) || 0), 0);

    const grossDurationMs = Math.max(0, outTimestamp - targetSession.clockInTimestamp);
    const netDurationMs = Math.max(60000, grossDurationMs - totalBreakMinutes * 60000);
    const totalHoursWorked = Number(Math.max(0.02, netDurationMs / (1000 * 60 * 60)).toFixed(2));

    // Calculate overtime vs expected shift length (default 8h)
    const [inH, inM] = (settings.workHoursPolicy?.expectedClockInTime || '09:00').split(':').map(Number);
    const [outH, outM] = (settings.workHoursPolicy?.expectedClockOutTime || '17:00').split(':').map(Number);
    const scheduledShiftHours = Math.max(1, ((outH * 60 + outM) - (inH * 60 + inM)) / 60);
    const overtimeHours = totalHoursWorked > scheduledShiftHours
      ? Number((totalHoursWorked - scheduledShiftHours).toFixed(2))
      : 0;

    const updatedRecord: AttendanceRecord = {
      ...targetSession,
      clockOutTime: timeStr,
      clockOutTimestamp: outTimestamp,
      totalHoursWorked,
      overtimeHours,
      isOnBreak: false,
      breaks,
      totalBreakMinutes,
      isRetroactiveClockOut: isRetroactive || targetSession.isRetroactiveClockOut,
      retroactiveNote: options.retroactiveNote || targetSession.retroactiveNote,
      verificationStatus: isRetroactive ? 'Pending Verification' : targetSession.verificationStatus || 'Verified',
      deliverablesChecklist: options.deliverablesChecklist || targetSession.deliverablesChecklist,
      crmActivitiesCount: options.crmActivitiesCount ?? targetSession.crmActivitiesCount,
      workSummary: options.endOfDaySummary || 'Completed daily deliverables and office chores.',
      status: 'Clocked Out',
    };

    setAttendanceRecords(prev => prev.map(r => (r.id === targetSession.id ? updatedRecord : r)));
    apiService.clockOut(targetSession.id, {
      userId: currentUser.id,
      clockOutTime: timeStr,
      clockOutTimestamp: outTimestamp,
      totalHoursWorked,
      overtimeHours,
      isOnBreak: false,
      breaks,
      totalBreakMinutes,
      isRetroactiveClockOut: updatedRecord.isRetroactiveClockOut,
      retroactiveNote: updatedRecord.retroactiveNote,
      verificationStatus: updatedRecord.verificationStatus,
      deliverablesChecklist: updatedRecord.deliverablesChecklist,
      crmActivitiesCount: updatedRecord.crmActivitiesCount,
      workSummary: updatedRecord.workSummary || '',
    });

    // Sync checked-off standup tasks back to DailyStandupReport if closing today's shift
    if (!isRetroactive && options.completedStandupTasks && options.completedStandupTasks.length > 0) {
      fetch('/api/scrum/standup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          userName: currentUser.name,
          userRole: currentUser.role,
          userEmail: currentUser.email,
          tasksYesterday: todayStandup?.tasksYesterday || [],
          tasksToday: options.completedStandupTasks,
          blockers: todayStandup?.blockers || [],
          taggedModuleIds: todayStandup?.taggedModuleIds || [],
        }),
      })
        .then(r => r.json())
        .then(resData => {
          if (resData?.success && resData.data) {
            setTodayStandup(resData.data);
            setDailyStandups(prev => [resData.data, ...prev.filter(s => s.id !== resData.data.id)]);
          }
        })
        .catch(err => console.warn('[Standup Sync] EOD standup sync error:', err));
    }

    showToast(
      isRetroactive ? 'Retroactive Shift Reconciled' : 'Clocked Out Successfully',
      isRetroactive
        ? `Closed ${targetSession.date} shift (${totalHoursWorked}h net). You can now clock in for today.`
        : `Shift closed with ${totalHoursWorked}h net logged${totalBreakMinutes > 0 ? ` (${totalBreakMinutes}m break deducted)` : ''}.`,
      'success'
    );

    addNotification({
      title: isRetroactive ? 'Retroactive Clock-Out Logged' : 'Staff Clock-Out Logged',
      message: `${currentUser.name} closed shift for ${targetSession.date} (${totalHoursWorked}h net).`,
      type: 'system',
      link: '/attendance',
    });

    logActivity({
      title: isRetroactive ? 'Staff Retroactive Clock-Out' : 'Staff Member Clocked Out',
      description: `${currentUser.name} completed duty (${totalHoursWorked}h net). EOD Output: ${(updatedRecord.workSummary || '').slice(0, 75)}`,
      type: 'system',
      user: currentUser.name,
    });

    return { success: true, message: 'Clocked out successfully', record: updatedRecord };
  };

  const toggleShiftBreak = async (action: 'start' | 'end', reason?: string): Promise<boolean> => {
    if (!currentUser || !activeAttendanceSession) {
      showToast('Break Action Failed', 'No active shift found.', 'error');
      return false;
    }

    const nowTs = Date.now();
    const breaks: ShiftBreakEntry[] = Array.isArray(activeAttendanceSession.breaks)
      ? [...activeAttendanceSession.breaks]
      : [];

    if (action === 'start') {
      if (!activeAttendanceSession.isOnBreak) {
        breaks.push({
          id: `brk-${nowTs}`,
          startTimestamp: nowTs,
          reason: reason || 'Mid-shift break',
        });
      }
      const updated: AttendanceRecord = {
        ...activeAttendanceSession,
        isOnBreak: true,
        status: 'On Break',
        breaks,
      };
      setAttendanceRecords(prev => prev.map(r => (r.id === activeAttendanceSession.id ? updated : r)));
      await apiService.toggleAttendanceBreak(activeAttendanceSession.id, { action: 'start', reason });
      showToast('Shift Paused (On Break)', 'Break timer started. Break minutes will be deducted from net hours.', 'info');
      return true;
    } else {
      if (breaks.length > 0) {
        const lastIdx = breaks.length - 1;
        if (!breaks[lastIdx].endTimestamp) {
          const durMin = Math.max(1, Math.round((nowTs - breaks[lastIdx].startTimestamp) / 60000));
          breaks[lastIdx] = {
            ...breaks[lastIdx],
            endTimestamp: nowTs,
            durationMinutes: durMin,
          };
        }
      }
      const totalBreakMinutes = breaks.reduce((sum, b) => sum + (Number(b.durationMinutes) || 0), 0);
      const updated: AttendanceRecord = {
        ...activeAttendanceSession,
        isOnBreak: false,
        status: 'Clocked In',
        breaks,
        totalBreakMinutes,
      };
      setAttendanceRecords(prev => prev.map(r => (r.id === activeAttendanceSession.id ? updated : r)));
      await apiService.toggleAttendanceBreak(activeAttendanceSession.id, { action: 'end' });
      showToast('Shift Resumed', `Welcome back! Total break time: ${totalBreakMinutes}m.`, 'success');
      return true;
    }
  };

  const resumeTodayShift = async (recordId?: string): Promise<boolean> => {
    const target = recordId
      ? attendanceRecords.find(r => r.id === recordId)
      : todayCompletedSession;

    if (!currentUser || !target) {
      showToast('Resume Failed', 'No completed shift from today found to resume.', 'error');
      return false;
    }

    const nowTs = Date.now();
    const breaks: ShiftBreakEntry[] = Array.isArray(target.breaks) ? [...target.breaks] : [];
    if (target.clockOutTimestamp && nowTs > target.clockOutTimestamp) {
      const gapMin = Math.max(1, Math.round((nowTs - target.clockOutTimestamp) / 60000));
      breaks.push({
        id: `brk-resume-${nowTs}`,
        startTimestamp: target.clockOutTimestamp,
        endTimestamp: nowTs,
        durationMinutes: gapMin,
        reason: 'Away interval between resumed shift segments',
      });
    }
    const totalBreakMinutes = breaks.reduce((sum, b) => sum + (Number(b.durationMinutes) || 0), 0);

    const resumed: AttendanceRecord = {
      ...target,
      clockOutTime: undefined,
      clockOutTimestamp: undefined,
      totalHoursWorked: undefined,
      isOnBreak: false,
      breaks,
      totalBreakMinutes,
      resumeCount: (Number(target.resumeCount) || 0) + 1,
      status: 'Clocked In',
    };

    setAttendanceRecords(prev => prev.map(r => (r.id === target.id ? resumed : r)));
    await apiService.resumeAttendanceShift(target.id);
    showToast('Shift Resumed', 'Your today shift is now active again.', 'success');
    logActivity({
      title: 'Staff Shift Resumed',
      description: `${currentUser.name} resumed their ${target.date} shift.`,
      type: 'system',
      user: currentUser.name,
    });
    return true;
  };

  const verifyAttendanceShift = async (
    recordId: string,
    updates: Partial<AttendanceRecord>
  ): Promise<boolean> => {
    if (!currentUser) return false;
    const target = attendanceRecords.find(r => r.id === recordId);
    if (!target) return false;

    const payload: Partial<AttendanceRecord> = {
      ...updates,
      verifiedBy: currentUser.name,
      verifiedAt: new Date().toISOString(),
    };

    setAttendanceRecords(prev =>
      prev.map(r => (r.id === recordId ? { ...r, ...payload } : r))
    );
    await apiService.verifyAttendanceRecord(recordId, payload);

    showToast(
      'Attendance Audit Updated',
      `Shift for ${target.staffName || target.userName} marked as ${updates.verificationStatus || updates.status || 'Updated'}.`,
      'success'
    );
    logActivity({
      title: 'Attendance Record Audited',
      description: `${currentUser.name} updated attendance audit for ${target.staffName || target.userName} (${target.date}) → ${updates.verificationStatus || updates.status}.`,
      type: 'system',
      user: currentUser.name,
    });
    return true;
  };

  const generateInvoice = (invoiceData: Omit<Invoice, 'id' | 'invoiceNumber'>) => {
    const newInvoice: Invoice = {
      ...invoiceData,
      id: `inv-${Date.now()}`,
      invoiceNumber: `INV-2026-${Math.floor(10000 + Math.random() * 90000)}`,
    };
    setInvoices(prev => [newInvoice, ...prev]);
    apiService.createInvoice(invoiceData);
    showToast('Invoice Created', `Invoice #${newInvoice.invoiceNumber} created.`, 'success');
  };

  const updateSettings = (newSettings: Partial<OrganizationSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
    apiService.updateSettings(newSettings);
    showToast('Settings Saved', 'System preferences updated successfully.', 'success');
    logActivity({
      title: 'Organization Settings Updated',
      description: 'Institute corporate banking and compliance settings updated.',
      type: 'system',
      user: 'Operations',
    });
  };

  const saveCampusLocations = async (campuses: CampusLocation[]): Promise<boolean> => {
    const primaryActiveCampus = campuses.find(c => c.isActive) || campuses[0];
    const updatedOffice = primaryActiveCampus ? {
      name: primaryActiveCampus.name,
      latitude: Number(primaryActiveCampus.latitude),
      longitude: Number(primaryActiveCampus.longitude),
      radiusMeters: Number(primaryActiveCampus.radiusMeters),
    } : settings.officeLocation;

    setSettings(prev => ({
      ...prev,
      campusLocationsList: campuses,
      officeLocation: updatedOffice,
    }));

    try {
      const result = await apiService.updateCampusLocations(campuses);
      if (result) {
        setSettings(prev => ({ ...prev, ...result }));
      }
      showToast('Campus Hubs Saved', `${campuses.length} physical hubs & geofence perimeters persisted.`, 'success');
      logActivity({
        title: 'Multi-Campus Hubs Updated',
        description: `Configured ${campuses.length} regional campus facilities (Primary: ${primaryActiveCampus?.name || 'None'}).`,
        type: 'system',
        user: currentUser?.name || 'Operations',
      });
      return true;
    } catch (err) {
      console.error('Error persisting campus locations:', err);
      // Fallback to general settings update
      apiService.updateSettings({
        campusLocationsList: campuses,
        officeLocation: updatedOffice,
      });
      showToast('Campus Hubs Saved', `${campuses.length} physical hubs saved locally.`, 'success');
      return true;
    }
  };

  const isModuleEnabled = (moduleKey: keyof EnabledModules): boolean => {
    if (!settings.enabledModules) return true;
    return settings.enabledModules[moduleKey] !== false;
  };

  const exportDatabaseBackup = () => {
    const backupData = {
      version: '3.2',
      exportDate: new Date().toISOString(),
      institution: settings.instituteName,
      exportedBy: currentUser?.name || 'Super Admin',
      data: {
        leads,
        students,
        mentors,
        expenses,
        courses,
        cohorts,
        invoices,
        sessions,
        attendance: attendanceRecords,
        settings,
        notifications,
        staffUsers,
        activityLogs,
      }
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `nexus_crm_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    showToast('Backup Exported', 'Full institutional data snapshot downloaded successfully.', 'success');
    logActivity({
      title: 'Database Backup Exported',
      description: `Full snapshot exported by ${currentUser?.name || 'Super Admin'}.`,
      type: 'system',
      user: currentUser?.name || 'Super Admin',
    });
  };

  const restoreDatabaseBackup = async (backupPayload: any): Promise<boolean> => {
    try {
      const data = backupPayload.data || backupPayload;
      if (!data || typeof data !== 'object') {
        showToast('Restore Failed', 'Invalid backup file structure.', 'error');
        return false;
      }

      if (data.leads) setLeads(data.leads);
      if (data.students) setStudents(data.students);
      if (data.mentors) setMentors(data.mentors);
      if (data.expenses) setExpenses(data.expenses);
      if (data.courses) setCourses(data.courses);
      if (data.cohorts) setCohorts(data.cohorts);
      if (data.invoices) setInvoices(data.invoices);
      if (data.sessions) setSessions(data.sessions);
      if (data.attendance) setAttendanceRecords(data.attendance);
      if (data.settings) setSettings(data.settings);
      if (data.notifications) setNotifications(data.notifications);
      if (data.staffUsers) setStaffUsers(data.staffUsers);
      if (data.activityLogs) setActivityLogs(data.activityLogs);

      await apiService.restoreBackup(data);

      showToast('Database Restored', 'CRM database snapshot successfully restored!', 'success');
      logActivity({
        title: 'Database Restored from Backup',
        description: 'System state restored from external backup file.',
        type: 'system',
        user: currentUser?.name || 'Super Admin',
      });
      return true;
    } catch (err) {
      console.error('Error restoring backup:', err);
      showToast('Restore Error', 'Failed to restore backup.', 'error');
      return false;
    }
  };

  const flushProductionData = async () => {
    const superAdmin: AuthUser = {
      id: 'user-admin',
      name: 'Abiola Adefowope',
      email: 'abiola.adefowope@codelab.institute',
      role: 'super_admin',
      roleTitle: 'Managing Director & Super Admin',
      department: 'Executive Board',
      password: 'password123',
    };

    setLeads([]);
    setStudents([]);
    setExpenses([]);
    setSessions([]);
    setInvoices([]);
    setMentors([]);
    setCohorts([]);
    setCourses([]);
    setStaffUsers([superAdmin]);
    setCurrentUser(superAdmin);
    
    setNotifications([
      {
        id: `notif-${Date.now()}`,
        title: '🚀 Production Slate Initialized',
        message: 'Demo dataset cleared. The system is ready for live operational intake.',
        type: 'system',
        timestamp: 'Just now',
        read: false,
        link: '/settings',
      }
    ]);

    await apiService.flushDemoData();

    showToast('Production Slate Cleaned', 'All demo data cleared. Ready for live operations!', 'success');
    logActivity({
      title: 'Demo Data Purged for Production',
      description: 'Super Admin cleared mock records for live launch.',
      type: 'system',
      user: superAdmin.name,
    });
  };

  const sendStaffWelcomeEmail = async (staffId: string) => {
    const staff = staffUsers.find(u => u.id === staffId);
    if (!staff) return;

    await apiService.sendStaffWelcome(staff.email, staff.name, staff.roleTitle, staff.role);

    showToast(
      'Welcome Email Sent',
      `Invitation & password setup link dispatched to ${staff.name} (${staff.email}).`,
      'success'
    );
  };

  const resetAllData = () => {
    safeLocalStorage.clear();
    setLeads(initialLeads);
    setStudents(initialStudents);
    setMentors(initialMentors);
    setExpenses(initialExpenses);
    setCourses(initialCourses);
    setCohorts(initialCohorts);
    setInvoices(initialInvoices);
    setSessions(initialSessions);
    setAttendanceRecords(initialAttendance);
    setSettings(initialSettings);
    setActivityLogs(initialActivityLogs);
    setNotifications(initialNotifications);
    setStaffUsers(demoUsers);
    setCurrentUser(defaultAuthUser);
    apiService.resetDatabase();
    showToast('System Reset', 'All records restored to Nigerian demo seed data.', 'warning');
  };

  // Student & LMS Actions
  const completeLesson = async (lessonId: string) => {
    if (!currentStudentProfile) return;
    const studentId = currentStudentProfile.id;

    setStudents(prev => prev.map(s => {
      if (s.id !== studentId) return s;
      const completed = s.completedLessonIds ? [...s.completedLessonIds] : [];
      if (!completed.includes(lessonId)) completed.push(lessonId);
      const totalLessons = lmsModules.reduce((acc, m) => acc + (m.lessons?.length || 0), 0) || 1;
      const progress = Math.min(100, Math.round((completed.length / totalLessons) * 100));
      return { ...s, completedLessonIds: completed, progressPercent: progress };
    }));

    showToast('Lesson Completed', 'Great job! Your academic progress has been updated.', 'success');

    if (isBackendConnected) {
      try {
        await apiService.completeLesson(lessonId, studentId);
      } catch (e) {
        console.warn('Backend complete lesson error:', e);
      }
    }
  };

  const submitAssignment = async (payload: { taskTitle: string; courseTitle?: string; moduleTitle?: string; githubUrl?: string; liveUrl?: string; notes?: string }) => {
    if (!currentStudentProfile) return;

    const newSub: StudentAssignmentSubmission = {
      id: `sub-${Date.now()}`,
      studentId: currentStudentProfile.id,
      studentName: currentStudentProfile.name,
      courseTitle: payload.courseTitle || currentStudentProfile.program || 'Full-Stack Software Engineering',
      moduleTitle: payload.moduleTitle || 'Curriculum Project',
      taskTitle: payload.taskTitle,
      githubUrl: payload.githubUrl,
      liveUrl: payload.liveUrl,
      notes: payload.notes,
      submittedAt: new Date().toISOString(),
      status: 'Pending',
    };

    setAssignments(prev => [newSub, ...prev]);

    setStudents(prev => prev.map(s => {
      if (s.id !== currentStudentProfile.id) return s;
      return {
        ...s,
        assignmentSubmissions: [newSub, ...(s.assignmentSubmissions || [])]
      };
    }));

    showToast('Assignment Submitted', 'Your lab assignment has been submitted to your assigned mentor for evaluation.', 'success');

    logActivity({
      title: 'Assignment Submitted',
      description: `${currentStudentProfile.name} submitted ${payload.taskTitle}`,
      type: 'student',
      user: currentStudentProfile.name
    });

    // Notify assigned mentor via email
    const assignedMentor = mentors.find(m => m.id === currentStudentProfile.mentorId || m.name === currentStudentProfile.mentorName);
    if (assignedMentor?.email) {
      emailService.sendEmail({
        to: assignedMentor.email,
        recipientName: assignedMentor.name,
        subject: `📝 Lab Assignment Submitted: ${currentStudentProfile.name} — ${newSub.taskTitle}`,
        type: 'lab_assignment_submitted',
        data: {
          studentName: currentStudentProfile.name,
          courseTitle: newSub.courseTitle,
          moduleTitle: newSub.moduleTitle,
          taskTitle: newSub.taskTitle,
          githubUrl: newSub.githubUrl,
          liveUrl: newSub.liveUrl,
          notes: newSub.notes,
          reviewUrl: `${APP_BASE_URL}/courses`,
        }
      }).catch(err => console.error('Error sending assignment submitted email:', err));
    }

    if (isBackendConnected) {
      try {
        await apiService.submitAssignment(newSub);
      } catch (e) {
        console.warn('Backend submit assignment error:', e);
      }
    }
  };

  const gradeAssignment = async (id: string, grade: number, mentorFeedback: string, status: 'Passed' | 'Needs Revision' | 'Exceptional' = 'Passed') => {
    setAssignments(prev => prev.map(a => {
      if (a.id !== id) return a;
      return {
        ...a,
        grade,
        mentorFeedback,
        status,
        reviewedBy: currentUser?.name || 'Faculty Mentor',
        reviewedAt: new Date().toISOString(),
      };
    }));

    setStudents(prev => prev.map(s => {
      if (!s.assignmentSubmissions) return s;
      return {
        ...s,
        assignmentSubmissions: s.assignmentSubmissions.map(a => {
          if (a.id !== id) return a;
          return {
            ...a,
            grade,
            mentorFeedback,
            status,
            reviewedBy: currentUser?.name || 'Faculty Mentor',
            reviewedAt: new Date().toISOString(),
          };
        })
      };
    }));

    showToast('Evaluation Recorded', `Assignment marked as ${status} with grade ${grade}%.`, 'success');

    // Notify student via email
    const targetSub = assignments.find(a => a.id === id);
    const targetStudent = students.find(s => s.id === targetSub?.studentId);
    if (targetStudent?.email) {
      emailService.sendEmail({
        to: targetStudent.email,
        recipientName: targetStudent.name,
        subject: `🎯 Lab Assignment Evaluated: ${targetSub?.taskTitle || 'Lab Assignment'} — Grade: ${grade}% (${status})`,
        type: 'lab_assignment_graded',
        data: {
          taskTitle: targetSub?.taskTitle || 'Lab Assignment',
          grade,
          status,
          reviewedBy: currentUser?.name || 'Faculty Mentor',
          mentorFeedback,
          portalUrl: `${APP_BASE_URL}/student/courses`,
        }
      }).catch(err => console.error('Error sending assignment graded email:', err));
    }

    if (isBackendConnected) {
      try {
        await apiService.gradeAssignment(id, {
          grade,
          mentorFeedback,
          status,
          reviewedBy: currentUser?.name || 'Faculty Mentor',
        });
      } catch (e) {
        console.warn('Backend grade assignment error:', e);
      }
    }
  };

  const payTuitionWithPaystack = async (options: { amountNaira: number; invoiceId?: string }) => {
    if (!currentStudentProfile) {
      showToast('Payment Error', 'No active student profile found.', 'error');
      return;
    }

    const student = currentStudentProfile;
    const publicKey = settings.paystackPublicKey || 'pk_test_sample_codelab_educare_key_2026';

    await launchPaystackPayment({
      publicKey,
      email: student.email,
      amountNaira: options.amountNaira,
      studentId: student.id,
      invoiceId: options.invoiceId,
      onSuccess: async (res) => {
        setStudents(prev => prev.map(s => {
          if (s.id !== student.id) return s;
          const newPaid = (s.paidAmount || 0) + res.amountNaira;
          const totalFees = s.totalFees || s.tuitionAmount || 0;
          const newBal = Math.max(0, totalFees - newPaid);
          return {
            ...s,
            paidAmount: newPaid,
            outstandingBalance: newBal,
            tuitionStatus: newBal === 0 ? 'Paid' : 'Partial',
          };
        }));

        setInvoices(prev => {
          const matched = prev.find(inv => (options.invoiceId && (inv.id === options.invoiceId || inv.invoiceNumber === options.invoiceId)) || inv.studentId === student.id);
          if (matched) {
            return prev.map(inv => {
              if (inv.id !== matched.id) return inv;
              const newPaid = (inv.paidAmount || 0) + res.amountNaira;
              const total = inv.totalAmount || inv.amount || 0;
              return {
                ...inv,
                paidAmount: newPaid,
                status: newPaid >= total ? 'Paid' : 'Partial',
                paidDate: new Date().toISOString()
              };
            });
          }
          // If no invoice found, prepend a newly synthesized dynamic invoice
          const totalFee = student.totalFees || student.tuitionAmount || res.amountNaira;
          const newInv: Invoice = {
            id: `inv-${Date.now()}`,
            invoiceNumber: options.invoiceId || `INV-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`,
            studentId: student.id,
            studentName: student.name,
            studentEmail: student.email,
            programName: student.program,
            issueDate: new Date().toISOString().split('T')[0],
            dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
            totalAmount: totalFee,
            paidAmount: res.amountNaira,
            status: res.amountNaira >= totalFee ? 'Paid' : 'Partial',
            items: [{ id: 'item-1', description: `${student.program} Tuition`, amount: totalFee }],
            paymentReference: res.reference,
            nibssBankName: 'Paystack Automated Gateway'
          };
          return [newInv, ...prev];
        });

        const totalPool = Math.round(res.amountNaira * 0.37);
        const enrolledCourse = courses.find(c => c.title === student.program || c.id === (student as any).courseId);

        if (enrolledCourse?.assignedMentors && enrolledCourse.assignedMentors.length > 1) {
          // Multi-mentor revenue split across co-instructors
          enrolledCourse.assignedMentors.forEach(share => {
            const shareAmount = Math.round(totalPool * (share.sharePercentage / 100));
            setMentors(prev => prev.map(m => {
              if (m.id !== share.mentorId && m.name !== share.mentorName) return m;
              return {
                ...m,
                pendingPayout: (m.pendingPayout || 0) + shareAmount,
                totalEarned: (m.totalEarned || 0) + shareAmount,
              };
            }));

            const targetMentor = mentors.find(m => m.id === share.mentorId || m.name === share.mentorName);
            if (targetMentor?.email && shareAmount > 0) {
              emailService.sendEmail({
                to: targetMentor.email,
                recipientName: targetMentor.name,
                subject: `🎉 New Commission Credited: ${share.sharePercentage}% Faculty Share (₦${shareAmount.toLocaleString()})`,
                type: 'mentor_commission_earned',
                data: {
                  studentName: student.name,
                  program: student.program,
                  tuitionPaid: res.amountNaira,
                  commissionAmount: shareAmount,
                  newPendingPayout: (targetMentor.pendingPayout || 0) + shareAmount,
                  portalUrl: `${APP_BASE_URL}/mentors`,
                }
              }).catch(err => console.error('Error sending mentor commission alert email:', err));
            }
          });
        } else if (student.mentorId || student.mentorName) {
          // Single mentor default
          setMentors(prev => prev.map(m => {
            if (m.id !== student.mentorId && m.name !== student.mentorName) return m;
            return {
              ...m,
              pendingPayout: (m.pendingPayout || 0) + totalPool,
              totalEarned: (m.totalEarned || 0) + totalPool,
            };
          }));

          const assignedMentor = mentors.find(m => m.id === student.mentorId || m.name === student.mentorName);
          if (assignedMentor?.email && totalPool > 0) {
            emailService.sendEmail({
              to: assignedMentor.email,
              recipientName: assignedMentor.name,
              subject: `🎉 New Commission Credited: 37% Enrollment Revenue Share (₦${totalPool.toLocaleString()})`,
              type: 'mentor_commission_earned',
              data: {
                studentName: student.name,
                program: student.program,
                tuitionPaid: res.amountNaira,
                commissionAmount: totalPool,
                newPendingPayout: (assignedMentor.pendingPayout || 0) + totalPool,
                portalUrl: `${APP_BASE_URL}/mentors`,
              }
            }).catch(err => console.error('Error sending mentor commission alert email:', err));
          }
        }

        // 3. Send Transaction Audit to Finance
        emailService.sendEmail({
          to: settings.email || 'admin@codelab.institute',
          recipientName: 'Bursary & Finance Controller',
          subject: `💰 Inbound Tuition Settlement: ${student.name} (₦${res.amountNaira.toLocaleString()})`,
          type: 'tuition_payment_alert',
          data: {
            studentName: student.name,
            studentCode: student.studentCode,
            program: student.program,
            amount: res.amountNaira,
            gateway: 'Paystack Direct Settlement',
            reference: res.reference,
            actionUrl: `${APP_BASE_URL}/invoices`,
          }
        }).catch(err => console.error('Error sending finance tuition alert email:', err));

        if (isBackendConnected) {
          try {
            await apiService.verifyPaystackPayment(res.reference, student.id, options.invoiceId, res.amountNaira);
          } catch (e) {
            console.warn('Backend Paystack verification error:', e);
          }
        }
      },
      onCancel: () => {
        showToast('Payment Cancelled', 'Paystack transaction was cancelled.', 'info');
      }
    });
  };

  const submitProofOfPayment = async (payload: { amount: number; bankName: string; referenceNumber: string; receiptProofUrl?: string; notes?: string }) => {
    if (!currentStudentProfile) return;

    showToast('Proof of Payment Uploaded', 'Your receipt has been submitted to the Bursary for verification.', 'success');

    logActivity({
      title: 'Manual Payment Proof Uploaded',
      description: `${currentStudentProfile.name} uploaded proof for ₦${payload.amount.toLocaleString()} via ${payload.bankName}.`,
      type: 'finance',
      user: currentStudentProfile.name,
    });

    // Notify Bursary & Super Admin of offline transfer verification request
    emailService.sendEmail({
      to: settings.email || 'admin@codelab.institute',
      recipientName: 'Bursary & Super Admin',
      subject: `📋 Bank Transfer POP Verification Required: ${currentStudentProfile.name} (₦${payload.amount.toLocaleString()})`,
      type: 'proof_of_payment_alert',
      data: {
        studentName: currentStudentProfile.name,
        studentCode: currentStudentProfile.studentCode,
        amount: payload.amount,
        bankRef: payload.referenceNumber,
        fileName: payload.receiptProofUrl || 'bank_transfer_slip.jpg',
        actionUrl: `${APP_BASE_URL}/invoices`,
      }
    }).catch(err => console.error('Error sending POP alert email:', err));

    if (isBackendConnected) {
      try {
        await apiService.submitProofOfPayment(currentStudentProfile.id, payload);
      } catch (e) {
        console.warn('Backend proof error:', e);
      }
    }
  };

  const [isSyncingWallet, setIsSyncingWallet] = useState<boolean>(false);

  const refreshWalletSummary = async () => {
    try {
      const summary = await apiService.getWalletSummary();
      if (summary) {
        setWallet(summary);
      }
    } catch (e) {
      console.warn('Error refreshing wallet:', e);
    }
  };

  const reconcileWalletWithPaystack = async () => {
    setIsSyncingWallet(true);
    try {
      const summary = await apiService.reconcileWallet();
      if (summary) {
        setWallet(summary);
        showToast('Wallet Reconciled', `Synchronized with Paystack live transactions. Balance: ₦${summary.balance.toLocaleString()}`, 'success');
      } else {
        await refreshWalletSummary();
      }
    } catch (e) {
      console.warn('Error reconciling wallet:', e);
      showToast('Sync Warning', 'Could not complete Paystack live reconciliation. Please check network.', 'warning');
    } finally {
      setIsSyncingWallet(false);
    }
  };

  const generateVirtualAccount = async (): Promise<VirtualAccountDetails | null> => {
    try {
      const dva = await apiService.generateVirtualAccount();
      if (dva) {
        setWallet(prev => ({
          ...prev,
          virtualAccount: dva,
        }));
        showToast('Virtual Account Generated', `Assigned ${dva.bankName} NUBAN: ${dva.accountNumber} to Expense & Budget Wallet.`, 'success');
        return dva;
      }
    } catch (e) {
      console.error('Error generating virtual account:', e);
      showToast('Error', 'Could not generate Dedicated Virtual Account', 'error');
    }
    return null;
  };

  const topUpWallet = async (amountNaira: number, reference?: string): Promise<boolean> => {
    try {
      const topupRef = reference || `CDL-WAL-TOP-${Date.now()}`;
      const updated = await apiService.verifyWalletTopUp(topupRef, amountNaira);
      if (updated) {
        setWallet(updated);
        showToast('Wallet Credited', `Successfully deposited ₦${amountNaira.toLocaleString()} into Expense & Budget Wallet!`, 'success');
        return true;
      } else {
        // Fallback for offline simulation
        setWallet(prev => {
          const newBal = prev.balance + amountNaira;
          return {
            ...prev,
            balance: newBal,
            transactions: [
              {
                id: `wtx-${Date.now()}-top`,
                type: 'credit',
                category: 'card_topup',
                amount: amountNaira,
                reference: topupRef,
                description: 'Instant Wallet Top-Up via Paystack Checkout',
                timestamp: new Date().toISOString(),
                balanceAfter: newBal,
                initiatedBy: currentUser?.name || 'Super Admin',
                channel: 'paystack_inline'
              },
              ...prev.transactions
            ]
          };
        });
        showToast('Wallet Credited (Offline)', `₦${amountNaira.toLocaleString()} credited to wallet balance.`, 'success');
        return true;
      }
    } catch (e) {
      console.error('Error topping up wallet:', e);
      showToast('Top-Up Failed', 'Unable to process wallet top-up.', 'error');
      return false;
    }
  };

  const disburseExpenseFromWallet = async (payload: {
    expenseId: string;
    bankCode: string;
    bankName: string;
    accountNumber: string;
    accountName: string;
    reason?: string;
    disbursementMethod?: 'corporate_nip' | 'paystack_api';
    nipSessionId?: string;
    bankReference?: string;
  }): Promise<boolean> => {
    const expense = expenses.find(e => e.id === payload.expenseId);
    if (!expense) return false;

    const effectiveBalance = Math.max(wallet?.balance || 0, (wallet as any)?.paystackLiveBalance || 0);
    if (effectiveBalance < expense.amount && wallet.balance < expense.amount) {
      showToast('Insufficient Wallet Balance', `Available: ${formatNaira(wallet.balance)}, Required: ${formatNaira(expense.amount)}. Please fund the wallet first.`, 'error');
      return false;
    }

    try {
      const res = await apiService.disburseExpenseFromWallet(payload);
      if (res && res.expense) {
        setExpenses(prev => prev.map(e => e.id === payload.expenseId ? res.expense : e));
        if (res.walletBalance !== undefined) {
          const isCorporateNip = payload.disbursementMethod === 'corporate_nip';
          setWallet(prev => ({
            ...prev,
            balance: res.walletBalance,
            transactions: [
              {
                id: `wtx-${Date.now()}-exp`,
                type: 'debit',
                category: 'expense_payout',
                amount: expense.amount,
                reference: res.transferRef || (payload.bankReference || payload.nipSessionId || `NIP-CORP-${Date.now()}`),
                description: `OpEx Disbursement: ${expense.title} (${expense.expenseCode})`,
                timestamp: new Date().toISOString(),
                balanceAfter: res.walletBalance,
                initiatedBy: isCorporateNip ? 'Corporate Treasury (NIP)' : (currentUser?.name || 'Finance Controller'),
                recipientName: payload.accountName,
                recipientBank: payload.bankName,
                recipientAccountNumber: payload.accountNumber,
                channel: isCorporateNip ? 'direct_corporate_nip' : 'paystack_transfer',
                disbursementMethod: isCorporateNip ? 'corporate_nip' : 'paystack_api',
                bankDeliveryStatus: (res.bankDeliveryStatus as any) || (isCorporateNip ? 'disbursed_corporate_nip' : 'processing_at_switch'),
                bankDeliveryMessage: isCorporateNip
                  ? `Disbursed directly via Corporate Bank Account (NIP settlement).` + (payload.nipSessionId ? ` NIP Session ID: ${payload.nipSessionId}` : '')
                  : 'Transfer initiated with Paystack switch; awaiting NIP delivery confirmation.',
                nipSessionId: payload.nipSessionId || payload.bankReference,
                lastBankCheckAt: new Date().toISOString()
              },
              ...prev.transactions
            ]
          }));
        }
        const methodLabel = payload.disbursementMethod === 'corporate_nip' ? 'Corporate Bank (NIP)' : 'Paystack API';
        showToast('Expense Disbursed', `₦${expense.amount.toLocaleString()} disbursed via ${methodLabel} to ${payload.accountName} (${payload.bankName})!`, 'success');
        return true;
      } else {
        const errMsg = (res as any)?.message || 'Failed to disburse expense from wallet. Please verify your balance and banking details.';
        showToast('Disbursement Failed', errMsg, 'error');
        return false;
      }
    } catch (e: any) {
      console.error('Error disbursing expense:', e);
      showToast('Disbursement Error', e.message || 'Failed to disburse expense from wallet', 'error');
      return false;
    }
  };

  const verifyBankTransferStatus = async (reference: string): Promise<WalletTransaction | null> => {
    try {
      const res = await apiService.verifyBankTransferStatus(reference);
      if (res && res.transaction) {
        setWallet(prev => ({
          ...prev,
          transactions: prev.transactions.map(t => (t.reference === reference || t.id === reference) ? { ...t, ...res.transaction } : t)
        }));
        if (res.verified) {
          showToast('Bank Status Verified', res.bankDeliveryMessage || 'Delivery confirmed by interbank settlement switch.', 'success');
        } else if (res.isSimulated) {
          showToast('Simulation Record', res.bankDeliveryMessage || 'Local simulation transaction (not sent to bank).', 'info');
        } else {
          showToast('Bank Status Pending', res.bankDeliveryMessage || 'In progress at central switch.', 'info');
        }
        return res.transaction;
      } else if (res && res.bankDeliveryMessage) {
        showToast(res.verified ? 'Bank Status Verified' : 'Bank Status', res.bankDeliveryMessage, res.verified ? 'success' : 'info');
      }
      return null;
    } catch (e: any) {
      console.error('Error verifying bank transfer status:', e);
      showToast('Verification Error', e.message || 'Could not verify bank transfer status.', 'error');
      return null;
    }
  };

  const disburseMentorFromWallet = async (mentorId: string, amount: number, reason?: string, payoutRequestId?: string): Promise<boolean> => {
    const mentor = mentors.find(m => m.id === mentorId);
    if (!mentor) return false;

    // Check minimum required lectured hours threshold
    const minRequired = mentor.minimumRequiredHours ?? settings.mentorMinimumLecturedHours ?? 20;
    const actualHours = mentor.lecturedHours ?? 0;
    if (actualHours < minRequired) {
      showToast(
        'Payout Locked',
        `Faculty member has logged ${actualHours} lectured hours. A minimum of ${minRequired} lectured hours is strictly required before payout eligibility.`,
        'error'
      );
      return false;
    }

    const effectiveBal = Math.max(wallet?.balance || 0, (wallet as any)?.paystackLiveBalance || 0);
    if (effectiveBal < amount && wallet.balance < amount) {
      showToast('Insufficient Wallet Balance', `Available: ${formatNaira(wallet.balance)}, Required: ${formatNaira(amount)}. Please fund the wallet before paying mentors.`, 'error');
      return false;
    }

    try {
      const res = await apiService.disburseMentorFromWallet(mentorId, amount, reason, payoutRequestId);
      if (res && res.mentor) {
        setMentors(prev => prev.map(m => m.id === mentorId ? res.mentor : m));
        if (payoutRequestId) {
          setPayoutRequests(prev => prev.map(r => r.id === payoutRequestId ? {
            ...r,
            status: 'Disbursed',
            disbursedAt: new Date().toISOString(),
            disburseReference: res.transferRef || `NIP-CDL-${Date.now()}`,
            whtRatePercent: r.whtRatePercent || 5,
            whtDeductedAmount: r.whtDeductedAmount || Math.round(r.amount * 0.05),
            netDisbursedAmount: r.netDisbursedAmount || Math.round(r.amount * 0.95),
            voucherNumber: r.voucherNumber || `VCHR-CDL-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
          } : r));
        }
        if (res.walletBalance !== undefined) {
          setWallet(prev => ({
            ...prev,
            balance: res.walletBalance,
            transactions: [
              {
                id: `wtx-${Date.now()}-men`,
                type: 'debit',
                category: 'mentor_payout',
                amount,
                reference: res.transferRef || `TRF-MEN-${Date.now()}`,
                description: `37% Commission Share Disbursement to ${mentor.name}`,
                timestamp: new Date().toISOString(),
                balanceAfter: res.walletBalance,
                initiatedBy: currentUser?.name || 'Finance Controller',
                recipientName: mentor.accountName || mentor.name,
                recipientBank: mentor.bankName,
                recipientAccountNumber: mentor.accountNumber,
                channel: 'paystack_transfer'
              },
              ...prev.transactions
            ]
          }));
        }
        showToast('Disbursement Completed', `₦${amount.toLocaleString()} disbursed from Expense Wallet to ${mentor.name} (${mentor.bankName} - ${mentor.accountNumber})!`, 'success');
        return true;
      } else {
        // Fallback simulation
        const newBal = Math.max(0, wallet.balance - amount);
        const trfRef = `TRF-MEN-${Date.now()}`;
        setMentors(prev => prev.map(m => m.id === mentorId ? {
          ...m,
          pendingPayout: Math.max(0, (m.pendingPayout || 0) - amount),
          paidPayout: (m.paidPayout || 0) + amount,
        } : m));
        if (payoutRequestId) {
          setPayoutRequests(prev => prev.map(r => r.id === payoutRequestId ? {
            ...r,
            status: 'Disbursed',
            disbursedAt: new Date().toISOString(),
            disburseReference: trfRef,
            whtRatePercent: r.whtRatePercent || 5,
            whtDeductedAmount: r.whtDeductedAmount || Math.round(r.amount * 0.05),
            netDisbursedAmount: r.netDisbursedAmount || Math.round(r.amount * 0.95),
            voucherNumber: r.voucherNumber || `VCHR-CDL-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
          } : r));
        }
        setWallet(prev => ({
          ...prev,
          balance: newBal,
          transactions: [
            {
              id: `wtx-${Date.now()}-men`,
              type: 'debit',
              category: 'mentor_payout',
              amount,
              reference: trfRef,
              description: `37% Commission Share Disbursement to ${mentor.name}`,
              timestamp: new Date().toISOString(),
              balanceAfter: newBal,
              initiatedBy: currentUser?.name || 'Finance Controller',
              recipientName: mentor.accountName || mentor.name,
              recipientBank: mentor.bankName,
              recipientAccountNumber: mentor.accountNumber,
              channel: 'paystack_transfer'
            },
            ...prev.transactions
          ]
        }));
        showToast('Disbursement Completed', `₦${amount.toLocaleString()} disbursed to ${mentor.name}!`, 'success');
        return true;
      }
    } catch (e: any) {
      console.error('Error disbursing mentor share:', e);
      showToast('Disbursement Error', e.message || 'Failed to disburse mentor share', 'error');
      return false;
    }
  };

  const calculateMentorTuitionCommission = (mentorId: string) => {
    const targetMentor = mentors.find(m => m.id === mentorId);
    if (!targetMentor) {
      return { totalTuitionPool: 0, totalCommission: 0, courseBreakdown: [] };
    }

    let totalPool = 0;
    let totalComm = 0;
    const breakdown: Array<{
      courseId: string;
      courseCode: string;
      courseTitle: string;
      role: string;
      sharePercentage: number;
      enrolledStudentsCount: number;
      totalTuitionPaid: number;
      courseFacultyPool: number;
      mentorCommission: number;
    }> = [];

    courses.forEach(course => {
      const assigned = course.assignedMentors?.find(
        am => am.mentorId === targetMentor.id || am.mentorName?.toLowerCase() === targetMentor.name?.toLowerCase()
      );
      const isLead = course.leadInstructor?.toLowerCase() === targetMentor.name?.toLowerCase();

      if (assigned || isLead) {
        const sharePercentage = assigned ? assigned.sharePercentage : 100;
        const role = assigned?.role || (isLead ? 'Lead Mentor' : 'Co-Mentor');

        const enrolled = students.filter(
          s => s.courses?.some(ec => ec.id === course.id || ec.code === course.code || ec.name?.toLowerCase() === course.title?.toLowerCase()) || s.program?.toLowerCase() === course.title?.toLowerCase()
        );

        const totalTuitionPaid = enrolled.reduce((sum, s) => {
          const paid = s.paidAmount ?? (s.totalFees - (s.outstandingBalance || 0));
          return sum + (paid > 0 ? paid : 0);
        }, 0);

        const courseFacultyPool = totalTuitionPaid * 0.37;
        const mentorCommission = Math.round(courseFacultyPool * (sharePercentage / 100));

        totalPool += totalTuitionPaid;
        totalComm += mentorCommission;

        breakdown.push({
          courseId: course.id,
          courseCode: course.code,
          courseTitle: course.title,
          role,
          sharePercentage,
          enrolledStudentsCount: enrolled.length,
          totalTuitionPaid,
          courseFacultyPool,
          mentorCommission,
        });
      }
    });

    return {
      totalTuitionPool: totalPool,
      totalCommission: totalComm,
      courseBreakdown: breakdown,
    };
  };

  const requestMentorPayout = async (amount: number, notes?: string): Promise<{ success: boolean; message: string }> => {
    const myMentorProfile = mentors.find(
      m => m.id === currentUser?.mentorId || m.name === currentUser?.name || m.email === currentUser?.email
    );
    if (!myMentorProfile) {
      return { success: false, message: 'Mentor profile not found.' };
    }

    const minRequired = myMentorProfile.minimumRequiredHours ?? settings.mentorMinimumLecturedHours ?? 20;
    const actualHours = myMentorProfile.lecturedHours ?? 0;
    if (actualHours < minRequired) {
      return {
        success: false,
        message: `Ineligible: You have logged ${actualHours.toFixed(1)}h of lecturing. A minimum threshold of ${minRequired}h is strictly required before payout eligibility.`
      };
    }

    const calcResult = calculateMentorTuitionCommission(myMentorProfile.id);
    const effectiveAvailable = Math.max(calcResult.totalCommission, myMentorProfile.pendingPayout || 0);

    const reqAmount = Number(amount) || effectiveAvailable || 0;
    if (reqAmount <= 0) {
      return { success: false, message: 'Requested payout amount must be greater than ₦0.' };
    }

    if (reqAmount > effectiveAvailable) {
      return { 
        success: false, 
        message: `Requested amount (${formatNaira(reqAmount)}) exceeds your available balance of ${formatNaira(effectiveAvailable)}.` 
      };
    }

    const whtRatePercent = 5;
    const whtDeductedAmount = Math.round(reqAmount * (whtRatePercent / 100));
    const netDisbursedAmount = reqAmount - whtDeductedAmount;
    const voucherNumber = `VCHR-CDL-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newReq: MentorPayoutRequest = {
      id: `req-${Date.now()}`,
      mentorId: myMentorProfile.id,
      mentorName: myMentorProfile.name,
      mentorEmail: myMentorProfile.email,
      amount: reqAmount,
      whtRatePercent,
      whtDeductedAmount,
      netDisbursedAmount,
      voucherNumber,
      lecturedHours: actualHours,
      minimumRequiredHours: minRequired,
      bankName: myMentorProfile.bankName || 'Guaranty Trust Bank (GTBank)',
      accountNumber: myMentorProfile.accountNumber || '0123456789',
      accountName: myMentorProfile.accountName || myMentorProfile.name,
      bankCode: myMentorProfile.bankCode || '058',
      status: 'Pending',
      requestedAt: new Date().toISOString(),
      notes: notes || '',
    };

    setPayoutRequests(prev => [newReq, ...prev]);

    if (isBackendConnected) {
      try {
        await apiService.createPayoutRequest({
          mentorId: myMentorProfile.id,
          amount: reqAmount,
          notes,
        });
      } catch (e) {
        console.warn('Backend sync failed for payout request:', e);
      }
    }

    showToast('Payout Requested', `Payout request for ${formatNaira(reqAmount)} submitted to Finance.`, 'success');
    addNotification({
      title: '💵 Faculty Payout Request Submitted',
      message: `${myMentorProfile.name} requested ${formatNaira(reqAmount)} (${actualHours.toFixed(1)}h logged).`,
      type: 'mentor',
      link: '/mentors',
    });
    logActivity({
      title: 'Mentor Payout Requested',
      description: `${myMentorProfile.name} submitted a commission payout request of ${formatNaira(reqAmount)}.`,
      type: 'mentor',
      user: myMentorProfile.name,
    });

    return { success: true, message: 'Payout request successfully submitted.' };
  };

  const reviewMentorPayout = async (requestId: string, status: 'Approved' | 'Rejected', reason?: string): Promise<boolean> => {
    setPayoutRequests(prev => prev.map(r => r.id === requestId ? {
      ...r,
      status,
      reviewedAt: new Date().toISOString(),
      reviewedBy: currentUser?.name || 'Super Admin',
      rejectionReason: reason,
    } : r));

    if (isBackendConnected) {
      try {
        await apiService.updatePayoutRequest(requestId, {
          status,
          reviewedAt: new Date().toISOString(),
          reviewedBy: currentUser?.name || 'Super Admin',
          rejectionReason: reason,
        });
      } catch (e) {
        console.warn('Backend sync failed for payout review:', e);
      }
    }

    showToast('Payout Request Updated', `Request marked as ${status}.`, 'info');
    return true;
  };

  const updateMentorPayoutRequest = async (requestId: string, payload: Partial<MentorPayoutRequest>): Promise<boolean> => {
    try {
      const res = await fetch(`/api/payout-requests/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success && data.data) {
        const updated = data.data;
        setPayoutRequests(prev => prev.map(r => r.id === requestId ? updated : r));
        showToast('Payout Request Updated', `Request has been updated (${formatNaira(updated.amount)}).`, 'success');
        logActivity({
          title: 'Payout Request Updated',
          description: `Payout request ${requestId} details updated (Amount: ${formatNaira(updated.amount)}).`,
          type: 'mentor',
          user: currentUser?.name || 'User',
        });
        return true;
      } else {
        const whtRate = 5;
        setPayoutRequests(prev => prev.map(r => {
          if (r.id !== requestId) return r;
          const nextAmount = payload.amount !== undefined ? Number(payload.amount) : r.amount;
          const nextWht = Math.round(nextAmount * (whtRate / 100));
          return {
            ...r,
            ...payload,
            amount: nextAmount,
            whtDeductedAmount: nextWht,
            netDisbursedAmount: nextAmount - nextWht,
          };
        }));
        showToast('Payout Request Updated', 'Request updated locally.', 'success');
        return true;
      }
    } catch (e: any) {
      showToast('Error', e.message || 'Failed to update payout request', 'error');
      return false;
    }
  };

  const forwardChatMessage = async (targetConversationId: string, message: ChatMessage): Promise<boolean> => {
    if (!currentUser) {
      showToast('Error', 'You must be logged in to forward messages.', 'error');
      return false;
    }
    try {
      const res = await fetch(`/api/chat/conversations/${targetConversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: currentUser.id,
          senderName: currentUser.name,
          senderRole: currentUser.role,
          senderEmail: currentUser.email,
          content: message.content || '',
          attachments: message.attachments || [],
          messageType: message.messageType || 'text',
          forwardedFrom: {
            originalSenderName: message.senderName || 'Anonymous',
            originalSenderId: message.senderId,
            originalTimestamp: message.timestamp || new Date().toISOString(),
          },
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Message Forwarded', 'Message was forwarded successfully.', 'success');
        refreshUnreadChatCount();
        return true;
      } else {
        showToast('Forward Failed', data.error || 'Failed to forward message.', 'error');
        return false;
      }
    } catch (e: any) {
      showToast('Network Error', e.message || 'Could not forward message.', 'error');
      return false;
    }
  };

  const editChatMessage = async (messageId: string, content: string): Promise<boolean> => {
    if (!content.trim()) {
      showToast('Validation Error', 'Message cannot be empty.', 'warning');
      return false;
    }
    try {
      const res = await fetch(`/api/chat/messages/${messageId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Updated', 'Message edited successfully.', 'success');
        return true;
      } else {
        showToast('Edit Failed', data.error || 'Could not edit message.', 'error');
        return false;
      }
    } catch (e: any) {
      showToast('Network Error', e.message || 'Could not update message.', 'error');
      return false;
    }
  };

  const deleteChatMessage = async (messageId: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/chat/messages/${messageId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser?.id,
          userRole: currentUser?.role,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Message Deleted', 'Message has been removed.', 'success');
        return true;
      } else {
        showToast('Delete Failed', data.error || 'Could not delete message.', 'error');
        return false;
      }
    } catch (e: any) {
      showToast('Network Error', e.message || 'Could not delete message.', 'error');
      return false;
    }
  };

  const fetchTodayStandup = useCallback(async () => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/scrum/standup/today?userId=${encodeURIComponent(currentUser.id)}`);
      const data = await res.json();
      if (data.success) {
        setTodayStandup(data.data);
      }
    } catch (e) {
      console.warn('Could not fetch today standup:', e);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      fetchTodayStandup();
    }
  }, [currentUser, fetchTodayStandup]);

  const submitDailyStandup = async (data: {
    tasksYesterday: DailyStandupTask[];
    tasksToday: DailyStandupTask[];
    blockers: string[];
    taggedModuleIds: string[];
  }): Promise<boolean> => {
    if (!currentUser) {
      showToast('Error', 'Please sign in to submit your daily standup.', 'error');
      return false;
    }
    try {
      const res = await fetch('/api/scrum/standup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          userName: currentUser.name,
          userRole: currentUser.role,
          userEmail: currentUser.email,
          ...data,
        }),
      });
      const resData = await res.json();
      if (resData.success && resData.data) {
        setTodayStandup(resData.data);
        setDailyStandups(prev => [resData.data, ...prev.filter(s => s.id !== resData.data.id)]);
        showToast(
          resData.updated ? 'Standup Updated 🚀' : 'Standup Logged 🚀',
          resData.updated ? 'Your daily commitments and task statuses have been updated!' : 'Your daily scrum updates and AI feedback have been recorded!',
          'success'
        );
        logActivity({
          title: resData.updated ? 'Daily Standup Updated' : 'Daily Standup Submitted',
          description: `${currentUser.name} ${resData.updated ? 'updated tasks and commitments in daily standup' : 'completed daily scrum standup with AI evaluation'}.`,
          type: 'system',
          user: currentUser.name,
        });
        return true;
      } else {
        showToast('Submission Failed', resData.error || 'Failed to submit standup.', 'error');
        return false;
      }
    } catch (e: any) {
      showToast('Network Error', e.message || 'Failed to submit standup.', 'error');
      return false;
    }
  };

  const triggerStandupReminders = async (): Promise<{ success: boolean; remindersSent: number } | null> => {
    try {
      const res = await fetch('/api/scrum/trigger-standup-reminders', { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        showToast(
          'Reminders Dispatched ⏱️',
          json.message || `Dispatched ${json.data?.remindersSent || 0} standup reminders.`,
          'info'
        );
        return { success: true, remindersSent: json.data?.remindersSent || 0 };
      }
      return null;
    } catch (e: any) {
      showToast('Error', e.message || 'Failed to trigger standup reminders', 'error');
      return null;
    }
  };

  const generateWeeklyScrumEvaluation = async (userId?: string): Promise<WeeklyScrumPerformance | null> => {
    const targetUserId = userId || currentUser?.id;
    if (!targetUserId) {
      showToast('Error', 'User ID required for weekly evaluation.', 'error');
      return null;
    }
    try {
      const res = await fetch('/api/scrum/weekly-evaluation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: targetUserId }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setWeeklyScrumReports(prev => [data.data, ...prev.filter(r => r.id !== data.data.id)]);
        showToast('Weekly Scrum Evaluated', `Evaluation complete: ${data.data.velocityScore}% velocity rating.`, 'success');
        return data.data;
      } else {
        showToast('Evaluation Error', data.error || 'Could not generate weekly evaluation.', 'error');
        return null;
      }
    } catch (e: any) {
      showToast('Network Error', e.message || 'Failed to generate weekly evaluation.', 'error');
      return null;
    }
  };

  const updateWalletBudgetLimit = async (limit: number) => {
    try {
      const res = await apiService.updateBudgetLimit(limit);
      if (res) {
        setWallet(res);
      } else {
        setWallet(prev => ({ ...prev, monthlyBudgetLimit: limit }));
      }
      setSettings(prev => ({ ...prev, operatingBudget: limit }));
      showToast('Budget Limit Updated', `Monthly budget limit updated to ${formatNaira(limit)}.`, 'success');
    } catch (e) {
      setWallet(prev => ({ ...prev, monthlyBudgetLimit: limit }));
    }
  };

  const disburseMentorPayout = async (mentorId: string, amount: number, reason?: string) => {
    await disburseMentorFromWallet(mentorId, amount, reason);
  };


  const calculatePerformanceTier = (score: number): 'Exceeding' | 'On Track' | 'Needs Support' | 'At Risk' => {
    if (score >= 90) return 'Exceeding';
    if (score >= 75) return 'On Track';
    if (score >= 60) return 'Needs Support';
    return 'At Risk';
  };

  const markSessionAttendance = async (sessionId: string, status: 'Attended' | 'Absent', hoursCredited?: number) => {
    const session = sessions.find(s => s.id === sessionId);
    if (!session) return;

    const hours = Number(hoursCredited ?? session.durationHours ?? 2);
    const prevStatus = session.studentAttendance;

    setSessions(prev => prev.map(s => {
      if (s.id !== sessionId) return s;
      return {
        ...s,
        studentAttendance: status,
        attendanceMarkedAt: new Date().toISOString(),
        attendanceMarkedBy: currentUser?.name || 'Faculty Mentor',
        hoursCredited: hours
      };
    }));

    // Update student hours
    setStudents(prev => prev.map(st => {
      if (st.id === session.studentId || st.name === session.studentName) {
        let currentHours = st.attendedLearningHours || 0;
        if (status === 'Attended' && prevStatus !== 'Attended') {
          currentHours += hours;
        } else if (status === 'Absent' && prevStatus === 'Attended') {
          currentHours = Math.max(0, currentHours - hours);
        }
        return {
          ...st,
          attendedLearningHours: currentHours
        };
      }
      return st;
    }));

    showToast(
      'Attendance Marked',
      `Marked ${session.studentName} as ${status} (${hours} learning hours credited).`,
      status === 'Attended' ? 'success' : 'info'
    );

    logActivity({
      title: `Session Attendance: ${status}`,
      description: `${currentUser?.name || 'Mentor'} marked ${session.studentName} as ${status} for "${session.topic}".`,
      type: 'mentor',
      user: currentUser?.name || 'Mentor'
    });

    if (isBackendConnected) {
      try {
        await apiService.markSessionAttendance(sessionId, {
          status,
          hoursCredited: hours,
          markedBy: currentUser?.name || 'Faculty Mentor'
        });
      } catch (e) {
        console.warn('Backend attendance error:', e);
      }
    }
  };

  const submitStudentPerformanceReport = async (reportData: Omit<StudentPerformanceReport, 'id' | 'reportCode' | 'submittedAt'>) => {
    const newReport: StudentPerformanceReport = {
      ...reportData,
      id: `rep-${Date.now()}`,
      reportCode: `REP-CDL-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      submittedAt: new Date().toISOString(),
      managementFollowUpStatus: reportData.managementFollowUpStatus || 'Pending Review'
    };

    setStudentPerformanceReports(prev => [newReport, ...prev]);

    // Update student score, tier and welfare notes
    setStudents(prev => prev.map(s => {
      if (s.id === newReport.studentId || s.name === newReport.studentName) {
        return {
          ...s,
          performanceScore: newReport.performanceScore,
          performanceTier: newReport.performanceTier,
          welfareNotes: newReport.welfareObservations
        };
      }
      return s;
    }));

    showToast(
      'Performance Evaluation Filed',
      `Submitted evaluation for ${newReport.studentName} (${newReport.performanceScore}% - ${newReport.performanceTier}). Dispatched to Admissions & Leadership.`,
      'success'
    );

    logActivity({
      title: `Mentor Evaluation: ${newReport.studentName}`,
      description: `${newReport.mentorName} filed performance report for ${newReport.studentName} (Tier: ${newReport.performanceTier}).`,
      type: 'mentor',
      user: newReport.mentorName
    });

    if (isBackendConnected) {
      try {
        await apiService.submitStudentPerformanceReport(newReport);
      } catch (e) {
        console.warn('Backend submit report error:', e);
      }
    }
  };

  const updateReportFollowUpStatus = async (reportId: string, status: 'Pending Review' | 'In Progress' | 'Resolved', notes?: string) => {
    setStudentPerformanceReports(prev => prev.map(r => {
      if (r.id !== reportId) return r;
      return {
        ...r,
        managementFollowUpStatus: status,
        managementNotes: notes !== undefined ? notes : r.managementNotes,
        reviewedBy: currentUser?.name || 'Management',
        reviewedAt: new Date().toISOString()
      };
    }));

    showToast('Report Status Updated', `Evaluation follow-up status updated to "${status}".`, 'info');

    if (isBackendConnected) {
      try {
        await apiService.updateReportFollowUpStatus(reportId, {
          status,
          managementNotes: notes,
          reviewedBy: currentUser?.name || 'Management'
        });
      } catch (e) {
        console.warn('Backend update report status error:', e);
      }
    }
  };

  const issueCertificate = async (studentId: string): Promise<{ success: boolean; certificateNumber?: string; message?: string }> => {
    const student = students.find(s => s.id === studentId || s.studentCode === studentId);
    if (!student) {
      showToast('Error', 'Student record not found.', 'error');
      return { success: false, message: 'Student record not found.' };
    }

    const minHours = student.minimumRequiredHours || settings.defaultMinimumLearningHours || 40;
    const attendedHours = student.attendedLearningHours || 0;

    if (attendedHours < minHours) {
      const remaining = minHours - attendedHours;
      const msg = `Student has completed ${attendedHours}/${minHours} required learning hours. ${remaining} more session hour(s) required prior to graduation certificate issuance.`;
      showToast('Graduation Requirement Unmet', msg, 'error');
      return { success: false, message: msg };
    }

    if ((student.progressPercent || 0) < 100) {
      const msg = `Student has only completed ${student.progressPercent || 0}% of curriculum modules. 100% completion required for graduation certificate.`;
      showToast('Curriculum Incomplete', msg, 'error');
      return { success: false, message: msg };
    }

    const certNumber = `CERT-CDL-${new Date().getFullYear()}-${student.studentCode?.replace(/\D/g, '') || Math.floor(1000 + Math.random() * 9000)}`;

    setStudents(prev => prev.map(s => {
      if (s.id !== student.id) return s;
      return {
        ...s,
        certificateIssued: true,
        certificateNumber: certNumber,
        certificateIssuedAt: new Date().toISOString()
      };
    }));

    showToast('Certificate Issued!', `Official Certificate #${certNumber} generated for ${student.name}.`, 'success');

    logActivity({
      title: 'Certificate Issued',
      description: `Official Certificate #${certNumber} issued to ${student.name} (${student.program}).`,
      type: 'student',
      user: currentUser?.name || 'Academic Board'
    });

    if (isBackendConnected) {
      try {
        await apiService.issueStudentCertificate(student.id);
      } catch (e) {
        console.warn('Backend issue certificate error:', e);
      }
    }

    return { success: true, certificateNumber: certNumber };
  };

  // ----------------------------------------------------
  // Academic Timetable & Scheduling Actions
  // ----------------------------------------------------
  const scheduleClass = async (slotData: Omit<TimetableSlot, 'id' | 'createdAt' | 'attendanceMarked' | 'attendanceRecords'>) => {
    const newSlot: TimetableSlot = {
      ...slotData,
      id: `slot-${Date.now()}`,
      createdAt: new Date().toISOString(),
      attendanceMarked: false,
      attendanceRecords: [],
      status: 'Scheduled',
    };

    setTimetables(prev => [newSlot, ...prev]);

    if (isBackendConnected) {
      try {
        await apiService.createTimetable(newSlot);
      } catch (err) {
        console.warn('Backend timetable create error:', err);
      }
    }

    addNotification({
      title: 'Class Scheduled on Timetable',
      message: `${newSlot.courseTitle} (${newSlot.cohortName}): "${newSlot.topic}" on ${newSlot.date} at ${newSlot.startTime}.`,
      type: 'mentor',
      link: '/courses',
    });

    showToast(
      'Class Scheduled',
      `Class "${newSlot.topic}" on ${newSlot.date} (${newSlot.startTime}) scheduled with ${newSlot.mentorName}.`,
      'success'
    );

    logActivity({
      title: 'Class Scheduled',
      description: `${newSlot.courseTitle} class scheduled by ${currentUser?.name || 'Academic Office'}.`,
      type: 'mentor',
      user: currentUser?.name || 'Program Officer',
    });
  };

  const updateTimetableSlot = async (id: string, updates: Partial<TimetableSlot>) => {
    setTimetables(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
    if (isBackendConnected) {
      try {
        await apiService.updateTimetable(id, updates);
      } catch (err) {
        console.warn('Backend timetable update error:', err);
      }
    }
    showToast('Timetable Updated', 'Class slot details successfully updated.', 'info');
  };

  const deleteTimetableSlot = async (id: string) => {
    setTimetables(prev => prev.filter(s => s.id !== id));
    if (isBackendConnected) {
      try {
        await apiService.deleteTimetable(id);
      } catch (err) {
        console.warn('Backend timetable delete error:', err);
      }
    }
    showToast('Class Removed', 'Timetable slot removed from schedule.', 'info');
  };

  const markClassAttendance = async (
    slotId: string, 
    attendanceRecords: { studentId: string; studentName: string; studentCode?: string; status: 'Attended' | 'Absent' }[], 
    notes?: string
  ) => {
    const slot = timetables.find(s => s.id === slotId);
    if (!slot) return;

    const duration = slot.durationHours || 2;
    const now = new Date().toISOString();

    const formattedRecords = attendanceRecords.map(rec => ({
      ...rec,
      markedAt: now,
      hoursCredited: rec.status === 'Attended' ? duration : 0,
    }));

    // Update timetable slot
    setTimetables(prev => prev.map(s => {
      if (s.id !== slotId) return s;
      return {
        ...s,
        status: 'Completed',
        attendanceMarked: true,
        attendanceRecords: formattedRecords,
        notes: notes || s.notes,
      };
    }));

    // Credit student learning hours
    const attendedStudentIds = new Set(
      attendanceRecords.filter(r => r.status === 'Attended').map(r => r.studentId)
    );

    setStudents(prev => prev.map(st => {
      if (attendedStudentIds.has(st.id) || (st.studentCode && attendedStudentIds.has(st.studentCode))) {
        return {
          ...st,
          attendedLearningHours: (st.attendedLearningHours || 0) + duration,
        };
      }
      return st;
    }));

    // Credit faculty mentor lecturing hours
    if (slot.mentorId) {
      setMentors(prev => prev.map(m => {
        if (m.id === slot.mentorId || m.name === slot.mentorName) {
          return {
            ...m,
            lecturedHours: (m.lecturedHours || 0) + duration,
          };
        }
        return m;
      }));
    }

    if (isBackendConnected) {
      try {
        await apiService.submitClassAttendance(slotId, { attendanceRecords: formattedRecords, notes });
      } catch (err) {
        console.warn('Backend class attendance error:', err);
      }
    }

    showToast(
      'Attendance Logged',
      `Class attendance finalized. ${attendedStudentIds.size} student(s) and faculty credited with ${duration} hours.`,
      'success'
    );

    logActivity({
      title: 'Class Attendance Finalized',
      description: `Attendance taken for ${slot.courseTitle}: "${slot.topic}". ${attendedStudentIds.size} scholars credited.`,
      type: 'mentor',
      user: currentUser?.name || 'Faculty Mentor',
    });
  };

  const attachTimetableRecording = async (payload: {
    slotId: string;
    recordingUrl: string;
    recordingNotes?: string;
    aiTranscriptSummary?: any;
    syncToLmsLesson?: boolean;
    lessonId?: string;
  }) => {
    const { slotId, recordingUrl, recordingNotes, aiTranscriptSummary, syncToLmsLesson, lessonId } = payload;
    const targetSlot = timetables.find(s => s.id === slotId);

    setTimetables(prev => prev.map(s => {
      if (s.id !== slotId) return s;
      return {
        ...s,
        recordingUrl,
        recordingNotes: recordingNotes !== undefined ? recordingNotes : s.recordingNotes,
        aiTranscriptSummary: aiTranscriptSummary !== undefined ? aiTranscriptSummary : s.aiTranscriptSummary,
      };
    }));

    if (syncToLmsLesson) {
      setLmsModules(prev => prev.map(mod => ({
        ...mod,
        lessons: mod.lessons.map(l => {
          const match = (lessonId && l.id === lessonId) || (!lessonId && targetSlot && (l.title === targetSlot.topic || targetSlot.topic.includes(l.title) || l.title.includes(targetSlot.topic)));
          if (match) {
            return {
              ...l,
              videoUrl: recordingUrl,
              recordingSlotId: slotId,
              recordingDate: targetSlot?.date,
              aiSummaryMarkdown: aiTranscriptSummary?.overview || recordingNotes || l.aiSummaryMarkdown,
            };
          }
          return l;
        }),
      })));
    }

    if (isBackendConnected) {
      try {
        const res = await apiService.attachTimetableRecording(slotId, {
          recordingUrl,
          recordingNotes,
          aiTranscriptSummary,
          syncToLmsLesson,
          lessonId,
        });
        if (res && res.data?.slot) {
          setTimetables(prev => prev.map(s => s.id === slotId ? res.data.slot : s));
        }
      } catch (e) {
        console.warn('Backend attach recording error:', e);
      }
    }

    showToast('Recording Attached', 'Class lecture replay link successfully updated!', 'success');
  };

  const createSipcoreMeeting = async (meetingParams: {
    title: string;
    description?: string;
    createdByExtension?: string;
    participantExtensions?: string[];
    externalParticipants?: { name: string; email: string }[];
    isInstant?: boolean;
    startDateTime?: string;
    endDateTime?: string;
    isRecorded?: boolean;
    enableAiNotetaker?: boolean;
    allowGuestJoin?: boolean;
  }) => {
    try {
      const res: any = await apiService.createSipcoreMeeting(meetingParams);
      // apiService unwraps json.data if present; resolve either shape gracefully
      const meetingObj = (res && res.data) ? res.data : res;
      if (meetingObj && (meetingObj.joinUrl || meetingObj.publicMeetingCode || (meetingObj.success && meetingObj.meetingId))) {
        return meetingObj;
      }
      throw new Error(res?.message || meetingObj?.message || 'Could not provision SIPCore meeting');
    } catch (err: any) {
      console.error('SIPCore meeting creation failed:', err);
      showToast('SIPCore Error', err.message || 'Failed to create SIPCore room', 'error');
      return null;
    }
  };

  // ----------------------------------------------------
  // Course Outline Teaching & Program Officer Approval Gateway
  // ----------------------------------------------------
  const markTopicAsTaught = async (lessonId: string, notes?: string) => {
    const mentorName = currentUser?.name || 'Faculty Mentor';
    const now = new Date().toISOString();

    setLmsModules(prev => prev.map(mod => ({
      ...mod,
      lessons: mod.lessons.map(les => {
        if (les.id !== lessonId) return les;
        return {
          ...les,
          completedByMentor: true,
          completedByMentorName: mentorName,
          completedByMentorAt: now,
          completionNotes: notes || '',
          approvalStatus: 'Taught (Pending PO Approval)',
        };
      })
    })));

    if (isBackendConnected) {
      try {
        await apiService.markTopicTaught(lessonId, {
          mentorId: currentUser?.id || '',
          mentorName,
          notes,
        });
      } catch (err) {
        console.warn('Backend mark topic taught error:', err);
      }
    }

    addNotification({
      title: 'Syllabus Topic Taught — Pending Approval',
      message: `${mentorName} marked topic as completed. Awaiting Program Officer verification.`,
      type: 'mentor',
      link: '/courses',
    });

    showToast(
      'Topic Marked as Taught',
      'Submitted to Academic Program Officer for verification and student syllabus sync.',
      'success'
    );

    logActivity({
      title: 'Topic Taught (Pending PO)',
      description: `${mentorName} marked lesson #${lessonId} as taught.`,
      type: 'mentor',
      user: mentorName,
    });
  };

  const approveTopicByProgramOfficer = async (lessonId: string, courseTitle?: string) => {
    const poName = currentUser?.name || 'Academic Program Officer';
    const now = new Date().toISOString();

    let targetCourseTitle = courseTitle;

    setLmsModules(prev => prev.map(mod => {
      const hasLesson = mod.lessons.some(l => l.id === lessonId);
      if (hasLesson && !targetCourseTitle) {
        targetCourseTitle = mod.courseTitle;
      }
      return {
        ...mod,
        lessons: mod.lessons.map(les => {
          if (les.id !== lessonId) return les;
          return {
            ...les,
            approvedByProgramOfficer: true,
            approvedByProgramOfficerName: poName,
            approvedAt: now,
            approvalStatus: 'Approved & Published',
          };
        })
      };
    }));

    // Update syllabus progress for enrolled students
    const totalLessons = lmsModules.reduce(
      (acc, m) => acc + (m.lessons?.length || 0),
      0
    ) || 1;

    setStudents(prev => prev.map(st => {
      const isEnrolled = !targetCourseTitle || st.program === targetCourseTitle || st.courses?.some(c => c.name === targetCourseTitle);
      if (!isEnrolled) return st;

      const currentCompleted = st.completedLessonIds || [];
      if (!currentCompleted.includes(lessonId)) {
        const nextCompleted = [...currentCompleted, lessonId];
        return {
          ...st,
          completedLessonIds: nextCompleted,
          progressPercent: Math.min(100, Math.round((nextCompleted.length / totalLessons) * 100)),
        };
      }
      return st;
    }));

    if (isBackendConnected) {
      try {
        await apiService.approveTopicByPO(lessonId, {
          approvedBy: currentUser?.id || '',
          approvedByName: poName,
          courseTitle: targetCourseTitle,
        });
      } catch (err) {
        console.warn('Backend approve topic error:', err);
      }
    }

    addNotification({
      title: 'Syllabus Topic Approved & Published',
      message: `Topic approved by ${poName}. Enrolled scholars have had their curriculum updated.`,
      type: 'mentor',
      link: '/courses',
    });

    showToast(
      'Topic Approved & Published',
      `Syllabus updated and enrolled scholars' curriculum progress synchronized.`,
      'success'
    );

    logActivity({
      title: 'Topic Approved by Program Officer',
      description: `${poName} approved syllabus topic #${lessonId}.`,
      type: 'mentor',
      user: poName,
    });
  };

  const returnTopicByProgramOfficer = async (lessonId: string, reason: string, courseTitle?: string) => {
    const poName = currentUser?.name || 'Academic Program Officer';

    setLmsModules(prev => prev.map(mod => ({
      ...mod,
      lessons: mod.lessons.map(les => {
        if (les.id !== lessonId) return les;
        return {
          ...les,
          completedByMentor: false,
          approvedByProgramOfficer: false,
          approvalStatus: 'Needs Revision (Returned by PO)',
          poReviewNotes: reason || 'Please review learning guidelines and re-deliver practical milestone.',
        };
      })
    })));

    addNotification({
      title: 'Syllabus Topic Returned for Revision',
      message: `${poName} returned topic #${lessonId}${courseTitle ? ` (${courseTitle})` : ''} for revision: ${reason}`,
      type: 'mentor',
      link: '/mentor/curriculum',
    });

    showToast(
      'Topic Returned to Faculty',
      'Mentor has been notified with your revision feedback.',
      'warning'
    );

    logActivity({
      title: 'Topic Returned by Program Officer',
      description: `${poName} returned syllabus topic #${lessonId}: ${reason}`,
      type: 'mentor',
      user: poName,
    });
  };

  const reviewMentorWeeklyReport = async (mentorId: string, reportId: string, reviewNotes: string) => {
    const poName = currentUser?.name || 'Academic Program Officer';
    const now = new Date().toISOString();

    setMentors(prev => prev.map(m => {
      if (m.id !== mentorId) return m;
      const nextReports = (m.weeklyReports || []).map(rep => {
        if (rep.id !== reportId) return rep;
        return {
          ...rep,
          poReviewed: true,
          poReviewerName: poName,
          poReviewNotes: reviewNotes || 'Verified against cohort timetable and syllabus pacing.',
          poReviewedAt: now,
        };
      });
      return { ...m, weeklyReports: nextReports };
    }));

    addNotification({
      title: 'Weekly Teaching Report Verified',
      message: `${poName} verified your weekly faculty teaching report.`,
      type: 'mentor',
      link: '/mentor/curriculum',
    });

    showToast(
      'Weekly Report Verified',
      'Teaching report signed off and synchronized with the Faculty Dossier.',
      'success'
    );

    logActivity({
      title: 'Weekly Report Signed Off',
      description: `${poName} reviewed weekly report #${reportId} for mentor ${mentorId}.`,
      type: 'mentor',
      user: poName,
    });
  };

  const logCourseIQAAudit = async (
    courseId: string,
    stage: 1 | 2 | 3,
    notes: string,
    status: 'Verified' | 'Action Required' = 'Verified'
  ) => {
    const poName = currentUser?.name || 'Academic Program Officer';
    const now = new Date().toISOString();
    const stageTitles: Record<1 | 2 | 3, string> = {
      1: 'IQA Audit 1: Foundation & Environment Verification',
      2: 'IQA Audit 2: Mid-Cohort Practical & Rubric Sampling',
      3: 'IQA Audit 3: Final Capstone & Certification Board Sign-off',
    };

    setCourses(prev => prev.map(c => {
      if (c.id !== courseId && c.title !== courseId) return c;
      const existing = (c.iqaAudits || []).filter(a => a.stage !== stage);
      const nextAudit = {
        id: `iqa-${c.id}-${stage}-${Date.now()}`,
        courseId: c.id,
        stage,
        stageTitle: stageTitles[stage],
        auditorName: poName,
        notes: notes || `${stageTitles[stage]} verified according to NBTE/NITDA & VTCT standards.`,
        status,
        auditedAt: now,
      };
      return {
        ...c,
        iqaAudits: [...existing, nextAudit].sort((a, b) => a.stage - b.stage),
      };
    }));

    showToast(
      `IQA Stage ${stage} Recorded`,
      `${stageTitles[stage]} logged by ${poName}.`,
      'success'
    );

    logActivity({
      title: `IQA Stage ${stage} Audit Logged`,
      description: `${poName} completed ${stageTitles[stage]} for course ${courseId}.`,
      type: 'system',
      user: poName,
    });
  };

  // ----------------------------------------------------
  // Super Admin User Administration Actions
  // ----------------------------------------------------
  const toggleUserActiveStatus = async (userId: string, isActive: boolean, reason?: string) => {
    const activeBool = Boolean(isActive);

    // Update staffUsers
    setStaffUsers(prev => prev.map(u => {
      if (u.id === userId) {
        return {
          ...u,
          isActive: activeBool,
          status: activeBool ? 'Active' : 'Deactivated',
          deactivatedAt: activeBool ? undefined : new Date().toISOString(),
          deactivatedReason: activeBool ? undefined : (reason || 'Deactivated by Super Admin'),
        };
      }
      return u;
    }));

    // Update mentors
    setMentors(prev => prev.map(m => {
      if (m.id === userId || m.mentorCode === userId) {
        return {
          ...m,
          isActive: activeBool,
          status: activeBool ? 'Active' : 'Deactivated',
        };
      }
      return m;
    }));

    // Update students
    setStudents(prev => prev.map(s => {
      if (s.id === userId || s.studentCode === userId) {
        return {
          ...s,
          isActive: activeBool,
          status: activeBool ? 'Active' : 'Deactivated',
        };
      }
      return s;
    }));

    // If current logged-in user is deactivated, force logout
    if (currentUser?.id === userId && !activeBool) {
      logout();
    }

    if (isBackendConnected) {
      try {
        await apiService.toggleUserStatus(userId, activeBool, reason);
      } catch (err) {
        console.warn('Backend user status toggle error:', err);
      }
    }

    showToast(
      `Account ${activeBool ? 'Activated' : 'Deactivated'}`,
      `User account ${userId} is now ${activeBool ? 'Active' : 'Deactivated'}.`,
      activeBool ? 'success' : 'warning'
    );

    logActivity({
      title: `Account ${activeBool ? 'Activated' : 'Deactivated'}`,
      description: `Account ID ${userId} set to ${activeBool ? 'Active' : 'Deactivated'} by Super Admin.`,
      type: 'system',
      user: currentUser?.name || 'Super Admin',
    });
  };

  const adminResetUserPassword = async (userId: string, newPassword: string): Promise<boolean> => {
    if (!newPassword || newPassword.trim().length < 6) {
      showToast('Password Error', 'Password must be at least 6 characters long.', 'error');
      return false;
    }

    const cleanPassword = newPassword.trim();
    const targetUser = staffUsers.find(u => u.id === userId || (u.email && u.email.toLowerCase() === userId.toLowerCase())) 
      || mentors.find(m => m.id === userId || m.mentorCode === userId || (m.email && m.email.toLowerCase() === userId.toLowerCase())) 
      || students.find(s => s.id === userId || s.studentCode === userId || (s.email && s.email.toLowerCase() === userId.toLowerCase()));

    const targetEmail = targetUser?.email?.trim().toLowerCase();

    // Update staffUsers
    setStaffUsers(prev => prev.map(u => 
      (u.id === userId || (targetEmail && u.email?.trim().toLowerCase() === targetEmail)) 
        ? { ...u, password: cleanPassword } 
        : u
    ));
    // Update mentors
    setMentors(prev => prev.map(m => 
      (m.id === userId || m.mentorCode === userId || (targetEmail && m.email?.trim().toLowerCase() === targetEmail)) 
        ? { ...m, password: cleanPassword } 
        : m
    ));
    // Update students
    setStudents(prev => prev.map(s => 
      (s.id === userId || s.studentCode === userId || (targetEmail && s.email?.trim().toLowerCase() === targetEmail)) 
        ? { ...s, password: cleanPassword } 
        : s
    ));

    if (isBackendConnected) {
      try {
        const res = await apiService.resetUserPassword(userId, cleanPassword, targetEmail);
        if (!res || !res.success) {
          showToast('Reset Failed', res?.message || 'Could not reset password on server.', 'error');
          return false;
        }
      } catch (err: any) {
        console.warn('Backend password reset error:', err);
        showToast('Reset Failed', err?.message || 'Could not reset password on server.', 'error');
        return false;
      }
    }

    showToast('Password Reset', 'User password has been successfully reset.', 'success');
    logActivity({
      title: 'User Password Reset',
      description: `Super Admin reset password for ${targetUser?.name || userId} (${targetEmail || userId}).`,
      type: 'system',
      user: currentUser?.name || 'Super Admin',
    });

    return true;
  };

  const changePassword = async (newPassword: string, email?: string): Promise<{ success: boolean; message?: string }> => {
    const cleanPassword = newPassword.trim();
    if (!cleanPassword || cleanPassword.length < 6) {
      showToast('Password Error', 'Password must be at least 6 characters long.', 'error');
      return { success: false, message: 'Password must be at least 6 characters long.' };
    }

    const targetEmail = (email || currentUser?.email || '').trim().toLowerCase();
    if (!targetEmail) {
      showToast('Error', 'No user email specified.', 'error');
      return { success: false, message: 'No user email specified.' };
    }

    // 1. Update in-memory state for currentUser if matches
    if (currentUser && (currentUser.email.toLowerCase() === targetEmail || (currentUser as any).secondaryEmail?.toLowerCase() === targetEmail)) {
      const updatedUser = { ...currentUser, password: cleanPassword, mustResetPassword: false };
      setCurrentUser(updatedUser as any);
      safeLocalStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(updatedUser));
    }

    // 2. Update staffUsers
    setStaffUsers(prev => prev.map(u => 
      (u.email?.toLowerCase().trim() === targetEmail || (u as any).secondaryEmail?.toLowerCase().trim() === targetEmail || (u.name?.toLowerCase().includes('oyinkonsola') && (targetEmail === 'oyinojobo@gmail.com' || targetEmail === 'oyinojobor@gmail.com')))
        ? { ...u, password: cleanPassword, mustResetPassword: false }
        : u
    ));

    // 3. Update mentors
    setMentors(prev => prev.map(m => 
      (m.email?.toLowerCase().trim() === targetEmail || (m as any).secondaryEmail?.toLowerCase().trim() === targetEmail)
        ? { ...m, password: cleanPassword }
        : m
    ));

    // 4. Update students
    setStudents(prev => prev.map(s => 
      (s.email?.toLowerCase().trim() === targetEmail || (s as any).secondaryEmail?.toLowerCase().trim() === targetEmail)
        ? { ...s, password: cleanPassword, mustResetPassword: false }
        : s
    ));

    // 5. Backend sync
    if (isBackendConnected) {
      try {
        const res = await apiService.resetPassword(targetEmail, cleanPassword);
        if (!res || !res.success) {
          showToast('Reset Failed', res?.message || 'Could not update password on server.', 'error');
          return { success: false, message: res?.message || 'Could not update password on server.' };
        }
      } catch (err: any) {
        showToast('Reset Failed', err?.message || 'Could not update password on server.', 'error');
        return { success: false, message: err?.message || 'Could not update password on server.' };
      }
    }

    showToast('Password Updated', 'Your security credentials have been updated successfully.', 'success');
    logActivity({
      title: 'Password Updated',
      description: `Password was successfully updated for account ${targetEmail}.`,
      type: 'system',
      user: currentUser?.name || targetEmail,
    });

    return { success: true, message: 'Password updated successfully.' };
  };

  // KPIs
  const kpis: ExecutiveKPIs = useMemo(() => {
    const activeStudentCount = students.filter(s => s.status === 'Active').length;
    const totalRev = students.reduce((acc, s) => {
      const tuition = Number(s.totalFees || s.tuitionAmount || 0);
      const balance = Number(s.outstandingBalance || 0);
      const paid = (typeof s.paidAmount === 'number' && !isNaN(s.paidAmount))
        ? s.paidAmount
        : Math.max(0, tuition - balance);
      return acc + (isNaN(paid) ? 0 : paid);
    }, 0);

    const mentorPay = sessions.reduce((acc, s) => acc + (Number(s.compensationAmount) || 0), 0) +
      mentors.reduce((acc, m) => acc + (Number(m.pendingPayout) || 0), 0);

    const totalExp = expenses.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
    const totalCosts = mentorPay + totalExp;
    const netProfit = totalRev - totalCosts;
    const margin = totalRev > 0 ? Number(((netProfit / totalRev) * 100).toFixed(1)) : 0;

    const totalLeads = leads.length;
    const convertedLeads = leads.filter(l => l.status === 'Converted').length;
    const convRate = totalLeads > 0 ? Number(((convertedLeads / totalLeads) * 100).toFixed(1)) : 0;

    return {
      totalRevenue: totalRev,
      revenueGrowth: 0,
      activeStudents: activeStudentCount,
      studentGrowth: 0,
      mentorPayouts: mentorPay,
      mentorGrowth: 0,
      totalExpenses: totalExp,
      expensesGrowth: 0,
      leadConversionRate: convRate,
      operatingMargin: margin,
    };
  }, [students, mentors, sessions, expenses, leads]);

  return (
    <CRMContext.Provider
      value={{
        currentUser,
        staffUsers,
        login,
        logout,
        sessionWarningSeconds,
        resetActivityTimer,
        hasPermission,
        addStaffUser,
        updateUserRole,
        toggleUserApproverStatus,
        notifications,
        toasts,
        unreadNotificationCount,
        isBackendConnected,
        addNotification,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        clearNotifications,
        showToast,
        removeToast,
        sendPaymentReminder,
        leads,
        students,
        mentors,
        expenses,
        courses,
        cohorts,
        invoices,
        sessions,
        attendanceRecords,
        activeAttendanceSession,
        staleAttendanceSession,
        todayCompletedSession,
        settings,
        activityLogs,
        activeModal,
        globalSearch,
        selectedStudentId,
        selectedInvoiceId,
        selectedMentorForBookingId,
        selectedStudentForAssignmentId,
        selectedCourseForEditId,
        selectedMentorForEditId,
        selectedMentorForProfileId,
        setSelectedMentorForProfileId,
        openMentorProfileModal,
        selectedStaffForEditId,
        setSelectedStaffForEditId,
        reviewUserKYC,
        kpis,
        lmsModules,
        assignments,
        currentStudentProfile,
        studentPerformanceReports,
        completeLesson,
        submitAssignment,
        gradeAssignment,
        payTuitionWithPaystack,
        submitProofOfPayment,
        disburseMentorPayout,
        markSessionAttendance,
        submitStudentPerformanceReport,
        updateReportFollowUpStatus,
        issueCertificate,
        calculatePerformanceTier,
        openModal,
        closeModal,
        setGlobalSearch,
        setSelectedStudentId,
        setSelectedInvoiceId,
        setSelectedMentorForBookingId,
        setSelectedStudentForAssignmentId,
        setSelectedCourseForEditId,
        setSelectedMentorForEditId,
        selectedBiodataUser,
        setSelectedBiodataUser,
        openBiodataModal,
        selectedLeadForFollowUp,
        setSelectedLeadForFollowUp,
        openFollowUpModal,
        selectedStudentForPayment,
        setSelectedStudentForPayment,
        openRecordPaymentModal,
        recordStudentInstallmentPayment,
        addLead,
        updateLeadStatus,
        updateLeadNotes,
        scheduleLeadFollowUp,
        convertLeadToStudent,
        enrollStudent,
        updateStudent,
        updateStudentStatus,
        assignMentorToStudent,
        updateStudentAttendanceRecord,
        submitStudentFeedback,
        addMentorFeedbackNote,
        toggleStudentAtRisk,
        toggleStudentGoalStatus,
        uploadStudentDocument,
        recruitMentor,
        updateMentorStatus,
        updateMentor,
        logExpense,
        updateExpenseStatus,
        approveExpense,
        rejectExpense,
        addCourse,
        updateCourse,
        deleteCourse,
        addCourseCategory,
        addCohort,
        bookSession,
        clockIn,
        clockOut,
        toggleShiftBreak,
        resumeTodayShift,
        verifyAttendanceShift,
        generateInvoice,
        updateSettings,
        saveCampusLocations,
        logActivity,
        exportDatabaseBackup,
        restoreDatabaseBackup,
        flushProductionData,
        sendStaffWelcomeEmail,
        isSuperAdmin,
        isSimulatingRole,
        originSuperAdmin,
        switchRole,
        isModuleEnabled,
        tickets,
        createTicket,
        updateTicketStatus,
        assignTicket,
        addTicketComment,
        markTicketDone,
        requestTicketStatus,
        toggleTicketArchive,
        markTicketRead,
        customRoles,
        createCustomRole,
        updateRolePermissions,
        deleteCustomRole,
        hasFeaturePermission,
        resetAllData,
        wallet,
        selectedExpenseForDisburse,
        setSelectedExpenseForDisburse,
        selectedMentorForDisburse,
        setSelectedMentorForDisburse,
        generateVirtualAccount,
        topUpWallet,
        disburseExpenseFromWallet,
        verifyBankTransferStatus,
        disburseMentorFromWallet,
        updateWalletBudgetLimit,
        refreshWalletSummary,
        reconcileWalletWithPaystack,
        isSyncingWallet,
        timetables,
        scheduleClass,
        updateTimetableSlot,
        deleteTimetableSlot,
        markClassAttendance,
        selectedSlotForAttendance,
        setSelectedSlotForAttendance,
        selectedSlotForRecording,
        setSelectedSlotForRecording,
        attachTimetableRecording,
        createSipcoreMeeting,
        markTopicAsTaught,
        approveTopicByProgramOfficer,
        returnTopicByProgramOfficer,
        reviewMentorWeeklyReport,
        logCourseIQAAudit,
        toggleUserActiveStatus,
        adminResetUserPassword,
        selectedUserForPasswordReset,
        setSelectedUserForPasswordReset,
        hasModulePermission,
        toggleRoleModule,
        payoutRequests,
        requestMentorPayout,
        reviewMentorPayout,
        calculateMentorTuitionCommission,
        selectedPayoutRequestForEdit,
        setSelectedPayoutRequestForEdit,
        openEditPayoutRequestModal,
        updateMentorPayoutRequest,
        selectedMessageForForward,
        setSelectedMessageForForward,
        openForwardModal,
        forwardChatMessage,
        editChatMessage,
        deleteChatMessage,
        dailyStandups,
        weeklyScrumReports,
        todayStandup,
        fetchTodayStandup,
        submitDailyStandup,
        generateWeeklyScrumEvaluation,
        triggerStandupReminders,
        updateUserProfile,
        deleteStaffUser,
        deleteMentorUser,
        transferTasksAndDeleteUser,
        activeMentors,
        activeStaffUsers,
        getUserTaskFootprint,
        editStaffUser,
        renameCustomRole,
        changePassword,
        unreadChatCount,
        refreshUnreadChatCount,
        isChatPopoutOpen,
        setIsChatPopoutOpen,
      }}
    >
      {children}
    </CRMContext.Provider>
  );
};

export const useCRM = () => {
  const context = useContext(CRMContext);
  if (!context) {
    throw new Error('useCRM must be used within a CRMProvider');
  }
  return context;
};
