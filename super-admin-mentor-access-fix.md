# Super Admin Mentor Dashboard Access & Role Switcher Fix

## Goal
Fix the role switcher navigation so switching to "Faculty Mentor" immediately redirects to `/mentor/dashboard`, ensure persistent Super Admin simulation state across reloads/tabs, and provide direct 1-click links for Super Admins in the sidebar and faculty roster to preview any mentor's dashboard.

## Tasks
- [ ] Task 1: Update `TopNavbar.tsx` to automatically call `navigate()` upon role switching and when exiting preview mode → Verify: Click "Faculty Mentor", verify instant redirect to `/mentor/dashboard`.
- [ ] Task 2: Enhance `CRMContext.tsx` with persistent Super Admin session state in `localStorage` and support targeted mentor simulation (`switchRole('mentor', mentorId)`) → Verify: Page reload while simulating does not lose Super Admin role switcher.
- [ ] Task 3: Update `Sidebar.tsx` to add "Faculty Dashboard (Preview)" under Mentors & Sessions for Super Admins → Verify: Check Super Admin sidebar menu.
- [ ] Task 4: Add "Preview Faculty Dashboard" header button and per-row "View Dashboard" action in `MentorManagementPage.tsx` → Verify: Click button from roster, verify opens mentor dashboard.
- [ ] Task 5: Add Super Admin Faculty Inspector dropdown in `MentorDashboardPage.tsx` to toggle between different mentors → Verify: Change mentor in dropdown, verify stats update.
- [ ] Task 6: Run TypeScript (`npx tsc --noEmit`) and Vite build (`npm run build`) → Verify: Exits with code 0.

## Done When
- [ ] Clicking "Faculty Mentor" in TopNavbar role switcher immediately navigates to `/mentor/dashboard`.
- [ ] Super Admin can access `/mentor/dashboard` directly from the sidebar without needing to simulate.
- [ ] Super Admin can preview any specific faculty member's dashboard directly from the `/mentors` roster.
- [ ] Refreshing the browser while simulating preserves Super Admin privileges.
