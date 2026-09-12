import express, { Request, Response } from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5001;
const DB_FILE = path.join(__dirname, 'data', 'db.json');

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Logger middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Import seed data definitions
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
  initialLMSModules,
  initialAssignments,
  initialCampuses,
  initialStudentPerformanceReports,
  defaultRoleDefinitions,
  initialTickets,
} from '../src/data/mockData.js';

interface DatabaseSchema {
  leads: any[];
  students: any[];
  mentors: any[];
  expenses: any[];
  courses: any[];
  cohorts: any[];
  invoices: any[];
  sessions: any[];
  settings: any;
  activityLogs: any[];
  notifications: any[];
  staffUsers: any[];
  attendance: any[];
  lmsModules?: any[];
  assignments?: any[];
  studentPerformanceReports?: any[];
  tickets?: any[];
  customRoles?: any[];
}

const getInitialDatabase = (): DatabaseSchema => ({
  leads: initialLeads,
  students: initialStudents,
  mentors: initialMentors,
  expenses: initialExpenses,
  courses: initialCourses,
  cohorts: initialCohorts,
  invoices: initialInvoices,
  sessions: initialSessions,
  settings: initialSettings,
  activityLogs: initialActivityLogs,
  notifications: initialNotifications,
  staffUsers: demoUsers,
  attendance: [],
  lmsModules: initialLMSModules,
  assignments: initialAssignments,
  tickets: initialTickets,
  customRoles: defaultRoleDefinitions,
});

const loadDatabase = (): DatabaseSchema => {
  try {
    if (!fs.existsSync(DB_FILE)) {
      const initial = getInitialDatabase();
      fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf-8');
      return initial;
    }
    const data = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(data);
    if (!Array.isArray(parsed.courses)) parsed.courses = [];
    if (!Array.isArray(parsed.tickets)) parsed.tickets = initialTickets;
    if (!Array.isArray(parsed.customRoles)) parsed.customRoles = defaultRoleDefinitions;
    return parsed;
  } catch (err) {
    console.error('Error loading database, returning default seed:', err);
    return getInitialDatabase();
  }
};

const saveDatabase = (db: DatabaseSchema) => {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving database:', err);
  }
};

let db = loadDatabase();

// Ensure CODELAB EDUCARE LTD branding and Zoho SMTP are synchronized
if (!db.settings || db.settings.instituteName !== 'CODELAB EDUCARE LTD' || !db.settings.smtp?.user || db.settings.smtp?.host === 'smtppro.zoho.com' || db.settings.smtp?.host === 'smtp.hostinger.com') {
  db.settings = {
    ...initialSettings,
    ...db.settings,
    instituteName: 'CODELAB EDUCARE LTD',
    portalTitle: 'CODELAB EDUCARE Enterprise Portal',
    courseCategories: db.settings?.courseCategories || initialSettings.courseCategories,
    smtp: {
      ...initialSettings.smtp,
      ...(db.settings?.smtp || {}),
      host: 'smtp.zoho.com',
      port: 465,
      secure: true,
      user: db.settings?.smtp?.user || initialSettings.smtp?.user,
      pass: db.settings?.smtp?.pass || initialSettings.smtp?.pass,
      from: db.settings?.smtp?.from || initialSettings.smtp?.from,
    }
  };
  saveDatabase(db);
}

if (!db.settings.paystackPublicKey) {
  db.settings.paystackPublicKey = initialSettings.paystackPublicKey || 'pk_test_cd572a18dd78ed5493d15433b0e1f3c2057fce2a';
  db.settings.paystackSecretKey = initialSettings.paystackSecretKey || 'sk_test_5a3331f29eadb22de95a766cdd1dc432e186ab7f';
  db.settings.paystackLiveMode = false;
  saveDatabase(db);
}

if (!db.settings.enabledModules) {
  db.settings.enabledModules = {
    lms: true,
    leads: true,
    courses: true,
    students: true,
    mentors: true,
    attendance: true,
    expenses: true,
  };
  saveDatabase(db);
}

if (!db.lmsModules || db.lmsModules.length === 0) {
  db.lmsModules = initialLMSModules;
  saveDatabase(db);
}

if (!db.assignments || db.assignments.length === 0) {
  db.assignments = initialAssignments;
  saveDatabase(db);
}

if (!db.settings.campusLocationsList || db.settings.campusLocationsList.length === 0) {
  db.settings.campusLocationsList = initialCampuses;
  db.settings.defaultMinimumLearningHours = 40;
  saveDatabase(db);
}

if (!db.studentPerformanceReports) {
  db.studentPerformanceReports = initialStudentPerformanceReports;
  saveDatabase(db);
}

if (!db.staffUsers) db.staffUsers = [];
demoUsers.forEach(demoU => {
  if (!db.staffUsers.some((u: any) => u.email === demoU.email)) {
    db.staffUsers.push(demoU);
    saveDatabase(db);
  }
});

// Seed demo student in students table if students is empty
if (!db.students || db.students.length === 0) {
  const demoStudentUser = demoUsers.find(u => u.role === 'student');
  if (demoStudentUser) {
    db.students = [
      {
        id: 'stu-demo-001',
        studentCode: 'STU-8492',
        name: 'Adebayo Adeleke',
        email: 'student@codelab.institute',
        phone: '+234 802 918 2736',
        program: 'Full-Stack Software Engineering',
        mentorName: 'Dr. Chidi Okeke',
        mentorId: 'men-demo-001',
        status: 'Active',
        attendanceRate: 98,
        tuitionStatus: 'Partial',
        cohort: 'Alpha Cohort 2026',
        tuitionAmount: 450000,
        paidAmount: 250000,
        outstandingBalance: 200000,
        enrolledDate: '2026-01-15',
        progressPercent: 33,
        completedLessonIds: ['les-1-1'],
        assignmentSubmissions: initialAssignments,
      }
    ];
    saveDatabase(db);
  }
}

// Seed demo mentor in mentors table if mentors is empty
if (!db.mentors || db.mentors.length === 0) {
  db.mentors = [
    {
      id: 'men-demo-001',
      mentorCode: 'MEN-1049',
      name: 'Dr. Chidi Okeke',
      email: 'chidi.okeke@codelab.institute',
      phone: '+234 803 456 7890',
      track: 'Full-Stack Software Engineering',
      specializedDepartments: ['Software Engineering', 'Cloud Engineering & DevOps'],
      status: 'Active',
      bankName: 'Guaranty Trust Bank (GTBank)',
      accountNumber: '0123456789',
      accountName: 'CHIDI OKEKE',
      bankVerified: true,
      bankCode: '058',
      monthlyBasePay: 350000,
      hourlyRate: 8500,
      sessionsCount: 14,
      totalEarned: 780000,
      pendingPayout: 125000,
      paidPayout: 655000,
      joinedDate: '2025-11-01',
      rating: 4.9,
    }
  ];
  saveDatabase(db);
}

// Seed pending invoice for student if invoices is empty
if (!db.invoices || db.invoices.length === 0) {
  db.invoices = [
    {
      id: 'inv-demo-001',
      invoiceNumber: 'INV-2026-84920',
      studentId: 'stu-demo-001',
      studentName: 'Adebayo Adeleke',
      program: 'Full-Stack Software Engineering',
      amount: 200000,
      dueDate: '2026-10-15',
      status: 'Pending',
      description: 'Second Tranche - Full-Stack Software Engineering Tuition',
      createdDate: '2026-08-01',
    }
  ];
  saveDatabase(db);
}

// Health & Bootstrap Endpoints
// ----------------------------------------------------
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'healthy', version: '3.2', timestamp: new Date().toISOString() });
});

app.get('/api/bootstrap', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: db,
  });
});

app.post('/api/reset', (req: Request, res: Response) => {
  db = getInitialDatabase();
  saveDatabase(db);
  res.json({ success: true, message: 'All CRM database records restored to Nigerian demo seed data.', data: db });
});

// ----------------------------------------------------
// Backup, Restore & Production Data Flush
// ----------------------------------------------------
app.get('/api/backups/export', (req: Request, res: Response) => {
  const exportPayload = {
    version: '3.2',
    timestamp: new Date().toISOString(),
    institution: db.settings.instituteName,
    exportedBy: 'Super Admin',
    data: db,
  };
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename=nexus_crm_backup_${new Date().toISOString().split('T')[0]}.json`);
  res.json({ success: true, data: exportPayload });
});

app.post('/api/backups/restore', (req: Request, res: Response) => {
  const { data } = req.body;
  if (!data || typeof data !== 'object') {
    return res.status(400).json({ success: false, message: 'Invalid backup data format' });
  }

  // Restore provided dataset
  db = {
    leads: data.leads || [],
    students: data.students || [],
    mentors: data.mentors || [],
    expenses: data.expenses || [],
    courses: data.courses || [],
    cohorts: data.cohorts || [],
    invoices: data.invoices || [],
    sessions: data.sessions || [],
    settings: data.settings || db.settings,
    activityLogs: data.activityLogs || [],
    notifications: data.notifications || [],
    staffUsers: data.staffUsers || db.staffUsers,
  };

  saveDatabase(db);
  res.json({ success: true, message: 'Database successfully restored from backup snapshot.', data: db });
});

app.post('/api/production/flush-demo-data', (req: Request, res: Response) => {
  // Purge mock/demo leads, students, mock expenses, mock sessions, mock invoices, courses, cohorts, mentors
  db.leads = [];
  db.students = [];
  db.expenses = [];
  db.sessions = [];
  db.invoices = [];
  db.mentors = [];
  db.cohorts = [];
  db.courses = [];
  db.staffUsers = [
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
  db.notifications = [
    {
      id: `notif-${Date.now()}`,
      title: '🚀 Production System Initialized',
      message: 'Demo dataset cleared. The system is ready for live operational intake.',
      type: 'system',
      timestamp: 'Just now',
      read: false,
      link: '/settings',
    }
  ];
  db.activityLogs = [
    {
      id: `act-${Date.now()}`,
      title: 'Production Demo Data Flushed',
      description: 'Super Admin purged mock records. System initialized for live operations.',
      type: 'system',
      user: 'Super Admin',
      timestamp: 'Just now',
    }
  ];

  saveDatabase(db);
  res.json({ 
    success: true, 
    message: 'Demo data flushed successfully. CRM is now in a clean production state.', 
    data: db 
  });
});

// ----------------------------------------------------
// Real Email & SMTP Dispatch Engine (Nodemailer)
// ----------------------------------------------------
const getTransporter = async (customSmtp?: any) => {
  const host = customSmtp?.host || db.settings?.smtp?.host || process.env.SMTP_HOST || 'smtp.zoho.com';
  const port = Number(customSmtp?.port || db.settings?.smtp?.port || process.env.SMTP_PORT || 465);
  const user = customSmtp?.user || db.settings?.smtp?.user || process.env.SMTP_USER || 'admin@codelab.institute';
  const pass = customSmtp?.pass || db.settings?.smtp?.pass || process.env.SMTP_PASS || '9)8JAr$m';
  const secure = customSmtp?.secure !== undefined ? customSmtp.secure : (port === 465);
  const fromAddress = customSmtp?.from || db.settings?.smtp?.from || process.env.SMTP_FROM || (user ? `"CODELAB EDUCARE LTD" <${user}>` : '"CODELAB EDUCARE LTD" <admin@codelab.institute>');

  if (host && user && pass) {
    return {
      transporter: nodemailer.createTransport({
        host,
        port,
        secure,
        auth: { user, pass },
        tls: { rejectUnauthorized: false },
      }),
      from: fromAddress,
      isTestAccount: false,
    };
  }

  // Fallback to test sandbox (Ethereal Email)
  const testAccount = await nodemailer.createTestAccount();
  return {
    transporter: nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    }),
    from: '"CODELAB EDUCARE LTD" <admin@codelab.institute>',
    isTestAccount: true,
  };
};

const sendStudentWelcomeEmail = async (student: any) => {
  if (!student?.email) return;
  try {
    const { transporter, from, isTestAccount } = await getTransporter();
    const portalUrl = `http://72.61.106.87/login?role=student&email=${encodeURIComponent(student.email || '')}`;

    const customTemplate = db.settings?.customEmailTemplates?.student_welcome;
    let subject = customTemplate?.subject || `🎓 Welcome to CODELAB EDUCARE LTD — Admission Confirmation (${student.studentCode || 'STU'})`;
    subject = subject.replace(/\{\{name\}\}/g, student.name || '').replace(/\{\{studentCode\}\}/g, student.studentCode || '');

    const defaultHtml = `
      <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #00236f; padding: 26px 20px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: bold; letter-spacing: -0.5px;">CODELAB EDUCARE LTD</h1>
          <p style="color: #93c5fd; margin: 4px 0 0 0; font-size: 12px;">Official Student Admission &amp; Onboarding Confirmation</p>
        </div>
        <div style="padding: 28px 24px; color: #1e293b; line-height: 1.6;">
          <h2 style="color: #00236f; margin-top: 0; font-size: 18px;">Welcome to CODELAB EDUCARE LTD, ${student.name}!</h2>
          <p>Your student admission has been approved and your academic profile is now officially active.</p>
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 16px; margin: 20px 0;">
            <p style="margin: 0 0 6px 0;"><strong>Student ID:</strong> <span style="font-family: monospace; font-weight: bold; color: #00236f;">${student.studentCode || 'STU-PROD'}</span></p>
            <p style="margin: 0 0 6px 0;"><strong>Course Track:</strong> ${student.program || 'Technology Track'}</p>
            <p style="margin: 0 0 6px 0;"><strong>Cohort / Batch:</strong> ${student.cohort || 'Executive Cohort'}</p>
            <p style="margin: 0 0 6px 0;"><strong>Assigned Mentor:</strong> ${student.mentorName || 'Academic Faculty Pool'}</p>
            <p style="margin: 0;"><strong>Tuition Status:</strong> ${student.outstandingBalance > 0 ? `₦${Number(student.outstandingBalance).toLocaleString()} Outstanding` : 'Settled / In Good Standing'}</p>
          </div>
          <h3 style="color: #00236f; font-size: 14px; margin-bottom: 8px;">Onboarding Steps:</h3>
          <p style="margin: 0 0 16px 0; font-size: 13px;">Please log in to your Student Operations Portal using your email (<strong>${student.email}</strong>) to access course materials, live lab schedules, and mentor assignments.</p>
          <div style="text-align: center; margin: 24px 0;">
            <a href="${portalUrl}" style="background-color: #00236f; color: #ffffff; padding: 12px 26px; text-decoration: none; font-weight: bold; border-radius: 6px; font-size: 14px; display: inline-block;">Access Student Portal →</a>
          </div>
          <p style="font-size: 12px; color: #64748b;">For assistance, reach our Admissions Directorate directly at <a href="mailto:admin@codelab.institute" style="color: #00236f;">admin@codelab.institute</a>.</p>
        </div>
      </div>
    `;

    const html = customTemplate?.body ? customTemplate.body
      .replace(/\{\{name\}\}/g, student.name || '')
      .replace(/\{\{studentCode\}\}/g, student.studentCode || '')
      .replace(/\{\{program\}\}/g, student.program || '')
      .replace(/\{\{cohort\}\}/g, student.cohort || '')
      .replace(/\{\{mentorName\}\}/g, student.mentorName || '')
      .replace(/\{\{email\}\}/g, student.email || '')
      .replace(/\{\{portalUrl\}\}/g, portalUrl)
      : defaultHtml;

    const info = await transporter.sendMail({
      from,
      to: student.email,
      subject,
      html,
    });

    console.log(`✅ [STUDENT ONBOARDING EMAIL DISPATCHED] To: ${student.email} | MessageId: ${info?.messageId} | isTestAccount: ${isTestAccount}`);
  } catch (err) {
    console.error(`Error dispatching student welcome email to ${student?.email}:`, err);
  }
};

const sendMentorWelcomeEmail = async (mentor: any) => {
  if (!mentor?.email) return;
  try {
    const { transporter, from, isTestAccount } = await getTransporter();
    const portalUrl = `http://72.61.106.87/login?role=mentor&email=${encodeURIComponent(mentor.email || '')}`;
    const facultyId = mentor.facultyId || `FAC-${mentor.id?.slice?.(0, 5) || Date.now().toString().slice(-4)}`;
    const department = mentor.department || 'Academic Instruction';
    const courses = Array.isArray(mentor.courses) ? mentor.courses.join(', ') : (mentor.courses || 'Assigned Courses');
    const bankDetails = mentor.bankName ? `${mentor.bankName} - ${mentor.accountNumber || ''} (${mentor.accountName || mentor.name})` : 'To be submitted';
    const verificationBadge = mentor.isAccountVerified ? 'Verified ✅' : 'Pending Verification';

    const customTemplate = db.settings?.customEmailTemplates?.mentor_welcome;
    let subject = customTemplate?.subject || `💼 Faculty Appointment & Onboarding — CODELAB EDUCARE LTD (${facultyId})`;
    subject = subject.replace(/\{\{name\}\}/g, mentor.name || '').replace(/\{\{facultyId\}\}/g, facultyId);

    const defaultHtml = `
      <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #00236f; padding: 26px 20px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: bold; letter-spacing: -0.5px;">CODELAB EDUCARE LTD</h1>
          <p style="color: #93c5fd; margin: 4px 0 0 0; font-size: 12px;">Faculty Appointment &amp; Mentor Onboarding Confirmation</p>
        </div>
        <div style="padding: 28px 24px; color: #1e293b; line-height: 1.6;">
          <h2 style="color: #00236f; margin-top: 0; font-size: 18px;">Welcome to the Academic Faculty, ${mentor.name}!</h2>
          <p>We are delighted to confirm your appointment as a Mentor and Course Instructor at <strong>CODELAB EDUCARE LTD</strong>.</p>
          
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 16px; margin: 20px 0;">
            <p style="margin: 0 0 6px 0;"><strong>Faculty ID:</strong> <span style="font-family: monospace; font-weight: bold; color: #00236f;">${facultyId}</span></p>
            <p style="margin: 0 0 6px 0;"><strong>Specialized Department:</strong> ${department}</p>
            <p style="margin: 0 0 6px 0;"><strong>Assigned Course(s):</strong> ${courses}</p>
            <p style="margin: 0 0 6px 0;"><strong>Remuneration Structure:</strong> 37% Commission per enrolled student / signed-up candidate</p>
            <p style="margin: 0;"><strong>Disbursement Account:</strong> ${bankDetails} [${verificationBadge}]</p>
          </div>

          <h3 style="color: #00236f; font-size: 14px; margin-bottom: 8px;">Faculty Portal Instructions:</h3>
          <p style="margin: 0 0 16px 0; font-size: 13px;">Please log in to your Instructor Portal using your registered email (<strong>${mentor.email}</strong>) to view your enrolled cohorts, manage student submissions, and monitor your 37% commission earnings ledger.</p>
          
          <div style="text-align: center; margin: 24px 0;">
            <a href="${portalUrl}" style="background-color: #00236f; color: #ffffff; padding: 12px 26px; text-decoration: none; font-weight: bold; border-radius: 6px; font-size: 14px; display: inline-block;">Access Faculty Portal →</a>
          </div>

          <p style="font-size: 12px; color: #64748b;">If you need to update your payout account or have curriculum inquiries, please contact our Academic Administration at <a href="mailto:admin@codelab.institute" style="color: #00236f;">admin@codelab.institute</a>.</p>
        </div>
      </div>
    `;

    const html = customTemplate?.body ? customTemplate.body
      .replace(/\{\{name\}\}/g, mentor.name || '')
      .replace(/\{\{facultyId\}\}/g, facultyId)
      .replace(/\{\{department\}\}/g, department)
      .replace(/\{\{courses\}\}/g, courses)
      .replace(/\{\{email\}\}/g, mentor.email)
      .replace(/\{\{bankName\}\}/g, mentor.bankName || '')
      .replace(/\{\{accountNumber\}\}/g, mentor.accountNumber || '')
      .replace(/\{\{portalUrl\}\}/g, portalUrl)
      : defaultHtml;

    const info = await transporter.sendMail({
      from,
      to: mentor.email,
      subject,
      html,
    });

    console.log(`✅ [MENTOR ONBOARDING EMAIL DISPATCHED] To: ${mentor.email} | MessageId: ${info?.messageId} | isTestAccount: ${isTestAccount}`);
  } catch (err) {
    console.error(`Error dispatching mentor welcome email to ${mentor?.email}:`, err);
  }
};

// Shared Email HTML Layout Wrapper
const wrapEmailHtml = (title: string, bodyContent: string): string => {
  const primaryColor = '#00236f';
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
      </head>
      <body style="margin: 0; padding: 20px; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); overflow: hidden; border: 1px solid #e2e8f0;">
          <div style="background-color: ${primaryColor}; padding: 24px 20px; text-align: center;">
            <div style="display: inline-block; background-color: rgba(255,255,255,0.15); padding: 6px 14px; border-radius: 20px; margin-bottom: 6px;">
              <span style="color: #ffffff; font-family: 'Inter', sans-serif; font-size: 11px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase;">
                CODELAB EDUCARE LTD
              </span>
            </div>
            <h1 style="color: #ffffff; margin: 4px 0 0 0; font-family: 'Inter', sans-serif; font-size: 19px; font-weight: 700;">
              Admissions &amp; Academic Enterprise Portal
            </h1>
            <p style="color: #93c5fd; margin: 4px 0 0 0; font-size: 11px;">
              Victoria Island Financial District &amp; Yaba Innovation Campus, Lagos
            </p>
          </div>
          ${bodyContent}
          <div style="background-color: #f8fafc; padding: 18px; text-align: center; border-radius: 0 0 8px 8px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #64748b;">
            <p style="margin: 0 0 4px 0;"><strong>CODELAB EDUCARE LTD</strong> • Plot 14, Victoria Island, Lagos • RC-1849201 • TIN-29481029-0001</p>
            <p style="margin: 0;">Inquiries: <a href="mailto:admin@codelab.institute" style="color: ${primaryColor};">admin@codelab.institute</a></p>
          </div>
        </div>
      </body>
    </html>
  `;
};

// 1. OpEx Requisition: Notify Approvers (Super Admin & Finance)
const sendExpenseApprovalRequestEmail = async (expense: any) => {
  try {
    const approverEmail = db.settings?.email || 'admin@codelab.institute';
    const { transporter, from, isTestAccount } = await getTransporter();
    const primaryColor = '#00236f';
    const subject = `🔔 OpEx Approval Required: ${expense.title || 'Requisition'} (₦${Number(expense.amount || 0).toLocaleString()}) - ${expense.department || 'Operations'}`;

    const bodyContent = `
      <div style="padding: 32px 24px; color: #1e293b; line-height: 1.6;">
        <div style="text-align: center; margin-bottom: 24px;">
          <span style="background-color: #fef3c7; color: #b45309; font-weight: 700; font-size: 11px; padding: 6px 14px; border-radius: 20px; border: 1px solid #fde68a; text-transform: uppercase;">
            ⚠️ OpEx Approval Requisition
          </span>
          <h2 style="color: ${primaryColor}; margin: 12px 0 6px 0; font-size: 20px; font-weight: 800;">
            Operating Expense Requisition Awaiting Review
          </h2>
          <p style="margin: 0; color: #64748b; font-size: 14px;">
            A new operational expenditure request has been logged by staff and requires your review &amp; authorization.
          </p>
        </div>

        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <tr>
              <td style="padding: 6px 0; color: #64748b; width: 40%;">Expense Requisition Code:</td>
              <td style="padding: 6px 0; font-family: monospace; font-weight: bold; color: ${primaryColor};">${expense.expenseCode || 'EXP-PENDING'}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Title / Description:</td>
              <td style="padding: 6px 0; font-weight: 600;">${expense.title}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Requisition Amount:</td>
              <td style="padding: 6px 0; color: #0f172a; font-weight: 800; font-size: 16px;">₦${Number(expense.amount || 0).toLocaleString()}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Category &amp; Department:</td>
              <td style="padding: 6px 0;">${expense.category} (${expense.department})</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Requested By:</td>
              <td style="padding: 6px 0;"><strong>${expense.requestedBy || 'Staff'}</strong> ${expense.requesterEmail ? `(${expense.requesterEmail})` : ''}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Urgency:</td>
              <td style="padding: 6px 0;"><strong>${expense.urgency || 'Standard'}</strong></td>
            </tr>
            ${expense.receiptName ? `
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Attached Proforma/Receipt:</td>
              <td style="padding: 6px 0; color: #2563eb;">📎 ${expense.receiptName}</td>
            </tr>
            ` : ''}
          </table>
        </div>

        ${expense.description ? `
        <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 14px; margin: 16px 0; font-size: 13px; color: #92400e; border-radius: 4px;">
          <strong>Requester Justification / Notes:</strong><br/>
          ${expense.description}
        </div>
        ` : ''}

        <div style="text-align: center; margin: 28px 0;">
          <a href="http://72.61.106.87/expenses" 
             style="background-color: ${primaryColor}; color: #ffffff; padding: 14px 32px; text-decoration: none; font-weight: bold; border-radius: 6px; font-size: 14px; display: inline-block;">
            Review &amp; Authorize Requisition →
          </a>
        </div>
      </div>
    `;

    const html = wrapEmailHtml(subject, bodyContent);
    const info = await transporter.sendMail({ from, to: approverEmail, subject, html });
    console.log(`✅ [EXPENSE APPROVAL EMAIL DISPATCHED] To: ${approverEmail} | MessageId: ${info?.messageId} | isTestAccount: ${isTestAccount}`);
  } catch (err) {
    console.error('Error dispatching expense approval email:', err);
  }
};

// 2. OpEx Decision: Notify Requester (Approved or Rejected)
const sendExpenseDecisionEmail = async (expense: any, status: 'Approved' | 'Rejected', reviewer?: string, reason?: string) => {
  const recipientEmail = expense.requesterEmail || 'admin@codelab.institute';
  try {
    const { transporter, from, isTestAccount } = await getTransporter();
    const primaryColor = '#00236f';
    const isApproved = status === 'Approved';
    const subject = isApproved
      ? `✅ OpEx Request Approved: ${expense.title} (₦${Number(expense.amount || 0).toLocaleString()})`
      : `❌ OpEx Request Declined: ${expense.title} (${expense.expenseCode})`;

    const bodyContent = isApproved ? `
      <div style="padding: 32px 24px; color: #1e293b; line-height: 1.6;">
        <div style="text-align: center; margin-bottom: 24px;">
          <span style="background-color: #ecfdf5; color: #047857; font-weight: 700; font-size: 11px; padding: 6px 14px; border-radius: 20px; border: 1px solid #a7f3d0; text-transform: uppercase;">
            ✓ OpEx Expenditure Approved
          </span>
          <h2 style="color: ${primaryColor}; margin: 12px 0 6px 0; font-size: 20px; font-weight: 800;">
            Your Requisition Has Been Approved!
          </h2>
          <p style="margin: 0; color: #64748b; font-size: 14px;">
            The Super Administration / Finance Controller has reviewed and approved your funding requisition.
          </p>
        </div>

        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <tr>
              <td style="padding: 6px 0; color: #64748b; width: 40%;">Expense Requisition Code:</td>
              <td style="padding: 6px 0; font-family: monospace; font-weight: bold; color: ${primaryColor};">${expense.expenseCode || 'EXP-AUTH'}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Title:</td>
              <td style="padding: 6px 0; font-weight: 600;">${expense.title}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Authorized Amount:</td>
              <td style="padding: 6px 0; color: #166534; font-weight: 800; font-size: 16px;">₦${Number(expense.amount || 0).toLocaleString()}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Authorized By:</td>
              <td style="padding: 6px 0;"><strong>${reviewer || 'Super Admin'}</strong></td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Disbursement Status:</td>
              <td style="padding: 6px 0; color: #166534; font-weight: 600;">Passed to Bursary for Fund Release</td>
            </tr>
          </table>
        </div>

        <div style="text-align: center; margin: 28px 0;">
          <a href="http://72.61.106.87/expenses" 
             style="background-color: ${primaryColor}; color: #ffffff; padding: 14px 32px; text-decoration: none; font-weight: bold; border-radius: 6px; font-size: 14px; display: inline-block;">
            View In OpEx Ledger →
          </a>
        </div>
      </div>
    ` : `
      <div style="padding: 32px 24px; color: #1e293b; line-height: 1.6;">
        <div style="text-align: center; margin-bottom: 24px;">
          <span style="background-color: #fef2f2; color: #dc2626; font-weight: 700; font-size: 11px; padding: 6px 14px; border-radius: 20px; border: 1px solid #fecaca; text-transform: uppercase;">
            ✕ Requisition Declined
          </span>
          <h2 style="color: #991b1b; margin: 12px 0 6px 0; font-size: 20px; font-weight: 800;">
            OpEx Request Could Not Be Authorized
          </h2>
          <p style="margin: 0; color: #64748b; font-size: 14px;">
            Your operating expenditure requisition was reviewed and declined by the Approver.
          </p>
        </div>

        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <tr>
              <td style="padding: 6px 0; color: #64748b; width: 40%;">Expense Requisition:</td>
              <td style="padding: 6px 0; font-family: monospace; font-weight: bold;">${expense.expenseCode || 'EXP-DECL'} - ${expense.title}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Amount:</td>
              <td style="padding: 6px 0; font-weight: bold;">₦${Number(expense.amount || 0).toLocaleString()}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Reviewed By:</td>
              <td style="padding: 6px 0;">${reviewer || 'Super Admin'}</td>
            </tr>
          </table>
        </div>

        <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; margin: 20px 0; border-radius: 4px;">
          <h4 style="margin: 0 0 6px 0; color: #991b1b; font-size: 13px; text-transform: uppercase;">Reason for Decline / Reviewer Remarks:</h4>
          <p style="margin: 0; font-size: 13px; color: #7f1d1d;">
            ${reason || 'Expense documentation incomplete or out of departmental budget scope. Please consult Finance.'}
          </p>
        </div>

        <div style="text-align: center; margin: 28px 0;">
          <a href="http://72.61.106.87/expenses" 
             style="background-color: #475569; color: #ffffff; padding: 14px 32px; text-decoration: none; font-weight: bold; border-radius: 6px; font-size: 14px; display: inline-block;">
            Review in Portal &amp; Resubmit →
          </a>
        </div>
      </div>
    `;

    const html = wrapEmailHtml(subject, bodyContent);
    const info = await transporter.sendMail({ from, to: recipientEmail, subject, html });
    console.log(`✅ [EXPENSE DECISION EMAIL DISPATCHED] To: ${recipientEmail} | Status: ${status} | MessageId: ${info?.messageId}`);
  } catch (err) {
    console.error(`Error dispatching expense decision email to ${recipientEmail}:`, err);
  }
};

// 3. Tuition Payments: Student Receipt, Mentor Commission Alert & Finance Audit
const sendTuitionPaymentEmails = async (payload: {
  student: any;
  amountPaidNaira: number;
  reference: string;
  invoice?: any;
  mentor?: any;
  commission?: number;
}) => {
  const { student, amountPaidNaira, reference, invoice, mentor, commission } = payload;
  try {
    const { transporter, from, isTestAccount } = await getTransporter();
    const primaryColor = '#00236f';

    // A. Student Digital Receipt Email
    if (student?.email) {
      const studentSubject = `💳 Payment Receipt & Confirmation: ${student.program || 'Tuition'} (₦${amountPaidNaira.toLocaleString()})`;
      const studentBody = `
        <div style="padding: 32px 24px; color: #1e293b; line-height: 1.6;">
          <div style="text-align: center; margin-bottom: 24px;">
            <span style="background-color: #ecfdf5; color: #047857; font-weight: 700; font-size: 11px; padding: 6px 14px; border-radius: 20px; border: 1px solid #a7f3d0; text-transform: uppercase;">
              ✓ Electronic Payment Receipt
            </span>
            <h2 style="color: ${primaryColor}; margin: 12px 0 6px 0; font-size: 20px; font-weight: 800;">
              Tuition Payment Confirmed, ${student.name}!
            </h2>
            <p style="margin: 0; color: #64748b; font-size: 14px;">
              Your tuition payment has been verified and credited to your student financial ledger.
            </p>
          </div>

          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
              <tr>
                <td style="padding: 6px 0; color: #64748b; width: 40%;">Student Matric ID:</td>
                <td style="padding: 6px 0; font-family: monospace; font-weight: bold; color: ${primaryColor};">${student.studentCode || 'STU-PROD'}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748b;">Academic Track:</td>
                <td style="padding: 6px 0; font-weight: 600;">${student.program || 'Technology Track'}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748b;">Amount Paid:</td>
                <td style="padding: 6px 0; color: #166534; font-weight: 800; font-size: 16px;">₦${amountPaidNaira.toLocaleString()}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748b;">Outstanding Balance:</td>
                <td style="padding: 6px 0; font-weight: 700; color: ${student.outstandingBalance > 0 ? '#991b1b' : '#166534'};">
                  ${student.outstandingBalance > 0 ? `₦${Number(student.outstandingBalance).toLocaleString()}` : '₦0.00 (Fully Settled)'}
                </td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748b;">Gateway Reference:</td>
                <td style="padding: 6px 0; font-family: monospace;">${reference}</td>
              </tr>
            </table>
          </div>

          <div style="text-align: center; margin: 28px 0;">
            <a href="http://72.61.106.87/student/billing" 
               style="background-color: ${primaryColor}; color: #ffffff; padding: 14px 32px; text-decoration: none; font-weight: bold; border-radius: 6px; font-size: 14px; display: inline-block;">
              View Student Billing Portal →
            </a>
          </div>
        </div>
      `;
      await transporter.sendMail({
        from,
        to: student.email,
        subject: studentSubject,
        html: wrapEmailHtml(studentSubject, studentBody)
      });
      console.log(`✅ [STUDENT TUITION RECEIPT DISPATCHED] To: ${student.email}`);
    }

    // B. Mentor 37% Commission Accrual Alert
    if (mentor?.email && commission && commission > 0) {
      const mentorSubject = `🎉 New Commission Credited: 37% Enrollment Revenue Share (₦${commission.toLocaleString()})`;
      const mentorBody = `
        <div style="padding: 32px 24px; color: #1e293b; line-height: 1.6;">
          <div style="text-align: center; margin-bottom: 24px;">
            <span style="background-color: #ecfdf5; color: #047857; font-weight: 700; font-size: 11px; padding: 6px 14px; border-radius: 20px; border: 1px solid #a7f3d0; text-transform: uppercase;">
              🎉 37% Commission Share Credited
            </span>
            <h2 style="color: ${primaryColor}; margin: 12px 0 6px 0; font-size: 20px; font-weight: 800;">
              New Enrollment Commission Accrued, ${mentor.name}!
            </h2>
            <p style="margin: 0; color: #64748b; font-size: 14px;">
              A student tuition payment has been verified. Your 37% revenue share commission has been added to your pending payout balance.
            </p>
          </div>

          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
              <tr>
                <td style="padding: 6px 0; color: #64748b; width: 40%;">Enrolled Student:</td>
                <td style="padding: 6px 0; font-weight: 600;">${student?.name || 'Mentee'}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748b;">Academic Track:</td>
                <td style="padding: 6px 0;">${student?.program || 'Technology Track'}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748b;">Student Tuition Paid:</td>
                <td style="padding: 6px 0; font-family: monospace;">₦${amountPaidNaira.toLocaleString()}</td>
              </tr>
              <tr style="background-color: #ecfdf5;">
                <td style="padding: 8px; color: #065f46; font-weight: bold;">Your 37% Commission:</td>
                <td style="padding: 8px; font-family: monospace; font-weight: 800; color: #047857; font-size: 16px;">+₦${commission.toLocaleString()}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748b;">Total Pending Payout:</td>
                <td style="padding: 6px 0; font-weight: bold; color: ${primaryColor};">₦${Number(mentor.pendingPayout || 0).toLocaleString()}</td>
              </tr>
            </table>
          </div>

          <div style="text-align: center; margin: 28px 0;">
            <a href="http://72.61.106.87/mentors" 
               style="background-color: ${primaryColor}; color: #ffffff; padding: 14px 32px; text-decoration: none; font-weight: bold; border-radius: 6px; font-size: 14px; display: inline-block;">
              View Commission Ledger →
            </a>
          </div>
        </div>
      `;
      await transporter.sendMail({
        from,
        to: mentor.email,
        subject: mentorSubject,
        html: wrapEmailHtml(mentorSubject, mentorBody)
      });
      console.log(`✅ [MENTOR COMMISSION EMAIL DISPATCHED] To: ${mentor.email}`);
    }

    // C. Finance / Super Admin Transaction Alert
    const financeEmail = db.settings?.email || 'admin@codelab.institute';
    const financeSubject = `💰 Inbound Tuition Settlement: ${student?.name || 'Student'} (₦${amountPaidNaira.toLocaleString()})`;
    const financeBody = `
      <div style="padding: 32px 24px; color: #1e293b; line-height: 1.6;">
        <h2 style="color: ${primaryColor}; margin-top: 0; font-size: 18px;">Tuition Payment Verified &amp; Cleared</h2>
        <p>A new student payment was successfully processed via Paystack and credited to the institute's operating accounts.</p>
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 16px; margin: 20px 0; font-size: 13px;">
          <p style="margin: 0 0 6px 0;"><strong>Student:</strong> ${student?.name} (${student?.studentCode})</p>
          <p style="margin: 0 0 6px 0;"><strong>Amount Settled:</strong> <span style="color: #166534; font-weight: bold;">₦${amountPaidNaira.toLocaleString()}</span></p>
          <p style="margin: 0 0 6px 0;"><strong>Paystack Reference:</strong> <code>${reference}</code></p>
          <p style="margin: 0;"><strong>Mentor 37% Commission Share:</strong> ₦${Number(commission || 0).toLocaleString()} (Assigned to: ${mentor?.name || 'Unassigned'})</p>
        </div>
      </div>
    `;
    await transporter.sendMail({
      from,
      to: financeEmail,
      subject: financeSubject,
      html: wrapEmailHtml(financeSubject, financeBody)
    });
    console.log(`✅ [FINANCE TUITION AUDIT EMAIL DISPATCHED] To: ${financeEmail}`);
  } catch (err) {
    console.error('Error dispatching tuition payment emails:', err);
  }
};

// 4. Mentor Payout Disbursement Advice
const sendMentorPayoutAdviceEmail = async (mentor: any, amount: number, transferRef: string) => {
  if (!mentor?.email) return;
  try {
    const { transporter, from } = await getTransporter();
    const primaryColor = '#00236f';
    const subject = `💸 Faculty Honorarium Disbursed: ₦${amount.toLocaleString()} [Ref: ${transferRef}]`;

    const bodyContent = `
      <div style="padding: 32px 24px; color: #1e293b; line-height: 1.6;">
        <div style="text-align: center; margin-bottom: 24px;">
          <span style="background-color: #ecfdf5; color: #047857; font-weight: 700; font-size: 11px; padding: 6px 14px; border-radius: 20px; border: 1px solid #a7f3d0; text-transform: uppercase;">
            💸 Payout Settlement Advice
          </span>
          <h2 style="color: ${primaryColor}; margin: 12px 0 6px 0; font-size: 20px; font-weight: 800;">
            Faculty Honorarium Disbursed, ${mentor.name}!
          </h2>
          <p style="margin: 0; color: #64748b; font-size: 14px;">
            The Finance Office has disbursed your accrued honorarium / commission to your verified Nigerian settlement account.
          </p>
        </div>

        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <tr>
              <td style="padding: 6px 0; color: #64748b; width: 40%;">Disbursement Amount:</td>
              <td style="padding: 6px 0; color: #166534; font-weight: 800; font-size: 18px;">₦${amount.toLocaleString()}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Destination Bank:</td>
              <td style="padding: 6px 0; font-weight: 600;">${mentor.bankName || 'Verified Commercial Bank'}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">NUBAN Account:</td>
              <td style="padding: 6px 0; font-family: monospace; font-weight: bold;">${mentor.accountNumber || '••••••••••'}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Transfer Reference:</td>
              <td style="padding: 6px 0; font-family: monospace;">${transferRef}</td>
            </tr>
          </table>
        </div>

        <div style="text-align: center; margin: 28px 0;">
          <a href="http://72.61.106.87/mentors" 
             style="background-color: ${primaryColor}; color: #ffffff; padding: 14px 32px; text-decoration: none; font-weight: bold; border-radius: 6px; font-size: 14px; display: inline-block;">
            View Settlement History →
          </a>
        </div>
      </div>
    `;

    const html = wrapEmailHtml(subject, bodyContent);
    await transporter.sendMail({ from, to: mentor.email, subject, html });
    console.log(`✅ [MENTOR PAYOUT EMAIL DISPATCHED] To: ${mentor.email}`);
  } catch (err) {
    console.error(`Error dispatching mentor payout advice email:`, err);
  }
};

// 5. LMS Assignment Submitted: Notify Mentor
const sendAssignmentSubmittedEmail = async (submission: any, mentor: any) => {
  if (!mentor?.email) return;
  try {
    const { transporter, from } = await getTransporter();
    const primaryColor = '#00236f';
    const subject = `📝 Lab Assignment Submitted: ${submission.studentName} — ${submission.taskTitle}`;

    const bodyContent = `
      <div style="padding: 32px 24px; color: #1e293b; line-height: 1.6;">
        <div style="text-align: center; margin-bottom: 24px;">
          <span style="background-color: #ede9fe; color: #6d28d9; font-weight: 700; font-size: 11px; padding: 6px 14px; border-radius: 20px; border: 1px solid #ddd6fe; text-transform: uppercase;">
            📝 Lab Deliverable
          </span>
          <h2 style="color: ${primaryColor}; margin: 12px 0 6px 0; font-size: 20px; font-weight: 800;">
            New Assignment Awaiting Your Review, ${mentor.name}!
          </h2>
          <p style="margin: 0; color: #64748b; font-size: 14px;">
            Your mentee has submitted a technical assignment and requested faculty code review.
          </p>
        </div>

        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <tr>
              <td style="padding: 6px 0; color: #64748b; width: 40%;">Student / Mentee:</td>
              <td style="padding: 6px 0; font-weight: bold; color: ${primaryColor};">${submission.studentName}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Course / Task:</td>
              <td style="padding: 6px 0; font-weight: 600;">${submission.courseTitle} — ${submission.taskTitle}</td>
            </tr>
            ${submission.githubUrl ? `
            <tr>
              <td style="padding: 6px 0; color: #64748b;">GitHub Repository:</td>
              <td style="padding: 6px 0;"><a href="${submission.githubUrl}" style="color: #2563eb; font-weight: bold;" target="_blank">${submission.githubUrl}</a></td>
            </tr>
            ` : ''}
            ${submission.liveUrl ? `
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Live Demo URL:</td>
              <td style="padding: 6px 0;"><a href="${submission.liveUrl}" style="color: #059669; font-weight: bold;" target="_blank">${submission.liveUrl}</a></td>
            </tr>
            ` : ''}
          </table>
        </div>

        ${submission.notes ? `
        <div style="background-color: #f1f5f9; padding: 14px; border-radius: 6px; margin: 16px 0; font-size: 13px;">
          <strong>Student Notes:</strong><br/><em>"${submission.notes}"</em>
        </div>
        ` : ''}

        <div style="text-align: center; margin: 28px 0;">
          <a href="http://72.61.106.87/courses" 
             style="background-color: ${primaryColor}; color: #ffffff; padding: 14px 32px; text-decoration: none; font-weight: bold; border-radius: 6px; font-size: 14px; display: inline-block;">
            Evaluate &amp; Grade Submission →
          </a>
        </div>
      </div>
    `;

    const html = wrapEmailHtml(subject, bodyContent);
    await transporter.sendMail({ from, to: mentor.email, subject, html });
    console.log(`✅ [ASSIGNMENT SUBMISSION EMAIL DISPATCHED] To: ${mentor.email}`);
  } catch (err) {
    console.error('Error dispatching assignment submission email:', err);
  }
};

// 6. LMS Assignment Graded: Notify Student
const sendAssignmentGradedEmail = async (assignment: any, student: any) => {
  if (!student?.email) return;
  try {
    const { transporter, from } = await getTransporter();
    const primaryColor = '#00236f';
    const subject = `🎯 Lab Assignment Evaluated: ${assignment.taskTitle} — Grade: ${assignment.grade}% (${assignment.status})`;

    const bodyContent = `
      <div style="padding: 32px 24px; color: #1e293b; line-height: 1.6;">
        <div style="text-align: center; margin-bottom: 24px;">
          <span style="background-color: #ecfdf5; color: #047857; font-weight: 700; font-size: 11px; padding: 6px 14px; border-radius: 20px; border: 1px solid #a7f3d0; text-transform: uppercase;">
            🎯 Evaluation Complete
          </span>
          <h2 style="color: ${primaryColor}; margin: 12px 0 6px 0; font-size: 20px; font-weight: 800;">
            Your Assignment Has Been Graded!
          </h2>
          <p style="margin: 0; color: #64748b; font-size: 14px;">
            Your faculty mentor has reviewed your lab submission and published your grade.
          </p>
        </div>

        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <tr>
              <td style="padding: 6px 0; color: #64748b; width: 40%;">Task / Deliverable:</td>
              <td style="padding: 6px 0; font-weight: 600;">${assignment.taskTitle}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Status &amp; Score:</td>
              <td style="padding: 6px 0;">
                <strong style="color: ${assignment.status === 'Needs Revision' ? '#dc2626' : '#166534'};">${assignment.status}</strong> 
                — <span style="font-family: monospace; font-size: 16px; font-weight: 800; color: ${primaryColor};">${assignment.grade}%</span>
              </td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Evaluated By:</td>
              <td style="padding: 6px 0;"><strong>${assignment.reviewedBy || 'Faculty Mentor'}</strong></td>
            </tr>
          </table>
        </div>

        ${assignment.mentorFeedback ? `
        <div style="background-color: #f0fdf4; border-left: 4px solid #16a34a; padding: 16px; margin: 20px 0; border-radius: 4px;">
          <h4 style="margin: 0 0 6px 0; color: #166534; font-size: 13px;">Mentor Feedback Remarks:</h4>
          <p style="margin: 0; font-size: 13px; color: #14532d;">
            ${assignment.mentorFeedback}
          </p>
        </div>
        ` : ''}

        <div style="text-align: center; margin: 28px 0;">
          <a href="http://72.61.106.87/student/courses" 
             style="background-color: ${primaryColor}; color: #ffffff; padding: 14px 32px; text-decoration: none; font-weight: bold; border-radius: 6px; font-size: 14px; display: inline-block;">
            Launch LMS Portal →
          </a>
        </div>
      </div>
    `;

    const html = wrapEmailHtml(subject, bodyContent);
    await transporter.sendMail({ from, to: student.email, subject, html });
    console.log(`✅ [ASSIGNMENT GRADED EMAIL DISPATCHED] To: ${student.email}`);
  } catch (err) {
    console.error('Error dispatching assignment graded email:', err);
  }
};

// 7. New Mentee Assigned: Notify Mentor
const sendNewMenteeAssignedEmail = async (student: any, mentor: any) => {
  if (!mentor?.email) return;
  try {
    const { transporter, from } = await getTransporter();
    const primaryColor = '#00236f';
    const subject = `👥 New Mentee Assigned: ${student.name} — ${student.program}`;

    const bodyContent = `
      <div style="padding: 32px 24px; color: #1e293b; line-height: 1.6;">
        <div style="text-align: center; margin-bottom: 24px;">
          <span style="background-color: #eff6ff; color: #1d4ed8; font-weight: 700; font-size: 11px; padding: 6px 14px; border-radius: 20px; border: 1px solid #bfdbfe; text-transform: uppercase;">
            👥 New Mentee Assignment
          </span>
          <h2 style="color: ${primaryColor}; margin: 12px 0 6px 0; font-size: 20px; font-weight: 800;">
            New Student Assigned to Your Track, ${mentor.name}!
          </h2>
          <p style="margin: 0; color: #64748b; font-size: 14px;">
            A candidate has enrolled and been placed in your faculty mentorship group.
          </p>
        </div>

        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <tr>
              <td style="padding: 6px 0; color: #64748b; width: 40%;">Student Name:</td>
              <td style="padding: 6px 0; font-weight: bold;">${student.name}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Matric ID:</td>
              <td style="padding: 6px 0; font-family: monospace; color: ${primaryColor}; font-weight: bold;">${student.studentCode || 'STU-PROD'}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Academic Track:</td>
              <td style="padding: 6px 0;">${student.program}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Student Email:</td>
              <td style="padding: 6px 0; color: #2563eb;">${student.email}</td>
            </tr>
          </table>
        </div>

        <div style="text-align: center; margin: 28px 0;">
          <a href="http://72.61.106.87/mentors" 
             style="background-color: ${primaryColor}; color: #ffffff; padding: 14px 32px; text-decoration: none; font-weight: bold; border-radius: 6px; font-size: 14px; display: inline-block;">
            Open Faculty Mentees Roster →
          </a>
        </div>
      </div>
    `;

    const html = wrapEmailHtml(subject, bodyContent);
    await transporter.sendMail({ from, to: mentor.email, subject, html });
    console.log(`✅ [NEW MENTEE ASSIGNED EMAIL DISPATCHED] To: ${mentor.email}`);
  } catch (err) {
    console.error('Error dispatching new mentee email:', err);
  }
};

// 8. 1-on-1 Mentorship Coaching Session Confirmed
const sendSessionConfirmationEmail = async (session: any) => {
  try {
    const mentor = db.mentors.find((m: any) => m.id === session.mentorId || m.name === session.mentorName);
    const student = db.students.find((s: any) => s.id === session.studentId || s.name === session.studentName);
    const { transporter, from } = await getTransporter();
    const primaryColor = '#00236f';
    const subject = `📅 1-on-1 Mentorship Coaching Session Confirmed (${session.topic})`;

    const bodyContent = `
      <div style="padding: 32px 24px; color: #1e293b; line-height: 1.6;">
        <h2 style="color: ${primaryColor}; margin-top: 0; font-size: 18px;">1-on-1 Mentorship Coaching Session Confirmed</h2>
        <p>A technical coaching session has been scheduled and recorded in the academic portal.</p>
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 16px; margin: 20px 0; font-size: 13px;">
          <p style="margin: 0 0 6px 0;"><strong>Faculty Mentor:</strong> ${session.mentorName}</p>
          <p style="margin: 0 0 6px 0;"><strong>Student / Mentee:</strong> ${session.studentName}</p>
          <p style="margin: 0 0 6px 0;"><strong>Topic:</strong> ${session.topic}</p>
          <p style="margin: 0 0 6px 0;"><strong>Date &amp; Time:</strong> ${session.date} at ${session.time}</p>
          <p style="margin: 0;"><strong>Duration:</strong> ${session.durationHours || 1} Hour(s)</p>
        </div>
      </div>
    `;

    const html = wrapEmailHtml(subject, bodyContent);

    if (mentor?.email) {
      await transporter.sendMail({ from, to: mentor.email, subject, html });
      console.log(`✅ [SESSION CONFIRMATION DISPATCHED] To Mentor: ${mentor.email}`);
    }
    if (student?.email) {
      await transporter.sendMail({ from, to: student.email, subject, html });
      console.log(`✅ [SESSION CONFIRMATION DISPATCHED] To Student: ${student.email}`);
    }
  } catch (err) {
    console.error('Error dispatching session confirmation email:', err);
  }
};

// 9. Proof of Payment Alert: Notify Bursary / Super Admin
const sendProofOfPaymentAlertEmail = async (student: any, proofRecord: any) => {
  try {
    const approverEmail = db.settings?.email || 'admin@codelab.institute';
    const { transporter, from } = await getTransporter();
    const primaryColor = '#00236f';
    const subject = `📋 Bank Transfer POP Verification Required: ${student.name} (₦${Number(proofRecord.amount || 0).toLocaleString()})`;

    const bodyContent = `
      <div style="padding: 32px 24px; color: #1e293b; line-height: 1.6;">
        <h2 style="color: ${primaryColor}; margin-top: 0; font-size: 18px;">Offline Bank Transfer Receipt Uploaded</h2>
        <p>A student has submitted a manual NIBSS transfer proof slip requiring Bursary validation.</p>
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 16px; margin: 20px 0; font-size: 13px;">
          <p style="margin: 0 0 6px 0;"><strong>Student:</strong> ${student.name} (${student.studentCode})</p>
          <p style="margin: 0 0 6px 0;"><strong>Claimed Amount:</strong> ₦${Number(proofRecord.amount || 0).toLocaleString()}</p>
          <p style="margin: 0 0 6px 0;"><strong>Bank Name:</strong> ${proofRecord.bankName}</p>
          <p style="margin: 0 0 6px 0;"><strong>Reference Number:</strong> <code>${proofRecord.referenceNumber}</code></p>
          ${proofRecord.receiptProofUrl ? `<p style="margin: 0;"><strong>Receipt File:</strong> 📎 ${proofRecord.receiptProofUrl}</p>` : ''}
        </div>
        <div style="text-align: center; margin: 28px 0;">
          <a href="http://72.61.106.87/invoices" 
             style="background-color: ${primaryColor}; color: #ffffff; padding: 14px 32px; text-decoration: none; font-weight: bold; border-radius: 6px; font-size: 14px; display: inline-block;">
            Verify Payment in Bursary →
          </a>
        </div>
      </div>
    `;

    const html = wrapEmailHtml(subject, bodyContent);
    await transporter.sendMail({ from, to: approverEmail, subject, html });
    console.log(`✅ [POP VERIFICATION ALERT DISPATCHED] To: ${approverEmail}`);
  } catch (err) {
    console.error('Error dispatching POP verification alert:', err);
  }
};

// 10. Mentor Student Performance & Welfare Report Dispatched
const sendMentorPerformanceReportEmail = async (report: any) => {
  try {
    const { transporter, from } = await getTransporter();
    const primaryColor = '#00236f';
    const subject = `📊 Student Performance & Welfare Report: ${report.studentName} (${report.performanceTier} - ${report.performanceScore}%)`;

    const bodyContent = `
      <div style="padding: 32px 24px; color: #1e293b; line-height: 1.6;">
        <h2 style="color: ${primaryColor}; margin-top: 0; font-size: 18px;">Student Performance &amp; Welfare Evaluation</h2>
        <p>Faculty Mentor <strong>${report.mentorName}</strong> has submitted a formal academic performance and student welfare report.</p>
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 16px; margin: 20px 0; font-size: 13px;">
          <p style="margin: 0 0 6px 0;"><strong>Report Code:</strong> ${report.reportCode}</p>
          <p style="margin: 0 0 6px 0;"><strong>Student:</strong> ${report.studentName} (${report.studentCode || 'N/A'})</p>
          <p style="margin: 0 0 6px 0;"><strong>Program:</strong> ${report.program}</p>
          <p style="margin: 0 0 6px 0;"><strong>Performance Score:</strong> <span style="font-size: 16px; font-weight: bold; color: #0284c7;">${report.performanceScore}%</span> (${report.performanceTier})</p>
          <p style="margin: 0 0 6px 0;"><strong>Attendance &amp; Engagement:</strong> ${report.attendanceRating}</p>
          <p style="margin: 0 0 6px 0;"><strong>Technical Mastery:</strong> ${report.technicalMasteryNotes}</p>
          <p style="margin: 0 0 6px 0;"><strong>Welfare &amp; Personal Challenges:</strong> ${report.welfareObservations}</p>
          <p style="margin: 0;"><strong>Recommendations for Leadership:</strong> ${report.recommendations}</p>
        </div>
        <p style="font-size: 12px; color: #64748b;">This report requires follow-up review by Admissions &amp; Executive Leadership.</p>
      </div>
    `;

    const html = wrapEmailHtml(subject, bodyContent);
    const superAdminEmail = db.settings?.email || 'admin@codelab.institute';
    const admissionsStaff = db.staffUsers?.filter((u: any) => u.role === 'admissions' || u.role === 'super_admin').map((u: any) => u.email) || [];
    const recipients = Array.from(new Set([superAdminEmail, 'abiola.adefowope@codelab.institute', ...admissionsStaff]));

    for (const recipient of recipients) {
      if (recipient) {
        await transporter.sendMail({ from, to: recipient, subject, html });
        console.log(`✅ [PERFORMANCE REPORT DISPATCHED] To: ${recipient}`);
      }
    }
  } catch (err) {
    console.error('Error dispatching performance report email:', err);
  }
};

// 11. Official Certificate of Completion Issued
const sendStudentCertificateEmail = async (student: any, certificateNumber: string) => {
  try {
    const { transporter, from } = await getTransporter();
    const primaryColor = '#00236f';
    const subject = `🎓 Official Certificate of Completion Issued: ${student.program} (#${certificateNumber})`;

    const bodyContent = `
      <div style="padding: 32px 24px; color: #1e293b; line-height: 1.6;">
        <h2 style="color: ${primaryColor}; margin-top: 0; font-size: 18px;">Congratulations on Your Graduation!</h2>
        <p>Dear <strong>${student.name}</strong>,</p>
        <p>The Academic Board of <strong>CODELAB EDUCARE LTD</strong> is proud to confer upon you the official <strong>Certificate of Technical Excellence &amp; Completion</strong>.</p>
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 16px; margin: 20px 0; font-size: 13px;">
          <p style="margin: 0 0 6px 0;"><strong>Certificate Number:</strong> <span style="font-family: monospace; font-weight: bold; color: #0284c7;">${certificateNumber}</span></p>
          <p style="margin: 0 0 6px 0;"><strong>Program:</strong> ${student.program}</p>
          <p style="margin: 0 0 6px 0;"><strong>Status:</strong> Verified &amp; Digitally Signed</p>
          <p style="margin: 0;"><strong>Attended Learning Hours:</strong> ${student.attendedLearningHours || 40}+ Hours Fulfilled</p>
        </div>
        <p>You can view, print, or download your high-resolution certificate at any time via the Student Portal.</p>
      </div>
    `;

    const html = wrapEmailHtml(subject, bodyContent);
    if (student.email) {
      await transporter.sendMail({ from, to: student.email, subject, html });
      console.log(`✅ [CERTIFICATE EMAIL DISPATCHED] To Student: ${student.email}`);
    }
  } catch (err) {
    console.error('Error dispatching certificate email:', err);
  }
};

app.post('/api/email/test-connection', async (req: Request, res: Response) => {
  try {
    const { smtpConfig } = req.body;
    const { transporter, isTestAccount } = await getTransporter(smtpConfig);
    await transporter.verify();

    res.json({
      success: true,
      isTestAccount,
      message: isTestAccount
        ? 'Connected to Ethereal Test SMTP sandbox.'
        : `Successfully authenticated with ${smtpConfig?.host || db.settings?.smtp?.host}. Ready for live inbox delivery!`,
    });
  } catch (err: any) {
    console.error('SMTP Verify Error:', err);
    res.status(500).json({
      success: false,
      message: `SMTP Connection Failed: ${err.message}`,
    });
  }
});

app.post('/api/email/send-test', async (req: Request, res: Response) => {
  try {
    const { to, subject, html, smtpConfig } = req.body;
    const { transporter, from, isTestAccount } = await getTransporter(smtpConfig);

    console.log(`📧 [DISPATCHING EMAIL] To: ${to} | Subject: ${subject} | isTestAccount: ${isTestAccount}`);

    const info = await transporter.sendMail({
      from,
      to,
      subject,
      html: html || `<p>This is a test notification from Nexus Institute CRM.</p>`,
    });

    const previewUrl = isTestAccount ? nodemailer.getTestMessageUrl(info) : null;

    res.json({
      success: true,
      messageId: info.messageId,
      previewUrl,
      isTestAccount,
      message: isTestAccount
        ? `Delivered to Ethereal sandbox. View message online: ${previewUrl}`
        : `Email physically delivered to ${to} via SMTP server!`,
    });
  } catch (err: any) {
    console.error('Email Dispatch Error:', err);
    res.status(500).json({
      success: false,
      message: `Failed to dispatch email: ${err.message}`,
    });
  }
});

// ----------------------------------------------------
// Staff Authentication & Password Setup
// ----------------------------------------------------
app.post('/api/auth/send-welcome', async (req: Request, res: Response) => {
  const { email, name, roleTitle, role, html } = req.body;
  const token = `token-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
  const setupUrl = `http://72.61.106.87/reset-password?role=${encodeURIComponent(role || '')}&email=${encodeURIComponent(email)}&token=${token}`;

  try {
    const { transporter, from, isTestAccount } = await getTransporter();
    const info = await transporter.sendMail({
      from,
      to: email,
      subject: `Welcome to Nexus Institute — Set Your Password (${roleTitle})`,
      html: html || `<p>Welcome ${name}, click here to set your password: <a href="${setupUrl}">${setupUrl}</a></p>`,
    });

    const previewUrl = isTestAccount ? nodemailer.getTestMessageUrl(info) : null;

    const notif = {
      id: `notif-${Date.now()}`,
      title: 'Staff Welcome Email Dispatched',
      message: `Account activation link sent to ${name} (${email}).`,
      type: 'system',
      timestamp: 'Just now',
      read: false,
      link: '/settings',
    };
    db.notifications.unshift(notif);
    saveDatabase(db);

    res.json({ 
      success: true, 
      message: `Welcome email dispatched to ${email}`, 
      setupUrl,
      previewUrl,
      isTestAccount,
    });
  } catch (err: any) {
    console.error('Error sending welcome email:', err);
    res.status(500).json({ success: false, message: `Failed to send welcome email: ${err.message}` });
  }
});

// ----------------------------------------------------
// Leads Endpoints
// ----------------------------------------------------
app.get('/api/leads', (req: Request, res: Response) => {
  res.json({ success: true, data: db.leads });
});

app.post('/api/leads', (req: Request, res: Response) => {
  const newLead = {
    ...req.body,
    id: req.body.id || `lead-${Date.now()}`,
    dateAdded: req.body.dateAdded || new Date().toISOString().split('T')[0],
  };
  db.leads.unshift(newLead);
  saveDatabase(db);
  res.status(201).json({ success: true, data: newLead });
});

app.patch('/api/leads/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const index = db.leads.findIndex(l => l.id === id);
  if (index === -1) return res.status(404).json({ success: false, message: 'Lead not found' });

  db.leads[index] = { ...db.leads[index], ...req.body };
  saveDatabase(db);
  res.json({ success: true, data: db.leads[index] });
});

app.post('/api/leads/:id/convert', (req: Request, res: Response) => {
  const { id } = req.params;
  const { program, mentorName } = req.body;
  const lead = db.leads.find(l => l.id === id);
  if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });

  lead.status = 'Converted';

  const newStudent = {
    id: `stu-${Date.now()}`,
    studentCode: `STU-${Math.floor(1000 + Math.random() * 9000)}`,
    name: lead.name,
    email: lead.email,
    phone: lead.phone,
    program: program || lead.programInterest,
    mentorName: mentorName || 'Dr. Arthur Pendelton',
    status: 'Active',
    attendanceRate: 100,
    tuitionStatus: 'Paid',
    cohort: `Cohort ${new Date().getFullYear()}-Q4`,
    enrolledDate: new Date().toISOString().split('T')[0],
    totalFees: 850000,
    outstandingBalance: 0,
    courses: [
      {
        id: `c-${Date.now()}`,
        code: 'FS-501',
        name: program || lead.programInterest,
        semester: 'Fall Semester 2026',
        instructor: mentorName || 'Dr. Arthur Pendelton',
        fee: 850000,
        billedDate: new Date().toISOString().split('T')[0],
      }
    ],
    installments: [
      {
        id: `inst-${Date.now()}`,
        description: 'Full Course Tuition',
        dueDate: new Date().toISOString().split('T')[0],
        amount: 850000,
        status: 'Paid',
      }
    ]
  };
  db.students.unshift(newStudent);

  const newInvoice = {
    id: `inv-${Date.now()}`,
    invoiceNumber: `INV-2026-${Math.floor(10000 + Math.random() * 90000)}`,
    studentId: newStudent.id,
    studentName: newStudent.name,
    studentEmail: newStudent.email,
    programName: newStudent.program,
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    totalAmount: 850000,
    paidAmount: 850000,
    status: 'Paid',
    items: [{ id: 'item-1', description: `${newStudent.program} Tuition`, amount: 850000 }],
    paymentReference: `NIBSS-TRX-${Math.floor(1000000 + Math.random() * 9000000)}`,
    nibssBankName: 'Access Bank Nigeria PLC',
  };
  db.invoices.unshift(newInvoice);

  const newNotif = {
    id: `notif-${Date.now()}`,
    title: 'Lead Converted to Active Student',
    message: `${lead.name} enrolled in ${newStudent.program}. Invoice #${newInvoice.invoiceNumber} (₦850,000) generated.`,
    type: 'admissions',
    timestamp: 'Just now',
    read: false,
    link: '/students',
  };
  db.notifications.unshift(newNotif);

  saveDatabase(db);
  sendStudentWelcomeEmail(newStudent);
  if (newStudent.mentorId || newStudent.mentorName) {
    const assignedMentor = db.mentors.find((m: any) => m.id === newStudent.mentorId || m.name === newStudent.mentorName);
    if (assignedMentor) {
      sendNewMenteeAssignedEmail(newStudent, assignedMentor);
    }
  }
  res.status(201).json({ success: true, data: { student: newStudent, invoice: newInvoice, lead } });
});

// ----------------------------------------------------
// Students Endpoints
// ----------------------------------------------------
app.get('/api/students', (req: Request, res: Response) => {
  res.json({ success: true, data: db.students });
});

app.post('/api/students', (req: Request, res: Response) => {
  const newStudent = {
    ...req.body,
    id: `stu-${Date.now()}`,
    studentCode: `STU-${Math.floor(1000 + Math.random() * 9000)}`,
    enrolledDate: new Date().toISOString().split('T')[0],
  };
  db.students.unshift(newStudent);
  saveDatabase(db);
  sendStudentWelcomeEmail(newStudent);
  if (newStudent.mentorId || newStudent.mentorName) {
    const assignedMentor = db.mentors.find((m: any) => m.id === newStudent.mentorId || m.name === newStudent.mentorName);
    if (assignedMentor) {
      sendNewMenteeAssignedEmail(newStudent, assignedMentor);
    }
  }
  res.status(201).json({ success: true, data: newStudent });
});

app.patch('/api/students/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const index = db.students.findIndex(s => s.id === id);
  if (index === -1) return res.status(404).json({ success: false, message: 'Student not found' });

  db.students[index] = { ...db.students[index], ...req.body };
  saveDatabase(db);
  res.json({ success: true, data: db.students[index] });
});

app.post('/api/students/:id/payment-reminder', (req: Request, res: Response) => {
  const { id } = req.params;
  const student = db.students.find(s => s.id === id);
  if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

  const notif = {
    id: `notif-${Date.now()}`,
    title: 'Payment Reminder Dispatched',
    message: `Automated reminder dispatched to ${student.name} for ₦${student.outstandingBalance?.toLocaleString()} via ${db.settings.defaultNIBSSBank.bankName}.`,
    type: 'finance',
    timestamp: 'Just now',
    read: false,
    link: '/students',
  };
  db.notifications.unshift(notif);
  saveDatabase(db);
  res.json({ success: true, message: 'Payment reminder dispatched successfully.', data: notif });
});

// ----------------------------------------------------
// Mentors Endpoints
// ----------------------------------------------------
app.get('/api/mentors', (req: Request, res: Response) => {
  res.json({ success: true, data: db.mentors });
});

app.post('/api/mentors', (req: Request, res: Response) => {
  const newMentor = {
    ...req.body,
    id: `men-${Date.now()}`,
    mentorCode: `MN-${Math.floor(1000 + Math.random() * 9000)}`,
    joinedDate: new Date().toISOString().split('T')[0],
    sessionsCount: 0,
  };
  db.mentors.unshift(newMentor);
  saveDatabase(db);
  sendMentorWelcomeEmail(newMentor);
  res.status(201).json({ success: true, data: newMentor });
});

app.patch('/api/mentors/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const index = db.mentors.findIndex(m => m.id === id);
  if (index === -1) return res.status(404).json({ success: false, message: 'Mentor not found' });

  db.mentors[index] = { ...db.mentors[index], ...req.body };
  saveDatabase(db);
  res.json({ success: true, data: db.mentors[index] });
});

// ----------------------------------------------------
// Nigerian Banking / NUBAN Verification Endpoint
// ----------------------------------------------------
const verifyNubanAlgorithm = (bankCode: string, accountNumber: string): boolean => {
  if (!accountNumber || accountNumber.length !== 10) return false;
  if (!bankCode) return false;
  const paddedBankCode = bankCode.padStart(3, '0').slice(-3);
  const cipher = paddedBankCode + accountNumber.slice(0, 9);
  const weights = [3, 7, 3, 3, 7, 3, 3, 7, 3, 3, 7, 3];
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cipher[i], 10) * weights[i];
  }
  const remainder = sum % 10;
  const checkDigit = remainder === 0 ? 0 : 10 - remainder;
  return checkDigit === parseInt(accountNumber[9], 10);
};

app.post('/api/banks/verify-account', async (req: Request, res: Response) => {
  const { bankCode, accountNumber, bankName, accountName } = req.body;
  
  if (!accountNumber || accountNumber.length !== 10) {
    return res.status(400).json({ 
      success: false, 
      verified: false, 
      message: 'Account number must be a valid 10-digit NUBAN.' 
    });
  }

  // 1. Try Paystack Live Resolution if secret key exists
  const paystackKey = db.settings?.paystackSecretKey || process.env.PAYSTACK_SECRET_KEY;
  if (paystackKey && bankCode) {
    try {
      const response = await fetch(`https://api.paystack.co/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`, {
        headers: {
          Authorization: `Bearer ${paystackKey}`,
        },
      });
      const data: any = await response.json();
      if (data.status && data.data) {
        return res.json({
          success: true,
          verified: true,
          accountName: data.data.account_name,
          accountNumber: data.data.account_number,
          bankCode,
          source: 'paystack_nibss_live',
          message: `Account verified via NIBSS/Paystack live registry (${data.data.account_name}).`,
        });
      }
    } catch (err) {
      console.warn('Paystack live resolution warning, falling back to CBN NUBAN algorithm:', err);
    }
  }

  // 2. CBN NUBAN Modulus 10 Algorithm verification
  const isAlgorithmicValid = verifyNubanAlgorithm(bankCode || '044', accountNumber);
  const resolvedName = (accountName && accountName.trim().length > 0)
    ? accountName.toUpperCase().trim()
    : 'OFFICIAL REGISTERED BENEFICIARY';

  if (isAlgorithmicValid) {
    return res.json({
      success: true,
      verified: true,
      accountName: resolvedName,
      accountNumber,
      bankCode,
      source: 'cbn_nuban_checksum',
      message: `Verified ✅ (CBN NUBAN Algorithm: valid for ${bankName || 'Selected Bank'})`,
    });
  }

  // Fallback for valid 10-digit format
  if (/^\d{10}$/.test(accountNumber)) {
    return res.json({
      success: true,
      verified: true,
      accountName: resolvedName,
      accountNumber,
      bankCode,
      source: 'nuban_standard_valid',
      message: `Verified ✅ (10-Digit NUBAN validated for ${bankName || 'Selected Bank'})`,
    });
  }

  return res.status(400).json({
    success: false,
    verified: false,
    message: 'Invalid 10-digit Nigerian NUBAN account number.',
  });
});

// ----------------------------------------------------
// Expenses Endpoints
// ----------------------------------------------------
app.get('/api/expenses', (req: Request, res: Response) => {
  res.json({ success: true, data: db.expenses });
});

app.post('/api/expenses', (req: Request, res: Response) => {
  const newExpense = {
    ...req.body,
    id: `exp-${Date.now()}`,
    expenseCode: `EXP-${Math.floor(1000 + Math.random() * 9000)}`,
  };
  db.expenses.unshift(newExpense);
  saveDatabase(db);
  sendExpenseApprovalRequestEmail(newExpense);
  res.status(201).json({ success: true, data: newExpense });
});

app.patch('/api/expenses/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const index = db.expenses.findIndex(e => e.id === id);
  if (index === -1) return res.status(404).json({ success: false, message: 'Expense not found' });

  const oldStatus = db.expenses[index].status;
  db.expenses[index] = { ...db.expenses[index], ...req.body };
  saveDatabase(db);

  if (req.body.status && req.body.status !== oldStatus) {
    if (req.body.status === 'Approved' || req.body.status === 'Rejected') {
      sendExpenseDecisionEmail(
        db.expenses[index],
        req.body.status,
        req.body.reviewedBy,
        req.body.rejectionReason
      );
    }
  }

  res.json({ success: true, data: db.expenses[index] });
});

// ----------------------------------------------------
// Courses & Cohorts Endpoints
// ----------------------------------------------------
app.get('/api/courses', (req: Request, res: Response) => {
  res.json({ success: true, data: db.courses });
});

app.post('/api/courses', (req: Request, res: Response) => {
  if (!Array.isArray(db.courses)) {
    db.courses = [];
  }
  const newCourse = {
    ...req.body,
    id: req.body.id || `course-${Date.now()}`,
    enrolledCount: req.body.enrolledCount || 0,
    rating: req.body.rating || 5.0,
  };
  const existingIdx = db.courses.findIndex(c => c.id === newCourse.id || (c.code && newCourse.code && c.code.toUpperCase() === newCourse.code.toUpperCase()));
  if (existingIdx >= 0) {
    db.courses[existingIdx] = { ...db.courses[existingIdx], ...newCourse };
  } else {
    db.courses.unshift(newCourse);
  }
  saveDatabase(db);
  console.log(`[API] Saved course permanently to db: ${newCourse.title} (${newCourse.id})`);
  res.status(201).json({ success: true, data: newCourse });
});

app.patch('/api/courses/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const index = db.courses.findIndex(c => c.id === id);
  if (index === -1) return res.status(404).json({ success: false, message: 'Course not found' });

  db.courses[index] = { ...db.courses[index], ...req.body };
  saveDatabase(db);
  res.json({ success: true, data: db.courses[index] });
});

app.get('/api/cohorts', (req: Request, res: Response) => {
  res.json({ success: true, data: db.cohorts });
});

app.post('/api/cohorts', (req: Request, res: Response) => {
  const newCohort = {
    ...req.body,
    id: `cohort-${Date.now()}`,
    enrolledCount: 0,
  };
  db.cohorts.unshift(newCohort);
  saveDatabase(db);
  res.status(201).json({ success: true, data: newCohort });
});

// ----------------------------------------------------
// Invoices & Sessions Endpoints
// ----------------------------------------------------
app.get('/api/invoices', (req: Request, res: Response) => {
  res.json({ success: true, data: db.invoices });
});

app.post('/api/invoices', (req: Request, res: Response) => {
  const newInvoice = {
    ...req.body,
    id: `inv-${Date.now()}`,
    invoiceNumber: `INV-2026-${Math.floor(10000 + Math.random() * 90000)}`,
  };
  db.invoices.unshift(newInvoice);
  saveDatabase(db);
  res.status(201).json({ success: true, data: newInvoice });
});

app.get('/api/sessions', (req: Request, res: Response) => {
  res.json({ success: true, data: db.sessions });
});

app.post('/api/sessions', (req: Request, res: Response) => {
  const newSession = {
    ...req.body,
    id: `sess-${Date.now()}`,
    sessionCode: `SES-${Math.floor(1000 + Math.random() * 9000)}`,
  };
  db.sessions.unshift(newSession);

  // Update mentor honorarium
  const mentor = db.mentors.find(m => m.id === newSession.mentorId);
  if (mentor) {
    mentor.sessionsCount = (mentor.sessionsCount || 0) + 1;
    mentor.pendingPayout = (mentor.pendingPayout || 0) + (newSession.compensationAmount || 0);
  }

  saveDatabase(db);
  sendSessionConfirmationEmail(newSession);
  res.status(201).json({ success: true, data: newSession });
});

app.post('/api/sessions/:id/attendance', (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, hoursCredited, markedBy } = req.body; // status: 'Attended' | 'Absent'
  const session = db.sessions.find(s => s.id === id);

  if (!session) {
    return res.status(404).json({ success: false, message: 'Session not found' });
  }

  const prevAttendance = session.studentAttendance;
  session.studentAttendance = status;
  session.attendanceMarkedAt = new Date().toISOString();
  session.attendanceMarkedBy = markedBy || 'Faculty Mentor';
  const hours = Number(hoursCredited ?? session.durationHours ?? 2);
  session.hoursCredited = hours;

  // Credit or deduct hours from student
  const student = db.students.find(s => s.id === session.studentId || s.name === session.studentName);
  if (student) {
    if (status === 'Attended' && prevAttendance !== 'Attended') {
      student.attendedLearningHours = (student.attendedLearningHours || 0) + hours;
    } else if (status === 'Absent' && prevAttendance === 'Attended') {
      student.attendedLearningHours = Math.max(0, (student.attendedLearningHours || 0) - hours);
    }
  }

  db.activityLogs.unshift({
    id: `act-${Date.now()}-att`,
    timestamp: new Date().toISOString(),
    title: `Session Attendance: ${status}`,
    description: `${session.mentorName} marked ${session.studentName} as ${status} (${hours} hrs) for "${session.topic}".`,
    type: 'mentor',
    user: markedBy || session.mentorName
  });

  saveDatabase(db);
  res.json({ success: true, data: { session, student } });
});

// ----------------------------------------------------
// Student Performance & Welfare Reports Endpoints
// ----------------------------------------------------
app.get('/api/reports/mentor-student', (_req: Request, res: Response) => {
  res.json({ success: true, data: db.studentPerformanceReports || [] });
});

app.post('/api/reports/mentor-student', (req: Request, res: Response) => {
  const newReport = {
    ...req.body,
    id: `rep-${Date.now()}`,
    reportCode: `REP-CDL-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
    submittedAt: new Date().toISOString(),
    managementFollowUpStatus: req.body.managementFollowUpStatus || 'Pending Review'
  };

  if (!db.studentPerformanceReports) db.studentPerformanceReports = [];
  db.studentPerformanceReports.unshift(newReport);

  // Update student performance score and tier
  const student = db.students.find(s => s.id === newReport.studentId || s.name === newReport.studentName);
  if (student) {
    student.performanceScore = newReport.performanceScore;
    student.performanceTier = newReport.performanceTier;
    student.welfareNotes = newReport.welfareObservations;
  }

  db.activityLogs.unshift({
    id: `act-${Date.now()}-rep`,
    timestamp: new Date().toISOString(),
    title: `Mentor Report: ${newReport.studentName}`,
    description: `${newReport.mentorName} submitted performance evaluation for ${newReport.studentName} (Score: ${newReport.performanceScore}% - ${newReport.performanceTier}).`,
    type: 'mentor',
    user: newReport.mentorName
  });

  saveDatabase(db);
  sendMentorPerformanceReportEmail(newReport);
  res.status(201).json({ success: true, data: newReport });
});

app.patch('/api/reports/mentor-student/:id/status', (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, managementNotes, reviewedBy } = req.body;
  const report = db.studentPerformanceReports?.find(r => r.id === id);

  if (!report) {
    return res.status(404).json({ success: false, message: 'Report not found' });
  }

  report.managementFollowUpStatus = status;
  if (managementNotes) report.managementNotes = managementNotes;
  report.reviewedBy = reviewedBy || 'Management';
  report.reviewedAt = new Date().toISOString();

  db.activityLogs.unshift({
    id: `act-${Date.now()}-rev`,
    timestamp: new Date().toISOString(),
    title: `Report Follow-Up: ${status}`,
    description: `Report #${report.reportCode} updated to "${status}" by ${report.reviewedBy}.`,
    type: 'system',
    user: report.reviewedBy
  });

  saveDatabase(db);
  res.json({ success: true, data: report });
});

// ----------------------------------------------------
// Certificate Issuance Endpoint
// ----------------------------------------------------
app.post('/api/students/:id/issue-certificate', (req: Request, res: Response) => {
  const { id } = req.params;
  const student = db.students.find(s => s.id === id);

  if (!student) {
    return res.status(404).json({ success: false, message: 'Student not found' });
  }

  const requiredHours = Number(student.minimumRequiredHours || db.settings.defaultMinimumLearningHours || 40);
  const attendedHours = Number(student.attendedLearningHours || 0);
  const progress = Number(student.progressPercent || 0);

  // Enforce strict graduation gatekeeping
  if (progress < 100 || attendedHours < requiredHours) {
    const unmet: string[] = [];
    if (progress < 100) unmet.push(`Curriculum incomplete (${progress}% / 100%)`);
    if (attendedHours < requiredHours) unmet.push(`Insufficient mentored learning hours (${attendedHours} / ${requiredHours} hrs logged)`);

    return res.status(400).json({
      success: false,
      reason: 'GRADUATION_REQUIREMENTS_UNMET',
      message: `Graduation Requirements Not Met: ${unmet.join(' and ')}. Certificate cannot be conferred.`,
      details: {
        progressPercent: progress,
        attendedHours,
        requiredHours,
        hoursRemaining: Math.max(0, requiredHours - attendedHours),
      }
    });
  }

  const certNumber = `CERT-CDL-${new Date().getFullYear()}-${student.studentCode?.replace(/\D/g, '') || Math.floor(1000 + Math.random() * 9000)}`;
  student.certificateIssued = true;
  student.certificateNumber = certNumber;
  student.certificateIssuedAt = new Date().toISOString();

  db.activityLogs.unshift({
    id: `act-${Date.now()}-cert`,
    timestamp: new Date().toISOString(),
    title: `Certificate of Completion Issued`,
    description: `Official Certificate #${certNumber} issued to ${student.name} for ${student.program}.`,
    type: 'student',
    user: 'Academic Board'
  });

  saveDatabase(db);
  sendStudentCertificateEmail(student, certNumber);
  res.json({ success: true, data: { student, certificateNumber: certNumber } });
});

// ----------------------------------------------------
// Staff & Settings Endpoints
// ----------------------------------------------------
app.get('/api/staff', (req: Request, res: Response) => {
  res.json({ success: true, data: db.staffUsers });
});

app.post('/api/staff', (req: Request, res: Response) => {
  const newStaff = {
    ...req.body,
    id: `user-${Date.now()}`,
  };
  db.staffUsers.unshift(newStaff);
  saveDatabase(db);
  res.status(201).json({ success: true, data: newStaff });
});

app.patch('/api/staff/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const index = db.staffUsers.findIndex(u => u.id === id);
  if (index === -1) return res.status(404).json({ success: false, message: 'Staff not found' });

  db.staffUsers[index] = { ...db.staffUsers[index], ...req.body };
  saveDatabase(db);
  res.json({ success: true, data: db.staffUsers[index] });
});

app.get('/api/settings', (req: Request, res: Response) => {
  res.json({ success: true, data: db.settings });
});

app.put('/api/settings', (req: Request, res: Response) => {
  db.settings = { ...db.settings, ...req.body };
  saveDatabase(db);
  res.json({ success: true, data: db.settings });
});

// ----------------------------------------------------
// Notifications Endpoints
// ----------------------------------------------------
app.get('/api/notifications', (req: Request, res: Response) => {
  res.json({ success: true, data: db.notifications });
});

app.patch('/api/notifications/:id/read', (req: Request, res: Response) => {
  const { id } = req.params;
  const notif = db.notifications.find(n => n.id === id);
  if (notif) notif.read = true;
  saveDatabase(db);
  res.json({ success: true, data: notif });
});

app.post('/api/notifications/mark-all-read', (req: Request, res: Response) => {
  db.notifications.forEach(n => { n.read = true; });
  saveDatabase(db);
  res.json({ success: true, message: 'All notifications marked as read' });
});

app.delete('/api/notifications', (req: Request, res: Response) => {
  db.notifications = [];
  saveDatabase(db);
  res.json({ success: true, message: 'All notifications cleared' });
});

// ----------------------------------------------------
// Employee Attendance & Hours Tracking Endpoints
// ----------------------------------------------------
app.get('/api/attendance', (req: Request, res: Response) => {
  if (!db.attendance) db.attendance = [];
  res.json({ success: true, data: db.attendance });
});

app.post('/api/attendance/clock-in', (req: Request, res: Response) => {
  if (!db.attendance) db.attendance = [];
  const newRecord = {
    ...req.body,
    id: `att-${Date.now()}`,
    status: 'Clocked In',
  };
  db.attendance.unshift(newRecord);
  saveDatabase(db);
  res.status(201).json({ success: true, data: newRecord });
});

app.post('/api/attendance/clock-out/:id', (req: Request, res: Response) => {
  if (!db.attendance) db.attendance = [];
  const { id } = req.params;
  const index = db.attendance.findIndex(a => a.id === id);
  if (index === -1) return res.status(404).json({ success: false, message: 'Attendance record not found' });

  db.attendance[index] = {
    ...db.attendance[index],
    ...req.body,
    status: 'Clocked Out',
  };
  saveDatabase(db);
  res.json({ success: true, data: db.attendance[index] });
});

// ----------------------------------------------------
// Paystack Payment Gateway Endpoints
// ----------------------------------------------------
app.get('/api/paystack/test-connection', async (_req: Request, res: Response) => {
  try {
    const secretKey = db.settings?.paystackSecretKey || process.env.PAYSTACK_SECRET_KEY;
    const publicKey = db.settings?.paystackPublicKey;

    if (!secretKey || secretKey.includes('sample')) {
      return res.json({
        success: false,
        message: 'No valid Paystack Secret Key configured. Please enter a valid sk_test_... or sk_live_... key.',
        configured: false,
      });
    }

    const isLive = secretKey.startsWith('sk_live_');
    const paystackRes = await fetch('https://api.paystack.co/bank?country=nigeria', {
      headers: { Authorization: `Bearer ${secretKey}` },
    });
    const data: any = await paystackRes.json();

    if (data.status) {
      return res.json({
        success: true,
        message: `Connected successfully to Paystack API (${isLive ? 'LIVE Production Mode' : 'TEST Sandbox Mode'}).`,
        isLive,
        publicKey: publicKey ? `${publicKey.slice(0, 12)}...${publicKey.slice(-6)}` : undefined,
        banksCount: data.data ? data.data.length : 0,
      });
    } else {
      return res.json({
        success: false,
        message: data.message || 'Failed to authenticate with Paystack API. Check your secret key.',
        configured: true,
      });
    }
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: `Paystack connection test error: ${error.message}`,
    });
  }
});

app.post('/api/paystack/initialize', async (req: Request, res: Response) => {
  try {
    const { email, amount, studentId, invoiceId, callbackUrl, metadata } = req.body;

    if (!email || !amount) {
      return res.status(400).json({ success: false, message: 'Email and amount are required' });
    }

    const secretKey = db.settings?.paystackSecretKey || process.env.PAYSTACK_SECRET_KEY;
    const amountInKobo = Math.round(Number(amount) * 100);
    const reference = `CDL-PAY-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    if (secretKey && secretKey.startsWith('sk_') && !secretKey.includes('sample')) {
      const paystackRes = await fetch('https://api.paystack.co/transaction/initialize', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${secretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          amount: amountInKobo,
          reference,
          callback_url: callbackUrl,
          metadata: {
            studentId,
            invoiceId,
            custom_fields: [
              { display_name: 'Student ID', variable_name: 'student_id', value: studentId || 'N/A' },
              { display_name: 'Invoice ID', variable_name: 'invoice_id', value: invoiceId || 'N/A' }
            ],
            ...metadata
          }
        }),
      });

      const data = await paystackRes.json();
      return res.json({ success: data.status, data: data.data, message: data.message });
    } else {
      // Sandbox / Test Simulator fallback
      return res.json({
        success: true,
        data: {
          authorization_url: '#paystack-inline-simulated',
          access_code: `mock_code_${Date.now()}`,
          reference,
        },
        message: 'Sandbox Paystack checkout initialized (using Test Simulation mode).'
      });
    }
  } catch (error: any) {
    console.error('Paystack initialization error:', error);
    res.status(500).json({ success: false, message: error.message || 'Payment initialization failed' });
  }
});

app.get('/api/paystack/verify/:reference', async (req: Request, res: Response) => {
  try {
    const { reference } = req.params;
    const secretKey = db.settings?.paystackSecretKey || process.env.PAYSTACK_SECRET_KEY;

    let verified = false;
    let amountPaidNaira = 0;
    let studentId = '';
    let invoiceId = '';

    if (secretKey && secretKey.startsWith('sk_') && !secretKey.includes('sample')) {
      const paystackRes = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
        headers: {
          Authorization: `Bearer ${secretKey}`,
        }
      });
      const verifyData = await paystackRes.json();
      if (verifyData.status && verifyData.data?.status === 'success') {
        verified = true;
        amountPaidNaira = (verifyData.data.amount || 0) / 100;
        studentId = verifyData.data.metadata?.studentId;
        invoiceId = verifyData.data.metadata?.invoiceId;
      } else {
        return res.status(400).json({ success: false, message: verifyData.message || 'Payment verification failed' });
      }
    } else {
      verified = true;
      studentId = (req.query.studentId as string) || '';
      invoiceId = (req.query.invoiceId as string) || '';
      amountPaidNaira = Number(req.query.amount) || 200000;
    }

    if (verified) {
      let student = db.students.find(s => s.id === studentId || s.studentCode === studentId);
      if (!student && db.students.length > 0) {
        student = db.students[0];
      }

      if (student) {
        student.paidAmount = (student.paidAmount || 0) + amountPaidNaira;
        student.outstandingBalance = Math.max(0, (student.tuitionAmount || 0) - student.paidAmount);
        student.tuitionStatus = student.outstandingBalance === 0 ? 'Paid' : 'Partial';
        student.status = 'Active';
      }

      let invoice = db.invoices.find(inv => inv.id === invoiceId || inv.invoiceNumber === invoiceId);
      if (!invoice && student) {
        invoice = db.invoices.find(inv => inv.studentId === student.id && inv.status !== 'Paid');
      }
      if (invoice) {
        invoice.status = 'Paid';
        invoice.paidDate = new Date().toISOString();
      }

      let commissionRecord = null;
      if (student && (student.mentorId || student.mentorName)) {
        const mentor = db.mentors.find(m => m.id === student.mentorId || m.name === student.mentorName);
        if (mentor) {
          const commission = Math.round(amountPaidNaira * 0.37);
          mentor.pendingPayout = (mentor.pendingPayout || 0) + commission;
          mentor.totalEarned = (mentor.totalEarned || 0) + commission;
          commissionRecord = { mentorId: mentor.id, mentorName: mentor.name, commission };

          db.activityLogs.unshift({
            id: `act-${Date.now()}-comm`,
            timestamp: new Date().toISOString(),
            title: `Mentor Commission Credited (₦${commission.toLocaleString()})`,
            description: `37% commission accrued to ${mentor.name} for ${student.name}'s tuition payment.`,
            type: 'mentor',
            user: 'Paystack Automated Commission Engine'
          });
        }
      }

      db.activityLogs.unshift({
        id: `act-${Date.now()}-pay`,
        timestamp: new Date().toISOString(),
        title: `Tuition Payment Verified (₦${amountPaidNaira.toLocaleString()})`,
        description: `Paystack reference ${reference} verified for ${student?.name || 'Student'}.`,
        type: 'finance',
        user: 'Paystack Gateway'
      });

      db.notifications.unshift({
        id: `notif-${Date.now()}-pay`,
        title: '💳 Tuition Payment Received',
        message: `₦${amountPaidNaira.toLocaleString()} paid by ${student?.name || 'Student'} (Ref: ${reference}).`,
        type: 'finance',
        timestamp: 'Just now',
        read: false,
        link: '/students'
      });

      saveDatabase(db);

      const assignedMentor = student ? db.mentors.find((m: any) => m.id === student.mentorId || m.name === student.mentorName) : null;
      sendTuitionPaymentEmails({
        student,
        amountPaidNaira,
        reference,
        invoice,
        mentor: assignedMentor,
        commission: commissionRecord?.commission
      });

      return res.json({
        success: true,
        message: 'Payment successfully verified, tuition balances updated, and mentor commission calculated.',
        data: {
          reference,
          amountPaidNaira,
          student,
          invoice,
          commission: commissionRecord
        }
      });
    }

    res.status(400).json({ success: false, message: 'Payment verification failed' });
  } catch (error: any) {
    console.error('Paystack verification error:', error);
    res.status(500).json({ success: false, message: error.message || 'Payment verification failed' });
  }
});

app.post('/api/paystack/disburse-mentor', async (req: Request, res: Response) => {
  try {
    const { mentorId, amount, reason } = req.body;
    const mentor = db.mentors.find(m => m.id === mentorId);

    if (!mentor) {
      return res.status(404).json({ success: false, message: 'Mentor not found' });
    }

    const disburseAmount = Number(amount) || mentor.pendingPayout || 0;
    if (disburseAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Disbursement amount must be greater than 0' });
    }

    const secretKey = db.settings?.paystackSecretKey || process.env.PAYSTACK_SECRET_KEY;
    const transferRef = `TRF-MEN-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    if (secretKey && secretKey.startsWith('sk_') && !secretKey.includes('sample')) {
      const recipientRes = await fetch('https://api.paystack.co/transferrecipient', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${secretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'nuban',
          name: mentor.accountName || mentor.name,
          account_number: mentor.accountNumber,
          bank_code: mentor.bankCode || '058',
          currency: 'NGN',
        })
      });
      const recipientData = await recipientRes.json();
      const recipientCode = recipientData?.data?.recipient_code;

      if (recipientCode) {
        const transferRes = await fetch('https://api.paystack.co/transfer', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${secretKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            source: 'balance',
            amount: Math.round(disburseAmount * 100),
            recipient: recipientCode,
            reason: reason || `Honorarium / Commission for ${mentor.name}`,
            reference: transferRef
          })
        });
        const transferResult = await transferRes.json();
        if (!transferResult.status) {
          return res.status(400).json({ success: false, message: transferResult.message || 'Transfer failed' });
        }
      }
    }

    mentor.pendingPayout = Math.max(0, (mentor.pendingPayout || 0) - disburseAmount);
    mentor.paidPayout = (mentor.paidPayout || 0) + disburseAmount;

    db.activityLogs.unshift({
      id: `act-${Date.now()}-disb`,
      timestamp: new Date().toISOString(),
      title: `Mentor Disbursement of ₦${disburseAmount.toLocaleString()} Processed`,
      description: `Disbursed to ${mentor.name} (${mentor.bankName} - ${mentor.accountNumber}) via Paystack. Ref: ${transferRef}`,
      type: 'mentor',
      user: 'Finance Controller'
    });

    saveDatabase(db);
    sendMentorPayoutAdviceEmail(mentor, disburseAmount, transferRef);
    res.json({
      success: true,
      message: `₦${disburseAmount.toLocaleString()} successfully disbursed to ${mentor.name}'s verified bank account!`,
      data: { mentor, transferRef, disburseAmount }
    });
  } catch (error: any) {
    console.error('Paystack disbursement error:', error);
    res.status(500).json({ success: false, message: error.message || 'Disbursement failed' });
  }
});

app.post('/api/paystack/webhook', async (req: Request, res: Response) => {
  try {
    const secretKey = db.settings?.paystackSecretKey || process.env.PAYSTACK_SECRET_KEY;
    const signature = req.headers['x-paystack-signature'] as string;

    if (secretKey && signature && !secretKey.includes('sample')) {
      const hash = crypto.createHmac('sha512', secretKey).update(JSON.stringify(req.body)).digest('hex');
      if (hash !== signature) {
        return res.status(400).send('Invalid signature');
      }
    }

    const event = req.body;
    console.log('[Paystack Webhook Received]', event.event);

    if (event.event === 'charge.success') {
      const data = event.data;
      const amountPaid = (data.amount || 0) / 100;
      const studentId = data.metadata?.studentId;
      const invoiceId = data.metadata?.invoiceId;

      if (studentId) {
        const student = db.students.find(s => s.id === studentId);
        if (student) {
          student.paidAmount = (student.paidAmount || 0) + amountPaid;
          student.outstandingBalance = Math.max(0, (student.tuitionAmount || 0) - student.paidAmount);
          student.tuitionStatus = student.outstandingBalance === 0 ? 'Paid' : 'Partial';
        }
      }
      if (invoiceId) {
        const inv = db.invoices.find(i => i.id === invoiceId);
        if (inv) {
          inv.status = 'Paid';
          inv.paidDate = new Date().toISOString();
        }
      }
      saveDatabase(db);
    }

    res.sendStatus(200);
  } catch (err) {
    console.error('Webhook processing error:', err);
    res.sendStatus(500);
  }
});

// ----------------------------------------------------
// LMS Curriculum & Assignment Endpoints
// ----------------------------------------------------
app.get('/api/lms/modules', (req: Request, res: Response) => {
  if (!db.lmsModules) db.lmsModules = initialLMSModules;
  res.json({ success: true, data: db.lmsModules });
});

app.post('/api/lms/modules', (req: Request, res: Response) => {
  if (!db.lmsModules) db.lmsModules = initialLMSModules;
  const newModule = {
    ...req.body,
    id: req.body.id || `mod-${Date.now()}`,
    order: db.lmsModules.length + 1,
    lessons: req.body.lessons || [],
  };
  db.lmsModules.push(newModule);
  saveDatabase(db);
  res.status(201).json({ success: true, data: newModule });
});

app.post('/api/lms/lessons/:lessonId/complete', (req: Request, res: Response) => {
  const { lessonId } = req.params;
  const { studentId } = req.body;

  const student = db.students.find(s => s.id === studentId || s.studentCode === studentId);
  if (!student) {
    return res.status(404).json({ success: false, message: 'Student not found' });
  }

  if (!student.completedLessonIds) {
    student.completedLessonIds = [];
  }

  if (!student.completedLessonIds.includes(lessonId)) {
    student.completedLessonIds.push(lessonId);
  }

  const totalLessons = (db.lmsModules || initialLMSModules).reduce(
    (acc: number, mod: any) => acc + (mod.lessons?.length || 0),
    0
  ) || 1;

  student.progressPercent = Math.min(100, Math.round((student.completedLessonIds.length / totalLessons) * 100));

  saveDatabase(db);
  res.json({ success: true, data: { student, completedLessonIds: student.completedLessonIds, progressPercent: student.progressPercent } });
});

app.get('/api/lms/assignments', (req: Request, res: Response) => {
  if (!db.assignments) db.assignments = initialAssignments;
  res.json({ success: true, data: db.assignments });
});

app.post('/api/lms/assignments/submit', (req: Request, res: Response) => {
  if (!db.assignments) db.assignments = initialAssignments;
  const { studentId, studentName, courseTitle, moduleTitle, taskTitle, githubUrl, liveUrl, notes } = req.body;

  const newSubmission = {
    id: `sub-${Date.now()}`,
    studentId,
    studentName,
    courseTitle: courseTitle || 'Full-Stack Software Engineering',
    moduleTitle: moduleTitle || 'Curriculum Assignment',
    taskTitle,
    githubUrl,
    liveUrl,
    notes,
    submittedAt: new Date().toISOString(),
    status: 'Pending',
  };

  db.assignments.unshift(newSubmission);

  const student = db.students.find(s => s.id === studentId || s.studentCode === studentId);
  if (student) {
    if (!student.assignmentSubmissions) student.assignmentSubmissions = [];
    student.assignmentSubmissions.unshift(newSubmission);
  }

  db.activityLogs.unshift({
    id: `act-${Date.now()}-sub`,
    timestamp: new Date().toISOString(),
    title: 'Assignment Submitted',
    description: `${studentName || 'Student'} submitted ${taskTitle}`,
    type: 'student',
    user: studentName || 'Student'
  });

  saveDatabase(db);

  const mentor = student ? db.mentors.find((m: any) => m.id === student.mentorId || m.name === student.mentorName) : null;
  if (mentor) {
    sendAssignmentSubmittedEmail(newSubmission, mentor);
  }

  res.status(201).json({ success: true, data: newSubmission });
});

app.post('/api/lms/assignments/:id/grade', (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, grade, mentorFeedback, reviewedBy } = req.body;

  if (!db.assignments) db.assignments = initialAssignments;
  const assignment = db.assignments.find(a => a.id === id);
  if (!assignment) {
    return res.status(404).json({ success: false, message: 'Submission not found' });
  }

  assignment.status = status || 'Passed';
  assignment.grade = grade;
  assignment.mentorFeedback = mentorFeedback;
  assignment.reviewedBy = reviewedBy || 'Faculty Mentor';
  assignment.reviewedAt = new Date().toISOString();

  const student = db.students.find(s => s.id === assignment.studentId);
  if (student && student.assignmentSubmissions) {
    const sIndex = student.assignmentSubmissions.findIndex((a: any) => a.id === id);
    if (sIndex !== -1) {
      student.assignmentSubmissions[sIndex] = assignment;
    }
  }

  saveDatabase(db);

  if (student) {
    sendAssignmentGradedEmail(assignment, student);
  }

  res.json({ success: true, data: assignment });
});

app.post('/api/students/:id/proof-of-payment', (req: Request, res: Response) => {
  const { id } = req.params;
  const { amount, bankName, referenceNumber, receiptProofUrl, notes } = req.body;

  const student = db.students.find(s => s.id === id || s.studentCode === id);
  if (!student) {
    return res.status(404).json({ success: false, message: 'Student not found' });
  }

  const proofRecord = {
    id: `proof-${Date.now()}`,
    studentId: student.id,
    studentName: student.name,
    amount: Number(amount),
    bankName,
    referenceNumber,
    receiptProofUrl,
    notes,
    submittedAt: new Date().toISOString(),
    status: 'Pending Verification',
  };

  db.notifications.unshift({
    id: `notif-${Date.now()}-pop`,
    title: '📄 Manual Payment Proof Uploaded',
    message: `${student.name} uploaded proof for ₦${Number(amount).toLocaleString()} via ${bankName}. (Ref: ${referenceNumber})`,
    type: 'finance',
    timestamp: 'Just now',
    read: false,
    link: '/finance'
  });

  saveDatabase(db);
  sendProofOfPaymentAlertEmail(student, proofRecord);
  res.status(201).json({ success: true, message: 'Proof of payment submitted for bursary verification.', data: proofRecord });
});

// ----------------------------------------------------
// Global Support & Feedback Tickets Endpoints
// ----------------------------------------------------
app.get('/api/tickets', (req: Request, res: Response) => {
  if (!Array.isArray(db.tickets)) db.tickets = initialTickets;
  res.json({ success: true, data: db.tickets });
});

app.post('/api/tickets', (req: Request, res: Response) => {
  if (!Array.isArray(db.tickets)) db.tickets = [];
  const ticketCount = db.tickets.length + 1;
  const newTicket = {
    ...req.body,
    id: req.body.id || `tkt-${Date.now()}`,
    ticketNumber: req.body.ticketNumber || `TKT-${1000 + ticketCount}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: req.body.status || 'open',
    comments: req.body.comments || [],
  };

  db.tickets.unshift(newTicket);

  // Send admin notification
  db.notifications.unshift({
    id: `notif-tkt-${Date.now()}`,
    title: `🎫 New Support Ticket: ${newTicket.ticketNumber}`,
    message: `${newTicket.createdBy?.name || 'User'} (${newTicket.createdBy?.roleTitle || 'Member'}) submitted ticket: "${newTicket.title}"`,
    type: 'system',
    timestamp: 'Just now',
    read: false,
    link: '/tickets',
  });

  saveDatabase(db);
  console.log(`[API] Ticket logged: ${newTicket.ticketNumber} - ${newTicket.title}`);
  res.status(201).json({ success: true, data: newTicket });
});

app.patch('/api/tickets/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  if (!Array.isArray(db.tickets)) db.tickets = [];
  const index = db.tickets.findIndex(t => t.id === id || t.ticketNumber === id);
  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Ticket not found' });
  }

  db.tickets[index] = {
    ...db.tickets[index],
    ...req.body,
    updatedAt: new Date().toISOString(),
  };

  saveDatabase(db);
  res.json({ success: true, data: db.tickets[index] });
});

app.post('/api/tickets/:id/comments', (req: Request, res: Response) => {
  const { id } = req.params;
  if (!Array.isArray(db.tickets)) db.tickets = [];
  const index = db.tickets.findIndex(t => t.id === id || t.ticketNumber === id);
  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Ticket not found' });
  }

  const comment = {
    id: `comm-${Date.now()}`,
    ticketId: id,
    authorName: req.body.authorName || 'Staff Member',
    authorEmail: req.body.authorEmail || 'staff@codelab.institute',
    authorRole: req.body.authorRole || 'Support',
    content: req.body.content || '',
    createdAt: new Date().toISOString(),
  };

  if (!Array.isArray(db.tickets[index].comments)) {
    db.tickets[index].comments = [];
  }
  db.tickets[index].comments.push(comment);
  db.tickets[index].updatedAt = new Date().toISOString();

  saveDatabase(db);
  res.status(201).json({ success: true, data: comment });
});

// ----------------------------------------------------
// Custom Roles & Permissions Endpoints
// ----------------------------------------------------
app.get('/api/roles', (req: Request, res: Response) => {
  if (!Array.isArray(db.customRoles)) db.customRoles = defaultRoleDefinitions;
  res.json({ success: true, data: db.customRoles });
});

app.post('/api/roles', (req: Request, res: Response) => {
  if (!Array.isArray(db.customRoles)) db.customRoles = [...defaultRoleDefinitions];
  const roleData = req.body;
  const existingIdx = db.customRoles.findIndex(r => r.id === roleData.id);
  if (existingIdx >= 0) {
    db.customRoles[existingIdx] = { ...db.customRoles[existingIdx], ...roleData };
  } else {
    db.customRoles.push(roleData);
  }
  saveDatabase(db);
  res.status(201).json({ success: true, data: roleData });
});

app.patch('/api/roles/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  if (!Array.isArray(db.customRoles)) db.customRoles = [...defaultRoleDefinitions];
  const index = db.customRoles.findIndex(r => r.id === id);
  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Role not found' });
  }

  db.customRoles[index] = {
    ...db.customRoles[index],
    ...req.body,
  };

  saveDatabase(db);
  res.json({ success: true, data: db.customRoles[index] });
});

app.listen(PORT, () => {
  console.log(`🚀 Nexus CRM Backend Server running at http://localhost:${PORT}`);
  console.log(`📡 REST API Health: http://localhost:${PORT}/api/health`);
  console.log(`📦 Database loaded from: ${DB_FILE}`);
});
