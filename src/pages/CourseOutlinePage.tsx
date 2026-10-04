import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useCRM } from '../context/CRMContext';
import { LMSLesson, CourseDurationTrack } from '../types/crm';

export const CourseOutlinePage: React.FC = () => {
  const { 
    lmsModules, 
    courses, 
    currentUser, 
    markTopicAsTaught, 
    approveTopicByProgramOfficer, 
    openModal,
    showToast
  } = useCRM();

  const isProgramOfficerOrSuperAdmin = currentUser?.role === 'super_admin' || currentUser?.role === 'program_officer';
  const isMentor = currentUser?.role === 'mentor';

  const [activeCourseTitle, setActiveCourseTitle] = useState<string>('Full-Stack Software Engineering');
  const [durationFilter, setDurationFilter] = useState<'All' | CourseDurationTrack>('All');
  const [teachingNotesLesson, setTeachingNotesLesson] = useState<LMSLesson | null>(null);
  const [mentorNotes, setMentorNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [expandedGuidelines, setExpandedGuidelines] = useState<Record<string, boolean>>({});

  // Extract all available courses
  const allCourses = useMemo(() => {
    if (courses && courses.length > 0) return courses;
    // Fallback if courses list is empty
    return [
      {
        id: 'course-se-01',
        code: 'CSE-101',
        title: 'Full-Stack Software Engineering',
        category: 'Software Engineering',
        description: 'Comprehensive software engineering bootcamp covering modern frontend, backend microservices, DevOps, and cloud deployment.',
        durationWeeks: 9,
        durationDays: 60,
        durationTrack: '60-Day Practitioner' as CourseDurationTrack,
        tuitionFee: 350000,
        syllabusModules: ['mod-1', 'mod-2', 'mod-3'],
        leadInstructor: 'Dr. Chidi Okeke',
        enrolledCount: 1,
        status: 'Active' as const,
        rating: 4.9,
        minimumRequiredHours: 40,
        nsqfLevel: 'NSQF Level 4 (National Vocational Certificate)',
        nitdaTrack: 'NITDA 3MTT / NDLEP Software Engineering Track',
        theoryHours: 25,
        practicalHours: 60,
      }
    ];
  }, [courses]);

  // Filter courses by duration if selected
  const filteredCourses = useMemo(() => {
    if (durationFilter === 'All') return allCourses;
    return allCourses.filter(c => c.durationTrack === durationFilter);
  }, [allCourses, durationFilter]);

  const activeCourse = useMemo(() => {
    return filteredCourses.find(c => c.title === activeCourseTitle) || 
      allCourses.find(c => c.title === activeCourseTitle) || 
      filteredCourses[0] || 
      allCourses[0];
  }, [filteredCourses, allCourses, activeCourseTitle]);

  // Active modules for selected course
  const activeCourseModules = useMemo(() => {
    const matched = lmsModules.filter(m => m.courseTitle === activeCourse.title);
    if (matched.length > 0) return matched;

    // Fallback: If no modules match course title yet, provide default structured outline
    return [
      {
        id: `mod-${activeCourse.id}-1`,
        courseTitle: activeCourse.title,
        title: 'Module 1: Core Principles, Architecture & Setup',
        description: `Foundation guidelines and essential tools for ${activeCourse.title}.`,
        order: 1,
        durationTrack: activeCourse.durationTrack || '60-Day Practitioner',
        durationDays: activeCourse.durationDays || 60,
        nsqfLevel: activeCourse.nsqfLevel || 'NSQF Level 4',
        nitdaStandardCode: 'NITDA-MOD-01',
        theoryHours: Math.round((activeCourse.theoryHours || 20) * 0.4),
        practicalHours: Math.round((activeCourse.practicalHours || 50) * 0.4),
        learningGuideline: {
          prerequisites: ['Basic Computing & Logic Fundamentals', 'Terminal Setup'],
          competencyOutcome: `Demonstrate mastery of environment setup and baseline principles in ${activeCourse.category || 'Tech'}.`,
          expectedDeliverables: ['Environment Verification & Repository Setup', 'Sprint Milestone 1 Deliverable'],
          dayRange: 'Days 1 - 15',
          theoryHours: 8,
          practicalHours: 20,
        },
        lessons: [
          {
            id: `les-${activeCourse.id}-1-1`,
            moduleId: `mod-${activeCourse.id}-1`,
            title: `1.1 Foundations & Industry Standards in ${activeCourse.title}`,
            durationMinutes: 45,
            type: 'video' as const,
            dayNumber: 2,
            contentMarkdown: 'Orientation and foundational industry standards.',
            approvalStatus: 'Approved & Published' as const,
            completedByMentor: true,
            completedByMentorName: activeCourse.leadInstructor || 'Lead Faculty',
            completedByMentorAt: '2026-09-12T10:00:00Z',
            approvedByProgramOfficer: true,
            approvedByProgramOfficerName: 'Academic Program Officer',
            approvedAt: '2026-09-12T14:00:00Z',
          },
          {
            id: `les-${activeCourse.id}-1-2`,
            moduleId: `mod-${activeCourse.id}-1`,
            title: '1.2 Practical Implementation Lab & Workspace Configuration',
            durationMinutes: 75,
            type: 'lab' as const,
            dayNumber: 8,
            submissionRequired: true,
            practicalLabTask: 'Complete environment verification checklist and push initial commit',
            contentMarkdown: 'Interactive hands-on lab.',
            approvalStatus: 'Taught (Pending PO Approval)' as const,
            completedByMentor: true,
            completedByMentorName: activeCourse.leadInstructor || 'Lead Faculty',
            completedByMentorAt: '2026-09-18T16:00:00Z',
            completionNotes: 'Class completed workspace setup with 100% test coverage.',
            approvedByProgramOfficer: false,
          }
        ]
      },
      {
        id: `mod-${activeCourse.id}-2`,
        courseTitle: activeCourse.title,
        title: 'Module 2: Advanced Applied Competencies & Capstone Project',
        description: `Applied industry tasks and portfolio project defense for ${activeCourse.title}.`,
        order: 2,
        durationTrack: activeCourse.durationTrack || '60-Day Practitioner',
        durationDays: activeCourse.durationDays || 60,
        nsqfLevel: activeCourse.nsqfLevel || 'NSQF Level 4',
        nitdaStandardCode: 'NITDA-MOD-02',
        theoryHours: Math.round((activeCourse.theoryHours || 20) * 0.6),
        practicalHours: Math.round((activeCourse.practicalHours || 50) * 0.6),
        learningGuideline: {
          prerequisites: ['Module 1 Core Principles'],
          competencyOutcome: 'Build and deploy a verifiable real-world project meeting national competence criteria.',
          expectedDeliverables: ['Live Project Staging URL', 'Technical Defense & Capstone Repository'],
          dayRange: 'Days 16 - 60',
          theoryHours: 12,
          practicalHours: 30,
        },
        lessons: [
          {
            id: `les-${activeCourse.id}-2-1`,
            moduleId: `mod-${activeCourse.id}-2`,
            title: '2.1 Advanced System Architecture & Best Practices',
            durationMinutes: 60,
            type: 'reading' as const,
            dayNumber: 22,
            contentMarkdown: 'Detailed engineering specifications and production hardening.',
            approvalStatus: 'Not Started' as const,
            completedByMentor: false,
            approvedByProgramOfficer: false,
          },
          {
            id: `les-${activeCourse.id}-2-2`,
            moduleId: `mod-${activeCourse.id}-2`,
            title: '2.2 Capstone Project Submission & Mentor Defense',
            durationMinutes: 120,
            type: 'lab' as const,
            dayNumber: 55,
            submissionRequired: true,
            practicalLabTask: 'Deliver final capstone project with live URL and presentation',
            contentMarkdown: 'Final Capstone Project Defense.',
            approvalStatus: 'Not Started' as const,
            completedByMentor: false,
            approvedByProgramOfficer: false,
          }
        ]
      }
    ];
  }, [lmsModules, activeCourse]);

  const toggleGuidelines = (moduleId: string) => {
    setExpandedGuidelines(prev => ({
      ...prev,
      [moduleId]: prev[moduleId] === undefined ? false : !prev[moduleId]
    }));
  };

  const handleMarkTaughtSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teachingNotesLesson) return;

    setIsProcessing(true);
    try {
      await markTopicAsTaught(teachingNotesLesson.id, mentorNotes);
      showToast('Syllabus Progress Saved', `Topic marked as taught and recorded in the statutory NBTE logbook.`, 'success');
      setTeachingNotesLesson(null);
      setMentorNotes('');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApprove = async (lessonId: string) => {
    setIsProcessing(true);
    try {
      await approveTopicByProgramOfficer(lessonId, activeCourse.title);
      showToast('Accreditation Verified', 'Topic approved and synchronized with student classroom transcripts.', 'success');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApproveAllPending = async (moduleId: string) => {
    const mod = activeCourseModules.find(m => m.id === moduleId);
    if (!mod) return;
    const pendingLessons = mod.lessons.filter(l => l.approvalStatus === 'Taught (Pending PO Approval)');
    if (pendingLessons.length === 0) return;

    setIsProcessing(true);
    try {
      for (const lesson of pendingLessons) {
        await approveTopicByProgramOfficer(lesson.id, activeCourse.title);
      }
      showToast('Module Accredited', `${pendingLessons.length} topics confirmed and published by Program Officer.`, 'success');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-stack-lg max-w-7xl mx-auto pb-16">
      {/* Breadcrumb & Navigation */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-2 text-xs text-secondary">
          <Link to="/" className="hover:text-primary transition-colors">Dashboard</Link>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <Link to="/mentors" className="hover:text-primary transition-colors">Mentors &amp; Sessions</Link>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span className="font-bold text-on-surface">Course Outlines &amp; Guidelines</span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Link
            to="/mentors"
            className="h-8 px-3 rounded bg-surface border border-outline-variant hover:border-primary text-secondary hover:text-on-surface text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <span className="material-symbols-outlined text-[16px]">groups</span>
            <span>Faculty Overview</span>
          </Link>
          <Link
            to="/mentors/office-hours"
            className="h-8 px-3 rounded bg-surface border border-outline-variant hover:border-primary text-secondary hover:text-on-surface text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <span className="material-symbols-outlined text-[16px]">schedule</span>
            <span>Office Hours &amp; Slots</span>
          </Link>
          <Link
            to="/mentors/grading"
            className="h-8 px-3 rounded bg-surface border border-outline-variant hover:border-primary text-secondary hover:text-on-surface text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <span className="material-symbols-outlined text-[16px]">fact_check</span>
            <span>Grading Inbox</span>
          </Link>
        </div>
      </div>

      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shadow-xs">
              <span className="material-symbols-outlined text-[26px]">account_tree</span>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-headline-md text-headline-md font-bold text-on-surface">
                  NBTE &amp; NITDA Course Outlines &amp; Learning Guidelines
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  NBTE / NSQF Aligned
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200">
                  NITDA 3MTT Framework
                </span>
              </div>
              <p className="text-secondary font-body-sm text-body-sm mt-0.5">
                Curriculum syllabus breakdown, weekly learning guidelines, statutory teaching logbook, and Program Officer accreditation sign-off.
              </p>
            </div>
          </div>
        </div>

        {/* 3-Way Handshake Guide Pill */}
        <div className="hidden lg:flex items-center gap-2 bg-surface border border-outline-variant rounded-xl p-2.5 shadow-xs text-xs">
          <span className="font-bold text-on-surface">Workflow:</span>
          <span className="px-2 py-0.5 rounded bg-surface-container text-secondary">1. PO Guidelines</span>
          <span className="material-symbols-outlined text-[12px] text-secondary">arrow_forward</span>
          <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 font-medium border border-amber-200">2. Mentor Log</span>
          <span className="material-symbols-outlined text-[12px] text-secondary">arrow_forward</span>
          <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-medium border border-emerald-200">3. PO Accredit &amp; Publish</span>
        </div>
      </div>

      {/* Duration Track Filter Bar */}
      <div className="bg-surface border border-outline-variant rounded-xl p-3 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-secondary text-xs uppercase tracking-wider">Duration Track:</span>
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

        <div className="flex items-center gap-2 text-xs text-secondary">
          <span>Displaying <strong>{filteredCourses.length}</strong> accredited track{filteredCourses.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Course Selection Horizontal Tabs */}
      {filteredCourses.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {filteredCourses.map(course => {
            const isSelected = activeCourse.title === course.title;
            const durationBadge = course.durationTrack || (course.durationDays ? `${course.durationDays}-Day Track` : '60-Day Practitioner');

            return (
              <button
                key={course.id || course.title}
                onClick={() => setActiveCourseTitle(course.title)}
                className={`p-3.5 rounded-xl border transition-all text-left min-w-[240px] shrink-0 cursor-pointer shadow-xs ${
                  isSelected
                    ? 'bg-primary/5 border-primary text-primary shadow-sm'
                    : 'bg-surface border-outline-variant hover:border-primary/40 text-secondary hover:text-on-surface'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    isSelected ? 'bg-primary text-on-primary' : 'bg-surface-container text-secondary'
                  }`}>
                    {durationBadge}
                  </span>
                  <span className="font-mono text-[10px] text-secondary">{course.code || 'CSE'}</span>
                </div>
                <h4 className="font-bold text-xs text-on-surface line-clamp-1">{course.title}</h4>
                <p className="text-[11px] text-secondary mt-0.5">
                  {course.theoryHours || 20}h Theory &bull; {course.practicalHours || 50}h Labs (70%)
                </p>
              </button>
            );
          })}
        </div>
      )}

      {/* Selected Course Specifications Card */}
      <div className="p-5 rounded-2xl bg-surface border border-outline-variant shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-lg text-on-surface">{activeCourse.title}</h3>
              <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-bold">
                {activeCourse.durationTrack || '60-Day Practitioner'} ({activeCourse.durationDays || 60} Days)
              </span>
              <span className="px-2 py-0.5 rounded bg-surface-container text-secondary text-xs font-mono">
                Code: {activeCourse.code || 'CSE-101'}
              </span>
            </div>
            <p className="text-xs text-secondary max-w-3xl leading-relaxed">
              {activeCourse.description || 'Comprehensive modular curriculum aligned with NBTE and NITDA competency frameworks.'}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isProgramOfficerOrSuperAdmin && (
              <button
                type="button"
                onClick={() => openModal('schedule-class')}
                className="h-9 px-3.5 rounded-xl bg-primary text-on-primary hover:bg-primary/90 text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">add_alarm</span>
                <span>Schedule Timetable Slot</span>
              </button>
            )}
          </div>
        </div>

        {/* 4-Pill Contact Hours & Competency Matrix */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-outline-variant/60 text-xs">
          <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/60">
            <span className="text-[10px] text-secondary font-medium block">Accreditation Level</span>
            <span className="font-bold text-on-surface text-xs mt-0.5 block">
              {activeCourse.nsqfLevel || 'NSQF Level 4'}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/60">
            <span className="text-[10px] text-secondary font-medium block">Theory vs Practical Split</span>
            <span className="font-bold text-emerald-700 text-xs mt-0.5 block">
              {activeCourse.theoryHours || 25}h Theory / {activeCourse.practicalHours || 60}h Labs (70%)
            </span>
          </div>

          <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/60">
            <span className="text-[10px] text-secondary font-medium block">Min. Graduation Attendance</span>
            <span className="font-bold text-on-surface text-xs mt-0.5 block">
              {activeCourse.minimumRequiredHours || 40} Contact Hours
            </span>
          </div>

          <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/60">
            <span className="text-[10px] text-secondary font-medium block">Lead Faculty Mentor</span>
            <span className="font-bold text-primary text-xs mt-0.5 block">
              {activeCourse.leadInstructor || 'Faculty Team'}
            </span>
          </div>
        </div>
      </div>

      {/* Modules List with Interactive Learning Guidelines & Syllabus Topics */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm uppercase tracking-wider text-secondary flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[18px]">menu_book</span>
            <span>Course Syllabus Modules &amp; Topics ({activeCourseModules.length} Modules)</span>
          </h3>

          <span className="text-xs text-secondary">
            {activeCourseModules.reduce((acc, m) => acc + m.lessons.length, 0)} Total Syllabus Lessons
          </span>
        </div>

        {activeCourseModules.map((mod) => {
          const isGuidelinesOpen = expandedGuidelines[mod.id] !== false;
          const pendingCount = mod.lessons.filter(l => l.approvalStatus === 'Taught (Pending PO Approval)').length;
          const approvedCount = mod.lessons.filter(l => l.approvalStatus === 'Approved & Published').length;

          return (
            <div 
              key={mod.id} 
              className="border border-outline-variant rounded-2xl overflow-hidden bg-surface shadow-xs space-y-0"
            >
              {/* Module Header Bar */}
              <div className="px-5 py-4 bg-surface-container-low border-b border-outline-variant flex items-center justify-between flex-wrap gap-3">
                <div className="space-y-1 max-w-2xl">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-primary-container/40 text-primary">
                      Module {mod.order}
                    </span>
                    <h4 className="font-bold text-sm text-on-surface">{mod.title}</h4>
                    {mod.learningGuideline?.dayRange && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[10px] font-bold border border-amber-200">
                        ⏱️ {mod.learningGuideline.dayRange}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-secondary">{mod.description}</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => toggleGuidelines(mod.id)}
                    className="px-3 py-1.5 rounded-lg bg-surface border border-outline-variant hover:border-primary text-secondary hover:text-on-surface text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                    title="Toggle NBTE learning guidelines and expected code deliverables"
                  >
                    <span className="material-symbols-outlined text-[15px] text-primary">auto_stories</span>
                    <span>{isGuidelinesOpen ? 'Hide Guidelines' : 'Learning Guidelines'}</span>
                  </button>

                  {isProgramOfficerOrSuperAdmin && pendingCount > 0 && (
                    <button
                      type="button"
                      onClick={() => handleApproveAllPending(mod.id)}
                      disabled={isProcessing}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      title="Approve all taught topics in this module"
                    >
                      <span className="material-symbols-outlined text-[16px]">done_all</span>
                      <span>Approve Module ({pendingCount})</span>
                    </button>
                  )}

                  <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-surface-container text-secondary">
                    {approvedCount}/{mod.lessons.length} Accredited
                  </span>
                </div>
              </div>

              {/* NBTE / NITDA Learning Guidelines Panel */}
              {isGuidelinesOpen && mod.learningGuideline && (
                <div className="p-5 bg-primary/5 border-b border-outline-variant/60 text-xs space-y-3.5 animate-in fade-in duration-150">
                  <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
                    <span className="material-symbols-outlined text-[18px]">verified</span>
                    <span>NBTE / NITDA Competency &amp; Learning Guidelines</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <p className="font-semibold text-on-surface text-xs">🎯 Target Competency Outcome:</p>
                      <div className="text-secondary text-xs leading-relaxed bg-surface p-3 rounded-xl border border-outline-variant/60">
                        {mod.learningGuideline.competencyOutcome}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <p className="font-semibold text-on-surface text-xs">📦 Expected Practical Lab Deliverables (70%):</p>
                      <div className="bg-surface p-3 rounded-xl border border-outline-variant/60 space-y-1.5">
                        {mod.learningGuideline.expectedDeliverables.map((deliv, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-secondary text-xs">
                            <span className="text-emerald-600 font-bold">✓</span>
                            <span>{deliv}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {mod.learningGuideline.prerequisites && mod.learningGuideline.prerequisites.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap pt-1">
                      <span className="font-semibold text-xs text-secondary">Prerequisites:</span>
                      {mod.learningGuideline.prerequisites.map((pre, idx) => (
                        <span key={idx} className="px-2.5 py-0.5 rounded-full bg-surface border border-outline-variant/60 text-[11px] text-secondary font-medium">
                          {pre}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Lessons / Topics List */}
              <div className="divide-y divide-outline-variant/50">
                {mod.lessons.map((lesson) => {
                  const status = lesson.approvalStatus || 'Not Started';
                  const isApproved = status === 'Approved & Published';
                  const isPendingApproval = status === 'Taught (Pending PO Approval)';

                  return (
                    <div 
                      key={lesson.id}
                      className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-surface-container-low/40 transition-colors"
                    >
                      <div className="space-y-1.5 max-w-2xl">
                        <div className="flex items-center gap-2 flex-wrap">
                          {lesson.dayNumber && (
                            <span className="px-2.5 py-0.5 rounded bg-secondary-container text-on-secondary-container font-mono text-[11px] font-bold">
                              Day {lesson.dayNumber}
                            </span>
                          )}
                          <span className="font-bold text-sm text-on-surface">
                            {lesson.title}
                          </span>
                          <span className="text-xs text-secondary font-mono">
                            ({lesson.durationMinutes} mins &bull; {lesson.type.toUpperCase()})
                          </span>

                          {/* Code Lab Deliverable Badge */}
                          {lesson.submissionRequired && (
                            <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 text-[10px] font-bold border border-purple-200">
                              💻 Code Lab Deliverable
                            </span>
                          )}

                          {/* Approval Status Badge */}
                          {isApproved && (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                              <span className="material-symbols-outlined text-[13px]">verified</span>
                              Approved &amp; Published
                            </span>
                          )}
                          {isPendingApproval && (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1 animate-pulse">
                              <span className="material-symbols-outlined text-[13px]">pending</span>
                              Taught (Pending PO Sign-off)
                            </span>
                          )}
                          {!isApproved && !isPendingApproval && (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-surface-container text-secondary">
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

                        {/* Completion Metadata / Teaching Logbook */}
                        {lesson.completedByMentor && (
                          <div className="text-xs text-secondary flex items-center gap-2 flex-wrap">
                            <span>Taught by: <strong className="text-on-surface">{lesson.completedByMentorName}</strong></span>
                            {lesson.completedByMentorAt && (
                              <span>on {new Date(lesson.completedByMentorAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                            )}
                            {lesson.completionNotes && (
                              <span className="italic">&ldquo;{lesson.completionNotes}&rdquo;</span>
                            )}
                          </div>
                        )}

                        {lesson.approvedByProgramOfficer && (
                          <div className="text-xs text-emerald-700 flex items-center gap-1 font-medium">
                            <span className="material-symbols-outlined text-[15px]">verified</span>
                            <span>Accredited &amp; signed off by {lesson.approvedByProgramOfficerName} (Students' syllabus synchronized)</span>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 shrink-0">
                        {/* Mentor Action: Mark as Taught */}
                        {isMentor && !lesson.completedByMentor && (
                          <button
                            type="button"
                            onClick={() => setTeachingNotesLesson(lesson)}
                            className="px-3.5 py-1.5 rounded-lg bg-primary text-on-primary font-bold text-xs hover:bg-primary/90 flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[16px]">check</span>
                            <span>Mark Taught</span>
                          </button>
                        )}

                        {/* PO / Super Admin Action: Confirm & Publish */}
                        {isProgramOfficerOrSuperAdmin && isPendingApproval && (
                          <button
                            type="button"
                            onClick={() => handleApprove(lesson.id)}
                            disabled={isProcessing}
                            className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all disabled:opacity-50 cursor-pointer"
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
        })}
      </div>

      {/* Teaching Notes & Classroom Completion Modal */}
      {teachingNotesLesson && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-inverse-surface/70 backdrop-blur-xs">
          <div className="bg-surface-container-lowest rounded-2xl max-w-lg w-full border border-outline-variant p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-outline-variant pb-3">
              <h3 className="font-bold text-sm text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">assignment_turned_in</span>
                <span>Log Topic Completion: {teachingNotesLesson.title}</span>
              </h3>
              <button
                onClick={() => setTeachingNotesLesson(null)}
                className="text-secondary hover:text-on-surface p-1 rounded hover:bg-surface-container"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <form onSubmit={handleMarkTaughtSubmit} className="space-y-3.5">
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
                  className="w-full p-3 bg-surface border border-outline-variant rounded-xl text-xs text-on-surface outline-none focus:border-primary"
                />
              </div>

              <div className="p-3 bg-surface-container-low rounded-xl border border-outline-variant/60 text-xs text-secondary space-y-1">
                <p className="font-bold text-on-surface">📋 Statutory Logbook Record:</p>
                <p>This entry will be recorded in the institutional syllabus log and submitted for Program Officer verification.</p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setTeachingNotesLesson(null)}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-secondary hover:text-on-surface"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="px-4 py-1.5 rounded-lg bg-primary text-on-primary text-xs font-bold hover:bg-primary/90 shadow-xs cursor-pointer disabled:opacity-50"
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
