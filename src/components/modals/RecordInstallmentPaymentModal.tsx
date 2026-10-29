import React, { useState, useEffect } from 'react';
import { useCRM, formatNaira } from '../../context/CRMContext';

export interface RecordInstallmentPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RecordInstallmentPaymentModal: React.FC<RecordInstallmentPaymentModalProps> = ({ isOpen, onClose }) => {
  const { selectedStudentForPayment, recordStudentInstallmentPayment, showToast } = useCRM();

  const [amount, setAmount] = useState<number>(0);
  const [paymentDate, setPaymentDate] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'Bank Transfer' | 'Paystack' | 'POS' | 'Cash' | 'Cheque'>('Bank Transfer');
  const [reference, setReference] = useState<string>('');
  const [bankName, setBankName] = useState<string>('Zenith Bank');
  const [bankAccountNumber, setBankAccountNumber] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [selectedInstallmentId, setSelectedInstallmentId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (selectedStudentForPayment) {
      const student = selectedStudentForPayment;
      const today = new Date().toISOString().split('T')[0];
      setPaymentDate(today);

      // Find first unpaid installment
      const unpaid = (student.installments || []).find(i => i.status !== 'Paid');
      if (unpaid) {
        setSelectedInstallmentId(unpaid.id);
        setAmount(unpaid.amount || student.outstandingBalance || 0);
      } else {
        setSelectedInstallmentId('');
        setAmount(student.outstandingBalance || 0);
      }

      setReference(`PAY-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`);
      setNotes('');
      setBankName('Zenith Bank');
      setBankAccountNumber('');
    }
  }, [selectedStudentForPayment]);

  if (!isOpen || !selectedStudentForPayment) return null;

  const student = selectedStudentForPayment;
  const totalFees = student.totalFees || student.tuitionAmount || 0;
  const currentPaid = student.paidAmount || 0;
  const currentOutstanding = student.outstandingBalance ?? Math.max(0, totalFees - currentPaid);

  const numAmount = Number(amount) || 0;
  const projectedPaid = currentPaid + numAmount;
  const projectedOutstanding = Math.max(0, totalFees - projectedPaid);
  const willBeFullyPaid = projectedOutstanding <= 0;

  const handleInstallmentSelect = (installmentId: string) => {
    setSelectedInstallmentId(installmentId);
    const inst = (student.installments || []).find(i => i.id === installmentId);
    if (inst) {
      setAmount(inst.amount);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (numAmount <= 0) {
      showToast('Validation Error', 'Please enter a payment amount greater than zero.', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const success = await recordStudentInstallmentPayment(student.id, {
        studentId: student.id,
        amount: numAmount,
        paymentDate,
        paymentMethod,
        reference,
        bankName: paymentMethod === 'Bank Transfer' ? bankName : undefined,
        bankAccountNumber: paymentMethod === 'Bank Transfer' ? bankAccountNumber : undefined,
        notes: notes.trim(),
        installmentId: selectedInstallmentId || undefined,
      });

      if (success) {
        showToast('Payment Recorded', `Successfully posted ${formatNaira(numAmount)} for ${student.name}.`, 'success');
        onClose();
      }
    } catch (err: any) {
      showToast('Error', err.message || 'Failed to record installment payment.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-inverse-surface/50 backdrop-blur-xs p-2 sm:p-4 md:p-6 flex flex-col justify-start items-center animate-in fade-in duration-200">
      <div className="fixed inset-0 -z-10" onClick={onClose} aria-hidden="true" />
      <div 
        className="my-auto relative w-full max-w-xl max-h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-2.5rem)] md:max-h-[calc(100dvh-3rem)] rounded-t-2xl sm:rounded-2xl shadow-modal flex flex-col overflow-hidden bg-surface border border-outline z-10 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between p-4 sm:p-5 border-b border-outline bg-surface-bright">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 border border-emerald-200">
              <span className="material-symbols-outlined text-[22px]">payments</span>
            </div>
            <div>
              <h3 className="font-headline-md text-base sm:text-lg font-bold text-on-surface">
                Record Tuition Installment
              </h3>
              <p className="text-xs text-secondary">
                Update payment schedule, balance, and invoice status for {student.name} ({student.studentCode})
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full text-secondary hover:text-on-surface hover:bg-surface-container flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-4 bg-canvas">
          {/* Student Tuition Summary Card */}
          <div className="grid grid-cols-3 gap-3 p-4 rounded-xl bg-surface border border-outline shadow-xs">
            <div>
              <span className="text-[10px] font-bold text-secondary uppercase tracking-wider block">Total Tuition</span>
              <span className="text-sm sm:text-base font-bold text-on-surface font-data-tabular">
                {formatNaira(totalFees)}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-secondary uppercase tracking-wider block">Amount Paid</span>
              <span className="text-sm sm:text-base font-bold text-emerald-700 font-data-tabular">
                {formatNaira(currentPaid)}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-secondary uppercase tracking-wider block">Outstanding</span>
              <span className="text-sm sm:text-base font-bold text-amber-700 font-data-tabular">
                {formatNaira(currentOutstanding)}
              </span>
            </div>
          </div>

          {/* Installment Tranches (if available) */}
          {Array.isArray(student.installments) && student.installments.length > 0 && (
            <div className="bg-surface p-4 rounded-xl border border-outline shadow-xs space-y-2">
              <label className="text-xs font-bold text-on-surface block uppercase tracking-wider">
                Target Installment Tranche
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {student.installments.map((inst, idx) => {
                  const isPaid = inst.status === 'Paid';
                  const isSelected = selectedInstallmentId === inst.id;
                  return (
                    <button
                      key={inst.id || idx}
                      type="button"
                      disabled={isPaid}
                      onClick={() => handleInstallmentSelect(inst.id)}
                      className={`p-3 text-left rounded-xl border text-xs transition-all flex items-center justify-between cursor-pointer ${
                        isPaid
                          ? 'opacity-50 bg-surface-container border-outline cursor-not-allowed'
                          : isSelected
                          ? 'bg-emerald-50 border-emerald-500 ring-1 ring-emerald-500 text-on-surface font-bold shadow-xs'
                          : 'bg-surface border-outline hover:border-outline-variant hover:bg-surface-container text-on-surface'
                      }`}
                    >
                      <div>
                        <div className="font-bold flex items-center gap-1.5">
                          {inst.description || `Tranche ${idx + 1}`}
                          {isPaid && <span className="text-[10px] text-emerald-700 font-bold">✓ Settled</span>}
                        </div>
                        <div className="text-secondary text-[11px]">Due: {inst.dueDate || 'Upon Admission'}</div>
                      </div>
                      <span className="font-bold font-data-tabular text-on-surface">
                        {formatNaira(inst.amount)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Payment Input Fields */}
          <div className="bg-surface p-4 rounded-xl border border-outline shadow-xs space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-on-surface block mb-1">
                  Amount to Record (₦) <span className="text-error">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs font-bold text-secondary">₦</span>
                  <input
                    type="number"
                    min="1"
                    max={totalFees}
                    required
                    value={amount || ''}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    placeholder="0.00"
                    className="w-full pl-8 pr-3 py-2 bg-canvas border border-outline rounded-lg text-xs sm:text-sm font-bold font-data-tabular text-on-surface focus:border-primary focus:bg-surface outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-on-surface block mb-1">
                  Payment Method <span className="text-error">*</span>
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full px-3 py-2 bg-canvas border border-outline rounded-lg text-xs font-semibold text-on-surface focus:border-primary focus:bg-surface outline-none"
                >
                  <option value="Bank Transfer">Bank Transfer (NIP / Direct Settlement)</option>
                  <option value="Paystack">Paystack Manual Gateway</option>
                  <option value="POS">Point of Sale (POS Terminal)</option>
                  <option value="Cash">Cash Deposit (Bursary Desk)</option>
                  <option value="Cheque">Bankers Cheque / Draft</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-on-surface block mb-1">
                  Payment Date <span className="text-error">*</span>
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-2 text-secondary text-[16px]">calendar_today</span>
                  <input
                    type="date"
                    required
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-canvas border border-outline rounded-lg text-xs text-on-surface font-semibold focus:border-primary focus:bg-surface outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-on-surface block mb-1">
                  Transaction Reference / Slip No <span className="text-error">*</span>
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-2 text-secondary text-[16px]">tag</span>
                  <input
                    type="text"
                    required
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    placeholder="e.g. ZEN-TXN-984218"
                    className="w-full pl-9 pr-3 py-2 bg-canvas border border-outline rounded-lg text-xs font-mono font-bold text-on-surface focus:border-primary focus:bg-surface outline-none"
                  />
                </div>
              </div>
            </div>

            {paymentMethod === 'Bank Transfer' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-surface-container-low rounded-lg border border-outline">
                <div>
                  <label className="text-[11px] font-bold text-secondary block mb-1">
                    Receiving Bank
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-2.5 top-2 text-secondary text-[16px]">account_balance</span>
                    <input
                      type="text"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder="e.g. Zenith Bank / Wema Bank"
                      className="w-full pl-8 pr-2.5 py-1.5 bg-surface border border-outline rounded-lg text-xs text-on-surface font-semibold focus:border-primary outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-secondary block mb-1">
                    Sender Account (10-Digit NUBAN)
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-2.5 top-2 text-secondary text-[16px]">credit_card</span>
                    <input
                      type="text"
                      maxLength={10}
                      value={bankAccountNumber}
                      onChange={(e) => setBankAccountNumber(e.target.value.replace(/\D/g, ''))}
                      placeholder="e.g. 1012345678"
                      className="w-full pl-8 pr-2.5 py-1.5 bg-surface border border-outline rounded-lg text-xs font-mono font-bold text-on-surface focus:border-primary outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="text-xs font-bold text-on-surface block mb-1">
                Bursary Audit Notes / Remarks
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-2 text-secondary text-[16px]">note_alt</span>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. 2nd Installment verified against bank statement"
                  className="w-full pl-9 pr-3 py-2 bg-canvas border border-outline rounded-lg text-xs text-on-surface focus:border-primary focus:bg-surface outline-none"
                />
              </div>
            </div>
          </div>

          {/* Projection Banner */}
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-[20px] text-emerald-600 shrink-0">check_circle</span>
              <div>
                <span className="text-xs font-bold text-emerald-950 block">
                  Projected Balance After Payment
                </span>
                <span className="text-[11px] text-emerald-800">
                  {willBeFullyPaid ? '✓ Tuition will be marked Fully Paid!' : `Remaining balance will be ${formatNaira(projectedOutstanding)}`}
                </span>
              </div>
            </div>
            <span className="text-base font-extrabold text-emerald-800 font-data-tabular">
              {formatNaira(projectedOutstanding)}
            </span>
          </div>
        </form>

        {/* Footer */}
        <div className="shrink-0 p-3 sm:p-4 border-t border-outline bg-surface-bright flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-xs font-semibold text-secondary hover:text-on-surface rounded-lg cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || numAmount <= 0}
            className="px-5 py-2.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Recording...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[16px]">check_circle</span>
                <span>Confirm &amp; Post Payment</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
