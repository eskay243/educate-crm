import React, { useState, useEffect } from 'react';
import { useCRM } from '../../context/CRMContext';
import { MentorStatus } from '../../types/crm';
import { NIGERIAN_BANKS } from '../../data/nigerianBanks';
import { apiService } from '../../services/api';

export interface EditMentorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EditMentorModal: React.FC<EditMentorModalProps> = ({ isOpen, onClose }) => {
  const { mentors, updateMentor, selectedMentorForEditId, settings } = useCRM();

  const currentMentor = mentors.find(m => m.id === selectedMentorForEditId) || mentors[0];

  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [department, setDepartment] = useState('Data & AI');
  const [isAddingDept, setIsAddingDept] = useState(false);
  const [newDeptInput, setNewDeptInput] = useState('');
  const [departmentsList, setDepartmentsList] = useState<string[]>([]);

  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [commissionRate, setCommissionRate] = useState(37);
  const [maxCapacity, setMaxCapacity] = useState(30);
  const [status, setStatus] = useState<MentorStatus>('Active');
  const [expertiseString, setExpertiseString] = useState('');
  const [bio, setBio] = useState('');
  const [bankName, setBankName] = useState(NIGERIAN_BANKS[0].name);
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');

  // Bank Verification State
  const [isVerifyingBank, setIsVerifyingBank] = useState(false);
  const [bankVerificationResult, setBankVerificationResult] = useState<{
    verified: boolean;
    accountName?: string;
    message?: string;
  } | null>(null);

  useEffect(() => {
    if (currentMentor) {
      setName(currentMentor.name || '');
      setRole(currentMentor.role || '');
      
      const depts = settings.courseCategories && settings.courseCategories.length > 0
        ? settings.courseCategories
        : ['Software Engineering', 'Data Science & AI', 'Product UI/UX Design', 'Cloud DevOps & SRE', 'Cybersecurity'];
      setDepartmentsList(depts);
      setDepartment(currentMentor.department || depts[0] || 'Software Engineering');
      setIsAddingDept(false);
      setNewDeptInput('');

      setEmail(currentMentor.email || '');
      setPhone(currentMentor.phone || '');
      setCommissionRate(currentMentor.commissionRate || 37);
      setMaxCapacity(currentMentor.maxCapacity || 30);
      setStatus(currentMentor.status || 'Active');
      setExpertiseString(currentMentor.expertise ? currentMentor.expertise.join(', ') : '');
      setBio(currentMentor.bio || '');
      setBankName(currentMentor.bankName || NIGERIAN_BANKS[0].name);
      setAccountNumber(currentMentor.accountNumber || '');
      setAccountName(currentMentor.accountName || (currentMentor.name ? currentMentor.name.toUpperCase() : ''));

      if (currentMentor.isAccountVerified) {
        setBankVerificationResult({
          verified: true,
          accountName: currentMentor.accountName,
          message: `Verified Account ✅ (${currentMentor.accountVerificationSource || 'NIBSS Registry'})`,
        });
      } else {
        setBankVerificationResult(null);
      }
      setIsVerifyingBank(false);
    }
  }, [currentMentor, isOpen, settings.courseCategories]);

  if (!isOpen || !currentMentor) return null;

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

    const expertise = expertiseString
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    updateMentor(currentMentor.id, {
      name,
      role,
      department,
      email,
      phone,
      commissionRate: Number(commissionRate),
      maxCapacity: Number(maxCapacity),
      status,
      expertise: expertise.length > 0 ? expertise : currentMentor.expertise,
      bio,
      bankName,
      accountNumber,
      accountName,
      isAccountVerified: bankVerificationResult?.verified ?? currentMentor.isAccountVerified ?? false,
      accountVerificationSource: bankVerificationResult?.verified ? 'cbn_nuban_verified' : currentMentor.accountVerificationSource,
      accountVerifiedAt: bankVerificationResult?.verified ? new Date().toISOString() : currentMentor.accountVerifiedAt,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-inverse-surface/40 backdrop-blur-xs p-margin-page animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="glass-panel relative w-full max-w-2xl rounded-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden bg-surface-container-lowest border border-outline-variant z-10">
        {/* Header */}
        <div className="flex items-center justify-between p-stack-md px-stack-lg border-b border-outline-variant bg-surface-bright">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[22px]">manage_accounts</span>
            <div>
              <h2 className="font-headline-lg text-lg font-bold text-on-surface">Edit Faculty Mentor Profile</h2>
              <p className="font-body-sm text-xs text-secondary">Admin Rights: Update faculty title, department, rate, capacity, and revenue share.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-secondary hover:text-primary transition-colors p-1 rounded-full hover:bg-surface-container cursor-pointer"
          >
            <span className="material-symbols-outlined text-[24px]">close</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-stack-lg space-y-4 flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="font-label-md text-xs text-secondary font-semibold">Faculty Name <span className="text-error">*</span></label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full h-10 px-3 bg-surface border border-outline-variant rounded font-body-md text-sm text-on-surface focus:border-primary outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-label-md text-xs text-secondary font-semibold">Academic Role / Title <span className="text-error">*</span></label>
              <input
                type="text"
                required
                value={role}
                onChange={e => setRole(e.target.value)}
                className="w-full h-10 px-3 bg-surface border border-outline-variant rounded font-body-md text-sm text-on-surface focus:border-primary outline-none"
              />
            </div>

            {/* Department with Add Option */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="font-label-md text-xs text-secondary font-semibold">Academic Department</label>
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
                    placeholder="New department name..."
                    className="flex-1 h-10 px-3 bg-surface border border-outline-variant rounded font-body-md text-sm text-on-surface focus:border-primary outline-none"
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
                  className="w-full h-10 px-3 bg-surface border border-outline-variant rounded font-body-md text-sm text-on-surface focus:border-primary outline-none cursor-pointer"
                >
                  {departmentsList.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              )}
            </div>

            <div className="space-y-1">
              <label className="font-label-md text-xs text-secondary font-semibold">Status</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as MentorStatus)}
                className="w-full h-10 px-3 bg-surface border border-outline-variant rounded font-body-md text-sm text-on-surface focus:border-primary outline-none cursor-pointer"
              >
                <option value="Active">Active</option>
                <option value="Available">Available</option>
                <option value="On Leave">On Leave</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-label-md text-xs text-secondary font-semibold">Official Email <span className="text-error">*</span></label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full h-10 px-3 bg-surface border border-outline-variant rounded font-body-md text-sm text-on-surface focus:border-primary outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-label-md text-xs text-secondary font-semibold">Telephone Contact</label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full h-10 px-3 bg-surface border border-outline-variant rounded font-body-md text-sm text-on-surface focus:border-primary outline-none"
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="font-label-md text-xs text-secondary font-semibold">Student Enrollment Commission (%)</label>
                <span className="text-[10px] font-bold text-[#166534] bg-[#dcfce7] px-1.5 py-0.2 rounded">Standard 37%</span>
              </div>
              <input
                type="number"
                min="0"
                max="100"
                value={commissionRate}
                onChange={e => setCommissionRate(Number(e.target.value))}
                className="w-full h-10 px-3 bg-surface border border-outline-variant rounded font-data-tabular text-sm text-on-surface focus:border-primary outline-none"
              />
              <p className="text-[11px] text-secondary">37% share credited per assigned student enrollment</p>
            </div>

            <div className="space-y-1">
              <label className="font-label-md text-xs text-secondary font-semibold">Max Student Mentee Capacity</label>
              <input
                type="number"
                min="5"
                max="100"
                value={maxCapacity}
                onChange={e => setMaxCapacity(Number(e.target.value))}
                className="w-full h-10 px-3 bg-surface border border-outline-variant rounded font-data-tabular text-sm text-on-surface focus:border-primary outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-label-md text-xs text-secondary font-semibold">Active Mentees (Current Load)</label>
              <input
                type="text"
                disabled
                value={`${currentMentor.activeMentees} active students`}
                className="w-full h-10 px-3 bg-surface-container-low border border-outline-variant rounded text-xs text-secondary outline-none cursor-not-allowed"
              />
            </div>

            <div className="space-y-1 sm:col-span-2">
              <label className="font-label-md text-xs text-secondary font-semibold">Domain Expertise (comma separated)</label>
              <input
                type="text"
                value={expertiseString}
                onChange={e => setExpertiseString(e.target.value)}
                placeholder="e.g. Python, PyTorch, Cloud Architecture, LLMs"
                className="w-full h-10 px-3 bg-surface border border-outline-variant rounded font-body-md text-sm text-on-surface focus:border-primary outline-none"
              />
            </div>

            {/* Nigerian Bank & NUBAN Verification Section */}
            <div className="sm:col-span-2 space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h4 className="font-label-md text-xs text-on-surface font-semibold">Nigerian Bank Account Details for Payouts (₦)</h4>
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
                    <label className="font-body-sm text-xs text-secondary">Account Number</label>
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
                    className="w-full h-9 px-2 bg-surface border border-outline-variant rounded font-body-md text-xs text-on-surface uppercase outline-none"
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

            <div className="space-y-1 sm:col-span-2">
              <label className="font-label-md text-xs text-secondary font-semibold">Professional Bio &amp; Credentials</label>
              <textarea
                rows={2}
                value={bio}
                onChange={e => setBio(e.target.value)}
                className="w-full p-2.5 bg-surface border border-outline-variant rounded font-body-md text-sm text-on-surface focus:border-primary outline-none"
              />
            </div>
          </div>

          {/* Footer Submit Buttons */}
          <div className="pt-stack-sm flex justify-end gap-3 border-t border-outline-variant">
            <button
              type="button"
              onClick={onClose}
              className="px-4 h-10 rounded border border-outline-variant font-label-md text-xs font-semibold text-secondary hover:bg-surface-container transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 h-10 rounded bg-primary text-on-primary font-label-md text-xs font-bold hover:bg-primary-container transition-colors shadow-xs cursor-pointer"
            >
              Save Profile Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
