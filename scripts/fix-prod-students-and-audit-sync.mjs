import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.resolve(__dirname, '../server/data/db.json');
const BACKUP_DIR = path.resolve(__dirname, '../server/backups');

const norm = (val) => String(val || '').trim().toLowerCase().replace(/\s+/g, ' ');

const MENTOR_ALIASES = {
  'godsmiracle ibitoye': 'men-1789126021588',
  'godsmiracle ibitayo': 'men-1789126021588',
  'damilola ajuwon': 'men-1789126200444',
  'oluwadamilola ajuwon favour': 'men-1789126200444',
  'obasesam usang': 'men-1789126765011',
  'obassesam usang': 'men-1789126765011',
  'promise oviawele': 'men-1789126100630',
  'promise': 'men-1789126100630',
  'opara light': 'men-1789126940698',
  'ayomikun kunle': 'men-1789127106622',
  'kamal aliyu': 'men-1789052796561'
};

function run() {
  if (!fs.existsSync(DB_PATH)) {
    throw new Error(`db.json not found at ${DB_PATH}`);
  }
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
  const backupPath = path.join(BACKUP_DIR, `db.pre-prod-fix-${Date.now()}.json`);
  fs.copyFileSync(DB_PATH, backupPath);

  const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
  let trimmedMentors = 0;
  for (const m of db.mentors || []) {
    const clean = String(m.name || '').trim().replace(/\s+/g, ' ');
    if (clean !== m.name) {
      m.name = clean;
      trimmedMentors++;
    }
  }

  const mentorById = new Map((db.mentors || []).map(m => [m.id, m]));
  const mentorByName = new Map((db.mentors || []).map(m => [norm(m.name), m]));

  // 1. Fix UZOKA PEACE ESOMCHUKWU 4,500,000 -> 450,000 typo
  let fixedUzoka = false;
  const uzoka = (db.students || []).find(s => s.id === 'stu-1789137560243');
  if (uzoka && (Number(uzoka.totalFees) === 4500000 || Number(uzoka.paidAmount) === 4500000)) {
    uzoka.totalFees = 450000;
    uzoka.paidAmount = 450000;
    uzoka.outstandingBalance = 0;
    uzoka.tuitionStatus = 'Paid';
    fixedUzoka = true;
  }

  // Also fix any matching invoice for UZOKA if present
  for (const inv of db.invoices || []) {
    if (inv.studentId === 'stu-1789137560243' && (Number(inv.totalAmount) === 4500000 || Number(inv.paidAmount) === 4500000)) {
      inv.totalAmount = 450000;
      inv.amount = 450000;
      inv.paidAmount = 450000;
      inv.status = 'Paid';
    }
  }

  // 2. Link & normalize mentorId / mentorName on all students
  let linkedStudents = 0;
  for (const s of db.students || []) {
    const currentNorm = norm(s.mentorName);
    let targetMentor = (s.mentorId && mentorById.get(s.mentorId)) || mentorByName.get(currentNorm);
    if (!targetMentor && MENTOR_ALIASES[currentNorm]) {
      targetMentor = mentorById.get(MENTOR_ALIASES[currentNorm]);
    }
    if (targetMentor) {
      if (s.mentorId !== targetMentor.id || s.mentorName !== targetMentor.name) {
        s.mentorId = targetMentor.id;
        s.mentorName = targetMentor.name;
        linkedStudents++;
      }
    }
  }

  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
  console.log(JSON.stringify({
    backupPath,
    trimmedMentors,
    fixedUzoka,
    linkedStudents,
    totalMentors: (db.mentors || []).length,
    totalStudents: (db.students || []).length
  }, null, 2));
}

run();
