# AI Financial Audit, Reconciliation & Investigation Suite

## Goal
Upgrade the Super Admin AI Financial Audit module into a 5-layer ERP financial audit, hybrid company-account reconciliation (Paystack + external Nigerian bank snapshots/CSV), formal user-query investigation tracker, and saved forensic report archive styled in Kinetic Command.

## Tasks
- [x] Task 1: Add 5-layer audit, bank snapshot/statement, investigation case, user query, and forensic report types in `src/types/crm.ts` → Verify: `npx tsc --noEmit` passes.
- [x] Task 2: Build `server/utils/financialAuditEngine.ts` (5-layer audit rules, Nigerian bank CSV parser, deterministic forensic Q&A + optional Gemini narrative) → Verify: `npm test` passes unit tests.
- [x] Task 3: Build `server/routes/financialAuditRoutes.ts` and mount in `server/server.ts` (Super Admin audit/bank/investigation/report endpoints + scoped `/api/audit-queries/my` & respond endpoints) → Verify: Non-super-admin gets `403` on audit endpoints; queried user can access only their own query.
- [x] Task 4: Wire `src/services/api.ts` and `src/context/CRMContext.tsx` for all audit, bank, investigation, query, and report flows → Verify: `npx tsc --noEmit` passes.
- [x] Task 5: Upgrade `FinancialAuditPage.tsx` & `FinancialAuditAgentPanel.tsx` and create `CompanyAccountsReconcileTab.tsx`, `AuditInvestigationsTab.tsx`, `AuditReportsTab.tsx`, and `UserAuditQueryModal.tsx` in Kinetic Command UI → Verify: `npm run build` succeeds with zero `lucide-react` or dark-surface regressions in audit views.
- [x] Task 6: Run `npm test && npx tsc --noEmit && npm run build` and verify backend router imports → Verify: All 14/14 tests pass, 0 build errors.

## Done When
- [x] 5-layer ERP audit reconciles Course Prices, Student Inflows, Mentor 37% Payouts, Business Expenses, and Hybrid Company Cash (Paystack + External Bank Snapshots/CSV).
- [x] Super Admin can open Investigation Cases, query any ERP user (Chat DM + Notification Bell + scoped response modal), and save/export PDF & CSV Forensic Reports.
