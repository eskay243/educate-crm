import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useCRM } from '../../context/CRMContext';
import { LMSLesson, LMSModule } from '../../types/crm';

export const StudentCoursesPage: React.FC = () => {
  const { 
    lmsModules, 
    currentStudentProfile, 
    completeLesson, 
    submitAssignment, 
    assignments, 
    openModal,
    settings,
    showToast,
    timetables,
  } = useCRM();

  const student = currentStudentProfile || {
    id: 'stu-demo',
    studentCode: 'STU-8492',
    name: 'Scholar Student',
    program: 'Full-Stack Software Engineering',
    completedLessonIds: ['les-1-1'],
    progressPercent: 33,
    attendedLearningHours: 38,
    minimumRequiredHours: 40,
    certificateIssued: false,
    mentorName: 'Dr. Chidi Okeke',
  };

  const modules = lmsModules && lmsModules.length > 0 ? lmsModules : [];
  
  // Active selected module and lesson
  const [activeModuleId, setActiveModuleId] = useState<string>(modules[0]?.id || 'mod-1');
  const [activeLessonId, setActiveLessonId] = useState<string>(modules[0]?.lessons[0]?.id || 'les-1-1');
  const [activeTab, setActiveTab] = useState<'content' | 'assignment' | 'resources'>('content');
  const [showTimetableModal, setShowTimetableModal] = useState(false);

  // Assignment submission form
  const [githubUrl, setGithubUrl] = useState('');
  const [liveUrl, setLiveUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const cohortTimetable = useMemo(() => {
    if (!timetables) return [];
    return timetables.filter(slot => {
      const studentCohort = (student as any).cohort || '';
      const matchCohort = studentCohort && slot.cohortName.toLowerCase().includes(studentCohort.toLowerCase());
      const matchCourse = student.program && (
        slot.courseTitle.toLowerCase().includes(student.program.toLowerCase()) ||
        student.program.toLowerCase().includes(slot.courseTitle.toLowerCase())
      );
      return matchCohort || matchCourse;
    });
  }, [timetables, student]);

  const activeModule = modules.find(m => m.id === activeModuleId) || modules[0];
  const activeLesson: LMSLesson | undefined = activeModule?.lessons.find(l => l.id === activeLessonId) || activeModule?.lessons[0];

  const isCompleted = student.completedLessonIds?.includes(activeLesson?.id || '');

  // Find submissions for this lesson
  const currentSubmissions = assignments.filter(a => 
    (a.studentId === student.id || a.studentName === student.name) && 
    (a.taskTitle.includes(activeLesson?.title || '') || a.moduleTitle === activeModule?.title)
  );

  const handleCompleteLesson = async () => {
    if (!activeLesson) return;
    await completeLesson(activeLesson.id);
  };

  const handleSubmitAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeLesson || !activeModule) return;
    if (!githubUrl && !liveUrl) {
      showToast('Validation Error', 'Please provide either a GitHub repository link or a live URL.', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      await submitAssignment({
        taskTitle: activeLesson.title,
        courseTitle: activeModule.courseTitle,
        moduleTitle: activeModule.title,
        githubUrl: githubUrl.trim(),
        liveUrl: liveUrl.trim(),
        notes: notes.trim(),
      });
      setGithubUrl('');
      setLiveUrl('');
      setNotes('');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Next / Previous lesson helper
  const allLessons: { module: LMSModule; lesson: LMSLesson }[] = [];
  modules.forEach(m => {
    m.lessons.forEach(l => {
      allLessons.push({ module: m, lesson: l });
    });
  });

  const currentIndex = allLessons.findIndex(item => item.lesson.id === activeLesson?.id);
  const prevItem = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextItem = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-outline-variant pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary mb-1">
            <span className="material-symbols-outlined text-sm">local_library</span>
            <span>Structured LMS Classroom</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-on-surface">
            {activeModule?.courseTitle || 'Curriculum Syllabus'}
          </h1>
          <p className="text-xs md:text-sm text-on-surface-variant mt-0.5">
            Module {activeModule?.order || 1}: {activeModule?.title}
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => setShowTimetableModal(true)}
            className="px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs bg-primary text-on-primary hover:bg-primary/90 cursor-pointer"
            title="View Cohort Timetable & Scheduled Lectures"
          >
            <span className="material-symbols-outlined text-[18px]">calendar_month</span>
            <span>Class Timetable ({cohortTimetable.length})</span>
          </button>

          <button
            onClick={() => openModal('view-certificate')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer ${
              student.certificateIssued
                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                : (student.attendedLearningHours || 0) >= (student.minimumRequiredHours || settings.defaultMinimumLearningHours || 40) && (student.progressPercent || 0) >= 100
                ? 'bg-primary text-on-primary hover:bg-primary/90'
                : 'bg-surface-container border border-outline-variant text-secondary hover:text-on-surface'
            }`}
            title="Academic Certificate of Completion"
          >
            <span className="material-symbols-outlined text-[18px]">
              {student.certificateIssued ? 'workspace_premium' : 'verified'}
            </span>
            <span>
              {student.certificateIssued ? 'View Certificate' : (student.progressPercent || 0) >= 100 ? 'Claim Certificate' : 'Graduation Gate'}
            </span>
          </button>

          {/* Progress pill */}
          <div className="flex items-center gap-3 bg-surface-container px-4 py-2.5 rounded-xl border border-outline-variant">
            <div className="text-right">
              <div className="text-xs text-on-surface-variant font-medium">Academic Track Progress</div>
              <div className="text-sm font-extrabold text-on-surface">{student.progressPercent || 33}% Completed</div>
            </div>
            <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-extrabold text-sm border-2 border-primary">
              {student.progressPercent || 33}%
            </div>
          </div>
        </div>
      </div>

      {/* Main Classroom Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Modules & Lessons Navigation Tree (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-surface-container-low border border-outline-variant rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between px-2 mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Course Curriculum</span>
              <span className="text-xs text-on-surface-variant font-medium">{modules.length} Modules</span>
            </div>

            <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
              {modules.map((mod, modIdx) => (
                <div key={mod.id} className="rounded-xl border border-outline-variant/60 overflow-hidden bg-surface-container/30">
                  <button
                    onClick={() => {
                      setActiveModuleId(mod.id);
                      if (mod.lessons.length > 0) setActiveLessonId(mod.lessons[0].id);
                    }}
                    className={`w-full text-left p-3.5 flex items-center justify-between font-bold text-xs transition-colors ${
                      activeModuleId === mod.id ? 'bg-primary/10 text-primary' : 'hover:bg-surface-container text-on-surface'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="w-5 h-5 rounded-full bg-primary text-on-primary flex items-center justify-center text-[10px]">
                        {mod.order || modIdx + 1}
                      </span>
                      <span className="truncate">{mod.title}</span>
                    </div>
                    <span className="text-[10px] text-on-surface-variant shrink-0 ml-2">
                      {mod.lessons.length} lessons
                    </span>
                  </button>

                  {/* Lessons list */}
                  <div className="divide-y divide-outline-variant/30">
                    {mod.lessons.map((lesson) => {
                      const isLesCompleted = student.completedLessonIds?.includes(lesson.id);
                      const isSelected = activeLesson?.id === lesson.id;

                      return (
                        <button
                          key={lesson.id}
                          onClick={() => {
                            setActiveModuleId(mod.id);
                            setActiveLessonId(lesson.id);
                          }}
                          className={`w-full text-left p-3 flex items-start gap-3 transition-colors text-xs ${
                            isSelected
                              ? 'bg-surface-container text-primary font-bold border-l-4 border-primary'
                              : 'hover:bg-surface-container-high text-on-surface-variant'
                          }`}
                        >
                          <span className={`material-symbols-outlined text-sm mt-0.5 shrink-0 ${
                            isLesCompleted ? 'text-emerald-600' : 'text-on-surface-variant'
                          }`}>
                            {isLesCompleted ? 'check_circle' : lesson.type === 'video' ? 'play_circle' : lesson.type === 'lab' ? 'terminal' : 'menu_book'}
                          </span>

                          <div className="flex-1 truncate">
                            <div className="truncate text-on-surface">{lesson.title}</div>
                            <div className="text-[11px] text-on-surface-variant mt-0.5 flex items-center gap-1.5 flex-wrap">
                              <span>{lesson.durationMinutes} mins</span>
                              <span>&bull;</span>
                              <span className="capitalize">{lesson.type}</span>
                              {lesson.approvalStatus === 'Approved & Published' && (
                                <span className="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 text-[9px] font-bold">
                                  Approved
                                </span>
                              )}
                              {lesson.approvalStatus === 'Taught (Pending PO Approval)' && (
                                <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 text-[9px] font-bold">
                                  Taught
                                </span>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Active Lesson Classroom & Workspace (8 cols) */}
        <div className="lg:col-span-8 space-y-5">
          {activeLesson ? (
            <div className="bg-surface-container-low border border-outline-variant rounded-2xl p-6 shadow-xs space-y-6">
              {/* Lesson Top Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-outline-variant pb-4">
                <div>
                  <div className="flex items-center gap-2 text-xs text-primary font-bold mb-1 flex-wrap">
                    <span className="uppercase tracking-wider">Module {activeModule?.order}</span>
                    <span>&bull;</span>
                    <span className="capitalize">{activeLesson.type} Lecture</span>
                    <span>&bull;</span>
                    <span>{activeLesson.durationMinutes} mins</span>
                    {activeLesson.approvedByProgramOfficer && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-200 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[13px]">verified</span>
                        <span>PO Approved</span>
                      </span>
                    )}
                    {activeLesson.completedByMentor && !activeLesson.approvedByProgramOfficer && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold border border-amber-200">
                        Taught by Faculty
                      </span>
                    )}
                  </div>
                  <h2 className="text-xl md:text-2xl font-extrabold text-on-surface">{activeLesson.title}</h2>
                </div>

                {/* Mark as completed CTA */}
                <button
                  onClick={handleCompleteLesson}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all shadow-xs shrink-0 ${
                    isCompleted
                      ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/30'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white active:scale-95'
                  }`}
                >
                  <span className="material-symbols-outlined text-base">
                    {isCompleted ? 'check_circle' : 'task_alt'}
                  </span>
                  <span>{isCompleted ? 'Completed' : 'Mark Complete'}</span>
                </button>
              </div>

              {/* NBTE / NITDA Learning Guideline Card for Active Module */}
              {activeModule?.learningGuideline && (
                <div className="p-4 rounded-xl bg-surface border border-outline-variant text-xs space-y-2.5 shadow-xs">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="font-bold text-primary flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                      <span className="material-symbols-outlined text-[16px]">verified</span>
                      <span>NBTE / NITDA Learning Guideline &bull; {activeModule.learningGuideline.dayRange || 'Pacing Schedule'}</span>
                    </span>
                    <Link
                      to="/student/mentor"
                      className="px-2.5 py-1 rounded bg-primary/10 text-primary hover:bg-primary/20 font-bold text-[11px] flex items-center gap-1 transition-colors"
                      title="Book 1-on-1 office hours coaching with your faculty mentor"
                    >
                      <span className="material-symbols-outlined text-[14px]">support_agent</span>
                      <span>Book Mentor Office Hours</span>
                    </Link>
                  </div>
                  <p className="text-secondary leading-relaxed">
                    <strong className="text-on-surface">Target Competency:</strong> {activeModule.learningGuideline.competencyOutcome}
                  </p>
                  {activeModule.learningGuideline.expectedDeliverables && (
                    <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-outline-variant/40">
                      <span className="text-[11px] text-secondary font-medium">Expected Deliverables:</span>
                      {activeModule.learningGuideline.expectedDeliverables.map((deliv, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded bg-surface-container text-on-surface text-[10px] font-medium border border-outline-variant/60">
                          ✓ {deliv}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Classroom Tabs */}
              <div className="flex items-center gap-2 border-b border-outline-variant">
                <button
                  onClick={() => setActiveTab('content')}
                  className={`pb-3 px-3 text-xs font-bold transition-colors border-b-2 flex items-center gap-1.5 ${
                    activeTab === 'content'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">menu_book</span>
                  <span>Lecture & Notes</span>
                </button>

                <button
                  onClick={() => setActiveTab('assignment')}
                  className={`pb-3 px-3 text-xs font-bold transition-colors border-b-2 flex items-center gap-1.5 ${
                    activeTab === 'assignment'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">terminal</span>
                  <span>Lab & Assignment</span>
                  {currentSubmissions.length > 0 && (
                    <span className="w-4 h-4 rounded-full bg-emerald-600 text-white text-[9px] flex items-center justify-center font-bold">
                      {currentSubmissions.length}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setActiveTab('resources')}
                  className={`pb-3 px-3 text-xs font-bold transition-colors border-b-2 flex items-center gap-1.5 ${
                    activeTab === 'resources'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">attachment</span>
                  <span>Resources ({activeLesson.resources?.length || 0})</span>
                </button>
              </div>

              {/* Tab 1: Lecture & Notes */}
              {activeTab === 'content' && (
                <div className="space-y-6">
                  {activeLesson.videoUrl && (
                    <div className="rounded-xl overflow-hidden aspect-video bg-black shadow-md border border-outline-variant/60">
                      <iframe
                        src={activeLesson.videoUrl}
                        title={activeLesson.title}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  )}

                  <div className="prose dark:prose-invert max-w-none text-sm text-on-surface-variant space-y-4">
                    {activeLesson.contentMarkdown?.split('\n\n').map((paragraph, pIdx) => {
                      if (paragraph.startsWith('### ')) {
                        return <h3 key={pIdx} className="text-lg font-bold text-on-surface mt-4">{paragraph.replace('### ', '')}</h3>;
                      }
                      if (paragraph.startsWith('#### ')) {
                        return <h4 key={pIdx} className="text-sm font-bold text-on-surface mt-3">{paragraph.replace('#### ', '')}</h4>;
                      }
                      return <p key={pIdx} className="leading-relaxed">{paragraph}</p>;
                    })}
                  </div>
                </div>
              )}

              {/* Tab 2: Lab & Assignment Submission */}
              {activeTab === 'assignment' && (
                <div className="space-y-6">
                  <div className="p-4 rounded-xl bg-surface-container border border-outline-variant/80">
                    <h4 className="font-bold text-sm text-on-surface mb-1">Lab Deliverable Requirements</h4>
                    <p className="text-xs text-on-surface-variant">
                      Submit your GitHub code repository and live deployment URL for review by {student.mentorName || 'your assigned mentor'}.
                    </p>
                  </div>

                  <form onSubmit={handleSubmitAssignment} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-on-surface mb-1">
                        GitHub Repository URL *
                      </label>
                      <input
                        type="url"
                        placeholder="https://github.com/username/lab-assignment"
                        value={githubUrl}
                        onChange={e => setGithubUrl(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant bg-surface-container font-mono text-xs focus:ring-2 focus:ring-primary focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-on-surface mb-1">
                        Live Deployed URL (Vercel, Render, Netlify, VPS)
                      </label>
                      <input
                        type="url"
                        placeholder="https://my-app.vercel.app"
                        value={liveUrl}
                        onChange={e => setLiveUrl(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant bg-surface-container font-mono text-xs focus:ring-2 focus:ring-primary focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-on-surface mb-1">
                        Notes / Architectural Decisions for Mentor
                      </label>
                      <textarea
                        rows={3}
                        placeholder="Explain your approach, testing checklist, or any challenges faced during implementation..."
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant bg-surface-container text-xs focus:ring-2 focus:ring-primary focus:outline-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3 rounded-xl bg-primary hover:bg-primary/90 active:scale-[0.98] text-on-primary font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined text-base">send</span>
                      <span>{isSubmitting ? 'Submitting Deliverable...' : 'Submit Lab to Faculty Mentor'}</span>
                    </button>
                  </form>

                  {/* Submission History */}
                  {currentSubmissions.length > 0 && (
                    <div className="pt-4 border-t border-outline-variant space-y-3">
                      <h4 className="font-bold text-xs uppercase tracking-wider text-on-surface">Previous Submissions</h4>
                      {currentSubmissions.map(sub => (
                        <div key={sub.id} className="p-3.5 rounded-xl border border-outline-variant/80 bg-surface-container/40 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-on-surface">{sub.taskTitle}</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                              sub.status === 'Passed' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-blue-500/10 text-blue-600'
                            }`}>
                              {sub.status} {sub.grade ? `(${sub.grade}%)` : ''}
                            </span>
                          </div>
                          {sub.mentorFeedback && (
                            <div className="p-2.5 rounded-lg bg-surface-container text-xs text-on-surface-variant border-l-2 border-primary">
                              <span className="font-bold text-on-surface block mb-0.5">Feedback:</span>
                              <p>{sub.mentorFeedback}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tab 3: Resources */}
              {activeTab === 'resources' && (
                <div className="space-y-3">
                  {(!activeLesson.resources || activeLesson.resources.length === 0) ? (
                    <p className="text-xs text-on-surface-variant">No external resource links attached to this lesson.</p>
                  ) : (
                    activeLesson.resources.map((res, rIdx) => (
                      <a
                        key={rIdx}
                        href={res.url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-3.5 rounded-xl border border-outline-variant/80 bg-surface-container/50 hover:bg-surface-container flex items-center justify-between text-xs font-bold text-primary transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-base">link</span>
                          <span>{res.title}</span>
                        </div>
                        <span className="material-symbols-outlined text-sm">open_in_new</span>
                      </a>
                    ))
                  )}
                </div>
              )}

              {/* Bottom Lesson Navigation */}
              <div className="pt-6 border-t border-outline-variant flex items-center justify-between gap-4">
                {prevItem ? (
                  <button
                    onClick={() => {
                      setActiveModuleId(prevItem.module.id);
                      setActiveLessonId(prevItem.lesson.id);
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-on-surface-variant hover:text-primary transition-colors"
                  >
                    <span className="material-symbols-outlined text-base">arrow_back</span>
                    <span>Previous: {prevItem.lesson.title}</span>
                  </button>
                ) : <div />}

                {nextItem && (
                  <button
                    onClick={() => {
                      setActiveModuleId(nextItem.module.id);
                      setActiveLessonId(nextItem.lesson.id);
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline transition-colors"
                  >
                    <span>Next: {nextItem.lesson.title}</span>
                    <span className="material-symbols-outlined text-base">arrow_forward</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="p-12 text-center border border-dashed border-outline-variant rounded-2xl">
              <p className="text-sm font-bold text-on-surface">Please select a lesson from the curriculum</p>
            </div>
          )}
        </div>
      </div>
      {/* Cohort Timetable Modal */}
      {showTimetableModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-inverse-surface/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div 
            className="w-full max-w-2xl bg-surface border border-outline rounded-xl shadow-modal overflow-hidden flex flex-col max-h-[85vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 bg-crisp-black text-white flex justify-between items-center border-b border-outline">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[24px]">calendar_month</span>
                </div>
                <div>
                  <h3 className="font-headline-sm text-base font-bold">Class Timetable &amp; Lecture Schedule</h3>
                  <p className="text-xs text-white/80">Scheduled live classes for your cohort</p>
                </div>
              </div>
              <button
                onClick={() => setShowTimetableModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto">
              {cohortTimetable.length === 0 ? (
                <div className="p-8 text-center text-secondary text-xs">
                  <span className="material-symbols-outlined text-3xl opacity-40 mb-2 block">event_available</span>
                  No timetable slots scheduled yet for your cohort. The Program Officer will update your schedule soon.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {cohortTimetable.map(slot => (
                    <div key={slot.id} className="p-4 rounded-xl bg-surface border border-outline-variant hover:border-primary/50 transition-all space-y-2.5">
                      <div className="flex justify-between items-start gap-1">
                        <span className="px-2 py-0.5 rounded bg-primary-container/30 text-primary text-[11px] font-bold">
                          {slot.dayOfWeek} • {slot.startTime} - {slot.endTime}
                        </span>
                        {slot.attendanceMarked ? (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            Attended
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                            Upcoming
                          </span>
                        )}
                      </div>

                      <div>
                        <h4 className="font-bold text-sm text-on-surface line-clamp-1">{slot.topic}</h4>
                        <p className="text-xs text-secondary mt-0.5">{slot.courseTitle}</p>
                      </div>

                      <div className="pt-2 border-t border-outline-variant/40 space-y-1 text-xs">
                        <div className="flex items-center gap-1.5 text-secondary">
                          <span className="material-symbols-outlined text-[15px] text-primary">person</span>
                          <span>Faculty: <strong className="text-on-surface">{slot.mentorName}</strong></span>
                        </div>

                        {slot.meetingLink ? (
                          <div className="pt-1">
                            <a
                              href={slot.meetingLink}
                              target="_blank"
                              rel="noreferrer"
                              className="h-8 px-3 rounded-lg bg-primary text-on-primary hover:bg-primary/90 text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-xs w-full"
                            >
                              <span className="material-symbols-outlined text-[16px]">videocam</span>
                              <span>Join Live Lecture Room</span>
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
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 bg-surface-bright border-t border-outline-variant flex justify-end">
              <button
                onClick={() => setShowTimetableModal(false)}
                className="h-9 px-4 rounded-lg bg-surface border border-outline-variant hover:bg-surface-container text-xs font-bold transition-colors cursor-pointer"
              >
                Close Timetable
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
