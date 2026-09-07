import React, { useState } from 'react';
import { useCRM } from '../../context/CRMContext';

export interface ClockOutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const COMMON_DELIVERABLES = [
  'Processed student admissions & answered prospect inquiries',
  'Conducted student code reviews and 1-on-1 mentorship',
  'Reconciled student tuition fee receipts with bank records',
  'Resolved open student support tickets and course queries',
  'Organized departmental curriculum materials and cohort schedules',
];

export const ClockOutModal: React.FC<ClockOutModalProps> = ({ isOpen, onClose }) => {
  const { activeAttendanceSession, clockOut } = useCRM();

  const [endOfDaySummary, setEndOfDaySummary] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !activeAttendanceSession) return null;

  // Calculate shift duration
  const now = new Date();
  const elapsedMs = Math.max(0, now.getTime() - activeAttendanceSession.clockInTimestamp);
  const hours = Math.floor(elapsedMs / (1000 * 60 * 60));
  const minutes = Math.floor((elapsedMs % (1000 * 60 * 60)) / (1000 * 60));
  const durationText = `${hours}h ${minutes}m`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!endOfDaySummary.trim()) return;

    setIsSubmitting(true);
    try {
      await clockOut({ endOfDaySummary: endOfDaySummary.trim() });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const addDeliverableChip = (del: string) => {
    setEndOfDaySummary(prev => {
      if (!prev) return del;
      if (prev.includes(del)) return prev;
      return `${prev}; ${del}`;
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-inverse-surface/40 backdrop-blur-xs p-margin-page animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="glass-panel relative w-full max-w-xl rounded-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden bg-surface-container-lowest border border-outline-variant z-10">
        {/* Header */}
        <div className="flex items-center justify-between p-stack-md px-stack-lg border-b border-outline-variant bg-surface-bright">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-lg bg-error/10 text-error flex items-center justify-center">
              <span className="material-symbols-outlined text-[24px]">logout</span>
            </div>
            <div>
              <h2 className="font-headline-lg text-lg font-bold text-on-surface">End Shift &amp; Clock-Out</h2>
              <p className="font-body-sm text-xs text-secondary">
                Log End-of-Day Output • Calculate Total Hours
              </p>
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

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-stack-lg space-y-4 flex-1">
          {/* Shift Summary Bento Card */}
          <div className="p-4 bg-surface rounded-lg border border-outline-variant grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <p className="text-[11px] text-secondary font-medium">Clocked In</p>
              <p className="font-bold text-sm font-data-tabular text-on-surface">
                {activeAttendanceSession.clockInTime}
              </p>
              <p className="text-[10px] text-secondary">{activeAttendanceSession.date}</p>
            </div>

            <div>
              <p className="text-[11px] text-secondary font-medium">Time Elapsed</p>
              <p className="font-bold text-sm font-data-tabular text-primary">
                {durationText}
              </p>
              <span className="text-[10px] font-bold text-[#166534] bg-[#dcfce7] px-1.5 py-0.5 rounded">
                Active Shift
              </span>
            </div>

            <div className="col-span-2 sm:col-span-1">
              <p className="text-[11px] text-secondary font-medium">Workstation</p>
              <p className="font-bold text-xs text-on-surface truncate">
                {activeAttendanceSession.workMode}
              </p>
              <p className="text-[10px] text-secondary truncate">{activeAttendanceSession.locationName}</p>
            </div>
          </div>

          {/* Morning Stated Focus */}
          {activeAttendanceSession.dailyTasksFocus && (
            <div className="p-3 rounded-lg border border-outline-variant bg-surface-container-lowest">
              <p className="text-[11px] font-semibold text-secondary mb-1 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[14px]">task_alt</span>
                Morning Stated Objective / Focus:
              </p>
              <p className="text-xs text-on-surface italic">
                &ldquo;{activeAttendanceSession.dailyTasksFocus}&rdquo;
              </p>
            </div>
          )}

          {/* End of Day Accomplishments */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-label-md text-xs font-semibold text-secondary">
                End-of-Day Output &amp; Accomplishment Summary <span className="text-error">*</span>
              </label>
              <span className="text-[11px] text-secondary">Required for office audit</span>
            </div>

            <textarea
              required
              rows={3}
              value={endOfDaySummary}
              onChange={e => setEndOfDaySummary(e.target.value)}
              placeholder="Detail deliverables completed, inquiries resolved, reviews conducted, or items achieved during this shift..."
              className="w-full p-3 bg-surface border border-outline-variant rounded-lg font-body-md text-xs text-on-surface focus:border-primary outline-none resize-none"
            />

            {/* Quick Deliverable Selection Chips */}
            <div className="space-y-1">
              <p className="text-[11px] text-secondary font-medium">Quick Deliverable Tag:</p>
              <div className="flex flex-wrap gap-1.5">
                {COMMON_DELIVERABLES.map(del => (
                  <button
                    key={del}
                    type="button"
                    onClick={() => addDeliverableChip(del)}
                    className="px-2 py-1 rounded bg-surface-container hover:bg-surface-container-high border border-outline-variant text-[11px] text-on-surface transition-colors cursor-pointer text-left"
                  >
                    + {del}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-outline-variant">
            <button
              type="button"
              onClick={onClose}
              className="px-4 h-9 rounded-lg border border-outline-variant text-xs font-bold text-secondary hover:bg-surface-container transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !endOfDaySummary.trim()}
              className="px-5 h-9 rounded-lg bg-error text-white text-xs font-bold hover:bg-error/90 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[16px]">logout</span>
              <span>{isSubmitting ? 'Logging Out...' : `Confirm Clock-Out (${durationText})`}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
