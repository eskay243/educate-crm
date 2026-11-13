# Plan: Faculty Payouts, Multi-Course Outlines, Scoped Grading & Student Allocation Overhaul

## Overview
Address and resolve critical workflow gaps identified across the Faculty Mentor portal, Expense & Budget module, Course Outlines, Student Grading inbox, and Timetable lecture hour tracking.

---

## Root Causes Identified
1. **Payout Request Modal Hardcoded Mentor**:
   - `RequestPayoutModal.tsx` falls back to `mentors[0]` (`Ayomikun Kunle` / `Abimbola Ekundayo Leslie`) when an Admin/SuperAdmin opens the modal because `currentUser` is not a mentor.
   - There is no mentor selector dropdown, preventing users from selecting any other mentor.
   - Payout requests are saved to `payoutRequests` but are not logged as Expense entries in the Expense & Budget module (`/expenses`).
   - There is no Delete or Cancel button for pending payout requests.
2. **Course Outline Multi-Course Switching**:
   - `CourseOutlinePage.tsx` restricts mentors with `c.leadInstructor === currentUser?.name` (missing `assignedMentors` and failing on whitespace differences).
   - No prominent multi-course switching dropdown/tabs for mentors assigned to multiple tracks.
3. **Student Grading Scoping & Missing Add Assignment Feature**:
   - `FacultyGradingInbox.tsx` lacks strict multi-tenant scoping and exposes all submissions if `myMentorProfile` is not cleanly matched.
   - Mentors currently have no interface or data model to create new assignments or capstone projects and grade them.
   - Graded submissions on the student side fail to reflect due to strict string equality mismatches on titles and names.
4. **God'smiracle Student Allocation Gap**:
   - Trailing space in `"Godsmiracle Ibitoye "` and missing `mentorId` on student records in `db.json` causes strict equality checks (`===`) to fail across mentor dashboards and roster views.
5. **Lecture Log Time Not Reflecting**:
   - In `CRMContext.tsx` and `server/server.ts`, attendance crediting requires `slot.mentorId` and does strict `m.name === slot.mentorName` without `.trim()`, failing when names have whitespace differences.
   - Scheduling a class via Sipcore does not automatically credit hours until attendance is marked or verified.

---

## Tasks

### Phase 1: Payout Requests & Expense Module Integration
- [x] Task 1: Update `RequestPayoutModal.tsx` to add a searchable Mentor Selector dropdown for Super Admins / Program Officers, dynamically binding the chosen mentor's verified NUBAN details, available commission, and lecturing hours.
- [x] Task 2: Enhance `CRMContext.tsx` (`requestMentorPayout`) to accept an optional `targetMentorId` and automatically generate a corresponding `Expense` record in `expenses` with category `"Faculty & Mentor Payouts"`, status `"Pending"`, and linked voucher reference.
- [x] Task 3: Add `deleteMentorPayoutRequest(requestId)` and `updateMentorPayoutRequest` in `CRMContext.tsx` and `server/server.ts`, updating `MentorManagementPage.tsx` and `MentorPayoutsPage.tsx` with Delete/Cancel and Edit action buttons on Pending requests.

### Phase 2: Course Outline Multi-Course Switching
- [x] Task 4: Fix course resolution in `CourseOutlinePage.tsx` and `MentorCurriculumPage.tsx` to include `assignedMentors` and `.trim().toLowerCase()` matching.
- [x] Task 5: Add a responsive Course Selector dropdown and tab bar in `CourseOutlinePage.tsx` so mentors handling multiple courses (e.g. Data Analysis and Data Science) can switch between courses with 1-click.

### Phase 3: Scoped Grading & Add Assignment/Project Flow
- [x] Task 6: Implement `CreateAssignmentModal.tsx` and add `createAssignment` to `CRMContext.tsx` and `server/server.ts`, allowing mentors to create assignments/projects for their courses with custom submission requirements and deadlines.
- [x] Task 7: Update `FacultyGradingInbox.tsx` with strict multi-tenant filtering (mentors strictly only view their own courses and students), and add an "Add Assignment / Project" trigger and direct manual grading capabilities.
- [x] Task 8: Fix student-side grade reflection in `StudentCoursesPage.tsx` and `StudentDashboardPage.tsx` using normalized ID and name matching.

### Phase 4: Student Allocation & Lecture Log Time Fix
- [x] Task 9: Sanitize whitespace in `server/data/db.json` for God'smiracle and all mentors, ensuring `mentorId: "men-1789126021588"` is linked on all assigned students so all students reflect on the dashboard and student rosters.
- [x] Task 10: Fix lecture hour crediting in `CRMContext.tsx` and `server/server.ts` to use `.trim().toLowerCase()` fallback matching, and provide a retroactive hours recalculation/sync from held timetable slots and coaching sessions.

### Phase 5: Verification
- [x] Task 11: Run full verification suite (`npx tsc --noEmit` and `npm run build`) and verify all views against `DESIGN.md`.

---

## Done When
- [x] Super Admin and mentors can select any mentor in `RequestPayoutModal`, and every payout request creates a matching Expense record in `/expenses`.
- [x] Pending payout requests can be edited or deleted by the person who raised them or Super Admin.
- [x] Mentors taking multiple courses can seamlessly toggle between courses in Course Outlines.
- [x] Mentors can create assignments/projects, only see submissions for their own students/courses, and grades reflect instantly on student dashboards.
- [x] God'smiracle and all mentors see all their assigned students across mentor dashboards.
- [x] Lecture hours accurately reflect on mentor profiles when classes are scheduled and held.
- [x] Build compiles cleanly with zero TypeScript errors.
