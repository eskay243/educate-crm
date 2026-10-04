import React, { useState, useMemo } from 'react';
import { useCRM } from '../../context/CRMContext';
import { StudentAssignmentSubmission } from '../../types/crm';

interface FacultyGradingInboxProps {
  isMentor: boolean;
}

export const FacultyGradingInbox: React.FC<FacultyGradingInboxProps> = ({ isMentor }) => {
  const { assignments, gradeAssignment, showToast, courses } = useCRM();

  const [statusFilter, setStatusFilter] = useState<'All' | 'Pending' | 'Needs Revision' | 'Passed' | 'Exceptional'>('All');
  const [courseFilter, setCourseFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected submission for grading drawer/modal
  const [selectedSubmission, setSelectedSubmission] = useState<StudentAssignmentSubmission | null>(null);
  const [gradeScore, setGradeScore] = useState<number>(85);
  const [evaluationStatus, setEvaluationStatus] = useState<'Passed' | 'Needs Revision' | 'Exceptional'>('Passed');
  const [mentorFeedback, setMentorFeedback] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter assignments
  const filteredAssignments = useMemo(() => {
    return assignments.filter(a => {
      // Status filter
      if (statusFilter === 'Pending' && a.status !== 'Pending') return false;
      if (statusFilter === 'Needs Revision' && a.status !== 'Needs Revision') return false;
      if (statusFilter === 'Passed' && a.status !== 'Passed' && a.status !== 'Exceptional') return false;

      // Course filter
      if (courseFilter !== 'All' && a.courseTitle !== courseFilter) return false;

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = a.studentName.toLowerCase().includes(query);
        const matchesTask = a.taskTitle.toLowerCase().includes(query);
        const matchesModule = a.moduleTitle.toLowerCase().includes(query);
        if (!matchesName && !matchesTask && !matchesModule) return false;
      }

      return true;
    });
  }, [assignments, statusFilter, courseFilter, searchQuery]);

  // Counts
  const pendingCount = useMemo(() => assignments.filter(a => a.status === 'Pending').length, [assignments]);
  const revisionCount = useMemo(() => assignments.filter(a => a.status === 'Needs Revision').length, [assignments]);
  const passedCount = useMemo(() => assignments.filter(a => a.status === 'Passed' || a.status === 'Exceptional').length, [assignments]);

  const openGradingDrawer = (sub: StudentAssignmentSubmission) => {
    setSelectedSubmission(sub);
    setGradeScore(sub.grade ?? 85);
    setEvaluationStatus(
      sub.status === 'Needs Revision' ? 'Needs Revision' :
      sub.status === 'Exceptional' ? 'Exceptional' : 'Passed'
    );
    setMentorFeedback(sub.mentorFeedback ?? '');
  };

  const closeGradingDrawer = () => {
    setSelectedSubmission(null);
  };

  const handleApplyPreset = (presetScore: number, presetStatus: 'Passed' | 'Needs Revision' | 'Exceptional', presetComment: string) => {
    setGradeScore(presetScore);
    setEvaluationStatus(presetStatus);
    setMentorFeedback(presetComment);
  };

  const handleSubmitGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubmission) return;

    setIsSubmitting(true);
    try {
      await gradeAssignment(
        selectedSubmission.id,
        gradeScore,
        mentorFeedback.trim() || 'Deliverable evaluated and verified by Faculty mentor.',
        evaluationStatus
      );
      closeGradingDrawer();
    } catch (err) {
      showToast('Grading Error', 'Failed to save grade submission.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-stack-md space-y-6">
      {/* Header & Sub-banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-outline-variant/60 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[22px]">fact_check</span>
            <h3 className="font-bold text-base text-on-surface">
              {isMentor ? 'Faculty Code Review & Grading Inbox' : 'Institutional Code Review & Lab Deliverables Ledger'}
            </h3>
          </div>
          <p className="text-xs text-secondary mt-1">
            Evaluate student technical labs, review GitHub pull requests & live deployments, and issue rubric feedback.
          </p>
        </div>

        {/* 3 Metric Pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 text-xs font-bold border border-amber-500/30 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            <span>{pendingCount} Pending Review</span>
          </span>
          <span className="px-3 py-1 rounded-full bg-rose-500/10 text-rose-700 dark:text-rose-300 text-xs font-bold border border-rose-500/30">
            {revisionCount} Needs Revision
          </span>
          <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs font-bold border border-emerald-500/30">
            {passedCount} Approved
          </span>
        </div>
      </div>

      {/* Filter Tabs & Search Controls */}
      <div className="flex justify-between items-center flex-wrap gap-3 bg-surface-container-low p-3 rounded-xl border border-outline-variant">
        <div className="flex border border-outline-variant rounded-lg p-1 bg-surface flex-wrap gap-1">
          <button
            type="button"
            onClick={() => setStatusFilter('All')}
            className={`px-3 py-1.5 rounded text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'All'
                ? 'bg-primary text-on-primary shadow-xs'
                : 'text-secondary hover:text-on-surface'
            }`}
          >
            All Submissions ({assignments.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('Pending')}
            className={`px-3 py-1.5 rounded text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              statusFilter === 'Pending'
                ? 'bg-primary text-on-primary shadow-xs'
                : 'text-secondary hover:text-on-surface'
            }`}
          >
            <span>Pending Review</span>
            {pendingCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-white text-[10px] font-bold">
                {pendingCount}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('Needs Revision')}
            className={`px-3 py-1.5 rounded text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'Needs Revision'
                ? 'bg-primary text-on-primary shadow-xs'
                : 'text-secondary hover:text-on-surface'
            }`}
          >
            Needs Revision ({revisionCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('Passed')}
            className={`px-3 py-1.5 rounded text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'Passed'
                ? 'bg-primary text-on-primary shadow-xs'
                : 'text-secondary hover:text-on-surface'
            }`}
          >
            Approved / Graded ({passedCount})
          </button>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Program filter */}
          <select
            value={courseFilter}
            onChange={e => setCourseFilter(e.target.value)}
            className="h-9 px-3 bg-surface border border-outline-variant rounded-lg text-xs font-medium text-on-surface outline-none cursor-pointer focus:border-primary"
          >
            <option value="All">All Programs</option>
            {courses.map(c => (
              <option key={c.id} value={c.title}>{c.title}</option>
            ))}
          </select>

          {/* Search */}
          <div className="relative">
            <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-outline text-[16px]">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search student or lab..."
              className="h-9 pl-8 pr-3 bg-surface border border-outline-variant rounded-lg text-xs text-on-surface outline-none focus:border-primary w-44 sm:w-56"
            />
          </div>
        </div>
      </div>

      {/* Submissions Ledger */}
      {filteredAssignments.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-outline-variant rounded-2xl bg-surface space-y-2">
          <span className="material-symbols-outlined text-secondary text-4xl">inventory_2</span>
          <h4 className="font-bold text-sm text-on-surface">No Submissions Found</h4>
          <p className="text-xs text-secondary max-w-sm mx-auto">
            {statusFilter === 'Pending'
              ? 'Great work! All student lab deliverables in this queue have been evaluated and graded.'
              : 'No student assignment submissions match your active filter criteria.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAssignments.map((sub) => (
            <div
              key={sub.id}
              className="p-4 rounded-xl bg-surface border border-outline-variant hover:border-primary/50 transition-all shadow-xs space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-outline-variant/50 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary font-bold text-sm flex items-center justify-center shrink-0">
                    {sub.studentName.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold text-sm text-on-surface">{sub.studentName}</h4>
                      <span className="text-[11px] text-secondary font-medium">({sub.courseTitle})</span>
                    </div>
                    <p className="text-xs text-secondary">{sub.moduleTitle}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {sub.status === 'Pending' ? (
                    <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 text-xs font-bold border border-amber-500/30 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                      <span>Pending Faculty Review</span>
                    </span>
                  ) : sub.status === 'Needs Revision' ? (
                    <span className="px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-700 dark:text-rose-300 text-xs font-bold border border-rose-500/30">
                      Needs Revision ({sub.grade}%)
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs font-bold border border-emerald-500/30">
                      {sub.status} ({sub.grade}%)
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => openGradingDrawer(sub)}
                    className="h-8 px-3 rounded-lg bg-primary text-on-primary font-bold text-xs hover:bg-primary/90 transition-colors shadow-xs flex items-center gap-1 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[15px]">rate_review</span>
                    <span>{sub.status === 'Pending' ? 'Grade Lab' : 'Update Grade'}</span>
                  </button>
                </div>
              </div>

              {/* Task Title & Student Notes */}
              <div className="space-y-1.5">
                <h5 className="font-bold text-xs text-on-surface flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-primary text-[16px]">terminal</span>
                  <span>{sub.taskTitle}</span>
                </h5>
                {sub.notes && (
                  <p className="text-xs text-secondary bg-surface-container-low p-2.5 rounded-lg border border-outline-variant/40">
                    <strong className="text-on-surface font-semibold">Student Notes: </strong>
                    {sub.notes}
                  </p>
                )}
              </div>

              {/* Deliverable Links & Reviewer Footnote */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-secondary pt-1">
                <div className="flex items-center gap-3 flex-wrap">
                  {sub.githubUrl && (
                    <a
                      href={sub.githubUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-primary hover:underline font-mono text-[11px] font-bold bg-primary/5 px-2.5 py-1 rounded border border-primary/20"
                    >
                      <span className="material-symbols-outlined text-[14px]">code</span>
                      <span>GitHub Code Repository</span>
                    </a>
                  )}
                  {sub.liveUrl && (
                    <a
                      href={sub.liveUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-emerald-600 hover:underline font-mono text-[11px] font-bold bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200"
                    >
                      <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                      <span>Live Deployment URL</span>
                    </a>
                  )}
                </div>

                <div className="flex items-center gap-2 text-[11px]">
                  <span>Submitted {new Date(sub.submittedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  {sub.reviewedBy && (
                    <span>• Evaluated by <strong className="text-on-surface">{sub.reviewedBy}</strong></span>
                  )}
                </div>
              </div>

              {/* Mentor Written Feedback (if present) */}
              {sub.mentorFeedback && (
                <div className="p-3 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-500/20 text-xs space-y-1">
                  <div className="flex items-center gap-1 text-emerald-700 dark:text-emerald-300 font-bold text-[11px]">
                    <span className="material-symbols-outlined text-[14px]">verified</span>
                    <span>Faculty Feedback</span>
                  </div>
                  <p className="text-secondary">{sub.mentorFeedback}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Review & Grading Drawer / Modal */}
      {selectedSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-inverse-surface/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="absolute inset-0" onClick={closeGradingDrawer} />

          <div className="glass-panel relative w-full max-w-xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden bg-surface-container-lowest border border-outline-variant z-10">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 px-6 border-b border-outline-variant bg-surface-bright">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[22px]">rate_review</span>
                <div>
                  <h3 className="font-bold text-base text-on-surface">Evaluate Lab Deliverable</h3>
                  <p className="text-xs text-secondary">{selectedSubmission.studentName} • {selectedSubmission.taskTitle}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeGradingDrawer}
                className="text-secondary hover:text-on-surface p-1 rounded-full hover:bg-surface-container cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmitGrade} className="overflow-y-auto p-6 space-y-5 flex-1 text-xs">
              {/* Submission Reference Links */}
              <div className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/60 space-y-2">
                <span className="font-bold text-xs uppercase tracking-wider text-secondary">Student Artifacts</span>
                <div className="flex gap-2 flex-wrap">
                  {selectedSubmission.githubUrl && (
                    <a
                      href={selectedSubmission.githubUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-surface border border-outline-variant hover:border-primary text-primary font-bold font-mono text-xs flex items-center gap-1.5 shadow-xs"
                    >
                      <span className="material-symbols-outlined text-[16px]">code</span>
                      <span>Open GitHub Repo</span>
                    </a>
                  )}
                  {selectedSubmission.liveUrl && (
                    <a
                      href={selectedSubmission.liveUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-surface border border-outline-variant hover:border-emerald-600 text-emerald-600 font-bold font-mono text-xs flex items-center gap-1.5 shadow-xs"
                    >
                      <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                      <span>Launch Live URL</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Rubric Presets */}
              <div className="space-y-1.5">
                <label className="font-bold text-secondary">Grading Rubric Presets</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleApplyPreset(95, 'Exceptional', 'Exemplary architectural design, rigorous TypeScript type-safety, and complete test coverage.')}
                    className="p-2 text-left rounded-lg bg-surface border border-outline-variant hover:border-emerald-500 transition-colors cursor-pointer"
                  >
                    <div className="font-bold text-emerald-600">🌟 Exceptional (95%)</div>
                    <div className="text-[10px] text-secondary">Clean architecture & test coverage</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset(85, 'Passed', 'Core functional requirements satisfied cleanly. Good code organization and documentation.')}
                    className="p-2 text-left rounded-lg bg-surface border border-outline-variant hover:border-primary transition-colors cursor-pointer"
                  >
                    <div className="font-bold text-primary">✅ Passed (85%)</div>
                    <div className="text-[10px] text-secondary">All core requirements met</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset(65, 'Needs Revision', 'Code functions partially, but missing essential error handling and input validation edge cases.')}
                    className="p-2 text-left rounded-lg bg-surface border border-outline-variant hover:border-rose-500 transition-colors cursor-pointer"
                  >
                    <div className="font-bold text-rose-600">⚠️ Needs Revision (65%)</div>
                    <div className="text-[10px] text-secondary">Missing error handling / edge cases</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset(50, 'Needs Revision', 'Critical security or structural flaws identified. Please consult lecture notes and resubmit.')}
                    className="p-2 text-left rounded-lg bg-surface border border-outline-variant hover:border-rose-500 transition-colors cursor-pointer"
                  >
                    <div className="font-bold text-rose-600">🔄 Resubmit Required (50%)</div>
                    <div className="text-[10px] text-secondary">Severe logic / architectural flaw</div>
                  </button>
                </div>
              </div>

              {/* Score & Status Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-secondary mb-1">Score (0 - 100%) *</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    required
                    value={gradeScore}
                    onChange={e => setGradeScore(Number(e.target.value))}
                    className="w-full h-10 px-3 bg-surface border border-outline-variant rounded-lg font-mono font-bold text-base text-on-surface outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block font-bold text-secondary mb-1">Evaluation Outcome *</label>
                  <select
                    value={evaluationStatus}
                    onChange={e => setEvaluationStatus(e.target.value as any)}
                    className="w-full h-10 px-3 bg-surface border border-outline-variant rounded-lg font-bold text-xs text-on-surface outline-none cursor-pointer focus:border-primary"
                  >
                    <option value="Exceptional">Exceptional (Honors)</option>
                    <option value="Passed">Passed (Accredited)</option>
                    <option value="Needs Revision">Needs Revision (Redo)</option>
                  </select>
                </div>
              </div>

              {/* Written Mentor Feedback */}
              <div className="space-y-1">
                <label className="block font-bold text-secondary">Actionable Feedback for Student *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Provide concrete praise, code improvement recommendations, and pointers for subsequent labs..."
                  value={mentorFeedback}
                  onChange={e => setMentorFeedback(e.target.value)}
                  className="w-full p-3 bg-surface border border-outline-variant rounded-lg font-medium text-xs text-on-surface outline-none focus:border-primary"
                />
              </div>

              {/* Submit Button */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-outline-variant">
                <button
                  type="button"
                  onClick={closeGradingDrawer}
                  className="px-4 h-9 rounded-lg border border-outline-variant text-secondary hover:text-on-surface text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 h-9 rounded-lg bg-primary text-on-primary text-xs font-bold hover:bg-primary/90 transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">check_circle</span>
                  <span>{isSubmitting ? 'Recording Grade...' : 'Record & Publish Evaluation'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
