# Attendance & Clock-In/Out System Overhaul (`attendance-clockin-overhaul.md`)

## Goal
Synchronize the Staff & Faculty Clock-In / Clock-Out system with Daily Standup (AI Scrum), live CRM activity logs, multi-campus geofencing, mid-shift breaks, retroactive clock-out reconciliation, and role-scoped management audits.

## Tasks
- [x] Task 1: Extend Attendance Types in `src/types/crm.ts` → Verify: `npx tsc --noEmit` passes with new `AttendanceRecord`, `ShiftBreakEntry`, and `ShiftDeliverableItem` fields.
- [x] Task 2: Upgrade Attendance Endpoints in `server/server.ts` & `src/services/api.ts` → Verify: `POST /api/attendance/clock-in` preserves client ID, and `clock-out`, `break`, `resume`, and `verify` endpoints persist cleanly to `server/data/db.json`.
- [x] Task 3: Refactor `CRMContext.tsx` Attendance & Standup Sync Logic → Verify: `activeAttendanceSession`, `staleAttendanceSession`, `todayCompletedSession`, multi-campus geofencing, flexible mentor punctuality, and two-way `DailyStandupReport` sync work without state drift.
- [x] Task 4: Rebuild `ClockInModal.tsx` with Retroactive Gate, Exception Notes & Standup Sync → Verify: Stale shifts prompt retroactive clock-out first; On-Site mismatch requires exception note; tasks sync with `DailyStandupModal`.
- [x] Task 5: Rebuild `ClockOutModal.tsx` with Auto CRM Activity Rollup & Task Checklist → Verify: CRM actions performed during the shift auto-populate, standup tasks can be checked off, and net hours deduct break minutes.
- [x] Task 6: Upgrade `TopNavbar.tsx` Live Shift Pill & Break Toggle → Verify: Top navbar displays active shift timer, break pause/resume button, and stale-shift warning pill.
- [x] Task 7: Overhaul `StaffAttendancePage.tsx` with Role Views, Date Filters, Absentee Roster & Admin Verification → Verify: Date filters update KPIs, absentee roster lists unclocked staff, and Super Admins can verify/flag/force-close shifts.
- [x] Task 8: End-to-End Verification & Build Audit → Verify: `npm run build` succeeds with zero TypeScript/bundle errors and API smoke tests pass against `localhost:5001`.

## Done When
- [x] All 8 tasks verified and production build + API smoke tests pass cleanly.
