import React, { useState } from 'react';
import { useCRM } from '../../context/CRMContext';

export interface CreateCohortModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateCohortModal: React.FC<CreateCohortModalProps> = ({ isOpen, onClose }) => {
  const { courses, mentors, addCohort } = useCRM();

  const [name, setName] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState<string>(courses[0]?.id || '__custom__');
  const [customProgramName, setCustomProgramName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [maxCapacity, setMaxCapacity] = useState(40);
  const [instructorName, setInstructorName] = useState(mentors[0]?.name || 'Faculty Mentor Assigned');

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-inverse-surface/40 backdrop-blur-xs p-margin-page animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="glass-panel relative w-full max-w-2xl rounded-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden bg-surface-container-lowest border border-outline-variant z-10">
        {/* Header */}
        <div className="flex items-center justify-between p-stack-md px-stack-lg border-b border-outline-variant bg-surface-bright">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[22px]">date_range</span>
            <div>
              <h2 className="font-headline-lg text-lg font-bold text-on-surface">Launch New Student Cohort</h2>
              <p className="font-body-sm text-xs text-secondary">Schedule dates, assign lead faculty, and set maximum student admissions capacity.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-secondary hover:text-primary transition-colors p-1 rounded-full hover:bg-surface-container cursor-pointer"
          >
            <span className="material-symbols-outlined text-[24px]">close</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-stack-lg space-y-4 flex-1">
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
                {mentors.length === 0 ? (
                  <option value="Faculty Mentor Assigned">General Faculty Pool (Unassigned)</option>
                ) : (
                  mentors.map(m => (
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

          {/* Footer Submit Buttons */}
          <div className="pt-stack-sm flex justify-end gap-3 border-t border-outline-variant">
            <button
              type="button"
              onClick={onClose}
              className="px-4 h-10 rounded border border-outline-variant font-label-md text-xs font-semibold text-secondary hover:bg-surface-container transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 h-10 rounded bg-primary text-on-primary font-label-md text-xs font-bold hover:bg-primary/90 transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
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
