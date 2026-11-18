# CODELAB EDUCARE — Unified Brand & Design Guide ("Kinetic Command")

**Canonical Reference:** `src/pages/OperationalDashboardPage.tsx` & `src/components/common/KineticUI.tsx`  
**Brand Archetype:** **The Sage × The Ruler** — Institutional authority, operational precision, and frictionless clarity for modern African technology education.  
**Target Environments:** Web (React + Tailwind) & Cross-Platform Mobile

---

## 1. Visual Atmosphere & Brand Voice

The **Kinetic Command** design system evolves the Crisp Foundation architecture into a high-signal executive command center. It balances **institutional reliability**, **color-coded scannability**, and **tactile micro-interactions**.

- **Atmosphere:** Crisp, architectural, distraction-free, light-surface workspace (`#F4F7F8` canvas, `#FFFFFF` elevated surfaces).
- **Color-Coded Framing:** Neutral 1px borders (`#D9E6E8`) paired with a **2px semantic top accent border** at rest and **full semantic border highlight + soft elevation on hover**, enabling instant visual triage across financial, academic, faculty, and support workflows.
- **Voice:** Confident, executive, and Naira-native (`₦` with `font-data-tabular`).

---

## 2. Color Palette & Semantic Border Architecture

### Base Surface & Brand Tokens
| Role | Tailwind Token | Hex | Usage |
| :--- | :--- | :--- | :--- |
| **Workspace Canvas** | `bg-canvas` / `bg-background` | `#F4F7F8` | Page background, nested list row surfaces (`bg-surface-container-low`) |
| **Primary Card Surface** | `bg-surface` / `bg-surface-container-lowest` | `#FFFFFF` | All KPI cards, section panels, modals, tables |
| **Structural Border** | `border-outline` / `border-outline-variant` | `#D9E6E8` | Crisp 1px container outline |
| **Primary Text** | `text-on-surface` / `text-crisp-black` | `#1C293C` | Headings, hero metrics, primary table cells |
| **Secondary Text** | `text-secondary` | `#414754` | Labels, timestamps, subtitles |
| **Brand Action** | `bg-primary` / `hover:bg-primary-hover` | `#1872F5` / `#1464CC` | Primary CTAs, active tabs, focus rings |
| **Institutional Header** | `bg-crisp-black` | `#1C293C` | Hero wallet banners, primary modal headers |

### Color-Coded Semantic Intents (6-Color System)
| Intent | Domain Examples | Top Accent Border | Hover Border | Icon Well & Badge |
| :--- | :--- | :--- | :--- | :--- |
| **`blue`** | Invoices, Leads, Admissions, General Actions | `border-t-2 border-t-blue-500` | `hover:border-blue-500/60` | `bg-blue-500/10 text-blue-600` |
| **`amber`** | Pending Expenses, Budget Alerts, Grace Period | `border-t-2 border-t-amber-500` | `hover:border-amber-500/60` | `bg-amber-500/10 text-amber-600` |
| **`sky`** | Faculty Payouts, Sessions, Office Hours | `border-t-2 border-t-sky-500` | `hover:border-sky-500/60` | `bg-sky-500/10 text-sky-600` |
| **`emerald`** | Revenue, Cleared Payments, Attendance, Verified KYC | `border-t-2 border-t-emerald-500` | `hover:border-emerald-500/60` | `bg-emerald-500/10 text-emerald-600` |
| **`red`** | Open/Urgent Tickets, Overdue Tuition, Rejections | `border-t-2 border-t-red-500` | `hover:border-red-500/60` | `bg-red-500/10 text-red-600` |
| **`purple`** | Audit Logs, Roles, Governance, AI Scrum | `border-t-2 border-t-purple-500` | `hover:border-purple-500/60` | `bg-purple-500/10 text-purple-600` |

---

## 3. Typography & Spatial Hierarchy

- **Font Family:** `Figtree`, `'Proxima Nova'`, `Inter`, sans-serif.
- **Page Header Title:** `text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight`
- **Page Subtitle:** `text-xs sm:text-sm text-secondary mt-0.5`
- **Card Hero Metric:** `text-2xl font-black text-on-surface font-data-tabular`
- **Section Heading:** `text-sm sm:text-base font-bold text-on-surface` paired with a `20px` Material Symbol icon.
- **Micro Labels & Eyebrows:** `text-xs font-bold uppercase tracking-wider text-secondary`

---

## 4. Geometry, Shapes & Component Primitives (`KineticUI.tsx`)

| Primitive | Radius | Sizing | Signature Pattern |
| :--- | :--- | :--- | :--- |
| **`PageHeader`** | Open (unboxed) | `pb-3 border-b border-outline-variant/60` | Top live status pill (`rounded-full`) + right-aligned action group |
| **`SemanticMetricCard`** | `rounded-xl` (12px) | `p-4` | `border-t-2 border-t-{color}-500` + `hover:border-{color}-500/60 hover:shadow-md` + `group-hover:scale-110` icon well |
| **`ActionTile`** | `rounded-lg` (8px) | `p-3` | `border-outline-variant/80 hover:border-{color}-500 hover:bg-{color}-500/5` |
| **`SectionCard`** | `rounded-xl` (12px) | `p-4 sm:p-5` | Internal header bar with `pb-3 border-b border-outline-variant/60 mb-3` |
| **Buttons** | `rounded-lg` (8px) | `px-3.5 py-2` / `h-9` | Primary (`bg-primary text-white text-xs font-bold`) & Secondary (`bg-surface border border-outline-variant text-on-surface text-xs font-semibold`) |
| **Filter Pills** | `rounded-lg` (8px) | `px-2.5 py-1.5` | `bg-surface-container-low border border-outline-variant text-xs` with leading `16px` Material Symbol |
| **Icons** | — | `16px`–`20px` | **Exclusively Google Material Symbols Outlined** (`material-symbols-outlined`) |

---

## 5. Motion, Modals & Accessibility
- **Page Entrance:** `animate-in fade-in duration-200` on every root page container.
- **Tactile Press:** `active:scale-[0.985]` on buttons and interactive cards.
- **Modals:** Bounded dynamically via `max-h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-2.5rem)] md:max-h-[calc(100dvh-3rem)]` with `my-auto` safe centering and pinned `shrink-0` headers/footers.
- **Reduced Motion:** Full `prefers-reduced-motion: reduce` support in `src/index.css`.
