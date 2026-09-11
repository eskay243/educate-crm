import React, { useState, useMemo } from 'react';
import { useCRM, formatNaira } from '../context/CRMContext';
import { MentorStatus } from '../types/crm';
import { PerformanceMeter } from '../components/common/PerformanceMeter';

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
    showToast
  } = useCRM();

  const [activeTab, setActiveTab] = useState<'roster' | 'sessions' | 'reports'>('roster');
  const [tableSearch, setTableSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('All');

  const effectiveSearch = globalSearch || tableSearch;
  const isMentor = currentUser?.role === 'mentor';
  const isSuperAdmin = currentUser?.role === 'super_admin';
  const isFinance = currentUser?.role === 'finance';

  // Find current mentor profile if logged in as mentor
  const myMentorProfile = mentors.find(
    m => m.id === currentUser?.mentorId || m.name === currentUser?.name || m.email === currentUser?.email
  ) || mentors[0];

  // Mentors are only allowed to see mentors that they share a course, student, or department with
  const accessibleMentors = useMemo(() => {
    if (!isMentor) return mentors;

    // Get courses taught by this mentor or programs taken by their students
    const myStudents = students.filter(s => s.mentorId === myMentorProfile?.id || s.mentorName === myMentorProfile?.name);
    const myStudentPrograms = new Set(myStudents.map(s => s.program));
    const myCourses = courses.filter(c => c.leadInstructor === myMentorProfile?.name || myStudentPrograms.has(c.title));
    const sharedInstructors = new Set(myCourses.map(c => c.leadInstructor));

    return mentors.filter(m => {
      // 1. The mentor themselves
      if (m.id === myMentorProfile?.id) return true;
      // 2. Mentors in the same department
      if (m.department === myMentorProfile?.department) return true;
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
          <button
            onClick={() => {
              setSelectedMentorForBookingId(isMentor ? myMentorProfile?.id : null);
              openModal('book-session');
            }}
            className="h-10 px-4 bg-secondary-container text-primary rounded font-label-md text-label-md font-bold hover:bg-surface-container-high transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">calendar_month</span>
            <span>+ Log 1-on-1 Session</span>
          </button>
          <button
            onClick={() => openModal('submit-performance-report')}
            className="h-10 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-label-md text-label-md font-bold transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">assessment</span>
            <span>+ File Evaluation Report</span>
          </button>
          {isSuperAdmin && (
            <button
              onClick={() => openModal('recruit-mentor')}
              className="h-10 px-4 bg-primary text-on-primary rounded font-label-md text-label-md font-bold hover:bg-primary/90 transition-colors shadow-xs flex items-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">person_add</span>
              <span>Recruit Faculty Mentor</span>
            </button>
          )}
        </div>
      </div>

      {/* 3 Bento Summary Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
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
            <div className="w-10 h-10 rounded bg-surface-container flex items-center justify-center text-on-surface">
              <span className="material-symbols-outlined">account_balance_wallet</span>
            </div>
            <span className="text-xs font-bold text-secondary bg-surface-container-high px-2 py-1 rounded">37% Share (₦)</span>
          </div>
          <p className="font-body-sm text-body-sm text-secondary mb-unit">
            {isMentor ? 'My Pending Tuition Share' : 'Pending Tuition Share (37%)'}
          </p>
          <h3 className="font-display text-display font-bold text-on-surface">
            {formatNaira(pendingTuitionShareTotal)}
          </h3>
        </div>
      </div>

      {/* Main Container with Tabs */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-lg overflow-hidden shadow-xs">
        {/* Navigation Tabs & Search Controls */}
        <div className="p-stack-md border-b border-outline-variant flex justify-between items-center bg-surface-bright flex-wrap gap-4">
          <div className="flex border border-outline-variant rounded p-1 bg-surface">
            <button
              onClick={() => setActiveTab('roster')}
              className={`px-4 py-1.5 rounded text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'roster'
                  ? 'bg-primary text-on-primary shadow-xs'
                  : 'text-secondary hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">groups</span>
              <span>{isMentor ? 'Co-Faculty Roster' : 'Faculty Roster'} ({filteredMentors.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('sessions')}
              className={`px-4 py-1.5 rounded text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'sessions'
                  ? 'bg-primary text-on-primary shadow-xs'
                  : 'text-secondary hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">calendar_month</span>
              <span>{isMentor ? 'My 1-on-1 Sessions' : 'Sessions Log'} ({filteredSessions.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`px-4 py-1.5 rounded text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'reports'
                  ? 'bg-primary text-on-primary shadow-xs'
                  : 'text-secondary hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">assessment</span>
              <span>Student Evaluations &amp; Welfare ({filteredReports.length})</span>
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
                      <th className="px-stack-md py-3 font-semibold">Mentees / Cap</th>
                      <th className="px-stack-md py-3 font-semibold">Commission Agreement</th>
                      <th className="px-stack-md py-3 font-semibold">Pending Share (₦)</th>
                      <th className="px-stack-md py-3 font-semibold">Status</th>
                      <th className="px-stack-md py-3 text-right font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="font-data-tabular text-on-surface divide-y divide-outline-variant">
                    {filteredMentors.map((mentor, index) => {
                      const isSelf = mentor.id === myMentorProfile?.id;
                      const canViewFinancials = !isMentor || isSelf;

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
                                  {mentor.email} {mentor.bankName ? `• ${mentor.bankName} (${mentor.accountNumber || 'N/A'})` : ''}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-stack-md py-3 font-medium text-on-surface">
                            {mentor.department}
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
                              <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                                mentor.status === 'Active' ? 'bg-[#dcfce7] text-[#166534]' : 'bg-surface-container text-secondary'
                              }`}>
                                {mentor.status}
                              </span>
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
                                <button 
                                  onClick={() => {
                                    if (!mentor.isAccountVerified) {
                                      showToast('Verification Notice', `${mentor.name}'s bank account is not verified yet. Please verify in Edit Profile before final settlement.`, 'warning');
                                    } else {
                                      showToast('Disbursement Initiated', `NIBSS electronic settlement of ${formatNaira(mentor.pendingPayout)} queued for ${mentor.name} (${mentor.bankName} - ${mentor.accountNumber}).`, 'success');
                                    }
                                  }}
                                  className={`px-2.5 py-1 rounded text-white font-sans text-xs font-semibold shadow-xs transition-colors flex items-center gap-1 cursor-pointer ${
                                    mentor.isAccountVerified ? 'bg-[#166534] hover:bg-[#15803d]' : 'bg-amber-600 hover:bg-amber-700'
                                  }`}
                                  title={mentor.isAccountVerified ? "Disburse 37% Commission Share via NIBSS" : "Account Unverified - Check details before disbursement"}
                                >
                                  <span className="material-symbols-outlined text-[14px]">send_money</span>
                                  <span>{mentor.isAccountVerified ? 'Disburse Share' : 'Verify & Disburse'}</span>
                                </button>
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
                <button
                  onClick={() => openModal('submit-performance-report')}
                  className="px-4 h-9 rounded-lg bg-primary text-on-primary text-xs font-bold hover:bg-primary/90 flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <span className="material-symbols-outlined text-[16px]">add_circle</span>
                  <span>+ File Student Evaluation</span>
                </button>
              </div>
            ) : (
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
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
