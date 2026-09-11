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
  StudentPerformanceReport
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
  initialStudentPerformanceReports
} from '../data/mockData';
import { apiService } from '../services/api';
import { emailService } from '../services/emailService';
import { calculateDistanceMeters } from '../utils/geo';
import { launchPaystackPayment } from '../services/paystackService';

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
  
  // Attendance, Reports & Graduation Gatekeeping
  markSessionAttendance: (sessionId: string, status: 'Attended' | 'Absent', hoursCredited?: number) => Promise<void>;
  submitStudentPerformanceReport: (report: Omit<StudentPerformanceReport, 'id' | 'reportCode' | 'submittedAt'>) => Promise<void>;
  updateReportFollowUpStatus: (reportId: string, status: 'Pending Review' | 'In Progress' | 'Resolved', notes?: string) => Promise<void>;
  issueCertificate: (studentId: string) => Promise<{ success: boolean; certificateNumber?: string; message?: string }>;
  calculatePerformanceTier: (score: number) => 'Exceeding' | 'On Track' | 'Needs Support' | 'At Risk';
  
  // Auth actions
  login: (role: UserRole, email?: string) => void;
  logout: () => void;
  hasPermission: (requiredRole: UserRole | UserRole[]) => boolean;
  addStaffUser: (user: Omit<AuthUser, 'id'>) => void;
  updateUserRole: (userId: string, role: UserRole, mentorId?: string) => void;

  // Notifications & Toasts
  addNotification: (notif: Omit<NotificationItem, 'id' | 'timestamp' | 'read'>) => void;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  clearNotifications: () => void;
  showToast: (title: string, message: string, type?: ToastMessage['type']) => void;
  removeToast: (id: string) => void;
  sendPaymentReminder: (studentId: string) => void;

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

  // Reset to seed data
  resetAllData: () => void;
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
};

export const CRMProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.AUTH);
    return saved ? JSON.parse(saved) : defaultAuthUser;
  });

  const [staffUsers, setStaffUsers] = useState<AuthUser[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.STAFF);
    return saved ? JSON.parse(saved) : demoUsers;
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
    return saved ? JSON.parse(saved) : initialCourses;
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
    const saved = localStorage.getItem('nexus_clean_prod_lms_modules_v1');
    return saved ? JSON.parse(saved) : initialLMSModules;
  });

  const [assignments, setAssignments] = useState<StudentAssignmentSubmission[]>(() => {
    const saved = localStorage.getItem('nexus_clean_prod_assignments_v1');
    return saved ? JSON.parse(saved) : initialAssignments;
  });

  const [studentPerformanceReports, setStudentPerformanceReports] = useState<StudentPerformanceReport[]>(() => {
    const saved = localStorage.getItem('nexus_clean_prod_student_reports_v1');
    return saved ? JSON.parse(saved) : initialStudentPerformanceReports;
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
        if (data.courses) setCourses(data.courses);
        if (data.cohorts) setCohorts(data.cohorts);
        if (data.invoices) setInvoices(data.invoices);
        if (data.sessions) setSessions(data.sessions);
        if (data.attendance) setAttendanceRecords(data.attendance);
        if (data.settings) setSettings(data.settings);
        if (data.notifications) setNotifications(data.notifications);
        if (data.staffUsers) setStaffUsers(data.staffUsers);
        if (data.lmsModules) setLmsModules(data.lmsModules);
        if (data.assignments) setAssignments(data.assignments);
        if ((data as any).studentPerformanceReports) setStudentPerformanceReports((data as any).studentPerformanceReports);
        console.log('🚀 Synchronized live data with Express REST backend.');
      } else if (isMounted) {
        setIsBackendConnected(false);
      }
    };
    syncWithBackend();
    return () => { isMounted = false; };
  }, []);

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
  useEffect(() => { localStorage.setItem('nexus_clean_prod_lms_modules_v1', JSON.stringify(lmsModules)); }, [lmsModules]);
  useEffect(() => { localStorage.setItem('nexus_clean_prod_assignments_v1', JSON.stringify(assignments)); }, [assignments]);
  useEffect(() => { localStorage.setItem('nexus_clean_prod_student_reports_v1', JSON.stringify(studentPerformanceReports)); }, [studentPerformanceReports]);

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

  // Auth actions
  const login = (role: UserRole, email?: string) => {
    let matched: AuthUser | undefined;

    if (email && email.trim()) {
      const normalized = email.trim().toLowerCase();
      // 1. Check staffUsers by email
      matched = staffUsers.find(u => u.email.toLowerCase() === normalized);

      // 2. Check mentors by email
      if (!matched) {
        const mentor = mentors.find(m => m.email.toLowerCase() === normalized);
        if (mentor) {
          matched = {
            id: mentor.id,
            name: mentor.name,
            email: mentor.email,
            role: 'mentor',
            roleTitle: mentor.role || 'Faculty Mentor',
            mentorId: mentor.id,
            department: mentor.department,
          };
        }
      }

      // 3. Check students by email
      if (!matched) {
        const student = students.find(s => s.email.toLowerCase() === normalized);
        if (student) {
          matched = {
            id: student.id,
            name: student.name,
            email: student.email,
            role: 'student',
            roleTitle: 'Enrolled Scholar / Student',
            studentId: student.id,
          };
        }
      }

      // 4. Check demoUsers by email
      if (!matched) {
        matched = demoUsers.find(u => u.email.toLowerCase() === normalized);
      }
    }

    // If still not matched by email, match by specified role
    if (!matched) {
      matched = staffUsers.find(u => u.role === role) || demoUsers.find(u => u.role === role) || {
        id: `user-${role}`,
        name: role === 'super_admin' ? 'Abiola Adefowope' : role === 'student' ? 'Enrolled Student' : role === 'admissions' ? 'Admissions Officer' : role === 'mentor' ? 'Faculty Mentor' : 'Finance Officer',
        email: email || (role === 'super_admin' ? 'abiola.adefowope@codelab.institute' : `${role}@codelab.institute`),
        role,
        roleTitle: role === 'super_admin' ? 'Managing Director & Super Admin' : role === 'student' ? 'Enrolled Scholar / Student' : role === 'admissions' ? 'Head of Admissions' : role === 'mentor' ? 'Principal Faculty Mentor' : 'Chief Financial Officer',
        mentorId: role === 'mentor' ? 'men-1' : undefined,
      };
    }

    setCurrentUser(matched);
    showToast('Signed In', `Welcome, ${matched.name} (${matched.roleTitle}).`, 'info');
    logActivity({
      title: 'User Authenticated',
      description: `${matched.name} signed in as ${matched.roleTitle}.`,
      type: 'system',
      user: matched.name,
    });
  };

  const logout = () => {
    setCurrentUser(null);
    showToast('Signed Out', 'You have been signed out of the portal.', 'info');
    logActivity({
      title: 'User Signed Out',
      description: 'Session ended successfully.',
      type: 'system',
      user: 'System',
    });
  };

  const hasPermission = (requiredRole: UserRole | UserRole[]): boolean => {
    if (!currentUser) return false;
    if (currentUser.role === 'super_admin') return true;
    const rolesArray = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    return rolesArray.includes(currentUser.role);
  };

  const addStaffUser = (userData: Omit<AuthUser, 'id'>) => {
    const newUser: AuthUser = {
      ...userData,
      id: `user-${Date.now()}`,
    };
    setStaffUsers(prev => [newUser, ...prev]);
    apiService.createStaff(userData);
    showToast('Staff Provisioned', `${newUser.name} added as ${newUser.roleTitle}.`, 'success');
    addNotification({
      title: 'New Staff Provisioned',
      message: `${newUser.name} provisioned as ${newUser.roleTitle} in ${newUser.department}.`,
      type: 'system',
      link: '/settings',
    });
    logActivity({
      title: 'Staff Member Provisioned',
      description: `${newUser.name} created as ${newUser.roleTitle}.`,
      type: 'system',
      user: currentUser?.name || 'Super Admin',
    });
  };

  const updateUserRole = (userId: string, role: UserRole, mentorId?: string) => {
    const roleTitleMap: Record<UserRole, string> = {
      super_admin: 'Managing Director & Super Admin',
      admissions: 'Admissions Officer',
      mentor: 'Faculty Mentor',
      finance: 'Chief Financial Officer / Controller',
      student: 'Enrolled Scholar / Student',
    };

    setStaffUsers(prev => prev.map(u => {
      if (u.id === userId) {
        return {
          ...u,
          role,
          roleTitle: roleTitleMap[role],
          mentorId: role === 'mentor' ? (mentorId || u.mentorId || 'men-1') : undefined,
        };
      }
      return u;
    }));

    if (currentUser?.id === userId) {
      setCurrentUser(prev => prev ? {
        ...prev,
        role,
        roleTitle: roleTitleMap[role],
        mentorId: role === 'mentor' ? (mentorId || prev.mentorId || 'men-1') : undefined,
      } : null);
    }

    apiService.updateStaff(userId, { role, roleTitle: roleTitleMap[role], mentorId });
    showToast('Role Updated', `Staff permissions updated to ${roleTitleMap[role]}.`, 'info');
    logActivity({
      title: 'Staff Role Reassigned',
      description: `Staff member role updated to ${roleTitleMap[role]}.`,
      type: 'system',
      user: currentUser?.name || 'Super Admin',
    });
  };

  // Modal actions
  const openModal = (modal: ModalType) => setActiveModal(modal);
  const closeModal = () => setActiveModal(null);

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
    apiService.createLead(newLeadData);
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
          portalUrl: `http://72.61.106.87/login?role=student&email=${encodeURIComponent(lead.email || '')}`,
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
          portalUrl: `http://72.61.106.87/login?role=student&email=${encodeURIComponent(newStudent.email || '')}`,
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
          portalUrl: `http://72.61.106.87/login?role=mentor&email=${encodeURIComponent(newMentor.email || '')}`,
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
        actionUrl: 'http://72.61.106.87/expenses',
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
        actionUrl: 'http://72.61.106.87/expenses',
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
        actionUrl: 'http://72.61.106.87/expenses',
      }
    }).catch(err => console.error('Error sending expense rejected email:', err));
  };

  // Courses & Cohorts
  const addCourse = (courseData: Omit<CourseProgram, 'id' | 'enrolledCount' | 'rating'>) => {
    const newCourse: CourseProgram = {
      ...courseData,
      id: `course-${Date.now()}`,
      enrolledCount: 0,
      rating: 5.0,
    };
    setCourses(prev => [newCourse, ...prev]);
    apiService.createCourse(courseData);
    showToast('Course Added', `${newCourse.title} added to catalog.`, 'success');
    logActivity({
      title: 'New Program Curriculum Created',
      description: `${newCourse.title} added to curriculum catalog.`,
      type: 'system',
      user: 'Academic Director',
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
          reviewUrl: 'http://72.61.106.87/courses',
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
          portalUrl: 'http://72.61.106.87/student/courses',
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
              portalUrl: 'http://72.61.106.87/mentors',
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
            actionUrl: 'http://72.61.106.87/invoices',
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
        actionUrl: 'http://72.61.106.87/invoices',
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

  const disburseMentorPayout = async (mentorId: string, amount: number, reason?: string) => {
    const mentor = mentors.find(m => m.id === mentorId);
    if (!mentor) return;

    setMentors(prev => prev.map(m => {
      if (m.id !== mentorId) return m;
      return {
        ...m,
        pendingPayout: Math.max(0, (m.pendingPayout || 0) - amount),
        paidPayout: (m.paidPayout || 0) + amount,
      };
    }));

    showToast('Disbursement Processed', `₦${amount.toLocaleString()} sent to ${mentor.name}'s verified ${mentor.bankName} account via Paystack!`, 'success');

    logActivity({
      title: `Mentor Disbursement Processed`,
      description: `₦${amount.toLocaleString()} disbursed to ${mentor.name} (${mentor.bankName} - ${mentor.accountNumber}) via Paystack.`,
      type: 'mentor',
      user: currentUser?.name || 'Bursary',
    });

    // Dispatch Credit Advice Email to Mentor
    if (mentor.email) {
      emailService.sendEmail({
        to: mentor.email,
        recipientName: mentor.name,
        subject: `💸 Faculty Honorarium Disbursed: ₦${amount.toLocaleString()} [${mentor.bankName || 'NIBSS Settlement'}]`,
        type: 'mentor_payout_disbursed',
        data: {
          amount,
          bankName: mentor.bankName,
          accountNumber: mentor.accountNumber,
          transferRef: `TRF-NIBSS-${Date.now().toString().slice(-6)}`,
          portalUrl: 'http://72.61.106.87/mentors',
        }
      }).catch(err => console.error('Error sending mentor payout credit advice email:', err));
    }

    if (isBackendConnected) {
      try {
        await apiService.disburseMentorPayout(mentorId, amount, reason);
      } catch (e) {
        console.warn('Backend disburse error:', e);
      }
    }
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
        isModuleEnabled,
        resetAllData,
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
