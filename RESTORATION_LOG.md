# 🛡️ Production Database Backup & Restoration Log

This log is strictly maintained before every deployment or production update. It provides an immutable record of data snapshots and 1-click rollback commands.

## Standard Rollback Procedure
If any issue occurs after a deployment, execute the **Rollback Command** documented in the corresponding snapshot entry below.

---
### 📦 Backup Snapshot: `db_backup_20261112074423.json`
- **Timestamp**: `2026-11-12T07:44:23.552Z`
- **Git Commit**: `3fa56eb`
- **Backup Location**: `/Users/abiolaadefowope/cursor 2.0/educate crm/server/backups/db_backup_20261112074423.json`
- **SHA-256 Checksum**: `cb96d4c1d91faf72...`
- **File Size**: `7003 KB`

| Metric | Count / Value |
| :--- | :--- |
| **Students** | `81` |
| **Mentors** | `23` |
| **Leads** | `33` |
| **Expenses** | `25` |
| **Courses & Cohorts** | `20 courses / 5 cohorts` |
| **Invoices** | `38` |
| **Support Tickets** | `56` |
| **Attendance Logs** | `51` |
| **Wallet Balance** | `₦6,640,000` |
| **DVA Account Number** | `9817707007` |

**Rollback Command**:
```bash
cp "/Users/abiolaadefowope/cursor 2.0/educate crm/server/backups/db_backup_20261112074423.json" "/Users/abiolaadefowope/cursor 2.0/educate crm/server/data/db.json" && pm2 restart nexus-crm-api
```

---
---
### 📦 Backup Snapshot: `db_backup_20261111110713.json`
- **Timestamp**: `2026-11-11T11:07:13.765Z`
- **Git Commit**: `3fa56eb`
- **Backup Location**: `/Users/abiolaadefowope/cursor 2.0/educate crm/server/backups/db_backup_20261111110713.json`
- **SHA-256 Checksum**: `5a72976d043b03c8...`
- **File Size**: `6961 KB`

| Metric | Count / Value |
| :--- | :--- |
| **Students** | `78` |
| **Mentors** | `21` |
| **Leads** | `31` |
| **Expenses** | `23` |
| **Courses & Cohorts** | `20 courses / 5 cohorts` |
| **Invoices** | `34` |
| **Support Tickets** | `54` |
| **Attendance Logs** | `51` |
| **Wallet Balance** | `₦5,810,000` |
| **DVA Account Number** | `9817707007` |

**Rollback Command**:
```bash
cp "/Users/abiolaadefowope/cursor 2.0/educate crm/server/backups/db_backup_20261111110713.json" "/Users/abiolaadefowope/cursor 2.0/educate crm/server/data/db.json" && pm2 restart nexus-crm-api
```

---
---
### 📦 Backup Snapshot: `db_backup_20261019172037.json`
- **Timestamp**: `2026-10-19T17:20:37.957Z`
- **Git Commit**: `f2ad8db`
- **Backup Location**: `/Users/abiolaadefowope/cursor 2.0/educate crm/server/backups/db_backup_20261019172037.json`
- **SHA-256 Checksum**: `02b43c6f54d04e68...`
- **File Size**: `252 KB`

| Metric | Count / Value |
| :--- | :--- |
| **Students** | `47` |
| **Mentors** | `9` |
| **Leads** | `8` |
| **Expenses** | `2` |
| **Courses & Cohorts** | `19 courses / 5 cohorts` |
| **Invoices** | `4` |
| **Support Tickets** | `10` |
| **Attendance Logs** | `20` |
| **Wallet Balance** | `₦2,100` |
| **DVA Account Number** | `9817707007` |

**Rollback Command**:
```bash
cp "/Users/abiolaadefowope/cursor 2.0/educate crm/server/backups/db_backup_20261019172037.json" "/Users/abiolaadefowope/cursor 2.0/educate crm/server/data/db.json" && pm2 restart nexus-crm-api
```

---
---
### 📦 Backup Snapshot: `db_backup_20261004145347.json`
- **Timestamp**: `2026-10-04T14:53:47.194Z`
- **Git Commit**: `121d3d1`
- **Backup Location**: `/Users/abiolaadefowope/cursor 2.0/educate crm/server/backups/db_backup_20261004145347.json`
- **SHA-256 Checksum**: `cf918b0aab6fa349...`
- **File Size**: `156 KB`

| Metric | Count / Value |
| :--- | :--- |
| **Students** | `46` |
| **Mentors** | `7` |
| **Leads** | `8` |
| **Expenses** | `2` |
| **Courses & Cohorts** | `15 courses / 5 cohorts` |
| **Invoices** | `4` |
| **Support Tickets** | `10` |
| **Attendance Logs** | `20` |
| **Wallet Balance** | `₦600` |
| **DVA Account Number** | `9817707007` |

**Rollback Command**:
```bash
cp "/Users/abiolaadefowope/cursor 2.0/educate crm/server/backups/db_backup_20261004145347.json" "/Users/abiolaadefowope/cursor 2.0/educate crm/server/data/db.json" && pm2 restart nexus-crm-api
```

---
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
