import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const dbFile = path.join(rootDir, 'server', 'data', 'db.json');
const logFile = path.join(rootDir, 'RESTORATION_LOG.md');

// Determine backup directory: /var/backups if exists & writable, otherwise local server/backups
let backupDir = '/var/backups';
try {
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  fs.accessSync(backupDir, fs.constants.W_OK);
} catch {
  backupDir = path.join(rootDir, 'server', 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
}

function runBackup() {
  if (!fs.existsSync(dbFile)) {
    console.error(`[BACKUP ERROR] Database file not found at: ${dbFile}`);
    process.exit(1);
  }

  const rawContent = fs.readFileSync(dbFile, 'utf8');
  let db;
  try {
    db = JSON.parse(rawContent);
  } catch (err) {
    console.error(`[BACKUP ERROR] Failed to parse db.json:`, err);
    process.exit(1);
  }

  const now = new Date();
  const timestamp = now.toISOString().replace(/[-:T]/g, '').slice(0, 14);
  const backupFileName = `db_backup_${timestamp}.json`;
  const backupPath = path.join(backupDir, backupFileName);

  // Write backup copy
  fs.writeFileSync(backupPath, rawContent, 'utf8');

  // Compute checksum
  const hash = crypto.createHash('sha256').update(rawContent).digest('hex');

  // Get current git commit if available
  let gitCommit = 'unknown';
  try {
    gitCommit = execSync('git rev-parse --short HEAD', { cwd: rootDir }).toString().trim();
  } catch {}

  // Gather entity counts
  const counts = {
    students: db.students?.length || 0,
    mentors: db.mentors?.length || 0,
    leads: db.leads?.length || 0,
    expenses: db.expenses?.length || 0,
    courses: db.courses?.length || 0,
    cohorts: db.cohorts?.length || 0,
    invoices: db.invoices?.length || 0,
    tickets: db.tickets?.length || 0,
    attendance: db.attendance?.length || 0,
    walletBalance: db.wallet?.balance ?? 0,
    dvaNuban: db.wallet?.virtualAccount?.accountNumber || 'N/A'
  };

  const logEntry = `
### 📦 Backup Snapshot: \`${backupFileName}\`
- **Timestamp**: \`${now.toISOString()}\`
- **Git Commit**: \`${gitCommit}\`
- **Backup Location**: \`${backupPath}\`
- **SHA-256 Checksum**: \`${hash.slice(0, 16)}...\`
- **File Size**: \`${Math.round(rawContent.length / 1024)} KB\`

| Metric | Count / Value |
| :--- | :--- |
| **Students** | \`${counts.students}\` |
| **Mentors** | \`${counts.mentors}\` |
| **Leads** | \`${counts.leads}\` |
| **Expenses** | \`${counts.expenses}\` |
| **Courses & Cohorts** | \`${counts.courses} courses / ${counts.cohorts} cohorts\` |
| **Invoices** | \`${counts.invoices}\` |
| **Support Tickets** | \`${counts.tickets}\` |
| **Attendance Logs** | \`${counts.attendance}\` |
| **Wallet Balance** | \`₦${counts.walletBalance.toLocaleString()}\` |
| **DVA Account Number** | \`${counts.dvaNuban}\` |

**Rollback Command**:
\`\`\`bash
cp "${backupPath}" "${dbFile}" && pm2 restart nexus-crm-api
\`\`\`

---
`;

  // Prepend or append to RESTORATION_LOG.md
  if (!fs.existsSync(logFile)) {
    const initialHeader = `# 🛡️ Production Database Backup & Restoration Log

This log is strictly maintained before every deployment or production update. It provides an immutable record of data snapshots and 1-click rollback commands.

## Standard Rollback Procedure
If any issue occurs after a deployment, execute the **Rollback Command** documented in the corresponding snapshot entry below.

---
`;
    fs.writeFileSync(logFile, initialHeader + logEntry, 'utf8');
  } else {
    // Insert new entry right after header
    const currentLog = fs.readFileSync(logFile, 'utf8');
    const splitToken = '## Standard Rollback Procedure';
    if (currentLog.includes(splitToken)) {
      const parts = currentLog.split('---');
      parts.splice(1, 0, logEntry);
      fs.writeFileSync(logFile, parts.join('---'), 'utf8');
    } else {
      fs.appendFileSync(logFile, logEntry, 'utf8');
    }
  }

  // Also mirror log in /var/backups if on server
  if (backupDir === '/var/backups') {
    try {
      fs.copyFileSync(logFile, '/var/backups/RESTORATION_LOG.md');
    } catch {}
  }

  console.log(`✓ Safety backup created: ${backupPath}`);
  console.log(`✓ Restoration log updated: ${logFile}`);
  console.log(`✓ Verified Entities: ${counts.students} students, ${counts.mentors} mentors, ${counts.leads} leads, ${counts.expenses} expenses, ₦${counts.walletBalance} wallet`);
}

runBackup();
