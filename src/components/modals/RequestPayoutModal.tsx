import React, { useState } from 'react';
import { useCRM, formatNaira } from '../../context/CRMContext';

interface RequestPayoutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RequestPayoutModal: React.FC<RequestPayoutModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, mentors, requestMentorPayout, showToast, settings } = useCRM();

  // Find the mentor profile for the logged in user
  const mentor = mentors.find(m => m.id === currentUser?.id || m.email.toLowerCase() === currentUser?.email.toLowerCase()) || mentors[0];

  const minRequiredHours = settings.mentorMinimumLecturedHours || 20;
  const currentLecturedHours = mentor?.lecturedHours || 0;
  const pendingBalance = mentor?.pendingPayout || 0;
  const isEligible = currentLecturedHours >= minRequiredHours;

  const [requestedAmount, setRequestedAmount] = useState<number>(pendingBalance);
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Sync default amount when modal opens or balance updates
  React.useEffect(() => {
    if (mentor) {
      setRequestedAmount(mentor.pendingPayout || 0);
    }
  }, [mentor, isOpen]);

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

    if (requestedAmount > pendingBalance) {
      showToast('Amount Exceeds Balance', `Maximum available for payout is ${formatNaira(pendingBalance)}.`, 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      await requestMentorPayout(requestedAmount, notes);
      onClose();
    } catch (err: any) {
      showToast('Request Failed', err.message || 'Could not submit payout request.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl w-full max-w-lg shadow-xl overflow-hidden flex flex-col my-8 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 border-b border-outline-variant flex items-center justify-between bg-surface-container-low">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
              <span className="material-symbols-outlined text-[24px]">payments</span>
            </div>
            <div>
              <h3 className="font-headline-sm text-lg font-bold text-on-surface">Request Commission Payout</h3>
              <p className="text-xs text-secondary">Accrued 37% faculty tuition share disbursement</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center text-secondary hover:text-on-surface transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Lecturing Hours Threshold Gate */}
          <div className={`p-4 rounded-xl border flex flex-col gap-2 ${
            isEligible 
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-900' 
              : 'bg-amber-500/10 border-amber-500/30 text-amber-900'
          }`}>
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
                  ✓ <strong>Threshold met!</strong> You have fulfilled the institutional minimum {minRequiredHours} hours of lecturing and are eligible for 1-click commission disbursement.
                </span>
              ) : (
                <span>
                  ⚠️ <strong>Threshold pending:</strong> You must log at least {minRequiredHours} lecturing hours with your scholars before payout disbursement can be authorized ({minRequiredHours - currentLecturedHours}h remaining).
                </span>
              )}
            </p>
          </div>

          {/* Accrued Balance Summary Card */}
          <div className="p-4 rounded-xl bg-surface border border-outline-variant flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-secondary block">Available Accrued Commission</span>
              <span className="text-2xl font-bold font-mono text-primary mt-0.5 block">
                {formatNaira(pendingBalance)}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-secondary block">Commission Rate</span>
              <span className="px-2 py-1 rounded bg-primary/10 text-primary text-xs font-bold font-mono inline-block mt-1">
                37% Net Tuition
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
                <p className="font-bold text-on-surface">{mentor?.accountName || mentor?.name}</p>
                <p className="text-secondary font-mono">{mentor?.accountNumber || 'Account on file'}</p>
              </div>
              <div className="text-right">
                <span className="px-2 py-0.5 rounded bg-surface-container font-semibold text-[11px] text-on-surface border border-outline-variant">
                  {mentor?.bankName || 'GTBank'}
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
              <button
                type="button"
                onClick={() => setRequestedAmount(pendingBalance)}
                className="text-[11px] font-bold text-primary hover:underline cursor-pointer"
              >
                Max ({formatNaira(pendingBalance)})
              </button>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary font-mono text-sm font-bold">₦</span>
              <input
                type="number"
                min={1000}
                max={pendingBalance}
                value={requestedAmount || ''}
                onChange={(e) => setRequestedAmount(Number(e.target.value))}
                required
                className="w-full h-11 pl-8 pr-4 rounded-xl bg-surface border border-outline-variant text-sm font-mono font-bold text-on-surface outline-none focus:border-primary"
                placeholder="Enter amount to withdraw"
              />
            </div>
          </div>

          {/* Optional Notes */}
          <div>
            <label className="block text-xs font-semibold text-on-surface mb-1.5">
              Payout Memo / Notes (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Q3 Batch A Lecture Sessions completion payout"
              className="w-full h-10 px-3 rounded-xl bg-surface border border-outline-variant text-xs text-on-surface outline-none focus:border-primary"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-outline-variant">
            <button
              type="button"
              onClick={onClose}
              className="px-4 h-10 rounded-xl border border-outline-variant text-xs font-bold text-secondary hover:bg-surface-container transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !isEligible || pendingBalance <= 0 || requestedAmount <= 0}
              className="px-6 h-10 rounded-xl bg-primary text-on-primary text-xs font-bold hover:bg-primary/90 transition-colors shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Submitting Request...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[16px]">send</span>
                  <span>Submit Payout Request</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
