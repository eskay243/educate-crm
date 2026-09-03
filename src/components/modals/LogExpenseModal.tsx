import React, { useState } from 'react';
import { useCRM } from '../../context/CRMContext';
import { ExpenseCategory } from '../../types/crm';

export interface LogExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LogExpenseModal: React.FC<LogExpenseModalProps> = ({ isOpen, onClose }) => {
  const { logExpense, currentUser } = useCRM();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('Software & Tools');
  const [amount, setAmount] = useState<number | ''>('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [department, setDepartment] = useState('Engineering');
  const [paymentMethod, setPaymentMethod] = useState('Nigerian Bank Transfer');
  const [vendor, setVendor] = useState('');
  const [receiptFileName, setReceiptFileName] = useState<string>('');

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setReceiptFileName(e.target.files[0].name);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !amount) return;

    logExpense({
      title,
      category,
      amount: Number(amount),
      date,
      department,
      paymentMethod,
      status: 'Pending',
      vendor: vendor || 'Corporate Vendor NG',
      requestedBy: currentUser?.name || 'Managing Director',
      receiptName: receiptFileName || 'receipt_attached.pdf',
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-inverse-surface/40 backdrop-blur-xs p-margin-page animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="glass-panel relative w-full max-w-3xl rounded-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden bg-surface-container-lowest border border-outline-variant z-10">
        {/* Header */}
        <div className="flex items-center justify-between p-stack-md px-stack-lg border-b border-outline-variant bg-surface-bright">
          <div>
            <h2 className="font-headline-lg text-headline-lg font-bold text-on-surface">Log Business Expense</h2>
            <p className="font-body-md text-body-md text-secondary">Record Nigerian operational expenditure, attach invoice receipts, and request fund release.</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-secondary hover:text-primary transition-colors p-1 rounded-full hover:bg-surface-container"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>close</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-stack-lg space-y-stack-md flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1 sm:col-span-2">
              <label className="font-label-md text-label-md text-secondary">Expense Description / Item <span className="text-error">*</span></label>
              <input
                type="text"
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. AWS Cloud GPU Infrastructure & Nigerian CDN"
                className="w-full h-10 px-3 bg-surface border border-outline-variant rounded font-body-md text-on-surface focus:border-primary outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-label-md text-label-md text-secondary">Category <span className="text-error">*</span></label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as ExpenseCategory)}
                className="w-full h-10 px-3 bg-surface border border-outline-variant rounded font-body-md text-on-surface focus:border-primary outline-none cursor-pointer"
              >
                <option value="Software & Tools">Software &amp; Tools</option>
                <option value="Marketing & Ads">Marketing &amp; Ads</option>
                <option value="Office & Ops">Office &amp; Ops</option>
                <option value="Salaries & Stipends">Salaries &amp; Stipends</option>
                <option value="Hosting & Cloud">Hosting &amp; Cloud</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-label-md text-label-md text-secondary">Amount (₦) <span className="text-error">*</span></label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-secondary">₦</span>
                <input
                  type="number"
                  required
                  min="1"
                  value={amount}
                  onChange={e => setAmount(Number(e.target.value))}
                  placeholder="50,000"
                  className="w-full h-10 pl-8 pr-3 bg-surface border border-outline-variant rounded font-data-tabular font-bold text-on-surface focus:border-primary outline-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-label-md text-label-md text-secondary">Expense Date</label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full h-10 px-3 bg-surface border border-outline-variant rounded font-body-md text-on-surface focus:border-primary outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-label-md text-label-md text-secondary">Vendor / Recipient</label>
              <input
                type="text"
                value={vendor}
                onChange={e => setVendor(e.target.value)}
                placeholder="e.g. Amazon Web Services / MainOne"
                className="w-full h-10 px-3 bg-surface border border-outline-variant rounded font-body-md text-on-surface focus:border-primary outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-label-md text-label-md text-secondary">Department</label>
              <select
                value={department}
                onChange={e => setDepartment(e.target.value)}
                className="w-full h-10 px-3 bg-surface border border-outline-variant rounded font-body-md text-on-surface focus:border-primary outline-none cursor-pointer"
              >
                <option value="Engineering">Engineering &amp; Cloud</option>
                <option value="Executive">Executive &amp; Operations</option>
                <option value="Marketing">Growth &amp; Partnerships</option>
                <option value="Facilities">Hub Facilities &amp; Power</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-label-md text-label-md text-secondary">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value)}
                className="w-full h-10 px-3 bg-surface border border-outline-variant rounded font-body-md text-on-surface focus:border-primary outline-none cursor-pointer"
              >
                <option value="Nigerian Bank Transfer">Nigerian Bank Transfer (NIBSS)</option>
                <option value="Corporate Debit Card">Corporate Debit Card</option>
                <option value="Petty Cash">Office Petty Cash</option>
              </select>
            </div>
          </div>

          {/* Receipt Upload Dropzone */}
          <div className="space-y-2 pt-2">
            <label className="font-label-md text-label-md text-secondary">Upload Proof Receipt</label>
            <label 
              htmlFor="expense-receipt-upload"
              className="border-2 border-dashed border-outline-variant rounded-lg p-6 flex flex-col items-center justify-center bg-surface hover:border-primary transition-colors cursor-pointer block text-center"
            >
              <input 
                id="expense-receipt-upload"
                type="file" 
                onChange={handleFileUpload} 
                className="hidden" 
                accept=".pdf,.jpg,.png"
              />
              <div className="w-10 h-10 rounded-full bg-secondary-container text-primary flex items-center justify-center mb-2 mx-auto">
                <span className="material-symbols-outlined text-[20px]">cloud_upload</span>
              </div>
              <p className="font-body-md text-sm text-on-surface">
                <span className="font-bold text-primary">Click to upload</span> or drag and drop receipt
              </p>
              <p className="font-body-sm text-xs text-secondary">PDF, JPG, or PNG (max. 5MB)</p>
            </label>
            {receiptFileName && (
              <div className="flex items-center justify-between p-2.5 rounded bg-surface-container border border-outline-variant text-xs">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[18px]">receipt</span>
                  <span className="font-semibold text-on-surface">{receiptFileName}</span>
                </div>
                <button type="button" onClick={() => setReceiptFileName('')} className="text-error hover:text-error/80">
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              </div>
            )}
          </div>

          {/* Policy Reminder Box matching Stitch */}
          <div className="p-4 bg-tertiary-container/20 rounded-lg flex gap-3 items-start border border-outline-variant">
            <span className="material-symbols-outlined text-primary text-[20px]">info</span>
            <div>
              <p className="font-label-md text-xs font-bold text-on-surface">Policy Reminder</p>
              <p className="font-body-sm text-xs text-secondary">
                All expenses over ₦50,000 require a digital receipt for audit compliance. Approvals are typically processed within 48 business hours.
              </p>
            </div>
          </div>

          {/* Footer Submit Buttons */}
          <div className="pt-stack-sm flex justify-end gap-3 border-t border-outline-variant">
            <button
              type="button"
              onClick={onClose}
              className="px-5 h-10 rounded border border-outline-variant font-label-md text-label-md font-semibold text-secondary hover:bg-surface-container transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 h-10 rounded bg-primary text-on-primary font-label-md text-label-md font-bold hover:bg-primary-container transition-colors shadow-xs flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">check</span>
              <span>Submit Expense</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
