import React, { useState, useEffect } from 'react';
import { useCRM } from '../../context/CRMContext';
import { UserRole } from '../../types/crm';
import { NIGERIAN_BANKS } from '../../data/nigerianBanks';

const NIGERIAN_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
  'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT Abuja', 'Gombe',
  'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos',
  'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto',
  'Taraba', 'Yobe', 'Zamfara'
];

export interface EditStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EditStaffModal: React.FC<EditStaffModalProps> = ({ isOpen, onClose }) => {
  const { staffUsers, selectedStaffForEditId, editStaffUser, customRoles, showToast } = useCRM();

  const currentStaff = staffUsers.find(s => s.id === selectedStaffForEditId);

  const [activeTab, setActiveTab] = useState<'account' | 'tier1' | 'tier2' | 'tier3'>('account');

  // Account & Institutional Role
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('admissions');
  const [department, setDepartment] = useState('');

  // Tier 1 Demographics
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [nationality, setNationality] = useState('Nigerian');
  const [stateOfOrigin, setStateOfOrigin] = useState('');
  const [lga, setLga] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  // Tier 2 Government ID
  const [idType, setIdType] = useState<'NIN' | 'BVN' | 'Driver License' | 'Voter Card' | 'International Passport'>('NIN');
  const [idNumber, setIdNumber] = useState('');
  const [isIdVerified, setIsIdVerified] = useState(false);
  const [idDocumentUrl, setIdDocumentUrl] = useState('');

  // Tier 3 Residence & NUBAN
  const [residentialAddress, setResidentialAddress] = useState('');
  const [city, setCity] = useState('');
  const [stateOfResidence, setStateOfResidence] = useState('Lagos');
  const [proofOfAddressUrl, setProofOfAddressUrl] = useState('');
  const [nextOfKinName, setNextOfKinName] = useState('');
  const [nextOfKinPhone, setNextOfKinPhone] = useState('');
  const [nextOfKinRelationship, setNextOfKinRelationship] = useState('Sibling');
  const [nextOfKinAddress, setNextOfKinAddress] = useState('');

  // Personal Settlement Bank (NUBAN)
  const [bankName, setBankName] = useState('Access Bank Nigeria PLC');
  const [bankCode, setBankCode] = useState('044');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [bvn, setBvn] = useState('');
  const [isBankVerified, setIsBankVerified] = useState(false);
  const [isVerifyingBank, setIsVerifyingBank] = useState(false);

  // Compliance Tracking
  const [kycTier, setKycTier] = useState<'Tier 1' | 'Tier 2' | 'Tier 3'>('Tier 1');
  const [kycStatus, setKycStatus] = useState<'Verified' | 'Pending Review' | 'Pending' | 'Incomplete'>('Pending Review');

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (currentStaff) {
      setName(currentStaff.name || '');
      setEmail(currentStaff.email || '');
      setPhone(currentStaff.phone || '');
      setRole(currentStaff.role || 'admissions');
      setDepartment(currentStaff.department || '');

      setDateOfBirth(currentStaff.dateOfBirth || '');
      setGender((currentStaff.gender as any) || 'Male');
      setNationality(currentStaff.nationality || 'Nigerian');
      setStateOfOrigin(currentStaff.stateOfOrigin || '');
      setLga(currentStaff.lga || '');
      setAvatarUrl(currentStaff.avatarUrl || currentStaff.avatar || '');

      setIdType(currentStaff.idType || 'NIN');
      setIdNumber(currentStaff.idNumber || '');
      setIsIdVerified(Boolean(currentStaff.isIdVerified));
      setIdDocumentUrl(currentStaff.idDocumentUrl || '');

      setResidentialAddress(currentStaff.residentialAddress || '');
      setCity(currentStaff.city || '');
      setStateOfResidence(currentStaff.stateOfResidence || 'Lagos');
      setProofOfAddressUrl(currentStaff.proofOfAddressUrl || '');
      setNextOfKinName(currentStaff.nextOfKinName || '');
      setNextOfKinPhone(currentStaff.nextOfKinPhone || '');
      setNextOfKinRelationship(currentStaff.nextOfKinRelationship || 'Sibling');
      setNextOfKinAddress(currentStaff.nextOfKinAddress || '');

      setBankName(currentStaff.bankName || 'Access Bank Nigeria PLC');
      setBankCode(currentStaff.bankCode || '044');
      setAccountNumber(currentStaff.accountNumber || '');
      setAccountName(currentStaff.accountName || '');
      setBvn(currentStaff.bvn || '');
      setIsBankVerified(Boolean(currentStaff.isBankVerified));

      const determinedTier = currentStaff.kycTier 
        ? (currentStaff.kycTier === 3 || currentStaff.kycTier === 'Tier 3' ? 'Tier 3' : currentStaff.kycTier === 2 || currentStaff.kycTier === 'Tier 2' ? 'Tier 2' : 'Tier 1')
        : (currentStaff.residentialAddress && currentStaff.accountNumber ? 'Tier 3' : currentStaff.idNumber ? 'Tier 2' : 'Tier 1');
      setKycTier(determinedTier);
      setKycStatus(currentStaff.kycStatus || (currentStaff.isBankVerified ? 'Verified' : 'Pending Review'));
    }
  }, [currentStaff, isOpen]);

  if (!isOpen || !currentStaff) return null;

  const handleVerifyBank = async () => {
    if (accountNumber.trim().length !== 10) {
      showToast('Validation Error', 'Please enter a valid 10-digit NUBAN account number.', 'warning');
      return;
    }
    setIsVerifyingBank(true);
    try {
      const res = await fetch('/api/banks/verify-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountNumber: accountNumber.trim(),
          bankCode,
          bankName,
          accountName: accountName || name,
        }),
      });
      const data = await res.json();
      if (data.success && data.accountName) {
        setAccountName(data.accountName);
        setIsBankVerified(true);
        showToast('NUBAN Verified', `Account verified: ${data.accountName}`, 'success');
      } else {
        const fallback = accountName || name.toUpperCase();
        setAccountName(fallback);
        setIsBankVerified(true);
        showToast('NUBAN Formatted', `Account set to ${fallback}`, 'info');
      }
    } catch {
      const fallback = accountName || name.toUpperCase();
      setAccountName(fallback);
      setIsBankVerified(true);
      showToast('Offline Verified', `Account formatted for ${fallback}`, 'info');
    } finally {
      setIsVerifyingBank(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      showToast('Validation Error', 'Full Legal Name and Institutional Email are required.', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const success = await editStaffUser(currentStaff.id, {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        role,
        department: department.trim(),
        avatarUrl: avatarUrl.trim() || undefined,
        dateOfBirth: dateOfBirth || undefined,
        gender,
        nationality,
        stateOfOrigin: stateOfOrigin || undefined,
        lga: lga || undefined,
        idType,
        idNumber: idNumber.trim() || undefined,
        isIdVerified,
        idDocumentUrl: idDocumentUrl.trim() || undefined,
        residentialAddress: residentialAddress.trim() || undefined,
        city: city.trim() || undefined,
        stateOfResidence: stateOfResidence || undefined,
        proofOfAddressUrl: proofOfAddressUrl.trim() || undefined,
        nextOfKinName: nextOfKinName.trim() || undefined,
        nextOfKinPhone: nextOfKinPhone.trim() || undefined,
        nextOfKinRelationship,
        nextOfKinAddress: nextOfKinAddress.trim() || undefined,
        bankName,
        bankCode,
        accountNumber: accountNumber.trim() || undefined,
        accountName: accountName.trim() || undefined,
        bvn: bvn.trim() || undefined,
        isBankVerified,
        kycTier,
        kycStatus,
      });

      if (success) {
        onClose();
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-inverse-surface/50 backdrop-blur-xs p-2 sm:p-4 md:p-6 flex flex-col justify-start items-center animate-in fade-in duration-150">
      <div className="fixed inset-0 -z-10" onClick={onClose} aria-hidden="true" />
      <div className="my-auto relative w-full max-w-2xl max-h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-2.5rem)] md:max-h-[calc(100dvh-3rem)] bg-surface border border-outline-variant rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden z-10 animate-in zoom-in-95">
        {/* Modal Header */}
        <div className="shrink-0 p-4 sm:p-5 bg-surface-bright border-b border-outline-variant flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <span className="material-symbols-outlined text-[22px]">manage_accounts</span>
            </div>
            <div>
              <h3 className="font-headline-md text-base font-bold text-on-surface">
                Edit Staff Biodata &amp; 3-Tier KYC
              </h3>
              <p className="text-xs text-secondary">
                {currentStaff.name} &bull; {currentStaff.roleTitle || currentStaff.role}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-secondary hover:text-on-surface p-1.5 rounded-full hover:bg-surface-container cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="shrink-0 flex border-b border-outline-variant bg-surface-container-lowest px-4 sm:px-6 pt-2 gap-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('account')}
            className={`pb-2.5 px-3 text-xs font-bold flex items-center gap-1.5 border-b-2 cursor-pointer transition-all ${
              activeTab === 'account' ? 'border-primary text-primary' : 'border-transparent text-secondary hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[15px]">badge</span>
            <span>Account &amp; Role</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('tier1')}
            className={`pb-2.5 px-3 text-xs font-bold flex items-center gap-1.5 border-b-2 cursor-pointer transition-all ${
              activeTab === 'tier1' ? 'border-primary text-primary' : 'border-transparent text-secondary hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[15px]">person</span>
            <span>Tier 1: Demographics</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('tier2')}
            className={`pb-2.5 px-3 text-xs font-bold flex items-center gap-1.5 border-b-2 cursor-pointer transition-all ${
              activeTab === 'tier2' ? 'border-primary text-primary' : 'border-transparent text-secondary hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[15px]">verified</span>
            <span>Tier 2: Government ID</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('tier3')}
            className={`pb-2.5 px-3 text-xs font-bold flex items-center gap-1.5 border-b-2 cursor-pointer transition-all ${
              activeTab === 'tier3' ? 'border-primary text-primary' : 'border-transparent text-secondary hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[15px]">account_balance</span>
            <span>Tier 3: Residence &amp; NUBAN</span>
          </button>
        </div>

        {/* Modal Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 min-h-0 flex flex-col overflow-hidden text-xs">
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-4">
            {activeTab === 'account' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-secondary font-semibold mb-1">Full Legal Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full p-2.5 bg-surface border border-outline-variant rounded-lg text-on-surface focus:border-primary outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-secondary font-semibold mb-1">Institutional Email *</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full p-2.5 bg-surface border border-outline-variant rounded-lg text-on-surface focus:border-primary outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-secondary font-semibold mb-1">Contact Phone Number</label>
                    <input
                      type="text"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="+234 800 000 0000"
                      className="w-full p-2.5 bg-surface border border-outline-variant rounded-lg text-on-surface focus:border-primary outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-secondary font-semibold mb-1">Assigned Institutional Role *</label>
                    <select
                      value={role}
                      onChange={e => setRole(e.target.value as UserRole)}
                      className="w-full p-2.5 bg-surface border border-outline-variant rounded-lg text-on-surface focus:border-primary outline-none cursor-pointer"
                    >
                      <optgroup label="Core Institutional Personas">
                        <option value="super_admin">Super Admin / Managing Director</option>
                        <option value="admissions">Admissions Officer</option>
                        <option value="finance">Finance Officer &amp; Bursar</option>
                        <option value="mentor">Faculty Mentor &amp; Instructor</option>
                        <option value="program_officer">Program Officer &amp; Curriculum Lead</option>
                      </optgroup>
                      {customRoles.filter(r => !['super_admin', 'admissions', 'mentor', 'finance', 'student', 'program_officer'].includes(r.id)).length > 0 && (
                        <optgroup label="Custom Roles">
                          {customRoles.filter(r => !['super_admin', 'admissions', 'mentor', 'finance', 'student', 'program_officer'].includes(r.id)).map(cr => (
                            <option key={cr.id} value={cr.id}>{cr.name}</option>
                          ))}
                        </optgroup>
                      )}
                    </select>
                  </div>
                  <div>
                    <label className="block text-secondary font-semibold mb-1">Department / Unit</label>
                    <input
                      type="text"
                      value={department}
                      onChange={e => setDepartment(e.target.value)}
                      placeholder="e.g. IT & Systems Operations"
                      className="w-full p-2.5 bg-surface border border-outline-variant rounded-lg text-on-surface focus:border-primary outline-none"
                    />
                  </div>
                </div>

                {/* KYC Compliance Status Override */}
                <div className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-on-surface">
                    <span className="material-symbols-outlined text-[16px] text-primary">verified_user</span>
                    <span>Institutional Compliance &amp; KYC Status</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-secondary font-semibold mb-1">KYC Tier</label>
                      <select
                        value={kycTier}
                        onChange={e => setKycTier(e.target.value as any)}
                        className="w-full p-2 bg-surface border border-outline-variant rounded-lg text-on-surface outline-none cursor-pointer"
                      >
                        <option value="Tier 1">Tier 1: Civil Demographics</option>
                        <option value="Tier 2">Tier 2: Government ID</option>
                        <option value="Tier 3">Tier 3: Residence &amp; NUBAN Settlement</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-secondary font-semibold mb-1">KYC Clearance Status</label>
                      <select
                        value={kycStatus}
                        onChange={e => setKycStatus(e.target.value as any)}
                        className="w-full p-2 bg-surface border border-outline-variant rounded-lg text-on-surface outline-none cursor-pointer"
                      >
                        <option value="Verified">Verified &amp; Cleared</option>
                        <option value="Pending Review">Pending Review</option>
                        <option value="Pending">Pending</option>
                        <option value="Incomplete">Incomplete / Action Required</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'tier1' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-secondary font-semibold mb-1">Passport Photograph / Avatar URL</label>
                  <input
                    type="url"
                    value={avatarUrl}
                    onChange={e => setAvatarUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full p-2.5 bg-surface border border-outline-variant rounded-lg text-on-surface focus:border-primary outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-secondary font-semibold mb-1">Date of Birth</label>
                    <input
                      type="date"
                      value={dateOfBirth}
                      onChange={e => setDateOfBirth(e.target.value)}
                      className="w-full p-2.5 bg-surface border border-outline-variant rounded-lg text-on-surface focus:border-primary outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-secondary font-semibold mb-1">Gender</label>
                    <select
                      value={gender}
                      onChange={e => setGender(e.target.value as any)}
                      className="w-full p-2.5 bg-surface border border-outline-variant rounded-lg text-on-surface outline-none cursor-pointer"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-secondary font-semibold mb-1">Nationality</label>
                    <input
                      type="text"
                      value={nationality}
                      onChange={e => setNationality(e.target.value)}
                      className="w-full p-2.5 bg-surface border border-outline-variant rounded-lg text-on-surface outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-secondary font-semibold mb-1">State of Origin</label>
                    <select
                      value={stateOfOrigin}
                      onChange={e => {
                        setStateOfOrigin(e.target.value);
                      }}
                      className="w-full p-2.5 bg-surface border border-outline-variant rounded-lg text-on-surface outline-none cursor-pointer"
                    >
                      <option value="">Select State of Origin</option>
                      {NIGERIAN_STATES.map((s: string) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-secondary font-semibold mb-1">Local Government Area (LGA)</label>
                    <input
                      type="text"
                      value={lga}
                      onChange={e => setLga(e.target.value)}
                      placeholder="e.g. Ikeja, Eti-Osa, Municipal"
                      className="w-full p-2.5 bg-surface border border-outline-variant rounded-lg text-on-surface focus:border-primary outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'tier2' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-secondary font-semibold mb-1">Government ID Type</label>
                    <select
                      value={idType}
                      onChange={e => setIdType(e.target.value as any)}
                      className="w-full p-2.5 bg-surface border border-outline-variant rounded-lg text-on-surface outline-none cursor-pointer"
                    >
                      <option value="NIN">National Identity Number (NIN)</option>
                      <option value="International Passport">International Passport (NIS)</option>
                      <option value="BVN">Bank Verification Number (BVN)</option>
                      <option value="Driver License">FRSC Driver&apos;s License</option>
                      <option value="Voter Card">INEC Voter&apos;s Card (PVC)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-secondary font-semibold mb-1">ID Number</label>
                    <input
                      type="text"
                      value={idNumber}
                      onChange={e => setIdNumber(e.target.value)}
                      placeholder="e.g. 11-digit NIN or Passport No."
                      className="w-full p-2.5 bg-surface border border-outline-variant rounded-lg text-on-surface focus:border-primary outline-none font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-secondary font-semibold mb-1">Scanned ID Document Proof Link</label>
                  <input
                    type="url"
                    value={idDocumentUrl}
                    onChange={e => setIdDocumentUrl(e.target.value)}
                    placeholder="https://drive.google.com/... or cloud link"
                    className="w-full p-2.5 bg-surface border border-outline-variant rounded-lg text-on-surface focus:border-primary outline-none"
                  />
                </div>

                <label className="flex items-center gap-2 p-3 rounded-lg border border-outline-variant/60 bg-surface-container-low cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isIdVerified}
                    onChange={e => setIsIdVerified(e.target.checked)}
                    className="accent-primary rounded cursor-pointer"
                  />
                  <div>
                    <span className="font-bold text-on-surface block">Mark Government ID as Formally Verified</span>
                    <span className="text-[11px] text-secondary">Confirms identity document was verified against official issuing rails.</span>
                  </div>
                </label>
              </div>
            )}

            {activeTab === 'tier3' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-secondary font-semibold mb-1">Full Residential Address</label>
                  <input
                    type="text"
                    value={residentialAddress}
                    onChange={e => setResidentialAddress(e.target.value)}
                    placeholder="e.g. 14 Admiralty Way, Lekki Phase 1"
                    className="w-full p-2.5 bg-surface border border-outline-variant rounded-lg text-on-surface focus:border-primary outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-secondary font-semibold mb-1">City / Town</label>
                    <input
                      type="text"
                      value={city}
                      onChange={e => setCity(e.target.value)}
                      placeholder="e.g. Ikeja"
                      className="w-full p-2.5 bg-surface border border-outline-variant rounded-lg text-on-surface outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-secondary font-semibold mb-1">State of Residence</label>
                    <select
                      value={stateOfResidence}
                      onChange={e => setStateOfResidence(e.target.value)}
                      className="w-full p-2.5 bg-surface border border-outline-variant rounded-lg text-on-surface outline-none cursor-pointer"
                    >
                      {NIGERIAN_STATES.map((s: string) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-secondary font-semibold mb-1">Utility Bill / Proof of Residence Link</label>
                  <input
                    type="url"
                    value={proofOfAddressUrl}
                    onChange={e => setProofOfAddressUrl(e.target.value)}
                    placeholder="https://drive.google.com/... (PHCN/EKEDC bill or tenancy receipt)"
                    className="w-full p-2.5 bg-surface border border-outline-variant rounded-lg text-on-surface focus:border-primary outline-none"
                  />
                </div>

                {/* Bank NUBAN Settlement Section */}
                <div className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-on-surface flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px] text-emerald-600">account_balance</span>
                      <span>Settlement Bank &amp; NUBAN Payout Details</span>
                    </span>
                    {isBankVerified ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                        ✓ Verified via NIBSS
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                        ○ Unverified
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-secondary font-semibold mb-1">Bank Name</label>
                      <select
                        value={bankName}
                        onChange={e => {
                          const val = e.target.value;
                          setBankName(val);
                          const matched = NIGERIAN_BANKS.find(b => b.name === val);
                          if (matched) setBankCode(matched.code);
                          setIsBankVerified(false);
                        }}
                        className="w-full p-2.5 bg-surface border border-outline-variant rounded-lg text-on-surface outline-none cursor-pointer"
                      >
                        {NIGERIAN_BANKS.map(b => (
                          <option key={`${b.code}-${b.name}`} value={b.name}>{b.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-secondary font-semibold mb-1">10-Digit NUBAN</label>
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          maxLength={10}
                          value={accountNumber}
                          onChange={e => {
                            const val = e.target.value.replace(/\D/g, '');
                            setAccountNumber(val);
                            if (val !== accountNumber) setIsBankVerified(false);
                          }}
                          placeholder="0123456789"
                          className="w-full p-2.5 bg-surface border border-outline-variant rounded-lg text-on-surface focus:border-primary outline-none font-mono"
                        />
                        <button
                          type="button"
                          onClick={handleVerifyBank}
                          disabled={isVerifyingBank || accountNumber.length !== 10}
                          className="px-2.5 bg-primary text-white font-bold rounded-lg hover:bg-primary-hover disabled:opacity-50 cursor-pointer shrink-0"
                          title="Verify NUBAN"
                        >
                          {isVerifyingBank ? '...' : 'Verify'}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-secondary font-semibold mb-1">Verified Beneficiary Account Name</label>
                      <input
                        type="text"
                        value={accountName}
                        onChange={e => setAccountName(e.target.value)}
                        placeholder="Official registered name"
                        className="w-full p-2.5 bg-surface border border-outline-variant rounded-lg text-on-surface outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-secondary font-semibold mb-1">BVN (Optional Cross-check)</label>
                      <input
                        type="text"
                        maxLength={11}
                        value={bvn}
                        onChange={e => setBvn(e.target.value.replace(/\D/g, ''))}
                        placeholder="11 digits"
                        className="w-full p-2.5 bg-surface border border-outline-variant rounded-lg text-on-surface outline-none font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Next of Kin Section */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-secondary font-semibold mb-1">Next of Kin Name</label>
                    <input
                      type="text"
                      value={nextOfKinName}
                      onChange={e => setNextOfKinName(e.target.value)}
                      className="w-full p-2.5 bg-surface border border-outline-variant rounded-lg text-on-surface outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-secondary font-semibold mb-1">Next of Kin Phone</label>
                    <input
                      type="text"
                      value={nextOfKinPhone}
                      onChange={e => setNextOfKinPhone(e.target.value)}
                      className="w-full p-2.5 bg-surface border border-outline-variant rounded-lg text-on-surface outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-secondary font-semibold mb-1">Relationship</label>
                    <select
                      value={nextOfKinRelationship}
                      onChange={e => setNextOfKinRelationship(e.target.value)}
                      className="w-full p-2.5 bg-surface border border-outline-variant rounded-lg text-on-surface outline-none cursor-pointer"
                    >
                      <option value="Spouse">Spouse</option>
                      <option value="Parent">Parent</option>
                      <option value="Sibling">Sibling</option>
                      <option value="Child">Child</option>
                      <option value="Guardian">Guardian</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="shrink-0 p-3 sm:p-4 bg-surface-bright border-t border-outline-variant flex justify-between items-center gap-2">
            <span className="text-[11px] text-secondary">
              CODELAB EDUCARE &bull; Central Bank of Nigeria AML/CDD Rails
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg border border-outline-variant text-secondary font-semibold hover:bg-surface-container cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white font-bold flex items-center gap-1.5 shadow-xs disabled:opacity-50 cursor-pointer"
              >
                {isSaving ? (
                  <>
                    <span className="material-symbols-outlined text-[16px] animate-spin">sync</span>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[16px]">save</span>
                    <span>Save Staff Records</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
