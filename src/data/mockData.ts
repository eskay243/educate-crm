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
  SupportTicket,
  TimetableSlot,
  MentorPayoutRequest
} from '../types/crm';
import { financialTradingCourse, mentorAbiola, staffUserAbiola, financialTradingModules } from './financialTradingData';

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

export const initialCourses: CourseProgram[] = [
  financialTradingCourse,
  {
    id: 'course-se-01',
    code: 'CSE-101',
    title: 'Full-Stack Software Engineering',
    category: 'Software Engineering',
    description: 'Comprehensive software engineering bootcamp covering modern frontend, backend microservices, DevOps, and cloud deployment.',
    durationWeeks: 9,
    durationDays: 60,
    durationTrack: '60-Day Practitioner',
    tuitionFee: 350000,
    syllabusModules: ['mod-1', 'mod-2', 'mod-3'],
    leadInstructor: 'Dr. Chidi Okeke',
    assignedMentors: [
      {
        mentorId: 'user-mentor-demo',
        mentorName: 'Dr. Chidi Okeke',
        sharePercentage: 50,
        role: 'Lead Engineering Faculty'
      },
      {
        mentorId: 'men-abiola-adefowope',
        mentorName: 'Abiola Adefowope',
        sharePercentage: 50,
        role: 'Co-Faculty Instructor'
      }
    ],
    enrolledCount: 1,
    status: 'Active',
    rating: 4.9,
    minimumRequiredHours: 40,
    nsqfLevel: 'NSQF Level 4 (National Vocational Certificate)',
    nitdaTrack: 'NITDA 3MTT / NDLEP Software Engineering Track',
    theoryHours: 25,
    practicalHours: 60,
    learningGuidelinesSummary: 'Covers full development lifecycle from TypeScript architecture to Dockerized Linux VPS microservices. Requires 70% practical lab completion.',
  },
  {
    id: 'course-fe-02',
    code: 'CFE-201',
    title: 'Frontend React & TypeScript Sprint',
    category: 'Software Engineering',
    description: 'Fast-track intensive sprint for developing accessible, reactive user interfaces with React 19, Tailwind CSS, and REST API consumption.',
    durationWeeks: 4,
    durationDays: 30,
    durationTrack: '30-Day Sprint',
    tuitionFee: 180000,
    syllabusModules: ['mod-fe-1', 'mod-fe-2'],
    leadInstructor: 'Engr. Damilola Adeyemi',
    enrolledCount: 4,
    status: 'Active',
    rating: 4.8,
    minimumRequiredHours: 25,
    nsqfLevel: 'NSQF Level 3 (Junior Web Practitioner)',
    nitdaTrack: 'NITDA Digital Skills Initiative (Frontend Track)',
    theoryHours: 12,
    practicalHours: 36,
    learningGuidelinesSummary: '30-Day accelerated program focusing on high-speed UI prototyping, state architecture, and verifiable GitHub project portfolio.',
  },
  {
    id: 'course-da-03',
    code: 'CDA-301',
    title: 'Data Analytics & Python Intelligence',
    category: 'Data Science & Analytics',
    description: 'Practical data analytics with Python, Pandas, SQL databases, PowerBI interactive reporting, and statistical modeling.',
    durationWeeks: 9,
    durationDays: 60,
    durationTrack: '60-Day Practitioner',
    tuitionFee: 320000,
    syllabusModules: ['mod-da-1', 'mod-da-2'],
    leadInstructor: 'Dr. Amina Yusuf',
    enrolledCount: 6,
    status: 'Active',
    rating: 4.9,
    minimumRequiredHours: 35,
    nsqfLevel: 'NSQF Level 4 (Data Analyst Practitioner)',
    nitdaTrack: 'NITDA National Data & AI Framework',
    theoryHours: 20,
    practicalHours: 50,
    learningGuidelinesSummary: '60-Day practitioner syllabus with emphasis on real Nigerian market datasets, financial time-series analysis, and executive dashboards.',
  }
];

export const initialCohorts: Cohort[] = [
  {
    id: 'coh-2026-01',
    cohortCode: 'COH-ALPHA-26',
    name: 'Cohort Alpha 2026',
    programId: 'course-se-01',
    programName: 'Full-Stack Software Engineering',
    startDate: '2026-02-01',
    endDate: '2026-05-30',
    maxCapacity: 30,
    enrolledCount: 1,
    instructorName: 'Dr. Chidi Okeke',
    status: 'In Progress',
  }
];

export const initialMentors: Mentor[] = [
  mentorAbiola,
  {
    id: 'user-mentor-demo',
    mentorCode: 'MEN-001',
    name: 'Dr. Chidi Okeke',
    email: 'chidi.okeke@codelab.institute',
    phone: '+234 802 345 6789',
    role: 'Lead Engineering Faculty',
    department: 'Engineering Mentorship',
    expertise: ['TypeScript', 'Node.js', 'PostgreSQL', 'Cloud Infrastructure'],
    courses: ['Full-Stack Software Engineering'],
    maxCapacity: 25,
    activeMentees: 8,
    rating: 4.9,
    sessionsCount: 16,
    commissionRate: 37,
    assignedEnrollmentsCount: 8,
    pendingPayout: 185000,
    paidPayout: 540000,
    totalEarned: 725000,
    payoutStatus: 'Pending',
    status: 'Active',
    isActive: true,
    lecturedHours: 24,
    minimumRequiredHours: 20,
    joinedDate: '2026-01-15',
    bio: 'Senior Software Architect and Tech Educator with over a decade of industry experience in scalable distributed systems.',
    bankName: 'Access Bank Nigeria PLC',
    bankCode: '044',
    accountNumber: '0123456789',
    accountName: 'Chidi Okeke',
    bvn: '22114477889',
    isBankVerified: true,
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    dateOfBirth: '1984-05-22',
    gender: 'Male',
    nationality: 'Nigerian',
    stateOfOrigin: 'Anambra',
    lga: 'Idemili North',
    idType: 'International Passport',
    idNumber: 'A10984729',
    idDocumentName: 'Passport_BioData_Dr_Chidi_Okeke.pdf',
    idDocumentUrl: 'https://codelab.institute/docs/passport-sample.pdf',
    isIdVerified: true,
    residentialAddress: 'Block 4, Flat 12, Admiralty Way, Lekki Phase 1',
    city: 'Lekki',
    stateOfResidence: 'Lagos',
    proofOfAddressName: 'Lekki_Tenancy_Agreement_2026.pdf',
    proofOfAddressUrl: 'https://codelab.institute/docs/tenancy-sample.pdf',
    nextOfKinName: 'Dr. Ngozi Okeke',
    nextOfKinRelationship: 'Spouse',
    nextOfKinPhone: '+234 803 445 6677',
    nextOfKinAddress: 'Block 4, Flat 12, Admiralty Way, Lekki Phase 1, Lagos',
    kycTier: 3,
    kycStatus: 'Verified',
    position: 'Lead Engineering Faculty & Senior Mentor',
    reportsTo: 'Chief Operating Officer (COO)',
    annualLeaveAllowance: 20,
    annualLeaveUsed: 4,
    sickLeaveAllowance: 10,
    sickLeaveUsed: 1,
    weeklyReports: [
      {
        id: 'rep-chidi-1',
        mentorId: 'user-mentor-demo',
        weekEnding: '2026-10-31',
        learnersCoveredCount: 8,
        sessionsHeldCount: 3,
        topicsCovered: ['PostgreSQL Relational Schemas', 'Indexing & Triggers', 'Node.js Express Integration'],
        keyHighlights: 'All 8 scholars successfully built authenticated REST endpoints with JWT validation. Chukwudi demonstrated high grasp of foreign key constraints.',
        challengesEncountered: 'Two students needed extra help debugging CORS headers.',
        actionItemsNextWeek: 'Introduce automated Jest integration test suites and prepare for Capstone Sprint 1.',
        submittedAt: '2026-10-31T17:00:00.000Z',
      }
    ],
    curriculumContributions: [
      {
        id: 'curr-1',
        mentorId: 'user-mentor-demo',
        title: 'Advanced SQL Query Optimization & Partitioning Lab',
        type: 'practical_exercise',
        track: 'Full-Stack Software Engineering',
        moduleName: 'Database Design & Distributed Systems',
        description: 'Hands-on indexing benchmark simulating 1,000,000 records in PostgreSQL with EXPLAIN ANALYZE metrics.',
        status: 'Approved',
        submittedAt: '2026-10-12T11:00:00.000Z',
      }
    ],
    learningMaterials: [
      {
        id: 'mat-chidi-1',
        mentorId: 'user-mentor-demo',
        title: 'Production Backend API Boilerplate (Express + TypeScript + Prisma)',
        track: 'Full-Stack Software Engineering',
        resourceType: 'github_repo',
        url: 'https://github.com/codelab-institute/fullstack-starter-2026',
        description: 'Starter repo with JWT authentication, Postgres schema migrations, and structured Docker Compose.',
        uploadedAt: '2026-10-15T10:00:00.000Z',
        isPublicToLearners: true,
      },
      {
        id: 'mat-chidi-2',
        mentorId: 'user-mentor-demo',
        title: 'Microservices & Event-Driven Architecture System Design (Notion Doc)',
        track: 'Full-Stack Software Engineering',
        resourceType: 'link',
        url: 'https://notion.so/codelab/distributed-systems-design',
        description: 'Comprehensive guide covering RabbitMQ, Redis pub/sub, and eventual consistency patterns.',
        uploadedAt: '2026-10-22T14:30:00.000Z',
        isPublicToLearners: true,
      }
    ],
    performanceReviews: [
      {
        id: 'rev-chidi-1',
        mentorId: 'user-mentor-demo',
        reviewPeriod: 'October 2026',
        score: 96,
        attendanceDeliveryRate: 98,
        learnerSatisfactionScore: 4.9,
        leadershipNotes: 'Exceptional delivery on the backend module. Scholars reported high clarity during live coding sessions. Commended for proactive weekend office hours.',
        reviewerName: 'Managing Director / COO',
        reviewerRole: 'COO',
        commendations: ['High student completion rate on Project 2', 'Punctual class check-ins'],
        reviewedAt: '2026-10-31T15:00:00.000Z',
      }
    ],
    reimbursementRequests: [
      {
        id: 'reimb-chidi-1',
        mentorId: 'user-mentor-demo',
        amount: 25000,
        type: 'data_stipend',
        description: 'MTN 5G Broadband data top-up for 4K live streaming lectures',
        status: 'Disbursed',
        requestedAt: '2026-10-15T09:00:00.000Z',
        approvedBy: 'Financial Controller',
        disbursedAt: '2026-10-16T12:00:00.000Z',
        voucherNumber: 'VCH-7104',
      }
    ],
    leaveRecords: [
      {
        id: 'leave-chidi-1',
        mentorId: 'user-mentor-demo',
        leaveType: 'Annual',
        startDate: '2026-08-10',
        endDate: '2026-08-14',
        daysCount: 4,
        reason: 'Annual family recess and tech curriculum research',
        status: 'Approved',
        approvedBy: 'Academic Director / COO',
        appliedAt: '2026-08-01T09:00:00.000Z',
      }
    ],
    companyProperty: [
      {
        id: 'prop-chidi-1',
        mentorId: 'user-mentor-demo',
        itemType: 'Laptop / MacBook',
        itemDescription: 'Apple MacBook Pro 16" (M3 Pro, 36GB RAM, 512GB SSD Space Black)',
        serialNumber: 'C02G90XXMD6M',
        assetTag: 'CDL-ASSET-2026-042',
        issuedDate: '2026-01-16',
        conditionOnIssue: 'Brand New',
        status: 'In Possession',
      },
      {
        id: 'prop-chidi-2',
        mentorId: 'user-mentor-demo',
        itemType: 'Monitor',
        itemDescription: 'Dell UltraSharp 27" 4K USB-C Hub Monitor (U2723QE)',
        serialNumber: 'CN-0K791X-74261',
        assetTag: 'CDL-ASSET-2026-089',
        issuedDate: '2026-01-16',
        conditionOnIssue: 'Brand New',
        status: 'In Possession',
      },
      {
        id: 'prop-chidi-3',
        mentorId: 'user-mentor-demo',
        itemType: 'Lab Access Key / Badge',
        itemDescription: 'Yaba Tech Hub RFID Master Keycard & Server Room Token',
        assetTag: 'CDL-KEY-YAB-07',
        issuedDate: '2026-01-16',
        conditionOnIssue: 'Good',
        status: 'In Possession',
      }
    ],
    exitRecord: {
      noticePeriodDays: 30,
      status: 'Active Staff',
      ticketReference: 'TKT-1038',
      handoverChecklist: [
        { id: 'chk-1', label: 'Return issued MacBook Pro M3 and charger to IT Administrator', completed: true, verifiedBy: 'IT Operations Lead', verifiedAt: '2026-10-30T10:00:00.000Z' },
        { id: 'chk-2', label: 'Return Dell UltraSharp 4K Monitor and cables to Campus Hub', completed: true, verifiedBy: 'Hub Facility Manager', verifiedAt: '2026-10-30T10:30:00.000Z' },
        { id: 'chk-3', label: 'Surrender RFID Campus Keycard & Lab Access Token', completed: true, verifiedBy: 'Security & Facilities', verifiedAt: '2026-10-30T11:00:00.000Z' },
        { id: 'chk-4', label: 'Transition assigned student cohorts to designated interim faculty lead', completed: true, verifiedBy: 'Academic Program Officer', verifiedAt: '2026-10-30T14:00:00.000Z' },
        { id: 'chk-5', label: 'Submit all outstanding project evaluations and gradebook sign-offs', completed: true, verifiedBy: 'Registrar & Academic Board', verifiedAt: '2026-10-30T16:00:00.000Z' },
        { id: 'chk-6', label: 'Reconcile final 37% commission payout and OpEx reimbursement claims', completed: true, verifiedBy: 'Bursar & Finance Desk', verifiedAt: '2026-10-30T17:00:00.000Z' },
      ]
    },
    officeHours: [
      {
        id: 'slot-1',
        dayOfWeek: 'Tuesday',
        startTime: '14:00',
        endTime: '17:00',
        slotDurationMinutes: 30,
        meetingLink: 'https://meet.google.com/nex-codelab-1on1',
        locationType: 'Google Meet (Online)',
        isActive: true,
      },
      {
        id: 'slot-2',
        dayOfWeek: 'Thursday',
        startTime: '10:00',
        endTime: '13:00',
        slotDurationMinutes: 30,
        meetingLink: 'https://meet.google.com/nex-codelab-1on1',
        locationType: 'Google Meet (Online)',
        isActive: true,
      },
      {
        id: 'slot-3',
        dayOfWeek: 'Friday',
        startTime: '15:00',
        endTime: '17:00',
        slotDurationMinutes: 45,
        meetingLink: 'https://meet.google.com/nex-codelab-lab',
        locationType: 'Campus Hub Lab',
        isActive: true,
      },
    ],
  }
];

export const initialStudents: Student[] = [
  {
    id: 'stu-demo-001',
    studentCode: 'STU-8492',
    name: 'Adebayo Adeleke',
    email: 'student@codelab.institute',
    phone: '+234 809 111 2233',
    program: 'Full-Stack Software Engineering',
    cohort: 'Cohort Alpha 2026',
    mentorId: 'user-mentor-demo',
    mentorName: 'Dr. Chidi Okeke',
    status: 'Active',
    isActive: true,
    attendanceRate: 95,
    tuitionStatus: 'Paid',
    enrolledDate: '2026-02-01',
    totalFees: 350000,
    outstandingBalance: 0,
    tuitionAmount: 350000,
    paidAmount: 350000,
    courses: [
      {
        id: 'course-se-01',
        code: 'CSE-101',
        name: 'Full-Stack Software Engineering',
        semester: 'Semester 1 2026',
        instructor: 'Dr. Chidi Okeke',
        fee: 350000,
        billedDate: '2026-02-01',
      }
    ],
    installments: [],
    progressPercent: 45,
    attendedLearningHours: 24,
    minimumRequiredHours: 40,
    // Nigerian Standard 3-Tier KYC Data
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    dateOfBirth: '2001-08-14',
    gender: 'Male',
    nationality: 'Nigerian',
    stateOfOrigin: 'Oyo',
    lga: 'Ibadan North',
    idType: 'NIN',
    idNumber: '29481920381',
    idDocumentName: 'NIN_Slip_Adebayo_Adeleke.pdf',
    idDocumentUrl: 'https://codelab.institute/docs/nin-sample.pdf',
    isIdVerified: true,
    residentialAddress: '14 Obafemi Awolowo Way, Ikeja',
    city: 'Ikeja',
    stateOfResidence: 'Lagos',
    proofOfAddressName: 'EKEDC_Utility_Receipt_Jan2026.pdf',
    proofOfAddressUrl: 'https://codelab.institute/docs/utility-sample.pdf',
    nextOfKinName: 'Folashade Adeleke',
    nextOfKinRelationship: 'Mother',
    nextOfKinPhone: '+234 802 998 7766',
    nextOfKinAddress: '14 Obafemi Awolowo Way, Ikeja, Lagos',
    bankName: 'Guaranty Trust Bank (GTBank)',
    bankCode: '058',
    accountNumber: '0123984712',
    accountName: 'Adebayo Adeleke',
    bvn: '22334455667',
    isBankVerified: true,
    kycTier: 3,
    kycStatus: 'Verified',
    // 360 Profile Enhancements
    whatsapp: '+2348091112233',
    currentStage: 'Intermediate',
    skillsAcquired: [
      'Prompt Engineering',
      'Zapier Integrations',
      'Make.com Workflows',
      'n8n Custom Nodes',
      'REST APIs & Webhooks',
      'AI Chatbot Pipelines',
      'React & Tailwind CSS',
      'PostgreSQL & Supabase'
    ],
    startDate: '2026-02-01',
    expectedCompletionDate: '2026-06-30',
    mentorHistory: [
      {
        id: 'mh-001',
        previousMentorName: 'Engr. Folake Balogun',
        previousMentorId: 'men-demo-002',
        newMentorName: 'Dr. Chidi Okeke',
        newMentorId: 'user-mentor-demo',
        reassignedAt: '2026-02-15T10:00:00Z',
        reassignedBy: 'Admissions Officer (Bolanle)',
        reason: 'Transferred to Advanced AI Engineering Track under Dr. Chidi'
      }
    ],
    sessionAttendance: [
      {
        id: 'att-001',
        sessionId: 'slot-001',
        sessionTitle: '1.1 Deep Dive: TypeScript Generics & Strict Typing Systems',
        date: '2026-09-12',
        time: '10:00 AM - 12:00 PM',
        type: 'lecture',
        status: 'Present',
        hoursCredited: 2,
        mentorNotes: 'Active participation in generics architecture.'
      },
      {
        id: 'att-002',
        sessionId: 'slot-002',
        sessionTitle: '1.2 State Architecture: TanStack Query & Optimistic Mutations',
        date: '2026-09-19',
        time: '10:00 AM - 12:00 PM',
        type: 'lecture',
        status: 'Present',
        hoursCredited: 2,
        mentorNotes: 'Understood cache invalidation well.'
      },
      {
        id: 'att-003',
        sessionId: 'slot-003',
        sessionTitle: 'Special Workshop: Automating Workflows with Zapier and Make',
        date: '2026-09-26',
        time: '02:00 PM - 04:30 PM',
        type: 'workshop',
        status: 'Present',
        hoursCredited: 2.5,
        mentorNotes: 'Built live multi-branch automation.'
      },
      {
        id: 'att-004',
        sessionId: 'slot-004',
        sessionTitle: 'Webinar: Deploying Production AI Chatbots at Scale',
        date: '2026-10-03',
        time: '04:00 PM - 06:00 PM',
        type: 'webinar',
        status: 'Late',
        hoursCredited: 1.5,
        mentorNotes: 'Arrived 20 mins late due to network glitch, completed recording review.'
      },
      {
        id: 'att-005',
        sessionId: 'slot-005',
        sessionTitle: '1-on-1 Coaching & Capstone Review',
        date: '2026-10-10',
        time: '11:00 AM - 12:00 PM',
        type: 'coaching',
        status: 'Present',
        hoursCredited: 1,
        mentorNotes: 'Refined capstone architecture.'
      }
    ],
    mentorGoals: [
      {
        id: 'goal-001',
        title: 'Master Prompt Engineering and LLM Chains',
        category: 'Technical',
        targetDate: '2026-03-15',
        status: 'Achieved',
        mentorNotes: 'Demonstrated high fluency with multi-shot prompts and structured outputs.',
        achievedAt: '2026-03-14T16:00:00Z'
      },
      {
        id: 'goal-002',
        title: 'Build Autonomous n8n CRM Sync Pipeline',
        category: 'Portfolio',
        targetDate: '2026-04-10',
        status: 'Achieved',
        mentorNotes: 'Pipeline handles error fallbacks and webhook retries flawlessly.',
        achievedAt: '2026-04-08T18:30:00Z'
      },
      {
        id: 'goal-003',
        title: 'Complete Production Capstone Project',
        category: 'Technical',
        targetDate: '2026-05-30',
        status: 'In Progress',
        mentorNotes: 'Draft schema and UI prototypes completed.'
      }
    ],
    projects: [
      {
        id: 'proj-001',
        title: 'Automated Lead Qualification Pipeline with Make & n8n',
        type: 'automation_pipeline',
        description: 'End-to-end webhook workflow that ingests social leads, enriches via AI, and stores in CRM.',
        submissionStatus: 'Reviewed',
        deadline: '2026-03-25',
        projectLink: 'https://lead-flow-pipeline.up.railway.app',
        githubUrl: 'https://github.com/adebayo-adeleke/lead-flow-pipeline',
        score: 95,
        maxScore: 100,
        grade: 'A+',
        mentorFeedback: 'Superb architecture. Clean error handling nodes and webhook retry strategy.',
        reviewedBy: 'Dr. Chidi Okeke',
        reviewedAt: '2026-03-26T14:20:00Z'
      },
      {
        id: 'proj-002',
        title: 'AI Customer Support Chatbot with Tool Calling',
        type: 'chatbot',
        description: 'RAG-augmented assistant capable of looking up student invoices and office hours.',
        submissionStatus: 'Reviewed',
        deadline: '2026-04-20',
        projectLink: 'https://chat-assistant-demo.vercel.app',
        githubUrl: 'https://github.com/adebayo-adeleke/support-bot-ai',
        score: 91,
        maxScore: 100,
        grade: 'A',
        mentorFeedback: 'Prompt injection defenses were well implemented. Keep refining token usage.',
        reviewedBy: 'Dr. Chidi Okeke',
        reviewedAt: '2026-04-22T11:00:00Z'
      }
    ],
    assessments: [
      {
        id: 'ass-001',
        title: 'TypeScript & Object-Oriented Patterns Quiz',
        type: 'quiz',
        score: 19,
        maxScore: 20,
        grade: 'A',
        date: '2026-02-28',
        strengths: 'Solid understanding of generic type constraints and conditional types.',
        areasToImprove: 'Review recursive type aliases.'
      },
      {
        id: 'ass-002',
        title: 'Practical API & Webhook Stress Exercise',
        type: 'practical',
        score: 48,
        maxScore: 50,
        grade: 'A+',
        date: '2026-03-20',
        strengths: 'Built resilient backoff strategies for rate-limited endpoints.',
        areasToImprove: 'Add distributed tracing headers.'
      }
    ],
    mentorFeedbackNotes: [
      {
        id: 'mfn-001',
        mentorId: 'user-mentor-demo',
        mentorName: 'Dr. Chidi Okeke',
        date: '2026-03-10',
        feedbackType: 'regular',
        content: 'Adebayo has demonstrated steady dedication and strong analytical problem-solving in class.'
      },
      {
        id: 'mfn-002',
        mentorId: 'user-mentor-demo',
        mentorName: 'Dr. Chidi Okeke',
        date: '2026-03-28',
        feedbackType: 'commendation',
        content: 'Exceptional submission for the automated webhook workflow. Selected as cohort reference code.'
      }
    ],
    studentFeedbackHistory: [
      {
        id: 'sf-001',
        studentId: 'stu-demo-001',
        mentorRating: 5,
        mentorReview: 'Dr. Chidi explains difficult concepts with real production examples. Highly engaging!',
        courseRating: 5,
        courseReview: 'The hands-on automation pipelines with n8n and Make gave me practical job skills immediately.',
        complaintsOrSuggestions: 'Could we have an extra Q&A hour on Saturday mornings for complex bugs?',
        submittedAt: '2026-04-01T15:30:00Z'
      }
    ],
    placementOutcome: {
      status: 'Internship',
      company: 'Interswitch Group',
      jobRole: 'Junior Workflow & Automation Specialist',
      placementDate: '2026-07-01',
      salaryRange: '₦300,000 - ₦400,000 / month'
    },
    documents: [
      {
        id: 'doc-001',
        title: 'Signed Student Handbook & Code of Conduct',
        type: 'handbook',
        fileUrl: 'https://codelab.institute/docs/student_handbook_2026.pdf',
        fileName: 'Student_Handbook_Signed_STU-8492.pdf',
        uploadedAt: '2026-02-02T10:14:00Z',
        isVisibleToStudent: true
      },
      {
        id: 'doc-002',
        title: 'Official Admission & Enrollment Offer Letter',
        type: 'admission_letter',
        fileUrl: 'https://codelab.institute/docs/admission_letter_STU-8492.pdf',
        fileName: 'Official_Admission_Letter_STU-8492.pdf',
        uploadedAt: '2026-02-01T08:00:00Z',
        isVisibleToStudent: true
      },
      {
        id: 'doc-003',
        title: 'Lab 2 Submission - n8n Webhook Export JSON',
        type: 'assignment_file',
        fileUrl: 'https://codelab.institute/docs/n8n_pipeline_export.json',
        fileName: 'n8n_pipeline_export.json',
        uploadedAt: '2026-03-24T19:45:00Z',
        isVisibleToStudent: true
      }
    ],
    handbookSigned: true,
    handbookSignedAt: '2026-02-02T10:14:00Z',
    admissionLetterUrl: 'https://codelab.institute/docs/admission_letter_STU-8492.pdf',
    handbookDriveUrl: 'https://codelab.institute/docs/student_handbook_2026.pdf',
    isAtRisk: false,
  },
  {
    id: 'stu-demo-002',
    studentCode: 'STU-9104',
    name: 'Chiamaka Eze',
    email: 'chiamaka.eze@codelab.institute',
    phone: '+234 812 345 6789',
    program: 'AI & Workflow Automation',
    cohort: 'Cohort Alpha 2026',
    mentorId: 'men-demo-002',
    mentorName: 'Engr. Folake Balogun',
    status: 'Active',
    isActive: true,
    attendanceRate: 88,
    tuitionStatus: 'Partial',
    enrolledDate: '2026-02-10',
    totalFees: 380000,
    paidAmount: 200000,
    outstandingBalance: 180000,
    tuitionAmount: 380000,
    courses: [
      {
        id: 'course-ai-01',
        code: 'CAI-102',
        name: 'AI & Workflow Automation',
        semester: 'Semester 1 2026',
        instructor: 'Engr. Folake Balogun',
        fee: 380000,
        billedDate: '2026-02-10',
      }
    ],
    installments: [
      {
        id: 'inst-001',
        installmentNumber: 1,
        description: 'First Tranche (Tuition Deposit)',
        amount: 200000,
        dueDate: '2026-02-10',
        amountDue: 200000,
        amountPaid: 200000,
        status: 'Paid',
        paidAt: '2026-02-10T11:00:00Z',
        paymentMethod: 'Paystack Card'
      },
      {
        id: 'inst-002',
        installmentNumber: 2,
        description: 'Second Tranche (Mid-Term Balance)',
        amount: 180000,
        dueDate: '2026-04-15',
        amountDue: 180000,
        amountPaid: 0,
        status: 'Pending'
      }
    ],
    progressPercent: 55,
    attendedLearningHours: 28,
    minimumRequiredHours: 40,
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    dateOfBirth: '2002-11-05',
    gender: 'Female',
    nationality: 'Nigerian',
    stateOfOrigin: 'Anambra',
    lga: 'Awka South',
    idType: 'NIN',
    idNumber: '38192039485',
    isIdVerified: true,
    residentialAddress: '22 Admiralty Way, Lekki Phase 1',
    city: 'Lekki',
    stateOfResidence: 'Lagos',
    nextOfKinName: 'Emeka Eze',
    nextOfKinRelationship: 'Brother',
    nextOfKinPhone: '+234 803 112 2334',
    nextOfKinAddress: '22 Admiralty Way, Lekki Phase 1, Lagos',
    bankName: 'Access Bank',
    bankCode: '044',
    accountNumber: '0691234567',
    accountName: 'Chiamaka Eze',
    bvn: '22119988776',
    isBankVerified: true,
    kycTier: 3,
    kycStatus: 'Verified',
    whatsapp: '+2348123456789',
    currentStage: 'Intermediate',
    skillsAcquired: ['Zapier', 'Make.com', 'Prompt Engineering', 'Customer Service AI'],
    startDate: '2026-02-10',
    expectedCompletionDate: '2026-06-30',
    mentorHistory: [],
    sessionAttendance: [
      {
        id: 'att-101',
        sessionId: 'slot-001',
        sessionTitle: 'Orientation & Automation Architecture Fundamentals',
        date: '2026-02-12',
        type: 'lecture',
        status: 'Present',
        hoursCredited: 2,
      },
      {
        id: 'att-102',
        sessionId: 'slot-002',
        sessionTitle: 'Zapier Webhooks & Multi-Action Zaps',
        date: '2026-02-19',
        type: 'lecture',
        status: 'Present',
        hoursCredited: 2,
      },
      {
        id: 'att-103',
        sessionId: 'slot-003',
        sessionTitle: 'Intermediate Make.com Data Parsers & Routers',
        date: '2026-02-26',
        type: 'lecture',
        status: 'Absent',
        hoursCredited: 0,
        mentorNotes: 'Reported family emergency, scheduled makeup session.'
      },
      {
        id: 'att-104',
        sessionId: 'slot-004',
        sessionTitle: 'Make-up Session: Routers & Error Handling in Make',
        date: '2026-03-02',
        type: 'makeup',
        status: 'Present',
        hoursCredited: 2,
        mentorNotes: 'Completed makeup exercise successfully.'
      }
    ],
    mentorGoals: [
      {
        id: 'goal-101',
        title: 'Master Make.com JSON Parsers',
        category: 'Technical',
        targetDate: '2026-03-20',
        status: 'Achieved',
        achievedAt: '2026-03-18T12:00:00Z'
      }
    ],
    projects: [
      {
        id: 'proj-101',
        title: 'E-commerce Auto-Order Fulfillment Zap',
        type: 'automation_pipeline',
        description: 'Connects Shopify store webhooks to Google Sheets and sends WhatsApp tracking notifications.',
        submissionStatus: 'Reviewed',
        deadline: '2026-03-15',
        projectLink: 'https://zapier.com/shared/demo-fulfillment',
        score: 88,
        maxScore: 100,
        grade: 'B+',
        mentorFeedback: 'Very neat mapping. Recommend adding retry conditions for SMS carrier downtime.',
        reviewedBy: 'Engr. Folake Balogun',
        reviewedAt: '2026-03-17T09:30:00Z'
      }
    ],
    assessments: [],
    mentorFeedbackNotes: [
      {
        id: 'mfn-101',
        mentorId: 'men-demo-002',
        mentorName: 'Engr. Folake Balogun',
        date: '2026-03-03',
        feedbackType: 'regular',
        content: 'Chiamaka caught up quickly after the makeup session. Excellent grasp of router filters.'
      }
    ],
    studentFeedbackHistory: [],
    placementOutcome: {
      status: 'Seeking Placement'
    },
    documents: [
      {
        id: 'doc-101',
        title: 'Official Admission Letter',
        type: 'admission_letter',
        fileUrl: 'https://codelab.institute/docs/admission_letter_STU-9104.pdf',
        fileName: 'Admission_Letter_STU-9104.pdf',
        uploadedAt: '2026-02-10T09:00:00Z',
        isVisibleToStudent: true
      }
    ],
    handbookSigned: true,
    handbookSignedAt: '2026-02-11T14:00:00Z',
    isAtRisk: false
  }
];

export const initialTimetables: TimetableSlot[] = [
  {
    id: 'slot-001',
    courseId: 'course-se-01',
    courseTitle: 'Full-Stack Software Engineering',
    cohortId: 'coh-2026-01',
    cohortName: 'Cohort Alpha 2026',
    topic: '1.1 Deep Dive: TypeScript Generics & Strict Typing Systems',
    mentorId: 'user-mentor-demo',
    mentorName: 'Dr. Chidi Okeke',
    dayOfWeek: 'Friday',
    date: '2026-09-12',
    startTime: '10:00 AM',
    endTime: '12:00 PM',
    durationHours: 2,
    venue: 'Victoria Island Hub - Lab A',
    meetingLink: 'https://meet.google.com/abc-defg-hij',
    status: 'Completed',
    attendanceMarked: true,
    attendanceRecords: [
      {
        studentId: 'stu-demo-001',
        studentName: 'Adebayo Adeleke',
        studentCode: 'STU-8492',
        status: 'Attended',
        hoursCredited: 2,
        markedAt: '2026-09-12T12:05:00Z',
      }
    ],
    notes: 'Covered generics, union discrimination, and AST validators.',
    createdBy: 'Bolanle Nnamdi',
    createdAt: '2026-09-10T09:00:00Z',
  },
  {
    id: 'slot-002',
    courseId: 'course-se-01',
    courseTitle: 'Full-Stack Software Engineering',
    cohortId: 'coh-2026-01',
    cohortName: 'Cohort Alpha 2026',
    topic: '1.2 State Architecture: TanStack Query & Optimistic Mutations',
    mentorId: 'user-mentor-demo',
    mentorName: 'Dr. Chidi Okeke',
    dayOfWeek: 'Tuesday',
    date: '2026-09-15',
    startTime: '02:00 PM',
    endTime: '04:00 PM',
    durationHours: 2,
    venue: 'Google Meet Virtual Classroom',
    meetingLink: 'https://meet.google.com/xyz-uvwx-rst',
    status: 'Scheduled',
    attendanceMarked: false,
    attendanceRecords: [],
    notes: 'Live coding session with optimistic rollbacks.',
    createdBy: 'Bolanle Nnamdi',
    createdAt: '2026-09-11T10:00:00Z',
  }
];

export const initialExpenses: Expense[] = [];
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
  sessionTimeoutMinutes: 30, // 30-minute default inactivity auto-logout
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
    tickets: true,
    reports: true,
    billing: true,
  },
  defaultMinimumLearningHours: 40,
  mentorMinimumLecturedHours: 20,
  campusLocationsList: initialCampuses,
};

export const initialLMSModules: LMSModule[] = [
  ...financialTradingModules,
  {
    id: 'mod-1',
    courseTitle: 'Full-Stack Software Engineering',
    title: 'Module 1: Enterprise Web Architecture & Modern Frontend',
    description: 'Master TypeScript, modern component architecture, state machines, and responsive layouts.',
    order: 1,
    durationTrack: '60-Day Practitioner',
    durationDays: 60,
    nsqfLevel: 'NSQF Level 4',
    nitdaStandardCode: 'NITDA-SWE-MOD-01',
    theoryHours: 8,
    practicalHours: 20,
    learningGuideline: {
      prerequisites: ['Basic HTML/CSS & Modern JavaScript (ES6+)', 'Git Version Control Basics'],
      competencyOutcome: 'Architect and deploy reactive component trees with strict TypeScript contracts and server cache state.',
      expectedDeliverables: ['WCAG AA Accessible Data Table GitHub Repository', 'Live Vercel Staging Deployment with Automated Lighthouse Score > 90'],
      dayRange: 'Days 1 - 20 (Weeks 1 - 3)',
      theoryHours: 8,
      practicalHours: 20,
    },
    lessons: [
      {
        id: 'les-1-1',
        moduleId: 'mod-1',
        title: '1.1 Deep Dive: TypeScript Generics & Strict Typing Systems',
        durationMinutes: 45,
        type: 'video',
        dayNumber: 3,
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
        ],
        approvalStatus: 'Approved & Published',
        completedByMentor: true,
        completedByMentorName: 'Dr. Chidi Okeke',
        completedByMentorAt: '2026-09-12T12:05:00Z',
        approvedByProgramOfficer: true,
        approvedByProgramOfficerName: 'Bolanle Nnamdi',
        approvedAt: '2026-09-12T14:30:00Z',
      },
      {
        id: 'les-1-2',
        moduleId: 'mod-1',
        title: '1.2 State Architecture: TanStack Query & Optimistic Mutations',
        durationMinutes: 50,
        type: 'reading',
        dayNumber: 8,
        contentMarkdown: `### Enterprise State Management Patterns
Managing server cache versus transient client UI state is the cornerstone of responsive web applications.

#### Key Principles
- **Server Cache**: Keep data cached with automatic invalidation and background refetching.
- **Optimistic UI**: Mutate local state immediately, then revert gracefully if network or business validation fails.
- **Deduplication**: Prevent redundant roundtrips across deeply nested component hierarchies.`,
        resources: [
          { title: 'TanStack Query v5 Docs', url: 'https://tanstack.com/query/latest' }
        ],
        approvalStatus: 'Taught (Pending PO Approval)',
        completedByMentor: true,
        completedByMentorName: 'Dr. Chidi Okeke',
        completedByMentorAt: '2026-09-15T16:00:00Z',
        completionNotes: 'Covered React Query cache keys and mutation rollback strategies.',
        approvedByProgramOfficer: false,
      },
      {
        id: 'les-1-3',
        moduleId: 'mod-1',
        title: '1.3 Hands-On Lab: Build an Accessible Interactive Dashboard Table',
        durationMinutes: 90,
        type: 'lab',
        dayNumber: 15,
        submissionRequired: true,
        practicalLabTask: 'Accessible Table with WCAG 2.2 AA Keyboard Navigation & CSV Export',
        contentMarkdown: `### Lab Deliverables
You will build a full-featured data table component featuring:
- Server-side pagination and debounce searching
- Keyboard navigation (WCAG 2.2 AA compliant)
- Dynamic column sorting and export to CSV

Submit your GitHub repository link and deployed Vercel/Netlify staging URL below.`,
        resources: [
          { title: 'W3C ARIA Table Guidelines', url: 'https://www.w3.org/WAI/ARIA/apg/patterns/table/' }
        ],
        approvalStatus: 'Not Started',
        completedByMentor: false,
        approvedByProgramOfficer: false,
      }
    ]
  },
  {
    id: 'mod-2',
    courseTitle: 'Full-Stack Software Engineering',
    title: 'Module 2: Scalable Backend Services & API Security',
    description: 'Design robust microservices with Node.js, Express, PostgreSQL, and secure auth tokens.',
    order: 2,
    durationTrack: '60-Day Practitioner',
    durationDays: 60,
    nsqfLevel: 'NSQF Level 4',
    nitdaStandardCode: 'NITDA-SWE-MOD-02',
    theoryHours: 10,
    practicalHours: 22,
    learningGuideline: {
      prerequisites: ['Module 1 Frontend Architecture', 'Relational DB Fundamentals'],
      competencyOutcome: 'Design ACID-compliant relational schemas and integrate secure fintech payment gateways.',
      expectedDeliverables: ['Distributed Transaction Microservice Repo', 'Tested Paystack Webhook Handler with HMAC-SHA512 verification'],
      dayRange: 'Days 21 - 42 (Weeks 4 - 6)',
      theoryHours: 10,
      practicalHours: 22,
    },
    lessons: [
      {
        id: 'les-2-1',
        moduleId: 'mod-2',
        title: '2.1 Relational Schema Modeling & Query Optimization in PostgreSQL',
        durationMinutes: 60,
        type: 'video',
        dayNumber: 24,
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
        dayNumber: 35,
        submissionRequired: true,
        practicalLabTask: 'Secure Paystack Payment Gateway & Idempotent Webhook Verification',
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
    durationTrack: '60-Day Practitioner',
    durationDays: 60,
    nsqfLevel: 'NSQF Level 4',
    nitdaStandardCode: 'NITDA-SWE-MOD-03',
    theoryHours: 7,
    practicalHours: 18,
    learningGuideline: {
      prerequisites: ['Module 2 Backend Microservices', 'Linux Shell Commands'],
      competencyOutcome: 'Package full-stack applications in Docker multi-stage images and set up automated CI/CD pipelines.',
      expectedDeliverables: ['Dockerfile & Docker-Compose Configuration', 'Live HTTPS Cloud Deployment with automated health checks'],
      dayRange: 'Days 43 - 60 (Weeks 7 - 9)',
      theoryHours: 7,
      practicalHours: 18,
    },
    lessons: [
      {
        id: 'les-3-1',
        moduleId: 'mod-3',
        title: '3.1 Containerization with Docker & Multi-Stage Production Builds',
        durationMinutes: 55,
        type: 'video',
        dayNumber: 48,
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
        dayNumber: 58,
        submissionRequired: true,
        practicalLabTask: 'Full-Stack Capstone Defense: End-to-End SaaS Platform',
        contentMarkdown: `### Capstone Project Defense
Submit your production-ready SaaS application featuring real-time authentication, database persistence, payment integration, and cloud deployment. Your assigned mentor will review and schedule your 1-on-1 defense session.`,
        resources: [
          { title: 'Capstone Rubric & Evaluation Sheet', url: '#' }
        ]
      }
    ]
  },
  {
    id: 'mod-fe-1',
    courseTitle: 'Frontend React & TypeScript Sprint',
    title: 'Module 1: Accelerated Component Prototyping & Styling',
    description: 'Rapidly construct responsive interfaces using Tailwind CSS, semantic HTML5, and accessible component patterns.',
    order: 1,
    durationTrack: '30-Day Sprint',
    durationDays: 30,
    nsqfLevel: 'NSQF Level 3',
    nitdaStandardCode: 'NITDA-FND-MOD-01',
    theoryHours: 5,
    practicalHours: 16,
    learningGuideline: {
      prerequisites: ['Basic HTML/CSS Knowledge', 'Text Editor & Terminal Navigation'],
      competencyOutcome: 'Create responsive web apps adhering to modern layout standards, container queries, and mobile-first ergonomics.',
      expectedDeliverables: ['Responsive E-Commerce Landing Page', 'Mobile Touch-Optimized Drawer Component'],
      dayRange: 'Days 1 - 14 (Weeks 1 - 2)',
      theoryHours: 5,
      practicalHours: 16,
    },
    lessons: [
      {
        id: 'les-fe-1',
        moduleId: 'mod-fe-1',
        title: '1.1 Modern CSS Grid, Flexbox & Tailwind CSS v4 Layouts',
        durationMinutes: 45,
        type: 'video',
        dayNumber: 3,
        contentMarkdown: `### Rapid UI Development
Master utility-first architecture, responsive breakpoints, container queries, and design token consistency.`,
        approvalStatus: 'Approved & Published',
        completedByMentor: true,
        completedByMentorName: 'Engr. Damilola Adeyemi',
        completedByMentorAt: '2026-09-20T10:00:00Z',
        approvedByProgramOfficer: true,
        approvedByProgramOfficerName: 'Bolanle Nnamdi',
        approvedAt: '2026-09-20T14:00:00Z',
      },
      {
        id: 'les-fe-2',
        moduleId: 'mod-fe-1',
        title: '1.2 Sprint Lab: Interactive Product Showcase with Live Filters',
        durationMinutes: 75,
        type: 'lab',
        dayNumber: 10,
        submissionRequired: true,
        practicalLabTask: 'Responsive Product Showcase with Real-Time Search & Category Filters',
        contentMarkdown: `### Sprint Lab 1
Build an interactive e-commerce product catalog with client-side filter pills, dynamic search, and responsive mobile bottom sheets.`,
        approvalStatus: 'Not Started',
        completedByMentor: false,
        approvedByProgramOfficer: false,
      }
    ]
  },
  {
    id: 'mod-fe-2',
    courseTitle: 'Frontend React & TypeScript Sprint',
    title: 'Module 2: Async State, REST APIs & Capstone Showcase',
    description: 'Fetch, mutate, and cache external REST API data, handle offline resilience, and deploy production builds.',
    order: 2,
    durationTrack: '30-Day Sprint',
    durationDays: 30,
    nsqfLevel: 'NSQF Level 3',
    nitdaStandardCode: 'NITDA-FND-MOD-02',
    theoryHours: 7,
    practicalHours: 20,
    learningGuideline: {
      prerequisites: ['Module 1 Responsive Prototyping'],
      competencyOutcome: 'Build zero-latency client data flows with debounce search, optimistic updates, and Netlify/Vercel deployment.',
      expectedDeliverables: ['Interactive Multi-Step Form with Zod Validation', 'Final Sprint Capstone Portfolio Web App'],
      dayRange: 'Days 15 - 30 (Weeks 3 - 4)',
      theoryHours: 7,
      practicalHours: 20,
    },
    lessons: [
      {
        id: 'les-fe-3',
        moduleId: 'mod-fe-2',
        title: '2.1 Async REST API Consumption & Error Boundaries',
        durationMinutes: 50,
        type: 'reading',
        dayNumber: 18,
        contentMarkdown: `### Resilient Client Architecture
Implement graceful loading skeletons, retry backoffs, and accessible error boundary messages.`,
        approvalStatus: 'Not Started',
        completedByMentor: false,
        approvedByProgramOfficer: false,
      },
      {
        id: 'les-fe-4',
        moduleId: 'mod-fe-2',
        title: '2.2 Sprint Capstone: Deploy Verified Frontend Portfolio App',
        durationMinutes: 90,
        type: 'lab',
        dayNumber: 28,
        submissionRequired: true,
        practicalLabTask: 'Deploy Verified Frontend Portfolio App with Custom Domain & CI/CD',
        contentMarkdown: `### 30-Day Capstone
Deliver a complete client-side application connected to a live public API, deployed to production with custom meta tags and PWA manifest.`,
        approvalStatus: 'Not Started',
        completedByMentor: false,
        approvedByProgramOfficer: false,
      }
    ]
  },
  {
    id: 'mod-da-1',
    courseTitle: 'Data Analytics & Python Intelligence',
    title: 'Module 1: Python Data Pipelines, Pandas & Exploratory Analytics',
    description: 'Data ingestion, cleaning, transformation, and exploratory statistical analysis with Python and Pandas.',
    order: 1,
    durationTrack: '60-Day Practitioner',
    durationDays: 60,
    nsqfLevel: 'NSQF Level 4',
    nitdaStandardCode: 'NITDA-DAT-MOD-01',
    theoryHours: 8,
    practicalHours: 20,
    learningGuideline: {
      prerequisites: ['Basic Python Syntax', 'Spreadsheets & SQL Foundations'],
      competencyOutcome: 'Ingest raw multi-source enterprise data, cleanse missing records, and generate statistical insights.',
      expectedDeliverables: ['Data Ingestion Pipeline Jupyter Notebook', 'EDA Report on Nigerian Market Datasets'],
      dayRange: 'Days 1 - 25',
      theoryHours: 8,
      practicalHours: 20,
    },
    lessons: [
      {
        id: 'les-da-1',
        moduleId: 'mod-da-1',
        title: '1.1 Vectorized Data Cleaning & Time-Series Analysis with Pandas',
        durationMinutes: 60,
        type: 'video',
        dayNumber: 4,
        contentMarkdown: `### Data Cleaning & Analysis\nMaster dataframe operations, handling missing values, indexing, and time-series resampling.`,
        approvalStatus: 'Approved & Published',
        completedByMentor: true,
        completedByMentorName: 'Dr. Amina Yusuf',
        completedByMentorAt: '2026-09-18T11:00:00Z',
        approvedByProgramOfficer: true,
        approvedByProgramOfficerName: 'Bolanle Nnamdi',
        approvedAt: '2026-09-18T15:00:00Z',
      },
      {
        id: 'les-da-2',
        moduleId: 'mod-da-1',
        title: '1.2 Practical Lab: Cleansing & Modeling E-Commerce Transactions',
        durationMinutes: 80,
        type: 'lab',
        dayNumber: 12,
        submissionRequired: true,
        practicalLabTask: 'Cleanse and model Nigerian retail e-commerce transaction dataset with Pandas',
        contentMarkdown: `### Practical Lab\nExecute data pipeline to ingest, scrub anomalous records, and compute monthly churn.`,
        approvalStatus: 'Not Started',
        completedByMentor: false,
        approvedByProgramOfficer: false,
      }
    ]
  },
  {
    id: 'mod-da-2',
    courseTitle: 'Data Analytics & Python Intelligence',
    title: 'Module 2: SQL Data Warehousing, PowerBI & Executive Dashboards',
    description: 'Relational data modeling, advanced SQL window functions, PowerBI dashboards, and stakeholder presentations.',
    order: 2,
    durationTrack: '60-Day Practitioner',
    durationDays: 60,
    nsqfLevel: 'NSQF Level 4',
    nitdaStandardCode: 'NITDA-DAT-MOD-02',
    theoryHours: 12,
    practicalHours: 30,
    learningGuideline: {
      prerequisites: ['Module 1 Python Foundations', 'Relational Schema Design'],
      competencyOutcome: 'Build live operational reporting dashboards with SQL aggregations and automated PowerBI KPI refreshes.',
      expectedDeliverables: ['Relational Data Warehouse Schema (PostgreSQL)', 'Executive KPI Dashboard (PowerBI / Metabase)'],
      dayRange: 'Days 26 - 60',
      theoryHours: 12,
      practicalHours: 30,
    },
    lessons: [
      {
        id: 'les-da-3',
        moduleId: 'mod-da-2',
        title: '2.1 Advanced SQL Analytical Windows & Partition Aggregations',
        durationMinutes: 60,
        type: 'reading',
        dayNumber: 30,
        contentMarkdown: `### Enterprise SQL\nMaster CTEs, window functions (ROW_NUMBER, RANK, DENSE_RANK, LAG, LEAD), and partition aggregations.`,
        approvalStatus: 'Not Started',
        completedByMentor: false,
        approvedByProgramOfficer: false,
      },
      {
        id: 'les-da-4',
        moduleId: 'mod-da-2',
        title: '2.2 Capstone Project: End-to-End Enterprise BI Dashboard',
        durationMinutes: 120,
        type: 'lab',
        dayNumber: 56,
        submissionRequired: true,
        practicalLabTask: 'Deliver end-to-end business intelligence pipeline with live executive dashboard and presentation',
        contentMarkdown: `### Data Analytics Capstone\nDeliver executive dashboard summarizing retail KPIs, customer lifetime value, and cohort retention.`,
        approvalStatus: 'Not Started',
        completedByMentor: false,
        approvedByProgramOfficer: false,
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
  },
  {
    id: 'sub-002',
    studentId: 'stu-demo-001',
    studentName: 'Adebayo Adeleke',
    courseTitle: 'Full-Stack Software Engineering',
    moduleTitle: 'Module 2: RESTful Microservices & Database Engineering',
    taskTitle: '2.4 Capstone Lab: Distributed Transaction Pipeline with Prisma & PostgreSQL',
    githubUrl: 'https://github.com/adebayo-adeleke/distributed-transactions-lab',
    liveUrl: 'https://transact-lab.onrender.com',
    notes: 'Implemented ACID transaction isolation, idempotency keys, and automated rollback on insufficient funds.',
    submittedAt: '2026-10-02T16:45:00Z',
    status: 'Pending',
  },
  {
    id: 'sub-003',
    studentId: 'stu-demo-002',
    studentName: 'Chiamaka Eze',
    courseTitle: 'Full-Stack Software Engineering',
    moduleTitle: 'Module 2: RESTful Microservices & Database Engineering',
    taskTitle: '2.2 Lab: Secure JWT Authentication & RBAC Middleware',
    githubUrl: 'https://github.com/chiamaka-eze/jwt-auth-lab',
    notes: 'Need assistance with refresh token rotation and cookie expiration edge cases.',
    submittedAt: '2026-10-03T11:20:00Z',
    status: 'Needs Revision',
    grade: 62,
    mentorFeedback: 'Token generation is solid, but refresh tokens are currently stored in localStorage rather than httpOnly Secure cookies.',
    reviewedBy: 'Dr. Chidi Okeke',
    reviewedAt: '2026-10-03T18:00:00Z',
  }
];

export const initialPayoutRequests: MentorPayoutRequest[] = [
  {
    id: 'pay-req-001',
    mentorId: 'user-mentor-demo',
    mentorName: 'Dr. Chidi Okeke',
    mentorEmail: 'chidi.okeke@codelab.institute',
    amount: 185000,
    whtRatePercent: 5,
    whtDeductedAmount: 9250,
    netDisbursedAmount: 175750,
    voucherNumber: 'VCHR-CDL-2026-0849',
    lecturedHours: 24,
    minimumRequiredHours: 20,
    bankName: 'Access Bank',
    accountNumber: '0123456789',
    accountName: 'CHIDI OKEKE',
    bankCode: '044',
    status: 'Pending',
    requestedAt: '2026-10-03T09:15:00Z',
    notes: 'Q3 Tuition Commission Payout (37% share of enrolled mentees). Minimum lectured target of 20h reached.',
  },
  {
    id: 'pay-req-002',
    mentorId: 'user-mentor-demo',
    mentorName: 'Dr. Chidi Okeke',
    mentorEmail: 'chidi.okeke@codelab.institute',
    amount: 270000,
    whtRatePercent: 5,
    whtDeductedAmount: 13500,
    netDisbursedAmount: 256500,
    voucherNumber: 'VCHR-CDL-2026-0512',
    lecturedHours: 22,
    minimumRequiredHours: 20,
    bankName: 'Access Bank',
    accountNumber: '0123456789',
    accountName: 'CHIDI OKEKE',
    bankCode: '044',
    status: 'Disbursed',
    requestedAt: '2026-09-01T11:00:00Z',
    reviewedAt: '2026-09-01T15:20:00Z',
    reviewedBy: 'Abiola Adefowope',
    disbursedAt: '2026-09-01T15:30:00Z',
    disburseReference: 'NIP-CDL-20260901-84920',
    notes: 'Approved and disbursed via Paystack Institutional NIP settlement.',
  }
];

export const demoUsers: AuthUser[] = [
  staffUserAbiola,
  {
    id: 'user-admin',
    name: 'Abiola Adefowope',
    email: 'abiola.adefowope@codelab.institute',
    role: 'super_admin',
    roleTitle: 'Managing Director & Super Admin',
    department: 'Executive Board',
    password: 'password123',
    isActive: true,
    status: 'Active',
  },
  {
    id: 'user-po-demo',
    name: 'Bolanle Nnamdi',
    email: 'program.officer@codelab.institute',
    role: 'program_officer',
    roleTitle: 'Academic Program Officer & Curriculum Lead',
    department: 'Academic Affairs',
    password: 'password123',
    isActive: true,
    status: 'Active',
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
    isActive: true,
    status: 'Active',
  },
  {
    id: 'user-mentor-demo',
    name: 'Dr. Chidi Okeke',
    email: 'chidi.okeke@codelab.institute',
    role: 'mentor',
    roleTitle: 'Lead Engineering Faculty & Senior Mentor',
    department: 'Engineering Mentorship',
    password: 'password123',
    isActive: true,
    status: 'Active',
  },
  {
    id: 'user-admissions-demo',
    name: 'Zainab Bello',
    email: 'admissions@codelab.institute',
    role: 'admissions',
    roleTitle: 'Head of Admissions & Enrollments',
    department: 'Admissions Office',
    password: 'password123',
    isActive: true,
    status: 'Active',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    dateOfBirth: '1992-11-03',
    gender: 'Female',
    nationality: 'Nigerian',
    stateOfOrigin: 'Kano',
    lga: 'Nassarawa',
    idType: 'NIN',
    idNumber: '90182746532',
    idDocumentName: 'NIN_Slip_Zainab_Bello.pdf',
    idDocumentUrl: 'https://codelab.institute/docs/nin-sample.pdf',
    isIdVerified: true,
    residentialAddress: 'Plot 18, Victoria Island Extension',
    city: 'Victoria Island',
    stateOfResidence: 'Lagos',
    proofOfAddressName: 'EKEDC_Bill_Nov2025.pdf',
    proofOfAddressUrl: 'https://codelab.institute/docs/utility-sample.pdf',
    nextOfKinName: 'Farouq Bello',
    nextOfKinRelationship: 'Brother',
    nextOfKinPhone: '+234 803 112 3344',
    nextOfKinAddress: 'Plot 18, Victoria Island Extension, Lagos',
    bankName: 'First Bank of Nigeria PLC',
    bankCode: '011',
    accountNumber: '3098765432',
    accountName: 'Zainab Bello',
    bvn: '22998877665',
    isBankVerified: true,
    kycTier: 3,
    kycStatus: 'Verified',
  },
  {
    id: 'user-finance-demo',
    name: 'Olumide Fashola',
    email: 'finance@codelab.institute',
    role: 'finance',
    roleTitle: 'Bursar & Financial Controller',
    department: 'Bursary & Accounts',
    password: 'password123',
    isActive: true,
    status: 'Active',
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
    timestamp: new Date().toISOString(),
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
      canScheduleClasses: true,
      canApproveTopics: true,
      canManageUsers: true,
      canDisburseApprovedFunds: true,
      canViewStandupReports: true,
    }
  },
  {
    id: 'program_officer',
    name: 'Academic Program Officer',
    description: 'Manages curriculum design, timetable scheduling, faculty assignment, and syllabus topic approvals.',
    isSystem: true,
    badgeColor: 'bg-indigo-500/10 text-indigo-700 border border-indigo-500/20',
    allowedModules: ['reports', 'courses', 'students', 'mentors', 'attendance', 'tickets', 'lms'],
    permissions: {
      canAddCourses: true,
      canAddCohorts: true,
      canAddLeads: false,
      canEnrollStudents: true,
      canLogExpenses: false,
      canApproveExpenses: false,
      canIssueCertificates: true,
      canViewBilling: false,
      canManageSettings: false,
      canManageAttendance: true,
      canSubmitReports: true,
      canScheduleClasses: true,
      canApproveTopics: true,
      canManageUsers: false,
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
    id: 'approver',
    name: 'Institutional Approver / Authorizer',
    description: 'Reviews and authorizes operational expenditure requisitions, verifies compliance, monitors ticket escalations, and approves budget deductions.',
    isSystem: true,
    badgeColor: 'bg-purple-500/10 text-purple-700 border border-purple-500/20',
    allowedModules: ['expenses', 'tickets', 'reports', 'attendance'],
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
      canSubmitReports: true,
    }
  },
  {
    id: 'student',
    name: 'Enrolled Scholar / Student',
    description: 'Scholar portal with access to curriculum tracks, interactive labs, mentor bookings, and tuition installment checkout.',
    isSystem: true,
    badgeColor: 'bg-amber-500/10 text-amber-700 border border-amber-500/20',
    allowedModules: ['lms', 'tickets', 'billing', 'mentors'],
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
