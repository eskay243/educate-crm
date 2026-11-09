# Program Officer Module Overhaul & Tri-Portal Synchronization

## Goal
Elevate the Academic Program Officer (`program_officer`) workspace into a dedicated Academic Command Center (`/courses` & `/mentors/course-outlines`) that bidirectionally synchronizes with the Faculty Mentor Portal (`/mentor/*`) and Student Scholar Portal (`/student/*`), enforcing all 42 test cases in `Program_Officer_Module_QA_Checklist.xlsx` and strictly adhering to `DESIGN.md` (Kinetic Enterprise).

## Tasks
- [x] Task 1: Extend `src/types/crm.ts` and `src/context/CRMContext.tsx` with PO topic revision (`returnTopicByProgramOfficer`), weekly report review (`reviewMentorWeeklyReport`), and interactive IQA audit logging (`logCourseIQAAudit`) → Verify: TypeScript compiles cleanly.
- [x] Task 2: Update `App.tsx`, `Sidebar.tsx`, and `MobileBottomNav.tsx` for `program_officer` landing on `/courses`, role-tailored navigation & CTAs, and strict route guards on `/expenses` and `/settings` → Verify: Switching to `program_officer` lands on `/courses` and hides restricted links.
- [x] Task 3: Upgrade `CoursesCohortsPage.tsx` Tab 4 (`Syllabus Approvals`) & `CourseOutlinePage.tsx` with "Return for Revision" feedback loop and Faculty Weekly Teaching Reports & Materials Audit Inbox → Verify: PO can approve or return lessons and sign off on mentor weekly reports.
- [x] Task 4: Upgrade `CoursesCohortsPage.tsx` Tab 5 (`Faculty Hours & 37% Payout Tracker`) with multi-mentor 37% split breakdown (`calculateMentorTuitionCommission`) and PO Payout Voucher Verification (`PayoutVoucherModal` + `reviewMentorPayout`) → Verify: Tab 5 displays 37% split compensation in `₦` and opens voucher modal.
- [x] Task 5: Upgrade `CoursesCohortsPage.tsx` Tab 6 (`Dynamic Pacing, IQA & Scholar Welfare Gate`) with dynamic course selection, interactive 3-of-3 IQA audit logging, At-Risk Scholar Welfare & Ungraded Lab SLA queue, and 1-click Graduation Certificate issuance → Verify: All courses selectable in Tab 6; IQA audits and certificate issuance persist.
- [x] Task 6: Sync `MentorCurriculumPage.tsx` (`/mentor/curriculum`) and `StudentCoursesPage.tsx` (`/student/courses`) so Mentors can mark lessons taught directly in `/mentor/curriculum` and Students automatically receive mentor-uploaded `learningMaterials` + PO accreditation badges → Verify: Two-way sync across Mentor, PO, and Student views.
- [x] Task 7: Purge all remaining `purple-*` classes across `CoursesCohortsPage.tsx`, `MentorManagementPage.tsx`, and `OperationalDashboardPage.tsx` and run `npx tsc --noEmit` + `npm run build` → Verify: Zero `purple-*` matches and zero build errors.

## Done When
- [x] `program_officer` automatically lands on `/courses` with tailored desktop/mobile navigation and strict route guards on `/expenses` and `/settings`.
- [x] Full 3-way curriculum, weekly report, learning material, 37% split payout verification, IQA audit, and scholar welfare/graduation flows operate seamlessly across PO, Mentor, and Student modules.
- [x] All code adheres to Kinetic Enterprise (`DESIGN.md`) and passes `npx tsc --noEmit` and `npm run build` with 0 errors.
