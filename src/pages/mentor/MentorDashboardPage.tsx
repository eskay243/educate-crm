import React, { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCRM, formatNaira } from '../../context/CRMContext';
import { CrispStatusBadge } from '../../components/common/CrispStatusBadge';

export const MentorDashboardPage: React.FC = () => {
  const {
    currentUser,
    mentors,
    students,
    sessions,
    timetables,
    assignments,
    openModal,
    setSelectedMentorForBookingId,
    calculateMentorTuitionCommission,
    isSuperAdmin,
    switchRole,
  } = useCRM();

  const navigate = useNavigate();

  // Find active mentor profile
  const myMentor = useMemo(() => {
    return (
      mentors.find(
        m => m.id === currentUser?.mentorId || m.name === currentUser?.name || m.email === currentUser?.email
      ) || mentors[0]
    );
  }, [mentors, currentUser]);

  // Students assigned directly to this mentor or in their assigned cohorts
  const assignedStudents = useMemo(() => {
    if (!myMentor) return [];
    const norm = (s?: string) => (s || '').trim().toLowerCase();
    const myName = norm(myMentor.name);
    return students.filter(
      s => (s.mentorId && s.mentorId === myMentor.id) || norm(s.mentorName) === myName
    );
  }, [students, myMentor]);

  // At risk students for welfare intervention
  const atRiskStudents = useMemo(() => {
    return assignedStudents.filter(
      s => s.attendanceRate < 75 || s.performanceTier === 'At Risk' || s.performanceTier === 'Needs Support'
    );
  }, [assignedStudents]);

  // Today's Date String
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Today's and upcoming cohort classes for this mentor
  const myTimetableClasses = useMemo(() => {
    if (!myMentor) return [];
    return timetables
      .filter(t => t.mentorId === myMentor.id || t.mentorName?.toLowerCase() === myMentor.name?.toLowerCase())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [timetables, myMentor]);

  // Today's classes
  const todayClasses = useMemo(() => {
    return myTimetableClasses.filter(t => t.date === todayStr);
  }, [myTimetableClasses, todayStr]);

  // 1-on-1 Sessions for this mentor
  const mySessions = useMemo(() => {
    if (!myMentor) return [];
    return sessions
      .filter(s => s.mentorId === myMentor.id || s.mentorName?.toLowerCase() === myMentor.name?.toLowerCase())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [sessions, myMentor]);

  const upcomingSessions = useMemo(() => {
    return mySessions.filter(s => s.status === 'Scheduled');
  }, [mySessions]);

  // Pending grading submissions for courses taught by this mentor
  const pendingGradingCount = useMemo(() => {
    return assignments.filter(a => a.status === 'Pending').length;
  }, [assignments]);

  // Calculate 37% Revenue Share with multi-mentor split
  const earningsMetrics = useMemo(() => {
    if (!myMentor) return { totalTuitionPool: 0, myAccruedCommission: 0, pendingPayout: 0, disbursedPayout: 0 };
    const result = calculateMentorTuitionCommission(myMentor.id);
    return {
      totalTuitionPool: result.totalTuitionPool,
      myAccruedCommission: result.totalCommission > 0 ? result.totalCommission : (myMentor.pendingPayout || 0),
      pendingPayout: myMentor.pendingPayout || 0,
      disbursedPayout: myMentor.paidPayout || 0,
    };
  }, [calculateMentorTuitionCommission, myMentor]);

  const handleBookSession = () => {
    setSelectedMentorForBookingId(myMentor?.id || null);
    openModal('book-session');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Super Admin Faculty Inspector & Switching Bar */}
      {isSuperAdmin && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-amber-700 dark:text-amber-400 text-[20px]">admin_panel_settings</span>
            <div>
              <p className="text-xs font-bold text-amber-900 dark:text-amber-200">
                Super Admin Faculty Inspector Mode
              </p>
              <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80">
                You are previewing the dedicated Faculty Portal. Toggle between instructors to inspect their active sessions, syllabus, and 37% payouts.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-[11px] font-semibold text-amber-900 dark:text-amber-200 whitespace-nowrap">Switch Mentor:</span>
            <select
              value={myMentor?.id || ''}
              onChange={(e) => {
                const targetId = e.target.value;
                if (targetId) {
                  switchRole('mentor', targetId);
                }
              }}
              className="w-full sm:w-auto text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 outline-none shadow-xs cursor-pointer"
            >
              {mentors.map(m => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.department || 'Faculty'})
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Faculty Hero Banner */}
      <div className="bg-gradient-to-r from-primary/10 via-surface to-surface-container-lowest border border-outline-variant rounded-2xl p-6 shadow-xs relative overflow-hidden">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="relative">
              <img
                src={myMentor?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                alt={myMentor?.name || 'Mentor'}
                className="w-16 h-16 rounded-2xl object-cover ring-2 ring-primary/20 shadow-sm"
              />
              <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-surface flex items-center justify-center text-white" title="Active Faculty">
                <span className="material-symbols-outlined text-[12px] font-bold">check</span>
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl md:text-2xl font-bold text-on-surface">
                  Welcome back, {myMentor?.name || 'Faculty Mentor'}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
                  {myMentor?.mentorCode || 'FACULTY'}
                </span>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[13px]">verified</span>
                  Tier 2 KYC Verified
                </span>
              </div>
              <p className="text-secondary text-xs md:text-sm mt-1">
                {myMentor?.department || 'Faculty Department'} • {myMentor?.position || 'Lead Instructor'} • Rating: {myMentor?.rating?.toFixed(1) || '4.9'} ★
              </p>
            </div>
          </div>

          {/* Quick Primary Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleBookSession}
              className="h-10 px-4 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-dark transition-all flex items-center gap-2 shadow-xs cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">calendar_add_on</span>
              <span>Log 1-on-1 Session</span>
            </button>
            <Link
              to="/mentor/grading"
              className="h-10 px-4 rounded-xl bg-surface border border-outline-variant hover:border-primary text-on-surface text-xs font-bold transition-all flex items-center gap-2 shadow-xs"
            >
              <span className="material-symbols-outlined text-[18px] text-primary">fact_check</span>
              <span>Grading Inbox ({pendingGradingCount})</span>
            </Link>
            <Link
              to="/mentor/payouts"
              className="h-10 px-4 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold transition-all flex items-center gap-2 shadow-xs"
            >
              <span className="material-symbols-outlined text-[18px]">payments</span>
              <span>Wallet: {formatNaira(earningsMetrics.myAccruedCommission)}</span>
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Overview Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link
          to="/mentor/students"
          className="bg-surface border border-outline-variant hover:border-primary rounded-xl p-4 transition-all shadow-xs group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-secondary">Assigned Learners</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-[18px]">school</span>
            </div>
          </div>
          <p className="text-2xl font-bold text-on-surface mt-2">{assignedStudents.length}</p>
          <div className="flex items-center gap-1.5 mt-1 text-[11px] text-secondary">
            <span className={`font-semibold ${atRiskStudents.length > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
              {atRiskStudents.length} {atRiskStudents.length === 1 ? 'needs attention' : 'need attention'}
            </span>
          </div>
        </Link>

        <Link
          to="/mentor/schedule"
          className="bg-surface border border-outline-variant hover:border-primary rounded-xl p-4 transition-all shadow-xs group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-secondary">Today's Engagements</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-[18px]">event</span>
            </div>
          </div>
          <p className="text-2xl font-bold text-on-surface mt-2">{todayClasses.length + upcomingSessions.length}</p>
          <div className="flex items-center gap-1.5 mt-1 text-[11px] text-secondary">
            <span>{todayClasses.length} Cohort Classes, {upcomingSessions.length} 1-on-1s</span>
          </div>
        </Link>

        <Link
          to="/mentor/grading"
          className="bg-surface border border-outline-variant hover:border-primary rounded-xl p-4 transition-all shadow-xs group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-secondary">Grading Inbox</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-[18px]">rule</span>
            </div>
          </div>
          <p className="text-2xl font-bold text-on-surface mt-2">{pendingGradingCount}</p>
          <div className="flex items-center gap-1.5 mt-1 text-[11px] text-secondary">
            <span className="text-amber-600 font-semibold">Submissions awaiting review</span>
          </div>
        </Link>

        <Link
          to="/mentor/payouts"
          className="bg-surface border border-outline-variant hover:border-primary rounded-xl p-4 transition-all shadow-xs group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-secondary">37% Rev-Share Accrued</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-[18px]">account_balance_wallet</span>
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-700 mt-2">{formatNaira(earningsMetrics.myAccruedCommission)}</p>
          <div className="flex items-center gap-1.5 mt-1 text-[11px] text-secondary">
            <span>Disbursed: {formatNaira(earningsMetrics.disbursedPayout)}</span>
          </div>
        </Link>
      </div>

      {/* Main Two-Column Hub: Teaching Agenda & Learner Care */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 cols): Today's Schedule & Classes */}
        <div className="lg:col-span-2 space-y-6">
          {/* Today's Teaching Schedule */}
          <div className="bg-surface border border-outline-variant rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[22px]">calendar_today</span>
                <h2 className="text-base font-bold text-on-surface">Today's Class & Session Schedule</h2>
              </div>
              <Link to="/mentor/schedule" className="text-xs text-primary font-bold hover:underline flex items-center gap-1">
                View Full Calendar
                <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </Link>
            </div>

            {todayClasses.length === 0 && upcomingSessions.length === 0 ? (
              <div className="text-center py-8 px-4 border border-dashed border-outline-variant rounded-xl bg-surface-container-lowest">
                <span className="material-symbols-outlined text-[36px] text-secondary/40">event_available</span>
                <p className="text-sm font-bold text-on-surface mt-2">No Scheduled Classes for Today</p>
                <p className="text-xs text-secondary mt-1">
                  You have no group lectures or 1-on-1 bookings today. Configure your office hours or plan curriculum modules.
                </p>
                <Link
                  to="/mentor/schedule"
                  className="inline-flex items-center gap-1.5 mt-4 px-3 py-1.5 rounded-lg bg-surface border border-outline-variant text-xs font-bold text-primary hover:bg-surface-container transition-all"
                >
                  <span className="material-symbols-outlined text-[15px]">settings</span>
                  Manage Office Hours Slots
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Cohort Lectures */}
                {todayClasses.map(slot => (
                  <div
                    key={slot.id}
                    className="p-4 rounded-xl border border-primary/20 bg-primary/5 flex flex-col sm:flex-row justify-between sm:items-center gap-3 transition-all hover:bg-primary/10"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-primary text-white">
                          Cohort Lecture
                        </span>
                        <span className="text-xs font-bold text-on-surface">{slot.courseTitle}</span>
                        <span className="text-xs text-secondary">({slot.cohortName})</span>
                      </div>
                      <p className="text-sm font-bold text-on-surface mt-1">{slot.topic}</p>
                      <div className="flex items-center gap-3 text-xs text-secondary mt-1">
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">schedule</span>
                          {slot.startTime} - {slot.endTime} ({slot.durationHours} hrs)
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">location_on</span>
                          {slot.venue}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {slot.meetingLink && (
                        <a
                          href={slot.meetingLink}
                          target="_blank"
                          rel="noreferrer"
                          className="h-8 px-3 rounded-lg bg-primary text-white text-xs font-bold flex items-center gap-1.5 hover:bg-primary-dark transition-all shadow-xs"
                        >
                          <span className="material-symbols-outlined text-[15px]">videocam</span>
                          Join Class
                        </a>
                      )}
                      <Link
                        to="/mentor/schedule"
                        className="h-8 px-3 rounded-lg bg-surface border border-outline-variant hover:border-primary text-xs font-bold text-on-surface flex items-center gap-1 transition-all"
                      >
                        <span className="material-symbols-outlined text-[15px]">fact_check</span>
                        Attendance
                      </Link>
                    </div>
                  </div>
                ))}

                {/* 1-on-1 Sessions */}
                {upcomingSessions.map(sess => (
                  <div
                    key={sess.id}
                    className="p-4 rounded-xl border border-outline-variant bg-surface flex flex-col sm:flex-row justify-between sm:items-center gap-3 transition-all hover:border-primary/40"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-100 text-blue-800">
                          1-on-1 Coaching
                        </span>
                        <span className="text-xs font-bold text-on-surface">{sess.studentName}</span>
                      </div>
                      <p className="text-sm font-bold text-on-surface mt-1">{sess.topic}</p>
                      <div className="flex items-center gap-3 text-xs text-secondary mt-1">
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">event</span>
                          {sess.date} at {sess.time}
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">timer</span>
                          {sess.durationHours} hr
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {sess.meetingLink && (
                        <a
                          href={sess.meetingLink}
                          target="_blank"
                          rel="noreferrer"
                          className="h-8 px-3 rounded-lg bg-primary text-white text-xs font-bold flex items-center gap-1.5 hover:bg-primary-dark transition-all shadow-xs"
                        >
                          <span className="material-symbols-outlined text-[15px]">videocam</span>
                          Join Call
                        </a>
                      )}
                      <button
                        onClick={() => navigate(`/mentor/schedule`)}
                        className="h-8 px-3 rounded-lg bg-surface border border-outline-variant hover:border-primary text-xs font-bold text-on-surface flex items-center gap-1 transition-all cursor-pointer"
                      >
                        Mark Attendance
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Curriculum & Teaching Tools Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link
              to="/mentor/curriculum"
              className="p-5 rounded-2xl bg-surface border border-outline-variant hover:border-primary transition-all shadow-xs group flex items-start gap-4"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <span className="material-symbols-outlined text-[22px]">auto_stories</span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-on-surface group-hover:text-primary transition-colors">
                  Course Outlines & Syllabi
                </h3>
                <p className="text-xs text-secondary mt-1">
                  Access official curriculum documents, download course slides, and upload classroom resources.
                </p>
              </div>
            </Link>

            <Link
              to="/mentor/profile"
              className="p-5 rounded-2xl bg-surface border border-outline-variant hover:border-primary transition-all shadow-xs group flex items-start gap-4"
            >
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <span className="material-symbols-outlined text-[22px]">badge</span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-on-surface group-hover:text-purple-700 transition-colors">
                  Faculty 360° Dossier
                </h3>
                <p className="text-xs text-secondary mt-1">
                  View your complete academic personnel file, Tier 1/2/3 KYC records, leave history, and assets.
                </p>
              </div>
            </Link>
          </div>
        </div>

        {/* Right Column (1 col): Student Welfare & Quick Actions */}
        <div className="space-y-6">
          {/* At-Risk Learner Alerts */}
          <div className="bg-surface border border-outline-variant rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-600 text-[20px]">warning</span>
                <h2 className="text-sm font-bold text-on-surface">Learner Welfare Watch</h2>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                {atRiskStudents.length} Flagged
              </span>
            </div>

            {atRiskStudents.length === 0 ? (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
                <span className="material-symbols-outlined text-emerald-600 text-[24px]">verified</span>
                <p className="text-xs font-bold text-emerald-900 mt-1">All Assigned Learners On Track</p>
                <p className="text-[11px] text-emerald-700 mt-0.5">Average attendance across your cohort is exceeding targets.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {atRiskStudents.slice(0, 4).map(student => (
                  <div
                    key={student.id}
                    className="p-3 rounded-xl border border-outline-variant bg-surface-container-lowest flex items-center justify-between gap-3"
                  >
                    <div>
                      <p className="text-xs font-bold text-on-surface">{student.name}</p>
                      <p className="text-[11px] text-secondary">{student.program}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800">
                          {student.attendanceRate}% Attendance
                        </span>
                        {student.performanceTier && (
                          <span className="text-[10px] text-secondary">
                            Tier: {student.performanceTier}
                          </span>
                        )}
                      </div>
                    </div>
                    <Link
                      to={`/mentor/students?studentId=${student.id}`}
                      className="px-2.5 py-1 rounded bg-surface border border-outline-variant hover:border-primary text-xs font-bold text-primary transition-all shrink-0"
                    >
                      Care
                    </Link>
                  </div>
                ))}

                <Link
                  to="/mentor/students"
                  className="block text-center text-xs font-bold text-primary hover:underline pt-2"
                >
                  View All Learners & Welfare Cases
                </Link>
              </div>
            )}
          </div>

          {/* Quick Payout Status Card */}
          <div className="bg-surface border border-outline-variant rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-secondary uppercase tracking-wider">37% Rev-Share Status</span>
              <CrispStatusBadge status="active" />
            </div>
            <p className="text-2xl font-bold text-on-surface">{formatNaira(earningsMetrics.myAccruedCommission)}</p>
            <p className="text-xs text-secondary mt-1">
              Calculated from enrolled student tuition fees and your assigned course share.
            </p>

            <div className="mt-4 pt-4 border-t border-outline-variant space-y-2 text-xs">
              <div className="flex justify-between text-secondary">
                <span>Tuition Pool Monitored:</span>
                <span className="font-semibold text-on-surface">{formatNaira(earningsMetrics.totalTuitionPool)}</span>
              </div>
              <div className="flex justify-between text-secondary">
                <span>Total Disbursed to Date:</span>
                <span className="font-semibold text-emerald-700">{formatNaira(earningsMetrics.disbursedPayout)}</span>
              </div>
            </div>

            <Link
              to="/mentor/payouts"
              className="mt-4 w-full h-9 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-xs"
            >
              <span className="material-symbols-outlined text-[16px]">account_balance</span>
              <span>Open Payouts Hub</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
