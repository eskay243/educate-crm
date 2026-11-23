import { Router, Request, Response } from 'express';
import {
  answerForensicQuestion,
  ensureAuditCollections,
  extractPdfText,
  formatNairaServer,
  generateExecutiveSummaryText,
  maybeEnhanceWithGemini,
  parseBankStatementCsv,
  parseBankStatementText,
  runFullFinancialAudit,
} from '../utils/financialAuditEngine.js';
import { RealtimeEventBus } from '../utils/realtime.js';

export interface FinancialAuditRouterDeps {
  getDb: () => any;
  saveDb: () => void;
  isSuperAdminOnly: (req: Request) => boolean;
  realtimeBus?: RealtimeEventBus;
}

export const createFinancialAuditRouter = (deps: FinancialAuditRouterDeps): Router => {
  const router = Router();
  const { getDb, saveDb, isSuperAdminOnly, realtimeBus } = deps;

  const requireSuperAdmin = (req: Request, res: Response): boolean => {
    if (!isSuperAdminOnly(req)) {
      res.status(403).json({
        success: false,
        message: 'Forbidden: AI Financial Audit Suite is restricted strictly to Super Admin.',
      });
      return false;
    }
    return true;
  };

  const buildOverviewPayload = (db: any) => ({
    latestScan: db.financialAuditScans[0] || null,
    scans: db.financialAuditScans || [],
    findings: db.financialAuditFindings || [],
    config: db.financialAuditConfig,
    bankSnapshots: db.companyBankSnapshots || [],
    bankTransactions: db.bankStatementTransactions || [],
    investigations: db.auditInvestigations || [],
    reports: db.financialAuditReports || [],
  });

  // -------------------------------------------------------------------------
  // 1. Overview & 5-Layer Scan
  // -------------------------------------------------------------------------
  router.get('/', (req: Request, res: Response) => {
    if (!requireSuperAdmin(req, res)) return;
    const db = getDb();
    ensureAuditCollections(db);
    if (db.financialAuditScans.length === 0) {
      runFullFinancialAudit(db, 'Auto-Initial 5-Layer Audit');
      saveDb();
    }
    res.json({ success: true, data: buildOverviewPayload(db) });
  });

  router.post('/scan', (req: Request, res: Response) => {
    if (!requireSuperAdmin(req, res)) return;
    const db = getDb();
    const triggeredBy = String(req.body?.triggeredBy || 'Super Admin');
    runFullFinancialAudit(db, triggeredBy);
    saveDb();
    res.json({ success: true, data: buildOverviewPayload(db) });
  });

  // -------------------------------------------------------------------------
  // 2. Findings Update & Discount Exemption
  // -------------------------------------------------------------------------
  router.patch('/findings/:id', (req: Request, res: Response) => {
    if (!requireSuperAdmin(req, res)) return;
    const db = getDb();
    ensureAuditCollections(db);
    const finding = db.financialAuditFindings.find((f: any) => f.id === req.params.id);
    if (!finding) {
      return res.status(404).json({ success: false, message: 'Audit finding not found' });
    }
    const { status, resolutionNote, resolvedBy, approveDiscount, discountReason } = req.body || {};

    if (approveDiscount && finding.ruleCode === 'COURSE_PRICE_VARIANCE' && finding.entityId) {
      const student = (db.students || []).find((s: any) => s.id === finding.entityId);
      const exemption = {
        id: `disc-${Date.now()}`,
        studentId: finding.entityId,
        studentName: finding.entityName,
        courseTitle: student?.program || finding.title,
        catalogFee: Number(finding.expectedAmount || 0),
        approvedFee: Number(finding.actualAmount || 0),
        reason: String(discountReason || resolutionNote || 'Approved Scholarship / Discount'),
        approvedBy: String(resolvedBy || 'Super Admin'),
        approvedAt: new Date().toISOString(),
      };
      db.financialAuditConfig.approvedDiscounts = [
        exemption,
        ...db.financialAuditConfig.approvedDiscounts.filter((d: any) => d.studentId !== finding.entityId),
      ];
      finding.isExempted = true;
      finding.exemptionReason = exemption.reason;
      finding.status = 'Resolved';
      finding.resolutionNote = `Approved Discount Exemption: ${exemption.reason}`;
      finding.resolvedAt = new Date().toISOString();
      finding.resolvedBy = exemption.approvedBy;
      runFullFinancialAudit(db, 'Discount Exemption Re-Scan');
      saveDb();
      return res.json({ success: true, data: { finding, overview: buildOverviewPayload(db) } });
    }

    if (status) finding.status = status;
    if (resolutionNote !== undefined) finding.resolutionNote = resolutionNote;
    if (status === 'Resolved') {
      finding.resolvedAt = new Date().toISOString();
      finding.resolvedBy = resolvedBy || 'Super Admin';
    }
    saveDb();
    res.json({ success: true, data: finding });
  });

  // -------------------------------------------------------------------------
  // 3. Audit Config (Variance Tolerance & Approved Discounts)
  // -------------------------------------------------------------------------
  router.patch('/config', (req: Request, res: Response) => {
    if (!requireSuperAdmin(req, res)) return;
    const db = getDb();
    ensureAuditCollections(db);
    const { varianceToleranceNaira, removeDiscountId } = req.body || {};

    if (typeof varianceToleranceNaira === 'number' && varianceToleranceNaira >= 0) {
      db.financialAuditConfig.varianceToleranceNaira = Math.round(varianceToleranceNaira);
    }
    if (removeDiscountId) {
      db.financialAuditConfig.approvedDiscounts = db.financialAuditConfig.approvedDiscounts.filter(
        (d: any) => d.id !== removeDiscountId
      );
    }

    runFullFinancialAudit(db, 'Config Update Re-Scan');
    saveDb();
    res.json({ success: true, data: buildOverviewPayload(db) });
  });

  // -------------------------------------------------------------------------
  // 4. Company External Bank Account Snapshots & CSV Statement Import
  // -------------------------------------------------------------------------
  router.post('/bank-accounts', (req: Request, res: Response) => {
    if (!requireSuperAdmin(req, res)) return;
    const db = getDb();
    ensureAuditCollections(db);
    const { id, bankName, bankCode, accountNumber, accountName, closingBalance, asOfDate, notes, recordedBy } = req.body || {};

    const cleanNuban = String(accountNumber || '').replace(/\D/g, '');
    if (!bankName || !/^\d{10}$/.test(cleanNuban)) {
      return res.status(400).json({
        success: false,
        message: 'Bank name and a valid 10-digit Nigerian NUBAN account number are required.',
      });
    }

    const nowIso = new Date().toISOString();
    const existingIdx = id
      ? db.companyBankSnapshots.findIndex((b: any) => b.id === id)
      : db.companyBankSnapshots.findIndex((b: any) => b.accountNumber === cleanNuban);

    const record = {
      id: existingIdx >= 0 ? db.companyBankSnapshots[existingIdx].id : `bank-${Date.now()}`,
      bankName: String(bankName).trim(),
      bankCode: bankCode ? String(bankCode).trim() : undefined,
      accountNumber: cleanNuban,
      accountName: String(accountName || bankName).trim(),
      closingBalance: Number(closingBalance || 0),
      asOfDate: asOfDate || nowIso.slice(0, 10),
      notes: notes ? String(notes).trim() : '',
      recordedBy: String(recordedBy || 'Super Admin'),
      updatedAt: nowIso,
    };

    if (existingIdx >= 0) {
      db.companyBankSnapshots[existingIdx] = record;
    } else {
      db.companyBankSnapshots.unshift(record);
    }

    runFullFinancialAudit(db, 'Bank Snapshot Re-Scan');
    saveDb();
    res.json({ success: true, data: { snapshot: record, overview: buildOverviewPayload(db) } });
  });

  router.delete('/bank-accounts/:id', (req: Request, res: Response) => {
    if (!requireSuperAdmin(req, res)) return;
    const db = getDb();
    ensureAuditCollections(db);
    db.companyBankSnapshots = db.companyBankSnapshots.filter((b: any) => b.id !== req.params.id);
    db.bankStatementTransactions = db.bankStatementTransactions.filter((t: any) => t.bankAccountId !== req.params.id);
    runFullFinancialAudit(db, 'Bank Snapshot Removal Re-Scan');
    saveDb();
    res.json({ success: true, data: buildOverviewPayload(db) });
  });

  router.post('/bank-statements/import', (req: Request, res: Response) => {
    if (!requireSuperAdmin(req, res)) return;
    const db = getDb();
    ensureAuditCollections(db);
    const { bankAccountId, csvText, updateClosingBalance } = req.body || {};

    const account = db.companyBankSnapshots.find((b: any) => b.id === bankAccountId);
    if (!account) {
      return res.status(404).json({ success: false, message: 'Selected company bank account not found. Please add the bank account first.' });
    }
    if (!csvText || typeof csvText !== 'string') {
      return res.status(400).json({ success: false, message: 'CSV statement text is required.' });
    }

    const parsed = parseBankStatementCsv(csvText, account.id, account.bankName, db.bankStatementTransactions);
    if (parsed.transactions.length > 0) {
      db.bankStatementTransactions = [...parsed.transactions, ...db.bankStatementTransactions].slice(0, 2000);
    }
    if (updateClosingBalance && typeof parsed.detectedClosingBalance === 'number') {
      account.closingBalance = parsed.detectedClosingBalance;
      account.updatedAt = new Date().toISOString();
    }

    runFullFinancialAudit(db, `Bank CSV Import (${account.bankName})`);
    saveDb();
    res.json({
      success: true,
      data: {
        importedCount: parsed.transactions.length,
        skippedDuplicates: parsed.skippedDuplicates,
        totalCredits: parsed.totalCredits,
        totalDebits: parsed.totalDebits,
        detectedClosingBalance: parsed.detectedClosingBalance,
        overview: buildOverviewPayload(db),
      },
    });
  });

  router.post('/bank-statements/import-pdf', async (req: Request, res: Response) => {
    if (!requireSuperAdmin(req, res)) return;
    const db = getDb();
    ensureAuditCollections(db);

    const {
      pdfBase64,
      fileName,
      bankAccountId,
      autoCreateAccount = true,
      updateClosingBalance = true,
      recordedBy,
    } = req.body || {};

    if (!pdfBase64 || typeof pdfBase64 !== 'string') {
      return res.status(400).json({ success: false, message: 'PDF file payload (pdfBase64) is required.' });
    }

    try {
      const cleanedBase64 = pdfBase64.replace(/^data:application\/pdf;base64,/i, '').trim();
      const pdfBuffer = Buffer.from(cleanedBase64, 'base64');
      if (pdfBuffer.length < 100) {
        return res.status(400).json({ success: false, message: 'Uploaded PDF file appears empty or corrupted.' });
      }

      const extractedText = await extractPdfText(pdfBuffer);
      if (!extractedText || extractedText.trim().length < 20) {
        return res.status(422).json({
          success: false,
          message: 'Could not extract text from this PDF. Please upload a digital bank-generated PDF statement (not a photo scan).',
        });
      }

      let account = bankAccountId
        ? db.companyBankSnapshots.find((b: any) => b.id === bankAccountId)
        : null;

      // First pass with temporary id to detect header metadata if needed
      const prelim = parseBankStatementText(
        extractedText,
        account?.id || 'pending-account',
        account?.bankName || 'Nigerian Bank',
        []
      );

      const meta = prelim.detectedMetadata || {};
      const nowIso = new Date().toISOString();

      // Auto-find or auto-create bank snapshot when 10-digit NUBAN is detected
      if (!account && autoCreateAccount && meta.accountNumber && /^\d{10}$/.test(meta.accountNumber)) {
        account = db.companyBankSnapshots.find((b: any) => b.accountNumber === meta.accountNumber) || null;
        if (!account) {
          account = {
            id: `bank-${Date.now()}`,
            bankName: meta.bankName || 'FCMB',
            accountNumber: meta.accountNumber,
            accountName: meta.accountName || `${meta.bankName || 'Corporate'} Account`,
            closingBalance: Number(prelim.detectedClosingBalance ?? meta.closingBalance ?? 0),
            asOfDate: nowIso.slice(0, 10),
            notes: `Auto-created from PDF statement${fileName ? ` (${fileName})` : ''}`,
            recordedBy: String(recordedBy || 'Super Admin'),
            updatedAt: nowIso,
          };
          db.companyBankSnapshots.unshift(account);
        }
      }

      if (!account) {
        return res.status(400).json({
          success: false,
          message: 'No target company bank account selected and no 10-digit NUBAN could be auto-detected in the PDF. Please add/select a bank account first.',
        });
      }

      // Final parse deduplicated against existing transactions for this exact account
      const parsed = parseBankStatementText(
        extractedText,
        account.id,
        account.bankName,
        db.bankStatementTransactions
      );

      if (parsed.transactions.length > 0) {
        db.bankStatementTransactions = [...parsed.transactions, ...db.bankStatementTransactions].slice(0, 3000);
      }

      if (updateClosingBalance && typeof parsed.detectedClosingBalance === 'number') {
        account.closingBalance = parsed.detectedClosingBalance;
        account.updatedAt = nowIso;
      }

      runFullFinancialAudit(db, `Bank PDF Import (${account.bankName})`);
      saveDb();

      res.json({
        success: true,
        data: {
          account,
          importedCount: parsed.transactions.length,
          skippedDuplicates: parsed.skippedDuplicates,
          totalCredits: parsed.totalCredits,
          totalDebits: parsed.totalDebits,
          bankChargesTotal: parsed.bankChargesTotal,
          bankChargesCount: parsed.bankChargesCount,
          detectedClosingBalance: parsed.detectedClosingBalance,
          detectedMetadata: parsed.detectedMetadata,
          overview: buildOverviewPayload(db),
        },
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        message: err?.message || 'Failed to parse PDF bank statement.',
      });
    }
  });

  router.patch('/bank-statements/:txId/match', (req: Request, res: Response) => {
    if (!requireSuperAdmin(req, res)) return;
    const db = getDb();
    ensureAuditCollections(db);
    const tx = db.bankStatementTransactions.find((t: any) => t.id === req.params.txId);
    if (!tx) {
      return res.status(404).json({ success: false, message: 'Bank statement transaction not found.' });
    }

    const { studentId, clearMatch } = req.body || {};
    if (clearMatch || !studentId) {
      tx.matchedEntityType = null;
      tx.matchedEntityId = null;
      tx.matchedEntityName = null;
      tx.matchedCourseName = null;
      tx.matchConfidence = null;
      tx.matchReason = null;
    } else {
      const student = (db.students || []).find((s: any) => s.id === studentId);
      if (!student) {
        return res.status(404).json({ success: false, message: 'Selected student not found.' });
      }
      tx.matchedEntityType = 'student';
      tx.matchedEntityId = student.id;
      tx.matchedEntityName = student.name;
      tx.matchedCourseName = student.program || null;
      tx.matchConfidence = 'Manual';
      tx.matchReason = 'Manual Link by Super Admin';
    }

    runFullFinancialAudit(db, 'Manual Bank Payment Match');
    saveDb();
    res.json({ success: true, data: { transaction: tx, overview: buildOverviewPayload(db) } });
  });

  // -------------------------------------------------------------------------
  // 5. Formal Investigation Cases & "Ask Any User" Query Dispatch
  // -------------------------------------------------------------------------
  router.get('/investigations', (req: Request, res: Response) => {
    if (!requireSuperAdmin(req, res)) return;
    const db = getDb();
    ensureAuditCollections(db);
    res.json({ success: true, data: db.auditInvestigations });
  });

  router.post('/investigations', (req: Request, res: Response) => {
    if (!requireSuperAdmin(req, res)) return;
    const db = getDb();
    ensureAuditCollections(db);
    const { title, summary, severity, findingIds, assignedInvestigator } = req.body || {};

    const ids: string[] = Array.isArray(findingIds) ? findingIds : [];
    const linkedFindings = db.financialAuditFindings.filter((f: any) => ids.includes(f.id));
    const totalExposureNaira = linkedFindings.reduce((sum: number, f: any) => sum + Math.abs(Number(f.deltaAmount || 0)), 0);
    const nowIso = new Date().toISOString();
    const caseNum = `INV-${new Date().getFullYear()}-${String(db.auditInvestigations.length + 1).padStart(3, '0')}`;

    const newCase = {
      id: `case-${Date.now()}`,
      caseNumber: caseNum,
      title: String(title || linkedFindings[0]?.title || 'Financial Discrepancy Investigation').trim(),
      summary: String(summary || linkedFindings.map((f: any) => f.aiDiagnosis).join(' ')).trim(),
      severity: severity || (linkedFindings.some((f: any) => f.severity === 'Critical') ? 'Critical' : 'Warning'),
      status: 'Open',
      findingIds: ids,
      totalExposureNaira,
      assignedInvestigator: String(assignedInvestigator || 'Super Admin'),
      queries: [],
      timeline: [
        {
          id: `tl-${Date.now()}`,
          timestamp: nowIso,
          actor: String(assignedInvestigator || 'Super Admin'),
          action: 'Case Opened',
          note: `Investigation ${caseNum} opened with ${linkedFindings.length} linked finding(s) (${formatNairaServer(totalExposureNaira)} exposure).`,
        },
      ],
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    for (const f of linkedFindings) {
      f.investigationCaseId = newCase.id;
      if (f.status === 'Open') f.status = 'Acknowledged';
    }

    db.auditInvestigations.unshift(newCase);
    saveDb();
    res.json({ success: true, data: { investigation: newCase, overview: buildOverviewPayload(db) } });
  });

  router.patch('/investigations/:id', (req: Request, res: Response) => {
    if (!requireSuperAdmin(req, res)) return;
    const db = getDb();
    ensureAuditCollections(db);
    const inv = db.auditInvestigations.find((c: any) => c.id === req.params.id);
    if (!inv) {
      return res.status(404).json({ success: false, message: 'Investigation case not found' });
    }
    const { status, note, actor, resolveLinkedFindings } = req.body || {};
    const nowIso = new Date().toISOString();

    if (status) {
      inv.status = status;
      if (status === 'Resolved') inv.resolvedAt = nowIso;
    }
    if (note || status) {
      inv.timeline.unshift({
        id: `tl-${Date.now()}`,
        timestamp: nowIso,
        actor: String(actor || 'Super Admin'),
        action: status ? `Status → ${status}` : 'Investigator Note',
        note: String(note || `Case status updated to ${status}`).trim(),
      });
    }
    if (status === 'Resolved' && resolveLinkedFindings) {
      for (const f of db.financialAuditFindings) {
        if (inv.findingIds.includes(f.id) && f.status !== 'Resolved') {
          f.status = 'Resolved';
          f.resolvedAt = nowIso;
          f.resolvedBy = String(actor || 'Super Admin');
          f.resolutionNote = String(note || `Resolved via Investigation ${inv.caseNumber}`);
        }
      }
    }
    inv.updatedAt = nowIso;
    saveDb();
    res.json({ success: true, data: { investigation: inv, overview: buildOverviewPayload(db) } });
  });

  router.post('/investigations/:id/query-user', (req: Request, res: Response) => {
    if (!requireSuperAdmin(req, res)) return;
    const db = getDb();
    ensureAuditCollections(db);
    const inv = db.auditInvestigations.find((c: any) => c.id === req.params.id);
    if (!inv) {
      return res.status(404).json({ success: false, message: 'Investigation case not found' });
    }

    const {
      targetUserId,
      targetUserName,
      targetUserRole,
      targetUserEmail,
      question,
      transactionContext,
      expectedAmount,
      actualAmount,
      deltaAmount,
      senderId,
      senderName,
      senderEmail,
    } = req.body || {};

    if (!targetUserId || !question) {
      return res.status(400).json({ success: false, message: 'Target user and question are required.' });
    }

    const nowIso = new Date().toISOString();
    const adminId = String(senderId || req.headers['x-user-id'] || 'super-admin');
    const adminName = String(senderName || 'Super Admin');
    const adminEmail = String(senderEmail || req.headers['x-user-email'] || '');

    // 1. Dispatch Direct Message in Chat so the user gets an immediate thread
    if (!Array.isArray(db.chatConversations)) db.chatConversations = [];
    if (!Array.isArray(db.chatMessages)) db.chatMessages = [];
    const directId = `dm-${[adminId, targetUserId].sort().join('-')}`;
    let conv = db.chatConversations.find((c: any) => c.id === directId);
    if (!conv) {
      conv = {
        id: directId,
        type: 'direct',
        name: `${adminName} & ${targetUserName || 'Staff'}`,
        topic: `Direct Message between ${adminName} and ${targetUserName || 'Colleague'}`,
        participants: Array.from(new Set([adminId, targetUserId, adminEmail, targetUserEmail].filter(Boolean))),
        allowedRoles: ['super_admin', targetUserRole || 'staff'].filter(Boolean),
        createdAt: nowIso,
        updatedAt: nowIso,
      };
      db.chatConversations.unshift(conv);
    } else {
      conv.updatedAt = nowIso;
    }

    const dmMessage = {
      id: `msg-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      conversationId: directId,
      senderId: adminId,
      senderName: adminName,
      senderEmail: adminEmail,
      senderRole: 'super_admin',
      senderRoleTitle: 'Super Admin • Financial Audit',
      content: `🔍 [Financial Audit Query • ${inv.caseNumber}]\nCase: ${inv.title}\n\nQuestion: ${question}${transactionContext ? `\nContext: ${transactionContext}` : ''}\n\nPlease open the "Audit Query" banner or notification alert to submit your official response and attach any payment receipt/proof.`,
      messageType: 'text',
      timestamp: nowIso,
      readBy: [adminId],
    };
    db.chatMessages.push(dmMessage);

    // 2. Push in-app Notification Bell alert targeted to the queried user
    if (!Array.isArray(db.notifications)) db.notifications = [];
    const notif = {
      id: `notif-audit-${Date.now()}`,
      userId: targetUserId,
      userEmail: targetUserEmail,
      title: `Audit Query Required (${inv.caseNumber})`,
      message: `${adminName} requested clarification on "${inv.title}": ${String(question).slice(0, 120)}`,
      type: 'finance',
      timestamp: nowIso,
      read: false,
      actionType: 'audit_query',
      auditQueryId: `aq-${Date.now()}`,
    };

    const queryRecord = {
      id: notif.auditQueryId,
      caseId: inv.id,
      caseNumber: inv.caseNumber,
      caseTitle: inv.title,
      targetUserId,
      targetUserName: String(targetUserName || 'ERP User'),
      targetUserRole: String(targetUserRole || 'staff'),
      targetUserEmail: targetUserEmail ? String(targetUserEmail) : undefined,
      question: String(question).trim(),
      transactionContext: String(transactionContext || inv.summary).trim(),
      expectedAmount: expectedAmount !== undefined ? Number(expectedAmount) : undefined,
      actualAmount: actualAmount !== undefined ? Number(actualAmount) : undefined,
      deltaAmount: deltaAmount !== undefined ? Number(deltaAmount) : undefined,
      chatConversationId: directId,
      status: 'Pending',
      createdAt: nowIso,
      createdBy: adminName,
    };

    db.notifications.unshift(notif);
    inv.queries.unshift(queryRecord);
    inv.status = 'Awaiting Response';
    inv.updatedAt = nowIso;
    inv.timeline.unshift({
      id: `tl-${Date.now()}`,
      timestamp: nowIso,
      actor: adminName,
      action: `Queried ${queryRecord.targetUserName}`,
      note: `Sent Audit Query via Chat DM & Notification Bell: "${queryRecord.question}"`,
    });

    saveDb();
    realtimeBus?.broadcast('notification:created', notif);
    realtimeBus?.broadcast('chat:message', dmMessage);

    res.json({ success: true, data: { query: queryRecord, investigation: inv, overview: buildOverviewPayload(db) } });
  });

  // -------------------------------------------------------------------------
  // 6. Saved Forensic Audit Reports Archive
  // -------------------------------------------------------------------------
  router.get('/reports', (req: Request, res: Response) => {
    if (!requireSuperAdmin(req, res)) return;
    const db = getDb();
    ensureAuditCollections(db);
    res.json({ success: true, data: db.financialAuditReports });
  });

  router.post('/reports', async (req: Request, res: Response) => {
    if (!requireSuperAdmin(req, res)) return;
    const db = getDb();
    ensureAuditCollections(db);
    const { title, periodLabel, generatedBy, includeResolved, includedCaseIds } = req.body || {};

    const latestScan = db.financialAuditScans[0] || runFullFinancialAudit(db, 'Report Auto-Scan').scan;
    const findingsSnapshot = (db.financialAuditFindings || []).filter((f: any) =>
      includeResolved ? true : f.status !== 'Resolved'
    );
    const selectedCaseIds: string[] = Array.isArray(includedCaseIds)
      ? includedCaseIds
      : (db.auditInvestigations || []).map((c: any) => c.id);
    const casesSnapshot = (db.auditInvestigations || []).filter((c: any) => selectedCaseIds.includes(c.id));

    const executiveSummary = generateExecutiveSummaryText(latestScan, findingsSnapshot, casesSnapshot);
    const aiNarrative =
      (await maybeEnhanceWithGemini('Draft a concise executive forensic audit memo summarizing key cash gaps, price differences, and priority investigations.', {
        executiveSummary,
        moneyFlow: latestScan.moneyFlow,
        criticalFindings: findingsSnapshot.filter((f: any) => f.severity === 'Critical').slice(0, 8),
      })) || undefined;

    const nowIso = new Date().toISOString();
    const reportCode = `FAR-${new Date().getFullYear()}-${String(db.financialAuditReports.length + 1).padStart(3, '0')}`;
    const report = {
      id: `rep-${Date.now()}`,
      reportCode,
      title: String(title || `ERP Financial Audit & Reconciliation Report (${new Date().toLocaleDateString()})`).trim(),
      periodLabel: String(periodLabel || `As of ${nowIso.slice(0, 10)}`).trim(),
      generatedBy: String(generatedBy || 'Super Admin'),
      generatedAt: nowIso,
      scanSnapshot: latestScan,
      executiveSummary,
      aiNarrative,
      findingCount: findingsSnapshot.length,
      criticalCount: findingsSnapshot.filter((f: any) => f.severity === 'Critical').length,
      warningCount: findingsSnapshot.filter((f: any) => f.severity === 'Warning').length,
      totalExposureNaira: Number(latestScan.moneyFlow?.netDiscrepancyExposure || 0),
      findingsSnapshot,
      includedCaseIds: selectedCaseIds,
      casesSnapshot,
      bankSnapshots: [...(db.companyBankSnapshots || [])],
    };

    db.financialAuditReports.unshift(report);
    saveDb();
    res.json({ success: true, data: { report, overview: buildOverviewPayload(db) } });
  });

  router.delete('/reports/:id', (req: Request, res: Response) => {
    if (!requireSuperAdmin(req, res)) return;
    const db = getDb();
    ensureAuditCollections(db);
    db.financialAuditReports = db.financialAuditReports.filter((r: any) => r.id !== req.params.id);
    saveDb();
    res.json({ success: true, data: buildOverviewPayload(db) });
  });

  // -------------------------------------------------------------------------
  // 7. "Ask AI Auditor" Forensic Q&A
  // -------------------------------------------------------------------------
  router.post('/ask', async (req: Request, res: Response) => {
    if (!requireSuperAdmin(req, res)) return;
    const db = getDb();
    const question = String(req.body?.question || '').trim();
    if (!question) {
      return res.status(400).json({ success: false, message: 'Please enter a financial audit question.' });
    }
    const result = await answerForensicQuestion(db, question);
    res.json({ success: true, data: result });
  });

  return router;
};

// ===========================================================================
// Scoped Router for Queried Non-Super-Admin Users (/api/audit-queries)
// Exposes ONLY the specific query addressed to the authenticated caller.
// ===========================================================================
export const createScopedAuditQueryRouter = (deps: Pick<FinancialAuditRouterDeps, 'getDb' | 'saveDb' | 'realtimeBus'>): Router => {
  const router = Router();
  const { getDb, saveDb, realtimeBus } = deps;

  const getCallerIdentity = (req: Request) => ({
    userId: String(req.headers['x-user-id'] || '').trim(),
    email: String(req.headers['x-user-email'] || '').trim().toLowerCase(),
  });

  const matchesCaller = (query: any, caller: { userId: string; email: string }) => {
    if (caller.userId && query.targetUserId === caller.userId) return true;
    if (caller.email && query.targetUserEmail && String(query.targetUserEmail).toLowerCase() === caller.email) return true;
    return false;
  };

  router.get('/my', (req: Request, res: Response) => {
    const caller = getCallerIdentity(req);
    if (!caller.userId && !caller.email) {
      return res.json({ success: true, data: [] });
    }
    const db = getDb();
    ensureAuditCollections(db);
    const myQueries: any[] = [];
    for (const inv of db.auditInvestigations) {
      for (const q of inv.queries || []) {
        if (matchesCaller(q, caller)) {
          myQueries.push({
            ...q,
            caseNumber: inv.caseNumber,
            caseTitle: inv.title,
          });
        }
      }
    }
    res.json({ success: true, data: myQueries });
  });

  router.post('/:queryId/respond', (req: Request, res: Response) => {
    const caller = getCallerIdentity(req);
    if (!caller.userId && !caller.email) {
      return res.status(401).json({ success: false, message: 'Authentication required to respond to an audit query.' });
    }
    const db = getDb();
    ensureAuditCollections(db);
    const { responseText, evidenceUrls } = req.body || {};
    if (!responseText || !String(responseText).trim()) {
      return res.status(400).json({ success: false, message: 'Please provide an explanation in your response.' });
    }

    let matchedCase: any = null;
    let matchedQuery: any = null;
    for (const inv of db.auditInvestigations) {
      const found = (inv.queries || []).find((q: any) => q.id === req.params.queryId);
      if (found) {
        matchedCase = inv;
        matchedQuery = found;
        break;
      }
    }

    if (!matchedQuery || !matchedCase) {
      return res.status(404).json({ success: false, message: 'Audit query not found.' });
    }
    if (!matchesCaller(matchedQuery, caller)) {
      return res.status(403).json({ success: false, message: 'Forbidden: You can only respond to audit queries addressed to you.' });
    }

    const nowIso = new Date().toISOString();
    matchedQuery.status = 'Responded';
    matchedQuery.responseText = String(responseText).trim();
    matchedQuery.evidenceUrls = Array.isArray(evidenceUrls) ? evidenceUrls.filter(Boolean) : [];
    matchedQuery.respondedAt = nowIso;

    const hasOtherPending = (matchedCase.queries || []).some((q: any) => q.status === 'Pending');
    if (!hasOtherPending && matchedCase.status === 'Awaiting Response') {
      matchedCase.status = 'Under Review';
    }
    matchedCase.updatedAt = nowIso;
    matchedCase.timeline.unshift({
      id: `tl-${Date.now()}`,
      timestamp: nowIso,
      actor: matchedQuery.targetUserName,
      action: 'User Responded to Query',
      note: `${matchedQuery.responseText}${matchedQuery.evidenceUrls.length ? ` (${matchedQuery.evidenceUrls.length} evidence file(s) attached)` : ''}`,
    });

    // Notify Super Admin(s)
    if (!Array.isArray(db.notifications)) db.notifications = [];
    const superAdminNotif = {
      id: `notif-audit-resp-${Date.now()}`,
      title: `Audit Query Answered (${matchedCase.caseNumber})`,
      message: `${matchedQuery.targetUserName} responded to "${matchedCase.title}": ${matchedQuery.responseText.slice(0, 120)}`,
      type: 'finance',
      timestamp: nowIso,
      read: false,
    };
    db.notifications.unshift(superAdminNotif);

    saveDb();
    realtimeBus?.broadcast('notification:created', superAdminNotif);
    res.json({ success: true, data: matchedQuery });
  });

  return router;
};
