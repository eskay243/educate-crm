import React, { useState } from 'react';
import { useCRM } from '../../context/CRMContext';
import { TimetableSlot } from '../../types/crm';

interface ScheduleClassModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ScheduleClassModal: React.FC<ScheduleClassModalProps> = ({ isOpen, onClose }) => {
  const { courses, cohorts, mentors, lmsModules, scheduleClass } = useCRM();

  const [courseId, setCourseId] = useState(courses[0]?.id || '');
  const [cohortId, setCohortId] = useState(cohorts[0]?.id || '');
  const [mentorId, setMentorId] = useState(mentors[0]?.id || '');
  const [topic, setTopic] = useState('');
  const [dayOfWeek, setDayOfWeek] = useState<TimetableSlot['dayOfWeek']>('Monday');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('10:00 AM');
  const [endTime, setEndTime] = useState('12:00 PM');
  const [durationHours, setDurationHours] = useState(2);
  const [venue, setVenue] = useState('Google Meet Virtual Classroom');
  const [meetingLink, setMeetingLink] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const selectedCourse = courses.find(c => c.id === courseId) || courses[0];
  const selectedCohort = cohorts.find(c => c.id === cohortId) || cohorts[0];
  const selectedMentor = mentors.find(m => m.id === mentorId) || mentors[0];

  // Available topics from syllabus for selected course
  const courseLessons = lmsModules
    .filter(m => !selectedCourse || m.courseTitle === selectedCourse.title)
    .flatMap(m => m.lessons);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    setIsSubmitting(true);
    try {
      await scheduleClass({
        courseId: selectedCourse?.id || 'course-gen',
        courseTitle: selectedCourse?.title || 'Academic Program',
        cohortId: selectedCohort?.id || 'coh-gen',
        cohortName: selectedCohort?.name || 'Main Cohort',
        mentorId: selectedMentor?.id || 'men-gen',
        mentorName: selectedMentor?.name || 'Assigned Faculty Mentor',
        topic: topic.trim(),
        dayOfWeek,
        date,
        startTime,
        endTime,
        durationHours: Number(durationHours) || 2,
        venue: venue.trim() || 'Virtual Classroom',
        meetingLink: meetingLink.trim() || undefined,
        status: 'Scheduled',
        notes: notes.trim() || undefined,
        createdBy: 'Academic Program Office',
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-inverse-surface/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-surface-container-lowest rounded-xl max-w-xl w-full border border-outline-variant shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-outline-variant flex items-center justify-between bg-surface-container-low">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-500/10 text-indigo-700 flex items-center justify-center">
              <span className="material-symbols-outlined text-xl">event_upcoming</span>
            </div>
            <div>
              <h2 className="font-title-md font-bold text-on-surface">Schedule Class Timetable Slot</h2>
              <p className="font-body-sm text-on-surface-variant">Plan faculty lecture, assign mentor, and broadcast to scholars</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-label-sm font-semibold text-on-surface mb-1">
                Course Program *
              </label>
              <select
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-outline bg-surface text-on-surface text-body-sm focus:border-primary focus:outline-none"
                required
              >
                {courses.map(c => (
                  <option key={c.id} value={c.id}>{c.title} ({c.code})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-label-sm font-semibold text-on-surface mb-1">
                Target Cohort *
              </label>
              <select
                value={cohortId}
                onChange={(e) => setCohortId(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-outline bg-surface text-on-surface text-body-sm focus:border-primary focus:outline-none"
                required
              >
                {cohorts.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-label-sm font-semibold text-on-surface mb-1">
              Assigned Faculty Mentor *
            </label>
            <select
              value={mentorId}
              onChange={(e) => setMentorId(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-outline bg-surface text-on-surface text-body-sm focus:border-primary focus:outline-none"
              required
            >
              {mentors.map(m => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.role || 'Faculty Mentor'}) — {m.lecturedHours || 0} hrs logged
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-label-sm font-semibold text-on-surface">
                Lecture Topic / Lesson *
              </label>
              {courseLessons.length > 0 && (
                <span className="text-label-xs text-indigo-700">Or pick from syllabus</span>
              )}
            </div>
            {courseLessons.length > 0 && (
              <select
                onChange={(e) => {
                  if (e.target.value) setTopic(e.target.value);
                }}
                className="w-full h-9 mb-2 px-3 rounded-lg border border-outline-variant bg-surface-container-low text-on-surface-variant text-label-sm focus:outline-none"
              >
                <option value="">-- Select from existing course syllabus --</option>
                {courseLessons.map(l => (
                  <option key={l.id} value={l.title}>{l.title}</option>
                ))}
              </select>
            )}
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. 1.2 State Architecture: TanStack Query & Optimistic Mutations"
              className="w-full h-10 px-3 rounded-lg border border-outline bg-surface text-on-surface text-body-sm focus:border-primary focus:outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-label-sm font-semibold text-on-surface mb-1">
                Day of Week *
              </label>
              <select
                value={dayOfWeek}
                onChange={(e) => setDayOfWeek(e.target.value as any)}
                className="w-full h-10 px-3 rounded-lg border border-outline bg-surface text-on-surface text-body-sm focus:border-primary focus:outline-none"
                required
              >
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-label-sm font-semibold text-on-surface mb-1">
                Date *
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-outline bg-surface text-on-surface text-body-sm focus:border-primary focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-label-sm font-semibold text-on-surface mb-1">
                Duration (Hours) *
              </label>
              <input
                type="number"
                min="0.5"
                step="0.5"
                value={durationHours}
                onChange={(e) => setDurationHours(parseFloat(e.target.value) || 2)}
                className="w-full h-10 px-3 rounded-lg border border-outline bg-surface text-on-surface text-body-sm focus:border-primary focus:outline-none"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-label-sm font-semibold text-on-surface mb-1">
                Start Time *
              </label>
              <input
                type="text"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                placeholder="e.g. 10:00 AM"
                className="w-full h-10 px-3 rounded-lg border border-outline bg-surface text-on-surface text-body-sm focus:border-primary focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-label-sm font-semibold text-on-surface mb-1">
                End Time *
              </label>
              <input
                type="text"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                placeholder="e.g. 12:00 PM"
                className="w-full h-10 px-3 rounded-lg border border-outline bg-surface text-on-surface text-body-sm focus:border-primary focus:outline-none"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-label-sm font-semibold text-on-surface mb-1">
                Classroom Venue *
              </label>
              <input
                type="text"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                placeholder="e.g. Victoria Island Executive Hub - Lab B"
                className="w-full h-10 px-3 rounded-lg border border-outline bg-surface text-on-surface text-body-sm focus:border-primary focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-label-sm font-semibold text-on-surface mb-1">
                Virtual Meeting Link (Optional)
              </label>
              <input
                type="url"
                value={meetingLink}
                onChange={(e) => setMeetingLink(e.target.value)}
                placeholder="https://meet.google.com/xyz-abc"
                className="w-full h-10 px-3 rounded-lg border border-outline bg-surface text-on-surface text-body-sm focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-label-sm font-semibold text-on-surface mb-1">
              Instructions & Preparation Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Scholars must clone the repository before class and ensure Node v20 is installed."
              className="w-full p-3 rounded-lg border border-outline bg-surface text-on-surface text-body-sm focus:border-primary focus:outline-none"
            />
          </div>

          <div className="p-3 rounded-lg bg-indigo-50/50 border border-indigo-100 flex items-start gap-2.5">
            <span className="material-symbols-outlined text-indigo-600 text-lg shrink-0 mt-0.5">verified_user</span>
            <div className="text-label-xs text-indigo-900 leading-relaxed">
              <strong className="font-semibold">Academic Governance Notice:</strong> Once scheduled, this class appears on faculty and student portal timetables. Upon completion, faculty attendance logging will credit student learning hours towards graduation and faculty hours towards payout eligibility.
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 border-t border-outline-variant flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-outline text-on-surface hover:bg-surface-container text-label-md font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-lg bg-primary text-on-primary hover:bg-surface-tint font-bold text-label-md flex items-center gap-2 shadow-xs disabled:opacity-50 transition-all"
            >
              {isSubmitting ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>
                  <span>Scheduling...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-lg">calendar_add_on</span>
                  <span>Publish to Timetable</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
