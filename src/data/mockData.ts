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
  AttendanceRecord,
  LMSModule,
  StudentAssignmentSubmission,
  CampusLocation,
  StudentPerformanceReport,
  CustomRoleDefinition,
  SupportTicket
} from '../types/crm';

export const initialCampuses: CampusLocation[] = [
  {
    id: 'campus-vi',
    code: 'LOS-VI',
    name: 'Victoria Island Executive Hub',
    address: 'Plot 14, Idejo Street, Victoria Island',
    city: 'Lagos State',
    latitude: 6.4281,
    longitude: 3.4219,
    radiusMeters: 300,
    isActive: true,
  },
  {
    id: 'campus-yaba',
    code: 'LOS-YAB',
    name: 'Yaba Innovation & Tech Campus',
    address: '294 Herbert Macaulay Way, Alagomeji, Yaba',
    city: 'Lagos State',
    latitude: 6.5186,
    longitude: 3.3768,
    radiusMeters: 350,
    isActive: true,
  },
  {
    id: 'campus-abj',
    code: 'ABJ-CBD',
    name: 'Abuja Federal Executive Campus',
    address: 'Plot 782, Cadastral Zone A00, Central Business District',
    city: 'FCT Abuja',
    latitude: 9.0579,
    longitude: 7.4951,
    radiusMeters: 400,
    isActive: true,
  },
];

export const initialStudentPerformanceReports: StudentPerformanceReport[] = [
  {
    id: 'rep-001',
    reportCode: 'REP-CDL-2026-001',
    studentId: 'stu-demo-001',
    studentName: 'Adebayo Adeleke',
    studentCode: 'STU-8492',
    program: 'Full-Stack Software Engineering',
    mentorId: 'men-demo-001',
    mentorName: 'Dr. Chidi Okeke',
    submittedAt: '2026-09-08T10:30:00Z',
    performanceScore: 92,
    performanceTier: 'Exceeding',
    attendanceRating: 'Consistent',
    technicalMasteryNotes: 'Adebayo demonstrates exceptional mastery in TypeScript and state architecture. Completed the Accessible Interactive Dashboard lab with stellar test coverage.',
    welfareObservations: 'High engagement and active collaboration during group sessions. No device or connectivity impediments reported.',
    recommendations: 'Recommended for peer code review leadership and direct referral to Paystack corporate hiring pipeline.',
    managementFollowUpStatus: 'Resolved',
    managementNotes: 'Reviewed and acknowledged by Head of Admissions and Super Admin.',
    reviewedBy: 'Folake Solanke',
    reviewedAt: '2026-09-09T14:00:00Z'
  }
];

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
  ],
  paystackPublicKey: 'pk_test_cd572a18dd78ed5493d15433b0e1f3c2057fce2a',
  paystackSecretKey: 'sk_test_5a3331f29eadb22de95a766cdd1dc432e186ab7f',
  paystackLiveMode: false,
  enabledModules: {
    lms: true,
    leads: true,
    courses: true,
    students: true,
    mentors: true,
    attendance: true,
    expenses: true,
  },
  defaultMinimumLearningHours: 40,
  campusLocationsList: initialCampuses,
};

export const initialLMSModules: LMSModule[] = [
  {
    id: 'mod-1',
    courseTitle: 'Full-Stack Software Engineering',
    title: 'Module 1: Enterprise Web Architecture & Modern Frontend',
    description: 'Master TypeScript, modern component architecture, state machines, and responsive layouts.',
    order: 1,
    lessons: [
      {
        id: 'les-1-1',
        moduleId: 'mod-1',
        title: '1.1 Deep Dive: TypeScript Generics & Strict Typing Systems',
        durationMinutes: 45,
        type: 'video',
        videoUrl: 'https://www.youtube.com/embed/BCg4U1FzODs',
        contentMarkdown: `### Learning Objectives
- Master TypeScript strict compilation flags and type narrowing.
- Implement reusable generic interfaces for enterprise REST and GraphQL consumers.
- Build type-safe schemas using Zod and TypeScript AST validation.

#### Architectural Checklist
1. Never use \`any\` in production APIs. Use \`unknown\` and discriminant unions.
2. Structure custom utility types using conditional types (\`T extends U ? X : Y\`).
3. Maintain immutable state representations in client applications.`,
        resources: [
          { title: 'TypeScript 5 Handbook', url: 'https://www.typescriptlang.org/docs/' },
          { title: 'Clean Code in TypeScript', url: 'https://github.com/labs/ts-patterns' }
        ]
      },
      {
        id: 'les-1-2',
        moduleId: 'mod-1',
        title: '1.2 State Architecture: TanStack Query & Optimistic Mutations',
        durationMinutes: 50,
        type: 'reading',
        contentMarkdown: `### Enterprise State Management Patterns
Managing server cache versus transient client UI state is the cornerstone of responsive web applications.

#### Key Principles
- **Server Cache**: Keep data cached with automatic invalidation and background refetching.
- **Optimistic UI**: Mutate local state immediately, then revert gracefully if network or business validation fails.
- **Deduplication**: Prevent redundant roundtrips across deeply nested component hierarchies.`,
        resources: [
          { title: 'TanStack Query v5 Docs', url: 'https://tanstack.com/query/latest' }
        ]
      },
      {
        id: 'les-1-3',
        moduleId: 'mod-1',
        title: '1.3 Hands-On Lab: Build an Accessible Interactive Dashboard Table',
        durationMinutes: 90,
        type: 'lab',
        contentMarkdown: `### Lab Deliverables
You will build a full-featured data table component featuring:
- Server-side pagination and debounce searching
- Keyboard navigation (WCAG 2.2 AA compliant)
- Dynamic column sorting and export to CSV

Submit your GitHub repository link and deployed Vercel/Netlify staging URL below.`,
        resources: [
          { title: 'W3C ARIA Table Guidelines', url: 'https://www.w3.org/WAI/ARIA/apg/patterns/table/' }
        ]
      }
    ]
  },
  {
    id: 'mod-2',
    courseTitle: 'Full-Stack Software Engineering',
    title: 'Module 2: Scalable Backend Services & API Security',
    description: 'Design robust microservices with Node.js, Express, PostgreSQL, and secure auth tokens.',
    order: 2,
    lessons: [
      {
        id: 'les-2-1',
        moduleId: 'mod-2',
        title: '2.1 Relational Schema Modeling & Query Optimization in PostgreSQL',
        durationMinutes: 60,
        type: 'video',
        videoUrl: 'https://www.youtube.com/embed/qw--VYLpxG4',
        contentMarkdown: `### Database Engineering in Fintech & Edtech
Learn normalization (3NF), B-tree indexing strategies, foreign key cascades, and ACID transactions.`,
        resources: [
          { title: 'PostgreSQL 16 Performance Guide', url: 'https://www.postgresql.org/docs/' }
        ]
      },
      {
        id: 'les-2-2',
        moduleId: 'mod-2',
        title: '2.2 Payment Gateway Integration: Paystack API & Webhook Verification',
        durationMinutes: 65,
        type: 'lab',
        contentMarkdown: `### Production Payment Processing
Integrate Paystack Inline and Webhooks to handle card payments, bank transfers, and automated commission payouts.

#### Security Requirements
- Compute and verify HMAC SHA512 signatures using your secret key.
- Guarantee idempotent transaction processing to avoid double-crediting.
- Mask sensitive transaction metadata.`,
        resources: [
          { title: 'Paystack Developer API Docs', url: 'https://paystack.com/docs/api/' }
        ]
      }
    ]
  },
  {
    id: 'mod-3',
    courseTitle: 'Full-Stack Software Engineering',
    title: 'Module 3: Cloud Deployment, Docker & DevOps Automation',
    description: 'Deploy resilient containerized workloads to Linux VPS instances with Nginx reverse proxies and SSL certificates.',
    order: 3,
    lessons: [
      {
        id: 'les-3-1',
        moduleId: 'mod-3',
        title: '3.1 Containerization with Docker & Multi-Stage Production Builds',
        durationMinutes: 55,
        type: 'video',
        videoUrl: 'https://www.youtube.com/embed/gAkwW2tuIqE',
        contentMarkdown: `### Containerizing Full-Stack Applications
Learn to write lean Dockerfiles, leverage caching layers, configure non-root user execution, and spin up multi-container compositions with Docker Compose.`,
        resources: [
          { title: 'Docker Official Documentation', url: 'https://docs.docker.com/' }
        ]
      },
      {
        id: 'les-3-2',
        moduleId: 'mod-3',
        title: '3.2 Capstone Project Submission & Mentor Defense',
        durationMinutes: 120,
        type: 'lab',
        contentMarkdown: `### Capstone Project Defense
Submit your production-ready SaaS application featuring real-time authentication, database persistence, payment integration, and cloud deployment. Your assigned mentor will review and schedule your 1-on-1 defense session.`,
        resources: [
          { title: 'Capstone Rubric & Evaluation Sheet', url: '#' }
        ]
      }
    ]
  }
];

export const initialAssignments: StudentAssignmentSubmission[] = [
  {
    id: 'sub-001',
    studentId: 'stu-demo-001',
    studentName: 'Adebayo Adeleke',
    courseTitle: 'Full-Stack Software Engineering',
    moduleTitle: 'Module 1: Enterprise Web Architecture & Modern Frontend',
    taskTitle: '1.3 Hands-On Lab: Build an Accessible Interactive Dashboard Table',
    githubUrl: 'https://github.com/codelab-institute/accessible-table-lab',
    liveUrl: 'https://table-lab-demo.vercel.app',
    notes: 'Completed all pagination requirements and full WCAG keyboard navigation support.',
    submittedAt: '2026-09-08T14:30:00Z',
    status: 'Passed',
    grade: 95,
    mentorFeedback: 'Outstanding work on keyboard event handling and focus management! Clean TypeScript interfaces throughout.',
    reviewedBy: 'Dr. Chidi Okeke',
    reviewedAt: '2026-09-09T10:15:00Z'
  }
];

export const demoUsers: AuthUser[] = [
  {
    id: 'user-admin',
    name: 'Abiola Adefowope',
    email: 'abiola.adefowope@codelab.institute',
    role: 'super_admin',
    roleTitle: 'Managing Director & Super Admin',
    department: 'Executive Board',
    password: 'password123',
  },
  {
    id: 'user-student-demo',
    name: 'Adebayo Adeleke',
    email: 'student@codelab.institute',
    role: 'student',
    roleTitle: 'Enrolled Scholar (Software Engineering)',
    department: 'School of Technology',
    password: 'password123',
    studentId: 'stu-demo-001',
  },
  {
    id: 'user-mentor-demo',
    name: 'Dr. Chidi Okeke',
    email: 'chidi.okeke@codelab.institute',
    role: 'mentor',
    roleTitle: 'Lead Engineering Faculty & Senior Mentor',
    department: 'Engineering Mentorship',
    password: 'password123',
  },
  {
    id: 'user-admissions-demo',
    name: 'Zainab Bello',
    email: 'admissions@codelab.institute',
    role: 'admissions',
    roleTitle: 'Head of Admissions & Enrollments',
    department: 'Admissions Office',
    password: 'password123',
  },
  {
    id: 'user-finance-demo',
    name: 'Olumide Fashola',
    email: 'finance@codelab.institute',
    role: 'finance',
    roleTitle: 'Bursar & Financial Controller',
    department: 'Bursary & Accounts',
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

export const defaultRoleDefinitions: CustomRoleDefinition[] = [
  {
    id: 'super_admin',
    name: 'Super Admin / Managing Director',
    description: 'Complete unrestricted access across all institution modules, financial ledgers, and configurations.',
    isSystem: true,
    badgeColor: 'bg-primary/10 text-primary border border-primary/20',
    allowedModules: ['reports', 'leads', 'courses', 'students', 'mentors', 'attendance', 'expenses', 'tickets', 'settings', 'lms'],
    permissions: {
      canAddCourses: true,
      canAddCohorts: true,
      canAddLeads: true,
      canEnrollStudents: true,
      canLogExpenses: true,
      canApproveExpenses: true,
      canIssueCertificates: true,
      canViewBilling: true,
      canManageSettings: true,
      canManageAttendance: true,
      canSubmitReports: true,
    }
  },
  {
    id: 'admissions',
    name: 'Head of Admissions & Enrollments',
    description: 'Manages prospect intake, converts leads, adds academic programs/cohorts, and registers student scholars.',
    isSystem: true,
    badgeColor: 'bg-blue-500/10 text-blue-700 border border-blue-500/20',
    allowedModules: ['reports', 'leads', 'courses', 'students', 'attendance', 'tickets'],
    permissions: {
      canAddCourses: true, // Specifically enabled per user request!
      canAddCohorts: true,
      canAddLeads: true,
      canEnrollStudents: true,
      canLogExpenses: false,
      canApproveExpenses: false,
      canIssueCertificates: true,
      canViewBilling: true,
      canManageSettings: false,
      canManageAttendance: true,
      canSubmitReports: false,
    }
  },
  {
    id: 'mentor',
    name: 'Faculty Mentor & Instructor',
    description: 'Reviews student lab deliverables, grades assignments, conducts coaching sessions, and submits welfare reports.',
    isSystem: true,
    badgeColor: 'bg-purple-500/10 text-purple-700 border border-purple-500/20',
    allowedModules: ['mentors', 'students', 'courses', 'attendance', 'tickets'],
    permissions: {
      canAddCourses: false,
      canAddCohorts: false,
      canAddLeads: false,
      canEnrollStudents: false,
      canLogExpenses: false,
      canApproveExpenses: false,
      canIssueCertificates: false,
      canViewBilling: false, // Protected confidentiality
      canManageSettings: false,
      canManageAttendance: true,
      canSubmitReports: true,
    }
  },
  {
    id: 'finance',
    name: 'Bursary & Financial Controller',
    description: 'Authorizes expense disbursements, verifies NIBSS/Paystack student tuition settlements, and tracks budgets.',
    isSystem: true,
    badgeColor: 'bg-emerald-500/10 text-emerald-700 border border-emerald-500/20',
    allowedModules: ['reports', 'expenses', 'students', 'attendance', 'tickets'],
    permissions: {
      canAddCourses: false,
      canAddCohorts: false,
      canAddLeads: false,
      canEnrollStudents: false,
      canLogExpenses: true,
      canApproveExpenses: true,
      canIssueCertificates: false,
      canViewBilling: true,
      canManageSettings: false,
      canManageAttendance: true,
      canSubmitReports: false,
    }
  },
  {
    id: 'student',
    name: 'Enrolled Scholar / Student',
    description: 'Scholar portal with access to curriculum tracks, interactive labs, mentor bookings, and tuition installment checkout.',
    isSystem: true,
    badgeColor: 'bg-amber-500/10 text-amber-700 border border-amber-500/20',
    allowedModules: ['lms', 'tickets'],
    permissions: {
      canAddCourses: false,
      canAddCohorts: false,
      canAddLeads: false,
      canEnrollStudents: false,
      canLogExpenses: false,
      canApproveExpenses: false,
      canIssueCertificates: false,
      canViewBilling: false,
      canManageSettings: false,
      canManageAttendance: false,
      canSubmitReports: false,
    }
  },
  {
    id: 'it_support',
    name: 'IT & Systems Operations',
    description: 'Oversees technical infrastructure, system audit logs, app bug reports, and platform configurations.',
    isSystem: false,
    badgeColor: 'bg-cyan-500/10 text-cyan-700 border border-cyan-500/20',
    allowedModules: ['reports', 'attendance', 'tickets', 'settings'],
    permissions: {
      canAddCourses: false,
      canAddCohorts: false,
      canAddLeads: false,
      canEnrollStudents: false,
      canLogExpenses: false,
      canApproveExpenses: false,
      canIssueCertificates: false,
      canViewBilling: false,
      canManageSettings: true,
      canManageAttendance: true,
      canSubmitReports: false,
    }
  },
  {
    id: 'customer_service',
    name: 'Customer Support & Scholar Welfare',
    description: 'Assists prospective inquiries, handles student complaints, manages support tickets, and monitors feedback.',
    isSystem: false,
    badgeColor: 'bg-rose-500/10 text-rose-700 border border-rose-500/20',
    allowedModules: ['leads', 'students', 'tickets'],
    permissions: {
      canAddCourses: false,
      canAddCohorts: false,
      canAddLeads: true,
      canEnrollStudents: false,
      canLogExpenses: false,
      canApproveExpenses: false,
      canIssueCertificates: false,
      canViewBilling: false,
      canManageSettings: false,
      canManageAttendance: false,
      canSubmitReports: false,
    }
  }
];

export const initialTickets: SupportTicket[] = [
  {
    id: 'tkt-001',
    ticketNumber: 'TKT-1001',
    title: 'Paystack checkout timeout on Mobile Safari during weekend',
    description: 'Two prospective students reported an intermittent session delay when verifying OTP over MTN 4G network.',
    category: 'billing',
    priority: 'high',
    status: 'open',
    createdBy: {
      id: 'user-admissions-demo',
      name: 'Zainab Bello',
      email: 'admissions@codelab.institute',
      role: 'admissions',
      roleTitle: 'Head of Admissions & Enrollments',
    },
    createdAt: '2026-09-10T14:22:00Z',
    updatedAt: '2026-09-10T14:22:00Z',
    comments: [
      {
        id: 'comm-1',
        ticketId: 'tkt-001',
        authorName: 'Abiola Adefowope',
        authorEmail: 'abiola.adefowope@codelab.institute',
        authorRole: 'Super Admin',
        content: 'Investigating with Paystack webhook logs. Added a retry fallback timeout.',
        createdAt: '2026-09-10T15:00:00Z'
      }
    ]
  },
  {
    id: 'tkt-002',
    ticketNumber: 'TKT-1002',
    title: 'Suggestion: Add dark mode toggle in PWA mobile bottom nav',
    description: 'For night study sessions in the Yaba campus lab, a quick dark mode switch would improve readability.',
    category: 'feature_request',
    priority: 'medium',
    status: 'in_progress',
    createdBy: {
      id: 'stu-demo-001',
      name: 'Adebayo Adeleke',
      email: 'student@codelab.institute',
      role: 'student',
      roleTitle: 'Enrolled Scholar / Student',
    },
    createdAt: '2026-09-11T09:15:00Z',
    updatedAt: '2026-09-11T11:45:00Z',
    comments: []
  }
];
