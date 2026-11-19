# Educate CRM Workspace Rules & Development Standards

## 1. Modal Lifecycle & URL Query Sanitization
When triggering modal pop-ups via URL query parameters or navigation links (e.g. `/mentors?action=course-outline` or `?action=book-session`):
- The `action` query parameter must be immediately sanitized from the URL using `setSearchParams(nextParams, { replace: true })` as soon as the modal is opened.
- The context-level `closeModal()` function must purge any residual `action` parameter using `window.history.replaceState()`.
- **Reason**: Failing to purge the `action` parameter causes components to re-open the modal in an infinite loop upon re-rendering or closing.

## 2. Nigerian Banking & 3-Tier KYC Standards
- **Settlement NUBAN Validation**: All payee and beneficiary bank accounts must adhere to the 10-digit NUBAN standard validated against Central Bank of Nigeria (CBN) bank codes.
- **Auto-Population**: Whenever a staff member, faculty mentor, or student submits an OpEx reimbursement or payout request, always auto-populate their verified bank details directly from their Tier 2/3 KYC profile (`staffUsers` / `currentUser`).
- **KYC Tiers**:
  - **Tier 1 (Civil Demographics)**: Official passport photograph upload, full legal name, DOB, gender, nationality, state of origin (36 States + FCT), and LGA.
  - **Tier 2 (Government ID)**: NIN (11 digits), BVN (11 digits), Driver's License, International Passport, or Voter's Card (PVC) + scanned proof upload.
  - **Tier 3 (Address & Guarantor)**: Full residential street address, utility bill proof upload (PHCN/EKEDC/tenancy receipt), and Next of Kin emergency guarantor details.

## 3. Deployment & Environment Guardrails
- **Strictly Local Development**: Keep all execution strictly to `localhost:5173` (Vite) and `localhost:5001` (Express API backend).
- **No Unsolicited VPS Deployment**: Never deploy builds, execute remote rsync, or push to production remote VPS (`72.61.106.87`) without explicit user sign-off.

## 4. "Kinetic Command" UI/UX Design System (Canonical Standard)
All pages, dashboards, cards, buttons, and modals MUST follow the **Kinetic Command** design language established in `src/pages/OperationalDashboardPage.tsx` and documented in `DESIGN.md`:
- **Shared Primitives First**: Always use `PageHeader`, `SemanticMetricCard`, `ActionTile`, and `SectionCard` from `src/components/common/KineticUI.tsx` rather than hand-coding custom headers or metric cards.
- **Frosted Glass & Ambient Semantic Glows (No Top Stripes)**: Every KPI/metric card and shortcut tile must map to a semantic intent (`blue` Primary/Admissions, `amber` Expenses/Approvals, `sky` Faculty/Payouts, `emerald` Revenue/Success/Attendance, `red` Urgent/Tickets/Overdue, `purple` Governance/System) using frosted glass surfaces (`bg-white/80 backdrop-blur-md ring-1 ring-inset ring-white/80` / `.glass-card`), **never hard `border-t-2` top colored stripes**, paired with luminous icon wells (`bg-{color}-500/10 text-{color}-600 ring-1 ring-{color}-500/20`) and spring-eased hover lift + semantic outer glow (`hover:-translate-y-1 hover:border-{color}-500/45 hover:shadow-[0_14px_30px_-8px_rgba(color,0.22)]` + `group-hover:scale-110`).
- **Page Header Anatomy**: Use an open header (`pb-3 border-b border-outline-variant/60`) with a live status pill, `text-2xl sm:text-3xl font-extrabold tracking-tight` title, concise subtitle, and right-aligned `rounded-lg text-xs font-bold` primary/secondary buttons. Do not box page headers inside cards.
- **Strict Surface & Icon Hygiene**:
  - Surfaces: `#F4F7F8` (`bg-canvas`), `#FFFFFF` (`bg-surface`), `1px solid #D9E6E8` (`border-outline-variant`), `rounded-xl` for cards/sections, `rounded-lg` for buttons/inputs/tiles.
  - Icons: Exclusively Google Material Symbols (`material-symbols-outlined`). Never import `lucide-react`.
  - No `dark:` or hardcoded dark-slate (`bg-slate-900`) overrides on light CRM surfaces.
  - Currency & Metrics: Always use `formatNaira` / `formatNairaCompact` with `font-data-tabular`.
