import React, { useState, useMemo } from 'react';
import { useCRM, formatNaira } from '../context/CRMContext';
import { MentorStatus } from '../types/crm';

export const MentorManagementPage: React.FC = () => {
  const { 
    mentors, 
    sessions, 
    students,
    courses,
    updateMentorStatus, 
    openModal, 
    globalSearch, 
    setSelectedMentorForBookingId,
    setSelectedMentorForEditId,
    currentUser,
    showToast
  } = useCRM();

  const [activeTab, setActiveTab] = useState<'roster' | 'sessions'>('roster');
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

  const departments = ['All', 'Software Engineering', 'Data & AI', 'Design Systems', 'Backend & Cloud', 'Frontend', 'Product'];

  // Metrics
  const totalSessionsLogged = isMentor ? accessibleSessions.length : sessions.length;
  const totalHoursLogged = isMentor 
    ? accessibleSessions.reduce((acc, s) => acc + s.durationHours, 0)
    : sessions.reduce((acc, s) => acc + s.durationHours, 0);

  const pendingHonorariumTotal = isMentor 
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
              Faculty Discretion Active: You can only view co-faculty in your academic department/shared tracks. Other mentors' rates &amp; earnings are confidential.
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
              ? 'Log 1-on-1 student coaching hours, view shared faculty curriculum, and track personal honorarium in ₦.'
              : 'Manage instructor capacity, 1-on-1 student coaching hours, and Nigerian honorarium payouts.'}
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
            <span className="text-xs font-bold text-secondary bg-surface-container-high px-2 py-1 rounded">Settlement (₦)</span>
          </div>
          <p className="font-body-sm text-body-sm text-secondary mb-unit">
            {isMentor ? 'My Pending Honorarium' : 'Pending Faculty Honorariums'}
          </p>
          <h3 className="font-display text-display font-bold text-on-surface">
            {formatNaira(pendingHonorariumTotal)}
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
              <span>{isMentor ? 'My 1-on-1 Sessions Log' : '1-on-1 Mentorship Sessions Log'} ({filteredSessions.length})</span>
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
                      <th className="px-stack-md py-3 font-semibold">Honorarium Rate (₦)</th>
                      <th className="px-stack-md py-3 font-semibold">Pending Honorarium (₦)</th>
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
                                <p className="font-bold text-on-surface text-sm">{mentor.name}</p>
                                <p className="text-secondary text-[11px]">{mentor.email}</p>
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
                            {canViewFinancials ? `${formatNaira(mentor.hourlyRate)}/hr` : 'Confidential'}
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
                                    showToast('Disbursement Initiated', `NIBSS electronic settlement of ${formatNaira(mentor.pendingPayout)} queued for ${mentor.name}.`, 'success');
                                  }}
                                  className="px-2.5 py-1 rounded bg-secondary-container text-primary font-sans text-xs font-bold hover:bg-secondary-container/80 transition-colors cursor-pointer"
                                  title="Process Payout"
                                >
                                  Disburse
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
                    Log completed 1-on-1 student technical mentoring hours to automatically calculate honorariums.
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
              <table className="w-full text-left border-collapse min-w-[750px] text-xs">
                <thead>
                  <tr className="border-b border-outline-variant bg-surface-container-low text-secondary font-label-md">
                    <th className="px-stack-md py-3 font-semibold">Session Code</th>
                    <th className="px-stack-md py-3 font-semibold">Date &amp; Time Slot</th>
                    <th className="px-stack-md py-3 font-semibold">Faculty Mentor</th>
                    <th className="px-stack-md py-3 font-semibold">Student Mentee</th>
                    <th className="px-stack-md py-3 font-semibold">Topic &amp; Review Focus</th>
                    <th className="px-stack-md py-3 font-semibold">Duration</th>
                    <th className="px-stack-md py-3 font-semibold">Honorarium (₦)</th>
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
                      <td className="px-stack-md py-3 font-bold text-xs text-on-surface font-data-tabular">
                        {formatNaira(s.compensationAmount)}
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
      </div>
    </div>
  );
};
