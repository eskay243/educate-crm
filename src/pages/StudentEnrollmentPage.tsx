import React, { useState, useMemo } from 'react';
import { useCRM, formatNaira } from '../context/CRMContext';
import { PerformanceMeter } from '../components/common/PerformanceMeter';

export interface StudentEnrollmentPageProps {}

export const StudentEnrollmentPage: React.FC<StudentEnrollmentPageProps> = () => {
  const { 
    students, 
    courses,
    selectedStudentId, 
    setSelectedStudentId, 
    setSelectedInvoiceId, 
    setSelectedStudentForAssignmentId, 
    setSelectedMentorForBookingId,
    studentPerformanceReports,
    settings,
    openModal,
    currentUser,
    sendPaymentReminder,
    hasFeaturePermission,
    showToast
  } = useCRM();

  const [viewMode, setViewMode] = useState<'table' | 'detail'>('table');
  const [tableSearch, setTableSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [courseFilter, setCourseFilter] = useState<string>('All');

  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [reminderSent, setReminderSent] = useState(false);
  const [invoiceSent, setInvoiceSent] = useState(false);

  const isMentor = currentUser?.role === 'mentor';
  const isFinance = currentUser?.role === 'finance';
  const isAdminOrAdmissions = currentUser?.role === 'super_admin' || currentUser?.role === 'admissions';
  const canEnroll = isAdminOrAdmissions || hasFeaturePermission('canEnrollStudents');

  // If mentor, filter strictly to their assigned students
  const displayedStudents = isMentor
    ? students.filter(s => s.mentorId === currentUser?.mentorId || s.mentorName === currentUser?.name)
    : students;

  const currentStudent = displayedStudents.find(s => s.id === selectedStudentId) || displayedStudents[0];

  const studentReports = (studentPerformanceReports || []).filter(
    r => r.studentId === currentStudent?.id || r.studentName === currentStudent?.name
  );

  const filteredStudents = useMemo(() => {
    return displayedStudents.filter(s => {
      const matchesSearch = 
        s.name.toLowerCase().includes(tableSearch.toLowerCase()) ||
        s.email.toLowerCase().includes(tableSearch.toLowerCase()) ||
        (s.studentCode && s.studentCode.toLowerCase().includes(tableSearch.toLowerCase())) ||
        (s.program && s.program.toLowerCase().includes(tableSearch.toLowerCase()));
      const matchesStatus = statusFilter === 'All' || s.status === statusFilter;
      const matchesCourse = courseFilter === 'All' || s.program === courseFilter;
      return matchesSearch && matchesStatus && matchesCourse;
    });
  }, [displayedStudents, tableSearch, statusFilter, courseFilter]);

  const totalTuition = useMemo(() => displayedStudents.reduce((sum, s) => sum + (s.totalFees || 0), 0), [displayedStudents]);
  const totalPaid = useMemo(() => displayedStudents.reduce((sum, s) => sum + (s.paidAmount || 0), 0), [displayedStudents]);
  const totalBalance = totalTuition - totalPaid;
  const activeCount = useMemo(() => displayedStudents.filter(s => s.status === 'Active').length, [displayedStudents]);
  const avgProgress = displayedStudents.length 
    ? Math.round(displayedStudents.reduce((sum, s) => sum + (s.progressPercent || 0), 0) / displayedStudents.length)
    : 0;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadSuccess(true);
      showToast('Proof Uploaded', 'Payment receipt uploaded and queued for finance verification.', 'success');
      setTimeout(() => setUploadSuccess(false), 4000);
    }
  };

  const handleSendPaymentReminder = () => {
    if (!currentStudent) return;
    setReminderSent(true);
    sendPaymentReminder(currentStudent.id);
    setTimeout(() => setReminderSent(false), 3000);
  };

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
                Showing {filteredStudents.length} of {displayedStudents.length}
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
                  {filteredStudents.map((student) => {
                    const balance = student.outstandingBalance ?? ((student.totalFees || 0) - (student.paidAmount || 0));
                    return (
                      <tr key={student.id} className="hover:bg-surface-container-low/50 transition-colors">
                        <td className="p-3 pl-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-primary/15 text-primary font-bold flex items-center justify-center text-xs shrink-0">
                              {student.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-bold text-on-surface">{student.name}</div>
                              <div className="flex items-center gap-1.5 text-[11px] text-secondary">
                                <span className="font-mono text-primary font-semibold">{student.studentCode}</span>
                                <span>•</span>
                                <span>{student.email}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="p-3">
                          <div className="font-semibold text-on-surface">{student.program || 'Software Engineering'}</div>
                          <div className="text-[11px] text-secondary font-mono mt-0.5">
                            <span className="inline-flex items-center px-1.5 py-0.2 rounded bg-surface-container text-secondary text-[10px] font-bold">
                              {student.cohort || 'Cohort Alpha'}
                            </span>
                          </div>
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
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${
                                student.tuitionStatus === 'Paid'
                                  ? 'bg-emerald-500/15 text-emerald-700'
                                  : student.tuitionStatus === 'Partial'
                                  ? 'bg-amber-500/15 text-amber-700'
                                  : 'bg-rose-500/15 text-rose-700'
                              }`}>
                                {student.tuitionStatus || (balance <= 0 ? 'Paid' : 'Partial')}
                              </span>
                            </td>
                          </>
                        )}

                        <td className="p-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${
                            student.status === 'Active'
                              ? 'bg-emerald-500/15 text-emerald-700'
                              : student.status === 'Completed'
                              ? 'bg-blue-500/15 text-blue-700'
                              : 'bg-amber-500/15 text-amber-700'
                          }`}>
                            {student.status}
                          </span>
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

                            {!isMentor && (
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
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DETAILED DOSSIER VIEW (Single Student View)                               */}
      {/* ========================================================================= */}
      {viewMode === 'detail' && (
        <div className="space-y-stack-lg animate-in fade-in duration-150">
          {/* Back to Table View Banner */}
          <div className="flex items-center justify-between bg-surface-container-low border border-outline-variant p-2.5 px-4 rounded-lg">
            <button
              onClick={() => setViewMode('table')}
              className="flex items-center gap-1.5 text-primary text-xs font-bold hover:underline cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              <span>Back to Student Roster List View</span>
            </button>
            <div className="text-xs text-secondary font-medium">
              Viewing dossier for <strong className="text-on-surface">{currentStudent.name}</strong> ({currentStudent.studentCode})
            </div>
          </div>

          {/* Student Switcher Bar & Breadcrumbs */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-stack-md">
            <div>
              <div className="flex items-center gap-stack-sm text-secondary font-body-sm text-body-sm mb-unit">
                <span onClick={() => setViewMode('table')} className="hover:text-primary transition-colors cursor-pointer">Students</span>
                <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                <span className="text-on-surface font-semibold">Record #{currentStudent.studentCode || 'STU-8492'}</span>
              </div>
              <div className="flex items-center gap-3">
                <h2 className="font-headline-lg text-headline-lg font-bold text-on-surface flex items-center gap-stack-sm">
                  {currentStudent.name}
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-secondary-container text-on-secondary-container uppercase tracking-wider">
                    {currentStudent.status}
                  </span>
                </h2>
                {/* Quick Student Selector */}
                <select
                  value={currentStudent.id}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="text-xs bg-surface-container border border-outline-variant rounded px-2 py-1 text-primary font-bold outline-none cursor-pointer"
                >
                  {displayedStudents.map(s => (
                    <option key={s.id} value={s.id}>
                      Switch: {s.name} ({s.studentCode})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Action Buttons: Different for Mentors vs Finance/Admin */}
            <div className="flex gap-stack-sm flex-wrap items-center">
              {/* Universal Academic Credentials & Evaluation Actions */}
              <button
                onClick={() => {
                  setSelectedStudentId(currentStudent.id);
                  openModal('view-certificate');
                }}
                className={`h-10 px-stack-md rounded font-label-md text-label-md font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer ${
                  currentStudent.certificateIssued
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                    : (currentStudent.attendedLearningHours || 0) >= (currentStudent.minimumRequiredHours || settings.defaultMinimumLearningHours || 40) && (currentStudent.progressPercent || 0) >= 100
                    ? 'bg-primary text-on-primary hover:bg-primary/90'
                    : 'bg-surface-container border border-outline-variant text-secondary hover:text-on-surface'
                }`}
                title="View Certificate of Completion & Graduation Gate"
              >
                <span className="material-symbols-outlined text-[18px]">
                  {currentStudent.certificateIssued ? 'workspace_premium' : 'verified'}
                </span>
                <span>
                  {currentStudent.certificateIssued ? 'View Certificate' : 'Graduation & Certificate'}
                </span>
              </button>

              <button
                onClick={() => {
                  setSelectedStudentId(currentStudent.id);
                  openModal('submit-performance-report');
                }}
                className="h-10 px-stack-md bg-secondary-container text-primary rounded font-label-md text-label-md font-bold hover:bg-surface-container-high transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                title="File Student Performance & Welfare Evaluation"
              >
                <span className="material-symbols-outlined text-[18px]">assessment</span>
                <span>Evaluate Student</span>
              </button>

              {/* Mentor Actions */}
              {isMentor ? (
                <button 
                  onClick={() => {
                    setSelectedMentorForBookingId(currentUser?.mentorId || 'men-1');
                    openModal('book-session');
                  }}
                  className="h-10 px-stack-md bg-primary text-on-primary rounded font-label-md text-label-md font-bold hover:bg-primary-container transition-colors flex items-center gap-2 shadow-xs cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">calendar_month</span>
                  <span>Log 1-on-1 Coaching Session</span>
                </button>
              ) : (
                <>
                  {/* Admin & Admissions Actions */}
                  {canEnroll && (
                    <>
                      <button 
                        onClick={() => {
                          setSelectedStudentForAssignmentId(currentStudent.id);
                          openModal('assign-mentor');
                        }}
                        className="h-10 px-stack-md border border-outline-variant rounded font-label-md text-label-md font-semibold text-on-surface hover:bg-surface-container-low transition-colors flex items-center gap-unit shadow-xs cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[18px]">assignment_ind</span>
                        <span>Assign Mentor</span>
                      </button>
                      <button 
                        onClick={() => openModal('enroll-student')}
                        className="h-10 px-stack-md border border-outline-variant rounded font-label-md text-label-md font-semibold text-on-surface hover:bg-surface-container-low transition-colors flex items-center gap-unit shadow-xs cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[18px]">person_add</span>
                        <span>New Student</span>
                      </button>
                    </>
                  )}

                  {/* Finance & Admin Payment Actions */}
                  {(isFinance || isAdminOrAdmissions) && (
                    <>
                      <button 
                        onClick={() => {
                          setSelectedInvoiceId(null);
                          openModal('view-invoice');
                        }}
                        className="h-10 px-stack-md border border-outline-variant rounded font-label-md text-label-md font-semibold text-primary hover:bg-secondary-container transition-colors flex items-center gap-unit shadow-xs cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[18px]">receipt_long</span>
                        <span>View Official Invoice (₦)</span>
                      </button>

                      <button 
                        onClick={handleSendPaymentReminder}
                        className="h-10 px-stack-md bg-secondary-container text-primary rounded font-label-md text-label-md font-bold hover:bg-secondary-container/80 transition-colors flex items-center gap-unit shadow-xs cursor-pointer"
                        title="Send automated due date reminder to student"
                      >
                        <span className="material-symbols-outlined text-[18px]">notifications_active</span>
                        <span>{reminderSent ? 'Reminder Sent!' : 'Send Payment Reminder'}</span>
                      </button>

                      <button 
                        onClick={() => {
                          setInvoiceSent(true);
                          setTimeout(() => setInvoiceSent(false), 3000);
                        }}
                        className="h-10 px-stack-md bg-primary text-on-primary rounded font-label-md text-label-md font-semibold hover:bg-primary-container transition-colors flex items-center gap-unit shadow-xs cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[18px]">mail</span>
                        <span>{invoiceSent ? 'Invoice Sent!' : 'Email Invoice'}</span>
                      </button>
                    </>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Bento Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
            {/* Left Column: 8 cols */}
            <div className="lg:col-span-8 flex flex-col gap-gutter">
              {/* Quick Stats Cards (Grid of 4) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-stack-md">
                <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-stack-md shadow-xs flex flex-col justify-between">
                  <div className="text-secondary font-body-sm text-body-sm mb-1 flex items-center gap-unit">
                    <span className="material-symbols-outlined text-[16px]">school</span>
                    <span>Enrolled Track</span>
                  </div>
                  <div>
                    <div className="font-headline-md text-sm font-bold text-on-surface truncate">
                      {currentStudent.program || 'Software Engineering'}
                    </div>
                    <p className="text-[11px] text-secondary mt-0.5">
                      Curriculum: <strong className="text-primary">{currentStudent.progressPercent || 0}% Completed</strong>
                    </p>
                  </div>
                </div>

                {/* Performance Meter Card */}
                <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-stack-md shadow-xs flex flex-col justify-between">
                  <div className="text-secondary font-body-sm text-body-sm mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-unit">
                      <span className="material-symbols-outlined text-[16px]">speed</span>
                      <span>Performance Meter</span>
                    </span>
                    <span className="text-[10px] text-secondary font-mono">0–100%</span>
                  </div>
                  <PerformanceMeter
                    score={currentStudent.performanceScore ?? 85}
                    tier={currentStudent.performanceTier ?? 'On Track'}
                    size="md"
                    showBar={true}
                  />
                </div>

                {/* Attended Learning Hours Card */}
                <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-stack-md shadow-xs flex flex-col justify-between">
                  <div className="text-secondary font-body-sm text-body-sm mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-unit">
                      <span className="material-symbols-outlined text-[16px]">timer</span>
                      <span>Learning Hours</span>
                    </span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      (currentStudent.attendedLearningHours || 0) >= (currentStudent.minimumRequiredHours || settings.defaultMinimumLearningHours || 40)
                        ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                        : 'bg-amber-500/10 text-amber-700 dark:text-amber-300'
                    }`}>
                      {(currentStudent.attendedLearningHours || 0) >= (currentStudent.minimumRequiredHours || settings.defaultMinimumLearningHours || 40) ? 'Eligible' : 'Hours Needed'}
                    </span>
                  </div>
                  <div>
                    <div className="font-display text-display font-bold text-on-surface">
                      {currentStudent.attendedLearningHours || 0} <span className="text-xs text-secondary font-normal font-sans">/ {currentStudent.minimumRequiredHours || settings.defaultMinimumLearningHours || 40}h</span>
                    </div>
                    <div className="w-full bg-surface-container-high rounded-full h-1.5 mt-1.5 overflow-hidden">
                      <div
                        className="bg-primary h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(100, Math.round(((currentStudent.attendedLearningHours || 0) / (currentStudent.minimumRequiredHours || settings.defaultMinimumLearningHours || 40)) * 100))}%`
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Financial Stats or Mentorship Status */}
                {!isMentor ? (
                  <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-stack-md relative overflow-hidden shadow-xs flex flex-col justify-between">
                    <div className="text-secondary font-body-sm text-body-sm mb-1 flex items-center gap-unit">
                      <span className="material-symbols-outlined text-[16px]">account_balance_wallet</span>
                      <span>Tuition Settlement</span>
                    </div>
                    <div>
                      <div className="font-display text-display font-bold text-on-surface">
                        {formatNaira(currentStudent.totalFees || 0)}
                      </div>
                      <p className={`text-[11px] font-bold mt-0.5 ${currentStudent.outstandingBalance ? 'text-error' : 'text-emerald-600'}`}>
                        {currentStudent.outstandingBalance ? `₦${Number(currentStudent.outstandingBalance).toLocaleString()} Due` : 'Fully Settled'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-stack-md shadow-xs flex flex-col justify-between">
                    <div className="text-secondary font-body-sm text-body-sm mb-1 flex items-center gap-unit">
                      <span className="material-symbols-outlined text-[16px]">workspace_premium</span>
                      <span>Graduation Status</span>
                    </div>
                    <div>
                      <div className={`font-bold text-sm ${currentStudent.certificateIssued ? 'text-emerald-600' : 'text-primary'}`}>
                        {currentStudent.certificateIssued ? 'Certificate Conferred' : (currentStudent.attendedLearningHours || 0) >= 40 && (currentStudent.progressPercent || 0) >= 100 ? 'Eligible to Graduate' : 'Curriculum in Progress'}
                      </div>
                      <p className="text-[11px] text-secondary mt-0.5">
                        {currentStudent.certificateNumber || 'Awaiting Gate Clearance'}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Enrolled Courses Card */}
              <div className="bg-surface-container-lowest border border-outline-variant rounded-lg flex flex-col shadow-xs overflow-hidden">
                <div className="px-stack-md py-stack-sm border-b border-outline-variant flex justify-between items-center bg-surface-bright">
                  <h3 className="font-headline-md text-headline-md font-bold text-on-surface">Curriculum Modules &amp; Courses</h3>
                  {isAdminOrAdmissions && (
                    <button 
                      onClick={() => openModal('enroll-student')}
                      className="text-primary hover:text-primary-container transition-colors font-label-md text-label-md font-semibold flex items-center gap-unit cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[18px]">add</span>
                      <span>Add Course</span>
                    </button>
                  )}
                </div>

                <div className="p-stack-md">
                  <ul className="divide-y divide-outline-variant/60">
                    {(currentStudent.courses || []).length === 0 ? (
                      <li className="py-4 text-center text-xs text-secondary">No specific course modules attached to this student record.</li>
                    ) : (
                      (currentStudent.courses || []).map((course) => (
                        <li key={course.id} className="py-stack-md first:pt-0 last:pb-0 flex items-center justify-between">
                          <div className="flex items-center gap-stack-md">
                            <div className="w-9 h-9 rounded bg-secondary-container text-primary flex items-center justify-center font-bold text-xs">
                              {course.code?.slice(0, 2) || 'CS'}
                            </div>
                            <div>
                              <div className="font-label-md text-sm font-bold text-on-surface flex items-center gap-unit">
                                {course.name}
                                <span className="text-[10px] font-data-tabular px-1.5 py-0.2 rounded bg-surface-container text-secondary">
                                  {course.code}
                                </span>
                              </div>
                              <div className="font-body-sm text-xs text-secondary mt-0.5">
                                Instructor: {course.instructor || currentStudent.mentorName || 'Faculty Assigned'} • {course.semester}
                              </div>
                            </div>
                          </div>

                          {!isMentor && (
                            <div className="text-right">
                              <p className="font-data-tabular font-bold text-sm text-primary">{formatNaira(course.fee)}</p>
                              <p className="text-[11px] text-secondary">Billed: {course.billedDate}</p>
                            </div>
                          )}
                        </li>
                      ))
                    )}
                  </ul>
                </div>
              </div>

              {/* Payment Schedule Breakdown: Only for Finance, Super Admin, Admissions */}
              {!isMentor ? (
                <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-stack-md shadow-xs">
                  <div className="flex justify-between items-center mb-stack-sm">
                    <h3 className="font-headline-md text-headline-md font-bold text-on-surface">
                      Tuition Payment Schedule &amp; Due Dates
                    </h3>
                    <span className="text-xs text-secondary">NIBSS Settlement Status</span>
                  </div>

                  <div className="space-y-3">
                    {(currentStudent.installments || []).length === 0 ? (
                      <p className="text-xs text-secondary text-center py-4">No scheduled installments recorded.</p>
                    ) : (
                      (currentStudent.installments || []).map((inst) => (
                        <div key={inst.id} className="flex items-center justify-between p-3 rounded bg-surface border border-outline-variant/50">
                          <div className="flex items-center gap-3">
                            <span className={`material-symbols-outlined ${inst.status === 'Paid' ? 'text-emerald-700' : 'text-amber-600'}`}>
                              {inst.status === 'Paid' ? 'check_circle' : 'pending'}
                            </span>
                            <div>
                              <p className="font-semibold text-xs text-on-surface">{inst.description}</p>
                              <p className="text-[11px] text-secondary">Due: {inst.dueDate}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-xs text-on-surface font-data-tabular">{formatNaira(inst.amount)}</p>
                            <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                              inst.status === 'Paid' ? 'bg-emerald-500/10 text-emerald-700' : 'bg-amber-500/10 text-amber-700'
                            }`}>
                              {inst.status}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ) : null}

              {/* Academic Progress & Syllabus Checklist */}
              <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-stack-md shadow-xs">
                <h3 className="font-headline-md text-headline-md font-bold text-on-surface mb-stack-sm">
                  Curriculum Competencies &amp; Syllabus Progress
                </h3>
                <div className="space-y-2">
                  {[
                    { topic: 'Module 1: Foundations & Architecture Design', done: true },
                    { topic: 'Module 2: Relational Databases, ORM & Migrations', done: true },
                    { topic: 'Module 3: Full-Stack Integration & Secure Authentication', done: (currentStudent.progressPercent || 0) >= 60 },
                    { topic: 'Module 4: Capstone Project & Cloud Deployment', done: (currentStudent.progressPercent || 0) >= 90 },
                  ].map((m, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs py-1.5 border-b border-outline-variant/40 last:border-0">
                      <span className={`material-symbols-outlined text-[18px] ${m.done ? 'text-emerald-600' : 'text-secondary'}`}>
                        {m.done ? 'check_box' : 'check_box_outline_blank'}
                      </span>
                      <span className={m.done ? 'text-on-surface font-semibold' : 'text-secondary'}>
                        {m.topic}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: 4 cols */}
            <div className="lg:col-span-4 flex flex-col gap-gutter">
              {/* Mentorship & 1-on-1 Coaching Logs */}
              <div className="bg-surface-container-lowest border border-outline-variant rounded-lg flex flex-col shadow-xs overflow-hidden">
                <div className="px-stack-md py-stack-sm border-b border-outline-variant bg-surface-bright flex justify-between items-center">
                  <h3 className="font-headline-md text-headline-md font-bold text-on-surface">Faculty Mentor</h3>
                  {isAdminOrAdmissions && (
                    <button
                      onClick={() => {
                        setSelectedStudentForAssignmentId(currentStudent.id);
                        openModal('assign-mentor');
                      }}
                      className="text-xs text-primary font-semibold hover:underline cursor-pointer"
                    >
                      Reassign
                    </button>
                  )}
                </div>

                <div className="p-stack-md space-y-3 text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                      {currentStudent.mentorName?.slice(0, 2) || 'FA'}
                    </div>
                    <div>
                      <div className="font-bold text-on-surface">{currentStudent.mentorName || 'Unassigned'}</div>
                      <div className="text-secondary text-[11px]">Assigned Academic Coach</div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-outline-variant/50 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-secondary">Logged Sessions:</span>
                      <span className="font-bold text-on-surface">{Math.floor((currentStudent.attendedLearningHours || 0) / 2)} Calls</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-secondary">Total Coaching Hours:</span>
                      <span className="font-bold text-primary">{currentStudent.attendedLearningHours || 0} Hours</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Student Performance Evaluations */}
              <div className="bg-surface-container-lowest border border-outline-variant rounded-lg flex flex-col shadow-xs overflow-hidden">
                <div className="px-stack-md py-stack-sm border-b border-outline-variant bg-surface-bright flex justify-between items-center">
                  <h3 className="font-headline-md text-headline-md font-bold text-on-surface">Welfare &amp; Evaluations</h3>
                  <button
                    onClick={() => {
                      setSelectedStudentId(currentStudent.id);
                      openModal('submit-performance-report');
                    }}
                    className="text-xs text-primary font-bold hover:underline cursor-pointer"
                  >
                    + Evaluate
                  </button>
                </div>

                {studentReports.length === 0 ? (
                  <div className="p-6 text-center text-xs text-secondary">
                    No evaluations filed yet. Click "Evaluate" to submit an academic welfare assessment.
                  </div>
                ) : (
                  <div className="divide-y divide-outline-variant/60 max-h-64 overflow-y-auto">
                    {studentReports.map((rep) => (
                      <div key={rep.id} className="p-3 text-xs space-y-1.5">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-on-surface">{rep.mentorName}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            rep.managementFollowUpStatus === 'Resolved' ? 'bg-emerald-500/10 text-emerald-700' : 'bg-amber-500/10 text-amber-700'
                          }`}>
                            {rep.managementFollowUpStatus}
                          </span>
                        </div>
                        <PerformanceMeter score={rep.performanceScore} tier={rep.performanceTier} size="sm" showBar={false} />
                        <p className="text-secondary line-clamp-2">
                          <strong className="text-on-surface">Welfare:</strong> {rep.welfareObservations}
                        </p>
                        <p className="text-secondary line-clamp-2">
                          <strong className="text-on-surface">Recommendation:</strong> {rep.recommendations}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Payment Proof Upload (Hidden for Mentors) */}
              {!isMentor && (
                <div className="bg-surface-container-lowest border border-outline-variant rounded-lg flex flex-col shadow-xs overflow-hidden">
                  <div className="px-stack-md py-stack-sm border-b border-outline-variant bg-surface-bright">
                    <h3 className="font-headline-md text-headline-md font-bold text-on-surface">Upload Payment Proof</h3>
                  </div>
                  <div className="p-stack-md">
                    <label 
                      htmlFor="proof-upload"
                      className="upload-zone border-2 border-dashed border-outline-variant rounded bg-surface hover:bg-surface-container-low hover:border-primary flex flex-col items-center justify-center py-stack-lg px-stack-md text-center cursor-pointer mb-stack-sm transition-all block"
                    >
                      <input 
                        id="proof-upload"
                        type="file" 
                        onChange={handleFileUpload}
                        className="hidden" 
                        accept=".pdf,.jpg,.png"
                      />
                      <div className="w-12 h-12 rounded-full bg-secondary-container text-primary flex items-center justify-center mb-stack-sm mx-auto">
                        <span className="material-symbols-outlined text-[24px]">cloud_upload</span>
                      </div>
                      <div className="font-label-md text-label-md font-bold text-on-surface mb-1">
                        {uploadSuccess ? 'Payment Proof Uploaded!' : 'Drag and drop receipt here'}
                      </div>
                      <div className="font-body-sm text-body-sm text-secondary">
                        {uploadSuccess ? 'Verified and linked to student ledger.' : 'or click to browse Nigerian bank transfer PDF / PNG'}
                      </div>
                    </label>
                    
                    <div className="flex justify-between items-center font-body-sm text-body-sm text-secondary text-xs">
                      <span>Max file size: 5MB</span>
                      <span>Supported: PDF, JPG, PNG</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
