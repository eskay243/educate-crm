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
  const [category, setCategory] = useState<ExpenseCategory>('Office & Ops');
  const [amount, setAmount] = useState<number | ''>('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [department, setDepartment] = useState(
    currentUser?.role === 'admissions' 
      ? 'Admissions' 
      : currentUser?.role === 'finance' 
      ? 'Finance & Ops' 
      : 'Operations'
  );
  const [paymentMethod, setPaymentMethod] = useState('Nigerian Bank Transfer');
  const [vendor, setVendor] = useState('');
  const [urgency, setUrgency] = useState<'Standard' | 'Urgent' | 'Emergency'>('Standard');
  const [description, setDescription] = useState('');
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
      status: 'Awaiting Approval',
      vendor: vendor || 'Corporate Vendor NG',
      requestedBy: currentUser?.name ? `${currentUser.name} (${currentUser.role.replace('_', ' ')})` : 'Admissions / Finance Officer',
      receiptName: receiptFileName || 'proforma_invoice.pdf',
      description: description || undefined,
      urgency,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-inverse-surface/40 backdrop-blur-xs p-margin-page animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="glass-panel relative w-full max-w-3xl rounded-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden bg-surface-container-lowest border border-outline-variant z-10">
        {/* Header */}
        <div className="flex items-center justify-between p-stack-md px-stack-lg border-b border-outline-variant bg-surface-bright">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-[24px]">payments</span>
            </div>
            <div>
              <h2 className="font-headline-lg text-lg font-bold text-on-surface">Request Office Expense (OpEx)</h2>
              <p className="font-body-md text-xs text-secondary">
                Submit an operational expenditure requisition. Approved funds will be deducted from the monthly operating budget.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-secondary hover:text-primary transition-colors p-1 rounded-full hover:bg-surface-container cursor-pointer"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>close</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-stack-lg space-y-stack-md flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1 sm:col-span-2">
              <label className="font-label-md text-label-md text-secondary">Requisition Item / Purpose <span className="text-error">*</span></label>
              <input
                type="text"
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Admissions Open-Day Banners, Promotional Kits & Refreshments"
                className="w-full h-10 px-3 bg-surface border border-outline-variant rounded font-body-md text-on-surface focus:border-primary outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-label-md text-label-md text-secondary">Expense Category <span className="text-error">*</span></label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as ExpenseCategory)}
                className="w-full h-10 px-3 bg-surface border border-outline-variant rounded font-body-md text-on-surface focus:border-primary outline-none cursor-pointer"
              >
                <option value="Office & Ops">Office &amp; Operations</option>
                <option value="Marketing & Ads">Marketing &amp; Admissions Ads</option>
                <option value="Facilities">Hub Facilities, Power &amp; Diesel</option>
                <option value="Software & Tools">Software, SaaS &amp; Cloud Tools</option>
                <option value="Salaries & Stipends">Stipends &amp; Field Allowances</option>
                <option value="Hosting & Cloud">Hosting &amp; Infrastructure</option>
                <option value="Equipment">Hardware &amp; Equipment</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-label-md text-label-md text-secondary">Requested Amount (₦) <span className="text-error">*</span></label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-secondary">₦</span>
                <input
                  type="number"
                  required
                  min="1"
                  value={amount}
                  onChange={e => setAmount(Number(e.target.value))}
                  placeholder="75,000"
                  className="w-full h-10 pl-8 pr-3 bg-surface border border-outline-variant rounded font-data-tabular font-bold text-on-surface focus:border-primary outline-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-label-md text-label-md text-secondary">Urgency Level</label>
              <select
                value={urgency}
                onChange={e => setUrgency(e.target.value as any)}
                className="w-full h-10 px-3 bg-surface border border-outline-variant rounded font-body-md text-on-surface focus:border-primary outline-none cursor-pointer"
              >
                <option value="Standard">Standard (Within 48-72 hrs)</option>
                <option value="Urgent">Urgent (Within 24 hrs)</option>
                <option value="Emergency">Emergency (Immediate)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-label-md text-label-md text-secondary">Department</label>
              <select
                value={department}
                onChange={e => setDepartment(e.target.value)}
                className="w-full h-10 px-3 bg-surface border border-outline-variant rounded font-body-md text-on-surface focus:border-primary outline-none cursor-pointer"
              >
                <option value="Admissions">Admissions &amp; Growth</option>
                <option value="Finance & Ops">Finance &amp; Operations</option>
                <option value="Academic">Academic &amp; Mentorship</option>
                <option value="Facilities">Hub Facilities &amp; Utilities</option>
                <option value="Engineering">Engineering &amp; Cloud</option>
                <option value="Executive">Executive Office</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-label-md text-label-md text-secondary">Requisition Date</label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full h-10 px-3 bg-surface border border-outline-variant rounded font-body-md text-on-surface focus:border-primary outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-label-md text-label-md text-secondary">Vendor / Supplier</label>
              <input
                type="text"
                value={vendor}
                onChange={e => setVendor(e.target.value)}
                placeholder="e.g. Prestige Print Press Ltd"
                className="w-full h-10 px-3 bg-surface border border-outline-variant rounded font-body-md text-on-surface focus:border-primary outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-label-md text-label-md text-secondary">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value)}
                className="w-full h-10 px-3 bg-surface border border-outline-variant rounded font-body-md text-on-surface focus:border-primary outline-none cursor-pointer"
              >
                <option value="Nigerian Bank Transfer">Nigerian Bank Transfer (NIBSS)</option>
                <option value="Petty Cash">Office Petty Cash</option>
                <option value="Corporate Debit Card">Corporate Debit Card</option>
              </select>
            </div>

            <div className="space-y-1 sm:col-span-2">
              <label className="font-label-md text-label-md text-secondary">Requisition Justification / Purpose</label>
              <textarea
                rows={2}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Briefly explain the business necessity for this office expense..."
                className="w-full p-2.5 bg-surface border border-outline-variant rounded font-body-md text-xs text-on-surface focus:border-primary outline-none resize-none"
              />
            </div>
          </div>

          {/* Receipt Upload Dropzone */}
          <div className="space-y-2 pt-1">
            <label className="font-label-md text-label-md text-secondary">Proforma Invoice / Quotation / Receipt</label>
            <label 
              htmlFor="expense-receipt-upload"
              className="border-2 border-dashed border-outline-variant rounded-lg p-5 flex flex-col items-center justify-center bg-surface hover:border-primary transition-colors cursor-pointer block text-center"
            >
              <input 
                id="expense-receipt-upload"
                type="file" 
                onChange={handleFileUpload} 
                className="hidden" 
                accept=".pdf,.jpg,.png"
              />
              <div className="w-9 h-9 rounded-full bg-secondary-container text-primary flex items-center justify-center mb-1.5 mx-auto">
                <span className="material-symbols-outlined text-[18px]">cloud_upload</span>
              </div>
              <p className="font-body-md text-xs text-on-surface">
                <span className="font-bold text-primary">Click to attach quotation/receipt</span> or drag and drop
              </p>
              <p className="font-body-sm text-[11px] text-secondary">PDF, JPG, or PNG (max. 5MB)</p>
            </label>
            {receiptFileName && (
              <div className="flex items-center justify-between p-2 rounded bg-surface-container border border-outline-variant text-xs">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[16px]">receipt</span>
                  <span className="font-semibold text-on-surface">{receiptFileName}</span>
                </div>
                <button type="button" onClick={() => setReceiptFileName('')} className="text-error hover:text-error/80 cursor-pointer">
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              </div>
            )}
          </div>

          {/* Policy Reminder Box */}
          <div className="p-3.5 bg-secondary-container/30 rounded-lg flex gap-3 items-start border border-primary/20">
            <span className="material-symbols-outlined text-primary text-[18px]">verified_user</span>
            <div>
              <p className="font-label-md text-xs font-bold text-on-surface">Approval Workflow Notice</p>
              <p className="font-body-sm text-[11px] text-secondary">
                Upon submission, this request enters the <strong className="text-on-surface">Awaiting Approval</strong> queue. It does not deduct from the approved monthly operating budget until reviewed and approved by the Super Admin.
              </p>
            </div>
          </div>

          {/* Footer Submit Buttons */}
          <div className="pt-stack-sm flex justify-end gap-3 border-t border-outline-variant">
            <button
              type="button"
              onClick={onClose}
              className="px-4 h-9 rounded-lg border border-outline-variant font-label-md text-xs font-semibold text-secondary hover:bg-surface-container transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 h-9 rounded-lg bg-primary text-on-primary font-label-md text-xs font-bold hover:bg-primary/90 transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">send</span>
              <span>Submit OpEx Requisition</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
