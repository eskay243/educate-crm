import React, { useState } from 'react';
import { useCRM } from '../../context/CRMContext';

export interface BookSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BookSessionModal: React.FC<BookSessionModalProps> = ({ isOpen, onClose }) => {
  const { mentors, students, bookSession, selectedMentorForBookingId, currentUser, openModal } = useCRM();

  const isMentor = currentUser?.role === 'mentor';
  const defaultMentorId = isMentor 
    ? (currentUser?.mentorId || mentors[0]?.id || '')
    : (selectedMentorForBookingId || mentors[0]?.id || '');

  const [mentorId, setMentorId] = useState<string>(defaultMentorId);
  const [studentId, setStudentId] = useState<string>(students[0]?.id || '');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState<string>('14:00 - 15:30 (WAT)');
  const [durationHours, setDurationHours] = useState<number>(1.5);
  const [topic, setTopic] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  if (!isOpen) return null;

  const currentMentor = mentors.find(m => m.id === (mentorId || defaultMentorId)) || mentors[0];
  const currentStudent = students.find(s => s.id === (studentId || students[0]?.id)) || students[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentMentor || !currentStudent || !topic) return;

    bookSession({
      mentorId: currentMentor.id,
      mentorName: currentMentor.name,
      studentId: currentStudent.id,
      studentName: currentStudent.name,
      date,
      time,
      durationHours: Number(durationHours),
      topic,
      notes,
      status: 'Completed',
      compensationAmount: 0,
    });

    onClose();
  };

  // If prerequisites are missing, show friendly guidance
  const hasPrerequisites = mentors.length > 0 && students.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-inverse-surface/40 backdrop-blur-xs p-margin-page animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="glass-panel relative w-full max-w-2xl rounded-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden bg-surface-container-lowest border border-outline-variant z-10">
        {/* Header */}
        <div className="flex items-center justify-between p-stack-md px-stack-lg border-b border-outline-variant bg-surface-bright">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[22px]">calendar_add_on</span>
            <div>
              <h2 className="font-headline-lg text-lg font-bold text-on-surface">Log 1-on-1 Mentorship Session</h2>
              <p className="font-body-sm text-xs text-secondary">Record completed student coaching hours and milestone review progress.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-secondary hover:text-primary transition-colors p-1 rounded-full hover:bg-surface-container cursor-pointer"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>close</span>
          </button>
        </div>

        {!hasPrerequisites ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-[28px]">info</span>
            </div>
            <div className="max-w-md mx-auto space-y-1">
              <h3 className="font-bold text-sm text-on-surface">Prerequisites Required</h3>
              <p className="text-xs text-secondary">
                To log 1-on-1 mentorship sessions, you must have at least one active Faculty Mentor and one enrolled Student in your CRM workspace.
              </p>
            </div>
            <div className="flex justify-center gap-3 pt-2">
              {mentors.length === 0 && (
                <button
                  type="button"
                  onClick={() => { onClose(); openModal('recruit-mentor'); }}
                  className="px-4 h-9 rounded-lg bg-primary text-white text-xs font-bold hover:bg-primary/90 flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">person_add</span>
                  <span>+ Recruit Mentor</span>
                </button>
              )}
              {students.length === 0 && (
                <button
                  type="button"
                  onClick={() => { onClose(); openModal('enroll-student'); }}
                  className="px-4 h-9 rounded-lg bg-primary text-white text-xs font-bold hover:bg-primary/90 flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">school</span>
                  <span>+ Enroll Student</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Form Body */
          <form onSubmit={handleSubmit} className="overflow-y-auto p-stack-lg space-y-4 flex-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-label-md text-xs text-secondary font-semibold">Faculty Mentor <span className="text-error">*</span></label>
                {isMentor ? (
                  <input
                    type="text"
                    disabled
                    value={`${currentMentor?.name} (${currentMentor?.department})`}
                    className="w-full h-10 px-3 bg-surface-container border border-outline-variant rounded font-body-md text-sm text-on-surface outline-none cursor-not-allowed"
                  />
                ) : (
                  <select
                    value={mentorId || currentMentor?.id}
                    onChange={e => setMentorId(e.target.value)}
                    className="w-full h-10 px-3 bg-surface border border-outline-variant rounded font-body-md text-sm text-on-surface focus:border-primary outline-none cursor-pointer"
                  >
                    {mentors.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.department} • {m.commissionRate ?? 37}% Commission)
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="space-y-1">
                <label className="font-label-md text-xs text-secondary font-semibold">Student Mentee <span className="text-error">*</span></label>
                <select
                  value={studentId || currentStudent?.id}
                  onChange={e => setStudentId(e.target.value)}
                  className="w-full h-10 px-3 bg-surface border border-outline-variant rounded font-body-md text-sm text-on-surface focus:border-primary outline-none cursor-pointer"
                >
                  {students.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} (#{s.studentCode}) - {s.program}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-label-md text-xs text-secondary font-semibold">Session Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full h-10 px-3 bg-surface border border-outline-variant rounded font-body-md text-sm text-on-surface focus:border-primary outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-label-md text-xs text-secondary font-semibold">Time Window</label>
                <input
                  type="text"
                  value={time}
                  onChange={e => setTime(e.target.value)}
                  placeholder="e.g. 14:00 - 15:30 (WAT)"
                  className="w-full h-10 px-3 bg-surface border border-outline-variant rounded font-body-md text-sm text-on-surface focus:border-primary outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-label-md text-xs text-secondary font-semibold">Duration (Hours)</label>
                <select
                  value={durationHours}
                  onChange={e => setDurationHours(Number(e.target.value))}
                  className="w-full h-10 px-3 bg-surface border border-outline-variant rounded font-body-md text-sm text-on-surface focus:border-primary outline-none cursor-pointer"
                >
                  <option value={1}>1.0 Hour</option>
                  <option value={1.5}>1.5 Hours</option>
                  <option value={2}>2.0 Hours</option>
                  <option value={3}>3.0 Hours</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-label-md text-xs text-secondary font-semibold">Compensation Model</label>
                <div className="w-full h-10 px-3 bg-secondary-container/40 border border-primary/20 rounded flex items-center justify-between text-xs font-medium text-primary">
                  <span>37% Enrollment Commission</span>
                  <span className="text-[10px] font-bold text-[#166534] bg-[#dcfce7] px-1.5 py-0.5 rounded">Covered</span>
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-label-md text-xs text-secondary font-semibold">Topic / Technical Agenda <span className="text-error">*</span></label>
              <input
                type="text"
                required
                value={topic}
                onChange={e => setTopic(e.target.value)}
                placeholder="e.g. Distributed SQL Query Optimization & Microservice Architecture Review"
                className="w-full h-10 px-3 bg-surface border border-outline-variant rounded font-body-md text-sm text-on-surface focus:border-primary outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-label-md text-xs text-secondary font-semibold">Session Feedback &amp; Student Action Items</label>
              <textarea
                rows={3}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Student demonstrated good grasp of PostgreSQL indexing. Action item: Implement Redis cache layer before next milestone."
                className="w-full p-2.5 bg-surface border border-outline-variant rounded font-body-md text-sm text-on-surface focus:border-primary outline-none"
              />
            </div>

            {/* Footer Submit Buttons */}
            <div className="pt-stack-sm flex justify-end gap-3 border-t border-outline-variant">
              <button
                type="button"
                onClick={onClose}
                className="px-4 h-10 rounded border border-outline-variant font-label-md text-xs font-semibold text-secondary hover:bg-surface-container transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 h-10 rounded bg-primary text-on-primary font-label-md text-xs font-bold hover:bg-primary-container transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">check_circle</span>
                <span>Record Coaching Session</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
