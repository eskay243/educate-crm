# 🛡️ Production Deployment & Data Preservation Rules

This document establishes the mandatory operational protocols for Nexus CRM deployments. All agents, automated workflows, and developers must adhere strictly to these rules.

---

## 1. Local-First Development Rule
- All feature additions, schema modifications, refactors, and UI changes must be developed, tested, and verified **locally on `localhost`** first.
- Zero direct development or experimental changes on the production VPS.
- `npm run build` must succeed locally with 0 TypeScript or bundling errors before any code can be committed.

---

## 2. Mandatory Pre-Deployment Backup
- Before any code update, `git pull`, or migration runs on the production server, an immutable timestamped backup of the database (`server/data/db.json`) must be created in `/var/backups/`:
  ```bash
  /var/backups/db_backup_<YYYYMMDDHHMMSS>.json
  ```
- Backups must be verified before proceeding to pull or build.

---

## 3. Mandatory Restoration Log (`RESTORATION_LOG.md`)
- Every backup snapshot must automatically generate an entry in `RESTORATION_LOG.md` containing:
  1. Exact timestamp (ISO / UTC).
  2. Git commit SHA being deployed.
  3. SHA-256 checksum of the database snapshot.
  4. Entity inventory table (Students, Mentors, Leads, Expenses, Courses, Invoices, Tickets, Attendance, Wallet Balance).
  5. Tested **1-line Rollback Command**.

---

## 4. Protection Against Git Reset Overwrite
- `git reset --hard origin/main` replaces tracked files, including `server/data/db.json`.
- Deployment scripts (`deploy.sh`, CI/CD `.github/workflows/deploy.yml`) must preserve the production database in `/tmp/pre_deploy_production_db.json` and immediately restore it after any Git reset so live production records (students, leads, mentors, expenses) are never overwritten by git seed data.

---

## 5. Instant Rollback Procedure
If any unexpected behavior occurs after a deployment, run the documented rollback command:
```bash
cp /var/backups/db_backup_<TIMESTAMP>.json /var/www/educate-crm/server/data/db.json && pm2 restart nexus-crm-api
```
All entity counts are restored immediately with zero downtime.
