import React, { useState, useMemo, useEffect } from 'react';
import { useCRM, formatNaira } from '../../context/CRMContext';
import { MentorPayoutRequest } from '../../types/crm';
import { PayoutVoucherModal } from '../../components/modals/PayoutVoucherModal';
import { CrispStatusBadge } from '../../components/common/CrispStatusBadge';

export const MentorPayoutsPage: React.FC = () => {
  const {
    currentUser,
    mentors,
    payoutRequests,
    requestMentorPayout,
    deleteMentorPayoutRequest,
    openEditPayoutRequestModal,
    calculateMentorTuitionCommission,
    reconciliationRows,
    fetchMentorReconciliation,
    settings,
    showToast,
  } = useCRM();

  useEffect(() => {
    fetchMentorReconciliation();
  }, [fetchMentorReconciliation]);

  // Find active mentor profile
  const myMentor = useMemo(() => {
    return (
      mentors.find(
        m => m.id === currentUser?.mentorId || m.name === currentUser?.name || m.email === currentUser?.email
      ) || mentors[0]
    );
  }, [mentors, currentUser]);

  const myLedgerRows = useMemo(() => {
    if (!myMentor) return [];
    return reconciliationRows.filter(r => r.mentorId === myMentor.id);
  }, [reconciliationRows, myMentor]);

  // Modal states
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [requestAmount, setRequestAmount] = useState<string>('');
  const [requestNotes, setRequestNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Voucher modal state
  const [selectedVoucher, setSelectedVoucher] = useState<MentorPayoutRequest | null>(null);
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);

  // Calculate Course by Course 37% Revenue Share Breakdown via Context
  const commissionData = useMemo(() => {
    if (!myMentor) return { totalTuitionPool: 0, totalCommission: 0, courseBreakdown: [] };
    return calculateMentorTuitionCommission(myMentor.id);
  }, [calculateMentorTuitionCommission, myMentor]);

  const courseCommissionBreakdown = commissionData.courseBreakdown;
  const totalAccruedFromCourses = commissionData.totalCommission;

  // Mentor's Payout Requests
  const myPayoutRequests = useMemo(() => {
    if (!myMentor || !payoutRequests) return [];
    return payoutRequests.filter(
      r => r.mentorId === myMentor.id || r.mentorEmail?.toLowerCase() === myMentor.email?.toLowerCase()
    );
  }, [payoutRequests, myMentor]);

  // In-flight pending amount
  const pendingRequestsTotal = useMemo(() => {
    return myPayoutRequests
      .filter(r => r.status === 'Pending')
      .reduce((sum, r) => sum + r.amount, 0);
  }, [myPayoutRequests]);

  // Disbursed amount
  const disbursedTotal = useMemo(() => {
    return myPayoutRequests
      .filter(r => r.status === 'Disbursed')
      .reduce((sum, r) => sum + r.amount, 0);
  }, [myPayoutRequests]);

  // Available balance for payout
  const availableBalance = useMemo(() => {
    const totalEarned = totalAccruedFromCourses > 0 ? totalAccruedFromCourses : (myMentor?.pendingPayout || 0);
    const balance = totalEarned - disbursedTotal - pendingRequestsTotal;
    return balance > 0 ? balance : 0;
  }, [totalAccruedFromCourses, myMentor, disbursedTotal, pendingRequestsTotal]);

  // Minimum required hours compliance
  const minRequiredHours = myMentor?.minimumRequiredHours ?? settings?.mentorMinimumLecturedHours ?? 20;
  const actualLecturedHours = myMentor?.lecturedHours ?? 0;
  const isHoursEligible = actualLecturedHours >= minRequiredHours;

  // Handlers
  const handleOpenRequestModal = () => {
    if (!isHoursEligible) {
      showToast(
        'Ineligible for Payout',
        `You have logged ${actualLecturedHours.toFixed(1)}h of lecturing. A minimum threshold of ${minRequiredHours}h is required.`,
        'warning'
      );
      return;
    }
    setRequestAmount(String(availableBalance));
    setRequestNotes('');
    setIsRequestModalOpen(true);
  };

  const handleSubmitPayout = async () => {
    const numAmount = Number(requestAmount);
    if (isNaN(numAmount) || numAmount <= 0) {
      showToast('Invalid Amount', 'Please enter a valid payout amount.', 'error');
      return;
    }

    if (numAmount > availableBalance) {
      showToast('Amount Exceeded', `Requested amount exceeds available balance of ${formatNaira(availableBalance)}.`, 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await requestMentorPayout(numAmount, requestNotes);
      if (result.success) {
        showToast('Payout Requested', result.message || 'Payout voucher generated and pending review.', 'success');
        setIsRequestModalOpen(false);
      } else {
        showToast('Request Failed', result.message, 'error');
      }
    } catch {
      showToast('Error', 'An unexpected error occurred.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">37% Tuition Rev-Share &amp; Payouts</h1>
          <p className="text-secondary text-xs md:text-sm mt-0.5">
            Transparent revenue-share ledger calculated strictly from collected student tuition fees and multi-mentor percentage splits.
          </p>
        </div>

        <button
          onClick={handleOpenRequestModal}
          disabled={availableBalance <= 0 || !isHoursEligible}
          className={`h-10 px-4 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-xs ${
            availableBalance > 0 && isHoursEligible
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer'
              : 'bg-surface-container border border-outline-variant text-secondary cursor-not-allowed opacity-60'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">payments</span>
          <span>Request Payout ({formatNaira(availableBalance)})</span>
        </button>
      </div>

      {/* Primary KPI Balance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Accrued 37% Commission */}
        <div className="bg-surface border border-outline-variant rounded-2xl p-5 shadow-xs">
          <div className="flex justify-between items-center text-secondary text-xs font-semibold">
            <span>Total Accrued (37% Pool)</span>
            <span className="material-symbols-outlined text-primary text-[20px]">account_balance_wallet</span>
          </div>
          <p className="text-2xl font-bold text-on-surface mt-2">{formatNaira(totalAccruedFromCourses)}</p>
          <p className="text-[11px] text-secondary mt-1">
            Across {courseCommissionBreakdown.length} assigned programs
          </p>
        </div>

        {/* Available for Payout */}
        <div className="bg-emerald-50/50 border border-emerald-200 rounded-2xl p-5 shadow-xs">
          <div className="flex justify-between items-center text-emerald-800 text-xs font-bold">
            <span>Available for Withdrawal</span>
            <span className="material-symbols-outlined text-emerald-600 text-[20px]">savings</span>
          </div>
          <p className="text-2xl font-bold text-emerald-700 mt-2">{formatNaira(availableBalance)}</p>
          <p className="text-[11px] text-emerald-800 mt-1">
            {pendingRequestsTotal > 0 ? `(${formatNaira(pendingRequestsTotal)} currently in pending review)` : 'Ready for disbursement request'}
          </p>
        </div>

        {/* Total Disbursed */}
        <div className="bg-surface border border-outline-variant rounded-2xl p-5 shadow-xs">
          <div className="flex justify-between items-center text-secondary text-xs font-semibold">
            <span>Disbursed to Date</span>
            <span className="material-symbols-outlined text-emerald-600 text-[20px]">check_circle</span>
          </div>
          <p className="text-2xl font-bold text-emerald-700 mt-2">{formatNaira(disbursedTotal)}</p>
          <p className="text-[11px] text-secondary mt-1">Net of 5% Withholding Tax (WHT)</p>
        </div>

        {/* Teaching Hours Compliance Indicator */}
        <div className="bg-surface border border-outline-variant rounded-2xl p-5 shadow-xs">
          <div className="flex justify-between items-center text-secondary text-xs font-semibold">
            <span>Teaching Threshold</span>
            <span className={`material-symbols-outlined text-[20px] ${isHoursEligible ? 'text-emerald-600' : 'text-amber-600'}`}>
              {isHoursEligible ? 'verified' : 'hourglass_top'}
            </span>
          </div>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="text-2xl font-bold text-on-surface">{actualLecturedHours.toFixed(1)}</span>
            <span className="text-xs text-secondary font-semibold">/ {minRequiredHours}h minimum</span>
          </div>
          <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden mt-2">
            <div
              className={`h-full rounded-full ${isHoursEligible ? 'bg-emerald-500' : 'bg-amber-500'}`}
              style={{ width: `${Math.min(100, (actualLecturedHours / minRequiredHours) * 100)}%` }}
            />
          </div>
          <p className="text-[10px] text-secondary mt-1">
            {isHoursEligible ? '✓ Threshold met for payout' : `Need ${(minRequiredHours - actualLecturedHours).toFixed(1)}h more to unlock`}
          </p>
        </div>
      </div>

      {/* Verified NUBAN Bank Account Card (Nigerian Banking Standards) */}
      <div className="bg-surface border border-outline-variant rounded-2xl p-5 shadow-xs flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[22px]">account_balance</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-on-surface">Verified Payout Settlement NUBAN</h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Tier 2/3 KYC
              </span>
            </div>
            <p className="text-xs text-secondary mt-0.5">
              Disbursements are strictly processed to this verified Central Bank of Nigeria (CBN) account.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-surface-container-lowest px-4 py-2.5 rounded-xl border border-outline-variant">
          <div>
            <span className="text-[10px] text-secondary uppercase font-semibold">Bank Name</span>
            <p className="text-xs font-bold text-on-surface">{myMentor?.bankName || 'Guaranty Trust Bank (GTBank)'}</p>
          </div>
          <div className="h-6 w-px bg-outline-variant" />
          <div>
            <span className="text-[10px] text-secondary uppercase font-semibold">10-Digit NUBAN</span>
            <p className="text-xs font-bold font-mono text-primary">{myMentor?.accountNumber || '0123456789'}</p>
          </div>
          <div className="h-6 w-px bg-outline-variant" />
          <div>
            <span className="text-[10px] text-secondary uppercase font-semibold">Account Name</span>
            <p className="text-xs font-bold text-on-surface">{myMentor?.accountName || myMentor?.name}</p>
          </div>
        </div>
      </div>

      {/* Course Revenue Share Breakdown Table */}
      <div className="bg-surface border border-outline-variant rounded-2xl shadow-xs overflow-hidden">
        <div className="p-5 border-b border-outline-variant flex justify-between items-center">
          <div>
            <h2 className="text-base font-bold text-on-surface">Course Revenue Pool &amp; Mentor % Allocation</h2>
            <p className="text-xs text-secondary mt-0.5">
              Breakdown of total paid tuition, 37% faculty pool, and your percentage split.
            </p>
          </div>
          <span className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-xs font-bold">
            37% Faculty Policy
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-container-lowest text-secondary uppercase text-[10px] font-bold border-b border-outline-variant">
              <tr>
                <th className="py-3 px-4">Assigned Course</th>
                <th className="py-3 px-4">Your Role</th>
                <th className="py-3 px-4 text-center">Your % Split</th>
                <th className="py-3 px-4 text-center">Enrolled Learners</th>
                <th className="py-3 px-4 text-right">Tuition Collected</th>
                <th className="py-3 px-4 text-right">37% Course Pool</th>
                <th className="py-3 px-4 text-right">Your Accrued Commission</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {courseCommissionBreakdown.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-secondary">
                    No active course revenue pools currently assigned.
                  </td>
                </tr>
              ) : (
                courseCommissionBreakdown.map(item => (
                  <tr key={item.courseId} className="hover:bg-surface-container-lowest/50 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-surface-container text-secondary">
                          {item.courseCode}
                        </span>
                        <span className="font-bold text-on-surface">{item.courseTitle}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-secondary">{item.role}</td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-full font-bold bg-primary/10 text-primary">
                        {item.sharePercentage}% of Pool
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center font-semibold text-on-surface">
                      {item.enrolledStudentsCount} Learners
                    </td>
                    <td className="py-3.5 px-4 text-right font-medium text-on-surface">
                      {formatNaira(item.totalTuitionPaid)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-medium text-secondary">
                      {formatNaira(item.courseFacultyPool)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-emerald-700 text-sm">
                      {formatNaira(item.mentorCommission)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Historical & Reconciled Cohort Commission Ledger */}
      {myLedgerRows.length > 0 && (
        <div className="bg-surface border border-outline-variant rounded-2xl shadow-xs overflow-hidden">
          <div className="p-5 border-b border-outline-variant flex justify-between items-center">
            <div>
              <h2 className="text-base font-bold text-on-surface">Cohort &amp; Course Commission Ledger</h2>
              <p className="text-xs text-secondary mt-0.5">
                Reconciled student deposits, 37% commission accrued, previous disbursements, and remaining balance per cohort.
              </p>
            </div>
            <span className="text-xs text-secondary font-semibold">{myLedgerRows.length} Cohorts / Tracks</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-container-lowest text-secondary uppercase text-[10px] font-bold border-b border-outline-variant">
                <tr>
                  <th className="py-3 px-4">Cohort</th>
                  <th className="py-3 px-4">Course</th>
                  <th className="py-3 px-4 text-right">Students Paid</th>
                  <th className="py-3 px-4 text-right">Commission Due</th>
                  <th className="py-3 px-4 text-right">Disbursed</th>
                  <th className="py-3 px-4 text-right">Outstanding</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {myLedgerRows.map(row => (
                  <tr key={row.id} className="hover:bg-surface-container-lowest/50 transition-colors">
                    <td className="py-3 px-4 font-semibold text-on-surface">{row.cohortName}</td>
                    <td className="py-3 px-4 text-secondary">{row.courseName}</td>
                    <td className="py-3 px-4 text-right font-medium">{formatNaira(row.effectiveStudentPaid)}</td>
                    <td className="py-3 px-4 text-right font-semibold text-on-surface">{formatNaira(row.agreedAmountDue)}</td>
                    <td className="py-3 px-4 text-right text-emerald-700 font-semibold">{formatNaira(row.amountDisbursed)}</td>
                    <td className="py-3 px-4 text-right text-amber-700 font-bold">{formatNaira(row.outstandingAmount)}</td>
                    <td className="py-3 px-4 text-center">
                      <CrispStatusBadge status={row.paymentStatus} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Payout Voucher Ledger & Request History */}
      <div className="bg-surface border border-outline-variant rounded-2xl shadow-xs overflow-hidden">
        <div className="p-5 border-b border-outline-variant flex justify-between items-center">
          <div>
            <h2 className="text-base font-bold text-on-surface">Payout Vouchers &amp; Disbursal History</h2>
            <p className="text-xs text-secondary mt-0.5">
              Auditable records of all payout requests, tax deductions, and official vouchers.
            </p>
          </div>
          <span className="text-xs text-secondary font-semibold">
            {myPayoutRequests.length} Total Requests
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-container-lowest text-secondary uppercase text-[10px] font-bold border-b border-outline-variant">
              <tr>
                <th className="py-3 px-4">Voucher No.</th>
                <th className="py-3 px-4">Date Requested</th>
                <th className="py-3 px-4 text-right">Gross Amount</th>
                <th className="py-3 px-4 text-right">5% WHT Deducted</th>
                <th className="py-3 px-4 text-right">Net Disbursed</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {myPayoutRequests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-secondary">
                    No payout requests submitted yet.
                  </td>
                </tr>
              ) : (
                myPayoutRequests.map(req => (
                  <tr key={req.id} className="hover:bg-surface-container-lowest/50 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-primary">
                      <div className="flex items-center gap-1.5">
                        <span>{req.voucherNumber}</span>
                        {req.isHistorical && (
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[9px] font-sans font-bold uppercase">
                            Historical
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-secondary">{new Date(req.requestedAt).toLocaleDateString()}</td>
                    <td className="py-3.5 px-4 text-right font-semibold text-on-surface">{formatNaira(req.amount)}</td>
                    <td className="py-3.5 px-4 text-right text-rose-600 font-medium">-{formatNaira(req.whtDeductedAmount || 0)}</td>
                    <td className="py-3.5 px-4 text-right font-bold text-emerald-700">{formatNaira(req.netDisbursedAmount || req.amount)}</td>
                    <td className="py-3.5 px-4 text-center">
                      <CrispStatusBadge status={req.status} />
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedVoucher(req);
                            setIsVoucherModalOpen(true);
                          }}
                          className="px-2 py-1 rounded bg-surface border border-outline-variant hover:border-primary text-xs font-bold text-primary transition-all cursor-pointer shadow-xs inline-flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-[13px]">receipt</span>
                          <span>Voucher</span>
                        </button>
                        {req.status === 'Pending' && (
                          <>
                            <button
                              onClick={() => openEditPayoutRequestModal(req)}
                              className="px-2 py-1 rounded bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 text-amber-700 text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1"
                              title="Edit requested amount or memo"
                            >
                              <span className="material-symbols-outlined text-[13px]">edit</span>
                              <span>Edit</span>
                            </button>
                            <button
                              onClick={() => {
                                if (window.confirm(`Are you sure you want to cancel and delete this payout request (${formatNaira(req.amount)})?`)) {
                                  deleteMentorPayoutRequest(req.id);
                                }
                              }}
                              className="px-2 py-1 rounded bg-rose-500/10 border border-rose-500/30 hover:bg-rose-500/20 text-rose-700 text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1"
                              title="Cancel and delete payout request"
                            >
                              <span className="material-symbols-outlined text-[13px]">delete</span>
                              <span>Delete</span>
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payout Request Modal */}
      {isRequestModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface border border-outline-variant rounded-2xl max-w-md w-full p-6 shadow-xl animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant">
              <h3 className="text-base font-bold text-on-surface">Submit Payout Request</h3>
              <button onClick={() => setIsRequestModalOpen(false)} className="text-secondary hover:text-on-surface">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="space-y-4 py-4">
              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">
                  Requested Gross Amount (₦) *
                </label>
                <input
                  type="number"
                  value={requestAmount}
                  onChange={e => setRequestAmount(e.target.value)}
                  max={availableBalance}
                  className="w-full px-3 py-2 rounded-lg bg-surface-container-lowest border border-outline-variant text-sm font-bold text-on-surface focus:outline-none focus:border-primary"
                />
                <p className="text-[11px] text-secondary mt-1">
                  Maximum Available: <span className="font-bold text-emerald-700">{formatNaira(availableBalance)}</span>
                </p>
              </div>

              {/* Live Tax Deduction Preview */}
              {Number(requestAmount) > 0 && (
                <div className="p-3 rounded-xl bg-surface-container-lowest border border-outline-variant space-y-1.5 text-xs">
                  <div className="flex justify-between text-secondary">
                    <span>Requested Gross:</span>
                    <span className="font-bold text-on-surface">{formatNaira(Number(requestAmount))}</span>
                  </div>
                  <div className="flex justify-between text-rose-600">
                    <span>Withholding Tax (5% WHT):</span>
                    <span className="font-bold">-{formatNaira(Math.round(Number(requestAmount) * 0.05))}</span>
                  </div>
                  <div className="h-px bg-outline-variant my-1" />
                  <div className="flex justify-between text-emerald-700 font-bold">
                    <span>Net Disbursable:</span>
                    <span>{formatNaira(Math.round(Number(requestAmount) * 0.95))}</span>
                  </div>
                </div>
              )}

              {/* Settlement Bank Confirmation */}
              <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 text-xs">
                <p className="text-[10px] text-primary uppercase font-bold">Direct Settlement Bank</p>
                <p className="font-bold text-on-surface mt-0.5">
                  {myMentor?.bankName} • {myMentor?.accountNumber}
                </p>
                <p className="text-secondary text-[11px]">{myMentor?.accountName}</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">Notes / Invoice Comments (Optional)</label>
                <textarea
                  value={requestNotes}
                  onChange={e => setRequestNotes(e.target.value)}
                  placeholder="Optional comments for finance approval team..."
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg bg-surface-container-lowest border border-outline-variant text-xs text-on-surface resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-outline-variant">
              <button
                onClick={() => setIsRequestModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-surface border border-outline-variant text-xs font-bold text-secondary hover:text-on-surface"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitPayout}
                disabled={isSubmitting || Number(requestAmount) <= 0 || Number(requestAmount) > availableBalance}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-xs"
              >
                {isSubmitting ? 'Submitting...' : 'Confirm Request'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payout Voucher Modal */}
      {selectedVoucher && (
        <PayoutVoucherModal
          isOpen={isVoucherModalOpen}
          onClose={() => setIsVoucherModalOpen(false)}
          payoutRequest={selectedVoucher}
        />
      )}
    </div>
  );
};
