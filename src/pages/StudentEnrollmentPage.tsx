import React, { useState, useMemo, useEffect } from 'react';
import { useCRM, formatNaira } from '../context/CRMContext';
import { CrispStatusBadge } from '../components/common/CrispStatusBadge';
import { Student360Dossier } from '../components/student/Student360Dossier';

export interface StudentEnrollmentPageProps {}

export const StudentEnrollmentPage: React.FC<StudentEnrollmentPageProps> = () => {
  const { 
    students, 
    courses,
    selectedStudentId, 
    setSelectedStudentId, 
    openModal, 
    currentUser, 
    hasFeaturePermission, 
    showToast,
    openBiodataModal,
    sendPaymentReminder,
    openRecordPaymentModal,
  } = useCRM();

  const [viewMode, setViewMode] = useState<'table' | 'detail'>('table');
  const [tableSearch, setTableSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [courseFilter, setCourseFilter] = useState<string>('All');

  // Pagination states
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  const isMentor = currentUser?.role === 'mentor';
  const isSuperAdmin = currentUser?.role === 'super_admin';
  const isAdminOrAdmissions = isSuperAdmin || currentUser?.role === 'admissions';
  const canEnroll = isAdminOrAdmissions || hasFeaturePermission('canEnrollStudents');
  const canModifyStudent = isSuperAdmin || hasFeaturePermission('canModifyStudentBiodata');
  const canViewBiodata = isSuperAdmin || hasFeaturePermission('canViewBiodata');

  // If mentor, filter strictly to their assigned students
  const displayedStudents = isMentor
    ? students.filter(s => s.mentorId === currentUser?.mentorId || s.mentorName === currentUser?.name)
    : students;

  const currentStudent = displayedStudents.find(s => s.id === selectedStudentId) || displayedStudents[0];

  const filteredStudents = useMemo(() => {
    return displayedStudents.filter(s => {
      const matchesSearch = 
        s.name.toLowerCase().includes(tableSearch.toLowerCase()) ||
        s.email.toLowerCase().includes(tableSearch.toLowerCase()) ||
        (s.studentCode && s.studentCode.toLowerCase().includes(tableSearch.toLowerCase())) ||
        (s.program && s.program.toLowerCase().includes(tableSearch.toLowerCase())) ||
        (Array.isArray(s.courses) && s.courses.some(c => c.name?.toLowerCase().includes(tableSearch.toLowerCase())));
      const matchesStatus = statusFilter === 'All' || s.status === statusFilter;
      const matchesCourse = courseFilter === 'All' || s.program === courseFilter || (Array.isArray(s.courses) && s.courses.some(c => c.name === courseFilter));
      return matchesSearch && matchesStatus && matchesCourse;
    });
  }, [displayedStudents, tableSearch, statusFilter, courseFilter]);

  // Reset page when filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [tableSearch, statusFilter, courseFilter]);

  const totalStudents = filteredStudents.length;
  const totalPages = Math.max(1, Math.ceil(totalStudents / pageSize));
  const validCurrentPage = Math.min(currentPage, totalPages);

  const paginatedStudents = useMemo(() => {
    const startIndex = (validCurrentPage - 1) * pageSize;
    return filteredStudents.slice(startIndex, startIndex + pageSize);
  }, [filteredStudents, validCurrentPage, pageSize]);

  const totalTuition = useMemo(() => displayedStudents.reduce((sum, s) => sum + (s.totalFees || 0), 0), [displayedStudents]);
  const totalPaid = useMemo(() => displayedStudents.reduce((sum, s) => sum + (s.paidAmount || 0), 0), [displayedStudents]);
  const totalBalance = totalTuition - totalPaid;
  const activeCount = useMemo(() => displayedStudents.filter(s => s.status === 'Active').length, [displayedStudents]);
  const avgProgress = displayedStudents.length 
    ? Math.round(displayedStudents.reduce((sum, s) => sum + (s.progressPercent || 0), 0) / displayedStudents.length)
    : 0;

  // Graceful Empty State when 0 students exist
  if (!currentStudent || displayedStudents.length === 0) {
    return (
      <div className="space-y-stack-lg animate-in fade-in duration-200 max-w-5xl">
        {/* Mentor Portal Role Notice */}
        {isMentor && (
          <div className="p-3 bg-secondary-container/30 border border-outline-variant rounded-lg flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">badge</span>
              <span className="text-on-surface font-semibold">
                Faculty Mentorship Portal: Financial data is hidden. Showing academic syllabus &amp; assigned mentees.
              </span>
            </div>
            <span className="font-data-tabular text-primary font-bold">0 Assigned Mentees</span>
          </div>
        )}

        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h2 className="font-headline-lg text-headline-lg font-bold text-on-surface">
              Student Enrollment &amp; Tuition Billing
            </h2>
            <p className="font-body-md text-body-md text-secondary mt-1">
              Manage academic course registrations, installment tracking, and NIBSS tuition settlement.
            </p>
          </div>

          {canEnroll && (
            <button 
              onClick={() => openModal('enroll-student')}
              className="h-10 px-5 bg-primary text-on-primary rounded-lg font-label-md text-xs font-bold hover:bg-primary/90 transition-colors flex items-center gap-2 shadow-sm cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">person_add</span>
              <span>+ Enroll New Student</span>
            </button>
          )}
        </div>

        {/* Empty State Card */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-12 text-center shadow-xs flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-[36px]">school</span>
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="font-headline-md text-base font-bold text-on-surface">
              {isMentor ? 'No Assigned Mentees Found' : 'No Students Enrolled Yet'}
            </h3>
            <p className="text-xs text-secondary leading-relaxed">
              {isMentor 
                ? 'You do not have any active student mentees assigned to your faculty profile yet.' 
                : 'Your database is in a clean production state. You can admit prospective leads or directly register your first student enrollment below.'}
            </p>
          </div>
          {canEnroll && (
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => openModal('enroll-student')}
                className="h-10 px-5 rounded-lg bg-primary hover:bg-primary/90 text-on-primary font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">person_add</span>
                <span>Directly Enroll Student</span>
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-stack-lg animate-in fade-in duration-200">
      {/* Mentor Portal Role Notice */}
      {isMentor && (
        <div className="p-3 bg-secondary-container/30 border border-outline-variant rounded-lg flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[20px]">badge</span>
            <span className="text-on-surface font-semibold">Faculty Mentorship Portal: Financial data is hidden. Showing academic syllabus &amp; assigned mentees.</span>
          </div>
          <span className="font-data-tabular text-primary font-bold">{displayedStudents.length} Assigned Mentees</span>
        </div>
      )}

      {/* Global Page Header & Mode Switcher */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-surface-container-lowest p-stack-md rounded-xl border border-outline-variant shadow-xs">
        <div>
          <h2 className="font-headline-lg text-headline-lg font-bold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[26px]">school</span>
            <span>Student Directory &amp; Tuition Ledger</span>
          </h2>
          <p className="text-xs text-secondary mt-0.5">
            Manage student registrations, academic progression, and tuition installment verification.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* View Mode Toggle */}
          <div className="inline-flex rounded-lg border border-outline-variant bg-surface p-0.5">
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-primary text-on-primary shadow-xs'
                  : 'text-secondary hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">format_list_bulleted</span>
              <span>List View ({displayedStudents.length})</span>
            </button>
            <button
              onClick={() => setViewMode('detail')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'detail'
                  ? 'bg-primary text-on-primary shadow-xs'
                  : 'text-secondary hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">person</span>
              <span>Dossier View</span>
            </button>
          </div>

          {canEnroll && (
            <button 
              onClick={() => openModal('enroll-student')}
              className="h-9 px-4 bg-primary text-on-primary rounded-lg font-label-md text-xs font-bold hover:bg-primary/90 transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">person_add</span>
              <span>+ Enroll Student</span>
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* LIST / TABLE VIEW                                                         */}
      {/* ========================================================================= */}
      {viewMode === 'table' && (
        <div className="space-y-stack-md animate-in fade-in duration-150">
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-stack-md">
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-stack-md shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs text-secondary font-semibold">Total Students</span>
                <div className="text-headline-md font-bold text-on-surface font-data-tabular mt-0.5">
                  {displayedStudents.length}
                </div>
                <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-0.5 mt-0.5">
                  <span className="material-symbols-outlined text-[13px]">check_circle</span>
                  <span>{activeCount} Active Enrolled</span>
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-[22px]">group</span>
              </div>
            </div>

            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-stack-md shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs text-secondary font-semibold">Avg. Academic Progress</span>
                <div className="text-headline-md font-bold text-primary font-data-tabular mt-0.5">
                  {avgProgress}%
                </div>
                <span className="text-[11px] text-secondary font-medium">Curriculum completion</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-secondary-container text-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-[22px]">trending_up</span>
              </div>
            </div>

            {!isMentor ? (
              <>
                <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-stack-md shadow-xs flex items-center justify-between">
                  <div>
                    <span className="text-xs text-secondary font-semibold">Tuition Collected</span>
                    <div className="text-headline-md font-bold text-emerald-600 font-data-tabular mt-0.5">
                      {formatNaira(totalPaid)}
                    </div>
                    <span className="text-[11px] text-secondary font-medium">Settled to Institute</span>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[22px]">payments</span>
                  </div>
                </div>

                <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-stack-md shadow-xs flex items-center justify-between">
                  <div>
                    <span className="text-xs text-secondary font-semibold">Outstanding Balance</span>
                    <div className="text-headline-md font-bold text-amber-600 font-data-tabular mt-0.5">
                      {formatNaira(totalBalance)}
                    </div>
                    <span className="text-[11px] text-amber-700 font-semibold">Pending installments</span>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[22px]">account_balance_wallet</span>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-stack-md shadow-xs flex items-center justify-between">
                  <div>
                    <span className="text-xs text-secondary font-semibold">Assigned Cohorts</span>
                    <div className="text-headline-md font-bold text-on-surface font-data-tabular mt-0.5">
                      {new Set(displayedStudents.map(s => s.cohort)).size}
                    </div>
                    <span className="text-[11px] text-secondary font-medium">Active tracks</span>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-tertiary-container text-tertiary flex items-center justify-center">
                    <span className="material-symbols-outlined text-[22px]">diversity_3</span>
                  </div>
                </div>

                <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-stack-md shadow-xs flex items-center justify-between">
                  <div>
                    <span className="text-xs text-secondary font-semibold">Completed Certificates</span>
                    <div className="text-headline-md font-bold text-emerald-600 font-data-tabular mt-0.5">
                      {displayedStudents.filter(s => s.certificateIssued).length}
                    </div>
                    <span className="text-[11px] text-secondary font-medium">Graduates verified</span>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[22px]">workspace_premium</span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Search and Filters Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-surface-container-lowest p-3 rounded-xl border border-outline-variant">
            <div className="relative w-full sm:w-80">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-secondary text-[18px]">
                search
              </span>
              <input
                type="text"
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                placeholder="Search name, code, email, track..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-surface border border-outline-variant rounded-lg text-on-surface placeholder:text-secondary focus:border-primary outline-none"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs bg-surface border border-outline-variant rounded-lg px-2.5 py-1.5 text-on-surface font-semibold outline-none cursor-pointer"
              >
                <option value="All">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Pending">Pending</option>
                <option value="Completed">Completed</option>
              </select>

              <select
                value={courseFilter}
                onChange={(e) => setCourseFilter(e.target.value)}
                className="text-xs bg-surface border border-outline-variant rounded-lg px-2.5 py-1.5 text-on-surface font-semibold outline-none cursor-pointer max-w-[200px] truncate"
              >
                <option value="All">All Programs</option>
                {courses.map(c => (
                  <option key={c.id} value={c.title}>{c.title}</option>
                ))}
              </select>

              <span className="text-xs text-secondary font-medium whitespace-nowrap pl-1">
                Showing {totalStudents === 0 ? 0 : (validCurrentPage - 1) * pageSize + 1}–{Math.min(validCurrentPage * pageSize, totalStudents)} of {totalStudents} students
              </span>
            </div>
          </div>

          {/* Student & Billing Roster Table */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-outline-variant bg-surface text-secondary text-[11px] font-bold uppercase tracking-wider">
                    <th className="p-3 pl-4">Student</th>
                    <th className="p-3">Program &amp; Cohort</th>
                    <th className="p-3">Faculty Mentor</th>
                    <th className="p-3">Academic Progress</th>
                    {!isMentor && (
                      <>
                        <th className="p-3">Tuition Ledger</th>
                        <th className="p-3">Billing Status</th>
                      </>
                    )}
                    <th className="p-3">Status</th>
                    <th className="p-3 pr-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant text-xs">
                  {paginatedStudents.map((student) => {
                    const balance = student.outstandingBalance ?? ((student.totalFees || 0) - (student.paidAmount || 0));
                    return (
                      <tr key={student.id} className="hover:bg-surface-container-low/50 transition-colors">
                        <td className="p-3 pl-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-primary/15 text-primary font-bold flex items-center justify-center text-xs shrink-0">
                              {student.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-bold text-on-surface">{student.name}</span>
                                {student.courses && student.courses.length > 1 && (
                                  <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
                                    {student.courses.length} Programs
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5 text-[11px] text-secondary">
                                <span className="font-mono text-primary font-semibold">{student.studentCode}</span>
                                <span>•</span>
                                <span>{student.email}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="p-3">
                          {student.courses && student.courses.length > 1 ? (
                            <div className="space-y-1.5">
                              {student.courses.map((c, idx) => (
                                <div key={c.id || idx} className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-semibold text-on-surface text-xs">{c.name}</span>
                                  <span className="inline-flex items-center px-1.5 py-0.2 rounded bg-surface-container text-secondary text-[10px] font-mono">
                                    {c.cohort || student.cohort || 'Active'}
                                  </span>
                                  {c.status && (
                                    <span className={`inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider ${
                                      c.status === 'Active' ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' :
                                      c.status === 'Dropped' ? 'bg-slate-500/15 text-slate-700 dark:text-slate-300' :
                                      'bg-blue-500/15 text-blue-700 dark:text-blue-300'
                                    }`}>
                                      {c.status}
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <>
                              <div className="font-semibold text-on-surface">{student.program || 'Software Engineering'}</div>
                              <div className="text-[11px] text-secondary font-mono mt-0.5">
                                <span className="inline-flex items-center px-1.5 py-0.2 rounded bg-surface-container text-secondary text-[10px] font-bold">
                                  {student.cohort || 'Cohort Alpha'}
                                </span>
                              </div>
                            </>
                          )}
                        </td>

                        <td className="p-3">
                          {student.mentorName ? (
                            <div className="flex items-center gap-1.5 text-on-surface font-medium">
                              <span className="material-symbols-outlined text-[16px] text-primary">psychology</span>
                              <span>{student.mentorName}</span>
                            </div>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-700">
                              Unassigned
                            </span>
                          )}
                        </td>

                        <td className="p-3">
                          <div className="w-36 space-y-1">
                            <div className="flex justify-between text-[11px]">
                              <span className="font-bold text-on-surface">{student.progressPercent || 0}%</span>
                              <span className="text-secondary">{student.attendedLearningHours || 0}/{student.minimumRequiredHours || 40} hrs</span>
                            </div>
                            <div className="w-full h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full transition-all ${
                                  (student.progressPercent || 0) >= 100 ? 'bg-emerald-500' : 'bg-primary'
                                }`} 
                                style={{ width: `${Math.min(100, student.progressPercent || 0)}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        {!isMentor && (
                          <>
                            <td className="p-3 font-data-tabular">
                              <div className="font-bold text-on-surface">{formatNaira(student.totalFees || 0)}</div>
                              <div className="text-[11px] text-secondary">
                                Paid: <span className="text-emerald-600 font-semibold">{formatNaira(student.paidAmount || 0)}</span>
                              </div>
                              {balance > 0 && (
                                <div className="text-[10px] text-rose-600 font-semibold">
                                  Bal: {formatNaira(balance)}
                                </div>
                              )}
                            </td>

                            <td className="p-3">
                              <CrispStatusBadge status={student.tuitionStatus || (balance <= 0 ? 'Paid' : 'Partial')} />
                            </td>
                          </>
                        )}

                        <td className="p-3">
                          <CrispStatusBadge status={student.status} />
                        </td>

                        <td className="p-3 pr-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => {
                                setSelectedStudentId(student.id);
                                setViewMode('detail');
                              }}
                              className="px-2.5 py-1 rounded bg-secondary-container text-primary font-bold text-xs hover:bg-secondary-container/80 transition-colors flex items-center gap-1 shadow-xs cursor-pointer"
                              title="View Student Detailed Dossier"
                            >
                              <span className="material-symbols-outlined text-[15px]">badge</span>
                              <span>Dossier</span>
                            </button>

                            <button
                              onClick={() => {
                                setSelectedStudentId(student.id);
                                openModal('view-certificate');
                              }}
                              className={`p-1.5 rounded transition-colors cursor-pointer ${
                                student.certificateIssued
                                  ? 'text-emerald-600 hover:bg-emerald-50'
                                  : 'text-secondary hover:text-on-surface hover:bg-surface-container'
                              }`}
                              title={student.certificateIssued ? 'Certificate Issued' : 'Graduation Gate'}
                            >
                              <span className="material-symbols-outlined text-[18px]">workspace_premium</span>
                            </button>

                            {canViewBiodata && (
                              <button
                                onClick={() => openBiodataModal({ ...student, category: 'student' })}
                                className="p-1.5 rounded text-secondary hover:text-primary hover:bg-surface-container transition-colors cursor-pointer"
                                title="View 3-Tier Nigerian KYC Biodata Dossier"
                              >
                                <span className="material-symbols-outlined text-[18px]">contact_page</span>
                              </button>
                            )}

                            {canModifyStudent && (
                              <button
                                onClick={() => {
                                  setSelectedStudentId(student.id);
                                  openModal('edit-student');
                                }}
                                className="p-1.5 rounded text-secondary hover:text-primary hover:bg-surface-container transition-colors cursor-pointer"
                                title="Modify Student Biodata"
                              >
                                <span className="material-symbols-outlined text-[18px]">edit</span>
                              </button>
                            )}

                            {!isMentor && (
                              <>
                                <button
                                  onClick={() => {
                                    sendPaymentReminder(student.id);
                                    showToast('Reminder Sent', `Payment reminder dispatched to ${student.name}`, 'info');
                                  }}
                                  className="p-1.5 rounded text-secondary hover:text-primary hover:bg-surface-container transition-colors cursor-pointer"
                                  title="Send Payment Reminder"
                                >
                                  <span className="material-symbols-outlined text-[18px]">notifications_active</span>
                                </button>
                                <button
                                  onClick={() => openRecordPaymentModal(student)}
                                  className="p-1.5 rounded text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors cursor-pointer"
                                  title="Record Tuition Installment Payment"
                                >
                                  <span className="material-symbols-outlined text-[18px]">payments</span>
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredStudents.length === 0 && (
                    <tr>
                      <td colSpan={isMentor ? 6 : 8} className="p-8 text-center text-secondary">
                        No students match your filter criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls Footer */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 px-4 border-t border-outline-variant bg-surface text-xs">
              <div className="flex items-center gap-2 text-secondary">
                <span className="font-medium">Rows per page:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="bg-surface-container-lowest border border-outline-variant rounded px-2 py-1 text-on-surface font-semibold outline-none cursor-pointer"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span className="text-secondary ml-2 font-medium">
                  Page <strong className="text-on-surface">{validCurrentPage}</strong> of <strong className="text-on-surface">{totalPages}</strong>
                </span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={validCurrentPage <= 1}
                  className="p-1 rounded border border-outline-variant bg-surface-container-lowest text-secondary hover:text-on-surface disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  title="First Page"
                >
                  <span className="material-symbols-outlined text-[16px]">first_page</span>
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={validCurrentPage <= 1}
                  className="p-1 rounded border border-outline-variant bg-surface-container-lowest text-secondary hover:text-on-surface disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  title="Previous Page"
                >
                  <span className="material-symbols-outlined text-[16px]">chevron_left</span>
                </button>

                {/* Page Number Buttons */}
                <div className="flex items-center gap-1 px-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum: number;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (validCurrentPage <= 3) {
                      pageNum = i + 1;
                    } else if (validCurrentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = validCurrentPage - 2 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-7 h-7 rounded text-xs font-bold transition-colors cursor-pointer ${
                          validCurrentPage === pageNum
                            ? 'bg-primary text-on-primary shadow-xs'
                            : 'bg-surface-container-lowest border border-outline-variant text-secondary hover:text-on-surface'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={validCurrentPage >= totalPages}
                  className="p-1 rounded border border-outline-variant bg-surface-container-lowest text-secondary hover:text-on-surface disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  title="Next Page"
                >
                  <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                </button>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={validCurrentPage >= totalPages}
                  className="p-1 rounded border border-outline-variant bg-surface-container-lowest text-secondary hover:text-on-surface disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  title="Last Page"
                >
                  <span className="material-symbols-outlined text-[16px]">last_page</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DETAILED 360° ACADEMIC DOSSIER VIEW (Single Student View)                 */}
      {/* ========================================================================= */}
      {viewMode === 'detail' && currentStudent && (
        <div className="space-y-4 animate-in fade-in duration-150">
          {/* Back to Table View Banner */}
          <div className="flex items-center justify-between bg-surface-container-low border border-outline-variant p-2.5 px-4 rounded-xl">
            <button
              onClick={() => setViewMode('table')}
              className="flex items-center gap-1.5 text-primary text-xs font-bold hover:underline cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              <span>Back to Student Roster Table View</span>
            </button>
            <div className="text-xs text-secondary font-medium">
              Viewing 360° Academic Dossier for <strong className="text-on-surface">{currentStudent.name}</strong> ({currentStudent.studentCode})
            </div>
          </div>

          <Student360Dossier
            student={currentStudent}
            isStaffView={true}
          />
        </div>
      )}
    </div>
  );
};
