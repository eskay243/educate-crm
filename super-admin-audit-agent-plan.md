# Super Admin AI Financial Audit Agent

## Goal
Restrict the financial auditing & reconciliation tool strictly to `super_admin` and add an automated AI Financial Audit Agent that tracks money flow (payments received vs. 37% commissions vs. disbursements), flags discrepancies, and maintains a persistent audit log.

## Tasks
- [ ] Task 1: Add `FinancialAuditFinding` and `FinancialAuditScan` types in `src/types/crm.ts` → Verify: `npx tsc --noEmit` passes.
- [ ] Task 2: Add `isSuperAdminOnly` guard, `runFinancialAuditScan` engine, and `/api/financial-audit` endpoints in `server/server.ts` → Verify: Non-super-admin gets `403`, super admin gets money-flow summary + flagged findings.
- [ ] Task 3: Add `financialAudit` API methods in `src/services/api.ts` and `src/context/CRMContext.tsx` → Verify: `npx tsc --noEmit` passes.
- [ ] Task 4: Build `src/components/audit/FinancialAuditAgentPanel.tsx` and `src/pages/FinancialAuditPage.tsx` (money-flow pipeline, discrepancy log, severity/status filters, resolve workflow) → Verify: `npm run build` succeeds.
- [ ] Task 5: Restrict `/financial-audit` route in `src/App.tsx` and Reconciliation/Audit tab in `src/pages/MentorManagementPage.tsx` strictly to `super_admin` → Verify: Role guard blocks non-super-admin roles.
- [ ] Task 6: Run `npx tsc --noEmit && npm run build` and test `/api/financial-audit/scan` on `localhost:5001` → Verify: 0 build errors and live scan logs findings.

## Done When
- [ ] Only `super_admin` can view or call the financial auditing tool & endpoints.
- [ ] Audit Agent tracks payments received vs. commissions vs. disbursements, flags discrepancies, and persists an auditable log.
