import React, { useState, useEffect } from 'react';
import { useCRM, formatNaira } from '../../context/CRMContext';
import { CheckCircle2, DollarSign, X, Calendar, Hash, Building2, CreditCard, FileText } from 'lucide-react';

export interface RecordInstallmentPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RecordInstallmentPaymentModal: React.FC<RecordInstallmentPaymentModalProps> = ({ isOpen, onClose }) => {
  const { selectedStudentForPayment, recordStudentInstallmentPayment } = useCRM();

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
      alert('Please enter a valid payment amount greater than zero.');
      return;
    }

    if (numAmount > currentOutstanding) {
      const confirmOver = window.confirm(`The amount (₦${numAmount.toLocaleString()}) exceeds the student's current outstanding balance (₦${currentOutstanding.toLocaleString()}). Do you wish to proceed?`);
      if (!confirmOver) return;
    }

    setIsSubmitting(true);
    try {
      const success = await recordStudentInstallmentPayment(student.id, {
        studentId: student.id,
        installmentId: selectedInstallmentId || undefined,
        amount: numAmount,
        paymentDate,
        paymentMethod,
        reference: reference.trim(),
        bankName: paymentMethod === 'Bank Transfer' ? bankName : undefined,
        bankAccountNumber: paymentMethod === 'Bank Transfer' ? bankAccountNumber : undefined,
        notes: notes.trim() || undefined
      });

      if (success) {
        onClose();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Record Installment Payment
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                  Bursary Ledger
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Update payment schedule, balance, and invoice status for {student.name} ({student.studentCode})
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Student Tuition Summary Card */}
          <div className="grid grid-cols-3 gap-3 p-4 rounded-xl bg-slate-100/70 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <div>
              <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">Total Tuition</span>
              <span className="text-base font-bold text-slate-800 dark:text-slate-200">
                {formatNaira(totalFees)}
              </span>
            </div>
            <div>
              <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">Amount Paid</span>
              <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                {formatNaira(currentPaid)}
              </span>
            </div>
            <div>
              <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">Outstanding Balance</span>
              <span className="text-base font-bold text-amber-600 dark:text-amber-400">
                {formatNaira(currentOutstanding)}
              </span>
            </div>
          </div>

          {/* Installment Tranches (if available) */}
          {Array.isArray(student.installments) && student.installments.length > 0 && (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
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
                      className={`p-3 text-left rounded-xl border text-xs transition flex items-center justify-between ${
                        isPaid
                          ? 'opacity-60 bg-slate-50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-800 cursor-not-allowed'
                          : isSelected
                          ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-500 ring-1 ring-emerald-500 text-slate-900 dark:text-white'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div>
                        <div className="font-semibold flex items-center gap-1.5">
                          {inst.description || `Tranche ${idx + 1}`}
                          {isPaid && <span className="text-[10px] text-emerald-600 dark:text-emerald-400">✓ Settled</span>}
                        </div>
                        <div className="text-slate-500 text-[11px]">Due: {inst.dueDate || 'Upon Admission'}</div>
                      </div>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {formatNaira(inst.amount)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Payment Input Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                Amount to Record (₦) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-sm font-semibold text-slate-400">₦</span>
                <input
                  type="number"
                  min="1"
                  max={totalFees}
                  required
                  value={amount || ''}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  placeholder="0.00"
                  className="w-full pl-8 pr-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                Payment Method <span className="text-rose-500">*</span>
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="Bank Transfer">Bank Transfer (NIP / Direct Settlement)</option>
                <option value="Paystack">Paystack Manual Gateway</option>
                <option value="POS">Point of Sale (POS Terminal)</option>
                <option value="Cash">Cash Deposit (Bursary Desk)</option>
                <option value="Cheque">Bankers Cheque / Draft</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                Payment Date <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="date"
                  required
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                Transaction Reference / Slip No <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Hash className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  required
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="e.g. ZEN-TXN-984218"
                  className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          {paymentMethod === 'Bank Transfer' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Receiving Bank
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="e.g. Zenith Bank / Wema Bank"
                    className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Sender/Beneficiary Account (10-Digit NUBAN)
                </label>
                <div className="relative">
                  <CreditCard className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    maxLength={10}
                    value={bankAccountNumber}
                    onChange={(e) => setBankAccountNumber(e.target.value.replace(/\D/g, ''))}
                    placeholder="e.g. 1012345678"
                    className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
              Bursary Audit Notes / Remarks
            </label>
            <div className="relative">
              <FileText className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. 2nd Installment verified against bank statement"
                className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Projection Banner */}
          <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
              <div>
                <span className="text-xs font-semibold text-emerald-900 dark:text-emerald-300 block">
                  Projected Balance After Payment
                </span>
                <span className="text-[11px] text-emerald-700 dark:text-emerald-400">
                  {willBeFullyPaid ? '✓ Tuition will be marked Fully Paid!' : `Remaining balance will be ${formatNaira(projectedOutstanding)}`}
                </span>
              </div>
            </div>
            <span className="text-base font-extrabold text-emerald-700 dark:text-emerald-300">
              {formatNaira(projectedOutstanding)}
            </span>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || numAmount <= 0}
            className="px-5 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-lg shadow-emerald-600/20 transition flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Recording...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Confirm & Post Payment
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
