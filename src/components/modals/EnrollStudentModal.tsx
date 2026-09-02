import React, { useState } from 'react';
import { useCRM, formatNaira } from '../../context/CRMContext';

export interface EnrollStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EnrollStudentModal: React.FC<EnrollStudentModalProps> = ({ isOpen, onClose }) => {
  const { enrollStudent, mentors } = useCRM();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [program, setProgram] = useState('Enterprise Data Science Immersive');
  const [mentorName, setMentorName] = useState(mentors[0]?.name || 'Dr. Sarah Jenkins');
  const [totalCourseFee] = useState(850000);
  const [initialPayment, setInitialPayment] = useState(425000);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer');
  const [proofFileName, setProofFileName] = useState<string | null>(null);

  if (!isOpen) return null;

  const programsList = [
    'Enterprise Data Science Immersive',
    'Advanced UX/UI Product Design',
    'Full-Stack Software Engineering',
    'AI & Machine Learning Bootcamp',
    'Cloud DevOps & SRE Masterclass',
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setProofFileName(e.target.files[0].name);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;

    const outstanding = Math.max(0, totalCourseFee - initialPayment);

    enrollStudent({
      name,
      email,
      phone: phone || '+234 800 000 0000',
      program,
      mentorName,
      status: 'Active',
      attendanceRate: 100,
      tuitionStatus: outstanding === 0 ? 'Paid' : initialPayment > 0 ? 'Partial' : 'Overdue',
      cohort: 'Cohort 2026-Q3 (Lagos)',
      totalFees: totalCourseFee,
      outstandingBalance: outstanding,
      courses: [
        {
          id: `c-${Date.now()}`,
          code: 'CS-401',
          name: program,
          semester: 'Fall Semester 2026',
          instructor: mentorName,
          fee: totalCourseFee,
          billedDate: paymentDate,
        }
      ],
      installments: [
        {
          id: `inst-1-${Date.now()}`,
          description: 'Initial Deposit / Seat Lock',
          dueDate: paymentDate,
          amount: initialPayment,
          status: 'Paid',
        },
        ...(outstanding > 0 ? [{
          id: `inst-2-${Date.now()}`,
          description: 'Installment 2 (Mid-Cohort Balance)',
          dueDate: '2026-10-15',
          amount: outstanding,
          status: 'Pending' as const,
        }] : [])
      ]
    });

    onClose();
  };

  const outstanding = Math.max(0, totalCourseFee - initialPayment);
  const paidPercent = Math.min(100, Math.round((initialPayment / totalCourseFee) * 100));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-inverse-surface/40 backdrop-blur-xs p-margin-page animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="glass-panel relative w-full max-w-4xl rounded-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden bg-surface-container-lowest border border-outline-variant z-10">
        {/* Header */}
        <div className="flex items-center justify-between p-stack-md px-stack-lg border-b border-outline-variant bg-surface-bright">
          <div>
            <h2 className="font-headline-lg text-headline-lg font-bold text-on-surface">Enroll New Student</h2>
            <p className="font-body-md text-body-md text-secondary">Record candidate profile, course assignment, and initial Naira payment ledger.</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-secondary hover:text-primary transition-colors p-1 rounded-full hover:bg-surface-container"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>close</span>
          </button>
        </div>

        {/* Form Body with 2 Columns matching Stitch */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-stack-lg flex-1">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
            {/* Left 8 Cols: Student & Payment Details */}
            <div className="lg:col-span-8 space-y-stack-md">
              {/* Student Information Card */}
              <div className="bg-surface rounded-lg border border-outline-variant p-stack-md space-y-4">
                <h3 className="font-headline-md text-headline-md font-bold text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">person</span> Student Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-label-md text-label-md text-secondary">Full Name <span className="text-error">*</span></label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="e.g. Babatunde Adeleke"
                      className="w-full h-10 px-3 bg-surface border border-outline-variant rounded font-body-md text-on-surface focus:border-primary outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-label-md text-label-md text-secondary">Contact Email <span className="text-error">*</span></label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="babatunde@example.ng"
                      className="w-full h-10 px-3 bg-surface border border-outline-variant rounded font-body-md text-on-surface focus:border-primary outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-label-md text-label-md text-secondary">Phone Number (WhatsApp)</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="+234 803 123 4567"
                      className="w-full h-10 px-3 bg-surface border border-outline-variant rounded font-body-md text-on-surface focus:border-primary outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-label-md text-label-md text-secondary">Assigned Faculty Mentor</label>
                    <select
                      value={mentorName}
                      onChange={e => setMentorName(e.target.value)}
                      className="w-full h-10 px-3 bg-surface border border-outline-variant rounded font-body-md text-on-surface focus:border-primary outline-none cursor-pointer"
                    >
                      {mentors.map(m => (
                        <option key={m.id} value={m.name}>{m.name} ({m.department})</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <label className="font-label-md text-label-md text-secondary">Course Track Selection <span className="text-error">*</span></label>
                    <select
                      value={program}
                      onChange={e => setProgram(e.target.value)}
                      className="w-full h-10 px-3 bg-surface border border-outline-variant rounded font-body-md text-on-surface focus:border-primary outline-none cursor-pointer"
                    >
                      {programsList.map(p => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Initial Payment Card */}
              <div className="bg-surface rounded-lg border border-outline-variant p-stack-md space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-headline-md text-headline-md font-bold text-on-surface flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">account_balance_wallet</span> Initial Payment
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-md text-[11px] uppercase">
                    Draft Receipt
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-label-md text-label-md text-secondary">Total Course Fee</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary font-bold">₦</span>
                      <input
                        type="text"
                        readOnly
                        value={formatNaira(totalCourseFee).replace('₦', '')}
                        className="w-full h-10 pl-8 pr-3 bg-surface-container-low border border-transparent rounded font-data-tabular font-bold text-on-surface outline-none"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="font-label-md text-label-md text-secondary">Initial Payment Amount <span className="text-error">*</span></label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary font-bold">₦</span>
                      <input
                        type="number"
                        value={initialPayment}
                        onChange={e => setInitialPayment(Number(e.target.value))}
                        className="w-full h-10 pl-8 pr-3 bg-surface border border-outline-variant rounded font-data-tabular font-bold text-on-surface focus:border-primary outline-none"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="font-label-md text-label-md text-secondary">Payment Date</label>
                    <input
                      type="date"
                      value={paymentDate}
                      onChange={e => setPaymentDate(e.target.value)}
                      className="w-full h-10 px-3 bg-surface border border-outline-variant rounded font-body-md text-on-surface focus:border-primary outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-label-md text-label-md text-secondary">Payment Channel</label>
                    <select
                      value={paymentMethod}
                      onChange={e => setPaymentMethod(e.target.value)}
                      className="w-full h-10 px-3 bg-surface border border-outline-variant rounded font-body-md text-on-surface focus:border-primary outline-none cursor-pointer"
                    >
                      <option value="bank_transfer">Nigerian Bank Transfer (NIBSS / Instant)</option>
                      <option value="card">Debit Card (Paystack / Flutterwave)</option>
                      <option value="corporate">Corporate Sponsored Invoice</option>
                    </select>
                  </div>
                </div>

                {/* Upload Proof */}
                <div className="space-y-2 pt-2">
                  <label className="font-label-md text-label-md text-secondary">Upload Proof of Payment (Bank Receipt)</label>
                  <label 
                    htmlFor="modal-proof-upload"
                    className="border-2 border-dashed border-outline-variant rounded-lg p-6 flex flex-col items-center justify-center bg-surface hover:border-primary transition-colors cursor-pointer block text-center"
                  >
                    <input 
                      id="modal-proof-upload"
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
                  {proofFileName && (
                    <div className="flex items-center justify-between p-2.5 rounded bg-surface-container border border-outline-variant text-xs">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-[18px]">picture_as_pdf</span>
                        <span className="font-semibold text-on-surface">{proofFileName}</span>
                      </div>
                      <button type="button" onClick={() => setProofFileName(null)} className="text-error hover:text-error/80">
                        <span className="material-symbols-outlined text-[16px]">close</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right 4 Cols: Schedule & Summary */}
            <div className="lg:col-span-4 space-y-stack-md">
              <div className="bg-surface rounded-lg border border-outline-variant p-stack-md space-y-4">
                <h3 className="font-headline-md text-headline-md font-bold text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">calendar_month</span> Future Schedule
                </h3>
                <p className="font-body-sm text-body-sm text-secondary pb-3 border-b border-outline-variant">
                  Record expected future payments for remaining balance.
                </p>

                {outstanding > 0 ? (
                  <div className="p-3 border border-outline-variant rounded bg-surface-container-low/50 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-label-md text-xs font-bold text-on-surface">Installment 2</span>
                      <span className="text-[11px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">Pending</span>
                    </div>
                    <div className="flex justify-between text-xs font-data-tabular">
                      <span className="text-secondary">Due: 15 Oct 2026</span>
                      <span className="font-bold text-on-surface">{formatNaira(outstanding)}</span>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 border border-emerald-300 rounded bg-emerald-50 text-emerald-800 text-xs font-semibold text-center">
                    Paid in full! No future installments required.
                  </div>
                )}

                <div className="pt-3 border-t border-outline-variant space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-secondary">Outstanding Balance</span>
                    <span className="font-bold font-data-tabular text-error">{formatNaira(outstanding)}</span>
                  </div>
                  <div className="w-full bg-surface-container rounded-full h-1.5 overflow-hidden">
                    <div className="bg-primary h-1.5 rounded-full transition-all duration-300" style={{ width: `${paidPercent}%` }} />
                  </div>
                  <p className="text-[11px] text-secondary text-right font-data-tabular">{paidPercent}% paid</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Submit Buttons */}
          <div className="mt-stack-lg pt-stack-md border-t border-outline-variant flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 h-10 rounded border border-outline-variant font-label-md text-label-md font-semibold text-secondary hover:bg-surface-container transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 h-10 rounded bg-primary text-on-primary font-label-md text-label-md font-bold hover:bg-primary-container transition-colors shadow-xs"
            >
              Enroll &amp; Generate Invoice
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
