import React, { useState } from 'react';
import { useCRM } from '../context/CRMContext';
import { UserRole } from '../types/crm';
import { emailService, EmailTemplatePayload, EmailDispatchLog } from '../services/emailService';
import { apiService } from '../services/api';

export const SettingsPage: React.FC = () => {
  const { 
    settings, 
    updateSettings, 
    resetAllData, 
    staffUsers, 
    addStaffUser, 
    updateUserRole, 
    mentors,
    currentUser,
    exportDatabaseBackup,
    restoreDatabaseBackup,
    flushProductionData,
    sendStaffWelcomeEmail,
    showToast
  } = useCRM();

  const [activeTab, setActiveTab] = useState<'general' | 'staff' | 'emailing' | 'backups'>('general');

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

  // Email test center state
  const [selectedEmailTemplate, setSelectedEmailTemplate] = useState<EmailTemplatePayload['type']>('staff_welcome');
  const [testRecipientEmail, setTestRecipientEmail] = useState('abiolaadefowope@gmail.com');
  const [testRecipientName, setTestRecipientName] = useState('Abiola Adefowope');
  const [emailLogs, setEmailLogs] = useState<EmailDispatchLog[]>([]);
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  // SMTP Settings State
  const [smtpHost, setSmtpHost] = useState(settings.smtp?.host || 'smtp.hostinger.com');
  const [smtpPort, setSmtpPort] = useState(settings.smtp?.port || 465);
  const [smtpUser, setSmtpUser] = useState(settings.smtp?.user || '');
  const [smtpPass, setSmtpPass] = useState(settings.smtp?.pass || '');
  const [smtpFrom, setSmtpFrom] = useState(settings.smtp?.from || `"Nexus Institute" <support@growpot.cloud>`);
  const [smtpSecure, setSmtpSecure] = useState(settings.smtp?.secure ?? true);
  const [smtpTesting, setSmtpTesting] = useState(false);
  const [smtpStatusMessage, setSmtpStatusMessage] = useState<{ text: string; success: boolean } | null>(null);

  // Production Flush Confirmation Modal
  const [showFlushConfirm, setShowFlushConfirm] = useState(false);

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
      smtp: {
        host: smtpHost,
        port: Number(smtpPort),
        user: smtpUser,
        pass: smtpPass,
        from: smtpFrom,
        secure: smtpSecure,
      }
    });

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleVerifySmtp = async () => {
    setSmtpTesting(true);
    setSmtpStatusMessage(null);
    try {
      const res = await apiService.testSmtpConnection({
        host: smtpHost,
        port: Number(smtpPort),
        user: smtpUser,
        pass: smtpPass,
        secure: smtpSecure,
      });

      if (res?.success) {
        setSmtpStatusMessage({
          success: true,
          text: res.message || 'SMTP Handshake Successful! Ready for live email delivery.',
        });
        showToast('SMTP Connected', res.message, 'success');
      } else {
        setSmtpStatusMessage({
          success: false,
          text: res?.message || 'SMTP Connection failed. Please check host, port, and credentials.',
        });
        showToast('SMTP Failed', res?.message || 'Check credentials', 'error');
      }
    } catch (err: any) {
      setSmtpStatusMessage({
        success: false,
        text: `Error connecting to SMTP: ${err.message}`,
      });
      showToast('SMTP Error', err.message, 'error');
    } finally {
      setSmtpTesting(false);
    }
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

    // Automatically send welcome email with password setup link
    emailService.sendEmail({
      to: newStaffEmail,
      recipientName: newStaffName,
      subject: `Welcome to Nexus Institute — Set Your Password (${roleTitleMap[newStaffRole]})`,
      type: 'staff_welcome',
      data: {
        roleTitle: roleTitleMap[newStaffRole],
        department: newStaffDept,
        setupUrl: `http://72.61.106.87/reset-password?email=${encodeURIComponent(newStaffEmail)}&token=welcome-${Date.now()}`
      }
    });

    showToast('Staff Provisioned', `Account created & Welcome Email dispatched to ${newStaffEmail}.`, 'success');

    setNewStaffName('');
    setNewStaffEmail('');
    setShowAddStaffForm(false);
  };

  const templateSubjects: Record<EmailTemplatePayload['type'], string> = {
    staff_welcome: 'Welcome to Nexus Institute — Set Your Password',
    password_reset: 'Security Notice: Password Reset Request',
    payment_reminder: 'Payment Reminder: Outstanding Tuition Balance',
    invoice_receipt: 'Official Tuition Invoice & Receipt #INV-2026-84912',
    session_confirmation: '1-on-1 Mentorship Coaching Session Confirmed',
  };

  const templateData: Record<EmailTemplatePayload['type'], any> = {
    staff_welcome: {
      roleTitle: 'Senior Admissions Specialist',
      department: 'Admissions & Student Success',
      setupUrl: `http://72.61.106.87/reset-password?email=${encodeURIComponent(testRecipientEmail)}&token=demo-token`,
    },
    password_reset: {
      resetUrl: `http://72.61.106.87/reset-password?email=${encodeURIComponent(testRecipientEmail)}&token=reset-token`,
    },
    payment_reminder: {
      studentCode: 'STU-8492',
      program: 'Full-Stack Software Engineering',
      balance: 450000,
      dueDate: '15th October 2026',
      bankName: settings.defaultNIBSSBank.bankName,
      accountNumber: settings.defaultNIBSSBank.accountNumber,
      accountName: settings.defaultNIBSSBank.accountName,
    },
    invoice_receipt: {
      invoiceNumber: 'INV-2026-84912',
      program: 'Full-Stack Software Engineering',
      amount: 850000,
      status: 'Paid',
      paymentRef: 'NIBSS-TRX-9481029',
    },
    session_confirmation: {
      mentorName: 'Dr. Arthur Pendelton',
      studentName: testRecipientName,
      topic: 'Distributed Systems & Database Scaling in FinTech',
      durationHours: 2,
      compensationAmount: 50000,
    }
  };

  const activeEmailPreviewHtml = emailService.generateHtml({
    to: testRecipientEmail,
    recipientName: testRecipientName,
    subject: templateSubjects[selectedEmailTemplate],
    type: selectedEmailTemplate,
    data: templateData[selectedEmailTemplate],
  });

  const handleSendTestEmail = async () => {
    setIsSendingEmail(true);

    try {
      // Send real email via backend API (Nodemailer SMTP)
      const res = await apiService.sendEmail({
        to: testRecipientEmail,
        subject: templateSubjects[selectedEmailTemplate],
        html: activeEmailPreviewHtml,
        smtpConfig: {
          host: smtpHost,
          port: Number(smtpPort),
          user: smtpUser,
          pass: smtpPass,
          from: smtpFrom,
          secure: smtpSecure,
        }
      });

      const log: EmailDispatchLog = {
        id: `mail-${Date.now()}`,
        to: testRecipientEmail,
        recipientName: testRecipientName,
        subject: templateSubjects[selectedEmailTemplate],
        type: selectedEmailTemplate,
        timestamp: new Date().toLocaleTimeString(),
        status: res?.isTestAccount ? 'Delivered (Sandbox)' : 'Delivered (Live SMTP)',
        previewUrl: res?.previewUrl,
      };

      setEmailLogs(prev => [log, ...prev]);

      if (res?.previewUrl) {
        showToast('Sandbox Dispatched', 'View the delivered email in the Sandbox link below.', 'info');
      } else {
        showToast('Email Dispatched', `Delivered to ${testRecipientEmail} via SMTP.`, 'success');
      }
    } catch (err: any) {
      showToast('Dispatch Error', err.message, 'error');
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleBackupFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        await restoreDatabaseBackup(json);
      } catch (err) {
        showToast('Invalid File', 'Could not parse JSON backup file.', 'error');
      }
    };
    reader.readAsText(file);
  };

  const handleExecuteFlush = async () => {
    await flushProductionData();
    setShowFlushConfirm(false);
  };

  return (
    <div className="space-y-stack-lg animate-in fade-in duration-200 max-w-5xl">
      {/* Page Header */}
      <div>
        <h2 className="font-headline-lg text-headline-lg font-bold text-on-surface mb-unit">
          Organization &amp; System Operations
        </h2>
        <p className="font-body-md text-body-md text-secondary">
          Configure corporate profiles, manage staff role security, test transactional emailing with real SMTP, and perform data backups or production flushes.
        </p>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-lg bg-[#dcfce7] border border-[#86efac] text-[#166534] flex items-center gap-2 text-sm font-semibold animate-in fade-in">
          <span className="material-symbols-outlined text-[20px]">check_circle</span>
          <span>Institutional profile and system settings updated successfully!</span>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex border-b border-outline-variant gap-2">
        <button
          onClick={() => setActiveTab('general')}
          className={`pb-3 px-4 font-label-lg text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'general'
              ? 'border-b-2 border-primary text-primary'
              : 'text-secondary hover:text-on-surface'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">domain</span>
          <span>General &amp; Banking</span>
        </button>

        <button
          onClick={() => setActiveTab('staff')}
          className={`pb-3 px-4 font-label-lg text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'staff'
              ? 'border-b-2 border-primary text-primary'
              : 'text-secondary hover:text-on-surface'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">badge</span>
          <span>Staff &amp; Role Security</span>
          <span className="px-1.5 py-0.5 rounded-full bg-surface-container text-secondary text-[11px] font-mono">
            {staffUsers.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('emailing')}
          className={`pb-3 px-4 font-label-lg text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'emailing'
              ? 'border-b-2 border-primary text-primary'
              : 'text-secondary hover:text-on-surface'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">mark_email_read</span>
          <span>Email &amp; SMTP Dispatch Center</span>
        </button>

        <button
          onClick={() => setActiveTab('backups')}
          className={`pb-3 px-4 font-label-lg text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'backups'
              ? 'border-b-2 border-primary text-primary'
              : 'text-secondary hover:text-on-surface'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">cloud_sync</span>
          <span>Backups &amp; Production Data</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: GENERAL & BANKING */}
      {/* ========================================================================= */}
      {activeTab === 'general' && (
        <form onSubmit={handleSaveSettings} className="space-y-stack-md animate-in fade-in duration-200">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-xs space-y-4">
            <h3 className="font-headline-sm text-base font-bold text-on-surface border-b border-outline-variant pb-2">
              Institute Identification &amp; Regulatory Compliance
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-label-md text-xs font-semibold text-on-surface mb-1">Institute Commercial Name</label>
                <input
                  type="text"
                  value={instituteName}
                  onChange={(e) => setInstituteName(e.target.value)}
                  className="w-full h-10 px-3 rounded bg-surface border border-outline-variant text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                />
              </div>

              <div>
                <label className="block font-label-md text-xs font-semibold text-on-surface mb-1">Headquarters Campus Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full h-10 px-3 rounded bg-surface border border-outline-variant text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                />
              </div>

              <div>
                <label className="block font-label-md text-xs font-semibold text-on-surface mb-1">Official Contact Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-10 px-3 rounded bg-surface border border-outline-variant text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                />
              </div>

              <div>
                <label className="block font-label-md text-xs font-semibold text-on-surface mb-1">Telephone Contact</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full h-10 px-3 rounded bg-surface border border-outline-variant text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                />
              </div>

              <div>
                <label className="block font-label-md text-xs font-semibold text-on-surface mb-1">CAC Corporate Registration Number</label>
                <input
                  type="text"
                  value={cacNumber}
                  onChange={(e) => setCacNumber(e.target.value)}
                  className="w-full h-10 px-3 rounded bg-surface border border-outline-variant text-sm font-mono focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                />
              </div>

              <div>
                <label className="block font-label-md text-xs font-semibold text-on-surface mb-1">Tax Identification Number (TIN)</label>
                <input
                  type="text"
                  value={tinNumber}
                  onChange={(e) => setTinNumber(e.target.value)}
                  className="w-full h-10 px-3 rounded bg-surface border border-outline-variant text-sm font-mono focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                />
              </div>
            </div>
          </div>

          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-xs space-y-4">
            <h3 className="font-headline-sm text-base font-bold text-on-surface border-b border-outline-variant pb-2">
              Default Nigerian Settlement Bank (NUBAN / NIBSS)
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block font-label-md text-xs font-semibold text-on-surface mb-1">Settlement Bank</label>
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full h-10 px-3 rounded bg-surface border border-outline-variant text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                />
              </div>

              <div>
                <label className="block font-label-md text-xs font-semibold text-on-surface mb-1">NUBAN Account Number</label>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="w-full h-10 px-3 rounded bg-surface border border-outline-variant text-sm font-mono font-bold text-primary focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                />
              </div>

              <div>
                <label className="block font-label-md text-xs font-semibold text-on-surface mb-1">Account Beneficiary Name</label>
                <input
                  type="text"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  className="w-full h-10 px-3 rounded bg-surface border border-outline-variant text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-outline-variant flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-on-surface">
                <input
                  type="checkbox"
                  checked={emailAlertsEnabled}
                  onChange={(e) => setEmailAlertsEnabled(e.target.checked)}
                  className="rounded border-outline-variant text-primary focus:ring-primary"
                />
                <span>Enable Real-Time Email Notifications &amp; Alerts</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-on-surface">
                <input
                  type="checkbox"
                  checked={autoInvoiceGeneration}
                  onChange={(e) => setAutoInvoiceGeneration(e.target.checked)}
                  className="rounded border-outline-variant text-primary focus:ring-primary"
                />
                <span>Auto-Generate Official Invoices on Lead Conversion</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="h-10 px-6 rounded-lg bg-primary hover:bg-primary/90 text-on-primary font-bold text-sm shadow-sm transition-colors cursor-pointer flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">save</span>
              <span>Save System Settings</span>
            </button>
          </div>
        </form>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: STAFF & ROLE SECURITY */}
      {/* ========================================================================= */}
      {activeTab === 'staff' && (
        <div className="space-y-stack-md animate-in fade-in duration-200">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-xs space-y-4">
            <div className="flex justify-between items-center border-b border-outline-variant pb-3">
              <div>
                <h3 className="font-headline-sm text-base font-bold text-on-surface">Institutional Staff Accounts &amp; Access Control</h3>
                <p className="text-xs text-secondary mt-0.5">Provision team accounts and assign role-based permissions.</p>
              </div>
              <button
                onClick={() => setShowAddStaffForm(!showAddStaffForm)}
                className="h-9 px-4 rounded-lg bg-primary hover:bg-primary/90 text-on-primary text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
              >
                <span className="material-symbols-outlined text-[16px]">{showAddStaffForm ? 'close' : 'person_add'}</span>
                <span>{showAddStaffForm ? 'Cancel' : '+ Provision Staff Account'}</span>
              </button>
            </div>

            {/* Provision Form */}
            {showAddStaffForm && (
              <form onSubmit={handleCreateStaff} className="p-4 rounded-lg bg-surface border border-outline-variant/80 space-y-3 animate-in fade-in duration-200">
                <h4 className="text-xs font-bold text-primary uppercase tracking-wider">New Staff Member Provisioning</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-on-surface mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      value={newStaffName}
                      onChange={(e) => setNewStaffName(e.target.value)}
                      placeholder="e.g. Damilola Adebayo"
                      className="w-full h-9 px-3 rounded bg-surface-container-lowest border border-outline-variant text-xs outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-on-surface mb-1">Institutional Email</label>
                    <input
                      type="email"
                      required
                      value={newStaffEmail}
                      onChange={(e) => setNewStaffEmail(e.target.value)}
                      placeholder="e.g. damilola@nexus-institute.ng"
                      className="w-full h-9 px-3 rounded bg-surface-container-lowest border border-outline-variant text-xs outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-on-surface mb-1">Role Permission</label>
                    <select
                      value={newStaffRole}
                      onChange={(e) => setNewStaffRole(e.target.value as UserRole)}
                      className="w-full h-9 px-3 rounded bg-surface-container-lowest border border-outline-variant text-xs outline-none focus:border-primary"
                    >
                      <option value="super_admin">Super Admin (Full Platform Access)</option>
                      <option value="admissions">Admissions Officer (Leads &amp; Enrolling)</option>
                      <option value="mentor">Faculty Mentor (Coaching &amp; Syllabus)</option>
                      <option value="finance">Chief Financial Officer (Billing &amp; Expenses)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-on-surface mb-1">Department</label>
                    <input
                      type="text"
                      value={newStaffDept}
                      onChange={(e) => setNewStaffDept(e.target.value)}
                      placeholder="e.g. Academic Affairs"
                      className="w-full h-9 px-3 rounded bg-surface-container-lowest border border-outline-variant text-xs outline-none focus:border-primary"
                    />
                  </div>
                  {newStaffRole === 'mentor' && (
                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-on-surface mb-1">Link Faculty Profile</label>
                      <select
                        value={newStaffMentorId}
                        onChange={(e) => setNewStaffMentorId(e.target.value)}
                        className="w-full h-9 px-3 rounded bg-surface-container-lowest border border-outline-variant text-xs outline-none focus:border-primary"
                      >
                        {mentors.map(m => (
                          <option key={m.id} value={m.id}>{m.name} ({m.department})</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="h-8 px-4 rounded bg-primary text-white text-xs font-bold hover:bg-primary/90 transition-colors flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[16px]">send</span>
                    <span>Provision &amp; Send Setup Email</span>
                  </button>
                </div>
              </form>
            )}

            {/* Staff Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-outline-variant/60 bg-surface-container-low text-secondary text-[11px] uppercase tracking-wider font-mono">
                    <th className="p-3">Staff Member</th>
                    <th className="p-3">Email</th>
                    <th className="p-3">Role Permission</th>
                    <th className="p-3">Department</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/40 text-xs">
                  {staffUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-surface-container-low/40 transition-colors">
                      <td className="p-3 font-semibold text-on-surface flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold">
                          {user.name.slice(0, 2).toUpperCase()}
                        </div>
                        <span>{user.name}</span>
                        {currentUser?.id === user.id && (
                          <span className="px-1.5 py-0.2 rounded bg-[#dcfce7] text-[#166534] text-[9px] font-bold">YOU</span>
                        )}
                      </td>
                      <td className="p-3 text-secondary font-mono">{user.email}</td>
                      <td className="p-3">
                        <select
                          value={user.role}
                          onChange={(e) => updateUserRole(user.id, e.target.value as UserRole)}
                          className="px-2 py-1 rounded bg-surface border border-outline-variant text-xs font-semibold outline-none focus:border-primary"
                        >
                          <option value="super_admin">Super Admin</option>
                          <option value="admissions">Admissions</option>
                          <option value="mentor">Faculty Mentor</option>
                          <option value="finance">Finance Officer</option>
                        </select>
                      </td>
                      <td className="p-3 text-secondary">{user.department || 'Executive'}</td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => sendStaffWelcomeEmail(user.id)}
                          className="px-2.5 py-1 rounded bg-secondary-container/40 text-primary hover:bg-secondary-container font-semibold text-[11px] transition-colors inline-flex items-center gap-1 cursor-pointer"
                          title="Resend Password Setup Email"
                        >
                          <span className="material-symbols-outlined text-[14px]">mail</span>
                          <span>Send Password Setup</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: EMAIL & SMTP DISPATCH CENTER */}
      {/* ========================================================================= */}
      {activeTab === 'emailing' && (
        <div className="space-y-stack-md animate-in fade-in duration-200">
          {/* SMTP Server Configuration Box */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-xs space-y-4">
            <div className="flex justify-between items-start border-b border-outline-variant pb-3">
              <div>
                <h3 className="font-headline-sm text-base font-bold text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[20px]">mark_email_read</span>
                  <span>SMTP Outbound Server Configuration</span>
                </h3>
                <p className="text-xs text-secondary mt-0.5">
                  Connect your Hostinger Business Email, Gmail App Password, or Brevo SMTP to deliver real emails to actual recipient inboxes.
                </p>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold font-mono ${
                smtpUser ? 'bg-[#dcfce7] text-[#166534]' : 'bg-[#fef9c3] text-[#854d0e]'
              }`}>
                {smtpUser ? '● Custom SMTP Active' : '○ Ethereal Test Sandbox'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs">
              <div>
                <label className="block font-semibold text-on-surface mb-1">SMTP Host</label>
                <input
                  type="text"
                  value={smtpHost}
                  onChange={(e) => setSmtpHost(e.target.value)}
                  placeholder="e.g. smtp.hostinger.com"
                  className="w-full h-9 px-3 rounded bg-surface border border-outline-variant font-mono outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block font-semibold text-on-surface mb-1">Port</label>
                <input
                  type="number"
                  value={smtpPort}
                  onChange={(e) => setSmtpPort(Number(e.target.value))}
                  placeholder="465 or 587"
                  className="w-full h-9 px-3 rounded bg-surface border border-outline-variant font-mono outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block font-semibold text-on-surface mb-1">SMTP User / Email</label>
                <input
                  type="text"
                  value={smtpUser}
                  onChange={(e) => setSmtpUser(e.target.value)}
                  placeholder="e.g. support@growpot.cloud"
                  className="w-full h-9 px-3 rounded bg-surface border border-outline-variant outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block font-semibold text-on-surface mb-1">SMTP Password</label>
                <input
                  type="password"
                  value={smtpPass}
                  onChange={(e) => setSmtpPass(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full h-9 px-3 rounded bg-surface border border-outline-variant outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block font-semibold text-on-surface mb-1">Sender Name / Email</label>
                <input
                  type="text"
                  value={smtpFrom}
                  onChange={(e) => setSmtpFrom(e.target.value)}
                  placeholder='"Nexus Institute" <noreply@domain.ng>'
                  className="w-full h-9 px-3 rounded bg-surface border border-outline-variant outline-none focus:border-primary"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-outline-variant/60">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-on-surface">
                <input
                  type="checkbox"
                  checked={smtpSecure}
                  onChange={(e) => setSmtpSecure(e.target.checked)}
                  className="rounded border-outline-variant text-primary focus:ring-primary"
                />
                <span>Use SSL / Secure Connection (Port 465)</span>
              </label>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleVerifySmtp}
                  disabled={smtpTesting}
                  className="h-9 px-4 rounded-lg bg-surface hover:bg-surface-container border border-outline-variant text-xs font-bold text-on-surface transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">{smtpTesting ? 'hourglass_top' : 'network_check'}</span>
                  <span>{smtpTesting ? 'Testing Handshake...' : 'Verify SMTP Connection'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveSettings}
                  className="h-9 px-4 rounded-lg bg-primary hover:bg-primary/90 text-on-primary text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                >
                  <span className="material-symbols-outlined text-[16px]">save</span>
                  <span>Save SMTP Credentials</span>
                </button>
              </div>
            </div>

            {smtpStatusMessage && (
              <div className={`p-3 rounded-lg text-xs font-semibold flex items-center gap-2 animate-in fade-in ${
                smtpStatusMessage.success 
                  ? 'bg-[#dcfce7] border border-[#86efac] text-[#166534]' 
                  : 'bg-[#fef2f2] border border-[#fecaca] text-error'
              }`}>
                <span className="material-symbols-outlined text-[18px]">
                  {smtpStatusMessage.success ? 'check_circle' : 'error'}
                </span>
                <span>{smtpStatusMessage.text}</span>
              </div>
            )}
          </div>

          {/* Interactive Template Previewer & Dispatcher */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-xs space-y-6">
            <div className="border-b border-outline-variant pb-3">
              <h3 className="font-headline-sm text-base font-bold text-on-surface">
                Interactive Email Template Dispatcher
              </h3>
              <p className="text-xs text-secondary mt-0.5">
                Send real transactional notices (invitations, tuition reminders, invoices, session bookings).
              </p>
            </div>

            {/* Template Selector & Dispatch Form */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="space-y-3">
                <label className="block text-xs font-bold text-on-surface uppercase tracking-wider">
                  Select Email Template
                </label>
                
                <div className="space-y-1.5">
                  {[
                    { type: 'staff_welcome', label: '1. Staff Welcome & Password Setup', icon: 'badge' },
                    { type: 'payment_reminder', label: '2. Nigerian Payment Reminder (NUBAN)', icon: 'payments' },
                    { type: 'invoice_receipt', label: '3. Official Tuition Invoice & Receipt', icon: 'receipt_long' },
                    { type: 'session_confirmation', label: '4. Mentorship Session Confirmation', icon: 'school' },
                    { type: 'password_reset', label: '5. Password Reset Request', icon: 'lock_reset' },
                  ].map((t) => (
                    <button
                      key={t.type}
                      type="button"
                      onClick={() => setSelectedEmailTemplate(t.type as EmailTemplatePayload['type'])}
                      className={`w-full p-2.5 rounded-lg border text-left text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                        selectedEmailTemplate === t.type
                          ? 'border-primary bg-primary text-white shadow-xs'
                          : 'border-outline-variant bg-surface hover:bg-surface-container text-on-surface'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[18px]">{t.icon}</span>
                      <span>{t.label}</span>
                    </button>
                  ))}
                </div>

                <div className="pt-4 border-t border-outline-variant space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-on-surface mb-1">Target Recipient Email</label>
                    <input
                      type="email"
                      value={testRecipientEmail}
                      onChange={(e) => setTestRecipientEmail(e.target.value)}
                      className="w-full h-9 px-3 rounded bg-surface border border-outline-variant text-xs outline-none focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-on-surface mb-1">Recipient Name</label>
                    <input
                      type="text"
                      value={testRecipientName}
                      onChange={(e) => setTestRecipientName(e.target.value)}
                      className="w-full h-9 px-3 rounded bg-surface border border-outline-variant text-xs outline-none focus:border-primary"
                    />
                  </div>

                  <button
                    onClick={handleSendTestEmail}
                    disabled={isSendingEmail}
                    className="w-full h-10 rounded-lg bg-primary hover:bg-primary/90 text-on-primary font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-[18px]">send</span>
                    <span>{isSendingEmail ? 'Dispatching Real Email...' : 'Dispatch Live Email'}</span>
                  </button>
                </div>
              </div>

              {/* Live HTML Email Preview Pane */}
              <div className="lg:col-span-2 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-secondary uppercase tracking-wider">
                    Live HTML Render Preview
                  </span>
                  <span className="text-[11px] font-mono text-secondary">
                    Nexus Transactional Engine
                  </span>
                </div>

                <div className="border border-outline-variant rounded-xl overflow-hidden shadow-inner bg-[#f1f5f9] h-[480px]">
                  <iframe
                    title="Email Preview"
                    srcDoc={activeEmailPreviewHtml}
                    className="w-full h-full border-none"
                  />
                </div>
              </div>
            </div>

            {/* Email Dispatch Audit Log */}
            {emailLogs.length > 0 && (
              <div className="pt-4 border-t border-outline-variant space-y-2">
                <h4 className="text-xs font-bold text-on-surface uppercase tracking-wider">
                  Real-Time Email Dispatch Stream
                </h4>
                <div className="max-h-48 overflow-y-auto divide-y divide-outline-variant/50 border border-outline-variant rounded-lg bg-surface">
                  {emailLogs.map((log) => (
                    <div key={log.id} className="p-3 flex justify-between items-center text-xs">
                      <div className="space-y-0.5">
                        <div className="font-semibold text-on-surface flex items-center gap-2">
                          <span>{log.subject}</span>
                          <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                            log.status.includes('Live') ? 'bg-[#dcfce7] text-[#166534]' : 'bg-[#fef9c3] text-[#854d0e]'
                          }`}>
                            {log.status}
                          </span>
                        </div>
                        <p className="text-secondary text-[11px]">To: {log.recipientName} ({log.to})</p>
                      </div>

                      <div className="flex items-center gap-2">
                        {log.previewUrl && (
                          <a
                            href={log.previewUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1 rounded bg-primary/10 text-primary hover:bg-primary/20 font-semibold text-[11px] inline-flex items-center gap-1 transition-colors"
                          >
                            <span className="material-symbols-outlined text-[13px]">open_in_new</span>
                            <span>View Delivered Email Online</span>
                          </a>
                        )}
                        <span className="font-mono text-[10px] text-secondary">{log.timestamp}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: BACKUPS, RESTORE & PRODUCTION DATA FLUSH */}
      {/* ========================================================================= */}
      {activeTab === 'backups' && (
        <div className="space-y-stack-md animate-in fade-in duration-200">
          {/* Export & Import Snapshots */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-xs space-y-6">
            <div className="border-b border-outline-variant pb-3">
              <h3 className="font-headline-sm text-base font-bold text-on-surface">
                Institutional Data Backup &amp; Disaster Recovery
              </h3>
              <p className="text-xs text-secondary mt-0.5">
                Download timestamped snapshots of all student records, financial ledgers, and configurations.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 1-Click Backup Export */}
              <div className="p-5 rounded-xl bg-surface border border-outline-variant flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    <span className="material-symbols-outlined text-[24px]">download_for_offline</span>
                  </div>
                  <h4 className="font-headline-sm text-sm font-bold text-on-surface">Export Complete Database Snapshot</h4>
                  <p className="text-xs text-secondary leading-relaxed">
                    Download an unencrypted JSON backup containing all students, invoices, leads, expenses, curricula, and staff accounts.
                  </p>
                </div>

                <button
                  onClick={exportDatabaseBackup}
                  className="h-10 px-4 rounded-lg bg-primary hover:bg-primary/90 text-on-primary font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">download</span>
                  <span>Download Full Backup (.json)</span>
                </button>
              </div>

              {/* Restore from File */}
              <div className="p-5 rounded-xl bg-surface border border-outline-variant flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="w-10 h-10 rounded-lg bg-[#ca8a04]/10 text-[#ca8a04] flex items-center justify-center">
                    <span className="material-symbols-outlined text-[24px]">settings_backup_restore</span>
                  </div>
                  <h4 className="font-headline-sm text-sm font-bold text-on-surface">Restore System from Backup</h4>
                  <p className="text-xs text-secondary leading-relaxed">
                    Upload a previously exported `.json` snapshot to revert the entire CRM database state.
                  </p>
                </div>

                <label className="h-10 px-4 rounded-lg bg-surface-container hover:bg-surface-container-high border border-outline-variant text-on-surface font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer">
                  <span className="material-symbols-outlined text-[18px]">upload_file</span>
                  <span>Select Backup File to Restore</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleBackupFileImport}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Production Launch & Data Flush */}
          <div className="bg-[#fef2f2] border border-[#fecaca] rounded-xl p-6 shadow-xs space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-error text-white flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[24px]">delete_sweep</span>
              </div>
              <div className="space-y-1">
                <h3 className="font-headline-sm text-base font-bold text-error">
                  Production Slate Initialization (Flush Demo Data)
                </h3>
                <p className="text-xs text-[#7f1d1d] leading-relaxed">
                  When you are ready for official commercial launch on your Hostinger production server, this operation purges all dummy/mock leads, test student enrollments, sample invoices, and mock expenses.
                </p>
                <p className="text-xs text-[#7f1d1d] font-semibold">
                  ✓ Your Super Admin login, CAC registration, and Access Bank settlement details will be safely preserved.
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-[#fca5a5]/40">
              <button
                onClick={() => setShowFlushConfirm(true)}
                className="h-10 px-5 rounded-lg bg-error hover:bg-error/90 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">cleaning_services</span>
                <span>Flush Demo Data for Production</span>
              </button>
            </div>
          </div>

          {/* Seed Data Reset */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-xs flex justify-between items-center">
            <div>
              <h4 className="text-sm font-bold text-on-surface">Restore Demo Seed Data</h4>
              <p className="text-xs text-secondary">Reset all modules back to initial Nigerian sample datasets.</p>
            </div>
            <button
              onClick={resetAllData}
              className="h-9 px-4 rounded-lg bg-surface hover:bg-error-container/20 text-error font-semibold text-xs border border-error/30 transition-colors"
            >
              Reset Seed Data
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PRODUCTION FLUSH CONFIRMATION MODAL */}
      {/* ========================================================================= */}
      {showFlushConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-inverse-surface/40 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-error/10 text-error flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-[32px]">warning</span>
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-headline-md text-base font-bold text-on-surface">Confirm Production Data Flush</h3>
              <p className="text-xs text-secondary leading-relaxed">
                Are you sure you want to purge all mock leads, test students, and dummy expenses? This will leave your CRM in a clean state ready for live student intake.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-surface border border-outline-variant text-[11px] text-secondary space-y-1 font-mono">
              <p>• Leads: Wiped to 0</p>
              <p>• Students &amp; Invoices: Wiped to 0</p>
              <p>• Expenses: Wiped to 0</p>
              <p className="text-[#166534] font-bold">✓ Preserved: Super Admin &amp; Banking Profile</p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowFlushConfirm(false)}
                className="flex-1 h-10 rounded-lg bg-surface hover:bg-surface-container border border-outline-variant font-bold text-xs text-on-surface transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteFlush}
                className="flex-1 h-10 rounded-lg bg-error hover:bg-error/90 font-bold text-xs text-white shadow-md transition-colors"
              >
                Yes, Flush Demo Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
