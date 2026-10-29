import React, { useState, useEffect } from 'react';
import { useCRM } from '../../context/CRMContext';
import { DailyStandupTask, WeeklyScrumPerformance } from '../../types/crm';

export interface DailyStandupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AVAILABLE_MODULES = [
  { id: 'leads', name: 'Leads & Admissions' },
  { id: 'expenses', name: 'Finance & Expenses' },
  { id: 'lms', name: 'LMS & Curriculum' },
  { id: 'billing', name: 'Billing & Invoicing' },
  { id: 'mentors', name: 'Mentors & Faculty' },
  { id: 'students', name: 'Student Records' },
  { id: 'attendance', name: 'Attendance & Timetable' },
  { id: 'tickets', name: 'Support Tickets' },
];

export const DailyStandupModal: React.FC<DailyStandupModalProps> = ({ isOpen, onClose }) => {
  const {
    currentUser,
    todayStandup,
    fetchTodayStandup,
    submitDailyStandup,
    generateWeeklyScrumEvaluation,
    weeklyScrumReports,
    showToast,
  } = useCRM();

  const [activeTab, setActiveTab] = useState<'standup' | 'weekly'>('standup');

  // Form states for Standup
  const [tasksYesterday, setTasksYesterday] = useState<DailyStandupTask[]>([
    { id: `y-${Date.now()}-1`, description: '', moduleId: 'leads', status: 'completed' },
  ]);
  const [tasksToday, setTasksToday] = useState<DailyStandupTask[]>([
    { id: `t-${Date.now()}-1`, description: '', moduleId: 'leads', status: 'in_progress' },
  ]);
  const [blockers, setBlockers] = useState<string[]>(['']);
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEvaluatingWeekly, setIsEvaluatingWeekly] = useState(false);
  const [activeWeeklyReport, setActiveWeeklyReport] = useState<WeeklyScrumPerformance | null>(null);

  // Initialize modules based on currentUser assignedModules
  useEffect(() => {
    if (currentUser?.assignedModules && currentUser.assignedModules.length > 0) {
      setSelectedModules(currentUser.assignedModules);
    } else {
      setSelectedModules(AVAILABLE_MODULES.map(m => m.id));
    }
  }, [currentUser]);

  // Load today's standup on modal open
  useEffect(() => {
    if (isOpen && currentUser) {
      fetchTodayStandup();
      // Check existing weekly report
      const myWeekly = weeklyScrumReports.find(r => r.userId === currentUser.id);
      if (myWeekly) {
        setActiveWeeklyReport(myWeekly);
      }
    }
  }, [isOpen, currentUser, fetchTodayStandup, weeklyScrumReports]);

  if (!isOpen) return null;

  const handleAddYesterdayTask = () => {
    setTasksYesterday(prev => [
      ...prev,
      {
        id: `y-${Date.now()}-${prev.length + 1}`,
        description: '',
        moduleId: selectedModules[0] || 'leads',
        status: 'completed',
      },
    ]);
  };

  const handleRemoveYesterdayTask = (id: string) => {
    setTasksYesterday(prev => prev.filter(t => t.id !== id));
  };

  const handleUpdateYesterdayTask = (id: string, updates: Partial<DailyStandupTask>) => {
    setTasksYesterday(prev => prev.map(t => (t.id === id ? { ...t, ...updates } : t)));
  };

  const handleAddTodayTask = () => {
    setTasksToday(prev => [
      ...prev,
      {
        id: `t-${Date.now()}-${prev.length + 1}`,
        description: '',
        moduleId: selectedModules[0] || 'leads',
        status: 'in_progress',
      },
    ]);
  };

  const handleRemoveTodayTask = (id: string) => {
    setTasksToday(prev => prev.filter(t => t.id !== id));
  };

  const handleUpdateTodayTask = (id: string, updates: Partial<DailyStandupTask>) => {
    setTasksToday(prev => prev.map(t => (t.id === id ? { ...t, ...updates } : t)));
  };

  const handleAddBlocker = () => {
    setBlockers(prev => [...prev, '']);
  };

  const handleRemoveBlocker = (index: number) => {
    setBlockers(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpdateBlocker = (index: number, val: string) => {
    setBlockers(prev => {
      const next = [...prev];
      next[index] = val;
      return next;
    });
  };

  const toggleModuleSelection = (moduleId: string) => {
    setSelectedModules(prev =>
      prev.includes(moduleId) ? prev.filter(m => m !== moduleId) : [...prev, moduleId]
    );
  };

  const handleSubmitStandup = async (e: React.FormEvent) => {
    e.preventDefault();

    const validYesterday = tasksYesterday.filter(t => t.description.trim().length > 0);
    const validToday = tasksToday.filter(t => t.description.trim().length > 0);

    if (validYesterday.length === 0 && validToday.length === 0) {
      showToast('Validation Error', 'Please log at least one task for yesterday or today.', 'warning');
      return;
    }

    const cleanBlockers = blockers.filter(b => b.trim().length > 0);

    setIsSubmitting(true);
    try {
      const success = await submitDailyStandup({
        tasksYesterday: validYesterday,
        tasksToday: validToday,
        blockers: cleanBlockers,
        taggedModuleIds: selectedModules,
      });
      if (success) {
        await fetchTodayStandup();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGenerateWeekly = async () => {
    if (!currentUser) return;
    setIsEvaluatingWeekly(true);
    try {
      const res = await generateWeeklyScrumEvaluation(currentUser.id);
      if (res) {
        setActiveWeeklyReport(res);
      }
    } finally {
      setIsEvaluatingWeekly(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-inverse-surface/50 backdrop-blur-xs p-2 sm:p-4 md:p-6 flex flex-col justify-start items-center animate-in fade-in duration-200">
      <div className="fixed inset-0 -z-10" onClick={onClose} aria-hidden="true" />
      <div 
        className="my-auto relative w-full max-w-3xl max-h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-2.5rem)] md:max-h-[calc(100dvh-3rem)] rounded-t-2xl sm:rounded-2xl shadow-modal flex flex-col overflow-hidden bg-surface border border-outline z-10 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Kinetic Enterprise Institutional Black */}
        <div className="shrink-0 p-4 sm:p-5 bg-crisp-black text-white flex justify-between items-start border-b border-outline">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/10 flex items-center justify-center text-white shrink-0">
              <span className="material-symbols-outlined text-[22px] sm:text-[24px]">psychology</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display text-base sm:text-lg font-bold">AI Scrum &amp; Daily Standup</h3>
                <span className="text-[10px] bg-primary/20 text-blue-200 px-2 py-0.5 rounded-full border border-blue-400/30 font-bold flex items-center gap-1">
                  <span className="material-symbols-outlined text-[12px]">auto_awesome</span> AI Coach
                </span>
              </div>
              <p className="text-xs text-white/70">
                Log daily task progress across assigned CRM modules &amp; measure weekly team velocity
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer shrink-0"
            aria-label="Close dialog"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="shrink-0 flex border-b border-outline bg-surface-bright px-4 sm:px-6 pt-2 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('standup')}
            className={`pb-3 px-3 text-xs font-bold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
              activeTab === 'standup'
                ? 'border-primary text-primary'
                : 'border-transparent text-secondary hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">calendar_today</span>
            <span>Today&apos;s Standup</span>
            {todayStandup && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Submitted for today" />
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('weekly')}
            className={`pb-3 px-3 text-xs font-bold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
              activeTab === 'weekly'
                ? 'border-primary text-primary'
                : 'border-transparent text-secondary hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">bar_chart</span>
            <span>Weekly Performance &amp; Velocity</span>
            {activeWeeklyReport && (
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-primary/10 text-primary font-mono font-bold">
                {activeWeeklyReport.letterGrade}
              </span>
            )}
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-5 bg-canvas">
          {activeTab === 'standup' ? (
            <div>
              {/* Today's Existing Submission Banner if present */}
              {todayStandup && (
                <div className="mb-5 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950">
                  <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                    <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs sm:text-sm">
                      <span className="material-symbols-outlined text-[18px] text-emerald-600">check_circle</span>
                      <span>Standup Recorded for Today ({todayStandup.date})</span>
                    </div>
                    <span className="text-[11px] text-emerald-700 font-mono">
                      Logged at {new Date(todayStandup.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {todayStandup.aiAgentFeedback && (
                    <div className="mt-3 p-3.5 bg-surface rounded-lg border border-primary/20 text-xs text-on-surface shadow-xs">
                      <div className="flex items-center gap-1.5 text-primary font-bold mb-1">
                        <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
                        AI Scrum Master Feedback:
                      </div>
                      <p className="leading-relaxed text-secondary">{todayStandup.aiAgentFeedback}</p>
                    </div>
                  )}

                  <div className="mt-3 flex items-center justify-between text-xs text-emerald-800 pt-2 border-t border-emerald-200/60 font-medium flex-wrap gap-2">
                    <span>
                      Yesterday Tasks: <strong className="text-on-surface">{todayStandup.tasksYesterday.length}</strong> | Today
                      Commitments: <strong className="text-on-surface">{todayStandup.tasksToday.length}</strong> | Blockers:{' '}
                      <strong className="text-on-surface">{todayStandup.blockers.length}</strong>
                    </span>
                    <span className="text-emerald-700 font-bold flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">verified</span>
                      Status: Active &amp; Tracked
                    </span>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmitStandup} className="space-y-5">
                {/* Module Scope Selector */}
                <div className="p-4 rounded-xl bg-surface border border-outline shadow-xs">
                  <label className="text-xs font-bold text-on-surface mb-2.5 flex items-center gap-1.5 uppercase tracking-wider">
                    <span className="material-symbols-outlined text-[16px] text-primary">layers</span>
                    <span>Assigned Operational Modules ({currentUser?.role})</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {AVAILABLE_MODULES.map(mod => {
                      const isSelected = selectedModules.includes(mod.id);
                      return (
                        <button
                          key={mod.id}
                          type="button"
                          onClick={() => toggleModuleSelection(mod.id)}
                          className={`text-xs px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-primary text-white border-primary shadow-xs font-bold'
                              : 'bg-surface border-outline text-secondary hover:border-outline-variant hover:text-on-surface'
                          }`}
                        >
                          {mod.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Section 1: Tasks Yesterday */}
                <div className="p-4 rounded-xl bg-surface border border-outline shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-bold">
                        1
                      </div>
                      <h4 className="text-xs sm:text-sm font-bold text-on-surface">What did you complete or work on yesterday?</h4>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddYesterdayTask}
                      className="text-xs text-primary hover:text-primary-hover flex items-center gap-1 font-bold cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">add</span> Add Task
                    </button>
                  </div>

                  <div className="space-y-2">
                    {tasksYesterday.map((task, idx) => (
                      <div key={task.id} className="flex items-center gap-2 bg-canvas p-2.5 rounded-lg border border-outline">
                        <input
                          type="text"
                          placeholder={`Yesterday task #${idx + 1}...`}
                          value={task.description}
                          onChange={e => handleUpdateYesterdayTask(task.id, { description: e.target.value })}
                          className="flex-1 bg-transparent text-xs sm:text-sm text-on-surface placeholder:text-secondary outline-none font-medium"
                        />
                        <select
                          value={task.moduleId}
                          onChange={e => handleUpdateYesterdayTask(task.id, { moduleId: e.target.value })}
                          className="bg-surface border border-outline text-xs text-on-surface font-semibold rounded-lg px-2 py-1 outline-none"
                        >
                          {AVAILABLE_MODULES.map(m => (
                            <option key={m.id} value={m.id}>
                              {m.name}
                            </option>
                          ))}
                        </select>
                        <select
                          value={task.status}
                          onChange={e =>
                            handleUpdateYesterdayTask(task.id, {
                              status: e.target.value as 'completed' | 'in_progress' | 'blocked',
                            })
                          }
                          className="bg-surface border border-outline text-xs text-emerald-700 font-bold rounded-lg px-2 py-1 outline-none"
                        >
                          <option value="completed">Completed</option>
                          <option value="in_progress">In Progress</option>
                          <option value="blocked">Blocked</option>
                        </select>
                        {tasksYesterday.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveYesterdayTask(task.id)}
                            className="text-secondary hover:text-error p-1 cursor-pointer transition-colors"
                            title="Remove task"
                          >
                            <span className="material-symbols-outlined text-[16px]">delete</span>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Section 2: Tasks Today */}
                <div className="p-4 rounded-xl bg-surface border border-outline shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-blue-100 text-primary flex items-center justify-center text-xs font-bold">
                        2
                      </div>
                      <h4 className="text-xs sm:text-sm font-bold text-on-surface">What are you committing to accomplish today?</h4>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddTodayTask}
                      className="text-xs text-primary hover:text-primary-hover flex items-center gap-1 font-bold cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">add</span> Add Task
                    </button>
                  </div>

                  <div className="space-y-2">
                    {tasksToday.map((task, idx) => (
                      <div key={task.id} className="flex items-center gap-2 bg-canvas p-2.5 rounded-lg border border-outline">
                        <input
                          type="text"
                          placeholder={`Today commitment #${idx + 1}...`}
                          value={task.description}
                          onChange={e => handleUpdateTodayTask(task.id, { description: e.target.value })}
                          className="flex-1 bg-transparent text-xs sm:text-sm text-on-surface placeholder:text-secondary outline-none font-medium"
                        />
                        <select
                          value={task.moduleId}
                          onChange={e => handleUpdateTodayTask(task.id, { moduleId: e.target.value })}
                          className="bg-surface border border-outline text-xs text-on-surface font-semibold rounded-lg px-2 py-1 outline-none"
                        >
                          {AVAILABLE_MODULES.map(m => (
                            <option key={m.id} value={m.id}>
                              {m.name}
                            </option>
                          ))}
                        </select>
                        {tasksToday.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveTodayTask(task.id)}
                            className="text-secondary hover:text-error p-1 cursor-pointer transition-colors"
                            title="Remove task"
                          >
                            <span className="material-symbols-outlined text-[16px]">delete</span>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Section 3: Blockers / Impediments */}
                <div className="p-4 rounded-xl bg-surface border border-outline shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center text-xs font-bold">
                        3
                      </div>
                      <h4 className="text-xs sm:text-sm font-bold text-on-surface">Any blockers, dependencies, or impediments?</h4>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddBlocker}
                      className="text-xs text-amber-700 hover:text-amber-800 flex items-center gap-1 font-bold cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">add</span> Add Blocker
                    </button>
                  </div>

                  <div className="space-y-2">
                    {blockers.map((b, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-canvas p-2.5 rounded-lg border border-outline">
                        <span className="material-symbols-outlined text-amber-600 text-[18px] shrink-0">warning</span>
                        <input
                          type="text"
                          placeholder="E.g. Waiting on student payment proof, mentor syllabus sign-off..."
                          value={b}
                          onChange={e => handleUpdateBlocker(idx, e.target.value)}
                          className="flex-1 bg-transparent text-xs sm:text-sm text-on-surface placeholder:text-secondary outline-none font-medium"
                        />
                        {blockers.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveBlocker(idx)}
                            className="text-secondary hover:text-error p-1 cursor-pointer transition-colors"
                            title="Remove blocker"
                          >
                            <span className="material-symbols-outlined text-[16px]">delete</span>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Submit Action Button pinned in form */}
                <div className="pt-2 flex items-center justify-between flex-wrap gap-2">
                  <p className="text-xs text-secondary">
                    Logged tasks will be cross-referenced with your weekly performance velocity.
                  </p>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2.5 rounded-lg bg-primary hover:bg-primary-hover text-white font-bold text-xs flex items-center gap-2 shadow-xs disabled:opacity-50 transition-all cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Evaluating with AI Agent...</span>
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
                        <span>{todayStandup ? 'Update & Re-Evaluate Standup' : 'Submit Daily Standup'}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            /* Weekly Scrum Performance Tab */
            <div className="space-y-5">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h4 className="text-sm sm:text-base font-bold text-on-surface flex items-center gap-2">
                    <span className="material-symbols-outlined text-[20px] text-primary">trending_up</span>
                    <span>Weekly Performance &amp; Scrum Velocity</span>
                  </h4>
                  <p className="text-xs text-secondary">
                    Calculated by autonomous AI agent based on completed tasks, module coverage, and blocker resolution
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleGenerateWeekly}
                  disabled={isEvaluatingWeekly}
                  className="px-4 py-2 rounded-lg bg-primary/10 hover:bg-primary/20 border border-primary/30 text-primary text-xs font-bold flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  <span className={`material-symbols-outlined text-[16px] ${isEvaluatingWeekly ? 'animate-spin' : ''}`}>
                    sync
                  </span>
                  <span>{isEvaluatingWeekly ? 'Evaluating...' : 'Run Weekly AI Audit'}</span>
                </button>
              </div>

              {activeWeeklyReport ? (
                <div className="space-y-5">
                  {/* Top Stats Banner */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="p-4 rounded-xl bg-surface border border-primary/20 flex flex-col items-center justify-center text-center shadow-xs">
                      <span className="text-[10px] font-bold text-secondary uppercase tracking-wider mb-1">
                        Scrum Grade
                      </span>
                      <div className="text-3xl font-extrabold text-primary flex items-baseline gap-1 font-data-tabular">
                        <span>{activeWeeklyReport.letterGrade}</span>
                        <span className="text-xs font-normal text-secondary">({activeWeeklyReport.overallScore}/100)</span>
                      </div>
                      <span className="text-[10px] text-secondary mt-1">Week #{activeWeeklyReport.weekNumber}</span>
                    </div>

                    <div className="p-4 rounded-xl bg-surface border border-outline flex flex-col justify-center shadow-xs">
                      <span className="text-[10px] font-bold text-secondary uppercase tracking-wider mb-1">Task Completion Rate</span>
                      <div className="text-2xl font-bold text-emerald-700 font-data-tabular">
                        {activeWeeklyReport.metrics.completionRatePercent}%
                      </div>
                      <span className="text-[11px] text-secondary">
                        {activeWeeklyReport.metrics.totalTasksCompleted} of {activeWeeklyReport.metrics.totalTasksLogged} resolved
                      </span>
                    </div>

                    <div className="p-4 rounded-xl bg-surface border border-outline flex flex-col justify-center shadow-xs">
                      <span className="text-[10px] font-bold text-secondary uppercase tracking-wider mb-1">Module Coverage</span>
                      <div className="text-2xl font-bold text-primary font-data-tabular">
                        {activeWeeklyReport.metrics.moduleCoverageScore}%
                      </div>
                      <span className="text-[11px] text-secondary">Cross-department delivery</span>
                    </div>

                    <div className="p-4 rounded-xl bg-surface border border-outline flex flex-col justify-center shadow-xs">
                      <span className="text-[10px] font-bold text-secondary uppercase tracking-wider mb-1">Blocker Resolution</span>
                      <div className="text-2xl font-bold text-amber-700 font-data-tabular">
                        {activeWeeklyReport.metrics.blockerResolutionScore}%
                      </div>
                      <span className="text-[11px] text-secondary">Unblocking agility</span>
                    </div>
                  </div>

                  {/* AI Executive Summary Card */}
                  <div className="p-5 rounded-xl bg-surface border border-outline space-y-4 shadow-xs">
                    <div className="flex items-center gap-2 text-primary text-xs font-bold uppercase tracking-wider">
                      <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
                      <span>AI Scrum Master Executive Summary</span>
                    </div>
                    <p className="text-xs sm:text-sm leading-relaxed text-on-surface">
                      {activeWeeklyReport.aiExecutiveSummary}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                      <div className="p-3.5 rounded-lg bg-emerald-50/70 border border-emerald-200">
                        <div className="text-xs font-bold text-emerald-800 mb-2 flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[16px] text-emerald-600">check_circle</span> Key Strengths
                        </div>
                        <ul className="space-y-1.5">
                          {activeWeeklyReport.aiStrengths.map((str, i) => (
                            <li key={i} className="text-xs text-emerald-950 flex items-start gap-1.5">
                              <span className="text-emerald-600 mt-0.5">•</span>
                              <span>{str}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="p-3.5 rounded-lg bg-blue-50/70 border border-blue-200">
                        <div className="text-xs font-bold text-blue-900 mb-2 flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[16px] text-primary">local_fire_department</span> High-Impact Growth Areas
                        </div>
                        <ul className="space-y-1.5">
                          {activeWeeklyReport.aiGrowthAreas.map((ga, i) => (
                            <li key={i} className="text-xs text-blue-950 flex items-start gap-1.5">
                              <span className="text-primary mt-0.5">•</span>
                              <span>{ga}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Module Breakdown */}
                  {activeWeeklyReport.moduleBreakdown && (
                    <div className="p-5 rounded-xl bg-surface border border-outline space-y-3 shadow-xs">
                      <h4 className="text-xs font-bold text-on-surface uppercase tracking-wider">
                        Assigned Module Throughput Breakdown
                      </h4>
                      <div className="space-y-2.5">
                        {Object.entries(activeWeeklyReport.moduleBreakdown).map(([modId, data]) => {
                          const modInfo = AVAILABLE_MODULES.find(m => m.id === modId);
                          const percentage = data.tasksPlanned > 0 ? Math.round((data.tasksCompleted / data.tasksPlanned) * 100) : 100;
                          return (
                            <div key={modId} className="space-y-1">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-on-surface font-semibold">{modInfo?.name || modId}</span>
                                <span className="text-secondary font-mono">
                                  {data.tasksCompleted}/{data.tasksPlanned} tasks ({percentage}%)
                                </span>
                              </div>
                              <div className="w-full h-2 rounded-full bg-surface-container-high overflow-hidden">
                                <div
                                  className="h-full bg-primary rounded-full transition-all duration-300"
                                  style={{ width: `${Math.min(100, percentage)}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-16 text-center text-secondary flex flex-col items-center bg-surface rounded-xl border border-outline">
                  <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center text-secondary mb-3">
                    <span className="material-symbols-outlined text-[28px]">military_tech</span>
                  </div>
                  <p className="text-sm font-bold text-on-surface">No Weekly Scrum Evaluation on record</p>
                  <p className="text-xs text-secondary mt-1 max-w-sm">
                    Click &apos;Run Weekly AI Audit&apos; to let the autonomous AI Scrum Master analyze your tasks across all modules.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="shrink-0 p-3 sm:p-4 bg-surface-bright border-t border-outline flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-secondary hover:text-on-surface rounded-lg text-xs font-semibold cursor-pointer"
          >
            Close
          </button>
          <div className="text-[11px] text-secondary">
            CODELAB EDUCARE &bull; Agile Scrum Operations
          </div>
        </div>
      </div>
    </div>
  );
};
