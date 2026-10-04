import React, { useState, useEffect } from 'react';
import { useCRM } from '../../context/CRMContext';

interface TakeAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TakeAttendanceModal: React.FC<TakeAttendanceModalProps> = ({ isOpen, onClose }) => {
  const { selectedSlotForAttendance, students, markClassAttendance } = useCRM();

  const [records, setRecords] = useState<{ studentId: string; studentName: string; studentCode?: string; status: 'Attended' | 'Absent' }[]>([]);
  const [sessionNotes, setSessionNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!selectedSlotForAttendance) return;

    // Find all enrolled students matching cohort or course
    const relevantStudents = students.filter(s => {
      if (selectedSlotForAttendance.cohortName && s.cohort === selectedSlotForAttendance.cohortName) {
        return true;
      }
      if (s.program === selectedSlotForAttendance.courseTitle) {
        return true;
      }
      return false;
    });

    // If no students match cohort, fallback to all active students in the course or institute
    const cohortStudents = relevantStudents.length > 0 ? relevantStudents : students;

    const initialMap = cohortStudents.map(st => {
      // Check if already marked previously
      const existing = selectedSlotForAttendance.attendanceRecords?.find(r => r.studentId === st.id || r.studentName === st.name);
      return {
        studentId: st.id,
        studentName: st.name,
        studentCode: st.studentCode,
        status: (existing?.status === 'Attended' ? 'Attended' : (existing?.status === 'Absent' ? 'Absent' : 'Attended')) as 'Attended' | 'Absent',
      };
    });

    setRecords(initialMap);
    setSessionNotes(selectedSlotForAttendance.notes || '');
  }, [selectedSlotForAttendance, students]);

  if (!isOpen || !selectedSlotForAttendance) return null;

  const durationHours = selectedSlotForAttendance.durationHours || 2;
  const attendedCount = records.filter(r => r.status === 'Attended').length;

  const toggleStudent = (studentId: string) => {
    setRecords(prev => prev.map(r => {
      if (r.studentId === studentId) {
        return {
          ...r,
          status: r.status === 'Attended' ? 'Absent' : 'Attended',
        };
      }
      return r;
    }));
  };

  const markAll = (status: 'Attended' | 'Absent') => {
    setRecords(prev => prev.map(r => ({ ...r, status })));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await markClassAttendance(selectedSlotForAttendance.id, records, sessionNotes);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-inverse-surface/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-surface-container-lowest rounded-xl max-w-2xl w-full border border-outline-variant shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-outline-variant flex items-center justify-between bg-surface-container-low">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-700 flex items-center justify-center">
              <span className="material-symbols-outlined text-xl">fact_check</span>
            </div>
            <div>
              <h2 className="font-title-md font-bold text-on-surface">Record Class Attendance</h2>
              <p className="font-body-sm text-on-surface-variant">
                {selectedSlotForAttendance.courseTitle} &bull; {selectedSlotForAttendance.cohortName}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Slot Summary Banner */}
        <div className="bg-surface-container px-6 py-3 border-b border-outline-variant grid grid-cols-2 sm:grid-cols-4 gap-3 text-label-sm">
          <div>
            <span className="text-on-surface-variant text-label-xs block">Lecture Topic:</span>
            <span className="font-semibold text-on-surface truncate block" title={selectedSlotForAttendance.topic}>
              {selectedSlotForAttendance.topic}
            </span>
          </div>
          <div>
            <span className="text-on-surface-variant text-label-xs block">Faculty Mentor:</span>
            <span className="font-semibold text-on-surface truncate block">
              {selectedSlotForAttendance.mentorName}
            </span>
          </div>
          <div>
            <span className="text-on-surface-variant text-label-xs block">Date & Time:</span>
            <span className="font-semibold text-on-surface block">
              {selectedSlotForAttendance.date} ({selectedSlotForAttendance.startTime})
            </span>
          </div>
          <div>
            <span className="text-on-surface-variant text-label-xs block">Duration:</span>
            <span className="font-bold text-emerald-700 block">
              {durationHours} Hours Credited
            </span>
          </div>
        </div>

        {/* Attendance Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-label-md font-semibold text-on-surface">
                Enrolled Scholars ({records.length})
              </span>
              <span className="px-2 py-0.5 rounded-full text-label-xs font-bold bg-emerald-500/10 text-emerald-700">
                {attendedCount} Present
              </span>
              <span className="px-2 py-0.5 rounded-full text-label-xs font-bold bg-rose-500/10 text-rose-700">
                {records.length - attendedCount} Absent
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => markAll('Attended')}
                className="px-2.5 py-1 text-label-xs font-semibold rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
              >
                Mark All Present
              </button>
              <button
                type="button"
                onClick={() => markAll('Absent')}
                className="px-2.5 py-1 text-label-xs font-semibold rounded bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors"
              >
                Mark All Absent
              </button>
            </div>
          </div>

          {/* Student Roster List */}
          <div className="border border-outline-variant rounded-lg divide-y divide-outline-variant max-h-60 overflow-y-auto bg-surface">
            {records.length === 0 ? (
              <div className="p-6 text-center text-on-surface-variant text-body-sm">
                No scholars currently enrolled in this cohort.
              </div>
            ) : (
              records.map((rec) => {
                const isAttended = rec.status === 'Attended';
                return (
                  <div
                    key={rec.studentId}
                    onClick={() => toggleStudent(rec.studentId)}
                    className={`p-3 flex items-center justify-between cursor-pointer transition-colors ${
                      isAttended ? 'bg-emerald-50/40 hover:bg-emerald-50/70' : 'bg-surface hover:bg-surface-container'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-label-sm ${
                        isAttended ? 'bg-emerald-600 text-white' : 'bg-surface-container-high text-on-surface-variant'
                      }`}>
                        {rec.studentName.charAt(0)}
                      </div>
                      <div>
                        <div className="font-semibold text-body-sm text-on-surface">{rec.studentName}</div>
                        <div className="text-label-xs text-on-surface-variant">ID: #{rec.studentCode || rec.studentId}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`px-2.5 py-1 rounded-md text-label-xs font-bold flex items-center gap-1 ${
                        isAttended ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        <span className="material-symbols-outlined text-sm">
                          {isAttended ? 'check_circle' : 'cancel'}
                        </span>
                        {isAttended ? 'Attended (+2h)' : 'Absent'}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div>
            <label className="block text-label-sm font-semibold text-on-surface mb-1">
              Lecture Delivery & Engagement Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={sessionNotes}
              onChange={(e) => setSessionNotes(e.target.value)}
              placeholder="e.g. Covered hands-on coding walkthrough. High participation from Adebayo on database transactions."
              className="w-full p-3 rounded-lg border border-outline bg-surface text-on-surface text-body-sm focus:border-primary focus:outline-none"
            />
          </div>

          <div className="p-3 rounded-lg bg-amber-50/60 border border-amber-200 flex items-start gap-2.5 text-label-xs text-amber-900 leading-relaxed">
            <span className="material-symbols-outlined text-amber-700 text-lg shrink-0 mt-0.5">hourglass_top</span>
            <div>
              <strong className="font-semibold">Dual Governance Impact:</strong> Marking this class awards <strong>{durationHours} learning hours</strong> to each present scholar towards the graduation threshold, and credits <strong>{durationHours} lecturing hours</strong> to <strong>{selectedSlotForAttendance.mentorName}</strong> towards payout eligibility.
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 border-t border-outline-variant flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-outline text-on-surface hover:bg-surface-container text-label-md font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 font-bold text-label-md flex items-center gap-2 shadow-xs disabled:opacity-50 transition-all"
            >
              {isSubmitting ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>
                  <span>Saving Attendance...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-lg">verified</span>
                  <span>Finalize & Credit Hours</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
