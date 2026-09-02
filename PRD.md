# Product Requirement Document (PRD): Edu-Business Operations CRM

**Project Title**: Nexus Institute of Technology — Edu-Business Operations & CRM Suite  
**Target Market & Localization**: Nigeria (Strict Nigerian Naira `₦` Pricing, CAC RC / TIN Compliance, NIBSS Banking Settlement)  
**Design Standard**: Google Stitch "Kinetic Enterprise" System (Strict Palette, Inter/JetBrains Typography, High-Contrast Bento Layouts)  
**Version**: 3.2 (Production Enterprise: Data Backup/Restore, Transactional Email Engine, Password Setup Flows & Production Data Flush)

---

## 1. Executive Summary & Vision

The **Edu-Business Operations CRM** is a centralized full-stack enterprise web platform designed for managing accelerated technology education academies and corporate training hubs in Nigeria. The system bridges student admissions, corporate prospect lead nurturing, curriculum program configuration, student billing/invoicing, faculty mentorship scheduling, operating expense management, staff role permissions management, role-based privacy security, advanced interactive analytics, an event-driven automation engine, transactional email messaging with tokenized password setup, complete database backup/restore disaster recovery, and a production demo data flush utility.

---

## 2. Institutional Personas & Role Permissions Matrix

The system enforces strict permission separation and multi-layered data privacy across 4 institutional staff personas:

| Role | Target Persona | Accessible Routes | Write & Execution Permissions | Data Privacy & Restrictions |
| :--- | :--- | :--- | :--- | :--- |
| **`super_admin`** | **Managing Director (Abiola Adefowope)** | All routes (`/`, `/courses`, `/leads`, `/students`, `/mentors`, `/expenses`, `/settings`) | Full unrestricted access: Add/Edit curricula, recruit/edit faculty mentors, approve expenses, modify institution settings, **provision and assign staff roles**, export/restore backups, **flush demo data for production**, test transactional email dispatch. | Full visibility across all modules and financial ledgers. |
| **`admissions`** | **Head of Admissions (Folake Solanke)** | `/`, `/courses`, `/leads`, `/students` | Manage Kanban pipeline, convert leads, enroll students, view invoices, assign mentors to students, schedule cohorts. | Cannot edit curricula, recruit mentors, access `/expenses` or `/settings`. |
| **`mentor`** | **Faculty Mentor (Dr. Arthur Pendelton)** | `/mentors`, `/students` (Filtered to assigned mentees) | Log 1-on-1 coaching sessions, track personal honorarium balance in `₦`, view curriculum syllabus & learning milestones. | **STRICT PRIVACY RULES**:<br>1. **No Student Payment Visibility**: Mentors cannot view student tuition fees, balances, installment due dates, or invoices.<br>2. **Faculty Fee Confidentiality**: Mentors cannot view other mentors' hourly rates (`₦/h`) or pending honorariums.<br>3. **Co-Faculty Network**: Mentors can only view other faculty members that they share a department, course track, or student with.<br>4. **Sessions Ledger Discretion**: Mentors only see their own 1-on-1 sessions. |
| **`finance`** | **Account Officer / CFO (Adeyemi Daniels)** | `/`, `/students`, `/expenses` | Log/Approve operating expenses, manage budget allocations, process NIBSS disbursement payouts, view all students' fees & installment due dates, **dispatch automated payment reminders**, and generate official invoices. | Cannot edit curricula, recruit mentors, or modify system settings. |

---

## 3. Data Protection, Backup & Production Initialization

### 3.1. Institutional Backup & Disaster Recovery
- **1-Click Full Snapshot Export**: Generates an unencrypted, timestamped `.json` backup file containing all students, invoices, leads, operating expenses, courses, cohorts, faculty sessions, staff accounts, activity logs, and settings.
- **Backup File Restore**: Instant file picker dropzone to parse and restore any `.json` backup snapshot, automatically updating the state and backend database store.
- **Automated Server Backups**: Daily cron snapshotting to `/var/backups/` on the Hostinger VPS.

### 3.2. Production Demo Data Flush
- Dedicated Super Admin tool in Settings to purge sample leads, mock students, dummy invoices, and test expenses for a clean commercial launch.
- Safely preserves Super Admin access credentials, CAC/TIN regulatory compliance numbers, and Access Bank NUBAN settlement configurations.

---

## 4. Transactional Email & Staff Onboarding Engine

### 4.1. Transactional Email Templates & Dispatch Center
- **Interactive In-App Testing Center (`SettingsPage.tsx`)**:
  - Live HTML render preview pane.
  - Template catalog:
    1. **Staff Account Welcome & Password Setup**: Dispatches branded invitation with 1-click `/reset-password?email=...&token=...` link.
    2. **Nigerian Tuition Payment Reminder**: Formal notice with outstanding `₦` balance, installment due dates, and Access Bank NUBAN details (`0812948192`).
    3. **Official Tuition Invoice & Receipt**: Itemized billing with CAC RC `RC-1849201` and Federal TIN.
    4. **1-on-1 Mentorship Session Confirmation**: Meeting details, student pairing, and honorarium compensation in `₦`.
    5. **Security Password Reset Notice**: Tokenized 24-hour reset link.
- **Real-Time Delivery Stream**: Logs all dispatched emails with status indicators and audit timestamps.

### 4.2. Tokenized Password Setup & Reset (`/reset-password`, `/set-password`)
- Dedicated security screen ([`ResetPasswordPage.tsx`](file:///Users/abiolaadefowope/cursor%202.0/educate%20crm/src/pages/ResetPasswordPage.tsx)).
- Real-time password strength meter and confirmation matching.
- Direct redirection to login upon activation.

---

## 5. Core Functional Modules

### 5.1. Executive Financial Intelligence & Advanced Charts (`/`)
- **12-Column Bento Grid**: High-level financial visibility and operational KPIs in `₦`.
- **Interactive Recharts Visualizations**:
  1. **Tuition vs. Faculty Honorariums & Overhead (`RevenueCostChart`)**: 6-month interactive multi-bar comparison with custom tooltip in `₦` and dynamic net margin calculation.
  2. **Lead Acquisition Sources (`LeadSourceDonutChart`)**: Interactive animated donut chart with channel breakdown (Lagos FinTech Week, Corporate Referrals, LinkedIn Ads, Alumni Network, Webinars) showing lead count and pipeline value in `₦`.
  3. **Cohort Progression Area Chart**: Tracks enrollment vs 92.3% Nigerian tech job placement rate across quarterly batches.
  4. **Department Operating Profitability (`DepartmentMarginChart`)**: Horizontal comparative bar chart showing tuition revenue vs direct instructor and compute costs per department.

### 5.2. Academic Programs & Cohorts Catalog (`/courses`)
- Programs catalog with curriculum modules, Nigerian Naira tuition (`₦`), duration, and lead faculty.
- Super Admin editing and creation modals.
- Cohort launcher with capacity management.

### 5.3. Lead Pipeline & Admissions Management (`/leads`)
- Interactive 6-stage Kanban board with HTML5 drag-and-drop.
- 1-click conversion to active student with invoice generation.
- Lost reason structured modal.

### 5.4. Student Billing & Enrollment Records (`/students`)
- Prominently displays paired **Assigned Lead Faculty Mentor**.
- Strict privacy: Payment data masked for mentors; complete billing, due dates, payment reminder triggers, and official invoice generation for finance/admin.

### 5.5. Faculty Mentors & 1-on-1 Sessions Hub (`/mentors`)
- Strict Nigerian Naira rates (`₦/h`) and honorarium calculation.
- Peer confidentiality: Mentors only see co-faculty in their shared tracks and cannot see other mentors' financial rates.

### 5.6. Operating Expenses & Budget Management (`/expenses`)
- Categorized expense logging, receipt upload zone, and CFO approvals.

---

## 6. Nigerian Localization Specifications

1. **Currency**: All financial figures formatted with Nigerian Naira sign (`₦`) and local digit grouping (e.g. `₦1,245,000` or `₦2.4M`). **Zero dollar ($) symbols permitted.**
2. **Corporate & Tax Registry**: Valid CAC registration (`RC-1849201`) and TIN (`TIN-29481029-0001`).
3. **Banking Ecosystem**: NUBAN accounts (Access Bank Nigeria PLC) and NIBSS electronic transfer references.

---

## 7. Technical Architecture Summary

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Recharts.
- **Backend API**: Node.js, Express, TypeScript (`tsx`), CORS, REST endpoints.
- **Database Persistence**: File-based JSON Database (`server/data/db.json`) + LocalStorage offline sync.
- **Deployment**: Ubuntu 24.04 VPS on Hostinger (`72.61.106.87`), PM2 Daemon, Nginx Reverse Proxy, Automated GitHub Actions CI/CD.
