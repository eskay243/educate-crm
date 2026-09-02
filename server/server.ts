import express, { Request, Response } from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5001;
const DB_FILE = path.join(__dirname, 'data', 'db.json');

app.use(cors());
app.use(express.json());

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

// ----------------------------------------------------
// Health & Bootstrap Endpoints
// ----------------------------------------------------
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'healthy', version: '2.6', timestamp: new Date().toISOString() });
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

app.listen(PORT, () => {
  console.log(`🚀 Nexus CRM Backend Server running at http://localhost:${PORT}`);
  console.log(`📡 REST API Health: http://localhost:${PORT}/api/health`);
  console.log(`📦 Database loaded from: ${DB_FILE}`);
});
