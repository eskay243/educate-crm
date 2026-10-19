import React, { useState, useMemo } from 'react';
import { useCRM } from '../../context/CRMContext';
import { NigerianBiodataKYC } from '../../types/crm';

export interface ViewBiodataModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ViewBiodataModal: React.FC<ViewBiodataModalProps> = ({ isOpen, onClose }) => {
  const { 
    selectedBiodataUser, 
    isSuperAdmin, 
    hasFeaturePermission,
    openModal,
    setSelectedStudentId,
    setSelectedMentorForEditId,
  } = useCRM();

  const [activeTab, setActiveTab] = useState<'demographics' | 'identity' | 'address' | 'bank'>('demographics');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const target = selectedBiodataUser?.data as (NigerianBiodataKYC & {
    id?: string;
    name?: string;
    email?: string;
    phone?: string;
    role?: string;
    roleTitle?: string;
    studentCode?: string;
    mentorCode?: string;
    program?: string;
    cohort?: string;
    department?: string;
    status?: string;
    isActive?: boolean;
    joinedDate?: string;
    enrolledDate?: string;
  }) | null;

  const category = selectedBiodataUser?.category || 'student';

  const canEditTarget = useMemo(() => {
    if (isSuperAdmin) return true;
    if (category === 'student') return hasFeaturePermission('canModifyStudentBiodata');
    if (category === 'mentor') return hasFeaturePermission('canModifyMentorBiodata');
    return false; // Staff can only be modified by Super Admin
  }, [isSuperAdmin, category, hasFeaturePermission]);

  if (!isOpen || !target) return null;

  const handleCopy = (text: string, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleEdit = () => {
    onClose();
    if (category === 'student' && target.id) {
      setSelectedStudentId(target.id);
      openModal('edit-student');
    } else if (category === 'mentor' && target.id) {
      setSelectedMentorForEditId(target.id);
      openModal('edit-mentor');
    }
  };

  // Determine KYC Tier & Compliance badge
  const kycTier = target.kycTier || (target.residentialAddress && target.accountNumber ? 'Tier 3' : target.idNumber ? 'Tier 2' : 'Tier 1');
  const kycStatus = target.kycStatus || (target.isBankVerified ? 'Verified' : 'Pending Review');

  const categoryBadgeColor = category === 'staff' 
    ? 'bg-blue-500/10 text-blue-700 border-blue-500/20'
    : category === 'mentor'
    ? 'bg-purple-500/10 text-purple-700 border-purple-500/20'
    : 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20';

  const categoryLabel = category === 'staff'
    ? 'Staff & Administration'
    : category === 'mentor'
    ? 'Faculty Mentor'
    : 'Student Scholar';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-inverse-surface/50 backdrop-blur-xs p-margin-page animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="glass-panel relative w-full max-w-3xl rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden bg-surface-container-lowest border border-outline-variant z-10">
        {/* Header Hero Banner */}
        <div className="p-stack-lg bg-surface border-b border-outline-variant">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              {/* Passport Photograph / Avatar */}
              <div className="relative shrink-0">
                <div className="w-16 h-16 rounded-2xl overflow-hidden bg-surface-container border-2 border-outline-variant shadow-xs flex items-center justify-center text-primary font-bold text-xl">
                  {target.avatarUrl ? (
                    <img 
                      src={target.avatarUrl} 
                      alt={target.name || 'Passport Photo'} 
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    <span>{(target.name || 'User').slice(0, 2).toUpperCase()}</span>
                  )}
                </div>
                {target.isBankVerified && (
                  <span 
                    title="NUBAN & Identity Verified" 
                    className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[12px] shadow"
                  >
                    <span className="material-symbols-outlined text-[14px]">check</span>
                  </span>
                )}
              </div>

              {/* Identity Header Details */}
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-headline-md text-xl font-bold text-on-surface">
                    {target.name || 'Unnamed Individual'}
                  </h2>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${categoryBadgeColor}`}>
                    {categoryLabel}
                  </span>
                  <span className="text-[10px] font-data-tabular font-bold px-2 py-0.5 rounded bg-surface-container border border-outline-variant text-secondary">
                    #{target.studentCode || target.mentorCode || target.id?.slice(0, 10)}
                  </span>
                </div>

                <p className="text-xs text-secondary mt-0.5 flex flex-wrap items-center gap-2">
                  <span>{target.roleTitle || target.department || 'Institutional Member'}</span>
                  {target.email && (
                    <>
                      <span>•</span>
                      <span className="font-data-tabular">{target.email}</span>
                    </>
                  )}
                  {target.phone && (
                    <>
                      <span>•</span>
                      <span className="font-data-tabular">{target.phone}</span>
                    </>
                  )}
                </p>

                {/* KYC Tier Status Badges */}
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider border ${
                    kycTier === 'Tier 3' 
                      ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30' 
                      : kycTier === 'Tier 2'
                      ? 'bg-blue-500/10 text-blue-700 border-blue-500/30'
                      : 'bg-amber-500/10 text-amber-700 border-amber-500/30'
                  }`}>
                    ● {kycTier} Nigerian Compliance
                  </span>

                  <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${
                    kycStatus === 'Verified'
                      ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30'
                      : 'bg-amber-500/10 text-amber-700 border-amber-500/30'
                  }`}>
                    {kycStatus === 'Verified' ? '✓ Verified & Cleared' : '○ Pending Review'}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              aria-label="Close"
              className="text-secondary hover:text-primary transition-colors p-1.5 rounded-full hover:bg-surface-container cursor-pointer shrink-0"
            >
              <span className="material-symbols-outlined text-[22px]">close</span>
            </button>
          </div>

          {/* Dossier Tabs */}
          <div className="flex items-center gap-1 mt-6 border-b border-outline-variant -mb-stack-lg pt-1">
            <button
              type="button"
              onClick={() => setActiveTab('demographics')}
              className={`px-3.5 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'demographics'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-secondary hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">person</span>
              <span>1. Civil Demographics</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('identity')}
              className={`px-3.5 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'identity'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-secondary hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">badge</span>
              <span>2. Government ID (CDD)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('address')}
              className={`px-3.5 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'address'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-secondary hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">home_pin</span>
              <span>3. Address &amp; Guarantor</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('bank')}
              className={`px-3.5 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'bank'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-secondary hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">account_balance</span>
              <span>4. Settlement Bank (NUBAN)</span>
            </button>
          </div>
        </div>

        {/* Tab Content Body */}
        <div className="overflow-y-auto p-stack-lg flex-1 space-y-4">
          {/* TAB 1: CIVIL DEMOGRAPHICS */}
          {activeTab === 'demographics' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="p-4 rounded-xl bg-surface border border-outline-variant shadow-xs">
                <h4 className="font-title-sm text-xs font-bold uppercase tracking-wider text-secondary mb-3 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-primary">demography</span>
                  <span>Primary Civil Demographics (Tier 1)</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-secondary text-[11px] block">Full Legal Name</span>
                    <span className="font-bold text-on-surface">{target.name || '—'}</span>
                  </div>

                  <div>
                    <span className="text-secondary text-[11px] block">Date of Birth</span>
                    <span className="font-bold text-on-surface font-data-tabular">
                      {target.dateOfBirth ? new Date(target.dateOfBirth).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Not Provided'}
                    </span>
                  </div>

                  <div>
                    <span className="text-secondary text-[11px] block">Gender</span>
                    <span className="font-bold text-on-surface">{target.gender || 'Not Specified'}</span>
                  </div>

                  <div>
                    <span className="text-secondary text-[11px] block">Nationality</span>
                    <span className="font-bold text-on-surface">{target.nationality || 'Nigerian (NGN)'}</span>
                  </div>

                  <div>
                    <span className="text-secondary text-[11px] block">State of Origin (36 + FCT)</span>
                    <span className="font-bold text-on-surface flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs text-primary">flag</span>
                      {target.stateOfOrigin || 'Lagos State'}
                    </span>
                  </div>

                  <div>
                    <span className="text-secondary text-[11px] block">Local Government Area (LGA)</span>
                    <span className="font-bold text-on-surface">{target.lga || 'Ikeja LGA'}</span>
                  </div>
                </div>
              </div>

              {/* Contact & Professional Summary */}
              <div className="p-4 rounded-xl bg-surface border border-outline-variant shadow-xs">
                <h4 className="font-title-sm text-xs font-bold uppercase tracking-wider text-secondary mb-3 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-primary">contact_phone</span>
                  <span>Official Contact &amp; Background</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs mb-3">
                  <div>
                    <span className="text-secondary text-[11px] block">Phone Number</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="font-bold text-on-surface font-data-tabular">{target.phone || '—'}</span>
                      {target.phone && (
                        <button
                          type="button"
                          onClick={() => handleCopy(target.phone!, 'phone')}
                          className="text-secondary hover:text-primary transition-colors text-[11px] font-semibold flex items-center gap-0.5 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[13px]">content_copy</span>
                          <span>{copiedField === 'phone' ? 'Copied' : 'Copy'}</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <div>
                    <span className="text-secondary text-[11px] block">Official Email</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="font-bold text-on-surface font-data-tabular">{target.email || '—'}</span>
                      {target.email && (
                        <button
                          type="button"
                          onClick={() => handleCopy(target.email!, 'email')}
                          className="text-secondary hover:text-primary transition-colors text-[11px] font-semibold flex items-center gap-0.5 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[13px]">content_copy</span>
                          <span>{copiedField === 'email' ? 'Copied' : 'Copy'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {target.bio && (
                  <div className="pt-3 border-t border-outline-variant/60">
                    <span className="text-secondary text-[11px] block mb-1">Biographical Background</span>
                    <p className="text-xs text-on-surface leading-relaxed bg-surface-container-low/60 p-3 rounded-lg border border-outline-variant/50">
                      {target.bio}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: GOVERNMENT IDENTIFICATION */}
          {activeTab === 'identity' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="p-4 rounded-xl bg-surface border border-outline-variant shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-title-sm text-xs font-bold uppercase tracking-wider text-secondary flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-primary">badge</span>
                    <span>Government Issued Identification (Tier 2 CDD)</span>
                  </h4>
                  <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                    target.isIdVerified 
                      ? 'bg-emerald-500/10 text-emerald-700 border border-emerald-500/20' 
                      : 'bg-amber-500/10 text-amber-700 border border-amber-500/20'
                  }`}>
                    {target.isIdVerified ? '✓ Identity Verified via NIMS/NIBSS' : '○ Verification Pending'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-secondary text-[11px] block">Document ID Type</span>
                    <span className="font-bold text-on-surface text-sm">
                      {target.idType || 'National Identification Number (NIN)'}
                    </span>
                  </div>

                  <div>
                    <span className="text-secondary text-[11px] block">Government ID Number</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="font-bold text-on-surface font-data-tabular text-sm tracking-wider">
                        {target.idNumber || '—'}
                      </span>
                      {target.idNumber && (
                        <button
                          type="button"
                          onClick={() => handleCopy(target.idNumber!, 'idNumber')}
                          className="text-secondary hover:text-primary transition-colors text-[11px] font-semibold flex items-center gap-0.5 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[13px]">content_copy</span>
                          <span>{copiedField === 'idNumber' ? 'Copied' : 'Copy'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Scanned ID Attachment Viewer */}
                <div className="mt-4 pt-4 border-t border-outline-variant/60">
                  <span className="text-secondary text-[11px] block mb-2 font-semibold">
                    Attached Government ID Proof Scanned Document:
                  </span>
                  {target.idDocumentUrl ? (
                    <div className="flex items-center justify-between p-3 rounded-lg bg-surface-container-low border border-outline-variant">
                      <div className="flex items-center gap-2.5 truncate">
                        <span className="material-symbols-outlined text-primary text-[20px]">description</span>
                        <div className="truncate">
                          <span className="font-bold text-xs text-on-surface truncate block">
                            {target.idDocumentName || `${target.idType || 'Government_ID'}_Verification_Document.pdf`}
                          </span>
                          <span className="text-[10px] text-secondary">CBN CDD Compliant Document Upload</span>
                        </div>
                      </div>
                      <a
                        href={target.idDocumentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 rounded-lg bg-primary text-on-primary text-xs font-bold hover:bg-primary-container transition-colors flex items-center gap-1 shrink-0 shadow-xs"
                      >
                        <span className="material-symbols-outlined text-[14px]">visibility</span>
                        <span>View Document</span>
                      </a>
                    </div>
                  ) : (
                    <div className="p-3 rounded-lg bg-surface-container-low text-secondary text-xs flex items-center gap-2 border border-outline-variant/60">
                      <span className="material-symbols-outlined text-[18px]">attachment</span>
                      <span>No digital document scan attached for this record yet.</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: RESIDENTIAL ADDRESS & GUARANTOR */}
          {activeTab === 'address' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Residential Street Address */}
              <div className="p-4 rounded-xl bg-surface border border-outline-variant shadow-xs">
                <h4 className="font-title-sm text-xs font-bold uppercase tracking-wider text-secondary mb-3 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-primary">home</span>
                  <span>Residential Street Address (Tier 3)</span>
                </h4>

                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-secondary text-[11px] block">Full Street Address</span>
                    <span className="font-bold text-on-surface block text-sm">
                      {target.residentialAddress || 'Not Provided'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div>
                      <span className="text-secondary text-[11px] block">City / Town</span>
                      <span className="font-bold text-on-surface">{target.city || 'Victoria Island'}</span>
                    </div>
                    <div>
                      <span className="text-secondary text-[11px] block">State of Residence</span>
                      <span className="font-bold text-on-surface">{target.stateOfResidence || target.stateOfOrigin || 'Lagos State'}</span>
                    </div>
                  </div>
                </div>

                {/* Utility Bill Document */}
                <div className="mt-4 pt-3 border-t border-outline-variant/60">
                  <span className="text-secondary text-[11px] block mb-2 font-semibold">
                    Proof of Residential Address (Utility Bill / Tenancy Receipt):
                  </span>
                  {target.proofOfAddressUrl ? (
                    <div className="flex items-center justify-between p-3 rounded-lg bg-surface-container-low border border-outline-variant">
                      <div className="flex items-center gap-2.5 truncate">
                        <span className="material-symbols-outlined text-primary text-[20px]">receipt</span>
                        <div className="truncate">
                          <span className="font-bold text-xs text-on-surface truncate block">
                            {target.proofOfAddressName || 'Utility_Bill_PHCN_Proof.pdf'}
                          </span>
                          <span className="text-[10px] text-secondary">Verified Physical Residence Proof</span>
                        </div>
                      </div>
                      <a
                        href={target.proofOfAddressUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 rounded-lg bg-primary text-on-primary text-xs font-bold hover:bg-primary-container transition-colors flex items-center gap-1 shrink-0 shadow-xs"
                      >
                        <span className="material-symbols-outlined text-[14px]">visibility</span>
                        <span>View Bill</span>
                      </a>
                    </div>
                  ) : (
                    <div className="p-3 rounded-lg bg-surface-container-low text-secondary text-xs flex items-center gap-2 border border-outline-variant/60">
                      <span className="material-symbols-outlined text-[18px]">receipt_long</span>
                      <span>No scanned utility bill or tenancy receipt uploaded yet.</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Next of Kin / Emergency Guarantor */}
              <div className="p-4 rounded-xl bg-surface border border-outline-variant shadow-xs">
                <h4 className="font-title-sm text-xs font-bold uppercase tracking-wider text-secondary mb-3 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-primary">diversity_1</span>
                  <span>Next of Kin / Emergency Guarantor</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-secondary text-[11px] block">Guarantor Legal Name</span>
                    <span className="font-bold text-on-surface text-sm">
                      {target.nextOfKinName || 'Not Provided'}
                    </span>
                  </div>

                  <div>
                    <span className="text-secondary text-[11px] block">Relationship</span>
                    <span className="font-bold text-on-surface">
                      {target.nextOfKinRelationship || 'Emergency Guarantor'}
                    </span>
                  </div>

                  <div>
                    <span className="text-secondary text-[11px] block">Emergency Phone Number</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="font-bold text-on-surface font-data-tabular">
                        {target.nextOfKinPhone || '—'}
                      </span>
                      {target.nextOfKinPhone && (
                        <button
                          type="button"
                          onClick={() => handleCopy(target.nextOfKinPhone!, 'nokPhone')}
                          className="text-secondary hover:text-primary transition-colors text-[11px] font-semibold flex items-center gap-0.5 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[13px]">content_copy</span>
                          <span>{copiedField === 'nokPhone' ? 'Copied' : 'Copy'}</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <div>
                    <span className="text-secondary text-[11px] block">Residential Address</span>
                    <span className="font-bold text-on-surface">
                      {target.nextOfKinAddress || 'Same as primary residence'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: SETTLEMENT BANK ACCOUNT (NUBAN) */}
          {activeTab === 'bank' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="p-4 rounded-xl bg-surface border border-outline-variant shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-title-sm text-xs font-bold uppercase tracking-wider text-secondary flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-primary">account_balance</span>
                    <span>Nigerian Settlement Account (NUBAN &amp; NIBSS)</span>
                  </h4>
                  <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                    target.isBankVerified 
                      ? 'bg-emerald-500/10 text-emerald-700 border border-emerald-500/20' 
                      : 'bg-amber-500/10 text-amber-700 border border-amber-500/20'
                  }`}>
                    {target.isBankVerified ? '✓ CBN NUBAN Verified' : '○ Verification Pending'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-secondary text-[11px] block">Financial Institution (Bank)</span>
                    <span className="font-bold text-on-surface text-sm">
                      {target.bankName || 'Guaranty Trust Bank (GTBank)'}
                    </span>
                  </div>

                  <div>
                    <span className="text-secondary text-[11px] block">10-Digit NUBAN Account Number</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="font-bold text-on-surface font-data-tabular text-sm tracking-wider">
                        {target.accountNumber || '—'}
                      </span>
                      {target.accountNumber && (
                        <button
                          type="button"
                          onClick={() => handleCopy(target.accountNumber!, 'accountNumber')}
                          className="text-secondary hover:text-primary transition-colors text-[11px] font-semibold flex items-center gap-0.5 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[13px]">content_copy</span>
                          <span>{copiedField === 'accountNumber' ? 'Copied' : 'Copy'}</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <div>
                    <span className="text-secondary text-[11px] block">Verified Account Name</span>
                    <span className="font-bold text-on-surface text-sm">
                      {target.accountName || target.name || '—'}
                    </span>
                  </div>

                  <div>
                    <span className="text-secondary text-[11px] block">Bank Code (CBN Sort Code)</span>
                    <span className="font-bold text-on-surface font-data-tabular">
                      {target.bankCode || '058'}
                    </span>
                  </div>

                  {target.bvn && (
                    <div>
                      <span className="text-secondary text-[11px] block">Bank Verification Number (BVN)</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="font-bold text-on-surface font-data-tabular text-sm">
                          {target.bvn.replace(/(\d{3})\d{5}(\d{3})/, '$1*****$2')}
                        </span>
                        <span className="text-[10px] text-emerald-700 font-bold px-1.5 py-0.2 rounded bg-emerald-100">
                          Encrypted
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-900 flex items-center gap-2">
                  <span className="material-symbols-outlined text-emerald-700 text-[18px]">verified_user</span>
                  <span>
                    Valid NUBAN settlement account verified against Central Bank of Nigeria (CBN) clearing rails for automated Paystack &amp; NIP payouts.
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-stack-md px-stack-lg border-t border-outline-variant bg-surface flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => window.print()}
            className="px-3.5 py-2 rounded-lg bg-surface border border-outline-variant hover:bg-surface-container text-secondary hover:text-on-surface text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            title="Print Official KYC Record Dossier"
          >
            <span className="material-symbols-outlined text-[16px]">print</span>
            <span>Print Dossier</span>
          </button>

          <div className="flex items-center gap-2">
            {canEditTarget && (
              <button
                type="button"
                onClick={handleEdit}
                className="px-4 py-2 rounded-lg bg-secondary-container text-primary text-xs font-bold hover:bg-secondary-container/80 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                title="Modify Biodata & Demographic Details"
              >
                <span className="material-symbols-outlined text-[16px]">edit_note</span>
                <span>Edit Biodata</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-primary text-on-primary text-xs font-bold hover:bg-primary-container transition-colors shadow-xs cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
