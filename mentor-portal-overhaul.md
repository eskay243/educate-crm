# Mentor Portal & Faculty Experience Overhaul

## Goal
Build a dedicated `/mentor/*` sub-app and command center for faculty mentors in Educate CRM, decoupling instructor workflows (classes, students, grading, curriculum, and 37% revenue-share payouts with multi-mentor splits) from the administrative roster (`/mentors`).

## Tasks
- [x] Task 1: Setup `/mentor/*` routes in `App.tsx` and dedicated faculty navigation in `Sidebar.tsx` and `MobileBottomNav.tsx` → Verify: Switch role to mentor, verify redirect to `/mentor/dashboard` and updated sidebar.
- [x] Task 2: Create `MentorDashboardPage.tsx` with faculty KPIs, today's teaching agenda, pending grading alert, and quick action trays → Verify: Open `/mentor/dashboard`, check KPI stats and today's schedule feed.
- [x] Task 3: Build `MentorStudentsPage.tsx` with assigned learners, goal setting drawer, welfare intervention triggers, and direct chat links → Verify: Open `/mentor/students`, set a student goal, confirm save.
- [x] Task 4: Build `MentorSchedulePage.tsx` unifying cohort timetables, 1-on-1 coaching sessions, 1-click attendance, and weekly office hours slot manager → Verify: Open `/mentor/schedule`, toggle availability slot, mark class attendance.
- [x] Task 5: Integrate `FacultyGradingInbox` under `/mentor/grading` with rubric scoring, status filtering, and feedback submission → Verify: Open `/mentor/grading`, submit assignment grade, confirm toast and status change.
- [x] Task 6: Build `MentorCurriculumPage.tsx` with assigned course syllabi, downloadable assets, learning materials repository, and weekly teaching reports → Verify: Open `/mentor/curriculum`, view syllabus modules, submit a weekly report.
- [x] Task 7: Build `MentorPayoutsPage.tsx` implementing the 37% tuition revenue-share calculator with multi-mentor percentage splits and KYC NUBAN auto-population → Verify: Open `/mentor/payouts`, verify split calculation and NUBAN auto-fill on payout request.
- [x] Task 8: Build `MentorProfilePage.tsx` exposing the self-service 360° Faculty Dossier (KYC Tier status, leave requests, company property) → Verify: Open `/mentor/profile`, verify tabs and personal KYC details render cleanly.
- [x] Task 9: Run TypeScript check (`npx tsc --noEmit`) and Vite build check (`npm run build`) to ensure zero errors → Verify: Build exits 0 with zero type errors.

## Done When
- [x] Mentors are automatically redirected to `/mentor/dashboard` upon login.
- [x] Mentors have dedicated workspaces for Dashboard, Students, Schedule, Grading, Curriculum, Payouts, and Profile.
- [x] 37% tuition revenue-share accurately calculates co-mentor percentage splits.
- [x] Admin faculty roster at `/mentors` remains intact for `super_admin` and `program_officer`.
- [x] All code passes TypeScript verification with zero regressions.
