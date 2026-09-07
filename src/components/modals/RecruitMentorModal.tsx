import React, { useState, useEffect } from 'react';
import { useCRM } from '../../context/CRMContext';
import { NIGERIAN_BANKS } from '../../data/nigerianBanks';
import { apiService } from '../../services/api';

export interface RecruitMentorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RecruitMentorModal: React.FC<RecruitMentorModalProps> = ({ isOpen, onClose }) => {
  const { recruitMentor, courses, settings } = useCRM();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState('Software Engineering');
  const [isAddingDept, setIsAddingDept] = useState(false);
  const [newDeptInput, setNewDeptInput] = useState('');
  const [departmentsList, setDepartmentsList] = useState<string[]>([]);

  const [commissionRate, setCommissionRate] = useState(37);
  const [maxCapacity, setMaxCapacity] = useState(15);
  const [payoutFrequency, setPayoutFrequency] = useState('Monthly');
  const [bankName, setBankName] = useState(NIGERIAN_BANKS[0].name);
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);

  const [availableCourses, setAvailableCourses] = useState<string[]>([]);
  const [isAddingCourse, setIsAddingCourse] = useState(false);
  const [newCourseInput, setNewCourseInput] = useState('');

  // Bank Verification State
  const [isVerifyingBank, setIsVerifyingBank] = useState(false);
  const [bankVerificationResult, setBankVerificationResult] = useState<{
    verified: boolean;
    accountName?: string;
    message?: string;
  } | null>(null);

  // Fresh blank form state on open
  const resetForm = () => {
    setName('');
    setEmail('');
    setPhone('');
    const depts = settings.courseCategories && settings.courseCategories.length > 0
      ? settings.courseCategories
      : ['Software Engineering', 'Data Science & AI', 'Product UI/UX Design', 'Cloud DevOps & SRE', 'Cybersecurity'];
    setDepartmentsList(depts);
    setDepartment(depts[0] || 'Software Engineering');
    setIsAddingDept(false);
    setNewDeptInput('');

    setCommissionRate(37);
    setMaxCapacity(15);
    setPayoutFrequency('Monthly');
    setBankName(NIGERIAN_BANKS[0].name);
    setAccountNumber('');
    setAccountName('');
    setSelectedCourses([]);

    const baseCourses = courses.length > 0
      ? courses.map(c => c.title)
      : [
        'Full-Stack Software Engineering',
        'Data Science & Analytics',
        'Product UI/UX Design',
        'Cloud DevOps & SRE',
        'AI & Machine Learning',
      ];
    setAvailableCourses(baseCourses);
    setIsAddingCourse(false);
    setNewCourseInput('');

    setIsVerifyingBank(false);
    setBankVerificationResult(null);
  };

  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleCourse = (course: string) => {
    setSelectedCourses(prev =>
      prev.includes(course) ? prev.filter(c => c !== course) : [...prev, course]
    );
  };

  const handleVerifyBank = async () => {
    if (!accountNumber || accountNumber.trim().length !== 10) {
      setBankVerificationResult({
        verified: false,
        message: 'Please enter a valid 10-digit NUBAN account number.',
      });
      return;
    }
    setIsVerifyingBank(true);
    setBankVerificationResult(null);
    try {
      const selectedBank = NIGERIAN_BANKS.find(b => b.name === bankName) || NIGERIAN_BANKS[0];
      const res = await apiService.verifyBankAccount({
        bankCode: selectedBank.code,
        accountNumber: accountNumber.trim(),
        bankName: selectedBank.name,
        accountName: accountName || name,
      });
      if (res?.verified) {
        setBankVerificationResult({
          verified: true,
          accountName: res.accountName,
          message: res.message,
        });
        if (res.accountName) {
          setAccountName(res.accountName);
        }
      } else {
        setBankVerificationResult({
          verified: false,
          message: res?.message || 'Verification failed. Please verify bank and 10-digit account number.',
        });
      }
    } catch (err: any) {
      setBankVerificationResult({
        verified: false,
        message: 'Network verification error. Please try again.',
      });
    } finally {
      setIsVerifyingBank(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;

    recruitMentor({
      name,
      email,
      phone: phone || '+234 800 000 0000',
      role: `${department} Lead Mentor`,
      department,
      expertise: selectedCourses,
      commissionRate: Number(commissionRate),
      activeMentees: 0,
      assignedEnrollmentsCount: 0,
      maxCapacity: Number(maxCapacity),
      rating: 5.0,
      status: 'Active',
      pendingPayout: 0,
      totalEarned: 0,
      payoutStatus: 'Completed',
      bankName,
      accountNumber,
      accountName: accountName || name.toUpperCase(),
      isAccountVerified: bankVerificationResult?.verified ?? false,
      accountVerificationSource: bankVerificationResult?.verified ? 'cbn_nuban_verified' : undefined,
      accountVerifiedAt: bankVerificationResult?.verified ? new Date().toISOString() : undefined,
    });

    resetForm();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-inverse-surface/40 backdrop-blur-xs p-margin-page animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="glass-panel relative w-full max-w-3xl rounded-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden bg-surface-container-lowest border border-outline-variant z-10">
        {/* Header */}
        <div className="flex items-center justify-between p-stack-md px-stack-lg border-b border-outline-variant bg-surface-bright">
          <div>
            <h2 className="font-headline-lg text-headline-lg font-bold text-on-surface">Recruit Mentor</h2>
            <p className="font-body-md text-body-md text-secondary">Add a new mentor to the faculty roster and configure their financial agreement.</p>
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
          {/* Personal Info Section */}
          <section className="bg-surface rounded-lg border border-outline-variant p-stack-md space-y-4">
            <h3 className="text-headline-md font-headline-md font-bold text-primary flex items-center gap-2 border-b border-outline-variant pb-2">
              <span className="material-symbols-outlined text-primary-container">person</span> Personal Info
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-label-md text-label-md text-secondary">Full Name <span className="text-error">*</span></label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Dr. Arthur Pendelton"
                  className="w-full h-10 px-3 bg-surface border border-outline-variant rounded font-body-md text-on-surface focus:border-primary outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="font-label-md text-label-md text-secondary">Email <span className="text-error">*</span></label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="arthur@university.ng"
                  className="w-full h-10 px-3 bg-surface border border-outline-variant rounded font-body-md text-on-surface focus:border-primary outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="font-label-md text-label-md text-secondary">Phone Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+234 802 345 6789"
                  className="w-full h-10 px-3 bg-surface border border-outline-variant rounded font-body-md text-on-surface focus:border-primary outline-none"
                />
              </div>

              {/* Dynamic Department with Add Feature */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="font-label-md text-label-md text-secondary">Specialized Department</label>
                  <button
                    type="button"
                    onClick={() => setIsAddingDept(!isAddingDept)}
                    className="text-xs text-primary font-semibold hover:underline flex items-center gap-0.5 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[14px]">add</span>
                    <span>{isAddingDept ? 'Choose from list' : '+ Add Department'}</span>
                  </button>
                </div>
                {isAddingDept ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newDeptInput}
                      onChange={e => setNewDeptInput(e.target.value)}
                      placeholder="Enter new department name..."
                      className="flex-1 h-10 px-3 bg-surface border border-outline-variant rounded font-body-md text-on-surface focus:border-primary outline-none text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (newDeptInput.trim()) {
                          const trimmed = newDeptInput.trim();
                          if (!departmentsList.includes(trimmed)) {
                            setDepartmentsList(prev => [...prev, trimmed]);
                          }
                          setDepartment(trimmed);
                          setNewDeptInput('');
                          setIsAddingDept(false);
                        }
                      }}
                      className="px-3 h-10 bg-primary text-on-primary rounded text-xs font-bold hover:bg-primary/90 cursor-pointer"
                    >
                      Add
                    </button>
                  </div>
                ) : (
                  <select
                    value={department}
                    onChange={e => setDepartment(e.target.value)}
                    className="w-full h-10 px-3 bg-surface border border-outline-variant rounded font-body-md text-on-surface focus:border-primary outline-none cursor-pointer"
                  >
                    {departmentsList.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Dynamic Courses Offered with Add and Remove Features */}
              <div className="sm:col-span-2 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-label-md text-label-md text-secondary">Courses Offered (Select Multiple)</label>
                  <div className="flex items-center gap-2">
                    {isAddingCourse ? (
                      <div className="flex gap-1.5 items-center">
                        <input
                          type="text"
                          value={newCourseInput}
                          onChange={e => setNewCourseInput(e.target.value)}
                          placeholder="Course title..."
                          className="h-7 px-2 text-xs bg-surface border border-outline-variant rounded outline-none focus:border-primary"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (newCourseInput.trim()) {
                              const trimmed = newCourseInput.trim();
                              if (!availableCourses.includes(trimmed)) {
                                setAvailableCourses(prev => [...prev, trimmed]);
                              }
                              if (!selectedCourses.includes(trimmed)) {
                                setSelectedCourses(prev => [...prev, trimmed]);
                              }
                              setNewCourseInput('');
                              setIsAddingCourse(false);
                            }
                          }}
                          className="h-7 px-2.5 bg-primary text-on-primary text-[11px] font-bold rounded cursor-pointer"
                        >
                          Add
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsAddingCourse(false)}
                          className="h-7 px-1.5 text-secondary text-[11px] hover:text-on-surface cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setIsAddingCourse(true)}
                        className="text-xs text-primary font-semibold hover:underline flex items-center gap-0.5 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[14px]">add</span>
                        <span>+ Add Course</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="border border-outline-variant rounded-lg p-3 bg-surface grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                  {availableCourses.map((c) => (
                    <div key={c} className="flex items-center justify-between text-body-md text-on-surface text-sm p-1 hover:bg-surface-container-low rounded">
                      <label className="flex items-center gap-2 cursor-pointer flex-1 min-w-0">
                        <input
                          type="checkbox"
                          checked={selectedCourses.includes(c)}
                          onChange={() => toggleCourse(c)}
                          className="rounded border-outline-variant text-primary focus:ring-primary"
                        />
                        <span className="truncate">{c}</span>
                      </label>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setAvailableCourses(prev => prev.filter(item => item !== c));
                          setSelectedCourses(prev => prev.filter(item => item !== c));
                        }}
                        className="text-secondary hover:text-error text-xs px-1.5 py-0.5 rounded hover:bg-surface-container cursor-pointer ml-1"
                        title="Remove course from list"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Financial Agreement Section */}
          <section className="bg-surface rounded-lg border border-outline-variant p-stack-md space-y-4">
            <h3 className="text-headline-md font-headline-md font-bold text-primary flex items-center gap-2 border-b border-outline-variant pb-2">
              <span className="material-symbols-outlined text-primary-container">account_balance</span> Financial Agreement
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="font-label-md text-label-md text-secondary">Tuition Commission (%)</label>
                  <span className="text-[10px] font-bold text-[#166534] bg-[#dcfce7] px-1.5 py-0.2 rounded">Fixed 37%</span>
                </div>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={commissionRate}
                  onChange={e => setCommissionRate(Number(e.target.value))}
                  className="w-full h-10 px-3 bg-surface border border-outline-variant rounded font-data-tabular text-on-surface focus:border-primary outline-none"
                />
                <p className="text-[10px] text-secondary">37% share per admitted student enrolled</p>
              </div>
              <div className="space-y-1">
                <label className="font-label-md text-label-md text-secondary">Max Mentee Capacity</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={maxCapacity}
                  onChange={e => setMaxCapacity(Number(e.target.value))}
                  className="w-full h-10 px-3 bg-surface border border-outline-variant rounded font-body-md text-on-surface focus:border-primary outline-none"
                />
                <p className="text-[10px] text-secondary">Maximum active students assigned</p>
              </div>
              <div className="space-y-1">
                <label className="font-label-md text-label-md text-secondary">Payout Frequency</label>
                <select
                  value={payoutFrequency}
                  onChange={e => setPayoutFrequency(e.target.value)}
                  className="w-full h-10 px-3 bg-surface border border-outline-variant rounded font-body-md text-on-surface focus:border-primary outline-none cursor-pointer"
                >
                  <option value="Per Enrollment">Per Enrollment (Direct)</option>
                  <option value="Monthly">Monthly Consolidated</option>
                  <option value="Bi-Weekly">Bi-Weekly</option>
                  <option value="Per Cohort">Per Cohort</option>
                </select>
                <p className="text-[10px] text-secondary">Revenue share disbursement cycle</p>
              </div>

              {/* Nigerian Bank & NUBAN Account Verification */}
              <div className="sm:col-span-3 space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-label-md text-label-md text-on-surface font-semibold">Nigerian Bank Account Details (₦)</h4>
                  <span className="text-[11px] text-secondary">CBN NUBAN 10-Digit Standard</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-surface-container-low/50 rounded-lg border border-outline-variant">
                  <div className="space-y-1">
                    <label className="font-body-sm text-xs text-secondary">Bank Name ({NIGERIAN_BANKS.length} Banks &amp; Neobanks)</label>
                    <select
                      value={bankName}
                      onChange={e => {
                        setBankName(e.target.value);
                        setBankVerificationResult(null);
                      }}
                      className="w-full h-9 px-2 bg-surface border border-outline-variant rounded text-xs text-on-surface outline-none cursor-pointer"
                    >
                      <optgroup label="Commercial Banks">
                        {NIGERIAN_BANKS.filter(b => b.category === 'Commercial').map(b => (
                          <option key={b.code} value={b.name}>{b.name}</option>
                        ))}
                      </optgroup>
                      <optgroup label="FinTechs &amp; Neobanks (MFBs)">
                        {NIGERIAN_BANKS.filter(b => b.category === 'FinTech / Neobank').map(b => (
                          <option key={b.code} value={b.name}>{b.name}</option>
                        ))}
                      </optgroup>
                      <optgroup label="Non-Interest / Islamic Banks">
                        {NIGERIAN_BANKS.filter(b => b.category === 'Non-Interest').map(b => (
                          <option key={b.code} value={b.name}>{b.name}</option>
                        ))}
                      </optgroup>
                      <optgroup label="Merchant Banks">
                        {NIGERIAN_BANKS.filter(b => b.category === 'Merchant').map(b => (
                          <option key={b.code} value={b.name}>{b.name}</option>
                        ))}
                      </optgroup>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="font-body-sm text-xs text-secondary">Account Number (10 Digits)</label>
                      {bankVerificationResult?.verified && (
                        <span className="text-[10px] font-bold text-[#166534] bg-[#dcfce7] px-1.5 py-0.2 rounded">Verified ✅</span>
                      )}
                    </div>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        maxLength={10}
                        value={accountNumber}
                        onChange={e => {
                          setAccountNumber(e.target.value.replace(/\D/g, '').slice(0, 10));
                          setBankVerificationResult(null);
                        }}
                        placeholder="0123456789"
                        className="flex-1 h-9 px-2 bg-surface border border-outline-variant rounded font-data-tabular text-xs text-on-surface outline-none"
                      />
                      <button
                        type="button"
                        disabled={accountNumber.length !== 10 || isVerifyingBank}
                        onClick={handleVerifyBank}
                        className="px-2.5 h-9 bg-primary text-on-primary rounded text-xs font-semibold hover:bg-primary/90 disabled:opacity-40 flex items-center gap-1 cursor-pointer shrink-0"
                      >
                        {isVerifyingBank ? (
                          <span className="text-[11px]">Verifying...</span>
                        ) : (
                          <>
                            <span className="material-symbols-outlined text-[14px]">verified_user</span>
                            <span>Verify</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="font-body-sm text-xs text-secondary">Account Name</label>
                    <input
                      type="text"
                      value={accountName}
                      onChange={e => setAccountName(e.target.value)}
                      placeholder="e.g. ARTHUR PENDELTON"
                      className="w-full h-9 px-2 bg-surface border border-outline-variant rounded text-xs text-on-surface outline-none"
                    />
                  </div>
                </div>

                {bankVerificationResult && (
                  <div className={`p-2.5 rounded-lg border text-xs flex items-center gap-2 ${
                    bankVerificationResult.verified
                      ? 'bg-[#dcfce7]/60 border-[#86efac] text-[#166534]'
                      : 'bg-red-50 border-red-200 text-red-700'
                  }`}>
                    <span className="material-symbols-outlined text-[16px]">
                      {bankVerificationResult.verified ? 'check_circle' : 'error'}
                    </span>
                    <span>{bankVerificationResult.message}</span>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Footer Submit Buttons */}
          <div className="pt-stack-sm flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 h-10 rounded border border-outline-variant font-label-md text-label-md font-semibold text-secondary hover:bg-surface-container transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 h-10 rounded bg-primary text-on-primary font-label-md text-label-md font-bold hover:bg-primary-container transition-colors shadow-xs cursor-pointer"
            >
              Recruit &amp; Confirm Contract
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
