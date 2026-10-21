import React, { useState } from 'react';
import { Expense } from '../../types/crm';
import { formatNaira } from '../../context/CRMContext';

export interface RejectExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  expense: Expense | null;
  onConfirmReject: (id: string, reason: string) => void;
}

export const RejectExpenseModal: React.FC<RejectExpenseModalProps> = ({
  isOpen,
  onClose,
  expense,
  onConfirmReject,
}) => {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  if (!isOpen || !expense) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('Please provide a specific rejection reason or feedback note.');
      return;
    }

    onConfirmReject(expense.id, reason.trim());
    setReason('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-inverse-surface/50 backdrop-blur-xs p-2 sm:p-4 md:p-6 flex flex-col justify-start items-center animate-in fade-in duration-200">
      <div className="fixed inset-0 -z-10" onClick={onClose} aria-hidden="true" />

      <div className="my-auto relative w-full max-w-lg max-h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-2.5rem)] md:max-h-[calc(100dvh-3rem)] rounded-t-2xl sm:rounded-xl shadow-2xl flex flex-col overflow-hidden bg-surface-container-lowest border border-outline-variant z-10 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between p-4 sm:p-5 border-b border-outline-variant bg-surface-bright">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-error/10 text-error flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[20px]">cancel</span>
            </div>
            <div>
              <h2 className="font-headline-md text-base font-bold text-on-surface">Reject OpEx Requisition</h2>
              <p className="font-body-sm text-xs text-secondary">Provide a side note or feedback reason for the requester.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-secondary hover:text-primary transition-colors p-1 rounded-full hover:bg-surface-container cursor-pointer shrink-0"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>close</span>
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 min-h-0 flex flex-col overflow-hidden">
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-4">
            {/* Requisition Details Box */}
            <div className="p-3.5 rounded-lg bg-surface-container-low border border-outline-variant/80 text-xs space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-data-tabular font-bold text-primary">{expense.expenseCode}</span>
                <span className="font-data-tabular font-bold text-on-surface text-sm">{formatNaira(expense.amount)}</span>
              </div>
              <p className="font-semibold text-on-surface">{expense.title}</p>
              <div className="flex justify-between text-secondary text-[11px] pt-1 border-t border-outline-variant/60">
                <span>Dept: <strong className="text-on-surface">{expense.department}</strong></span>
                <span>Requested by: <strong className="text-on-surface">{expense.requestedBy || 'Staff'}</strong></span>
              </div>
            </div>

            {/* Feedback Reason Field */}
            <div className="space-y-1.5">
              <label className="block font-label-md text-xs font-semibold text-on-surface">
                Rejection Reason &amp; Feedback Side Note <span className="text-error">*</span>
              </label>
              <textarea
                required
                rows={3}
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  if (error) setError('');
                }}
                placeholder="e.g. Current monthly operating budget exhausted. Please defer this requisition to next month or submit proforma quotation."
                className="w-full p-3 rounded-lg bg-surface border border-outline-variant text-xs text-on-surface focus:border-error focus:ring-1 focus:ring-error outline-none transition-all resize-none"
              />
              {error && (
                <p className="text-[11px] text-error font-medium">{error}</p>
              )}
              <p className="text-[11px] text-secondary">
                This note will be logged in the system and visible on the expense ledger to the requester.
              </p>
            </div>
          </div>

          {/* Sticky Actions Footer */}
          <div className="shrink-0 p-3 sm:p-4 bg-surface-bright border-t border-outline-variant flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="h-9 px-4 rounded-lg border border-outline-variant text-xs font-bold text-secondary hover:bg-surface-container transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="h-9 px-4 rounded-lg bg-error hover:bg-error/90 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">block</span>
              <span>Confirm Rejection</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
