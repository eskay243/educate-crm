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
