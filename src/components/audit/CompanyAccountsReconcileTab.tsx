import React, { useEffect, useMemo, useState } from 'react';
import { formatNaira, useCRM } from '../../context/CRMContext';
import { SectionCard, SemanticMetricCard } from '../common/KineticUI';

const NIGERIAN_BANKS = [
  'FCMB',
  'Access Bank',
  'First Bank of Nigeria',
  'Guaranty Trust Bank (GTBank)',
  'United Bank for Africa (UBA)',
  'Zenith Bank',
  'Wema Bank',
  'Providus Bank',
  'Moniepoint MFB',
  'Kuda MFB',
  'OPay',
  'Fidelity Bank',
  'Stanbic IBTC Bank',
  'Sterling Bank',
  'Union Bank',
  'Polaris Bank',
  'Titan Trust Bank',
];

export const CompanyAccountsReconcileTab: React.FC = () => {
  const {
    wallet,
    students,
    isSyncingWallet,
    reconcileWalletWithPaystack,
    companyBankSnapshots,
    bankStatementTransactions,
    financialAuditScan,
    saveCompanyBankSnapshot,
    deleteCompanyBankSnapshot,
    importBankStatementCsv,
    importBankStatementPdf,
    matchBankStatementTransaction,
  } = useCRM();

  const [bankName, setBankName] = useState(NIGERIAN_BANKS[0]);
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [closingBalance, setClosingBalance] = useState('');
  const [asOfDate, setAsOfDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');
  const [isSavingBank, setIsSavingBank] = useState(false);

  // Unified PDF / CSV Statement Importer state
  const [importMode, setImportMode] = useState<'pdf' | 'csv'>('pdf');
  const [selectedBankId, setSelectedBankId] = useState('');
  const [autoCreateAccount, setAutoCreateAccount] = useState(true);
  const [updateClosingBalance, setUpdateClosingBalance] = useState(true);
  const [pdfFileName, setPdfFileName] = useState('');
  const [pdfFileSize, setPdfFileSize] = useState(0);
  const [pdfBase64, setPdfBase64] = useState('');
  const [csvText, setCsvText] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [lastImportSummary, setLastImportSummary] = useState<{
    source: 'pdf' | 'csv';
    bankLabel: string;
    importedCount: number;
    skippedDuplicates: number;
    totalCredits: number;
    totalDebits: number;
    bankChargesTotal?: number;
    bankChargesCount?: number;
    closingBalance?: number;
  } | null>(null);

  // Ledger filtering, Date Range, Pagination & Manual Student Linking
  const [txFilter, setTxFilter] = useState<'ALL' | 'MATCHED_STUDENTS' | 'UNMATCHED' | 'credit' | 'debit' | 'BANK_FEES'>('ALL');
  const [txSearch, setTxSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [txPage, setTxPage] = useState(1);
  const [txPageSize, setTxPageSize] = useState(15);
  const [linkingTxId, setLinkingTxId] = useState<string | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState('');

  useEffect(() => {
    setTxPage(1);
  }, [txFilter, txSearch, dateFrom, dateTo, txPageSize]);

  const mf = financialAuditScan?.moneyFlow;
  const paystackBalance = Number(
    mf?.paystackLiveBalance ?? wallet?.paystackLiveBalance ?? wallet?.balance ?? 0
  );
  const externalTotal = Number(mf?.externalBankBalancesTotal ?? 0);
  const actualTotal = paystackBalance + externalTotal;
  const expectedNet = Number(mf?.expectedNetCashPosition ?? 0);
  const cashGap = actualTotal - expectedNet;

  const sortedStudents = useMemo(
    () =>
      [...(students || [])]
        .filter((s) => !String(s.email || '').includes('.qa.'))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [students]
  );

  const handleSaveBank = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNuban = accountNumber.replace(/\D/g, '');
    if (cleanNuban.length !== 10) return;
    setIsSavingBank(true);
    try {
      const ok = await saveCompanyBankSnapshot({
        bankName,
        accountNumber: cleanNuban,
        accountName: accountName.trim() || `${bankName} Corporate Account`,
        closingBalance: Number(closingBalance || 0),
        asOfDate,
        notes: notes.trim(),
      });
      if (ok) {
        setAccountNumber('');
        setAccountName('');
        setClosingBalance('');
        setNotes('');
      }
    } finally {
      setIsSavingBank(false);
    }
  };

  const handlePdfFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPdfFileName(file.name);
    setPdfFileSize(file.size);
    const reader = new FileReader();
    reader.onload = () => {
      setPdfBase64(String(reader.result || ''));
    };
    reader.readAsDataURL(file);
  };

  const handleCsvFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setCsvText(String(reader.result || ''));
    };
    reader.readAsText(file);
  };

  const handleImportPdf = async () => {
    if (!pdfBase64) return;
    setIsImporting(true);
    try {
      const res = await importBankStatementPdf({
        pdfBase64,
        fileName: pdfFileName,
        bankAccountId: selectedBankId || undefined,
        autoCreateAccount,
        updateClosingBalance,
      });
      if (res?.overview) {
        setLastImportSummary({
          source: 'pdf',
          bankLabel: res.account
            ? `${res.account.bankName} • ${res.account.accountNumber} (${res.account.accountName})`
            : pdfFileName,
          importedCount: res.importedCount,
          skippedDuplicates: res.skippedDuplicates,
          totalCredits: res.totalCredits,
          totalDebits: res.totalDebits,
          bankChargesTotal: res.bankChargesTotal,
          bankChargesCount: res.bankChargesCount,
          closingBalance: res.detectedClosingBalance,
        });
        setPdfBase64('');
        setPdfFileName('');
        setPdfFileSize(0);
      }
    } finally {
      setIsImporting(false);
    }
  };

  const handleImportCsv = async () => {
    const targetId = selectedBankId || companyBankSnapshots[0]?.id;
    if (!targetId || !csvText.trim()) return;
    setIsImporting(true);
    try {
      const res = await importBankStatementCsv({
        bankAccountId: targetId,
        csvText,
        updateClosingBalance,
      });
      if (res) {
        const acct = companyBankSnapshots.find((b) => b.id === targetId);
        setLastImportSummary({
          source: 'csv',
          bankLabel: acct ? `${acct.bankName} • ${acct.accountNumber}` : 'Bank CSV',
          importedCount: res.importedCount,
          skippedDuplicates: res.skippedDuplicates,
          totalCredits: res.totalCredits,
          totalDebits: res.totalDebits,
          closingBalance: res.detectedClosingBalance,
        });
        setCsvText('');
      }
    } finally {
      setIsImporting(false);
    }
  };

  const handleManualLink = async (txId: string) => {
    if (!selectedStudentId) return;
    const ok = await matchBankStatementTransaction(txId, { studentId: selectedStudentId });
    if (ok) {
      setLinkingTxId(null);
      setSelectedStudentId('');
    }
  };

  const filteredTxns = useMemo(() => {
    const q = txSearch.trim().toLowerCase();
    return (bankStatementTransactions || []).filter((t) => {
      if (txFilter === 'credit' && t.type !== 'credit') return false;
      if (txFilter === 'debit' && t.type !== 'debit') return false;
      if (txFilter === 'MATCHED_STUDENTS' && t.matchedEntityType !== 'student') return false;
      if (txFilter === 'UNMATCHED' && t.matchedEntityId) return false;
      if (txFilter === 'BANK_FEES' && t.matchedEntityType !== 'bank_charge') return false;

      const txDate = String(t.date || '').slice(0, 10);
      if (dateFrom && txDate < dateFrom) return false;
      if (dateTo && txDate > dateTo) return false;

      if (q) {
        const hay = `${t.bankName} ${t.description} ${t.reference} ${t.matchedEntityName || ''} ${t.matchedCourseName || ''} ${t.matchReason || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [bankStatementTransactions, txFilter, txSearch, dateFrom, dateTo]);

  const txTotalPages = Math.max(1, Math.ceil(filteredTxns.length / txPageSize));
  const safeTxPage = Math.min(txPage, txTotalPages);
  const paginatedTxns = useMemo(() => {
    const start = (safeTxPage - 1) * txPageSize;
    return filteredTxns.slice(start, start + txPageSize);
  }, [filteredTxns, safeTxPage, txPageSize]);

  return (
    <div className="space-y-5">
      {/* Hybrid Cash Reconciliation Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SemanticMetricCard
          label="Paystack Live Balance"
          value={formatNaira(paystackBalance)}
          icon="account_balance_wallet"
          intent="blue"
          subtitle={wallet?.lastSyncedAt ? `Synced ${new Date(wallet.lastSyncedAt).toLocaleString()}` : 'Click Sync Paystack'}
          footer={
            <button
              type="button"
              onClick={() => reconcileWalletWithPaystack()}
              disabled={isSyncingWallet}
              className="inline-flex items-center gap-1.5 text-[11px] font-bold text-blue-700 hover:text-blue-800 disabled:opacity-50 cursor-pointer"
            >
              <span className={`material-symbols-outlined text-[15px] ${isSyncingWallet ? 'animate-spin' : ''}`}>sync</span>
              {isSyncingWallet ? 'Syncing Paystack...' : 'Sync Live Balance Now'}
            </button>
          }
        />
        <SemanticMetricCard
          label="External Nigerian Banks"
          value={formatNaira(externalTotal)}
          icon="account_balance"
          intent="sky"
          badge={`${companyBankSnapshots.length} acct${companyBankSnapshots.length === 1 ? '' : 's'}`}
          subtitle="Closing balance snapshots"
        />
        <SemanticMetricCard
          label="Expected Net Cash (ERP)"
          value={formatNaira(expectedNet)}
          icon="calculate"
          intent="emerald"
          subtitle="Inflows − Mentors − OpEx"
        />
        <SemanticMetricCard
          label="Cash Reconciliation Gap"
          value={`${cashGap >= 0 ? '+' : '-'}${formatNaira(Math.abs(cashGap))}`}
          icon={Math.abs(cashGap) > 100 ? 'warning' : 'verified'}
          intent={Math.abs(cashGap) > 100 ? 'red' : 'emerald'}
          badge={cashGap < -100 ? 'Shortfall' : cashGap > 100 ? 'Surplus' : 'Balanced'}
          badgePulse={Math.abs(cashGap) > 100}
          subtitle="Actual Cash − Expected Net"
        />
      </div>

      {/* Add External Nigerian Bank Snapshot + PDF / CSV Statement Importer */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <SectionCard
          title="Company External Bank Accounts"
          subtitle="Record 10-digit NUBAN closing balances or auto-create them by uploading a PDF statement"
          icon="account_balance"
        >
          <form onSubmit={handleSaveBank} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-secondary mb-1">Nigerian Bank</label>
                <select
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full rounded-lg border border-outline-variant bg-white px-3 py-2 text-xs font-medium text-on-surface"
                >
                  {NIGERIAN_BANKS.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-secondary mb-1">10-Digit NUBAN</label>
                <input
                  type="text"
                  maxLength={10}
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="2002888281"
                  required
                  className="w-full rounded-lg border border-outline-variant bg-white px-3 py-2 text-xs font-data-tabular text-on-surface"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-secondary mb-1">Account Name</label>
                <input
                  type="text"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  placeholder="e.g. Codelab Educare Ltd"
                  className="w-full rounded-lg border border-outline-variant bg-white px-3 py-2 text-xs text-on-surface"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-secondary mb-1">Closing Balance (₦)</label>
                <input
                  type="number"
                  min={0}
                  step="any"
                  value={closingBalance}
                  onChange={(e) => setClosingBalance(e.target.value)}
                  placeholder="294710.15"
                  required
                  className="w-full rounded-lg border border-outline-variant bg-white px-3 py-2 text-xs font-data-tabular text-on-surface"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-secondary mb-1">As-Of Date</label>
                <input
                  type="date"
                  value={asOfDate}
                  onChange={(e) => setAsOfDate(e.target.value)}
                  className="w-full rounded-lg border border-outline-variant bg-white px-3 py-2 text-xs text-on-surface"
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-1">
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional reconciliation note..."
                className="flex-1 rounded-lg border border-outline-variant bg-white px-3 py-2 text-xs text-on-surface"
              />
              <button
                type="submit"
                disabled={isSavingBank || accountNumber.length !== 10}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-white text-xs font-bold hover:bg-primary/90 disabled:opacity-50 cursor-pointer shrink-0"
              >
                <span className="material-symbols-outlined text-[16px]">save</span>
                {isSavingBank ? 'Saving...' : 'Save Snapshot'}
              </button>
            </div>
          </form>

          {/* Saved Bank Accounts List */}
          <div className="mt-4 pt-3 border-t border-outline-variant/60 space-y-2">
            {companyBankSnapshots.length === 0 ? (
              <p className="text-xs text-secondary text-center py-4">
                No external bank snapshots added yet. Upload a PDF bank statement on the right to auto-detect and save it!
              </p>
            ) : (
              companyBankSnapshots.map((b) => (
                <div
                  key={b.id}
                  className="flex items-center justify-between gap-3 p-3 rounded-lg bg-canvas/70 border border-outline-variant/70"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-on-surface truncate">
                      {b.bankName} • <span className="font-data-tabular">{b.accountNumber}</span>
                    </p>
                    <p className="text-[11px] text-secondary truncate">
                      {b.accountName} • As of {b.asOfDate}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-sm font-extrabold text-on-surface font-data-tabular">
                      {formatNaira(b.closingBalance)}
                    </span>
                    <button
                      type="button"
                      onClick={() => deleteCompanyBankSnapshot(b.id)}
                      className="p-1.5 rounded-lg text-secondary hover:text-red-600 hover:bg-red-500/10 transition-colors cursor-pointer"
                      title="Remove snapshot"
                    >
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </SectionCard>

        {/* Unified Bank Statement PDF & CSV Importer */}
        <SectionCard
          title="Import Bank Statement (PDF or CSV)"
          subtitle="Upload digital Nigerian bank PDF statements (FCMB, GTBank, Zenith, Access, UBA, etc.) or CSV exports"
          icon="picture_as_pdf"
          headerAction={
            <div className="inline-flex p-0.5 rounded-lg bg-canvas border border-outline-variant/80">
              <button
                type="button"
                onClick={() => setImportMode('pdf')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold cursor-pointer transition-colors ${
                  importMode === 'pdf' ? 'bg-primary text-white' : 'text-secondary hover:text-on-surface'
                }`}
              >
                PDF Statement
              </button>
              <button
                type="button"
                onClick={() => setImportMode('csv')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold cursor-pointer transition-colors ${
                  importMode === 'csv' ? 'bg-primary text-white' : 'text-secondary hover:text-on-surface'
                }`}
              >
                CSV / Paste
              </button>
            </div>
          }
        >
          {importMode === 'pdf' ? (
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-secondary mb-1">
                  Target Company Account (optional if auto-detect is enabled)
                </label>
                <select
                  value={selectedBankId}
                  onChange={(e) => setSelectedBankId(e.target.value)}
                  className="w-full rounded-lg border border-outline-variant bg-white px-3 py-2 text-xs font-medium text-on-surface"
                >
                  <option value="">Auto-detect Bank &amp; 10-digit NUBAN from PDF header</option>
                  {companyBankSnapshots.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.bankName} ({b.accountNumber}) — {b.accountName}
                    </option>
                  ))}
                </select>
              </div>

              <label className="flex flex-col items-center justify-center gap-2 p-5 rounded-xl border-2 border-dashed border-primary/35 bg-primary/[0.03] hover:bg-primary/[0.06] transition-colors cursor-pointer text-center">
                <span className="w-10 h-10 rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[22px]">upload_file</span>
                </span>
                <div>
                  <p className="text-xs font-bold text-on-surface">
                    {pdfFileName ? pdfFileName : 'Click to select your Bank Statement PDF'}
                  </p>
                  <p className="text-[11px] text-secondary mt-0.5">
                    {pdfFileName
                      ? `${(pdfFileSize / 1024).toFixed(1)} KB ready • Running-balance credit/debit verification enabled`
                      : 'Supports FCMB, GTBank, Zenith, Access, UBA, First Bank, Wema & Moniepoint PDFs'}
                  </p>
                </div>
                <input
                  type="file"
                  accept="application/pdf,.pdf"
                  onChange={handlePdfFileSelect}
                  className="hidden"
                />
              </label>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
                <div className="space-y-1">
                  <label className="flex items-center gap-2 text-xs text-secondary cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoCreateAccount}
                      onChange={(e) => setAutoCreateAccount(e.target.checked)}
                      className="rounded border-outline-variant text-primary"
                    />
                    Auto-create / match bank account from PDF NUBAN
                  </label>
                  <label className="flex items-center gap-2 text-xs text-secondary cursor-pointer">
                    <input
                      type="checkbox"
                      checked={updateClosingBalance}
                      onChange={(e) => setUpdateClosingBalance(e.target.checked)}
                      className="rounded border-outline-variant text-primary"
                    />
                    Sync closing balance from statement
                  </label>
                </div>

                <button
                  type="button"
                  onClick={handleImportPdf}
                  disabled={isImporting || !pdfBase64}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 disabled:opacity-50 cursor-pointer shrink-0"
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {isImporting ? 'hourglass_top' : 'fact_check'}
                  </span>
                  {isImporting ? 'Parsing & Reconciling PDF...' : 'Import & Reconcile PDF'}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-secondary mb-1">Target Company Account</label>
                  <select
                    value={selectedBankId || companyBankSnapshots[0]?.id || ''}
                    onChange={(e) => setSelectedBankId(e.target.value)}
                    className="w-full rounded-lg border border-outline-variant bg-white px-3 py-2 text-xs font-medium text-on-surface"
                  >
                    {companyBankSnapshots.length === 0 ? (
                      <option value="">Add a bank account on the left first</option>
                    ) : (
                      companyBankSnapshots.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.bankName} ({b.accountNumber})
                        </option>
                      ))
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-secondary mb-1">Upload CSV File</label>
                  <input
                    type="file"
                    accept=".csv,text/csv"
                    onChange={handleCsvFileUpload}
                    className="w-full rounded-lg border border-outline-variant bg-white px-2.5 py-1.5 text-xs text-secondary file:mr-2 file:rounded-md file:border-0 file:bg-primary/10 file:px-2.5 file:py-1 file:text-xs file:font-bold file:text-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-secondary mb-1">
                  CSV Preview / Paste Statement Rows
                </label>
                <textarea
                  rows={4}
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  placeholder={'Date,Narration,Reference,Debit,Credit,Balance\n2026-11-20,Tuition Transfer - Ada Obi,NIP99210,,350000,2850000'}
                  className="w-full rounded-lg border border-outline-variant bg-white px-3 py-2 text-[11px] font-mono text-on-surface"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="inline-flex items-center gap-2 text-xs text-secondary cursor-pointer">
                  <input
                    type="checkbox"
                    checked={updateClosingBalance}
                    onChange={(e) => setUpdateClosingBalance(e.target.checked)}
                    className="rounded border-outline-variant text-primary"
                  />
                  Auto-update closing balance from last CSV row
                </label>

                <button
                  type="button"
                  onClick={handleImportCsv}
                  disabled={isImporting || !csvText.trim() || companyBankSnapshots.length === 0}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 disabled:opacity-50 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">file_upload</span>
                  {isImporting ? 'Importing & Scanning...' : 'Import & Reconcile CSV'}
                </button>
              </div>
            </div>
          )}

          {/* Last Import Verification Summary */}
          {lastImportSummary && (
            <div className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-xs space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-emerald-700">verified</span>
                  Imported: {lastImportSummary.bankLabel}
                </span>
                <span className="text-[11px] font-bold text-emerald-800">
                  {lastImportSummary.importedCount} new ({lastImportSummary.skippedDuplicates} dupes skipped)
                </span>
              </div>
              <div className="flex flex-wrap gap-4 text-[11px] font-data-tabular text-emerald-900">
                <span>Credits: <strong>{formatNaira(lastImportSummary.totalCredits)}</strong></span>
                <span>Debits: <strong>{formatNaira(lastImportSummary.totalDebits)}</strong></span>
                {typeof lastImportSummary.bankChargesTotal === 'number' && (
                  <span>
                    Bank Fees Auto-Classified: <strong>{formatNaira(lastImportSummary.bankChargesTotal)}</strong> ({lastImportSummary.bankChargesCount})
                  </span>
                )}
                {typeof lastImportSummary.closingBalance === 'number' && (
                  <span>Closing Balance: <strong>{formatNaira(lastImportSummary.closingBalance)}</strong></span>
                )}
              </div>
            </div>
          )}
        </SectionCard>
      </div>

      {/* Imported Bank Statement Transactions Ledger with Date/Course/Name Filtering, Pagination & Manual Student Link */}
      <SectionCard
        title={`Imported Bank Statement Ledger (${filteredTxns.length})`}
        subtitle="Smart-matched by Student Name, Course Description, Payment Date (±7d), and Amount — click Link Student to override any row"
        icon="receipt_long"
      >
        {/* Filter & Date Range Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-outline-variant/60">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <span className="material-symbols-outlined text-[15px] text-secondary absolute left-2.5 top-1/2 -translate-y-1/2">
                search
              </span>
              <input
                type="text"
                value={txSearch}
                onChange={(e) => setTxSearch(e.target.value)}
                placeholder="Search student, course, narration..."
                className="rounded-lg border border-outline-variant bg-white pl-8 pr-3 py-1.5 text-xs text-on-surface w-56"
              />
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-secondary">
              <span>From:</span>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="rounded-lg border border-outline-variant bg-white px-2 py-1 text-xs text-on-surface"
              />
              <span>To:</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="rounded-lg border border-outline-variant bg-white px-2 py-1 text-xs text-on-surface"
              />
              {(dateFrom || dateTo) && (
                <button
                  type="button"
                  onClick={() => {
                    setDateFrom('');
                    setDateTo('');
                  }}
                  className="text-[11px] font-bold text-primary hover:underline cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={txFilter}
              onChange={(e) => setTxFilter(e.target.value as any)}
              className="rounded-lg border border-outline-variant bg-white px-2.5 py-1.5 text-xs font-semibold text-on-surface"
            >
              <option value="ALL">All Entries</option>
              <option value="MATCHED_STUDENTS">Matched Students</option>
              <option value="UNMATCHED">Unmatched Only</option>
              <option value="credit">Credits Only</option>
              <option value="debit">Debits Only</option>
              <option value="BANK_FEES">Bank Fees / Levies</option>
            </select>
            <select
              value={txPageSize}
              onChange={(e) => setTxPageSize(Number(e.target.value))}
              className="rounded-lg border border-outline-variant bg-white px-2.5 py-1.5 text-xs font-semibold text-on-surface"
            >
              <option value={15}>15 / page</option>
              <option value={30}>30 / page</option>
              <option value={50}>50 / page</option>
            </select>
          </div>
        </div>

        {paginatedTxns.length === 0 ? (
          <div className="py-8 text-center text-xs text-secondary">
            No imported bank statement entries matching this filter. Upload a PDF or CSV statement above or adjust your date range.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-canvas text-secondary uppercase text-[10px]">
                  <tr>
                    <th className="px-3 py-2 text-left">Date</th>
                    <th className="px-3 py-2 text-left">Bank</th>
                    <th className="px-3 py-2 text-left">Narration / Ref</th>
                    <th className="px-3 py-2 text-right">Amount</th>
                    <th className="px-3 py-2 text-right">Balance</th>
                    <th className="px-3 py-2 text-left">ERP Student / Match</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/50">
                  {paginatedTxns.map((t) => (
                    <tr key={t.id} className="hover:bg-canvas/50">
                      <td className="px-3 py-2 font-data-tabular text-secondary whitespace-nowrap">
                        {String(t.date).slice(0, 10)}
                      </td>
                      <td className="px-3 py-2 font-semibold text-on-surface whitespace-nowrap">{t.bankName}</td>
                      <td className="px-3 py-2">
                        <p className="font-medium text-on-surface truncate max-w-xs" title={t.description}>
                          {t.description}
                        </p>
                        <p className="text-[10px] font-mono text-secondary">{t.reference}</p>
                      </td>
                      <td
                        className={`px-3 py-2 text-right font-bold font-data-tabular whitespace-nowrap ${
                          t.type === 'credit' ? 'text-emerald-700' : 'text-red-600'
                        }`}
                      >
                        {t.type === 'credit' ? '+' : '-'}
                        {formatNaira(t.amount)}
                      </td>
                      <td className="px-3 py-2 text-right font-data-tabular text-secondary whitespace-nowrap">
                        {typeof t.balanceAfter === 'number' ? formatNaira(t.balanceAfter) : '—'}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {t.matchedEntityType === 'bank_charge' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/10 text-sky-700 border border-sky-500/20">
                                <span className="material-symbols-outlined text-[13px]">receipt</span>
                                Bank Fee / Levy
                              </span>
                            ) : t.matchedEntityId ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-700 border border-emerald-500/20">
                                <span className="material-symbols-outlined text-[13px]">link</span>
                                {t.matchedEntityName || t.matchedEntityType}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-700 border border-amber-500/20">
                                <span className="material-symbols-outlined text-[13px]">help</span>
                                Unmatched
                              </span>
                            )}

                            {t.type === 'credit' && (
                              <button
                                type="button"
                                onClick={() => {
                                  setLinkingTxId(linkingTxId === t.id ? null : t.id);
                                  setSelectedStudentId(t.matchedEntityType === 'student' && t.matchedEntityId ? t.matchedEntityId : '');
                                }}
                                className="text-[10px] font-bold text-primary hover:underline cursor-pointer"
                              >
                                {t.matchedEntityType === 'student' ? 'Change' : 'Link Student'}
                              </button>
                            )}
                          </div>

                          {(t.matchedCourseName || t.matchReason) && (
                            <p className="text-[10px] text-secondary truncate max-w-[230px]">
                              {t.matchedCourseName ? `${t.matchedCourseName} • ` : ''}
                              {t.matchReason}
                            </p>
                          )}

                          {linkingTxId === t.id && (
                            <div className="flex items-center gap-1.5 mt-1">
                              <select
                                value={selectedStudentId}
                                onChange={(e) => setSelectedStudentId(e.target.value)}
                                className="rounded-md border border-outline-variant bg-white px-2 py-1 text-[11px] max-w-[180px]"
                              >
                                <option value="">Select student...</option>
                                {sortedStudents.map((s) => (
                                  <option key={s.id} value={s.id}>
                                    {s.name} ({s.program})
                                  </option>
                                ))}
                              </select>
                              <button
                                type="button"
                                onClick={() => handleManualLink(t.id)}
                                disabled={!selectedStudentId}
                                className="px-2 py-1 rounded-md bg-primary text-white text-[10px] font-bold disabled:opacity-50 cursor-pointer"
                              >
                                Save
                              </button>
                              {t.matchedEntityId && (
                                <button
                                  type="button"
                                  onClick={async () => {
                                    await matchBankStatementTransaction(t.id, { clearMatch: true });
                                    setLinkingTxId(null);
                                  }}
                                  className="px-2 py-1 rounded-md bg-red-500/10 text-red-700 text-[10px] font-bold cursor-pointer"
                                >
                                  Unlink
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Ledger Pagination Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 mt-3 border-t border-outline-variant/60 text-xs">
              <span className="text-secondary font-data-tabular">
                Showing <strong>{(safeTxPage - 1) * txPageSize + 1}</strong>–
                <strong>{Math.min(safeTxPage * txPageSize, filteredTxns.length)}</strong> of{' '}
                <strong>{filteredTxns.length}</strong> bank entries
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={safeTxPage <= 1}
                  onClick={() => setTxPage((p) => Math.max(1, p - 1))}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-outline-variant bg-white font-bold text-on-surface hover:bg-canvas disabled:opacity-40 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[15px]">chevron_left</span>
                  Prev
                </button>
                <span className="px-3 py-1.5 font-bold font-data-tabular text-on-surface">
                  Page {safeTxPage} / {txTotalPages}
                </span>
                <button
                  type="button"
                  disabled={safeTxPage >= txTotalPages}
                  onClick={() => setTxPage((p) => Math.min(txTotalPages, p + 1))}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-outline-variant bg-white font-bold text-on-surface hover:bg-canvas disabled:opacity-40 cursor-pointer"
                >
                  Next
                  <span className="material-symbols-outlined text-[15px]">chevron_right</span>
                </button>
              </div>
            </div>
          </>
        )}
      </SectionCard>
    </div>
  );
};
