import React, { useState, useMemo } from 'react';
import { useCRM, formatNaira } from '../context/CRMContext';
import { LMSLesson } from '../types/crm';

export const CoursesCohortsPage: React.FC = () => {
  const {
    courses,
    cohorts,
    timetables,
    lmsModules,
    mentors,
    settings,
    deleteTimetableSlot,
    approveTopicByProgramOfficer,
    setSelectedSlotForAttendance,
    openModal,
    globalSearch,
    setSelectedCourseForEditId,
    currentUser,
    hasFeaturePermission,
  } = useCRM();

  const [activeTab, setActiveTab] = useState<'programs' | 'cohorts' | 'timetables' | 'approvals' | 'faculty-tracker'>('programs');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDayFilter, setSelectedDayFilter] = useState<string>('All');
  const [approvingLessonId, setApprovingLessonId] = useState<string | null>(null);

  const effectiveSearch = globalSearch || searchQuery;

  const categories = ['All', 'Software Engineering', 'Data Science', 'Product Design', 'Cloud Engineering'];
  const daysOfWeek = ['All', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const canManageCourses =
    currentUser?.role === 'super_admin' ||
    currentUser?.role === 'program_officer' ||
    currentUser?.role === 'admissions' ||
    hasFeaturePermission('canAddCourses');

  const canManageCohorts =
    currentUser?.role === 'super_admin' ||
    currentUser?.role === 'program_officer' ||
    currentUser?.role === 'admissions' ||
    hasFeaturePermission('canAddCohorts');

  const canScheduleClasses =
    currentUser?.role === 'super_admin' ||
    currentUser?.role === 'program_officer' ||
    hasFeaturePermission('canScheduleClasses');

  const canApproveTopics =
    currentUser?.role === 'super_admin' ||
    currentUser?.role === 'program_officer' ||
    hasFeaturePermission('canApproveTopics');

  // Pending approval lessons for Program Officer / Super Admin
  const pendingApprovalLessons = useMemo(() => {
    const list: { lesson: LMSLesson; moduleId: string; moduleTitle: string; courseTitle: string }[] = [];
    (lmsModules || []).forEach(mod => {
      (mod.lessons || []).forEach(les => {
        if (les.approvalStatus === 'Taught (Pending PO Approval)' || (les.completedByMentor && !les.approvedByProgramOfficer)) {
          list.push({
            lesson: les,
            moduleId: mod.id,
            moduleTitle: mod.title,
            courseTitle: mod.courseTitle || 'Curriculum Course',
          });
        }
      });
    });
    return list;
  }, [lmsModules]);

  // Approved topics history
  const approvedLessons = useMemo(() => {
    const list: { lesson: LMSLesson; moduleId: string; moduleTitle: string; courseTitle: string }[] = [];
    (lmsModules || []).forEach(mod => {
      (mod.lessons || []).forEach(les => {
        if (les.approvalStatus === 'Approved & Published' || les.approvedByProgramOfficer) {
          list.push({
            lesson: les,
            moduleId: mod.id,
            moduleTitle: mod.title,
            courseTitle: mod.courseTitle || 'Curriculum Course',
          });
        }
      });
    });
    return list;
  }, [lmsModules]);

  const filteredCourses = useMemo(() => {
    return courses.filter(c => {
      const matchesCat = selectedCategory === 'All' || c.category === selectedCategory;
      const matchesSearch =
        c.title.toLowerCase().includes(effectiveSearch.toLowerCase()) ||
        c.code.toLowerCase().includes(effectiveSearch.toLowerCase()) ||
        c.leadInstructor.toLowerCase().includes(effectiveSearch.toLowerCase());
      return matchesCat && matchesSearch;
    });
  }, [courses, selectedCategory, effectiveSearch]);

  const filteredCohorts = useMemo(() => {
    return cohorts.filter(coh => {
      return (
        coh.name.toLowerCase().includes(effectiveSearch.toLowerCase()) ||
        coh.cohortCode.toLowerCase().includes(effectiveSearch.toLowerCase()) ||
        coh.programName.toLowerCase().includes(effectiveSearch.toLowerCase()) ||
        coh.instructorName.toLowerCase().includes(effectiveSearch.toLowerCase())
      );
    });
  }, [cohorts, effectiveSearch]);

  const filteredTimetables = useMemo(() => {
    return (timetables || []).filter(slot => {
      const matchesDay = selectedDayFilter === 'All' || slot.dayOfWeek === selectedDayFilter;
      const q = effectiveSearch.toLowerCase();
      const venueOrLink = (slot.venue || slot.meetingLink || '').toLowerCase();
      const matchesSearch =
        !q ||
        slot.courseTitle.toLowerCase().includes(q) ||
        slot.cohortName.toLowerCase().includes(q) ||
        slot.mentorName.toLowerCase().includes(q) ||
        slot.topic.toLowerCase().includes(q) ||
        venueOrLink.includes(q);
      return matchesDay && matchesSearch;
    });
  }, [timetables, selectedDayFilter, effectiveSearch]);

  // Faculty eligibility metrics
  const minRequiredHours = settings.mentorMinimumLecturedHours || 20;
  const eligibleFacultyCount = useMemo(() => {
    return mentors.filter(m => (m.lecturedHours || 0) >= (m.minimumRequiredHours || minRequiredHours)).length;
  }, [mentors, minRequiredHours]);

  const handleApproveTopic = async (lessonId: string) => {
    setApprovingLessonId(lessonId);
    try {
      await approveTopicByProgramOfficer(lessonId);
    } finally {
      setApprovingLessonId(null);
    }
  };

  return (
    <div className="space-y-stack-lg animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex justify-between items-end flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="font-headline-lg text-headline-lg font-bold text-on-surface">Programs, Timetables &amp; Governance</h2>
            {currentUser?.role === 'program_officer' && (
              <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-xs font-bold border border-blue-200">
                Program Officer Workspace
              </span>
            )}
          </div>
          <p className="font-body-md text-body-md text-secondary">
            Coordinate curriculum tracks, schedule course timetables, oversee faculty lecturing hours, and approve syllabus milestones.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {/* Course Outline Modal Trigger */}
          <button
            onClick={() => openModal('course-outline')}
            className="btn-secondary text-xs h-10 px-3.5"
            title="Create and Manage Course Outlines & Topic Modules"
          >
            <span className="material-symbols-outlined text-primary text-[18px]">account_tree</span>
            <span>Course Outlines</span>
          </button>

          {/* Schedule Class Modal Trigger */}
          {canScheduleClasses && (
            <button
              onClick={() => openModal('schedule-class')}
              className="btn-primary text-xs h-10 px-4"
            >
              <span className="material-symbols-outlined text-[18px]">calendar_add_on</span>
              <span>+ Schedule Class</span>
            </button>
          )}

          {canManageCourses && (
            <button
              onClick={() => openModal('create-course')}
              className="btn-secondary text-xs h-10 px-3.5"
            >
              <span className="material-symbols-outlined text-primary text-[18px]">library_add</span>
              <span>+ Academic Track</span>
            </button>
          )}

          {canManageCohorts && (
            <button
              onClick={() => openModal('create-cohort')}
              className="btn-secondary text-xs h-10 px-3.5"
            >
              <span className="material-symbols-outlined text-primary text-[18px]">add_circle</span>
              <span>+ Launch Cohort</span>
            </button>
          )}
        </div>
      </div>

      {/* 4 Academic Summary Bento Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter">
        <div className="bg-surface-container-lowest p-stack-md border border-outline-variant rounded-lg shadow-xs">
          <div className="flex justify-between items-start mb-stack-md">
            <div className="w-10 h-10 rounded bg-primary-container flex items-center justify-center text-on-primary">
              <span className="material-symbols-outlined">menu_book</span>
            </div>
            <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-1 rounded">Catalog</span>
          </div>
          <p className="font-body-sm text-body-sm text-secondary mb-unit">Academic Programs</p>
          <h3 className="font-display text-display font-bold text-on-surface">{courses.length} Tracks</h3>
        </div>

        <div className="bg-surface-container-lowest p-stack-md border border-outline-variant rounded-lg shadow-xs">
          <div className="flex justify-between items-start mb-stack-md">
            <div className="w-10 h-10 rounded bg-secondary-container flex items-center justify-center text-primary">
              <span className="material-symbols-outlined">calendar_month</span>
            </div>
            <span className="text-xs font-bold text-primary bg-secondary-container px-2 py-1 rounded">Live</span>
          </div>
          <p className="font-body-sm text-body-sm text-secondary mb-unit">Timetable Slots</p>
          <h3 className="font-display text-display font-bold text-on-surface">{(timetables || []).length} Scheduled</h3>
        </div>

        <div className="bg-surface-container-lowest p-stack-md border border-outline-variant rounded-lg shadow-xs">
          <div className="flex justify-between items-start mb-stack-md">
            <div className="w-10 h-10 rounded bg-amber-100 text-amber-800 flex items-center justify-center">
              <span className="material-symbols-outlined">verified</span>
            </div>
            <span className={`text-xs font-bold px-2 py-1 rounded ${
              pendingApprovalLessons.length > 0 ? 'bg-amber-100 text-amber-800 animate-pulse' : 'bg-slate-100 text-slate-600'
            }`}>
              {pendingApprovalLessons.length > 0 ? 'Action Needed' : 'Up to Date'}
            </span>
          </div>
          <p className="font-body-sm text-body-sm text-secondary mb-unit">Topics Pending PO Approval</p>
          <h3 className="font-display text-display font-bold text-on-surface">{pendingApprovalLessons.length} Awaiting</h3>
        </div>

        <div className="bg-surface-container-lowest p-stack-md border border-outline-variant rounded-lg shadow-xs">
          <div className="flex justify-between items-start mb-stack-md">
            <div className="w-10 h-10 rounded bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <span className="material-symbols-outlined">payments</span>
            </div>
            <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-1 rounded font-data-tabular">
              {minRequiredHours}h Min
            </span>
          </div>
          <p className="font-body-sm text-body-sm text-secondary mb-unit">Faculty Payout Eligible</p>
          <h3 className="font-display text-display font-bold text-on-surface">
            {eligibleFacultyCount} / {mentors.length} Faculty
          </h3>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-lg overflow-hidden shadow-xs">
        {/* Navigation Tabs & Search Controls */}
        <div className="p-stack-md border-b border-outline-variant flex justify-between items-center bg-surface-bright flex-wrap gap-4">
          {/* Tab Switcher */}
          <div className="flex border border-outline rounded-lg p-1 bg-canvas overflow-x-auto gap-1">
            <button
              onClick={() => setActiveTab('programs')}
              className={`px-3.5 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'programs'
                  ? 'bg-primary text-white'
                  : 'text-secondary hover:text-crisp-black'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">school</span>
              <span>Programs ({courses.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('cohorts')}
              className={`px-3.5 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'cohorts'
                  ? 'bg-primary text-white'
                  : 'text-secondary hover:text-crisp-black'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">groups</span>
              <span>Cohorts ({cohorts.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('timetables')}
              className={`px-3.5 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'timetables'
                  ? 'bg-primary text-white'
                  : 'text-secondary hover:text-crisp-black'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">calendar_month</span>
              <span>Timetable &amp; Schedules ({(timetables || []).length})</span>
            </button>

            <button
              onClick={() => setActiveTab('approvals')}
              className={`px-3.5 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'approvals'
                  ? 'bg-primary text-white'
                  : 'text-secondary hover:text-crisp-black'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">fact_check</span>
              <span>Syllabus Approvals</span>
              {pendingApprovalLessons.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-lemon-curry text-white text-[10px] font-bold">
                  {pendingApprovalLessons.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('faculty-tracker')}
              className={`px-3.5 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'faculty-tracker'
                  ? 'bg-primary text-white'
                  : 'text-secondary hover:text-crisp-black'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">timer</span>
              <span>Faculty Hours &amp; Payout</span>
            </button>
          </div>

          {/* Search Filter */}
          <div className="relative w-64">
            <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-outline text-[18px]">search</span>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search programs, slots, faculty..."
              className="w-full h-9 pl-8 pr-3 rounded bg-surface border border-outline-variant text-xs focus:border-primary outline-none"
            />
          </div>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: ACADEMIC PROGRAMS CATALOG */}
        {/* ========================================================================= */}
        {activeTab === 'programs' && (
          <div className="p-stack-md space-y-stack-md">
            {/* Category Pills */}
            <div className="flex gap-2 overflow-x-auto pb-1">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-primary text-on-primary border-primary shadow-xs'
                      : 'bg-surface border-outline-variant text-secondary hover:border-primary/50'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Courses Grid */}
            {filteredCourses.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center justify-center space-y-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-[28px]">menu_book</span>
                </div>
                <div className="max-w-sm space-y-1">
                  <h3 className="font-bold text-sm text-on-surface">No Academic Programs Found</h3>
                  <p className="text-xs text-secondary">
                    Your curriculum catalog is clean. Add your training programs, define tuition fees in ₦, and configure module syllabi.
                  </p>
                </div>
                {canManageCourses && (
                  <button
                    onClick={() => openModal('create-course')}
                    className="px-4 h-9 rounded-lg bg-primary text-on-primary text-xs font-bold hover:bg-primary/90 flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <span className="material-symbols-outlined text-[16px]">library_add</span>
                    <span>+ Add First Academic Program</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-stack-md">
                {filteredCourses.map(course => (
                  <div
                    key={course.id}
                    className="bg-surface rounded-lg border border-outline-variant p-stack-md flex flex-col justify-between hover:border-primary/60 transition-all shadow-xs"
                  >
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-data-tabular text-xs font-bold text-primary px-2 py-0.5 rounded bg-primary-container/20">
                            #{course.code}
                          </span>
                          <span className="text-xs font-semibold text-secondary">{course.category}</span>
                        </div>
                        <span className="flex items-center gap-1 text-xs font-bold text-primary bg-secondary-container px-2 py-0.5 rounded font-data-tabular">
                          <span className="material-symbols-outlined text-[14px]">schedule</span>
                          {course.durationWeeks} Weeks
                        </span>
                      </div>

                      <h4 className="font-headline-md text-base font-bold text-on-surface mb-1">
                        {course.title}
                      </h4>
                      <p className="font-body-sm text-xs text-secondary mb-3 leading-relaxed">
                        {course.description}
                      </p>

                      {/* Syllabus Modules */}
                      <div className="space-y-1.5 mb-4">
                        <div className="flex justify-between items-center">
                          <p className="font-label-md text-xs text-secondary font-semibold uppercase tracking-wider">Curriculum Modules</p>
                          <button
                            onClick={() => openModal('course-outline')}
                            className="text-[11px] text-primary font-bold hover:underline flex items-center gap-0.5 cursor-pointer"
                          >
                            <span>Open Outline</span>
                            <span className="material-symbols-outlined text-[13px]">chevron_right</span>
                          </button>
                        </div>
                        <ul className="space-y-1">
                          {(course.syllabusModules || []).map((mod, idx) => (
                            <li key={idx} className="flex items-center gap-2 text-xs text-on-surface">
                              <span className="material-symbols-outlined text-primary text-[14px]">check_circle</span>
                              <span>{mod}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-outline-variant flex justify-between items-center mt-2">
                      <div>
                        <p className="font-body-sm text-[11px] text-secondary">Standard Tuition (₦)</p>
                        <p className="font-data-tabular font-bold text-base text-primary">
                          {formatNaira(course.tuitionFee)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {canManageCourses && (
                          <button
                            onClick={() => {
                              setSelectedCourseForEditId(course.id);
                              openModal('edit-course');
                            }}
                            className="px-2.5 py-1 rounded border border-outline-variant hover:border-primary text-secondary hover:text-primary font-label-md text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                            title="Edit Course Curriculum"
                          >
                            <span className="material-symbols-outlined text-[14px]">edit</span>
                            <span>Edit Track</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: COHORTS SCHEDULES TABLE */}
        {/* ========================================================================= */}
        {activeTab === 'cohorts' && (
          <div className="overflow-x-auto">
            {filteredCohorts.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center justify-center space-y-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-[28px]">event_note</span>
                </div>
                <div className="max-w-sm space-y-1">
                  <h3 className="font-bold text-sm text-on-surface">No Cohorts Scheduled</h3>
                  <p className="text-xs text-secondary">
                    Launch upcoming student cohort admissions windows, assign instructors, and set student capacity limits.
                  </p>
                </div>
                {canManageCohorts && (
                  <button
                    onClick={() => openModal('create-cohort')}
                    className="px-4 h-9 rounded-lg bg-primary text-on-primary text-xs font-bold hover:bg-primary/90 flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <span className="material-symbols-outlined text-[16px]">add_circle</span>
                    <span>+ Launch New Cohort</span>
                  </button>
                )}
              </div>
            ) : (
              <table className="w-full text-left border-collapse min-w-[700px] text-xs">
                <thead>
                  <tr className="border-b border-outline-variant bg-surface-container-low text-secondary font-label-md">
                    <th className="px-stack-md py-3 font-semibold">Cohort Code</th>
                    <th className="px-stack-md py-3 font-semibold">Cohort Name</th>
                    <th className="px-stack-md py-3 font-semibold">Program Track</th>
                    <th className="px-stack-md py-3 font-semibold">Duration Dates</th>
                    <th className="px-stack-md py-3 font-semibold">Lead Instructor</th>
                    <th className="px-stack-md py-3 font-semibold">Capacity</th>
                    <th className="px-stack-md py-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="font-data-tabular text-on-surface divide-y divide-outline-variant/50">
                  {filteredCohorts.map((coh, index) => {
                    const percent = coh.maxCapacity > 0 ? Math.round((coh.enrolledCount / coh.maxCapacity) * 100) : 0;
                    return (
                      <tr
                        key={coh.id}
                        className={`hover:bg-surface-bright transition-colors ${index % 2 === 1 ? 'bg-surface-container-low/30' : ''}`}
                      >
                        <td className="px-stack-md py-3 font-data-tabular font-bold text-primary text-xs">
                          #{coh.cohortCode}
                        </td>
                        <td className="px-stack-md py-3 font-semibold text-on-surface text-sm">
                          {coh.name}
                        </td>
                        <td className="px-stack-md py-3 text-secondary text-xs">
                          {coh.programName}
                        </td>
                        <td className="px-stack-md py-3 text-secondary text-xs">
                          {coh.startDate} ➔ {coh.endDate}
                        </td>
                        <td className="px-stack-md py-3 text-on-surface text-xs font-medium">
                          {coh.instructorName}
                        </td>
                        <td className="px-stack-md py-3">
                          <div className="w-32">
                            <div className="flex justify-between text-[11px] mb-1">
                              <span className="font-semibold">{coh.enrolledCount}/{coh.maxCapacity}</span>
                              <span className="text-secondary">{percent}%</span>
                            </div>
                            <div className="w-full bg-surface-container-high rounded-full h-1.5 overflow-hidden">
                              <div
                                className={`h-1.5 rounded-full ${percent >= 90 ? 'bg-error' : 'bg-primary'}`}
                                style={{ width: `${percent}%` }}
                              ></div>
                            </div>
                          </div>
                        </td>
                        <td className="px-stack-md py-3">
                          <span
                            className={`px-2 py-1 rounded text-[11px] font-bold uppercase tracking-wider inline-block ${
                              coh.status === 'In Progress'
                                ? 'bg-emerald-100 text-emerald-800'
                                : coh.status === 'Upcoming'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-surface-container text-secondary'
                            }`}
                          >
                            {coh.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: TIMETABLE & CLASS SCHEDULES */}
        {/* ========================================================================= */}
        {activeTab === 'timetables' && (
          <div className="p-stack-md space-y-4">
            {/* Sub-header & Filter Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-outline-variant/60 pb-3">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                {daysOfWeek.map(day => (
                  <button
                    key={day}
                    onClick={() => setSelectedDayFilter(day)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                      selectedDayFilter === day
                        ? 'bg-primary text-on-primary shadow-xs'
                        : 'bg-surface text-secondary hover:text-on-surface hover:bg-surface-container border border-outline-variant/60'
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>

              {canScheduleClasses && (
                <button
                  onClick={() => openModal('schedule-class')}
                  className="h-8 px-3.5 bg-primary text-on-primary rounded text-xs font-bold hover:bg-primary/90 transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <span className="material-symbols-outlined text-[15px]">add</span>
                  <span>Schedule Lecture</span>
                </button>
              )}
            </div>

            {/* Timetable List */}
            {filteredTimetables.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center justify-center space-y-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-[28px]">calendar_today</span>
                </div>
                <div className="max-w-sm space-y-1">
                  <h3 className="font-bold text-sm text-on-surface">No Classes Scheduled</h3>
                  <p className="text-xs text-secondary">
                    {selectedDayFilter === 'All'
                      ? 'No lecture timetable slots created yet. Program Officers can schedule classes and assign faculty.'
                      : `No classes scheduled on ${selectedDayFilter}.`}
                  </p>
                </div>
                {canScheduleClasses && (
                  <button
                    onClick={() => openModal('schedule-class')}
                    className="px-4 h-8 rounded bg-primary text-on-primary text-xs font-bold hover:bg-primary/90 flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <span className="material-symbols-outlined text-[15px]">calendar_add_on</span>
                    <span>Schedule Class Now</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredTimetables.map(slot => (
                  <div
                    key={slot.id}
                    className="p-4 rounded-xl bg-surface border border-outline-variant hover:border-primary/50 transition-all space-y-3 shadow-xs flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded bg-primary-container/30 text-primary text-[11px] font-bold">
                            {slot.dayOfWeek}
                          </span>
                          <span className="text-xs font-data-tabular font-semibold text-secondary">
                            {slot.startTime} - {slot.endTime}
                          </span>
                        </div>
                        {slot.attendanceMarked ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            Attendance Taken ({(slot.attendanceRecords || []).filter(r => r.status === 'Attended').length})
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-200">
                            Scheduled
                          </span>
                        )}
                      </div>

                      <div>
                        <h4 className="font-bold text-sm text-on-surface line-clamp-1">{slot.topic}</h4>
                        <p className="text-xs text-secondary mt-0.5">
                          {slot.courseTitle} • <span className="font-medium text-on-surface">{slot.cohortName}</span>
                        </p>
                      </div>

                      <div className="pt-2 border-t border-outline-variant/40 space-y-1 text-xs">
                        <div className="flex items-center gap-1.5 text-secondary">
                          <span className="material-symbols-outlined text-[15px] text-primary">person</span>
                          <span>Faculty: <strong className="text-on-surface">{slot.mentorName}</strong></span>
                        </div>

                        {slot.meetingLink ? (
                          <div className="flex items-center gap-1.5 text-secondary">
                            <span className="material-symbols-outlined text-[15px] text-primary">videocam</span>
                            <a
                              href={slot.meetingLink}
                              target="_blank"
                              rel="noreferrer"
                              className="text-primary hover:underline font-medium line-clamp-1"
                            >
                              Join Virtual Class
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

                    <div className="pt-3 border-t border-outline-variant/60 flex items-center justify-between gap-2">
                      <button
                        onClick={() => {
                          setSelectedSlotForAttendance(slot);
                          openModal('take-attendance');
                        }}
                        className={`h-7 px-2.5 rounded text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                          slot.attendanceMarked
                            ? 'bg-surface border border-outline-variant text-secondary hover:text-on-surface hover:bg-surface-container'
                            : 'bg-primary text-on-primary hover:bg-primary/90 shadow-xs'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[13px]">how_to_reg</span>
                        <span>{slot.attendanceMarked ? 'Review Attendance' : 'Mark Attendance'}</span>
                      </button>

                      {canScheduleClasses && (
                        <button
                          onClick={() => deleteTimetableSlot(slot.id)}
                          className="h-7 w-7 rounded flex items-center justify-center text-secondary hover:text-error hover:bg-error/10 transition-colors cursor-pointer"
                          title="Delete Schedule Slot"
                        >
                          <span className="material-symbols-outlined text-[16px]">delete</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: SYLLABUS TOPIC APPROVALS (PO & SUPER ADMIN GATEWAY) */}
        {/* ========================================================================= */}
        {activeTab === 'approvals' && (
          <div className="p-stack-md space-y-5">
            {/* Governance Callout */}
            <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 text-xs text-blue-900 flex items-start gap-3">
              <span className="material-symbols-outlined text-blue-600 text-[22px] shrink-0 mt-0.5">policy</span>
              <div className="space-y-1">
                <h4 className="font-bold text-sm text-blue-950">Curriculum Quality Gateway &amp; Topic Approvals</h4>
                <p className="leading-relaxed">
                  Mentors teach strictly according to the approved course outline and check off topics once taught.
                  As Program Officer or Super Admin, your approval verifies that the syllabus topic was covered satisfactorily.
                  <strong> Approving a topic automatically marks it as published and advances the course progress percentage on enrolled students&apos; portals.</strong>
                </p>
              </div>
            </div>

            {/* Pending Approvals Section */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-sm text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-amber-600 text-[18px]">pending_actions</span>
                  <span>Topics Awaiting Program Officer Approval ({pendingApprovalLessons.length})</span>
                </h3>
              </div>

              {pendingApprovalLessons.length === 0 ? (
                <div className="p-8 rounded-lg bg-surface border border-outline-variant/60 text-center text-xs text-secondary">
                  <span className="material-symbols-outlined text-3xl opacity-40 mb-1 block">task_alt</span>
                  All mentor-submitted topics have been reviewed and approved! No pending topics in queue.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-outline-variant/70">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-outline-variant/60 bg-surface-container-low text-secondary text-[11px] uppercase tracking-wider font-data-tabular">
                        <th className="p-3">Track &amp; Module</th>
                        <th className="p-3">Topic / Lesson</th>
                        <th className="p-3">Completed By Mentor</th>
                        <th className="p-3">Mentor Notes</th>
                        <th className="p-3 text-right">Approval Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/40">
                      {pendingApprovalLessons.map(({ lesson, moduleTitle, courseTitle }) => (
                        <tr key={lesson.id} className="hover:bg-surface-container-low/40 transition-colors">
                          <td className="p-3 font-semibold text-on-surface">
                            <div>{courseTitle}</div>
                            <span className="text-[10px] text-secondary font-normal">{moduleTitle}</span>
                          </td>
                          <td className="p-3">
                            <span className="font-bold text-on-surface">{lesson.title}</span>
                            <span className="block text-[10px] text-secondary font-data-tabular">{lesson.durationMinutes} mins lecture</span>
                          </td>
                          <td className="p-3">
                            <div className="font-medium text-on-surface">{lesson.completedByMentorName || 'Assigned Mentor'}</div>
                            <span className="text-[10px] text-secondary font-data-tabular">
                              {lesson.completedByMentorAt ? new Date(lesson.completedByMentorAt).toLocaleDateString() : 'Recently'}
                            </span>
                          </td>
                          <td className="p-3 text-secondary italic max-w-xs">
                            {lesson.completionNotes ? `"${lesson.completionNotes}"` : 'No specific notes provided.'}
                          </td>
                          <td className="p-3 text-right">
                            {canApproveTopics ? (
                              <button
                                onClick={() => handleApproveTopic(lesson.id)}
                                disabled={approvingLessonId === lesson.id}
                                className="h-8 px-3.5 rounded bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer ml-auto shadow-xs"
                              >
                                <span className="material-symbols-outlined text-[16px]">verified</span>
                                <span>{approvingLessonId === lesson.id ? 'Approving...' : 'Approve & Publish'}</span>
                              </button>
                            ) : (
                              <span className="text-secondary text-[11px] italic">PO Approval Required</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Approved Topics Log */}
            {approvedLessons.length > 0 && (
              <div className="space-y-3 pt-3 border-t border-outline-variant/60">
                <h3 className="font-bold text-sm text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-emerald-600 text-[18px]">check_circle</span>
                  <span>Recently Approved Topics ({approvedLessons.length})</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {approvedLessons.slice(0, 6).map(({ lesson, moduleTitle, courseTitle }) => (
                    <div key={lesson.id} className="p-3 rounded-lg bg-surface border border-outline-variant text-xs space-y-1">
                      <div className="flex justify-between items-start">
                        <span className="font-bold text-on-surface line-clamp-1">{lesson.title}</span>
                        <span className="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">Approved</span>
                      </div>
                      <p className="text-[11px] text-secondary">{courseTitle} • {moduleTitle}</p>
                      {lesson.approvedByProgramOfficerName && (
                        <p className="text-[10px] text-secondary">
                          Approved by <strong>{lesson.approvedByProgramOfficerName}</strong>
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: FACULTY HOURS & PAYOUT ELIGIBILITY TRACKER */}
        {/* ========================================================================= */}
        {activeTab === 'faculty-tracker' && (
          <div className="p-stack-md space-y-5">
            {/* Explanatory Banner */}
            <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900 flex items-start gap-3">
              <span className="material-symbols-outlined text-amber-700 text-[22px] shrink-0 mt-0.5">lock_clock</span>
              <div className="space-y-1">
                <h4 className="font-bold text-sm text-amber-950">Faculty Payout Hours Gatekeeping Threshold</h4>
                <p className="leading-relaxed">
                  To ensure quality academic delivery, mentors must lecture a minimum of <strong>{minRequiredHours} hours</strong> with scholars before they become eligible for commission disbursements and payouts.
                  Hours are credited when attendance is recorded for scheduled classes. Finance and Super Admin payout buttons remain locked for mentors below this threshold.
                </p>
              </div>
            </div>

            {/* Faculty Hours Table */}
            <div className="overflow-x-auto rounded-lg border border-outline-variant/70">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-outline-variant/60 bg-surface-container-low text-secondary text-[11px] uppercase tracking-wider font-data-tabular">
                    <th className="p-3">Faculty Mentor</th>
                    <th className="p-3">Department</th>
                    <th className="p-3">Lectured vs Required Hours</th>
                    <th className="p-3">Curriculum Delivery Progress</th>
                    <th className="p-3">Payout Eligibility Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/40">
                  {mentors.map(mentor => {
                    const logged = mentor.lecturedHours || 0;
                    const required = mentor.minimumRequiredHours || minRequiredHours;
                    const percent = Math.min(100, Math.round((logged / required) * 100));
                    const isEligible = logged >= required;

                    return (
                      <tr key={mentor.id} className="hover:bg-surface-container-low/40 transition-colors">
                        <td className="p-3 font-semibold text-on-surface">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-[10px] font-bold">
                              {mentor.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <span>{mentor.name}</span>
                              <span className="block text-[10px] text-secondary font-normal font-data-tabular">{mentor.email}</span>
                            </div>
                          </div>
                        </td>
                        <td className="p-3 text-secondary">{mentor.department || 'Academic Faculty'}</td>
                        <td className="p-3 font-data-tabular font-bold text-on-surface">
                          <span className={isEligible ? 'text-emerald-700' : 'text-amber-700'}>
                            {logged.toFixed(1)} hrs
                          </span>
                          <span className="text-secondary font-normal"> / {required.toFixed(1)} hrs required</span>
                        </td>
                        <td className="p-3">
                          <div className="w-36 space-y-1">
                            <div className="flex justify-between text-[10px] text-secondary font-data-tabular">
                              <span>{percent}% Delivered</span>
                              <span>{logged.toFixed(1)}h</span>
                            </div>
                            <div className="w-full bg-surface-container-high rounded-full h-1.5 overflow-hidden">
                              <div
                                className={`h-1.5 rounded-full transition-all ${isEligible ? 'bg-emerald-600' : 'bg-amber-500'}`}
                                style={{ width: `${percent}%` }}
                              ></div>
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          {isEligible ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              Eligible for Payout
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 font-bold border border-amber-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                              Under Hours ({(required - logged).toFixed(1)}h needed)
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => {
                              setSelectedDayFilter('All');
                              setSearchQuery(mentor.name);
                              setActiveTab('timetables');
                            }}
                            className="h-7 px-2.5 rounded bg-surface border border-outline-variant hover:bg-surface-container text-on-surface text-[11px] font-semibold transition-colors inline-flex items-center gap-1 cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[13px]">calendar_month</span>
                            <span>View Classes</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
