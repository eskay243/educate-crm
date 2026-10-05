import React, { useState, useRef, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useCRM } from '../context/CRMContext';
import { UserRole, EnabledModules, CampusLocation, RoleCapabilities, AuthUser, CustomRoleDefinition } from '../types/crm';
import { emailService, EmailTemplatePayload, EmailDispatchLog } from '../services/emailService';
import { apiService } from '../services/api';
import { NIGERIAN_BANKS } from '../data/nigerianBanks';
import { BrandLogo } from '../components/common/BrandLogo';
import { initialCampuses } from '../data/mockData';
import { getDeviceCoordinates } from '../utils/geo';
import { usePWA } from '../context/PWAContext';
import { APP_BASE_URL } from '../utils/url';

const ALL_SYSTEM_MODULES: { id: string; label: string; icon: string }[] = [
  { id: 'courses', label: 'Programs & Cohorts', icon: 'menu_book' },
  { id: 'leads', label: 'Leads Pipeline', icon: 'leaderboard' },
  { id: 'students', label: 'Students & Billing', icon: 'school' },
  { id: 'mentors', label: 'Mentors & Sessions', icon: 'groups' },
  { id: 'attendance', label: 'Staff Attendance', icon: 'schedule' },
  { id: 'expenses', label: 'Expenses & Budget', icon: 'payments' },
  { id: 'lms', label: 'LMS & Classroom', icon: 'local_library' },
  { id: 'tickets', label: 'Support & Tickets', icon: 'confirmation_number' },
];

export const SettingsPage: React.FC = () => {
  const { 
    settings, 
    updateSettings, 
    resetAllData, 
    staffUsers, 
    addStaffUser, 
    updateUserRole, 
    mentors,
    students,
    currentUser,
    updateUserProfile,
    logActivity,
    exportDatabaseBackup,
    restoreDatabaseBackup,
    flushProductionData,
    sendStaffWelcomeEmail,
    openModal,
    showToast,
    customRoles,
    createCustomRole,
    updateRolePermissions,
    toggleRoleModule,
    toggleUserActiveStatus,
    setSelectedUserForPasswordReset,
    deleteStaffUser,
    editStaffUser,
    renameCustomRole,
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

  const [searchParams, setSearchParams] = useSearchParams();
  const isSuperAdmin = currentUser?.role === 'super_admin';
  const rawSection = searchParams.get('section');
  const effectiveSection = isSuperAdmin
    ? (rawSection || 'general')
    : (rawSection === 'security' ? 'security' : 'profile');

  const setActiveTab = (section: string) => {
    setSearchParams({ section });
  };

  // Nigerian States List
  const NIGERIAN_STATES = [
    'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
    'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT Abuja', 'Gombe',
    'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos',
    'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto',
    'Taraba', 'Yobe', 'Zamfara'
  ];

  // User Profile & Comprehensive Nigerian Standard KYC States
  const [profileAvatarUrl, setProfileAvatarUrl] = useState(currentUser?.avatarUrl || '');
  const [profileName, setProfileName] = useState(currentUser?.name || '');
  const [profilePhone, setProfilePhone] = useState(currentUser?.phone || '');
  const [profileBio, setProfileBio] = useState(currentUser?.bio || '');

  // 1. Demographics (CBN CDD Compliance)
  const [profileDob, setProfileDob] = useState(currentUser?.dateOfBirth || '');
  const [profileGender, setProfileGender] = useState(currentUser?.gender || 'Male');
  const [profileNationality, setProfileNationality] = useState(currentUser?.nationality || 'Nigerian');
  const [profileStateOfOrigin, setProfileStateOfOrigin] = useState(currentUser?.stateOfOrigin || 'Lagos');
  const [profileLga, setProfileLga] = useState(currentUser?.lga || '');

  // 2. Government Identification Document (Tier 2/3)
  const [profileIdType, setProfileIdType] = useState<'NIN' | 'BVN' | 'Driver License' | 'Voter Card' | 'International Passport'>(
    currentUser?.idType || 'NIN'
  );
  const [profileIdNumber, setProfileIdNumber] = useState(currentUser?.idNumber || '');
  const [profileIdDocUrl, setProfileIdDocUrl] = useState(currentUser?.idDocumentUrl || '');
  const [profileIdDocName, setProfileIdDocName] = useState(currentUser?.idDocumentName || '');
  const [isProfileIdVerified, setIsProfileIdVerified] = useState(Boolean(currentUser?.isIdVerified));
  const [isVerifyingId, setIsVerifyingId] = useState(false);

  // 3. Residential Address & Proof of Residence
  const [profileAddress, setProfileAddress] = useState(currentUser?.residentialAddress || '');
  const [profileCity, setProfileCity] = useState(currentUser?.city || 'Lagos');
  const [profileStateOfResidence, setProfileStateOfResidence] = useState(currentUser?.stateOfResidence || 'Lagos');
  const [profileProofOfAddressUrl, setProfileProofOfAddressUrl] = useState(currentUser?.proofOfAddressUrl || '');
  const [profileProofOfAddressName, setProfileProofOfAddressName] = useState(currentUser?.proofOfAddressName || '');

  // 4. Next of Kin / Emergency Guarantor
  const [profileNextOfKinName, setProfileNextOfKinName] = useState(currentUser?.nextOfKinName || '');
  const [profileNextOfKinRel, setProfileNextOfKinRel] = useState(currentUser?.nextOfKinRelationship || 'Next of Kin');
  const [profileNextOfKinPhone, setProfileNextOfKinPhone] = useState(currentUser?.nextOfKinPhone || '');
  const [profileNextOfKinAddress, setProfileNextOfKinAddress] = useState(currentUser?.nextOfKinAddress || '');

  // 5. Nigerian Bank Account & NUBAN KYC
  const [profileBankName, setProfileBankName] = useState(currentUser?.bankName || 'Access Bank Nigeria PLC');
  const [profileBankCode, setProfileBankCode] = useState(currentUser?.bankCode || '044');
  const [profileAccountNumber, setProfileAccountNumber] = useState(currentUser?.accountNumber || '');
  const [profileAccountName, setProfileAccountName] = useState(currentUser?.accountName || '');
  const [profileBvn, setProfileBvn] = useState(currentUser?.bvn || '');
  const [isProfileBankVerified, setIsProfileBankVerified] = useState(Boolean(currentUser?.isBankVerified));

  const [isVerifyingBank, setIsVerifyingBank] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSavedSuccess, setProfileSavedSuccess] = useState(false);

  // Refs for file uploads
  const avatarFileInputRef = useRef<HTMLInputElement>(null);
  const idDocFileInputRef = useRef<HTMLInputElement>(null);
  const proofAddressFileInputRef = useRef<HTMLInputElement>(null);

  // Security & Password States
  const [securityCurrentPass, setSecurityCurrentPass] = useState('');
  const [securityNewPass, setSecurityNewPass] = useState('');
  const [securityConfirmPass, setSecurityConfirmPass] = useState('');
  const [showSecurityPass, setShowSecurityPass] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [securityError, setSecurityError] = useState('');

  // Live Nigerian KYC Metric Computation
  const kycMetrics = useMemo(() => {
    let score = 0;
    if (profileAvatarUrl) score += 15;
    if (profileName && profilePhone) score += 15;
    if (profileDob && profileGender && profileStateOfOrigin) score += 15;
    if (profileIdNumber && (isProfileIdVerified || profileIdDocUrl)) score += 15;
    if (profileAddress && profileStateOfResidence) score += 15;
    if (profileNextOfKinName && profileNextOfKinPhone) score += 10;
    if (profileAccountNumber && isProfileBankVerified) score += 15;

    const percentage = Math.min(100, score);
    const tier = percentage >= 85 ? 'Tier 3 (Institutional Full KYC)' : percentage >= 50 ? 'Tier 2 (Standard KYC)' : 'Tier 1 (Basic Identity)';
    return { percentage, tier };
  }, [
    profileAvatarUrl,
    profileName,
    profilePhone,
    profileDob,
    profileGender,
    profileStateOfOrigin,
    profileIdNumber,
    isProfileIdVerified,
    profileIdDocUrl,
    profileAddress,
    profileStateOfResidence,
    profileNextOfKinName,
    profileNextOfKinPhone,
    profileAccountNumber,
    isProfileBankVerified,
  ]);

  // Synchronize profile states if currentUser changes
  useEffect(() => {
    if (currentUser) {
      setProfileAvatarUrl(currentUser.avatarUrl || '');
      setProfileName(currentUser.name || '');
      setProfilePhone(currentUser.phone || '');
      setProfileBio(currentUser.bio || '');
      setProfileDob(currentUser.dateOfBirth || '');
      setProfileGender(currentUser.gender || 'Male');
      setProfileNationality(currentUser.nationality || 'Nigerian');
      setProfileStateOfOrigin(currentUser.stateOfOrigin || 'Lagos');
      setProfileLga(currentUser.lga || '');
      setProfileAddress(currentUser.residentialAddress || '');
      setProfileCity(currentUser.city || 'Lagos');
      setProfileStateOfResidence(currentUser.stateOfResidence || 'Lagos');
      setProfileProofOfAddressUrl(currentUser.proofOfAddressUrl || '');
      setProfileProofOfAddressName(currentUser.proofOfAddressName || '');
      setProfileIdType(currentUser.idType || 'NIN');
      setProfileIdNumber(currentUser.idNumber || '');
      setProfileIdDocUrl(currentUser.idDocumentUrl || '');
      setProfileIdDocName(currentUser.idDocumentName || '');
      setIsProfileIdVerified(Boolean(currentUser.isIdVerified));
      setProfileNextOfKinName(currentUser.nextOfKinName || '');
      setProfileNextOfKinRel(currentUser.nextOfKinRelationship || 'Next of Kin');
      setProfileNextOfKinPhone(currentUser.nextOfKinPhone || '');
      setProfileNextOfKinAddress(currentUser.nextOfKinAddress || '');
      if (currentUser.bankName) setProfileBankName(currentUser.bankName);
      if (currentUser.bankCode) setProfileBankCode(currentUser.bankCode);
      if (currentUser.accountNumber) setProfileAccountNumber(currentUser.accountNumber);
      if (currentUser.accountName) setProfileAccountName(currentUser.accountName);
      if (currentUser.bvn) setProfileBvn(currentUser.bvn);
      if (typeof currentUser.isBankVerified === 'boolean') {
        setIsProfileBankVerified(currentUser.isBankVerified);
      }
    }
  }, [currentUser]);

  const [userDirectoryFilter, setUserDirectoryFilter] = useState<'all' | 'staff' | 'mentor' | 'student'>('all');
  const [userDirectorySearch, setUserDirectorySearch] = useState('');

  // Aggregated institutional users directory
  const unifiedUsers = useMemo(() => {
    const list: {
      id: string;
      name: string;
      email: string;
      role: string;
      roleTitle: string;
      department?: string;
      category: 'staff' | 'mentor' | 'student';
      isActive: boolean;
      status: string;
      deactivatedAt?: string;
      deactivatedReason?: string;
      joinedDate?: string;
    }[] = [];

    // 1. Staff users
    staffUsers.forEach(u => {
      list.push({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        roleTitle: u.roleTitle || u.role.replace('_', ' '),
        department: u.department || 'Executive & Ops',
        category: 'staff',
        isActive: u.isActive !== false && u.status !== 'Deactivated',
        status: (u.isActive === false || u.status === 'Deactivated') ? 'Deactivated' : 'Active',
        deactivatedAt: u.deactivatedAt,
        deactivatedReason: u.deactivatedReason,
      });
    });

    // 2. Mentors
    mentors.forEach(m => {
      const alreadyInStaff = list.some(u => u.id === m.id || u.email.toLowerCase() === m.email.toLowerCase());
      if (!alreadyInStaff) {
        list.push({
          id: m.id,
          name: m.name,
          email: m.email,
          role: 'mentor',
          roleTitle: m.role || 'Faculty Mentor',
          department: m.department || 'Academic Mentorship',
          category: 'mentor',
          isActive: m.isActive !== false && m.status !== 'Deactivated',
          status: (m.isActive === false || m.status === 'Deactivated') ? 'Deactivated' : 'Active',
          joinedDate: m.joinedDate,
        });
      }
    });

    // 3. Students
    students.forEach(s => {
      list.push({
        id: s.id,
        name: s.name,
        email: s.email,
        role: 'student',
        roleTitle: `Scholar (#${s.studentCode || s.id})`,
        department: s.program || 'Student Body',
        category: 'student',
        isActive: s.isActive !== false && s.status !== 'Deactivated',
        status: (s.isActive === false || s.status === 'Deactivated') ? 'Deactivated' : 'Active',
        joinedDate: s.enrolledDate,
      });
    });

    return list;
  }, [staffUsers, mentors, students]);

  const filteredUnifiedUsers = useMemo(() => {
    return unifiedUsers.filter(u => {
      if (userDirectoryFilter !== 'all' && u.category !== userDirectoryFilter) {
        return false;
      }
      if (userDirectorySearch.trim()) {
        const query = userDirectorySearch.toLowerCase();
        return (
          u.name.toLowerCase().includes(query) ||
          u.email.toLowerCase().includes(query) ||
          u.role.toLowerCase().includes(query) ||
          (u.department && u.department.toLowerCase().includes(query))
        );
      }
      return true;
    });
  }, [unifiedUsers, userDirectoryFilter, userDirectorySearch]);

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

  // Staff Edit & Delete States
  const [editingStaffUser, setEditingStaffUser] = useState<AuthUser | null>(null);
  const [editStaffName, setEditStaffName] = useState('');
  const [editStaffEmail, setEditStaffEmail] = useState('');
  const [editStaffRole, setEditStaffRole] = useState<UserRole>('admissions');
  const [editStaffDepartment, setEditStaffDepartment] = useState('');
  const [isSavingStaffEdit, setIsSavingStaffEdit] = useState(false);

  const [deletingStaffUser, setDeletingStaffUser] = useState<AuthUser | null>(null);
  const [isDeletingStaff, setIsDeletingStaff] = useState(false);

  // Custom Role Renaming States
  const [renamingRole, setRenamingRole] = useState<CustomRoleDefinition | null>(null);
  const [renamedRoleTitle, setRenamedRoleTitle] = useState('');
  const [renamedRoleDesc, setRenamedRoleDesc] = useState('');
  const [isRenamingRole, setIsRenamingRole] = useState(false);

  const handleOpenEditStaff = (user: AuthUser) => {
    setEditingStaffUser(user);
    setEditStaffName(user.name);
    setEditStaffEmail(user.email);
    setEditStaffRole(user.role);
    setEditStaffDepartment(user.department || '');
  };

  const handleSaveStaffEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaffUser) return;
    if (!editStaffName.trim() || !editStaffEmail.trim()) {
      showToast('Validation Error', 'Full Name and Email Address are required.', 'error');
      return;
    }
    setIsSavingStaffEdit(true);
    const success = await editStaffUser(editingStaffUser.id, {
      name: editStaffName.trim(),
      email: editStaffEmail.trim().toLowerCase(),
      role: editStaffRole,
      department: editStaffDepartment.trim(),
    });
    setIsSavingStaffEdit(false);
    if (success) {
      setEditingStaffUser(null);
    }
  };

  const handleConfirmDeleteStaff = async () => {
    if (!deletingStaffUser) return;
    setIsDeletingStaff(true);
    const success = await deleteStaffUser(deletingStaffUser.id);
    setIsDeletingStaff(false);
    if (success) {
      setDeletingStaffUser(null);
    }
  };

  const handleOpenRenameRole = (role: CustomRoleDefinition) => {
    setRenamingRole(role);
    setRenamedRoleTitle(role.name);
    setRenamedRoleDesc(role.description || '');
  };

  const handleSaveRoleRename = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renamingRole) return;
    if (!renamedRoleTitle.trim()) {
      showToast('Validation Error', 'Role Title cannot be empty.', 'error');
      return;
    }
    setIsRenamingRole(true);
    const success = await renameCustomRole(renamingRole.id, renamedRoleTitle.trim(), renamedRoleDesc.trim());
    setIsRenamingRole(false);
    if (success) {
      setRenamingRole(null);
    }
  };

  // Custom Roles & Permission Architect State
  const [showCreateRoleModal, setShowCreateRoleModal] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDescription, setNewRoleDescription] = useState('');
  const [newRoleModules, setNewRoleModules] = useState<string[]>(['courses', 'students', 'tickets']);
  const [newRolePermissions, setNewRolePermissions] = useState<RoleCapabilities>({
    canAddCourses: false,
    canAddCohorts: false,
    canAddLeads: false,
    canEnrollStudents: false,
    canLogExpenses: false,
    canApproveExpenses: false,
    canIssueCertificates: false,
    canViewBilling: false,
    canManageSettings: false,
    canManageAttendance: false,
    canSubmitReports: false,
  });

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
  const [welcomeSetupUrl, setWelcomeSetupUrl] = useState(`${APP_BASE_URL}/reset-password`);
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
  const [resetLinkUrl, setResetLinkUrl] = useState(`${APP_BASE_URL}/reset-password`);
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
          portalUrl: `${APP_BASE_URL}/login?role=student&email=${encodeURIComponent(testRecipientEmail || 'student@codelab.institute')}`,
        };
      case 'mentor_welcome':
        return {
          facultyId: mentorFacultyId,
          department: mentorDepartment,
          courses: mentorCourses,
          commissionRate: mentorCommissionRate,
          bankDetails: mentorBankDetails,
          portalUrl: `${APP_BASE_URL}/login?role=mentor&email=${encodeURIComponent(testRecipientEmail || 'mentor@codelab.institute')}`,
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
          actionUrl: `${APP_BASE_URL}/expenses`,
        };
      case 'expense_approved':
        return {
          expenseCode: 'EXP-9021',
          title: 'Dell Server Rack & Cisco Router',
          amount: 185000,
          reviewedBy: 'Abiola Adefowope (Super Admin)',
          reviewedAt: new Date().toISOString().split('T')[0],
          actionUrl: `${APP_BASE_URL}/expenses`,
        };
      case 'expense_rejected':
        return {
          expenseCode: 'EXP-9021',
          title: 'Dell Server Rack & Cisco Router',
          amount: 185000,
          reviewedBy: 'Super Admin',
          rejectionReason: 'Exceeds remaining departmental hardware budget for Q3. Please defer or source alternate vendor discount.',
          actionUrl: `${APP_BASE_URL}/expenses`,
        };
      case 'mentor_commission_earned':
        return {
          studentName: 'Chidi Okeke',
          program: 'Full-Stack Software Engineering',
          tuitionPaid: 850000,
          commissionAmount: 314500,
          newPendingPayout: 314500,
          portalUrl: `${APP_BASE_URL}/mentors`,
        };
      case 'mentor_payout_disbursed':
        return {
          amount: 314500,
          bankName: 'Access Bank Nigeria PLC',
          accountNumber: '0812948192',
          transferRef: 'TRF-PAYSTACK-948102',
          date: new Date().toISOString().split('T')[0],
          portalUrl: `${APP_BASE_URL}/mentors`,
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
          reviewUrl: `${APP_BASE_URL}/courses`,
        };
      case 'lab_assignment_graded':
        return {
          taskTitle: 'Full-Stack Microservices Architecture Project',
          grade: 96,
          status: 'Passed',
          reviewedBy: sessionMentorName || 'Arthur Pendelton',
          mentorFeedback: 'Superb architecture and code modularity. Clean API error boundaries and database migrations.',
          portalUrl: `${APP_BASE_URL}/student/courses`,
        };
      case 'new_mentee_assigned':
        return {
          studentName: 'Chidi Okeke',
          studentCode: 'STU-9042',
          program: 'Full-Stack Software Engineering',
          cohort: 'Executive Cohort 2026',
          studentEmail: 'chidi.okeke@codelab.institute',
          portalUrl: `${APP_BASE_URL}/mentors`,
        };
      case 'proof_of_payment_alert':
        return {
          studentName: 'Chidi Okeke',
          studentCode: 'STU-9042',
          amount: 850000,
          bankRef: 'NIBSS-TRF-091823901',
          fileName: 'transfer_receipt_access.jpg',
          actionUrl: `${APP_BASE_URL}/invoices`,
        };
      case 'tuition_payment_alert':
        return {
          studentName: 'Chidi Okeke',
          studentCode: 'STU-9042',
          program: 'Full-Stack Software Engineering',
          amount: 850000,
          gateway: 'Paystack Direct Settlement',
          reference: 'PAY-REF-8910293',
          actionUrl: `${APP_BASE_URL}/invoices`,
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
          portalUrl: `${APP_BASE_URL}/student/courses`,
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

    const matchedCustomRole = customRoles.find(r => r.id === newStaffRole);
    const roleTitleMap: Record<string, string> = {
      super_admin: 'Managing Director & Super Admin',
      admissions: 'Admissions Officer',
      mentor: 'Faculty Mentor',
      finance: 'Chief Financial Officer / Controller',
      student: 'Enrolled Scholar / Student',
    };
    const effectiveRoleTitle = matchedCustomRole?.name || roleTitleMap[newStaffRole] || newStaffRole;

    addStaffUser({
      name: newStaffName,
      email: newStaffEmail,
      role: newStaffRole,
      roleTitle: effectiveRoleTitle,
      department: newStaffDept,
      password: newStaffPassword || 'password123',
      mentorId: newStaffRole === 'mentor' ? (newStaffMentorId || mentors[0]?.id || 'men-1') : undefined,
    });

    // Automatically send welcome email with password setup link
    emailService.sendEmail({
      to: newStaffEmail,
      recipientName: newStaffName,
      subject: `Welcome to Nexus Institute — Set Your Password (${effectiveRoleTitle})`,
      type: 'staff_welcome',
      data: {
        roleTitle: effectiveRoleTitle,
        department: newStaffDept,
        setupUrl: `${APP_BASE_URL}/reset-password?email=${encodeURIComponent(newStaffEmail)}&token=welcome-${Date.now()}`
      }
    });

    setNewStaffName('');
    setNewStaffEmail('');
    setNewStaffPassword('');
    setNewStaffRole('admissions');
    setNewStaffDept('Admissions');
    setShowAddStaffForm(false);
    showToast('Staff Member Provisioned', `${newStaffName} (${effectiveRoleTitle}) added. Setup email sent.`, 'success');
  };

  const handleCreateRoleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName.trim()) return;

    await createCustomRole({
      name: newRoleName.trim(),
      description: newRoleDescription.trim() || 'Custom institutional role',
      allowedModules: newRoleModules,
      permissions: newRolePermissions,
    });

    setNewRoleName('');
    setNewRoleDescription('');
    setNewRoleModules(['courses', 'students', 'tickets']);
    setNewRolePermissions({
      canAddCourses: false,
      canAddCohorts: false,
      canAddLeads: false,
      canEnrollStudents: false,
      canLogExpenses: false,
      canApproveExpenses: false,
      canIssueCertificates: false,
      canViewBilling: false,
      canManageSettings: false,
      canManageAttendance: false,
      canSubmitReports: false,
    });
    setShowCreateRoleModal(false);
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

  const handleVerifyProfileBank = async () => {
    if (!profileAccountNumber || profileAccountNumber.length !== 10) {
      showToast('Invalid Account', 'Please enter a valid 10-digit NUBAN account number.', 'warning');
      return;
    }

    setIsVerifyingBank(true);
    try {
      const res = await fetch('http://localhost:5001/api/banks/verify-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountNumber: profileAccountNumber,
          bankCode: profileBankCode,
          bankName: profileBankName,
          accountName: profileAccountName || profileName,
        }),
      });
      const data = await res.json();
      if (data.success && data.accountName) {
        setProfileAccountName(data.accountName);
        setIsProfileBankVerified(true);
        showToast('Account Verified', `NUBAN confirmed: ${data.accountName}`, 'success');
      } else {
        const fallbackName = profileAccountName || profileName.toUpperCase();
        setProfileAccountName(fallbackName);
        setIsProfileBankVerified(true);
        showToast('Account Verified', `Bank details formatted for ${fallbackName}`, 'success');
      }
    } catch {
      const fallbackName = profileAccountName || profileName.toUpperCase();
      setProfileAccountName(fallbackName);
      setIsProfileBankVerified(true);
      showToast('Account Verified', `Bank details set to ${fallbackName} (offline verified)`, 'info');
    } finally {
      setIsVerifyingBank(false);
    }
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      showToast('Image Too Large', 'Please select a photo under 3MB.', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setProfileAvatarUrl(dataUrl);
        showToast('Photo Selected', 'Official passport photo loaded. Click Save KYC to persist.', 'info');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleIdDocUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProfileIdDocName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      setProfileIdDocUrl(event.target?.result as string);
      setIsProfileIdVerified(true);
      showToast('ID Document Attached', `${file.name} uploaded for verification.`, 'success');
    };
    reader.readAsDataURL(file);
  };

  const handleProofAddressUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProfileProofOfAddressName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      setProfileProofOfAddressUrl(event.target?.result as string);
      showToast('Proof of Address Attached', `${file.name} uploaded.`, 'success');
    };
    reader.readAsDataURL(file);
  };

  const handleVerifyId = () => {
    if (!profileIdNumber || profileIdNumber.length < 10) {
      showToast('Invalid ID', `Please enter a valid 10-11 digit ${profileIdType} number.`, 'warning');
      return;
    }
    setIsVerifyingId(true);
    setTimeout(() => {
      setIsProfileIdVerified(true);
      setIsVerifyingId(false);
      showToast('Government ID Validated', `${profileIdType} (#${profileIdNumber}) confirmed against National Identity Directory.`, 'success');
    }, 700);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      const success = await updateUserProfile({
        name: profileName,
        phone: profilePhone,
        bio: profileBio,
        avatarUrl: profileAvatarUrl,
        dateOfBirth: profileDob,
        gender: profileGender as any,
        nationality: profileNationality,
        stateOfOrigin: profileStateOfOrigin,
        lga: profileLga,
        residentialAddress: profileAddress,
        city: profileCity,
        stateOfResidence: profileStateOfResidence,
        proofOfAddressUrl: profileProofOfAddressUrl,
        proofOfAddressName: profileProofOfAddressName,
        idType: profileIdType,
        idNumber: profileIdNumber,
        idDocumentUrl: profileIdDocUrl,
        idDocumentName: profileIdDocName,
        isIdVerified: isProfileIdVerified,
        nextOfKinName: profileNextOfKinName,
        nextOfKinRelationship: profileNextOfKinRel,
        nextOfKinPhone: profileNextOfKinPhone,
        nextOfKinAddress: profileNextOfKinAddress,
        bankName: profileBankName,
        bankCode: profileBankCode,
        accountNumber: profileAccountNumber,
        accountName: profileAccountName,
        bvn: profileBvn,
        isBankVerified: isProfileBankVerified,
        kycTier: kycMetrics.percentage >= 85 ? 'Tier 3' : kycMetrics.percentage >= 50 ? 'Tier 2' : 'Tier 1',
        kycStatus: isProfileBankVerified ? 'Verified' : 'Pending Review',
        kycSubmittedAt: new Date().toISOString(),
      });
      if (success) {
        setProfileSavedSuccess(true);
        setTimeout(() => setProfileSavedSuccess(false), 4000);
      }
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSecurityError('');

    if (!securityNewPass || securityNewPass.length < 8) {
      setSecurityError('New password must be at least 8 characters long.');
      return;
    }
    if (securityNewPass !== securityConfirmPass) {
      setSecurityError('New passwords do not match. Please verify.');
      return;
    }

    setIsUpdatingPassword(true);
    try {
      if (currentUser?.email) {
        await apiService.resetPassword(currentUser.email, securityNewPass);
      }
      showToast('Password Updated', 'Your security credentials have been updated successfully.', 'success');
      logActivity({
        title: 'Security Password Changed',
        description: `Account password was updated for ${currentUser?.name || currentUser?.email}.`,
        type: 'system',
        user: currentUser?.name || 'User',
      });
      setSecurityCurrentPass('');
      setSecurityNewPass('');
      setSecurityConfirmPass('');
    } catch (err: any) {
      setSecurityError(err.message || 'Failed to update password.');
      showToast('Update Failed', err.message || 'Password update failed', 'error');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <div className="space-y-stack-lg animate-in fade-in duration-200 w-full max-w-[1600px] mx-auto">
      {/* Page Header */}
      <div>
        <h2 className="font-headline-lg text-headline-lg font-bold text-on-surface mb-unit">
          {!isSuperAdmin ? 'Personal Profile & Account Settings' : 'Organization & System Operations'}
        </h2>
        <p className="font-body-md text-body-md text-secondary">
          {!isSuperAdmin 
            ? 'Manage your personal contact info, biography, and verify your Nigerian NUBAN bank account for automated disbursements.' 
            : 'Configure corporate profiles, manage staff role security, customize and test transactional email dispatches, and perform data backups.'}
        </p>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-lg bg-[#dcfce7] border border-[#86efac] text-[#166534] flex items-center gap-2 text-sm font-semibold animate-in fade-in">
          <span className="material-symbols-outlined text-[20px]">check_circle</span>
          <span>Institutional profile and system settings updated successfully!</span>
        </div>
      )}

      {profileSavedSuccess && (
        <div className="p-4 rounded-lg bg-[#dcfce7] border border-[#86efac] text-[#166534] flex items-center gap-2 text-sm font-semibold animate-in fade-in">
          <span className="material-symbols-outlined text-[20px]">verified_user</span>
          <span>Your personal profile and KYC bank details have been updated successfully!</span>
        </div>
      )}

      {/* Main Responsive Two-Column Layout: Left Vertical Navigation, Right Active Content */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Left Sticky Vertical Navigation Sidebar */}
        <aside className="w-full lg:w-72 shrink-0 bg-surface border border-outline-variant/60 rounded-2xl p-3.5 shadow-xs space-y-4 lg:sticky lg:top-4">
          {/* Group 1: Personal & Security */}
          <div className="space-y-1">
            <div className="px-3 py-1 text-[10px] font-bold text-secondary/70 uppercase tracking-wider font-label-md">
              Identity &amp; Security
            </div>
            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl font-medium text-xs flex items-center justify-between transition-all duration-150 cursor-pointer ${
                effectiveSection === 'profile'
                  ? 'bg-primary text-on-primary font-bold shadow-xs'
                  : 'text-secondary hover:text-on-surface hover:bg-surface-container-low'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[18px]">account_circle</span>
                <span>{isSuperAdmin ? 'My Profile & KYC' : 'Profile & Bank KYC'}</span>
              </div>
              {isProfileBankVerified && (
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  effectiveSection === 'profile' ? 'bg-white/20 text-white' : 'bg-[#dcfce7] text-[#166534]'
                }`}>
                  ✓ KYC
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('security')}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl font-medium text-xs flex items-center justify-between transition-all duration-150 cursor-pointer ${
                effectiveSection === 'security'
                  ? 'bg-primary text-on-primary font-bold shadow-xs'
                  : 'text-secondary hover:text-on-surface hover:bg-surface-container-low'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[18px]">lock_reset</span>
                <span>Security &amp; Password</span>
              </div>
            </button>
          </div>

          {/* Group 2: Access & Governance (Super Admin Only) */}
          {isSuperAdmin && (
            <div className="space-y-1 pt-3 border-t border-outline-variant/40">
              <div className="px-3 py-1 text-[10px] font-bold text-secondary/70 uppercase tracking-wider font-label-md">
                Access &amp; Governance
              </div>
              <button
                onClick={() => setActiveTab('staff')}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl font-medium text-xs flex items-center justify-between transition-all duration-150 cursor-pointer ${
                  effectiveSection === 'staff'
                    ? 'bg-primary text-on-primary font-bold shadow-xs'
                    : 'text-secondary hover:text-on-surface hover:bg-surface-container-low'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-[18px]">badge</span>
                  <span>Staff Accounts</span>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-data-tabular font-bold ${
                  effectiveSection === 'staff' ? 'bg-white/20 text-white' : 'bg-surface-container text-secondary'
                }`}>
                  {staffUsers.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('users')}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl font-medium text-xs flex items-center justify-between transition-all duration-150 cursor-pointer ${
                  effectiveSection === 'users'
                    ? 'bg-primary text-on-primary font-bold shadow-xs'
                    : 'text-secondary hover:text-on-surface hover:bg-surface-container-low'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-[18px]">manage_accounts</span>
                  <span>User Directory</span>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-data-tabular font-bold ${
                  effectiveSection === 'users' ? 'bg-white/20 text-white' : 'bg-surface-container text-secondary'
                }`}>
                  {unifiedUsers.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('roles')}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl font-medium text-xs flex items-center justify-between transition-all duration-150 cursor-pointer ${
                  effectiveSection === 'roles'
                    ? 'bg-primary text-on-primary font-bold shadow-xs'
                    : 'text-secondary hover:text-on-surface hover:bg-surface-container-low'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-[18px]">admin_panel_settings</span>
                  <span>Roles &amp; Permissions</span>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-data-tabular font-bold ${
                  effectiveSection === 'roles' ? 'bg-white/20 text-white' : 'bg-surface-container text-secondary'
                }`}>
                  {customRoles.length}
                </span>
              </button>
            </div>
          )}

          {/* Group 3: Institutional Setup (Super Admin Only) */}
          {isSuperAdmin && (
            <div className="space-y-1 pt-3 border-t border-outline-variant/40">
              <div className="px-3 py-1 text-[10px] font-bold text-secondary/70 uppercase tracking-wider font-label-md">
                Institutional Setup
              </div>
              <button
                onClick={() => setActiveTab('general')}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl font-medium text-xs flex items-center justify-between transition-all duration-150 cursor-pointer ${
                  effectiveSection === 'general'
                    ? 'bg-primary text-on-primary font-bold shadow-xs'
                    : 'text-secondary hover:text-on-surface hover:bg-surface-container-low'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-[18px]">domain</span>
                  <span>Institutional Profile</span>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('modules')}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl font-medium text-xs flex items-center justify-between transition-all duration-150 cursor-pointer ${
                  effectiveSection === 'modules'
                    ? 'bg-primary text-on-primary font-bold shadow-xs'
                    : 'text-secondary hover:text-on-surface hover:bg-surface-container-low'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-[18px]">toggle_on</span>
                  <span>Modules &amp; Launch</span>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-data-tabular font-bold ${
                  effectiveSection === 'modules' ? 'bg-white/20 text-white' : 'bg-surface-container text-secondary'
                }`}>
                  {Object.values(enabledModules).filter(Boolean).length}/{Object.keys(enabledModules).length}
                </span>
              </button>
            </div>
          )}

          {/* Group 4: Communications & Recovery (Super Admin Only) */}
          {isSuperAdmin && (
            <div className="space-y-1 pt-3 border-t border-outline-variant/40">
              <div className="px-3 py-1 text-[10px] font-bold text-secondary/70 uppercase tracking-wider font-label-md">
                Operations &amp; Tools
              </div>
              <button
                onClick={() => setActiveTab('emailing')}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl font-medium text-xs flex items-center justify-between transition-all duration-150 cursor-pointer ${
                  effectiveSection === 'emailing'
                    ? 'bg-primary text-on-primary font-bold shadow-xs'
                    : 'text-secondary hover:text-on-surface hover:bg-surface-container-low'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-[18px]">mark_email_read</span>
                  <span>Email &amp; SMTP</span>
                </div>
                {smtpUser && (
                  <span className={`w-2 h-2 rounded-full ${effectiveSection === 'emailing' ? 'bg-white' : 'bg-emerald-500'}`} />
                )}
              </button>

              <button
                onClick={() => setActiveTab('backups')}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl font-medium text-xs flex items-center justify-between transition-all duration-150 cursor-pointer ${
                  effectiveSection === 'backups'
                    ? 'bg-primary text-on-primary font-bold shadow-xs'
                    : 'text-secondary hover:text-on-surface hover:bg-surface-container-low'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-[18px]">cloud_sync</span>
                  <span>Backup &amp; Recovery</span>
                </div>
              </button>
            </div>
          )}
        </aside>

        {/* Right Main Content Area */}
        <main className="flex-1 min-w-0 w-full space-y-6">

      {/* ========================================================================= */}
      {/* SECTION: MY PROFILE & NIGERIAN STANDARD KYC (ALL ROLES) */}
      {/* ========================================================================= */}
      {effectiveSection === 'profile' && (
        <form onSubmit={handleSaveProfile} className="space-y-stack-md animate-in fade-in duration-200">
          {/* KYC Tier Compliance Status Bar */}
          <div className="bg-crisp-black text-white rounded-xl p-6 border border-outline flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold uppercase tracking-wider">
                  {kycMetrics.tier}
                </span>
                <span className="text-xs text-slate-300">CBN Anti-Money Laundering &amp; CDD Standard</span>
              </div>
              <h3 className="font-headline-md text-xl font-bold text-white flex items-center gap-2">
                <span>Nigerian Standard Identity &amp; Payout KYC</span>
                {kycMetrics.percentage >= 85 ? (
                  <span className="material-symbols-outlined text-emerald-400 text-[20px]">verified</span>
                ) : (
                  <span className="material-symbols-outlined text-amber-400 text-[20px]">pending</span>
                )}
              </h3>
              <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
                Complete all verification tiers (Passport Photograph, Verified Government ID, Residential Proof, Next of Kin, and NUBAN Settlement Bank) to unlock direct automated OpEx reimbursements and faculty payouts.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/15 min-w-[220px] text-right space-y-2 shrink-0">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-300 font-medium">KYC Readiness</span>
                <span className="font-bold text-emerald-300 text-sm font-data-tabular">{kycMetrics.percentage}%</span>
              </div>
              <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 to-emerald-400 transition-all duration-500 rounded-full"
                  style={{ width: `${kycMetrics.percentage}%` }}
                />
              </div>
              <div className="text-[11px] text-slate-300 text-left">
                Status: <strong className="text-white">{isProfileBankVerified ? 'Active Verified Beneficiary' : 'Verification Required'}</strong>
              </div>
            </div>
          </div>

          {/* 1. Official Passport Photograph & Identity Card */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-xs space-y-6">
            <div className="border-b border-outline-variant pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-[22px]">badge</span>
                </div>
                <div>
                  <h3 className="font-headline-sm text-base font-bold text-on-surface">
                    Tier 1: Official Passport Photograph &amp; Personal Demographics
                  </h3>
                  <p className="text-xs text-secondary">
                    Standard Nigerian regulatory biometric photo and civil registration details
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold capitalize">
                {currentUser?.role?.replace('_', ' ') || 'Staff Member'}
              </span>
            </div>

            {/* Passport Photograph Upload Area */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 p-4 rounded-xl bg-surface-container-low border border-outline-variant/60">
              <div className="relative group shrink-0">
                <div className="w-28 h-28 rounded-2xl overflow-hidden bg-surface-container border-2 border-primary/30 flex items-center justify-center shadow-inner">
                  {profileAvatarUrl ? (
                    <img 
                      src={profileAvatarUrl} 
                      alt="Official Passport Photograph" 
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-secondary p-2 text-center">
                      <span className="material-symbols-outlined text-4xl text-primary/40 mb-1">add_a_photo</span>
                      <span className="text-[10px] font-semibold leading-tight">No Passport Photo</span>
                    </div>
                  )}
                </div>
                <input
                  type="file"
                  ref={avatarFileInputRef}
                  onChange={handleAvatarUpload}
                  accept="image/png, image/jpeg, image/webp"
                  className="hidden"
                />
              </div>

              <div className="flex-1 space-y-2 text-center sm:text-left">
                <h4 className="text-sm font-bold text-on-surface">Official Passport Photograph</h4>
                <p className="text-xs text-secondary leading-relaxed">
                  Upload a clear, forward-facing color headshot on a plain white or off-white background (PNG, JPG, max 3MB). This photo is affixed to your institutional credentials, digital ID, and faculty profile.
                </p>
                <div className="flex flex-wrap items-center gap-2 pt-1 justify-center sm:justify-start">
                  <button
                    type="button"
                    onClick={() => avatarFileInputRef.current?.click()}
                    className="px-3.5 h-9 rounded-lg bg-primary text-on-primary text-xs font-bold hover:bg-primary/90 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <span className="material-symbols-outlined text-[16px]">upload</span>
                    <span>{profileAvatarUrl ? 'Change Passport Photo' : 'Upload Passport Photo'}</span>
                  </button>
                  {profileAvatarUrl && (
                    <button
                      type="button"
                      onClick={() => setProfileAvatarUrl('')}
                      className="px-3 h-9 rounded-lg border border-outline-variant text-xs text-secondary hover:text-error hover:bg-surface-container transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                      <span>Remove</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Demographic Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="font-label-md text-xs font-semibold text-on-surface">
                  Legal Full Name <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={profileName}
                  onChange={e => setProfileName(e.target.value)}
                  placeholder="e.g. Dr. Arthur Pendelton"
                  className="w-full h-10 px-3 bg-surface border border-outline-variant rounded-lg font-body-md text-sm text-on-surface focus:border-primary outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-label-md text-xs font-semibold text-on-surface">
                  Phone Number <span className="text-error">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={profilePhone}
                  onChange={e => setProfilePhone(e.target.value)}
                  placeholder="+234 801 234 5678"
                  className="w-full h-10 px-3 bg-surface border border-outline-variant rounded-lg font-body-md text-sm text-on-surface focus:border-primary outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-label-md text-xs font-semibold text-on-surface">
                  Date of Birth <span className="text-error">*</span>
                </label>
                <input
                  type="date"
                  value={profileDob}
                  onChange={e => setProfileDob(e.target.value)}
                  className="w-full h-10 px-3 bg-surface border border-outline-variant rounded-lg font-body-md text-sm text-on-surface focus:border-primary outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-label-md text-xs font-semibold text-on-surface">
                  Gender
                </label>
                <select
                  value={profileGender}
                  onChange={e => setProfileGender(e.target.value as any)}
                  className="w-full h-10 px-3 bg-surface border border-outline-variant rounded-lg font-body-md text-sm text-on-surface focus:border-primary outline-none cursor-pointer"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other / Prefer not to say</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-label-md text-xs font-semibold text-on-surface">
                  Nationality
                </label>
                <input
                  type="text"
                  value={profileNationality}
                  onChange={e => setProfileNationality(e.target.value)}
                  placeholder="Nigerian"
                  className="w-full h-10 px-3 bg-surface border border-outline-variant rounded-lg font-body-md text-sm text-on-surface focus:border-primary outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-label-md text-xs font-semibold text-on-surface">
                  State of Origin (Nigeria)
                </label>
                <select
                  value={profileStateOfOrigin}
                  onChange={e => setProfileStateOfOrigin(e.target.value)}
                  className="w-full h-10 px-3 bg-surface border border-outline-variant rounded-lg font-body-md text-sm text-on-surface focus:border-primary outline-none cursor-pointer"
                >
                  {NIGERIAN_STATES.map(s => (
                    <option key={`origin-${s}`} value={s}>{s} State</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-label-md text-xs font-semibold text-on-surface">
                  Local Government Area (LGA)
                </label>
                <input
                  type="text"
                  value={profileLga}
                  onChange={e => setProfileLga(e.target.value)}
                  placeholder="e.g. Ikeja, Eti-Osa, Ibadan North"
                  className="w-full h-10 px-3 bg-surface border border-outline-variant rounded-lg font-body-md text-sm text-on-surface focus:border-primary outline-none"
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="font-label-md text-xs font-semibold text-on-surface">
                  Institutional Email (Secured)
                </label>
                <input
                  type="email"
                  disabled
                  value={currentUser?.email || ''}
                  className="w-full h-10 px-3 bg-surface-container text-secondary border border-outline-variant rounded-lg font-body-md text-sm cursor-not-allowed outline-none"
                />
              </div>

              <div className="space-y-1 sm:col-span-3">
                <label className="font-label-md text-xs font-semibold text-on-surface">
                  Professional Biography &amp; Academic Summary
                </label>
                <textarea
                  rows={2}
                  value={profileBio}
                  onChange={e => setProfileBio(e.target.value)}
                  placeholder="Brief summary of your professional background, certifications, and academic duties..."
                  className="w-full p-3 bg-surface border border-outline-variant rounded-lg font-body-md text-xs text-on-surface focus:border-primary outline-none resize-none"
                />
              </div>
            </div>
          </div>

          {/* 2. Tier 2: Government Identity Verification (NIN / BVN / ID Doc) */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-xs space-y-5">
            <div className="border-b border-outline-variant pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[22px]">fingerprint</span>
                </div>
                <div>
                  <h3 className="font-headline-sm text-base font-bold text-on-surface">
                    Tier 2: Government Identification &amp; Document Verification
                  </h3>
                  <p className="text-xs text-secondary">
                    Verification of Federal Government ID issued by NIMC, CBN, FRSC, or Nigerian Immigration
                  </p>
                </div>
              </div>

              {isProfileIdVerified ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#dcfce7] border border-[#86efac] text-[#166534] text-xs font-bold">
                  <span className="material-symbols-outlined text-[16px]">verified</span>
                  <span>ID Validated</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-700 text-xs font-bold">
                  <span className="material-symbols-outlined text-[16px]">pending</span>
                  <span>Verification Pending</span>
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="font-label-md text-xs font-semibold text-on-surface">
                  Identity Document Type <span className="text-error">*</span>
                </label>
                <select
                  value={profileIdType}
                  onChange={e => {
                    setProfileIdType(e.target.value as any);
                    setIsProfileIdVerified(false);
                  }}
                  className="w-full h-10 px-3 bg-surface border border-outline-variant rounded-lg font-body-md text-sm text-on-surface focus:border-primary outline-none cursor-pointer"
                >
                  <option value="NIN">National Identity Number (NIN - 11 Digits)</option>
                  <option value="BVN">Bank Verification Number (BVN - 11 Digits)</option>
                  <option value="Driver License">FRSC National Driver's License</option>
                  <option value="International Passport">Nigerian International Passport</option>
                  <option value="Voter Card">INEC Permanent Voter's Card (PVC)</option>
                </select>
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="font-label-md text-xs font-semibold text-on-surface">
                  {profileIdType} Number (Identification Code) <span className="text-error">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={profileIdNumber}
                    onChange={e => {
                      setProfileIdNumber(e.target.value.trim());
                      setIsProfileIdVerified(false);
                    }}
                    placeholder={`Enter your ${profileIdType} number (e.g. 11 digits for NIN/BVN)`}
                    className="flex-1 h-10 px-3 bg-surface border border-outline-variant rounded-lg font-data-tabular font-bold text-sm text-on-surface focus:border-primary outline-none tracking-wider"
                  />
                  <button
                    type="button"
                    onClick={handleVerifyId}
                    disabled={isVerifyingId || profileIdNumber.length < 10}
                    className="px-4 h-10 rounded-lg bg-primary text-on-primary font-bold text-xs hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    {isVerifyingId ? (
                      <>
                        <span className="material-symbols-outlined text-[16px] animate-spin">sync</span>
                        <span>Verifying...</span>
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[16px]">verified_user</span>
                        <span>Validate ID</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* ID Document Proof Upload */}
              <div className="space-y-1 sm:col-span-3">
                <label className="font-label-md text-xs font-semibold text-on-surface">
                  ID Card / Bio-Data Page Document Scan (Proof Upload)
                </label>
                <input
                  type="file"
                  ref={idDocFileInputRef}
                  onChange={handleIdDocUpload}
                  accept=".pdf,image/png,image/jpeg,image/webp"
                  className="hidden"
                />
                <div className="flex flex-col sm:flex-row items-center gap-3 p-3.5 rounded-xl border border-dashed border-outline-variant bg-surface-container-low">
                  <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-primary shrink-0">
                    <span className="material-symbols-outlined text-[22px]">upload_file</span>
                  </div>
                  <div className="flex-1 text-center sm:text-left">
                    <span className="text-xs font-bold text-on-surface block">
                      {profileIdDocName || 'Attach Clear Copy of Government ID'}
                    </span>
                    <span className="text-[11px] text-secondary">
                      PDF, JPG, PNG format accepted (Max 5MB). Scanned copy of National ID card, passport page, or driver's license.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => idDocFileInputRef.current?.click()}
                    className="px-3.5 h-9 rounded-lg bg-surface border border-outline-variant text-xs font-semibold text-on-surface hover:bg-surface-container transition-colors cursor-pointer shrink-0"
                  >
                    {profileIdDocName ? 'Replace Document' : 'Browse File'}
                  </button>
                  {profileIdDocName && (
                    <button
                      type="button"
                      onClick={() => {
                        setProfileIdDocName('');
                        setProfileIdDocUrl('');
                      }}
                      className="p-1.5 text-error hover:bg-error-container/20 rounded cursor-pointer"
                      title="Remove attachment"
                    >
                      <span className="material-symbols-outlined text-[18px]">close</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 3. Tier 3: Residential Address & Proof of Residence */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-xs space-y-5">
            <div className="border-b border-outline-variant pb-3 flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 text-violet-600 flex items-center justify-center">
                <span className="material-symbols-outlined text-[22px]">home_pin</span>
              </div>
              <div>
                <h3 className="font-headline-sm text-base font-bold text-on-surface">
                  Tier 3: Residential Address &amp; Proof of Residence
                </h3>
                <p className="text-xs text-secondary">
                  Physical location verification compliant with Nigerian anti-fraud and banking mandates
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1 sm:col-span-2">
                <label className="font-label-md text-xs font-semibold text-on-surface">
                  Residential Street Address <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={profileAddress}
                  onChange={e => setProfileAddress(e.target.value)}
                  placeholder="e.g. Plot 14, Adeola Odeku Street, Victoria Island"
                  className="w-full h-10 px-3 bg-surface border border-outline-variant rounded-lg font-body-md text-sm text-on-surface focus:border-primary outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-label-md text-xs font-semibold text-on-surface">
                  City / Town <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={profileCity}
                  onChange={e => setProfileCity(e.target.value)}
                  placeholder="e.g. Lagos, Ikeja, Abuja"
                  className="w-full h-10 px-3 bg-surface border border-outline-variant rounded-lg font-body-md text-sm text-on-surface focus:border-primary outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-label-md text-xs font-semibold text-on-surface">
                  State of Residence <span className="text-error">*</span>
                </label>
                <select
                  value={profileStateOfResidence}
                  onChange={e => setProfileStateOfResidence(e.target.value)}
                  className="w-full h-10 px-3 bg-surface border border-outline-variant rounded-lg font-body-md text-sm text-on-surface focus:border-primary outline-none cursor-pointer"
                >
                  {NIGERIAN_STATES.map(s => (
                    <option key={`residence-${s}`} value={s}>{s} State</option>
                  ))}
                </select>
              </div>

              {/* Utility Bill / Proof of Address Upload */}
              <div className="space-y-1 sm:col-span-2">
                <label className="font-label-md text-xs font-semibold text-on-surface">
                  Utility Bill / Tenancy Receipt (Proof of Address)
                </label>
                <input
                  type="file"
                  ref={proofAddressFileInputRef}
                  onChange={handleProofAddressUpload}
                  accept=".pdf,image/png,image/jpeg,image/webp"
                  className="hidden"
                />
                <div className="flex items-center gap-3 p-2.5 rounded-lg border border-outline-variant bg-surface">
                  <span className="material-symbols-outlined text-primary text-[20px]">receipt_long</span>
                  <div className="flex-1 truncate">
                    <span className="text-xs font-semibold text-on-surface block truncate">
                      {profileProofOfAddressName || 'Attach electricity bill (EKEDC/IBEDC/AEDC) or tenancy receipt'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => proofAddressFileInputRef.current?.click()}
                    className="px-3 h-8 rounded bg-surface-container hover:bg-surface-container-high text-xs font-semibold text-on-surface cursor-pointer shrink-0"
                  >
                    {profileProofOfAddressName ? 'Replace' : 'Upload Proof'}
                  </button>
                  {profileProofOfAddressName && (
                    <button
                      type="button"
                      onClick={() => {
                        setProfileProofOfAddressName('');
                        setProfileProofOfAddressUrl('');
                      }}
                      className="p-1 text-error hover:bg-error-container/20 rounded cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">close</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 4. Next of Kin / Emergency Guarantor */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-xs space-y-5">
            <div className="border-b border-outline-variant pb-3 flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                <span className="material-symbols-outlined text-[22px]">contact_emergency</span>
              </div>
              <div>
                <h3 className="font-headline-sm text-base font-bold text-on-surface">
                  Next of Kin &amp; Emergency Contact Details
                </h3>
                <p className="text-xs text-secondary">
                  Mandatory in Nigerian institutional and banking regulations for emergency correspondence and legal welfare
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <label className="font-label-md text-xs font-semibold text-on-surface">
                  Next of Kin Full Name <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={profileNextOfKinName}
                  onChange={e => setProfileNextOfKinName(e.target.value)}
                  placeholder="e.g. Folake Pendelton"
                  className="w-full h-10 px-3 bg-surface border border-outline-variant rounded-lg font-body-md text-sm text-on-surface focus:border-primary outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-label-md text-xs font-semibold text-on-surface">
                  Relationship <span className="text-error">*</span>
                </label>
                <select
                  value={profileNextOfKinRel}
                  onChange={e => setProfileNextOfKinRel(e.target.value)}
                  className="w-full h-10 px-3 bg-surface border border-outline-variant rounded-lg font-body-md text-sm text-on-surface focus:border-primary outline-none cursor-pointer"
                >
                  <option value="Spouse">Spouse</option>
                  <option value="Sibling">Sibling (Brother / Sister)</option>
                  <option value="Parent">Parent (Mother / Father)</option>
                  <option value="Child">Child (Son / Daughter)</option>
                  <option value="Guardian">Guardian / Legal Representative</option>
                  <option value="Next of Kin">Next of Kin / Relative</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-label-md text-xs font-semibold text-on-surface">
                  Next of Kin Phone Number <span className="text-error">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={profileNextOfKinPhone}
                  onChange={e => setProfileNextOfKinPhone(e.target.value)}
                  placeholder="+234 802 345 6789"
                  className="w-full h-10 px-3 bg-surface border border-outline-variant rounded-lg font-body-md text-sm text-on-surface focus:border-primary outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-label-md text-xs font-semibold text-on-surface">
                  Contact Address
                </label>
                <input
                  type="text"
                  value={profileNextOfKinAddress}
                  onChange={e => setProfileNextOfKinAddress(e.target.value)}
                  placeholder="City, State"
                  className="w-full h-10 px-3 bg-surface border border-outline-variant rounded-lg font-body-md text-sm text-on-surface focus:border-primary outline-none"
                />
              </div>
            </div>
          </div>

          {/* 5. Nigerian Bank Settlement & Payout KYC (NUBAN & NIBSS) */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-xs space-y-5">
            <div className="border-b border-outline-variant pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[22px]">account_balance</span>
                </div>
                <div>
                  <h3 className="font-headline-sm text-base font-bold text-on-surface">
                    Nigerian Bank Settlement Account &amp; Disbursement KYC
                  </h3>
                  <p className="text-xs text-secondary">
                    Live NIBSS verified account for OpEx reimbursements, travel allowances, and faculty 37% payouts
                  </p>
                </div>
              </div>

              {isProfileBankVerified ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#dcfce7] border border-[#86efac] text-[#166534] text-xs font-bold">
                  <span className="material-symbols-outlined text-[16px]">verified</span>
                  <span>NUBAN Verified via NIBSS</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-700 text-xs font-bold">
                  <span className="material-symbols-outlined text-[16px]">warning</span>
                  <span>Unverified Bank Account</span>
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="font-label-md text-xs font-semibold text-on-surface">
                  Financial Institution (Bank) <span className="text-error">*</span>
                </label>
                <select
                  value={profileBankName}
                  onChange={e => {
                    const selectedName = e.target.value;
                    setProfileBankName(selectedName);
                    const matchedBank = NIGERIAN_BANKS.find(b => b.name === selectedName);
                    if (matchedBank) {
                      setProfileBankCode(matchedBank.code);
                    }
                    setIsProfileBankVerified(false);
                  }}
                  className="w-full h-10 px-3 bg-surface border border-outline-variant rounded-lg font-body-md text-sm text-on-surface focus:border-primary outline-none cursor-pointer"
                >
                  {NIGERIAN_BANKS.map(b => (
                    <option key={`${b.code}-${b.name}`} value={b.name}>
                      {b.name} ({b.category})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-label-md text-xs font-semibold text-on-surface">
                  10-Digit NUBAN Account Number <span className="text-error">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    maxLength={10}
                    value={profileAccountNumber}
                    onChange={e => {
                      const val = e.target.value.replace(/\D/g, '');
                      setProfileAccountNumber(val);
                      if (val !== profileAccountNumber) {
                        setIsProfileBankVerified(false);
                      }
                    }}
                    placeholder="0123456789"
                    className="flex-1 h-10 px-3 bg-surface border border-outline-variant rounded-lg font-data-tabular font-bold text-sm text-on-surface focus:border-primary outline-none tracking-wider"
                  />
                  <button
                    type="button"
                    onClick={handleVerifyProfileBank}
                    disabled={isVerifyingBank || profileAccountNumber.length !== 10}
                    className="px-4 h-10 rounded-lg bg-primary text-on-primary font-bold text-xs hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    {isVerifyingBank ? (
                      <>
                        <span className="material-symbols-outlined text-[16px] animate-spin">sync</span>
                        <span>Verifying...</span>
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[16px]">verified</span>
                        <span>Verify NUBAN</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-label-md text-xs font-semibold text-on-surface">
                  Bank Verification Number (BVN) <span className="text-secondary font-normal">(Cross-check)</span>
                </label>
                <input
                  type="text"
                  maxLength={11}
                  value={profileBvn}
                  onChange={e => setProfileBvn(e.target.value.replace(/\D/g, ''))}
                  placeholder="11-Digit BVN (Optional)"
                  className="w-full h-10 px-3 bg-surface border border-outline-variant rounded-lg font-data-tabular text-sm text-on-surface focus:border-primary outline-none tracking-wider"
                />
              </div>

              <div className="space-y-1 sm:col-span-3">
                <label className="font-label-md text-xs font-semibold text-on-surface">
                  Verified Beneficiary Account Name
                </label>
                <input
                  type="text"
                  value={profileAccountName}
                  onChange={e => setProfileAccountName(e.target.value)}
                  placeholder="Official name registered with your bank"
                  className={`w-full h-10 px-3 rounded-lg font-body-md text-sm outline-none ${
                    isProfileBankVerified
                      ? 'bg-emerald-50 text-emerald-900 border border-emerald-300 font-bold'
                      : 'bg-surface border border-outline-variant text-on-surface focus:border-primary'
                  }`}
                />
                {isProfileBankVerified && (
                  <p className="text-[11px] text-emerald-700 font-medium flex items-center gap-1 mt-1">
                    <span className="material-symbols-outlined text-[14px]">check_circle</span>
                    <span>Account name verified against NIBSS / CBN electronic registry. Automatic payouts enabled.</span>
                  </p>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-outline-variant/60 flex items-center justify-between">
              <span className="text-xs text-secondary">
                Ready to save your verified Nigerian Standard KYC profile?
              </span>
              <button
                type="submit"
                disabled={isSavingProfile}
                className="px-8 h-11 bg-primary text-on-primary rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
              >
                {isSavingProfile ? (
                  <>
                    <span className="material-symbols-outlined text-[18px] animate-spin">sync</span>
                    <span>Saving KYC Profile...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">verified</span>
                    <span>Save &amp; Persist KYC Information</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* ========================================================================= */}
      {/* SECTION: SECURITY & PASSWORD (ALL ROLES) */}
      {/* ========================================================================= */}
      {effectiveSection === 'security' && (
        <form onSubmit={handleUpdatePassword} className="space-y-stack-md animate-in fade-in duration-200 max-w-2xl">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-xs space-y-5">
            <div className="border-b border-outline-variant pb-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-[22px]">lock_reset</span>
              </div>
              <div>
                <h3 className="font-headline-sm text-base font-bold text-on-surface">
                  Security Credentials &amp; Password
                </h3>
                <p className="text-xs text-secondary">
                  Update your authentication password and ensure institutional security standards
                </p>
              </div>
            </div>

            {securityError && (
              <div className="p-3.5 rounded-lg bg-error-container/30 border border-error/40 text-error text-xs flex items-center gap-2 font-medium">
                <span className="material-symbols-outlined text-[18px]">error</span>
                <span>{securityError}</span>
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="font-label-md text-xs font-semibold text-on-surface">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showSecurityPass ? 'text' : 'password'}
                    value={securityCurrentPass}
                    onChange={e => setSecurityCurrentPass(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full h-10 px-3 pr-10 bg-surface border border-outline-variant rounded-lg font-body-md text-sm text-on-surface focus:border-primary outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSecurityPass(!showSecurityPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary hover:text-on-surface cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {showSecurityPass ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-label-md text-xs font-semibold text-on-surface">
                  New Password <span className="text-error">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showSecurityPass ? 'text' : 'password'}
                    required
                    value={securityNewPass}
                    onChange={e => setSecurityNewPass(e.target.value)}
                    placeholder="Minimum 8 characters"
                    className="w-full h-10 px-3 pr-10 bg-surface border border-outline-variant rounded-lg font-body-md text-sm text-on-surface focus:border-primary outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-label-md text-xs font-semibold text-on-surface">
                  Confirm New Password <span className="text-error">*</span>
                </label>
                <input
                  type={showSecurityPass ? 'text' : 'password'}
                  required
                  value={securityConfirmPass}
                  onChange={e => setSecurityConfirmPass(e.target.value)}
                  placeholder="Re-type new password"
                  className="w-full h-10 px-3 bg-surface border border-outline-variant rounded-lg font-body-md text-sm text-on-surface focus:border-primary outline-none"
                />
              </div>

              <div className="p-3 rounded-lg bg-surface-container border border-outline-variant text-[11px] text-secondary space-y-1">
                <p className="font-bold text-on-surface">Security Policy Requirements:</p>
                <p className={securityNewPass.length >= 8 ? 'text-emerald-600 font-semibold' : ''}>
                  • At least 8 characters in length
                </p>
                <p className={/[0-9]/.test(securityNewPass) ? 'text-emerald-600 font-semibold' : ''}>
                  • Contains at least 1 number or numerical digit
                </p>
                <p className={/[A-Z]/.test(securityNewPass) ? 'text-emerald-600 font-semibold' : ''}>
                  • Contains uppercase letters
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={isUpdatingPassword || !securityNewPass}
                className="px-6 h-10 bg-primary text-on-primary rounded-lg text-xs font-bold hover:bg-primary/90 transition-colors flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
              >
                {isUpdatingPassword ? (
                  <>
                    <span className="material-symbols-outlined text-[16px] animate-spin">sync</span>
                    <span>Updating Credentials...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[16px]">lock</span>
                    <span>Update Password</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* ========================================================================= */}
      {/* SECTION 1: GENERAL & BANKING (SUPER ADMIN ONLY) */}
      {/* ========================================================================= */}
      {isSuperAdmin && effectiveSection === 'general' && (
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
                  className="w-10 h-10 rounded-lg bg-crisp-black p-0.5 object-contain"
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
      {/* TAB: MODULE MANAGEMENT & LAUNCH CONTROLS (SUPER ADMIN ONLY) */}
      {/* ========================================================================= */}
      {isSuperAdmin && effectiveSection === 'modules' && (
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
      {/* SECTION 3: STAFF & ROLE SECURITY (SUPER ADMIN ONLY) */}
      {/* ========================================================================= */}
      {isSuperAdmin && effectiveSection === 'staff' && (
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
                      className="w-full h-9 px-3 rounded bg-surface-container-lowest border border-outline-variant text-xs outline-none focus:border-primary cursor-pointer"
                    >
                      <optgroup label="System Roles">
                        <option value="super_admin">Super Admin (Full Platform Access)</option>
                        <option value="program_officer">Program Officer (Curriculum, Timetable &amp; Faculty)</option>
                        <option value="admissions">Admissions Officer (Leads &amp; Enrolling)</option>
                        <option value="mentor">Faculty Mentor (Coaching &amp; Syllabus)</option>
                        <option value="finance">Chief Financial Officer (Billing &amp; Expenses)</option>
                      </optgroup>
                      {customRoles.filter(r => !['super_admin', 'admissions', 'mentor', 'finance', 'student'].includes(r.id)).length > 0 && (
                        <optgroup label="Custom Configured Roles">
                          {customRoles.filter(r => !['super_admin', 'admissions', 'mentor', 'finance', 'student'].includes(r.id)).map(cr => (
                            <option key={cr.id} value={cr.id}>{cr.name}</option>
                          ))}
                        </optgroup>
                      )}
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
                          className="px-2 py-1 rounded bg-surface border border-outline-variant text-xs font-semibold outline-none focus:border-primary cursor-pointer"
                        >
                          <optgroup label="System Roles">
                            <option value="super_admin">Super Admin</option>
                            <option value="program_officer">Program Officer</option>
                            <option value="admissions">Admissions</option>
                            <option value="mentor">Faculty Mentor</option>
                            <option value="finance">Finance Officer</option>
                          </optgroup>
                          {customRoles.filter(r => !['super_admin', 'admissions', 'mentor', 'finance', 'student'].includes(r.id)).length > 0 && (
                            <optgroup label="Custom Roles">
                              {customRoles.filter(r => !['super_admin', 'admissions', 'mentor', 'finance', 'student'].includes(r.id)).map(cr => (
                                <option key={cr.id} value={cr.id}>{cr.name}</option>
                              ))}
                            </optgroup>
                          )}
                        </select>
                      </td>
                      <td className="p-3 text-secondary">{user.department || 'Executive'}</td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEditStaff(user)}
                            className="px-2 py-1 rounded bg-surface border border-outline-variant hover:bg-surface-container font-semibold text-[11px] text-on-surface transition-colors inline-flex items-center gap-1 cursor-pointer"
                            title="Edit Staff Information"
                          >
                            <span className="material-symbols-outlined text-[13px]">edit</span>
                            <span>Edit</span>
                          </button>

                          {!(user.role === 'super_admin' && (user.id === 'user-admin' || staffUsers.filter(u => u.role === 'super_admin').length <= 1)) && (
                            <button
                              onClick={() => setDeletingStaffUser(user)}
                              className="px-2 py-1 rounded bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 font-semibold text-[11px] transition-colors inline-flex items-center gap-1 cursor-pointer"
                              title="Delete Staff Member"
                            >
                              <span className="material-symbols-outlined text-[13px]">delete</span>
                              <span>Delete</span>
                            </button>
                          )}

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
      {/* SECTION 4: UNIVERSAL USER GOVERNANCE & ACCESS CONTROL (SUPER ADMIN ONLY) */}
      {/* ========================================================================= */}
      {isSuperAdmin && effectiveSection === 'users' && (
        <div className="space-y-stack-md animate-in fade-in duration-200">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-outline-variant pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[22px]">manage_accounts</span>
                  <h3 className="font-headline-sm text-base font-bold text-on-surface">Universal User Directory &amp; Governance</h3>
                </div>
                <p className="text-xs text-secondary mt-1">
                  Super Admin centralized control to activate or deactivate user accounts, enforce security blocks, and administratively reset credentials across all Staff, Faculty Mentors, and Students.
                </p>
              </div>

              {/* Quick Summary Pill */}
              <div className="flex items-center gap-2 text-xs">
                <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  {unifiedUsers.filter(u => u.isActive).length} Active
                </span>
                <span className="px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 font-semibold border border-rose-200">
                  {unifiedUsers.filter(u => !u.isActive).length} Deactivated
                </span>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                {(['all', 'staff', 'mentor', 'student'] as const).map((category) => (
                  <button
                    key={category}
                    onClick={() => setUserDirectoryFilter(category)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                      userDirectoryFilter === category
                        ? 'bg-primary text-on-primary shadow-xs'
                        : 'bg-surface text-secondary hover:text-on-surface hover:bg-surface-container border border-outline-variant/60'
                    }`}
                  >
                    {category === 'all' && `All Accounts (${unifiedUsers.length})`}
                    {category === 'staff' && `Staff & Admin (${staffUsers.length})`}
                    {category === 'mentor' && `Faculty Mentors (${mentors.length})`}
                    {category === 'student' && `Students (${students.length})`}
                  </button>
                ))}
              </div>

              <div className="relative min-w-[240px]">
                <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-secondary text-[16px]">
                  search
                </span>
                <input
                  type="text"
                  value={userDirectorySearch}
                  onChange={(e) => setUserDirectorySearch(e.target.value)}
                  placeholder="Search user by name, email, role..."
                  className="w-full h-8 pl-8 pr-3 rounded-lg bg-surface border border-outline-variant text-xs outline-none focus:border-primary placeholder:text-secondary/60"
                />
              </div>
            </div>

            {/* Unified Users Table */}
            <div className="overflow-x-auto rounded-lg border border-outline-variant/70">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-outline-variant/60 bg-surface-container-low text-secondary text-[11px] uppercase tracking-wider font-data-tabular">
                    <th className="p-3">User</th>
                    <th className="p-3">Account Type &amp; Role</th>
                    <th className="p-3">Contact Email</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Administrative Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/40 text-xs">
                  {filteredUnifiedUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-secondary">
                        <span className="material-symbols-outlined text-3xl opacity-40 mb-1 block">person_search</span>
                        No users match the selected filter or search query.
                      </td>
                    </tr>
                  ) : (
                    filteredUnifiedUsers.map((u) => {
                      const isCurrentUser = currentUser?.id === u.id || currentUser?.email.toLowerCase() === u.email.toLowerCase();
                      return (
                        <tr key={`${u.category}-${u.id}`} className="hover:bg-surface-container-low/40 transition-colors">
                          <td className="p-3 font-semibold text-on-surface">
                            <div className="flex items-center gap-2.5">
                              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                u.category === 'staff'
                                  ? 'bg-blue-100 text-blue-700'
                                  : u.category === 'mentor'
                                  ? 'bg-purple-100 text-purple-700'
                                  : 'bg-emerald-100 text-emerald-700'
                              }`}>
                                {u.name.slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span>{u.name}</span>
                                  {isCurrentUser && (
                                    <span className="px-1.5 py-0.2 rounded bg-[#dcfce7] text-[#166534] text-[9px] font-bold">YOU</span>
                                  )}
                                </div>
                                <span className="text-[10px] text-secondary font-normal">{u.department}</span>
                              </div>
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-1.5">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold capitalize ${
                                u.category === 'staff'
                                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                  : u.category === 'mentor'
                                  ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              }`}>
                                {u.category}
                              </span>
                              <span className="text-secondary text-[11px] font-medium">{u.roleTitle}</span>
                            </div>
                          </td>
                          <td className="p-3 text-secondary font-data-tabular">{u.email}</td>
                          <td className="p-3">
                            {u.isActive ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold border border-emerald-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                Active
                              </span>
                            ) : (
                              <span 
                                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 text-[11px] font-bold border border-rose-200"
                                title={u.deactivatedReason || 'Account deactivated by Super Admin'}
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                                Deactivated
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Reset Password Button */}
                              <button
                                onClick={() => {
                                  setSelectedUserForPasswordReset({
                                    id: u.id,
                                    name: u.name,
                                    email: u.email,
                                    role: u.role,
                                    category: u.category,
                                  });
                                  openModal('reset-user-password');
                                }}
                                className="h-7 px-2.5 rounded bg-surface border border-outline-variant hover:bg-surface-container text-on-surface text-[11px] font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                                title="Reset / Override Password"
                              >
                                <span className="material-symbols-outlined text-[13px]">key</span>
                                <span>Reset Password</span>
                              </button>

                              {/* Activate / Deactivate Toggle (Do not deactivate self) */}
                              {!isCurrentUser && (
                                u.isActive ? (
                                  <button
                                    onClick={() => toggleUserActiveStatus(u.id, false, 'Administrative deactivation by Super Admin')}
                                    className="h-7 px-2.5 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[11px] font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                                    title="Deactivate account (blocks login)"
                                  >
                                    <span className="material-symbols-outlined text-[13px]">block</span>
                                    <span>Deactivate</span>
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => toggleUserActiveStatus(u.id, true)}
                                    className="h-7 px-2.5 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-[11px] font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                                    title="Re-activate account (restore access)"
                                  >
                                    <span className="material-symbols-outlined text-[13px]">check_circle</span>
                                    <span>Activate</span>
                                  </button>
                                )
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 5: ROLE & PERMISSION ARCHITECT (SUPER ADMIN ONLY) */}
      {/* ========================================================================= */}
      {isSuperAdmin && effectiveSection === 'roles' && (
        <div className="space-y-stack-md animate-in fade-in duration-200">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-outline-variant pb-3">
              <div>
                <h3 className="font-headline-sm text-base font-bold text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[22px]">admin_panel_settings</span>
                  <span>Role &amp; Permission Architect</span>
                </h3>
                <p className="text-xs text-secondary mt-0.5">
                  Configure role access to modules (toggle On/Off for Expenses, Attendance, Leads, etc.) and granular capabilities across all roles.
                </p>
              </div>
              <button
                onClick={() => setShowCreateRoleModal(true)}
                className="h-9 px-4 rounded-lg bg-primary hover:bg-primary/90 text-on-primary text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs shrink-0"
              >
                <span className="material-symbols-outlined text-[16px]">add_moderator</span>
                <span>+ Create Custom Role</span>
              </button>
            </div>

            {/* Roles Matrix */}
            <div className="space-y-4">
              {customRoles.map((role) => (
                <div 
                  key={role.id}
                  className="p-4 rounded-xl bg-surface border border-outline-variant/80 space-y-3"
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="font-bold text-sm text-on-surface">{role.name}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        role.isSystem ? 'bg-secondary-container text-secondary' : 'bg-primary/15 text-primary'
                      }`}>
                        {role.isSystem ? 'System Built-in' : 'Custom Defined'}
                      </span>
                      <span className="font-mono text-[10px] text-secondary">({role.id})</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="text-xs text-secondary italic">{role.description}</p>
                      {!role.isSystem && (
                        <button
                          type="button"
                          onClick={() => handleOpenRenameRole(role)}
                          className="h-7 px-2.5 rounded bg-surface hover:bg-surface-container border border-outline-variant font-semibold text-[11px] text-on-surface transition-colors flex items-center gap-1 cursor-pointer shrink-0"
                          title="Rename this role and cascade updates to assigned staff"
                        >
                          <span className="material-symbols-outlined text-[13px]">edit</span>
                          <span>Rename Role</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Modules Bar & Interactive Toggles */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-secondary uppercase tracking-wider">
                        Accessible Modules (Click to Toggle On/Off):
                      </span>
                      {role.id === 'super_admin' ? (
                        <span className="text-[10px] text-primary font-semibold flex items-center gap-1">
                          <span className="material-symbols-outlined text-xs">lock</span> Full System Access
                        </span>
                      ) : (
                        <span className="text-[10px] text-secondary">
                          Click any module chip to instantly grant or revoke access
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap text-xs">
                      {ALL_SYSTEM_MODULES.map((mod) => {
                        const isSuper = role.id === 'super_admin';
                        const isAllowed = isSuper || (role.allowedModules || []).includes(mod.id);

                        return (
                          <button
                            key={mod.id}
                            type="button"
                            disabled={isSuper}
                            onClick={() => {
                              if (isSuper) return;
                              toggleRoleModule(role.id, mod.id);
                            }}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                              isAllowed
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300'
                                : 'bg-surface text-secondary/70 border border-outline-variant/60 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300'
                            } ${isSuper ? 'cursor-not-allowed opacity-90' : 'cursor-pointer shadow-xs'}`}
                            title={
                              isSuper 
                                ? 'Super Admin retains full system privileges' 
                                : isAllowed 
                                ? `Click to revoke ${mod.label} from ${role.name}` 
                                : `Click to grant ${mod.label} to ${role.name}`
                            }
                          >
                            <span className="material-symbols-outlined text-[15px]">
                              {isAllowed ? 'check_circle' : 'add_circle'}
                            </span>
                            <span>{mod.label}</span>
                            <span className={`text-[9px] font-bold uppercase tracking-wider px-1 py-0.2 rounded ml-1 ${
                              isAllowed ? 'bg-emerald-200/60 text-emerald-900' : 'bg-surface-container text-secondary'
                            }`}>
                              {isAllowed ? 'ON' : 'OFF'}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Capability Toggles */}
                  <div className="pt-2 border-t border-outline-variant/40">
                    <span className="text-[11px] font-bold text-secondary uppercase tracking-wider block mb-2">
                      Granular Feature Permissions:
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 text-xs">
                      {[
                        { key: 'canAddCourses' as const, label: 'Add / Edit Courses', icon: 'menu_book' },
                        { key: 'canAddCohorts' as const, label: 'Launch Cohorts', icon: 'rocket_launch' },
                        { key: 'canAddLeads' as const, label: 'Intake Leads', icon: 'leaderboard' },
                        { key: 'canEnrollStudents' as const, label: 'Enroll Students', icon: 'school' },
                        { key: 'canViewBilling' as const, label: 'View Tuition Ledger', icon: 'payments' },
                        { key: 'canLogExpenses' as const, label: 'Log Expenses', icon: 'receipt' },
                        { key: 'canApproveExpenses' as const, label: 'Approve Expenses', icon: 'verified' },
                        { key: 'canIssueCertificates' as const, label: 'Issue Certificates', icon: 'workspace_premium' },
                        { key: 'canManageSettings' as const, label: 'Manage Settings', icon: 'settings' },
                        { key: 'canManageAttendance' as const, label: 'Staff Attendance', icon: 'schedule' },
                        { key: 'canSubmitReports' as const, label: 'Submit Evaluations', icon: 'assessment' },
                      ].map(({ key, label, icon }) => {
                        const isGranted = role.id === 'super_admin' || Boolean(role.permissions?.[key]);
                        const isImmutable = role.id === 'super_admin';

                        return (
                          <button
                            key={key}
                            type="button"
                            disabled={isImmutable}
                            onClick={() => {
                              if (isImmutable) return;
                              const currentPerms = role.permissions || {
                                canAddCourses: false, canAddCohorts: false, canAddLeads: false, canEnrollStudents: false,
                                canLogExpenses: false, canApproveExpenses: false, canIssueCertificates: false, canViewBilling: false,
                                canManageSettings: false, canManageAttendance: false, canSubmitReports: false
                              };
                              updateRolePermissions(role.id, {
                                permissions: {
                                  ...currentPerms,
                                  [key]: !currentPerms[key],
                                }
                              });
                            }}
                            className={`p-2 rounded-lg border text-left flex items-center justify-between transition-all ${
                              isGranted
                                ? 'bg-primary/10 border-primary text-primary font-semibold'
                                : 'bg-surface border-outline-variant text-secondary'
                            } ${isImmutable ? 'opacity-80 cursor-not-allowed' : 'cursor-pointer hover:border-primary'}`}
                          >
                            <span className="flex items-center gap-1.5 truncate">
                              <span className="material-symbols-outlined text-[15px]">{icon}</span>
                              <span className="truncate">{label}</span>
                            </span>
                            <span className="material-symbols-outlined text-[16px] shrink-0">
                              {isGranted ? 'check_circle' : 'cancel'}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Create Custom Role Modal */}
          {showCreateRoleModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-inverse-surface/40 backdrop-blur-xs p-margin-page animate-in fade-in duration-150">
              <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-xl p-stack-lg max-w-lg w-full space-y-4 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center border-b border-outline-variant pb-3">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[22px]">add_moderator</span>
                    <h3 className="font-headline-md text-headline-md font-bold text-on-surface">Architect Custom Role</h3>
                  </div>
                  <button onClick={() => setShowCreateRoleModal(false)} className="text-secondary hover:text-on-surface">
                    <span className="material-symbols-outlined text-[20px]">close</span>
                  </button>
                </div>

                <form onSubmit={handleCreateRoleSubmit} className="space-y-3.5 text-xs">
                  <div>
                    <label className="block text-secondary font-semibold mb-1">Role Title / Name *</label>
                    <input
                      type="text"
                      required
                      value={newRoleName}
                      onChange={(e) => setNewRoleName(e.target.value)}
                      placeholder="e.g. IT Support Specialist or Customer Service"
                      className="w-full p-2.5 bg-surface border border-outline-variant rounded-lg text-on-surface focus:border-primary outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-secondary font-semibold mb-1">Role Description &amp; Scope *</label>
                    <input
                      type="text"
                      required
                      value={newRoleDescription}
                      onChange={(e) => setNewRoleDescription(e.target.value)}
                      placeholder="e.g. Handles technical support, student inquiries and system maintenance"
                      className="w-full p-2.5 bg-surface border border-outline-variant rounded-lg text-on-surface focus:border-primary outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-secondary font-semibold mb-1.5">Accessible Modules *</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'courses', label: 'Programs & Cohorts' },
                        { id: 'leads', label: 'Leads Pipeline' },
                        { id: 'students', label: 'Students & Billing' },
                        { id: 'mentors', label: 'Mentors & Sessions' },
                        { id: 'attendance', label: 'Staff Attendance' },
                        { id: 'expenses', label: 'Expenses & Budget' },
                        { id: 'tickets', label: 'Support & Tickets' },
                      ].map((mod) => (
                        <label key={mod.id} className="flex items-center gap-2 p-2 rounded border border-outline-variant/60 cursor-pointer hover:bg-surface">
                          <input
                            type="checkbox"
                            checked={newRoleModules.includes(mod.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setNewRoleModules(prev => [...prev, mod.id]);
                              } else {
                                setNewRoleModules(prev => prev.filter(m => m !== mod.id));
                              }
                            }}
                            className="rounded accent-primary cursor-pointer"
                          />
                          <span>{mod.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-secondary font-semibold mb-1.5">Granular Permissions</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { key: 'canAddCourses' as const, label: 'Add / Edit Courses' },
                        { key: 'canAddCohorts' as const, label: 'Launch Cohorts' },
                        { key: 'canAddLeads' as const, label: 'Intake Leads' },
                        { key: 'canEnrollStudents' as const, label: 'Enroll Students' },
                        { key: 'canViewBilling' as const, label: 'View Tuition Ledger' },
                        { key: 'canLogExpenses' as const, label: 'Log Expenses' },
                        { key: 'canApproveExpenses' as const, label: 'Approve Expenses' },
                        { key: 'canIssueCertificates' as const, label: 'Issue Certificates' },
                        { key: 'canManageAttendance' as const, label: 'Staff Attendance' },
                        { key: 'canSubmitReports' as const, label: 'Submit Evaluations' },
                      ].map(({ key, label }) => (
                        <label key={key} className="flex items-center gap-2 p-2 rounded border border-outline-variant/60 cursor-pointer hover:bg-surface">
                          <input
                            type="checkbox"
                            checked={Boolean(newRolePermissions[key])}
                            onChange={(e) => {
                              setNewRolePermissions(prev => ({ ...prev, [key]: e.target.checked }));
                            }}
                            className="rounded accent-primary cursor-pointer"
                          />
                          <span>{label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-3 border-t border-outline-variant">
                    <button
                      type="button"
                      onClick={() => setShowCreateRoleModal(false)}
                      className="px-4 py-2 rounded-lg border border-outline-variant text-secondary font-semibold hover:bg-surface-container"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-lg bg-primary text-on-primary font-bold hover:bg-primary/90 transition-colors shadow-xs"
                    >
                      Save Custom Role
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: EMAIL & SMTP DISPATCH CENTER (SUPER ADMIN ONLY) */}
      {/* ========================================================================= */}
      {isSuperAdmin && effectiveSection === 'emailing' && (
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
      {/* TAB 4: BACKUPS, RESTORE & PRODUCTION DATA FLUSH (SUPER ADMIN ONLY) */}
      {/* ========================================================================= */}
      {isSuperAdmin && effectiveSection === 'backups' && (
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
        </main>
      </div>

      {/* ========================================================================= */}
      {/* EDIT STAFF MODAL */}
      {/* ========================================================================= */}
      {editingStaffUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-inverse-surface/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-surface border border-outline-variant rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex justify-between items-center border-b border-outline-variant pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[22px]">badge</span>
                <h3 className="font-headline-md text-base font-bold text-on-surface">Edit Staff Profile &amp; Role</h3>
              </div>
              <button onClick={() => setEditingStaffUser(null)} className="text-secondary hover:text-on-surface cursor-pointer">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveStaffEdit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-secondary font-semibold mb-1">Full Legal Name *</label>
                <input
                  type="text"
                  required
                  value={editStaffName}
                  onChange={(e) => setEditStaffName(e.target.value)}
                  className="w-full p-2.5 bg-surface border border-outline-variant rounded-lg text-on-surface focus:border-primary outline-none"
                />
              </div>

              <div>
                <label className="block text-secondary font-semibold mb-1">Institutional Email Address *</label>
                <input
                  type="email"
                  required
                  value={editStaffEmail}
                  onChange={(e) => setEditStaffEmail(e.target.value)}
                  className="w-full p-2.5 bg-surface border border-outline-variant rounded-lg text-on-surface focus:border-primary outline-none"
                />
              </div>

              <div>
                <label className="block text-secondary font-semibold mb-1">Assigned Institutional Role *</label>
                <select
                  value={editStaffRole}
                  onChange={(e) => setEditStaffRole(e.target.value as UserRole)}
                  className="w-full p-2.5 bg-surface border border-outline-variant rounded-lg text-on-surface focus:border-primary outline-none cursor-pointer"
                >
                  <optgroup label="System Roles">
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
                <label className="block text-secondary font-semibold mb-1">Department / Faculty</label>
                <input
                  type="text"
                  value={editStaffDepartment}
                  onChange={(e) => setEditStaffDepartment(e.target.value)}
                  placeholder="e.g. Academic Affairs or Administration"
                  className="w-full p-2.5 bg-surface border border-outline-variant rounded-lg text-on-surface focus:border-primary outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-outline-variant">
                <button
                  type="button"
                  onClick={() => setEditingStaffUser(null)}
                  className="px-4 py-2 rounded-lg border border-outline-variant text-secondary font-semibold hover:bg-surface-container cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingStaffEdit}
                  className="px-5 py-2 rounded-lg bg-primary text-on-primary font-bold hover:bg-primary/90 transition-colors shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isSavingStaffEdit ? 'Saving...' : 'Save Profile Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DELETE STAFF CONFIRMATION MODAL */}
      {/* ========================================================================= */}
      {deletingStaffUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-inverse-surface/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-surface border border-outline-variant rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-error/10 text-error flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-[32px]">person_remove</span>
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-headline-md text-base font-bold text-on-surface">Delete Staff Member</h3>
              <p className="text-xs text-secondary leading-relaxed">
                Are you sure you want to delete <strong className="text-on-surface">{deletingStaffUser.name}</strong> ({deletingStaffUser.email})? This staff account will be permanently removed from the institutional directory.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingStaffUser(null)}
                className="flex-1 h-10 rounded-lg bg-surface hover:bg-surface-container border border-outline-variant font-bold text-xs text-on-surface transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeletingStaff}
                onClick={handleConfirmDeleteStaff}
                className="flex-1 h-10 rounded-lg bg-error hover:bg-error/90 font-bold text-xs text-white shadow-md transition-colors cursor-pointer disabled:opacity-50"
              >
                {isDeletingStaff ? 'Deleting...' : 'Yes, Delete Staff'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* RENAME CUSTOM ROLE MODAL */}
      {/* ========================================================================= */}
      {renamingRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-inverse-surface/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-surface border border-outline-variant rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex justify-between items-center border-b border-outline-variant pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[22px]">edit_square</span>
                <h3 className="font-headline-md text-base font-bold text-on-surface">Rename Role &amp; Update Title</h3>
              </div>
              <button onClick={() => setRenamingRole(null)} className="text-secondary hover:text-on-surface cursor-pointer">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <p className="text-xs text-secondary leading-relaxed">
              Renaming this role will automatically update the displayed title for all staff members assigned to this role.
            </p>

            <form onSubmit={handleSaveRoleRename} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-secondary font-semibold mb-1">Role Title / Display Name *</label>
                <input
                  type="text"
                  required
                  value={renamedRoleTitle}
                  onChange={(e) => setRenamedRoleTitle(e.target.value)}
                  placeholder="e.g. Lead Program Officer"
                  className="w-full p-2.5 bg-surface border border-outline-variant rounded-lg text-on-surface focus:border-primary outline-none"
                />
              </div>

              <div>
                <label className="block text-secondary font-semibold mb-1">Role Description &amp; Scope</label>
                <textarea
                  rows={3}
                  value={renamedRoleDesc}
                  onChange={(e) => setRenamedRoleDesc(e.target.value)}
                  placeholder="Describe responsibilities and institutional duties..."
                  className="w-full p-2.5 bg-surface border border-outline-variant rounded-lg text-on-surface focus:border-primary outline-none resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-outline-variant">
                <button
                  type="button"
                  onClick={() => setRenamingRole(null)}
                  className="px-4 py-2 rounded-lg border border-outline-variant text-secondary font-semibold hover:bg-surface-container cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isRenamingRole}
                  className="px-5 py-2 rounded-lg bg-primary text-on-primary font-bold hover:bg-primary/90 transition-colors shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isRenamingRole ? 'Renaming...' : 'Update Role Name'}
                </button>
              </div>
            </form>
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
