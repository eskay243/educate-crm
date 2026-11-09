import React, { useState, useMemo } from 'react';
import { useCRM, formatNaira } from '../../context/CRMContext';
import {
  Mentor,
  MentorWeeklyReport,
  MentorLearningMaterial,
  MentorPerformanceReview,
  MentorReimbursementRequest,
  MentorLeaveRecord,
  CompanyPropertyItem,
} from '../../types/crm';

export interface Mentor360DossierProps {
  mentor: Mentor;
  isStaffView?: boolean;
  onClose?: () => void;
}

type MentorTabKey =
  | 'basic_info'
  | 'learners_enrolment'
  | 'classes_sessions'
  | 'learner_progress'
  | 'curriculum_content'
  | 'performance'
  | 'commission_payments'
  | 'leave_attendance'
  | 'documents_property'
  | 'exit_handover';

export const Mentor360Dossier: React.FC<Mentor360DossierProps> = ({
  mentor,
  onClose,
}) => {
  const {
    currentUser,
    students,
    timetables,
    studentPerformanceReports,
    updateMentor,
    reviewUserKYC,
    openModal,
    showToast,
    logActivity,
    setSelectedStudentId,
  } = useCRM();

  const [activeTab, setActiveTab] = useState<MentorTabKey>('basic_info');

  // Modals for sub-actions within dossier
  const [showWeeklyReportModal, setShowWeeklyReportModal] = useState(false);
  const [showLearningMaterialModal, setShowLearningMaterialModal] = useState(false);
  const [showReimbursementModal, setShowReimbursementModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showLeadershipNoteModal, setShowLeadershipNoteModal] = useState(false);
  const [showAddPropertyModal, setShowAddPropertyModal] = useState(false);
  const [showKycRejectModal, setShowKycRejectModal] = useState(false);
  const [kycRejectReason, setKycRejectReason] = useState('');
  const [isReviewingKyc, setIsReviewingKyc] = useState(false);

  // Form states
  const [reportWeekEnding, setReportWeekEnding] = useState(new Date().toISOString().split('T')[0]);
  const [reportTopics, setReportTopics] = useState('');
  const [reportHighlights, setReportHighlights] = useState('');
  const [reportActionItems, setReportActionItems] = useState('');

  const [matTitle, setMatTitle] = useState('');
  const [matTrack, setMatTrack] = useState(mentor.track || 'Full-Stack Software Engineering');
  const [matType, setMatType] = useState<'link' | 'pdf' | 'slides' | 'github_repo' | 'video'>('link');
  const [matUrl, setMatUrl] = useState('');
  const [matDesc, setMatDesc] = useState('');

  const [reimbAmount, setReimbAmount] = useState('');
  const [reimbType, setReimbType] = useState<MentorReimbursementRequest['type']>('data_stipend');
  const [reimbDesc, setReimbDesc] = useState('');

  const [leaveType, setLeaveType] = useState<MentorLeaveRecord['leaveType']>('Annual');
  const [leaveStart, setLeaveStart] = useState('');
  const [leaveEnd, setLeaveEnd] = useState('');
  const [leaveReason, setLeaveReason] = useState('');

  const [noteContent, setNoteContent] = useState('');
  const [noteType, setNoteType] = useState<'regular' | 'warning' | 'commendation'>('regular');
  const [noteReviewerRole, setNoteReviewerRole] = useState<'COO' | 'Program Manager' | 'Program Officer'>('COO');

  // Property states
  const [propType, setPropType] = useState<CompanyPropertyItem['itemType']>('Laptop / MacBook');
  const [propDesc, setPropDesc] = useState('');
  const [propSerial, setPropSerial] = useState('');
  const [propTag, setPropTag] = useState('');
  const [propCondition, setPropCondition] = useState<CompanyPropertyItem['conditionOnIssue']>('Brand New');

  // Role permissions
  const isSuperAdmin = currentUser?.role === 'super_admin';
  const isProgramOfficer = currentUser?.role === 'program_officer';
  const canManageLeadershipNotes = isSuperAdmin || isProgramOfficer;
  const canManageCompanyProperty = isSuperAdmin || isProgramOfficer;
  const canManageExitHandover = isSuperAdmin || isProgramOfficer;

  // Strict Compliance Guard: Nobody can review or approve their own KYC
  const isReviewingSelf = useMemo(() => {
    if (!currentUser || !mentor) return false;
    const targetEmail = mentor.email?.toLowerCase().trim();
    const currentEmail = currentUser.email?.toLowerCase().trim();
    const currentSecondary = (currentUser as any).secondaryEmail?.toLowerCase().trim();
    return Boolean(
      (mentor.id && currentUser.id === mentor.id) ||
      (targetEmail && (targetEmail === currentEmail || targetEmail === currentSecondary))
    );
  }, [currentUser, mentor]);

  const canReviewThisKYC = isSuperAdmin && !isReviewingSelf;

  // Assigned Mentees
  const assignedStudents = useMemo(() => {
    return students.filter(
      s => s.mentorId === mentor.id || (s.mentorName && s.mentorName.toLowerCase().trim() === mentor.name.toLowerCase().trim())
    );
  }, [students, mentor.id, mentor.name]);

  // Timetables / Classes
  const mentorTimetables = useMemo(() => {
    return timetables.filter(
      t => t.mentorId === mentor.id || (t.mentorName && t.mentorName.toLowerCase().trim() === mentor.name.toLowerCase().trim())
    );
  }, [timetables, mentor.id, mentor.name]);

  // Performance Reports / Evaluations
  const mentorEvaluations = useMemo(() => {
    return studentPerformanceReports.filter(
      r => r.mentorId === mentor.id || (r.mentorName && r.mentorName.toLowerCase().trim() === mentor.name.toLowerCase().trim())
    );
  }, [studentPerformanceReports, mentor.id, mentor.name]);

  // Commission & Qualification Calculations
  const enrolledCount = assignedStudents.length || mentor.assignedEnrollmentsCount || 1;
  const standardTuitionFee = 350000;
  const potentialCommissionPool = enrolledCount * standardTuitionFee * ((mentor.commissionRate || 37) / 100);
  const lecturedHours = mentor.lecturedHours || 24;
  const requiredHours = mentor.minimumRequiredHours || 20;
  const isQualifiedForPayout = lecturedHours >= requiredHours && (mentor.isBankVerified || mentor.bankVerified);

  // Formatted KYC Tier
  const cleanKycTier = String(mentor.kycTier || 3).replace(/^(Tier\s*)+/i, '');

  // Tab configurations
  const tabList = [
    { key: 'basic_info' as MentorTabKey, label: 'Basic Info & 3-Tier KYC', icon: 'badge', badge: mentor.kycStatus === 'Verified' ? 'Tier 3' : 'KYC Pending' },
    { key: 'learners_enrolment' as MentorTabKey, label: 'Learners & Enrolment', icon: 'groups', badge: `${enrolledCount} Scholars` },
    { key: 'classes_sessions' as MentorTabKey, label: 'Classes & Sessions', icon: 'calendar_month', badge: `${mentorTimetables.length} Classes` },
    { key: 'learner_progress' as MentorTabKey, label: 'Learner Progress', icon: 'trending_up', badge: `${mentorEvaluations.length} Reviews` },
    { key: 'curriculum_content' as MentorTabKey, label: 'Curriculum & Content', icon: 'menu_book', badge: (mentor.learningMaterials?.length || 0) + (mentor.curriculumContributions?.length || 0) || null },
    { key: 'performance' as MentorTabKey, label: 'Performance & Reviews', icon: 'insights', badge: `${mentor.rating || 4.9} ★` },
    { key: 'commission_payments' as MentorTabKey, label: '37% Commission Engine', icon: 'payments', badge: isQualifiedForPayout ? 'Qualified' : 'Pending' },
    { key: 'leave_attendance' as MentorTabKey, label: 'Leave & Attendance', icon: 'event_available', badge: `${(mentor.annualLeaveAllowance || 20) - (mentor.annualLeaveUsed || 4)}d Leave` },
    { key: 'documents_property' as MentorTabKey, label: 'Documents & Property', icon: 'devices', badge: mentor.companyProperty?.length ? `${mentor.companyProperty.length} Assets` : null },
    { key: 'exit_handover' as MentorTabKey, label: 'Exit & Handover Tracker', icon: 'exit_to_app', badge: 'TKT-1038' },
  ];

  const defaultHandoverChecklist = [
    { id: 'chk-1', label: 'Return issued MacBook Pro and charger to IT Administrator', completed: false, officer: 'IT Operations Lead' },
    { id: 'chk-2', label: 'Return Dell UltraSharp 4K Monitor and video cables to Campus Hub', completed: false, officer: 'Hub Facility Manager' },
    { id: 'chk-3', label: 'Surrender RFID Campus Keycard & Lab Server Room Token', completed: false, officer: 'Security & Facilities' },
    { id: 'chk-4', label: 'Transition assigned student cohorts to designated interim faculty lead', completed: false, officer: 'Academic Program Officer' },
    { id: 'chk-5', label: 'Submit all outstanding project evaluations and gradebook sign-offs', completed: false, officer: 'Registrar & Academic Board' },
    { id: 'chk-6', label: 'Reconcile final 37% commission payout and OpEx reimbursement claims', completed: false, officer: 'Bursar & Finance Desk' },
  ];

  // KYC review handlers
  const handleApproveKYC = async () => {
    setIsReviewingKyc(true);
    try {
      await reviewUserKYC(mentor.id, 'mentor', 'Verified');
      updateMentor(mentor.id, { kycStatus: 'Verified', kycTier: 3, isAccountVerified: true, bankVerified: true });
      showToast('KYC Approved', `${mentor.name}'s Tier 3 KYC and settlement NUBAN marked Verified.`, 'success');
    } catch (e: any) {
      showToast('Approval Error', e.message, 'error');
    } finally {
      setIsReviewingKyc(false);
    }
  };

  const handleRejectKYC = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kycRejectReason.trim()) {
      showToast('Validation Error', 'Please provide a reason for requesting resubmission.', 'warning');
      return;
    }
    setIsReviewingKyc(true);
    try {
      await reviewUserKYC(mentor.id, 'mentor', 'Incomplete', kycRejectReason.trim());
      updateMentor(mentor.id, { kycStatus: 'Incomplete' });
      showToast('KYC Rejected', `Rejection notice recorded for ${mentor.name}.`, 'warning');
      setShowKycRejectModal(false);
      setKycRejectReason('');
    } catch (e: any) {
      showToast('Rejection Error', e.message, 'error');
    } finally {
      setIsReviewingKyc(false);
    }
  };

  const handleAddProperty = (e: React.FormEvent) => {
    e.preventDefault();
    if (!propTag.trim() || !propDesc.trim()) {
      showToast('Validation Error', 'Asset tag and description are required.', 'warning');
      return;
    }
    const newItem: CompanyPropertyItem = {
      id: `prop-${Date.now()}`,
      mentorId: mentor.id,
      itemType: propType,
      itemDescription: propDesc.trim(),
      serialNumber: propSerial.trim(),
      assetTag: propTag.trim(),
      issuedDate: new Date().toISOString().split('T')[0],
      conditionOnIssue: propCondition,
      status: 'In Possession',
    };
    const updated = [...(mentor.companyProperty || []), newItem];
    updateMentor(mentor.id, { companyProperty: updated });
    showToast('Property Issued', `${propType} (${propTag}) assigned to ${mentor.name}.`, 'success');
    setShowAddPropertyModal(false);
    setPropDesc('');
    setPropSerial('');
    setPropTag('');
  };

  const handleTogglePropertyStatus = (propId: string) => {
    if (!canManageCompanyProperty) {
      showToast('Access Denied', 'Only Program Office and IT Operations can manage property custody status.', 'error');
      return;
    }
    const currentList = mentor.companyProperty || [
      {
        id: 'prop-1',
        mentorId: mentor.id,
        itemType: 'Laptop / MacBook' as const,
        itemDescription: 'Apple MacBook Pro 16" (M3 Pro, 36GB RAM, 512GB SSD Space Black)',
        serialNumber: 'C02G90XXMD6M',
        assetTag: 'CDL-ASSET-2026-042',
        issuedDate: '2026-01-16',
        conditionOnIssue: 'Brand New' as const,
        status: 'In Possession' as const,
      },
      {
        id: 'prop-2',
        mentorId: mentor.id,
        itemType: 'Monitor' as const,
        itemDescription: 'Dell UltraSharp 27" 4K USB-C Hub Monitor (U2723QE)',
        serialNumber: 'CN-0K791X-74261',
        assetTag: 'CDL-ASSET-2026-089',
        issuedDate: '2026-01-16',
        conditionOnIssue: 'Brand New' as const,
        status: 'In Possession' as const,
      },
      {
        id: 'prop-3',
        mentorId: mentor.id,
        itemType: 'Lab Access Key / Badge' as const,
        itemDescription: 'Yaba Tech Hub RFID Master Keycard & Server Room Token',
        assetTag: 'CDL-KEY-YAB-07',
        issuedDate: '2026-01-16',
        conditionOnIssue: 'Good' as const,
        status: 'In Possession' as const,
      }
    ];
    const updated = currentList.map(p => {
      if (p.id === propId) {
        const nextStatus: CompanyPropertyItem['status'] = p.status === 'In Possession' ? 'Returned' : 'In Possession';
        return {
          ...p,
          status: nextStatus,
          returnedDate: nextStatus === 'Returned' ? new Date().toISOString().split('T')[0] : undefined,
        };
      }
      return p;
    });
    updateMentor(mentor.id, { companyProperty: updated });
    showToast('Asset Status Updated', 'Company property status updated.', 'success');
  };

  const handleToggleHandoverItem = (itemId: string) => {
    if (!canManageExitHandover) {
      showToast('Access Denied', 'Only Program Office and HR can verify handover clearance items.', 'error');
      return;
    }
    const currentList = mentor.exitRecord?.handoverChecklist || defaultHandoverChecklist;
    const updatedList = currentList.map(item => {
      if (item.id === itemId) {
        const nextVal = !item.completed;
        return {
          ...item,
          completed: nextVal,
          verifiedBy: nextVal ? (currentUser?.name || 'Program Officer') : undefined,
          verifiedAt: nextVal ? new Date().toISOString() : undefined,
        };
      }
      return item;
    });
    const updatedExitRecord = {
      noticePeriodDays: mentor.exitRecord?.noticePeriodDays || 30,
      status: updatedList.every(i => i.completed) ? ('Handover In Progress' as const) : (mentor.exitRecord?.status || 'Active Staff'),
      ticketReference: 'TKT-1038',
      handoverChecklist: updatedList,
    };
    updateMentor(mentor.id, { exitRecord: updatedExitRecord });
    showToast('Handover Updated', 'Checklist status updated.', 'info');
  };

  // Helper actions
  const handleSaveWeeklyReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportHighlights.trim()) {
      showToast('Validation Error', 'Please enter weekly key highlights.', 'warning');
      return;
    }
    const newReport: MentorWeeklyReport = {
      id: `rep-${Date.now()}`,
      mentorId: mentor.id,
      weekEnding: reportWeekEnding,
      learnersCoveredCount: assignedStudents.length,
      sessionsHeldCount: mentorTimetables.filter(t => t.attendanceMarked).length || 2,
      topicsCovered: reportTopics.split(',').map(s => s.trim()).filter(Boolean),
      keyHighlights: reportHighlights,
      actionItemsNextWeek: reportActionItems || 'Continue hands-on project reviews and sprint coaching.',
      submittedAt: new Date().toISOString(),
    };
    const updatedReports = [newReport, ...(mentor.weeklyReports || [])];
    updateMentor(mentor.id, { weeklyReports: updatedReports });
    showToast('Weekly Report Filed', `Report for week ending ${reportWeekEnding} submitted successfully.`, 'success');
    logActivity({
      title: 'Mentor Weekly Report Filed',
      description: `${mentor.name} submitted academic progress report for week ending ${reportWeekEnding}.`,
      type: 'mentor',
      user: mentor.name,
    });
    setReportHighlights('');
    setReportTopics('');
    setReportActionItems('');
    setShowWeeklyReportModal(false);
  };

  const handleSaveLearningMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!matTitle.trim() || !matUrl.trim()) {
      showToast('Validation Error', 'Title and Resource URL/Link are required.', 'warning');
      return;
    }
    const newMaterial: MentorLearningMaterial = {
      id: `mat-${Date.now()}`,
      mentorId: mentor.id,
      title: matTitle.trim(),
      track: matTrack,
      resourceType: matType,
      url: matUrl.trim(),
      description: matDesc.trim(),
      uploadedAt: new Date().toISOString(),
      isPublicToLearners: true,
    };
    const updatedMaterials = [newMaterial, ...(mentor.learningMaterials || [])];
    updateMentor(mentor.id, { learningMaterials: updatedMaterials });
    showToast('Learning Material Added', `"${matTitle}" made available to scholars.`, 'success');
    setMatTitle('');
    setMatUrl('');
    setMatDesc('');
    setShowLearningMaterialModal(false);
  };

  const handleSaveReimbursement = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = Number(reimbAmount);
    if (!amountNum || amountNum <= 0) {
      showToast('Invalid Amount', 'Please provide a valid reimbursement amount.', 'warning');
      return;
    }
    const newRequest: MentorReimbursementRequest = {
      id: `reimb-${Date.now()}`,
      mentorId: mentor.id,
      amount: amountNum,
      type: reimbType,
      description: reimbDesc || 'Academic data & workshop expense claim',
      status: 'Pending',
      requestedAt: new Date().toISOString(),
      voucherNumber: `VCH-${Math.floor(1000 + Math.random() * 9000)}`,
    };
    const updatedReimbursements = [newRequest, ...(mentor.reimbursementRequests || [])];
    updateMentor(mentor.id, { reimbursementRequests: updatedReimbursements });
    showToast('Reimbursement Filed', `Claim for ${formatNaira(amountNum)} submitted for Finance approval.`, 'success');
    setReimbAmount('');
    setReimbDesc('');
    setShowReimbursementModal(false);
  };

  const handleSaveLeaveRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveStart || !leaveEnd) {
      showToast('Date Missing', 'Please specify leave start and end dates.', 'warning');
      return;
    }
    const days = Math.max(1, Math.round((new Date(leaveEnd).getTime() - new Date(leaveStart).getTime()) / (1000 * 3600 * 24)) + 1);
    const newLeave: MentorLeaveRecord = {
      id: `leave-${Date.now()}`,
      mentorId: mentor.id,
      leaveType,
      startDate: leaveStart,
      endDate: leaveEnd,
      daysCount: days,
      reason: leaveReason || 'Personal break & research leave',
      status: 'Approved',
      approvedBy: 'Academic Director / COO',
      appliedAt: new Date().toISOString(),
    };
    const updatedLeaves = [newLeave, ...(mentor.leaveRecords || [])];
    const newLeaveUsed = (mentor.annualLeaveUsed || 4) + (leaveType === 'Annual' ? days : 0);
    updateMentor(mentor.id, {
      leaveRecords: updatedLeaves,
      annualLeaveUsed: newLeaveUsed,
    });
    showToast('Leave Approved', `${days} day(s) ${leaveType} leave scheduled.`, 'success');
    setLeaveReason('');
    setShowLeaveModal(false);
  };

  const handleSaveLeadershipNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteContent.trim()) {
      showToast('Validation Error', 'Note content cannot be empty.', 'warning');
      return;
    }
    const newReview: MentorPerformanceReview = {
      id: `rev-${Date.now()}`,
      mentorId: mentor.id,
      reviewPeriod: new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' }),
      score: 95,
      attendanceDeliveryRate: 98,
      learnerSatisfactionScore: mentor.rating || 4.9,
      leadershipNotes: noteContent,
      reviewerName: currentUser?.name || 'Chief Operating Officer',
      reviewerRole: noteReviewerRole,
      commendations: noteType === 'commendation' ? [noteContent] : [],
      warnings: noteType === 'warning' ? [noteContent] : [],
      reviewedAt: new Date().toISOString(),
    };
    const updatedReviews = [newReview, ...(mentor.performanceReviews || [])];
    updateMentor(mentor.id, { performanceReviews: updatedReviews });
    showToast('Leadership Note Logged', `Official note from ${noteReviewerRole} logged on mentor dossier.`, 'success');
    setNoteContent('');
    setShowLeadershipNoteModal(false);
  };

  return (
    <div className="bg-surface rounded-2xl border border-outline-variant shadow-xl overflow-hidden flex flex-col max-h-[92vh]">
      {/* ========================================================================= */}
      {/* 1. TOP HEADER BANNER: MENTOR IDENTITY & EXECUTIVE QUICK ACTIONS           */}
      {/* ========================================================================= */}
      <div className="bg-surface-container-low border-b border-outline-variant p-5 sm:p-6 shrink-0">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-start sm:items-center gap-4">
            <div className="relative">
              {mentor.avatarUrl ? (
                <img
                  src={mentor.avatarUrl}
                  alt={mentor.name}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-primary/20 shadow-xs"
                />
              ) : (
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-primary/10 border-2 border-primary/20 text-primary font-bold text-2xl flex items-center justify-center">
                  {(mentor.name || 'M').charAt(0)}
                </div>
              )}
              <span
                className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-surface flex items-center justify-center ${
                  mentor.isActive !== false ? 'bg-emerald-500' : 'bg-rose-500'
                }`}
                title={mentor.isActive !== false ? 'Faculty Member Active' : 'Faculty Deactivated'}
              >
                <span className="material-symbols-outlined text-[12px] text-white">
                  {mentor.isActive !== false ? 'check' : 'close'}
                </span>
              </span>
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-on-surface">{mentor.name}</h1>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-bold border border-primary/20">
                  {mentor.mentorCode || 'MEN-FACULTY'}
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 font-bold border border-emerald-500/20 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[13px]">verified</span>
                  <span>Tier {cleanKycTier} Verified</span>
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-secondary mt-1">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px] text-primary">school</span>
                  <strong className="text-on-surface">{mentor.position || mentor.role || 'Senior Faculty Mentor'}</strong>
                </span>
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">domain</span>
                  <span>{mentor.department}</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px] text-amber-600">supervisor_account</span>
                  <span>Reports To: <strong className="text-on-surface">{mentor.reportsTo || 'Chief Operating Officer (COO)'}</strong></span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">calendar_today</span>
                  <span>Joined: {mentor.joinedDate || '2026-01-15'}</span>
                </span>
              </div>

              {/* Direct Quick Contact Buttons */}
              <div className="flex flex-wrap items-center gap-2 mt-2.5">
                <a
                  href={`https://wa.me/${(mentor.phone || '').replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-xs"
                >
                  <span className="material-symbols-outlined text-[15px]">chat</span>
                  <span>WhatsApp</span>
                </a>
                <a
                  href={`tel:${mentor.phone}`}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-surface-container border border-outline-variant text-on-surface hover:bg-surface-container-high transition-colors"
                >
                  <span className="material-symbols-outlined text-[15px] text-secondary">call</span>
                  <span>{mentor.phone}</span>
                </a>
                <a
                  href={`mailto:${mentor.email}`}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-surface-container border border-outline-variant text-on-surface hover:bg-surface-container-high transition-colors"
                >
                  <span className="material-symbols-outlined text-[15px] text-secondary">mail</span>
                  <span>{mentor.email}</span>
                </a>
              </div>
            </div>
          </div>

          {/* Top Quick Actions Bar */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowWeeklyReportModal(true)}
              className="h-9 px-3 bg-secondary-container text-primary rounded-lg text-xs font-bold hover:bg-surface-container-high transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
              title="Submit weekly progress report on scholars and sessions"
            >
              <span className="material-symbols-outlined text-[16px]">assignment_turned_in</span>
              <span>+ Weekly Report</span>
            </button>

            <button
              onClick={() => setShowLearningMaterialModal(true)}
              className="h-9 px-3 bg-secondary-container text-primary rounded-lg text-xs font-bold hover:bg-surface-container-high transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
              title="Add learning material or paste external URL link"
            >
              <span className="material-symbols-outlined text-[16px]">link</span>
              <span>+ Resource Link</span>
            </button>

            {canManageLeadershipNotes && (
              <button
                onClick={() => setShowLeadershipNoteModal(true)}
                className="h-9 px-3 bg-primary text-on-primary rounded-lg text-xs font-bold hover:bg-primary/90 transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                title="Log formal COO / Program Officer leadership note or commendation"
              >
                <span className="material-symbols-outlined text-[16px]">rate_review</span>
                <span>+ Leadership Note</span>
              </button>
            )}

            {onClose && (
              <button
                onClick={onClose}
                className="h-9 w-9 rounded-lg border border-outline-variant flex items-center justify-center text-secondary hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
                title="Close Dossier"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. MAIN BODY: VERTICAL NAVIGATION SIDEBAR + TAB CONTENT AREA             */}
      {/* ========================================================================= */}
      <div className="flex flex-col md:flex-row flex-1 min-h-0">
        {/* Left Vertical Navigation Sidebar */}
        <aside className="w-full md:w-64 lg:w-72 shrink-0 border-b md:border-b-0 md:border-r border-outline-variant bg-surface-container-low/40 p-3 sm:p-4 space-y-1">
          <div className="text-[10px] font-bold text-secondary uppercase tracking-wider px-3 py-1 mb-1">
            Faculty 360° Dossier
          </div>
          <nav className="space-y-1">
            {tabList.map(tab => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                    isActive
                      ? 'bg-primary text-on-primary shadow-xs'
                      : 'text-secondary hover:text-on-surface hover:bg-surface-container'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <span className="material-symbols-outlined text-[18px] shrink-0">{tab.icon}</span>
                    <span className="truncate">{tab.label}</span>
                  </div>
                  {tab.badge && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ml-1.5 ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-surface-container-high text-primary'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Right Tab Content Panel */}
        <main className="flex-1 p-4 sm:p-6 bg-surface-container-lowest min-h-[550px] overflow-y-auto">
          {/* --------------------------------------------------------------------- */}
          {/* TAB 1: BASIC INFO & 3-TIER KYC RECORD                                 */}
          {/* --------------------------------------------------------------------- */}
          {activeTab === 'basic_info' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Card 1: Faculty Designation & Line Management */}
              <div className="bg-surface-container-low border border-outline-variant rounded-2xl p-5 sm:p-6 shadow-xs">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-outline-variant">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[22px]">badge</span>
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-on-surface">Faculty Appointment &amp; Reporting Line</h3>
                      <p className="text-xs text-secondary">Institutional position, supervisory governance, and appointment start date</p>
                    </div>
                  </div>

                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 flex items-center gap-1.5 shadow-2xs">
                    <span className="material-symbols-outlined text-[15px]">verified</span>
                    <span>Tier {cleanKycTier} Verified</span>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-5">
                  <div className="p-3.5 bg-surface-container-lowest rounded-xl border border-outline-variant">
                    <span className="text-[11px] font-bold text-secondary uppercase tracking-wider block mb-1">Official Position</span>
                    <span className="text-sm font-bold text-primary block">{mentor.position || mentor.role || 'Senior Faculty Mentor'}</span>
                  </div>

                  <div className="p-3.5 bg-surface-container-lowest rounded-xl border border-outline-variant">
                    <span className="text-[11px] font-bold text-secondary uppercase tracking-wider block mb-1">Reports To</span>
                    <span className="text-sm font-bold text-on-surface block">{mentor.reportsTo || 'Chief Operating Officer (COO)'}</span>
                  </div>

                  <div className="p-3.5 bg-surface-container-lowest rounded-xl border border-outline-variant">
                    <span className="text-[11px] font-bold text-secondary uppercase tracking-wider block mb-1">Academic Department</span>
                    <span className="text-sm font-bold text-on-surface block">{mentor.department}</span>
                  </div>

                  <div className="p-3.5 bg-surface-container-lowest rounded-xl border border-outline-variant">
                    <span className="text-[11px] font-bold text-secondary uppercase tracking-wider block mb-1">Appointment Start Date</span>
                    <span className="text-sm font-bold text-emerald-700 block">{mentor.joinedDate || '2026-01-15'}</span>
                  </div>
                </div>

                {/* Bio & Academic Statement */}
                <div className="mt-5 pt-4 border-t border-outline-variant">
                  <span className="text-[11px] font-bold text-secondary uppercase tracking-wider block mb-1">Faculty Bio &amp; Professional Statement</span>
                  <p className="text-xs text-on-surface leading-relaxed bg-surface-container-lowest p-3.5 rounded-xl border border-outline-variant">
                    {mentor.bio || `${mentor.name} is an appointed senior faculty mentor guiding scholars across practical software engineering, cloud architecture, and financial technology applications.`}
                  </p>
                </div>
              </div>

              {/* Card 2: Tier 1: Civil Identity & Primary Demographics */}
              <div className="bg-surface-container-low border border-outline-variant rounded-2xl p-5 sm:p-6 shadow-xs">
                <div className="flex items-center gap-3 pb-4 border-b border-outline-variant">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-700 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[22px]">fingerprint</span>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-on-surface">Tier 1: Civil Identity &amp; Primary Demographics</h3>
                    <p className="text-xs text-secondary">Official civil record, biometric identity, and state of origin</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-5">
                  <div className="p-3.5 bg-surface-container-lowest rounded-xl border border-outline-variant">
                    <span className="text-[11px] font-bold text-secondary uppercase tracking-wider block mb-1">Full Legal Name</span>
                    <span className="text-sm font-bold text-on-surface block">{mentor.name}</span>
                  </div>

                  <div className="p-3.5 bg-surface-container-lowest rounded-xl border border-outline-variant">
                    <span className="text-[11px] font-bold text-secondary uppercase tracking-wider block mb-1">Date of Birth</span>
                    <span className="text-sm font-bold text-on-surface block">{mentor.dateOfBirth || 'Not Specified'}</span>
                  </div>

                  <div className="p-3.5 bg-surface-container-lowest rounded-xl border border-outline-variant">
                    <span className="text-[11px] font-bold text-secondary uppercase tracking-wider block mb-1">Gender</span>
                    <span className="text-sm font-bold text-on-surface block">{mentor.gender || 'Not Specified'}</span>
                  </div>

                  <div className="p-3.5 bg-surface-container-lowest rounded-xl border border-outline-variant">
                    <span className="text-[11px] font-bold text-secondary uppercase tracking-wider block mb-1">Nationality</span>
                    <span className="text-sm font-bold text-on-surface block">{mentor.nationality || 'Nigerian (NGN)'}</span>
                  </div>

                  <div className="p-3.5 bg-surface-container-lowest rounded-xl border border-outline-variant">
                    <span className="text-[11px] font-bold text-secondary uppercase tracking-wider block mb-1">State of Origin (36 + FCT)</span>
                    <span className="text-sm font-bold text-on-surface block">{mentor.stateOfOrigin || 'Lagos State'}</span>
                  </div>

                  <div className="p-3.5 bg-surface-container-lowest rounded-xl border border-outline-variant">
                    <span className="text-[11px] font-bold text-secondary uppercase tracking-wider block mb-1">Local Govt Area (LGA)</span>
                    <span className="text-sm font-bold text-on-surface block">{mentor.lga || 'Ikeja LGA'}</span>
                  </div>

                  <div className="p-3.5 bg-surface-container-lowest rounded-xl border border-outline-variant">
                    <span className="text-[11px] font-bold text-secondary uppercase tracking-wider block mb-1">Official Mobile Phone</span>
                    <span className="text-sm font-bold text-on-surface font-mono block">{mentor.phone || 'Not Specified'}</span>
                  </div>

                  <div className="p-3.5 bg-surface-container-lowest rounded-xl border border-outline-variant">
                    <span className="text-[11px] font-bold text-secondary uppercase tracking-wider block mb-1">Official Email Address</span>
                    <span className="text-sm font-bold text-primary truncate block" title={mentor.email}>{mentor.email}</span>
                  </div>
                </div>
              </div>

              {/* Card 3: Tier 2: Government Identification & Customer Due Diligence (CDD) */}
              <div className="bg-surface-container-low border border-outline-variant rounded-2xl p-5 sm:p-6 shadow-xs">
                <div className="flex items-center gap-3 pb-4 border-b border-outline-variant">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-700 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[22px]">contact_mail</span>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-on-surface">Tier 2: Government ID &amp; CDD Verification</h3>
                    <p className="text-xs text-secondary">National statutory identification and scanned verification credentials</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-5">
                  <div className="p-3.5 bg-surface-container-lowest rounded-xl border border-outline-variant">
                    <span className="text-[11px] font-bold text-secondary uppercase tracking-wider block mb-1">Government ID Type</span>
                    <span className="text-sm font-bold text-on-surface block">{mentor.idType || 'National Identity Number (NIN)'}</span>
                  </div>

                  <div className="p-3.5 bg-surface-container-lowest rounded-xl border border-outline-variant">
                    <span className="text-[11px] font-bold text-secondary uppercase tracking-wider block mb-1">Statutory ID Number</span>
                    <span className="text-sm font-bold text-on-surface font-mono block">
                      {mentor.idNumber || '89102938475'}
                    </span>
                  </div>

                  <div className="p-3.5 bg-surface-container-lowest rounded-xl border border-outline-variant">
                    <span className="text-[11px] font-bold text-secondary uppercase tracking-wider block mb-1">CDD Verification Status</span>
                    <span className="text-sm font-bold text-emerald-700 block flex items-center gap-1">
                      <span className="material-symbols-outlined text-[15px]">verified</span>
                      <span>{mentor.isIdVerified !== false ? 'Govt ID Document Verified' : 'Pending Verification'}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 4: Tier 3: Residence, Next of Kin Guarantor & Settlement Bank */}
              <div className="bg-surface-container-low border border-outline-variant rounded-2xl p-5 sm:p-6 shadow-xs space-y-5">
                <div className="flex items-center gap-3 pb-4 border-b border-outline-variant">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[22px]">account_balance</span>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-on-surface">Tier 3: Residence, Next of Kin &amp; Settlement NUBAN</h3>
                    <p className="text-xs text-secondary">CBN verified 10-digit NUBAN, residential proof, and emergency guarantor details</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Residential Address Panel */}
                  <div className="p-4 bg-surface-container-lowest rounded-xl border border-outline-variant space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-primary">
                      <span className="material-symbols-outlined text-[18px]">location_on</span>
                      <span>Primary Residential Address</span>
                    </div>
                    <div>
                      <span className="text-[11px] font-bold text-secondary uppercase tracking-wider block mb-1">Street Address</span>
                      <p className="text-sm font-bold text-on-surface">{mentor.residentialAddress || '14 Obafemi Awolowo Way, Ikeja, Lagos'}</p>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-outline-variant/60 text-xs">
                      <span className="text-secondary font-medium">City &amp; State:</span>
                      <span className="font-bold text-on-surface">{mentor.city || 'Ikeja'}, {mentor.stateOfResidence || 'Lagos'}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-secondary font-medium">Proof of Residence:</span>
                      <span className="font-bold text-emerald-700 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">check_circle</span>
                        <span>Utility Bill on File (EKEDC / PHCN)</span>
                      </span>
                    </div>
                  </div>

                  {/* Next of Kin & Emergency Guarantor */}
                  <div className="p-4 bg-surface-container-lowest rounded-xl border border-outline-variant space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-primary">
                      <span className="material-symbols-outlined text-[18px]">contact_emergency</span>
                      <span>Next of Kin &amp; Emergency Guarantor</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-[11px] font-bold text-secondary uppercase tracking-wider block mb-1">Guarantor Name</span>
                        <p className="text-sm font-bold text-on-surface">{mentor.nextOfKinName || 'Folashade Adeleke'}</p>
                      </div>
                      <div>
                        <span className="text-[11px] font-bold text-secondary uppercase tracking-wider block mb-1">Relationship</span>
                        <p className="text-sm font-bold text-on-surface">{mentor.nextOfKinRelationship || 'Sister'}</p>
                      </div>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-outline-variant/60 text-xs">
                      <span className="text-secondary font-medium">Emergency Phone:</span>
                      <span className="font-bold text-on-surface font-mono">{mentor.nextOfKinPhone || '+234 802 998 7766'}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-secondary font-medium">Guarantor Address:</span>
                      <span className="font-bold text-on-surface">{mentor.nextOfKinAddress || 'Same as residential address'}</span>
                    </div>
                  </div>
                </div>

                {/* Settlement NUBAN Bank */}
                <div className="p-4 bg-surface-container-lowest rounded-xl border border-outline-variant space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-primary">
                    <span className="material-symbols-outlined text-[18px]">payments</span>
                    <span>Verified Settlement Bank Account (37% Commission Disbursement)</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <span className="text-[11px] font-bold text-secondary uppercase tracking-wider block mb-1">Settlement Bank</span>
                      <span className="text-sm font-bold text-on-surface block">{mentor.bankName || 'Access Bank Nigeria PLC'}</span>
                    </div>
                    <div>
                      <span className="text-[11px] font-bold text-secondary uppercase tracking-wider block mb-1">NUBAN Account Number</span>
                      <span className="text-sm font-bold text-on-surface font-mono block">{mentor.accountNumber || '0123456789'}</span>
                    </div>
                    <div>
                      <span className="text-[11px] font-bold text-secondary uppercase tracking-wider block mb-1">Verified Beneficiary Name</span>
                      <span className="text-sm font-bold text-emerald-700 block flex items-center gap-1">
                        <span className="material-symbols-outlined text-[15px]">verified</span>
                        <span>{mentor.accountName || mentor.name}</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 5: Institutional Compliance & Review Clearance Panel */}
              <div className="bg-surface-container-low border border-outline-variant rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-outline-variant">
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-primary text-[22px]">verified_user</span>
                    <div>
                      <h3 className="text-base font-bold text-on-surface">Institutional Compliance Clearance</h3>
                      <p className="text-xs text-secondary">3-Tier statutory KYC review, CBN banking verification, and governance status</p>
                    </div>
                  </div>

                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                    mentor.kycStatus === 'Verified'
                      ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30'
                      : 'bg-amber-500/10 text-amber-700 border-amber-500/30'
                  }`}>
                    {mentor.kycStatus === 'Verified' ? '✓ Verified & Cleared' : '○ Pending Compliance Review'}
                  </span>
                </div>

                {/* Self-Review Compliance Guard */}
                {isReviewingSelf && (
                  <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 flex items-start gap-3">
                    <span className="material-symbols-outlined text-[22px] text-amber-600 shrink-0">shield</span>
                    <div className="space-y-1">
                      <strong className="font-bold text-sm block">Institutional Compliance Separation</strong>
                      <p className="leading-relaxed">
                        You cannot verify or approve your own KYC record. In accordance with Educate CRM institutional standards, compliance clearance must be independently executed by the designated Compliance Officer or Academic Program Registry.
                      </p>
                    </div>
                  </div>
                )}

                {/* Third-Party Compliance Officer Review Panel */}
                {canReviewThisKYC && (
                  <div className="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <span className="text-xs font-bold text-on-surface block">Compliance Officer Administrative Clearance</span>
                      <p className="text-xs text-secondary mt-0.5">
                        Verify that submitted civil ID, proof of address, and NUBAN account match statutory records before clearance.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={handleApproveKYC}
                        disabled={isReviewingKyc}
                        className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
                      >
                        <span className="material-symbols-outlined text-[16px]">check_circle</span>
                        <span>{isReviewingKyc ? 'Processing...' : 'Approve & Mark Verified'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowKycRejectModal(true)}
                        disabled={isReviewingKyc}
                        className="px-3.5 py-2 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold hover:bg-rose-100 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <span className="material-symbols-outlined text-[16px]">cancel</span>
                        <span>Reject KYC</span>
                      </button>
                    </div>
                  </div>
                )}

                {mentor.kycApprovedBy && (
                  <div className="text-xs text-secondary flex items-center gap-1.5 pt-1">
                    <span className="material-symbols-outlined text-[16px] text-emerald-600">verified</span>
                    <span>
                      Cleared by <strong className="text-on-surface">{mentor.kycApprovedBy}</strong>
                      {mentor.kycApprovedAt ? ` on ${new Date(mentor.kycApprovedAt).toLocaleDateString()}` : ''}
                    </span>
                  </div>
                )}

                {mentor.kycRejectionReason && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
                    Resubmission Notice: {mentor.kycRejectionReason}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* --------------------------------------------------------------------- */}
          {/* TAB 2: LEARNERS & ENROLMENT (37% COMMISSION DRIVER)                   */}
          {/* --------------------------------------------------------------------- */}
          {activeTab === 'learners_enrolment' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Commission Driver Banner */}
              <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-primary text-on-primary text-[10px] font-bold uppercase tracking-wider">
                      37% Commission Pool Engine
                    </span>
                    <span className="text-xs text-secondary">Direct Institutional Driver</span>
                  </div>
                  <h3 className="text-lg font-bold text-on-surface">
                    {enrolledCount} Active Scholars Enrolled Under {mentor.name}
                  </h3>
                  <p className="text-xs text-secondary max-w-xl">
                    Mentor remuneration in Educate CRM is tied to verified student enrollments. Each enrolled scholar generates a 37% commission share of tuition fees upon lecture delivery threshold qualification.
                  </p>
                </div>

                <div className="p-4 bg-surface rounded-xl border border-outline-variant text-right shrink-0">
                  <span className="text-[11px] font-bold text-secondary uppercase tracking-wider block">Estimated Commission Value</span>
                  <span className="text-xl font-black text-emerald-700 block mt-0.5">{formatNaira(potentialCommissionPool)}</span>
                  <span className="text-[10px] text-secondary">Calculated at 37% of ₦350,000 standard tuition</span>
                </div>
              </div>

              {/* Assigned Scholars Table */}
              <div className="bg-surface-container-low border border-outline-variant rounded-2xl p-5 shadow-xs space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-bold text-on-surface flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[18px]">school</span>
                    <span>Assigned Student Cohort</span>
                  </h4>
                  <span className="text-xs text-secondary font-medium">{assignedStudents.length} Students Listed</span>
                </div>

                {assignedStudents.length > 0 ? (
                  <div className="divide-y divide-outline-variant border border-outline-variant rounded-xl overflow-hidden bg-surface-container-lowest">
                    {assignedStudents.map(student => (
                      <div key={student.id} className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 hover:bg-surface-container/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary font-bold text-sm flex items-center justify-center shrink-0">
                            {(student.name || 'S').charAt(0)}
                          </div>
                          <div>
                            <button
                              onClick={() => {
                                setSelectedStudentId(student.id);
                                openModal('student-profile');
                              }}
                              className="text-sm font-bold text-on-surface hover:text-primary transition-colors text-left cursor-pointer"
                            >
                              {student.name}
                            </button>
                            <p className="text-xs text-secondary">
                              {student.program} • {student.cohort} • Code: {student.studentCode}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                            student.attendanceRate >= 80 ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}>
                            {student.attendanceRate}% Attendance
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-surface-container border border-outline-variant text-on-surface">
                            Tuition: {student.tuitionStatus}
                          </span>
                          <button
                            onClick={() => {
                              setSelectedStudentId(student.id);
                              openModal('student-profile');
                            }}
                            className="px-2.5 py-1 rounded-lg text-xs font-bold bg-primary/10 text-primary hover:bg-primary/20 transition-colors cursor-pointer"
                          >
                            Open 360° Profile
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-surface-container-lowest rounded-xl border border-outline-variant text-secondary text-xs">
                    No individual scholars directly mapped to this mentor ID yet. Commission defaults to enrolled curriculum cohort pool.
                  </div>
                )}
              </div>

              {/* Weekly Progress Reports Ledger */}
              <div className="bg-surface-container-low border border-outline-variant rounded-2xl p-5 shadow-xs space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-sm font-bold text-on-surface flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-[18px]">assignment_turned_in</span>
                      <span>Weekly Academic Progress Reports</span>
                    </h4>
                    <p className="text-xs text-secondary">Mandatory weekly updates submitted by faculty to the Program Office</p>
                  </div>
                  <button
                    onClick={() => setShowWeeklyReportModal(true)}
                    className="px-3 py-1.5 bg-primary text-on-primary rounded-xl text-xs font-bold hover:bg-primary/90 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <span className="material-symbols-outlined text-[15px]">add</span>
                    <span>File Progress Report</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {(mentor.weeklyReports || [
                    {
                      id: 'rep-demo-1',
                      mentorId: mentor.id,
                      weekEnding: '2026-10-31',
                      learnersCoveredCount: 8,
                      sessionsHeldCount: 3,
                      topicsCovered: ['PostgreSQL Relational Schemas', 'Indexing & Triggers', 'Node.js Express Integration'],
                      keyHighlights: 'All 8 scholars successfully built authenticated REST endpoints with JWT validation. Chukwudi demonstrated high grasp of foreign key constraints.',
                      actionItemsNextWeek: 'Introduce automated Jest integration test suites and prepare for Capstone Sprint 1.',
                      submittedAt: '2026-10-31T17:00:00.000Z',
                    }
                  ]).map(rep => (
                    <div key={rep.id} className="p-4 bg-surface-container-lowest rounded-xl border border-outline-variant space-y-2">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                        <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[16px]">calendar_today</span>
                          <span>Week Ending: {rep.weekEnding}</span>
                        </span>
                        <div className="flex items-center gap-2 text-xs text-secondary">
                          <span>{rep.learnersCoveredCount} Scholars Guided</span>
                          <span>•</span>
                          <span>{rep.sessionsHeldCount} Lectures Delivered</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {rep.topicsCovered.map((topic, i) => (
                          <span key={i} className="text-[11px] font-bold px-2 py-0.5 rounded bg-surface-container border border-outline-variant text-on-surface">
                            {topic}
                          </span>
                        ))}
                      </div>

                      <p className="text-xs text-on-surface leading-relaxed mt-1">
                        <strong>Highlights:</strong> {rep.keyHighlights}
                      </p>
                      <p className="text-xs text-secondary leading-relaxed">
                        <strong>Action Items:</strong> {rep.actionItemsNextWeek}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* --------------------------------------------------------------------- */}
          {/* TAB 3: CLASSES & SESSIONS                                             */}
          {/* --------------------------------------------------------------------- */}
          {activeTab === 'classes_sessions' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Class Schedule Overview */}
              <div className="bg-surface-container-low border border-outline-variant rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-outline-variant">
                  <div>
                    <h3 className="text-base font-bold text-on-surface flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-[20px]">calendar_month</span>
                      <span>Academic Class Schedule &amp; Timetable</span>
                    </h3>
                    <p className="text-xs text-secondary">Scheduled live dates, times, venues, and syllabus module coverage</p>
                  </div>

                  <button
                    onClick={() => openModal('schedule-class')}
                    className="px-3.5 py-1.5 bg-primary text-on-primary rounded-xl text-xs font-bold hover:bg-primary/90 transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">add</span>
                    <span>Schedule New Lecture</span>
                  </button>
                </div>

                {mentorTimetables.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {mentorTimetables.map(slot => (
                      <div key={slot.id} className="p-4 bg-surface-container-lowest rounded-xl border border-outline-variant space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-primary/10 text-primary uppercase tracking-wider block w-fit mb-1">
                              {slot.cohortName || 'Engineering Track'}
                            </span>
                            <h4 className="text-sm font-bold text-on-surface">{slot.courseTitle}</h4>
                          </div>
                          <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${
                            slot.attendanceMarked ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}>
                            {slot.attendanceMarked ? 'Attendance Logged' : 'Pending Attendance'}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs text-secondary pt-2 border-t border-outline-variant/60">
                          <div>
                            <span className="block text-[10px] uppercase font-bold text-secondary">Schedule</span>
                            <span className="font-bold text-on-surface">{slot.dayOfWeek} • {slot.startTime} - {slot.endTime}</span>
                          </div>
                          <div>
                            <span className="block text-[10px] uppercase font-bold text-secondary">Venue</span>
                            <span className="font-bold text-on-surface">{slot.venue || 'Campus Hub Lab'}</span>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-outline-variant/60 text-xs">
                          <span className="text-secondary font-medium">Curriculum Module: </span>
                          <span className="font-bold text-primary">{slot.notes || slot.topic || slot.courseTitle}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-surface-container-lowest rounded-xl border border-outline-variant text-secondary text-xs">
                    No active timetable slots currently registered for {mentor.name}. Schedule upcoming classes to credit lecturing hours.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* --------------------------------------------------------------------- */}
          {/* TAB 4: LEARNER PROGRESS TRACKER                                       */}
          {/* --------------------------------------------------------------------- */}
          {activeTab === 'learner_progress' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="bg-surface-container-low border border-outline-variant rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
                <div className="flex justify-between items-center pb-4 border-b border-outline-variant">
                  <div>
                    <h3 className="text-base font-bold text-on-surface flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-[20px]">insights</span>
                      <span>Evaluations &amp; Feedback Given to Scholars</span>
                    </h3>
                    <p className="text-xs text-secondary">Formal academic evaluations, assessment grades, and milestone progress tracking</p>
                  </div>
                  <button
                    onClick={() => openModal('submit-performance-report')}
                    className="px-3.5 py-1.5 bg-primary text-on-primary rounded-xl text-xs font-bold hover:bg-primary/90 transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">rate_review</span>
                    <span>+ File Evaluation</span>
                  </button>
                </div>

                {mentorEvaluations.length > 0 ? (
                  <div className="space-y-3">
                    {mentorEvaluations.map(report => (
                      <div key={report.id} className="p-4 bg-surface-container-lowest rounded-xl border border-outline-variant space-y-2">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-on-surface">{report.studentName}</span>
                            <span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary font-bold">
                              Score: {report.performanceScore}% ({report.performanceTier})
                            </span>
                          </div>
                          <span className="text-xs text-secondary">{new Date(report.submittedAt || Date.now()).toLocaleDateString()}</span>
                        </div>
                        <p className="text-xs text-on-surface leading-relaxed">
                          <strong>Academic Feedback:</strong> {report.technicalMasteryNotes || report.recommendations}
                        </p>
                        {report.welfareObservations && (
                          <p className="text-xs text-amber-800 bg-amber-500/10 p-2.5 rounded-lg border border-amber-500/20">
                            <strong>Welfare Observation:</strong> {report.welfareObservations}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-surface-container-lowest rounded-xl border border-outline-variant text-secondary text-xs">
                    No evaluations filed yet. Click "+ File Evaluation" to grade scholar milestones and submit feedback.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* --------------------------------------------------------------------- */}
          {/* TAB 5: CURRICULUM & CONTENT                                           */}
          {/* --------------------------------------------------------------------- */}
          {activeTab === 'curriculum_content' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Learning Materials & External Links */}
              <div className="bg-surface-container-low border border-outline-variant rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
                <div className="flex justify-between items-center pb-4 border-b border-outline-variant">
                  <div>
                    <h3 className="text-base font-bold text-on-surface flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-[20px]">menu_book</span>
                      <span>Learning Materials &amp; External Resource Links</span>
                    </h3>
                    <p className="text-xs text-secondary">Upload slide decks, problem sets, and paste external links (GitHub, Notion, YouTube)</p>
                  </div>
                  <button
                    onClick={() => setShowLearningMaterialModal(true)}
                    className="px-3.5 py-1.5 bg-primary text-on-primary rounded-xl text-xs font-bold hover:bg-primary/90 transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">add_link</span>
                    <span>+ Add Material / Link</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {(mentor.learningMaterials || [
                    {
                      id: 'mat-demo-1',
                      mentorId: mentor.id,
                      title: 'Production Backend API Boilerplate (Express + TypeScript + Prisma)',
                      track: 'Full-Stack Software Engineering',
                      resourceType: 'github_repo',
                      url: 'https://github.com/codelab-institute/fullstack-starter-2026',
                      description: 'Starter repo with JWT authentication, Postgres schema migrations, and structured Docker Compose.',
                      uploadedAt: '2026-10-15T10:00:00.000Z',
                      isPublicToLearners: true,
                    },
                    {
                      id: 'mat-demo-2',
                      mentorId: mentor.id,
                      title: 'Financial Market Trading Engine Architecture (Notion Doc)',
                      track: 'Financial Markets & Trading',
                      resourceType: 'link',
                      url: 'https://notion.so/codelab/trading-engine-mastery',
                      description: 'Comprehensive guide covering order book matching algorithms and real-time WebSocket feeds.',
                      uploadedAt: '2026-10-20T12:30:00.000Z',
                      isPublicToLearners: true,
                    }
                  ]).map(mat => (
                    <div key={mat.id} className="p-4 bg-surface-container-lowest rounded-xl border border-outline-variant flex flex-col justify-between gap-3">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-primary text-[20px]">
                            {mat.resourceType === 'github_repo' ? 'code' : mat.resourceType === 'video' ? 'videocam' : 'link'}
                          </span>
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-primary/10 text-primary">
                            {mat.resourceType.toUpperCase()}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-on-surface">{mat.title}</h4>
                        {mat.description && (
                          <p className="text-xs text-secondary leading-relaxed">{mat.description}</p>
                        )}
                      </div>

                      <a
                        href={mat.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-2 px-3 rounded-lg bg-surface-container hover:bg-surface-container-high border border-outline-variant text-primary font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <span className="material-symbols-outlined text-[15px]">open_in_new</span>
                        <span>Open Resource URL</span>
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* --------------------------------------------------------------------- */}
          {/* TAB 6: PERFORMANCE & LEADERSHIP NOTES                                 */}
          {/* --------------------------------------------------------------------- */}
          {activeTab === 'performance' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="bg-surface-container-low border border-outline-variant rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
                <div className="flex justify-between items-center pb-4 border-b border-outline-variant">
                  <div>
                    <h3 className="text-base font-bold text-on-surface flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-[20px]">star</span>
                      <span>Monthly Performance Scores &amp; Leadership Ledger</span>
                    </h3>
                    <p className="text-xs text-secondary">Transparent review scores visible on mentor dashboard with feedback from COO and Program Manager</p>
                  </div>
                  {canManageLeadershipNotes && (
                    <button
                      onClick={() => setShowLeadershipNoteModal(true)}
                      className="px-3.5 py-1.5 bg-primary text-on-primary rounded-xl text-xs font-bold hover:bg-primary/90 transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">rate_review</span>
                      <span>+ Leadership Note</span>
                    </button>
                  )}
                </div>

                {/* Score Summary Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 bg-surface-container-lowest rounded-xl border border-outline-variant">
                    <span className="text-[11px] font-bold text-secondary uppercase tracking-wider block">Average Review Score</span>
                    <span className="text-2xl font-black text-primary block mt-1">96 / 100</span>
                    <span className="text-[11px] text-emerald-700 font-bold">Top 5% Faculty Tier</span>
                  </div>
                  <div className="p-4 bg-surface-container-lowest rounded-xl border border-outline-variant">
                    <span className="text-[11px] font-bold text-secondary uppercase tracking-wider block">Class Delivery Rate</span>
                    <span className="text-2xl font-black text-emerald-700 block mt-1">98.2%</span>
                    <span className="text-[11px] text-secondary">Zero unscheduled cancellations</span>
                  </div>
                  <div className="p-4 bg-surface-container-lowest rounded-xl border border-outline-variant">
                    <span className="text-[11px] font-bold text-secondary uppercase tracking-wider block">Learner Satisfaction</span>
                    <span className="text-2xl font-black text-amber-600 block mt-1">★ {mentor.rating || 4.9}</span>
                    <span className="text-[11px] text-secondary">From 24 student reviews</span>
                  </div>
                </div>

                {/* Leadership Notes History */}
                <div className="space-y-3 pt-3">
                  {(mentor.performanceReviews || [
                    {
                      id: 'rev-demo-1',
                      mentorId: mentor.id,
                      reviewPeriod: 'October 2026',
                      score: 96,
                      attendanceDeliveryRate: 98,
                      learnerSatisfactionScore: 4.9,
                      leadershipNotes: 'Exceptional delivery on the backend module. Scholars reported high clarity during live coding sessions. Commended for proactive weekend office hours.',
                      reviewerName: 'Managing Director / COO',
                      reviewerRole: 'COO',
                      commendations: ['High student completion rate on Project 2', 'Punctual class check-ins'],
                      reviewedAt: '2026-10-31T15:00:00.000Z',
                    }
                  ]).map(rev => (
                    <div key={rev.id} className="p-4 bg-surface-container-lowest rounded-xl border border-outline-variant space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-primary">
                          Review Period: {rev.reviewPeriod} • Reviewed by {rev.reviewerRole} ({rev.reviewerName})
                        </span>
                        <span className="text-xs font-bold text-emerald-700 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                          Score: {rev.score}/100
                        </span>
                      </div>
                      <p className="text-xs text-on-surface leading-relaxed">
                        {rev.leadershipNotes}
                      </p>
                      {rev.commendations && rev.commendations.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {rev.commendations.map((c, i) => (
                            <span key={i} className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                              <span className="material-symbols-outlined text-[13px]">thumb_up</span>
                              <span>{c}</span>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* --------------------------------------------------------------------- */}
          {/* TAB 7: 37% COMMISSION ENGINE & PAYMENTS                               */}
          {/* --------------------------------------------------------------------- */}
          {activeTab === 'commission_payments' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Automatic Qualification Engine Card */}
              <div className="bg-surface-container-low border border-outline-variant rounded-2xl p-5 sm:p-6 shadow-xs space-y-5">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-outline-variant">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 border border-emerald-500/30 text-[10px] font-bold uppercase tracking-wider">
                        Autonomous Qualification Engine
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-on-surface mt-1">
                      37% Tuition Commission &amp; Payout Gate
                    </h3>
                  </div>

                  <span className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${
                    isQualifiedForPayout ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-amber-50 text-amber-800 border-amber-300'
                  }`}>
                    <span className="material-symbols-outlined text-[16px]">
                      {isQualifiedForPayout ? 'check_circle' : 'hourglass_top'}
                    </span>
                    <span>{isQualifiedForPayout ? 'Qualified for Immediate Disbursement' : 'Lecturing Hours Pending'}</span>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 bg-surface-container-lowest rounded-xl border border-outline-variant">
                    <span className="text-[11px] font-bold text-secondary uppercase tracking-wider block">Lectured Hours Delivered</span>
                    <span className="text-2xl font-black text-on-surface block mt-1">{lecturedHours} hrs</span>
                    <span className="text-[11px] text-secondary">Minimum required threshold: {requiredHours} hrs</span>
                  </div>

                  <div className="p-4 bg-surface-container-lowest rounded-xl border border-outline-variant">
                    <span className="text-[11px] font-bold text-secondary uppercase tracking-wider block">Total Commission Accrued</span>
                    <span className="text-2xl font-black text-emerald-700 block mt-1">{formatNaira(potentialCommissionPool)}</span>
                    <span className="text-[11px] text-secondary">{enrolledCount} enrolled scholars × 37%</span>
                  </div>

                  <div className="p-4 bg-surface-container-lowest rounded-xl border border-outline-variant">
                    <span className="text-[11px] font-bold text-secondary uppercase tracking-wider block">Historical Paid Out</span>
                    <span className="text-2xl font-black text-primary block mt-1">{formatNaira(mentor.paidPayout || 540000)}</span>
                    <span className="text-[11px] text-secondary">Disbursed directly via Paystack</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-outline-variant">
                  <span className="text-xs text-secondary">
                    Settlement Account: <strong>{mentor.bankName || 'Access Bank'}</strong> ({mentor.accountNumber || '0123456789'})
                  </span>
                  <button
                    onClick={() => setShowReimbursementModal(true)}
                    className="px-3.5 py-1.5 bg-secondary-container text-primary rounded-xl text-xs font-bold hover:bg-surface-container-high transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">receipt_long</span>
                    <span>+ File Reimbursement Claim</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* --------------------------------------------------------------------- */}
          {/* TAB 8: LEAVE & ATTENDANCE                                             */}
          {/* --------------------------------------------------------------------- */}
          {activeTab === 'leave_attendance' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="bg-surface-container-low border border-outline-variant rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
                <div className="flex justify-between items-center pb-4 border-b border-outline-variant">
                  <div>
                    <h3 className="text-base font-bold text-on-surface flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-[20px]">event_available</span>
                      <span>Annual &amp; Sick Leave Allowances</span>
                    </h3>
                    <p className="text-xs text-secondary">Leave request balances, approvals, and class schedule check-in tracking</p>
                  </div>
                  <button
                    onClick={() => setShowLeaveModal(true)}
                    className="px-3.5 py-1.5 bg-primary text-on-primary rounded-xl text-xs font-bold hover:bg-primary/90 transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">add</span>
                    <span>+ Request Leave</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-surface-container-lowest rounded-xl border border-outline-variant space-y-2">
                    <span className="text-xs font-bold text-secondary uppercase tracking-wider block">Annual Leave Balance</span>
                    <div className="flex justify-between items-baseline">
                      <span className="text-2xl font-black text-on-surface">
                        {(mentor.annualLeaveAllowance || 20) - (mentor.annualLeaveUsed || 4)} Days Remaining
                      </span>
                      <span className="text-xs text-secondary">
                        {mentor.annualLeaveUsed || 4} of {mentor.annualLeaveAllowance || 20} used
                      </span>
                    </div>
                    <div className="w-full bg-surface-container rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-primary h-full rounded-full"
                        style={{ width: `${((mentor.annualLeaveUsed || 4) / (mentor.annualLeaveAllowance || 20)) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div className="p-4 bg-surface-container-lowest rounded-xl border border-outline-variant space-y-2">
                    <span className="text-xs font-bold text-secondary uppercase tracking-wider block">Sick Leave Balance</span>
                    <div className="flex justify-between items-baseline">
                      <span className="text-2xl font-black text-on-surface">
                        {(mentor.sickLeaveAllowance || 10) - (mentor.sickLeaveUsed || 1)} Days Remaining
                      </span>
                      <span className="text-xs text-secondary">
                        {mentor.sickLeaveUsed || 1} of {mentor.sickLeaveAllowance || 10} used
                      </span>
                    </div>
                    <div className="w-full bg-surface-container rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-emerald-600 h-full rounded-full"
                        style={{ width: `${((mentor.sickLeaveUsed || 1) / (mentor.sickLeaveAllowance || 10)) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Leave History Table */}
                <div className="space-y-3 pt-3">
                  <h4 className="text-xs font-bold text-secondary uppercase tracking-wider">Leave History &amp; Approvals</h4>
                  {(mentor.leaveRecords || [
                    {
                      id: 'leave-demo-1',
                      mentorId: mentor.id,
                      leaveType: 'Annual',
                      startDate: '2026-08-10',
                      endDate: '2026-08-14',
                      daysCount: 4,
                      reason: 'Annual family recess and tech curriculum research',
                      status: 'Approved',
                      approvedBy: 'Academic Director / COO',
                      appliedAt: '2026-08-01T09:00:00.000Z',
                    }
                  ]).map(leave => (
                    <div key={leave.id} className="p-3.5 bg-surface-container-lowest rounded-xl border border-outline-variant flex justify-between items-center text-xs">
                      <div>
                        <span className="font-bold text-on-surface block">
                          {leave.leaveType} Leave ({leave.daysCount} days): {leave.startDate} to {leave.endDate}
                        </span>
                        <span className="text-secondary">{leave.reason} • Approved by {leave.approvedBy}</span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {leave.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* --------------------------------------------------------------------- */}
          {/* TAB 9: DOCUMENTS & COMPANY PROPERTY REGISTER                          */}
          {/* --------------------------------------------------------------------- */}
          {activeTab === 'documents_property' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Employment Agreements */}
              <div className="bg-surface-container-low border border-outline-variant rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
                <div className="pb-4 border-b border-outline-variant">
                  <h3 className="text-base font-bold text-on-surface flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[20px]">description</span>
                    <span>Signed Employment &amp; Confidentiality Agreements</span>
                  </h3>
                  <p className="text-xs text-secondary">Binding institutional contracts, NDA confidentiality agreements, and IP protection</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-surface-container-lowest rounded-xl border border-outline-variant flex justify-between items-center">
                    <div>
                      <span className="text-sm font-bold text-on-surface block">Faculty Employment Agreement</span>
                      <span className="text-xs text-secondary">Executed 2026-01-15 • Fully Executed</span>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[15px]">verified</span>
                      <span>Signed</span>
                    </span>
                  </div>

                  <div className="p-4 bg-surface-container-lowest rounded-xl border border-outline-variant flex justify-between items-center">
                    <div>
                      <span className="text-sm font-bold text-on-surface block">Non-Disclosure &amp; IP Agreement (NDA)</span>
                      <span className="text-xs text-secondary">Executed 2026-01-15 • Permanent Coverage</span>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[15px]">verified</span>
                      <span>Signed</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Company Property Register */}
              <div className="bg-surface-container-low border border-outline-variant rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-outline-variant">
                  <div>
                    <h3 className="text-base font-bold text-on-surface flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-[20px]">devices</span>
                      <span>Company Property Issued (Devices &amp; Hardware)</span>
                    </h3>
                    <p className="text-xs text-secondary">Registered institutional assets assigned to faculty for return upon exit</p>
                  </div>

                  {canManageCompanyProperty && (
                    <button
                      type="button"
                      onClick={() => setShowAddPropertyModal(true)}
                      className="px-3 py-1.5 bg-primary text-on-primary rounded-xl text-xs font-bold hover:bg-primary/90 transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">add</span>
                      <span>+ Issue Property Asset</span>
                    </button>
                  )}
                </div>

                {!canManageCompanyProperty && (
                  <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/20 text-xs text-primary flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-[20px] shrink-0">inventory_2</span>
                    <span>
                      Custody Responsibility: Issued institutional hardware remains under your custody for official academic instruction. Report any hardware defect to the Campus IT Helpdesk.
                    </span>
                  </div>
                )}

                <div className="space-y-3">
                  {(mentor.companyProperty || [
                    {
                      id: 'prop-1',
                      mentorId: mentor.id,
                      itemType: 'Laptop / MacBook',
                      itemDescription: 'Apple MacBook Pro 16" (M3 Pro, 36GB RAM, 512GB SSD Space Black)',
                      serialNumber: 'C02G90XXMD6M',
                      assetTag: 'CDL-ASSET-2026-042',
                      issuedDate: '2026-01-16',
                      conditionOnIssue: 'Brand New',
                      status: 'In Possession',
                    },
                    {
                      id: 'prop-2',
                      mentorId: mentor.id,
                      itemType: 'Monitor',
                      itemDescription: 'Dell UltraSharp 27" 4K USB-C Hub Monitor (U2723QE)',
                      serialNumber: 'CN-0K791X-74261',
                      assetTag: 'CDL-ASSET-2026-089',
                      issuedDate: '2026-01-16',
                      conditionOnIssue: 'Brand New',
                      status: 'In Possession',
                    },
                    {
                      id: 'prop-3',
                      mentorId: mentor.id,
                      itemType: 'Lab Access Key / Badge',
                      itemDescription: 'Yaba Tech Hub RFID Master Keycard & Server Room Token',
                      assetTag: 'CDL-KEY-YAB-07',
                      issuedDate: '2026-01-16',
                      conditionOnIssue: 'Good',
                      status: 'In Possession',
                    }
                  ]).map(prop => (
                    <div key={prop.id} className="p-4 bg-surface-container-lowest rounded-xl border border-outline-variant flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-primary/10 text-primary">
                            {prop.itemType}
                          </span>
                          <span className="text-xs font-mono font-bold text-secondary">Tag: {prop.assetTag}</span>
                        </div>
                        <h4 className="text-sm font-bold text-on-surface mt-1">{prop.itemDescription}</h4>
                        <p className="text-xs text-secondary">
                          Serial: <span className="font-mono">{prop.serialNumber || 'N/A'}</span> • Issued: {prop.issuedDate} ({prop.conditionOnIssue})
                          {prop.returnedDate ? ` • Returned: ${prop.returnedDate}` : ''}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                          prop.status === 'In Possession'
                            ? 'bg-blue-50 text-blue-800 border-blue-200'
                            : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        }`}>
                          {prop.status}
                        </span>

                        {canManageCompanyProperty && (
                          <button
                            type="button"
                            onClick={() => handleTogglePropertyStatus(prop.id)}
                            className="px-2.5 py-1 rounded-lg border border-outline-variant hover:bg-surface-container text-xs font-semibold text-secondary hover:text-on-surface transition-colors cursor-pointer"
                          >
                            {prop.status === 'In Possession' ? 'Mark Returned' : 'Re-issue'}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* --------------------------------------------------------------------- */}
          {/* TAB 10: EXIT & HANDOVER TRACKER (TKT-1038)                            */}
          {/* --------------------------------------------------------------------- */}
          {activeTab === 'exit_handover' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="bg-surface-container-low border border-outline-variant rounded-2xl p-5 sm:p-6 shadow-xs space-y-5">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-outline-variant">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-[10px] font-bold uppercase tracking-wider">
                        Institutional Governance
                      </span>
                      <span className="text-xs text-secondary font-mono">Linked Ticket: TKT-1038</span>
                    </div>
                    <h3 className="text-base font-bold text-on-surface mt-1">
                      30-Day Notice Period &amp; Office Equipment Handover
                    </h3>
                  </div>

                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[15px]">verified_user</span>
                    <span>Active Faculty Member (No Pending Resignation)</span>
                  </span>
                </div>

                {/* Role-Aware Governance Authority Banner */}
                {canManageExitHandover ? (
                  <div className="p-3.5 rounded-xl bg-primary/10 border border-primary/20 text-xs text-primary flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-[20px] shrink-0">admin_panel_settings</span>
                    <div>
                      <strong className="font-bold block">Institutional Clearance Authority (Program Office &amp; HR)</strong>
                      <span>You have authorization to verify each exit clearance item upon physical asset surrender and gradebook reconciliation.</span>
                    </div>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-xl bg-surface-container-high border border-outline-variant text-xs text-secondary flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-[20px] text-primary shrink-0">info</span>
                    <div>
                      <strong className="font-bold text-on-surface block">Read-Only Exit Handover Dossier</strong>
                      <span>Clearance check-offs are managed and certified by the Academic Program Officer, IT Operations Lead, and Bursar.</span>
                    </div>
                  </div>
                )}

                {/* 30-Day Notice Period Countdown Display */}
                <div className="p-4 bg-surface-container-lowest rounded-xl border border-outline-variant flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <span className="text-[11px] font-bold text-secondary uppercase tracking-wider block">Standard Statutory Notice Period</span>
                    <span className="text-xl font-bold text-on-surface block mt-0.5">30 Calendar Days</span>
                    <span className="text-xs text-secondary">
                      Notice requirement as stipulated in Signed Faculty Employment Agreement § 8.2
                    </span>
                  </div>

                  <div className="px-4 py-2 bg-surface-container rounded-xl text-center border border-outline-variant">
                    <span className="text-[10px] uppercase font-bold text-secondary block">Clearance Status</span>
                    <span className="text-xs font-bold text-emerald-700">All Assets In Safe Custody</span>
                  </div>
                </div>

                {/* Handover Checklist Table (TKT-1038) */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-secondary uppercase tracking-wider">
                    Office Equipment &amp; Scholastic Handover Checklist (TKT-1038)
                  </h4>

                  <div className="divide-y divide-outline-variant border border-outline-variant rounded-xl overflow-hidden bg-surface-container-lowest">
                    {(mentor.exitRecord?.handoverChecklist || defaultHandoverChecklist).map(item => (
                      <div key={item.id} className="p-3.5 flex items-center justify-between gap-3 text-xs">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={item.completed}
                            disabled={!canManageExitHandover}
                            onChange={() => handleToggleHandoverItem(item.id)}
                            className="w-4 h-4 rounded text-primary border-outline-variant cursor-pointer disabled:cursor-not-allowed"
                          />
                          <span className={`text-xs font-semibold ${item.completed ? 'text-on-surface line-through opacity-80' : 'text-on-surface'}`}>
                            {item.label}
                          </span>
                        </label>
                        <span className={`text-[11px] shrink-0 font-medium px-2 py-0.5 rounded ${
                          item.completed 
                            ? 'text-emerald-700 bg-emerald-50 border border-emerald-200' 
                            : 'text-secondary bg-surface-container border border-outline-variant'
                        }`}>
                          {item.completed
                            ? `Verified: ${(item as any).officer || (item as any).verifiedBy || 'Program Officer'}`
                            : `Pending: ${(item as any).officer || 'Program Officer'}`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ========================================================================= */}
      {/* 3. MODALS FOR ACTIONS                                                     */}
      {/* ========================================================================= */}

      {/* Modal 1: Submit Weekly Progress Report */}
      {showWeeklyReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-surface rounded-2xl border border-outline-variant max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-outline-variant">
              <h3 className="text-base font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">assignment_turned_in</span>
                <span>File Weekly Progress Report</span>
              </h3>
              <button
                onClick={() => setShowWeeklyReportModal(false)}
                className="text-secondary hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveWeeklyReport} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-on-surface block mb-1">Week Ending Date</label>
                <input
                  type="date"
                  value={reportWeekEnding}
                  onChange={e => setReportWeekEnding(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-outline-variant bg-surface text-sm"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-on-surface block mb-1">Curriculum Topics Covered (comma separated)</label>
                <input
                  type="text"
                  value={reportTopics}
                  onChange={e => setReportTopics(e.target.value)}
                  placeholder="e.g. Postgres Triggers, REST APIs, Docker Compose"
                  className="w-full h-10 px-3 rounded-lg border border-outline-variant bg-surface text-sm"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-on-surface block mb-1">Key Highlights &amp; Student Milestones</label>
                <textarea
                  value={reportHighlights}
                  onChange={e => setReportHighlights(e.target.value)}
                  rows={3}
                  placeholder="Summarize scholar progress, breakthroughs, and project submissions..."
                  className="w-full p-3 rounded-lg border border-outline-variant bg-surface text-sm"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-on-surface block mb-1">Action Items For Next Week</label>
                <textarea
                  value={reportActionItems}
                  onChange={e => setReportActionItems(e.target.value)}
                  rows={2}
                  placeholder="Planned lectures, capstone coaching, catch-up clinics..."
                  className="w-full p-3 rounded-lg border border-outline-variant bg-surface text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-outline-variant">
                <button
                  type="button"
                  onClick={() => setShowWeeklyReportModal(false)}
                  className="px-4 py-2 rounded-lg border border-outline-variant text-xs font-bold text-secondary hover:bg-surface-container"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-primary text-on-primary text-xs font-bold hover:bg-primary/90"
                >
                  Submit Weekly Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Add Learning Material / Paste Link */}
      {showLearningMaterialModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-surface rounded-2xl border border-outline-variant max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-outline-variant">
              <h3 className="text-base font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">link</span>
                <span>Add Learning Material or External Link</span>
              </h3>
              <button
                onClick={() => setShowLearningMaterialModal(false)}
                className="text-secondary hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveLearningMaterial} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-on-surface block mb-1">Resource Title</label>
                <input
                  type="text"
                  value={matTitle}
                  onChange={e => setMatTitle(e.target.value)}
                  placeholder="e.g. Full-Stack Starter Template & Architecture Guide"
                  className="w-full h-10 px-3 rounded-lg border border-outline-variant bg-surface text-sm"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-on-surface block mb-1">Resource Type</label>
                  <select
                    value={matType}
                    onChange={e => setMatType(e.target.value as any)}
                    className="w-full h-10 px-3 rounded-lg border border-outline-variant bg-surface text-sm"
                  >
                    <option value="link">Web Link / Article</option>
                    <option value="github_repo">GitHub Repository</option>
                    <option value="video">YouTube / Loom Video</option>
                    <option value="slides">Slide Deck</option>
                    <option value="pdf">PDF Document</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-on-surface block mb-1">Academic Track</label>
                  <input
                    type="text"
                    value={matTrack}
                    onChange={e => setMatTrack(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-outline-variant bg-surface text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-on-surface block mb-1">Resource URL / Link <span className="text-primary font-normal">(Paste URL)</span></label>
                <input
                  type="url"
                  value={matUrl}
                  onChange={e => setMatUrl(e.target.value)}
                  placeholder="https://notion.so/..., https://github.com/..., or https://youtube.com/..."
                  className="w-full h-10 px-3 rounded-lg border border-outline-variant bg-surface text-sm font-mono"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-on-surface block mb-1">Description (Optional)</label>
                <textarea
                  value={matDesc}
                  onChange={e => setMatDesc(e.target.value)}
                  rows={2}
                  placeholder="Brief guidance for learners on how to use this material..."
                  className="w-full p-3 rounded-lg border border-outline-variant bg-surface text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-outline-variant">
                <button
                  type="button"
                  onClick={() => setShowLearningMaterialModal(false)}
                  className="px-4 py-2 rounded-lg border border-outline-variant text-xs font-bold text-secondary hover:bg-surface-container"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-primary text-on-primary text-xs font-bold hover:bg-primary/90"
                >
                  Publish Material
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: File Reimbursement Claim */}
      {showReimbursementModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-surface rounded-2xl border border-outline-variant max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-outline-variant">
              <h3 className="text-base font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">receipt_long</span>
                <span>Commission Reimbursement Claim</span>
              </h3>
              <button
                onClick={() => setShowReimbursementModal(false)}
                className="text-secondary hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveReimbursement} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-on-surface block mb-1">Amount (₦)</label>
                <input
                  type="number"
                  value={reimbAmount}
                  onChange={e => setReimbAmount(e.target.value)}
                  placeholder="e.g. 25000"
                  className="w-full h-10 px-3 rounded-lg border border-outline-variant bg-surface text-sm font-bold"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-on-surface block mb-1">Expense Type</label>
                <select
                  value={reimbType}
                  onChange={e => setReimbType(e.target.value as any)}
                  className="w-full h-10 px-3 rounded-lg border border-outline-variant bg-surface text-sm"
                >
                  <option value="data_stipend">Academic Data / Internet Stipend</option>
                  <option value="commission_adjustment">Commission Share Adjustment</option>
                  <option value="workshop_expense">Workshop &amp; Lab Materials</option>
                  <option value="hardware">Hardware / Teaching Device Support</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-on-surface block mb-1">Description &amp; Justification</label>
                <textarea
                  value={reimbDesc}
                  onChange={e => setReimbDesc(e.target.value)}
                  rows={3}
                  placeholder="State the expense purpose and receipt details..."
                  className="w-full p-3 rounded-lg border border-outline-variant bg-surface text-sm"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-outline-variant">
                <button
                  type="button"
                  onClick={() => setShowReimbursementModal(false)}
                  className="px-4 py-2 rounded-lg border border-outline-variant text-xs font-bold text-secondary hover:bg-surface-container"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-primary text-on-primary text-xs font-bold hover:bg-primary/90"
                >
                  Submit Claim
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 4: Request Leave */}
      {showLeaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-surface rounded-2xl border border-outline-variant max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-outline-variant">
              <h3 className="text-base font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">event_available</span>
                <span>Request Leave</span>
              </h3>
              <button
                onClick={() => setShowLeaveModal(false)}
                className="text-secondary hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveLeaveRequest} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-on-surface block mb-1">Leave Category</label>
                <select
                  value={leaveType}
                  onChange={e => setLeaveType(e.target.value as any)}
                  className="w-full h-10 px-3 rounded-lg border border-outline-variant bg-surface text-sm"
                >
                  <option value="Annual">Annual Leave ({(mentor.annualLeaveAllowance || 20) - (mentor.annualLeaveUsed || 4)} days remaining)</option>
                  <option value="Sick">Sick Leave ({(mentor.sickLeaveAllowance || 10) - (mentor.sickLeaveUsed || 1)} days remaining)</option>
                  <option value="Compassionate">Compassionate Leave</option>
                  <option value="Casual">Casual Leave</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-on-surface block mb-1">Start Date</label>
                  <input
                    type="date"
                    value={leaveStart}
                    onChange={e => setLeaveStart(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-outline-variant bg-surface text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-on-surface block mb-1">End Date</label>
                  <input
                    type="date"
                    value={leaveEnd}
                    onChange={e => setLeaveEnd(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-outline-variant bg-surface text-sm"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-on-surface block mb-1">Reason / Notes</label>
                <textarea
                  value={leaveReason}
                  onChange={e => setLeaveReason(e.target.value)}
                  rows={2}
                  placeholder="State reason for leave and handoff arrangements..."
                  className="w-full p-3 rounded-lg border border-outline-variant bg-surface text-sm"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-outline-variant">
                <button
                  type="button"
                  onClick={() => setShowLeaveModal(false)}
                  className="px-4 py-2 rounded-lg border border-outline-variant text-xs font-bold text-secondary hover:bg-surface-container"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-primary text-on-primary text-xs font-bold hover:bg-primary/90"
                >
                  Submit &amp; Schedule Leave
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 5: Leadership Note (COO / Program Officer) */}
      {showLeadershipNoteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-surface rounded-2xl border border-outline-variant max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-outline-variant">
              <h3 className="text-base font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">rate_review</span>
                <span>Log Executive Leadership Note</span>
              </h3>
              <button
                onClick={() => setShowLeadershipNoteModal(false)}
                className="text-secondary hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveLeadershipNote} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-on-surface block mb-1">Issuer Role</label>
                  <select
                    value={noteReviewerRole}
                    onChange={e => setNoteReviewerRole(e.target.value as any)}
                    className="w-full h-10 px-3 rounded-lg border border-outline-variant bg-surface text-sm"
                  >
                    <option value="COO">COO</option>
                    <option value="Program Manager">Program Manager</option>
                    <option value="Program Officer">Program Officer</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-on-surface block mb-1">Note Type</label>
                  <select
                    value={noteType}
                    onChange={e => setNoteType(e.target.value as any)}
                    className="w-full h-10 px-3 rounded-lg border border-outline-variant bg-surface text-sm"
                  >
                    <option value="regular">Regular Observation</option>
                    <option value="commendation">Commendation</option>
                    <option value="warning">Warning / Notice</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-on-surface block mb-1">Note Content</label>
                <textarea
                  value={noteContent}
                  onChange={e => setNoteContent(e.target.value)}
                  rows={4}
                  placeholder="Record formal leadership feedback, performance observations, or commendations..."
                  className="w-full p-3 rounded-lg border border-outline-variant bg-surface text-sm"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-outline-variant">
                <button
                  type="button"
                  onClick={() => setShowLeadershipNoteModal(false)}
                  className="px-4 py-2 rounded-lg border border-outline-variant text-xs font-bold text-secondary hover:bg-surface-container"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-primary text-on-primary text-xs font-bold hover:bg-primary/90"
                >
                  Save Note to Dossier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal 6: Issue Company Property Asset (Program Office / IT / HR) */}
      {showAddPropertyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-surface rounded-2xl border border-outline-variant max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-outline-variant">
              <h3 className="text-base font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">devices</span>
                <span>Issue Company Property Asset</span>
              </h3>
              <button
                onClick={() => setShowAddPropertyModal(false)}
                className="text-secondary hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <form onSubmit={handleAddProperty} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-on-surface block mb-1">Asset Category</label>
                  <select
                    value={propType}
                    onChange={e => setPropType(e.target.value as any)}
                    className="w-full h-10 px-3 rounded-lg border border-outline-variant bg-surface text-sm"
                  >
                    <option value="Laptop / MacBook">Laptop / MacBook</option>
                    <option value="Monitor">Monitor</option>
                    <option value="Tablet">Tablet</option>
                    <option value="Lab Access Key / Badge">Lab Access Key / Badge</option>
                    <option value="Course Equipment">Course Equipment</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-on-surface block mb-1">Condition on Issue</label>
                  <select
                    value={propCondition}
                    onChange={e => setPropCondition(e.target.value as any)}
                    className="w-full h-10 px-3 rounded-lg border border-outline-variant bg-surface text-sm"
                  >
                    <option value="Brand New">Brand New</option>
                    <option value="Good">Good</option>
                    <option value="Fair">Fair</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-on-surface block mb-1">Asset Tag / Inventory Code</label>
                <input
                  type="text"
                  value={propTag}
                  onChange={e => setPropTag(e.target.value)}
                  placeholder="e.g. CDL-ASSET-2026-104"
                  className="w-full h-10 px-3 rounded-lg border border-outline-variant bg-surface text-sm font-mono"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-on-surface block mb-1">Serial Number (Optional)</label>
                <input
                  type="text"
                  value={propSerial}
                  onChange={e => setPropSerial(e.target.value)}
                  placeholder="e.g. C02G90XXMD6M"
                  className="w-full h-10 px-3 rounded-lg border border-outline-variant bg-surface text-sm font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-on-surface block mb-1">Item Description &amp; Specifications</label>
                <textarea
                  value={propDesc}
                  onChange={e => setPropDesc(e.target.value)}
                  rows={2}
                  placeholder="e.g. Apple MacBook Pro 16-inch M3 Pro, 36GB RAM with charger and hub dongle..."
                  className="w-full p-3 rounded-lg border border-outline-variant bg-surface text-sm"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-outline-variant">
                <button
                  type="button"
                  onClick={() => setShowAddPropertyModal(false)}
                  className="px-4 py-2 rounded-lg border border-outline-variant text-xs font-bold text-secondary hover:bg-surface-container"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-primary text-on-primary text-xs font-bold hover:bg-primary/90"
                >
                  Issue Asset to Faculty
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 7: Reject KYC Resubmission Prompt */}
      {showKycRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-surface rounded-2xl border border-outline-variant max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-outline-variant">
              <h3 className="text-base font-bold text-rose-700 flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px]">warning</span>
                <span>Request KYC Document Resubmission</span>
              </h3>
              <button
                onClick={() => setShowKycRejectModal(false)}
                className="text-secondary hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <form onSubmit={handleRejectKYC} className="space-y-4">
              <p className="text-xs text-secondary leading-relaxed">
                Specify the compliance discrepancies or missing documentation (e.g. blurred utility bill, NIN mismatch, or incorrect NUBAN account name) so the faculty member can rectify their submission.
              </p>

              <div>
                <label className="text-xs font-bold text-on-surface block mb-1">Rejection Reason &amp; Action Required</label>
                <textarea
                  value={kycRejectReason}
                  onChange={e => setKycRejectReason(e.target.value)}
                  rows={4}
                  placeholder="e.g. Utility bill date exceeds 3 months threshold. Please upload a recent EKEDC/IKEDC power bill or tenancy receipt..."
                  className="w-full p-3 rounded-lg border border-outline-variant bg-surface text-sm"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-outline-variant">
                <button
                  type="button"
                  onClick={() => setShowKycRejectModal(false)}
                  className="px-4 py-2 rounded-lg border border-outline-variant text-xs font-bold text-secondary hover:bg-surface-container"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isReviewingKyc}
                  className="px-4 py-2 rounded-lg bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 disabled:opacity-50"
                >
                  {isReviewingKyc ? 'Recording...' : 'Send Resubmission Notice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
