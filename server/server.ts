import express, { Request, Response } from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';

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
});

const loadDatabase = (): DatabaseSchema => {
  try {
    if (!fs.existsSync(DB_FILE)) {
      const initial = getInitialDatabase();
      fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf-8');
      return initial;
    }
    const data = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(data);
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
    const portalUrl = 'http://72.61.106.87/login';
    const html = `
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

    const info = await transporter.sendMail({
      from,
      to: student.email,
      subject: `🎓 Welcome to CODELAB EDUCARE LTD — Admission Confirmation (${student.studentCode || 'STU'})`,
      html,
    });

    console.log(`✅ [STUDENT ONBOARDING EMAIL DISPATCHED] To: ${student.email} | MessageId: ${info?.messageId} | isTestAccount: ${isTestAccount}`);
  } catch (err) {
    console.error(`Error dispatching student welcome email to ${student?.email}:`, err);
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
  const { email, name, roleTitle, html } = req.body;
  const token = `token-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
  const setupUrl = `http://72.61.106.87/reset-password?email=${encodeURIComponent(email)}&token=${token}`;

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
    id: `lead-${Date.now()}`,
    dateAdded: new Date().toISOString().split('T')[0],
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
  res.status(201).json({ success: true, data: newExpense });
});

app.patch('/api/expenses/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const index = db.expenses.findIndex(e => e.id === id);
  if (index === -1) return res.status(404).json({ success: false, message: 'Expense not found' });

  db.expenses[index] = { ...db.expenses[index], ...req.body };
  saveDatabase(db);
  res.json({ success: true, data: db.expenses[index] });
});

// ----------------------------------------------------
// Courses & Cohorts Endpoints
// ----------------------------------------------------
app.get('/api/courses', (req: Request, res: Response) => {
  res.json({ success: true, data: db.courses });
});

app.post('/api/courses', (req: Request, res: Response) => {
  const newCourse = {
    ...req.body,
    id: `course-${Date.now()}`,
    enrolledCount: 0,
    rating: 5.0,
  };
  db.courses.unshift(newCourse);
  saveDatabase(db);
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
  res.status(201).json({ success: true, data: newSession });
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

app.listen(PORT, () => {
  console.log(`🚀 Nexus CRM Backend Server running at http://localhost:${PORT}`);
  console.log(`📡 REST API Health: http://localhost:${PORT}/api/health`);
  console.log(`📦 Database loaded from: ${DB_FILE}`);
});
