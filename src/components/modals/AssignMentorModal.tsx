import React, { useState } from 'react';
import { useCRM } from '../../context/CRMContext';

export interface AssignMentorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AssignMentorModal: React.FC<AssignMentorModalProps> = ({ isOpen, onClose }) => {
  const { students, mentors, assignMentorToStudent, selectedStudentForAssignmentId, openModal } = useCRM();

  const [studentId, setStudentId] = useState<string>(selectedStudentForAssignmentId || students[0]?.id || '');
  const [mentorId, setMentorId] = useState<string>(mentors[0]?.id || '');
  const [assignmentNote, setAssignmentNote] = useState('');

  if (!isOpen) return null;

  const currentStudent = students.find(s => s.id === (studentId || selectedStudentForAssignmentId)) || students[0];
  const currentMentor = mentors.find(m => m.id === (mentorId || mentors[0]?.id)) || mentors[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentStudent || !currentMentor) return;

    assignMentorToStudent(currentStudent.id, currentMentor.id);
    onClose();
  };

  const hasPrerequisites = students.length > 0 && mentors.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-inverse-surface/40 backdrop-blur-xs p-margin-page animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="glass-panel relative w-full max-w-lg rounded-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden bg-surface-container-lowest border border-outline-variant z-10">
        {/* Header */}
        <div className="flex items-center justify-between p-stack-md px-stack-lg border-b border-outline-variant bg-surface-bright">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[22px]">assignment_ind</span>
            <div>
              <h2 className="font-headline-lg text-lg font-bold text-on-surface">Assign Faculty Mentor</h2>
              <p className="font-body-sm text-xs text-secondary">Pair student with specialized faculty for 1-on-1 career &amp; code reviews.</p>
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

        {!hasPrerequisites ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-[28px]">info</span>
            </div>
            <div className="max-w-md mx-auto space-y-1">
              <h3 className="font-bold text-sm text-on-surface">Prerequisites Required</h3>
              <p className="text-xs text-secondary">
                To pair a student with a faculty mentor, ensure you have enrolled at least one student and recruited at least one faculty member.
              </p>
            </div>
            <div className="flex justify-center gap-3 pt-2">
              {mentors.length === 0 && (
                <button
                  type="button"
                  onClick={() => { onClose(); openModal('recruit-mentor'); }}
                  className="px-4 h-9 rounded-lg bg-primary text-white text-xs font-bold hover:bg-primary/90 flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">person_add</span>
                  <span>+ Recruit Mentor</span>
                </button>
              )}
              {students.length === 0 && (
                <button
                  type="button"
                  onClick={() => { onClose(); openModal('enroll-student'); }}
                  className="px-4 h-9 rounded-lg bg-primary text-white text-xs font-bold hover:bg-primary/90 flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">school</span>
                  <span>+ Enroll Student</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Form Body */
          <form onSubmit={handleSubmit} className="overflow-y-auto p-stack-lg space-y-4 flex-1">
            <div className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-label-md text-secondary font-semibold">Select Student Mentee <span className="text-error">*</span></label>
                <select
                  value={studentId || currentStudent?.id}
                  onChange={e => setStudentId(e.target.value)}
                  className="w-full h-10 px-3 bg-surface border border-outline-variant rounded font-body-md text-sm text-on-surface focus:border-primary outline-none cursor-pointer"
                >
                  {students.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} (#{s.studentCode}) - {s.program} [Current: {s.mentorName || 'Unassigned'}]
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-label-md text-secondary font-semibold">Select Dedicated Faculty Mentor <span className="text-error">*</span></label>
                <select
                  value={mentorId || currentMentor?.id}
                  onChange={e => setMentorId(e.target.value)}
                  className="w-full h-10 px-3 bg-surface border border-outline-variant rounded font-body-md text-sm text-on-surface focus:border-primary outline-none cursor-pointer"
                >
                  {mentors.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.department}) - Capacity: {m.activeMentees}/{m.maxCapacity}
                    </option>
                  ))}
                </select>
              </div>

              {currentMentor && (
                <div className="p-3 bg-surface rounded-lg border border-outline-variant space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-on-surface">{currentMentor.name}</span>
                    <span className="text-[11px] text-primary font-semibold">{currentMentor.role}</span>
                  </div>
                  <p className="text-secondary text-[11px]">Expertise: {currentMentor.expertise.join(', ')}</p>
                  <p className="text-[11px] text-secondary">
                    Current Load: <span className="font-bold text-on-surface">{currentMentor.activeMentees} active mentees</span> (Max {currentMentor.maxCapacity})
                  </p>
                </div>
              )}

              <div className="space-y-1">
                <label className="font-label-md text-secondary font-semibold">Assignment Note / Learning Goals</label>
                <textarea
                  rows={2}
                  value={assignmentNote}
                  onChange={e => setAssignmentNote(e.target.value)}
                  placeholder="e.g. Focus on distributed systems and capstone project review..."
                  className="w-full p-2.5 bg-surface border border-outline-variant rounded font-body-md text-sm text-on-surface focus:border-primary outline-none"
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
                className="px-6 h-10 rounded bg-primary text-on-primary font-label-md text-xs font-bold hover:bg-primary-container transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">how_to_reg</span>
                <span>Confirm Assignment</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
