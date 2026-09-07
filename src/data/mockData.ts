import { 
  Lead, 
  Student, 
  Mentor, 
  Expense, 
  AuthUser, 
  CourseProgram, 
  Cohort, 
  Invoice, 
  MentorshipSession, 
  OrganizationSettings, 
  ActivityLogItem, 
  NotificationItem,
  AttendanceRecord 
} from '../types/crm';

export const initialLeads: Lead[] = [];
export const initialStudents: Student[] = [];
export const initialMentors: Mentor[] = [];
export const initialExpenses: Expense[] = [];
export const initialCourses: CourseProgram[] = [];
export const initialCohorts: Cohort[] = [];
export const initialInvoices: Invoice[] = [];
export const initialSessions: MentorshipSession[] = [];
export const initialAttendance: AttendanceRecord[] = [];

export const initialSettings: OrganizationSettings = {
  instituteName: 'CODELAB EDUCARE LTD',
  portalTitle: 'CODELAB EDUCARE Enterprise Portal',
  address: 'Plot 14, Victoria Island Financial District, Lagos, Nigeria',
  campusLocations: [
    'Victoria Island Tech Hub, Lagos',
    'Yaba Innovation Campus, Lagos',
    'Maitama Innovation Center, Abuja'
  ],
  email: 'admin@codelab.institute',
  phone: '+234 1 800 63987',
  tinNumber: 'TIN-29481029-0001',
  cacNumber: 'RC-1849201',
  defaultCurrency: 'NGN (₦)',
  defaultNIBSSBank: {
    bankName: 'Access Bank Nigeria PLC',
    accountNumber: '0812948192',
    accountName: 'CODELAB EDUCARE LTD',
  },
  emailAlertsEnabled: true,
  autoInvoiceGeneration: true,
  operatingBudget: 1500000,
  showBudgetToStaff: true,
  officeLocation: {
    name: 'Lagos Headquarters Hub (Yaba, Lagos)',
    latitude: 6.5181,
    longitude: 3.3768,
    radiusMeters: 400,
  },
  workHoursPolicy: {
    expectedClockInTime: '09:00',
    expectedClockOutTime: '17:00',
    gracePeriodMinutes: 15,
  },
  smtp: {
    host: 'smtp.zoho.com',
    port: 465,
    user: 'admin@codelab.institute',
    pass: '9)8JAr$m',
    from: '"CODELAB EDUCARE LTD" <admin@codelab.institute>',
    secure: true,
  },
  courseCategories: [
    'Software Engineering',
    'Data Science & Analytics',
    'Product Design (UI/UX)',
    'Cloud Engineering & DevOps',
    'Cybersecurity & Information Security',
    'Product Management',
    'Artificial Intelligence & Machine Learning',
    'Digital Marketing & Growth',
  ]
};

export const demoUsers: AuthUser[] = [
  {
    id: 'user-admin',
    name: 'Abiola Adefowope',
    email: 'abiola.adefowope@codelab.institute',
    role: 'super_admin',
    roleTitle: 'Managing Director & Super Admin',
    department: 'Executive Board',
    password: 'password123',
  }
];

export const defaultAuthUser = demoUsers[0];

export const initialNotifications: NotificationItem[] = [
  {
    id: 'notif-init',
    title: '🚀 Production Workspace Initialized',
    message: 'All demo datasets cleared. Ready for live students, leads, invoices, and staff accounts.',
    type: 'system',
    timestamp: 'Just now',
    read: false,
    link: '/settings',
  }
];

export const initialActivityLogs: ActivityLogItem[] = [
  {
    id: 'act-init',
    timestamp: 'Just now',
    title: 'System Initialized for Production',
    description: 'Workspace cleared with abiola.adefowope@codelab.institute as Super Admin.',
    type: 'system',
    user: 'Abiola Adefowope',
  }
];
