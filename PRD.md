# Product Requirement Document (PRD): Edu-Business Operations CRM

**Project Title**: Nexus Institute of Technology — Edu-Business Operations & CRM Suite  
**Target Market & Localization**: Nigeria (Strict Nigerian Naira `₦` Pricing, CAC RC / TIN Compliance, NIBSS Banking Settlement)  
**Design Standard**: Google Stitch "Kinetic Enterprise" System (Strict Palette, Inter/JetBrains Typography, High-Contrast Bento Layouts)  
**Version**: 3.0 (Full-Stack Release: Node/Express REST Backend API, Database Persistence & Cloud Sync)

---

## 1. Executive Summary & Vision

The **Edu-Business Operations CRM** is a centralized full-stack web platform designed for managing accelerated technology education academies and corporate training hubs in Nigeria. The system bridges student admissions, corporate prospect lead nurturing, curriculum program configuration, student billing/invoicing, faculty mentorship scheduling, operating expense management, staff role permissions management, role-based privacy security, advanced interactive analytics, an event-driven automation engine, and a dedicated **Node/Express REST API backend with JSON/SQLite database persistence**.

---

## 2. Institutional Personas & Role Permissions Matrix

The system enforces strict permission separation and multi-layered data privacy across 4 institutional staff personas:

| Role | Target Persona | Accessible Routes | Write & Execution Permissions | Data Privacy & Restrictions |
| :--- | :--- | :--- | :--- | :--- |
| **`super_admin`** | **Managing Director (Abiola Adefowope)** | All routes (`/`, `/courses`, `/leads`, `/students`, `/mentors`, `/expenses`, `/settings`) | Full unrestricted access: Add/Edit curricula, recruit/edit faculty mentors, approve expenses, modify institution settings, **provision and assign staff roles**, reset database. | Full visibility across all modules and financial ledgers. |
| **`admissions`** | **Head of Admissions (Folake Solanke)** | `/`, `/courses`, `/leads`, `/students` | Manage Kanban pipeline, convert leads, enroll students, view invoices, assign mentors to students, schedule cohorts. | Cannot edit curricula, recruit mentors, access `/expenses` or `/settings`. |
| **`mentor`** | **Faculty Mentor (Dr. Arthur Pendelton)** | `/mentors`, `/students` (Filtered to assigned mentees) | Log 1-on-1 coaching sessions, track personal honorarium balance in `₦`, view curriculum syllabus & learning milestones. | **STRICT PRIVACY RULES**:<br>1. **No Student Payment Visibility**: Mentors cannot view student tuition fees, balances, installment due dates, or invoices.<br>2. **Faculty Fee Confidentiality**: Mentors cannot view other mentors' hourly rates (`₦/h`) or pending honorariums.<br>3. **Co-Faculty Network**: Mentors can only view other faculty members that they share a department, course track, or student with.<br>4. **Sessions Ledger Discretion**: Mentors only see their own 1-on-1 sessions. |
| **`finance`** | **Account Officer / CFO (Adeyemi Daniels)** | `/`, `/students`, `/expenses` | Log/Approve operating expenses, manage budget allocations, process NIBSS disbursement payouts, view all students' fees & installment due dates, **dispatch automated payment reminders**, and generate official invoices. | Cannot edit curricula, recruit mentors, or modify system settings. |

---

## 3. Full-Stack Architecture & Backend Services

### 3.1. Express REST API Backend (`server/server.ts`)
- **Port**: `5001` (proxied via Vite at `/api`).
- **Persistence Store**: `server/data/db.json` with automatic seed data initialization on first boot.
- **REST Endpoints**:
  - `GET /api/health` — API health check.
  - `GET /api/bootstrap` — High-speed bootstrap payload returning all CRM entities in 1 call.
  - `GET|POST /api/leads`, `PATCH /api/leads/:id`, `POST /api/leads/:id/convert`.
  - `GET|POST /api/students`, `PATCH /api/students/:id`, `POST /api/students/:id/payment-reminder`.
  - `GET|POST /api/mentors`, `PATCH /api/mentors/:id`.
  - `GET|POST /api/expenses`, `PATCH /api/expenses/:id`.
  - `GET|POST /api/courses`, `PATCH /api/courses/:id`, `GET|POST /api/cohorts`.
  - `GET|POST /api/invoices`, `GET|POST /api/sessions`.
  - `GET|POST|PATCH /api/staff`, `GET|PUT /api/settings`.
  - `GET|PATCH|DELETE /api/notifications`.
  - `POST /api/reset` — Atomic database reset to Nigerian seed dataset.

### 3.2. Asynchronous Frontend Service Layer (`src/services/api.ts`)
- Type-safe HTTP client with optimistic UI updates.
- Automatic fallback to local offline cache if the server is unreachable, ensuring continuous zero-downtime execution.

---

## 4. Core Functional Modules

### 4.1. Executive Financial Intelligence & Advanced Charts (`/`)
- **12-Column Bento Grid**: High-level financial visibility and operational KPIs in `₦`.
- **Interactive Recharts Visualizations**:
  1. **Tuition vs. Faculty Honorariums & Overhead (`RevenueCostChart`)**: 6-month interactive multi-bar comparison with custom tooltip in `₦` and dynamic net margin calculation.
  2. **Lead Acquisition Sources (`LeadSourceDonutChart`)**: Interactive animated donut chart with channel breakdown (Lagos FinTech Week, Corporate Referrals, LinkedIn Ads, Alumni Network, Webinars) showing lead count and pipeline value in `₦`.
  3. **Cohort Retention & Job Placement Progression (`CohortProgressionAreaChart`)**: Dual-gradient smooth area chart tracking admissions vs 92.3% tech placement rate across 4 cohorts.
  4. **Department Operating Profitability (`DepartmentMarginChart`)**: Horizontal comparative bar chart showing tuition revenue vs direct instructor and compute costs per department.

### 4.2. Real-Time Automations & In-App Notification Center
- **Notification Drawer Component (`NotificationDrawer.tsx`)**:
  - Live notification bell icon on TopNavbar with real-time unread count badge.
  - Slide-over drawer with category filters (`All`, `Admissions`, `Finance`, `Mentorship`).
  - Unread indicators, relative timestamps, and 1-click deep links to relevant records.
- **Transient Floating Action Toasts (`ToastContainer.tsx`)**:
  - Bottom-right floating toasts for immediate visual feedback on key system operations.

### 4.3. Academic Programs & Cohorts Catalog (`/courses`)
- Programs catalog with curriculum modules, Nigerian Naira tuition (`₦`), duration, and lead faculty.
- Super Admin editing and creation modals.
- Cohort launcher with capacity management.

### 4.4. Lead Pipeline & Admissions Management (`/leads`)
- Interactive 6-stage Kanban board with HTML5 drag-and-drop.
- 1-click conversion to active student with invoice generation.
- Lost reason structured modal.

### 4.5. Student Billing & Enrollment Records (`/students`)
- Prominently displays paired **Assigned Lead Faculty Mentor**.
- Strict privacy: Payment data masked for mentors; complete billing, due dates, payment reminder triggers, and official invoice generation for finance/admin.

### 4.6. Faculty Mentors & 1-on-1 Sessions Hub (`/mentors`)
- Strict Nigerian Naira rates (`₦/h`) and honorarium calculation.
- Peer confidentiality: Mentors only see co-faculty in their shared tracks and cannot see other mentors' financial rates.

### 4.7. Operating Expenses & Budget Management (`/expenses`)
- Categorized expense logging, receipt upload zone, and CFO approvals.

### 4.8. Institution Settings & Staff Roles Management (`/settings`)
- Nigerian CAC/TIN compliance, Access Bank NUBAN settlement setup.
- Super Admin staff account provisioning and dynamic role reassignment.

---

## 5. Nigerian Localization Specifications

1. **Currency**: All financial figures formatted with Nigerian Naira sign (`₦`) and local digit grouping (e.g. `₦1,245,000` or `₦2.4M`). **Zero dollar ($) symbols permitted.**
2. **Corporate & Tax Registry**: Valid CAC registration (`RC-1849201`) and TIN (`TIN-29481029-0001`).
3. **Banking Ecosystem**: NUBAN accounts (Access Bank Nigeria PLC) and NIBSS electronic transfer references.

---

## 6. Technical Architecture Summary

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Recharts.
- **Backend API**: Node.js, Express, TypeScript (`tsx`), CORS, REST endpoints.
- **Database Persistence**: File-based JSON Database (`server/data/db.json`) + LocalStorage offline sync.
- **Build Status**: Clean ESM compilation with 0 TypeScript/ESLint errors.
