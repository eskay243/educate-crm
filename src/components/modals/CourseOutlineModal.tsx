import React, { useState, useMemo } from 'react';
import { useCRM } from '../../context/CRMContext';
import { LMSLesson, CourseDurationTrack } from '../../types/crm';

interface CourseOutlineModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CourseOutlineModal: React.FC<CourseOutlineModalProps> = ({ isOpen, onClose }) => {
  const { 
    lmsModules, 
    courses, 
    currentUser, 
    markTopicAsTaught, 
    approveTopicByProgramOfficer, 
    openModal,
    showToast
  } = useCRM();

  const [activeTabCourse, setActiveTabCourse] = useState<string>('Full-Stack Software Engineering');
  const [durationFilter, setDurationFilter] = useState<'All' | CourseDurationTrack>('All');
  const [teachingNotesModalLesson, setTeachingNotesModalLesson] = useState<LMSLesson | null>(null);
  const [mentorNotes, setMentorNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [expandedGuidelines, setExpandedGuidelines] = useState<Record<string, boolean>>({});

  if (!isOpen) return null;

  const isProgramOfficerOrSuperAdmin = currentUser?.role === 'super_admin' || currentUser?.role === 'program_officer';
  const isMentor = currentUser?.role === 'mentor';

  // Extract unique courses from modules & courses list
  const availableCourses = useMemo(() => {
    const fromModules = Array.from(new Set(lmsModules.map(m => m.courseTitle)));
    const fromCourses = courses.map(c => c.title);
    return Array.from(new Set([...fromModules, ...fromCourses]));
  }, [lmsModules, courses]);

  // Filter available courses by duration if selected
  const filteredCourses = useMemo(() => {
    if (durationFilter === 'All') return availableCourses;
    return availableCourses.filter(title => {
      const courseObj = courses.find(c => c.title === title);
      const moduleObj = lmsModules.find(m => m.courseTitle === title);
      const track = courseObj?.durationTrack || moduleObj?.durationTrack;
      return track === durationFilter;
    });
  }, [availableCourses, durationFilter, courses, lmsModules]);

  const currentCourse = filteredCourses.includes(activeTabCourse) 
    ? activeTabCourse 
    : (filteredCourses[0] || 'Full-Stack Software Engineering');

  const currentCourseObj = courses.find(c => c.title === currentCourse);
  const currentModules = lmsModules.filter(m => m.courseTitle === currentCourse);

  const toggleGuidelines = (moduleId: string) => {
    setExpandedGuidelines(prev => ({
      ...prev,
      [moduleId]: prev[moduleId] === undefined ? false : !prev[moduleId]
    }));
  };

  const handleMarkTaughtSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teachingNotesModalLesson) return;

    setIsProcessing(true);
    try {
      await markTopicAsTaught(teachingNotesModalLesson.id, mentorNotes);
      showToast('Syllabus Progress Saved', `Topic marked as taught and logged for Program Officer audit.`, 'success');
      setTeachingNotesModalLesson(null);
      setMentorNotes('');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApprove = async (lessonId: string) => {
    setIsProcessing(true);
    try {
      await approveTopicByProgramOfficer(lessonId, currentCourse);
      showToast('Accreditation Approved', 'Topic verified and published to official student transcripts.', 'success');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApproveAllPending = async (moduleId: string) => {
    const mod = currentModules.find(m => m.id === moduleId);
    if (!mod) return;
    const pendingLessons = mod.lessons.filter(l => l.approvalStatus === 'Taught (Pending PO Approval)');
    if (pendingLessons.length === 0) return;

    setIsProcessing(true);
    try {
      for (const lesson of pendingLessons) {
        await approveTopicByProgramOfficer(lesson.id, currentCourse);
      }
      showToast('Batch Approval Complete', `${pendingLessons.length} topics accredited and published.`, 'success');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-inverse-surface/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-surface-container-lowest rounded-2xl max-w-5xl w-full border border-outline-variant shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-outline-variant flex items-center justify-between bg-surface-container-low flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shadow-xs">
              <span className="material-symbols-outlined text-[24px]">account_tree</span>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-headline-sm text-base sm:text-lg font-bold text-on-surface">
                  NBTE &amp; NITDA Course Outlines &amp; Learning Guidelines
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  NBTE / NSQF Aligned
                </span>
                <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-200">
                  NITDA 3MTT Framework
                </span>
              </div>
              <p className="font-body-sm text-xs text-secondary mt-0.5">
                Standard curriculum delivery guidelines, lab milestones, and Program Officer accreditation logbook.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={onClose}
              className="p-1.5 rounded-lg text-secondary hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
              title="Close modal"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          </div>
        </div>

        {/* Filter bar: Duration Track & Course Selector */}
        <div className="px-6 py-3 border-b border-outline-variant bg-surface flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-secondary text-[11px] uppercase tracking-wider">Duration Track:</span>
            <div className="flex bg-surface-container rounded-lg p-1 border border-outline-variant/60">
              {(['All', '30-Day Sprint', '60-Day Practitioner'] as const).map((track) => (
                <button
                  key={track}
                  type="button"
                  onClick={() => setDurationFilter(track)}
                  className={`px-3 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                    durationFilter === track
                      ? 'bg-primary text-on-primary shadow-xs'
                      : 'text-secondary hover:text-on-surface'
                  }`}
                >
                  {track}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Handshake Indicator */}
          <div className="hidden lg:flex items-center gap-1.5 text-[11px] text-secondary">
            <span className="font-bold text-on-surface">3-Way Flow:</span>
            <span className="px-2 py-0.5 rounded bg-surface-container text-secondary">1. PO Guidelines</span>
            <span className="material-symbols-outlined text-[12px]">arrow_forward</span>
            <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 font-medium border border-amber-200">2. Mentor Log</span>
            <span className="material-symbols-outlined text-[12px]">arrow_forward</span>
            <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-medium border border-emerald-200">3. PO Accredit &amp; Publish</span>
          </div>
        </div>

        {/* Course Tabs */}
        {filteredCourses.length > 0 && (
          <div className="px-6 pt-2 border-b border-outline-variant flex gap-2 overflow-x-auto bg-surface-bright scrollbar-none">
            {filteredCourses.map(courseName => {
              const isSelected = currentCourse === courseName;
              const courseData = courses.find(c => c.title === courseName);
              const durationLabel = courseData?.durationTrack || (courseData?.durationDays ? `${courseData.durationDays}-Day Track` : '60-Day Practitioner');

              return (
                <button
                  key={courseName}
                  onClick={() => setActiveTabCourse(courseName)}
                  className={`px-4 py-2 text-xs font-bold border-b-2 whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
                    isSelected
                      ? 'border-primary text-primary bg-primary/5'
                      : 'border-transparent text-secondary hover:text-on-surface'
                  }`}
                >
                  <span>{courseName}</span>
                  <span className="px-1.5 py-0.2 rounded text-[10px] bg-surface-container border border-outline-variant text-secondary">
                    {durationLabel}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-surface-container-lowest">
          {/* Regulatory Standards Banner for Selected Course */}
          <div className="p-4 rounded-xl bg-surface border border-outline-variant shadow-xs space-y-3">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-base text-on-surface">{currentCourse}</h3>
                  <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-bold">
                    {currentCourseObj?.durationTrack || '60-Day Practitioner'} ({currentCourseObj?.durationDays || 60} Days)
                  </span>
                  <span className="px-2 py-0.5 rounded bg-surface-container text-secondary text-[11px] font-mono">
                    Code: {currentCourseObj?.code || 'CSE-101'}
                  </span>
                </div>
                <p className="text-xs text-secondary mt-1">
                  {currentCourseObj?.description || 'Accredited modular curriculum aligned with NBTE and NITDA standards.'}
                </p>
              </div>

              {isProgramOfficerOrSuperAdmin && (
                <button
                  onClick={() => {
                    onClose();
                    openModal('schedule-class');
                  }}
                  className="h-8 px-3 rounded-lg bg-primary text-on-primary hover:bg-primary/90 text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer shrink-0"
                >
                  <span className="material-symbols-outlined text-[16px]">add_alarm</span>
                  <span>Schedule Lecture Slot</span>
                </button>
              )}
            </div>

            {/* NBTE Contact Hours & Competency Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-outline-variant/60 text-xs">
              <div className="p-2.5 rounded-lg bg-surface-container-low border border-outline-variant/40">
                <span className="text-[10px] text-secondary block font-medium">NBTE Accreditation</span>
                <span className="font-bold text-on-surface text-xs">
                  {currentCourseObj?.nsqfLevel || 'NSQF Level 4'}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-surface-container-low border border-outline-variant/40">
                <span className="text-[10px] text-secondary block font-medium">Theory vs Practical Split</span>
                <span className="font-bold text-emerald-700 text-xs">
                  {currentCourseObj?.theoryHours || 25}h Theory / {currentCourseObj?.practicalHours || 60}h Labs (70%)
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-surface-container-low border border-outline-variant/40">
                <span className="text-[10px] text-secondary block font-medium">Min. Graduation Attendance</span>
                <span className="font-bold text-on-surface text-xs">
                  {currentCourseObj?.minimumRequiredHours || 40} Contact Hours
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-surface-container-low border border-outline-variant/40">
                <span className="text-[10px] text-secondary block font-medium">Lead Faculty Mentor</span>
                <span className="font-bold text-primary text-xs">
                  {currentCourseObj?.leadInstructor || 'Faculty Team'}
                </span>
              </div>
            </div>
          </div>

          {/* Modules List with Learning Guidelines */}
          {currentModules.length === 0 ? (
            <div className="p-12 text-center text-secondary border border-dashed border-outline-variant rounded-2xl bg-surface">
              <span className="material-symbols-outlined text-4xl mb-2 text-primary opacity-60">auto_stories</span>
              <p className="font-bold text-sm text-on-surface">No Syllabus Modules Defined Yet</p>
              <p className="text-xs text-secondary max-w-sm mx-auto mt-1">
                The Program Officer has not added learning guidelines or outline topics for this track.
              </p>
            </div>
          ) : (
            currentModules.map(mod => {
              const isGuidelinesOpen = expandedGuidelines[mod.id] !== false;
              const pendingCountInMod = mod.lessons.filter(l => l.approvalStatus === 'Taught (Pending PO Approval)').length;
              const approvedCountInMod = mod.lessons.filter(l => l.approvalStatus === 'Approved & Published').length;

              return (
                <div key={mod.id} className="border border-outline-variant rounded-xl overflow-hidden bg-surface shadow-xs space-y-0">
                  {/* Module Header */}
                  <div className="px-5 py-3.5 bg-surface-container-low border-b border-outline-variant flex items-center justify-between flex-wrap gap-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary-container/40 text-primary">
                          Module {mod.order}
                        </span>
                        <h3 className="font-bold text-sm text-on-surface">{mod.title}</h3>
                        {mod.nsqfLevel && (
                          <span className="px-1.5 py-0.2 rounded bg-surface border border-outline-variant text-[10px] text-secondary font-mono">
                            {mod.nsqfLevel}
                          </span>
                        )}
                        {mod.learningGuideline?.dayRange && (
                          <span className="px-2 py-0.2 rounded-full bg-amber-50 text-amber-800 text-[10px] font-bold border border-amber-200">
                            ⏱️ {mod.learningGuideline.dayRange}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-secondary line-clamp-1">{mod.description}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => toggleGuidelines(mod.id)}
                        className="px-2.5 py-1 rounded bg-surface border border-outline-variant hover:border-primary text-secondary hover:text-on-surface text-[11px] font-bold transition-colors flex items-center gap-1 cursor-pointer"
                        title="Toggle NBTE learning guidelines and deliverables"
                      >
                        <span className="material-symbols-outlined text-[14px] text-primary">menu_book</span>
                        <span>{isGuidelinesOpen ? 'Hide Guidelines' : 'Learning Guidelines'}</span>
                      </button>

                      {isProgramOfficerOrSuperAdmin && pendingCountInMod > 0 && (
                        <button
                          type="button"
                          onClick={() => handleApproveAllPending(mod.id)}
                          disabled={isProcessing}
                          className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition-colors shadow-xs flex items-center gap-1 cursor-pointer"
                          title="Approve all taught topics in this module"
                        >
                          <span className="material-symbols-outlined text-[14px]">done_all</span>
                          <span>Approve Module ({pendingCountInMod})</span>
                        </button>
                      )}

                      <span className="text-[11px] font-bold px-2 py-1 rounded bg-surface-container text-secondary">
                        {approvedCountInMod}/{mod.lessons.length} Accredited
                      </span>
                    </div>
                  </div>

                  {/* Learning Guidelines Drawer / Callout (NBTE / NITDA standard) */}
                  {isGuidelinesOpen && mod.learningGuideline && (
                    <div className="p-4 bg-primary/5 border-b border-outline-variant/60 text-xs space-y-3 animate-in fade-in duration-150">
                      <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
                        <span className="material-symbols-outlined text-[16px]">verified</span>
                        <span>NBTE / NITDA Competency &amp; Learning Guidelines</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <p className="font-semibold text-on-surface text-xs">🎯 Competency Learning Outcome:</p>
                          <p className="text-secondary text-xs leading-relaxed bg-surface p-2.5 rounded-lg border border-outline-variant/60">
                            {mod.learningGuideline.competencyOutcome}
                          </p>
                        </div>

                        <div className="space-y-1.5">
                          <p className="font-semibold text-on-surface text-xs">📦 Expected Practical Lab Deliverables (70%):</p>
                          <div className="bg-surface p-2.5 rounded-lg border border-outline-variant/60 space-y-1">
                            {mod.learningGuideline.expectedDeliverables.map((deliv, idx) => (
                              <div key={idx} className="flex items-start gap-1.5 text-secondary text-xs">
                                <span className="text-emerald-600 font-bold">✓</span>
                                <span>{deliv}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {mod.learningGuideline.prerequisites && mod.learningGuideline.prerequisites.length > 0 && (
                        <div className="flex items-center gap-2 flex-wrap pt-1">
                          <span className="font-semibold text-[11px] text-secondary">Prerequisites:</span>
                          {mod.learningGuideline.prerequisites.map((pre, idx) => (
                            <span key={idx} className="px-2 py-0.5 rounded bg-surface border border-outline-variant/60 text-[10px] text-secondary font-medium">
                              {pre}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Lessons / Topics List */}
                  <div className="divide-y divide-outline-variant/60">
                    {mod.lessons.map(lesson => {
                      const status = lesson.approvalStatus || 'Not Started';
                      const isApproved = status === 'Approved & Published';
                      const isPendingApproval = status === 'Taught (Pending PO Approval)';

                      return (
                        <div 
                          key={lesson.id} 
                          className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-surface-container-low/40 transition-colors"
                        >
                          <div className="space-y-1 max-w-xl">
                            <div className="flex items-center gap-2 flex-wrap">
                              {lesson.dayNumber && (
                                <span className="px-2 py-0.5 rounded bg-secondary-container text-on-secondary-container font-mono text-[10px] font-bold">
                                  Day {lesson.dayNumber}
                                </span>
                              )}
                              <span className="font-bold text-xs sm:text-sm text-on-surface">
                                {lesson.title}
                              </span>
                              <span className="text-[11px] text-secondary font-mono">
                                ({lesson.durationMinutes} mins • {lesson.type.toUpperCase()})
                              </span>

                              {/* Practical Lab Badge */}
                              {lesson.submissionRequired && (
                                <span className="px-2 py-0.2 rounded bg-purple-50 text-purple-700 text-[10px] font-bold border border-purple-200">
                                  💻 Code Lab Deliverable
                                </span>
                              )}

                              {/* Status Badge */}
                              {isApproved && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                                  <span className="material-symbols-outlined text-[12px]">verified</span>
                                  Approved &amp; Published
                                </span>
                              )}
                              {isPendingApproval && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1 animate-pulse">
                                  <span className="material-symbols-outlined text-[12px]">pending</span>
                                  Taught (Pending PO Sign-off)
                                </span>
                              )}
                              {!isApproved && !isPendingApproval && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-surface-container text-secondary">
                                  Not Started
                                </span>
                              )}
                            </div>

                            {/* Practical Lab Task description */}
                            {lesson.practicalLabTask && (
                              <p className="text-xs text-primary/80 font-medium">
                                Task: {lesson.practicalLabTask}
                              </p>
                            )}

                            {/* Completion & Sign-off Audit Stamp */}
                            {lesson.completedByMentor && (
                              <div className="text-[11px] text-secondary flex items-center gap-2 flex-wrap">
                                <span>Taught by: <strong className="text-on-surface">{lesson.completedByMentorName}</strong></span>
                                {lesson.completedByMentorAt && (
                                  <span>on {new Date(lesson.completedByMentorAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                                )}
                                {lesson.completionNotes && (
                                  <span className="italic">&ldquo;{lesson.completionNotes}&rdquo;</span>
                                )}
                              </div>
                            )}

                            {lesson.approvedByProgramOfficer && (
                              <div className="text-[11px] text-emerald-700 flex items-center gap-1 font-medium">
                                <span className="material-symbols-outlined text-[14px]">verified</span>
                                <span>Accredited &amp; signed off by {lesson.approvedByProgramOfficerName} (Students' syllabus synchronized)</span>
                              </div>
                            )}
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-2 shrink-0">
                            {/* Mentor Action: Mark as Taught */}
                            {isMentor && !lesson.completedByMentor && (
                              <button
                                onClick={() => setTeachingNotesModalLesson(lesson)}
                                className="px-3 py-1.5 rounded bg-primary text-on-primary font-bold text-xs hover:bg-primary/90 flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-[16px]">check</span>
                                <span>Mark Taught</span>
                              </button>
                            )}

                            {/* PO / Super Admin Action: Confirm & Publish */}
                            {isProgramOfficerOrSuperAdmin && isPendingApproval && (
                              <button
                                onClick={() => handleApprove(lesson.id)}
                                disabled={isProcessing}
                                className="px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs transition-all disabled:opacity-50 cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-[16px]">verified</span>
                                <span>Confirm &amp; Accredit</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info bar */}
        <div className="px-6 py-3 border-t border-outline-variant bg-surface-container-low flex items-center justify-between text-xs text-secondary flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px] text-primary">policy</span>
            <span>
              National Board for Technical Education (NBTE) &bull; National Information Technology Development Agency (NITDA)
            </span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-surface border border-outline-variant hover:border-primary text-secondary hover:text-on-surface font-bold text-xs transition-colors cursor-pointer shadow-xs"
          >
            Close Outlines
          </button>
        </div>
      </div>

      {/* Teaching Notes & Classroom Completion Modal */}
      {teachingNotesModalLesson && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-inverse-surface/70 backdrop-blur-xs">
          <div className="bg-surface-container-lowest rounded-xl max-w-lg w-full border border-outline-variant p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-outline-variant pb-3">
              <h3 className="font-bold text-sm text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">assignment_turned_in</span>
                <span>Log Topic Completion: {teachingNotesModalLesson.title}</span>
              </h3>
              <button
                onClick={() => setTeachingNotesModalLesson(null)}
                className="text-secondary hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <form onSubmit={handleMarkTaughtSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-secondary mb-1">
                  Classroom Teaching Notes &amp; Observations *
                </label>
                <textarea
                  value={mentorNotes}
                  onChange={e => setMentorNotes(e.target.value)}
                  placeholder="Record summary of concepts delivered, student comprehension level, and specific challenges observed during practical lab exercises..."
                  rows={4}
                  required
                  className="w-full p-3 bg-surface border border-outline-variant rounded-lg text-xs text-on-surface outline-none focus:border-primary"
                />
              </div>

              <div className="p-3 bg-surface-container-low rounded-lg border border-outline-variant/60 text-[11px] text-secondary space-y-1">
                <p className="font-bold text-on-surface">📋 Statutory Logbook Record:</p>
                <p>This entry will be recorded in the institutional syllabus log and submitted for Program Officer verification.</p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setTeachingNotesModalLesson(null)}
                  className="px-3 py-1.5 rounded text-xs font-bold text-secondary hover:text-on-surface"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="px-4 py-1.5 rounded bg-primary text-on-primary text-xs font-bold hover:bg-primary/90 shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isProcessing ? 'Submitting...' : 'Confirm Topic Taught'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
