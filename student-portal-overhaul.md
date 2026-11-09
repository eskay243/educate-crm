# Student Portal Overhaul & Academic Synchronization

## Goal
Elevate the Student Scholar Portal (`/student/*`) into a first-class, autonomous academic operating experience that bidirectionally synchronizes with Faculty Mentors (`/mentor/*`) and Program Officers (`/students`, `/courses`), adhering strictly to the Kinetic Enterprise design system (`DESIGN.md`).

## Tasks
- [x] Task 1: Overhaul Student Dashboard (`StudentDashboardPage.tsx`) with Live Lecture Hero card, Two-Way Mentor Goals checklist tray, and Academic Welfare alert banner → Verify: Assigned mentor goals sync interactively; today's lecture links render.
- [x] Task 2: Enhance Classroom LMS (`StudentCoursesPage.tsx`) with Graded Lab Feedback Drawer, rubric scorecard, and revision resubmission loops → Verify: Graded feedback is visible to scholar and allows revision upload.
- [x] Task 3: Elevate 1-on-1 Mentorship Hub (`StudentMentorPage.tsx`) with dynamic office hours reservation, past session action items ledger, and 1-click Mentor Direct Chat deep-link → Verify: Booking syncs with mentor calendar and opens `/chat`.
- [x] Task 4: Upgrade Tuition & Billing (`StudentBillingPage.tsx`) with visual Installment Milestone Roadmap, Paystack tranche checkout, and electronic PDF receipts → Verify: Tranche payment updates student ledger and generates receipt.
- [x] Task 5: Upgrade 360° Profile (`StudentProfilePage.tsx` & `Student360Dossier.tsx`) with self-service Tier 1-3 KYC upload forms and official Digital Graduation Certificate generator → Verify: Certificate unlocks upon 100% curriculum + 40h attendance.
- [x] Task 6: Full verification suite (`npx tsc --noEmit` and `npm run build`) and design compliance audit → Verify: Build compiles with 0 errors, no purple colors, strictly Kinetic Enterprise styling.

## Done When
- [x] All 5 student views (`/student/dashboard`, `/student/courses`, `/student/mentor`, `/student/billing`, `/student/profile`) are fully synchronized with Mentor and Program Officer modules.
- [x] Two-way data synchronization operates seamlessly in local state and API services.
- [x] TypeScript check and production build pass with zero errors.
