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
  AuthUser
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
  initialSettings, 
  initialActivityLogs,
  initialNotifications,
  demoUsers,
  defaultAuthUser
} from '../data/mockData';
import { apiService } from '../services/api';

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
  updateExpenseStatus: (id: string, status: ExpenseStatus) => void;

  addCourse: (course: Omit<CourseProgram, 'id' | 'enrolledCount' | 'rating'>) => void;
  updateCourse: (id: string, updatedData: Partial<CourseProgram>) => void;
  addCohort: (cohort: Omit<Cohort, 'id' | 'enrolledCount'>) => void;
  bookSession: (session: Omit<MentorshipSession, 'id' | 'sessionCode'>) => void;
  generateInvoice: (invoice: Omit<Invoice, 'id' | 'invoiceNumber'>) => void;
  updateSettings: (newSettings: Partial<OrganizationSettings>) => void;
  logActivity: (activity: Omit<ActivityLogItem, 'id' | 'timestamp'>) => void;

  // Backups, Restore & Production Flush
  exportDatabaseBackup: () => void;
  restoreDatabaseBackup: (backupData: any) => Promise<boolean>;
  flushProductionData: () => Promise<void>;
  sendStaffWelcomeEmail: (staffId: string) => Promise<void>;

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

  const [settings, setSettings] = useState<OrganizationSettings>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    return saved ? JSON.parse(saved) : initialSettings;
  });

  const [activityLogs, setActivityLogs] = useState<ActivityLogItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.LOGS);
    return saved ? JSON.parse(saved) : initialActivityLogs;
  });

  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    return saved ? JSON.parse(saved) : initialNotifications;
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
        if (data.settings) setSettings(data.settings);
        if (data.notifications) setNotifications(data.notifications);
        if (data.staffUsers) setStaffUsers(data.staffUsers);
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
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings)); }, [settings]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(activityLogs)); }, [activityLogs]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications)); }, [notifications]);

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
    const defaultEmail = role === 'super_admin' ? 'abiola.adefowope@codelab.institute' : `${role}@nexus-institute.ng`;
    const matched = staffUsers.find(u => (email && u.email.toLowerCase() === email.toLowerCase()) || u.role === role) || demoUsers.find(u => u.role === role) || {
      id: `user-${role}`,
      name: role === 'super_admin' ? 'Abiola Adefowope' : role === 'admissions' ? 'Folake Solanke' : role === 'mentor' ? 'Dr. Arthur Pendelton' : 'Adeyemi Daniels',
      email: email || defaultEmail,
      role,
      roleTitle: role === 'super_admin' ? 'Managing Director & Super Admin' : role === 'admissions' ? 'Head of Admissions' : role === 'mentor' ? 'Principal Faculty Mentor' : 'Chief Financial Officer',
      mentorId: role === 'mentor' ? 'men-1' : undefined,
    };
    setCurrentUser(matched);
    showToast('Role Switched', `Logged in as ${matched.name} (${matched.roleTitle}).`, 'info');
    logActivity({
      title: 'User Authenticated',
      description: `${matched.name} switched active role to ${matched.roleTitle}.`,
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

    showToast(
      '🎉 Student Admitted!',
      `${lead.name} admitted to ${newStudent.program}. Invoice #${newInv.invoiceNumber} generated.`,
      'success'
    );

    addNotification({
      title: 'Lead Converted to Active Student',
      message: `${lead.name} enrolled in ${newStudent.program}. Invoice #${newInv.invoiceNumber} (${formatNaira(feeAmount)}) generated.`,
      type: 'admissions',
      link: '/students',
    });

    logActivity({
      title: 'Lead Converted to Student',
      description: `${lead.name} officially enrolled in ${newStudent.program}.`,
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
    showToast('Student Enrolled', `${newStudent.name} admitted (#${newStudent.studentCode}).`, 'success');
    addNotification({
      title: 'New Student Enrolled',
      message: `${newStudent.name} admitted to ${newStudent.program} (#${newStudent.studentCode}).`,
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
    setStudents(prev => prev.map(s => {
      if (s.id === studentId) {
        studentName = s.name;
        return {
          ...s,
          mentorName: mentor.name,
          mentorId: mentor.id,
        };
      }
      return s;
    }));

    setMentors(prev => prev.map(m => {
      if (m.id === mentorId) {
        return {
          ...m,
          activeMentees: (m.activeMentees || 0) + 1,
        };
      }
      return m;
    }));

    apiService.updateStudent(studentId, { mentorName: mentor.name, mentorId: mentor.id });
    apiService.updateMentor(mentorId, { activeMentees: (mentor.activeMentees || 0) + 1 });

    showToast('Mentor Assigned', `${mentor.name} paired with ${studentName}.`, 'success');
    addNotification({
      title: 'Lead Faculty Mentor Paired',
      message: `${mentor.name} assigned to coach ${studentName}.`,
      type: 'mentor',
      link: '/students',
    });

    logActivity({
      title: 'Faculty Mentor Assigned',
      description: `${studentName} assigned to ${mentor.name} (${mentor.department}).`,
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
    showToast('Mentor Recruited', `${newMentor.name} joined the faculty.`, 'success');
    addNotification({
      title: 'Faculty Mentor Recruited',
      message: `${newMentor.name} joined as ${newMentor.role} (${newMentor.department}).`,
      type: 'mentor',
      link: '/mentors',
    });
    logActivity({
      title: 'Faculty Mentor Recruited',
      description: `${newMentor.name} joined as ${newMentor.role}.`,
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

  // Expense mutations
  const logExpense = (expenseData: Omit<Expense, 'id' | 'expenseCode'>) => {
    const newExpense: Expense = {
      ...expenseData,
      id: `exp-${Date.now()}`,
      expenseCode: `EXP-${Math.floor(1000 + Math.random() * 9000)}`,
    };
    setExpenses(prev => [newExpense, ...prev]);
    apiService.createExpense(expenseData);
    showToast('Expense Submitted', `${newExpense.title} (${formatNaira(newExpense.amount)}) submitted.`, 'info');
    addNotification({
      title: 'Operating Expense Submitted',
      message: `${newExpense.title} (${formatNaira(newExpense.amount)}) submitted by ${newExpense.requestedBy}.`,
      type: 'finance',
      link: '/expenses',
    });
    logActivity({
      title: 'Operating Expense Logged',
      description: `${newExpense.title} (${formatNaira(newExpense.amount)}) submitted for funding.`,
      type: 'finance',
      user: newExpense.requestedBy || 'Finance',
    });
  };

  const updateExpenseStatus = (id: string, status: ExpenseStatus) => {
    const expense = expenses.find(e => e.id === id);
    setExpenses(prev => prev.map(e => e.id === id ? { ...e, status } : e));
    apiService.updateExpenseStatus(id, status);
    if (expense) {
      showToast('Expense Updated', `${expense.title} status changed to ${status}.`, status === 'Approved' ? 'success' : 'info');
      addNotification({
        title: `Expense ${status}`,
        message: `${expense.title} (${formatNaira(expense.amount)}) was ${status.toLowerCase()} by Controller.`,
        type: 'finance',
        link: '/expenses',
      });
    }
    logActivity({
      title: 'Expense Status Updated',
      description: `Expense record status updated to ${status}.`,
      type: 'finance',
      user: 'Finance Controller',
    });
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

    // Update mentor sessions count and pending payout
    setMentors(prev => prev.map(m => {
      if (m.id === newSession.mentorId) {
        return {
          ...m,
          sessionsCount: m.sessionsCount + 1,
          pendingPayout: m.pendingPayout + newSession.compensationAmount,
        };
      }
      return m;
    }));

    apiService.createSession(sessionData);

    showToast(
      'Session Credited',
      `1-on-1 session logged. ${formatNaira(newSession.compensationAmount)} credited to ${newSession.mentorName}.`,
      'success'
    );

    addNotification({
      title: '1-on-1 Mentorship Honorarium Credited',
      message: `${newSession.mentorName} completed ${newSession.durationHours}h with ${newSession.studentName}. ${formatNaira(newSession.compensationAmount)} credited.`,
      type: 'mentor',
      link: '/mentors',
    });

    logActivity({
      title: 'Mentorship Session Logged',
      description: `${newSession.mentorName} scheduled ${newSession.durationHours}h with ${newSession.studentName}.`,
      type: 'mentor',
      user: newSession.mentorName,
    });
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

    await apiService.sendStaffWelcome(staff.email, staff.name, staff.roleTitle);

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
    setSettings(initialSettings);
    setActivityLogs(initialActivityLogs);
    setNotifications(initialNotifications);
    setStaffUsers(demoUsers);
    setCurrentUser(defaultAuthUser);
    apiService.resetDatabase();
    showToast('System Reset', 'All records restored to Nigerian demo seed data.', 'warning');
  };

  // KPIs
  const kpis: ExecutiveKPIs = useMemo(() => {
    const activeStudentCount = students.filter(s => s.status === 'Active').length;
    const totalRev = students.reduce((acc, s) => acc + (s.totalFees || 850000), 0);
    const mentorPay = mentors.reduce((acc, m) => acc + m.pendingPayout, 0);
    const totalExp = expenses.reduce((acc, e) => acc + e.amount, 0);
    const margin = totalRev > 0 ? Math.round(((totalRev - (mentorPay + totalExp)) / totalRev) * 100) : 51;

    return {
      totalRevenue: totalRev,
      revenueGrowth: 12.5,
      activeStudents: activeStudentCount,
      studentGrowth: 12.5,
      mentorPayouts: mentorPay,
      mentorGrowth: 4.2,
      totalExpenses: totalExp,
      expensesGrowth: -0.8,
      leadConversionRate: 18.4,
      operatingMargin: margin > 0 ? margin : 51,
    };
  }, [students, mentors, expenses]);

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
        addCourse,
        updateCourse,
        addCohort,
        bookSession,
        generateInvoice,
        updateSettings,
        logActivity,
        exportDatabaseBackup,
        restoreDatabaseBackup,
        flushProductionData,
        sendStaffWelcomeEmail,
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
