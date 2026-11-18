# Route All Mentor Payout Requests to Expense & Budget

## Goal
Eliminate the duplicate Mentor Payout Requests workflow in Faculty Overview by routing all mentor payout requests, approvals, and disbursements exclusively through **Expense & Budget** (`/expenses`), with full bidirectional sync back to `payoutRequests` and mentor balances.

## Tasks
- [x] Task 1: Remove the duplicate `Payout Requests` tab from `src/pages/MentorManagementPage.tsx` (redirecting `?tab=payouts` to `/expenses?category=Faculty+%26+Mentor+Payouts` for admins or `/mentor/payouts` for mentors) → Verify: `npx tsc --noEmit` passes.
- [x] Task 2: Add a 1-click `Faculty & Mentor Payouts` filter & URL query support (`?category=...`) in `src/pages/BusinessExpensesPage.tsx` → Verify: Opening `/expenses?category=Faculty+%26+Mentor+Payouts` filters directly to mentor payouts.
- [x] Task 3: Sync `Expense` status changes (Approve, Reject, Disburse, Delete) in `src/context/CRMContext.tsx` and `server/server.ts` back to `payoutRequests` and `mentor.paidPayout` / `mentor.pendingPayout` → Verify: Disbursing a mentor expense in `/expenses` updates the mentor's `Disbursed to Date` & `Available` balance.
- [x] Task 4: Run `npx tsc --noEmit && npm run build` locally → Verify: 0 TypeScript or build errors.

## Done When
- [x] All mentor payout requests are managed and disbursed in **Expense & Budget** (`/expenses`) with zero duplicate tab in Faculty Overview.
- [x] Mentor balances and payout voucher statuses update automatically when disbursed from **Expense & Budget**.
