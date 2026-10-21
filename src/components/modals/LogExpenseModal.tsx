import React, { useState } from 'react';
import { useCRM } from '../../context/CRMContext';
import { ExpenseCategory } from '../../types/crm';

export interface LogExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LogExpenseModal: React.FC<LogExpenseModalProps> = ({ isOpen, onClose }) => {
  const { logExpense, currentUser, activeMentors } = useCRM();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('Office & Ops');
  const [amount, setAmount] = useState<number | ''>('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [department, setDepartment] = useState(
    currentUser?.role === 'admissions' 
      ? 'Admissions' 
      : currentUser?.role === 'finance' 
      ? 'Finance & Ops' 
      : currentUser?.role === 'program_officer'
      ? 'Academic'
      : 'Operations'
  );
  const [paymentMethod, setPaymentMethod] = useState('Nigerian Bank Transfer');
  const [vendor, setVendor] = useState('');
  const [selectedMentorId, setSelectedMentorId] = useState<string>('');
  const [urgency, setUrgency] = useState<'Standard' | 'Urgent' | 'Emergency'>('Standard');
  const [description, setDescription] = useState('');
  const [receiptFileName, setReceiptFileName] = useState<string>('');
  const [receiptUrl, setReceiptUrl] = useState<string>('');
  const [useProfileKycBank, setUseProfileKycBank] = useState(Boolean(currentUser?.accountNumber));

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setReceiptFileName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setReceiptUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCategoryChange = (newCat: ExpenseCategory) => {
    setCategory(newCat);
    if (newCat === 'Faculty Mentorship & Payout') {
      setDepartment('Academic');
      setPaymentMethod('Nigerian Bank Transfer');
      if (activeMentors.length > 0 && !selectedMentorId) {
        handleMentorSelect(activeMentors[0].id);
      }
    }
  };

  const handleMentorSelect = (mentorId: string) => {
    setSelectedMentorId(mentorId);
    const m = activeMentors.find(men => men.id === mentorId);
    if (m) {
      setVendor(`${m.name} (${m.email})`);
      setTitle(`Faculty Honorarium & Mentorship Payout - ${m.name}`);
      setDepartment(m.department || 'Academic');
      if (m.pendingPayout && m.pendingPayout > 0) {
        setAmount(m.pendingPayout);
      }
    }
  };

  const selectedMentor = activeMentors.find(m => m.id === selectedMentorId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !amount) return;

    const isMentorPayout = category === 'Faculty Mentorship & Payout' && selectedMentor;
    const hasKyc = Boolean(currentUser?.accountNumber);
    const shouldAttachKyc = !isMentorPayout && useProfileKycBank && hasKyc && paymentMethod === 'Nigerian Bank Transfer';

    logExpense({
      title,
      category,
      amount: Number(amount),
      date,
      department,
      paymentMethod,
      status: 'Awaiting Approval',
      vendor: isMentorPayout
        ? `${selectedMentor.name} (Faculty Mentor - ${selectedMentor.mentorCode})`
        : (vendor || (shouldAttachKyc && currentUser?.name ? `${currentUser.name} (Reimbursement)` : 'Corporate Vendor NG')),
      requestedBy: currentUser?.name ? `${currentUser.name} (${currentUser.role.replace('_', ' ')})` : 'Admissions / Finance Officer',
      requesterEmail: currentUser?.email || 'admin@codelab.institute',
      receiptName: receiptFileName || (receiptUrl ? 'proforma_invoice.pdf' : undefined),
      receiptUrl: receiptUrl || undefined,
      description: description || (isMentorPayout ? `Faculty honorarium & mentorship compensation request for ${selectedMentor.name} (${selectedMentor.courses ? selectedMentor.courses.join(', ') : selectedMentor.department || 'Academic Faculty'}).` : undefined),
      urgency,
      mentorId: isMentorPayout ? selectedMentor.id : undefined,
      mentorName: isMentorPayout ? selectedMentor.name : undefined,
      disbursementBankName: isMentorPayout ? selectedMentor.bankName : (shouldAttachKyc && currentUser?.bankName ? currentUser.bankName : undefined),
      disbursementBankCode: isMentorPayout ? selectedMentor.bankCode : (shouldAttachKyc && currentUser?.bankCode ? currentUser.bankCode : undefined),
      disbursementAccountNumber: isMentorPayout ? selectedMentor.accountNumber : (shouldAttachKyc && currentUser?.accountNumber ? currentUser.accountNumber : undefined),
      disbursementAccountName: isMentorPayout ? (selectedMentor.accountName || selectedMentor.name) : (shouldAttachKyc && currentUser?.accountName ? currentUser.accountName : undefined),
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-inverse-surface/40 backdrop-blur-xs p-2 sm:p-4 md:p-6 flex min-h-[100dvh] items-end sm:items-center justify-center animate-in fade-in duration-200">
      <div className="fixed inset-0 -z-10" onClick={onClose} aria-hidden="true" />

      <div className="glass-panel relative w-full max-w-3xl max-h-[calc(100dvh-1rem)] sm:max-h-[calc(100dvh-2rem)] md:max-h-[min(90dvh,850px)] rounded-t-2xl sm:rounded-xl shadow-2xl flex flex-col overflow-hidden bg-surface-container-lowest border border-outline-variant z-10 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between p-4 sm:p-5 border-b border-outline-variant bg-surface-bright">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[20px] sm:text-[24px]">payments</span>
            </div>
            <div>
              <h2 className="font-headline-lg text-base sm:text-lg font-bold text-on-surface">Request Office Expense (OpEx)</h2>
              <p className="font-body-md text-xs text-secondary">
                Submit an operational expenditure requisition. Approved funds will be deducted from the monthly operating budget.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-secondary hover:text-primary transition-colors p-1 rounded-full hover:bg-surface-container cursor-pointer shrink-0"
          >
            <span className="material-symbols-outlined text-[20px] sm:text-[24px]">close</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 min-h-0 flex flex-col overflow-hidden">
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-4">
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
                onChange={e => handleCategoryChange(e.target.value as ExpenseCategory)}
                className="w-full h-10 px-3 bg-surface border border-outline-variant rounded font-body-md text-on-surface focus:border-primary outline-none cursor-pointer"
              >
                <option value="Office & Ops">Office &amp; Operations</option>
                <option value="Faculty Mentorship & Payout">Faculty Mentorship &amp; Payout</option>
                <option value="Marketing & Ads">Marketing &amp; Admissions Ads</option>
                <option value="Facilities">Hub Facilities, Power &amp; Diesel</option>
                <option value="Software & Tools">Software, SaaS &amp; Cloud Tools</option>
                <option value="Salaries & Stipends">Stipends &amp; Field Allowances</option>
                <option value="Hosting & Cloud">Hosting &amp; Infrastructure</option>
                <option value="Equipment">Hardware &amp; Equipment</option>
              </select>
            </div>

            {/* If Category is Faculty Mentorship & Payout, show Mentor Selector */}
            {category === 'Faculty Mentorship & Payout' && (
              <div className="space-y-1 sm:col-span-2 p-3 bg-purple-50/70 border border-purple-200 rounded-xl">
                <div className="flex justify-between items-center mb-1">
                  <label className="font-label-md text-xs font-bold text-purple-950 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-purple-700">school</span>
                    <span>Select Faculty Mentor Beneficiary *</span>
                  </label>
                  <span className="text-[10px] font-semibold text-purple-700 uppercase tracking-wider">
                    Auto-Pulls CBN NUBAN
                  </span>
                </div>
                <select
                  value={selectedMentorId}
                  onChange={e => handleMentorSelect(e.target.value)}
                  className="w-full h-10 px-3 bg-white border border-purple-300 rounded font-body-md text-xs font-semibold text-on-surface focus:border-purple-600 outline-none cursor-pointer"
                >
                  <option value="">-- Choose Faculty Mentor --</option>
                  {activeMentors.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.department || 'Academic Faculty'}) — Accrued: ₦{(m.pendingPayout || 0).toLocaleString()}
                    </option>
                  ))}
                </select>
                {selectedMentor && (
                  <div className="mt-2.5 p-2.5 bg-white rounded-lg border border-purple-200 text-xs space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-on-surface">{selectedMentor.name}</span>
                      <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-800 font-bold text-[10px]">
                        {selectedMentor.mentorCode}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-secondary text-[11px]">
                      <span className="material-symbols-outlined text-purple-600 text-[15px]">account_balance</span>
                      <span>Bank: <strong className="text-on-surface">{selectedMentor.bankName || 'GTBank'}</strong></span>
                      <span>&bull;</span>
                      <span>NUBAN: <strong className="font-mono text-purple-900 font-bold">{selectedMentor.accountNumber || 'Not set'}</strong></span>
                      <span>({selectedMentor.accountName || selectedMentor.name})</span>
                    </div>
                  </div>
                )}
              </div>
            )}

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
              <label className="font-label-md text-label-md text-secondary">Vendor / Payee</label>
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

            {/* Mentor Settlement Callout */}
            {category === 'Faculty Mentorship & Payout' && selectedMentor && (
              <div className="sm:col-span-2 p-3.5 rounded-xl bg-purple-50/90 border border-purple-200 text-xs text-purple-950 flex items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-purple-200 text-purple-800 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[18px]">verified</span>
                  </div>
                  <div>
                    <span className="font-bold text-purple-950">Mentor Direct NIBSS Settlement Account:</span>
                    <p className="text-[11px] text-purple-800">
                      {selectedMentor.bankName || 'GTBank'} &bull; Account: <span className="font-mono font-bold tracking-wider">{selectedMentor.accountNumber || 'Pending'}</span> ({selectedMentor.accountName || selectedMentor.name})
                    </p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                  Verified NUBAN
                </span>
              </div>
            )}

            {category !== 'Faculty Mentorship & Payout' && paymentMethod === 'Nigerian Bank Transfer' && currentUser?.accountNumber && (
              <div className="sm:col-span-2 p-3 rounded-xl bg-emerald-50/80 border border-emerald-200 text-xs text-emerald-950 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[18px]">verified_user</span>
                  </div>
                  <div>
                    <span className="font-bold text-emerald-900">Direct Reimbursement to Profile KYC Bank:</span>
                    <p className="text-[11px] text-emerald-700">
                      {currentUser.bankName} • <span className="font-mono font-bold tracking-wider">{currentUser.accountNumber}</span> ({currentUser.accountName || currentUser.name})
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={useProfileKycBank}
                    onChange={e => setUseProfileKycBank(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>
            )}

            {category !== 'Faculty Mentorship & Payout' && paymentMethod === 'Nigerian Bank Transfer' && !currentUser?.accountNumber && (
              <div className="sm:col-span-2 p-3 rounded-xl bg-surface-container border border-outline-variant text-[11px] text-secondary flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-amber-600">account_balance</span>
                  <span>Want automatic reimbursement? Register &amp; verify your Nigerian bank in <strong>Settings &gt; My Profile &amp; KYC</strong>.</span>
                </div>
              </div>
            )}

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
                <button 
                  type="button" 
                  onClick={() => {
                    setReceiptFileName('');
                    setReceiptUrl('');
                  }} 
                  className="text-error hover:text-error/80 cursor-pointer p-1"
                  title="Remove attachment"
                >
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
        </div>

        {/* Sticky Footer Submit Buttons */}
        <div className="shrink-0 p-3 sm:p-4 bg-surface-bright border-t border-outline-variant flex justify-end gap-2 sm:gap-3">
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
