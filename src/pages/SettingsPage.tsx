import React, { useState, useRef } from 'react';
import { useCRM } from '../context/CRMContext';
import { UserRole, EnabledModules, CampusLocation } from '../types/crm';
import { emailService, EmailTemplatePayload, EmailDispatchLog } from '../services/emailService';
import { apiService } from '../services/api';
import { NIGERIAN_BANKS } from '../data/nigerianBanks';
import { BrandLogo } from '../components/common/BrandLogo';
import { initialCampuses } from '../data/mockData';
import { getDeviceCoordinates } from '../utils/geo';
import { usePWA } from '../context/PWAContext';

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
    openModal,
    showToast
  } = useCRM();

  const {
    isStandalone,
    isInstallable,
    isIOS,
    isAndroid,
    isOnline,
    promptInstall,
    setShowIOSInstallGuide,
    clearCacheAndReload,
  } = usePWA();

  const [activeTab, setActiveTab] = useState<'general' | 'modules' | 'staff' | 'emailing' | 'backups'>('general');

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
  const [paystackPublicKey, setPaystackPublicKey] = useState(settings.paystackPublicKey || 'pk_test_cd572a18dd78ed5493d15433b0e1f3c2057fce2a');
  const [paystackSecretKey, setPaystackSecretKey] = useState(settings.paystackSecretKey || 'sk_test_5a3331f29eadb22de95a766cdd1dc432e186ab7f');
  const [paystackLiveMode, setPaystackLiveMode] = useState(settings.paystackLiveMode || false);
  const [showPaystackSecret, setShowPaystackSecret] = useState(false);
  const [testingPaystack, setTestingPaystack] = useState(false);
  const [paystackTestResult, setPaystackTestResult] = useState<{ success: boolean; message: string; banksCount?: number; isLive?: boolean } | null>(null);

  // Academic Gatekeeping & Multi-Campus Geofencing State
  const [defaultMinimumLearningHours, setDefaultMinimumLearningHours] = useState<number>(
    settings.defaultMinimumLearningHours || 40
  );
  const [campusLocationsList, setCampusLocationsList] = useState<CampusLocation[]>(
    settings.campusLocationsList && settings.campusLocationsList.length > 0
      ? settings.campusLocationsList
      : initialCampuses
  );
  const [capturingGpsForCampus, setCapturingGpsForCampus] = useState<string | null>(null);

  // Module enablement feature flags
  const [enabledModules, setEnabledModules] = useState<EnabledModules>(
    settings.enabledModules || {
      lms: true,
      leads: true,
      courses: true,
      students: true,
      mentors: true,
      attendance: true,
      expenses: true,
    }
  );

  const [logoUrl, setLogoUrl] = useState(settings.logoUrl || '');
  const logoFileInputRef = useRef<HTMLInputElement>(null);

  const handleLogoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      showToast('File Too Large', 'Please select an image file under 2MB.', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setLogoUrl(dataUrl);
        showToast('Logo Selected', 'Brand logo preview updated. Click "Save Configuration Changes" to persist.', 'success');
      }
    };
    reader.readAsDataURL(file);
  };

  const [emailAlertsEnabled, setEmailAlertsEnabled] = useState(settings.emailAlertsEnabled);
  const [autoInvoiceGeneration, setAutoInvoiceGeneration] = useState(settings.autoInvoiceGeneration);
  const [showBudgetToStaff, setShowBudgetToStaff] = useState(settings.showBudgetToStaff !== false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Form states for creating new staff member
  const [showAddStaffForm, setShowAddStaffForm] = useState(false);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffPassword, setNewStaffPassword] = useState('');
  const [newStaffRole, setNewStaffRole] = useState<UserRole>('admissions');
  const [newStaffDept, setNewStaffDept] = useState('Admissions');
  const [newStaffMentorId, setNewStaffMentorId] = useState('');

  // SMTP Settings State - configured for Zoho Mail
  const [smtpHost, setSmtpHost] = useState(settings.smtp?.host === 'smtppro.zoho.com' || settings.smtp?.host === 'smtp.hostinger.com' ? 'smtp.zoho.com' : (settings.smtp?.host || 'smtp.zoho.com'));
  const [smtpPort, setSmtpPort] = useState(settings.smtp?.port || 465);
  const [smtpUser, setSmtpUser] = useState(settings.smtp?.user || 'admin@codelab.institute');
  const [smtpPass, setSmtpPass] = useState(settings.smtp?.pass || '9)8JAr$m');
  const [smtpFrom, setSmtpFrom] = useState(settings.smtp?.from || `"CODELAB EDUCARE LTD" <admin@codelab.institute>`);
  const [smtpSecure, setSmtpSecure] = useState(settings.smtp?.secure ?? true);
  const [smtpTesting, setSmtpTesting] = useState(false);
  const [smtpStatusMessage, setSmtpStatusMessage] = useState<{ text: string; success: boolean } | null>(null);

  // Email test center state & Customizable Template Values
  const [selectedEmailTemplate, setSelectedEmailTemplate] = useState<EmailTemplatePayload['type']>('student_welcome');
  const [testRecipientEmail, setTestRecipientEmail] = useState('abiolaadefowope@gmail.com');
  const [testRecipientName, setTestRecipientName] = useState('Abiola Adefowope');
  const [emailSubject, setEmailSubject] = useState('🎓 Welcome to CODELAB EDUCARE LTD — Admission Confirmation');
  const [emailLogs, setEmailLogs] = useState<EmailDispatchLog[]>([]);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [saveTemplateSuccess, setSaveTemplateSuccess] = useState(false);

  // 1. Staff Welcome Editable Fields
  const [welcomeRoleTitle, setWelcomeRoleTitle] = useState('Senior Admissions Specialist');
  const [welcomeDept, setWelcomeDept] = useState('Admissions & Student Success');
  const [welcomeSetupUrl, setWelcomeSetupUrl] = useState('http://72.61.106.87/reset-password');
  const [welcomeNote, setWelcomeNote] = useState('Your institutional staff account has been provisioned on the Nexus CRM Portal.');

  // 2. Payment Reminder Editable Fields
  const [reminderStudentCode, setReminderStudentCode] = useState('STU-8492');
  const [reminderProgram, setReminderProgram] = useState('Full-Stack Software Engineering');
  const [reminderBalance, setReminderBalance] = useState<number>(450000);
  const [reminderDueDate, setReminderDueDate] = useState('15th October 2026');
  const [reminderBankName, setReminderBankName] = useState(settings.defaultNIBSSBank.bankName);
  const [reminderAccountNum, setReminderAccountNum] = useState(settings.defaultNIBSSBank.accountNumber);
  const [reminderAccountName, setReminderAccountName] = useState(settings.defaultNIBSSBank.accountName);
  const [reminderNote, setReminderNote] = useState('This is a formal notification from the Finance Office regarding your tuition installment.');

  // 3. Invoice / Receipt Editable Fields
  const [invoiceNum, setInvoiceNum] = useState('INV-2026-84912');
  const [invoiceProg, setInvoiceProg] = useState('Full-Stack Software Engineering');
  const [invoiceAmt, setInvoiceAmt] = useState<number>(850000);
  const [invoiceStatus, setInvoiceStatus] = useState('Paid');
  const [invoicePayRef, setInvoicePayRef] = useState('NIBSS-TRX-9481029');
  const [invoiceNoteText, setInvoiceNoteText] = useState('Official tuition payment acknowledgment for academic enrollment.');

  // 4. Mentorship Session Editable Fields
  const [sessionMentorName, setSessionMentorName] = useState('Dr. Arthur Pendelton');
  const [sessionTopicTitle, setSessionTopicTitle] = useState('Distributed Systems & Database Scaling in FinTech');
  const [sessionHours, setSessionHours] = useState<number>(2);
  const [sessionCompensation, setSessionCompensation] = useState<number>(50000);
  const [sessionVenue, setSessionVenue] = useState('Google Meet / Lagos Hub Lab 3');

  // 5. Password Reset Editable Fields
  const [resetLinkUrl, setResetLinkUrl] = useState('http://72.61.106.87/reset-password');
  const [resetExpiry, setResetExpiry] = useState('24 hours');
  const [resetSecurityNote, setResetSecurityNote] = useState('We received a request to reset the password for your Nexus CRM account.');

  // 6. Mentor Welcome / Faculty Appointment Editable Fields
  const [mentorFacultyId, setMentorFacultyId] = useState('FAC-2026-084');
  const [mentorDepartment, setMentorDepartment] = useState('Software Engineering');
  const [mentorCourses, setMentorCourses] = useState('Full-Stack Software Engineering, Cloud DevOps');
  const [mentorCommissionRate, setMentorCommissionRate] = useState('37% per student enrollment');
  const [mentorBankDetails, setMentorBankDetails] = useState('Access Bank - 0123456789 (Verified ✅)');

  // Update default subject when template changes
  const handleSelectTemplate = (template: EmailTemplatePayload['type']) => {
    setSelectedEmailTemplate(template);
    const custom = settings.customEmailTemplates?.[template];
    if (custom?.subject) {
      setEmailSubject(custom.subject);
      return;
    }
    const defaultSubjects: Record<EmailTemplatePayload['type'], string> = {
      student_welcome: '🎓 Welcome to CODELAB EDUCARE LTD — Admission Confirmation',
      mentor_welcome: '💼 Faculty Appointment & Onboarding — CODELAB EDUCARE LTD (FAC-2026-084)',
      staff_welcome: 'Welcome to CODELAB EDUCARE LTD — Set Your Password',
      password_reset: 'Security Notice: Password Reset Request',
      payment_reminder: `Payment Reminder: Outstanding Tuition Balance (${reminderProgram})`,
      invoice_receipt: `Official Tuition Invoice & Receipt #${invoiceNum}`,
      session_confirmation: `1-on-1 Mentorship Coaching Session Confirmed (${sessionMentorName})`,
      expense_approval_request: '🔔 OpEx Approval Required: Office Equipment Requisition (₦185,000) - Operations',
      expense_approved: '✅ OpEx Request Approved: Office Equipment Requisition (₦185,000)',
      expense_rejected: '❌ OpEx Request Declined: Office Equipment Requisition (EXP-9021)',
      mentor_commission_earned: '🎉 New Commission Credited: 37% Enrollment Revenue Share (₦314,500)',
      mentor_payout_disbursed: '💸 Faculty Honorarium Disbursed: ₦314,500 [Access Bank Nigeria]',
      lab_assignment_submitted: '📝 Lab Assignment Submitted: Chidi Okeke — Full-Stack Portfolio',
      lab_assignment_graded: '🎯 Lab Assignment Evaluated: Full-Stack Portfolio — Grade: 96% (Passed)',
      new_mentee_assigned: '👥 New Mentee Assigned: Chidi Okeke — Full-Stack Software Engineering',
      proof_of_payment_alert: '📋 Bank Transfer POP Verification Required: Chidi Okeke (₦850,000)',
      tuition_payment_alert: '💰 Inbound Tuition Settlement: Chidi Okeke (₦850,000)',
      mentor_student_performance_report: '📊 Student Performance & Welfare Evaluation: Chidi Okeke (92% - Exceeding)',
      student_certificate_issued: '🎓 Certificate of Completion Awarded: Chidi Okeke — Full-Stack Software Engineering',
    };
    setEmailSubject(defaultSubjects[template]);
  };

  // Build current template payload dynamically
  const getCurrentTemplateData = () => {
    switch (selectedEmailTemplate) {
      case 'student_welcome':
        return {
          studentCode: reminderStudentCode,
          program: reminderProgram,
          cohort: 'Executive Cohort 2026',
          mentorName: sessionMentorName,
          paymentStatus: 'Cleared & Active (Full Tuition Paid)',
          portalUrl: `http://72.61.106.87/login?role=student&email=${encodeURIComponent(testRecipientEmail || 'student@codelab.institute')}`,
        };
      case 'mentor_welcome':
        return {
          facultyId: mentorFacultyId,
          department: mentorDepartment,
          courses: mentorCourses,
          commissionRate: mentorCommissionRate,
          bankDetails: mentorBankDetails,
          portalUrl: `http://72.61.106.87/login?role=mentor&email=${encodeURIComponent(testRecipientEmail || 'mentor@codelab.institute')}`,
        };
      case 'staff_welcome':
        return {
          roleTitle: welcomeRoleTitle,
          department: welcomeDept,
          setupUrl: welcomeSetupUrl.includes('?') ? welcomeSetupUrl : `${welcomeSetupUrl}?role=admissions&email=${encodeURIComponent(testRecipientEmail)}&token=welcome-${Date.now()}`,
          customWelcomeNote: welcomeNote,
        };
      case 'payment_reminder':
        return {
          studentCode: reminderStudentCode,
          program: reminderProgram,
          balance: reminderBalance,
          dueDate: reminderDueDate,
          bankName: reminderBankName,
          accountNumber: reminderAccountNum,
          accountName: reminderAccountName,
          paymentNotice: reminderNote,
        };
      case 'invoice_receipt':
        return {
          invoiceNumber: invoiceNum,
          program: invoiceProg,
          amount: invoiceAmt,
          status: invoiceStatus,
          paymentRef: invoicePayRef,
          invoiceNote: invoiceNoteText,
        };
      case 'session_confirmation':
        return {
          mentorName: sessionMentorName,
          studentName: testRecipientName,
          topic: sessionTopicTitle,
          durationHours: sessionHours,
          compensationAmount: sessionCompensation,
          sessionLocation: sessionVenue,
        };
      case 'password_reset':
        return {
          resetUrl: resetLinkUrl.includes('?') ? resetLinkUrl : `${resetLinkUrl}?email=${encodeURIComponent(testRecipientEmail)}&token=reset-${Date.now()}`,
          resetExpiryHours: resetExpiry,
          securityNotice: resetSecurityNote,
        };
      case 'expense_approval_request':
        return {
          expenseCode: 'EXP-9021',
          title: 'Dell Server Rack & Cisco Router',
          amount: 185000,
          category: 'Office & Ops',
          department: 'Engineering & IT',
          requestedBy: testRecipientName || 'Chidi Okeke (Operations)',
          requesterEmail: testRecipientEmail || 'chidi@codelab.institute',
          vendor: 'Hub Network Systems NG',
          urgency: 'Urgent',
          receiptName: 'cisco_invoice_9021.pdf',
          description: 'Critical network switch replacement for Victoria Island Lab 2 high-density lab.',
          actionUrl: 'http://72.61.106.87/expenses',
        };
      case 'expense_approved':
        return {
          expenseCode: 'EXP-9021',
          title: 'Dell Server Rack & Cisco Router',
          amount: 185000,
          reviewedBy: 'Abiola Adefowope (Super Admin)',
          reviewedAt: new Date().toISOString().split('T')[0],
          actionUrl: 'http://72.61.106.87/expenses',
        };
      case 'expense_rejected':
        return {
          expenseCode: 'EXP-9021',
          title: 'Dell Server Rack & Cisco Router',
          amount: 185000,
          reviewedBy: 'Super Admin',
          rejectionReason: 'Exceeds remaining departmental hardware budget for Q3. Please defer or source alternate vendor discount.',
          actionUrl: 'http://72.61.106.87/expenses',
        };
      case 'mentor_commission_earned':
        return {
          studentName: 'Chidi Okeke',
          program: 'Full-Stack Software Engineering',
          tuitionPaid: 850000,
          commissionAmount: 314500,
          newPendingPayout: 314500,
          portalUrl: 'http://72.61.106.87/mentors',
        };
      case 'mentor_payout_disbursed':
        return {
          amount: 314500,
          bankName: 'Access Bank Nigeria PLC',
          accountNumber: '0812948192',
          transferRef: 'TRF-PAYSTACK-948102',
          date: new Date().toISOString().split('T')[0],
          portalUrl: 'http://72.61.106.87/mentors',
        };
      case 'lab_assignment_submitted':
        return {
          studentName: 'Chidi Okeke',
          courseTitle: 'Full-Stack Software Engineering',
          moduleTitle: 'Module 4: React & Node REST APIs',
          taskTitle: 'Full-Stack Microservices Architecture Project',
          githubUrl: 'https://github.com/codelab-student/fullstack-demo',
          liveUrl: 'https://codelab-demo.vercel.app',
          notes: 'Configured with PostgreSQL database and JWT authentication.',
          reviewUrl: 'http://72.61.106.87/courses',
        };
      case 'lab_assignment_graded':
        return {
          taskTitle: 'Full-Stack Microservices Architecture Project',
          grade: 96,
          status: 'Passed',
          reviewedBy: sessionMentorName || 'Arthur Pendelton',
          mentorFeedback: 'Superb architecture and code modularity. Clean API error boundaries and database migrations.',
          portalUrl: 'http://72.61.106.87/student/courses',
        };
      case 'new_mentee_assigned':
        return {
          studentName: 'Chidi Okeke',
          studentCode: 'STU-9042',
          program: 'Full-Stack Software Engineering',
          cohort: 'Executive Cohort 2026',
          studentEmail: 'chidi.okeke@codelab.institute',
          portalUrl: 'http://72.61.106.87/mentors',
        };
      case 'proof_of_payment_alert':
        return {
          studentName: 'Chidi Okeke',
          studentCode: 'STU-9042',
          amount: 850000,
          bankRef: 'NIBSS-TRF-091823901',
          fileName: 'transfer_receipt_access.jpg',
          actionUrl: 'http://72.61.106.87/invoices',
        };
      case 'tuition_payment_alert':
        return {
          studentName: 'Chidi Okeke',
          studentCode: 'STU-9042',
          program: 'Full-Stack Software Engineering',
          amount: 850000,
          gateway: 'Paystack Direct Settlement',
          reference: 'PAY-REF-8910293',
          actionUrl: 'http://72.61.106.87/invoices',
        };
      case 'mentor_student_performance_report':
        return {
          studentName: 'Chidi Okeke',
          studentCode: 'STU-9042',
          mentorName: sessionMentorName,
          program: reminderProgram,
          performanceScore: 92,
          performanceTier: 'Exceeding',
          attendanceRate: '95%',
          technicalUnderstanding: 'Excellent mastery of distributed cloud architectures and Docker.',
          engagementLevel: 'Highly active in daily standups and lab exercises.',
          welfareObservations: 'High motivation, requires no immediate welfare intervention.',
          recommendations: 'Recommended for advanced cloud engineering fellowship and leadership recognition.',
          reportCode: 'REP-CDL-2026-9042',
        };
      case 'student_certificate_issued':
        return {
          studentName: 'Chidi Okeke',
          studentCode: 'STU-9042',
          program: reminderProgram,
          certificateNumber: 'CERT-CDL-2026-9042',
          issuedDate: '11 September 2026',
          portalUrl: 'http://72.61.106.87/student/courses',
        };
      default:
        return {};
    }
  };

  const activeEmailPreviewHtml = emailService.generateHtml({
    to: testRecipientEmail,
    recipientName: testRecipientName,
    subject: emailSubject,
    type: selectedEmailTemplate,
    data: getCurrentTemplateData(),
  });

  const handleSaveTemplateCustomization = () => {
    const existingCustomTemplates = settings.customEmailTemplates || {};
    const updatedCustomTemplates = {
      ...existingCustomTemplates,
      [selectedEmailTemplate]: {
        subject: emailSubject,
        body: activeEmailPreviewHtml,
        lastUpdated: new Date().toISOString(),
        updatedBy: currentUser?.name || 'Administrator',
      },
    };

    updateSettings({
      customEmailTemplates: updatedCustomTemplates,
    });

    setSaveTemplateSuccess(true);
    showToast('Template Saved', `Customizations for ${selectedEmailTemplate} persisted to database.`, 'success');
    setTimeout(() => setSaveTemplateSuccess(false), 4000);
  };

  const handleResetTemplateToDefault = () => {
    const existingCustomTemplates = { ...(settings.customEmailTemplates || {}) };
    delete existingCustomTemplates[selectedEmailTemplate];
    updateSettings({
      customEmailTemplates: existingCustomTemplates,
    });
    handleSelectTemplate(selectedEmailTemplate);
    showToast('Template Reset', `Restored standard system template for ${selectedEmailTemplate}.`, 'info');
  };

  // Production Flush Confirmation Modal
  const [showFlushConfirm, setShowFlushConfirm] = useState(false);

  // Campus Geofencing Handlers
  const handleUpdateCampus = (id: string, field: keyof CampusLocation, value: any) => {
    setCampusLocationsList(prev =>
      prev.map(c => (c.id === id ? { ...c, [field]: value } : c))
    );
  };

  const handleToggleCampus = (id: string) => {
    setCampusLocationsList(prev =>
      prev.map(c => (c.id === id ? { ...c, isActive: !c.isActive } : c))
    );
  };

  const handleAddCampus = () => {
    const newId = `campus-${Date.now()}`;
    const newCampus: CampusLocation = {
      id: newId,
      code: `HUB-0${campusLocationsList.length + 1}`,
      name: `New Academic Hub ${campusLocationsList.length + 1}`,
      address: 'Plot Address, City Hub',
      city: 'Lagos State',
      latitude: 6.5244,
      longitude: 3.3792,
      radiusMeters: 300,
      isActive: true,
    };
    setCampusLocationsList(prev => [...prev, newCampus]);
    showToast('Campus Added', 'New campus location added. Configure coordinates and save changes.', 'info');
  };

  const handleDeleteCampus = (id: string) => {
    if (campusLocationsList.length <= 1) {
      showToast('Cannot Remove', 'At least one campus location is required for institutional geofencing.', 'error');
      return;
    }
    setCampusLocationsList(prev => prev.filter(c => c.id !== id));
    showToast('Campus Removed', 'Campus removed from list. Click Save Configuration Changes to apply.', 'info');
  };

  const handleCaptureCampusGps = async (campusId: string) => {
    setCapturingGpsForCampus(campusId);
    try {
      const coords = await getDeviceCoordinates();
      handleUpdateCampus(campusId, 'latitude', Number(coords.latitude.toFixed(4)));
      handleUpdateCampus(campusId, 'longitude', Number(coords.longitude.toFixed(4)));
      showToast('GPS Acquired', `Captured coordinates: ${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`, 'success');
    } catch {
      showToast('GPS Error', 'Could not access device GPS. Please type latitude/longitude manually.', 'error');
    } finally {
      setCapturingGpsForCampus(null);
    }
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const primaryActiveCampus = campusLocationsList.find(c => c.isActive) || campusLocationsList[0];
    updateSettings({
      instituteName,
      address,
      email,
      phone,
      tinNumber,
      cacNumber,
      logoUrl,
      defaultNIBSSBank: {
        bankName,
        accountNumber,
        accountName,
      },
      paystackPublicKey,
      paystackSecretKey,
      paystackLiveMode,
      enabledModules,
      emailAlertsEnabled,
      autoInvoiceGeneration,
      showBudgetToStaff,
      defaultMinimumLearningHours: Number(defaultMinimumLearningHours),
      campusLocationsList: campusLocationsList,
      officeLocation: primaryActiveCampus ? {
        name: primaryActiveCampus.name,
        latitude: primaryActiveCampus.latitude,
        longitude: primaryActiveCampus.longitude,
        radiusMeters: primaryActiveCampus.radiusMeters,
      } : settings.officeLocation,
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

  const handleToggleModule = (moduleKey: keyof EnabledModules) => {
    const updated: EnabledModules = {
      ...enabledModules,
      [moduleKey]: !enabledModules[moduleKey],
    };
    setEnabledModules(updated);
    updateSettings({
      ...settings,
      enabledModules: updated,
    });
    showToast(
      updated[moduleKey] ? 'Module Enabled' : 'Module Disabled',
      `${moduleKey.toUpperCase()} module is now ${updated[moduleKey] ? 'active & accessible' : 'offline / scheduled for launch'}.`,
      updated[moduleKey] ? 'success' : 'info'
    );
  };

  const handleBulkModuleToggle = (enableAll: boolean) => {
    const updated: EnabledModules = {
      lms: enableAll,
      leads: true,
      courses: enableAll,
      students: true,
      mentors: enableAll,
      attendance: enableAll,
      expenses: enableAll,
    };
    setEnabledModules(updated);
    updateSettings({
      ...settings,
      enabledModules: updated,
    });
    showToast(
      enableAll ? 'All Modules Enabled' : 'Admissions Core Activated',
      enableAll ? 'All institutional modules are now active.' : 'LMS, Mentors, Attendance & Expenses set to upcoming launch status.',
      'success'
    );
  };

  const handleTestPaystack = async () => {
    setTestingPaystack(true);
    setPaystackTestResult(null);
    try {
      updateSettings({
        paystackPublicKey,
        paystackSecretKey,
        paystackLiveMode,
      });

      const res = await fetch('http://localhost:5001/api/paystack/test-connection');
      const data = await res.json();
      setPaystackTestResult(data);
      if (data.success) {
        showToast('Paystack Connected', data.message, 'success');
      } else {
        showToast('Connection Notice', data.message, 'warning');
      }
    } catch (err: any) {
      setPaystackTestResult({ success: false, message: `Could not reach server test endpoint: ${err.message}` });
      showToast('Test Error', err.message, 'error');
    } finally {
      setTestingPaystack(false);
    }
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
      student: 'Enrolled Scholar / Student',
    };

    addStaffUser({
      name: newStaffName,
      email: newStaffEmail,
      role: newStaffRole,
      roleTitle: roleTitleMap[newStaffRole],
      department: newStaffDept,
      password: newStaffPassword || 'password123',
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
    setNewStaffPassword('');
    setShowAddStaffForm(false);
  };

  const handleSendTestEmail = async () => {
    setIsSendingEmail(true);

    try {
      // Send real email via backend API (Nodemailer SMTP)
      const res = await apiService.sendEmail({
        to: testRecipientEmail,
        subject: emailSubject,
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
        subject: emailSubject,
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
    <div className="space-y-stack-lg animate-in fade-in duration-200 max-w-6xl">
      {/* Page Header */}
      <div>
        <h2 className="font-headline-lg text-headline-lg font-bold text-on-surface mb-unit">
          Organization &amp; System Operations
        </h2>
        <p className="font-body-md text-body-md text-secondary">
          Configure corporate profiles, manage staff role security, customize and test transactional email dispatches, and perform data backups.
        </p>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-lg bg-[#dcfce7] border border-[#86efac] text-[#166534] flex items-center gap-2 text-sm font-semibold animate-in fade-in">
          <span className="material-symbols-outlined text-[20px]">check_circle</span>
          <span>Institutional profile and system settings updated successfully!</span>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex border-b border-outline-variant gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('general')}
          className={`pb-3 px-4 font-label-lg text-sm font-bold flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
            activeTab === 'general'
              ? 'border-b-2 border-primary text-primary'
              : 'text-secondary hover:text-on-surface'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">domain</span>
          <span>General &amp; Banking</span>
        </button>

        <button
          onClick={() => setActiveTab('modules')}
          className={`pb-3 px-4 font-label-lg text-sm font-bold flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
            activeTab === 'modules'
              ? 'border-b-2 border-primary text-primary'
              : 'text-secondary hover:text-on-surface'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">toggle_on</span>
          <span>Modules &amp; Launch Controls</span>
          <span className="px-1.5 py-0.5 rounded-full bg-surface-container text-secondary text-[11px] font-data-tabular">
            {Object.values(enabledModules).filter(Boolean).length}/{Object.keys(enabledModules).length}
          </span>
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
          <span className="px-1.5 py-0.5 rounded-full bg-surface-container text-secondary text-[11px] font-data-tabular">
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
          {/* Brand Identity & Logo Card */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-xs space-y-4">
            <h3 className="font-headline-sm text-base font-bold text-on-surface border-b border-outline-variant pb-2 flex items-center justify-between">
              <span>Brand Identity &amp; Logo Insignia</span>
              <span className="text-[11px] font-normal text-secondary">Official institutional emblem used across portal, invoices &amp; emails</span>
            </h3>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 pt-2">
              <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant flex items-center justify-center shrink-0 w-32 h-32">
                <BrandLogo size="lg" logoUrl={logoUrl} />
              </div>
              <div className="flex-1 space-y-3 w-full">
                <div>
                  <label className="block font-label-md text-xs font-semibold text-on-surface mb-1">
                    Institutional Brand Logo (Upload Image)
                  </label>
                  <input
                    type="file"
                    ref={logoFileInputRef}
                    onChange={handleLogoFileUpload}
                    accept="image/png, image/jpeg, image/webp, image/svg+xml"
                    className="hidden"
                  />
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => logoFileInputRef.current?.click()}
                      className="px-4 h-10 bg-primary text-on-primary rounded-lg text-xs font-bold hover:bg-primary/90 transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
                    >
                      <span className="material-symbols-outlined text-[18px]">upload_file</span>
                      <span>{logoUrl ? 'Change Brand Logo' : 'Upload Brand Logo'}</span>
                    </button>

                    {logoUrl && (
                      <button
                        type="button"
                        onClick={() => {
                          setLogoUrl('');
                          if (logoFileInputRef.current) logoFileInputRef.current.value = '';
                          showToast('Logo Cleared', 'Reverted to default institutional vector emblem.', 'info');
                        }}
                        className="px-3 h-10 border border-outline-variant rounded-lg text-xs text-secondary hover:text-error hover:bg-surface-container transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[16px]">delete</span>
                        <span>Revert to Default Vector Emblem</span>
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-[11px] text-secondary">
                  Supported formats: PNG, JPG, WebP, SVG (max 2MB). Uploaded image is embedded and used in headers, student onboarding emails, and invoices. If not uploaded, the system displays the official <strong>CODELAB EDUCARE LTD</strong> geometric vector emblem.
                </p>
              </div>
            </div>
          </div>

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
                <label className="block font-label-md text-xs font-semibold text-on-surface mb-1">Tax Identification Number (TIN)</label>
                <input
                  type="text"
                  value={tinNumber}
                  onChange={(e) => setTinNumber(e.target.value)}
                  className="w-full h-10 px-3 rounded bg-surface border border-outline-variant text-sm font-data-tabular focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                />
              </div>

              <div>
                <label className="block font-label-md text-xs font-semibold text-on-surface mb-1">CAC Registration Number (RC)</label>
                <input
                  type="text"
                  value={cacNumber}
                  onChange={(e) => setCacNumber(e.target.value)}
                  className="w-full h-10 px-3 rounded bg-surface border border-outline-variant text-sm font-data-tabular focus:border-primary focus:ring-1 focus:ring-primary outline-none"
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
                <label className="block font-label-md text-xs font-semibold text-on-surface mb-1">
                  Settlement Bank ({NIGERIAN_BANKS.length} Banks)
                </label>
                <select
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full h-10 px-3 rounded bg-surface border border-outline-variant text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none cursor-pointer"
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

              <div>
                <label className="block font-label-md text-xs font-semibold text-on-surface mb-1">NUBAN Account Number</label>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="w-full h-10 px-3 rounded bg-surface border border-outline-variant text-sm font-data-tabular font-bold text-primary focus:border-primary focus:ring-1 focus:ring-primary outline-none"
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

            <div className="pt-3 border-t border-outline-variant flex flex-wrap gap-6">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-on-surface">
                <input
                  type="checkbox"
                  checked={emailAlertsEnabled}
                  onChange={(e) => setEmailAlertsEnabled(e.target.checked)}
                  className="rounded border-outline-variant text-primary focus:ring-primary cursor-pointer"
                />
                <span>Enable Real-Time Email Notifications &amp; Alerts</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-on-surface">
                <input
                  type="checkbox"
                  checked={autoInvoiceGeneration}
                  onChange={(e) => setAutoInvoiceGeneration(e.target.checked)}
                  className="rounded border-outline-variant text-primary focus:ring-primary cursor-pointer"
                />
                <span>Auto-Generate Official Invoices on Lead Conversion</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-on-surface">
                <input
                  type="checkbox"
                  checked={showBudgetToStaff}
                  onChange={(e) => setShowBudgetToStaff(e.target.checked)}
                  className="rounded border-outline-variant text-primary focus:ring-primary cursor-pointer"
                />
                <span>Allow Staff (Admissions &amp; Finance) to View Monthly Budget &amp; Deductions</span>
              </label>
            </div>
          </div>

          {/* Paystack Payment Gateway Card */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-outline-variant pb-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl">payments</span>
                <h3 className="font-headline-sm text-base font-bold text-on-surface">
                  Paystack Payment Gateway Configuration
                </h3>
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                paystackLiveMode ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/30' : 'bg-amber-500/10 text-amber-600 border border-amber-500/30'
              }`}>
                {paystackLiveMode ? '● Live Production Gateway' : '○ Sandbox Test Simulator'}
              </span>
            </div>

            <p className="text-xs text-secondary">
              Powers instant student tuition collections via Debit Cards (Mastercard, Visa, Verve), USSD, and Bank Transfers, and automated 37% commission disbursements to verified faculty mentors.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-label-md text-xs font-semibold text-on-surface mb-1">
                  Paystack Public Key ({paystackLiveMode ? 'pk_live_...' : 'pk_test_...'})
                </label>
                <input
                  type="text"
                  placeholder="pk_test_..."
                  value={paystackPublicKey}
                  onChange={(e) => setPaystackPublicKey(e.target.value)}
                  className="w-full h-10 px-3 rounded bg-surface border border-outline-variant text-sm font-mono focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-label-md text-xs font-semibold text-on-surface">
                    Paystack Secret Key ({paystackLiveMode ? 'sk_live_...' : 'sk_test_...'})
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPaystackSecret(!showPaystackSecret)}
                    className="text-[11px] text-primary hover:underline font-semibold"
                  >
                    {showPaystackSecret ? 'Hide Key' : 'Reveal Key'}
                  </button>
                </div>
                <input
                  type={showPaystackSecret ? 'text' : 'password'}
                  placeholder="sk_test_..."
                  value={paystackSecretKey}
                  onChange={(e) => setPaystackSecretKey(e.target.value)}
                  className="w-full h-10 px-3 rounded bg-surface border border-outline-variant text-sm font-mono focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-outline-variant flex flex-wrap items-center justify-between gap-4">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-on-surface">
                <input
                  type="checkbox"
                  checked={paystackLiveMode}
                  onChange={(e) => setPaystackLiveMode(e.target.checked)}
                  className="rounded border-outline-variant text-primary focus:ring-primary cursor-pointer"
                />
                <span>Enable Live Mode (Uncheck for Sandbox Test Simulator)</span>
              </label>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleTestPaystack}
                  disabled={testingPaystack}
                  className="px-3 py-1.5 rounded-lg bg-surface border border-outline-variant hover:bg-surface-container font-bold text-xs text-primary transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px] text-primary">
                    {testingPaystack ? 'sync' : 'bolt'}
                  </span>
                  <span>{testingPaystack ? 'Testing API...' : 'Test Paystack Connection'}</span>
                </button>

                <div className="flex items-center gap-2 text-[11px] text-secondary">
                  <span className="material-symbols-outlined text-sm text-emerald-600">verified</span>
                  <span>Webhook: <code className="bg-surface-container px-1.5 py-0.5 rounded text-[10px]">/api/paystack/webhook</code></span>
                </div>
              </div>
            </div>

            {/* Test Connection Results Notice */}
            {paystackTestResult && (
              <div className={`p-3 rounded-lg border text-xs flex items-start gap-2.5 animate-in fade-in ${
                paystackTestResult.success 
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-900' 
                  : 'bg-error-container/30 border-error/30 text-error'
              }`}>
                <span className="material-symbols-outlined text-sm mt-0.5 shrink-0">
                  {paystackTestResult.success ? 'check_circle' : 'error'}
                </span>
                <div className="flex-1">
                  <p className="font-bold">{paystackTestResult.message}</p>
                  {paystackTestResult.banksCount !== undefined && (
                    <p className="text-[11px] opacity-80 mt-0.5">
                      ✓ Verified connection against Paystack API • {paystackTestResult.banksCount} Nigerian commercial &amp; FinTech banks accessible for NUBAN payouts.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Academic Gatekeeping & Graduation Standards Card */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-outline-variant pb-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl">workspace_premium</span>
                <h3 className="font-headline-sm text-base font-bold text-on-surface">
                  Academic Gatekeeping &amp; Graduation Standards
                </h3>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                Institutional Policy
              </span>
            </div>

            <p className="text-xs text-secondary">
              Configure baseline institutional thresholds required before student completion certificates and digital credentials can be formally issued by academic leadership.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              <div>
                <label className="block font-label-md text-xs font-semibold text-on-surface mb-1">
                  Minimum Mentored Learning Hours Required for Graduation
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={1}
                    max={500}
                    value={defaultMinimumLearningHours}
                    onChange={(e) => setDefaultMinimumLearningHours(Number(e.target.value))}
                    className="w-full h-10 pl-3 pr-12 rounded bg-surface border border-outline-variant text-sm font-data-tabular font-bold text-primary focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-secondary font-medium">Hours</span>
                </div>
                <p className="text-[11px] text-secondary mt-1">
                  Default across all tracks: <strong>{defaultMinimumLearningHours} hours</strong>. Certificates remain cryptographically locked in the student portal until this threshold is verified.
                </p>
              </div>

              <div className="p-3.5 rounded-lg bg-surface border border-outline-variant/60 flex items-start gap-3">
                <span className="material-symbols-outlined text-amber-500 text-xl shrink-0 mt-0.5">verified_user</span>
                <div className="text-xs space-y-1">
                  <p className="font-bold text-on-surface">Dual-Condition Graduation Enforcement</p>
                  <p className="text-[11px] text-secondary leading-relaxed">
                    1. <strong>Curriculum Mastery</strong>: 100% of all syllabus lessons and project deliverables completed.<br />
                    2. <strong>Time Commitment</strong>: Attendance recorded by faculty mentors in live technical workshops meets or exceeds the minimum hours.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Multi-Campus Physical Hubs & Geofence Perimeter Manager */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-outline-variant pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl">share_location</span>
                <div>
                  <h3 className="font-headline-sm text-base font-bold text-on-surface">
                    Multi-Campus Physical Hubs &amp; Geofencing Perimeter Manager
                  </h3>
                  <p className="text-[11px] text-secondary">
                    Configure authorized regional facilities for high-precision GPS shift check-ins and punctuality tracking.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleAddCampus}
                className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20 text-xs font-bold hover:bg-primary/20 transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">add_location_alt</span>
                <span>Add Campus Hub</span>
              </button>
            </div>

            <div className="space-y-3 pt-1">
              {campusLocationsList.map((campus, index) => (
                <div
                  key={campus.id}
                  className={`p-4 rounded-xl border transition-all ${
                    campus.isActive
                      ? 'bg-surface border-outline-variant shadow-xs'
                      : 'bg-surface-container-lowest border-outline-variant/50 opacity-70'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3 border-b border-outline-variant/60 pb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold font-data-tabular">
                        {index + 1}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-surface-container text-on-surface font-mono text-xs font-bold border border-outline-variant">
                        {campus.code}
                      </span>
                      <span className="font-bold text-sm text-on-surface">{campus.name}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-secondary">
                        <button
                          type="button"
                          onClick={() => handleToggleCampus(campus.id)}
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                            campus.isActive ? 'bg-primary' : 'bg-outline-variant'
                          }`}
                          role="switch"
                          aria-checked={campus.isActive}
                        >
                          <span
                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                              campus.isActive ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          />
                        </button>
                        <span>{campus.isActive ? 'Active Hub' : 'Inactive Hub'}</span>
                      </label>

                      {campusLocationsList.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleDeleteCampus(campus.id)}
                          className="p-1 rounded text-secondary hover:text-error hover:bg-surface-container transition-colors cursor-pointer"
                          title="Remove Campus Hub"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                    <div className="md:col-span-4">
                      <label className="block text-[11px] font-semibold text-secondary mb-1">Campus Hub Name</label>
                      <input
                        type="text"
                        value={campus.name}
                        onChange={(e) => handleUpdateCampus(campus.id, 'name', e.target.value)}
                        className="w-full h-9 px-2.5 rounded bg-surface border border-outline-variant text-xs font-semibold text-on-surface outline-none focus:border-primary"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-[11px] font-semibold text-secondary mb-1">Campus Code</label>
                      <input
                        type="text"
                        value={campus.code}
                        onChange={(e) => handleUpdateCampus(campus.id, 'code', e.target.value.toUpperCase())}
                        className="w-full h-9 px-2.5 rounded bg-surface border border-outline-variant text-xs font-mono font-bold text-on-surface outline-none focus:border-primary"
                      />
                    </div>

                    <div className="md:col-span-4">
                      <label className="block text-[11px] font-semibold text-secondary mb-1">Physical Address</label>
                      <input
                        type="text"
                        value={campus.address}
                        onChange={(e) => handleUpdateCampus(campus.id, 'address', e.target.value)}
                        className="w-full h-9 px-2.5 rounded bg-surface border border-outline-variant text-xs text-on-surface outline-none focus:border-primary"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-[11px] font-semibold text-secondary mb-1">City / State</label>
                      <input
                        type="text"
                        value={campus.city}
                        onChange={(e) => handleUpdateCampus(campus.id, 'city', e.target.value)}
                        className="w-full h-9 px-2.5 rounded bg-surface border border-outline-variant text-xs text-on-surface outline-none focus:border-primary"
                      />
                    </div>

                    <div className="md:col-span-4">
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-semibold text-secondary">Latitude</label>
                        <button
                          type="button"
                          onClick={() => handleCaptureCampusGps(campus.id)}
                          disabled={capturingGpsForCampus === campus.id}
                          className="text-[10px] text-primary hover:underline font-semibold flex items-center gap-0.5 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[12px]">my_location</span>
                          <span>{capturingGpsForCampus === campus.id ? 'Detecting...' : 'Use My GPS'}</span>
                        </button>
                      </div>
                      <input
                        type="number"
                        step="0.0001"
                        value={campus.latitude}
                        onChange={(e) => handleUpdateCampus(campus.id, 'latitude', parseFloat(e.target.value) || 0)}
                        className="w-full h-9 px-2.5 rounded bg-surface border border-outline-variant text-xs font-mono text-on-surface outline-none focus:border-primary"
                      />
                    </div>

                    <div className="md:col-span-4">
                      <label className="block text-[11px] font-semibold text-secondary mb-1">Longitude</label>
                      <input
                        type="number"
                        step="0.0001"
                        value={campus.longitude}
                        onChange={(e) => handleUpdateCampus(campus.id, 'longitude', parseFloat(e.target.value) || 0)}
                        className="w-full h-9 px-2.5 rounded bg-surface border border-outline-variant text-xs font-mono text-on-surface outline-none focus:border-primary"
                      />
                    </div>

                    <div className="md:col-span-4">
                      <label className="block text-[11px] font-semibold text-secondary mb-1">
                        Geofence Radius (Meters)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min={50}
                          max={5000}
                          step={50}
                          value={campus.radiusMeters}
                          onChange={(e) => handleUpdateCampus(campus.id, 'radiusMeters', parseInt(e.target.value) || 250)}
                          className="w-full h-9 pl-2.5 pr-8 rounded bg-surface border border-outline-variant text-xs font-data-tabular font-bold text-on-surface outline-none focus:border-primary"
                        />
                        <span className="absolute right-2.5 top-2 text-[11px] text-secondary font-medium">m</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Progressive Web App (PWA) & Mobile Engine Card */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-outline-variant pb-3">
              <div className="flex items-center gap-3">
                <img
                  src="/icons/icon-192.png"
                  alt="CODELAB Insignia"
                  className="w-10 h-10 rounded-xl shadow bg-[#0B0F19] p-0.5 object-contain"
                />
                <div>
                  <h3 className="font-headline-sm text-base font-bold text-on-surface">
                    Progressive Web App (PWA) &amp; Mobile Engine
                  </h3>
                  <p className="text-[11px] text-secondary">
                    Mobile-first client configuration, Service Worker cache status &amp; standalone device installation
                  </p>
                </div>
              </div>

              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider shrink-0 ${
                isStandalone
                  ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/30'
                  : 'bg-primary/10 text-primary border border-primary/20'
              }`}>
                {isStandalone ? '● Native Standalone App' : '○ Web Browser Tab'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div className="p-3.5 rounded-xl bg-surface border border-outline-variant/60 space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-secondary">Device Platform</p>
                <p className="font-bold text-xs text-on-surface flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-primary">
                    {isIOS ? 'phone_iphone' : isAndroid ? 'phone_android' : 'desktop_mac'}
                  </span>
                  <span>{isIOS ? 'Apple iOS (iPhone/iPad)' : isAndroid ? 'Android Device' : 'Desktop / Laptop Browser'}</span>
                </p>
                <p className="text-[10px] text-secondary">
                  {isIOS ? 'Requires Safari "Add to Home Screen"' : isAndroid ? 'Supports 1-click WebAPK installation' : 'Chromium / Edge installable'}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-surface border border-outline-variant/60 space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-secondary">Network &amp; Sync State</p>
                <p className="font-bold text-xs text-on-surface flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
                  <span>{isOnline ? 'Online & Synchronized' : 'Offline Mode (Local Cache)'}</span>
                </p>
                <p className="text-[10px] text-secondary">
                  {isOnline ? 'Connected to live database & SMTP' : 'Reads served from client cache'}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-surface border border-outline-variant/60 space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-secondary">Service Worker Engine</p>
                <p className="font-bold text-xs text-on-surface flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-primary">offline_bolt</span>
                  <span className="font-mono text-[11px]">nexus-crm-v1.0.0</span>
                </p>
                <p className="text-[10px] text-secondary">
                  SPA offline routing &amp; asset pre-caching
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-outline-variant/60 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                {!isStandalone && (isInstallable || isIOS) && (
                  <button
                    type="button"
                    onClick={() => {
                      if (isIOS) setShowIOSInstallGuide(true);
                      else promptInstall();
                    }}
                    className="px-3.5 py-2 rounded-lg bg-primary text-on-primary text-xs font-bold hover:bg-primary/90 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <span className="material-symbols-outlined text-[16px]">install_mobile</span>
                    <span>Install Nexus App on this Device</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Clear all local service worker caches and refresh the application?')) {
                      clearCacheAndReload();
                    }
                  }}
                  className="px-3 py-2 rounded-lg bg-surface border border-outline-variant text-xs text-secondary hover:text-on-surface hover:bg-surface-container transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">cleaning_services</span>
                  <span>Clear Offline Cache &amp; Reload</span>
                </button>
              </div>

              <p className="text-[11px] text-secondary">
                Students and staff can install Nexus CRM directly without downloading from the App Store or Play Store.
              </p>
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
      {/* TAB: MODULE MANAGEMENT & LAUNCH CONTROLS */}
      {/* ========================================================================= */}
      {activeTab === 'modules' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Header Card */}
          <div className="p-6 rounded-2xl bg-surface border border-outline-variant shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="material-symbols-outlined text-primary text-2xl">toggle_on</span>
                <h3 className="font-headline-md text-xl font-bold text-on-surface">Institutional Modules &amp; Launch Controls</h3>
              </div>
              <p className="text-secondary text-sm max-w-2xl leading-relaxed">
                Toggle modules on or off as your operations expand. Disabled modules are hidden from staff and student navigation; direct URL visits show a &quot;Scheduled for Launch&quot; educational splash screen. Super Admins retain preview privileges.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => handleBulkModuleToggle(true)}
                className="px-3.5 py-2 rounded-lg bg-primary/10 text-primary border border-primary/20 text-xs font-bold hover:bg-primary/20 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">done_all</span>
                <span>Enable All</span>
              </button>
              <button
                type="button"
                onClick={() => handleBulkModuleToggle(false)}
                className="px-3.5 py-2 rounded-lg bg-surface border border-outline-variant text-secondary text-xs font-semibold hover:bg-surface-container transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">filter_alt</span>
                <span>Admissions Core Only</span>
              </button>
            </div>
          </div>

          {/* Module Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 1. Classroom LMS */}
            <div className={`p-5 rounded-2xl border transition-all ${
              enabledModules.lms
                ? 'bg-surface border-outline-variant shadow-xs'
                : 'bg-surface-container-lowest border-outline-variant/60 opacity-80'
            }`}>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    enabledModules.lms ? 'bg-primary/10 text-primary' : 'bg-surface-container text-secondary'
                  }`}>
                    <span className="material-symbols-outlined text-[22px]">local_library</span>
                  </div>
                  <div>
                    <h4 className="font-title-md text-base font-bold text-on-surface">Classroom LMS &amp; Student Portal</h4>
                    <p className="text-[11px] text-secondary">Student course progress, lessons, lab deliverable URLs &amp; mentor grading</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleToggleModule('lms')}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    enabledModules.lms ? 'bg-primary' : 'bg-outline-variant'
                  }`}
                  role="switch"
                  aria-checked={enabledModules.lms}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      enabledModules.lms ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 pt-3 border-t border-outline-variant/60 text-[11px]">
                <span className={`px-2 py-0.5 rounded font-bold uppercase tracking-wider text-[10px] ${
                  enabledModules.lms ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                }`}>
                  {enabledModules.lms ? '● Active & Live' : '○ Scheduled for Launch'}
                </span>
                <span className="text-secondary">Routes: <code>/student/courses</code>, <code>/student/dashboard</code></span>
              </div>
            </div>

            {/* 2. Admissions Lead Pipeline */}
            <div className={`p-5 rounded-2xl border transition-all ${
              enabledModules.leads
                ? 'bg-surface border-outline-variant shadow-xs'
                : 'bg-surface-container-lowest border-outline-variant/60 opacity-80'
            }`}>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    enabledModules.leads ? 'bg-primary/10 text-primary' : 'bg-surface-container text-secondary'
                  }`}>
                    <span className="material-symbols-outlined text-[22px]">leaderboard</span>
                  </div>
                  <div>
                    <h4 className="font-title-md text-base font-bold text-on-surface">Admissions &amp; Leads Pipeline</h4>
                    <p className="text-[11px] text-secondary">Kanban sales funnel, inquiry screening, interview scheduling &amp; student conversion</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleToggleModule('leads')}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    enabledModules.leads ? 'bg-primary' : 'bg-outline-variant'
                  }`}
                  role="switch"
                  aria-checked={enabledModules.leads}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      enabledModules.leads ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 pt-3 border-t border-outline-variant/60 text-[11px]">
                <span className={`px-2 py-0.5 rounded font-bold uppercase tracking-wider text-[10px] ${
                  enabledModules.leads ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                }`}>
                  {enabledModules.leads ? '● Active & Live' : '○ Scheduled for Launch'}
                </span>
                <span className="text-secondary">Route: <code>/leads</code></span>
              </div>
            </div>

            {/* 3. Academic Programs & Cohorts */}
            <div className={`p-5 rounded-2xl border transition-all ${
              enabledModules.courses
                ? 'bg-surface border-outline-variant shadow-xs'
                : 'bg-surface-container-lowest border-outline-variant/60 opacity-80'
            }`}>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    enabledModules.courses ? 'bg-primary/10 text-primary' : 'bg-surface-container text-secondary'
                  }`}>
                    <span className="material-symbols-outlined text-[22px]">menu_book</span>
                  </div>
                  <div>
                    <h4 className="font-title-md text-base font-bold text-on-surface">Programs, Cohorts &amp; Curricula</h4>
                    <p className="text-[11px] text-secondary">Course syllabus builder, cohort batch schedules &amp; tuition pricing in ₦</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleToggleModule('courses')}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    enabledModules.courses ? 'bg-primary' : 'bg-outline-variant'
                  }`}
                  role="switch"
                  aria-checked={enabledModules.courses}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      enabledModules.courses ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 pt-3 border-t border-outline-variant/60 text-[11px]">
                <span className={`px-2 py-0.5 rounded font-bold uppercase tracking-wider text-[10px] ${
                  enabledModules.courses ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                }`}>
                  {enabledModules.courses ? '● Active & Live' : '○ Scheduled for Launch'}
                </span>
                <span className="text-secondary">Route: <code>/courses</code></span>
              </div>
            </div>

            {/* 4. Enrolled Students & Records */}
            <div className={`p-5 rounded-2xl border transition-all ${
              enabledModules.students
                ? 'bg-surface border-outline-variant shadow-xs'
                : 'bg-surface-container-lowest border-outline-variant/60 opacity-80'
            }`}>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    enabledModules.students ? 'bg-primary/10 text-primary' : 'bg-surface-container text-secondary'
                  }`}>
                    <span className="material-symbols-outlined text-[22px]">school</span>
                  </div>
                  <div>
                    <h4 className="font-title-md text-base font-bold text-on-surface">Enrolled Students &amp; Billing</h4>
                    <p className="text-[11px] text-secondary">Student directory, matriculation credentials, tuition installment invoices &amp; records</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleToggleModule('students')}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    enabledModules.students ? 'bg-primary' : 'bg-outline-variant'
                  }`}
                  role="switch"
                  aria-checked={enabledModules.students}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      enabledModules.students ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 pt-3 border-t border-outline-variant/60 text-[11px]">
                <span className={`px-2 py-0.5 rounded font-bold uppercase tracking-wider text-[10px] ${
                  enabledModules.students ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                }`}>
                  {enabledModules.students ? '● Active & Live' : '○ Scheduled for Launch'}
                </span>
                <span className="text-secondary">Route: <code>/students</code></span>
              </div>
            </div>

            {/* 5. Faculty Mentors & 37% Revenue Share */}
            <div className={`p-5 rounded-2xl border transition-all ${
              enabledModules.mentors
                ? 'bg-surface border-outline-variant shadow-xs'
                : 'bg-surface-container-lowest border-outline-variant/60 opacity-80'
            }`}>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    enabledModules.mentors ? 'bg-primary/10 text-primary' : 'bg-surface-container text-secondary'
                  }`}>
                    <span className="material-symbols-outlined text-[22px]">groups</span>
                  </div>
                  <div>
                    <h4 className="font-title-md text-base font-bold text-on-surface">Faculty Mentors &amp; 37% Revenue Share</h4>
                    <p className="text-[11px] text-secondary">Faculty recruitment, 1-on-1 coaching logs, 37% commission calculation &amp; Paystack payouts</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleToggleModule('mentors')}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    enabledModules.mentors ? 'bg-primary' : 'bg-outline-variant'
                  }`}
                  role="switch"
                  aria-checked={enabledModules.mentors}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      enabledModules.mentors ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 pt-3 border-t border-outline-variant/60 text-[11px]">
                <span className={`px-2 py-0.5 rounded font-bold uppercase tracking-wider text-[10px] ${
                  enabledModules.mentors ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                }`}>
                  {enabledModules.mentors ? '● Active & Live' : '○ Scheduled for Launch'}
                </span>
                <span className="text-secondary">Routes: <code>/mentors</code>, <code>/student/mentor</code></span>
              </div>
            </div>

            {/* 6. Geofenced Staff Attendance */}
            <div className={`p-5 rounded-2xl border transition-all ${
              enabledModules.attendance
                ? 'bg-surface border-outline-variant shadow-xs'
                : 'bg-surface-container-lowest border-outline-variant/60 opacity-80'
            }`}>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    enabledModules.attendance ? 'bg-primary/10 text-primary' : 'bg-surface-container text-secondary'
                  }`}>
                    <span className="material-symbols-outlined text-[22px]">schedule</span>
                  </div>
                  <div>
                    <h4 className="font-title-md text-base font-bold text-on-surface">Staff Attendance &amp; Geofencing</h4>
                    <p className="text-[11px] text-secondary">GPS clock-in/out, Victoria Island &amp; Yaba geofence radius &amp; punctuality tracking</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleToggleModule('attendance')}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    enabledModules.attendance ? 'bg-primary' : 'bg-outline-variant'
                  }`}
                  role="switch"
                  aria-checked={enabledModules.attendance}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      enabledModules.attendance ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 pt-3 border-t border-outline-variant/60 text-[11px]">
                <span className={`px-2 py-0.5 rounded font-bold uppercase tracking-wider text-[10px] ${
                  enabledModules.attendance ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                }`}>
                  {enabledModules.attendance ? '● Active & Live' : '○ Scheduled for Launch'}
                </span>
                <span className="text-secondary">Route: <code>/attendance</code></span>
              </div>
            </div>

            {/* 7. OpEx Requisitions & Financial Approvals */}
            <div className={`p-5 rounded-2xl border transition-all ${
              enabledModules.expenses
                ? 'bg-surface border-outline-variant shadow-xs'
                : 'bg-surface-container-lowest border-outline-variant/60 opacity-80'
            }`}>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    enabledModules.expenses ? 'bg-primary/10 text-primary' : 'bg-surface-container text-secondary'
                  }`}>
                    <span className="material-symbols-outlined text-[22px]">payments</span>
                  </div>
                  <div>
                    <h4 className="font-title-md text-base font-bold text-on-surface">OpEx Requisitions &amp; Approvals</h4>
                    <p className="text-[11px] text-secondary">Operating expense submissions, receipt uploads, urgency flags &amp; bursary approvals</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleToggleModule('expenses')}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    enabledModules.expenses ? 'bg-primary' : 'bg-outline-variant'
                  }`}
                  role="switch"
                  aria-checked={enabledModules.expenses}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      enabledModules.expenses ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 pt-3 border-t border-outline-variant/60 text-[11px]">
                <span className={`px-2 py-0.5 rounded font-bold uppercase tracking-wider text-[10px] ${
                  enabledModules.expenses ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                }`}>
                  {enabledModules.expenses ? '● Active & Live' : '○ Scheduled for Launch'}
                </span>
                <span className="text-secondary">Route: <code>/expenses</code></span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: STAFF & ROLE SECURITY */}
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
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-on-surface mb-1">Initial Access Password (Optional)</label>
                    <input
                      type="password"
                      value={newStaffPassword}
                      onChange={(e) => setNewStaffPassword(e.target.value)}
                      placeholder="Leave blank or enter initial password (default: password123)"
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
                    className="h-8 px-4 rounded bg-primary text-white text-xs font-bold hover:bg-primary/90 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">send</span>
                    <span>Provision &amp; Send Setup Email</span>
                  </button>
                </div>
              </form>
            )}

            {/* My Account Password Security Box */}
            <div className="p-4 rounded-lg bg-surface border border-outline-variant flex flex-wrap justify-between items-center gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">lock</span>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-on-surface">Your Account Security &amp; Password</h4>
                  <p className="text-[11px] text-secondary">Logged in as <strong>{currentUser?.name}</strong> ({currentUser?.email})</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => openModal('change-password')}
                className="h-8 px-3 rounded bg-primary text-white text-xs font-bold hover:bg-primary/90 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <span className="material-symbols-outlined text-[16px]">lock_reset</span>
                <span>Change My Password</span>
              </button>
            </div>

            {/* Staff Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-outline-variant/60 bg-surface-container-low text-secondary text-[11px] uppercase tracking-wider font-data-tabular">
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
                      <td className="p-3 text-secondary font-data-tabular">{user.email}</td>
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
                        <div className="flex items-center justify-end gap-1.5">
                          {currentUser?.id === user.id && (
                            <button
                              onClick={() => openModal('change-password')}
                              className="px-2 py-1 rounded bg-surface border border-outline-variant text-on-surface hover:bg-surface-container font-semibold text-[11px] transition-colors inline-flex items-center gap-1 cursor-pointer"
                              title="Change Password"
                            >
                              <span className="material-symbols-outlined text-[13px]">lock_reset</span>
                              <span>Reset Password</span>
                            </button>
                          )}
                          <button
                            onClick={() => sendStaffWelcomeEmail(user.id)}
                            className="px-2.5 py-1 rounded bg-secondary-container/40 text-primary hover:bg-secondary-container font-semibold text-[11px] transition-colors inline-flex items-center gap-1 cursor-pointer"
                            title="Resend Password Setup Email"
                          >
                            <span className="material-symbols-outlined text-[14px]">mail</span>
                            <span>Send Setup Link</span>
                          </button>
                        </div>
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
      {/* TAB 3: EMAIL & SMTP DISPATCH CENTER (FULLY CUSTOMIZABLE) */}
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
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold font-data-tabular ${
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
                  className="w-full h-9 px-3 rounded bg-surface border border-outline-variant font-data-tabular outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block font-semibold text-on-surface mb-1">Port</label>
                <input
                  type="number"
                  value={smtpPort}
                  onChange={(e) => setSmtpPort(Number(e.target.value))}
                  placeholder="465 or 587"
                  className="w-full h-9 px-3 rounded bg-surface border border-outline-variant font-data-tabular outline-none focus:border-primary"
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

          {/* Interactive & Editable Template Dispatcher */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-xs space-y-6">
            <div className="border-b border-outline-variant pb-3 flex justify-between items-center">
              <div>
                <h3 className="font-headline-sm text-base font-bold text-on-surface">
                  Customizable Email Template &amp; Live Dispatcher
                </h3>
                <p className="text-xs text-secondary mt-0.5">
                  Select a template, customize any data field in real-time, and preview or dispatch live emails.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleSelectTemplate(selectedEmailTemplate)}
                className="text-xs text-primary hover:underline font-semibold flex items-center gap-1"
                title="Reset this template's values to defaults"
              >
                <span className="material-symbols-outlined text-[14px]">restart_alt</span>
                <span>Reset Fields</span>
              </button>
            </div>

            {/* Template Selector Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {[
                { type: 'student_welcome', label: '1. Student Welcome', icon: 'school' },
                { type: 'mentor_welcome', label: '2. Mentor Appt', icon: 'person_celebrate' },
                { type: 'staff_welcome', label: '3. Staff Invite', icon: 'badge' },
                { type: 'payment_reminder', label: '4. Tuition Reminder', icon: 'payments' },
                { type: 'invoice_receipt', label: '5. Invoice & Receipt', icon: 'receipt_long' },
                { type: 'session_confirmation', label: '6. Coaching Session', icon: 'groups' },
                { type: 'password_reset', label: '7. Password Reset', icon: 'lock_reset' },
                { type: 'expense_approval_request', label: '8. OpEx Approval Req', icon: 'pending_actions' },
                { type: 'expense_approved', label: '9. OpEx Approved', icon: 'check_circle' },
                { type: 'expense_rejected', label: '10. OpEx Declined', icon: 'cancel' },
                { type: 'mentor_commission_earned', label: '11. 37% Commission', icon: 'savings' },
                { type: 'mentor_payout_disbursed', label: '12. Mentor Payout', icon: 'account_balance_wallet' },
                { type: 'lab_assignment_submitted', label: '13. Lab Deliverable', icon: 'assignment_turned_in' },
                { type: 'lab_assignment_graded', label: '14. Lab Evaluation', icon: 'grade' },
                { type: 'new_mentee_assigned', label: '15. New Mentee', icon: 'person_add' },
                { type: 'proof_of_payment_alert', label: '16. Bank POP Slip', icon: 'document_scanner' },
                { type: 'tuition_payment_alert', label: '17. Tuition Audit', icon: 'analytics' },
              ].map((t) => {
                const isCustom = Boolean(settings.customEmailTemplates?.[t.type as EmailTemplatePayload['type']]);
                return (
                  <button
                    key={t.type}
                    type="button"
                    onClick={() => handleSelectTemplate(t.type as EmailTemplatePayload['type'])}
                    className={`p-2.5 rounded-lg border text-left text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer relative ${
                      selectedEmailTemplate === t.type
                        ? 'border-primary bg-primary text-white shadow-xs'
                        : 'border-outline-variant bg-surface hover:bg-surface-container text-on-surface'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">{t.icon}</span>
                    <span className="truncate">{t.label}</span>
                    {isCustom && (
                      <span className="w-2 h-2 rounded-full bg-emerald-400 absolute top-1 right-1" title="Saved custom template" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Main 2-Column: Left = Form Inputs (Customizer), Right = Live Preview */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
              {/* LEFT COLUMN: CUSTOMIZATION EDITOR */}
              <div className="lg:col-span-5 space-y-4">
                <div className="bg-surface border border-outline-variant/80 rounded-xl p-4 space-y-3 shadow-xs">
                  <h4 className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5 border-b border-outline-variant pb-2">
                    <span className="material-symbols-outlined text-[16px]">tune</span>
                    <span>1. Dispatch &amp; Recipient Target</span>
                  </h4>

                  <div>
                    <label className="block text-xs font-semibold text-on-surface mb-1">Target Recipient Email</label>
                    <input
                      type="email"
                      value={testRecipientEmail}
                      onChange={(e) => setTestRecipientEmail(e.target.value)}
                      placeholder="recipient@example.com"
                      className="w-full h-9 px-3 rounded bg-surface-container-lowest border border-outline-variant text-xs outline-none focus:border-primary font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-on-surface mb-1">Recipient Name</label>
                    <input
                      type="text"
                      value={testRecipientName}
                      onChange={(e) => setTestRecipientName(e.target.value)}
                      placeholder="e.g. Abiola Adefowope"
                      className="w-full h-9 px-3 rounded bg-surface-container-lowest border border-outline-variant text-xs outline-none focus:border-primary font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-on-surface mb-1">Email Subject Line</label>
                    <input
                      type="text"
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                      className="w-full h-9 px-3 rounded bg-surface-container-lowest border border-outline-variant text-xs outline-none focus:border-primary font-medium"
                    />
                  </div>
                </div>

                {/* TEMPLATE SPECIFIC CUSTOMIZABLE FORM */}
                <div className="bg-surface border border-outline-variant/80 rounded-xl p-4 space-y-3 shadow-xs">
                  <h4 className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5 border-b border-outline-variant pb-2">
                    <span className="material-symbols-outlined text-[16px]">edit_document</span>
                    <span>2. Template Content Customizer</span>
                  </h4>

                  {/* 1. Student Welcome Fields */}
                  {selectedEmailTemplate === 'student_welcome' && (
                    <div className="space-y-3 animate-in fade-in">
                      <div className="p-3 bg-primary/5 rounded-lg border border-primary/20 text-xs text-primary font-medium flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm">info</span>
                        <span>Dispatched automatically to students upon enrollment &amp; lead conversion.</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs font-semibold text-on-surface mb-1">Student Matric ID</label>
                          <input
                            type="text"
                            value={reminderStudentCode}
                            onChange={(e) => setReminderStudentCode(e.target.value)}
                            className="w-full h-8 px-2.5 rounded bg-surface-container-lowest border border-outline-variant text-xs outline-none focus:border-primary font-data-tabular"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-on-surface mb-1">Admitted Track</label>
                          <input
                            type="text"
                            value={reminderProgram}
                            onChange={(e) => setReminderProgram(e.target.value)}
                            className="w-full h-8 px-2.5 rounded bg-surface-container-lowest border border-outline-variant text-xs outline-none focus:border-primary"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-on-surface mb-1">Assigned Faculty Mentor</label>
                        <input
                          type="text"
                          value={sessionMentorName}
                          onChange={(e) => setSessionMentorName(e.target.value)}
                          className="w-full h-8 px-2.5 rounded bg-surface-container-lowest border border-outline-variant text-xs outline-none focus:border-primary"
                        />
                      </div>
                    </div>
                  )}

                  {/* 2. Mentor Appointment / Welcome Fields */}
                  {selectedEmailTemplate === 'mentor_welcome' && (
                    <div className="space-y-3 animate-in fade-in">
                      <div className="p-3 bg-primary/5 rounded-lg border border-primary/20 text-xs text-primary font-medium flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm">handshake</span>
                        <span>Dispatched automatically to newly recruited mentors upon contract creation.</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs font-semibold text-on-surface mb-1">Faculty ID</label>
                          <input
                            type="text"
                            value={mentorFacultyId}
                            onChange={(e) => setMentorFacultyId(e.target.value)}
                            className="w-full h-8 px-2.5 rounded bg-surface-container-lowest border border-outline-variant text-xs outline-none focus:border-primary font-data-tabular"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-on-surface mb-1">Specialized Department</label>
                          <input
                            type="text"
                            value={mentorDepartment}
                            onChange={(e) => setMentorDepartment(e.target.value)}
                            className="w-full h-8 px-2.5 rounded bg-surface-container-lowest border border-outline-variant text-xs outline-none focus:border-primary"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-on-surface mb-1">Assigned Course Tracks</label>
                        <input
                          type="text"
                          value={mentorCourses}
                          onChange={(e) => setMentorCourses(e.target.value)}
                          className="w-full h-8 px-2.5 rounded bg-surface-container-lowest border border-outline-variant text-xs outline-none focus:border-primary"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs font-semibold text-on-surface mb-1">Remuneration Policy</label>
                          <input
                            type="text"
                            value={mentorCommissionRate}
                            onChange={(e) => setMentorCommissionRate(e.target.value)}
                            className="w-full h-8 px-2.5 rounded bg-surface-container-lowest border border-outline-variant text-xs outline-none focus:border-primary"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-on-surface mb-1">Disbursement Account</label>
                          <input
                            type="text"
                            value={mentorBankDetails}
                            onChange={(e) => setMentorBankDetails(e.target.value)}
                            className="w-full h-8 px-2.5 rounded bg-surface-container-lowest border border-outline-variant text-xs outline-none focus:border-primary"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 3. Staff Welcome Fields */}
                  {selectedEmailTemplate === 'staff_welcome' && (
                    <div className="space-y-3 animate-in fade-in">
                      <div>
                        <label className="block text-xs font-semibold text-on-surface mb-1">Staff Role Title</label>
                        <input
                          type="text"
                          value={welcomeRoleTitle}
                          onChange={(e) => setWelcomeRoleTitle(e.target.value)}
                          className="w-full h-8 px-2.5 rounded bg-surface-container-lowest border border-outline-variant text-xs outline-none focus:border-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-on-surface mb-1">Department</label>
                        <input
                          type="text"
                          value={welcomeDept}
                          onChange={(e) => setWelcomeDept(e.target.value)}
                          className="w-full h-8 px-2.5 rounded bg-surface-container-lowest border border-outline-variant text-xs outline-none focus:border-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-on-surface mb-1">Password Setup Base URL</label>
                        <input
                          type="text"
                          value={welcomeSetupUrl}
                          onChange={(e) => setWelcomeSetupUrl(e.target.value)}
                          className="w-full h-8 px-2.5 rounded bg-surface-container-lowest border border-outline-variant text-xs outline-none focus:border-primary font-data-tabular"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-on-surface mb-1">Custom Welcome Body Note</label>
                        <textarea
                          rows={2}
                          value={welcomeNote}
                          onChange={(e) => setWelcomeNote(e.target.value)}
                          className="w-full p-2 rounded bg-surface-container-lowest border border-outline-variant text-xs outline-none focus:border-primary"
                        />
                      </div>
                    </div>
                  )}

                  {/* 2. Payment Reminder Fields */}
                  {selectedEmailTemplate === 'payment_reminder' && (
                    <div className="space-y-3 animate-in fade-in">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs font-semibold text-on-surface mb-1">Student ID Code</label>
                          <input
                            type="text"
                            value={reminderStudentCode}
                            onChange={(e) => setReminderStudentCode(e.target.value)}
                            className="w-full h-8 px-2.5 rounded bg-surface-container-lowest border border-outline-variant text-xs outline-none focus:border-primary font-data-tabular"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-on-surface mb-1">Outstanding Balance (₦)</label>
                          <input
                            type="number"
                            value={reminderBalance}
                            onChange={(e) => setReminderBalance(Number(e.target.value))}
                            className="w-full h-8 px-2.5 rounded bg-surface-container-lowest border border-outline-variant text-xs outline-none focus:border-primary font-bold text-[#991b1b]"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-on-surface mb-1">Program Track</label>
                        <input
                          type="text"
                          value={reminderProgram}
                          onChange={(e) => setReminderProgram(e.target.value)}
                          className="w-full h-8 px-2.5 rounded bg-surface-container-lowest border border-outline-variant text-xs outline-none focus:border-primary"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs font-semibold text-on-surface mb-1">Due Date</label>
                          <input
                            type="text"
                            value={reminderDueDate}
                            onChange={(e) => setReminderDueDate(e.target.value)}
                            className="w-full h-8 px-2.5 rounded bg-surface-container-lowest border border-outline-variant text-xs outline-none focus:border-primary"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-on-surface mb-1">NUBAN Account</label>
                          <input
                            type="text"
                            value={reminderAccountNum}
                            onChange={(e) => setReminderAccountNum(e.target.value)}
                            className="w-full h-8 px-2.5 rounded bg-surface-container-lowest border border-outline-variant text-xs outline-none focus:border-primary font-data-tabular font-bold"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-on-surface mb-1">Settlement Bank &amp; Name</label>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={reminderBankName}
                            onChange={(e) => setReminderBankName(e.target.value)}
                            className="w-full h-8 px-2.5 rounded bg-surface-container-lowest border border-outline-variant text-xs outline-none focus:border-primary"
                          />
                          <input
                            type="text"
                            value={reminderAccountName}
                            onChange={(e) => setReminderAccountName(e.target.value)}
                            className="w-full h-8 px-2.5 rounded bg-surface-container-lowest border border-outline-variant text-xs outline-none focus:border-primary"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-on-surface mb-1">Payment Notice Intro</label>
                        <textarea
                          rows={2}
                          value={reminderNote}
                          onChange={(e) => setReminderNote(e.target.value)}
                          className="w-full p-2 rounded bg-surface-container-lowest border border-outline-variant text-xs outline-none focus:border-primary"
                        />
                      </div>
                    </div>
                  )}

                  {/* 3. Tuition Invoice Fields */}
                  {selectedEmailTemplate === 'invoice_receipt' && (
                    <div className="space-y-3 animate-in fade-in">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs font-semibold text-on-surface mb-1">Invoice Number</label>
                          <input
                            type="text"
                            value={invoiceNum}
                            onChange={(e) => setInvoiceNum(e.target.value)}
                            className="w-full h-8 px-2.5 rounded bg-surface-container-lowest border border-outline-variant text-xs outline-none focus:border-primary font-data-tabular"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-on-surface mb-1">Invoice Status</label>
                          <select
                            value={invoiceStatus}
                            onChange={(e) => setInvoiceStatus(e.target.value)}
                            className="w-full h-8 px-2.5 rounded bg-surface-container-lowest border border-outline-variant text-xs outline-none focus:border-primary font-bold"
                          >
                            <option value="Paid">Paid</option>
                            <option value="Pending">Pending</option>
                            <option value="Partial">Partial</option>
                            <option value="Overdue">Overdue</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs font-semibold text-on-surface mb-1">Program Name</label>
                          <input
                            type="text"
                            value={invoiceProg}
                            onChange={(e) => setInvoiceProg(e.target.value)}
                            className="w-full h-8 px-2.5 rounded bg-surface-container-lowest border border-outline-variant text-xs outline-none focus:border-primary"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-on-surface mb-1">Billed Amount (₦)</label>
                          <input
                            type="number"
                            value={invoiceAmt}
                            onChange={(e) => setInvoiceAmt(Number(e.target.value))}
                            className="w-full h-8 px-2.5 rounded bg-surface-container-lowest border border-outline-variant text-xs outline-none focus:border-primary font-data-tabular font-bold text-primary"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-on-surface mb-1">Payment Reference Code</label>
                        <input
                          type="text"
                          value={invoicePayRef}
                          onChange={(e) => setInvoicePayRef(e.target.value)}
                          className="w-full h-8 px-2.5 rounded bg-surface-container-lowest border border-outline-variant text-xs outline-none focus:border-primary font-data-tabular"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-on-surface mb-1">Invoice Remarks Note</label>
                        <textarea
                          rows={2}
                          value={invoiceNoteText}
                          onChange={(e) => setInvoiceNoteText(e.target.value)}
                          className="w-full p-2 rounded bg-surface-container-lowest border border-outline-variant text-xs outline-none focus:border-primary"
                        />
                      </div>
                    </div>
                  )}

                  {/* 4. Mentorship Session Fields */}
                  {selectedEmailTemplate === 'session_confirmation' && (
                    <div className="space-y-3 animate-in fade-in">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs font-semibold text-on-surface mb-1">Faculty Mentor</label>
                          <input
                            type="text"
                            value={sessionMentorName}
                            onChange={(e) => setSessionMentorName(e.target.value)}
                            className="w-full h-8 px-2.5 rounded bg-surface-container-lowest border border-outline-variant text-xs outline-none focus:border-primary font-semibold"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-on-surface mb-1">Honorarium Payout (₦)</label>
                          <input
                            type="number"
                            value={sessionCompensation}
                            onChange={(e) => setSessionCompensation(Number(e.target.value))}
                            className="w-full h-8 px-2.5 rounded bg-surface-container-lowest border border-outline-variant text-xs outline-none focus:border-primary font-bold text-[#166534]"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-on-surface mb-1">Session Topic / Curriculum Milestone</label>
                        <input
                          type="text"
                          value={sessionTopicTitle}
                          onChange={(e) => setSessionTopicTitle(e.target.value)}
                          className="w-full h-8 px-2.5 rounded bg-surface-container-lowest border border-outline-variant text-xs outline-none focus:border-primary"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs font-semibold text-on-surface mb-1">Duration (Hours)</label>
                          <input
                            type="number"
                            value={sessionHours}
                            onChange={(e) => setSessionHours(Number(e.target.value))}
                            className="w-full h-8 px-2.5 rounded bg-surface-container-lowest border border-outline-variant text-xs outline-none focus:border-primary"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-on-surface mb-1">Location / Meeting Link</label>
                          <input
                            type="text"
                            value={sessionVenue}
                            onChange={(e) => setSessionVenue(e.target.value)}
                            className="w-full h-8 px-2.5 rounded bg-surface-container-lowest border border-outline-variant text-xs outline-none focus:border-primary"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 5. Password Reset Fields */}
                  {selectedEmailTemplate === 'password_reset' && (
                    <div className="space-y-3 animate-in fade-in">
                      <div>
                        <label className="block text-xs font-semibold text-on-surface mb-1">Password Reset URL</label>
                        <input
                          type="text"
                          value={resetLinkUrl}
                          onChange={(e) => setResetLinkUrl(e.target.value)}
                          className="w-full h-8 px-2.5 rounded bg-surface-container-lowest border border-outline-variant text-xs outline-none focus:border-primary font-data-tabular"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-on-surface mb-1">Expiry Duration</label>
                        <input
                          type="text"
                          value={resetExpiry}
                          onChange={(e) => setResetExpiry(e.target.value)}
                          className="w-full h-8 px-2.5 rounded bg-surface-container-lowest border border-outline-variant text-xs outline-none focus:border-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-on-surface mb-1">Security Notice Message</label>
                        <textarea
                          rows={2}
                          value={resetSecurityNote}
                          onChange={(e) => setResetSecurityNote(e.target.value)}
                          className="w-full p-2 rounded bg-surface-container-lowest border border-outline-variant text-xs outline-none focus:border-primary"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2 pt-1">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={handleSaveTemplateCustomization}
                      className="w-full h-10 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[18px]">save</span>
                      <span>Save Template Customizations</span>
                    </button>

                    {settings.customEmailTemplates?.[selectedEmailTemplate] ? (
                      <button
                        type="button"
                        onClick={handleResetTemplateToDefault}
                        className="w-full h-10 rounded-xl border border-outline-variant text-secondary hover:text-error hover:bg-surface-container font-semibold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        title="Revert this template to standard built-in format"
                      >
                        <span className="material-symbols-outlined text-[16px]">restore</span>
                        <span>Reset to Default Format</span>
                      </button>
                    ) : (
                      <div className="flex items-center justify-center text-[11px] text-secondary font-medium px-2 py-1 bg-surface-container-low rounded-xl border border-outline-variant/60">
                        <span>Using Standard Template</span>
                      </div>
                    )}
                  </div>

                  {saveTemplateSuccess && (
                    <div className="p-2.5 bg-[#dcfce7] border border-[#86efac] text-[#166534] rounded-lg text-xs font-bold flex items-center gap-1.5 animate-in fade-in">
                      <span className="material-symbols-outlined text-[18px]">check_circle</span>
                      <span>Template Customization Saved! Future automated emails will use this version.</span>
                    </div>
                  )}

                  {/* Dispatch Button */}
                  <button
                    onClick={handleSendTestEmail}
                    disabled={isSendingEmail}
                    className="w-full h-11 rounded-xl bg-primary hover:bg-primary/90 text-on-primary font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-[20px]">send</span>
                    <span>{isSendingEmail ? 'Dispatching Custom Email...' : 'Dispatch Live Email with Custom Data'}</span>
                  </button>
                </div>
              </div>

              {/* RIGHT COLUMN: LIVE REAL-TIME HTML RENDER PREVIEW */}
              <div className="lg:col-span-7 space-y-2">
                <div className="flex justify-between items-center px-1">
                  <span className="text-xs font-bold text-secondary uppercase tracking-wider flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-primary">visibility</span>
                    <span>Live HTML Preview (Updates in Real-Time)</span>
                  </span>
                  <span className="text-[11px] font-data-tabular text-secondary">
                    Nexus Transactional Engine
                  </span>
                </div>

                <div className="border border-outline-variant rounded-xl overflow-hidden shadow-inner bg-[#f1f5f9] h-[580px]">
                  <iframe
                    title="Email Preview"
                    srcDoc={activeEmailPreviewHtml}
                    className="w-full h-full border-none"
                  />
                </div>
              </div>
            </div>

            {/* Email Dispatch Audit Log Stream */}
            {emailLogs.length > 0 && (
              <div className="pt-4 border-t border-outline-variant space-y-2">
                <h4 className="text-xs font-bold text-on-surface uppercase tracking-wider">
                  Recent Email Dispatch Stream
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
                        <span className="font-data-tabular text-[10px] text-secondary">{log.timestamp}</span>
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

            <div className="p-3 rounded-lg bg-surface border border-outline-variant text-[11px] text-secondary space-y-1 font-data-tabular">
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
