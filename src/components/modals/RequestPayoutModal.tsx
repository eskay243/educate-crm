import React, { useState, useEffect } from 'react';
import { useCRM, formatNaira } from '../../context/CRMContext';

interface RequestPayoutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RequestPayoutModal: React.FC<RequestPayoutModalProps> = ({ isOpen, onClose }) => {
  const {
    currentUser,
    mentors,
    requestMentorPayout,
    updateMentorPayoutRequest,
    selectedPayoutRequestForEdit,
    setSelectedPayoutRequestForEdit,
    showToast,
    settings,
  } = useCRM();

  const isEditMode = !!selectedPayoutRequestForEdit;

  // Find the mentor profile for the logged in user or the one in the request being edited
  const mentor =
    mentors.find(
      m =>
        (isEditMode && m.id === selectedPayoutRequestForEdit.mentorId) ||
        m.id === currentUser?.id ||
        m.email.toLowerCase() === currentUser?.email.toLowerCase()
    ) || mentors[0];

  const minRequiredHours = settings.mentorMinimumLecturedHours || 20;
  const currentLecturedHours = mentor?.lecturedHours || 0;
  const pendingBalance = mentor?.pendingPayout || 0;
  const isEligible = isEditMode || currentLecturedHours >= minRequiredHours;

  const [requestedAmount, setRequestedAmount] = useState<number>(pendingBalance);
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Sync default amount when modal opens or edit item changes
  useEffect(() => {
    if (selectedPayoutRequestForEdit) {
      setRequestedAmount(selectedPayoutRequestForEdit.amount);
      setNotes(selectedPayoutRequestForEdit.notes || '');
    } else if (mentor) {
      setRequestedAmount(mentor.pendingPayout || 0);
      setNotes('');
    }
  }, [selectedPayoutRequestForEdit, mentor, isOpen]);

  const handleClose = () => {
    if (setSelectedPayoutRequestForEdit) {
      setSelectedPayoutRequestForEdit(null);
    }
    onClose();
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isEligible) {
      showToast(
        'Ineligible for Payout',
        `You have completed ${currentLecturedHours}h of lecturing. A minimum of ${minRequiredHours}h is required to request payout.`,
        'error'
      );
      return;
    }

    if (!requestedAmount || requestedAmount <= 0) {
      showToast('Invalid Amount', 'Please specify a payout amount greater than 0.', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditMode && selectedPayoutRequestForEdit) {
        await updateMentorPayoutRequest(selectedPayoutRequestForEdit.id, {
          amount: requestedAmount,
          notes,
        });
      } else {
        await requestMentorPayout(requestedAmount, notes);
      }
      handleClose();
    } catch (err: any) {
      showToast('Request Failed', err.message || 'Could not process payout request.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-black/50 backdrop-blur-xs p-2 sm:p-4 md:p-6 flex flex-col justify-start items-center animate-in fade-in duration-200">
      <div className="my-auto relative w-full max-w-lg max-h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-2.5rem)] md:max-h-[calc(100dvh-3rem)] rounded-t-2xl sm:rounded-2xl shadow-xl flex flex-col overflow-hidden bg-surface-container-lowest border border-outline-variant z-10 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="shrink-0 p-4 sm:p-6 border-b border-outline-variant flex items-center justify-between bg-surface-container-low">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20 shrink-0">
              <span className="material-symbols-outlined text-[24px]">payments</span>
            </div>
            <div>
              <h3 className="font-headline-sm text-lg font-bold text-on-surface">
                {isEditMode ? 'Edit Payout Request' : 'Request Commission Payout'}
              </h3>
              <p className="text-xs text-secondary">
                {isEditMode
                  ? `Editing pending request (${selectedPayoutRequestForEdit.voucherNumber})`
                  : 'Accrued 37% faculty tuition share disbursement'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center text-secondary hover:text-on-surface transition-colors cursor-pointer shrink-0"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-5">
            {/* Lecturing Hours Threshold Gate (New requests only) */}
            {!isEditMode && (
              <div
                className={`p-4 rounded-xl border flex flex-col gap-2 ${
                  isEligible
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-900'
                    : 'bg-amber-500/10 border-amber-500/30 text-amber-900'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[18px]">
                      {isEligible ? 'check_circle' : 'schedule'}
                    </span>
                    <span>Minimum Lecturing Requirement</span>
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-surface text-on-surface font-mono font-bold shadow-xs">
                    {currentLecturedHours}h / {minRequiredHours}h
                  </span>
                </div>

                <div className="w-full bg-surface rounded-full h-2 overflow-hidden border border-outline-variant/40">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      isEligible ? 'bg-emerald-500' : 'bg-amber-500'
                    }`}
                    style={{ width: `${Math.min(100, (currentLecturedHours / minRequiredHours) * 100)}%` }}
                  />
                </div>

                <p className="text-[11px] leading-relaxed">
                  {isEligible ? (
                    <span>
                      ✓ <strong>Threshold met!</strong> You have fulfilled the institutional minimum {minRequiredHours} hours of lecturing and are eligible for commission disbursement.
                    </span>
                  ) : (
                    <span>
                      ⚠️ <strong>Threshold pending:</strong> You must log at least {minRequiredHours} lecturing hours with your scholars before payout disbursement can be authorized ({minRequiredHours - currentLecturedHours}h remaining).
                    </span>
                  )}
                </p>
              </div>
            )}

            {/* Accrued Balance Summary Card */}
            <div className="p-4 rounded-xl bg-surface border border-outline-variant flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-secondary block">
                  {isEditMode ? 'Original Voucher Total' : 'Available Accrued Commission'}
                </span>
                <span className="text-2xl font-bold font-mono text-primary mt-0.5 block">
                  {formatNaira(isEditMode ? selectedPayoutRequestForEdit.amount : pendingBalance)}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold uppercase tracking-wider text-secondary block">
                  Statutory 5% WHT
                </span>
                <span className="px-2 py-1 rounded bg-amber-500/10 text-amber-600 text-xs font-bold font-mono inline-block mt-1">
                  -5% Withholding Tax
                </span>
              </div>
            </div>

            {/* Disbursement Destination Bank Account */}
            <div className="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-secondary block">
                Verified Settlement Destination
              </span>
              <div className="flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-on-surface">
                    {isEditMode ? selectedPayoutRequestForEdit.accountName : mentor?.accountName || mentor?.name}
                  </p>
                  <p className="text-secondary font-mono">
                    {isEditMode ? selectedPayoutRequestForEdit.accountNumber : mentor?.accountNumber || 'Account on file'}
                  </p>
                </div>
                <div className="text-right">
                  <span className="px-2 py-0.5 rounded bg-surface-container font-semibold text-[11px] text-on-surface border border-outline-variant">
                    {isEditMode ? selectedPayoutRequestForEdit.bankName : mentor?.bankName || 'GTBank'}
                  </span>
                  <span className="flex items-center justify-end gap-1 text-[10px] text-emerald-600 font-bold mt-1">
                    <span className="material-symbols-outlined text-[14px]">verified</span> Verified NUBAN
                  </span>
                </div>
              </div>
            </div>

            {/* Payout Amount Field */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-semibold text-on-surface">Requested Amount (NGN)</label>
                {!isEditMode && (
                  <button
                    type="button"
                    onClick={() => setRequestedAmount(pendingBalance)}
                    className="text-[11px] font-bold text-primary hover:underline cursor-pointer"
                  >
                    Max ({formatNaira(pendingBalance)})
                  </button>
                )}
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary font-mono text-sm font-bold">₦</span>
                <input
                  type="number"
                  min={1000}
                  value={requestedAmount || ''}
                  onChange={(e) => setRequestedAmount(Number(e.target.value))}
                  required
                  className="w-full h-11 pl-8 pr-4 rounded-xl bg-surface border border-outline-variant text-sm font-mono font-bold text-on-surface outline-none focus:border-primary"
                  placeholder="Enter amount to withdraw"
                />
              </div>
              {requestedAmount > 0 && (
                <div className="mt-2 text-[11px] text-secondary flex justify-between bg-surface p-2 rounded-lg border border-outline-variant/60">
                  <span>WHT Deducted (5%): <strong className="text-on-surface font-mono">{formatNaira(Math.round(requestedAmount * 0.05))}</strong></span>
                  <span>Net Disbursed: <strong className="text-emerald-600 font-mono">{formatNaira(requestedAmount - Math.round(requestedAmount * 0.05))}</strong></span>
                </div>
              )}
            </div>

            {/* Optional Notes */}
            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1.5">
                Payout Memo / Notes
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Q3 Batch A Lecture Sessions completion payout"
                className="w-full h-10 px-3 rounded-xl bg-surface border border-outline-variant text-xs text-on-surface outline-none focus:border-primary"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="shrink-0 p-3 sm:p-4 border-t border-outline-variant bg-surface-container-low flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 h-10 rounded-xl border border-outline-variant text-xs font-bold text-secondary hover:bg-surface-container transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || requestedAmount <= 0}
              className="px-6 h-10 rounded-xl bg-primary text-on-primary text-xs font-bold hover:bg-primary/90 transition-colors shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>{isEditMode ? 'Updating Request...' : 'Submitting Request...'}</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[16px]">
                    {isEditMode ? 'save' : 'send'}
                  </span>
                  <span>{isEditMode ? 'Save & Update Payout' : 'Submit Payout Request'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
