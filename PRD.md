# Product Requirement Document (PRD): Edu-Business Operations CRM

**Project Title**: Nexus Institute of Technology — Edu-Business Operations & CRM Suite  
**Institution**: CODELAB EDUCARE LTD (RC-1849201 • TIN-29481029-0001)  
**Target Market & Localization**: Nigeria (Strict Nigerian Naira `₦` Pricing, CAC RC / TIN Compliance, NIBSS Banking Settlement, Paystack Integration)  
**Design Standard**: Google Stitch "Kinetic Enterprise" System (Strict Palette, Inter/JetBrains Typography, Bento Layouts, Glass Panels)  
**Version**: 4.2 (Mobile-First PWA, Role-Specific Invitation & Authentication Architecture, Student Performance & Welfare Reporting, 37% Mentor Commission Engine, & Platform-Wide Transactional Email Engine)  
**Last Updated**: September 2026

---

## 1. Executive Summary & Vision

The **Edu-Business Operations CRM** is a unified, full-stack enterprise web application and mobile-first Progressive Web App (PWA) engineered specifically for accelerated technology institutes and corporate training hubs in Nigeria. The platform combines:
1. **Admissions & Lead Conversion Pipeline**: Kanban sales funnel tracking leads through enrollment with automated welcome packs and matriculation credential generation.
2. **Student Learning Management System (LMS)**: Dedicated student portal with syllabus tracking, lab assignment deliverable submissions (GitHub repo & live deployment URLs), and mentor evaluation.
3. **Faculty Mentorship & Automated 37% Revenue Share**: Mentor recruitment, 1-on-1 coaching logs, and automated 37% commission calculation per enrolled student tuition payment.
4. **Paystack Inbound Collections & Outbound NUBAN Disbursements**: Card, USSD, and Bank Transfer tuition collection, automated NUBAN account validation across 28+ Nigerian commercial banks, and direct Paystack honorarium payouts.
5. **OpEx Requisitions & Financial Auditing**: Multi-level expense submission, receipt attachments, urgency flagging, and Super Admin / Finance approval workflows.
6. **Geofenced Hybrid Staff Attendance**: GPS-verified clock-in/out against Lagos campus hubs (Yaba Innovation Campus & Victoria Island Financial District) with configurable geofence radii.
7. **Platform-Wide Transactional Email Engine**: 17 automated HTML notification workflows powered by Zoho SMTP (`smtp.zoho.com`), complete with real-time in-app customizer and dispatcher.
8. **Student Performance Meter & Welfare Reporting**: Mentor performance evaluation reports sent directly to Head of Admissions & Super Admin, coupled with a real-time student performance gauge.
9. **Mobile-First Progressive Web App (PWA)**: Standalone mobile experience with service worker offline caching, ergonomic bottom navigation, and official Codelab branding.
10. **Role-Specific Invitation & Authentication Architecture**: Role-parameterized onboarding links (`/login?role=...&email=...`), zero credential exposure, and auto-detecting institutional login portal.

---

## 2. Institutional Personas & Role Permissions Matrix

The system enforces strict permission separation and multi-layered data privacy across **5 institutional personas**:

| Role | Target Persona | Accessible Routes | Write & Execution Permissions | Data Privacy & Restrictions |
| :--- | :--- | :--- | :--- | :--- |
| **`super_admin`** | **Managing Director (Abiola Adefowope)** | All routes (`/`, `/courses`, `/leads`, `/students`, `/mentors`, `/expenses`, `/settings`) | Full unrestricted access: Add/Edit curricula, recruit/edit faculty mentors, approve/reject expenses, modify institution settings & SMTP, provision and assign staff roles, export/restore backups, flush demo data, disburse mentor payouts. | Full visibility across all modules, ledgers, and audit trails. |
| **`admissions`** | **Head of Admissions (Folake Solanke)** | `/`, `/courses`, `/leads`, `/students` | Manage Kanban pipeline, convert leads, enroll students, generate invoices, assign faculty mentors to students, schedule cohorts. | Cannot edit curricula, recruit mentors, access `/expenses`, or modify `/settings`. |
| **`mentor`** | **Faculty Mentor (Dr. Arthur Pendelton)** | `/mentors`, `/courses`, `/students` (Filtered to assigned mentees) | Review and grade student lab deliverables, schedule 1-on-1 coaching sessions, track 37% commission ledger in `₦`, view assigned cohort progress. | **STRICT PRIVACY RULES**:<br>1. **No Student Payment Visibility**: Mentors cannot view student tuition fees, balances, installment due dates, or invoices.<br>2. **Faculty Confidentiality**: Mentors cannot view other mentors' banking details, earnings, or commission ledgers.<br>3. **Co-Faculty Network**: Mentors can only view peers sharing their department or assigned course tracks.<br>4. **Sessions Ledger Discretion**: Mentors only see their own 1-on-1 sessions. |
| **`finance`** | **Bursary / CFO (Adeyemi Daniels)** | `/`, `/students`, `/expenses`, `/settings` | Review/approve operating expenses, disburse mentor payouts via Paystack/NIBSS, verify manual bank transfer Proof of Payment (POP), dispatch tuition payment reminders, manage budgets. | Cannot edit curricula, recruit mentors, or modify system user credentials. |
| **`student`** | **Enrolled Scholar (Chidi Okeke)** | `/student/dashboard`, `/student/courses`, `/student/mentor`, `/student/billing` | Track course progress, mark lessons completed, submit lab project repos & live demo links, view mentor evaluations, book 1-on-1 coaching sessions, pay tuition via Paystack, submit offline transfer slips. | Strictly restricted to personal student record, enrolled track curriculum, assigned mentor, and personal tuition invoice ledger. |

---

## 3. Core Functional Modules

### 3.1. Executive Intelligence & Analytics Dashboard (`/`)
- **12-Column High-Contrast Bento Grid**: Real-time revenue, active student enrollment, mentor commission payouts, operating expenses, and net profit margins in `₦`.
- **Interactive Recharts Visualizations**:
  - *Tuition vs. Overhead Chart*: 6-month comparative bar series tracking tuition revenue against faculty commissions and OpEx.
  - *Lead Acquisition Donut*: Channel breakdown (FinTech Week, Corporate Referrals, LinkedIn, Alumni Network, Webinars) with lead count and pipeline value.
  - *Cohort Progression & Placement*: Enrollment tracking against a 92.3% Nigerian tech job placement rate.
  - *Department Operating Profitability*: Comparative margins across Technology, Product Design, Data Science, and Cybersecurity.

### 3.2. Classroom LMS & Student Operations Portal (`/student/*`)
- **Student Dashboard (`/student/dashboard`)**:
  - Academic progress ring and syllabus completion percentage.
  - Financial summary showing tuition cleared vs outstanding balance in `₦`.
  - Next scheduled 1-on-1 mentorship session and quick action links.
- **Curriculum & Lab Assignments (`/student/courses`)**:
  - Expandable syllabus tree with modular lessons and status badges (*Completed*, *In Progress*, *Upcoming*).
  - **Lab Submission Modal**: Student inputs task title, module, GitHub repository URL, live deployed demo URL, and notes.
  - Evaluation feedback card displaying score %, status (*Passed*, *Needs Revision*, *Exceptional*), and faculty mentor remarks.
- **1-on-1 Mentorship Coaching Hub (`/student/mentor`)**:
  - Assigned mentor profile card with credentials, specialized department, and contact options.
  - Coaching session scheduler: Date, time slot, agenda topic, and Google Meet / Victoria Island Lab location.
  - History of completed and upcoming coaching sessions.
- **Tuition & Digital Billing Ledger (`/student/billing`)**:
  - Official invoice breakdown with itemized fees.
  - **Paystack Live Checkout**: 1-click modal to pay full tuition or custom installments via Mastercard, Visa, Verve, USSD, or Bank Transfer.
  - **Offline Proof of Payment (POP) Uploader**: File upload for NIBSS transfer slips with bank name and reference input.

### 3.3. Paystack Financial Gateway & 37% Faculty Revenue Share
- **Inbound Tuition Collections**:
  - Secure Paystack Pop checkout initializing transactions via `POST /api/paystack/initialize`.
  - Server-side verification via `GET /api/paystack/verify/:reference` with cryptographic signature verification.
  - Immediate ledger reconciliation: Marks student tuition status (*Paid* / *Partial*), updates invoice, and auto-accrues **37% commission** to the assigned mentor's pending payout ledger.
- **Faculty Mentor Outbound Disbursements**:
  - NUBAN bank account verification via `POST /api/banks/verify-account` supporting 28+ Nigerian commercial banks (Access, GTBank, Zenith, First Bank, UBA, Kuda, Moniepoint, OPay, etc.) using official bank sort codes.
  - Algorithmic NUBAN checksum validation.
  - Paystack Transfer Recipient creation and direct bank payout via `POST /api/paystack/disburse-mentor`.
  - Instant deduction from mentor's pending payout and creation of an official credit advice.

### 3.4. OpEx Requisitions & Expense Approvals (`/expenses`)
- **Structured Requisition Logging**:
  - Categorized expenses (Office & Ops, Software, Facilities, Equipment, Marketing, Payroll).
  - Urgency level flagging (*Standard*, *Urgent*, *Emergency*).
  - Attachment of proforma invoices and receipt slips.
  - Captures authenticated requester's identity and email (`requesterEmail`).
- **Authorization Workflow**:
  - Immediate dispatch of `expense_approval_request` email to Super Admin and Finance.
  - Super Admin / Finance 1-click approval or rejection with structured rejection reasons.
  - Automated dispatch of `expense_approved` or `expense_rejected` notification to staff requester.

### 3.5. Staff Attendance & Geofenced Hybrid Time Tracking
- **Geofenced Clock-In / Clock-Out**:
  - Browser Geolocation API integration capturing latitude, longitude, and accuracy.
  - Haversine distance verification against configured campus hubs (e.g. Plot 14, Victoria Island, Lagos: 6.4281° N, 3.4219° E, 250m radius).
  - Work modes: *Hybrid On-Site* (geofenced), *Remote*, *Field Duty*.
  - Automatic punctuality classification (*On-Time*, *Grace Period*, *Late*) based on institutional work policy (e.g. 09:00 with 15-min grace).
  - Daily tasks focus and shift deliverable summary capture upon clock-out.

### 3.6. Admissions Lead Pipeline (`/leads`)
- 6-stage Kanban board (*New Inquiry*, *Screening*, *Interview*, *Offer Sent*, *Enrolled*, *Lost*).
- Drag-and-drop status progression.
- 1-click conversion to active student with course and mentor assignment, generating invoice and matriculation credentials.

### 3.7. Faculty Recruitment & Mentorship Management (`/mentors`)
- Faculty directory with specialized departments, assigned courses, active mentee counts, and session compensation records.
- Account verification badge and payout disbursement button.
- Recruit Mentor modal capturing Nigerian banking settlement details.

---

## 4. Platform-Wide Automated Transactional Email Architecture

Powered by Nodemailer with live Zoho SMTP (`smtp.zoho.com`) delivery, responsive HTML templates, corporate branding (CODELAB EDUCARE LTD, RC-1849201, TIN-29481029-0001), and sandbox fallbacks.

### Complete Email Trigger & Recipient Matrix:

| # | Trigger Event | Target Recipient(s) | Email Type Key | Key Content & Call to Action |
| :-: | :--- | :--- | :--- | :--- |
| **1** | Staff logs new OpEx requisition | Approvers (`super_admin`, `finance`) | `expense_approval_request` | Code, title, amount (₦), category, department, requester, urgency badge, receipt, 1-click authorization link. |
| **2** | Approver authorizes requisition | Staff Requester (`requesterEmail`) | `expense_approved` | Requisition title, authorized amount (₦), approver name, date, fund release notice. |
| **3** | Approver declines requisition | Staff Requester (`requesterEmail`) | `expense_rejected` | Expense code, amount, reviewer name, detailed rejection remarks, link to amend and resubmit. |
| **4** | Student completes tuition payment | Student (`student.email`) | `invoice_receipt` | Official digital receipt, matric ID, amount paid (₦), balance, Paystack reference. |
| **5** | Tuition payment verified | Assigned Mentor (`mentor.email`) | `mentor_commission_earned` | Mentee name, track, tuition paid, **37% commission accrued (₦)**, new pending payout ledger. |
| **6** | Inbound tuition settled | Finance & Super Admin | `tuition_payment_alert` | Student name, matric ID, amount paid (₦), Paystack reference, financial audit record. |
| **7** | Offline bank transfer proof submitted | Finance & Super Admin | `proof_of_payment_alert` | Student name, claimed amount (₦), bank name, transfer reference, attached receipt slip. |
| **8** | Honorarium/commission disbursed | Faculty Mentor (`mentor.email`) | `mentor_payout_disbursed` | Formal credit advice, payout amount (₦), destination bank & NUBAN, transfer reference, date. |
| **9** | Student enrolled / lead converted | Student (`student.email`) | `student_welcome` | Welcome note, matric ID, course track, cohort batch, portal login instructions. |
| **10** | Student enrolled with assigned mentor | Assigned Mentor (`mentor.email`) | `new_mentee_assigned` | Student name, matric ID, track, contact details, cohort kickoff advice. |
| **11** | Faculty mentor recruited | Faculty Mentor (`mentor.email`) | `mentor_welcome` | Faculty code, department, 37% revenue share agreement terms, portal login link. |
| **12** | Staff account provisioned | Staff Member (`staff.email`) | `staff_welcome` | Role title, department, tokenized password setup link (`/reset-password`). |
| **13** | Password reset requested | Staff/User (`user.email`) | `password_reset` | Security notice, tokenized 24-hour reset link. |
| **14** | Payment reminder triggered | Student (`student.email`) | `payment_reminder` | Formal bursary notice, outstanding balance (₦), due date, official Access Bank NUBAN. |
| **15** | Student submits lab assignment | Assigned Mentor (`mentor.email`) | `lab_assignment_submitted` | Student name, task title, GitHub repo link, live demo deployment URL, notes, grading CTA. |
| **16** | Mentor grades lab assignment | Student (`student.email`) | `lab_assignment_graded` | Task title, evaluation status (*Passed*/*Needs Revision*), score %, mentor feedback remarks. |
| **17** | 1-on-1 coaching session booked | Mentor & Student | `session_confirmation` | Mentorship pairing, topic, date, time, duration, Google Meet / Lagos Lab location. |

### Settings Customizer & Live Dispatcher (`/settings`)
- Interactive 17-button selector grid with category icons and active status pills.
- Live HTML rendering preview reflecting dynamic inputs in real time.
- Direct test dispatching button with live delivery status indicator.
- Custom template override saving and reset to defaults.

---

## 5. Nigerian Compliance & Localization Specs

1. **Currency**: Strict formatting with Nigerian Naira symbol (`₦`) and local comma separation (e.g. `₦850,000` or `₦2.4M`). **Zero dollar ($) signs permitted in customer-facing flows.**
2. **Corporate & Tax Identity**: Valid CAC registration (`RC-1849201`) and Federal Inland Revenue Service TIN (`TIN-29481029-0001`).
3. **Banking Infrastructure**:
   - Access Bank Nigeria PLC (Account: `0812948192`, Name: `CODELAB EDUCARE LTD`).
   - NUBAN 10-digit validation algorithm across 28+ Nigerian commercial banks.
   - Paystack payment gateway (Mastercard, Visa, Verve, USSD, Bank Transfer, Direct NUBAN Disbursements).

---

## 6. Technical Stack & Infrastructure

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Recharts, Material Symbols, Lucide React.
- **Backend API**: Node.js, Express, TypeScript (`tsx`), CORS, Nodemailer, Crypto HMAC.
- **Database Persistence**: File-based JSON store (`server/data/db.json`) + LocalStorage browser synchronization.
- **Hosting**: Hostinger Ubuntu 24.04 VPS (`72.61.106.87`), PM2 Process Manager, Nginx Reverse Proxy, SSL via Let's Encrypt.

---

## 7. Current Implementation Status vs. What's Left

### ✅ Completed Features (100% Verified):
- [x] Full Lead Kanban Pipeline with 6 stages and 1-click student conversion.
- [x] Academic Program & Cohort Manager with syllabus breakdown and tuition fees in `₦`.
- [x] Student Management Module with mentor pairing and financial tracking.
- [x] Faculty Mentors Hub with Nigerian NUBAN banking details and 1-on-1 session logger.
- [x] OpEx Requisition Module with receipt attachments, urgency flagging, and approval/rejection workflows.
- [x] Executive Dashboard Bento Grid with 4 interactive Recharts charts.
- [x] Student Persona & Dedicated LMS Portal (`/student/dashboard`, `/student/courses`, `/student/mentor`, `/student/billing`).
- [x] Lab Assignment Submission with GitHub & Live Demo URLs, mentor grading modal, and score %.
- [x] Paystack Inbound Student Tuition Payment Modal (Card, USSD, Bank Transfer).
- [x] Automated 37% Faculty Enrollment Revenue Share Calculation and Ledger Accrual.
- [x] Paystack Outbound Mentor Payout Disbursements with NUBAN verification across 28+ Nigerian banks.
- [x] Geofenced Hybrid Staff Attendance with GPS location capture, work modes, and punctuality rules.
- [x] Brand Logo File Upload with instant preview and persistent storage.
- [x] Dynamic Specialized Departments & Course Tagging in Settings.
- [x] 17 Automated Transactional HTML Email Workflows with Zoho SMTP integration.
- [x] Settings Email Customizer & Live Dispatcher with 17 template previewers.
- [x] Disaster Recovery: 1-click JSON backup export/restore and production demo data flush utility.
- [x] Mentor Attendance Logging & Minimum Required Learning Hours Enforcement for Certificate Issuance.
- [x] Student Performance & Welfare Reporting to Head of Admissions and Super Admin with Interactive Performance Meter.
- [x] Mobile-First Progressive Web App (PWA) with official Codelab branding icons, Service Worker offline caching, and bottom navigation.
- [x] Role-Specific Invitation & Authentication Architecture: zero pre-filled Super Admin credentials, URL-parameterized portal links (`/login?role=...&email=...`), and dynamic email auto-detection.
- [x] Zero TypeScript compilation errors (`npm run build` passing in 2.17s).

---

### ⏳ What's Left (Remaining Roadmap & Next Steps):

#### 1. Remote Production Server Synchronization (Deployment)
- **Status**: Ready for deployment upon user approval.
- **Scope**: Deploy latest code to Hostinger VPS (`72.61.106.87`), restart PM2 daemon, and verify remote routes.
- **Critical Constraint**: Strict preservation of remote `server/data/db.json` (`--exclude 'server/data/db.json'`) to prevent any loss of production data.

#### 2. Live Paystack Webhook Configuration
- **Status**: Backend webhook endpoint implemented (`POST /api/paystack/webhook`) with HMAC SHA-512 signature validation.
- **Scope**: Configure live Webhook URL in Paystack Merchant Dashboard (`https://crm.codelab.institute/api/paystack/webhook` or `http://72.61.106.87/api/paystack/webhook`) to receive real-time asynchronous transfer and charge events.

#### 3. Automated Certificate of Completion Generator
- **Status**: Planned for next phase.
- **Scope**: Automated generation of branded digital PDF graduation certificates when a student completes 100% of curriculum lessons and achieves a "Passed" grade on all required lab deliverables.

#### 4. Multi-Campus Geofence Expansion
- **Status**: Currently configured for single active campus with fallback.
- **Scope**: Allow Super Admin to define multiple geofence circles in Settings (e.g. *Yaba Hub*, *Victoria Island Financial Center*, *Abuja Branch*) so staff can clock in seamlessly at any authorized campus.

#### 5. SMS / WhatsApp Transactional Alerts (Optional Extension)
- **Status**: Future backlog.
- **Scope**: Integrate Termii SMS or WhatsApp Business API to deliver instant SMS notifications for tuition receipts, expense approvals, and shift clock-in confirmations to complement emails.
