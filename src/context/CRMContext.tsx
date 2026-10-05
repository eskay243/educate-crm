import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { 
  Lead, 
  Student, 
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
  WorkMode,
  GeoVerificationStatus,
  PunctualityStatus,
  LMSModule,
  StudentAssignmentSubmission,
  EnabledModules,
  StudentPerformanceReport,
  SupportTicket,
  CustomRoleDefinition,
  RoleCapabilities,
  TicketStatus,
  ExpenseAndBudgetWallet,
  VirtualAccountDetails,
  TimetableSlot,
  MentorPayoutRequest
} from '../types/crm';
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
  initialPayoutRequests
} from '../data/mockData';
import { apiService } from '../services/api';
import { emailService } from '../services/emailService';
import { calculateDistanceMeters } from '../utils/geo';
import { launchPaystackPayment } from '../services/paystackService';
import { APP_BASE_URL } from '../utils/url';


export const formatNaira = (amount: number, fractionDigits = 0): string => {
  return '₦' + new Intl.NumberFormat('en-NG', {
    maximumFractionDigits: fractionDigits,
    minimumFractionDigits: fractionDigits,
  }).format(amount);
};

export const formatNairaCompact = (amount: number): string => {
  if (amount >= 1_000_000) {
    const val = (amount / 1_000_000).toFixed(1).replace(/\.0$/, '');
    return `₦${val}M`;
  }
  if (amount >= 1_000) {
    const val = (amount / 1_000).toFixed(0);
    return `₦${val}K`;
  }
  return `₦${amount}`;
};

export const resolveRoleTitle = (roleId: string, customRolesList?: any[]): string => {
  const staticMap: Record<string, string> = {
    super_admin: 'Super Admin / Managing Director',
    admissions: 'Admissions Officer',
    finance: 'Finance Officer & Bursar',
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
  }) => Promise<boolean>;
  disburseMentorFromWallet: (mentorId: string, amount: number, reason?: string, payoutRequestId?: string) => Promise<boolean>;
  updateWalletBudgetLimit: (limit: number) => Promise<void>;
  refreshWalletSummary: () => Promise<void>;
  reconcileWalletWithPaystack: () => Promise<void>;
  isSyncingWallet: boolean;
  
  // Mentor Payout Requests
  payoutRequests: MentorPayoutRequest[];
  requestMentorPayout: (amount: number, notes?: string) => Promise<{ success: boolean; message: string }>;
  reviewMentorPayout: (requestId: string, status: 'Approved' | 'Rejected', reason?: string) => Promise<boolean>;
  
  // Attendance, Reports & Graduation Gatekeeping
  markSessionAttendance: (sessionId: string, status: 'Attended' | 'Absent', hoursCredited?: number) => Promise<void>;
  submitStudentPerformanceReport: (report: Omit<StudentPerformanceReport, 'id' | 'reportCode' | 'submittedAt'>) => Promise<void>;
  updateReportFollowUpStatus: (reportId: string, status: 'Pending Review' | 'In Progress' | 'Resolved', notes?: string) => Promise<void>;
  issueCertificate: (studentId: string) => Promise<{ success: boolean; certificateNumber?: string; message?: string }>;
  calculatePerformanceTier: (score: number) => 'Exceeding' | 'On Track' | 'Needs Support' | 'At Risk';
  
  // Auth actions
  login: (role: UserRole, email?: string, password?: string) => Promise<{ success: boolean; message?: string; user?: AuthUser }>;
  logout: () => void;
  hasPermission: (requiredRole: UserRole | UserRole[], moduleName?: keyof EnabledModules | string) => boolean;
  hasModulePermission: (moduleName: string) => boolean;
  toggleRoleModule: (roleId: string, moduleName: string) => Promise<void>;
  isSuperAdmin: boolean;
  isSimulatingRole: boolean;
  switchRole: (role: UserRole) => void;
  addStaffUser: (user: Omit<AuthUser, 'id'>) => void;
  updateUserRole: (userId: string, role: UserRole, mentorId?: string) => void;
  deleteStaffUser: (id: string) => Promise<boolean>;
  editStaffUser: (id: string, updates: Partial<AuthUser>) => Promise<boolean>;
  renameCustomRole: (roleId: string, newName: string, newDescription?: string) => Promise<boolean>;

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

  // Mutators
  addLead: (lead: Omit<Lead, 'id' | 'dateAdded'>) => void;
  updateLeadStatus: (id: string, status: LeadStatus, lossReason?: string) => void;
  updateLeadNotes: (id: string, notes: string) => void;
  convertLeadToStudent: (leadId: string, program: string, mentorName: string) => void;
  
  enrollStudent: (student: Omit<Student, 'id' | 'enrolledDate' | 'studentCode'>) => void;
  updateStudentStatus: (id: string, status: StudentStatus) => void;
  assignMentorToStudent: (studentId: string, mentorId: string) => void;
  
  recruitMentor: (mentor: Omit<Mentor, 'id' | 'joinedDate' | 'mentorCode' | 'sessionsCount'>) => void;
  updateMentorStatus: (id: string, status: Mentor['status']) => void;
  updateMentor: (id: string, updatedData: Partial<Mentor>) => void;
  
  logExpense: (expense: Omit<Expense, 'id' | 'expenseCode'>) => void;
  updateExpenseStatus: (id: string, status: ExpenseStatus, extra?: { rejectionReason?: string; reviewedBy?: string; reviewedAt?: string }) => void;
  approveExpense: (id: string) => void;
  rejectExpense: (id: string, reason: string) => void;

  addCourse: (course: Omit<CourseProgram, 'id' | 'enrolledCount' | 'rating'>) => void;
  updateCourse: (id: string, updatedData: Partial<CourseProgram>) => void;
  addCourseCategory: (category: string) => void;
  addCohort: (cohort: Omit<Cohort, 'id' | 'enrolledCount'>) => void;
  bookSession: (session: Omit<MentorshipSession, 'id' | 'sessionCode'>) => void;
  generateInvoice: (invoice: Omit<Invoice, 'id' | 'invoiceNumber'>) => void;
  updateSettings: (newSettings: Partial<OrganizationSettings>) => void;
  logActivity: (activity: Omit<ActivityLogItem, 'id' | 'timestamp'>) => void;

  // Attendance & Time Tracking
  clockIn: (options: { workMode: WorkMode; locationName?: string; dailyTasksFocus?: string; lat?: number; lng?: number }) => Promise<{ success: boolean; message: string; record?: AttendanceRecord }>;
  clockOut: (options: { endOfDaySummary?: string }) => Promise<{ success: boolean; message: string; record?: AttendanceRecord }>;

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
  addTicketComment: (ticketId: string, content: string) => Promise<void>;

  // Custom Roles & Permission Architecture
  customRoles: CustomRoleDefinition[];
  createCustomRole: (roleData: Omit<CustomRoleDefinition, 'id'> | CustomRoleDefinition) => Promise<void>;
  updateRolePermissions: (roleId: string, updates: Partial<CustomRoleDefinition>) => Promise<void>;
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

  // Course Outline Teaching & Program Officer Approval Gateway
  markTopicAsTaught: (lessonId: string, notes?: string) => Promise<void>;
  approveTopicByProgramOfficer: (lessonId: string, courseTitle?: string) => Promise<void>;

  // Super Admin User Administration
  toggleUserActiveStatus: (userId: string, isActive: boolean, reason?: string) => Promise<void>;
  adminResetUserPassword: (userId: string, newPassword: string) => Promise<boolean>;
  selectedUserForPasswordReset: { id: string; name: string; email: string; role: string; category?: string } | null;
  setSelectedUserForPasswordReset: (user: { id: string; name: string; email: string; role: string; category?: string } | null) => void;
}

const CRMContext = createContext<CRMContextType | undefined>(undefined);

const STORAGE_KEYS = {
  AUTH: 'nexus_clean_prod_auth_v1',
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
    const isExplicitlyLoggedOut = localStorage.getItem('nexus_logged_out') === 'true';
    if (isExplicitlyLoggedOut) return null;
    const saved = localStorage.getItem(STORAGE_KEYS.AUTH);
    if (!saved) return null;
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse saved auth state:', e);
      return null;
    }
  });

  const [staffUsers, setStaffUsers] = useState<AuthUser[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.STAFF);
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
    const saved = localStorage.getItem(STORAGE_KEYS.LEADS);
    return saved ? JSON.parse(saved) : initialLeads;
  });

  const [students, setStudents] = useState<Student[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.STUDENTS);
    return saved ? JSON.parse(saved) : initialStudents;
  });

  const [mentors, setMentors] = useState<Mentor[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.MENTORS);
    return saved ? JSON.parse(saved) : initialMentors;
  });

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.EXPENSES);
    return saved ? JSON.parse(saved) : initialExpenses;
  });

  const [courses, setCourses] = useState<CourseProgram[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.COURSES);
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
    const saved = localStorage.getItem(STORAGE_KEYS.COHORTS);
    return saved ? JSON.parse(saved) : initialCohorts;
  });

  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.INVOICES);
    return saved ? JSON.parse(saved) : initialInvoices;
  });

  const [sessions, setSessions] = useState<MentorshipSession[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SESSIONS);
    return saved ? JSON.parse(saved) : initialSessions;
  });

  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ATTENDANCE);
    return saved ? JSON.parse(saved) : initialAttendance;
  });

  const [settings, setSettings] = useState<OrganizationSettings>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
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
    const saved = localStorage.getItem(STORAGE_KEYS.LOGS);
    return saved ? JSON.parse(saved) : initialActivityLogs;
  });

  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    return saved ? JSON.parse(saved) : initialNotifications;
  });

  const [lmsModules, setLmsModules] = useState<LMSModule[]>(() => {
    const saved = localStorage.getItem('nexus_clean_prod_lms_modules_v2');
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
    const saved = localStorage.getItem('nexus_clean_prod_assignments_v1');
    return saved ? JSON.parse(saved) : initialAssignments;
  });

  const [studentPerformanceReports, setStudentPerformanceReports] = useState<StudentPerformanceReport[]>(() => {
    const saved = localStorage.getItem('nexus_clean_prod_student_reports_v1');
    return saved ? JSON.parse(saved) : initialStudentPerformanceReports;
  });

  const [tickets, setTickets] = useState<SupportTicket[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.TICKETS);
    return saved ? JSON.parse(saved) : initialTickets;
  });

  const [customRoles, setCustomRoles] = useState<CustomRoleDefinition[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ROLES);
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

  // Timetables and Academic Administration state
  const [timetables, setTimetables] = useState<TimetableSlot[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.TIMETABLES);
    return saved ? JSON.parse(saved) : initialTimetables;
  });
  const [selectedUserForPasswordReset, setSelectedUserForPasswordReset] = useState<{ id: string; name: string; email: string; role: string; category?: string } | null>(null);
  const [selectedSlotForAttendance, setSelectedSlotForAttendance] = useState<TimetableSlot | null>(null);

  // Operational Expense & Budget Wallet state
  const [wallet, setWallet] = useState<ExpenseAndBudgetWallet>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.WALLET);
    return saved ? JSON.parse(saved) : defaultWalletState;
  });
  const [selectedExpenseForDisburse, setSelectedExpenseForDisburse] = useState<Expense | null>(null);
  const [selectedMentorForDisburse, setSelectedMentorForDisburse] = useState<Mentor | null>(null);
  const [payoutRequests, setPayoutRequests] = useState<MentorPayoutRequest[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PAYOUT_REQUESTS);
    return saved ? JSON.parse(saved) : initialPayoutRequests;
  });

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
          const localSaved = localStorage.getItem(STORAGE_KEYS.COURSES);
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
    localStorage.setItem(STORAGE_KEYS.WALLET, JSON.stringify(wallet));
  }, [wallet]);


  // Persist state to localStorage as fallback
  useEffect(() => { 
    if (currentUser) {
      localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(currentUser)); 
    } else {
      localStorage.removeItem(STORAGE_KEYS.AUTH);
    }
  }, [currentUser]);

  useEffect(() => { localStorage.setItem(STORAGE_KEYS.STAFF, JSON.stringify(staffUsers)); }, [staffUsers]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.LEADS, JSON.stringify(leads)); }, [leads]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students)); }, [students]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.MENTORS, JSON.stringify(mentors)); }, [mentors]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses)); }, [expenses]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.COURSES, JSON.stringify(courses)); }, [courses]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.COHORTS, JSON.stringify(cohorts)); }, [cohorts]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(invoices)); }, [invoices]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions)); }, [sessions]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(attendanceRecords)); }, [attendanceRecords]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings)); }, [settings]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(activityLogs)); }, [activityLogs]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications)); }, [notifications]);
  useEffect(() => { localStorage.setItem('nexus_clean_prod_lms_modules_v2', JSON.stringify(lmsModules)); }, [lmsModules]);
  useEffect(() => { localStorage.setItem('nexus_clean_prod_assignments_v1', JSON.stringify(assignments)); }, [assignments]);
  useEffect(() => { localStorage.setItem('nexus_clean_prod_student_reports_v1', JSON.stringify(studentPerformanceReports)); }, [studentPerformanceReports]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(tickets)); }, [tickets]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.ROLES, JSON.stringify(customRoles)); }, [customRoles]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.TIMETABLES, JSON.stringify(timetables)); }, [timetables]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.PAYOUT_REQUESTS, JSON.stringify(payoutRequests)); }, [payoutRequests]);

  // Current active student profile when logged in as a student
  const currentStudentProfile = useMemo(() => {
    if (!currentUser) return null;
    if (currentUser.role === 'student') {
      const match = students.find(s => 
        s.id === currentUser.studentId || 
        s.studentCode === currentUser.studentId || 
        s.email?.toLowerCase() === currentUser.email?.toLowerCase()
      );
      if (match) return match;
      return students.length > 0 ? students[0] : null;
    }
    return null;
  }, [currentUser, students]);

  // Current active clock-in session for currentUser
  const activeAttendanceSession = useMemo(() => {
    if (!currentUser) return null;
    return attendanceRecords.find(r => 
      ((r.staffId || r.userId) === currentUser.id || 
       (r.staffEmail || r.userEmail)?.toLowerCase() === currentUser.email?.toLowerCase()) && 
      !r.clockOutTime
    ) || null;
  }, [attendanceRecords, currentUser]);

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

  // Super Admin session tracking for role switching
  const [isSuperAdminSession, setIsSuperAdminSession] = useState<boolean>(() => {
    return sessionStorage.getItem('nexus_super_admin_session') === 'true';
  });

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
          localStorage.removeItem('nexus_logged_out');

          if (authUser.role === 'super_admin') {
            sessionStorage.setItem('nexus_super_admin_session', 'true');
            setIsSuperAdminSession(true);
          } else {
            sessionStorage.removeItem('nexus_super_admin_session');
            setIsSuperAdminSession(false);
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
        matched = staffUsers.find(u => u.role === 'super_admin') || demoUsers.find(u => u.role === 'super_admin');
      }

      // 1. Check staffUsers by email
      if (!matched) {
        matched = staffUsers.find(u => u.email.toLowerCase() === cleanEmail);
      }

      // 2. Check mentors by email
      if (!matched) {
        const mentor = mentors.find(m => m.email.toLowerCase() === cleanEmail);
        if (mentor) {
          matched = {
            id: mentor.id,
            name: mentor.name,
            email: mentor.email,
            role: 'mentor',
            roleTitle: mentor.role || 'Faculty Mentor',
            mentorId: mentor.id,
            department: mentor.department,
            password: mentor.password,
            isActive: mentor.isActive !== false && mentor.status !== 'Deactivated',
            status: mentor.status === 'Deactivated' ? 'Deactivated' : 'Active',
          };
        }
      }

      // 3. Check students by email
      if (!matched) {
        const student = students.find(s => s.email.toLowerCase() === cleanEmail);
        if (student) {
          matched = {
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
        matched = demoUsers.find(u => u.email.toLowerCase() === cleanEmail);
      }
    }

    // If still not matched by email, match by specified role in staff/demo
    if (!matched) {
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
    localStorage.removeItem('nexus_logged_out');

    // Set or clear super admin session flag based on authenticated account
    if (matched.role === 'super_admin') {
      sessionStorage.setItem('nexus_super_admin_session', 'true');
      setIsSuperAdminSession(true);
    } else {
      sessionStorage.removeItem('nexus_super_admin_session');
      setIsSuperAdminSession(false);
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

  const switchRole = (newRole: UserRole) => {
    // Strictly only allow role switching if user is a Super Admin
    if (!isSuperAdmin) {
      showToast('Permission Denied', 'Role switching is restricted exclusively to the Super Admin.', 'error');
      return;
    }

    // Ensure session remembers that Super Admin originated this session
    sessionStorage.setItem('nexus_super_admin_session', 'true');
    setIsSuperAdminSession(true);

    if (newRole === 'super_admin') {
      // Revert back to original Super Admin account
      const superAdminUser = staffUsers.find(u => u.role === 'super_admin') || demoUsers[0];
      setCurrentUser(superAdminUser);
      showToast('Super Admin Restored', 'Returned to Managing Director & Super Admin controls.', 'success');
      logActivity({
        title: 'Role Reverted to Super Admin',
        description: 'Super Admin exited role simulation mode.',
        type: 'system',
        user: superAdminUser.name,
      });
      return;
    }

    // Find persona for target role
    let targetUser: AuthUser | undefined;
    if (newRole === 'mentor') {
      const mentor = mentors[0];
      if (mentor) {
        targetUser = {
          id: mentor.id,
          name: mentor.name,
          email: mentor.email,
          role: 'mentor',
          roleTitle: 'Faculty Mentor (Simulated)',
          mentorId: mentor.id,
          department: mentor.department,
        };
      }
    } else if (newRole === 'student') {
      const student = students[0];
      if (student) {
        targetUser = {
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
      user: 'Super Admin (Simulation)',
    });
  };

  const logout = () => {
    setCurrentUser(null);
    sessionStorage.removeItem('nexus_super_admin_session');
    setIsSuperAdminSession(false);
    localStorage.removeItem(STORAGE_KEYS.AUTH);
    localStorage.setItem('nexus_logged_out', 'true');
    showToast('Signed Out', 'You have been signed out of the portal.', 'info');
    logActivity({
      title: 'User Signed Out',
      description: 'Session ended successfully.',
      type: 'system',
      user: 'System',
    });
  };

  const updateUserProfile = async (data: Partial<AuthUser>): Promise<boolean> => {
    if (!currentUser) return false;

    const updatedUser: AuthUser = {
      ...currentUser,
      ...data,
    };

    setCurrentUser(updatedUser);
    localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(updatedUser));

    // 1. Update in staffUsers if present
    setStaffUsers(prev => prev.map(u => 
      (u.id === currentUser.id || u.email.toLowerCase() === currentUser.email.toLowerCase())
        ? { ...u, ...data }
        : u
    ));

    // 2. If mentor, sync bank details & contact info into mentors
    const mentorIdToSync = currentUser.mentorId;
    if (mentorIdToSync || currentUser.role === 'mentor') {
      setMentors(prev => prev.map(m => {
        if ((mentorIdToSync && m.id === mentorIdToSync) || m.id === currentUser.id || m.email.toLowerCase() === currentUser.email.toLowerCase()) {
          return {
            ...m,
            phone: data.phone ?? m.phone,
            avatarUrl: data.avatarUrl ?? m.avatarUrl,
            bankName: data.bankName ?? m.bankName,
            bankCode: data.bankCode ?? m.bankCode,
            accountNumber: data.accountNumber ?? m.accountNumber,
            accountName: data.accountName ?? m.accountName,
            isAccountVerified: data.isBankVerified ?? m.isAccountVerified,
            bankVerified: data.isBankVerified ?? m.bankVerified,
          };
        }
        return m;
      }));
    }

    // 3. If student, sync phone into students
    const studentIdToSync = currentUser.studentId;
    if (studentIdToSync || currentUser.role === 'student') {
      setStudents(prev => prev.map(s => {
        if ((studentIdToSync && s.id === studentIdToSync) || s.id === currentUser.id || s.email.toLowerCase() === currentUser.email.toLowerCase()) {
          return {
            ...s,
            phone: data.phone ?? s.phone,
          };
        }
        return s;
      }));
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
    }
    showToast('Permissions Updated', `Permissions for role updated successfully.`, 'info');
    logActivity({
      title: 'Role Permissions Modified',
      description: `Capabilities for role "${roleId}" updated by Super Admin.`,
      type: 'system',
      user: currentUser?.name || 'Super Admin',
    });
  };

  // Support Tickets & Helpdesk Actions
  const createTicket = async (ticketData: Omit<SupportTicket, 'id' | 'ticketNumber' | 'createdAt' | 'updatedAt' | 'comments'>) => {
    const ticketCount = tickets.length + 1;
    const newTicket: SupportTicket = {
      ...ticketData,
      id: `tkt-${Date.now()}`,
      ticketNumber: `TKT-${1000 + ticketCount}`,
      assignedToRole: ticketData.assignedToRole || 'super_admin',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      comments: [],
    };

    setTickets(prev => [newTicket, ...prev]);
    await apiService.createTicket(newTicket);
    showToast('Ticket Submitted', `Ticket #${newTicket.ticketNumber} logged. Support has been alerted.`, 'success');
    addNotification({
      title: `🎫 Ticket #${newTicket.ticketNumber} Logged`,
      message: `${newTicket.createdBy.name} (${newTicket.createdBy.roleTitle}): "${newTicket.title}"`,
      type: 'system',
      link: '/tickets',
    });
    logActivity({
      title: 'Support Ticket Logged',
      description: `Ticket #${newTicket.ticketNumber}: "${newTicket.title}" raised by ${newTicket.createdBy.name}.`,
      type: 'system',
      user: newTicket.createdBy.name,
    });
  };

  const updateTicketStatus = async (ticketId: string, status: TicketStatus, resolutionNotes?: string) => {
    setTickets(prev => prev.map(t => {
      if (t.id === ticketId || t.ticketNumber === ticketId) {
        return {
          ...t,
          status,
          resolutionNotes: resolutionNotes || t.resolutionNotes,
          updatedAt: new Date().toISOString(),
        };
      }
      return t;
    }));

    await apiService.updateTicket(ticketId, { status, resolutionNotes });
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

  const addTicketComment = async (ticketId: string, content: string) => {
    if (!currentUser || !content.trim()) return;
    const commentData = {
      id: `comm-${Date.now()}`,
      ticketId,
      authorName: currentUser.name,
      authorEmail: currentUser.email,
      authorRole: currentUser.roleTitle,
      content,
      createdAt: new Date().toISOString(),
    };

    setTickets(prev => prev.map(t => {
      if (t.id === ticketId || t.ticketNumber === ticketId) {
        return {
          ...t,
          comments: [...t.comments, commentData],
          updatedAt: new Date().toISOString(),
        };
      }
      return t;
    }));

    await apiService.addTicketComment(ticketId, commentData);
    showToast('Comment Posted', 'Your reply has been added to the ticket.', 'success');
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
    };
    setStaffUsers(prev => [newUser, ...prev]);
    apiService.createStaff({ ...userData, roleTitle: resolvedTitle });
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

    setStaffUsers(prev => prev.map(u => {
      if (u.id === userId) {
        return {
          ...u,
          role,
          roleTitle: newTitle,
          mentorId: role === 'mentor' ? (mentorId || u.mentorId || 'men-1') : undefined,
        };
      }
      return u;
    }));

    if (currentUser?.id === userId) {
      setCurrentUser(prev => prev ? {
        ...prev,
        role,
        roleTitle: newTitle,
        mentorId: role === 'mentor' ? (mentorId || prev.mentorId || 'men-1') : undefined,
      } : null);
    }

    apiService.updateStaff(userId, { role, roleTitle: newTitle, mentorId });
    showToast('Role Updated', `Staff permissions updated to ${newTitle}.`, 'info');
    logActivity({
      title: 'Staff Role Reassigned',
      description: `Staff member role updated to ${newTitle}.`,
      type: 'system',
      user: currentUser?.name || 'Super Admin',
    });
  };

  const deleteStaffUser = async (id: string): Promise<boolean> => {
    const target = staffUsers.find(u => u.id === id);
    if (!target) return false;
    if (target.role === 'super_admin' && (target.id === 'user-admin' || staffUsers.filter(u => u.role === 'super_admin').length <= 1)) {
      showToast('Action Blocked', 'The primary Super Admin institutional account cannot be deleted.', 'error');
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
        localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(updatedCurrent));
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
        localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(updatedUser));
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
      window.history.replaceState({}, '', url.pathname + (url.searchParams.toString() ? `?${url.searchParams.toString()}` : ''));
    }
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

    const newStudent: Student = {
      id: `stu-${Date.now()}`,
      studentCode: `STU-${Math.floor(1000 + Math.random() * 9000)}`,
      name: lead.name,
      email: lead.email,
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
    const newStudent: Student = {
      ...studentData,
      id: `stu-${Date.now()}`,
      studentCode: `STU-${Math.floor(1000 + Math.random() * 9000)}`,
      enrolledDate: new Date().toISOString().split('T')[0],
    };
    setStudents(prev => [newStudent, ...prev]);
    apiService.createStudent(studentData);

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
          portalUrl: `${APP_BASE_URL}/login?role=student&email=${encodeURIComponent(newStudent.email || '')}`,
        }
      }).catch(err => console.error('Error sending student welcome email:', err));
    }

    // If student has an assigned mentor, calculate 37% enrollment commission share for mentor
    if (newStudent.mentorName || (studentData as any).mentorId) {
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
  };

  const updateStudentStatus = (id: string, status: StudentStatus) => {
    setStudents(prev => prev.map(s => s.id === id ? { ...s, status } : s));
    apiService.updateStudent(id, { status });
  };

  const assignMentorToStudent = (studentId: string, mentorId: string) => {
    const mentor = mentors.find(m => m.id === mentorId);
    if (!mentor) return;

    let studentName = 'Student';
    let studentFees = 0;
    setStudents(prev => prev.map(s => {
      if (s.id === studentId) {
        studentName = s.name;
        studentFees = s.totalFees || 0;
        return {
          ...s,
          mentorName: mentor.name,
          mentorId: mentor.id,
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

    apiService.updateStudent(studentId, { mentorName: mentor.name, mentorId: mentor.id });
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
      user: 'Super Admin',
    });
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
    setMentors(prev => prev.map(m => m.id === id ? { ...m, status } : m));
    apiService.updateMentor(id, { status });
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
    const timestamp = new Date().toISOString().split('T')[0];

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
    const timestamp = new Date().toISOString().split('T')[0];

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
      localStorage.setItem(STORAGE_KEYS.COURSES, JSON.stringify(updated));
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
    dailyTasksFocus?: string;
    lat?: number;
    lng?: number;
  }): Promise<{ success: boolean; message: string; record?: AttendanceRecord }> => {
    if (!currentUser) {
      showToast('Clock-In Failed', 'No active user session detected.', 'error');
      return { success: false, message: 'No active user session.' };
    }

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    const dateStr = now.toISOString().split('T')[0];

    // Geo-verification calculation
    let geoStatus: GeoVerificationStatus = 'GPS Unavailable';
    let distanceMeters: number | undefined;

    const office = settings.officeLocation || {
      name: 'Lagos Headquarters Hub (Yaba, Lagos)',
      latitude: 6.5181,
      longitude: 3.3768,
      radiusMeters: 400,
    };

    if (options.workMode === 'Remote') {
      geoStatus = 'Remote Verified';
    } else if (options.lat !== undefined && options.lng !== undefined) {
      distanceMeters = calculateDistanceMeters(options.lat, options.lng, office.latitude, office.longitude);
      if (distanceMeters <= office.radiusMeters) {
        geoStatus = 'Verified On-Site';
      } else {
        geoStatus = 'Location Mismatch';
      }
    } else {
      geoStatus = 'GPS Unavailable';
    }

    // Punctuality check against work hours policy
    const [expHour, expMin] = (settings.workHoursPolicy?.expectedClockInTime || '09:00').split(':').map(Number);
    const grace = settings.workHoursPolicy?.gracePeriodMinutes ?? 15;
    const expectedMinutes = expHour * 60 + expMin + grace;
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const punctualityStatus: PunctualityStatus = currentMinutes <= expectedMinutes ? 'On-Time' : 'Late';

    const newRecord: AttendanceRecord = {
      id: `att-${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      userEmail: currentUser.email,
      userRole: currentUser.role,
      roleTitle: currentUser.roleTitle || currentUser.role,
      department: currentUser.department || 'Operations',
      staffId: currentUser.id,
      staffName: currentUser.name,
      staffEmail: currentUser.email,
      date: dateStr,
      clockInTime: timeStr,
      clockInTimestamp: now.getTime(),
      workMode: options.workMode,
      locationName: options.locationName || (options.workMode === 'On-Site / Hub' ? office.name : 'Remote Workstation'),
      latitude: options.lat,
      longitude: options.lng,
      distanceFromOfficeMeters: distanceMeters !== undefined ? Math.round(distanceMeters) : undefined,
      geoStatus,
      punctuality: punctualityStatus,
      punctualityStatus,
      shiftFocus: options.dailyTasksFocus || 'General office operations and scheduled daily chores.',
      dailyTasksFocus: options.dailyTasksFocus || 'General office operations and scheduled daily chores.',
      status: 'Clocked In',
    };

    setAttendanceRecords(prev => [newRecord, ...prev]);
    apiService.clockIn(newRecord);

    showToast(
      'Clocked In Successfully',
      `${currentUser.name} is now On-Duty (${options.workMode} • ${punctualityStatus}).`,
      geoStatus === 'Location Mismatch' ? 'warning' : 'success'
    );

    addNotification({
      title: 'Staff Clock-In Logged',
      message: `${currentUser.name} clocked in at ${timeStr} (${options.workMode} • ${punctualityStatus} • ${geoStatus}).`,
      type: 'system',
      link: '/attendance',
    });

    logActivity({
      title: 'Staff Member Clocked In',
      description: `${currentUser.name} clocked in for ${options.workMode} duty. Focus: ${(newRecord.dailyTasksFocus || '').slice(0, 70)}`,
      type: 'system',
      user: currentUser.name,
    });

    return { success: true, message: 'Clocked in successfully', record: newRecord };
  };

  const clockOut = async (options: {
    endOfDaySummary?: string;
  }): Promise<{ success: boolean; message: string; record?: AttendanceRecord }> => {
    if (!currentUser) {
      showToast('Clock-Out Failed', 'No active user session.', 'error');
      return { success: false, message: 'No active user session.' };
    }

    if (!activeAttendanceSession) {
      showToast('Clock-Out Error', 'No active shift found to clock out of.', 'error');
      return { success: false, message: 'No active shift found.' };
    }

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    const durationMs = Math.max(0, now.getTime() - activeAttendanceSession.clockInTimestamp);
    const totalHoursWorked = Number(Math.max(0.01, durationMs / (1000 * 60 * 60)).toFixed(2));

    const updatedRecord: AttendanceRecord = {
      ...activeAttendanceSession,
      clockOutTime: timeStr,
      clockOutTimestamp: now.getTime(),
      totalHoursWorked,
      workSummary: options.endOfDaySummary || 'Completed daily deliverables and office chores.',
      status: 'Clocked Out',
    };

    setAttendanceRecords(prev => prev.map(r => r.id === activeAttendanceSession.id ? updatedRecord : r));
    apiService.clockOut(activeAttendanceSession.id, {
      clockOutTime: timeStr,
      clockOutTimestamp: now.getTime(),
      totalHoursWorked,
      workSummary: updatedRecord.workSummary || '',
    });

    showToast(
      'Clocked Out Successfully',
      `Shift closed with ${totalHoursWorked} hrs logged. Deliverables recorded.`,
      'success'
    );

    addNotification({
      title: 'Staff Clock-Out Logged',
      message: `${currentUser.name} completed duty (${totalHoursWorked}h logged).`,
      type: 'system',
      link: '/attendance',
    });

    logActivity({
      title: 'Staff Member Clocked Out',
      description: `${currentUser.name} completed duty (${totalHoursWorked}h). EOD Output: ${(updatedRecord.workSummary || '').slice(0, 70)}`,
      type: 'system',
      user: currentUser.name,
    });

    return { success: true, message: 'Clocked out successfully', record: updatedRecord };
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
    localStorage.clear();
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
          const newBal = Math.max(0, (s.tuitionAmount || 0) - newPaid);
          return {
            ...s,
            paidAmount: newPaid,
            outstandingBalance: newBal,
            tuitionStatus: newBal === 0 ? 'Paid' : 'Partial',
          };
        }));

        if (options.invoiceId) {
          setInvoices(prev => prev.map(inv => {
            if (inv.id !== options.invoiceId && inv.invoiceNumber !== options.invoiceId) return inv;
            return { ...inv, status: 'Paid', paidDate: new Date().toISOString() };
          }));
        }

        const commission = Math.round(res.amountNaira * 0.37);
        if (student.mentorId || student.mentorName) {
          setMentors(prev => prev.map(m => {
            if (m.id !== student.mentorId && m.name !== student.mentorName) return m;
            return {
              ...m,
              pendingPayout: (m.pendingPayout || 0) + commission,
              totalEarned: (m.totalEarned || 0) + commission,
            };
          }));
        }

        showToast(
          'Payment Verified & Recorded!',
          `₦${res.amountNaira.toLocaleString()} paid via Paystack (Ref: ${res.reference}). 37% mentor commission accrued.`,
          'success'
        );

        logActivity({
          title: `Tuition Payment (₦${res.amountNaira.toLocaleString()})`,
          description: `Paystack payment verified for ${student.name}. Reference: ${res.reference}`,
          type: 'finance',
          user: student.name,
        });

        // 1. Send Electronic Receipt to Student
        if (student.email) {
          emailService.sendEmail({
            to: student.email,
            recipientName: student.name,
            subject: `💳 Payment Receipt & Confirmation: ${student.program || 'Tuition'} (₦${res.amountNaira.toLocaleString()})`,
            type: 'invoice_receipt',
            data: {
              invoiceNumber: options.invoiceId || `INV-PAY-${Date.now().toString().slice(-4)}`,
              program: student.program,
              amount: res.amountNaira,
              status: 'Paid',
              paymentRef: res.reference,
              invoiceNote: 'Verified electronic tuition settlement via Paystack payment gateway.',
            }
          }).catch(err => console.error('Error sending student tuition receipt email:', err));
        }

        // 2. Send 37% Commission Accrual Alert to Assigned Mentor
        const assignedMentor = mentors.find(m => m.id === student.mentorId || m.name === student.mentorName);
        if (assignedMentor?.email && commission > 0) {
          emailService.sendEmail({
            to: assignedMentor.email,
            recipientName: assignedMentor.name,
            subject: `🎉 New Commission Credited: 37% Enrollment Revenue Share (₦${commission.toLocaleString()})`,
            type: 'mentor_commission_earned',
            data: {
              studentName: student.name,
              program: student.program,
              tuitionPaid: res.amountNaira,
              commissionAmount: commission,
              newPendingPayout: (assignedMentor.pendingPayout || 0) + commission,
              portalUrl: `${APP_BASE_URL}/mentors`,
            }
          }).catch(err => console.error('Error sending mentor commission alert email:', err));
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
  }): Promise<boolean> => {
    const expense = expenses.find(e => e.id === payload.expenseId);
    if (!expense) return false;

    if (wallet.balance < expense.amount) {
      showToast('Insufficient Wallet Balance', `Available: ${formatNaira(wallet.balance)}, Required: ${formatNaira(expense.amount)}. Please top up the wallet first.`, 'error');
      return false;
    }

    try {
      const res = await apiService.disburseExpenseFromWallet(payload);
      if (res && res.expense) {
        setExpenses(prev => prev.map(e => e.id === payload.expenseId ? res.expense : e));
        if (res.walletBalance !== undefined) {
          setWallet(prev => ({
            ...prev,
            balance: res.walletBalance,
            transactions: [
              {
                id: `wtx-${Date.now()}-exp`,
                type: 'debit',
                category: 'expense_payout',
                amount: expense.amount,
                reference: res.transferRef || `TRF-EXP-${Date.now()}`,
                description: `OpEx Disbursement: ${expense.title} (${expense.expenseCode})`,
                timestamp: new Date().toISOString(),
                balanceAfter: res.walletBalance,
                initiatedBy: currentUser?.name || 'Finance Controller',
                recipientName: payload.accountName,
                recipientBank: payload.bankName,
                recipientAccountNumber: payload.accountNumber,
                channel: 'paystack_transfer'
              },
              ...prev.transactions
            ]
          }));
        }
        showToast('Expense Disbursed', `₦${expense.amount.toLocaleString()} paid from Expense Wallet to ${payload.accountName} (${payload.bankName})!`, 'success');
        return true;
      } else {
        // Local simulation fallback
        const newBal = Math.max(0, wallet.balance - expense.amount);
        const trfRef = `TRF-EXP-${Date.now()}`;
        setExpenses(prev => prev.map(e => e.id === payload.expenseId ? {
          ...e,
          status: 'Paid',
          disbursementBankName: payload.bankName,
          disbursementAccountNumber: payload.accountNumber,
          disbursementAccountName: payload.accountName,
          disbursementBankCode: payload.bankCode,
          isDisbursedViaWallet: true,
          transferReference: trfRef,
          disbursedAt: new Date().toISOString()
        } : e));
        setWallet(prev => ({
          ...prev,
          balance: newBal,
          transactions: [
            {
              id: `wtx-${Date.now()}-exp`,
              type: 'debit',
              category: 'expense_payout',
              amount: expense.amount,
              reference: trfRef,
              description: `OpEx Disbursement: ${expense.title} (${expense.expenseCode})`,
              timestamp: new Date().toISOString(),
              balanceAfter: newBal,
              initiatedBy: currentUser?.name || 'Finance Controller',
              recipientName: payload.accountName,
              recipientBank: payload.bankName,
              recipientAccountNumber: payload.accountNumber,
              channel: 'paystack_transfer'
            },
            ...prev.transactions
          ]
        }));
        showToast('Expense Disbursed', `₦${expense.amount.toLocaleString()} paid to ${payload.accountName}!`, 'success');
        return true;
      }
    } catch (e: any) {
      console.error('Error disbursing expense:', e);
      showToast('Disbursement Error', e.message || 'Failed to disburse expense from wallet', 'error');
      return false;
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

    if (wallet.balance < amount) {
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

    const reqAmount = Number(amount) || myMentorProfile.pendingPayout || 0;
    if (reqAmount <= 0) {
      return { success: false, message: 'Requested payout amount must be greater than ₦0.' };
    }

    if (reqAmount > (myMentorProfile.pendingPayout || 0)) {
      return { 
        success: false, 
        message: `Requested amount (${formatNaira(reqAmount)}) exceeds your pending balance of ${formatNaira(myMentorProfile.pendingPayout || 0)}.` 
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

    // Update staffUsers
    setStaffUsers(prev => prev.map(u => u.id === userId ? { ...u, password: newPassword.trim() } : u));
    // Update mentors
    setMentors(prev => prev.map(m => (m.id === userId || m.mentorCode === userId) ? { ...m, password: newPassword.trim() } : m));
    // Update students
    setStudents(prev => prev.map(s => (s.id === userId || s.studentCode === userId) ? { ...s, password: newPassword.trim() } : s));

    if (isBackendConnected) {
      try {
        const res = await apiService.resetUserPassword(userId, newPassword.trim());
        if (!res || !res.success) {
          showToast('Reset Failed', res?.message || 'Could not reset password on server.', 'error');
          return false;
        }
      } catch (err) {
        console.warn('Backend password reset error:', err);
      }
    }

    showToast('Password Reset', 'User password has been successfully reset.', 'success');
    logActivity({
      title: 'User Password Reset',
      description: `Super Admin reset password for account ID ${userId}.`,
      type: 'system',
      user: currentUser?.name || 'Super Admin',
    });

    return true;
  };

  // KPIs
  const kpis: ExecutiveKPIs = useMemo(() => {
    const activeStudentCount = students.filter(s => s.status === 'Active').length;
    const totalRev = students.reduce((acc, s) => acc + (s.totalFees - (s.outstandingBalance || 0)), 0);
    const mentorPay = sessions.reduce((acc, s) => acc + s.compensationAmount, 0) + mentors.reduce((acc, m) => acc + m.pendingPayout, 0);
    const totalExp = expenses.reduce((acc, e) => acc + e.amount, 0);
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
        hasPermission,
        addStaffUser,
        updateUserRole,
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
        addLead,
        updateLeadStatus,
        updateLeadNotes,
        convertLeadToStudent,
        enrollStudent,
        updateStudentStatus,
        assignMentorToStudent,
        recruitMentor,
        updateMentorStatus,
        updateMentor,
        logExpense,
        updateExpenseStatus,
        approveExpense,
        rejectExpense,
        addCourse,
        updateCourse,
        addCourseCategory,
        addCohort,
        bookSession,
        clockIn,
        clockOut,
        generateInvoice,
        updateSettings,
        logActivity,
        exportDatabaseBackup,
        restoreDatabaseBackup,
        flushProductionData,
        sendStaffWelcomeEmail,
        isSuperAdmin,
        isSimulatingRole,
        switchRole,
        isModuleEnabled,
        tickets,
        createTicket,
        updateTicketStatus,
        assignTicket,
        addTicketComment,
        customRoles,
        createCustomRole,
        updateRolePermissions,
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
        markTopicAsTaught,
        approveTopicByProgramOfficer,
        toggleUserActiveStatus,
        adminResetUserPassword,
        selectedUserForPasswordReset,
        setSelectedUserForPasswordReset,
        hasModulePermission,
        toggleRoleModule,
        payoutRequests,
        requestMentorPayout,
        reviewMentorPayout,
        updateUserProfile,
        deleteStaffUser,
        editStaffUser,
        renameCustomRole,
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
