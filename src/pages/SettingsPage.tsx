import React, { useState } from 'react';
import { useCRM } from '../context/CRMContext';
import { UserRole } from '../types/crm';

export const SettingsPage: React.FC = () => {
  const { 
    settings, 
    updateSettings, 
    resetAllData, 
    staffUsers, 
    addStaffUser, 
    updateUserRole, 
    mentors,
    currentUser 
  } = useCRM();

  const [activeTab, setActiveTab] = useState<'general' | 'staff'>('general');

  // Form states for institutional profile
  const [instituteName, setInstituteName] = useState(settings.instituteName);
  const [address, setAddress] = useState(settings.address);
  const [email, setEmail] = useState(settings.email);
  const [phone, setPhone] = useState(settings.phone);
  const [tinNumber, setTinNumber] = useState(settings.tinNumber);
  const [cacNumber, setCacNumber] = useState(settings.cacNumber);
  const [bankName, setBankName] = useState(settings.defaultNIBSSBank.bankName);
  const [accountNumber, setAccountNumber] = useState(settings.defaultNIBSSBank.accountNumber);
  const [accountName, setAccountName] = useState(settings.defaultNIBSSBank.accountName);
  const [emailAlertsEnabled, setEmailAlertsEnabled] = useState(settings.emailAlertsEnabled);
  const [autoInvoiceGeneration, setAutoInvoiceGeneration] = useState(settings.autoInvoiceGeneration);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Form states for creating new staff member
  const [showAddStaffForm, setShowAddStaffForm] = useState(false);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffRole, setNewStaffRole] = useState<UserRole>('admissions');
  const [newStaffDept, setNewStaffDept] = useState('Admissions');
  const [newStaffMentorId, setNewStaffMentorId] = useState('');

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      instituteName,
      address,
      email,
      phone,
      tinNumber,
      cacNumber,
      defaultNIBSSBank: {
        bankName,
        accountNumber,
        accountName,
      },
      emailAlertsEnabled,
      autoInvoiceGeneration,
    });

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleCreateStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffName || !newStaffEmail) return;

    const roleTitleMap: Record<UserRole, string> = {
      super_admin: 'Managing Director & Super Admin',
      admissions: 'Admissions Officer',
      mentor: 'Faculty Mentor',
      finance: 'Chief Financial Officer / Controller',
    };

    addStaffUser({
      name: newStaffName,
      email: newStaffEmail,
      role: newStaffRole,
      roleTitle: roleTitleMap[newStaffRole],
      department: newStaffDept,
      mentorId: newStaffRole === 'mentor' ? (newStaffMentorId || mentors[0]?.id || 'men-1') : undefined,
    });

    setNewStaffName('');
    setNewStaffEmail('');
    setShowAddStaffForm(false);
  };

  return (
    <div className="space-y-stack-lg animate-in fade-in duration-200 max-w-4xl">
      {/* Page Header */}
      <div>
        <h2 className="font-headline-lg text-headline-lg font-bold text-on-surface mb-unit">Organization &amp; System Settings</h2>
        <p className="font-body-md text-body-md text-secondary">Manage institution profile, Nigerian corporate registrations, banking settlement, and staff role permissions.</p>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-lg bg-[#dcfce7] border border-[#86efac] text-[#166534] flex items-center gap-2 text-sm font-semibold animate-in fade-in">
          <span className="material-symbols-outlined text-[20px]">check_circle</span>
          <span>Institutional profile and system settings updated successfully!</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-outline-variant gap-4">
        <button
          onClick={() => setActiveTab('general')}
          className={`pb-3 font-label-md text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'general'
              ? 'border-primary text-primary'
              : 'border-transparent text-secondary hover:text-on-surface'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">account_balance</span>
          <span>Institution &amp; Banking Profile</span>
        </button>
        <button
          onClick={() => setActiveTab('staff')}
          className={`pb-3 font-label-md text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'staff'
              ? 'border-primary text-primary'
              : 'border-transparent text-secondary hover:text-on-surface'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">admin_panel_settings</span>
          <span>Staff Accounts &amp; Role Assignment ({staffUsers.length})</span>
        </button>
      </div>

      {/* TAB 1: General & Banking Settings */}
      {activeTab === 'general' && (
        <form onSubmit={handleSaveSettings} className="space-y-6">
          {/* Section 1: Institutional Profile */}
          <section className="bg-surface-container-lowest border border-outline-variant rounded-lg p-stack-md space-y-4 shadow-xs">
            <div className="flex items-center gap-2 border-b border-outline-variant pb-3">
              <span className="material-symbols-outlined text-primary text-[20px]">domain</span>
              <h3 className="font-headline-md text-base font-bold text-on-surface">Institutional Profile</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1 sm:col-span-2">
                <label className="font-semibold text-secondary">Institute / Business Name</label>
                <input
                  type="text"
                  required
                  value={instituteName}
                  onChange={e => setInstituteName(e.target.value)}
                  className="w-full h-10 px-3 bg-surface border border-outline-variant rounded font-body-md text-sm text-on-surface focus:border-primary outline-none"
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="font-semibold text-secondary">Headquarters Campus Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  className="w-full h-10 px-3 bg-surface border border-outline-variant rounded font-body-md text-sm text-on-surface focus:border-primary outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-secondary">Official Operations Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full h-10 px-3 bg-surface border border-outline-variant rounded font-body-md text-sm text-on-surface focus:border-primary outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-secondary">Telephone Contact</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full h-10 px-3 bg-surface border border-outline-variant rounded font-body-md text-sm text-on-surface focus:border-primary outline-none"
                />
              </div>
            </div>
          </section>

          {/* Section 2: Nigerian Corporate & Tax Registration */}
          <section className="bg-surface-container-lowest border border-outline-variant rounded-lg p-stack-md space-y-4 shadow-xs">
            <div className="flex items-center gap-2 border-b border-outline-variant pb-3">
              <span className="material-symbols-outlined text-primary text-[20px]">verified_user</span>
              <h3 className="font-headline-md text-base font-bold text-on-surface">Nigerian Corporate &amp; Tax Compliance</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-secondary">CAC Registration Number (RC)</label>
                <input
                  type="text"
                  value={cacNumber}
                  onChange={e => setCacNumber(e.target.value)}
                  className="w-full h-10 px-3 bg-surface border border-outline-variant rounded font-mono text-sm text-on-surface focus:border-primary outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-secondary">Tax Identification Number (TIN)</label>
                <input
                  type="text"
                  value={tinNumber}
                  onChange={e => setTinNumber(e.target.value)}
                  className="w-full h-10 px-3 bg-surface border border-outline-variant rounded font-mono text-sm text-on-surface focus:border-primary outline-none"
                />
              </div>
            </div>
          </section>

          {/* Section 3: Default NIBSS Settlement Bank Account */}
          <section className="bg-surface-container-lowest border border-outline-variant rounded-lg p-stack-md space-y-4 shadow-xs">
            <div className="flex items-center gap-2 border-b border-outline-variant pb-3">
              <span className="material-symbols-outlined text-primary text-[20px]">account_balance</span>
              <h3 className="font-headline-md text-base font-bold text-on-surface">Default Nigerian Settlement Account (NUBAN)</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-secondary">Bank Institution</label>
                <select
                  value={bankName}
                  onChange={e => setBankName(e.target.value)}
                  className="w-full h-10 px-3 bg-surface border border-outline-variant rounded font-body-md text-sm text-on-surface focus:border-primary outline-none cursor-pointer"
                >
                  <option value="Access Bank Nigeria PLC">Access Bank Nigeria PLC</option>
                  <option value="Guaranty Trust Bank (GTBank)">Guaranty Trust Bank (GTBank)</option>
                  <option value="Zenith Bank PLC">Zenith Bank PLC</option>
                  <option value="First Bank of Nigeria">First Bank of Nigeria</option>
                  <option value="United Bank for Africa (UBA)">United Bank for Africa (UBA)</option>
                  <option value="Stanbic IBTC Bank">Stanbic IBTC Bank</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-secondary">NUBAN Account Number</label>
                <input
                  type="text"
                  maxLength={10}
                  value={accountNumber}
                  onChange={e => setAccountNumber(e.target.value)}
                  className="w-full h-10 px-3 bg-surface border border-outline-variant rounded font-mono text-sm text-on-surface focus:border-primary outline-none"
                />
              </div>

              <div className="space-y-1 sm:col-span-1">
                <label className="font-semibold text-secondary">Account Beneficiary Name</label>
                <input
                  type="text"
                  value={accountName}
                  onChange={e => setAccountName(e.target.value)}
                  className="w-full h-10 px-3 bg-surface border border-outline-variant rounded font-body-md text-sm text-on-surface focus:border-primary outline-none"
                />
              </div>
            </div>
          </section>

          {/* Section 4: System Preferences & Notifications */}
          <section className="bg-surface-container-lowest border border-outline-variant rounded-lg p-stack-md space-y-4 shadow-xs">
            <div className="flex items-center gap-2 border-b border-outline-variant pb-3">
              <span className="material-symbols-outlined text-primary text-[20px]">tune</span>
              <h3 className="font-headline-md text-base font-bold text-on-surface">Automation Preferences</h3>
            </div>

            <div className="space-y-3">
              <label className="flex items-center justify-between p-3 rounded bg-surface border border-outline-variant cursor-pointer">
                <div>
                  <p className="text-xs font-bold text-on-surface">Automatic Tuition Invoice Generation</p>
                  <p className="text-[11px] text-secondary">Generate official PDF invoices with NIBSS references immediately upon lead conversion.</p>
                </div>
                <input
                  type="checkbox"
                  checked={autoInvoiceGeneration}
                  onChange={e => setAutoInvoiceGeneration(e.target.checked)}
                  className="w-4 h-4 rounded text-primary focus:ring-primary cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded bg-surface border border-outline-variant cursor-pointer">
                <div>
                  <p className="text-xs font-bold text-on-surface">Real-Time Email &amp; Activity Notifications</p>
                  <p className="text-[11px] text-secondary">Notify operations when high-value leads are captured or mentor honorariums are disbursed.</p>
                </div>
                <input
                  type="checkbox"
                  checked={emailAlertsEnabled}
                  onChange={e => setEmailAlertsEnabled(e.target.checked)}
                  className="w-4 h-4 rounded text-primary focus:ring-primary cursor-pointer"
                />
              </label>
            </div>
          </section>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="submit"
              className="px-6 h-10 rounded bg-primary text-on-primary font-label-md text-xs font-bold hover:bg-primary-container transition-colors shadow-xs flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[16px]">save</span>
              <span>Save Settings</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 2: Staff Accounts & Role Assignment (Super Admin) */}
      {activeTab === 'staff' && (
        <div className="space-y-6">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-stack-md shadow-xs space-y-4">
            <div className="flex justify-between items-center border-b border-outline-variant pb-3 flex-wrap gap-2">
              <div>
                <h3 className="font-headline-md text-base font-bold text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[20px]">badge</span>
                  <span>Institutional Staff &amp; Role Permissions</span>
                </h3>
                <p className="text-xs text-secondary">Super Admin Rights: Assign, elevate, or modify access levels across institutional staff.</p>
              </div>

              <button
                onClick={() => setShowAddStaffForm(prev => !prev)}
                className="h-9 px-3 bg-primary text-on-primary rounded font-label-md text-xs font-bold hover:bg-primary-container transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <span className="material-symbols-outlined text-[16px]">person_add</span>
                <span>{showAddStaffForm ? 'Cancel' : '+ Provision Staff Account'}</span>
              </button>
            </div>

            {/* Expandable Add Staff Form */}
            {showAddStaffForm && (
              <form onSubmit={handleCreateStaff} className="p-4 rounded-lg bg-surface border border-primary/30 space-y-3 animate-in fade-in">
                <h4 className="text-xs font-bold text-primary uppercase tracking-wider">New Staff Member Provisioning</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="space-y-1">
                    <label className="font-semibold text-secondary">Full Name <span className="text-error">*</span></label>
                    <input
                      type="text"
                      required
                      value={newStaffName}
                      onChange={e => setNewStaffName(e.target.value)}
                      placeholder="e.g. Chinelo Okonkwo"
                      className="w-full h-9 px-3 bg-surface-container-lowest border border-outline-variant rounded text-xs text-on-surface focus:border-primary outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-secondary">Email Address <span className="text-error">*</span></label>
                    <input
                      type="email"
                      required
                      value={newStaffEmail}
                      onChange={e => setNewStaffEmail(e.target.value)}
                      placeholder="c.okonkwo@nexus-institute.ng"
                      className="w-full h-9 px-3 bg-surface-container-lowest border border-outline-variant rounded text-xs text-on-surface focus:border-primary outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-secondary">Assigned Role</label>
                    <select
                      value={newStaffRole}
                      onChange={e => {
                        const r = e.target.value as UserRole;
                        setNewStaffRole(r);
                        if (r === 'super_admin') setNewStaffDept('Executive Management');
                        else if (r === 'admissions') setNewStaffDept('Admissions & Growth');
                        else if (r === 'mentor') setNewStaffDept('Faculty');
                        else if (r === 'finance') setNewStaffDept('Finance & Accounts');
                      }}
                      className="w-full h-9 px-3 bg-surface-container-lowest border border-outline-variant rounded text-xs text-on-surface focus:border-primary outline-none cursor-pointer"
                    >
                      <option value="super_admin">Super Admin / Managing Director</option>
                      <option value="admissions">Admissions Officer</option>
                      <option value="mentor">Faculty Mentor (Instructor)</option>
                      <option value="finance">Finance Officer / Accountant</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-secondary">Department</label>
                    <input
                      type="text"
                      value={newStaffDept}
                      onChange={e => setNewStaffDept(e.target.value)}
                      className="w-full h-9 px-3 bg-surface-container-lowest border border-outline-variant rounded text-xs text-on-surface focus:border-primary outline-none"
                    />
                  </div>

                  {newStaffRole === 'mentor' && (
                    <div className="space-y-1 sm:col-span-2">
                      <label className="font-semibold text-secondary">Link to Faculty Profile</label>
                      <select
                        value={newStaffMentorId}
                        onChange={e => setNewStaffMentorId(e.target.value)}
                        className="w-full h-9 px-3 bg-surface-container-lowest border border-outline-variant rounded text-xs text-on-surface focus:border-primary outline-none cursor-pointer"
                      >
                        {mentors.map(m => (
                          <option key={m.id} value={m.id}>
                            {m.name} ({m.department})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="submit"
                    className="px-4 h-9 bg-primary text-on-primary rounded font-label-md text-xs font-bold hover:bg-primary-container transition-colors shadow-xs"
                  >
                    Save &amp; Assign Role
                  </button>
                </div>
              </form>
            )}

            {/* Staff Directory Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[650px] text-xs">
                <thead>
                  <tr className="border-b border-outline-variant bg-surface-container-low text-secondary font-label-md">
                    <th className="px-3 py-2.5 font-semibold">Staff Member</th>
                    <th className="px-3 py-2.5 font-semibold">Department</th>
                    <th className="px-3 py-2.5 font-semibold">Active Role</th>
                    <th className="px-3 py-2.5 font-semibold text-right">Role Assignment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/60">
                  {staffUsers.map(user => (
                    <tr key={user.id} className="hover:bg-surface-container-low/40 transition-colors">
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-secondary-container text-primary flex items-center justify-center font-bold text-[10px]">
                            {user.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-on-surface">{user.name}</p>
                            <p className="text-[11px] text-secondary font-mono">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-secondary font-medium">
                        {user.department || 'General'}
                      </td>
                      <td className="px-3 py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          user.role === 'super_admin' ? 'bg-primary-container text-on-primary-container' :
                          user.role === 'admissions' ? 'bg-amber-100 text-amber-800' :
                          user.role === 'mentor' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {user.roleTitle}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right">
                        <select
                          value={user.role}
                          onChange={e => updateUserRole(user.id, e.target.value as UserRole)}
                          className="h-8 px-2 rounded border border-outline-variant bg-surface text-xs font-semibold text-primary outline-none cursor-pointer hover:border-primary"
                        >
                          <option value="super_admin">Super Admin</option>
                          <option value="admissions">Admissions</option>
                          <option value="mentor">Faculty Mentor</option>
                          <option value="finance">Finance / Accounts</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Danger Zone: Seed Reset */}
      {currentUser?.role === 'super_admin' && (
        <div className="p-stack-md border border-error-container bg-error-container/10 rounded-lg space-y-2 mt-8">
          <h4 className="font-label-md text-xs font-bold text-error uppercase tracking-wider">Danger Zone</h4>
          <p className="text-xs text-secondary">
            Resetting all records will erase changes in local storage and restore default Nigerian demo dataset.
          </p>
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Are you sure you want to reset all CRM database records to Nigerian seed data?')) {
                resetAllData();
                alert('All records reset successfully!');
              }
            }}
            className="px-4 h-9 rounded bg-error text-on-error font-label-md text-xs font-bold hover:bg-error/90 transition-colors shadow-xs"
          >
            Reset All CRM Data
          </button>
        </div>
      )}
    </div>
  );
};
