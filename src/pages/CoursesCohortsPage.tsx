import React, { useState, useMemo } from 'react';
import { useCRM, formatNaira } from '../context/CRMContext';

export const CoursesCohortsPage: React.FC = () => {
  const { courses, cohorts, openModal, globalSearch, setSelectedCourseForEditId, currentUser } = useCRM();

  const [activeTab, setActiveTab] = useState<'programs' | 'cohorts'>('programs');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const effectiveSearch = globalSearch || searchQuery;

  const categories = ['All', 'Software Engineering', 'Data Science', 'Product Design', 'Cloud Engineering'];

  const filteredCourses = useMemo(() => {
    return courses.filter(c => {
      const matchesCat = selectedCategory === 'All' || c.category === selectedCategory;
      const matchesSearch = c.title.toLowerCase().includes(effectiveSearch.toLowerCase()) ||
        c.code.toLowerCase().includes(effectiveSearch.toLowerCase()) ||
        c.leadInstructor.toLowerCase().includes(effectiveSearch.toLowerCase());
      return matchesCat && matchesSearch;
    });
  }, [courses, selectedCategory, effectiveSearch]);

  const filteredCohorts = useMemo(() => {
    return cohorts.filter(coh => {
      return coh.name.toLowerCase().includes(effectiveSearch.toLowerCase()) ||
        coh.cohortCode.toLowerCase().includes(effectiveSearch.toLowerCase()) ||
        coh.programName.toLowerCase().includes(effectiveSearch.toLowerCase()) ||
        coh.instructorName.toLowerCase().includes(effectiveSearch.toLowerCase());
    });
  }, [cohorts, effectiveSearch]);

  const totalSeats = useMemo(() => cohorts.reduce((acc, c) => acc + c.maxCapacity, 0), [cohorts]);
  const totalEnrolled = useMemo(() => cohorts.reduce((acc, c) => acc + c.enrolledCount, 0), [cohorts]);
  const capacityPercent = totalSeats > 0 ? Math.round((totalEnrolled / totalSeats) * 100) : 0;

  return (
    <div className="space-y-stack-lg animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex justify-between items-end flex-wrap gap-4">
        <div>
          <h2 className="font-headline-lg text-headline-lg font-bold text-on-surface mb-unit">Programs &amp; Cohorts</h2>
          <p className="font-body-md text-body-md text-secondary">Manage curriculum tracks, course syllabi, tuition fees, and cohort scheduling.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {currentUser?.role === 'super_admin' && (
            <button
              onClick={() => openModal('create-course')}
              className="h-10 px-4 bg-secondary-container text-primary rounded font-label-md text-label-md font-bold hover:bg-surface-container-high transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">library_add</span>
              <span>+ Add Academic Program</span>
            </button>
          )}
          <button
            onClick={() => openModal('create-cohort')}
            className="h-10 px-4 bg-primary text-on-primary rounded font-label-md text-label-md font-bold hover:bg-primary/90 transition-colors shadow-xs flex items-center gap-2 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            <span>Launch New Cohort</span>
          </button>
        </div>
      </div>

      {/* 3 Bento Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
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
              <span className="material-symbols-outlined">groups</span>
            </div>
            <span className="text-xs font-bold text-primary bg-secondary-container px-2 py-1 rounded">Schedules</span>
          </div>
          <p className="font-body-sm text-body-sm text-secondary mb-unit">Active Cohorts</p>
          <h3 className="font-display text-display font-bold text-on-surface">{cohorts.length} Batches</h3>
        </div>

        <div className="bg-surface-container-lowest p-stack-md border border-outline-variant rounded-lg shadow-xs">
          <div className="flex justify-between items-start mb-stack-md">
            <div className="w-10 h-10 rounded bg-tertiary-container flex items-center justify-center text-on-tertiary">
              <span className="material-symbols-outlined">chair</span>
            </div>
            <span className="text-xs font-bold text-on-tertiary-container bg-surface-container px-2 py-1 rounded font-data-tabular">
              {capacityPercent}% Enrolled
            </span>
          </div>
          <p className="font-body-sm text-body-sm text-secondary mb-unit">Total Seat Capacity</p>
          <div className="flex items-baseline gap-2">
            <h3 className="font-display text-display font-bold text-on-surface font-data-tabular">{totalEnrolled} / {totalSeats}</h3>
            <span className="text-xs text-secondary">Seats</span>
          </div>
          <div className="w-full bg-surface-container-high rounded-full h-1.5 mt-2 overflow-hidden">
            <div className="bg-primary h-1.5 rounded-full transition-all" style={{ width: `${capacityPercent}%` }}></div>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-lg overflow-hidden shadow-xs">
        {/* Navigation Tabs & Controls */}
        <div className="p-stack-md border-b border-outline-variant flex justify-between items-center bg-surface-bright flex-wrap gap-4">
          {/* Tab Switcher */}
          <div className="flex border border-outline-variant rounded p-1 bg-surface">
            <button
              onClick={() => setActiveTab('programs')}
              className={`px-4 py-1.5 rounded text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'programs'
                  ? 'bg-primary text-on-primary shadow-xs'
                  : 'text-secondary hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">school</span>
              <span>Programs Catalog ({courses.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('cohorts')}
              className={`px-4 py-1.5 rounded text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'cohorts'
                  ? 'bg-primary text-on-primary shadow-xs'
                  : 'text-secondary hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">event_note</span>
              <span>Cohort Schedules ({cohorts.length})</span>
            </button>
          </div>

          {/* Search Filter */}
          <div className="relative w-64">
            <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-outline text-[18px]">search</span>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search programs / cohorts..."
              className="w-full h-9 pl-8 pr-3 rounded bg-surface border border-outline-variant text-xs focus:border-primary outline-none"
            />
          </div>
        </div>

        {/* Tab 1: Academic Programs Catalog */}
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
                {currentUser?.role === 'super_admin' && (
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
                        <p className="font-label-md text-xs text-secondary font-semibold uppercase tracking-wider">Curriculum Modules</p>
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
                        {currentUser?.role === 'super_admin' ? (
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
                        ) : (
                          <div className="text-right">
                            <p className="font-body-sm text-[11px] text-secondary">Lead Faculty</p>
                            <p className="font-label-md text-xs font-bold text-on-surface">{course.leadInstructor}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Cohorts Schedules Table */}
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
                <button
                  onClick={() => openModal('create-cohort')}
                  className="px-4 h-9 rounded-lg bg-primary text-on-primary text-xs font-bold hover:bg-primary/90 flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <span className="material-symbols-outlined text-[16px]">add_circle</span>
                  <span>+ Launch New Cohort</span>
                </button>
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
      </div>
    </div>
  );
};
