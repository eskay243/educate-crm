import React, { useState } from 'react';
import { useCRM } from '../../context/CRMContext';

export interface CreateCohortModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateCohortModal: React.FC<CreateCohortModalProps> = ({ isOpen, onClose }) => {
  const { courses, activeMentors, addCohort } = useCRM();

  const [name, setName] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState<string>(courses[0]?.id || '__custom__');
  const [customProgramName, setCustomProgramName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [maxCapacity, setMaxCapacity] = useState(40);
  const [instructorName, setInstructorName] = useState(activeMentors[0]?.name || 'Faculty Mentor Assigned');

  if (!isOpen) return null;

  const effectiveProgram = selectedCourseId === '__custom__'
    ? (customProgramName || 'Core Technology Immersive')
    : (courses.find(c => c.id === selectedCourseId)?.title || 'Core Technology Immersive');

  const effectiveProgramId = selectedCourseId === '__custom__'
    ? `prog-${Date.now()}`
    : selectedCourseId;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !startDate || !endDate) return;

    addCohort({
      cohortCode: `COH-${new Date().getFullYear()}-${name.replace(/\s+/g, '-').slice(0, 8).toUpperCase()}`,
      name,
      programId: effectiveProgramId,
      programName: effectiveProgram,
      startDate,
      endDate,
      maxCapacity: Number(maxCapacity),
      instructorName: instructorName || 'Faculty Mentor Assigned',
      status: 'Upcoming',
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-inverse-surface/40 backdrop-blur-xs p-2 sm:p-4 md:p-6 flex min-h-[100dvh] items-end sm:items-center justify-center animate-in fade-in duration-200">
      <div className="fixed inset-0 -z-10" onClick={onClose} aria-hidden="true" />

      <div className="glass-panel relative w-full max-w-2xl max-h-[calc(100dvh-1rem)] sm:max-h-[calc(100dvh-2rem)] md:max-h-[min(90dvh,850px)] rounded-t-2xl sm:rounded-xl shadow-2xl flex flex-col overflow-hidden bg-surface-container-lowest border border-outline-variant z-10 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between p-4 sm:p-5 border-b border-outline-variant bg-surface-bright">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[20px] sm:text-[22px]">date_range</span>
            </div>
            <div>
              <h2 className="font-headline-lg text-base sm:text-lg font-bold text-on-surface">Launch New Student Cohort</h2>
              <p className="font-body-sm text-xs text-secondary">Schedule dates, assign lead faculty, and set maximum student admissions capacity.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-secondary hover:text-primary transition-colors p-1 rounded-full hover:bg-surface-container cursor-pointer shrink-0"
          >
            <span className="material-symbols-outlined text-[20px] sm:text-[24px]">close</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 min-h-0 flex flex-col overflow-hidden">
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1 sm:col-span-2">
              <label className="font-label-md text-xs text-secondary font-semibold">Cohort Title / Name <span className="text-error">*</span></label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Cohort 2027-Q1 Victoria Island Enterprise Track"
                className="w-full h-10 px-3 bg-surface border border-outline-variant rounded font-body-md text-sm text-on-surface focus:border-primary outline-none"
              />
            </div>

            <div className="space-y-1 sm:col-span-2">
              <label className="font-label-md text-xs text-secondary font-semibold">Academic Program <span className="text-error">*</span></label>
              <select
                value={selectedCourseId}
                onChange={e => setSelectedCourseId(e.target.value)}
                className="w-full h-10 px-3 bg-surface border border-outline-variant rounded font-body-md text-sm text-on-surface focus:border-primary outline-none cursor-pointer"
              >
                {courses.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.title} ({c.durationWeeks} Weeks)
                  </option>
                ))}
                <option value="__custom__">+ Enter Custom Academic Program...</option>
              </select>

              {selectedCourseId === '__custom__' && (
                <div className="pt-2 animate-in fade-in">
                  <input
                    type="text"
                    required
                    value={customProgramName}
                    onChange={e => setCustomProgramName(e.target.value)}
                    placeholder="e.g. Full-Stack Software Engineering"
                    className="w-full h-10 px-3 bg-surface border border-primary rounded font-body-md text-sm text-on-surface outline-none"
                  />
                </div>
              )}
            </div>

            <div className="space-y-1">
              <label className="font-label-md text-xs text-secondary font-semibold">Lead Faculty Instructor</label>
              <select
                value={instructorName}
                onChange={e => setInstructorName(e.target.value)}
                className="w-full h-10 px-3 bg-surface border border-outline-variant rounded font-body-md text-sm text-on-surface focus:border-primary outline-none cursor-pointer"
              >
                {activeMentors.length === 0 ? (
                  <option value="Faculty Mentor Assigned">General Faculty Pool (Unassigned)</option>
                ) : (
                  activeMentors.map(m => (
                    <option key={m.id} value={m.name}>
                      {m.name} ({m.department})
                    </option>
                  ))
                )}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-label-md text-xs text-secondary font-semibold">Max Student Capacity</label>
              <input
                type="number"
                min="5"
                max="200"
                value={maxCapacity}
                onChange={e => setMaxCapacity(Number(e.target.value))}
                className="w-full h-10 px-3 bg-surface border border-outline-variant rounded font-body-md text-sm text-on-surface focus:border-primary outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-label-md text-xs text-secondary font-semibold">Start Date <span className="text-error">*</span></label>
              <input
                type="date"
                required
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full h-10 px-3 bg-surface border border-outline-variant rounded font-body-md text-sm text-on-surface focus:border-primary outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-label-md text-xs text-secondary font-semibold">Graduation / End Date <span className="text-error">*</span></label>
              <input
                type="date"
                required
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="w-full h-10 px-3 bg-surface border border-outline-variant rounded font-body-md text-sm text-on-surface focus:border-primary outline-none"
              />
            </div>
          </div>
        </div>

        {/* Sticky Footer Submit Buttons */}
        <div className="shrink-0 p-3 sm:p-4 bg-surface-bright border-t border-outline-variant flex justify-end gap-2 sm:gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 h-10 rounded-lg border border-outline-variant font-label-md text-xs font-semibold text-secondary hover:bg-surface-container transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 h-10 rounded-lg bg-primary text-on-primary font-label-md text-xs font-bold hover:bg-primary/90 transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">add_circle</span>
            <span>Launch Cohort</span>
          </button>
        </div>
      </form>
    </div>
  </div>
  );
};
