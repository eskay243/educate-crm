import React, { useState, useEffect } from 'react';
import { useCRM } from '../../context/CRMContext';
import { PerformanceMeter, getPerformanceTier } from '../common/PerformanceMeter';

export interface SubmitPerformanceReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultStudentId?: string | null;
}

export const SubmitPerformanceReportModal: React.FC<SubmitPerformanceReportModalProps> = ({
  isOpen,
  onClose,
  defaultStudentId,
}) => {
  const { students, mentors, currentUser, submitStudentPerformanceReport } = useCRM();

  const [selectedStudentId, setSelectedStudentId] = useState<string>(defaultStudentId || '');
  const [score, setScore] = useState<number>(85);
  const [tierOverride, setTierOverride] = useState<'Exceeding' | 'On Track' | 'Needs Support' | 'At Risk' | ''>('');
  const [attendanceRating, setAttendanceRating] = useState<'Consistent' | 'Irregular' | 'Passive'>('Consistent');
  const [technicalUnderstanding, setTechnicalUnderstanding] = useState<string>('');
  const [welfareObservations, setWelfareObservations] = useState<string>('');
  const [recommendations, setRecommendations] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (defaultStudentId) {
      setSelectedStudentId(defaultStudentId);
    } else if (students.length > 0 && !selectedStudentId) {
      setSelectedStudentId(students[0].id);
    }
  }, [defaultStudentId, students]);

  if (!isOpen) return null;

  const currentStudent = students.find(s => s.id === selectedStudentId);
  const computedTier = tierOverride || getPerformanceTier(score);

  // Mentor who is submitting
  const submittingMentor =
    currentUser?.role === 'mentor'
      ? mentors.find(m => m.id === currentUser.mentorId || m.email?.toLowerCase() === currentUser.email?.toLowerCase()) || {
          id: currentUser.id,
          name: currentUser.name,
        }
      : currentStudent
      ? mentors.find(m => m.id === currentStudent.mentorId || m.name === currentStudent.mentorName) || {
          id: 'men-default',
          name: currentStudent.mentorName || currentUser?.name || 'Faculty Mentor',
        }
      : { id: 'men-default', name: currentUser?.name || 'Faculty Mentor' };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentStudent) return;

    setSubmitting(true);
    try {
      await submitStudentPerformanceReport({
        studentId: currentStudent.id,
        studentName: currentStudent.name,
        studentCode: currentStudent.studentCode || 'STU-CDL-2026',
        mentorId: submittingMentor.id,
        mentorName: submittingMentor.name,
        program: currentStudent.program || 'Full-Stack Software Engineering',
        performanceScore: Number(score),
        performanceTier: computedTier,
        attendanceRating,
        technicalMasteryNotes: technicalUnderstanding || 'Demonstrates strong conceptual understanding with consistent lab deliverable submissions.',
        welfareObservations: welfareObservations || 'High motivation observed; no critical impediments reported.',
        recommendations: recommendations || 'Continue with scheduled curriculum track.',
        managementFollowUpStatus: 'Pending Review',
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-inverse-surface/50 backdrop-blur-xs p-4 sm:p-6 overflow-y-auto">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden bg-surface-container-lowest border border-outline-variant z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 px-6 border-b border-outline-variant bg-surface-bright">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-[24px]">assessment</span>
            </div>
            <div>
              <h3 className="font-bold text-base text-on-surface">
                Submit Student Performance &amp; Welfare Report
              </h3>
              <p className="text-xs text-secondary">
                Formal faculty evaluation dispatched to Admissions Head &amp; Super Admin
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-secondary hover:text-on-surface p-1.5 rounded-full hover:bg-surface-container transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
          {/* Target Student Selection */}
          <div>
            <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-2">
              Select Student / Mentee *
            </label>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              required
              className="w-full h-11 px-3.5 rounded-xl border border-outline-variant bg-surface text-sm text-on-surface focus:outline-none focus:border-primary"
            >
              {students.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.name} ({st.studentCode}) — {st.program}
                </option>
              ))}
            </select>
          </div>

          {/* Performance Score & Dynamic Meter Preview */}
          <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-secondary uppercase tracking-wider">
                  Evaluation Score (0 - 100%)
                </span>
                <p className="text-[11px] text-secondary mt-0.5">
                  Algorithmic aptitude, session deliverables &amp; engagement
                </p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-primary font-mono">{score}%</span>
              </div>
            </div>

            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={score}
              onChange={(e) => {
                setScore(Number(e.target.value));
                setTierOverride('');
              }}
              className="w-full accent-primary h-2 bg-surface-container-high rounded-lg cursor-pointer"
            />

            {/* Live Performance Meter */}
            <div className="pt-2 border-t border-outline-variant/60">
              <span className="text-[11px] font-semibold text-secondary block mb-1.5">
                Calculated Classification &amp; Tier Meter:
              </span>
              <PerformanceMeter score={score} tier={computedTier} showBar={true} size="md" />
            </div>
          </div>

          {/* Attendance Rating */}
          <div>
            <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">
              Attendance Rating &amp; Consistency
            </label>
            <select
              value={attendanceRating}
              onChange={(e) => setAttendanceRating(e.target.value as any)}
              className="w-full h-10 px-3 rounded-lg border border-outline-variant bg-surface text-sm text-on-surface focus:outline-none focus:border-primary"
            >
              <option value="Consistent">Consistent (≥90% Attendance)</option>
              <option value="Irregular">Irregular (60–89% Attendance)</option>
              <option value="Passive">Passive / Truant (&lt;60% Attendance)</option>
            </select>
          </div>

          {/* Technical Understanding */}
          <div>
            <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">
              Technical Understanding &amp; Practical Coding Mastery *
            </label>
            <textarea
              rows={3}
              value={technicalUnderstanding}
              onChange={(e) => setTechnicalUnderstanding(e.target.value)}
              placeholder="e.g. Shows exceptional grasp of asynchronous APIs, state management, and schema design. Needs slight guidance on database query indexing."
              required
              className="w-full p-3 rounded-xl border border-outline-variant bg-surface text-sm text-on-surface focus:outline-none focus:border-primary placeholder:text-secondary/50"
            />
          </div>

          {/* Welfare & Well-being Observations */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-secondary uppercase tracking-wider">
                Student Welfare, Impediments &amp; Well-Being *
              </label>
              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
                Critical for pastoral care &amp; retention
              </span>
            </div>
            <textarea
              rows={3}
              value={welfareObservations}
              onChange={(e) => setWelfareObservations(e.target.value)}
              placeholder="e.g. Mention power supply issues, hardware bottlenecks, employment conflicts, or personal well-being concerns that require administrative attention."
              required
              className="w-full p-3 rounded-xl border border-outline-variant bg-surface text-sm text-on-surface focus:outline-none focus:border-primary placeholder:text-secondary/50"
            />
          </div>

          {/* Leadership Recommendations */}
          <div>
            <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">
              Faculty Recommendations to Leadership &amp; Admissions *
            </label>
            <textarea
              rows={3}
              value={recommendations}
              onChange={(e) => setRecommendations(e.target.value)}
              placeholder="e.g. Schedule extra 1-on-1 tutoring; recommend for internship placement; follow up on laptop hardware requisition."
              required
              className="w-full p-3 rounded-xl border border-outline-variant bg-surface text-sm text-on-surface focus:outline-none focus:border-primary placeholder:text-secondary/50"
            />
          </div>

          {/* Submission Buttons */}
          <div className="pt-3 border-t border-outline-variant flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-outline-variant text-sm font-semibold text-secondary hover:bg-surface-container transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl bg-primary text-on-primary text-sm font-bold shadow-md hover:opacity-95 transition-all flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">send</span>
              <span>{submitting ? 'Submitting Evaluation...' : 'Submit Evaluation Report'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
