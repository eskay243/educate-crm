# 🛡️ Production Database Backup & Restoration Log

This log is strictly maintained before every deployment or production update. It provides an immutable record of data snapshots and 1-click rollback commands.

## Standard Rollback Procedure
If any issue occurs after a deployment, execute the **Rollback Command** documented in the corresponding snapshot entry below.

---
### 📦 Backup Snapshot: `db_backup_20260927171410.json`
- **Timestamp**: `2026-09-27T17:14:10.608Z`
- **Git Commit**: `09a9354`
- **Backup Location**: `/Users/abiolaadefowope/cursor 2.0/educate crm/server/backups/db_backup_20260927171410.json`
- **SHA-256 Checksum**: `cba12c04c3d0aa1f...`
- **File Size**: `132 KB`

| Metric | Count / Value |
| :--- | :--- |
| **Students** | `46` |
| **Mentors** | `7` |
| **Leads** | `8` |
| **Expenses** | `2` |
| **Courses & Cohorts** | `15 courses / 5 cohorts` |
| **Invoices** | `4` |
| **Support Tickets** | `9` |
| **Attendance Logs** | `20` |
| **Wallet Balance** | `₦200` |
| **DVA Account Number** | `9817707007` |

**Rollback Command**:
```bash
cp "/Users/abiolaadefowope/cursor 2.0/educate crm/server/backups/db_backup_20260927171410.json" "/Users/abiolaadefowope/cursor 2.0/educate crm/server/data/db.json" && pm2 restart nexus-crm-api
```

---
---

### 📦 Backup Snapshot: `db_backup_20260927170156.json`
- **Timestamp**: `2026-09-27T17:01:56.367Z`
- **Git Commit**: `18cc21e`
- **Backup Location**: `/Users/abiolaadefowope/cursor 2.0/educate crm/server/backups/db_backup_20260927170156.json`
- **SHA-256 Checksum**: `cba12c04c3d0aa1f...`
- **File Size**: `132 KB`

| Metric | Count / Value |
| :--- | :--- |
| **Students** | `46` |
| **Mentors** | `7` |
| **Leads** | `8` |
| **Expenses** | `2` |
| **Courses & Cohorts** | `15 courses / 5 cohorts` |
| **Invoices** | `4` |
| **Support Tickets** | `9` |
| **Attendance Logs** | `20` |
| **Wallet Balance** | `₦200` |
| **DVA Account Number** | `9817707007` |

**Rollback Command**:
```bash
cp "/Users/abiolaadefowope/cursor 2.0/educate crm/server/backups/db_backup_20260927170156.json" "/Users/abiolaadefowope/cursor 2.0/educate crm/server/data/db.json" && pm2 restart nexus-crm-api
```

---
