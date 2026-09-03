import React, { useState, useEffect } from 'react';
import { useCRM, formatNaira } from '../../context/CRMContext';

export interface EnrollStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EnrollStudentModal: React.FC<EnrollStudentModalProps> = ({ isOpen, onClose }) => {
  const { enrollStudent, mentors, courses, cohorts } = useCRM();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  
  // Program selection
  const [selectedCourseId, setSelectedCourseId] = useState<string>(courses[0]?.id || '__custom__');
  const [customProgramTitle, setCustomProgramTitle] = useState('');
  
  // Mentor selection
  const [mentorName, setMentorName] = useState(mentors[0]?.name || 'Faculty Mentor Assigned');
  
  // Cohort selection
  const [selectedCohortCode, setSelectedCohortCode] = useState<string>(cohorts[0]?.cohortCode || '__custom__');
  const [customCohortName, setCustomCohortName] = useState(`Cohort ${new Date().getFullYear()}-Q${Math.floor((new Date().getMonth() + 3) / 3)} (Lagos Hub)`);

  // Financial fields
  const [totalCourseFee, setTotalCourseFee] = useState<number>(courses[0]?.tuitionFee || 850000);
  const [initialPayment, setInitialPayment] = useState<number>(courses[0]?.tuitionFee ? Math.round(courses[0].tuitionFee / 2) : 425000);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer');
  const [proofFileName, setProofFileName] = useState<string | null>(null);

  // Sync fee when selected course changes
  useEffect(() => {
    if (selectedCourseId !== '__custom__') {
      const course = courses.find(c => c.id === selectedCourseId);
      if (course) {
        setTotalCourseFee(course.tuitionFee);
        setInitialPayment(Math.round(course.tuitionFee / 2));
      }
    }
  }, [selectedCourseId, courses]);

  if (!isOpen) return null;

  const effectiveProgramName = selectedCourseId === '__custom__' 
    ? (customProgramTitle || 'Professional Technology Track')
    : (courses.find(c => c.id === selectedCourseId)?.title || 'Professional Technology Track');

  const effectiveCohortName = selectedCohortCode === '__custom__'
    ? (customCohortName || 'Cohort Active')
    : (cohorts.find(c => c.cohortCode === selectedCohortCode)?.name || customCohortName);

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
      program: effectiveProgramName,
      mentorName: mentorName || 'Faculty Mentor Assigned',
      status: 'Active',
      attendanceRate: 100,
      tuitionStatus: outstanding === 0 ? 'Paid' : initialPayment > 0 ? 'Partial' : 'Overdue',
      cohort: effectiveCohortName,
      totalFees: Number(totalCourseFee),
      outstandingBalance: outstanding,
      courses: [
        {
          id: `c-${Date.now()}`,
          code: courses.find(c => c.id === selectedCourseId)?.code || 'TECH-101',
          name: effectiveProgramName,
          semester: `Term ${new Date().getFullYear()}`,
          instructor: mentorName || 'Faculty Mentor Assigned',
          fee: Number(totalCourseFee),
          billedDate: paymentDate,
        }
      ],
      installments: [
        {
          id: `inst-1-${Date.now()}`,
          description: 'Initial Deposit / Seat Lock',
          dueDate: paymentDate,
          amount: Number(initialPayment),
          status: 'Paid',
        },
        ...(outstanding > 0 ? [{
          id: `inst-2-${Date.now()}`,
          description: 'Installment 2 (Tuition Balance Settlement)',
          dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
          amount: outstanding,
          status: 'Pending' as const,
        }] : [])
      ]
    });

    onClose();
  };

  const outstanding = Math.max(0, totalCourseFee - initialPayment);
  const paidPercent = totalCourseFee > 0 ? Math.min(100, Math.round((initialPayment / totalCourseFee) * 100)) : 0;

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
            className="text-secondary hover:text-primary transition-colors p-1 rounded-full hover:bg-surface-container cursor-pointer"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>close</span>
          </button>
        </div>

        {/* Form Body with 2 Columns */}
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
                    <label className="font-label-md text-xs font-semibold text-secondary">Full Name <span className="text-error">*</span></label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="e.g. Babatunde Adeleke"
                      className="w-full h-10 px-3 bg-surface-container-lowest border border-outline-variant rounded font-body-md text-on-surface focus:border-primary outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-label-md text-xs font-semibold text-secondary">Contact Email <span className="text-error">*</span></label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="babatunde@example.ng"
                      className="w-full h-10 px-3 bg-surface-container-lowest border border-outline-variant rounded font-body-md text-on-surface focus:border-primary outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-label-md text-xs font-semibold text-secondary">Phone Number (WhatsApp)</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="+234 803 123 4567"
                      className="w-full h-10 px-3 bg-surface-container-lowest border border-outline-variant rounded font-body-md text-on-surface focus:border-primary outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-label-md text-xs font-semibold text-secondary">Assigned Faculty Mentor</label>
                    <select
                      value={mentorName}
                      onChange={e => setMentorName(e.target.value)}
                      className="w-full h-10 px-3 bg-surface-container-lowest border border-outline-variant rounded font-body-md text-on-surface focus:border-primary outline-none cursor-pointer"
                    >
                      {mentors.length === 0 ? (
                        <option value="Faculty Mentor Assigned">General Faculty Pool (Unassigned)</option>
                      ) : (
                        mentors.map(m => (
                          <option key={m.id} value={m.name}>{m.name} ({m.department})</option>
                        ))
                      )}
                    </select>
                  </div>

                  {/* Academic Course Track Selection */}
                  <div className="space-y-1 sm:col-span-2">
                    <label className="font-label-md text-xs font-semibold text-secondary">Academic Program Track <span className="text-error">*</span></label>
                    <select
                      value={selectedCourseId}
                      onChange={e => setSelectedCourseId(e.target.value)}
                      className="w-full h-10 px-3 bg-surface-container-lowest border border-outline-variant rounded font-body-md text-on-surface focus:border-primary outline-none cursor-pointer"
                    >
                      {courses.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.title} — {formatNaira(c.tuitionFee)} ({c.durationWeeks} Weeks)
                        </option>
                      ))}
                      <option value="__custom__">+ Enter Custom Program / Track...</option>
                    </select>

                    {selectedCourseId === '__custom__' && (
                      <div className="pt-2 animate-in fade-in">
                        <input
                          type="text"
                          required
                          value={customProgramTitle}
                          onChange={e => setCustomProgramTitle(e.target.value)}
                          placeholder="e.g. Full-Stack Software Engineering or Enterprise Data Science"
                          className="w-full h-10 px-3 bg-surface-container-lowest border border-primary rounded font-body-md text-on-surface outline-none"
                        />
                      </div>
                    )}
                  </div>

                  {/* Academic Cohort Selection */}
                  <div className="space-y-1 sm:col-span-2">
                    <label className="font-label-md text-xs font-semibold text-secondary">Academic Cohort Assignment <span className="text-error">*</span></label>
                    <select
                      value={selectedCohortCode}
                      onChange={e => setSelectedCohortCode(e.target.value)}
                      className="w-full h-10 px-3 bg-surface-container-lowest border border-outline-variant rounded font-body-md text-on-surface focus:border-primary outline-none cursor-pointer"
                    >
                      {cohorts.map(c => (
                        <option key={c.id} value={c.cohortCode}>
                          {c.name} ({c.cohortCode})
                        </option>
                      ))}
                      <option value="__custom__">+ Enter Custom Cohort Tag...</option>
                    </select>

                    {selectedCohortCode === '__custom__' && (
                      <div className="pt-2 animate-in fade-in">
                        <input
                          type="text"
                          required
                          value={customCohortName}
                          onChange={e => setCustomCohortName(e.target.value)}
                          placeholder="e.g. Cohort 2026-Q4 Lagos Hub"
                          className="w-full h-10 px-3 bg-surface-container-lowest border border-primary rounded font-body-md text-on-surface outline-none"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Initial Payment & Tuition Pricing Card */}
              <div className="bg-surface rounded-lg border border-outline-variant p-stack-md space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-headline-md text-headline-md font-bold text-on-surface flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">account_balance_wallet</span> 
                    <span>Tuition Pricing &amp; Initial Payment</span>
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-md text-[11px] uppercase font-bold">
                    Draft Receipt
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-label-md text-xs font-semibold text-secondary">Total Course Fee (₦) <span className="text-error">*</span></label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary font-bold">₦</span>
                      <input
                        type="number"
                        required
                        value={totalCourseFee}
                        onChange={e => setTotalCourseFee(Number(e.target.value))}
                        className="w-full h-10 pl-8 pr-3 bg-surface-container-lowest border border-outline-variant rounded font-data-tabular font-bold text-on-surface focus:border-primary outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="font-label-md text-xs font-semibold text-secondary">Initial Payment Deposit (₦) <span className="text-error">*</span></label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary font-bold">₦</span>
                      <input
                        type="number"
                        required
                        value={initialPayment}
                        onChange={e => setInitialPayment(Number(e.target.value))}
                        className="w-full h-10 pl-8 pr-3 bg-surface-container-lowest border border-outline-variant rounded font-data-tabular font-bold text-on-surface focus:border-primary outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="font-label-md text-xs font-semibold text-secondary">Payment Date</label>
                    <input
                      type="date"
                      value={paymentDate}
                      onChange={e => setPaymentDate(e.target.value)}
                      className="w-full h-10 px-3 bg-surface-container-lowest border border-outline-variant rounded font-body-md text-on-surface focus:border-primary outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-label-md text-xs font-semibold text-secondary">Payment Channel</label>
                    <select
                      value={paymentMethod}
                      onChange={e => setPaymentMethod(e.target.value)}
                      className="w-full h-10 px-3 bg-surface-container-lowest border border-outline-variant rounded font-body-md text-on-surface focus:border-primary outline-none cursor-pointer"
                    >
                      <option value="bank_transfer">Nigerian Bank Transfer (NIBSS / Access Bank)</option>
                      <option value="card">Debit Card (Paystack / Flutterwave)</option>
                      <option value="corporate">Corporate Sponsored Invoice</option>
                    </select>
                  </div>
                </div>

                {/* Upload Proof */}
                <div className="space-y-2 pt-2">
                  <label className="font-label-md text-xs font-semibold text-secondary">Upload Proof of Payment (Bank Receipt)</label>
                  <label 
                    htmlFor="modal-proof-upload"
                    className="border-2 border-dashed border-outline-variant rounded-lg p-5 flex flex-col items-center justify-center bg-surface-container-lowest hover:border-primary transition-colors cursor-pointer block text-center"
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
                    <p className="font-body-md text-xs text-on-surface">
                      <span className="font-bold text-primary">Click to upload</span> or drag and drop receipt
                    </p>
                    {proofFileName ? (
                      <p className="font-bold text-xs text-[#166534] mt-1 flex items-center justify-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">check_circle</span>
                        <span>{proofFileName}</span>
                      </p>
                    ) : (
                      <p className="font-body-sm text-[11px] text-secondary mt-0.5">PDF, JPG, or PNG (max. 5MB)</p>
                    )}
                  </label>
                </div>
              </div>
            </div>

            {/* Right 4 Cols: Live Settlement Summary */}
            <div className="lg:col-span-4 space-y-stack-md">
              <div className="bg-surface rounded-lg border border-outline-variant p-stack-md space-y-4">
                <h3 className="font-headline-md text-headline-md font-bold text-on-surface">Enrollment Summary</h3>
                
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between items-center py-2 border-b border-outline-variant/60">
                    <span className="text-secondary">Program Track:</span>
                    <span className="font-semibold text-on-surface text-right truncate max-w-[160px]">{effectiveProgramName}</span>
                  </div>

                  <div className="flex justify-between items-center py-2 border-b border-outline-variant/60">
                    <span className="text-secondary">Cohort:</span>
                    <span className="font-semibold text-on-surface text-right truncate max-w-[160px]">{effectiveCohortName}</span>
                  </div>

                  <div className="flex justify-between items-center py-2 border-b border-outline-variant/60">
                    <span className="text-secondary">Total Billed Fee:</span>
                    <span className="font-bold text-primary font-mono">{formatNaira(totalCourseFee)}</span>
                  </div>

                  <div className="flex justify-between items-center py-2 border-b border-outline-variant/60">
                    <span className="text-secondary">Initial Paid:</span>
                    <span className="font-bold text-[#166534] font-mono">{formatNaira(initialPayment)}</span>
                  </div>

                  <div className="flex justify-between items-center py-2 border-b border-outline-variant/60">
                    <span className="text-secondary">Balance Due:</span>
                    <span className={`font-bold font-mono ${outstanding > 0 ? 'text-error' : 'text-[#166534]'}`}>
                      {formatNaira(outstanding)}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1 pt-1">
                    <div className="flex justify-between text-[11px] font-semibold text-secondary">
                      <span>Tuition Covered:</span>
                      <span className="font-bold text-primary">{paidPercent}%</span>
                    </div>
                    <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary transition-all duration-300 rounded-full"
                        style={{ width: `${paidPercent}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Settlement Bank Card */}
              <div className="p-3.5 bg-secondary-container/30 border border-primary/20 rounded-lg text-xs space-y-1.5">
                <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Settlement Target (NIBSS)</span>
                <p className="font-bold text-on-surface">Access Bank Nigeria PLC</p>
                <p className="font-mono text-secondary text-[11px]">NUBAN: 0812948192</p>
                <p className="text-[11px] text-secondary">Beneficiary: Nexus Tech Operations Ltd</p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                <button
                  type="submit"
                  className="w-full h-11 bg-primary text-on-primary rounded-lg font-label-md text-xs font-bold hover:bg-primary/90 transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">verified</span>
                  <span>Confirm &amp; Enroll Student</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="w-full h-10 border border-outline-variant rounded-lg font-label-md text-xs font-semibold text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
