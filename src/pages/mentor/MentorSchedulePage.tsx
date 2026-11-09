import React, { useState, useMemo } from 'react';
import { useCRM } from '../../context/CRMContext';
import { MentorAvailabilityManager } from '../../components/mentors/MentorAvailabilityManager';

export const MentorSchedulePage: React.FC = () => {
  const {
    currentUser,
    mentors,
    timetables,
    sessions,
    markSessionAttendance,
    openModal,
    setSelectedMentorForBookingId,
    showToast,
  } = useCRM();

  // Find active mentor profile
  const myMentor = useMemo(() => {
    return (
      mentors.find(
        m => m.id === currentUser?.mentorId || m.name === currentUser?.name || m.email === currentUser?.email
      ) || mentors[0]
    );
  }, [mentors, currentUser]);

  const [activeTab, setActiveTab] = useState<'all' | 'classes' | 'sessions' | 'availability'>('all');
  const [filterDate, setFilterDate] = useState<string>('');

  // Mentor's timetable classes
  const myTimetableClasses = useMemo(() => {
    if (!myMentor) return [];
    return timetables
      .filter(t => t.mentorId === myMentor.id || t.mentorName?.toLowerCase() === myMentor.name?.toLowerCase())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [timetables, myMentor]);

  // Mentor's 1-on-1 sessions
  const my1on1Sessions = useMemo(() => {
    if (!myMentor) return [];
    return sessions
      .filter(s => s.mentorId === myMentor.id || s.mentorName?.toLowerCase() === myMentor.name?.toLowerCase())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [sessions, myMentor]);

  // Combined timeline items
  const combinedTimeline = useMemo(() => {
    const classItems = myTimetableClasses.map(c => ({
      id: c.id,
      type: 'cohort_class' as const,
      title: c.topic,
      subtitle: `${c.courseTitle} • ${c.cohortName}`,
      date: c.date,
      time: `${c.startTime} - ${c.endTime}`,
      duration: c.durationHours,
      venue: c.venue,
      meetingLink: c.meetingLink,
      status: c.status,
      attendanceMarked: c.attendanceMarked,
      rawItem: c,
    }));

    const sessionItems = my1on1Sessions.map(s => ({
      id: s.id,
      type: '1on1_session' as const,
      title: s.topic,
      subtitle: `1-on-1 Coaching with ${s.studentName}`,
      date: s.date,
      time: s.time,
      duration: s.durationHours,
      venue: s.locationType || 'Online Video Meeting',
      meetingLink: s.meetingLink,
      status: s.status,
      attendanceMarked: s.studentAttendance === 'Attended',
      studentAttendance: s.studentAttendance,
      rawItem: s,
    }));

    return [...classItems, ...sessionItems].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }, [myTimetableClasses, my1on1Sessions]);

  // Filtered timeline
  const filteredTimeline = useMemo(() => {
    return combinedTimeline.filter(item => {
      const matchType =
        activeTab === 'all'
          ? true
          : activeTab === 'classes'
          ? item.type === 'cohort_class'
          : activeTab === 'sessions'
          ? item.type === '1on1_session'
          : true;

      const matchDate = filterDate ? item.date === filterDate : true;

      return matchType && matchDate;
    });
  }, [combinedTimeline, activeTab, filterDate]);

  // Quick stats
  const activeOfficeHoursCount = useMemo(() => {
    return myMentor?.officeHours?.filter(s => s.isActive).length || 0;
  }, [myMentor]);

  const upcomingCount = useMemo(() => {
    return combinedTimeline.filter(i => i.status === 'Scheduled').length;
  }, [combinedTimeline]);

  // Handlers
  const handleMark1on1Attendance = async (sessionId: string, attended: boolean) => {
    try {
      await markSessionAttendance(sessionId, attended ? 'Attended' : 'Absent');
      showToast('Attendance Recorded', `Session marked as ${attended ? 'Attended' : 'Absent'}.`, 'success');
    } catch {
      showToast('Error', 'Failed to update attendance.', 'error');
    }
  };

  const handleBookSession = () => {
    setSelectedMentorForBookingId(myMentor?.id || null);
    openModal('book-session');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Faculty Schedule &amp; Office Hours</h1>
          <p className="text-secondary text-xs md:text-sm mt-0.5">
            Manage your cohort lectures, 1-on-1 coaching sessions, student attendance, and weekly office hours availability.
          </p>
        </div>

        {/* Quick Action Trays */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="h-10 px-3.5 rounded-xl bg-surface border border-outline-variant text-xs font-semibold text-secondary flex items-center gap-1.5 shadow-xs">
            <span className="material-symbols-outlined text-[16px] text-primary">event_upcoming</span>
            <span>{upcomingCount} Upcoming</span>
          </span>
          <button
            onClick={handleBookSession}
            className="h-10 px-4 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-dark transition-all flex items-center gap-2 shadow-xs cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">calendar_add_on</span>
            <span>Schedule 1-on-1</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 border-b border-outline-variant pb-2">
        <div className="flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'all'
                ? 'bg-primary text-white shadow-xs'
                : 'text-secondary hover:text-on-surface hover:bg-surface-container'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">calendar_month</span>
            <span>All Engagements ({combinedTimeline.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('classes')}
            className={`px-3 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'classes'
                ? 'bg-primary text-white shadow-xs'
                : 'text-secondary hover:text-on-surface hover:bg-surface-container'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">menu_book</span>
            <span>Cohort Lectures ({myTimetableClasses.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('sessions')}
            className={`px-3 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'sessions'
                ? 'bg-primary text-white shadow-xs'
                : 'text-secondary hover:text-on-surface hover:bg-surface-container'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">support_agent</span>
            <span>1-on-1 Sessions ({my1on1Sessions.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('availability')}
            className={`px-3 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'availability'
                ? 'bg-primary text-white shadow-xs'
                : 'text-secondary hover:text-on-surface hover:bg-surface-container'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">schedule</span>
            <span>Office Hours Settings ({activeOfficeHoursCount} Active)</span>
          </button>
        </div>

        {/* Date Filter */}
        {activeTab !== 'availability' && (
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={filterDate}
              onChange={e => setFilterDate(e.target.value)}
              className="h-9 px-3 rounded-lg bg-surface border border-outline-variant text-xs text-on-surface focus:outline-none focus:border-primary"
            />
            {filterDate && (
              <button
                onClick={() => setFilterDate('')}
                className="h-9 px-2 text-xs text-secondary hover:text-on-surface font-semibold"
              >
                Clear
              </button>
            )}
          </div>
        )}
      </div>

      {/* Main View Area */}
      {activeTab === 'availability' ? (
        <div className="bg-surface border border-outline-variant rounded-2xl overflow-hidden shadow-xs">
          <MentorAvailabilityManager
            mentors={myMentor ? [myMentor] : []}
            targetMentor={myMentor}
            isMentor={true}
            isSuperAdmin={false}
          />
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTimeline.length === 0 ? (
            <div className="text-center py-12 px-4 border border-dashed border-outline-variant rounded-2xl bg-surface">
              <span className="material-symbols-outlined text-[40px] text-secondary/40">event_busy</span>
              <p className="text-base font-bold text-on-surface mt-2">No Engagements Found</p>
              <p className="text-xs text-secondary mt-1">
                {filterDate ? 'No sessions scheduled for this specific date.' : 'You have no scheduled lectures or coaching sessions.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTimeline.map(item => (
                <div
                  key={`${item.type}-${item.id}`}
                  className="bg-surface border border-outline-variant rounded-2xl p-5 shadow-xs flex flex-col md:flex-row justify-between md:items-center gap-4 transition-all hover:border-primary/40"
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                        item.type === 'cohort_class' ? 'bg-primary/10 text-primary' : 'bg-blue-50 text-blue-700'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[24px]">
                        {item.type === 'cohort_class' ? 'school' : 'support_agent'}
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            item.type === 'cohort_class'
                              ? 'bg-primary/10 text-primary border border-primary/20'
                              : 'bg-blue-50 text-blue-800 border border-blue-200'
                          }`}
                        >
                          {item.type === 'cohort_class' ? 'Cohort Lecture' : '1-on-1 Coaching'}
                        </span>
                        <span className="text-xs font-semibold text-secondary">{item.subtitle}</span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            item.status === 'Completed'
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : item.status === 'Cancelled'
                              ? 'bg-rose-50 text-rose-800 border border-rose-200'
                              : 'bg-blue-50 text-blue-800 border border-blue-200'
                          }`}
                        >
                          {item.status}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-on-surface mt-1">{item.title}</h3>

                      <div className="flex items-center gap-4 text-xs text-secondary mt-1.5 flex-wrap">
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[15px]">calendar_today</span>
                          {item.date}
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[15px]">schedule</span>
                          {item.time} ({item.duration}h)
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[15px]">location_on</span>
                          {item.venue}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions & Attendance */}
                  <div className="flex items-center gap-2 flex-wrap shrink-0">
                    {item.meetingLink && (
                      <a
                        href={item.meetingLink}
                        target="_blank"
                        rel="noreferrer"
                        className="h-9 px-3.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-dark transition-all flex items-center gap-1.5 shadow-xs"
                      >
                        <span className="material-symbols-outlined text-[16px]">videocam</span>
                        <span>Join Link</span>
                      </a>
                    )}

                    {item.type === '1on1_session' && (
                      <div className="flex items-center gap-1 bg-surface-container-lowest p-1 rounded-xl border border-outline-variant">
                        <button
                          onClick={() => handleMark1on1Attendance(item.id, true)}
                          className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                            item.studentAttendance === 'Attended'
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'text-secondary hover:text-emerald-700'
                          }`}
                        >
                          Attended
                        </button>
                        <button
                          onClick={() => handleMark1on1Attendance(item.id, false)}
                          className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                            item.studentAttendance === 'Absent'
                              ? 'bg-rose-600 text-white shadow-xs'
                              : 'text-secondary hover:text-rose-700'
                          }`}
                        >
                          Absent
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
