import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.resolve(__dirname, '../server/data/db.json');
const BACKUP_DIR = path.resolve(__dirname, '../server/backups');

const MISSING_MENTORS = [
  {
    id: 'men-hist-abdulgaffar',
    mentorCode: 'MEN-HIST-101',
    name: 'Abdulgaffar Mohammad',
    email: 'abdulgaffar.mohammad@codelab.institute',
    phone: '+234 800 000 0101',
    role: 'Mentor',
    position: 'Faculty Mentor — Frontend Engineering',
    department: 'Software Engineering',
    expertise: ['Basic Frontend', 'HTML/CSS', 'JavaScript'],
    courses: ['BASIC FRONTEND'],
    track: 'Basic Frontend',
    commissionRate: 0.37,
    maxCapacity: 25,
    activeMentees: 0,
    rating: 4.8,
    sessionsCount: 0,
    lecturedHours: 0,
    minimumRequiredHours: 20,
    status: 'Active',
    isActive: true,
    joinedDate: '2025-03-17',
    pendingPayout: 0,
    paidPayout: 0,
    totalEarned: 0,
    payoutStatus: 'Paid'
  },
  {
    id: 'men-hist-ummi',
    mentorCode: 'MEN-HIST-102',
    name: 'Ummi Abdulsalam',
    email: 'ummi.abdulsalam@codelab.institute',
    phone: '+234 800 000 0102',
    role: 'Mentor',
    position: 'Faculty Mentor — Project Management',
    department: 'Product & Project Management',
    expertise: ['Project Management', 'Agile', 'Scrum'],
    courses: ['PROJECT MANAGEMENT'],
    track: 'Project Management',
    commissionRate: 0.37,
    maxCapacity: 25,
    activeMentees: 0,
    rating: 4.8,
    sessionsCount: 0,
    lecturedHours: 0,
    minimumRequiredHours: 20,
    status: 'Active',
    isActive: true,
    joinedDate: '2025-03-25',
    pendingPayout: 0,
    paidPayout: 0,
    totalEarned: 0,
    payoutStatus: 'Paid'
  },
  {
    id: 'men-hist-omotoyosi',
    mentorCode: 'MEN-HIST-103',
    name: 'Omotoyosi Ogunnubi',
    email: 'omotoyosi.ogunnubi@codelab.institute',
    phone: '+234 800 000 0103',
    role: 'Mentor',
    position: 'Faculty Mentor — Digital Marketing & Design',
    department: 'Growth & Design',
    expertise: ['Digital Marketing', 'Graphic Design'],
    courses: ['DIGITAL MARKETING', 'GRAPHIC DESIGN'],
    track: 'Digital Marketing',
    commissionRate: 0.37,
    maxCapacity: 25,
    activeMentees: 0,
    rating: 4.8,
    sessionsCount: 0,
    lecturedHours: 0,
    minimumRequiredHours: 20,
    status: 'Active',
    isActive: true,
    joinedDate: '2025-04-04',
    pendingPayout: 0,
    paidPayout: 0,
    totalEarned: 0,
    payoutStatus: 'Paid'
  },
  {
    id: 'men-hist-kelechi',
    mentorCode: 'MEN-HIST-104',
    name: 'Kelechi Igwesi',
    email: 'kelechi.igwesi@codelab.institute',
    phone: '+234 800 000 0104',
    role: 'Mentor',
    position: 'Faculty Mentor — WordPress & CMS',
    department: 'Software Engineering',
    expertise: ['WordPress', 'CMS Development'],
    courses: ['WORD PRESS'],
    track: 'WordPress',
    commissionRate: 0.37,
    maxCapacity: 25,
    activeMentees: 0,
    rating: 4.8,
    sessionsCount: 0,
    lecturedHours: 0,
    minimumRequiredHours: 20,
    status: 'Active',
    isActive: true,
    joinedDate: '2025-10-06',
    pendingPayout: 0,
    paidPayout: 0,
    totalEarned: 0,
    payoutStatus: 'Paid'
  },
  {
    id: 'men-hist-ifedora',
    mentorCode: 'MEN-HIST-105',
    name: 'Ifedora Patrick',
    email: 'ifedora.patrick@codelab.institute',
    phone: '+234 800 000 0105',
    role: 'Mentor',
    position: 'Faculty Mentor — Frontend React',
    department: 'Software Engineering',
    expertise: ['Frontend React', 'TypeScript', 'React'],
    courses: ['FRONTEND REACT'],
    track: 'Frontend React',
    commissionRate: 0.37,
    maxCapacity: 25,
    activeMentees: 0,
    rating: 4.9,
    sessionsCount: 0,
    lecturedHours: 0,
    minimumRequiredHours: 20,
    status: 'Active',
    isActive: true,
    joinedDate: '2026-02-10',
    pendingPayout: 0,
    paidPayout: 0,
    totalEarned: 0,
    payoutStatus: 'Pending'
  }
];

const HISTORICAL_LEDGER_ROWS = [
  // COHORT MARCH TO JUNE 2025
  { id: 'ledger-2025c1-frontend', cohortName: 'COHORT MARCH TO JUNE 2025', courseName: 'BASIC FRONTEND', mentorName: 'Abdulgaffar Mohammad', courseStatus: 'Done', studentCount: 2, startDate: '2025-03-17', dueDate: '2025-11-06', historicalStudentPaid: 540000, agreedAmountDue: 199800, amountDisbursed: 199800, notes: 'Historical 2025 Cohort 1 settlement' },
  { id: 'ledger-2025c1-data-analysis', cohortName: 'COHORT MARCH TO JUNE 2025', courseName: 'DATA ANALYSIS', mentorName: 'Godsmiracle Ibitoye', courseStatus: 'Done', studentCount: 9, startDate: '2025-03-21', dueDate: '2025-06-24', historicalStudentPaid: 1375000, agreedAmountDue: 508750, amountDisbursed: 508750, notes: 'Historical 2025 Cohort 1 settlement' },
  { id: 'ledger-2025c1-pm', cohortName: 'COHORT MARCH TO JUNE 2025', courseName: 'PROJECT MANAGEMENT', mentorName: 'Ummi Abdulsalam', courseStatus: 'Done', studentCount: 1, startDate: '2025-03-25', dueDate: '2025-05-22', historicalStudentPaid: 150000, agreedAmountDue: 55500, amountDisbursed: 55500, notes: 'Historical 2025 Cohort 1 settlement' },
  { id: 'ledger-2025c1-dm', cohortName: 'COHORT MARCH TO JUNE 2025', courseName: 'DIGITAL MARKETING', mentorName: 'Omotoyosi Ogunnubi', courseStatus: 'Done', studentCount: 2, startDate: '2025-04-04', dueDate: '2025-06-22', historicalStudentPaid: 250000, agreedAmountDue: 92500, amountDisbursed: 92500, notes: 'Historical 2025 Cohort 1 settlement' },
  { id: 'ledger-2025c1-wp', cohortName: 'COHORT MARCH TO JUNE 2025', courseName: 'WORD PRESS', mentorName: 'Kelechi Igwesi', courseStatus: 'Done', studentCount: 1, startDate: '2025-10-06', dueDate: '2025-11-07', historicalStudentPaid: 108000, agreedAmountDue: 40000, amountDisbursed: 40000, notes: 'Rounded manual payout (+₦40 over 37% of ₦108,000)' },

  // COHORT TWO PAYMENTS
  { id: 'ledger-2025c2-frontend', cohortName: 'COHORT TWO PAYMENTS', courseName: 'BASIC FRONTEND', mentorName: 'Abdulgaffar Mohammad', courseStatus: 'Done', studentCount: 7, startDate: '2025-08-19', dueDate: '2025-11-19', historicalStudentPaid: 1260000, agreedAmountDue: 466200, amountDisbursed: 466200, notes: 'Historical Cohort 2 settlement' },
  { id: 'ledger-2025c2-data-analysis', cohortName: 'COHORT TWO PAYMENTS', courseName: 'DATA ANALYSIS', mentorName: 'Godsmiracle Ibitoye', courseStatus: 'Done', studentCount: 3, startDate: '2025-12-08', dueDate: '2025-12-11', historicalStudentPaid: 600000, agreedAmountDue: 222000, amountDisbursed: 222000, notes: 'Historical Cohort 2 settlement' },
  { id: 'ledger-2025c2-pm', cohortName: 'COHORT TWO PAYMENTS', courseName: 'PROJECT MANAGEMENT', mentorName: 'Ummi Abdulsalam', courseStatus: 'Done', studentCount: 4, startDate: '2025-08-21', dueDate: '2025-09-20', historicalStudentPaid: 210000, agreedAmountDue: 77700, amountDisbursed: 77700, notes: 'Historical Cohort 2 settlement' },
  { id: 'ledger-2025c2-dm', cohortName: 'COHORT TWO PAYMENTS', courseName: 'DIGITAL MARKETING', mentorName: 'Omotoyosi Ogunnubi', courseStatus: 'Done', studentCount: 3, startDate: '2025-08-18', dueDate: '2025-09-17', historicalStudentPaid: 150000, agreedAmountDue: 55500, amountDisbursed: 55500, notes: 'Historical Cohort 2 settlement' },
  { id: 'ledger-2025c2-uiux', cohortName: 'COHORT TWO PAYMENTS', courseName: 'UI/UX', mentorName: 'Damilola Ajuwon', courseStatus: 'Done', studentCount: 2, startDate: '2025-08-21', dueDate: '2025-09-20', historicalStudentPaid: 120000, agreedAmountDue: 44400, amountDisbursed: 44400, notes: 'Historical Cohort 2 settlement' },
  { id: 'ledger-2025c2-python', cohortName: 'COHORT TWO PAYMENTS', courseName: 'PYTHON', mentorName: 'Godsmiracle Ibitoye', courseStatus: 'In progress', studentCount: 1, startDate: '2025-08-15', dueDate: '2025-09-13', historicalStudentPaid: 300000, agreedAmountDue: 111000, amountDisbursed: 111000, notes: 'Historical Cohort 2 settlement' },
  { id: 'ledger-2025c2-ds', cohortName: 'COHORT TWO PAYMENTS', courseName: 'DATA SCIENCE', mentorName: 'Godsmiracle Ibitoye', courseStatus: 'In progress', studentCount: 2, startDate: '2025-12-08', dueDate: '2026-08-02', historicalStudentPaid: 900000, agreedAmountDue: 333000, amountDisbursed: 17000, notes: 'Partial historical disbursement; ₦316,000 remaining' },
  { id: 'ledger-2025c2-gd', cohortName: 'COHORT TWO PAYMENTS', courseName: 'GRAPHIC DESIGN', mentorName: 'Omotoyosi Ogunnubi', courseStatus: 'Done', studentCount: 2, startDate: '2025-07-31', dueDate: '2025-09-17', historicalStudentPaid: 110000, agreedAmountDue: 40700, amountDisbursed: 40700, notes: 'Historical Cohort 2 settlement' },

  // MENTORS PAYMENT FOR 2026
  { id: 'ledger-2026-uiux', cohortName: 'MENTORS PAYMENT FOR 2026', courseName: 'UI/UX', mentorName: 'Damilola Ajuwon', courseStatus: 'In progress', studentCount: 2, startDate: '2026-10-02', dueDate: '2026-04-30', historicalStudentPaid: 370000, agreedAmountDue: 136900, amountDisbursed: 40000, notes: 'Partial disbursement; ₦96,900 remaining' },
  { id: 'ledger-2026-da', cohortName: 'MENTORS PAYMENT FOR 2026', courseName: 'DATA ANALYSIS', mentorName: 'Godsmiracle Ibitoye', courseStatus: 'Done', studentCount: 2, startDate: '2026-05-01', dueDate: '2026-03-27', historicalStudentPaid: 370000, agreedAmountDue: 136900, amountDisbursed: 136900, notes: '2026 Cohort settlement' },
  { id: 'ledger-2026-frontend', cohortName: 'MENTORS PAYMENT FOR 2026', courseName: 'BASIC FRONTEND', mentorName: 'Abdulgaffar Mohammad', courseStatus: 'Done', studentCount: 4, startDate: '2026-05-01', dueDate: '2026-04-30', historicalStudentPaid: 950000, agreedAmountDue: 351500, amountDisbursed: 351500, notes: '2026 Cohort settlement' },
  { id: 'ledger-2026-dm', cohortName: 'MENTORS PAYMENT FOR 2026', courseName: 'DIGITAL MARKETING', mentorName: 'Omotoyosi Ogunnubi', courseStatus: 'Done', studentCount: 2, startDate: '2026-05-01', dueDate: '', historicalStudentPaid: 90000, agreedAmountDue: 33300, amountDisbursed: 33300, notes: 'Mentor was blank in spreadsheet; assigned to Omotoyosi Ogunnubi (37% of ₦90,000 = ₦33,300, Completed)' },
  { id: 'ledger-2026-react', cohortName: 'MENTORS PAYMENT FOR 2026', courseName: 'FRONTEND REACT', mentorName: 'Ifedora Patrick', courseStatus: 'In progress', studentCount: 3, startDate: '2026-10-02', dueDate: '2026-04-30', historicalStudentPaid: 420000, agreedAmountDue: 155800, amountDisbursed: 150000, notes: 'Spreadsheet listed Completed/0 outstanding; ₦5,800 variance flagged for review' },
  { id: 'ledger-2026-cyber', cohortName: 'MENTORS PAYMENT FOR 2026', courseName: 'CYBERSECURITY', mentorName: 'Obasesam Usang', courseStatus: 'In progress', studentCount: 3, startDate: '2026-11-05', dueDate: '2026-11-08', historicalStudentPaid: 750000, agreedAmountDue: 277500, amountDisbursed: 75000, notes: 'Spreadsheet listed ₦202,000 outstanding; dynamic balance = ₦202,500' },
  { id: 'ledger-2026-promise-fe', cohortName: 'MENTORS PAYMENT FOR 2026', courseName: 'BASIC FRONTEND', mentorName: 'Promise Oviawele', courseStatus: 'In progress', studentCount: 5, startDate: '2026-10-07', dueDate: '2026-10-11', historicalStudentPaid: 920000, agreedAmountDue: 310000, amountDisbursed: 150000, notes: 'Agreed due ₦310,000 vs 37% (₦340,400); -₦30,400 variance' },
  { id: 'ledger-2026-python', cohortName: 'MENTORS PAYMENT FOR 2026', courseName: 'PYTHON', mentorName: 'Godsmiracle Ibitoye', courseStatus: 'In progress', studentCount: 2, startDate: '2026-10-03', dueDate: '2026-10-15', historicalStudentPaid: 200000, agreedAmountDue: 74000, amountDisbursed: 0, notes: 'Pending disbursement (₦74,000)' },

  // COHORT SEPTEMBER 2026
  { id: 'ledger-2026sep-da', cohortName: 'COHORT SEPTEMBER 2026', courseName: 'DATA ANALYSIS', mentorName: 'Godsmiracle Ibitoye', courseStatus: 'In progress', studentCount: 2, startDate: '2026-04-09', dueDate: '2026-01-15', historicalStudentPaid: 370000, agreedAmountDue: 136900, amountDisbursed: 0, notes: 'Pending disbursement (₦136,900)' },
  { id: 'ledger-2026sep-fe', cohortName: 'COHORT SEPTEMBER 2026', courseName: 'BASIC FRONTEND', mentorName: 'Promise Oviawele', courseStatus: 'In progress', studentCount: 1, startDate: '2026-12-11', dueDate: '2026-12-03', historicalStudentPaid: 250000, agreedAmountDue: 92500, amountDisbursed: 0, notes: 'Pending disbursement (₦92,500)' }
];

function normalizeName(name) {
  return String(name || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function run() {
  if (!fs.existsSync(DB_PATH)) {
    throw new Error(`db.json not found at ${DB_PATH}`);
  }

  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
  const backupPath = path.join(BACKUP_DIR, `db.pre-mentor-seed-${Date.now()}.json`);
  fs.copyFileSync(DB_PATH, backupPath);

  const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
  if (!Array.isArray(db.mentors)) db.mentors = [];
  if (!Array.isArray(db.students)) db.students = [];
  if (!Array.isArray(db.payoutRequests)) db.payoutRequests = [];
  if (!Array.isArray(db.expenses)) db.expenses = [];
  if (!Array.isArray(db.mentorCohortLedgers)) db.mentorCohortLedgers = [];

  // 1. Add missing historical mentors idempotently
  let addedMentors = 0;
  for (const m of MISSING_MENTORS) {
    const exists = db.mentors.find(
      existing => existing.id === m.id || normalizeName(existing.name) === normalizeName(m.name)
    );
    if (!exists) {
      db.mentors.push({ ...m });
      addedMentors++;
    }
  }

  // Build mentor lookup by normalized name
  const mentorByName = new Map();
  for (const m of db.mentors) {
    mentorByName.set(normalizeName(m.name), m);
  }

  // 2. Normalize known student mentorName typos (e.g. Obassesam Usang -> Obasesam Usang)
  let fixedStudents = 0;
  const obasesam = mentorByName.get('obasesam usang');
  const promise = mentorByName.get('promise oviawele');
  for (const s of db.students) {
    const norm = normalizeName(s.mentorName);
    if (norm === 'obassesam usang' && obasesam) {
      s.mentorName = obasesam.name;
      s.mentorId = obasesam.id;
      fixedStudents++;
    } else if (norm === 'promise' && promise) {
      s.mentorName = promise.name;
      s.mentorId = promise.id;
      fixedStudents++;
    }
  }

  // 3. Upsert mentorCohortLedgers & historical payoutRequests / expenses idempotently
  const nowIso = new Date().toISOString();
  let upsertedLedgers = 0;
  let createdPayouts = 0;
  let createdExpenses = 0;

  for (const row of HISTORICAL_LEDGER_ROWS) {
    const mentor = mentorByName.get(normalizeName(row.mentorName));
    if (!mentor) {
      throw new Error(`Mentor not found for row ${row.id}: ${row.mentorName}`);
    }

    const existingLedger = db.mentorCohortLedgers.find(l => l.id === row.id);
    if (!existingLedger) {
      db.mentorCohortLedgers.push({
        id: row.id,
        cohortName: row.cohortName,
        courseName: row.courseName,
        mentorId: mentor.id,
        mentorName: mentor.name,
        courseStatus: row.courseStatus,
        studentCount: row.studentCount,
        startDate: row.startDate,
        dueDate: row.dueDate,
        historicalStudentPaid: row.historicalStudentPaid,
        agreedAmountDue: row.agreedAmountDue,
        commissionRate: 0.37,
        amountDisbursed: row.amountDisbursed,
        isHistoricalSeed: true,
        notes: row.notes,
        updatedAt: nowIso
      });
      upsertedLedgers++;
    }

    if (row.amountDisbursed > 0) {
      const payoutId = `req-hist-${row.id}`;
      const expenseId = `exp-hist-${row.id}`;
      const voucherNo = `VCH-HIST-${row.id.replace('ledger-', '').toUpperCase()}`;
      const disburseDate = row.dueDate || row.startDate || '2025-12-31';

      if (!db.payoutRequests.some(r => r.id === payoutId)) {
        db.payoutRequests.push({
          id: payoutId,
          mentorId: mentor.id,
          mentorName: mentor.name,
          mentorEmail: mentor.email,
          amount: row.amountDisbursed,
          lecturedHours: mentor.lecturedHours || 20,
          minimumRequiredHours: mentor.minimumRequiredHours || 20,
          bankName: mentor.bankName || 'Historical Manual Transfer',
          accountNumber: mentor.accountNumber || 'N/A',
          accountName: mentor.accountName || mentor.name,
          bankCode: mentor.bankCode || '',
          status: 'Disbursed',
          netDisbursedAmount: row.amountDisbursed,
          voucherNumber: voucherNo,
          requestedAt: disburseDate,
          reviewedAt: disburseDate,
          reviewedBy: 'Historical Migration',
          disbursedAt: disburseDate,
          disburseReference: `HIST-MAN-${row.id.replace('ledger-', '').toUpperCase()}`,
          notes: `${row.cohortName} — ${row.courseName}: ${row.notes}`,
          expenseId,
          isHistorical: true,
          cohortLedgerId: row.id,
          paymentMethod: 'manual_bank'
        });
        createdPayouts++;
      }

      if (!db.expenses.some(e => e.id === expenseId)) {
        db.expenses.push({
          id: expenseId,
          expenseCode: voucherNo,
          title: `Historical Mentor Payout: ${mentor.name} (${row.courseName})`,
          category: 'Faculty & Mentor Payouts',
          amount: row.amountDisbursed,
          date: disburseDate,
          createdAt: disburseDate,
          department: 'Academic Faculty',
          paymentMethod: 'Manual Bank Transfer (Historical)',
          status: 'Paid',
          vendor: mentor.name,
          requestedBy: 'Historical Migration',
          description: `${row.cohortName} • ${row.courseName} • ${row.studentCount} students`,
          disbursedAt: disburseDate,
          transferReference: `HIST-MAN-${row.id.replace('ledger-', '').toUpperCase()}`,
          mentorId: mentor.id,
          mentorName: mentor.name,
          payoutRequestId: payoutId,
          voucherNumber: voucherNo,
          isHistorical: true,
          walletDeducted: false
        });
        createdExpenses++;
      }
    }
  }

  // 4. Recalculate mentor totals from mentorCohortLedgers + any non-historical payouts
  for (const mentor of db.mentors) {
    const ledgers = db.mentorCohortLedgers.filter(l => l.mentorId === mentor.id);
    if (ledgers.length === 0) continue;

    const ledgerEarned = ledgers.reduce((sum, l) => sum + Number(l.agreedAmountDue || 0), 0);
    const ledgerDisbursed = ledgers.reduce((sum, l) => sum + Number(l.amountDisbursed || 0), 0);

    // Include any non-historical disbursed payouts not tied to a ledger
    const extraDisbursed = db.payoutRequests
      .filter(r => r.mentorId === mentor.id && r.status === 'Disbursed' && !r.isHistorical && !r.cohortLedgerId)
      .reduce((sum, r) => sum + Number(r.amount || 0), 0);

    const totalEarned = ledgerEarned;
    const paidPayout = ledgerDisbursed + extraDisbursed;
    const pendingPayout = Math.max(0, totalEarned - paidPayout);

    mentor.totalEarned = totalEarned;
    mentor.paidPayout = paidPayout;
    mentor.pendingPayout = pendingPayout;
    mentor.payoutStatus = pendingPayout === 0 ? 'Paid' : paidPayout > 0 ? 'Partial' : 'Pending';
  }

  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));

  console.log(JSON.stringify({
    backupPath,
    addedMentors,
    fixedStudents,
    upsertedLedgers,
    createdPayouts,
    createdExpenses,
    totalMentors: db.mentors.length,
    totalLedgers: db.mentorCohortLedgers.length
  }, null, 2));
}

run();
