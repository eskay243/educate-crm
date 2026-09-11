import React from 'react';
import { Link } from 'react-router-dom';
import { useCRM, formatNaira } from '../../context/CRMContext';
import { PerformanceMeter } from '../../components/common/PerformanceMeter';

export const StudentDashboardPage: React.FC = () => {
  const { 
    currentUser, 
    currentStudentProfile, 
    mentors, 
    lmsModules, 
    assignments, 
    payTuitionWithPaystack, 
    invoices,
    openModal,
    settings
  } = useCRM();

  const student = currentStudentProfile || {
    id: 'stu-demo',
    studentCode: 'STU-8492',
    name: currentUser?.name || 'Scholar Student',
    email: currentUser?.email || 'student@codelab.institute',
    program: 'Full-Stack Software Engineering',
    cohort: 'Alpha Cohort 2026',
    attendanceRate: 98,
    attendedLearningHours: 38,
    minimumRequiredHours: 40,
    performanceScore: 92,
    performanceTier: 'Exceeding' as const,
    certificateIssued: false,
    certificateNumber: 'CERT-CDL-2026-8492',
    tuitionStatus: 'Partial',
    tuitionAmount: 450000,
    totalFees: 450000,
    paidAmount: 250000,
    outstandingBalance: 200000,
    progressPercent: 33,
    mentorName: 'Dr. Chidi Okeke',
    mentorId: 'men-demo-001',
    completedLessonIds: ['les-1-1'],
    assignmentSubmissions: [],
  };

  const assignedMentor = mentors.find(m => m.id === student.mentorId || m.name === student.mentorName) || mentors[0];
  const pendingInvoice = invoices.find(inv => (inv.studentId === student.id || inv.studentName === student.name) && inv.status !== 'Paid');
  const studentAssignments = assignments.filter(a => a.studentId === student.id || a.studentName === student.name);

  // Total lessons count
  const totalLessons = lmsModules.reduce((acc, m) => acc + (m.lessons?.length || 0), 0) || 7;
  const completedCount = student.completedLessonIds?.length || 1;
  const progressPercentage = student.progressPercent || Math.round((completedCount / totalLessons) * 100);

  const handleQuickPay = () => {
    const amountToPay = student.outstandingBalance && student.outstandingBalance > 0 ? student.outstandingBalance : 50000;
    payTuitionWithPaystack({
      amountNaira: amountToPay,
      invoiceId: pendingInvoice?.id || pendingInvoice?.invoiceNumber,
    });
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Scholar Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary to-primary-container p-6 md:p-8 text-on-primary shadow-lg">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold uppercase tracking-wider">
              <span className="material-symbols-outlined text-sm">verified</span>
              <span>Academic Scholar Portal</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Welcome back, {student.name}!
            </h1>
            <p className="text-white/80 text-sm md:text-base max-w-2xl font-medium">
              Enrolled in <span className="text-white font-bold">{student.program}</span> &bull; {student.cohort} &bull; Matric ID: <span className="font-mono bg-white/10 px-2 py-0.5 rounded">{student.studentCode}</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/student/courses"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white text-primary font-bold shadow-md hover:bg-white/90 active:scale-95 transition-all text-sm"
            >
              <span className="material-symbols-outlined text-lg">play_circle</span>
              <span>Resume Classroom</span>
            </Link>
            <Link
              to="/student/mentor"
              className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold backdrop-blur-md border border-white/20 active:scale-95 transition-all text-sm"
            >
              <span className="material-symbols-outlined text-lg">support_agent</span>
              <span>Coaching</span>
            </Link>
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* Graduation & Certificate Gatekeeping Banner */}
      {(() => {
        const minHours = student.minimumRequiredHours || settings.defaultMinimumLearningHours || 40;
        const attendedHours = student.attendedLearningHours || 0;
        const hasMetHours = attendedHours >= minHours;
        const hasMetCurriculum = progressPercentage >= 100;
        const isEligible = hasMetHours && hasMetCurriculum;
        const isIssued = Boolean(student.certificateIssued);

        return (
          <div className={`p-5 rounded-2xl border transition-all ${
            isIssued
              ? 'bg-emerald-500/10 border-emerald-500/30 text-on-surface'
              : isEligible
              ? 'bg-primary/10 border-primary/30 text-on-surface'
              : 'bg-surface-container-low border-outline-variant text-on-surface'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-3.5">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                  isIssued ? 'bg-emerald-600 text-white shadow-sm' : isEligible ? 'bg-primary text-on-primary shadow-sm' : 'bg-surface-container-high text-secondary'
                }`}>
                  <span className="material-symbols-outlined text-[28px]">
                    {isIssued ? 'workspace_premium' : isEligible ? 'verified' : 'lock_clock'}
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base text-on-surface">
                      {isIssued
                        ? `Official Academic Certificate Awarded (${student.certificateNumber})`
                        : isEligible
                        ? 'Congratulations! You Have Met All Graduation Requirements'
                        : 'Graduation Gatekeeping: 40+ Learning Hours & Syllabus Completion Required'}
                    </h3>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                      isIssued ? 'bg-emerald-600 text-white' : isEligible ? 'bg-primary text-on-primary' : 'bg-amber-500/10 text-amber-700'
                    }`}>
                      {isIssued ? 'Conferred' : isEligible ? 'Eligible' : 'Locked'}
                    </span>
                  </div>
                  <p className="text-xs text-secondary mt-0.5 max-w-2xl">
                    {isIssued
                      ? 'Your official Certificate of Completion is sealed by the CODELAB EDUCARE Academic Board. You can view, verify, and download your credential.'
                      : isEligible
                      ? 'You have completed all curriculum modules and satisfied the minimum required faculty session hours. Click below to view your official Certificate.'
                      : `You have completed ${attendedHours} of ${minHours} verified faculty session hours and ${progressPercentage}% curriculum progress. ${hasMetHours ? 'Complete remaining syllabus modules' : `${minHours - attendedHours} more coaching hour(s) required`} prior to certificate issuance.`}
                  </p>
                </div>
              </div>

              <button
                onClick={() => openModal('view-certificate')}
                className={`px-5 py-2.5 rounded-xl font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0 ${
                  isIssued || isEligible
                    ? 'bg-primary text-on-primary hover:bg-primary/90 active:scale-95'
                    : 'bg-surface-container-high hover:bg-surface-container-highest text-on-surface border border-outline-variant'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">
                  {isIssued ? 'workspace_premium' : isEligible ? 'verified' : 'info'}
                </span>
                <span>{isIssued ? 'View Official Certificate' : isEligible ? 'Claim Certificate' : 'Check Requirements'}</span>
              </button>
            </div>
          </div>
        );
      })()}

      {/* Primary KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Academic Progress */}
        <div className="p-5 rounded-xl border border-outline-variant bg-surface-container-low shadow-xs hover:border-primary/40 transition-colors flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Curriculum Progress</span>
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-lg">auto_stories</span>
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-3xl font-extrabold text-on-surface">{progressPercentage}%</span>
              <span className="text-xs text-on-surface-variant">({completedCount} of {totalLessons} lessons)</span>
            </div>
            <div className="w-full bg-surface-container-high rounded-full h-2 overflow-hidden">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-500" 
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Academic Performance Meter */}
        <div className="p-5 rounded-xl border border-outline-variant bg-surface-container-low shadow-xs hover:border-emerald-500/40 transition-colors flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Performance Meter</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-lg">speed</span>
            </div>
          </div>
          <PerformanceMeter
            score={student.performanceScore ?? 92}
            tier={student.performanceTier ?? 'Exceeding'}
            size="md"
            showBar={true}
          />
        </div>

        {/* Verified Mentorship Learning Hours */}
        <div className="p-5 rounded-xl border border-outline-variant bg-surface-container-low shadow-xs hover:border-blue-500/40 transition-colors flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Learning Hours</span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-lg">timer</span>
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-3xl font-extrabold text-on-surface">
                {student.attendedLearningHours || 0}
              </span>
              <span className="text-xs text-on-surface-variant font-medium">
                / {student.minimumRequiredHours || settings.defaultMinimumLearningHours || 40} required
              </span>
            </div>
            <div className="w-full bg-surface-container-high rounded-full h-2 overflow-hidden">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-500" 
                style={{
                  width: `${Math.min(100, Math.round(((student.attendedLearningHours || 0) / (student.minimumRequiredHours || settings.defaultMinimumLearningHours || 40)) * 100))}%`
                }}
              />
            </div>
          </div>
        </div>

        {/* Assigned Faculty Mentor */}
        <div className="p-5 rounded-xl border border-outline-variant bg-surface-container-low shadow-xs hover:border-purple-500/40 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Faculty Mentor</span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-lg">supervisor_account</span>
            </div>
          </div>
          <div className="font-bold text-on-surface truncate text-base mb-1">
            {assignedMentor?.name || student.mentorName || 'Faculty Mentor'}
          </div>
          <div className="flex items-center gap-2 text-xs text-on-surface-variant mb-2">
            <span className="text-amber-500 font-bold">★ 4.9</span>
            <span>&bull;</span>
            <span className="truncate">{assignedMentor?.track || 'Lead Engineer'}</span>
          </div>
          <Link 
            to="/student/mentor" 
            className="text-xs text-primary font-bold hover:underline inline-flex items-center gap-1"
          >
            <span>Book 1-on-1 Coaching</span>
            <span className="material-symbols-outlined text-xs">arrow_forward</span>
          </Link>
        </div>
      </div>

      {/* Two Column Layout: Tuition Paystack Action + Active Classroom View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Paystack Tuition Card & Payment Center */}
        <div className="lg:col-span-1 space-y-6">
          <div className="rounded-2xl border border-outline-variant bg-surface-container-low p-6 shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl">payments</span>
                <h3 className="font-bold text-on-surface text-lg">Paystack Payment Center</h3>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 font-extrabold uppercase tracking-wider">
                Active Gateway
              </span>
            </div>

            <p className="text-xs text-on-surface-variant mb-5">
              Securely settle your tuition installments or exam fees via Nigerian Debit Cards (Mastercard, Visa, Verve), Bank Transfer, or USSD with instant automated receipt generation.
            </p>

            {/* Tuition Balance Box */}
            <div className="p-4 rounded-xl bg-surface-container border border-outline-variant/60 mb-5 space-y-2">
              <div className="flex justify-between text-xs text-on-surface-variant">
                <span>Current Outstanding:</span>
                <span className="font-bold text-on-surface">{formatNaira(student.outstandingBalance || 0)}</span>
              </div>
              <div className="flex justify-between text-xs text-on-surface-variant">
                <span>Tuition Total:</span>
                <span>{formatNaira(student.tuitionAmount || student.totalFees || 450000)}</span>
              </div>
              <div className="flex justify-between text-xs text-on-surface-variant">
                <span>Amount Settled:</span>
                <span className="text-emerald-600 font-semibold">{formatNaira(student.paidAmount || 0)}</span>
              </div>
            </div>

            {/* Pay with Paystack CTA Button */}
            {(student.outstandingBalance || 0) > 0 ? (
              <button
                onClick={handleQuickPay}
                className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-bold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all text-sm"
              >
                <span className="material-symbols-outlined text-lg">credit_card</span>
                <span>Pay {formatNaira(student.outstandingBalance || 0)} with Paystack</span>
              </button>
            ) : (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 text-center font-bold text-xs flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-base">check_circle</span>
                <span>Tuition Settled in Full</span>
              </div>
            )}

            {/* Supported payment badges */}
            <div className="mt-4 pt-4 border-t border-outline-variant/60 flex items-center justify-between text-[11px] text-on-surface-variant">
              <span>Supported:</span>
              <div className="flex items-center gap-2 font-mono font-semibold text-[10px]">
                <span className="bg-surface-container px-2 py-0.5 rounded border border-outline-variant/40">Mastercard</span>
                <span className="bg-surface-container px-2 py-0.5 rounded border border-outline-variant/40">Visa</span>
                <span className="bg-surface-container px-2 py-0.5 rounded border border-outline-variant/40">Verve</span>
                <span className="bg-surface-container px-2 py-0.5 rounded border border-outline-variant/40">NUBAN</span>
              </div>
            </div>

            <div className="mt-4 text-center">
              <Link to="/student/billing" className="text-xs text-primary font-bold hover:underline inline-flex items-center gap-1">
                <span>View Full Invoice & Payment Receipts</span>
                <span className="material-symbols-outlined text-xs">arrow_forward</span>
              </Link>
            </div>
          </div>

          {/* Academic Help & Mentorship Banner */}
          <div className="rounded-2xl border border-outline-variant bg-surface-container-low p-5 shadow-xs">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                {assignedMentor?.name ? assignedMentor.name.charAt(0) : 'M'}
              </div>
              <div>
                <h4 className="text-sm font-bold text-on-surface">{assignedMentor?.name || 'Assigned Mentor'}</h4>
                <p className="text-xs text-on-surface-variant">Assigned Engineering Faculty</p>
              </div>
            </div>
            <p className="text-xs text-on-surface-variant mb-4 line-clamp-2">
              {assignedMentor?.bio || 'Need help with code reviews, architecture questions, or lab defense? Book a dedicated session.'}
            </p>
            <Link
              to="/student/mentor"
              className="w-full py-2 px-3 rounded-lg border border-primary text-primary hover:bg-primary/5 text-center font-bold text-xs flex items-center justify-center gap-1 transition-colors"
            >
              <span className="material-symbols-outlined text-sm">event</span>
              <span>Schedule 1-on-1 Office Hours</span>
            </Link>
          </div>
        </div>

        {/* Right Column: Structured Curriculum & Recent Submissions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Syllabus / Current Module */}
          <div className="rounded-2xl border border-outline-variant bg-surface-container-low p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-on-surface text-lg">Current Module</h3>
                <p className="text-xs text-on-surface-variant">Continue your hands-on track modules</p>
              </div>
              <Link 
                to="/student/courses" 
                className="text-xs text-primary font-bold hover:underline flex items-center gap-1"
              >
                <span>Open Full Syllabus</span>
                <span className="material-symbols-outlined text-xs">chevron_right</span>
              </Link>
            </div>

            {/* Modules List */}
            <div className="space-y-3">
              {lmsModules.slice(0, 2).map((mod, idx) => (
                <div key={mod.id} className="p-4 rounded-xl border border-outline-variant/80 bg-surface-container/50 hover:bg-surface-container transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-primary">Module {mod.order || idx + 1}</span>
                    <span className="text-xs text-on-surface-variant">{mod.lessons.length} Lessons</span>
                  </div>
                  <h4 className="font-bold text-sm text-on-surface mb-1">{mod.title}</h4>
                  <p className="text-xs text-on-surface-variant line-clamp-1 mb-3">{mod.description}</p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                      <span className="material-symbols-outlined text-sm text-emerald-600">check_circle</span>
                      <span>
                        {mod.lessons.filter(l => student.completedLessonIds?.includes(l.id)).length} of {mod.lessons.length} completed
                      </span>
                    </div>
                    <Link
                      to="/student/courses"
                      className="px-3 py-1.5 rounded-lg bg-primary text-on-primary text-xs font-bold hover:bg-primary/90 transition-colors"
                    >
                      Study Module
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Lab Deliverables & Mentor Grades */}
          <div className="rounded-2xl border border-outline-variant bg-surface-container-low p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-on-surface text-lg">Lab Submissions & Evaluations</h3>
                <p className="text-xs text-on-surface-variant">Track mentor grading and feedback on code deliverables</p>
              </div>
              <Link 
                to="/student/courses" 
                className="text-xs text-primary font-bold hover:underline flex items-center gap-1"
              >
                <span>Submit Lab</span>
                <span className="material-symbols-outlined text-xs">chevron_right</span>
              </Link>
            </div>

            {studentAssignments.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-outline-variant rounded-xl">
                <span className="material-symbols-outlined text-3xl text-on-surface-variant mb-2">assignment</span>
                <p className="text-sm font-semibold text-on-surface">No assignments submitted yet</p>
                <p className="text-xs text-on-surface-variant mt-1 mb-3">Head over to the Classroom to submit your first lab project.</p>
                <Link
                  to="/student/courses"
                  className="inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-primary text-on-primary text-xs font-bold hover:bg-primary/90"
                >
                  <span>Go to Classroom</span>
                  <span className="material-symbols-outlined text-xs">arrow_forward</span>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {studentAssignments.map((sub) => (
                  <div key={sub.id} className="p-4 rounded-xl border border-outline-variant/80 bg-surface-container/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-on-surface">{sub.taskTitle}</span>
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                        sub.status === 'Passed' ? 'bg-emerald-500/10 text-emerald-600' :
                        sub.status === 'Exceptional' ? 'bg-purple-500/10 text-purple-600' :
                        sub.status === 'Needs Revision' ? 'bg-amber-500/10 text-amber-600' :
                        'bg-blue-500/10 text-blue-600'
                      }`}>
                        {sub.status} {sub.grade ? `(${sub.grade}%)` : ''}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-3 text-xs text-on-surface-variant">
                      {sub.githubUrl && (
                        <a href={sub.githubUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline inline-flex items-center gap-1 font-mono">
                          <span className="material-symbols-outlined text-xs">code</span>
                          <span>GitHub Repo</span>
                        </a>
                      )}
                      {sub.liveUrl && (
                        <a href={sub.liveUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
                          <span className="material-symbols-outlined text-xs">open_in_new</span>
                          <span>Live Demo</span>
                        </a>
                      )}
                      <span>&bull;</span>
                      <span>Submitted on {new Date(sub.submittedAt).toLocaleDateString()}</span>
                    </div>

                    {sub.mentorFeedback && (
                      <div className="p-3 rounded-lg bg-surface-container text-xs text-on-surface-variant border-l-4 border-primary">
                        <span className="font-bold text-on-surface block mb-0.5">Mentor Feedback ({sub.reviewedBy}):</span>
                        <p>{sub.mentorFeedback}</p>
                      </div>
                    )}
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
