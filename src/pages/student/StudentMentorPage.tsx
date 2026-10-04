import React, { useState, useMemo } from 'react';
import { useCRM } from '../../context/CRMContext';

export const StudentMentorPage: React.FC = () => {
  const { 
    currentStudentProfile, 
    mentors, 
    sessions, 
    bookSession, 
    showToast 
  } = useCRM();

  const student = currentStudentProfile || {
    id: 'stu-demo',
    name: 'Scholar Student',
    mentorName: 'Dr. Chidi Okeke',
    mentorId: 'men-demo-001',
    program: 'Full-Stack Software Engineering',
  };

  const mentor = mentors.find(m => m.id === student.mentorId || m.name === student.mentorName) || mentors[0];

  const studentSessions = sessions.filter(s => 
    s.studentId === student.id || s.studentName === student.name
  );

  // Active mentor office hours
  const activeOfficeHours = useMemo(() => {
    return (mentor?.officeHours || []).filter(h => h.isActive);
  }, [mentor?.officeHours]);

  // Booking Form State
  const [topic, setTopic] = useState('');
  const [sessionType, setSessionType] = useState('Code Architecture Review');
  const [sessionDate, setSessionDate] = useState('');
  const [sessionTime, setSessionTime] = useState('14:00 - 14:30');
  const [meetingMode, setMeetingMode] = useState<'Google Meet' | 'Lagos Hub In-Person'>('Google Meet');
  const [notes, setNotes] = useState('');
  const [isBooking, setIsBooking] = useState(false);
  const [selectedMeetingLink, setSelectedMeetingLink] = useState<string>('');

  // Selected Day detection & matching slots
  const selectedDayName = useMemo(() => {
    if (!sessionDate) return null;
    const d = new Date(sessionDate + 'T00:00:00');
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[d.getDay()];
  }, [sessionDate]);

  const matchingSlotsForDay = useMemo(() => {
    if (!selectedDayName) return [];
    return activeOfficeHours.filter(h => h.dayOfWeek === selectedDayName);
  }, [activeOfficeHours, selectedDayName]);

  // Generate intervals helper
  const generateIntervals = (start: string, end: string, durationMin: number) => {
    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);
    let cur = startH * 60 + startM;
    const endTotal = endH * 60 + endM;
    const intervals: string[] = [];

    while (cur + durationMin <= endTotal) {
      const h1 = String(Math.floor(cur / 60)).padStart(2, '0');
      const m1 = String(cur % 60).padStart(2, '0');
      const next = cur + durationMin;
      const h2 = String(Math.floor(next / 60)).padStart(2, '0');
      const m2 = String(next % 60).padStart(2, '0');
      intervals.push(`${h1}:${m1} - ${h2}:${m2}`);
      cur = next;
    }
    return intervals;
  };

  const handleBookSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic || !sessionDate) {
      showToast('Validation Error', 'Please specify a session topic and date.', 'warning');
      return;
    }

    if (!mentor) {
      showToast('Mentor Error', 'No assigned mentor available.', 'error');
      return;
    }

    setIsBooking(true);
    try {
      const resolvedMeetingLink = selectedMeetingLink || 
        (matchingSlotsForDay[0]?.meetingLink) || 
        (meetingMode === 'Google Meet' ? 'https://meet.google.com/nex-codelab-1on1' : undefined);

      bookSession({
        mentorId: mentor.id,
        mentorName: mentor.name,
        studentId: student.id,
        studentName: student.name,
        courseName: student.program || 'Software Engineering',
        date: sessionDate,
        time: sessionTime,
        durationHours: 1,
        topic: `${sessionType}: ${topic}`,
        notes: `Meeting Format: ${meetingMode}. ${notes}`,
        meetingLink: resolvedMeetingLink,
        locationType: meetingMode,
        status: 'Scheduled',
        compensationAmount: 8500,
      });

      showToast('Session Booked', `Your 1-on-1 session with ${mentor.name} has been confirmed.`, 'success');
      setTopic('');
      setNotes('');
      setSessionDate('');
      setSelectedMeetingLink('');
    } finally {
      setIsBooking(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-outline-variant pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary mb-1">
            <span className="material-symbols-outlined text-sm">support_agent</span>
            <span>Faculty Mentorship Hub</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-on-surface">1-on-1 Faculty Coaching</h1>
          <p className="text-xs md:text-sm text-on-surface-variant mt-0.5">
            Personalized guidance, lab code reviews, and career strategy from industry leaders
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Assigned Mentor Card & Bio (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {mentor ? (
            <div className="bg-surface-container-low border border-outline-variant rounded-2xl p-6 shadow-xs space-y-5">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-xl bg-primary text-white flex items-center justify-center font-extrabold text-2xl shrink-0">
                  {mentor.name.charAt(0)}
                </div>
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 font-bold text-[10px] uppercase mb-1">
                    <span className="material-symbols-outlined text-xs">verified</span>
                    <span>Assigned Faculty Mentor</span>
                  </div>
                  <h2 className="text-xl font-extrabold text-on-surface">{mentor.name}</h2>
                  <p className="text-xs text-on-surface-variant font-medium">{mentor.role || 'Lead Engineering Faculty'}</p>
                </div>
              </div>

              {/* Badges & Metrics */}
              <div className="grid grid-cols-3 gap-2 py-3 border-y border-outline-variant text-center">
                <div>
                  <div className="text-xs text-on-surface-variant font-medium">Rating</div>
                  <div className="text-base font-extrabold text-amber-500">★ {mentor.rating || 4.9}</div>
                </div>
                <div>
                  <div className="text-xs text-on-surface-variant font-medium">Sessions</div>
                  <div className="text-base font-extrabold text-on-surface">{mentor.sessionsCount || 14}</div>
                </div>
                <div>
                  <div className="text-xs text-on-surface-variant font-medium">Status</div>
                  <div className="text-base font-extrabold text-emerald-600">{mentor.status || 'Active'}</div>
                </div>
              </div>

              {/* Bio */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">Faculty Profile</h4>
                <p className="text-xs text-on-surface leading-relaxed">
                  {mentor.bio || 'Principal Software Architect specializing in distributed cloud systems, React, TypeScript, and microservice engineering. Dedicated to mentoring elite African engineering talent.'}
                </p>
              </div>

              {/* Expertise Tags */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">Specializations</h4>
                <div className="flex flex-wrap gap-1.5">
                  {(mentor.expertise || ['Full-Stack', 'Node.js', 'PostgreSQL', 'TypeScript', 'System Architecture']).map((skill, sIdx) => (
                    <span key={sIdx} className="px-2.5 py-1 rounded-lg bg-surface-container font-mono text-[11px] text-on-surface font-semibold border border-outline-variant/60">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Contact Info */}
              <div className="p-3.5 rounded-xl bg-surface-container border border-outline-variant/60 space-y-2 text-xs">
                <div className="flex items-center gap-2 text-on-surface">
                  <span className="material-symbols-outlined text-sm text-primary">mail</span>
                  <span className="font-mono">{mentor.email}</span>
                </div>
                {mentor.phone && (
                  <div className="flex items-center gap-2 text-on-surface">
                    <span className="material-symbols-outlined text-sm text-primary">call</span>
                    <span>{mentor.phone}</span>
                  </div>
                )}
              </div>

              {/* Weekly Office Hours Schedule */}
              <div className="p-4 rounded-xl bg-surface-container border border-outline-variant/60 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[15px] text-primary">schedule</span>
                    <span>Weekly Office Hours</span>
                  </h4>
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded">
                    {activeOfficeHours.length} Open Windows
                  </span>
                </div>

                {activeOfficeHours.length === 0 ? (
                  <p className="text-[11px] text-on-surface-variant italic">
                    Faculty has not published set office hours. You can request any standard time slot using the booking form.
                  </p>
                ) : (
                  <div className="space-y-2 pt-1">
                    {activeOfficeHours.map(slot => (
                      <div key={slot.id} className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-surface border border-outline-variant/40 shadow-xs">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-primary">{slot.dayOfWeek}</span>
                            <span className="font-mono text-on-surface text-[11px] font-semibold">{slot.startTime} - {slot.endTime}</span>
                          </div>
                          <p className="text-[10px] text-on-surface-variant">
                            {slot.slotDurationMinutes} min individual coaching slots
                          </p>
                        </div>
                        <span className="text-[10px] font-semibold text-on-surface-variant bg-surface-container px-2 py-0.5 rounded border border-outline-variant/40">
                          {slot.locationType.includes('Google') ? 'Meet' : slot.locationType.includes('Zoom') ? 'Zoom' : 'Hub Lab'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-8 text-center border border-dashed border-outline-variant rounded-2xl">
              <p className="text-sm font-bold text-on-surface">No mentor assigned yet.</p>
              <p className="text-xs text-on-surface-variant mt-1">Please reach out to Admissions to get paired with a faculty mentor.</p>
            </div>
          )}
        </div>

        {/* Right Column: Schedule Booking Form & History (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Booking Form */}
          <div className="bg-surface-container-low border border-outline-variant rounded-2xl p-6 shadow-xs">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-primary text-xl">event_available</span>
              <h3 className="text-lg font-bold text-on-surface">Schedule a 1-on-1 Session</h3>
            </div>

            <form onSubmit={handleBookSession} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">Session Type *</label>
                  <select
                    value={sessionType}
                    onChange={e => setSessionType(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-outline-variant bg-surface-container text-xs font-medium focus:ring-2 focus:ring-primary focus:outline-none cursor-pointer"
                  >
                    <option value="Code Architecture Review">Code Architecture Review</option>
                    <option value="Lab Deliverable Defense">Lab Deliverable Defense</option>
                    <option value="Bug Triage & Debugging">Bug Triage & Debugging</option>
                    <option value="Career & Interview Prep">Career & Interview Prep</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">Meeting Location / Mode *</label>
                  <select
                    value={meetingMode}
                    onChange={e => setMeetingMode(e.target.value as any)}
                    className="w-full px-3 py-2.5 rounded-xl border border-outline-variant bg-surface-container text-xs font-medium focus:ring-2 focus:ring-primary focus:outline-none cursor-pointer"
                  >
                    <option value="Google Meet">Google Meet (Online Video Call)</option>
                    <option value="Lagos Hub In-Person">Lagos VI Tech Hub (In-Person)</option>
                  </select>
                </div>
              </div>

              {/* Date & Time Slot Selection */}
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-on-surface mb-1">
                      Date * {selectedDayName && <span className="text-primary font-mono">({selectedDayName})</span>}
                    </label>
                    <input
                      type="date"
                      required
                      value={sessionDate}
                      onChange={e => setSessionDate(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-outline-variant bg-surface-container text-xs font-medium focus:ring-2 focus:ring-primary focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-on-surface mb-1">Time Window *</label>
                    <input
                      type="text"
                      required
                      value={sessionTime}
                      onChange={e => setSessionTime(e.target.value)}
                      placeholder="e.g. 14:00 - 14:30"
                      className="w-full px-3 py-2.5 rounded-xl border border-outline-variant bg-surface-container text-xs font-medium focus:ring-2 focus:ring-primary focus:outline-none font-mono"
                    />
                  </div>
                </div>

                {/* Dynamic Slot Picker from Mentor's Office Hours */}
                {sessionDate && (
                  <div className="p-3.5 rounded-xl bg-surface border border-outline-variant/60 space-y-2">
                    {matchingSlotsForDay.length > 0 ? (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-primary text-[16px]">event_seat</span>
                            <span>Open Office Hours on {selectedDayName}</span>
                          </span>
                          <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                            Select an available slot
                          </span>
                        </div>

                        <div className="space-y-2">
                          {matchingSlotsForDay.map(slot => {
                            const intervals = generateIntervals(slot.startTime, slot.endTime, slot.slotDurationMinutes);
                            return (
                              <div key={slot.id} className="space-y-1.5">
                                <div className="text-[10px] text-on-surface-variant font-semibold">
                                  {slot.startTime} - {slot.endTime} • {slot.locationType}
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                                  {intervals.map((intv, idx) => {
                                    const isSelected = sessionTime.startsWith(intv.split(' ')[0]);
                                    return (
                                      <button
                                        key={idx}
                                        type="button"
                                        onClick={() => {
                                          setSessionTime(intv);
                                          if (slot.meetingLink) setSelectedMeetingLink(slot.meetingLink);
                                          if (slot.locationType.includes('Campus')) {
                                            setMeetingMode('Lagos Hub In-Person');
                                          } else {
                                            setMeetingMode('Google Meet');
                                          }
                                        }}
                                        className={`px-2 py-1.5 rounded-lg text-[11px] font-mono font-bold transition-all cursor-pointer text-center ${
                                          isSelected
                                            ? 'bg-primary text-on-primary ring-2 ring-primary/40 shadow-xs'
                                            : 'bg-surface-container border border-outline-variant hover:border-primary text-on-surface hover:bg-primary/5'
                                        }`}
                                      >
                                        {intv.split(' - ')[0]}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start gap-2 text-xs text-on-surface-variant">
                        <span className="material-symbols-outlined text-amber-500 text-base shrink-0 mt-0.5">info</span>
                        <div>
                          <p className="font-semibold text-on-surface">Off-Hours Session Request</p>
                          <p className="text-[11px] text-secondary mt-0.5">
                            {mentor.name} has scheduled office hours on{' '}
                            <span className="font-bold text-on-surface">
                              {[...new Set(activeOfficeHours.map(h => h.dayOfWeek))].join(', ') || 'selected days'}
                            </span>
                            . You can book an off-hours appointment or switch date to an office hours day.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">Session Focus / Topic *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Debugging PostgreSQL transactions & query indexing"
                  value={topic}
                  onChange={e => setTopic(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant bg-surface-container text-xs focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">Specific Questions or Code Snippet Links</label>
                <textarea
                  rows={2}
                  placeholder="Share details on what you'd like to achieve during the call..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant bg-surface-container text-xs focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isBooking}
                className="w-full py-3 rounded-xl bg-primary hover:bg-primary/90 active:scale-[0.98] text-on-primary font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">calendar_month</span>
                <span>{isBooking ? 'Scheduling Session...' : 'Confirm 1-on-1 Coaching Session'}</span>
              </button>
            </form>
          </div>

          {/* Past & Scheduled Coaching Calls */}
          <div className="bg-surface-container-low border border-outline-variant rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-on-surface">Scheduled & Completed Coaching Calls</h3>

            {studentSessions.length === 0 ? (
              <p className="text-xs text-on-surface-variant text-center py-6">
                No coaching calls logged yet. Schedule your first 1-on-1 session above!
              </p>
            ) : (
              <div className="space-y-3">
                {studentSessions.map((sess) => (
                  <div key={sess.id} className="p-4 rounded-xl border border-outline-variant/80 bg-surface-container/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-mono font-bold text-primary">{sess.sessionCode}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          sess.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-blue-500/10 text-blue-600'
                        }`}>
                          {sess.status}
                        </span>
                        {sess.studentAttendance === 'Attended' ? (
                          <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                            <span className="material-symbols-outlined text-[12px]">verified</span>
                            <span>Attended (+{sess.hoursCredited || sess.durationHours}h)</span>
                          </span>
                        ) : sess.studentAttendance === 'Absent' ? (
                          <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/30">
                            <span className="material-symbols-outlined text-[12px]">cancel</span>
                            <span>Absent</span>
                          </span>
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-amber-500/10 text-amber-700">
                            Attendance Pending
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-sm text-on-surface">{sess.topic}</h4>
                      <p className="text-xs text-on-surface-variant">{sess.notes}</p>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0">
                      <div className="text-left sm:text-right">
                        <div className="text-xs font-bold text-on-surface">{sess.date} at {sess.time}</div>
                        <div className="text-[11px] text-on-surface-variant mt-0.5">{sess.durationHours} hr session</div>
                      </div>

                      {sess.meetingLink && (
                        <a
                          href={sess.meetingLink}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-on-primary text-xs font-bold hover:bg-primary/90 transition-all shadow-xs"
                        >
                          <span className="material-symbols-outlined text-[15px]">videocam</span>
                          <span>Join Meeting</span>
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
