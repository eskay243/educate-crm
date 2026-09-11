import React, { useState } from 'react';
import { useCRM } from '../../context/CRMContext';
import { Student } from '../../types/crm';

export interface CertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  student?: Student | null;
}

export const CertificateModal: React.FC<CertificateModalProps> = ({
  isOpen,
  onClose,
  student: targetStudent,
}) => {
  const { students, selectedStudentId, currentStudentProfile, issueCertificate, settings, currentUser } = useCRM();
  const [issuing, setIssuing] = useState(false);

  if (!isOpen) return null;

  // Resolve student
  const student =
    targetStudent ||
    (currentUser?.role === 'student'
      ? currentStudentProfile || students.find(s => s.id === currentUser.studentId)
      : students.find(s => s.id === selectedStudentId)) ||
    students[0];

  if (!student) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-inverse-surface/40 backdrop-blur-xs p-4">
        <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant max-w-sm w-full text-center">
          <p className="text-secondary text-sm mb-4">No student record found for certificate generation.</p>
          <button onClick={onClose} className="px-4 py-2 bg-primary text-on-primary rounded-lg text-sm font-semibold">
            Close
          </button>
        </div>
      </div>
    );
  }

  const minHours = student.minimumRequiredHours || settings.defaultMinimumLearningHours || 40;
  const attendedHours = student.attendedLearningHours || 0;
  const progressPercent = student.progressPercent || 0;
  const hasMetHours = attendedHours >= minHours;
  const hasMetCurriculum = progressPercent >= 100;
  const isEligible = hasMetHours && hasMetCurriculum;
  const isIssued = Boolean(student.certificateIssued);

  const certNumber =
    student.certificateNumber ||
    `CERT-CDL-${new Date().getFullYear()}-${student.studentCode?.replace(/\D/g, '') || Math.floor(1000 + Math.random() * 9000)}`;
  
  const issueDateFormatted = student.certificateIssuedAt
    ? new Date(student.certificateIssuedAt).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : new Date().toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });

  const handlePrint = () => {
    window.print();
  };

  const handleIssue = async () => {
    setIssuing(true);
    try {
      await issueCertificate(student.id);
    } finally {
      setIssuing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-inverse-surface/60 backdrop-blur-sm p-2 sm:p-6 overflow-y-auto print:p-0 print:bg-transparent">
      {/* Backdrop */}
      <div className="fixed inset-0 print:hidden" onClick={onClose} />

      <div className="relative w-full max-w-5xl rounded-2xl shadow-2xl flex flex-col max-h-[96vh] overflow-hidden bg-surface-container-lowest border border-outline-variant z-10 print:max-h-none print:shadow-none print:border-none print:w-full print:rounded-none">
        {/* Modal Toolbar (hidden on print) */}
        <div className="flex items-center justify-between p-4 px-6 border-b border-outline-variant bg-surface-bright print:hidden">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[24px]">workspace_premium</span>
            <div>
              <h3 className="font-bold text-base text-on-surface">
                Official Academic Certificate of Completion
              </h3>
              <p className="text-xs text-secondary">
                CODELAB EDUCARE Academic Senate &amp; Faculty Board
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {!isIssued && isEligible && (
              <button
                onClick={handleIssue}
                disabled={issuing}
                className="px-4 h-9 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">verified</span>
                <span>{issuing ? 'Authorizing...' : 'Issue & Sign Certificate'}</span>
              </button>
            )}

            {(isIssued || isEligible) && (
              <button
                onClick={handlePrint}
                className="px-4 h-9 rounded-lg bg-primary text-on-primary font-bold text-xs hover:opacity-90 transition-all flex items-center gap-1.5 shadow-sm"
              >
                <span className="material-symbols-outlined text-[16px]">print</span>
                <span>Print / Download PDF</span>
              </button>
            )}

            <button
              onClick={onClose}
              aria-label="Close"
              className="text-secondary hover:text-on-surface transition-colors p-1.5 rounded-full hover:bg-surface-container"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        </div>

        {/* Modal Body / Certificate Container */}
        <div className="p-4 sm:p-8 overflow-y-auto bg-surface print:p-0 print:overflow-visible">
          {!isIssued && !isEligible ? (
            /* Graduation Requirements Not Met Card */
            <div className="p-8 rounded-2xl bg-surface-container-low border border-outline-variant text-center max-w-xl mx-auto my-6 shadow-sm">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-600">
                <span className="material-symbols-outlined text-[36px]">lock_clock</span>
              </div>
              <h4 className="text-lg font-bold text-on-surface mb-2">
                Graduation Gatekeeping: Requirements Incomplete
              </h4>
              <p className="text-sm text-secondary mb-6 leading-relaxed">
                CODELAB EDUCARE academic credentials require verified faculty attendance and complete lab submissions prior to official conferral.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left mb-6">
                {/* Hours Requirement */}
                <div
                  className={`p-4 rounded-xl border ${
                    hasMetHours
                      ? 'bg-emerald-500/5 border-emerald-500/20'
                      : 'bg-rose-500/5 border-rose-500/20'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-secondary">Session Learning Hours</span>
                    <span
                      className={`material-symbols-outlined text-[18px] ${
                        hasMetHours ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {hasMetHours ? 'check_circle' : 'cancel'}
                    </span>
                  </div>
                  <div className="text-xl font-bold text-on-surface">
                    {attendedHours} <span className="text-xs text-secondary">/ {minHours} hrs</span>
                  </div>
                  <p className="text-xs mt-1 text-secondary">
                    {hasMetHours
                      ? 'Requirement satisfied.'
                      : `${minHours - attendedHours} more mentor-led hours required.`}
                  </p>
                </div>

                {/* Curriculum Requirement */}
                <div
                  className={`p-4 rounded-xl border ${
                    hasMetCurriculum
                      ? 'bg-emerald-500/5 border-emerald-500/20'
                      : 'bg-rose-500/5 border-rose-500/20'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-secondary">Curriculum Modules</span>
                    <span
                      className={`material-symbols-outlined text-[18px] ${
                        hasMetCurriculum ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {hasMetCurriculum ? 'check_circle' : 'cancel'}
                    </span>
                  </div>
                  <div className="text-xl font-bold text-on-surface">
                    {progressPercent}% <span className="text-xs text-secondary">/ 100%</span>
                  </div>
                  <p className="text-xs mt-1 text-secondary">
                    {hasMetCurriculum
                      ? 'All lessons & labs submitted.'
                      : 'Complete remaining syllabus modules.'}
                  </p>
                </div>
              </div>

              <p className="text-xs text-secondary italic">
                Mentors mark attendance upon completion of 1-on-1 practical sessions. Once satisfied, the certificate will automatically unlock.
              </p>
            </div>
          ) : (
            /* Printable Landscape Certificate */
            <div
              id="certificate-print-area"
              className="relative w-full aspect-[1.414/1] min-h-[580px] sm:min-h-[640px] bg-[#fdfcf7] text-[#0f172a] p-8 sm:p-14 rounded-xl border-8 border-double border-[#00236f] shadow-2xl flex flex-col justify-between overflow-hidden print:w-full print:h-screen print:border-none print:rounded-none print:shadow-none print:p-12"
              style={{
                backgroundImage:
                  'radial-gradient(#00236f08 1.5px, transparent 1.5px), radial-gradient(#d9770608 1.5px, #fdfcf7 1.5px)',
                backgroundSize: '24px 24px',
                backgroundPosition: '0 0, 12px 12px',
              }}
            >
              {/* Guilloché Ornate Corner Ornaments */}
              <div className="absolute top-3 left-3 w-16 h-16 border-t-4 border-l-4 border-[#00236f] pointer-events-none" />
              <div className="absolute top-3 right-3 w-16 h-16 border-t-4 border-r-4 border-[#00236f] pointer-events-none" />
              <div className="absolute bottom-3 left-3 w-16 h-16 border-b-4 border-l-4 border-[#00236f] pointer-events-none" />
              <div className="absolute bottom-3 right-3 w-16 h-16 border-b-4 border-r-4 border-[#00236f] pointer-events-none" />

              {/* Watermark Crest */}
              <div className="absolute inset-0 flex items-center justify-center opacity-[0.035] pointer-events-none">
                <span className="material-symbols-outlined text-[340px] text-[#00236f]">
                  school
                </span>
              </div>

              {/* Certificate Header */}
              <div className="relative text-center z-10">
                <div className="inline-flex items-center justify-center gap-2 px-4 py-1 rounded-full bg-[#00236f]/10 text-[#00236f] text-xs font-black uppercase tracking-[3px] mb-2 border border-[#00236f]/20">
                  <span className="material-symbols-outlined text-[14px]">stars</span>
                  CODELAB EDUCARE ACADEMIC SENATE
                </div>
                <h1 className="text-3xl sm:text-4xl font-black text-[#00236f] tracking-tight uppercase font-serif">
                  Certificate of Completion
                </h1>
                <p className="text-xs sm:text-sm font-semibold tracking-[4px] uppercase text-[#d97706] mt-1">
                  AND PROFESSIONAL PRACTICUM EXCELLENCE
                </p>
                <div className="w-48 h-0.5 mx-auto bg-gradient-to-r from-transparent via-[#d97706] to-transparent mt-2 mb-4" />
              </div>

              {/* Certificate Recipient & Body */}
              <div className="relative text-center my-auto z-10 px-4 sm:px-12">
                <p className="text-xs sm:text-sm text-[#475569] font-medium tracking-wide">
                  This is to certify that
                </p>

                <div className="my-3">
                  <h2 className="text-2xl sm:text-4xl font-extrabold text-[#0f172a] underline decoration-[#d97706] decoration-2 underline-offset-8 font-serif tracking-tight">
                    {student.name}
                  </h2>
                  <p className="text-xs font-mono font-bold text-[#64748b] mt-2">
                    Student ID: {student.studentCode || 'STU-CDL-2026'} · Lagos, Federal Republic of Nigeria
                  </p>
                </div>

                <p className="text-xs sm:text-sm text-[#334155] leading-relaxed max-w-2xl mx-auto font-medium">
                  has successfully fulfilled all academic curriculum requirements, submitted production-grade engineering deliverables, and completed{' '}
                  <strong className="text-[#00236f] font-bold">
                    {attendedHours >= minHours ? attendedHours : minHours}+ verified hours
                  </strong>{' '}
                  of faculty-led mentorship and practical software engineering in
                </p>

                <div className="my-3">
                  <span className="inline-block px-5 py-2 rounded-lg bg-[#00236f]/5 border border-[#00236f]/20 text-[#00236f] font-extrabold text-base sm:text-lg tracking-wide uppercase">
                    {student.program || 'Full-Stack Software Engineering'}
                  </span>
                </div>
              </div>

              {/* Certificate Footer / Holographic Seal & Signatures */}
              <div className="relative z-10 pt-4 border-t border-[#e2e8f0] flex items-end justify-between px-2 sm:px-8">
                {/* Left Signature: Managing Director */}
                <div className="text-center w-48 sm:w-56">
                  <div className="h-12 flex items-center justify-center">
                    <span className="font-serif italic text-lg sm:text-xl font-bold text-[#00236f] tracking-wide">
                      Abiola Adefowope
                    </span>
                  </div>
                  <div className="w-full h-px bg-[#0f172a]/40 mb-1" />
                  <p className="text-xs font-bold text-[#0f172a] uppercase tracking-wider">
                    Abiola Adefowope
                  </p>
                  <p className="text-[10px] text-[#64748b] font-medium">
                    Managing Director &amp; CEO
                  </p>
                </div>

                {/* Center: Gold Holographic Seal */}
                <div className="text-center px-4 my-auto">
                  <div className="relative w-20 h-20 sm:w-24 sm:h-24 mx-auto rounded-full bg-gradient-to-tr from-[#b45309] via-[#f59e0b] to-[#fef3c7] p-1 shadow-lg flex items-center justify-center border-2 border-[#78350f]">
                    <div className="w-full h-full rounded-full border border-dashed border-[#78350f]/60 flex flex-col items-center justify-center text-center p-1 bg-[#fffbeb]/90 shadow-inner">
                      <span className="material-symbols-outlined text-[24px] text-[#b45309]">
                        verified_user
                      </span>
                      <span className="text-[7px] sm:text-[8px] font-black tracking-tighter text-[#78350f] uppercase leading-tight mt-0.5">
                        CODELAB EDUCARE<br />OFFICIAL SEAL
                      </span>
                    </div>
                  </div>
                  <p className="text-[9px] font-mono text-[#64748b] mt-1">
                    Serial: {certNumber}
                  </p>
                </div>

                {/* Right Signature: Dean of Academic Affairs */}
                <div className="text-center w-48 sm:w-56">
                  <div className="h-12 flex items-center justify-center">
                    <span className="font-serif italic text-lg sm:text-xl font-bold text-[#00236f] tracking-wide">
                      Dr. Arthur Pendelton
                    </span>
                  </div>
                  <div className="w-full h-px bg-[#0f172a]/40 mb-1" />
                  <p className="text-xs font-bold text-[#0f172a] uppercase tracking-wider">
                    Dr. Arthur Pendelton
                  </p>
                  <p className="text-[10px] text-[#64748b] font-medium">
                    Dean of Academic Affairs &amp; Faculty
                  </p>
                </div>
              </div>

              {/* Legal Footer Bottom Strip */}
              <div className="relative z-10 text-center text-[9px] text-[#94a3b8] mt-3 flex items-center justify-between border-t border-[#e2e8f0]/60 pt-2">
                <span>RC-1849201 · TIN-29481029-0001</span>
                <span>Date of Issue: {issueDateFormatted}</span>
                <span>Verification: http://72.61.106.87/verify/{certNumber}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
