import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowUpRight,
  Banknote,
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Edit3,
  Eye,
  Filter,
  Plus,
  RefreshCw,
  Search,
  Users,
  Wallet,
  X
} from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { MentorReconciliationRow } from '../../types/crm';

const formatNaira = (amount: number) => `₦${Number(amount || 0).toLocaleString()}`;

export const MentorReconciliationTab: React.FC = () => {
  const {
    mentors,
    students,
    wallet,
    payoutRequests,
    reconciliationRows,
    fetchMentorReconciliation,
    updateReconciliationLedger,
    recordMentorStudentDeposit,
    disburseMentorFromWallet,
    recordManualMentorPayout
  } = useCRM();

  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [cohortFilter, setCohortFilter] = useState<string>('ALL');
  const [mentorFilter, setMentorFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modals
  const [inspectRow, setInspectRow] = useState<MentorReconciliationRow | null>(null);
  const [payoutRow, setPayoutRow] = useState<MentorReconciliationRow | null>(null);
  const [editRow, setEditRow] = useState<MentorReconciliationRow | null>(null);

  // Payout modal state
  const [payoutMethod, setPayoutMethod] = useState<'paystack' | 'manual_bank'>('manual_bank');
  const [payoutAmount, setPayoutAmount] = useState<string>('');
  const [bankReference, setBankReference] = useState<string>('');
  const [payoutNotes, setPayoutNotes] = useState<string>('');
  const [bypassHoursCheck, setBypassHoursCheck] = useState<boolean>(true);
  const [isSubmittingPayout, setIsSubmittingPayout] = useState(false);

  // Log student deposit state inside inspect modal
  const [depositStudentId, setDepositStudentId] = useState<string>('');
  const [depositAmount, setDepositAmount] = useState<string>('');
  const [depositRef, setDepositRef] = useState<string>('');
  const [isLoggingDeposit, setIsLoggingDeposit] = useState(false);

  // Edit ledger state
  const [editMentorId, setEditMentorId] = useState<string>('');
  const [editAgreedDue, setEditAgreedDue] = useState<string>('');
  const [editNotes, setEditNotes] = useState<string>('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Show mentor summary rollup toggle
  const [showMentorRollup, setShowMentorRollup] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    fetchMentorReconciliation().finally(() => setIsLoading(false));
  }, [fetchMentorReconciliation]);

  const cohortsList = useMemo(() => {
    return Array.from(new Set(reconciliationRows.map(r => r.cohortName)));
  }, [reconciliationRows]);

  const filteredRows = useMemo(() => {
    return reconciliationRows.filter(row => {
      if (cohortFilter !== 'ALL' && row.cohortName !== cohortFilter) return false;
      if (mentorFilter !== 'ALL' && row.mentorId !== mentorFilter) return false;
      if (statusFilter === 'VARIANCE') {
        if (Math.abs(row.varianceAmount) === 0) return false;
      } else if (statusFilter !== 'ALL' && row.paymentStatus !== statusFilter) {
        return false;
      }
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const hit =
          row.cohortName.toLowerCase().includes(q) ||
          row.courseName.toLowerCase().includes(q) ||
          row.mentorName.toLowerCase().includes(q) ||
          (row.notes || '').toLowerCase().includes(q);
        if (!hit) return false;
      }
      return true;
    });
  }, [reconciliationRows, cohortFilter, mentorFilter, statusFilter, searchTerm]);

  const totals = useMemo(() => {
    return filteredRows.reduce(
      (acc, r) => {
        acc.studentDeposits += r.effectiveStudentPaid;
        acc.calculated37 += r.calculatedCommission37;
        acc.agreedDue += r.agreedAmountDue;
        acc.disbursed += r.amountDisbursed;
        acc.outstanding += r.outstandingAmount;
        if (Math.abs(r.varianceAmount) > 0) acc.variances += 1;
        return acc;
      },
      { studentDeposits: 0, calculated37: 0, agreedDue: 0, disbursed: 0, outstanding: 0, variances: 0 }
    );
  }, [filteredRows]);

  const mentorRollup = useMemo(() => {
    const map = new Map<string, {
      mentorId: string;
      mentorName: string;
      deposits: number;
      agreedDue: number;
      disbursed: number;
      outstanding: number;
      rows: number;
    }>();
    for (const r of filteredRows) {
      if (!map.has(r.mentorId)) {
        map.set(r.mentorId, {
          mentorId: r.mentorId,
          mentorName: r.mentorName,
          deposits: 0,
          agreedDue: 0,
          disbursed: 0,
          outstanding: 0,
          rows: 0
        });
      }
      const m = map.get(r.mentorId)!;
      m.deposits += r.effectiveStudentPaid;
      m.agreedDue += r.agreedAmountDue;
      m.disbursed += r.amountDisbursed;
      m.outstanding += r.outstandingAmount;
      m.rows += 1;
    }
    return Array.from(map.values()).sort((a, b) => b.outstanding - a.outstanding);
  }, [filteredRows]);

  const openPayoutModal = (row: MentorReconciliationRow) => {
    setPayoutRow(row);
    setPayoutMethod('manual_bank');
    setPayoutAmount(String(row.outstandingAmount > 0 ? row.outstandingAmount : row.agreedAmountDue));
    setBankReference('');
    setPayoutNotes(`${row.cohortName} — ${row.courseName} commission settlement`);
    setBypassHoursCheck(true);
  };

  const handlePayoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payoutRow) return;
    const amt = Number(payoutAmount);
    if (!amt || amt <= 0) return;

    setIsSubmittingPayout(true);
    try {
      let ok = false;
      if (payoutMethod === 'paystack') {
        ok = await disburseMentorFromWallet(
          payoutRow.mentorId,
          amt,
          payoutNotes || `${payoutRow.cohortName} - ${payoutRow.courseName}`,
          undefined,
          { bypassHoursCheck, cohortLedgerId: payoutRow.id }
        );
        if (ok) await fetchMentorReconciliation();
      } else {
        ok = await recordManualMentorPayout(payoutRow.mentorId, {
          amount: amt,
          bankReference: bankReference.trim() || undefined,
          notes: payoutNotes.trim() || undefined,
          cohortLedgerId: payoutRow.id,
          bypassHoursCheck
        });
      }
      if (ok) {
        setPayoutRow(null);
      }
    } finally {
      setIsSubmittingPayout(false);
    }
  };

  const openEditModal = (row: MentorReconciliationRow) => {
    setEditRow(row);
    setEditMentorId(row.mentorId);
    setEditAgreedDue(String(row.agreedAmountDue));
    setEditNotes(row.notes || '');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editRow) return;
    setIsSavingEdit(true);
    try {
      const ok = await updateReconciliationLedger(editRow.id, {
        mentorId: editMentorId,
        agreedAmountDue: Number(editAgreedDue),
        notes: editNotes
      });
      if (ok) setEditRow(null);
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleLogDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inspectRow || !depositStudentId || !Number(depositAmount)) return;
    setIsLoggingDeposit(true);
    try {
      const ok = await recordMentorStudentDeposit(inspectRow.mentorId, {
        studentId: depositStudentId,
        amount: Number(depositAmount),
        paymentReference: depositRef.trim() || undefined,
        cohortLedgerId: inspectRow.id
      });
      if (ok) {
        setDepositAmount('');
        setDepositRef('');
        setDepositStudentId('');
        setInspectRow(null);
      }
    } finally {
      setIsLoggingDeposit(false);
    }
  };

  const refreshData = () => {
    setIsLoading(true);
    fetchMentorReconciliation().finally(() => setIsLoading(false));
  };

  const realStudents = useMemo(
    () => students.filter(s => !String(s.email || '').includes('.qa.')),
    [students]
  );

  return (
    <div className="space-y-6">
      {/* KPI Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Student Deposits</p>
          <p className="text-xl font-bold text-slate-900 mt-1">{formatNaira(totals.studentDeposits)}</p>
          <p className="text-xs text-slate-500 mt-1">Across {filteredRows.length} cohort courses</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">37% Calc. Commission</p>
          <p className="text-xl font-bold text-indigo-700 mt-1">{formatNaira(totals.calculated37)}</p>
          <p className="text-xs text-slate-500 mt-1">Agreed Due: {formatNaira(totals.agreedDue)}</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Previously Disbursed</p>
          <p className="text-xl font-bold text-emerald-700 mt-1">{formatNaira(totals.disbursed)}</p>
          <p className="text-xs text-slate-500 mt-1">Historical + Live payouts</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Outstanding Payable</p>
          <p className="text-xl font-bold text-amber-700 mt-1">{formatNaira(totals.outstanding)}</p>
          <p className="text-xs text-slate-500 mt-1">Wallet Bal: {formatNaira(wallet?.balance || 0)}</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Variances Flagged</p>
          <p className="text-xl font-bold text-rose-600 mt-1">{totals.variances}</p>
          <p className="text-xs text-slate-500 mt-1">Overrides vs 37% formula</p>
        </div>
      </div>

      {/* Mentor Rollup Toggle */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <button
          type="button"
          onClick={() => setShowMentorRollup(v => !v)}
          className="w-full px-5 py-3.5 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <Users className="w-4 h-4 text-indigo-600" />
            <span className="font-semibold text-slate-800 text-sm">
              Per-Mentor Commission &amp; Payout Summary ({mentorRollup.length} Mentors)
            </span>
          </div>
          {showMentorRollup ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
        </button>

        {showMentorRollup && (
          <div className="border-t border-slate-200 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-2.5 text-left">Mentor</th>
                  <th className="px-4 py-2.5 text-right">Courses</th>
                  <th className="px-4 py-2.5 text-right">Student Deposits</th>
                  <th className="px-4 py-2.5 text-right">Total Commission Due</th>
                  <th className="px-4 py-2.5 text-right">Disbursed</th>
                  <th className="px-4 py-2.5 text-right">Outstanding</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {mentorRollup.map(m => (
                  <tr key={m.mentorId} className="hover:bg-slate-50">
                    <td className="px-4 py-2.5 font-medium text-slate-900">{m.mentorName}</td>
                    <td className="px-4 py-2.5 text-right text-slate-600">{m.rows}</td>
                    <td className="px-4 py-2.5 text-right text-slate-700">{formatNaira(m.deposits)}</td>
                    <td className="px-4 py-2.5 text-right font-medium text-slate-900">{formatNaira(m.agreedDue)}</td>
                    <td className="px-4 py-2.5 text-right text-emerald-700">{formatNaira(m.disbursed)}</td>
                    <td className="px-4 py-2.5 text-right font-semibold text-amber-700">{formatNaira(m.outstanding)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search cohort, course, mentor, or notes..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={cohortFilter}
            onChange={e => setCohortFilter(e.target.value)}
            className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ALL">All Cohorts</option>
            {cohortsList.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <select
            value={mentorFilter}
            onChange={e => setMentorFilter(e.target.value)}
            className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ALL">All Mentors</option>
            {mentors
              .filter(m => reconciliationRows.some(r => r.mentorId === m.id))
              .map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
          </select>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Partial">Partial</option>
            <option value="Completed">Completed</option>
            <option value="VARIANCE">Variance Flagged</option>
          </select>

          <button
            type="button"
            onClick={refreshData}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Main Reconciliation Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3 text-left">Cohort &amp; Course</th>
                <th className="px-4 py-3 text-left">Mentor</th>
                <th className="px-4 py-3 text-right">Students</th>
                <th className="px-4 py-3 text-right">Student Paid</th>
                <th className="px-4 py-3 text-right">37% Calc.</th>
                <th className="px-4 py-3 text-right">Agreed Due</th>
                <th className="px-4 py-3 text-right">Disbursed</th>
                <th className="px-4 py-3 text-right">Outstanding</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRows.map(row => {
                const hasVariance = Math.abs(row.varianceAmount) > 0;
                return (
                  <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">{row.courseName}</div>
                      <div className="text-xs text-slate-500">{row.cohortName}</div>
                      {row.notes && (
                        <div className="text-[11px] text-slate-400 mt-0.5 max-w-[220px] truncate" title={row.notes}>
                          {row.notes}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800">{row.mentorName}</div>
                      <span className="inline-block text-[11px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 mt-0.5">
                        {row.courseStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-medium text-slate-800">{row.studentCount}</span>
                      <div className="text-[11px] text-slate-400">
                        {row.matchedStudents.length} CRM matched
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="font-medium text-slate-900">{formatNaira(row.effectiveStudentPaid)}</div>
                      {row.liveStudentPaid > 0 && row.liveStudentPaid !== row.historicalStudentPaid && (
                        <div className="text-[11px] text-indigo-600">
                          Live: {formatNaira(row.liveStudentPaid)}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-600">
                      {formatNaira(row.calculatedCommission37)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="font-semibold text-slate-900">{formatNaira(row.agreedAmountDue)}</div>
                      {hasVariance && (
                        <span
                          className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded mt-0.5"
                          title={`Variance vs 37%: ${row.varianceAmount > 0 ? '+' : ''}${formatNaira(row.varianceAmount)}`}
                        >
                          <AlertTriangle className="w-3 h-3" />
                          {row.varianceAmount > 0 ? '+' : ''}{formatNaira(row.varianceAmount)}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-emerald-700 font-medium">
                      {formatNaira(row.amountDisbursed)}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-amber-700">
                      {formatNaira(row.outstandingAmount)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {row.paymentStatus === 'Completed' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                          <CheckCircle2 className="w-3 h-3" /> Completed
                        </span>
                      ) : row.paymentStatus === 'Partial' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700">
                          <Clock className="w-3 h-3" /> Partial
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                          <Clock className="w-3 h-3" /> Pending
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setInspectRow(row)}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Compare Student Deposits"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditModal(row)}
                          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Edit Assignment / Override"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        {row.outstandingAmount > 0 && (
                          <button
                            type="button"
                            onClick={() => openPayoutModal(row)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
                          >
                            <Banknote className="w-3.5 h-3.5" />
                            Pay
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredRows.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-4 py-10 text-center text-slate-500">
                    No reconciliation rows match your current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspect Student Deposits Modal */}
      {inspectRow && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Student Deposits vs. Commission — {inspectRow.courseName}
                </h3>
                <p className="text-xs text-slate-500">
                  {inspectRow.cohortName} • Mentor: {inspectRow.mentorName}
                </p>
              </div>
              <button type="button" onClick={() => setInspectRow(null)} className="p-1.5 rounded-lg hover:bg-slate-100">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="grid grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <p className="text-xs text-slate-500">Spreadsheet Paid</p>
                  <p className="text-base font-bold text-slate-900">{formatNaira(inspectRow.historicalStudentPaid)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">CRM Live Student Paid</p>
                  <p className="text-base font-bold text-indigo-700">{formatNaira(inspectRow.liveStudentPaid)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">37% Commission / Agreed</p>
                  <p className="text-base font-bold text-emerald-700">
                    {formatNaira(inspectRow.calculatedCommission37)} / {formatNaira(inspectRow.agreedAmountDue)}
                  </p>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-slate-800 mb-2">
                  Matched CRM Students ({inspectRow.matchedStudents.length})
                </h4>
                {inspectRow.matchedStudents.length > 0 ? (
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-50 text-slate-500 uppercase">
                        <tr>
                          <th className="px-3 py-2 text-left">Student</th>
                          <th className="px-3 py-2 text-right">Total Fees</th>
                          <th className="px-3 py-2 text-right">Paid</th>
                          <th className="px-3 py-2 text-right">Balance</th>
                          <th className="px-3 py-2 text-right">Exp. 37%</th>
                          <th className="px-3 py-2 text-right">Accrued 37%</th>
                          <th className="px-3 py-2 text-center">Plan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {inspectRow.matchedStudents.map(st => (
                          <tr key={st.id}>
                            <td className="px-3 py-2">
                              <div className="font-medium text-slate-900">{st.name}</div>
                              <div className="text-[10px] text-slate-400">{st.cohort}</div>
                            </td>
                            <td className="px-3 py-2 text-right">{formatNaira(st.totalFees)}</td>
                            <td className="px-3 py-2 text-right font-semibold text-emerald-700">{formatNaira(st.paidAmount)}</td>
                            <td className="px-3 py-2 text-right text-amber-700">{formatNaira(st.outstandingBalance)}</td>
                            <td className="px-3 py-2 text-right text-slate-600">{formatNaira(Math.round(st.totalFees * 0.37))}</td>
                            <td className="px-3 py-2 text-right font-semibold text-indigo-700">{formatNaira(Math.round(st.paidAmount * 0.37))}</td>
                            <td className="px-3 py-2 text-center">{st.tuitionStatus}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 bg-slate-50 p-3 rounded-lg border border-dashed border-slate-200">
                    No individual CRM student records are linked to this historical cohort-course yet. Use the form below to log a student deposit if needed.
                  </p>
                )}
              </div>

              {/* Transaction & Payout Audit Trail */}
              <div className="border-t border-slate-200 pt-4">
                <h4 className="text-sm font-semibold text-slate-800 mb-2">
                  Transaction &amp; Payout Audit Trail ({inspectRow.mentorName})
                </h4>
                {(() => {
                  const rowPayouts = (payoutRequests || []).filter(
                    p => p.cohortLedgerId === inspectRow.id || p.mentorId === inspectRow.mentorId
                  );
                  if (rowPayouts.length === 0) {
                    return (
                      <p className="text-xs text-slate-500 bg-slate-50 p-3 rounded-lg border border-dashed border-slate-200">
                        No payout transactions recorded yet for this mentor.
                      </p>
                    );
                  }
                  return (
                    <div className="border border-slate-200 rounded-xl overflow-hidden max-h-44 overflow-y-auto">
                      <table className="w-full text-xs">
                        <thead className="bg-slate-50 text-slate-500 uppercase">
                          <tr>
                            <th className="px-3 py-2 text-left">Voucher / Ref</th>
                            <th className="px-3 py-2 text-left">Date</th>
                            <th className="px-3 py-2 text-left">Method</th>
                            <th className="px-3 py-2 text-right">Amount</th>
                            <th className="px-3 py-2 text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {rowPayouts.map(p => (
                            <tr key={p.id} className={p.cohortLedgerId === inspectRow.id ? 'bg-indigo-50/40' : ''}>
                              <td className="px-3 py-2 font-mono text-slate-800">
                                {p.voucherNumber || p.id.slice(-8)}
                                {p.disburseReference && (
                                  <div className="text-[10px] text-slate-400">{p.disburseReference}</div>
                                )}
                              </td>
                              <td className="px-3 py-2 text-slate-600">
                                {new Date(p.disbursedAt || p.requestedAt).toLocaleDateString()}
                              </td>
                              <td className="px-3 py-2 text-slate-600">
                                {p.paymentMethod === 'manual_bank' ? 'Manual Bank' : 'Paystack'}
                                {p.isHistorical ? ' (Hist.)' : ''}
                              </td>
                              <td className="px-3 py-2 text-right font-semibold text-emerald-700">{formatNaira(p.amount)}</td>
                              <td className="px-3 py-2 text-center">{p.status}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                })()}
              </div>

              {/* Log Missing Student Deposit */}
              <form onSubmit={handleLogDeposit} className="border-t border-slate-200 pt-4 space-y-3">
                <h4 className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-indigo-600" />
                  Record Student Deposit &amp; Credit 37% Commission
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <select
                    value={depositStudentId}
                    onChange={e => setDepositStudentId(e.target.value)}
                    required
                    className="text-sm border border-slate-200 rounded-lg px-3 py-2"
                  >
                    <option value="">Select Student...</option>
                    {realStudents.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.program})
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min="1"
                    value={depositAmount}
                    onChange={e => setDepositAmount(e.target.value)}
                    placeholder="Deposit Amount (₦)"
                    required
                    className="text-sm border border-slate-200 rounded-lg px-3 py-2"
                  />
                  <input
                    type="text"
                    value={depositRef}
                    onChange={e => setDepositRef(e.target.value)}
                    placeholder="Bank / NIBSS Reference"
                    className="text-sm border border-slate-200 rounded-lg px-3 py-2"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isLoggingDeposit}
                    className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-50"
                  >
                    {isLoggingDeposit ? 'Recording...' : 'Record Deposit & Credit 37%'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Subsequent Payout Modal */}
      {payoutRow && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Subsequent Mentor Payout</h3>
                <p className="text-xs text-slate-500">
                  {payoutRow.mentorName} • {payoutRow.courseName} ({payoutRow.cohortName})
                </p>
              </div>
              <button type="button" onClick={() => setPayoutRow(null)} className="p-1.5 rounded-lg hover:bg-slate-100">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <form onSubmit={handlePayoutSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPayoutMethod('manual_bank')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    payoutMethod === 'manual_bank'
                      ? 'border-indigo-600 bg-indigo-50/70 ring-1 ring-indigo-600'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2 font-semibold text-sm text-slate-900">
                    <Building2 className="w-4 h-4 text-indigo-600" />
                    Manual Bank Transfer
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">Record off-platform transfer</p>
                </button>

                <button
                  type="button"
                  onClick={() => setPayoutMethod('paystack')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    payoutMethod === 'paystack'
                      ? 'border-indigo-600 bg-indigo-50/70 ring-1 ring-indigo-600'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2 font-semibold text-sm text-slate-900">
                    <Wallet className="w-4 h-4 text-indigo-600" />
                    Paystack Wallet
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">Bal: {formatNaira(wallet?.balance || 0)}</p>
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Payout Amount (₦)</label>
                <input
                  type="number"
                  min="1"
                  value={payoutAmount}
                  onChange={e => setPayoutAmount(e.target.value)}
                  required
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 font-semibold"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Outstanding on this row: {formatNaira(payoutRow.outstandingAmount)}
                </p>
              </div>

              {payoutMethod === 'manual_bank' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Bank Transfer Reference</label>
                  <input
                    type="text"
                    value={bankReference}
                    onChange={e => setBankReference(e.target.value)}
                    placeholder="e.g. NIP-2026-88412"
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Narration / Notes</label>
                <input
                  type="text"
                  value={payoutNotes}
                  onChange={e => setPayoutNotes(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2"
                />
              </div>

              <label className="flex items-start gap-2.5 p-3 bg-amber-50 border border-amber-200 rounded-xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={bypassHoursCheck}
                  onChange={e => setBypassHoursCheck(e.target.checked)}
                  className="mt-0.5 rounded text-indigo-600"
                />
                <span className="text-xs text-amber-900">
                  <strong>Super Admin Legacy Override:</strong> Bypass the 20-hour minimum lecturing threshold for this historical/reconciled commission payout.
                </span>
              </label>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPayoutRow(null)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPayout}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-50"
                >
                  <ArrowUpRight className="w-4 h-4" />
                  {isSubmittingPayout ? 'Processing...' : payoutMethod === 'paystack' ? 'Disburse via Paystack' : 'Record Manual Payout'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Reconciliation Row Modal */}
      {editRow && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Edit Reconciliation Entry</h3>
              <button type="button" onClick={() => setEditRow(null)} className="p-1.5 rounded-lg hover:bg-slate-100">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned Mentor</label>
                <select
                  value={editMentorId}
                  onChange={e => setEditMentorId(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2"
                >
                  {mentors.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Agreed Commission Due (₦)</label>
                <input
                  type="number"
                  min="0"
                  value={editAgreedDue}
                  onChange={e => setEditAgreedDue(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  37% formula value: {formatNaira(editRow.calculatedCommission37)}
                </p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Audit Notes</label>
                <textarea
                  rows={3}
                  value={editNotes}
                  onChange={e => setEditNotes(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditRow(null)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-50"
                >
                  {isSavingEdit ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
