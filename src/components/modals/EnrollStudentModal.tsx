import React, { useState, useEffect } from 'react';
import { useCRM, formatNaira } from '../../context/CRMContext';
import { Student } from '../../types/crm';

export interface EnrollStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EnrollStudentModal: React.FC<EnrollStudentModalProps> = ({ isOpen, onClose }) => {
  const { enrollStudent, activeMentors, courses, cohorts, settings } = useCRM();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  
  // Program selection
  const [selectedCourseId, setSelectedCourseId] = useState<string>(courses[0]?.id || '__custom__');
  const [customProgramTitle, setCustomProgramTitle] = useState('');
  
  // Mentor selection
  const [mentorName, setMentorName] = useState(activeMentors[0]?.name || 'Faculty Mentor Assigned');
  
  // Cohort selection
  const [selectedCohortCode, setSelectedCohortCode] = useState<string>(cohorts[0]?.cohortCode || '__custom__');
  const [customCohortName, setCustomCohortName] = useState(`Cohort ${new Date().getFullYear()}-Q${Math.floor((new Date().getMonth() + 3) / 3)} (Lagos Hub)`);

  // Onboarding Materials (Google Drive)
  const [curriculumDriveUrl, setCurriculumDriveUrl] = useState('');
  const [handbookDriveUrl, setHandbookDriveUrl] = useState('');

  // Financial fields
  const [totalCourseFee, setTotalCourseFee] = useState<number>(courses[0]?.tuitionFee || 850000);
  const [initialPayment, setInitialPayment] = useState<number>(courses[0]?.tuitionFee ? Math.round(courses[0].tuitionFee / 2) : 425000);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer');
  const [proofFileName, setProofFileName] = useState<string | null>(null);

  // Success view state
  const [createdStudent, setCreatedStudent] = useState<Student | null>(null);
  const [copiedPassword, setCopiedPassword] = useState(false);

  // Reset form to blank on modal open
  const resetForm = () => {
    setName('');
    setEmail('');
    setPhone('');
    setCustomProgramTitle('');
    setProofFileName(null);
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setPaymentMethod('bank_transfer');
    setCreatedStudent(null);
    setCopiedPassword(false);
    if (courses.length > 0) {
      setSelectedCourseId(courses[0].id);
      setTotalCourseFee(courses[0].tuitionFee);
      setInitialPayment(Math.round(courses[0].tuitionFee / 2));
      setCurriculumDriveUrl(courses[0].curriculumDriveUrl || settings.defaultCurriculumUrl || '');
    } else {
      setSelectedCourseId('__custom__');
      setTotalCourseFee(850000);
      setInitialPayment(425000);
      setCurriculumDriveUrl(settings.defaultCurriculumUrl || '');
    }
    setHandbookDriveUrl(settings.studentHandbookUrl || '');
    if (activeMentors.length > 0) {
      setMentorName(activeMentors[0].name);
    }
    if (cohorts.length > 0) {
      setSelectedCohortCode(cohorts[0].cohortCode);
    } else {
      setSelectedCohortCode('__custom__');
    }
  };

  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen]);

  // Sync fee and curriculum when selected course changes
  useEffect(() => {
    if (selectedCourseId !== '__custom__') {
      const course = courses.find(c => c.id === selectedCourseId);
      if (course) {
        setTotalCourseFee(course.tuitionFee);
        setInitialPayment(Math.round(course.tuitionFee / 2));
        if (course.curriculumDriveUrl) {
          setCurriculumDriveUrl(course.curriculumDriveUrl);
        } else if (settings.defaultCurriculumUrl) {
          setCurriculumDriveUrl(settings.defaultCurriculumUrl);
        }
      }
    }
  }, [selectedCourseId, courses, settings]);

  if (!isOpen) return null;

  const effectiveProgramName = selectedCourseId === '__custom__' 
    ? (customProgramTitle || 'Professional Technology Track')
    : (courses.find(c => c.id === selectedCourseId)?.title || 'Professional Technology Track');

  const effectiveCohortName = selectedCohortCode === '__custom__'
    ? (customCohortName || 'Cohort Active')
    : (cohorts.find(c => c.cohortCode === selectedCohortCode)?.name || customCohortName);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setProofFileName(e.target.files[0].name);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;

    const outstanding = Math.max(0, totalCourseFee - initialPayment);

    const created = enrollStudent({
      name,
      email,
      phone: phone || '+234 800 000 0000',
      program: effectiveProgramName,
      mentorName: mentorName || 'Faculty Mentor Assigned',
      status: 'Active',
      attendanceRate: 100,
      tuitionStatus: outstanding === 0 ? 'Paid' : initialPayment > 0 ? 'Partial' : 'Overdue',
      cohort: effectiveCohortName,
      curriculumDriveUrl: curriculumDriveUrl.trim() || undefined,
      handbookDriveUrl: handbookDriveUrl.trim() || undefined,
      totalFees: Number(totalCourseFee),
      outstandingBalance: outstanding,
      courses: [
        {
          id: `c-${Date.now()}`,
          code: courses.find(c => c.id === selectedCourseId)?.code || 'TECH-101',
          name: effectiveProgramName,
          semester: `Term ${new Date().getFullYear()}`,
          instructor: mentorName || 'Faculty Mentor Assigned',
          fee: Number(totalCourseFee),
          billedDate: paymentDate,
        }
      ],
      installments: [
        {
          id: `inst-1-${Date.now()}`,
          description: 'Initial Deposit / Seat Lock',
          dueDate: paymentDate,
          amount: Number(initialPayment),
          status: 'Paid',
        },
        ...(outstanding > 0 ? [{
          id: `inst-2-${Date.now()}`,
          description: 'Installment 2 (Tuition Balance Settlement)',
          dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
          amount: outstanding,
          status: 'Pending' as const,
        }] : [])
      ]
    });

    setCreatedStudent(created);
  };

  const outstanding = Math.max(0, totalCourseFee - initialPayment);
  const paidPercent = totalCourseFee > 0 ? Math.min(100, Math.round((initialPayment / totalCourseFee) * 100)) : 0;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-inverse-surface/40 backdrop-blur-xs p-2 sm:p-4 md:p-6 flex flex-col justify-start items-center animate-in fade-in duration-200">
      <div className="fixed inset-0 -z-10" onClick={onClose} aria-hidden="true" />

      <div className="my-auto glass-panel relative w-full max-w-4xl max-h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-2.5rem)] md:max-h-[calc(100dvh-3rem)] rounded-t-2xl sm:rounded-xl shadow-2xl flex flex-col overflow-hidden bg-surface-container-lowest border border-outline-variant z-10 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between p-4 sm:p-5 border-b border-outline-variant bg-surface-bright">
          <div>
            <h2 className="font-headline-lg text-base sm:text-lg md:text-xl font-bold text-on-surface">
              {createdStudent ? '🎉 Student Admitted & Onboarded' : 'Enroll New Student'}
            </h2>
            <p className="font-body-md text-xs sm:text-sm text-secondary">
              {createdStudent 
                ? 'Candidate credentials generated. Email dispatched with admission letter & drive links.' 
                : 'Record candidate profile, course assignment, and initial Naira payment ledger.'}
            </p>
          </div>
          <button
            onClick={() => { resetForm(); onClose(); }}
            aria-label="Close"
            className="text-secondary hover:text-primary transition-colors p-1 rounded-full hover:bg-surface-container cursor-pointer shrink-0"
          >
            <span className="material-symbols-outlined text-[20px] sm:text-[24px]">close</span>
          </button>
        </div>

        {createdStudent ? (
          /* Success Screen */
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-5">
            <div className="bg-[#166534]/10 border border-[#166534]/30 rounded-xl p-5 flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-[#166534] text-white flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[28px]">check_circle</span>
              </div>
              <div>
                <h3 className="font-headline-md font-bold text-on-surface">Provisional Admission Confirmed</h3>
                <p className="text-body-md text-secondary mt-1">
                  <strong>{createdStudent.name}</strong> ({createdStudent.studentCode}) has been admitted into <strong>{createdStudent.program}</strong> ({createdStudent.cohort}).
                </p>
                <p className="text-xs text-secondary mt-0.5">
                  An official admission confirmation email including the formal admission letter and curriculum links has been sent to <strong>{createdStudent.email}</strong>.
                </p>
              </div>
            </div>

            {/* Generated Credentials Card */}
            <div className="bg-surface rounded-xl border border-outline-variant p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-outline-variant/60 pb-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">key</span>
                  <h4 className="font-headline-sm font-bold text-on-surface">Default Student Portal Credentials</h4>
                </div>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                  Password Reset Recommended
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-3 bg-surface-container-lowest rounded-lg border border-outline-variant/60">
                  <span className="text-[11px] text-secondary font-medium">Student Code</span>
                  <p className="font-data-tabular font-bold text-primary text-base mt-0.5">{createdStudent.studentCode}</p>
                </div>

                <div className="p-3 bg-surface-container-lowest rounded-lg border border-outline-variant/60">
                  <span className="text-[11px] text-secondary font-medium">Username / Login Email</span>
                  <p className="font-medium text-on-surface text-sm mt-0.5 truncate">{createdStudent.email}</p>
                </div>

                <div className="p-3 bg-surface-container-lowest rounded-lg border border-outline-variant/60 relative">
                  <span className="text-[11px] text-secondary font-medium">Default Password</span>
                  <div className="flex items-center justify-between mt-0.5">
                    <code className="font-mono font-bold text-on-surface text-sm">{createdStudent.defaultPassword}</code>
                    <button
                      type="button"
                      onClick={() => {
                        if (createdStudent.defaultPassword) {
                          navigator.clipboard.writeText(createdStudent.defaultPassword);
                          setCopiedPassword(true);
                          setTimeout(() => setCopiedPassword(false), 2000);
                        }
                      }}
                      className="text-primary hover:text-primary/80 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        {copiedPassword ? 'done' : 'content_copy'}
                      </span>
                      <span>{copiedPassword ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Password Reset Notice */}
              <div className="flex items-start gap-2.5 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-200">
                <span className="material-symbols-outlined text-[18px] text-amber-600 shrink-0">lock_reset</span>
                <p>
                  <strong>Mandatory Security Prompt:</strong> This student has been flagged with a recommended password reset upon first signing in to the student portal.
                </p>
              </div>
            </div>

            {/* Academic Onboarding Assets */}
            {(createdStudent.curriculumDriveUrl || createdStudent.handbookDriveUrl) && (
              <div className="bg-surface rounded-xl border border-outline-variant p-5 space-y-3">
                <div className="flex items-center gap-2 border-b border-outline-variant/60 pb-3">
                  <span className="material-symbols-outlined text-primary">cloud_done</span>
                  <h4 className="font-headline-sm font-bold text-on-surface">Attached Academic Google Drive Links</h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {createdStudent.curriculumDriveUrl && (
                    <a
                      href={createdStudent.curriculumDriveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 rounded-lg border border-outline-variant/80 hover:border-primary bg-surface-container-lowest flex items-center justify-between transition-colors group cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="material-symbols-outlined text-primary group-hover:scale-110 transition-transform">menu_book</span>
                        <div>
                          <p className="font-bold text-xs text-on-surface">Course Curriculum</p>
                          <p className="text-[11px] text-secondary truncate max-w-[200px]">{createdStudent.curriculumDriveUrl}</p>
                        </div>
                      </div>
                      <span className="material-symbols-outlined text-secondary group-hover:text-primary text-[18px]">open_in_new</span>
                    </a>
                  )}

                  {createdStudent.handbookDriveUrl && (
                    <a
                      href={createdStudent.handbookDriveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 rounded-lg border border-outline-variant/80 hover:border-primary bg-surface-container-lowest flex items-center justify-between transition-colors group cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="material-symbols-outlined text-primary group-hover:scale-110 transition-transform">import_contacts</span>
                        <div>
                          <p className="font-bold text-xs text-on-surface">Student Handbook</p>
                          <p className="text-[11px] text-secondary truncate max-w-[200px]">{createdStudent.handbookDriveUrl}</p>
                        </div>
                      </div>
                      <span className="material-symbols-outlined text-secondary group-hover:text-primary text-[18px]">open_in_new</span>
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-3 border-t border-outline-variant">
              <button
                type="button"
                onClick={() => {
                  const summaryText = `🎓 CODELAB EDUCARE ADMISSION DETAILS\n\nStudent: ${createdStudent.name}\nStudent ID: ${createdStudent.studentCode}\nProgram: ${createdStudent.program}\nCohort: ${createdStudent.cohort || 'Executive'}\n\nPORTAL LOGIN:\nURL: ${window.location.origin}/login?role=student\nUsername: ${createdStudent.email}\nDefault Password: ${createdStudent.defaultPassword}\n\n*Note: You are recommended to reset your default password upon first login.*\n\nACADEMIC RESOURCES:\n${createdStudent.curriculumDriveUrl ? `Course Curriculum: ${createdStudent.curriculumDriveUrl}\n` : ''}${createdStudent.handbookDriveUrl ? `Student Handbook: ${createdStudent.handbookDriveUrl}\n` : ''}`;
                  navigator.clipboard.writeText(summaryText);
                  setCopiedPassword(true);
                  setTimeout(() => setCopiedPassword(false), 2000);
                }}
                className="w-full sm:w-auto px-4 h-10 border border-outline-variant rounded-lg font-label-md text-xs font-semibold text-on-surface hover:bg-surface-container transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">share</span>
                <span>Copy Full Onboarding Slip (WhatsApp/SMS)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  resetForm();
                  onClose();
                }}
                className="w-full sm:w-auto px-6 h-10 bg-primary text-on-primary rounded-lg font-label-md text-xs font-bold hover:bg-primary/90 transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">done_all</span>
                <span>Done &amp; Return to Directory</span>
              </button>
            </div>
          </div>
        ) : (
          /* Form Body with 2 Columns */
          <form onSubmit={handleSubmit} className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
            {/* Left 8 Cols: Student & Payment Details */}
            <div className="lg:col-span-8 space-y-stack-md">
              {/* Student Information Card */}
              <div className="bg-surface rounded-lg border border-outline-variant p-stack-md space-y-4">
                <h3 className="font-headline-md text-headline-md font-bold text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">person</span> Student Information
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-label-md text-xs font-semibold text-secondary">Full Name <span className="text-error">*</span></label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="e.g. Babatunde Adeleke"
                      className="w-full h-10 px-3 bg-surface-container-lowest border border-outline-variant rounded font-body-md text-on-surface focus:border-primary outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-label-md text-xs font-semibold text-secondary">Contact Email <span className="text-error">*</span></label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="babatunde@example.ng"
                      className="w-full h-10 px-3 bg-surface-container-lowest border border-outline-variant rounded font-body-md text-on-surface focus:border-primary outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-label-md text-xs font-semibold text-secondary">Phone Number (WhatsApp)</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="+234 803 123 4567"
                      className="w-full h-10 px-3 bg-surface-container-lowest border border-outline-variant rounded font-body-md text-on-surface focus:border-primary outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-label-md text-xs font-semibold text-secondary">Assigned Faculty Mentor</label>
                    <select
                      value={mentorName}
                      onChange={e => setMentorName(e.target.value)}
                      className="w-full h-10 px-3 bg-surface-container-lowest border border-outline-variant rounded font-body-md text-on-surface focus:border-primary outline-none cursor-pointer"
                    >
                      {activeMentors.length === 0 ? (
                        <option value="Faculty Mentor Assigned">General Faculty Pool (Unassigned)</option>
                      ) : (
                        activeMentors.map(m => (
                          <option key={m.id} value={m.name}>{m.name} ({m.department})</option>
                        ))
                      )}
                    </select>
                  </div>

                  {/* Academic Course Track Selection */}
                  <div className="space-y-1 sm:col-span-2">
                    <label className="font-label-md text-xs font-semibold text-secondary">Academic Program Track <span className="text-error">*</span></label>
                    <select
                      value={selectedCourseId}
                      onChange={e => setSelectedCourseId(e.target.value)}
                      className="w-full h-10 px-3 bg-surface-container-lowest border border-outline-variant rounded font-body-md text-on-surface focus:border-primary outline-none cursor-pointer"
                    >
                      {courses.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.title} — {formatNaira(c.tuitionFee)} ({c.durationWeeks} Weeks)
                        </option>
                      ))}
                      <option value="__custom__">+ Enter Custom Program / Track...</option>
                    </select>

                    {selectedCourseId === '__custom__' && (
                      <div className="pt-2 animate-in fade-in">
                        <input
                          type="text"
                          required
                          value={customProgramTitle}
                          onChange={e => setCustomProgramTitle(e.target.value)}
                          placeholder="e.g. Full-Stack Software Engineering or Enterprise Data Science"
                          className="w-full h-10 px-3 bg-surface-container-lowest border border-primary rounded font-body-md text-on-surface outline-none"
                        />
                      </div>
                    )}
                  </div>

                  {/* Academic Cohort Selection */}
                  <div className="space-y-1 sm:col-span-2">
                    <label className="font-label-md text-xs font-semibold text-secondary">Academic Cohort Assignment <span className="text-error">*</span></label>
                    <select
                      value={selectedCohortCode}
                      onChange={e => setSelectedCohortCode(e.target.value)}
                      className="w-full h-10 px-3 bg-surface-container-lowest border border-outline-variant rounded font-body-md text-on-surface focus:border-primary outline-none cursor-pointer"
                    >
                      {cohorts.map(c => (
                        <option key={c.id} value={c.cohortCode}>
                          {c.name} ({c.cohortCode})
                        </option>
                      ))}
                      <option value="__custom__">+ Enter Custom Cohort Tag...</option>
                    </select>

                    {selectedCohortCode === '__custom__' && (
                      <div className="pt-2 animate-in fade-in">
                        <input
                          type="text"
                          required
                          value={customCohortName}
                          onChange={e => setCustomCohortName(e.target.value)}
                          placeholder="e.g. Cohort 2026-Q4 Lagos Hub"
                          className="w-full h-10 px-3 bg-surface-container-lowest border border-primary rounded font-body-md text-on-surface outline-none"
                        />
                      </div>
                    )}
                  </div>

                  {/* Academic Onboarding Materials (Google Drive Links) */}
                  <div className="space-y-3 sm:col-span-2 pt-3 border-t border-outline-variant/60">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-primary">
                      <span className="material-symbols-outlined text-[16px]">folder_shared</span>
                      <span>Onboarding Materials &amp; Academic Drive Assets</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="font-label-md text-xs font-semibold text-secondary flex items-center justify-between">
                          <span>Course Curriculum (Google Drive)</span>
                          {curriculumDriveUrl && <span className="text-[10px] text-[#166534] font-medium">Link Set</span>}
                        </label>
                        <input
                          type="url"
                          value={curriculumDriveUrl}
                          onChange={e => setCurriculumDriveUrl(e.target.value)}
                          placeholder="https://drive.google.com/file/d/.../view"
                          className="w-full h-10 px-3 bg-surface-container-lowest border border-outline-variant rounded font-body-sm text-xs text-on-surface focus:border-primary outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-label-md text-xs font-semibold text-secondary flex items-center justify-between">
                          <span>Student Handbook (Google Drive)</span>
                          {handbookDriveUrl && <span className="text-[10px] text-[#166534] font-medium">Link Set</span>}
                        </label>
                        <input
                          type="url"
                          value={handbookDriveUrl}
                          onChange={e => setHandbookDriveUrl(e.target.value)}
                          placeholder="https://drive.google.com/file/d/.../view"
                          className="w-full h-10 px-3 bg-surface-container-lowest border border-outline-variant rounded font-body-sm text-xs text-on-surface focus:border-primary outline-none"
                        />
                      </div>
                    </div>
                    <p className="text-[11px] text-secondary">
                      These links will be attached to the student's admission letter email and made available on their student portal.
                    </p>
                  </div>
                </div>
              </div>

              {/* Initial Payment & Tuition Pricing Card */}
              <div className="bg-surface rounded-lg border border-outline-variant p-stack-md space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-headline-md text-headline-md font-bold text-on-surface flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">account_balance_wallet</span> 
                    <span>Tuition Pricing &amp; Initial Payment</span>
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-md text-[11px] uppercase font-bold">
                    Draft Receipt
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-label-md text-xs font-semibold text-secondary">Total Course Fee (₦) <span className="text-error">*</span></label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary font-bold">₦</span>
                      <input
                        type="number"
                        required
                        value={totalCourseFee}
                        onChange={e => setTotalCourseFee(Number(e.target.value))}
                        className="w-full h-10 pl-8 pr-3 bg-surface-container-lowest border border-outline-variant rounded font-data-tabular font-bold text-on-surface focus:border-primary outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="font-label-md text-xs font-semibold text-secondary">Initial Payment Deposit (₦) <span className="text-error">*</span></label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary font-bold">₦</span>
                      <input
                        type="number"
                        required
                        value={initialPayment}
                        onChange={e => setInitialPayment(Number(e.target.value))}
                        className="w-full h-10 pl-8 pr-3 bg-surface-container-lowest border border-outline-variant rounded font-data-tabular font-bold text-on-surface focus:border-primary outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="font-label-md text-xs font-semibold text-secondary">Payment Date</label>
                    <input
                      type="date"
                      value={paymentDate}
                      onChange={e => setPaymentDate(e.target.value)}
                      className="w-full h-10 px-3 bg-surface-container-lowest border border-outline-variant rounded font-body-md text-on-surface focus:border-primary outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-label-md text-xs font-semibold text-secondary">Payment Channel</label>
                    <select
                      value={paymentMethod}
                      onChange={e => setPaymentMethod(e.target.value)}
                      className="w-full h-10 px-3 bg-surface-container-lowest border border-outline-variant rounded font-body-md text-on-surface focus:border-primary outline-none cursor-pointer"
                    >
                      <option value="bank_transfer">Nigerian Bank Transfer (NIBSS / Access Bank)</option>
                      <option value="card">Debit Card (Paystack / Flutterwave)</option>
                      <option value="corporate">Corporate Sponsored Invoice</option>
                    </select>
                  </div>
                </div>

                {/* Upload Proof */}
                <div className="space-y-2 pt-2">
                  <label className="font-label-md text-xs font-semibold text-secondary">Upload Proof of Payment (Bank Receipt)</label>
                  <label 
                    htmlFor="modal-proof-upload"
                    className="border-2 border-dashed border-outline-variant rounded-lg p-5 flex flex-col items-center justify-center bg-surface-container-lowest hover:border-primary transition-colors cursor-pointer block text-center"
                  >
                    <input 
                      id="modal-proof-upload"
                      type="file" 
                      onChange={handleFileUpload} 
                      className="hidden" 
                      accept=".pdf,.jpg,.png"
                    />
                    <div className="w-10 h-10 rounded-full bg-secondary-container text-primary flex items-center justify-center mb-2 mx-auto">
                      <span className="material-symbols-outlined text-[20px]">cloud_upload</span>
                    </div>
                    <p className="font-body-md text-xs text-on-surface">
                      <span className="font-bold text-primary">Click to upload</span> or drag and drop receipt
                    </p>
                    {proofFileName ? (
                      <p className="font-bold text-xs text-[#166534] mt-1 flex items-center justify-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">check_circle</span>
                        <span>{proofFileName}</span>
                      </p>
                    ) : (
                      <p className="font-body-sm text-[11px] text-secondary mt-0.5">PDF, JPG, or PNG (max. 5MB)</p>
                    )}
                  </label>
                </div>
              </div>
            </div>

            {/* Right 4 Cols: Live Settlement Summary */}
            <div className="lg:col-span-4 space-y-stack-md">
              <div className="bg-surface rounded-lg border border-outline-variant p-stack-md space-y-4">
                <h3 className="font-headline-md text-headline-md font-bold text-on-surface">Enrollment Summary</h3>
                
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between items-center py-2 border-b border-outline-variant/60">
                    <span className="text-secondary">Program Track:</span>
                    <span className="font-semibold text-on-surface text-right truncate max-w-[160px]">{effectiveProgramName}</span>
                  </div>

                  <div className="flex justify-between items-center py-2 border-b border-outline-variant/60">
                    <span className="text-secondary">Cohort:</span>
                    <span className="font-semibold text-on-surface text-right truncate max-w-[160px]">{effectiveCohortName}</span>
                  </div>

                  <div className="flex justify-between items-center py-2 border-b border-outline-variant/60 font-data-tabular">
                    <span className="text-secondary font-sans">Total Billed Fee:</span>
                    <span className="font-bold text-primary">{formatNaira(totalCourseFee)}</span>
                  </div>

                  <div className="flex justify-between items-center py-2 border-b border-outline-variant/60 font-data-tabular">
                    <span className="text-secondary font-sans">Initial Paid:</span>
                    <span className="font-bold text-[#166534]">{formatNaira(initialPayment)}</span>
                  </div>

                  <div className="flex justify-between items-center py-2 border-b border-outline-variant/60 font-data-tabular">
                    <span className="text-secondary font-sans">Balance Due:</span>
                    <span className={`font-bold ${outstanding > 0 ? 'text-error' : 'text-[#166534]'}`}>
                      {formatNaira(outstanding)}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1 pt-1 font-data-tabular">
                    <div className="flex justify-between text-[11px] font-semibold text-secondary">
                      <span className="font-sans">Tuition Covered:</span>
                      <span className="font-bold text-primary">{paidPercent}%</span>
                    </div>
                    <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary transition-all duration-300 rounded-full"
                        style={{ width: `${paidPercent}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Settlement Bank Card */}
              <div className="p-3.5 bg-secondary-container/30 border border-primary/20 rounded-lg text-xs space-y-1.5">
                <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Settlement Target (NIBSS)</span>
                <p className="font-bold text-on-surface">Access Bank Nigeria PLC</p>
                <p className="font-data-tabular text-secondary text-[11px]">NUBAN: 0812948192</p>
                <p className="text-[11px] text-secondary">Beneficiary: Nexus Tech Operations Ltd</p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                <button
                  type="submit"
                  className="w-full h-11 bg-primary text-on-primary rounded-lg font-label-md text-xs font-bold hover:bg-primary/90 transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">verified</span>
                  <span>Confirm &amp; Enroll Student</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="w-full h-10 border border-outline-variant rounded-lg font-label-md text-xs font-semibold text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </form>
        )}
      </div>
    </div>
  );
};
