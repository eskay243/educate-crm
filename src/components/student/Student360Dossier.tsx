import React, { useState, useMemo } from 'react';
import { useCRM, formatNaira } from '../../context/CRMContext';
import { 
  Student, 
  StudentStatus,
  StudentSessionAttendance,
} from '../../types/crm';

interface Student360DossierProps {
  student: Student;
  isStaffView?: boolean;
  onClose?: () => void;
}

type TabKey = 
  | 'basic_info'
  | 'mentor'
  | 'enrolment_payments'
  | 'classes_attendance'
  | 'progress_tracker'
  | 'assignments_projects'
  | 'assessments_grades'
  | 'mentor_feedback'
  | 'student_feedback'
  | 'certificates_outcomes'
  | 'documents';

export const Student360Dossier: React.FC<Student360DossierProps> = ({
  student,
  isStaffView = true,
  onClose,
}) => {
  const { 
    mentors, 
    invoices, 
    settings, 
    currentUser, 
    openModal, 
    setSelectedStudentId,
    openBiodataModal,
    openRecordPaymentModal,
    assignMentorToStudent,
    updateStudentAttendanceRecord,
    submitStudentFeedback,
    addMentorFeedbackNote,
    toggleStudentAtRisk,
    uploadStudentDocument,
    updateStudent,
    showToast
  } = useCRM();

  const [activeTab, setActiveTab] = useState<TabKey>('basic_info');

  // Modals & form states
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [selectedNewMentorId, setSelectedNewMentorId] = useState('');
  const [reassignReason, setReassignReason] = useState('');

  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [attendanceForm, setAttendanceForm] = useState<{
    sessionTitle: string;
    date: string;
    time: string;
    type: 'lecture' | 'workshop' | 'webinar' | 'coaching' | 'makeup';
    status: 'Present' | 'Absent' | 'Late' | 'Excused';
    hoursCredited: number;
    mentorNotes: string;
  }>({
    sessionTitle: '',
    date: new Date().toISOString().split('T')[0],
    time: '10:00 AM - 12:00 PM',
    type: 'lecture',
    status: 'Present',
    hoursCredited: 2,
    mentorNotes: '',
  });

  const [showMentorNoteModal, setShowMentorNoteModal] = useState(false);
  const [mentorNoteForm, setMentorNoteForm] = useState<{
    feedbackType: 'regular' | 'warning' | 'commendation';
    content: string;
    isAtRiskWarning: boolean;
  }>({
    feedbackType: 'regular',
    content: '',
    isAtRiskWarning: false,
  });

  const [showStudentFeedbackModal, setShowStudentFeedbackModal] = useState(false);
  const [studentFeedbackForm, setStudentFeedbackForm] = useState<{
    mentorRating: number;
    mentorReview: string;
    courseRating: number;
    courseReview: string;
    complaintsOrSuggestions: string;
  }>({
    mentorRating: 5,
    mentorReview: '',
    courseRating: 5,
    courseReview: '',
    complaintsOrSuggestions: '',
  });

  const [showDocUploadModal, setShowDocUploadModal] = useState(false);
  const [docUploadForm, setDocUploadForm] = useState<{
    title: string;
    type: 'handbook' | 'admission_letter' | 'assignment_file' | 'project_file' | 'other';
    fileUrl: string;
    fileName: string;
  }>({
    title: '',
    type: 'assignment_file',
    fileUrl: '',
    fileName: '',
  });

  const [showSkillModal, setShowSkillModal] = useState(false);
  const [newSkillText, setNewSkillText] = useState('');

  const [showStageModal, setShowStageModal] = useState(false);
  const [selectedStage, setSelectedStage] = useState<'Beginner' | 'Intermediate' | 'Advanced'>(student.currentStage || 'Beginner');

  const [showPlacementModal, setShowPlacementModal] = useState(false);
  const [placementForm, setPlacementForm] = useState({
    status: student.placementOutcome?.status || 'Seeking Placement',
    company: student.placementOutcome?.company || '',
    jobRole: student.placementOutcome?.jobRole || '',
    placementDate: student.placementOutcome?.placementDate || '',
    salaryRange: student.placementOutcome?.salaryRange || '',
  });

  // Assigned mentor object
  const assignedMentor = useMemo(() => {
    return mentors.find(m => m.id === student.mentorId || m.name === student.mentorName);
  }, [mentors, student.mentorId, student.mentorName]);

  // Clean WhatsApp number link
  const whatsappUrl = useMemo(() => {
    const rawNumber = student.whatsapp || student.phone || '';
    const cleanDigits = rawNumber.replace(/\D/g, '');
    if (!cleanDigits) return null;
    const internationalDigits = cleanDigits.startsWith('0') ? `234${cleanDigits.slice(1)}` : cleanDigits;
    const message = encodeURIComponent(`Hello ${student.name}, regarding your enrollment at ${settings.instituteName}...`);
    return `https://wa.me/${internationalDigits}?text=${message}`;
  }, [student.whatsapp, student.phone, student.name, settings.instituteName]);

  // Financial calculations
  const studentInvoices = useMemo(() => {
    return invoices.filter(inv => 
      inv.studentId === student.id || 
      (inv.studentName && student.name && inv.studentName.toLowerCase() === student.name.toLowerCase()) ||
      (student.email && inv.studentEmail && inv.studentEmail.toLowerCase() === student.email.toLowerCase())
    );
  }, [invoices, student.id, student.name, student.email]);

  const totalCourseFee = student.totalFees || student.tuitionAmount || 350000;
  const totalPaid = student.paidAmount || (totalCourseFee - (student.outstandingBalance || 0));
  const totalBalance = student.outstandingBalance !== undefined ? student.outstandingBalance : Math.max(0, totalCourseFee - totalPaid);

  // User Role & Permissions (Role-Based Access Control)
  const currentRole = (currentUser?.role || (isStaffView ? 'program_officer' : 'student')).toLowerCase();
  const isSuperAdmin = currentRole === 'super_admin';
  const isProgramOfficer = isSuperAdmin || currentRole === 'program_officer' || currentRole === 'admissions';
  const isMentor = currentRole === 'mentor';
  const isFinance = isSuperAdmin || currentRole === 'finance';
  const isStudentRole = currentRole === 'student' || !isStaffView;

  // Specific Action Permissions
  const canEditStudentStatus = isProgramOfficer;
  const canEditBiodata = isProgramOfficer;
  const canReassignMentor = isProgramOfficer;
  const canRecordPayment = isProgramOfficer || isFinance;
  const canMarkAttendance = isMentor || isProgramOfficer;
  const canEndorseSkillsAndStage = isMentor || isProgramOfficer;
  const canLogMentorNotes = isMentor || isProgramOfficer;
  const canEditPlacement = isProgramOfficer;
  const canRateMentorAndCourse = isStudentRole || isProgramOfficer;

  // Formatted KYC Tier (handles 'Tier 3' or '3' without duplicate 'Tier Tier 3')
  const cleanKycTier = String(student.kycTier || 3).replace(/^(Tier\s*)+/i, '');

  // Tabs configuration
  const tabList = [
    { key: 'basic_info' as TabKey, label: 'Basic Info', icon: 'person', badge: null },
    { key: 'mentor' as TabKey, label: 'Assigned Mentor', icon: 'assignment_ind', badge: student.mentorHistory?.length ? `${student.mentorHistory.length} logs` : (student.mentorName ? null : 'Unassigned') },
    { key: 'enrolment_payments' as TabKey, label: 'Enrolment & Payments', icon: 'payments', badge: student.tuitionStatus },
    { key: 'classes_attendance' as TabKey, label: 'Classes & Attendance', icon: 'calendar_month', badge: `${student.attendanceRate}%` },
    { key: 'progress_tracker' as TabKey, label: 'Progress Tracker', icon: 'trending_up', badge: `${student.progressPercent || 0}%` },
    { key: 'assignments_projects' as TabKey, label: 'Assignments & Projects', icon: 'code_blocks', badge: student.projects?.length || null },
    { key: 'assessments_grades' as TabKey, label: 'Assessments & Grades', icon: 'grade', badge: student.assessments?.length || null },
    { key: 'mentor_feedback' as TabKey, label: 'Mentor Notes & Risk', icon: 'forum', badge: student.isAtRisk ? 'At Risk' : null },
    { key: 'student_feedback' as TabKey, label: 'Student Feedback', icon: 'rate_review', badge: student.studentFeedbackHistory?.length || null },
    { key: 'certificates_outcomes' as TabKey, label: 'Certificates & Outcomes', icon: 'workspace_premium', badge: student.certificateIssued ? 'Certified' : null },
    { key: 'documents' as TabKey, label: 'Document Vault', icon: 'folder_open', badge: student.documents?.length || null },
  ];

  // Actions
  const handleReassignMentorSubmit = () => {
    if (!selectedNewMentorId) {
      showToast('Error', 'Please select a new mentor.', 'error');
      return;
    }
    assignMentorToStudent(student.id, selectedNewMentorId, reassignReason || 'Academic Mentor Reassignment');
    setShowReassignModal(false);
    setSelectedNewMentorId('');
    setReassignReason('');
  };

  const handleAddAttendanceRecord = async () => {
    if (!attendanceForm.sessionTitle.trim()) {
      showToast('Error', 'Session title is required.', 'error');
      return;
    }
    const newRecord: StudentSessionAttendance = {
      id: `att-${Date.now()}`,
      sessionId: `slot-${Date.now()}`,
      sessionTitle: attendanceForm.sessionTitle,
      date: attendanceForm.date,
      time: attendanceForm.time,
      type: attendanceForm.type,
      status: attendanceForm.status,
      hoursCredited: Number(attendanceForm.hoursCredited) || 0,
      mentorNotes: attendanceForm.mentorNotes,
    };
    await updateStudentAttendanceRecord(student.id, newRecord);
    setShowAttendanceModal(false);
    setAttendanceForm({
      sessionTitle: '',
      date: new Date().toISOString().split('T')[0],
      time: '10:00 AM - 12:00 PM',
      type: 'lecture',
      status: 'Present',
      hoursCredited: 2,
      mentorNotes: '',
    });
  };

  const handleAddMentorNote = async () => {
    if (!mentorNoteForm.content.trim()) {
      showToast('Error', 'Feedback content cannot be empty.', 'error');
      return;
    }
    await addMentorFeedbackNote(student.id, {
      mentorId: currentUser?.mentorId || currentUser?.id || 'admin',
      mentorName: currentUser?.name || 'Faculty Mentor',
      feedbackType: mentorNoteForm.feedbackType,
      content: mentorNoteForm.content,
      isAtRiskWarning: mentorNoteForm.isAtRiskWarning,
    });
    setShowMentorNoteModal(false);
    setMentorNoteForm({
      feedbackType: 'regular',
      content: '',
      isAtRiskWarning: false,
    });
  };

  const handleStudentFeedbackSubmit = async () => {
    await submitStudentFeedback({
      studentId: student.id,
      mentorRating: studentFeedbackForm.mentorRating,
      mentorReview: studentFeedbackForm.mentorReview,
      courseRating: studentFeedbackForm.courseRating,
      courseReview: studentFeedbackForm.courseReview,
      complaintsOrSuggestions: studentFeedbackForm.complaintsOrSuggestions,
    });
    setShowStudentFeedbackModal(false);
    setStudentFeedbackForm({
      mentorRating: 5,
      mentorReview: '',
      courseRating: 5,
      courseReview: '',
      complaintsOrSuggestions: '',
    });
  };

  const handleUploadDocumentSubmit = async () => {
    if (!docUploadForm.title.trim() || !docUploadForm.fileName.trim()) {
      showToast('Error', 'Please provide document title and file name.', 'error');
      return;
    }
    await uploadStudentDocument(student.id, {
      title: docUploadForm.title,
      type: docUploadForm.type,
      fileUrl: docUploadForm.fileUrl || `https://codelab.institute/vault/${docUploadForm.fileName}`,
      fileName: docUploadForm.fileName,
      isVisibleToStudent: true,
    });
    setShowDocUploadModal(false);
    setDocUploadForm({
      title: '',
      type: 'assignment_file',
      fileUrl: '',
      fileName: '',
    });
  };

  const handleAddSkill = () => {
    if (!newSkillText.trim()) return;
    const currentSkills = student.skillsAcquired || [];
    if (!currentSkills.includes(newSkillText.trim())) {
      const updated = [...currentSkills, newSkillText.trim()];
      updateStudent(student.id, { skillsAcquired: updated });
      showToast('Skill Added', `${newSkillText.trim()} added to competencies.`, 'success');
    }
    setNewSkillText('');
    setShowSkillModal(false);
  };

  const handleUpdateStage = () => {
    updateStudent(student.id, { currentStage: selectedStage });
    showToast('Stage Updated', `Academic stage set to ${selectedStage}.`, 'success');
    setShowStageModal(false);
  };

  const handleUpdatePlacement = () => {
    updateStudent(student.id, {
      placementOutcome: {
        status: placementForm.status as any,
        company: placementForm.company,
        jobRole: placementForm.jobRole,
        placementDate: placementForm.placementDate,
        salaryRange: placementForm.salaryRange,
      }
    });
    showToast('Placement Updated', 'Student career placement details saved.', 'success');
    setShowPlacementModal(false);
  };

  const handleToggleGoalStatus = (goalId: string, currentStatus: string) => {
    if (!canEndorseSkillsAndStage) return;
    const goals = student.mentorGoals ? [...student.mentorGoals] : [];
    const index = goals.findIndex(g => g.id === goalId);
    if (index >= 0) {
      const nextStatus = currentStatus === 'Achieved' ? 'In Progress' : 'Achieved';
      goals[index] = {
        ...goals[index],
        status: nextStatus as any,
        achievedAt: nextStatus === 'Achieved' ? new Date().toISOString() : undefined,
      };
      updateStudent(student.id, { mentorGoals: goals });
      showToast('Goal Updated', `Goal marked as ${nextStatus}.`, 'info');
    }
  };

  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-sm overflow-hidden flex flex-col">
      {/* ========================================================================= */}
      {/* 1. TOP HEADER & BREADCRUMBS                                                */}
      {/* ========================================================================= */}
      <div className="bg-surface-container-low border-b border-outline-variant p-4 sm:p-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          {/* Identity & Avatars */}
          <div className="flex items-start sm:items-center gap-4">
            <div className="relative">
              {student.avatarUrl ? (
                <img 
                  src={student.avatarUrl} 
                  alt={student.name} 
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-primary/20 shadow-xs" 
                />
              ) : (
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-primary/10 border-2 border-primary/20 text-primary font-bold text-2xl flex items-center justify-center">
                  {(student.name || 'S').charAt(0)}
                </div>
              )}
              {student.isAtRisk && (
                <span 
                  className="absolute -top-1.5 -right-1.5 bg-rose-600 text-white p-1 rounded-full shadow-xs flex items-center justify-center animate-pulse" 
                  title="At-Risk Flagged"
                >
                  <span className="material-symbols-outlined text-[14px]">warning</span>
                </span>
              )}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-on-surface">
                  {student.name}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold font-data-tabular bg-surface-container-high text-primary border border-primary/20">
                  {student.studentCode}
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  student.status === 'Active' 
                    ? 'bg-emerald-500/10 text-emerald-700 border border-emerald-500/20' 
                    : student.status === 'Completed'
                    ? 'bg-blue-500/10 text-blue-700 border border-blue-500/20'
                    : student.status === 'Paused'
                    ? 'bg-amber-500/10 text-amber-700 border border-amber-500/20'
                    : 'bg-rose-500/10 text-rose-700 border border-rose-500/20'
                }`}>
                  {student.status}
                </span>
                {student.isAtRisk && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-600 text-white flex items-center gap-1 shadow-xs">
                    <span className="material-symbols-outlined text-[13px]">emergency</span>
                    <span>AT RISK</span>
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-secondary mt-1">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px] text-primary">school</span>
                  <strong className="text-on-surface">{student.program}</strong>
                </span>
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">groups</span>
                  <span>{student.cohort}</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">calendar_today</span>
                  <span>Enrolled: {student.enrolledDate}</span>
                </span>
              </div>

              {/* Fast Direct Contact Links & Role Perspective Badge */}
              <div className="flex flex-wrap items-center gap-2 mt-2.5">
                {whatsappUrl && (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-xs"
                    title="Direct WhatsApp Chat"
                  >
                    <span className="material-symbols-outlined text-[15px]">chat</span>
                    <span>WhatsApp</span>
                  </a>
                )}
                <a
                  href={`tel:${student.phone}`}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-surface-container border border-outline-variant text-on-surface hover:bg-surface-container-high transition-colors"
                >
                  <span className="material-symbols-outlined text-[15px] text-secondary">call</span>
                  <span>{student.phone}</span>
                </a>
                <a
                  href={`mailto:${student.email}`}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-surface-container border border-outline-variant text-on-surface hover:bg-surface-container-high transition-colors"
                >
                  <span className="material-symbols-outlined text-[15px] text-secondary">mail</span>
                  <span>{student.email}</span>
                </a>

                {/* Perspective Badge */}
                {isProgramOfficer && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-primary/10 text-primary border border-primary/20">
                    <span className="material-symbols-outlined text-[14px]">admin_panel_settings</span>
                    <span>Program Office Governance View</span>
                  </span>
                )}
                {isMentor && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-500/10 text-amber-700 border border-amber-500/20">
                    <span className="material-symbols-outlined text-[14px]">school</span>
                    <span>Faculty Mentor Academic View</span>
                  </span>
                )}
                {isStudentRole && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-500/10 text-emerald-700 border border-emerald-500/20">
                    <span className="material-symbols-outlined text-[14px]">account_circle</span>
                    <span>Student Scholar Portal</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Top Quick Actions (Role-Aware) */}
          <div className="flex flex-wrap items-center gap-2">
            {canLogMentorNotes && (
              <>
                <button
                  onClick={() => toggleStudentAtRisk(student.id, !student.isAtRisk)}
                  className={`h-9 px-3 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer ${
                    student.isAtRisk 
                      ? 'bg-rose-100 text-rose-800 border border-rose-300 hover:bg-rose-200' 
                      : 'bg-surface-container border border-outline-variant text-secondary hover:text-rose-600'
                  }`}
                  title={student.isAtRisk ? 'Clear student from At-Risk' : 'Flag student as At-Risk'}
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {student.isAtRisk ? 'check_circle' : 'flag'}
                  </span>
                  <span>{student.isAtRisk ? 'Clear At-Risk' : 'Flag At-Risk'}</span>
                </button>

                <button
                  onClick={() => setShowMentorNoteModal(true)}
                  className="h-9 px-3 bg-secondary-container text-primary rounded-lg text-xs font-bold hover:bg-surface-container-high transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                  title="Add mentor observation, warning, or commendation"
                >
                  <span className="material-symbols-outlined text-[16px]">note_add</span>
                  <span>+ Mentor Note</span>
                </button>
              </>
            )}

            {canMarkAttendance && (
              <button
                onClick={() => setShowAttendanceModal(true)}
                className="h-9 px-3 bg-primary text-on-primary rounded-lg text-xs font-bold hover:bg-primary/90 transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                title="Mark attendance for a lecture or workshop"
              >
                <span className="material-symbols-outlined text-[16px]">how_to_reg</span>
                <span>Mark Attendance</span>
              </button>
            )}

            {canRecordPayment && (
              <button
                onClick={() => openRecordPaymentModal(student)}
                className="h-9 px-3 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                title="Record tuition installment payment"
              >
                <span className="material-symbols-outlined text-[16px]">payments</span>
                <span>Record Payment</span>
              </button>
            )}

            {canRateMentorAndCourse && (
              <button
                onClick={() => setShowStudentFeedbackModal(true)}
                className="h-9 px-3 bg-primary text-on-primary rounded-lg text-xs font-bold hover:bg-primary/90 transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                title="Submit rating for mentor and course"
              >
                <span className="material-symbols-outlined text-[16px]">star</span>
                <span>Rate Mentor & Course</span>
              </button>
            )}

            <button
              onClick={() => {
                setSelectedStudentId(student.id);
                openModal('view-certificate');
              }}
              className="h-9 px-3 bg-secondary-container text-primary rounded-lg text-xs font-bold hover:bg-surface-container-high transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
              title="View or issue Certificate of Completion"
            >
              <span className="material-symbols-outlined text-[16px]">workspace_premium</span>
              <span>{student.certificateIssued ? 'View Certificate' : 'Graduation Gate'}</span>
            </button>

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
      {/* 2. MAIN BODY: VERTICAL TABS SIDEBAR + TAB CONTENT AREA                   */}
      {/* ========================================================================= */}
      <div className="flex flex-col md:flex-row flex-1 min-h-0">
        {/* Left Vertical Navigation Sidebar */}
        <aside className="w-full md:w-64 lg:w-72 shrink-0 border-b md:border-b-0 md:border-r border-outline-variant bg-surface-container-low/40 p-3 sm:p-4 space-y-1">
          <div className="text-[10px] font-bold text-secondary uppercase tracking-wider px-3 py-1 mb-1">
            Academic Dossier
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
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ml-1.5 ${
                      isActive 
                        ? 'bg-white/20 text-white' 
                        : tab.badge === 'At Risk' || tab.badge === 'Unassigned'
                        ? 'bg-rose-600 text-white'
                        : 'bg-surface-container-high text-primary'
                    }`}>
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
        
        {/* ------------------------------------------------------------------------- */}
        {/* TAB 1: BASIC INFO & BIODATA (VERTICALLY STACKED DOSSIER CARDS)            */}
        {/* ------------------------------------------------------------------------- */}
        {activeTab === 'basic_info' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* Card 1: Civil Identity & 3-Tier KYC Record */}
            <div className="bg-surface-container-low border border-outline-variant rounded-2xl p-5 sm:p-6 shadow-xs">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-outline-variant">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[22px]">badge</span>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-on-surface">Civil Identity & 3-Tier KYC Record</h3>
                    <p className="text-xs text-secondary">Verified Nigerian civic demographics, national identification, and biometric records</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 flex items-center gap-1.5 shadow-2xs">
                    <span className="material-symbols-outlined text-[15px]">verified</span>
                    <span>Tier {cleanKycTier} Verified</span>
                  </span>
                  {canEditBiodata && (
                    <button
                      onClick={() => openBiodataModal({ ...student, category: 'student' })}
                      className="px-3 py-1 bg-surface-container hover:bg-surface-container-high border border-outline-variant text-primary rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[15px]">edit_note</span>
                      <span>Edit KYC Record</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-5">
                <div className="p-3.5 bg-surface-container-lowest rounded-xl border border-outline-variant">
                  <span className="text-[11px] font-bold text-secondary uppercase tracking-wider block mb-1">Full Legal Name</span>
                  <span className="text-sm font-bold text-on-surface block">{student.name}</span>
                </div>

                <div className="p-3.5 bg-surface-container-lowest rounded-xl border border-outline-variant">
                  <span className="text-[11px] font-bold text-secondary uppercase tracking-wider block mb-1">Date of Birth</span>
                  <span className="text-sm font-bold text-on-surface block">{student.dateOfBirth || 'Not specified'}</span>
                </div>

                <div className="p-3.5 bg-surface-container-lowest rounded-xl border border-outline-variant">
                  <span className="text-[11px] font-bold text-secondary uppercase tracking-wider block mb-1">Gender</span>
                  <span className="text-sm font-bold text-on-surface block">{student.gender || 'Not specified'}</span>
                </div>

                <div className="p-3.5 bg-surface-container-lowest rounded-xl border border-outline-variant">
                  <span className="text-[11px] font-bold text-secondary uppercase tracking-wider block mb-1">Nationality</span>
                  <span className="text-sm font-bold text-on-surface block">{student.nationality || 'Nigerian'}</span>
                </div>

                <div className="p-3.5 bg-surface-container-lowest rounded-xl border border-outline-variant">
                  <span className="text-[11px] font-bold text-secondary uppercase tracking-wider block mb-1">State of Origin</span>
                  <span className="text-sm font-bold text-on-surface block">{student.stateOfOrigin || 'Lagos'}</span>
                </div>

                <div className="p-3.5 bg-surface-container-lowest rounded-xl border border-outline-variant">
                  <span className="text-[11px] font-bold text-secondary uppercase tracking-wider block mb-1">LGA of Origin</span>
                  <span className="text-sm font-bold text-on-surface block">{student.lga || 'Ikeja'}</span>
                </div>

                <div className="p-3.5 bg-surface-container-lowest rounded-xl border border-outline-variant">
                  <span className="text-[11px] font-bold text-secondary uppercase tracking-wider block mb-1">Govt ID Document</span>
                  <span className="text-sm font-bold text-on-surface block">{student.idType || 'NIN'}: {student.idNumber || 'Verified'}</span>
                </div>

                <div className="p-3.5 bg-surface-container-lowest rounded-xl border border-outline-variant">
                  <span className="text-[11px] font-bold text-secondary uppercase tracking-wider block mb-1">KYC Tier Status</span>
                  <span className="text-sm font-bold text-emerald-700 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">verified_user</span>
                    <span>Tier {cleanKycTier} (CBN NUBAN Linked)</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Card 2: Residential Address & Next-of-Kin Emergency Contacts */}
            <div className="bg-surface-container-low border border-outline-variant rounded-2xl p-5 sm:p-6 shadow-xs">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-outline-variant">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[22px]">home_pin</span>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-on-surface">Address & Emergency Contact</h3>
                    <p className="text-xs text-secondary">Verified Nigerian residence and emergency guarantor reachability</p>
                  </div>
                </div>

                {student.nextOfKinPhone && (
                  <a
                    href={`tel:${student.nextOfKinPhone}`}
                    className="px-3 py-1.5 bg-primary/10 border border-primary/20 text-primary rounded-xl text-xs font-bold hover:bg-primary/20 transition-colors flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[16px]">call</span>
                    <span>Call Emergency Contact</span>
                  </a>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
                {/* Residential Address Panel */}
                <div className="p-4 bg-surface-container-lowest rounded-xl border border-outline-variant space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-primary">
                    <span className="material-symbols-outlined text-[18px]">location_on</span>
                    <span>Primary Residential Address</span>
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-secondary uppercase tracking-wider block mb-1">Street Address</span>
                    <p className="text-sm font-bold text-on-surface">{student.residentialAddress || '14 Obafemi Awolowo Way, Ikeja, Lagos'}</p>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-outline-variant/60 text-xs">
                    <span className="text-secondary font-medium">City & State:</span>
                    <span className="font-bold text-on-surface">{student.city || 'Ikeja'}, {student.stateOfResidence || 'Lagos'}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-secondary font-medium">Residence Proof:</span>
                    <span className="font-bold text-emerald-700 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">check_circle</span>
                      <span>Utility Bill on File (Tier 3)</span>
                    </span>
                  </div>
                </div>

                {/* Next of Kin & Emergency Guarantor */}
                <div className="p-4 bg-surface-container-lowest rounded-xl border border-outline-variant space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-primary">
                    <span className="material-symbols-outlined text-[18px]">contact_emergency</span>
                    <span>Next of Kin & Emergency Guarantor</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-[11px] font-bold text-secondary uppercase tracking-wider block mb-1">Contact Name</span>
                      <p className="text-sm font-bold text-on-surface">{student.nextOfKinName || 'Folashade Adeleke'}</p>
                    </div>
                    <div>
                      <span className="text-[11px] font-bold text-secondary uppercase tracking-wider block mb-1">Relationship</span>
                      <p className="text-sm font-bold text-on-surface">{student.nextOfKinRelationship || 'Mother'}</p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-outline-variant/60 text-xs">
                    <span className="text-secondary font-medium">Emergency Phone:</span>
                    <a 
                      href={`tel:${student.nextOfKinPhone || '+2348029987766'}`}
                      className="font-bold text-primary hover:underline flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[14px]">phone</span>
                      <span>{student.nextOfKinPhone || '+234 802 998 7766'}</span>
                    </a>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-secondary font-medium">Guarantor Address:</span>
                    <span className="text-on-surface text-right font-medium">{student.nextOfKinAddress || 'Same as residential address'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 3: Academic Enrollment Lifecycle & Program Track */}
            <div className="bg-surface-container-low border border-outline-variant rounded-2xl p-5 sm:p-6 shadow-xs">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-outline-variant">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[22px]">school</span>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-on-surface">Academic Enrollment Lifecycle & Program Track</h3>
                    <p className="text-xs text-secondary">Institutional curriculum track, cohort group, and academic lifecycle status</p>
                  </div>
                </div>

                <span className={`px-3 py-1 rounded-full text-xs font-bold border shadow-xs flex items-center gap-1.5 ${
                  (student.status || 'Active') === 'Active' 
                    ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30' 
                    : student.status === 'Completed'
                    ? 'bg-blue-500/10 text-blue-700 border-blue-500/30'
                    : student.status === 'Paused'
                    ? 'bg-amber-500/10 text-amber-700 border-amber-500/30'
                    : 'bg-rose-500/10 text-rose-700 border-rose-500/30'
                }`}>
                  <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
                  <span>Current Status: {student.status || 'Active'}</span>
                </span>
              </div>

              {/* 4-col key-value track metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-5">
                <div className="p-3.5 bg-surface-container-lowest rounded-xl border border-outline-variant">
                  <span className="text-[11px] font-bold text-secondary uppercase tracking-wider block mb-1">Program Track</span>
                  <span className="text-sm font-bold text-primary block">{student.program}</span>
                </div>

                <div className="p-3.5 bg-surface-container-lowest rounded-xl border border-outline-variant">
                  <span className="text-[11px] font-bold text-secondary uppercase tracking-wider block mb-1">Cohort Group</span>
                  <span className="text-sm font-bold text-on-surface block">{student.cohort}</span>
                </div>

                <div className="p-3.5 bg-surface-container-lowest rounded-xl border border-outline-variant">
                  <span className="text-[11px] font-bold text-secondary uppercase tracking-wider block mb-1">Admission Date</span>
                  <span className="text-sm font-bold text-on-surface block">{student.enrolledDate}</span>
                </div>

                <div className="p-3.5 bg-surface-container-lowest rounded-xl border border-outline-variant">
                  <span className="text-[11px] font-bold text-secondary uppercase tracking-wider block mb-1">Expected Completion</span>
                  <span className="text-sm font-bold text-emerald-700 block">{student.expectedCompletionDate || 'June 2026'}</span>
                </div>
              </div>

              {/* Status Switcher & Role Configuration */}
              <div className="mt-5 pt-5 border-t border-outline-variant">
                {canEditStudentStatus ? (
                  <div>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3">
                      <div>
                        <span className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-primary text-[17px]">tune</span>
                          <span>Program Office Lifecycle Status Switcher</span>
                        </span>
                        <p className="text-[11px] text-secondary mt-0.5">
                          Changing the student's status updates permissions across LMS portal, class attendance, and bursary billing.
                        </p>
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-primary/10 text-primary">
                        Program Officer Authority
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {(['Active', 'Paused', 'Completed', 'Dropped'] as StudentStatus[]).map(statusOption => {
                        const isSelected = student.status === statusOption;
                        return (
                          <button
                            key={statusOption}
                            onClick={() => {
                              updateStudent(student.id, { status: statusOption });
                              showToast('Status Updated', `${student.name} marked as ${statusOption}.`, 'success');
                            }}
                            className={`p-3 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 cursor-pointer border ${
                              isSelected
                                ? statusOption === 'Active'
                                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm ring-2 ring-emerald-500/30'
                                  : statusOption === 'Completed'
                                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm ring-2 ring-blue-500/30'
                                  : statusOption === 'Paused'
                                  ? 'bg-amber-600 text-white border-amber-600 shadow-sm ring-2 ring-amber-500/30'
                                  : 'bg-rose-600 text-white border-rose-600 shadow-sm ring-2 ring-rose-500/30'
                                : 'bg-surface-container-lowest border-outline-variant text-secondary hover:text-on-surface hover:border-primary/40'
                            }`}
                          >
                            <span className="material-symbols-outlined text-[18px]">
                              {statusOption === 'Active' ? 'check_circle' : statusOption === 'Completed' ? 'verified' : statusOption === 'Paused' ? 'pause_circle' : 'cancel'}
                            </span>
                            <span>{statusOption}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-surface-container rounded-xl flex items-center gap-3 border border-outline-variant text-xs text-secondary">
                    <span className="material-symbols-outlined text-[22px] text-primary shrink-0">admin_panel_settings</span>
                    <div>
                      <strong className="text-on-surface block mb-0.5">Program Office Institutional Governance</strong>
                      <span>Enrollment status (Active, Paused, Completed, Dropped) is controlled exclusively by the Program Office and Registry. Mentors evaluate attendance, skills, and syllabus competencies.</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------------- */}
        {/* TAB 2: ASSIGNED MENTOR & CHANGE HISTORY                                   */}
        {/* ------------------------------------------------------------------------- */}
        {activeTab === 'mentor' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* Current Mentor Card or Unassigned Prompt */}
            {student.mentorName ? (
              <div className="bg-surface-container-low border border-outline-variant rounded-xl p-5 shadow-xs">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex items-center gap-4">
                    {assignedMentor?.avatarUrl ? (
                      <img 
                        src={assignedMentor.avatarUrl} 
                        alt={student.mentorName} 
                        className="w-16 h-16 rounded-2xl object-cover border-2 border-primary/20" 
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary font-bold text-2xl flex items-center justify-center">
                        {(student.mentorName || 'M').charAt(0)}
                      </div>
                    )}
                    <div>
                      <span className="text-[11px] font-bold text-primary uppercase tracking-wider">
                        Lead Faculty Mentor
                      </span>
                      <h3 className="text-lg font-bold text-on-surface">{student.mentorName}</h3>
                      <p className="text-xs text-secondary mt-0.5">
                        {assignedMentor?.department || 'Software & AI Systems Department'} • Rating: ★ {assignedMentor?.rating || 4.9}
                      </p>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-secondary mt-2">
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">mail</span>
                          <span>{assignedMentor?.email || 'mentor@codelab.institute'}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">call</span>
                          <span>{assignedMentor?.phone || '+234 800 000 0000'}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {canReassignMentor && (
                    <button
                      onClick={() => setShowReassignModal(true)}
                      className="h-9 px-4 bg-primary text-on-primary rounded-lg text-xs font-bold hover:bg-primary/90 transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">swap_horiz</span>
                      <span>Reassign Mentor</span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-surface-container-low border border-outline-variant rounded-xl p-8 text-center space-y-3 shadow-xs">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto">
                  <span className="material-symbols-outlined text-[32px]">person_alert</span>
                </div>
                <h3 className="text-base font-bold text-on-surface">No Faculty Mentor Assigned Yet</h3>
                <p className="text-xs text-secondary max-w-md mx-auto">
                  {student.name} is currently without an assigned faculty lead. Pair this scholar with a mentor to credit the 37% tuition share and begin coaching.
                </p>
                {canReassignMentor ? (
                  <button
                    onClick={() => setShowReassignModal(true)}
                    className="px-4 py-2 bg-primary text-on-primary rounded-xl text-xs font-bold hover:bg-primary/90 transition-colors inline-flex items-center gap-2 shadow-xs cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">person_add</span>
                    <span>Assign Lead Faculty Mentor</span>
                  </button>
                ) : (
                  <p className="text-xs text-secondary italic">
                    Faculty mentor assignment is scheduled and managed by the Program Office.
                  </p>
                )}
              </div>
            )}

            {/* Mentor Change History Log */}
            <div className="bg-surface-container-low border border-outline-variant rounded-xl p-5 shadow-xs">
              <h3 className="text-sm font-bold text-on-surface flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-primary text-[18px]">history</span>
                <span>Mentor Change & Reassignment Audit Trail</span>
              </h3>

              {student.mentorHistory && student.mentorHistory.length > 0 ? (
                <div className="divide-y divide-outline-variant">
                  {student.mentorHistory.map((log) => (
                    <div key={log.id} className="py-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                      <div>
                        <div className="text-xs font-bold text-on-surface flex items-center gap-2">
                          <span className="line-through text-secondary">{log.previousMentorName}</span>
                          <span className="material-symbols-outlined text-[14px] text-primary">arrow_forward</span>
                          <span className="text-primary">{log.newMentorName}</span>
                        </div>
                        <p className="text-[11px] text-secondary mt-0.5">
                          Reason: <span className="italic text-on-surface">{log.reason || 'Curriculum specialization transfer'}</span>
                        </p>
                      </div>
                      <div className="text-right text-[11px] text-secondary">
                        <div>Authorized by: <strong className="text-on-surface">{log.reassignedBy}</strong></div>
                        <div className="font-data-tabular">{new Date(log.reassignedAt).toLocaleString()}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-secondary text-xs">
                  <span className="material-symbols-outlined text-[32px] text-secondary/40 block mb-1">verified_user</span>
                  No mentor reassignments recorded. {student.name} {student.mentorName ? `has been mentored by ${student.mentorName} since enrollment.` : 'does not currently have an assigned faculty mentor.'}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------------- */}
        {/* TAB 3: ENROLMENT & PAYMENTS                                               */}
        {/* ------------------------------------------------------------------------- */}
        {activeTab === 'enrolment_payments' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* Financial Overview Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-surface-container-low border border-outline-variant rounded-xl p-4 shadow-xs">
                <span className="text-xs text-secondary font-semibold">Total Course Tuition</span>
                <div className="text-xl sm:text-2xl font-bold text-on-surface font-data-tabular mt-1">
                  {formatNaira(totalCourseFee)}
                </div>
                <span className="text-[11px] text-secondary mt-1 block">Full academic program fee</span>
              </div>

              <div className="bg-surface-container-low border border-outline-variant rounded-xl p-4 shadow-xs">
                <span className="text-xs text-secondary font-semibold">Total Paid to Date</span>
                <div className="text-xl sm:text-2xl font-bold text-emerald-600 font-data-tabular mt-1">
                  {formatNaira(totalPaid)}
                </div>
                <span className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[13px]">check_circle</span>
                  <span>Verified receipts processed</span>
                </span>
              </div>

              <div className="bg-surface-container-low border border-outline-variant rounded-xl p-4 shadow-xs">
                <span className="text-xs text-secondary font-semibold">Outstanding Balance</span>
                <div className={`text-xl sm:text-2xl font-bold font-data-tabular mt-1 ${
                  totalBalance > 0 ? 'text-amber-600' : 'text-emerald-600'
                }`}>
                  {formatNaira(totalBalance)}
                </div>
                <span className={`text-[11px] font-bold uppercase tracking-wider mt-1 block ${
                  student.tuitionStatus === 'Paid' ? 'text-emerald-600' : 'text-amber-600'
                }`}>
                  Status: {student.tuitionStatus}
                </span>
              </div>
            </div>

            {/* Payment Plan & Installments */}
            <div className="bg-surface-container-low border border-outline-variant rounded-xl p-5 shadow-xs">
              <h3 className="text-sm font-bold text-on-surface flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-primary text-[18px]">calendar_view_week</span>
                <span>Payment Plan & Installment Tranches</span>
              </h3>

              {student.installments && student.installments.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-surface-container-high/60 text-secondary uppercase text-[10px] font-bold">
                      <tr>
                        <th className="p-3">Tranche</th>
                        <th className="p-3">Description</th>
                        <th className="p-3">Due Date</th>
                        <th className="p-3">Amount</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Payment Info</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant">
                      {student.installments.map((inst, i) => (
                        <tr key={inst.id} className="hover:bg-surface-container-high/30">
                          <td className="p-3 font-bold text-on-surface">Tranche #{inst.installmentNumber || i + 1}</td>
                          <td className="p-3 text-secondary">{inst.description}</td>
                          <td className="p-3 font-data-tabular text-on-surface">{inst.dueDate}</td>
                          <td className="p-3 font-bold font-data-tabular text-on-surface">{formatNaira(inst.amount)}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                              inst.status === 'Paid'
                                ? 'bg-emerald-500/10 text-emerald-700'
                                : inst.status === 'Pending'
                                ? 'bg-amber-500/10 text-amber-700'
                                : 'bg-surface-container text-secondary'
                            }`}>
                              {inst.status}
                            </span>
                          </td>
                          <td className="p-3 text-[11px] text-secondary">
                            {inst.paidAt ? (
                              <span>Paid {new Date(inst.paidAt).toLocaleDateString()} via {inst.paymentMethod || 'Online'}</span>
                            ) : (
                              <span className="italic">Awaiting payment</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-4 bg-surface-container rounded-lg text-xs text-secondary text-center">
                  Full tuition upfront payment structure ({formatNaira(totalCourseFee)}).
                </div>
              )}
            </div>

            {/* Invoices & Receipts */}
            <div className="bg-surface-container-low border border-outline-variant rounded-xl p-5 shadow-xs">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[18px]">receipt_long</span>
                  <span>Official Invoices & Bursary Receipts</span>
                </h3>
                {canRecordPayment && (
                  <button
                    onClick={() => openRecordPaymentModal(student)}
                    className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[15px]">add</span>
                    <span>Record Installment</span>
                  </button>
                )}
              </div>

              {studentInvoices.length > 0 ? (
                <div className="divide-y divide-outline-variant">
                  {studentInvoices.map((inv) => (
                    <div key={inv.id} className="py-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <strong className="text-xs text-on-surface">{inv.invoiceNumber}</strong>
                          <span className={`px-2 py-0.2 rounded text-[10px] font-bold ${
                            inv.status === 'Paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {inv.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-secondary mt-0.5">
                          Issued: {inv.issueDate} • Due: {inv.dueDate}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold font-data-tabular text-on-surface">{formatNaira(inv.amount || 0)}</span>
                        <button
                          onClick={() => {
                            setSelectedStudentId(student.id);
                            openModal('view-invoice');
                          }}
                          className="px-2.5 py-1 bg-surface-container border border-outline-variant text-primary rounded text-xs font-bold hover:bg-surface-container-high transition-colors cursor-pointer"
                        >
                          View Official Receipt
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-secondary text-xs">
                  No invoices generated yet for this student.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------------- */}
        {/* TAB 4: CLASSES & ATTENDANCE                                               */}
        {/* ------------------------------------------------------------------------- */}
        {activeTab === 'classes_attendance' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* Attendance Percentage Verified Card */}
            <div className="bg-surface-container-low border border-outline-variant rounded-xl p-5 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <span className="text-[11px] font-bold text-primary uppercase tracking-wider block mb-1">
                  Faculty-Verified Academic Attendance
                </span>
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl sm:text-4xl font-bold text-on-surface font-data-tabular">
                    {student.attendanceRate}%
                  </span>
                  <span className="text-xs text-secondary font-medium">
                    ({student.attendedLearningHours || 0} of {student.minimumRequiredHours || 40} required hours logged)
                  </span>
                </div>
                <p className="text-xs text-secondary mt-1 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-emerald-600 text-[16px]">verified</span>
                  <span>Visible to student as verified and updated by Faculty Mentor ({student.mentorName || 'Faculty Lead'}).</span>
                </p>
              </div>

              {canMarkAttendance && (
                <button
                  onClick={() => setShowAttendanceModal(true)}
                  className="h-10 px-4 bg-primary text-on-primary rounded-xl text-xs font-bold hover:bg-primary/90 transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">add_task</span>
                  <span>Log Session Attendance</span>
                </button>
              )}
            </div>

            {/* Session Attendance Ledger */}
            <div className="bg-surface-container-low border border-outline-variant rounded-xl p-5 shadow-xs">
              <h3 className="text-sm font-bold text-on-surface flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-primary text-[18px]">fact_check</span>
                <span>Session-by-Session Attendance Ledger</span>
              </h3>

              {student.sessionAttendance && student.sessionAttendance.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-surface-container-high/60 text-secondary uppercase text-[10px] font-bold">
                      <tr>
                        <th className="p-3">Session Title</th>
                        <th className="p-3">Date & Time</th>
                        <th className="p-3">Type</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Hours Credited</th>
                        <th className="p-3">Mentor Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant">
                      {student.sessionAttendance.map((rec) => (
                        <tr key={rec.id} className="hover:bg-surface-container-high/30">
                          <td className="p-3 font-bold text-on-surface">{rec.sessionTitle}</td>
                          <td className="p-3 text-secondary font-data-tabular">
                            {rec.date} {rec.time ? `• ${rec.time}` : ''}
                          </td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-surface-container text-secondary">
                              {rec.type}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                              rec.status === 'Present'
                                ? 'bg-emerald-500/10 text-emerald-700'
                                : rec.status === 'Late'
                                ? 'bg-amber-500/10 text-amber-700'
                                : rec.status === 'Excused'
                                ? 'bg-blue-500/10 text-blue-700'
                                : 'bg-rose-500/10 text-rose-700'
                            }`}>
                              {rec.status}
                            </span>
                          </td>
                          <td className="p-3 font-bold font-data-tabular text-on-surface">
                            {rec.hoursCredited} hrs
                          </td>
                          <td className="p-3 text-secondary italic">
                            {rec.mentorNotes || '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-secondary text-xs">
                  <span className="material-symbols-outlined text-[32px] text-secondary/40 block mb-1">event_busy</span>
                  No individual session logs recorded yet. Attendance rate is currently {student.attendanceRate}%.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------------- */}
        {/* TAB 5: PROGRESS TRACKER & COMPETENCIES                                     */}
        {/* ------------------------------------------------------------------------- */}
        {activeTab === 'progress_tracker' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* Progression & Stage Card */}
            <div className="bg-surface-container-low border border-outline-variant rounded-xl p-5 shadow-xs">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                <div>
                  <span className="text-[11px] font-bold text-primary uppercase tracking-wider">
                    Syllabus Mastery
                  </span>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-2xl font-bold text-on-surface">
                      {student.progressPercent || 0}% Completed
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
                      Stage: {student.currentStage || 'Intermediate'}
                    </span>
                  </div>
                </div>

                {canEndorseSkillsAndStage && (
                  <button
                    onClick={() => setShowStageModal(true)}
                    className="px-3 py-1.5 bg-surface-container border border-outline-variant text-primary rounded-lg text-xs font-bold hover:bg-surface-container-high transition-colors cursor-pointer"
                  >
                    Change Stage Level
                  </button>
                )}
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-surface-container-high rounded-full h-3 overflow-hidden">
                <div 
                  className="bg-primary h-full rounded-full transition-all duration-500" 
                  style={{ width: `${student.progressPercent || 0}%` }}
                />
              </div>

              <div className="flex justify-between items-center text-xs text-secondary mt-2">
                <span>Start: {student.startDate || student.enrolledDate}</span>
                <span>Expected Completion: {student.expectedCompletionDate || 'June 2026'}</span>
              </div>
            </div>

            {/* Skills Acquired */}
            <div className="bg-surface-container-low border border-outline-variant rounded-xl p-5 shadow-xs">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[18px]">psychology</span>
                  <span>Skills Acquired & Competencies</span>
                </h3>
                {canEndorseSkillsAndStage && (
                  <button
                    onClick={() => setShowSkillModal(true)}
                    className="px-2.5 py-1 bg-primary text-on-primary rounded text-xs font-bold hover:bg-primary/90 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[14px]">add</span>
                    <span>Add Skill</span>
                  </button>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {student.skillsAcquired && student.skillsAcquired.length > 0 ? (
                  student.skillsAcquired.map((skill, idx) => (
                    <span 
                      key={idx}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-surface-container-lowest border border-outline-variant text-primary shadow-2xs flex items-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-[15px] text-emerald-600">check_circle</span>
                      <span>{skill}</span>
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-secondary italic">No skills endorsed yet.</span>
                )}
              </div>
            </div>

            {/* Goals Set with Mentor */}
            <div className="bg-surface-container-low border border-outline-variant rounded-xl p-5 shadow-xs">
              <h3 className="text-sm font-bold text-on-surface flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-primary text-[18px]">track_changes</span>
                <span>Goals Set with Faculty Mentor</span>
              </h3>

              {student.mentorGoals && student.mentorGoals.length > 0 ? (
                <div className="space-y-3">
                  {student.mentorGoals.map((goal) => (
                    <div 
                      key={goal.id} 
                      className="p-3 bg-surface-container-lowest border border-outline-variant rounded-xl flex items-start justify-between gap-3 shadow-2xs"
                    >
                      <div className="flex items-start gap-3">
                        <button
                          disabled={!canEndorseSkillsAndStage}
                          onClick={() => handleToggleGoalStatus(goal.id, goal.status)}
                          className={`mt-0.5 w-5 h-5 rounded flex items-center justify-center transition-colors ${
                            goal.status === 'Achieved'
                              ? 'bg-emerald-600 text-white'
                              : 'border border-outline-variant hover:bg-surface-container text-transparent'
                          } ${!canEndorseSkillsAndStage ? 'cursor-default' : 'cursor-pointer'}`}
                          title={canEndorseSkillsAndStage ? 'Click to toggle achieved status' : ''}
                        >
                          <span className="material-symbols-outlined text-[14px]">check</span>
                        </button>
                        <div>
                          <h4 className={`text-xs font-bold ${
                            goal.status === 'Achieved' ? 'line-through text-secondary' : 'text-on-surface'
                          }`}>
                            {goal.title}
                          </h4>
                          {goal.mentorNotes && (
                            <p className="text-[11px] text-secondary mt-0.5">{goal.mentorNotes}</p>
                          )}
                        </div>
                      </div>

                      <div className="text-right">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          goal.status === 'Achieved' 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {goal.status}
                        </span>
                        {goal.targetDate && (
                          <span className="text-[10px] text-secondary block mt-0.5">
                            Target: {goal.targetDate}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-secondary text-xs">
                  No specific mentor goals formulated yet.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------------- */}
        {/* TAB 6: ASSIGNMENTS & HANDS-ON PROJECTS                                    */}
        {/* ------------------------------------------------------------------------- */}
        {activeTab === 'assignments_projects' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div className="bg-surface-container-low border border-outline-variant rounded-xl p-5 shadow-xs">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[18px]">terminal</span>
                  <span>Hands-on Projects & Automation Pipelines</span>
                </h3>
                {isStudentRole && (
                  <button
                    onClick={() => openModal('submit-assignment')}
                    className="px-3 py-1.5 bg-primary text-on-primary rounded-lg text-xs font-bold hover:bg-primary/90 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">upload_file</span>
                    <span>Submit Project</span>
                  </button>
                )}
              </div>

              {student.projects && student.projects.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {student.projects.map((proj) => (
                    <div 
                      key={proj.id} 
                      className="p-4 bg-surface-container-lowest border border-outline-variant rounded-xl flex flex-col justify-between shadow-2xs"
                    >
                      <div>
                        <div className="flex justify-between items-start gap-2">
                          <h4 className="text-xs font-bold text-on-surface">{proj.title}</h4>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            proj.submissionStatus === 'Reviewed' 
                              ? 'bg-emerald-100 text-emerald-800' 
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {proj.submissionStatus}
                          </span>
                        </div>
                        {proj.description && (
                          <p className="text-[11px] text-secondary mt-1">{proj.description}</p>
                        )}
                        <div className="flex flex-wrap items-center gap-2 mt-3">
                          {proj.projectLink && (
                            <a
                              href={proj.projectLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline font-bold"
                            >
                              <span className="material-symbols-outlined text-[13px]">open_in_new</span>
                              <span>Live Pipeline</span>
                            </a>
                          )}
                          {proj.githubUrl && (
                            <a
                              href={proj.githubUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] text-on-surface hover:underline font-semibold"
                            >
                              <span className="material-symbols-outlined text-[13px]">code</span>
                              <span>GitHub Code</span>
                            </a>
                          )}
                        </div>
                      </div>

                      {proj.mentorFeedback && (
                        <div className="mt-3 pt-3 border-t border-outline-variant/60 bg-surface-container-high/20 p-2.5 rounded-lg">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-[10px] font-bold text-primary uppercase">
                              Mentor Feedback • {proj.reviewedBy || 'Faculty'}
                            </span>
                            {proj.score !== undefined && (
                              <span className="text-[11px] font-bold text-emerald-700 font-data-tabular">
                                Grade: {proj.grade || 'A'} ({proj.score}/{proj.maxScore || 100})
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-secondary italic">"{proj.mentorFeedback}"</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-secondary text-xs">
                  <span className="material-symbols-outlined text-[32px] text-secondary/40 block mb-1">code</span>
                  No hands-on project submissions recorded yet.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------------- */}
        {/* TAB 7: ASSESSMENTS & GRADES                                               */}
        {/* ------------------------------------------------------------------------- */}
        {activeTab === 'assessments_grades' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div className="bg-surface-container-low border border-outline-variant rounded-xl p-5 shadow-xs">
              <h3 className="text-sm font-bold text-on-surface flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-primary text-[18px]">assignment_turned_in</span>
                <span>Quizzes, Practical Tests & Academic Gradebook</span>
              </h3>

              {student.assessments && student.assessments.length > 0 ? (
                <div className="divide-y divide-outline-variant">
                  {student.assessments.map((ass) => (
                    <div key={ass.id} className="py-4 space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-on-surface">{ass.title}</h4>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-surface-container text-secondary">
                            {ass.type}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold font-data-tabular text-on-surface">
                            {ass.score} / {ass.maxScore}
                          </span>
                          <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-100 text-emerald-800">
                            Grade: {ass.grade}
                          </span>
                        </div>
                      </div>

                      {(ass.strengths || ass.areasToImprove) && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] pt-1">
                          {ass.strengths && (
                            <div className="bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-lg text-emerald-900">
                              <strong className="block text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                                Observed Strengths:
                              </strong>
                              {ass.strengths}
                            </div>
                          )}
                          {ass.areasToImprove && (
                            <div className="bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-lg text-amber-900">
                              <strong className="block text-[10px] font-bold uppercase tracking-wider text-amber-800">
                                Areas for Improvement:
                              </strong>
                              {ass.areasToImprove}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-secondary text-xs">
                  <span className="material-symbols-outlined text-[32px] text-secondary/40 block mb-1">quiz</span>
                  No formal written assessments or test scores on record.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------------- */}
        {/* TAB 8: MENTOR FEEDBACK & RISK AUDIT                                       */}
        {/* ------------------------------------------------------------------------- */}
        {activeTab === 'mentor_feedback' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* Prominent At-Risk Alert Banner if active */}
            {student.isAtRisk && (
              <div className="bg-rose-50 border-2 border-rose-300 rounded-xl p-4 flex items-start gap-3 shadow-xs">
                <span className="material-symbols-outlined text-rose-600 text-[24px] mt-0.5">error</span>
                <div>
                  <h4 className="text-sm font-bold text-rose-900">
                    STUDENT CURRENTLY FLAGGED AT-RISK
                  </h4>
                  <p className="text-xs text-rose-800 mt-0.5">
                    This student requires immediate academic or welfare follow-up due to low attendance, missed project milestones, or personal concerns.
                  </p>
                </div>
              </div>
            )}

            <div className="bg-surface-container-low border border-outline-variant rounded-xl p-5 shadow-xs">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[18px]">feed</span>
                  <span>Mentor Observations, Warnings & Commendations</span>
                </h3>
                {canLogMentorNotes && (
                  <button
                    onClick={() => setShowMentorNoteModal(true)}
                    className="px-3 py-1.5 bg-primary text-on-primary rounded-lg text-xs font-bold hover:bg-primary/90 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[15px]">add</span>
                    <span>Log Observation</span>
                  </button>
                )}
              </div>

              {student.mentorFeedbackNotes && student.mentorFeedbackNotes.length > 0 ? (
                <div className="space-y-3">
                  {student.mentorFeedbackNotes.map((note) => (
                    <div 
                      key={note.id} 
                      className={`p-4 rounded-xl border flex flex-col justify-between shadow-2xs ${
                        note.feedbackType === 'warning'
                          ? 'bg-rose-50/50 border-rose-200'
                          : note.feedbackType === 'commendation'
                          ? 'bg-emerald-50/50 border-emerald-200'
                          : 'bg-surface-container-lowest border-outline-variant'
                      }`}
                    >
                      <div className="flex justify-between items-start gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            note.feedbackType === 'warning'
                              ? 'bg-rose-600 text-white'
                              : note.feedbackType === 'commendation'
                              ? 'bg-emerald-600 text-white'
                              : 'bg-primary/10 text-primary'
                          }`}>
                            {note.feedbackType}
                          </span>
                          <span className="text-xs font-bold text-on-surface">{note.mentorName}</span>
                        </div>
                        <span className="text-[11px] text-secondary font-data-tabular">{note.date}</span>
                      </div>
                      <p className="text-xs text-on-surface leading-relaxed">{note.content}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-secondary text-xs">
                  <span className="material-symbols-outlined text-[32px] text-secondary/40 block mb-1">notes</span>
                  No mentor observations recorded yet.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------------- */}
        {/* TAB 9: STUDENT FEEDBACK (VOICE OF STUDENT)                                */}
        {/* ------------------------------------------------------------------------- */}
        {activeTab === 'student_feedback' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div className="bg-surface-container-low border border-outline-variant rounded-xl p-5 shadow-xs">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[18px]">rate_review</span>
                  <span>Student Ratings & Feedback (Mentor & Course)</span>
                </h3>
                {canRateMentorAndCourse && (
                  <button
                    onClick={() => setShowStudentFeedbackModal(true)}
                    className="px-3 py-1.5 bg-primary text-on-primary rounded-lg text-xs font-bold hover:bg-primary/90 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[15px]">edit</span>
                    <span>Submit Feedback</span>
                  </button>
                )}
              </div>

              {student.studentFeedbackHistory && student.studentFeedbackHistory.length > 0 ? (
                <div className="space-y-4">
                  {student.studentFeedbackHistory.map((fb) => (
                    <div 
                      key={fb.id} 
                      className="p-4 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-2xs space-y-3"
                    >
                      <div className="flex justify-between items-center text-xs text-secondary">
                        <span className="font-bold text-on-surface">Feedback Submission</span>
                        <span className="font-data-tabular">{new Date(fb.submittedAt).toLocaleDateString()}</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Mentor Rating */}
                        <div className="p-3 bg-surface-container-high/30 rounded-lg">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-[11px] font-bold text-primary">Mentor Coaching</span>
                            <span className="text-xs font-bold text-amber-600">
                              {'★'.repeat(fb.mentorRating)}{'☆'.repeat(5 - fb.mentorRating)} ({fb.mentorRating}/5)
                            </span>
                          </div>
                          {fb.mentorReview && (
                            <p className="text-xs text-on-surface italic">"{fb.mentorReview}"</p>
                          )}
                        </div>

                        {/* Course Rating */}
                        <div className="p-3 bg-surface-container-high/30 rounded-lg">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-[11px] font-bold text-primary">Course Curriculum</span>
                            <span className="text-xs font-bold text-amber-600">
                              {'★'.repeat(fb.courseRating)}{'☆'.repeat(5 - fb.courseRating)} ({fb.courseRating}/5)
                            </span>
                          </div>
                          {fb.courseReview && (
                            <p className="text-xs text-on-surface italic">"{fb.courseReview}"</p>
                          )}
                        </div>
                      </div>

                      {fb.complaintsOrSuggestions && (
                        <div className="p-3 bg-primary/5 border border-primary/15 rounded-lg text-xs">
                          <strong className="block text-[10px] font-bold uppercase tracking-wider text-primary mb-0.5">
                            Suggestions / Welfare Concerns:
                          </strong>
                          <p className="text-on-surface">{fb.complaintsOrSuggestions}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-secondary text-xs">
                  <span className="material-symbols-outlined text-[32px] text-secondary/40 block mb-1">thumb_up</span>
                  No formal feedback reviews submitted by the student yet.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------------- */}
        {/* TAB 10: CERTIFICATES & OUTCOMES                                           */}
        {/* ------------------------------------------------------------------------- */}
        {activeTab === 'certificates_outcomes' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* Graduation & Certificate Card */}
            <div className="bg-surface-container-low border border-outline-variant rounded-xl p-5 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[32px]">workspace_premium</span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-on-surface">Certificate of Completion</h3>
                  {student.certificateIssued ? (
                    <div className="text-xs text-secondary mt-0.5">
                      Issued with distinction. Certificate #{student.certificateNumber || 'CERT-CDL-2026-8492'}
                    </div>
                  ) : (
                    <div className="text-xs text-secondary mt-0.5">
                      Requirements: 40 learning hours & 100% syllabus mastery. ({student.progressPercent || 0}% current progress)
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={() => {
                  setSelectedStudentId(student.id);
                  openModal('view-certificate');
                }}
                className={`h-10 px-4 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5 ${
                  student.certificateIssued
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                    : 'bg-primary text-on-primary hover:bg-primary/90'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">verified</span>
                <span>{student.certificateIssued ? 'Download Certificate' : 'Open Graduation Gate'}</span>
              </button>
            </div>

            {/* Career & Job Placement Outcome */}
            <div className="bg-surface-container-low border border-outline-variant rounded-xl p-5 shadow-xs">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[18px]">work</span>
                  <span>Career Placement & Job Outcome</span>
                </h3>
                {canEditPlacement && (
                  <button
                    onClick={() => setShowPlacementModal(true)}
                    className="px-3 py-1.5 bg-surface-container border border-outline-variant text-primary rounded-lg text-xs font-bold hover:bg-surface-container-high transition-colors cursor-pointer"
                  >
                    Edit Placement Outcome
                  </button>
                )}
              </div>

              {student.placementOutcome ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                  <div className="p-3 bg-surface-container-lowest rounded-lg border border-outline-variant">
                    <span className="text-secondary font-medium block">Placement Status</span>
                    <strong className="text-sm text-primary font-bold block mt-0.5">
                      {student.placementOutcome.status}
                    </strong>
                  </div>
                  <div className="p-3 bg-surface-container-lowest rounded-lg border border-outline-variant">
                    <span className="text-secondary font-medium block">Hiring Company</span>
                    <strong className="text-sm text-on-surface font-bold block mt-0.5">
                      {student.placementOutcome.company || 'Interswitch Group'}
                    </strong>
                  </div>
                  <div className="p-3 bg-surface-container-lowest rounded-lg border border-outline-variant">
                    <span className="text-secondary font-medium block">Job Role</span>
                    <strong className="text-sm text-on-surface font-bold block mt-0.5">
                      {student.placementOutcome.jobRole || 'Workflow & Automation Engineer'}
                    </strong>
                  </div>
                  <div className="p-3 bg-surface-container-lowest rounded-lg border border-outline-variant">
                    <span className="text-secondary font-medium block">Remuneration Package</span>
                    <strong className="text-sm text-emerald-700 font-bold block mt-0.5">
                      {student.placementOutcome.salaryRange || '₦300,000 - ₦400,000 / mo'}
                    </strong>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-secondary text-xs">
                  No post-program career outcome recorded yet.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------------- */}
        {/* TAB 11: DOCUMENT VAULT (ALL VISIBLE TO STUDENTS)                          */}
        {/* ------------------------------------------------------------------------- */}
        {activeTab === 'documents' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div className="bg-surface-container-low border border-outline-variant rounded-xl p-5 shadow-xs">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-sm font-bold text-on-surface flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[18px]">folder_shared</span>
                    <span>Student Document Repository & Vault</span>
                  </h3>
                  <p className="text-xs text-secondary mt-0.5 flex items-center gap-1">
                    <span className="material-symbols-outlined text-emerald-600 text-[14px]">visibility</span>
                    <span>All documents in this repository are guaranteed visible and accessible to the student.</span>
                  </p>
                </div>

                <button
                  onClick={() => setShowDocUploadModal(true)}
                  className="px-3 py-1.5 bg-primary text-on-primary rounded-lg text-xs font-bold hover:bg-primary/90 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">upload_file</span>
                  <span>Upload Document</span>
                </button>
              </div>

              {/* Standard Mandatory Institutional Documents */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {/* Signed Student Handbook */}
                <div className="p-4 bg-surface-container-lowest border border-outline-variant rounded-xl flex items-center justify-between shadow-2xs">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                      <span className="material-symbols-outlined text-[20px]">menu_book</span>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-on-surface">Signed Student Handbook</h4>
                      <span className="text-[11px] text-emerald-600 font-semibold block">
                        {student.handbookSigned ? 'Signed & Acknowledged' : 'Pending Signature'}
                      </span>
                    </div>
                  </div>
                  <a
                    href={student.handbookDriveUrl || 'https://codelab.institute/docs/student_handbook_2026.pdf'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1 bg-surface-container border border-outline-variant text-primary rounded-lg text-xs font-bold hover:bg-surface-container-high transition-colors"
                  >
                    Download
                  </a>
                </div>

                {/* Admission Letter */}
                <div className="p-4 bg-surface-container-lowest border border-outline-variant rounded-xl flex items-center justify-between shadow-2xs">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                      <span className="material-symbols-outlined text-[20px]">mail</span>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-on-surface">Official Admission Letter</h4>
                      <span className="text-[11px] text-secondary block">
                        Offer & Enrollment Confirmation
                      </span>
                    </div>
                  </div>
                  <a
                    href={student.admissionLetterUrl || 'https://codelab.institute/docs/admission_letter.pdf'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1 bg-surface-container border border-outline-variant text-primary rounded-lg text-xs font-bold hover:bg-surface-container-high transition-colors"
                  >
                    Download
                  </a>
                </div>
              </div>

              {/* Uploaded Files & Assignment Attachments */}
              <h4 className="text-xs font-bold text-secondary uppercase tracking-wider mb-3">
                Uploaded Files & Submissions
              </h4>

              {student.documents && student.documents.length > 0 ? (
                <div className="divide-y divide-outline-variant">
                  {student.documents.map((doc) => (
                    <div key={doc.id} className="py-3 flex justify-between items-center gap-3">
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-secondary text-[20px]">description</span>
                        <div>
                          <strong className="text-xs text-on-surface block">{doc.title}</strong>
                          <span className="text-[11px] text-secondary">
                            {doc.fileName} • {new Date(doc.uploadedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1 bg-surface-container border border-outline-variant text-primary rounded-lg text-xs font-bold hover:bg-surface-container-high transition-colors"
                      >
                        Download
                      </a>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-secondary text-xs">
                  No additional submitted files in vault.
                </div>
              )}
            </div>
          </div>
        )}

        </main>
      </div>

      {/* ========================================================================= */}
      {/* 4. MODALS & INLINE EDIT DIALOGS                                            */}
      {/* ========================================================================= */}
      
      {/* Reassign Mentor Modal */}
      {showReassignModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 w-full max-w-md shadow-xl space-y-4">
            <h3 className="text-base font-bold text-on-surface">
              {student.mentorName ? 'Reassign Faculty Mentor' : 'Assign Faculty Mentor'}
            </h3>
            <p className="text-xs text-secondary">
              {student.mentorName 
                ? `Transfer ${student.name} from ${student.mentorName} to another faculty mentor. This change will be logged in the permanent audit trail.`
                : `Assign a dedicated lead faculty mentor to coach ${student.name} and track academic milestones.`}
            </p>

            <div>
              <label className="text-xs font-bold text-secondary block mb-1">New Mentor</label>
              <select
                value={selectedNewMentorId}
                onChange={(e) => setSelectedNewMentorId(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-outline-variant bg-surface-container outline-none"
              >
                <option value="">Select Faculty Mentor...</option>
                {mentors.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.department})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-secondary block mb-1">Reason for Reassignment</label>
              <input
                type="text"
                value={reassignReason}
                onChange={(e) => setReassignReason(e.target.value)}
                placeholder="e.g. Specializing in Automation & AI Chatbots"
                className="w-full text-xs p-2.5 rounded-lg border border-outline-variant bg-surface-container outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowReassignModal(false)}
                className="px-4 py-2 border border-outline-variant rounded-lg text-xs font-bold text-secondary hover:bg-surface-container"
              >
                Cancel
              </button>
              <button
                onClick={handleReassignMentorSubmit}
                className="px-4 py-2 bg-primary text-on-primary rounded-lg text-xs font-bold hover:bg-primary/90"
              >
                Confirm Reassignment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Log Attendance Modal */}
      {showAttendanceModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 w-full max-w-md shadow-xl space-y-4">
            <h3 className="text-base font-bold text-on-surface">Log Session Attendance</h3>
            
            <div>
              <label className="text-xs font-bold text-secondary block mb-1">Session / Class Title</label>
              <input
                type="text"
                value={attendanceForm.sessionTitle}
                onChange={(e) => setAttendanceForm(prev => ({ ...prev, sessionTitle: e.target.value }))}
                placeholder="e.g. 2.1 Building Production Webhooks"
                className="w-full text-xs p-2.5 rounded-lg border border-outline-variant bg-surface-container outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-secondary block mb-1">Date</label>
                <input
                  type="date"
                  value={attendanceForm.date}
                  onChange={(e) => setAttendanceForm(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full text-xs p-2.5 rounded-lg border border-outline-variant bg-surface-container outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-secondary block mb-1">Session Type</label>
                <select
                  value={attendanceForm.type}
                  onChange={(e) => setAttendanceForm(prev => ({ ...prev, type: e.target.value as any }))}
                  className="w-full text-xs p-2.5 rounded-lg border border-outline-variant bg-surface-container outline-none"
                >
                  <option value="lecture">Lecture</option>
                  <option value="workshop">Workshop</option>
                  <option value="webinar">Webinar</option>
                  <option value="coaching">1-on-1 Coaching</option>
                  <option value="makeup">Make-up Session</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-secondary block mb-1">Attendance Status</label>
                <select
                  value={attendanceForm.status}
                  onChange={(e) => setAttendanceForm(prev => ({ ...prev, status: e.target.value as any }))}
                  className="w-full text-xs p-2.5 rounded-lg border border-outline-variant bg-surface-container outline-none font-bold"
                >
                  <option value="Present">Present</option>
                  <option value="Absent">Absent</option>
                  <option value="Late">Late</option>
                  <option value="Excused">Excused</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-secondary block mb-1">Hours Credited</label>
                <input
                  type="number"
                  step="0.5"
                  value={attendanceForm.hoursCredited}
                  onChange={(e) => setAttendanceForm(prev => ({ ...prev, hoursCredited: parseFloat(e.target.value) || 0 }))}
                  className="w-full text-xs p-2.5 rounded-lg border border-outline-variant bg-surface-container outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-secondary block mb-1">Mentor Observation Notes</label>
              <textarea
                rows={2}
                value={attendanceForm.mentorNotes}
                onChange={(e) => setAttendanceForm(prev => ({ ...prev, mentorNotes: e.target.value }))}
                placeholder="Optional notes regarding participation or tardiness..."
                className="w-full text-xs p-2.5 rounded-lg border border-outline-variant bg-surface-container outline-none resize-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowAttendanceModal(false)}
                className="px-4 py-2 border border-outline-variant rounded-lg text-xs font-bold text-secondary hover:bg-surface-container"
              >
                Cancel
              </button>
              <button
                onClick={handleAddAttendanceRecord}
                className="px-4 py-2 bg-primary text-on-primary rounded-lg text-xs font-bold hover:bg-primary/90"
              >
                Save Attendance Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Mentor Note Modal */}
      {showMentorNoteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 w-full max-w-md shadow-xl space-y-4">
            <h3 className="text-base font-bold text-on-surface">Log Mentor Observation</h3>

            <div>
              <label className="text-xs font-bold text-secondary block mb-1">Note Category</label>
              <select
                value={mentorNoteForm.feedbackType}
                onChange={(e) => setMentorNoteForm(prev => ({ ...prev, feedbackType: e.target.value as any }))}
                className="w-full text-xs p-2.5 rounded-lg border border-outline-variant bg-surface-container outline-none"
              >
                <option value="regular">Regular Progress Note</option>
                <option value="warning">Warning / Attendance Concern</option>
                <option value="commendation">Commendation / Academic Praise</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-secondary block mb-1">Observation Details</label>
              <textarea
                rows={4}
                value={mentorNoteForm.content}
                onChange={(e) => setMentorNoteForm(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Document student's engagement, missed tasks, or notable accomplishments..."
                className="w-full text-xs p-2.5 rounded-lg border border-outline-variant bg-surface-container outline-none resize-none"
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={mentorNoteForm.isAtRiskWarning}
                onChange={(e) => setMentorNoteForm(prev => ({ ...prev, isAtRiskWarning: e.target.checked }))}
                className="w-4 h-4 rounded text-rose-600"
              />
              <span className="text-xs font-bold text-rose-700">Flag Student as At-Risk with this warning</span>
            </label>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowMentorNoteModal(false)}
                className="px-4 py-2 border border-outline-variant rounded-lg text-xs font-bold text-secondary hover:bg-surface-container"
              >
                Cancel
              </button>
              <button
                onClick={handleAddMentorNote}
                className="px-4 py-2 bg-primary text-on-primary rounded-lg text-xs font-bold hover:bg-primary/90"
              >
                Submit Note
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Student Feedback Modal */}
      {showStudentFeedbackModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 w-full max-w-lg shadow-xl space-y-4">
            <h3 className="text-base font-bold text-on-surface">Rate Your Mentor & Course</h3>
            <p className="text-xs text-secondary">
              Your feedback helps management enhance coaching quality and curriculum materials.
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-secondary block mb-1">Mentor Rating (1 - 5)</label>
                <select
                  value={studentFeedbackForm.mentorRating}
                  onChange={(e) => setStudentFeedbackForm(prev => ({ ...prev, mentorRating: parseInt(e.target.value) || 5 }))}
                  className="w-full text-xs p-2 rounded-lg border border-outline-variant bg-surface-container"
                >
                  <option value={5}>★★★★★ 5 - Exceptional</option>
                  <option value={4}>★★★★☆ 4 - Good</option>
                  <option value={3}>★★★☆☆ 3 - Average</option>
                  <option value={2}>★★☆☆☆ 2 - Below Expectations</option>
                  <option value={1}>★☆☆☆☆ 1 - Poor</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-secondary block mb-1">Course Rating (1 - 5)</label>
                <select
                  value={studentFeedbackForm.courseRating}
                  onChange={(e) => setStudentFeedbackForm(prev => ({ ...prev, courseRating: parseInt(e.target.value) || 5 }))}
                  className="w-full text-xs p-2 rounded-lg border border-outline-variant bg-surface-container"
                >
                  <option value={5}>★★★★★ 5 - Exceptional</option>
                  <option value={4}>★★★★☆ 4 - Good</option>
                  <option value={3}>★★★☆☆ 3 - Average</option>
                  <option value={2}>★★☆☆☆ 2 - Below Expectations</option>
                  <option value={1}>★☆☆☆☆ 1 - Poor</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-secondary block mb-1">Feedback on Mentor Coaching</label>
              <textarea
                rows={2}
                value={studentFeedbackForm.mentorReview}
                onChange={(e) => setStudentFeedbackForm(prev => ({ ...prev, mentorReview: e.target.value }))}
                placeholder="What did your mentor do well? What could be improved?"
                className="w-full text-xs p-2 rounded-lg border border-outline-variant bg-surface-container resize-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-secondary block mb-1">Feedback on Course Curriculum</label>
              <textarea
                rows={2}
                value={studentFeedbackForm.courseReview}
                onChange={(e) => setStudentFeedbackForm(prev => ({ ...prev, courseReview: e.target.value }))}
                placeholder="How practical were the lessons and assignments?"
                className="w-full text-xs p-2 rounded-lg border border-outline-variant bg-surface-container resize-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-secondary block mb-1">Complaints, Issues or Suggestions</label>
              <textarea
                rows={2}
                value={studentFeedbackForm.complaintsOrSuggestions}
                onChange={(e) => setStudentFeedbackForm(prev => ({ ...prev, complaintsOrSuggestions: e.target.value }))}
                placeholder="Any unresolved grievances or requests for the management team?"
                className="w-full text-xs p-2 rounded-lg border border-outline-variant bg-surface-container resize-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowStudentFeedbackModal(false)}
                className="px-4 py-2 border border-outline-variant rounded-lg text-xs font-bold text-secondary hover:bg-surface-container"
              >
                Cancel
              </button>
              <button
                onClick={handleStudentFeedbackSubmit}
                className="px-4 py-2 bg-primary text-on-primary rounded-lg text-xs font-bold hover:bg-primary/90"
              >
                Submit Review
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Document Modal */}
      {showDocUploadModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 w-full max-w-md shadow-xl space-y-4">
            <h3 className="text-base font-bold text-on-surface">Upload Document to Vault</h3>

            <div>
              <label className="text-xs font-bold text-secondary block mb-1">Document Title</label>
              <input
                type="text"
                value={docUploadForm.title}
                onChange={(e) => setDocUploadForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g. Lab 3 Webhook Diagram"
                className="w-full text-xs p-2.5 rounded-lg border border-outline-variant bg-surface-container outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-secondary block mb-1">Category</label>
                <select
                  value={docUploadForm.type}
                  onChange={(e) => setDocUploadForm(prev => ({ ...prev, type: e.target.value as any }))}
                  className="w-full text-xs p-2.5 rounded-lg border border-outline-variant bg-surface-container outline-none"
                >
                  <option value="assignment_file">Assignment / Lab File</option>
                  <option value="project_file">Hands-on Project File</option>
                  <option value="handbook">Student Handbook</option>
                  <option value="admission_letter">Admission Letter</option>
                  <option value="other">Other Document</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-secondary block mb-1">File Name</label>
                <input
                  type="text"
                  value={docUploadForm.fileName}
                  onChange={(e) => setDocUploadForm(prev => ({ ...prev, fileName: e.target.value }))}
                  placeholder="e.g. lab_webhook.json"
                  className="w-full text-xs p-2.5 rounded-lg border border-outline-variant bg-surface-container outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-secondary block mb-1">File URL / Cloud Storage Link</label>
              <input
                type="text"
                value={docUploadForm.fileUrl}
                onChange={(e) => setDocUploadForm(prev => ({ ...prev, fileUrl: e.target.value }))}
                placeholder="https://drive.google.com/... or leave blank for local path"
                className="w-full text-xs p-2.5 rounded-lg border border-outline-variant bg-surface-container outline-none"
              />
            </div>

            <p className="text-[11px] text-emerald-700 bg-emerald-50 p-2.5 rounded-lg">
              ✓ This document will be automatically visible to the student in their Document Vault.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowDocUploadModal(false)}
                className="px-4 py-2 border border-outline-variant rounded-lg text-xs font-bold text-secondary hover:bg-surface-container"
              >
                Cancel
              </button>
              <button
                onClick={handleUploadDocumentSubmit}
                className="px-4 py-2 bg-primary text-on-primary rounded-lg text-xs font-bold hover:bg-primary/90"
              >
                Save Document
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Skill Modal */}
      {showSkillModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 w-full max-w-sm shadow-xl space-y-4">
            <h3 className="text-base font-bold text-on-surface">Endorse Acquired Skill</h3>
            <div>
              <label className="text-xs font-bold text-secondary block mb-1">Skill Name</label>
              <input
                type="text"
                value={newSkillText}
                onChange={(e) => setNewSkillText(e.target.value)}
                placeholder="e.g. Prompt Engineering, Make, n8n, APIs..."
                className="w-full text-xs p-2.5 rounded-lg border border-outline-variant bg-surface-container outline-none"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowSkillModal(false)}
                className="px-4 py-2 border border-outline-variant rounded-lg text-xs font-bold text-secondary hover:bg-surface-container"
              >
                Cancel
              </button>
              <button
                onClick={handleAddSkill}
                className="px-4 py-2 bg-primary text-on-primary rounded-lg text-xs font-bold hover:bg-primary/90"
              >
                Add Skill
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update Stage Modal */}
      {showStageModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 w-full max-w-sm shadow-xl space-y-4">
            <h3 className="text-base font-bold text-on-surface">Update Academic Stage</h3>
            <div className="space-y-2">
              {(['Beginner', 'Intermediate', 'Advanced'] as const).map(stage => (
                <button
                  key={stage}
                  onClick={() => setSelectedStage(stage)}
                  className={`w-full p-3 rounded-xl text-xs font-bold flex items-center justify-between border transition-all cursor-pointer ${
                    selectedStage === stage
                      ? 'bg-primary text-on-primary border-primary shadow-xs'
                      : 'bg-surface-container border-outline-variant text-secondary hover:text-on-surface'
                  }`}
                >
                  <span>{stage}</span>
                  {selectedStage === stage && (
                    <span className="material-symbols-outlined text-[16px]">check</span>
                  )}
                </button>
              ))}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowStageModal(false)}
                className="px-4 py-2 border border-outline-variant rounded-lg text-xs font-bold text-secondary hover:bg-surface-container"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateStage}
                className="px-4 py-2 bg-primary text-on-primary rounded-lg text-xs font-bold hover:bg-primary/90"
              >
                Save Stage
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Placement Outcome Modal */}
      {showPlacementModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 w-full max-w-md shadow-xl space-y-4">
            <h3 className="text-base font-bold text-on-surface">Update Career Placement Outcome</h3>
            
            <div>
              <label className="text-xs font-bold text-secondary block mb-1">Placement Status</label>
              <select
                value={placementForm.status}
                onChange={(e) => setPlacementForm(prev => ({ ...prev, status: e.target.value as any }))}
                className="w-full text-xs p-2.5 rounded-lg border border-outline-variant bg-surface-container outline-none font-bold"
              >
                <option value="Employed">Employed</option>
                <option value="Internship">Internship</option>
                <option value="Freelancing">Freelancing</option>
                <option value="Seeking Placement">Seeking Placement</option>
                <option value="Not Seeking">Not Seeking</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-secondary block mb-1">Hiring Company</label>
                <input
                  type="text"
                  value={placementForm.company}
                  onChange={(e) => setPlacementForm(prev => ({ ...prev, company: e.target.value }))}
                  placeholder="e.g. Interswitch, Paystack"
                  className="w-full text-xs p-2.5 rounded-lg border border-outline-variant bg-surface-container outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-secondary block mb-1">Job Role / Title</label>
                <input
                  type="text"
                  value={placementForm.jobRole}
                  onChange={(e) => setPlacementForm(prev => ({ ...prev, jobRole: e.target.value }))}
                  placeholder="e.g. Automation Engineer"
                  className="w-full text-xs p-2.5 rounded-lg border border-outline-variant bg-surface-container outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-secondary block mb-1">Placement Date</label>
                <input
                  type="date"
                  value={placementForm.placementDate}
                  onChange={(e) => setPlacementForm(prev => ({ ...prev, placementDate: e.target.value }))}
                  className="w-full text-xs p-2.5 rounded-lg border border-outline-variant bg-surface-container outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-secondary block mb-1">Salary Range</label>
                <input
                  type="text"
                  value={placementForm.salaryRange}
                  onChange={(e) => setPlacementForm(prev => ({ ...prev, salaryRange: e.target.value }))}
                  placeholder="e.g. ₦300,000 - ₦400,000 / mo"
                  className="w-full text-xs p-2.5 rounded-lg border border-outline-variant bg-surface-container outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowPlacementModal(false)}
                className="px-4 py-2 border border-outline-variant rounded-lg text-xs font-bold text-secondary hover:bg-surface-container"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdatePlacement}
                className="px-4 py-2 bg-primary text-on-primary rounded-lg text-xs font-bold hover:bg-primary/90"
              >
                Save Placement Record
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
