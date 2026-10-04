import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useCRM, formatNaira } from '../context/CRMContext';
import { MentorStatus, MentorPayoutRequest, Student } from '../types/crm';
import { PerformanceMeter } from '../components/common/PerformanceMeter';
import { PayoutVoucherModal } from '../components/modals/PayoutVoucherModal';
import { StudentWelfareInterventionModal } from '../components/modals/StudentWelfareInterventionModal';
import { CrispStatusBadge } from '../components/common/CrispStatusBadge';

export const MentorManagementPage: React.FC = () => {
  const { 
    mentors, 
    sessions, 
    students,
    courses,
    studentPerformanceReports,
    markSessionAttendance,
    updateReportFollowUpStatus,
    updateMentorStatus, 
    openModal, 
    globalSearch, 
    setSelectedMentorForBookingId,
    setSelectedMentorForEditId,
    currentUser,
    setSelectedMentorForDisburse,
    wallet,
    timetables,
    settings,
    setSelectedSlotForAttendance,
    payoutRequests,
    reviewMentorPayout,
  } = useCRM();

  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<'roster' | 'sessions' | 'reports' | 'timetable' | 'payouts'>('roster');
  const [tableSearch, setTableSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('All');
  const [selectedPayoutForVoucher, setSelectedPayoutForVoucher] = useState<MentorPayoutRequest | null>(null);
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);
  const [selectedStudentForWelfare, setSelectedStudentForWelfare] = useState<Student | null>(null);
  const [isWelfareModalOpen, setIsWelfareModalOpen] = useState(false);

  const effectiveSearch = globalSearch || tableSearch;
  const isMentor = currentUser?.role === 'mentor';
  const isSuperAdmin = currentUser?.role === 'super_admin';
  const isFinance = currentUser?.role === 'finance';

  // Find current mentor profile if logged in as mentor
  const myMentorProfile = isMentor
    ? (mentors.find(
        m => m.id === currentUser?.mentorId || m.name === currentUser?.name || m.email === currentUser?.email
      ) || null)
    : null;

  // React to URL action and tab query params
  useEffect(() => {
    const action = searchParams.get('action');
    const tabParam = searchParams.get('tab');

    if (tabParam === 'availability') {
      navigate('/mentors/office-hours', { replace: true });
      return;
    }
    if (tabParam === 'grading') {
      navigate('/mentors/grading', { replace: true });
      return;
    }

    if (tabParam && ['roster', 'sessions', 'reports', 'timetable', 'payouts'].includes(tabParam)) {
      setActiveTab(tabParam as any);
    }

    if (action) {
      if (action === 'course-outline') {
        navigate('/mentors/course-outlines', { replace: true });
        return;
      } else if (action === 'book-session') {
        setSelectedMentorForBookingId(isMentor ? (myMentorProfile?.id || null) : null);
        openModal('book-session');
      } else if (action === 'submit-report') {
        openModal('submit-performance-report');
      } else if (action === 'request-payout') {
        openModal('request-payout');
      }

      // Immediately clean the action query param from the URL to prevent sticky modal re-opening loop
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete('action');
      setSearchParams(nextParams, { replace: true });
    }
  }, [searchParams, isMentor, myMentorProfile, openModal, setSelectedMentorForBookingId, setSearchParams]);

  const accessiblePayoutRequests = useMemo(() => {
    if (!payoutRequests) return [];
    if (!isMentor) return payoutRequests;
    return payoutRequests.filter(
      r => r.mentorId === myMentorProfile?.id || r.mentorEmail.toLowerCase() === currentUser?.email.toLowerCase()
    );
  }, [payoutRequests, isMentor, myMentorProfile, currentUser]);

  const pendingPayoutCount = useMemo(() => {
    return (payoutRequests || []).filter(r => r.status === 'Pending').length;
  }, [payoutRequests]);

  // Mentors are only allowed to see mentors that they share a course, student, or department with
  const accessibleMentors = useMemo(() => {
    if (!isMentor) return mentors;

    // Get courses taught by this mentor or programs taken by their students
    const myStudents = myMentorProfile 
      ? students.filter(s => s.mentorId === myMentorProfile.id || s.mentorName === myMentorProfile.name)
      : [];
    const myStudentPrograms = new Set(myStudents.map(s => s.program));
    const myCourses = myMentorProfile
      ? courses.filter(c => c.leadInstructor === myMentorProfile.name || myStudentPrograms.has(c.title))
      : [];
    const sharedInstructors = new Set(myCourses.map(c => c.leadInstructor));

    return mentors.filter(m => {
      // 1. The mentor themselves
      if (myMentorProfile && m.id === myMentorProfile.id) return true;
      // 2. Mentors in the same department
      if (myMentorProfile?.department && m.department === myMentorProfile.department) return true;
      // 3. Mentors who share a course or student
      if (sharedInstructors.has(m.name)) return true;
      return false;
    });
  }, [mentors, isMentor, myMentorProfile, students, courses]);

  const filteredMentors = useMemo(() => {
    return accessibleMentors.filter((mentor) => {
      const matchesDept = departmentFilter === 'All' || mentor.department === departmentFilter;
      const matchesSearch = 
        mentor.name.toLowerCase().includes(effectiveSearch.toLowerCase()) ||
        mentor.email.toLowerCase().includes(effectiveSearch.toLowerCase()) ||
        mentor.role.toLowerCase().includes(effectiveSearch.toLowerCase()) ||
        mentor.department.toLowerCase().includes(effectiveSearch.toLowerCase());
      return matchesDept && matchesSearch;
    });
  }, [accessibleMentors, departmentFilter, effectiveSearch]);

  // Mentors only see their own 1-on-1 sessions
  const accessibleSessions = useMemo(() => {
    if (!isMentor) return sessions;
    return sessions.filter(s => s.mentorId === myMentorProfile?.id || s.mentorName === myMentorProfile?.name);
  }, [sessions, isMentor, myMentorProfile]);

  const filteredSessions = useMemo(() => {
    return accessibleSessions.filter((s) => {
      return (
        s.sessionCode.toLowerCase().includes(effectiveSearch.toLowerCase()) ||
        s.mentorName.toLowerCase().includes(effectiveSearch.toLowerCase()) ||
        s.studentName.toLowerCase().includes(effectiveSearch.toLowerCase()) ||
        s.topic.toLowerCase().includes(effectiveSearch.toLowerCase())
      );
    });
  }, [accessibleSessions, effectiveSearch]);

  const accessibleReports = useMemo(() => {
    if (!isMentor) return studentPerformanceReports || [];
    return (studentPerformanceReports || []).filter(
      r => r.mentorId === myMentorProfile?.id || r.mentorName === myMentorProfile?.name
    );
  }, [studentPerformanceReports, isMentor, myMentorProfile]);

  const filteredReports = useMemo(() => {
    return accessibleReports.filter((r) => {
      return (
        r.reportCode.toLowerCase().includes(effectiveSearch.toLowerCase()) ||
        r.studentName.toLowerCase().includes(effectiveSearch.toLowerCase()) ||
        r.mentorName.toLowerCase().includes(effectiveSearch.toLowerCase()) ||
        r.program.toLowerCase().includes(effectiveSearch.toLowerCase()) ||
        r.performanceTier.toLowerCase().includes(effectiveSearch.toLowerCase()) ||
        r.managementFollowUpStatus.toLowerCase().includes(effectiveSearch.toLowerCase())
      );
    });
  }, [accessibleReports, effectiveSearch]);

  const accessibleTimetables = useMemo(() => {
    if (!timetables) return [];
    if (!isMentor) return timetables;
    return timetables.filter(
      slot =>
        slot.mentorId === myMentorProfile?.id ||
        (myMentorProfile?.name && slot.mentorName.toLowerCase().includes(myMentorProfile.name.toLowerCase()))
    );
  }, [timetables, isMentor, myMentorProfile]);

  const filteredTimetables = useMemo(() => {
    return accessibleTimetables.filter(slot => {
      const q = effectiveSearch.toLowerCase();
      const venueOrLink = (slot.venue || slot.meetingLink || '').toLowerCase();
      return (
        !q ||
        slot.courseTitle.toLowerCase().includes(q) ||
        slot.cohortName.toLowerCase().includes(q) ||
        slot.mentorName.toLowerCase().includes(q) ||
        slot.topic.toLowerCase().includes(q) ||
        venueOrLink.includes(q)
      );
    });
  }, [accessibleTimetables, effectiveSearch]);

  const departments = ['All', 'Software Engineering', 'Data & AI', 'Design Systems', 'Backend & Cloud', 'Frontend', 'Product'];

  // Metrics
  const totalSessionsLogged = isMentor ? accessibleSessions.length : sessions.length;
  const totalHoursLogged = isMentor 
    ? accessibleSessions.reduce((acc, s) => acc + s.durationHours, 0)
    : sessions.reduce((acc, s) => acc + s.durationHours, 0);

  const pendingTuitionShareTotal = isMentor 
    ? (myMentorProfile?.pendingPayout || 0)
    : mentors.reduce((acc, m) => acc + m.pendingPayout, 0);

  return (
    <div className="space-y-stack-lg animate-in fade-in duration-200">
      {/* Mentor Privacy Banner */}
      {isMentor && (
        <div className="p-3 bg-secondary-container/30 border border-outline-variant rounded-lg flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[20px]">security</span>
            <span className="text-on-surface font-semibold">
              Faculty Discretion Active: You can only view co-faculty in your academic department/shared tracks. Other mentors&apos; rates &amp; earnings are confidential.
            </span>
          </div>
          <span className="font-data-tabular text-primary font-bold">
            {myMentorProfile?.name || 'Faculty Member'} ({myMentorProfile?.department || 'Faculty Pool'})
          </span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex justify-between items-end flex-wrap gap-4">
        <div>
          <h2 className="font-headline-lg text-headline-lg font-bold text-on-surface mb-unit">
            {isMentor ? 'Faculty Mentorship & Sessions' : 'Faculty Mentors & 1-on-1 Sessions'}
          </h2>
          <p className="font-body-md text-body-md text-secondary">
            {isMentor 
              ? 'Log 1-on-1 student coaching hours, view assigned student mentees, and track 37% enrollment commission payouts in ₦.'
              : 'Manage faculty assignments, 37% student enrollment commissions, and tuition share payouts.'}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link
            to="/mentors/course-outlines"
            className="btn-secondary h-10 px-3.5 text-xs"
            title="Review Course Outlines and Mark Completed Syllabus Topics"
          >
            <span className="material-symbols-outlined text-primary text-[18px]">account_tree</span>
            <span>Course Outlines</span>
          </Link>
          <button
            onClick={() => {
              setSelectedMentorForBookingId(isMentor ? (myMentorProfile?.id || null) : null);
              openModal('book-session');
            }}
            className="btn-secondary h-10 px-3.5 text-xs"
          >
            <span className="material-symbols-outlined text-primary text-[18px]">calendar_month</span>
            <span>+ Log 1-on-1 Session</span>
          </button>
          <button
            onClick={() => openModal('submit-performance-report')}
            className="btn-secondary h-10 px-3.5 text-xs"
          >
            <span className="material-symbols-outlined text-sea-green text-[18px]">assessment</span>
            <span>+ File Evaluation Report</span>
          </button>
          <Link
            to="/mentors/office-hours"
            className="btn-secondary h-10 px-3 text-xs"
            title="Configure weekly office hours and self-booking slots"
          >
            <span className="material-symbols-outlined text-[18px]">schedule</span>
            <span>Office Hours</span>
          </Link>
          <Link
            to="/mentors/grading"
            className="btn-secondary h-10 px-3 text-xs"
            title="Review student assignments and score rubrics"
          >
            <span className="material-symbols-outlined text-[18px]">fact_check</span>
            <span>Grading Inbox</span>
          </Link>
          <button
            type="button"
            onClick={() => {
              setSelectedStudentForWelfare(null);
              setIsWelfareModalOpen(true);
            }}
            className="btn-danger h-10 px-3.5 text-xs"
            title="Flag an at-risk student mentee for immediate academic & welfare intervention"
          >
            <span className="material-symbols-outlined text-[18px]">emergency_home</span>
            <span>🚨 Flag At-Risk</span>
          </button>
          {isMentor && (
            <button
              onClick={() => openModal('request-payout')}
              className="btn-primary h-10 px-3.5 text-xs"
              title="Request withdrawal of your accrued 37% commission"
            >
              <span className="material-symbols-outlined text-[18px]">payments</span>
              <span>Request Payout</span>
            </button>
          )}
          {isSuperAdmin && (
            <button
              onClick={() => openModal('recruit-mentor')}
              className="btn-primary h-10 px-3.5 text-xs"
            >
              <span className="material-symbols-outlined text-[18px]">person_add</span>
              <span>Recruit Faculty Mentor</span>
            </button>
          )}
        </div>
      </div>

      {/* 4 Bento Summary Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter">
        <div className="bg-surface-container-lowest p-stack-md border border-outline-variant rounded-lg shadow-xs">
          <div className="flex justify-between items-start mb-stack-md">
            <div className="w-10 h-10 rounded bg-secondary-container flex items-center justify-center text-primary">
              <span className="material-symbols-outlined">supervisor_account</span>
            </div>
            <span className="text-xs font-bold text-[#166534] bg-[#dcfce7] px-2 py-1 rounded">Active</span>
          </div>
          <p className="font-body-sm text-body-sm text-secondary mb-unit">
            {isMentor ? 'Connected Faculty Pool' : 'Total Faculty Pool'}
          </p>
          <h3 className="font-display text-display font-bold text-on-surface">
            {filteredMentors.length} Mentors
          </h3>
        </div>

        <div className="bg-surface-container-lowest p-stack-md border border-outline-variant rounded-lg shadow-xs">
          <div className="flex justify-between items-start mb-stack-md">
            <div className="w-10 h-10 rounded bg-primary-container flex items-center justify-center text-on-primary">
              <span className="material-symbols-outlined">forum</span>
            </div>
            <span className="text-xs font-bold text-primary bg-secondary-container px-2 py-1 rounded font-data-tabular">
              {totalHoursLogged} Hours Logged
            </span>
          </div>
          <p className="font-body-sm text-body-sm text-secondary mb-unit">
            {isMentor ? 'My 1-on-1 Coaching Sessions' : 'Total Sessions Conducted'}
          </p>
          <h3 className="font-display text-display font-bold text-on-surface">{totalSessionsLogged} Sessions</h3>
        </div>

        <div className="bg-surface-container-lowest p-stack-md border border-outline-variant rounded-lg shadow-xs">
          <div className="flex justify-between items-start mb-stack-md">
            <div className="w-10 h-10 rounded bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <span className="material-symbols-outlined">timer</span>
            </div>
            {isMentor ? (
              (myMentorProfile?.lecturedHours || 0) >= (myMentorProfile?.minimumRequiredHours || settings.mentorMinimumLecturedHours || 20) ? (
                <span className="text-[10px] font-bold text-[#166534] bg-[#dcfce7] px-2 py-0.5 rounded">Eligible</span>
              ) : (
                <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">Under Hours</span>
              )
            ) : (
              <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-1 rounded font-data-tabular">
                {settings.mentorMinimumLecturedHours || 20}h Target
              </span>
            )}
          </div>
          <p className="font-body-sm text-body-sm text-secondary mb-unit">
            {isMentor ? 'Class Lecturing Hours' : 'Faculty Lecturing Hours'}
          </p>
          <div className="flex items-baseline gap-1">
            <h3 className="font-display text-display font-bold text-on-surface font-data-tabular">
              {isMentor
                ? `${(myMentorProfile?.lecturedHours || 0).toFixed(1)} / ${(myMentorProfile?.minimumRequiredHours || settings.mentorMinimumLecturedHours || 20).toFixed(0)}h`
                : `${mentors.reduce((acc, m) => acc + (m.lecturedHours || 0), 0).toFixed(1)}h Total`}
            </h3>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-stack-md border border-outline-variant rounded-lg shadow-xs">
          <div className="flex justify-between items-start mb-stack-md">
            <div className="w-10 h-10 rounded bg-surface-container flex items-center justify-center text-on-surface">
              <span className="material-symbols-outlined">account_balance_wallet</span>
            </div>
            <span className="text-xs font-bold text-secondary bg-surface-container-high px-2 py-1 rounded">37% Share (₦)</span>
          </div>
          <p className="font-body-sm text-body-sm text-secondary mb-unit">
            {isMentor ? 'My Pending Tuition Share' : 'Pending Tuition Share (37%)'}
          </p>
          <div className="flex justify-between items-baseline flex-wrap gap-1">
            <h3 className="font-display text-display font-bold text-on-surface">
              {formatNaira(pendingTuitionShareTotal)}
            </h3>
            <span className="text-[11px] font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Wallet: {formatNaira(wallet?.balance || 0)}
            </span>
          </div>
          {isMentor && (
            <button
              onClick={() => openModal('request-payout')}
              className="mt-3 w-full py-2 px-3 bg-primary text-on-primary rounded-lg text-xs font-bold hover:bg-primary/90 transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">payments</span>
              <span>Request Commission Payout</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Container with Tabs */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-lg overflow-hidden shadow-xs">
        {/* Navigation Tabs & Search Controls */}
        <div className="p-stack-md border-b border-outline-variant flex justify-between items-center bg-surface-bright flex-wrap gap-4">
          <div className="flex border border-outline rounded-lg p-1 bg-canvas overflow-x-auto gap-1">
            <button
              onClick={() => setActiveTab('roster')}
              className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'roster'
                  ? 'bg-primary text-white'
                  : 'text-secondary hover:text-crisp-black'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">groups</span>
              <span>{isMentor ? 'Co-Faculty Roster' : 'Faculty Roster'} ({filteredMentors.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('sessions')}
              className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'sessions'
                  ? 'bg-primary text-white'
                  : 'text-secondary hover:text-crisp-black'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">calendar_month</span>
              <span>{isMentor ? 'My 1-on-1 Sessions' : 'Sessions Log'} ({filteredSessions.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'reports'
                  ? 'bg-primary text-white'
                  : 'text-secondary hover:text-crisp-black'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">assessment</span>
              <span>Student Evaluations &amp; Welfare ({filteredReports.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('timetable')}
              className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'timetable'
                  ? 'bg-primary text-white'
                  : 'text-secondary hover:text-crisp-black'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">calendar_today</span>
              <span>{isMentor ? 'My Class Timetable' : 'Class Timetable'} ({accessibleTimetables.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('payouts')}
              className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'payouts'
                  ? 'bg-primary text-white'
                  : 'text-secondary hover:text-crisp-black'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">payments</span>
              <span>{isMentor ? 'My Payout Requests' : 'Payout Requests'}</span>
              {pendingPayoutCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-lemon-curry text-white text-[10px] font-bold">
                  {pendingPayoutCount}
                </span>
              )}
            </button>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Department Filter */}
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="h-9 px-3 bg-surface border border-outline-variant rounded text-xs font-body-md text-on-surface outline-none cursor-pointer"
            >
              {departments.map((dept) => (
                <option key={dept} value={dept}>{dept} Department</option>
              ))}
            </select>

            {/* In-table Search */}
            <div className="relative">
              <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-outline text-[16px]">
                search
              </span>
              <input
                type="text"
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                placeholder="Search mentor or session..."
                className="h-9 pl-8 pr-3 bg-surface border border-outline-variant rounded text-xs font-body-md text-on-surface focus:border-primary outline-none w-48 sm:w-56"
              />
            </div>
          </div>
        </div>

        {/* Tab 1: Faculty Roster Table */}
        {activeTab === 'roster' && (
          <div className="p-stack-md space-y-4">
            {/* Mentor Table */}
            <div className="overflow-x-auto">
              {filteredMentors.length === 0 ? (
                <div className="p-12 text-center flex flex-col items-center justify-center space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <span className="material-symbols-outlined text-[28px]">supervisor_account</span>
                  </div>
                  <div className="max-w-sm space-y-1">
                    <h3 className="font-bold text-sm text-on-surface">No Faculty Mentors Found</h3>
                    <p className="text-xs text-secondary">
                      Your faculty directory is clean. You can recruit instructors, define their ₦ hourly rates, and assign them to academic tracks.
                    </p>
                  </div>
                  {isSuperAdmin && (
                    <button
                      onClick={() => openModal('recruit-mentor')}
                      className="px-4 h-9 rounded-lg bg-primary text-on-primary text-xs font-bold hover:bg-primary/90 flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <span className="material-symbols-outlined text-[16px]">person_add</span>
                      <span>+ Recruit Faculty Mentor</span>
                    </button>
                  )}
                </div>
              ) : (
                <table className="w-full text-left border-collapse min-w-[700px] text-xs">
                  <thead>
                    <tr className="border-b border-outline-variant bg-surface text-secondary font-label-md">
                      <th className="px-stack-md py-3 font-semibold">Faculty Mentor</th>
                      <th className="px-stack-md py-3 font-semibold">Department</th>
                      <th className="px-stack-md py-3 font-semibold">Lectured Hours</th>
                      <th className="px-stack-md py-3 font-semibold">Mentees / Cap</th>
                      <th className="px-stack-md py-3 font-semibold">Commission Agreement</th>
                      <th className="px-stack-md py-3 font-semibold">Pending Share (₦)</th>
                      <th className="px-stack-md py-3 font-semibold">Status</th>
                      <th className="px-stack-md py-3 text-right font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="font-data-tabular text-on-surface divide-y divide-outline-variant">
                    {filteredMentors.map((mentor, index) => {
                      const isSelf = Boolean(myMentorProfile && mentor.id === myMentorProfile.id);
                      const canViewFinancials = isSuperAdmin || isFinance || isSelf;
                      const canViewFullBanking = isSuperAdmin || isFinance || isSelf;
                      const formattedAccount = mentor.accountNumber
                        ? (canViewFullBanking ? mentor.accountNumber : `••••${mentor.accountNumber.slice(-4)}`)
                        : 'N/A';
                      const reqHours = mentor.minimumRequiredHours || settings.mentorMinimumLecturedHours || 20;
                      const loggedHours = mentor.lecturedHours || 0;
                      const isHoursEligible = loggedHours >= reqHours;

                      return (
                        <tr 
                          key={mentor.id}
                          className={`hover:bg-surface-bright transition-colors ${index % 2 === 1 ? 'bg-surface' : ''}`}
                        >
                          <td className="px-stack-md py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-xs">
                                {mentor.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                              </div>
                              <div>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <p className="font-bold text-on-surface text-sm">{mentor.name}</p>
                                  {mentor.isAccountVerified ? (
                                    <span className="text-[10px] font-bold text-[#166534] bg-[#dcfce7] px-1.5 py-0.2 rounded flex items-center gap-0.5" title="Bank account verified via NIBSS/CBN standard">
                                      <span className="material-symbols-outlined text-[12px]">verified</span> Verified ✅
                                    </span>
                                  ) : (
                                    <span className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200/60 px-1 py-0.2 rounded" title="Bank account pending verification">
                                      Unverified Account
                                    </span>
                                  )}
                                </div>
                                <p className="text-secondary text-[11px]">
                                  {mentor.email} {mentor.bankName ? `• ${mentor.bankName} (${formattedAccount})` : ''}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-stack-md py-3 font-medium text-on-surface">
                            {mentor.department}
                          </td>

                          <td className="px-stack-md py-3">
                            <div>
                              <div className="flex items-center gap-1 font-data-tabular">
                                <span className={`font-bold ${isHoursEligible ? 'text-emerald-700' : 'text-amber-700'}`}>
                                  {loggedHours.toFixed(1)}h
                                </span>
                                <span className="text-secondary text-[10px]">/ {reqHours.toFixed(0)}h</span>
                              </div>
                              {isHoursEligible ? (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] font-bold bg-[#dcfce7] text-[#166534]">
                                  <span className="material-symbols-outlined text-[12px]">verified</span>
                                  <span>Eligible</span>
                                </span>
                              ) : (
                                <span
                                  className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-100 text-amber-800"
                                  title={`Requires at least ${reqHours} hours of class lectures before payout eligibility`}
                                >
                                  <span className="material-symbols-outlined text-[12px]">lock</span>
                                  <span>Needs {Math.max(0, reqHours - loggedHours).toFixed(1)}h</span>
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="px-stack-md py-3">
                            <div className="flex items-center gap-2">
                              <span className="font-bold">{mentor.activeMentees}</span>
                              <span className="text-secondary text-[11px]">/ {mentor.maxCapacity} max</span>
                            </div>
                          </td>

                          <td className="px-stack-md py-3 font-bold font-data-tabular text-primary">
                            {canViewFinancials ? (
                              <span className="inline-flex items-center gap-1">
                                <span className="text-xs font-bold text-[#166534] bg-[#dcfce7] px-2 py-0.5 rounded">
                                  {mentor.commissionRate ?? 37}% per student
                                </span>
                              </span>
                            ) : 'Confidential'}
                          </td>

                          <td className="px-stack-md py-3 font-bold font-data-tabular text-on-surface">
                            {canViewFinancials ? formatNaira(mentor.pendingPayout) : 'Confidential'}
                          </td>

                          <td className="px-stack-md py-3">
                            {isSuperAdmin ? (
                              <select 
                                value={mentor.status}
                                onChange={(e) => updateMentorStatus(mentor.id, e.target.value as MentorStatus)}
                                className="text-xs font-semibold px-2 py-1 rounded border border-outline-variant bg-surface outline-none cursor-pointer"
                              >
                                <option value="Active">Active</option>
                                <option value="Available">Available</option>
                                <option value="On Leave">On Leave</option>
                              </select>
                            ) : (
                              <CrispStatusBadge status={mentor.status} />
                            )}
                          </td>

                          <td className="px-stack-md py-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {isSuperAdmin && (
                                <button 
                                  onClick={() => {
                                    setSelectedMentorForEditId(mentor.id);
                                    openModal('edit-mentor');
                                  }}
                                  className="px-2.5 py-1 rounded border border-outline-variant hover:border-primary text-secondary hover:text-primary font-sans text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                                  title="Edit Faculty Mentor Profile"
                                >
                                  <span className="material-symbols-outlined text-[14px]">edit</span>
                                  <span>Edit Profile</span>
                                </button>
                              )}

                              <button 
                                onClick={() => {
                                  setSelectedMentorForBookingId(mentor.id);
                                  openModal('book-session');
                                }}
                                className="px-2.5 py-1 rounded border border-outline-variant hover:border-primary text-secondary hover:text-primary font-sans text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                                title="Log 1-on-1 Mentorship Session"
                              >
                                <span className="material-symbols-outlined text-[14px]">calendar_month</span>
                                <span>Log Session</span>
                              </button>

                              {(isSuperAdmin || isFinance) && mentor.pendingPayout > 0 && (
                                isHoursEligible ? (
                                  <button 
                                    onClick={() => {
                                      setSelectedMentorForDisburse(mentor);
                                      openModal('disburse-mentor');
                                    }}
                                    className={`px-2.5 py-1 rounded text-white font-sans text-xs font-semibold shadow-xs transition-colors flex items-center gap-1 cursor-pointer ${
                                      mentor.isAccountVerified ? 'bg-[#166534] hover:bg-[#15803d]' : 'bg-amber-600 hover:bg-amber-700'
                                    }`}
                                    title={mentor.isAccountVerified ? "Disburse 37% Commission Share via Expense Wallet" : "Account Unverified - Verify before disbursement"}
                                  >
                                    <span className="material-symbols-outlined text-[14px]">send_money</span>
                                    <span>{mentor.isAccountVerified ? 'Disburse Share' : 'Verify & Disburse'}</span>
                                  </button>
                                ) : (
                                  <button 
                                    disabled
                                    className="px-2.5 py-1 rounded bg-slate-100 border border-slate-300 text-slate-500 font-sans text-xs font-semibold shadow-xs flex items-center gap-1 cursor-not-allowed"
                                    title={`Payout Locked: Mentor has logged ${loggedHours.toFixed(1)}h of required ${reqHours.toFixed(1)}h lecturing hours.`}
                                  >
                                    <span className="material-symbols-outlined text-[14px]">lock</span>
                                    <span>Locked ({loggedHours.toFixed(0)}/{reqHours.toFixed(0)}h)</span>
                                  </button>
                                )
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: 1-on-1 Mentorship Sessions Log */}
        {activeTab === 'sessions' && (
          <div className="overflow-x-auto">
            {filteredSessions.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center justify-center space-y-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-[28px]">calendar_month</span>
                </div>
                <div className="max-w-sm space-y-1">
                  <h3 className="font-bold text-sm text-on-surface">No Coaching Sessions Logged</h3>
                  <p className="text-xs text-secondary">
                    Log completed 1-on-1 student technical coaching hours and milestone progress.
                  </p>
                </div>
                <button
                  onClick={() => openModal('book-session')}
                  className="px-4 h-9 rounded-lg bg-primary text-on-primary text-xs font-bold hover:bg-primary/90 flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <span className="material-symbols-outlined text-[16px]">calendar_add_on</span>
                  <span>+ Log 1-on-1 Session</span>
                </button>
              </div>
            ) : (
              <table className="w-full text-left border-collapse min-w-[850px] text-xs">
                <thead>
                  <tr className="border-b border-outline-variant bg-surface-container-low text-secondary font-label-md">
                    <th className="px-stack-md py-3 font-semibold">Session Code</th>
                    <th className="px-stack-md py-3 font-semibold">Date &amp; Time Slot</th>
                    <th className="px-stack-md py-3 font-semibold">Faculty Mentor</th>
                    <th className="px-stack-md py-3 font-semibold">Student Mentee</th>
                    <th className="px-stack-md py-3 font-semibold">Topic &amp; Review Focus</th>
                    <th className="px-stack-md py-3 font-semibold">Duration</th>
                    <th className="px-stack-md py-3 font-semibold">Attendance &amp; Hours</th>
                    <th className="px-stack-md py-3 font-semibold">Compensation Model</th>
                    <th className="px-stack-md py-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="font-data-tabular text-on-surface divide-y divide-outline-variant/60">
                  {filteredSessions.map((s, index) => (
                    <tr 
                      key={s.id}
                      className={`hover:bg-surface-bright transition-colors ${index % 2 === 1 ? 'bg-surface-container-low/20' : ''}`}
                    >
                      <td className="px-stack-md py-3 font-data-tabular font-bold text-xs text-primary">
                        #{s.sessionCode}
                      </td>
                      <td className="px-stack-md py-3 text-xs text-secondary">
                        <p className="font-medium text-on-surface">{s.date}</p>
                        <p className="text-[11px]">{s.time}</p>
                      </td>
                      <td className="px-stack-md py-3 text-xs font-semibold text-on-surface">
                        {s.mentorName}
                      </td>
                      <td className="px-stack-md py-3 text-xs text-on-surface">
                        {s.studentName}
                      </td>
                      <td className="px-stack-md py-3 text-xs max-w-xs">
                        <p className="font-medium text-on-surface truncate">{s.topic}</p>
                        {s.notes && <p className="text-secondary text-[11px] truncate">{s.notes}</p>}
                      </td>
                      <td className="px-stack-md py-3 font-data-tabular text-xs font-semibold text-primary">
                        {s.durationHours}h
                      </td>
                      <td className="px-stack-md py-3">
                        <div className="flex items-center gap-2">
                          {s.studentAttendance === 'Attended' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                              <span className="material-symbols-outlined text-[13px]">check_circle</span>
                              <span>Attended (+{s.hoursCredited || s.durationHours}h)</span>
                            </span>
                          ) : s.studentAttendance === 'Absent' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/30">
                              <span className="material-symbols-outlined text-[13px]">cancel</span>
                              <span>Absent</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                              <span className="material-symbols-outlined text-[13px]">schedule</span>
                              <span>Pending</span>
                            </span>
                          )}

                          {/* Quick Attendance Check/Absent buttons */}
                          <div className="flex items-center gap-1">
                            {s.studentAttendance !== 'Attended' && (
                              <button
                                onClick={() => markSessionAttendance(s.id, 'Attended', s.durationHours)}
                                title="Mark Attended & Credit Hours"
                                className="p-1 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 transition-colors cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-[14px]">done</span>
                              </button>
                            )}
                            {s.studentAttendance !== 'Absent' && (
                              <button
                                onClick={() => markSessionAttendance(s.id, 'Absent', 0)}
                                title="Mark Absent"
                                className="p-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 transition-colors cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-[14px]">close</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-stack-md py-3 text-xs text-secondary font-medium">
                        <span className="text-[11px] font-bold text-[#166534] bg-[#dcfce7] px-2 py-0.5 rounded">
                          Covered (37% Share)
                        </span>
                      </td>
                      <td className="px-stack-md py-3">
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#dcfce7] text-[#166534] uppercase tracking-wider">
                          {s.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Tab 3: Student Performance & Welfare Reports Ledger */}
        {activeTab === 'reports' && (
          <div className="overflow-x-auto">
            {filteredReports.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center justify-center space-y-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-[28px]">assessment</span>
                </div>
                <div className="max-w-sm space-y-1">
                  <h3 className="font-bold text-sm text-on-surface">No Student Evaluations Filed</h3>
                  <p className="text-xs text-secondary">
                    Faculty mentors submit formal student performance evaluations and welfare observations directly to Admissions and Executive Leadership.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => openModal('submit-performance-report')}
                    className="px-4 h-9 rounded-lg bg-primary text-on-primary text-xs font-bold hover:bg-primary/90 flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <span className="material-symbols-outlined text-[16px]">add_circle</span>
                    <span>+ File Student Evaluation</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedStudentForWelfare(null);
                      setIsWelfareModalOpen(true);
                    }}
                    className="px-4 h-9 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <span className="material-symbols-outlined text-[16px]">emergency_home</span>
                    <span>🚨 Flag At-Risk Mentee</span>
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="p-3 bg-surface-container-low border-b border-outline-variant flex items-center justify-between flex-wrap gap-2">
                  <span className="text-xs font-semibold text-secondary">
                    Formal faculty evaluations &amp; early-warning welfare ledger
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => openModal('submit-performance-report')}
                      className="px-3 h-8 rounded-lg bg-primary text-on-primary text-xs font-bold hover:bg-primary/90 flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <span className="material-symbols-outlined text-[15px]">add_circle</span>
                      <span>+ File Evaluation</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedStudentForWelfare(null);
                        setIsWelfareModalOpen(true);
                      }}
                      className="px-3 h-8 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <span className="material-symbols-outlined text-[15px]">emergency_home</span>
                      <span>🚨 Flag At-Risk Mentee</span>
                    </button>
                  </div>
                </div>

                <table className="w-full text-left border-collapse min-w-[950px] text-xs">
                  <thead>
                  <tr className="border-b border-outline-variant bg-surface-container-low text-secondary font-label-md">
                    <th className="px-stack-md py-3 font-semibold">Report Code</th>
                    <th className="px-stack-md py-3 font-semibold">Student &amp; Program</th>
                    <th className="px-stack-md py-3 font-semibold">Faculty Evaluator</th>
                    <th className="px-stack-md py-3 font-semibold">Performance Meter</th>
                    <th className="px-stack-md py-3 font-semibold">Attendance &amp; Engagement</th>
                    <th className="px-stack-md py-3 font-semibold">Welfare Observations</th>
                    <th className="px-stack-md py-3 font-semibold">Recommendations</th>
                    <th className="px-stack-md py-3 font-semibold">Management Follow-Up</th>
                  </tr>
                </thead>
                <tbody className="font-data-tabular text-on-surface divide-y divide-outline-variant/60">
                  {filteredReports.map((r, index) => (
                    <tr
                      key={r.id}
                      className={`hover:bg-surface-bright transition-colors ${index % 2 === 1 ? 'bg-surface-container-low/20' : ''}`}
                    >
                      <td className="px-stack-md py-3 font-mono font-bold text-xs text-primary">
                        <p>{r.reportCode}</p>
                        <p className="text-[10px] text-secondary font-sans">
                          {new Date(r.submittedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </td>
                      <td className="px-stack-md py-3 text-xs">
                        <p className="font-bold text-on-surface">{r.studentName}</p>
                        <p className="text-secondary text-[11px]">{r.program}</p>
                      </td>
                      <td className="px-stack-md py-3 text-xs font-semibold text-on-surface">
                        {r.mentorName}
                      </td>
                      <td className="px-stack-md py-3 min-w-[140px]">
                        <PerformanceMeter score={r.performanceScore} tier={r.performanceTier} size="sm" showBar={true} />
                      </td>
                      <td className="px-stack-md py-3 text-xs">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                          r.attendanceRating === 'Consistent'
                            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                            : r.attendanceRating === 'Irregular'
                            ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300'
                            : 'bg-rose-500/10 text-rose-700 dark:text-rose-300'
                        }`}>
                          {r.attendanceRating}
                        </span>
                        <p className="text-secondary text-[11px] mt-0.5 truncate max-w-[120px]" title={r.technicalMasteryNotes}>
                          {r.technicalMasteryNotes}
                        </p>
                      </td>
                      <td className="px-stack-md py-3 text-xs max-w-xs">
                        <p className="text-secondary line-clamp-2" title={r.welfareObservations}>
                          {r.welfareObservations}
                        </p>
                      </td>
                      <td className="px-stack-md py-3 text-xs max-w-xs">
                        <p className="text-secondary line-clamp-2" title={r.recommendations}>
                          {r.recommendations}
                        </p>
                      </td>
                      <td className="px-stack-md py-3">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              r.managementFollowUpStatus === 'Resolved'
                                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                                : r.managementFollowUpStatus === 'In Progress'
                                ? 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/30'
                                : 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                            }`}
                          >
                            {r.managementFollowUpStatus}
                          </span>

                          {(isSuperAdmin || !isMentor) && (
                            <select
                              value={r.managementFollowUpStatus}
                              onChange={(e) => updateReportFollowUpStatus(r.id, e.target.value as any)}
                              className="text-[11px] h-6 px-1.5 rounded border border-outline-variant bg-surface text-on-surface outline-none cursor-pointer"
                              title="Update leadership follow-up status"
                            >
                              <option value="Pending Review">Pending</option>
                              <option value="In Progress">In Progress</option>
                              <option value="Resolved">Resolved</option>
                            </select>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              const s = students.find(st => st.id === r.studentId || st.name === r.studentName);
                              setSelectedStudentForWelfare(s || null);
                              setIsWelfareModalOpen(true);
                            }}
                            className="p-1 rounded text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Dispatch immediate welfare alert for this student"
                          >
                            <span className="material-symbols-outlined text-[16px]">emergency_home</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Class Timetable & Attendance */}
        {activeTab === 'timetable' && (
          <div className="p-stack-md space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-outline-variant/60 pb-3">
              <div>
                <h3 className="font-bold text-sm text-on-surface">
                  {isMentor ? 'My Scheduled Lectures & Class Attendance' : 'All Faculty Scheduled Classes & Attendance'}
                </h3>
                <p className="text-xs text-secondary mt-0.5">
                  Record student class attendance to log teaching hours toward your {settings.mentorMinimumLecturedHours || 20}-hour payout eligibility threshold.
                </p>
              </div>
              <Link
                to="/mentors/course-outlines"
                className="h-8 px-3 rounded bg-surface border border-outline-variant hover:border-primary text-on-surface text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <span className="material-symbols-outlined text-primary text-[16px]">account_tree</span>
                <span>View Course Outline</span>
              </Link>
            </div>

            {filteredTimetables.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center justify-center space-y-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-[28px]">calendar_month</span>
                </div>
                <div className="max-w-sm space-y-1">
                  <h3 className="font-bold text-sm text-on-surface">No Classes Scheduled</h3>
                  <p className="text-xs text-secondary">
                    {isMentor 
                      ? 'You have no timetable classes scheduled for your courses yet. The Program Officer schedules lecture slots.'
                      : 'No timetable classes match the active search or filters.'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredTimetables.map(slot => (
                  <div
                    key={slot.id}
                    className="p-4 rounded-xl bg-surface border border-outline-variant hover:border-primary/50 transition-all space-y-3 shadow-xs flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex justify-between items-start gap-2">
                        <span className="px-2 py-0.5 rounded bg-primary-container/30 text-primary text-[11px] font-bold">
                          {slot.dayOfWeek} • {slot.startTime} - {slot.endTime}
                        </span>
                        {slot.attendanceMarked ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            Attended ({(slot.attendanceRecords || []).filter(r => r.status === 'Attended').length})
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[10px] font-bold border border-amber-200">
                            Pending Attendance
                          </span>
                        )}
                      </div>

                      <div>
                        <h4 className="font-bold text-sm text-on-surface line-clamp-1">{slot.topic}</h4>
                        <p className="text-xs text-secondary mt-0.5">
                          {slot.courseTitle} • <span className="font-medium text-on-surface">{slot.cohortName}</span>
                        </p>
                      </div>

                      <div className="pt-2 border-t border-outline-variant/40 space-y-1 text-xs">
                        <div className="flex items-center gap-1.5 text-secondary">
                          <span className="material-symbols-outlined text-[15px] text-primary">person</span>
                          <span>Faculty: <strong className="text-on-surface">{slot.mentorName}</strong></span>
                        </div>

                        {slot.meetingLink ? (
                          <div className="flex items-center gap-1.5 text-secondary">
                            <span className="material-symbols-outlined text-[15px] text-primary">videocam</span>
                            <a
                              href={slot.meetingLink}
                              target="_blank"
                              rel="noreferrer"
                              className="text-primary hover:underline font-medium line-clamp-1"
                            >
                              Class Link
                            </a>
                          </div>
                        ) : slot.venue ? (
                          <div className="flex items-center gap-1.5 text-secondary">
                            <span className="material-symbols-outlined text-[15px] text-secondary">location_on</span>
                            <span className="line-clamp-1">{slot.venue}</span>
                          </div>
                        ) : null}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-outline-variant/60 flex items-center justify-between gap-2">
                      <button
                        onClick={() => {
                          setSelectedSlotForAttendance(slot);
                          openModal('take-attendance');
                        }}
                        className="h-8 px-3 rounded bg-primary text-on-primary hover:bg-primary/90 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs w-full justify-center"
                      >
                        <span className="material-symbols-outlined text-[15px]">how_to_reg</span>
                        <span>{slot.attendanceMarked ? 'Review / Update Attendance' : 'Take Class Attendance'}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 5: Faculty Commission Payout Requests */}
        {activeTab === 'payouts' && (
          <div className="p-stack-md space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-outline-variant/60 pb-3">
              <div>
                <h3 className="font-bold text-sm text-on-surface">
                  {isMentor ? 'My Commission Payout Requests' : 'Faculty Commission Payout Requests & Disbursements'}
                </h3>
                <p className="text-xs text-secondary mt-0.5">
                  {isMentor 
                    ? 'Track review and disbursement status of your 37% faculty commission withdrawals.'
                    : 'Review requests, verify minimum lecturing hours eligibility (20h), and disburse directly via Paystack.'}
                </p>
              </div>
              {isMentor && (
                <button
                  onClick={() => openModal('request-payout')}
                  className="h-8 px-3 rounded bg-primary text-on-primary hover:bg-primary/90 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <span className="material-symbols-outlined text-[16px]">add</span>
                  <span>+ New Payout Request</span>
                </button>
              )}
            </div>

            {accessiblePayoutRequests.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center justify-center space-y-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-[28px]">payments</span>
                </div>
                <div className="max-w-sm space-y-1">
                  <h3 className="font-bold text-sm text-on-surface">No Payout Requests</h3>
                  <p className="text-xs text-secondary">
                    {isMentor 
                      ? 'You have not submitted any payout requests yet. Once you fulfill 20 lecturing hours, click Request Payout.'
                      : 'No faculty payout requests have been submitted yet.'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto border border-outline-variant/60 rounded-xl bg-surface">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-outline-variant bg-surface-container-low text-[11px] font-bold text-secondary uppercase tracking-wider">
                      <th className="px-4 py-3">Voucher &amp; Date</th>
                      <th className="px-4 py-3">Faculty Mentor</th>
                      <th className="px-4 py-3">Lecturing Hours</th>
                      <th className="px-4 py-3">Settlement Bank</th>
                      <th className="px-4 py-3">Gross (₦)</th>
                      <th className="px-4 py-3">WHT 5% (₦)</th>
                      <th className="px-4 py-3">Net Disbursed (₦)</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Tax Slip &amp; Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/50 text-xs">
                    {accessiblePayoutRequests.map((req) => {
                      const isHoursEligible = req.lecturedHours >= req.minimumRequiredHours;
                      const whtVal = req.whtDeductedAmount ?? Math.round(req.amount * 0.05);
                      const netVal = req.netDisbursedAmount ?? (req.amount - whtVal);
                      const voucherCode = req.voucherNumber || `VCHR-CDL-${req.id.slice(-4)}`;

                      return (
                        <tr key={req.id} className="hover:bg-surface-container/50 transition-colors">
                          <td className="px-4 py-3 font-mono">
                            <span className="font-bold text-primary block">{voucherCode}</span>
                            <span className="text-[10px] text-secondary">
                              {new Date(req.requestedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-bold text-on-surface block">{req.mentorName}</span>
                            <span className="text-[11px] text-secondary">{req.mentorEmail}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                              isHoursEligible ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'
                            }`}>
                              {req.lecturedHours}h / {req.minimumRequiredHours}h
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-semibold text-on-surface block">{req.bankName}</span>
                            <span className="font-mono text-secondary text-[11px]">{req.accountNumber} ({req.accountName})</span>
                          </td>
                          <td className="px-4 py-3 font-bold font-mono text-on-surface text-xs">
                            {formatNaira(req.amount)}
                          </td>
                          <td className="px-4 py-3 font-bold font-mono text-rose-600 text-xs">
                            - {formatNaira(whtVal)}
                          </td>
                          <td className="px-4 py-3 font-bold font-mono text-emerald-700 dark:text-emerald-300 text-xs">
                            {formatNaira(netVal)}
                          </td>
                          <td className="px-4 py-3">
                            <CrispStatusBadge status={req.status} />
                            {req.disburseReference && (
                              <span className="block text-[9px] font-mono text-secondary mt-0.5 truncate max-w-[120px]" title={req.disburseReference}>
                                Ref: {req.disburseReference}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1.5 flex-wrap">
                              {/* Download / View WHT Voucher Slip */}
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedPayoutForVoucher(req);
                                  setIsVoucherModalOpen(true);
                                }}
                                className="px-2.5 py-1 rounded bg-surface border border-outline-variant hover:border-primary text-on-surface text-[11px] font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1"
                                title="View official remuneration voucher and WHT deduction slip"
                              >
                                <span className="material-symbols-outlined text-[14px] text-primary">receipt_long</span>
                                <span>WHT Slip</span>
                              </button>

                              {(isSuperAdmin || isFinance) && req.status === 'Pending' && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => reviewMentorPayout(req.id, 'Approved')}
                                    className="px-2 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 text-[11px] font-bold transition-colors cursor-pointer"
                                    title="Approve for payout"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const reason = window.prompt('Enter reason for rejecting this payout request:');
                                      if (reason !== null) {
                                        reviewMentorPayout(req.id, 'Rejected', reason);
                                      }
                                    }}
                                    className="px-2 py-1 rounded bg-rose-50 text-rose-700 hover:bg-rose-100 text-[11px] font-bold transition-colors cursor-pointer"
                                    title="Reject payout request"
                                  >
                                    Reject
                                  </button>
                                </>
                              )}

                              {(isSuperAdmin || isFinance) && (req.status === 'Pending' || req.status === 'Approved') && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const mentorObj = mentors.find(m => m.id === req.mentorId) || {
                                      id: req.mentorId,
                                      name: req.mentorName,
                                      email: req.mentorEmail,
                                      bankName: req.bankName,
                                      bankCode: req.bankCode,
                                      accountNumber: req.accountNumber,
                                      accountName: req.accountName,
                                      pendingPayout: req.amount,
                                      lecturedHours: req.lecturedHours,
                                      minimumRequiredHours: req.minimumRequiredHours,
                                      isAccountVerified: true,
                                      role: 'Faculty Mentor',
                                      department: 'Academics',
                                    };
                                    (mentorObj as any).payoutRequestId = req.id;
                                    setSelectedMentorForDisburse(mentorObj as any);
                                    openModal('disburse-mentor');
                                  }}
                                  className="px-2.5 py-1 rounded bg-primary text-on-primary hover:bg-primary/90 text-[11px] font-bold transition-colors shadow-xs cursor-pointer flex items-center gap-1"
                                  title="Disburse directly from institutional wallet via Paystack"
                                >
                                  <span className="material-symbols-outlined text-[13px]">payments</span>
                                  <span>Disburse</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* End of tabs */}
      </div>

      {/* Official Remuneration & WHT Tax Slip Modal */}
      <PayoutVoucherModal
        isOpen={isVoucherModalOpen}
        onClose={() => setIsVoucherModalOpen(false)}
        payoutRequest={selectedPayoutForVoucher}
      />

      {/* Student Early-Warning & At-Risk Welfare Intervention Modal */}
      <StudentWelfareInterventionModal
        isOpen={isWelfareModalOpen}
        onClose={() => setIsWelfareModalOpen(false)}
        targetStudent={selectedStudentForWelfare}
      />
    </div>
  );
};
