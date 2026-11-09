# Safari Compatibility & Super Admin Mentor Dashboard Access

## Goal
Fix the Safari production blank screen by adding safe storage fallbacks, Safari-compatible media query listeners, a root Error Boundary, and Safari 14 build target; and implement the approved Super Admin Mentor Dashboard direct access and role switcher navigation.

## Tasks
- [x] Task 1: Create `src/utils/safeStorage.ts` with try/catch memory fallback for `localStorage` and `sessionStorage` → Verify: Functions never throw in restricted Safari mode.
- [x] Task 2: Update `PWAContext.tsx` with Safari-safe `matchMedia` listener fallback (`addListener` / `removeListener`) → Verify: Check `matchMedia` in WebKit/Safari.
- [x] Task 3: Create `src/components/common/ErrorBoundary.tsx` and wrap `<App />` in `src/main.tsx` → Verify: Thrown component error renders recovery card rather than blank screen.
- [x] Task 4: Configure `vite.config.ts` build target to `['es2020', 'safari14']` → Verify: Run `npm run build`, check emitted code.
- [x] Task 5: Update `TopNavbar.tsx` role switcher click handlers and "Exit Preview Mode" button to automatically navigate to target role dashboards → Verify: Click "Faculty Mentor", verify instant redirect to `/mentor/dashboard`.
- [x] Task 6: Add direct "Faculty Dashboard (Preview)" sub-item in `Sidebar.tsx` and "Preview Faculty Dashboard" in `MentorManagementPage.tsx` → Verify: Open sidebar as Super Admin, verify direct link exists and opens `/mentor/dashboard`.
- [x] Task 7: Add Super Admin Faculty Inspector dropdown in `MentorDashboardPage.tsx` → Verify: Toggle between different mentors on the dashboard.
- [x] Task 8: Run TypeScript check (`npx tsc --noEmit`) and Vite build (`npm run build`) → Verify: Exits with code 0.

## Done When
- [x] Production application renders properly on Apple Safari with zero blank screen.
- [x] Clicking "Faculty Mentor" in TopNavbar immediately redirects to `/mentor/dashboard`.
- [x] Super Admin can access `/mentor/dashboard` directly from the sidebar without needing to simulate.
- [x] Super Admin can switch between different mentors' live dashboards on `/mentor/dashboard`.
- [x] All code passes TypeScript verification with zero regressions.
