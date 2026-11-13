# Daily Standup & Weekly Scrum Enhancements Plan (`daily-standup-enhancements.md`)

## Goal
Fix validation bugs (whitespace/ghost tasks, blank row persistence), prevent unsaved draft loss, overhaul mobile responsiveness, add sequential task numbering, restore the Weekly AI Audit module breakdown, auto-populate yesterday's completed tasks, support multiline inputs, and set intelligent role-based default modules in the Daily Standup (DSU) and Scrum system.

---

## Tasks

- [x] **Task 1: Strict Whitespace Validation & Server-Side Sanitization**
  - In `src/components/modals/DailyStandupModal.tsx`:
    - Detect tasks containing only whitespace (`t.description.length > 0 && t.description.trim().length === 0`). Show immediate validation toast: `"Task description cannot contain only whitespace or spaces"`.
    - Automatically discard untouched empty rows (`t.description.trim().length === 0`) and update local state so discarded rows don't linger in UI.
    - If both sections have zero valid tasks after trimming, display a clear warning.
  - In `server/server.ts` (`POST /api/scrum/standup`):
    - Sanitize and trim descriptions: filter out any tasks where `!t.description || !t.description.trim()`, and map `description: t.description.trim()`.
  - **Verified**: Tested `POST /api/scrum/standup` with space-only strings; backend and frontend cleanly reject/sanitize without ghost tasks in `db.json`.

- [x] **Task 2: Auto-Save Draft to LocalStorage & Unsaved Work Protection**
  - In `DailyStandupModal.tsx`:
    - Auto-save form draft (`tasksYesterday`, `tasksToday`, `blockers`, `selectedModules`) to `safeLocalStorage` under `standup_draft_${currentUser.id}` whenever inputs change.
    - On modal open: If a draft exists and `!todayStandup`, restore it and display a "Restored unsaved standup draft" banner with a "Discard Draft" action.
    - Clear draft from `localStorage` upon successful `submitDailyStandup`.
    - Attached `beforeunload` window event listener when form has unsaved modifications to warn user if refreshing.
  - **Verified**: Local storage keys persist across reloads and clear automatically on submission.

- [x] **Task 3: Mobile Responsive Layout Overhaul**
  - In `DailyStandupModal.tsx`:
    - Refactored task row containers from rigid `flex items-center gap-2` to responsive `flex flex-col sm:flex-row sm:items-start gap-2`.
    - On mobile (`< sm`): Auto-expanding textarea takes 100% width on row 1; module selector, status selector, and delete button align cleanly on row 2 without horizontal overflow.
    - Ensured Assigned Operational Modules container wraps cleanly with `flex flex-wrap gap-1.5 sm:gap-2` and no horizontal clipping.
    - Set modal container to `w-full max-w-full sm:max-w-3xl overflow-x-hidden`.
  - **Verified**: Verified on mobile widths (< 390px); all controls, buttons, and text wrap naturally without horizontal scrolling.

- [x] **Task 4: Sequential Task Row Numbering**
  - In `DailyStandupModal.tsx`:
    - Added a distinct numbered badge (`1`, `2`, `3`...) next to each task row in Section 1 (Yesterday) and Section 2 (Today).
    - Styled as `<span className="w-5 h-5 rounded-md bg-surface-container font-mono text-[11px] font-bold flex items-center justify-center text-secondary shrink-0 mt-1 border border-outline/50">{idx + 1}</span>`.
  - **Verified**: Both Section 1 and Section 2 display clear sequential numbering for each task.

- [x] **Task 5: Restore Weekly AI Audit Module Breakdown**
  - In `server/server.ts` (`POST /api/scrum/weekly-evaluation`):
    - Replaced hardcoded `moduleBreakdown: {}` with dynamic calculation aggregating `tasksToday` and `tasksYesterday` from `userStandups`.
    - Computed `tasksPlanned` and `tasksCompleted` per module ID (`leads`, `expenses`, `lms`, `billing`, `mentors`, `students`, `attendance`, `tickets`).
  - In `DailyStandupModal.tsx`:
    - Under `Assigned Module Throughput Breakdown`: check if `Object.keys(moduleBreakdown).length > 0`. If items exist, render progress bars. If empty, render a helpful placeholder: `"No module task throughput recorded yet for this evaluation period."` instead of an empty box.
  - **Verified**: Executed `POST /api/scrum/weekly-evaluation` via curl; verified throughput calculation outputs planned and completed tasks per module.

- [x] **Task 6: Automatic Carry-Forward of Yesterday's Completed Tasks**
  - In `DailyStandupModal.tsx` and `CRMContext.tsx`:
    - When opening a new standup (`!todayStandup`), look up the user's most recent prior standup report from `dailyStandups`.
    - Automatically pre-populate Section 1 ("What did you complete or work on yesterday?") with tasks from that previous report, carrying over deliverables so staff don't have to re-type them fresh.
    - Staff can quickly edit, add new rows, or adjust statuses.
  - **Verified**: Previous day's tasks load automatically into Section 1 on fresh standup initialization.

- [x] **Task 7: Auto-Expanding Multiline Input for Long Task Descriptions**
  - In `DailyStandupModal.tsx`:
    - Replaced single-line `<input type="text">` with auto-resizing `<textarea rows={1}>` that automatically adjusts height based on scrollHeight (`onInput`), with `resize-none` and full `title={task.description}` for hover tooltips.
  - **Verified**: Long paragraphs wrap and expand vertically up to `max-h-44` without text clipping.

- [x] **Task 8: Role-Aware Default Operational Module**
  - In `DailyStandupModal.tsx`:
    - Implemented `getDefaultModule(currentUser, selectedModules)`:
      1. `currentUser.assignedModules[0]`
      2. Role mapping: IT/support → `tickets`, mentor/faculty → `lms`, finance → `expenses`, admissions → `leads`, program officer → `attendance`, student/registrar → `students`.
      3. Fallback to `selectedModules[0] || 'leads'`.
  - **Verified**: New task rows default to the user's role-assigned module (e.g. `Support Tickets` for IT Support) rather than hardcoded "Leads & Admissions".

---

## Done When
- [x] No ghost/whitespace-only tasks can be submitted or saved in `db.json`.
- [x] Leaving an empty row alongside valid tasks does not save a blank row.
- [x] Unsaved drafts persist across browser refreshes and clear upon submission.
- [x] Mobile view renders cleanly without horizontal scroll or truncated dropdowns.
- [x] Tasks are numbered sequentially (1, 2, 3...).
- [x] "ASSIGNED MODULE THROUGHPUT BREAKDOWN" displays accurate module statistics.
- [x] Yesterday's completed tasks auto-populate when creating a new standup.
- [x] Long paragraphs wrap and expand vertically.
- [x] Default module matches the user's assigned role/modules.
- [x] `npx tsc --noEmit && npm run build` passes with zero errors.
