// 5-Layer ERP Financial Audit Engine, Nigerian Bank CSV Parser & Forensic Q&A
// Deterministic Naira accounting math with optional Gemini narrative enhancement.

export const normalizeMatchText = (value?: string | null): string =>
  String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export const formatNairaServer = (amount: number): string =>
  `₦${Math.round(Number(amount || 0)).toLocaleString()}`;

export const ensureAuditCollections = (db: any) => {
  if (!Array.isArray(db.financialAuditFindings)) db.financialAuditFindings = [];
  if (!Array.isArray(db.financialAuditScans)) db.financialAuditScans = [];
  if (!Array.isArray(db.mentorCohortLedgers)) db.mentorCohortLedgers = [];
  if (!Array.isArray(db.companyBankSnapshots)) db.companyBankSnapshots = [];
  if (!Array.isArray(db.bankStatementTransactions)) db.bankStatementTransactions = [];
  if (!Array.isArray(db.auditInvestigations)) db.auditInvestigations = [];
  if (!Array.isArray(db.financialAuditReports)) db.financialAuditReports = [];
  if (!db.financialAuditConfig || typeof db.financialAuditConfig !== 'object') {
    db.financialAuditConfig = {
      varianceToleranceNaira: 100,
      approvedDiscounts: [],
    };
  }
  if (typeof db.financialAuditConfig.varianceToleranceNaira !== 'number' || db.financialAuditConfig.varianceToleranceNaira < 0) {
    db.financialAuditConfig.varianceToleranceNaira = 100;
  }
  if (!Array.isArray(db.financialAuditConfig.approvedDiscounts)) {
    db.financialAuditConfig.approvedDiscounts = [];
  }
};

const parseAmountValue = (raw: string): number => {
  const cleaned = String(raw || '')
    .replace(/[₦NGNngn,\s"]/g, '')
    .replace(/^\((.*)\)$/, '-$1')
    .trim();
  if (!cleaned || cleaned === '-' || cleaned === '--') return 0;
  const num = Number(cleaned);
  return Number.isFinite(num) ? Math.abs(num) : 0;
};

const splitCsvLine = (line: string): string[] => {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
};

export interface ParsedBankCsvResult {
  transactions: any[];
  skippedDuplicates: number;
  totalCredits: number;
  totalDebits: number;
  detectedClosingBalance?: number;
}

export const parseBankStatementCsv = (
  csvText: string,
  bankAccountId: string,
  bankName: string,
  existingTransactions: any[] = []
): ParsedBankCsvResult => {
  const lines = String(csvText || '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    return { transactions: [], skippedDuplicates: 0, totalCredits: 0, totalDebits: 0 };
  }

  const headers = splitCsvLine(lines[0]).map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ''));

  const findCol = (candidates: string[]) =>
    headers.findIndex((h) => candidates.some((c) => h === c || h.includes(c)));

  const dateIdx = findCol(['date', 'transdate', 'valuedate', 'transactiondate', 'posteddate']);
  const descIdx = findCol(['narration', 'description', 'remarks', 'details', 'particulars', 'memo']);
  const refIdx = findCol(['reference', 'ref', 'sessionid', 'transid', 'transactionid', 'trxref']);
  const debitIdx = findCol(['debit', 'withdrawal', 'dr', 'outflow', 'debitamount']);
  const creditIdx = findCol(['credit', 'deposit', 'cr', 'inflow', 'creditamount']);
  const amountIdx = findCol(['amount', 'value']);
  const typeIdx = findCol(['type', 'drcr', 'direction']);
  const balanceIdx = findCol(['balance', 'runningbalance', 'closingbalance', 'bal']);

  const existingKeys = new Set<string>(
    existingTransactions.map(
      (t) => `${t.bankAccountId}|${String(t.date).slice(0, 10)}|${t.type}|${Math.round(Number(t.amount || 0))}|${normalizeMatchText(t.reference || t.description)}`
    )
  );

  const nowIso = new Date().toISOString();
  const transactions: any[] = [];
  let skippedDuplicates = 0;
  let totalCredits = 0;
  let totalDebits = 0;
  let detectedClosingBalance: number | undefined;

  for (let i = 1; i < lines.length; i++) {
    const cols = splitCsvLine(lines[i]);
    if (cols.length < 2) continue;

    const rawDate = dateIdx >= 0 ? cols[dateIdx] : cols[0];
    const description = descIdx >= 0 ? cols[descIdx] : cols[1] || 'Bank Statement Entry';
    const reference =
      refIdx >= 0 && cols[refIdx]
        ? cols[refIdx]
        : `CSV-${bankAccountId.slice(-4)}-${i}-${Math.abs(description.length * 31 + i)}`;

    let type: 'credit' | 'debit' | null = null;
    let amount = 0;

    const debitVal = debitIdx >= 0 ? parseAmountValue(cols[debitIdx]) : 0;
    const creditVal = creditIdx >= 0 ? parseAmountValue(cols[creditIdx]) : 0;

    if (creditVal > 0 && debitVal === 0) {
      type = 'credit';
      amount = creditVal;
    } else if (debitVal > 0 && creditVal === 0) {
      type = 'debit';
      amount = debitVal;
    } else if (amountIdx >= 0) {
      const rawAmtStr = String(cols[amountIdx] || '').trim();
      const isNegative = rawAmtStr.startsWith('-') || rawAmtStr.startsWith('(');
      amount = parseAmountValue(rawAmtStr);
      const rawType = typeIdx >= 0 ? String(cols[typeIdx] || '').toLowerCase() : '';
      if (rawType.includes('cr') || rawType.includes('credit') || rawType.includes('in')) {
        type = 'credit';
      } else if (rawType.includes('dr') || rawType.includes('debit') || rawType.includes('out') || isNegative) {
        type = 'debit';
      } else if (amount > 0) {
        type = 'credit';
      }
    }

    if (!type || amount <= 0) continue;

    const balanceAfter = balanceIdx >= 0 && cols[balanceIdx] ? parseAmountValue(cols[balanceIdx]) : undefined;
    if (balanceAfter !== undefined && balanceAfter >= 0) {
      detectedClosingBalance = balanceAfter;
    }

    const parsedDate = (() => {
      const d = new Date(rawDate);
      if (!Number.isNaN(d.getTime())) return d.toISOString();
      return rawDate || nowIso;
    })();

    const dedupeKey = `${bankAccountId}|${String(parsedDate).slice(0, 10)}|${type}|${Math.round(amount)}|${normalizeMatchText(reference || description)}`;
    if (existingKeys.has(dedupeKey)) {
      skippedDuplicates++;
      continue;
    }
    existingKeys.add(dedupeKey);

    if (type === 'credit') totalCredits += amount;
    else totalDebits += amount;

    const isBankCharge = type === 'debit' && isNigerianBankCharge(description);
    transactions.push({
      id: `bst-${Date.now()}-${i}-${Math.floor(100 + Math.random() * 900)}`,
      bankAccountId,
      bankName,
      date: parsedDate,
      description,
      reference,
      type,
      amount,
      balanceAfter,
      matchedEntityType: isBankCharge ? 'bank_charge' : null,
      matchedEntityId: isBankCharge ? 'bank-fee' : null,
      matchedEntityName: isBankCharge ? 'Bank Fee / Levy / Stamp Duty' : null,
      importedAt: nowIso,
    });
  }

  return {
    transactions,
    skippedDuplicates,
    totalCredits,
    totalDebits,
    detectedClosingBalance,
  };
};

// ===========================================================================
// Nigerian Bank Charge Detection & PDF Bank Statement Parser
// ===========================================================================
export const isNigerianBankCharge = (description?: string | null): boolean => {
  const norm = normalizeMatchText(description);
  if (!norm) return false;
  return (
    norm.includes('stamp duty') ||
    norm.includes('emt levy') ||
    norm.includes('transaction charge') ||
    norm.includes('sms alert') ||
    norm.includes('sms charge') ||
    norm.includes('maint fee') ||
    norm.includes('maintenance fee') ||
    norm.includes('vat on maint') ||
    norm.includes('authentication code charge') ||
    norm.includes('transfer fee') ||
    norm.includes('nip charge') ||
    norm.includes('card maintenance') ||
    norm.includes('electronic money transfer levy')
  );
};

export interface DetectedBankStatementMetadata {
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
  startDate?: string;
  endDate?: string;
  openingBalance?: number;
  closingBalance?: number;
  reportedTotalDebit?: number;
  reportedTotalCredit?: number;
}

export interface ParsedBankPdfResult extends ParsedBankCsvResult {
  bankChargesTotal: number;
  bankChargesCount: number;
  detectedMetadata: DetectedBankStatementMetadata;
}

const detectBankNameFromText = (text: string): string | undefined => {
  const upper = text.toUpperCase();
  if (upper.includes('FCMB') || upper.includes('FIRST CITY MONUMENT')) return 'FCMB';
  if (upper.includes('GTBANK') || upper.includes('GUARANTY TRUST')) return 'Guaranty Trust Bank (GTBank)';
  if (upper.includes('ZENITH BANK')) return 'Zenith Bank';
  if (upper.includes('ACCESS BANK')) return 'Access Bank';
  if (upper.includes('UNITED BANK FOR AFRICA') || /\bUBA\b/.test(upper)) return 'United Bank for Africa (UBA)';
  if (upper.includes('FIRST BANK OF NIGERIA') || upper.includes('FIRSTBANK')) return 'First Bank of Nigeria';
  if (upper.includes('WEMA BANK') || upper.includes('ALAT BY WEMA')) return 'Wema Bank';
  if (upper.includes('MONIEPOINT')) return 'Moniepoint MFB';
  if (upper.includes('PROVIDUS BANK')) return 'Providus Bank';
  if (upper.includes('STANBIC IBTC')) return 'Stanbic IBTC Bank';
  if (upper.includes('FIDELITY BANK')) return 'Fidelity Bank';
  if (upper.includes('STERLING BANK')) return 'Sterling Bank';
  if (upper.includes('POLARIS BANK')) return 'Polaris Bank';
  if (upper.includes('KUDA')) return 'Kuda MFB';
  return undefined;
};

const parseStrictDecimal = (str: string): number => {
  const cleaned = str.replace(/,/g, '').trim();
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : NaN;
};

const parseStatementDateToIso = (raw: string): string => {
  // Handle DD-Mon-YYYY (e.g. 06-Jan-2026) or DD/MM/YYYY or YYYY-MM-DD
  const trimmed = raw.trim();
  const dmySlash = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (dmySlash) {
    const iso = `${dmySlash[3]}-${dmySlash[2]}-${dmySlash[1]}T00:00:00.000Z`;
    const dt = new Date(iso);
    if (!Number.isNaN(dt.getTime())) return dt.toISOString();
  }
  const dt = new Date(trimmed);
  if (!Number.isNaN(dt.getTime())) return dt.toISOString();
  return new Date().toISOString();
};

export const extractPdfText = async (pdfBuffer: Buffer): Promise<string> => {
  const pdfjsLib: any = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const uint8 = new Uint8Array(pdfBuffer);
  const loadingTask = pdfjsLib.getDocument({
    data: uint8,
    useSystemFonts: true,
    disableFontFace: true,
  });
  const doc = await loadingTask.promise;
  const pageTexts: string[] = [];

  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const content = await page.getTextContent();
    const items: Array<{ str: string; x: number; y: number }> = [];

    for (const item of content.items as any[]) {
      if (!item || typeof item.str !== 'string') continue;
      const str = item.str.trim();
      if (!str) continue;
      const transform = item.transform || [1, 0, 0, 1, 0, 0];
      items.push({ str, x: Number(transform[4] || 0), y: Number(transform[5] || 0) });
    }

    // Group items by Y coordinate (within 3pt tolerance) sorted top-to-bottom, left-to-right
    items.sort((a, b) => {
      if (Math.abs(b.y - a.y) > 3) return b.y - a.y;
      return a.x - b.x;
    });

    const lines: string[] = [];
    let currentY: number | null = null;
    let currentLine: string[] = [];

    for (const it of items) {
      if (currentY === null || Math.abs(it.y - currentY) <= 3) {
        currentLine.push(it.str);
        if (currentY === null) currentY = it.y;
      } else {
        lines.push(currentLine.join(' '));
        currentLine = [it.str];
        currentY = it.y;
      }
    }
    if (currentLine.length > 0) {
      lines.push(currentLine.join(' '));
    }

    pageTexts.push(lines.join('\n'));
  }

  return pageTexts.join('\n');
};

export const parseBankStatementText = (
  rawText: string,
  bankAccountId: string,
  fallbackBankName: string,
  existingTransactions: any[] = []
): ParsedBankPdfResult => {
  const cleanText = String(rawText || '').replace(/\uFFFD/g, '-').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const rawLines = cleanText.split('\n').map((l) => l.trim()).filter(Boolean);

  // 1. Extract Header & Footer Metadata
  const metadata: DetectedBankStatementMetadata = {};
  metadata.bankName = detectBankNameFromText(cleanText) || fallbackBankName;

  const acctMatch = cleanText.match(/ACCOUNT\s+NUMBER\s*[:\-]?\s*(\d{10})/i);
  if (acctMatch) metadata.accountNumber = acctMatch[1];

  const custMatch = cleanText.match(/CUSTOMER\s+NAME\s*[:\-]?\s*([A-Z0-9 &.,'-]+?)(?=\s+START\s+DATE|\s+ACCOUNT|\n|$)/i);
  if (custMatch) metadata.accountName = custMatch[1].trim();

  const startMatch = cleanText.match(/START\s+DATE\s*[:\-]?\s*(\d{1,2}-[A-Za-z]{3}-\d{4}|\d{2}\/\d{2}\/\d{4}|\d{4}-\d{2}-\d{2})/i);
  if (startMatch) metadata.startDate = startMatch[1];

  const endMatch = cleanText.match(/END\s+DATE\s*[:\-]?\s*(\d{1,2}-[A-Za-z]{3}-\d{4}|\d{2}\/\d{2}\/\d{4}|\d{4}-\d{2}-\d{2})/i);
  if (endMatch) metadata.endDate = endMatch[1];

  const openBalMatch = cleanText.match(/OPENING\s+BALANCE\s*[:\-]?\s*(?:NGN|₦)?\s*([\d,]+\.\d{2})/i);
  if (openBalMatch) metadata.openingBalance = parseStrictDecimal(openBalMatch[1]);

  const closeBalMatch = cleanText.match(/CLOSING\s+BALANCE\s*[:\-]?\s*(?:NGN|₦)?\s*([\d,]+\.\d{2})/i);
  if (closeBalMatch) metadata.closingBalance = parseStrictDecimal(closeBalMatch[1]);

  const totDebitMatch = cleanText.match(/TOTAL\s+DEBIT\s*[:\-]?\s*(?:NGN|₦)?\s*([\d,]+\.\d{2})/i);
  if (totDebitMatch) metadata.reportedTotalDebit = parseStrictDecimal(totDebitMatch[1]);

  const totCreditMatch = cleanText.match(/TOTAL\s+CREDIT\s*[:\-]?\s*(?:NGN|₦)?\s*([\d,]+\.\d{2})/i);
  if (totCreditMatch) metadata.reportedTotalCredit = parseStrictDecimal(totCreditMatch[1]);

  // 2. Stitch multi-line transaction rows anchored by a leading date
  const DATE_START_RE = /^(\d{1,2}-[A-Za-z]{3}-\d{4}|\d{2}\/\d{2}\/\d{4}|\d{4}-\d{2}-\d{2})\b/;
  const STOP_LINE_RE = /^(TOTAL\s+DEBIT|TOTAL\s+CREDIT|DEBIT\s+COUNT|CREDIT\s+COUNT|DISCLAIMER|TXN\s+DATE|STATEMENT\s+OF\s+ACCOUNT)/i;

  const stitchedRows: string[] = [];
  let activeRow = '';
  let inTable = false;

  for (const line of rawLines) {
    if (STOP_LINE_RE.test(line)) {
      if (activeRow) {
        stitchedRows.push(activeRow);
        activeRow = '';
      }
      if (/^TXN\s+DATE/i.test(line)) inTable = true;
      continue;
    }
    if (/Opening\s+Balance/i.test(line) && !DATE_START_RE.test(line)) {
      inTable = true;
      const openRowAmt = line.match(/([\d,]+\.\d{2})\s*$/);
      if (openRowAmt && metadata.openingBalance === undefined) {
        metadata.openingBalance = parseStrictDecimal(openRowAmt[1]);
      }
      continue;
    }

    if (DATE_START_RE.test(line)) {
      inTable = true;
      if (activeRow) stitchedRows.push(activeRow);
      activeRow = line;
    } else if (inTable && activeRow) {
      activeRow += ' ' + line;
    }
  }
  if (activeRow) stitchedRows.push(activeRow);

  // 3. Parse each stitched row using exact running-balance delta for Debit vs Credit
  const existingKeys = new Set<string>(
    existingTransactions.map(
      (t) => `${t.bankAccountId}|${String(t.date).slice(0, 10)}|${t.type}|${Math.round(Number(t.amount || 0))}|${normalizeMatchText(t.reference || t.description)}`
    )
  );

  const nowIso = new Date().toISOString();
  const effectiveBankName = metadata.bankName || fallbackBankName;
  const transactions: any[] = [];
  let skippedDuplicates = 0;
  let totalCredits = 0;
  let totalDebits = 0;
  let bankChargesTotal = 0;
  let bankChargesCount = 0;
  let prevBalance: number | undefined = metadata.openingBalance;
  let detectedClosingBalance: number | undefined = metadata.closingBalance;

  const DECIMAL_TOKEN_RE = /(?<!\d)-?[\d,]+\.\d{2}(?!\d)/g;

  for (let i = 0; i < stitchedRows.length; i++) {
    const row = stitchedRows[i];
    const firstDateMatch = row.match(DATE_START_RE);
    if (!firstDateMatch) continue;
    const rawTxnDate = firstDateMatch[1];

    // Strip leading txnDate and optional second valDate
    let rest = row.slice(firstDateMatch[0].length).trim();
    const secondDateMatch = rest.match(DATE_START_RE);
    if (secondDateMatch) {
      rest = rest.slice(secondDateMatch[0].length).trim();
    }

    // Extract monetary numbers with 2 decimal places
    const matches = Array.from(rest.matchAll(DECIMAL_TOKEN_RE));
    if (matches.length < 2) continue;

    const lastMatch = matches[matches.length - 1];
    const amtMatch = matches[matches.length - 2];

    const balanceAfter = parseStrictDecimal(lastMatch[0]);
    const amount = Math.abs(parseStrictDecimal(amtMatch[0]));
    if (!Number.isFinite(amount) || amount <= 0 || !Number.isFinite(balanceAfter)) continue;

    // Everything before the amount token is the Remarks/Description
    const description = rest
      .slice(0, amtMatch.index)
      .replace(/\s+/g, ' ')
      .trim() || 'Bank Statement Entry';

    // Determine Credit vs Debit mathematically from running balance delta
    let type: 'credit' | 'debit' = 'debit';
    if (prevBalance !== undefined) {
      const creditErr = Math.abs(prevBalance + amount - balanceAfter);
      const debitErr = Math.abs(prevBalance - amount - balanceAfter);
      if (creditErr < 0.05 && creditErr <= debitErr) {
        type = 'credit';
      } else if (debitErr < 0.05) {
        type = 'debit';
      } else {
        // Fallback heuristic if a statement row was skipped or out of order
        type = balanceAfter > prevBalance ? 'credit' : 'debit';
      }
    } else {
      const normD = normalizeMatchText(description);
      type =
        normD.startsWith('nip frm') ||
        normD.startsWith('cop frm') ||
        normD.startsWith('trf from') ||
        normD.includes('transfer from')
          ? 'credit'
          : 'debit';
    }

    prevBalance = balanceAfter;
    detectedClosingBalance = balanceAfter;

    // Extract reference token if present (e.g. REF..., PSST..., NIP...)
    const refMatch = description.match(/\b(REF[A-Z0-9]+|PSST[A-Za-z0-9]+|PayStack[A-Za-z0-9]+|NIP[A-Z0-9]{4,})\b/i);
    const reference = refMatch
      ? refMatch[1]
      : `PDF-${(metadata.accountNumber || bankAccountId).slice(-4)}-${i + 1}`;

    const parsedDate = parseStatementDateToIso(rawTxnDate);
    const dedupeKey = `${bankAccountId}|${parsedDate.slice(0, 10)}|${type}|${Math.round(amount)}|${normalizeMatchText(reference || description)}`;
    if (existingKeys.has(dedupeKey)) {
      skippedDuplicates++;
      continue;
    }
    existingKeys.add(dedupeKey);

    const isBankCharge = type === 'debit' && isNigerianBankCharge(description);
    if (type === 'credit') {
      totalCredits += amount;
    } else {
      totalDebits += amount;
      if (isBankCharge) {
        bankChargesTotal += amount;
        bankChargesCount++;
      }
    }

    transactions.push({
      id: `bst-pdf-${Date.now()}-${i}-${Math.floor(100 + Math.random() * 900)}`,
      bankAccountId,
      bankName: effectiveBankName,
      date: parsedDate,
      description,
      reference,
      type,
      amount,
      balanceAfter,
      matchedEntityType: isBankCharge ? 'bank_charge' : null,
      matchedEntityId: isBankCharge ? 'bank-fee' : null,
      matchedEntityName: isBankCharge ? 'Bank Fee / Levy / Stamp Duty' : null,
      importedAt: nowIso,
    });
  }

  return {
    transactions,
    skippedDuplicates,
    totalCredits: Math.round(totalCredits * 100) / 100,
    totalDebits: Math.round(totalDebits * 100) / 100,
    bankChargesTotal: Math.round(bankChargesTotal * 100) / 100,
    bankChargesCount,
    detectedClosingBalance: metadata.closingBalance ?? detectedClosingBalance,
    detectedMetadata: metadata,
  };
};

export const runFullFinancialAudit = (db: any, triggeredBy: string) => {
  ensureAuditCollections(db);

  const nowIso = new Date().toISOString();
  const config = db.financialAuditConfig;
  const tolerance = Number(config.varianceToleranceNaira ?? 100);
  const approvedDiscounts: any[] = Array.isArray(config.approvedDiscounts) ? config.approvedDiscounts : [];

  const realStudents = (db.students || []).filter((s: any) => !String(s.email || '').includes('.qa.'));
  const courses = db.courses || [];
  const ledgers = db.mentorCohortLedgers || [];
  const invoices = db.invoices || [];
  const payouts = db.payoutRequests || [];
  const mentors = db.mentors || [];
  const expenses = db.expenses || [];
  const wallet = db.wallet || { balance: 0, transactions: [], paystackLiveBalance: 0 };
  const walletTxns: any[] = Array.isArray(wallet.transactions) ? wallet.transactions : [];
  const bankSnapshots: any[] = db.companyBankSnapshots || [];
  const bankTxns: any[] = db.bankStatementTransactions || [];

  const detected: any[] = [];
  const pushFinding = (f: any) => {
    detected.push({
      ...f,
      firstDetectedAt: nowIso,
      lastDetectedAt: nowIso,
    });
  };

  // Helper to match a student program to a CourseProgram catalog item
  const findCatalogCourse = (programName?: string) => {
    const normProg = normalizeMatchText(programName);
    if (!normProg) return null;
    return (
      courses.find((c: any) => normalizeMatchText(c.title) === normProg || normalizeMatchText(c.code) === normProg) ||
      courses.find((c: any) => {
        const ct = normalizeMatchText(c.title);
        return ct && (normProg.includes(ct) || ct.includes(normProg));
      }) ||
      null
    );
  };

  // =========================================================================
  // LAYER 1: Course Catalog Pricing vs. Student Tuition Billed & Paid
  // =========================================================================
  let totalCatalogTuitionValue = 0;
  let coursePriceVarianceTotal = 0;

  for (const s of realStudents) {
    const fees = Number(s.totalFees || 0);
    const paid = Number(s.paidAmount || 0);

    // Rule 1A: Abnormal tuition outlier (> ₦1.5M) or overpaid tuition
    if (fees > 1500000 || paid > 1500000) {
      pushFinding({
        fingerprint: `TUITION_OUTLIER:${s.id}`,
        ruleCode: 'TUITION_OUTLIER',
        layer: 1,
        severity: 'Critical',
        title: `Abnormal Tuition/Deposit Amount for ${s.name}`,
        aiDiagnosis: `${s.name} (${s.program || 'Unknown Track'}) has totalFees ${formatNairaServer(fees)} and paidAmount ${formatNairaServer(paid)}, exceeding the ₦1.5M single-course threshold. This often indicates an extra-zero data entry typo.`,
        recommendedAction: `Verify bank receipt for ${s.name} and correct totalFees / paidAmount in Students.`,
        entityType: 'student',
        entityId: s.id,
        entityName: s.name,
        expectedAmount: 450000,
        actualAmount: Math.max(fees, paid),
        deltaAmount: Math.max(fees, paid) - 450000,
      });
    } else if (fees > 0 && paid > fees + tolerance) {
      pushFinding({
        fingerprint: `OVERPAID_TUITION:${s.id}`,
        ruleCode: 'TUITION_OUTLIER',
        layer: 1,
        severity: 'Warning',
        title: `Student Paid Exceeds Total Tuition (${s.name})`,
        aiDiagnosis: `${s.name} shows paidAmount ${formatNairaServer(paid)} > totalFees ${formatNairaServer(fees)}.`,
        recommendedAction: `Reconcile ${s.name}'s duplicate deposit or update totalFees.`,
        entityType: 'student',
        entityId: s.id,
        entityName: s.name,
        expectedAmount: fees,
        actualAmount: paid,
        deltaAmount: paid - fees,
      });
    }

    // Rule 1B: Course Catalog Price Variance (with approved scholarship/discount exemptions)
    const catalogCourse = findCatalogCourse(s.program);
    if (catalogCourse && Number(catalogCourse.tuitionFee || 0) > 0) {
      const catalogFee = Number(catalogCourse.tuitionFee);
      totalCatalogTuitionValue += catalogFee;
      const variance = fees - catalogFee;
      if (Math.abs(variance) > tolerance && fees <= 1500000) {
        const hasExemption = approvedDiscounts.some(
          (d: any) => d.studentId === s.id && (Number(d.approvedFee) === fees || d.approvedFee === undefined)
        );
        if (!hasExemption) {
          coursePriceVarianceTotal += Math.abs(variance);
          const pctDiff = Math.abs(variance) / catalogFee;
          pushFinding({
            fingerprint: `COURSE_PRICE_VARIANCE:${s.id}`,
            ruleCode: 'COURSE_PRICE_VARIANCE',
            layer: 1,
            severity: pctDiff >= 0.3 ? 'Critical' : 'Warning',
            title: `Price Difference: ${s.name} (${catalogCourse.title})`,
            aiDiagnosis: `${s.name} is billed ${formatNairaServer(fees)} for ${catalogCourse.title}, whereas the official catalog tuition is ${formatNairaServer(catalogFee)} (variance ${variance >= 0 ? '+' : ''}${formatNairaServer(variance)}). No approved scholarship or discount exemption is on file.`,
            recommendedAction: `Confirm with Admissions/Finance whether this price difference is an approved discount (click "Approve Discount") or correct the student's tuition fee.`,
            entityType: 'student',
            entityId: s.id,
            entityName: s.name,
            expectedAmount: catalogFee,
            actualAmount: fees,
            deltaAmount: variance,
          });
        }
      }
    }

    // Rule 2A (Layer 2): Student Paid vs Linked Invoices Mismatch
    const stuInvoices = invoices.filter((inv: any) => inv.studentId === s.id);
    if (stuInvoices.length > 0) {
      const invPaid = stuInvoices.reduce((sum: number, inv: any) => sum + Number(inv.paidAmount || 0), 0);
      if (Math.abs(paid - invPaid) > tolerance) {
        pushFinding({
          fingerprint: `INVOICE_STUDENT_MISMATCH:${s.id}`,
          ruleCode: 'INVOICE_STUDENT_MISMATCH',
          layer: 2,
          severity: 'Warning',
          title: `Student Paid vs. Invoice Total Mismatch (${s.name})`,
          aiDiagnosis: `${s.name} profile shows paidAmount ${formatNairaServer(paid)}, whereas linked invoices sum to ${formatNairaServer(invPaid)}.`,
          recommendedAction: `Sync ${s.name}'s invoice payment records with student paidAmount.`,
          entityType: 'student',
          entityId: s.id,
          entityName: s.name,
          expectedAmount: invPaid,
          actualAmount: paid,
          deltaAmount: paid - invPaid,
        });
      }
    }

    // Rule 3A (Layer 3): Paid Student Without Mentor Assignment
    if (paid > 0 && !s.mentorId && !String(s.mentorName || '').trim()) {
      pushFinding({
        fingerprint: `PAID_STUDENT_NO_MENTOR:${s.id}`,
        ruleCode: 'PAID_STUDENT_NO_MENTOR',
        layer: 3,
        severity: 'Warning',
        title: `Paid Student Unassigned to Mentor (${s.name})`,
        aiDiagnosis: `${s.name} has paid ${formatNairaServer(paid)} for ${s.program || 'course'}, but has no assigned mentor. 37% commission (${formatNairaServer(Math.round(paid * 0.37))}) cannot be attributed.`,
        recommendedAction: `Assign the course mentor to ${s.name} in Students.`,
        entityType: 'student',
        entityId: s.id,
        entityName: s.name,
        expectedAmount: Math.round(paid * 0.37),
        actualAmount: 0,
        deltaAmount: Math.round(paid * 0.37),
      });
    }
  }

  // =========================================================================
  // LAYER 2: Student Payments vs. Company Account Inflows (Paystack + Bank CSV)
  // =========================================================================
  const walletCredits = walletTxns.filter((t: any) => t.type === 'credit');
  const bankCredits = bankTxns.filter((t: any) => t.type === 'credit');

  // Multi-Signal Auto-Match for imported bank credits (Name tokens + Course keywords + Payment Date ±7d + Amount)
  const STOP_TOKENS = new Set([
    'nip', 'frm', 'cop', 'trf', 'from', 'app', 'web', 'transfer', 'payment', 'part', 'full',
    'balance', 'balanc', 'outward', 'via', 'ref', 'to', 'for', 'the', 'and', 'limited', 'ltd',
    'nigeria', 'mobile', 'bank', 'alat', 'paystack', 'codelab', 'educare', 'fcmb',
  ]);
  const tokenizeForMatch = (text?: string | null) =>
    normalizeMatchText(text)
      .split(' ')
      .filter((tok) => tok.length >= 3 && !STOP_TOKENS.has(tok) && !/^\d+$/.test(tok));

  const parseDateMs = (d?: string | null): number | null => {
    if (!d) return null;
    const ms = new Date(d).getTime();
    return Number.isFinite(ms) ? ms : null;
  };

  for (const bt of bankCredits) {
    // Never overwrite manual Super Admin overrides
    if (bt.matchConfidence === 'Manual' && bt.matchedEntityId) continue;

    const normDesc = normalizeMatchText(`${bt.description} ${bt.reference}`);
    if (
      normDesc.includes('paystack') ||
      normDesc.includes('wallet') ||
      normDesc.includes('settlement') ||
      normDesc.includes('funding')
    ) {
      bt.matchedEntityType = 'wallet_funding';
      bt.matchedEntityId = 'wallet';
      bt.matchedEntityName = 'Company Wallet Settlement / Funding';
      bt.matchConfidence = 'High';
      bt.matchReason = 'Paystack / Wallet Settlement';
      continue;
    }

    const txTokens = new Set(tokenizeForMatch(`${bt.description} ${bt.reference}`));
    const txDateMs = parseDateMs(bt.date);
    const txAmt = Number(bt.amount || 0);

    let bestStudent: any = null;
    let bestScore = 0;
    let bestReasons: string[] = [];

    for (const s of realStudents) {
      let score = 0;
      const reasons: string[] = [];

      const sFull = normalizeMatchText(s.name);
      const sNameTokens = tokenizeForMatch(s.name);
      const matchedNameTokens = sNameTokens.filter(
        (tok) => txTokens.has(tok) || (tok.length >= 4 && normDesc.includes(tok))
      );

      if (sFull.length >= 4 && normDesc.includes(sFull)) {
        score += 60;
        reasons.push('Full Name');
      } else if (matchedNameTokens.length >= 2) {
        score += 50;
        reasons.push('Name Tokens');
      } else if (matchedNameTokens.length === 1 && matchedNameTokens[0].length >= 5) {
        score += 28;
        reasons.push('Partial Name');
      }

      // Course / Program description keyword match (e.g. "full stack", "cyber security", "web", "digital")
      const courseTokens = tokenizeForMatch(s.program);
      const matchedCourseTokens = courseTokens.filter(
        (tok) => tok.length >= 4 && (txTokens.has(tok) || normDesc.includes(tok))
      );
      if (matchedCourseTokens.length > 0) {
        score += 18;
        reasons.push('Course');
      }

      // Payment Date proximity (±7 days against installments, invoices, or enrollment date)
      const stuInvoices = invoices.filter((inv: any) => inv.studentId === s.id);
      const candidateDates: Array<{ ms: number; amount?: number }> = [];
      for (const inst of Array.isArray(s.installments) ? s.installments : []) {
        const ms = parseDateMs(inst.paidAt || inst.paymentDate || inst.dueDate);
        if (ms !== null) candidateDates.push({ ms, amount: Number(inst.amount || 0) });
      }
      for (const inv of stuInvoices) {
        const ms = parseDateMs(inv.date || inv.paidAt);
        if (ms !== null) candidateDates.push({ ms, amount: Number(inv.paidAmount || inv.amount || 0) });
      }
      const enrollMs = parseDateMs(s.enrollmentDate || s.dateAdded || s.createdAt);
      if (enrollMs !== null) candidateDates.push({ ms: enrollMs, amount: Number(s.paidAmount || 0) });

      let dateMatched = false;
      let installmentAmountMatched = false;
      if (txDateMs !== null) {
        const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
        for (const cd of candidateDates) {
          if (Math.abs(txDateMs - cd.ms) <= SEVEN_DAYS_MS) {
            dateMatched = true;
            if (cd.amount && Math.abs(cd.amount - txAmt) <= tolerance) {
              installmentAmountMatched = true;
            }
          }
        }
      }
      if (dateMatched) {
        score += 15;
        reasons.push('Date (±7d)');
      }

      // Amount match (exact installment or total paidAmount)
      if (installmentAmountMatched || (Number(s.paidAmount || 0) > 0 && Math.abs(Number(s.paidAmount) - txAmt) <= tolerance)) {
        score += 20;
        reasons.push('Exact Amount');
      }

      // Require at least a name signal OR (course + date + exact amount) so we don't falsely match random amounts
      const hasNameSignal = matchedNameTokens.length > 0 || (sFull.length >= 4 && normDesc.includes(sFull));
      const qualified = (hasNameSignal && score >= 40) || (!hasNameSignal && dateMatched && installmentAmountMatched && matchedCourseTokens.length > 0);

      if (qualified && score > bestScore) {
        bestScore = score;
        bestStudent = s;
        bestReasons = reasons;
      }
    }

    if (bestStudent) {
      bt.matchedEntityType = 'student';
      bt.matchedEntityId = bestStudent.id;
      bt.matchedEntityName = bestStudent.name;
      bt.matchedCourseName = bestStudent.program || null;
      bt.matchConfidence = bestScore >= 60 ? 'High' : 'Medium';
      bt.matchReason = bestReasons.join(' + ');
    } else if (!bt.matchedEntityId) {
      bt.matchedEntityType = null;
      bt.matchedEntityId = null;
      bt.matchedEntityName = null;
      bt.matchedCourseName = null;
      bt.matchConfidence = null;
      bt.matchReason = null;
    }
  }

  const seenCreditRefs = new Set<string>();
  let totalCompanyInflow = 0;
  for (const t of [...walletCredits, ...bankCredits]) {
    const key = t.reference ? normalizeMatchText(t.reference) : `${t.id}`;
    if (seenCreditRefs.has(key)) continue;
    seenCreditRefs.add(key);
    totalCompanyInflow += Number(t.amount || 0);
  }

  const liveStudentPaidSum = realStudents.reduce((s: number, st: any) => s + Number(st.paidAmount || 0), 0);
  const ledgerHistPaidSum = ledgers.reduce((s: number, l: any) => s + Number(l.historicalStudentPaid || 0), 0);
  const totalStudentPaymentsReceived = Math.max(liveStudentPaidSum, ledgerHistPaidSum);

  // Flag gap between CRM-recorded student deposits and verified Paystack/Bank inflows
  if (totalCompanyInflow > 0 && totalStudentPaymentsReceived - totalCompanyInflow > tolerance) {
    const gap = totalStudentPaymentsReceived - totalCompanyInflow;
    pushFinding({
      fingerprint: `UNMATCHED_CRM_DEPOSIT:GLOBAL`,
      ruleCode: 'UNMATCHED_CRM_DEPOSIT',
      layer: 2,
      severity: gap >= 50000 ? 'Critical' : 'Warning',
      title: `Recorded Student Deposits Exceed Verified Account Inflows`,
      aiDiagnosis: `CRM records ${formatNairaServer(totalStudentPaymentsReceived)} in student tuition payments, while verified Paystack wallet & imported bank credits total ${formatNairaServer(totalCompanyInflow)} (unverified gap: ${formatNairaServer(gap)}).`,
      recommendedAction: `Import missing Nigerian bank statement CSVs in Company Accounts or investigate unverified manual payment entries with Finance/Admissions.`,
      entityType: 'wallet',
      entityId: 'company-inflow',
      entityName: 'Company Account Inflows',
      expectedAmount: totalStudentPaymentsReceived,
      actualAmount: totalCompanyInflow,
      deltaAmount: gap,
    });
  }

  // Flag unattributed imported bank credits (up to top 15 by amount)
  const unattributedCredits = bankCredits
    .filter((bt: any) => !bt.matchedEntityId && Number(bt.amount || 0) > tolerance)
    .sort((a: any, b: any) => Number(b.amount) - Number(a.amount))
    .slice(0, 15);

  for (const bt of unattributedCredits) {
    pushFinding({
      fingerprint: `UNATTRIBUTED_BANK_CREDIT:${bt.id}`,
      ruleCode: 'UNATTRIBUTED_BANK_CREDIT',
      layer: 2,
      severity: Number(bt.amount) >= 100000 ? 'Warning' : 'Info',
      title: `Unattributed Bank Credit (${bt.bankName}: ${formatNairaServer(bt.amount)})`,
      aiDiagnosis: `Bank credit of ${formatNairaServer(bt.amount)} on ${String(bt.date).slice(0, 10)} ("${bt.description}", Ref: ${bt.reference}) could not be matched to any student payment or wallet funding transfer.`,
      recommendedAction: `Query Finance/Admissions to identify the depositor and record the student payment in CRM.`,
      entityType: 'bank',
      entityId: bt.id,
      entityName: `${bt.bankName} — ${bt.reference}`,
      expectedAmount: 0,
      actualAmount: Number(bt.amount),
      deltaAmount: Number(bt.amount),
    });
  }

  // =========================================================================
  // LAYER 3: Mentor 37% Commission, Over-Disbursement & Double-Counting
  // =========================================================================
  for (const ledger of ledgers) {
    const targetCourse = normalizeMatchText(ledger.courseName);
    const targetMentor = normalizeMatchText(ledger.mentorName);
    const matchedStudents = realStudents.filter((s: any) => {
      const mentorMatch = (s.mentorId && s.mentorId === ledger.mentorId) || normalizeMatchText(s.mentorName) === targetMentor;
      if (!mentorMatch) return false;
      const prog = normalizeMatchText(s.program);
      return prog === targetCourse || prog.includes(targetCourse) || targetCourse.includes(prog);
    });
    const livePaid = matchedStudents.reduce((sum: number, s: any) => sum + Number(s.paidAmount || 0), 0);
    const histPaid = Number(ledger.historicalStudentPaid || 0);
    const effectivePaid = Math.max(histPaid, livePaid);
    const calc37 = Math.round(effectivePaid * Number(ledger.commissionRate ?? 0.37));
    const agreedDue = Number(ledger.agreedAmountDue ?? calc37);
    const disbursed = Number(ledger.amountDisbursed || 0);

    if (Math.abs(agreedDue - calc37) > tolerance) {
      pushFinding({
        fingerprint: `COMMISSION_VARIANCE:${ledger.id}`,
        ruleCode: 'COMMISSION_VARIANCE',
        layer: 3,
        severity: Math.abs(agreedDue - calc37) >= 5000 ? 'Warning' : 'Info',
        title: `37% Commission Variance: ${ledger.mentorName} (${ledger.courseName})`,
        aiDiagnosis: `For ${ledger.cohortName} • ${ledger.courseName}, 37% of ${formatNairaServer(effectivePaid)} is ${formatNairaServer(calc37)}, but agreed/recorded due is ${formatNairaServer(agreedDue)} (delta ${formatNairaServer(agreedDue - calc37)}).`,
        recommendedAction: `Confirm manual commission override or adjust Agreed Due in Commission & Backdated Migration.`,
        entityType: 'ledger',
        entityId: ledger.id,
        entityName: `${ledger.mentorName} — ${ledger.courseName}`,
        expectedAmount: calc37,
        actualAmount: agreedDue,
        deltaAmount: agreedDue - calc37,
      });
    }

    if (disbursed > agreedDue + tolerance) {
      pushFinding({
        fingerprint: `OVER_DISBURSEMENT:${ledger.id}`,
        ruleCode: 'OVER_DISBURSEMENT',
        layer: 3,
        severity: 'Critical',
        title: `Over-Disbursement Detected: ${ledger.mentorName} (${ledger.courseName})`,
        aiDiagnosis: `${formatNairaServer(disbursed)} was disbursed against ${formatNairaServer(agreedDue)} commission due (overpaid by ${formatNairaServer(disbursed - agreedDue)}).`,
        recommendedAction: `Audit payout vouchers for ${ledger.mentorName} and offset overpayment against future cohorts.`,
        entityType: 'ledger',
        entityId: ledger.id,
        entityName: `${ledger.mentorName} — ${ledger.courseName}`,
        expectedAmount: agreedDue,
        actualAmount: disbursed,
        deltaAmount: disbursed - agreedDue,
      });
    }

    if (histPaid > 0 && livePaid === 0) {
      pushFinding({
        fingerprint: `UNLINKED_STUDENT_DEPOSITS:${ledger.id}`,
        ruleCode: 'UNLINKED_STUDENT_DEPOSITS',
        layer: 3,
        severity: 'Info',
        title: `Historical Deposits Not Individually Linked (${ledger.cohortName} • ${ledger.courseName})`,
        aiDiagnosis: `Ledger records ${formatNairaServer(histPaid)} collected from ${ledger.studentCount} students, while individual CRM student records show ₦0 paid.`,
        recommendedAction: `Onboard or record individual student deposits in Students to achieve 1:1 receipt traceability.`,
        entityType: 'ledger',
        entityId: ledger.id,
        entityName: `${ledger.mentorName} — ${ledger.courseName}`,
        expectedAmount: histPaid,
        actualAmount: livePaid,
        deltaAmount: histPaid - livePaid,
      });
    }
  }

  for (const m of mentors) {
    const mPaid = Number(m.paidPayout || 0);
    const reqDisbursed = payouts
      .filter((r: any) => r.mentorId === m.id && r.status === 'Disbursed')
      .reduce((sum: number, r: any) => sum + Number(r.amount || 0), 0);
    if ((mPaid > 0 || reqDisbursed > 0) && Math.abs(mPaid - reqDisbursed) > tolerance) {
      pushFinding({
        fingerprint: `PAYOUT_LEDGER_MISMATCH:${m.id}`,
        ruleCode: 'PAYOUT_LEDGER_MISMATCH',
        layer: 3,
        severity: 'Critical',
        title: `Mentor Paid Balance vs. Payout Vouchers Mismatch (${m.name})`,
        aiDiagnosis: `${m.name}'s profile shows paidPayout ${formatNairaServer(mPaid)}, while Disbursed payout vouchers total ${formatNairaServer(reqDisbursed)}.`,
        recommendedAction: `Reconcile ${m.name}'s payout history and sync ledger totals.`,
        entityType: 'mentor',
        entityId: m.id,
        entityName: m.name,
        expectedAmount: reqDisbursed,
        actualAmount: mPaid,
        deltaAmount: mPaid - reqDisbursed,
      });
    }
  }

  // Rule 3B: Detect Double-Counted Mentor Payouts (same payoutRequestId paid in multiple expenses or both direct wallet & expense)
  const paidExpenses = expenses.filter(
    (e: any) => !e.isHistorical && (e.status === 'Paid' || e.status === 'Disbursed' || e.isDisbursedViaWallet)
  );
  const mentorExpensesByPayoutId = new Map<string, any[]>();
  for (const exp of paidExpenses) {
    if (exp.payoutRequestId) {
      const list = mentorExpensesByPayoutId.get(exp.payoutRequestId) || [];
      list.push(exp);
      mentorExpensesByPayoutId.set(exp.payoutRequestId, list);
    }
  }
  for (const [prId, expList] of mentorExpensesByPayoutId.entries()) {
    if (expList.length > 1) {
      const totalAmt = expList.reduce((s, e) => s + Number(e.amount || 0), 0);
      const singleAmt = Number(expList[0].amount || 0);
      pushFinding({
        fingerprint: `DOUBLE_COUNTED_MENTOR_PAYOUT:${prId}`,
        ruleCode: 'DOUBLE_COUNTED_MENTOR_PAYOUT',
        layer: 3,
        severity: 'Critical',
        title: `Duplicate Mentor Payout Expense Detected (${expList[0].mentorName || expList[0].vendor})`,
        aiDiagnosis: `Payout request ${prId} appears ${expList.length} times as Paid/Disbursed in Business Expenses totaling ${formatNairaServer(totalAmt)} instead of ${formatNairaServer(singleAmt)}.`,
        recommendedAction: `Investigate duplicate expense vouchers (${expList.map((e) => e.expenseCode || e.id).join(', ')}) with Finance and verify whether bank transfer was sent twice.`,
        entityType: 'payout',
        entityId: prId,
        entityName: expList[0].mentorName || expList[0].vendor || prId,
        expectedAmount: singleAmt,
        actualAmount: totalAmt,
        deltaAmount: totalAmt - singleAmt,
      });
    }
  }

  // =========================================================================
  // LAYER 4: Business Expenses vs. Wallet & Bank Outflows
  // =========================================================================
  const walletDebits = walletTxns.filter((t: any) => t.type === 'debit');
  const bankDebits = bankTxns.filter((t: any) => t.type === 'debit');
  const allDebits = [...walletDebits, ...bankDebits];

  const seenDebitRefs = new Set<string>();
  let totalCompanyOutflow = 0;
  for (const d of allDebits) {
    const key = d.reference ? normalizeMatchText(d.reference) : `${d.id}`;
    if (seenDebitRefs.has(key)) continue;
    seenDebitRefs.add(key);
    totalCompanyOutflow += Number(d.amount || 0);
  }

  const matchedDebitIds = new Set<string>();

  for (const exp of paidExpenses) {
    if (exp.walletDeducted === false) continue;
    const expAmt = Number(exp.amount || 0);
    if (expAmt <= tolerance) continue;
    const expRef = normalizeMatchText(exp.transferReference || exp.nipSessionId || exp.voucherNumber || exp.expenseCode);
    const expVendor = normalizeMatchText(exp.mentorName || exp.vendor || exp.title);

    const matchedDebit = allDebits.find((d: any) => {
      if (matchedDebitIds.has(d.id)) return false;
      const dRef = normalizeMatchText(d.reference || d.nipSessionId || '');
      const dDesc = normalizeMatchText(`${d.description || ''} ${d.recipientName || ''}`);
      if (expRef && dRef && (dRef.includes(expRef) || expRef.includes(dRef))) return true;
      if (Math.abs(Number(d.amount || 0) - expAmt) <= tolerance && (!expVendor || dDesc.includes(expVendor.split(' ')[0] || ''))) {
        return true;
      }
      return false;
    });

    if (matchedDebit) {
      matchedDebitIds.add(matchedDebit.id);
      if (matchedDebit.bankAccountId && !matchedDebit.matchedEntityId) {
        matchedDebit.matchedEntityType = 'expense';
        matchedDebit.matchedEntityId = exp.id;
        matchedDebit.matchedEntityName = exp.title || exp.vendor;
      }
    } else if (exp.isDisbursedViaWallet || allDebits.length > 0) {
      pushFinding({
        fingerprint: `EXPENSE_WITHOUT_OUTFLOW:${exp.id}`,
        ruleCode: 'EXPENSE_WITHOUT_OUTFLOW',
        layer: 4,
        severity: expAmt >= 50000 ? 'Critical' : 'Warning',
        title: `Paid Expense Missing Bank/Wallet Debit (${exp.expenseCode || exp.title})`,
        aiDiagnosis: `Expense "${exp.title}" (${formatNairaServer(expAmt)} to ${exp.vendor || exp.mentorName || 'Vendor'}) is marked ${exp.status}, but no corresponding debit transaction was found in Paystack Wallet or imported bank statements.`,
        recommendedAction: `Query ${exp.requestedBy || 'Finance'} for transfer receipt/NIP session ID or verify if paid from an unlinked external bank account.`,
        entityType: 'expense',
        entityId: exp.id,
        entityName: exp.title || exp.expenseCode || exp.id,
        expectedAmount: expAmt,
        actualAmount: 0,
        deltaAmount: expAmt,
      });
    }
  }

  // Flag unvouchered wallet/bank debits (debited money with no approved expense or payout record)
  const unvoucheredDebits = allDebits
    .filter((d: any) => {
      if (matchedDebitIds.has(d.id)) return false;
      if (d.matchedEntityType === 'bank_charge') return false;
      const amt = Number(d.amount || 0);
      if (amt <= tolerance) return false;
      const dDesc = normalizeMatchText(`${d.description || ''} ${d.recipientName || ''} ${d.reference || ''}`);
      // Ignore Nigerian bank charges / levies / stamp duties / SMS & maintenance fees
      if (isNigerianBankCharge(dDesc)) {
        if (d.bankAccountId && !d.matchedEntityId) {
          d.matchedEntityType = 'bank_charge';
          d.matchedEntityId = 'bank-fee';
          d.matchedEntityName = 'Bank Fee / Levy / Stamp Duty';
        }
        return false;
      }
      const matchesPayout = payouts.some(
        (p: any) =>
          p.status === 'Disbursed' &&
          (Math.abs(Number(p.amount || 0) - amt) <= tolerance ||
            (p.transferReference && dDesc.includes(normalizeMatchText(p.transferReference))))
      );
      if (matchesPayout) return false;
      return true;
    })
    .sort((a: any, b: any) => Number(b.amount || 0) - Number(a.amount || 0))
    .slice(0, 15);

  for (const d of unvoucheredDebits) {
    pushFinding({
      fingerprint: `UNVOUCHERED_WALLET_DEBIT:${d.id}`,
      ruleCode: 'UNVOUCHERED_WALLET_DEBIT',
      layer: 4,
      severity: Number(d.amount || 0) >= 50000 ? 'Critical' : 'Warning',
      title: `Unvouchered Account Outflow (${formatNairaServer(d.amount)})`,
      aiDiagnosis: `A debit of ${formatNairaServer(d.amount)} (${d.description || 'Account Transfer'}, Ref: ${d.reference || d.id}) left the company account with no matching approved Expense or Mentor Payout voucher in the ERP.`,
      recommendedAction: `Open an Investigation Case and query Finance/Operations to explain this outflow and attach an approved voucher.`,
      entityType: d.bankAccountId ? 'bank' : 'wallet',
      entityId: d.id,
      entityName: d.recipientName || d.description || d.reference || d.id,
      expectedAmount: 0,
      actualAmount: Number(d.amount || 0),
      deltaAmount: Number(d.amount || 0),
    });
  }

  // =========================================================================
  // LAYER 5: Master Company Cash Reconciliation (Expected Net vs. Actual Cash)
  // =========================================================================
  const totalTuitionBilled = realStudents.reduce((s: number, st: any) => s + Number(st.totalFees || 0), 0);
  const totalExpectedCommission37 = Math.round(totalStudentPaymentsReceived * 0.37);
  const totalAgreedCommissionDue = ledgers.reduce((s: number, l: any) => s + Number(l.agreedAmountDue || 0), 0);
  const totalDisbursedToMentors = ledgers.reduce((s: number, l: any) => s + Number(l.amountDisbursed || 0), 0);
  const totalOutstandingPayable = Math.max(0, totalAgreedCommissionDue - totalDisbursedToMentors);

  const totalBusinessExpensesPaid = paidExpenses.reduce((s: number, e: any) => s + Number(e.amount || 0), 0);
  const totalNonMentorExpensesPaid = paidExpenses
    .filter((e: any) => !e.mentorId && !e.payoutRequestId)
    .reduce((s: number, e: any) => s + Number(e.amount || 0), 0);

  const paystackLiveBalance = Number(
    typeof wallet.paystackLiveBalance === 'number' && wallet.paystackLiveBalance > 0
      ? wallet.paystackLiveBalance
      : wallet.balance || 0
  );
  const externalBankBalancesTotal = bankSnapshots.reduce((s: number, b: any) => s + Number(b.closingBalance || 0), 0);
  const actualCompanyCashTotal = paystackLiveBalance + externalBankBalancesTotal;
  const expectedNetCashPosition = totalStudentPaymentsReceived - totalDisbursedToMentors - totalNonMentorExpensesPaid;
  const cashReconciliationGap = actualCompanyCashTotal - expectedNetCashPosition;

  if ((actualCompanyCashTotal > 0 || totalStudentPaymentsReceived > 0) && Math.abs(cashReconciliationGap) > tolerance) {
    const isShortfall = cashReconciliationGap < 0;
    pushFinding({
      fingerprint: `COMPANY_CASH_DISCREPANCY:MASTER`,
      ruleCode: 'COMPANY_CASH_DISCREPANCY',
      layer: 5,
      severity: Math.abs(cashReconciliationGap) >= 10000 ? 'Critical' : 'Warning',
      title: isShortfall
        ? `Company Account Cash Shortfall (${formatNairaServer(Math.abs(cashReconciliationGap))})`
        : `Company Account Cash Surplus (${formatNairaServer(cashReconciliationGap)})`,
      aiDiagnosis: `Expected Net Cash from ERP records is ${formatNairaServer(expectedNetCashPosition)} (Inflows ${formatNairaServer(totalStudentPaymentsReceived)} − Mentor Payouts ${formatNairaServer(totalDisbursedToMentors)} − OpEx ${formatNairaServer(totalNonMentorExpensesPaid)}), whereas actual reported company cash is ${formatNairaServer(actualCompanyCashTotal)} (Paystack ${formatNairaServer(paystackLiveBalance)} + External Banks ${formatNairaServer(externalBankBalancesTotal)}). Net gap: ${cashReconciliationGap >= 0 ? '+' : '-'}${formatNairaServer(Math.abs(cashReconciliationGap))}.`,
      recommendedAction: isShortfall
        ? `Record all external Nigerian bank account balances in Company Accounts, import bank statements, and investigate unrecorded outflows or uncollected student receipts.`
        : `Verify unrecorded inflows, owner capital injections, or pending mentor/vendor disbursements not yet deducted from company accounts.`,
      entityType: 'system',
      entityId: 'master-cash-reconciliation',
      entityName: 'Master Company Cash Position',
      expectedAmount: expectedNetCashPosition,
      actualAmount: actualCompanyCashTotal,
      deltaAmount: cashReconciliationGap,
    });
  }

  // Merge detected findings with existing persistent findings (preserving Acknowledged/Resolved/Case links)
  const existingByFp = new Map<string, any>();
  for (const ex of db.financialAuditFindings) {
    existingByFp.set(ex.fingerprint, ex);
  }

  const nextFindings: any[] = [];
  const seenFps = new Set<string>();
  for (const d of detected) {
    seenFps.add(d.fingerprint);
    const prev = existingByFp.get(d.fingerprint);
    if (prev) {
      nextFindings.push({
        ...prev,
        ...d,
        id: prev.id,
        firstDetectedAt: prev.firstDetectedAt,
        investigationCaseId: prev.investigationCaseId,
        status: prev.status === 'Resolved' ? 'Open' : prev.status,
        resolutionNote: prev.status === 'Resolved' ? undefined : prev.resolutionNote,
      });
    } else {
      nextFindings.push({
        id: `audit-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
        status: 'Open',
        ...d,
      });
    }
  }

  for (const ex of db.financialAuditFindings) {
    if (!seenFps.has(ex.fingerprint)) {
      nextFindings.push(
        ex.status === 'Open'
          ? { ...ex, status: 'Resolved', resolvedAt: nowIso, resolvedBy: 'AI Audit Agent (Auto-Cleared)' }
          : ex
      );
    }
  }

  db.financialAuditFindings = nextFindings;

  const openFindings = nextFindings.filter((f) => f.status !== 'Resolved');
  const criticalCount = openFindings.filter((f) => f.severity === 'Critical').length;
  const warningCount = openFindings.filter((f) => f.severity === 'Warning').length;
  const infoCount = openFindings.filter((f) => f.severity === 'Info').length;
  const netDiscrepancyExposure = openFindings
    .filter((f) => f.ruleCode !== 'UNLINKED_STUDENT_DEPOSITS' && f.ruleCode !== 'COMPANY_CASH_DISCREPANCY')
    .reduce((sum: number, f: any) => sum + Math.abs(Number(f.deltaAmount || 0)), 0);

  const penalty = criticalCount * 12 + warningCount * 4 + infoCount * 1;
  const healthScore = Math.max(0, Math.min(100, 100 - penalty));

  const scanRecord = {
    id: `scan-${Date.now()}`,
    timestamp: nowIso,
    triggeredBy,
    healthScore,
    totalFindings: openFindings.length,
    criticalCount,
    warningCount,
    infoCount,
    moneyFlow: {
      totalTuitionBilled,
      totalCatalogTuitionValue,
      coursePriceVarianceTotal,
      totalStudentPaymentsReceived,
      totalExpectedCommission37,
      totalAgreedCommissionDue,
      totalDisbursedToMentors,
      totalOutstandingPayable,
      totalBusinessExpensesPaid,
      totalNonMentorExpensesPaid,
      totalWalletInflow: totalCompanyInflow,
      totalWalletOutflow: totalCompanyOutflow,
      paystackLiveBalance,
      externalBankBalancesTotal,
      actualCompanyCashTotal,
      expectedNetCashPosition,
      cashReconciliationGap,
      netDiscrepancyExposure,
    },
  };

  db.financialAuditScans.unshift(scanRecord);
  if (db.financialAuditScans.length > 50) db.financialAuditScans = db.financialAuditScans.slice(0, 50);

  return { scan: scanRecord, findings: nextFindings };
};

export const generateExecutiveSummaryText = (scan: any, openFindings: any[], cases: any[]): string => {
  const f = scan?.moneyFlow || {};
  const gap = Number(f.cashReconciliationGap || 0);
  const gapWord = gap < 0 ? `shortfall of ${formatNairaServer(Math.abs(gap))}` : gap > 0 ? `surplus of ${formatNairaServer(gap)}` : 'zero variance';
  return [
    `Audit Health Score: ${scan?.healthScore ?? 100}% (${scan?.criticalCount || 0} Critical, ${scan?.warningCount || 0} Warnings, ${scan?.infoCount || 0} Info).`,
    `Recorded Student Payments: ${formatNairaServer(f.totalStudentPaymentsReceived || 0)} against ${formatNairaServer(f.totalTuitionBilled || 0)} tuition billed (Price Variance Exposure: ${formatNairaServer(f.coursePriceVarianceTotal || 0)}).`,
    `Mentor Disbursements: ${formatNairaServer(f.totalDisbursedToMentors || 0)} disbursed vs. ${formatNairaServer(f.totalAgreedCommissionDue || 0)} agreed due (Outstanding Payable: ${formatNairaServer(f.totalOutstandingPayable || 0)}).`,
    `Business OpEx Paid (Non-Mentor): ${formatNairaServer(f.totalNonMentorExpensesPaid || 0)}.`,
    `Company Cash Position: Actual ${formatNairaServer(f.actualCompanyCashTotal || 0)} (Paystack ${formatNairaServer(f.paystackLiveBalance || 0)} + External Banks ${formatNairaServer(f.externalBankBalancesTotal || 0)}) vs. Expected Net Cash ${formatNairaServer(f.expectedNetCashPosition || 0)} — ${gapWord}.`,
    `Active Investigation Cases: ${cases.filter((c) => c.status !== 'Resolved').length} open (${openFindings.length} open findings total).`,
  ].join(' ');
};

export const maybeEnhanceWithGemini = async (prompt: string, contextPayload: Record<string, any>): Promise<string | null> => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  try {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(apiKey)}`;
    const body = {
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `You are a Nigerian ERP Forensic Financial Auditor. Use ONLY the exact Naira figures provided in the JSON below—never invent numbers.\n\nRequest: ${prompt}\n\nVerified ERP Financial Data:\n${JSON.stringify(contextPayload, null, 2)}`,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 700,
      },
    };
    const resp = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!resp.ok) return null;
    const json: any = await resp.json();
    const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
    return typeof text === 'string' && text.trim() ? text.trim() : null;
  } catch {
    return null;
  }
};

export const answerForensicQuestion = async (db: any, question: string) => {
  ensureAuditCollections(db);
  const latestScan = db.financialAuditScans[0] || runFullFinancialAudit(db, 'Forensic Q&A Auto-Scan').scan;
  const openFindings = (db.financialAuditFindings || []).filter((f: any) => f.status !== 'Resolved');
  const mf = latestScan.moneyFlow || {};
  const qNorm = normalizeMatchText(question);

  const highlights: Array<{ label: string; value: string; intent?: 'blue' | 'emerald' | 'amber' | 'red' | 'sky' }> = [];
  const sections: Array<{ title: string; icon?: string; bullets: string[] }> = [];
  let relatedFindings: any[] = [];
  let verdict = '';
  let followUpPrompts: string[] = [
    'Show all course price differences',
    'Which mentors have commission or payout discrepancies?',
    'Are there unvouchered expenses or wallet outflows?',
    'Why is company cash different from recorded balance?',
  ];

  // Check if user mentioned a specific student or mentor by name
  const matchedFindingByEntity = openFindings.filter((f: any) => {
    const name = normalizeMatchText(f.entityName);
    return name.length >= 3 && qNorm.includes(name);
  });

  if (matchedFindingByEntity.length > 0) {
    relatedFindings = matchedFindingByEntity;
    const totalDelta = matchedFindingByEntity.reduce((s: number, f: any) => s + Math.abs(Number(f.deltaAmount || 0)), 0);
    verdict = `Located ${matchedFindingByEntity.length} open audit finding(s) matching "${question.trim()}" with ${formatNairaServer(totalDelta)} total flagged variance.`;
    highlights.push(
      { label: 'Matched Findings', value: String(matchedFindingByEntity.length), intent: 'red' },
      { label: 'Total Variance', value: formatNairaServer(totalDelta), intent: 'amber' }
    );
    sections.push({
      title: 'Entity Discrepancy Breakdown',
      icon: 'person_search',
      bullets: matchedFindingByEntity.slice(0, 6).map(
        (f: any) => `[${f.severity} • L${f.layer || '-'}] ${f.title}: Expected ${formatNairaServer(f.expectedAmount)} vs Actual ${formatNairaServer(f.actualAmount)} (Delta: ${formatNairaServer(f.deltaAmount)}).`
      ),
    });
  } else if (qNorm.includes('price') || qNorm.includes('discount') || qNorm.includes('course') || qNorm.includes('tuition')) {
    relatedFindings = openFindings.filter((f: any) => f.layer === 1 || f.ruleCode === 'COURSE_PRICE_VARIANCE' || f.ruleCode === 'TUITION_OUTLIER');
    verdict = `Layer 1 detected ${relatedFindings.length} open pricing/tuition variance(s) totaling ${formatNairaServer(mf.coursePriceVarianceTotal || 0)} against official course catalog prices.`;
    highlights.push(
      { label: 'Catalog Tuition Value', value: formatNairaServer(mf.totalCatalogTuitionValue || 0), intent: 'blue' },
      { label: 'Total Tuition Billed', value: formatNairaServer(mf.totalTuitionBilled || 0), intent: 'sky' },
      { label: 'Price Variance Exposure', value: formatNairaServer(mf.coursePriceVarianceTotal || 0), intent: 'amber' }
    );
    sections.push({
      title: 'Layer 1 — Tuition & Price Difference Analysis',
      icon: 'local_offer',
      bullets: [
        `Total Tuition Billed across CRM students: ${formatNairaServer(mf.totalTuitionBilled || 0)} vs Official Catalog Value: ${formatNairaServer(mf.totalCatalogTuitionValue || 0)}.`,
        `Unexempted Course Price Variances: ${formatNairaServer(mf.coursePriceVarianceTotal || 0)} across ${relatedFindings.length} finding(s).`,
        `Approved Scholarship/Discount Exemptions currently on file: ${(db.financialAuditConfig?.approvedDiscounts || []).length}.`,
        `Action: Review each variance below — click "Approve Discount" for legitimate waivers or "Investigate / Ask User" to query Admissions.`,
      ],
    });
  } else if (qNorm.includes('mentor') || qNorm.includes('commission') || qNorm.includes('payout') || qNorm.includes('disburs')) {
    relatedFindings = openFindings.filter((f: any) => f.layer === 3);
    verdict = `Layer 3 shows ${formatNairaServer(mf.totalDisbursedToMentors || 0)} disbursed to mentors against ${formatNairaServer(mf.totalAgreedCommissionDue || 0)} agreed due (${formatNairaServer(mf.totalOutstandingPayable || 0)} outstanding).`;
    highlights.push(
      { label: '37% Expected Commission', value: formatNairaServer(mf.totalExpectedCommission37 || 0), intent: 'sky' },
      { label: 'Disbursed to Mentors', value: formatNairaServer(mf.totalDisbursedToMentors || 0), intent: 'emerald' },
      { label: 'Outstanding Payable', value: formatNairaServer(mf.totalOutstandingPayable || 0), intent: 'amber' }
    );
    sections.push({
      title: 'Layer 3 — 37% Mentor Commission & Payout Audit',
      icon: 'co_present',
      bullets: [
        `Formula 37% of Recorded Tuition (${formatNairaServer(mf.totalStudentPaymentsReceived || 0)}): ${formatNairaServer(mf.totalExpectedCommission37 || 0)}.`,
        `Agreed Cohort Commission Due: ${formatNairaServer(mf.totalAgreedCommissionDue || 0)} | Disbursed: ${formatNairaServer(mf.totalDisbursedToMentors || 0)}.`,
        `Open Mentor Discrepancy Flags: ${relatedFindings.length} (${relatedFindings.filter((f: any) => f.severity === 'Critical').length} Critical).`,
      ],
    });
  } else if (qNorm.includes('expense') || qNorm.includes('opex') || qNorm.includes('outflow') || qNorm.includes('debit')) {
    relatedFindings = openFindings.filter((f: any) => f.layer === 4);
    verdict = `Layer 4 tracked ${formatNairaServer(mf.totalBusinessExpensesPaid || 0)} in paid expenses against ${formatNairaServer(mf.totalWalletOutflow || 0)} in verified company outflows, flagging ${relatedFindings.length} item(s).`;
    highlights.push(
      { label: 'Business Expenses Paid', value: formatNairaServer(mf.totalBusinessExpensesPaid || 0), intent: 'amber' },
      { label: 'Non-Mentor OpEx', value: formatNairaServer(mf.totalNonMentorExpensesPaid || 0), intent: 'sky' },
      { label: 'Verified Account Debits', value: formatNairaServer(mf.totalWalletOutflow || 0), intent: 'blue' }
    );
    sections.push({
      title: 'Layer 4 — Business Expenses vs. Company Account Outflows',
      icon: 'receipt_long',
      bullets: [
        `Paid Expenses in ERP: ${formatNairaServer(mf.totalBusinessExpensesPaid || 0)} (${formatNairaServer(mf.totalNonMentorExpensesPaid || 0)} non-mentor OpEx).`,
        `Verified Paystack & Bank Statement Outflows: ${formatNairaServer(mf.totalWalletOutflow || 0)}.`,
        `Unvouchered Outflows / Missing Debit Flags: ${relatedFindings.length} (Nigerian bank fees & stamp duties are automatically excluded).`,
      ],
    });
  } else {
    // Default: Master Cash & Company Account Discrepancy overview
    relatedFindings = openFindings.slice(0, 8);
    const gap = Number(mf.cashReconciliationGap || 0);
    const gapWord =
      gap < 0
        ? `shortfall of ${formatNairaServer(Math.abs(gap))}`
        : gap > 0
          ? `surplus of ${formatNairaServer(gap)}`
          : 'zero variance';
    verdict = `Actual company cash (${formatNairaServer(mf.actualCompanyCashTotal || 0)}) vs. Expected ERP Net Cash (${formatNairaServer(mf.expectedNetCashPosition || 0)}) shows a ${gapWord}.`;
    highlights.push(
      { label: 'Expected Net Cash', value: formatNairaServer(mf.expectedNetCashPosition || 0), intent: 'blue' },
      { label: 'Actual Company Cash', value: formatNairaServer(mf.actualCompanyCashTotal || 0), intent: 'emerald' },
      {
        label: 'Cash Gap',
        value: `${gap >= 0 ? '+' : '-'}${formatNairaServer(Math.abs(gap))}`,
        intent: Math.abs(gap) > Number(db.financialAuditConfig?.varianceToleranceNaira ?? 100) ? 'red' : 'emerald',
      },
      { label: 'Audit Health', value: `${latestScan.healthScore ?? 100}%`, intent: (latestScan.healthScore ?? 100) >= 85 ? 'emerald' : 'red' }
    );
    sections.push(
      {
        title: 'Cash Flow Equation (Expected vs. Actual)',
        icon: 'account_balance',
        bullets: [
          `Recorded Student Inflows: +${formatNairaServer(mf.totalStudentPaymentsReceived || 0)} (against ${formatNairaServer(mf.totalTuitionBilled || 0)} billed).`,
          `Mentor Commissions Disbursed: −${formatNairaServer(mf.totalDisbursedToMentors || 0)} (Outstanding Payable: ${formatNairaServer(mf.totalOutstandingPayable || 0)}).`,
          `Non-Mentor Business OpEx Paid: −${formatNairaServer(mf.totalNonMentorExpensesPaid || 0)}.`,
          `Actual Cash on Hand: ${formatNairaServer(mf.actualCompanyCashTotal || 0)} (Paystack ${formatNairaServer(mf.paystackLiveBalance || 0)} + External Banks ${formatNairaServer(mf.externalBankBalancesTotal || 0)}).`,
        ],
      },
      {
        title: 'Primary Drivers of the Discrepancy',
        icon: 'troubleshoot',
        bullets: [
          `Open Audit Flags: ${openFindings.length} total (${latestScan.criticalCount || 0} Critical, ${latestScan.warningCount || 0} Warnings, ${latestScan.infoCount || 0} Info).`,
          `Unmatched/Unrecorded OpEx & Transfers: Compare imported bank debits (${formatNairaServer(mf.totalWalletOutflow || 0)}) against ERP paid expenses (${formatNairaServer(mf.totalBusinessExpensesPaid || 0)}).`,
          `Price Variance Exposure: ${formatNairaServer(mf.coursePriceVarianceTotal || 0)} in unexempted course tuition differences.`,
          `Active Investigation Cases: ${(db.auditInvestigations || []).filter((c: any) => c.status !== 'Resolved').length} open.`,
        ],
      }
    );
  }

  let finalAnswer = [verdict, ...sections.flatMap((s) => s.bullets)].join('\n');
  let mode: 'deterministic' | 'gemini_enhanced' = 'deterministic';

  const geminiText = await maybeEnhanceWithGemini(question, {
    verdict,
    moneyFlow: mf,
    healthScore: latestScan.healthScore,
    openFindingsCount: openFindings.length,
    topFindings: relatedFindings.slice(0, 6).map((f: any) => ({
      ruleCode: f.ruleCode,
      severity: f.severity,
      title: f.title,
      expectedAmount: f.expectedAmount,
      actualAmount: f.actualAmount,
      deltaAmount: f.deltaAmount,
      aiDiagnosis: f.aiDiagnosis,
    })),
  });

  if (geminiText) {
    finalAnswer = geminiText;
    mode = 'gemini_enhanced';
  }

  return {
    answer: finalAnswer,
    verdict,
    mode,
    sections,
    highlights,
    relatedFindings: relatedFindings.slice(0, 8),
    followUpPrompts: followUpPrompts.filter((p) => normalizeMatchText(p) !== qNorm).slice(0, 3),
  };
};
