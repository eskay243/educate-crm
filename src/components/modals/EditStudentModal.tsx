import React, { useState, useEffect } from 'react';
import { useCRM } from '../../context/CRMContext';
import { StudentStatus } from '../../types/crm';

export interface EditStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EditStudentModal: React.FC<EditStudentModalProps> = ({ isOpen, onClose }) => {
  const { students, selectedStudentId, updateStudent, courses, settings } = useCRM();

  const currentStudent = students.find(s => s.id === selectedStudentId) || students[0];

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [program, setProgram] = useState('');
  const [cohort, setCohort] = useState('');
  const [status, setStatus] = useState<StudentStatus>('Active');
  const [welfareNotes, setWelfareNotes] = useState('');
  const [curriculumDriveUrl, setCurriculumDriveUrl] = useState('');
  const [handbookDriveUrl, setHandbookDriveUrl] = useState('');

  useEffect(() => {
    if (currentStudent) {
      setName(currentStudent.name || '');
      setEmail(currentStudent.email || '');
      setPhone(currentStudent.phone || '');
      setProgram(currentStudent.program || '');
      setCohort(currentStudent.cohort || '');
      setStatus(currentStudent.status || 'Active');
      setWelfareNotes(currentStudent.welfareNotes || '');
      setCurriculumDriveUrl(currentStudent.curriculumDriveUrl || '');
      setHandbookDriveUrl(currentStudent.handbookDriveUrl || settings.studentHandbookUrl || '');
    }
  }, [currentStudent, isOpen, settings.studentHandbookUrl]);

  if (!isOpen || !currentStudent) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    updateStudent(currentStudent.id, {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      program,
      cohort,
      status,
      welfareNotes: welfareNotes.trim() || undefined,
      curriculumDriveUrl: curriculumDriveUrl.trim() || undefined,
      handbookDriveUrl: handbookDriveUrl.trim() || undefined,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-inverse-surface/40 backdrop-blur-xs p-2 sm:p-4 md:p-6 flex min-h-[100dvh] items-end sm:items-center justify-center animate-in fade-in duration-200">
      <div className="fixed inset-0 -z-10" onClick={onClose} aria-hidden="true" />

      <div className="glass-panel relative w-full max-w-2xl max-h-[calc(100dvh-1rem)] sm:max-h-[calc(100dvh-2rem)] md:max-h-[min(90dvh,850px)] rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden bg-surface-container-lowest border border-outline-variant z-10 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between p-4 sm:p-5 border-b border-outline-variant bg-surface-bright">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0">
              <span className="material-symbols-outlined text-[20px] sm:text-[24px]">manage_accounts</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-headline-lg text-base sm:text-lg font-bold text-on-surface">Modify Student Biodata</h2>
                <span className="font-data-tabular font-bold px-2 py-0.5 rounded bg-primary/10 text-primary text-xs border border-primary/20">
                  #{currentStudent.studentCode}
                </span>
              </div>
              <p className="font-body-md text-xs text-secondary mt-0.5">
                Update academic track, personal demographic information, and onboarding Google Drive documentation.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-secondary hover:text-primary transition-colors p-1.5 rounded-full hover:bg-surface-container cursor-pointer shrink-0"
          >
            <span className="material-symbols-outlined text-[20px] sm:text-[22px]">close</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 min-h-0 flex flex-col overflow-hidden">
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Student Full Name */}
            <div className="space-y-1">
              <label className="font-label-md text-xs text-secondary font-semibold">
                Full Legal Name <span className="text-error">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full h-10 px-3 bg-surface border border-outline-variant rounded font-body-md text-sm text-on-surface focus:border-primary outline-none"
              />
            </div>

            {/* Email Address */}
            <div className="space-y-1">
              <label className="font-label-md text-xs text-secondary font-semibold">
                Institutional / Contact Email <span className="text-error">*</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full h-10 px-3 bg-surface border border-outline-variant rounded font-body-md text-sm text-on-surface focus:border-primary outline-none"
              />
            </div>

            {/* Phone Number */}
            <div className="space-y-1">
              <label className="font-label-md text-xs text-secondary font-semibold">Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+234 800 000 0000"
                className="w-full h-10 px-3 bg-surface border border-outline-variant rounded font-body-md text-sm text-on-surface focus:border-primary outline-none"
              />
            </div>

            {/* Academic Program */}
            <div className="space-y-1">
              <label className="font-label-md text-xs text-secondary font-semibold">Enrolled Program / Track</label>
              <select
                value={program}
                onChange={e => setProgram(e.target.value)}
                className="w-full h-10 px-3 bg-surface border border-outline-variant rounded font-body-md text-sm text-on-surface focus:border-primary outline-none cursor-pointer"
              >
                {courses.map(c => (
                  <option key={c.id} value={c.title}>{c.title}</option>
                ))}
              </select>
            </div>

            {/* Cohort */}
            <div className="space-y-1">
              <label className="font-label-md text-xs text-secondary font-semibold">Cohort Designation</label>
              <input
                type="text"
                value={cohort}
                onChange={e => setCohort(e.target.value)}
                placeholder="e.g. Q1-2026-Alpha"
                className="w-full h-10 px-3 bg-surface border border-outline-variant rounded font-body-md text-sm text-on-surface focus:border-primary outline-none"
              />
            </div>

            {/* Student Status */}
            <div className="space-y-1">
              <label className="font-label-md text-xs text-secondary font-semibold">Enrollment Lifecycle Status</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as StudentStatus)}
                className="w-full h-10 px-3 bg-surface border border-outline-variant rounded font-body-md text-sm text-on-surface focus:border-primary outline-none cursor-pointer"
              >
                <option value="Active">Active</option>
                <option value="Pending">Pending</option>
                <option value="Paused">Paused</option>
                <option value="Completed">Completed</option>
                <option value="Deactivated">Deactivated</option>
              </select>
            </div>
          </div>

          {/* Google Drive Onboarding Asset Links */}
          <div className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant space-y-3">
            <span className="text-[11px] uppercase tracking-wider font-bold text-secondary flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-primary">folder_shared</span>
              Student Onboarding Assets (Google Drive)
            </span>

            <div className="space-y-2">
              <div>
                <label className="font-label-md text-xs text-secondary font-semibold flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px] text-primary">school</span>
                  Course Curriculum (Google Drive URL)
                </label>
                <input
                  type="url"
                  placeholder="https://drive.google.com/file/d/..."
                  value={curriculumDriveUrl}
                  onChange={e => setCurriculumDriveUrl(e.target.value)}
                  className="w-full h-9 px-3 mt-1 bg-surface border border-outline-variant rounded font-body-md text-xs text-on-surface focus:border-primary outline-none"
                />
              </div>

              <div>
                <label className="font-label-md text-xs text-secondary font-semibold flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px] text-primary">menu_book</span>
                  Student Handbook (Google Drive URL)
                </label>
                <input
                  type="url"
                  placeholder="https://drive.google.com/file/d/..."
                  value={handbookDriveUrl}
                  onChange={e => setHandbookDriveUrl(e.target.value)}
                  className="w-full h-9 px-3 mt-1 bg-surface border border-outline-variant rounded font-body-md text-xs text-on-surface focus:border-primary outline-none"
                />
              </div>
            </div>
          </div>

          {/* Welfare & Support Notes */}
          <div className="space-y-1">
            <label className="font-label-md text-xs text-secondary font-semibold">
              Welfare, Accommodations &amp; Observation Notes
            </label>
            <textarea
              rows={2}
              value={welfareNotes}
              onChange={e => setWelfareNotes(e.target.value)}
              placeholder="Any medical, attendance, or welfare accommodations..."
              className="w-full p-2.5 bg-surface border border-outline-variant rounded font-body-md text-sm text-on-surface focus:border-primary outline-none"
            />
          </div>
        </div>

        {/* Sticky Footer Actions */}
        <div className="shrink-0 p-3 sm:p-4 bg-surface-bright border-t border-outline-variant flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 h-9 rounded-lg border border-outline-variant font-label-md text-xs font-semibold text-secondary hover:bg-surface-container transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 h-9 rounded-lg bg-primary hover:bg-primary/90 text-on-primary font-label-md text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">save</span>
            <span>Save Biodata Changes</span>
          </button>
        </div>
      </form>
    </div>
  </div>
  );
};
