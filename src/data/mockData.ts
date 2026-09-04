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
  NotificationItem 
} from '../types/crm';

export const initialLeads: Lead[] = [];
export const initialStudents: Student[] = [];
export const initialMentors: Mentor[] = [];
export const initialExpenses: Expense[] = [];
export const initialCourses: CourseProgram[] = [];
export const initialCohorts: Cohort[] = [];
export const initialInvoices: Invoice[] = [];
export const initialSessions: MentorshipSession[] = [];

export const initialSettings: OrganizationSettings = {
  instituteName: 'Nexus Institute of Technology & Management',
  portalTitle: 'Edu-Business Operations Enterprise Portal',
  address: 'Plot 14, Victoria Island Financial District, Lagos, Nigeria',
  campusLocations: [
    'Victoria Island Tech Hub, Lagos',
    'Yaba Innovation Campus, Lagos',
    'Maitama Innovation Center, Abuja'
  ],
  email: 'operations@codelab.institute',
  phone: '+234 1 800 63987',
  tinNumber: 'TIN-29481029-0001',
  cacNumber: 'RC-1849201',
  defaultCurrency: 'NGN (₦)',
  defaultNIBSSBank: {
    bankName: 'Access Bank Nigeria PLC',
    accountNumber: '0812948192',
    accountName: 'NEXUS TECH OPERATIONS LTD',
  },
  emailAlertsEnabled: true,
  autoInvoiceGeneration: true,
  operatingBudget: 1500000,
  showBudgetToStaff: true,
  smtp: {
    host: 'smtp.hostinger.com',
    port: 465,
    user: '',
    pass: '',
    from: '"Nexus Institute" <support@growpot.cloud>',
    secure: true,
  }
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
