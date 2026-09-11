import React, { useState } from 'react';
import { useCRM, formatNaira } from '../../context/CRMContext';
import { BrandLogo } from '../../components/common/BrandLogo';

export const StudentBillingPage: React.FC = () => {
  const { 
    currentStudentProfile, 
    invoices, 
    settings, 
    payTuitionWithPaystack, 
    submitProofOfPayment, 
    showToast 
  } = useCRM();

  const student = currentStudentProfile || {
    id: 'stu-demo',
    studentCode: 'STU-8492',
    name: 'Scholar Student',
    email: 'student@codelab.institute',
    program: 'Full-Stack Software Engineering',
    cohort: 'Alpha Cohort 2026',
    tuitionStatus: 'Partial',
    tuitionAmount: 450000,
    totalFees: 450000,
    paidAmount: 250000,
    outstandingBalance: 200000,
  };

  const studentInvoices = invoices.filter(inv => 
    inv.studentId === student.id || inv.studentName === student.name
  );

  // Paystack Custom Payment state
  const [payAmount, setPayAmount] = useState<number>(student.outstandingBalance || 200000);
  const [isProcessing, setIsProcessing] = useState(false);

  // Manual Proof of Payment Form state
  const [proofBank, setProofBank] = useState('Access Bank Nigeria PLC');
  const [proofAmount, setProofAmount] = useState<string>('200000');
  const [proofRef, setProofRef] = useState('');
  const [proofNotes, setProofNotes] = useState('');
  const [isSubmittingProof, setIsSubmittingProof] = useState(false);

  // Selected Invoice for Receipt Modal
  const [activeReceipt, setActiveReceipt] = useState<any | null>(null);

  const handlePaystackPayment = async () => {
    if (payAmount <= 0) {
      showToast('Validation Error', 'Payment amount must be greater than ₦0.', 'warning');
      return;
    }

    setIsProcessing(true);
    try {
      const activeInv = studentInvoices.find(i => i.status !== 'Paid');
      await payTuitionWithPaystack({
        amountNaira: payAmount,
        invoiceId: activeInv?.id || activeInv?.invoiceNumber,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleProofSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proofAmount || !proofRef) {
      showToast('Validation Error', 'Please enter payment amount and bank reference.', 'warning');
      return;
    }

    setIsSubmittingProof(true);
    try {
      await submitProofOfPayment({
        amount: Number(proofAmount),
        bankName: proofBank,
        referenceNumber: proofRef,
        notes: proofNotes,
      });
      setProofRef('');
      setProofNotes('');
    } finally {
      setIsSubmittingProof(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-outline-variant pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary mb-1">
            <span className="material-symbols-outlined text-sm">receipt_long</span>
            <span>Bursary & Accounts Center</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-on-surface">Tuition & Invoicing</h1>
          <p className="text-xs md:text-sm text-on-surface-variant mt-0.5">
            Manage fee schedules, instant Paystack settlements, and official institute receipts
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="px-4 py-2.5 rounded-xl border border-outline-variant bg-surface-container hover:bg-surface-container-high text-xs font-bold text-on-surface flex items-center gap-1.5 transition-colors"
          >
            <span className="material-symbols-outlined text-sm">print</span>
            <span>Print Statement</span>
          </button>
        </div>
      </div>

      {/* Tuition Financial Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl border border-outline-variant bg-surface-container-low shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant block mb-1">Total Program Tuition</span>
          <div className="text-2xl md:text-3xl font-extrabold text-on-surface">
            {formatNaira(student.tuitionAmount || student.totalFees || 450000)}
          </div>
          <span className="text-xs text-on-surface-variant mt-1 block">{student.program}</span>
        </div>

        <div className="p-5 rounded-2xl border border-outline-variant bg-surface-container-low shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 block mb-1">Amount Settled</span>
          <div className="text-2xl md:text-3xl font-extrabold text-emerald-600">
            {formatNaira(student.paidAmount || 0)}
          </div>
          <span className="text-xs text-on-surface-variant mt-1 block">Verified through Paystack / NIBSS</span>
        </div>

        <div className="p-5 rounded-2xl border border-outline-variant bg-surface-container-low shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-600 block mb-1">Outstanding Balance</span>
          <div className="text-2xl md:text-3xl font-extrabold text-amber-600">
            {formatNaira(student.outstandingBalance || 0)}
          </div>
          <span className="text-xs text-on-surface-variant mt-1 block">
            {(student.outstandingBalance || 0) === 0 ? 'No fees outstanding' : 'Due for second semester tranche'}
          </span>
        </div>
      </div>

      {/* Two Columns: Paystack Gateway + Manual Bank Transfer Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Paystack Instant Checkout (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-surface-container-low border border-outline-variant rounded-2xl p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-outline-variant pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                  <span className="material-symbols-outlined text-xl">credit_card</span>
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-on-surface">Paystack Instant Checkout</h3>
                  <p className="text-xs text-on-surface-variant">Instant confirmation via Card, Bank Transfer, or USSD</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 font-extrabold text-[10px] uppercase tracking-wider">
                PCI-DSS Certified
              </span>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-on-surface mb-1.5">
                  Select or Enter Payment Amount (NGN ₦)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 font-bold text-sm text-on-surface-variant">₦</span>
                  <input
                    type="number"
                    min="1000"
                    step="5000"
                    value={payAmount}
                    onChange={e => setPayAmount(Number(e.target.value))}
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-outline-variant bg-surface-container font-mono text-base font-bold focus:ring-2 focus:ring-primary focus:outline-none"
                  />
                </div>
              </div>

              {/* Quick Amount Pills */}
              <div className="flex flex-wrap gap-2">
                {[50000, 100000, 150000, 200000].map(amt => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setPayAmount(amt)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                      payAmount === amt 
                        ? 'bg-primary text-on-primary border-primary' 
                        : 'bg-surface-container text-on-surface-variant border-outline-variant/60 hover:bg-surface-container-high'
                    }`}
                  >
                    {formatNaira(amt)}
                  </button>
                ))}
                {student.outstandingBalance && student.outstandingBalance > 0 && (
                  <button
                    type="button"
                    onClick={() => setPayAmount(student.outstandingBalance || 0)}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500/10 text-amber-700 border border-amber-500/30 hover:bg-amber-500/20 transition-all"
                  >
                    Pay Full Balance ({formatNaira(student.outstandingBalance)})
                  </button>
                )}
              </div>

              {/* Pay Button */}
              <button
                type="button"
                onClick={handlePaystackPayment}
                disabled={isProcessing}
                className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-lg">lock</span>
                <span>{isProcessing ? 'Processing Checkout...' : `Pay ${formatNaira(payAmount)} with Paystack`}</span>
              </button>

              <div className="p-3 rounded-xl bg-surface-container border border-outline-variant/60 flex items-center justify-between text-xs text-on-surface-variant">
                <span className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm text-emerald-600">verified_user</span>
                  <span>Instant automated receipt issued upon verification</span>
                </span>
                <span className="font-mono text-[11px] font-bold">256-Bit SSL</span>
              </div>
            </div>
          </div>

          {/* Invoices & Receipts List */}
          <div className="bg-surface-container-low border border-outline-variant rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="font-bold text-base text-on-surface">Tuition Invoices & Official Receipts</h3>

            {studentInvoices.length === 0 ? (
              <div className="p-4 rounded-xl border border-outline-variant/60 bg-surface-container/30 flex items-center justify-between">
                <div>
                  <div className="font-bold text-xs text-on-surface">Standard Program Enrollment Invoice</div>
                  <div className="text-[11px] text-on-surface-variant">Ref: INV-2026-84920 &bull; Due: Oct 15, 2026</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-xs text-on-surface">{formatNaira(200000)}</div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 font-bold">Pending</span>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {studentInvoices.map((inv) => (
                  <div key={inv.id} className="p-4 rounded-xl border border-outline-variant/80 bg-surface-container/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-primary">{inv.invoiceNumber}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          inv.status === 'Paid' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'
                        }`}>
                          {inv.status}
                        </span>
                      </div>
                      <div className="text-xs text-on-surface mt-1">{inv.description || inv.program}</div>
                      <div className="text-[11px] text-on-surface-variant mt-0.5">Due: {inv.dueDate}</div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="font-extrabold text-sm text-on-surface">{formatNaira(inv.amount || inv.totalAmount || 0)}</div>
                      </div>
                      <button
                        onClick={() => setActiveReceipt(inv)}
                        className="px-3 py-1.5 rounded-lg border border-primary text-primary hover:bg-primary/5 text-xs font-bold flex items-center gap-1 transition-colors"
                      >
                        <span className="material-symbols-outlined text-xs">visibility</span>
                        <span>Receipt</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Direct Bank Deposit Info & Proof Uploader (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Institute Bank Details */}
          <div className="bg-surface-container-low border border-outline-variant rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-xl">account_balance</span>
              <h3 className="font-bold text-base text-on-surface">Direct Bank Transfer (NIBSS)</h3>
            </div>

            <p className="text-xs text-on-surface-variant">
              For corporate sponsorships, direct wire transfers, or mobile app banking, deposit funds to our official designated NIBSS account:
            </p>

            <div className="p-4 rounded-xl bg-surface-container border border-outline-variant/80 space-y-2.5 text-xs font-medium">
              <div>
                <span className="text-[11px] text-on-surface-variant block">Bank Name</span>
                <span className="font-bold text-on-surface">{settings.defaultNIBSSBank?.bankName || 'Access Bank Nigeria PLC'}</span>
              </div>
              <div>
                <span className="text-[11px] text-on-surface-variant block">Account Name</span>
                <span className="font-bold text-on-surface">{settings.defaultNIBSSBank?.accountName || 'CODELAB EDUCARE LTD'}</span>
              </div>
              <div>
                <span className="text-[11px] text-on-surface-variant block">Account Number (NUBAN)</span>
                <span className="font-mono font-extrabold text-sm text-primary tracking-wider">
                  {settings.defaultNIBSSBank?.accountNumber || '0812948192'}
                </span>
              </div>
            </div>
          </div>

          {/* Manual Proof of Payment Uploader */}
          <div className="bg-surface-container-low border border-outline-variant rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="font-bold text-base text-on-surface">Upload Manual Payment Proof</h3>
            <p className="text-xs text-on-surface-variant">
              Paid via direct bank transfer? Submit your transaction reference and details for manual bursary confirmation.
            </p>

            <form onSubmit={handleProofSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">Originating Bank *</label>
                <select
                  value={proofBank}
                  onChange={e => setProofBank(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-outline-variant bg-surface-container text-xs focus:ring-2 focus:ring-primary focus:outline-none"
                >
                  <option value="Access Bank Nigeria PLC">Access Bank Nigeria PLC</option>
                  <option value="Guaranty Trust Bank (GTBank)">Guaranty Trust Bank (GTBank)</option>
                  <option value="Zenith Bank PLC">Zenith Bank PLC</option>
                  <option value="United Bank for Africa (UBA)">United Bank for Africa (UBA)</option>
                  <option value="First Bank of Nigeria">First Bank of Nigeria</option>
                  <option value="Kuda Bank">Kuda Microfinance Bank</option>
                  <option value="Opay Digital Services">Opay</option>
                  <option value="PalmPay">PalmPay</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">Amount Paid (NGN) *</label>
                <input
                  type="number"
                  required
                  value={proofAmount}
                  onChange={e => setProofAmount(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-outline-variant bg-surface-container text-xs font-mono focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">Transaction Ref / Session ID *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. NIBSS-TRF-09481928"
                  value={proofRef}
                  onChange={e => setProofRef(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-outline-variant bg-surface-container text-xs font-mono focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">Notes / Narration</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Paid via mobile app transfer"
                  value={proofNotes}
                  onChange={e => setProofNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-outline-variant bg-surface-container text-xs focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingProof}
                className="w-full py-2.5 rounded-xl border border-primary text-primary hover:bg-primary/5 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-base">upload_file</span>
                <span>{isSubmittingProof ? 'Submitting Proof...' : 'Submit Payment Proof'}</span>
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Official Receipt Modal */}
      {activeReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-surface-container-low border border-outline-variant rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative">
            <div className="flex items-start justify-between border-b border-outline-variant pb-4">
              <div className="flex items-center gap-3">
                <BrandLogo size="sm" logoUrl={settings.logoUrl} />
                <div>
                  <h3 className="font-extrabold text-sm text-on-surface">{settings.instituteName}</h3>
                  <p className="text-[11px] text-on-surface-variant">Official Bursary Electronic Receipt</p>
                </div>
              </div>
              <button 
                onClick={() => setActiveReceipt(null)}
                className="p-1 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-outline-variant/40">
                <span className="text-on-surface-variant">Invoice Reference:</span>
                <span className="font-mono font-bold text-on-surface">{activeReceipt.invoiceNumber}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-outline-variant/40">
                <span className="text-on-surface-variant">Student Name:</span>
                <span className="font-bold text-on-surface">{student.name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-outline-variant/40">
                <span className="text-on-surface-variant">Matriculation ID:</span>
                <span className="font-mono text-on-surface">{student.studentCode}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-outline-variant/40">
                <span className="text-on-surface-variant">Enrolled Program:</span>
                <span className="text-on-surface">{student.program}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-outline-variant/40">
                <span className="text-on-surface-variant">Amount:</span>
                <span className="font-extrabold text-sm text-primary">{formatNaira(activeReceipt.amount)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-outline-variant/40">
                <span className="text-on-surface-variant">Payment Status:</span>
                <span className="px-2 py-0.5 rounded font-bold bg-emerald-500/10 text-emerald-600 uppercase text-[10px]">
                  {activeReceipt.status}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-on-surface-variant">Date Issued:</span>
                <span className="text-on-surface">{activeReceipt.dueDate || 'Current Session'}</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-surface-container text-[11px] text-on-surface-variant border border-outline-variant/60">
              <p className="font-bold text-on-surface mb-0.5">{settings.instituteName} - Bursary Office</p>
              <p>{settings.address}</p>
              <p className="mt-1 font-mono">TIN: {settings.tinNumber} | CAC: {settings.cacNumber}</p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-primary text-on-primary font-bold text-xs flex items-center gap-1 shadow-xs"
              >
                <span className="material-symbols-outlined text-sm">print</span>
                <span>Print Official Receipt</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
