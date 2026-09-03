import React, { useState } from 'react';
import { useCRM, formatNaira } from '../context/CRMContext';

export interface StudentEnrollmentPageProps {}

export const StudentEnrollmentPage: React.FC<StudentEnrollmentPageProps> = () => {
  const { 
    students, 
    selectedStudentId, 
    setSelectedStudentId, 
    setSelectedInvoiceId, 
    setSelectedStudentForAssignmentId, 
    setSelectedMentorForBookingId,
    openModal,
    currentUser,
    sendPaymentReminder,
    showToast
  } = useCRM();

  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [reminderSent, setReminderSent] = useState(false);
  const [invoiceSent, setInvoiceSent] = useState(false);

  const isMentor = currentUser?.role === 'mentor';
  const isFinance = currentUser?.role === 'finance';
  const isAdminOrAdmissions = currentUser?.role === 'super_admin' || currentUser?.role === 'admissions';

  // If mentor, filter strictly to their assigned students
  const displayedStudents = isMentor
    ? students.filter(s => s.mentorId === currentUser?.mentorId || s.mentorName === currentUser?.name)
    : students;

  const currentStudent = displayedStudents.find(s => s.id === selectedStudentId) || displayedStudents[0];

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

          {isAdminOrAdmissions && (
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

          {isAdminOrAdmissions && (
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => openModal('enroll-student')}
                className="h-10 px-5 rounded-lg bg-primary hover:bg-primary/90 text-on-primary font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">person_add</span>
                <span>Directly Enroll Student</span>
              </button>
              <button
                onClick={() => window.location.href = '/leads'}
                className="h-10 px-4 rounded-lg bg-surface hover:bg-surface-container border border-outline-variant font-bold text-xs text-on-surface transition-colors flex items-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">group</span>
                <span>Go to Admissions Pipeline</span>
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

      {/* Student Switcher Bar & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-stack-md">
        <div>
          <div className="flex items-center gap-stack-sm text-secondary font-body-sm text-body-sm mb-unit">
            <span className="hover:text-primary transition-colors cursor-pointer">Students</span>
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
        <div className="flex gap-stack-sm flex-wrap">
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
              {isAdminOrAdmissions && (
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
          {/* Quick Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-stack-md">
            <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-stack-md shadow-xs">
              <div className="text-secondary font-body-sm text-body-sm mb-1 flex items-center gap-unit">
                <span className="material-symbols-outlined text-[16px]">school</span>
                <span>Enrolled Track</span>
              </div>
              <div className="font-headline-md text-base font-bold text-on-surface truncate">
                {currentStudent.program || 'Software Engineering'}
              </div>
            </div>

            {/* Financial Stats Hidden for Mentors */}
            {!isMentor ? (
              <>
                <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-stack-md shadow-xs">
                  <div className="text-secondary font-body-sm text-body-sm mb-1 flex items-center gap-unit">
                    <span className="material-symbols-outlined text-[16px]">account_balance_wallet</span>
                    <span>Total Fees (₦)</span>
                  </div>
                  <div className="font-display text-display font-bold text-on-surface">
                    {formatNaira(currentStudent.totalFees || 0)}
                  </div>
                </div>

                <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-stack-md relative overflow-hidden shadow-xs">
                  <div className="absolute right-0 top-0 w-16 h-16 bg-error-container rounded-bl-full opacity-50"></div>
                  <div className="text-secondary font-body-sm text-body-sm mb-1 flex items-center gap-unit">
                    <span className="material-symbols-outlined text-[16px]">warning</span>
                    <span>Outstanding Balance (₦)</span>
                  </div>
                  <div className="font-display text-display font-bold text-error">
                    {formatNaira(currentStudent.outstandingBalance || 0)}
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Academic Progression Stats for Mentors */}
                <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-stack-md shadow-xs">
                  <div className="text-secondary font-body-sm text-body-sm mb-1 flex items-center gap-unit">
                    <span className="material-symbols-outlined text-[16px]">trending_up</span>
                    <span>Curriculum Progress</span>
                  </div>
                  <div className="font-display text-display font-bold text-primary">
                    78% Completed
                  </div>
                </div>

                <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-stack-md shadow-xs">
                  <div className="text-secondary font-body-sm text-body-sm mb-1 flex items-center gap-unit">
                    <span className="material-symbols-outlined text-[16px]">event_available</span>
                    <span>Coaching Hours</span>
                  </div>
                  <div className="font-display text-display font-bold text-on-surface">
                    6.5 hrs Logged
                  </div>
                </div>
              </>
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
                          <p className="font-label-md text-sm font-semibold text-on-surface">{inst.description}</p>
                          <p className="text-xs text-secondary flex items-center gap-1.5 mt-0.5">
                            <span className="material-symbols-outlined text-[14px]">event</span>
                            <span>Due Date: <strong className="text-on-surface font-data-tabular">{inst.dueDate}</strong></span>
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-data-tabular font-bold text-on-surface">{formatNaira(inst.amount)}</p>
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                          inst.status === 'Paid' ? 'bg-[#dcfce7] text-[#166534]' : 'bg-[#fef9c3] text-[#854d0e]'
                        }`}>
                          {inst.status}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            /* Academic Mentorship Coaching Notes for Mentor */
            <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-stack-md shadow-xs space-y-3">
              <h3 className="font-headline-md text-headline-md font-bold text-on-surface">
                Faculty Mentorship Objectives &amp; Milestones
              </h3>
              <div className="p-3 bg-surface rounded border border-outline-variant space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-primary uppercase tracking-wider">Target Technical Milestone</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">On Track</span>
                </div>
                <p className="text-on-surface leading-relaxed">
                  Student is currently enrolled and working through core modules with the assigned faculty mentor.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: 4 cols */}
        <div className="lg:col-span-4 flex flex-col gap-gutter">
          {/* Prominent Assigned Faculty Mentor & Student Profile Card */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-stack-md shadow-xs space-y-4">
            <h3 className="font-headline-md text-headline-md font-bold text-on-surface">Student &amp; Mentor Profile</h3>
            
            {/* Mentor Assignment Box */}
            <div className="p-3 bg-secondary-container/40 border border-primary/20 rounded-lg space-y-1">
              <span className="text-[10px] uppercase font-bold text-secondary tracking-wider">Assigned Lead Faculty Mentor</span>
              <p className="text-sm font-bold text-primary flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px]">verified_user</span>
                <span>{currentStudent.mentorName || 'Faculty Mentor Assigned'}</span>
              </p>
              <p className="text-[11px] text-secondary">Department: Academic Faculty</p>
            </div>

            <div className="text-xs space-y-2.5 divide-y divide-outline-variant/60">
              <div className="pt-2">
                <span className="text-secondary text-xs">Student Email:</span>
                <p className="text-on-surface font-medium">{currentStudent.email || 'N/A'}</p>
              </div>
              <div className="pt-2">
                <span className="text-secondary text-xs">Phone (WhatsApp):</span>
                <p className="font-data-tabular text-on-surface font-medium">{currentStudent.phone || 'N/A'}</p>
              </div>
              <div className="pt-2">
                <span className="text-secondary text-xs">Enrolled Academic Cohort:</span>
                <p className="text-on-surface font-semibold">{currentStudent.cohort || 'Cohort In Progress'}</p>
              </div>
            </div>
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
  );
};
