import { describe, expect, it } from 'vitest';
import {
  answerForensicQuestion,
  parseBankStatementCsv,
  parseBankStatementText,
  runFullFinancialAudit,
} from './financialAuditEngine.js';

describe('5-Layer AI Financial Audit Engine', () => {
  const createBaseDb = () => ({
    courses: [
      { id: 'c1', code: 'FS-101', title: 'Full Stack Engineering', tuitionFee: 450000 },
    ],
    students: [
      {
        id: 's1',
        name: 'Ada Obi',
        email: 'ada@example.com',
        program: 'Full Stack Engineering',
        totalFees: 300000, // ₦150k below catalog price
        paidAmount: 300000,
        mentorId: 'm1',
        mentorName: 'Tunde Mentor',
      },
    ],
    mentors: [
      { id: 'm1', name: 'Tunde Mentor', paidPayout: 111000 },
    ],
    mentorCohortLedgers: [
      {
        id: 'l1',
        cohortName: 'Cohort 1',
        courseName: 'Full Stack Engineering',
        mentorId: 'm1',
        mentorName: 'Tunde Mentor',
        commissionRate: 0.37,
        agreedAmountDue: 111000,
        amountDisbursed: 111000,
        historicalStudentPaid: 0,
      },
    ],
    invoices: [],
    payoutRequests: [
      { id: 'pr1', mentorId: 'm1', amount: 111000, status: 'Disbursed' },
    ],
    expenses: [
      {
        id: 'e1',
        expenseCode: 'EXP-001',
        title: 'Office Internet',
        amount: 50000,
        status: 'Paid',
        vendor: 'Starlink NG',
        isDisbursedViaWallet: true,
        transferReference: 'REF-NET-01',
      },
    ],
    wallet: {
      balance: 80000,
      paystackLiveBalance: 80000,
      transactions: [
        {
          id: 'wt1',
          type: 'credit',
          amount: 200000, // ₦100k less than CRM ₦300k recorded!
          reference: 'PSK-ADA-01',
          description: 'Student Payment Ada Obi',
        },
        {
          id: 'wt2',
          type: 'debit',
          amount: 120000,
          reference: 'UNAUTH-99',
          description: 'Unknown Transfer Out',
        },
      ],
    },
    companyBankSnapshots: [
      {
        id: 'bank-1',
        bankName: 'GTBank',
        accountNumber: '0123456789',
        accountName: 'Educate Ops',
        closingBalance: 20000,
        asOfDate: '2026-11-23',
        recordedBy: 'Super Admin',
        updatedAt: '2026-11-23T10:00:00Z',
      },
    ],
    bankStatementTransactions: [],
    financialAuditConfig: {
      varianceToleranceNaira: 100,
      approvedDiscounts: [],
    },
  });

  it('detects discrepancies across all 5 layers and computes exact Master Cash Gap', () => {
    const db = createBaseDb();
    const { scan, findings } = runFullFinancialAudit(db, 'Unit Test');
    const ruleCodes = findings.map((f: any) => f.ruleCode);

    // Layer 1: Course price variance (₦300k vs ₦450k catalog)
    expect(ruleCodes).toContain('COURSE_PRICE_VARIANCE');
    // Layer 2: Unmatched CRM deposit (₦300k CRM vs ₦200k wallet inflow)
    expect(ruleCodes).toContain('UNMATCHED_CRM_DEPOSIT');
    // Layer 4: Paid expense without matching outflow + unvouchered debit
    expect(ruleCodes).toContain('EXPENSE_WITHOUT_OUTFLOW');
    expect(ruleCodes).toContain('UNVOUCHERED_WALLET_DEBIT');
    // Layer 5: Master Cash Discrepancy
    // Expected Net = 300,000 - 111,000 (mentor) - 50,000 (OpEx) = 139,000
    // Actual Cash  = 80,000 (Paystack) + 20,000 (GTBank) = 100,000
    // Gap          = 100,000 - 139,000 = -39,000
    expect(ruleCodes).toContain('COMPANY_CASH_DISCREPANCY');
    expect(scan.moneyFlow.expectedNetCashPosition).toBe(139000);
    expect(scan.moneyFlow.actualCompanyCashTotal).toBe(100000);
    expect(scan.moneyFlow.cashReconciliationGap).toBe(-39000);
  });

  it('exempts approved tuition discounts from Layer 1 COURSE_PRICE_VARIANCE', () => {
    const db = createBaseDb();
    db.financialAuditConfig.approvedDiscounts.push({
      id: 'disc-1',
      studentId: 's1',
      studentName: 'Ada Obi',
      courseTitle: 'Full Stack Engineering',
      catalogFee: 450000,
      approvedFee: 300000,
      reason: 'Merit Scholarship',
      approvedBy: 'Super Admin',
      approvedAt: '2026-11-23T10:00:00Z',
    });

    const { findings } = runFullFinancialAudit(db, 'Unit Test');
    const priceFindings = findings.filter((f: any) => f.ruleCode === 'COURSE_PRICE_VARIANCE' && f.status !== 'Resolved');
    expect(priceFindings.length).toBe(0);
  });

  it('detects double-counted mentor payouts across expenses', () => {
    const db = createBaseDb();
    db.expenses.push(
      {
        id: 'e-m1',
        expenseCode: 'EXP-M1',
        title: 'Mentor Payout 1',
        amount: 111000,
        status: 'Paid',
        vendor: 'Tunde Mentor',
        mentorId: 'm1',
        mentorName: 'Tunde Mentor',
        payoutRequestId: 'pr1',
        isDisbursedViaWallet: true,
        transferReference: 'REF-M1',
      },
      {
        id: 'e-m2',
        expenseCode: 'EXP-M2',
        title: 'Mentor Payout Duplicate',
        amount: 111000,
        status: 'Paid',
        vendor: 'Tunde Mentor',
        mentorId: 'm1',
        mentorName: 'Tunde Mentor',
        payoutRequestId: 'pr1',
        isDisbursedViaWallet: true,
        transferReference: 'REF-M2',
      }
    );

    const { findings } = runFullFinancialAudit(db, 'Unit Test');
    expect(findings.some((f: any) => f.ruleCode === 'DOUBLE_COUNTED_MENTOR_PAYOUT')).toBe(true);
  });

  it('parses Nigerian bank statement CSVs and deduplicates re-imports', () => {
    const csv = [
      'Date,Narration,Reference,Debit,Credit,Balance',
      '2026-11-20,Tuition Transfer - Ada Obi,NIP99210,,300000,500000',
      '2026-11-21,Office Internet Starlink,REF-NET-01,50000,,450000',
    ].join('\n');

    const first = parseBankStatementCsv(csv, 'bank-1', 'GTBank', []);
    expect(first.transactions.length).toBe(2);
    expect(first.totalCredits).toBe(300000);
    expect(first.totalDebits).toBe(50000);
    expect(first.detectedClosingBalance).toBe(450000);

    const second = parseBankStatementCsv(csv, 'bank-1', 'GTBank', first.transactions);
    expect(second.transactions.length).toBe(0);
    expect(second.skippedDuplicates).toBe(2);
  });

  it('answers forensic questions deterministically with structured briefing sections and follow-ups', async () => {
    const db = createBaseDb();
    runFullFinancialAudit(db, 'Unit Test');
    const res = await answerForensicQuestion(db, 'Why is company cash different from recorded balance?');
    expect(res.mode).toBe('deterministic');
    expect(res.verdict).toContain('shortfall of ₦39,000');
    expect(res.sections.length).toBeGreaterThan(0);
    expect(res.highlights.length).toBeGreaterThan(0);
    expect(res.followUpPrompts.length).toBeGreaterThan(0);
  });

  it('smart-matches bank credits by reversed name tokens, course keywords, and ±7-day payment date while preserving manual links', () => {
    const db: any = createBaseDb();
    db.students.push({
      id: 's2',
      name: 'Munirah Onize Obansa',
      email: 'munirah@example.com',
      program: 'Cyber Security',
      totalFees: 225000,
      paidAmount: 50000,
      installments: [{ id: 'inst-1', amount: 50000, paidAt: '2026-07-15T10:00:00.000Z' }],
      mentorId: 'm1',
      mentorName: 'Tunde Mentor',
    });
    db.bankStatementTransactions = [
      {
        id: 'bt-smart-1',
        bankAccountId: 'bank-1',
        bankName: 'FCMB',
        date: '2026-07-16T00:00:00.000Z',
        description: 'NIP FRM OBANSA MUNIRAH ONIZE - cyber security part payment',
        reference: 'NIP-7788',
        type: 'credit',
        amount: 50000,
      },
      {
        id: 'bt-manual-1',
        bankAccountId: 'bank-1',
        bankName: 'FCMB',
        date: '2026-07-20T00:00:00.000Z',
        description: 'NIP FRM THIRD PARTY SPONSOR',
        reference: 'NIP-9911',
        type: 'credit',
        amount: 100000,
        matchedEntityType: 'student',
        matchedEntityId: 's1',
        matchedEntityName: 'Ada Obi',
        matchConfidence: 'Manual',
        matchReason: 'Manual Link by Super Admin',
      },
    ];

    runFullFinancialAudit(db, 'Smart Match Test');

    const autoTx = db.bankStatementTransactions.find((t: any) => t.id === 'bt-smart-1');
    expect(autoTx.matchedEntityType).toBe('student');
    expect(autoTx.matchedEntityId).toBe('s2');
    expect(autoTx.matchConfidence).toBe('High');
    expect(autoTx.matchReason).toContain('Name Tokens');
    expect(autoTx.matchReason).toContain('Course');
    expect(autoTx.matchReason).toContain('Date');

    const manualTx = db.bankStatementTransactions.find((t: any) => t.id === 'bt-manual-1');
    expect(manualTx.matchedEntityId).toBe('s1');
    expect(manualTx.matchConfidence).toBe('Manual');
  });

  it('parses FCMB PDF statement text with running-balance debit/credit verification and bank-fee tagging', () => {
    const sampleFcmbText = [
      'STATEMENT OF ACCOUNT',
      'CUSTOMER NAME CODELAB EDUCARE LIMITED START DATE 01-Jan-2026',
      'ACCOUNT NUMBER 2002888281 END DATE 23-Nov-2026',
      'ACCOUNT TYPE CORPORATE CURRENT ACCOUNT NGN OPENING BALANCE 2,998.46',
      'ADDRESS N/A CLOSING BALANCE 294,710.15',
      'TXN DATE VAL DATE REMARKS DEBIT CREDIT BALANCE',
      '- - Opening Balance 2,998.46',
      '06-Jan-2026 06-Jan-2026 COP FRM GODSPOWER NDUKE JOHN 250,000.00 252,998.46',
      '06-Jan-2026 06-Jan-2026 EMT LEVY HOLD ON ACCOUNT ON 06-JAN-202 50.00 252,948.46',
      '07-Jan-2026 07-Jan-2026 NIP FRM HARUNA AMOS OLOBO-MOBUTOCODELA 700,000.00 952,948.46',
      '07-Jan-2026 07-Jan-2026 TRANSACTION CHARGE-web:App13th month',
      's 53.75 952,894.71',
      '07-Jan-2026 07-Jan-2026 web:App13th month salary To EcoBank um 140,000.00 812,894.71',
      'TOTAL DEBIT 4,283,954.06',
      'TOTAL CREDIT 4,575,665.75',
      'customerservice@FCMB.com',
    ].join('\n');

    const parsed = parseBankStatementText(sampleFcmbText, 'bank-fcmb', 'Fallback', []);
    expect(parsed.detectedMetadata.bankName).toBe('FCMB');
    expect(parsed.detectedMetadata.accountNumber).toBe('2002888281');
    expect(parsed.detectedMetadata.accountName).toBe('CODELAB EDUCARE LIMITED');
    expect(parsed.detectedMetadata.openingBalance).toBe(2998.46);
    expect(parsed.detectedMetadata.closingBalance).toBe(294710.15);

    expect(parsed.transactions.length).toBe(5);
    expect(parsed.transactions[0].type).toBe('credit');
    expect(parsed.transactions[0].amount).toBe(250000);
    expect(parsed.transactions[1].type).toBe('debit');
    expect(parsed.transactions[1].matchedEntityType).toBe('bank_charge');
    expect(parsed.transactions[2].type).toBe('credit');
    expect(parsed.transactions[2].amount).toBe(700000);
    expect(parsed.transactions[3].type).toBe('debit');
    expect(parsed.transactions[3].matchedEntityType).toBe('bank_charge');
    expect(parsed.transactions[4].type).toBe('debit');
    expect(parsed.transactions[4].amount).toBe(140000);
    expect(parsed.transactions[4].matchedEntityType).toBeNull();

    expect(parsed.totalCredits).toBe(950000);
    expect(parsed.totalDebits).toBe(140103.75);
    expect(parsed.bankChargesCount).toBe(2);
    expect(parsed.bankChargesTotal).toBe(103.75);

    // Deduplication check on re-import
    const second = parseBankStatementText(sampleFcmbText, 'bank-fcmb', 'FCMB', parsed.transactions);
    expect(second.transactions.length).toBe(0);
    expect(second.skippedDuplicates).toBe(5);
  });
});
