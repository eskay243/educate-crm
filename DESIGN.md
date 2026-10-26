# Design System: Edu-Business Operations CRM (Kinetic Enterprise)
**Project ID:** 1004875458584841938  
**Standard:** Google Stitch "Kinetic Enterprise" System  
**Target Environments:** Web & Cross-Platform Mobile (React Native / Expo / NativeWind)

---

## 1. Visual Atmosphere & Creative Direction

The **Kinetic Enterprise** design system is engineered for high-density information management, professional CRM workflows, and academic administration. The aesthetic balances **institutional reliability**, **operational clarity**, and **frictionless efficiency**.

- **Atmosphere:** Clean, architectural, focused, and utilitarian.
- **Mood:** Dignified corporate professionalism tailored for Nigerian technology institutes (Codelab Educare Ltd) and corporate accelerators.
- **Visual Rhythm:** Structured 4px spatial baseline, high contrast, crisp 1px borders, and generous breathing room to counteract cognitive overload in financial and academic data views.

---

## 2. Color Palette & Semantic Roles

The color architecture enforces strict functional roles, ensuring high accessibility (WCAG AA/AAA) and immediate visual cognition across Web and Mobile viewports.

### Primary Brand & Action Palette
- **Deep Navy / Primary Dark (`#00236F`)**: High-contrast brand headers, primary call-to-action active states, and dark navigation accents.
- **Kinetic Blue / Primary Container (`#1E3A8A`)**: Core interactive elements, active bottom navigation tabs, primary buttons, and link highlights.
- **Primary Tint / Focus Glow (`#4059AA`)**: Active input outlines, focus indicators, and subtle touch ripple highlights.
- **Fixed Accent Light (`#DCE1FF`)**: Soft chip backgrounds, selected list item highlights, and active filter tags.

### Surface, Canvas & Background
- **Base Canvas / Background (`#F7F9FB`)**: Paper-like, soft neutral workspace canvas that minimizes eye fatigue compared to harsh `#FFFFFF`.
- **Surface Container Lowest (`#FFFFFF`)**: Pure white cards, elevated bottom sheets, modal dialogs, and table row canvases.
- **Surface Container Low (`#F2F4F6`)**: Secondary panels, disabled input states, and zebra-striped table rows.
- **Surface Container High (`#ECEEF0`)**: Subtle divider bars, card dividers, and inactive tab tracks.
- **Outline & Border (`#E2E8F0` / `#C5C5D3`)**: Whisper-thin 1px bounding borders that define container edges without heavy drop shadows.

### Functional Accents & Status Semantics
- **Success Emerald (`#16A34A` / Container `#DCFCE7`)**: Verified NUBAN accounts, approved OpEx requisitions, cleared tuition payments, and passed student lab deliverables.
- **Warning Amber (`#D97706` / Container `#FEF3C7`)**: Grace-period attendance clock-ins, pending expense approvals, overdue tuition reminders, and revisions requested.
- **Critical Red / Error (`#BA1A1A` / Container `#FFDAD6`)**: Late clock-ins, rejected OpEx requests, NUBAN checksum failures, and unpaid tuition warnings.
- **Info Cyan / Slate (`#0284C7` / Container `#E0F2FE`)**: Active cohort notifications, coaching calendar bookings, and syllabus progress markers.

### Nigerian Financial & Banking Theme Tokens
- **Naira Currency Accent (`#047857`)**: Display of `₦` currency figures, 37% faculty commission payouts, and Paystack settlement credit advice.

---

## 3. Typography & Text Hierarchy

The typography standard relies exclusively on **Inter** for all UI copy and headings, with **JetBrains Mono** or tabular figures (`tabular-nums`) for currency figures, matriculation codes, and NUBAN account numbers.

| Level | Size | Weight | Line Height | Mobile Adaptation | Functional Role |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Display** | 36px | Bold (700) | 44px | 28px / 34px | Executive hero stats, high-level metrics |
| **Headline-LG** | 28px | SemiBold (600) | 36px | 22px / 28px | Page titles, module headers, modal titles |
| **Headline-MD** | 20px | SemiBold (600) | 28px | 18px / 24px | Card headers, section dividers, student names |
| **Body-LG** | 16px | Regular (400) | 24px | 15px / 22px | Lead descriptions, syllabus lesson summaries |
| **Body-MD** | 14px | Regular (400) | 20px | 14px / 20px | Standard data cells, input labels, form hints |
| **Body-SM** | 12px | Regular (400) | 16px | 12px / 16px | Timestamps, secondary metadata, geofence radius |
| **Label-MD** | 13px | SemiBold (600) | 18px | 12px / 16px | Table header columns, button labels, badge text |
| **Data Tabular** | 14px | Regular / Med | 20px | 13px / 18px | `₦` Currency balances, NUBAN numbers, GPS coords |

---

## 4. Geometry, Shapes & Spatial Rhythm

The spatial model is strictly rooted in a **4px baseline grid**:
- **Baseline Unit**: 4px
- **Tight Stack (`stack-sm`)**: 8px (Inner badge padding, list item gaps)
- **Standard Stack (`stack-md`)**: 16px (Card inner padding, form field spacing)
- **Section Stack (`stack-lg`)**: 24px - 32px (Screen margins, header-to-content spacing)

### Corner Radius System (Soft Architectural Logic)
- **Sharp Small (`rounded-sm` / 2px)**: Data table cells, micro progress bars.
- **Soft Standard (`rounded` / 4px)**: Buttons, text input fields, segmented control pills.
- **Medium Card (`rounded-md` / 6px)**: Nested cards, coaching session cards, lab submission cards.
- **Large Container (`rounded-lg` / 8px - 12px)**: Primary bento widgets, bottom sheets, mobile modal surfaces.
- **Pill Shape (`rounded-full` / 9999px)**: Status badges (Active, Paid, Pending), user avatar frames, icon-button backdrops.

---

## 5. Elevation, Depth & Tonal Layering

Rather than relying on heavy, dark drop shadows that muddy data density, the Kinetic Enterprise system relies on **Tonal Layering** and **Crisp Low-Contrast Outlines**:

- **Canvas (Layer 0)**: `#F7F9FB` — The foundational viewport backdrop.
- **Card / Surface (Layer 1)**: `#FFFFFF` with `1px solid #E2E8F0` — Flat, stable containers for ledgers, attendance cards, and curricula.
- **Floating / Interactive (Layer 2)**: `#FFFFFF` with `0 2px 8px -2px rgba(15, 23, 42, 0.06)` — Bottom navigation bar, floating action buttons, sticky attendance clock-in headers.
- **Modal / Overlay (Layer 3)**: `#FFFFFF` with `0 12px 24px -4px rgba(15, 23, 42, 0.12)` + `#0F172A` backdrop at 45% opacity.

---

## 6. Mobile Application Ergonomics & Component Patterns

### Bottom Navigation Architecture
- Ergonomic 64px thumb-zone navigation bar with 4-5 core destinations:
  - **Student Role**: Dashboard (`Home`), Syllabus (`LMS`), Mentorship (`1-on-1`), Billing (`Tuition`), Profile.
  - **Mentor Role**: Dashboard (`Home`), Assigned Mentees (`Students`), Grading (`Labs`), Earnings (`37% Share`), Profile.
  - **Staff / Admin Role**: Overview (`Stats`), Attendance (`GPS Clock-In`), Requisitions (`OpEx`), Leads (`Kanban`), Profile.
- Active tab indicated by `#1E3A8A` tint with a 4px accent dot indicator.

### Touch Targets & Form Rhythm
- Minimum touch target size: **48 × 48px** for all interactive buttons, checkboxes, and tabs.
- Form inputs standardize on a **48px height** on mobile for smooth thumb typing.
- Numeric inputs (NUBAN, tuition amount, phone number) automatically invoke the platform `number-pad` or `decimal-pad`.

### Mobile Proof of Payment & Document Capture
- Clean dashed upload zones with direct camera capture and photo gallery picker.
- Instant file preview thumbnail with file size and format validation (PNG, JPG, PDF up to 10MB).

### Native Haptic Feedback & Transitions
- Light haptic tap (`expo-haptics`) on tab switching, successful GPS attendance clock-in, and Paystack payment completion.
- Smooth spring transitions between screen stacks using Expo Router layout animations.
