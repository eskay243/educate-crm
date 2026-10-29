import React, { useState, useEffect } from 'react';
import { useCRM } from '../../context/CRMContext';
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Trash2,
  X,
  Layers,
  TrendingUp,
  Brain,
  Award,
  BarChart2,
  Calendar,
  RefreshCw,
  Flame
} from 'lucide-react';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl shadow-2xl flex flex-col overflow-hidden max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500/20 to-indigo-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Brain className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">AI Scrum & Daily Standup</h2>
                <span className="text-[10px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-full border border-indigo-500/20 font-semibold flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-indigo-400" /> AI Coach
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Log daily task progress across assigned CRM modules & measure weekly team velocity
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-2 rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-5 pt-3 gap-2">
          <button
            onClick={() => setActiveTab('standup')}
            className={`pb-3 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'standup'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Today&apos;s Standup</span>
            {todayStandup && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Submitted for today" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('weekly')}
            className={`pb-3 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'weekly'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart2 className="w-4 h-4" />
            <span>Weekly Performance & Velocity</span>
            {activeWeeklyReport && (
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-mono">
                {activeWeeklyReport.letterGrade}
              </span>
            )}
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'standup' ? (
            <div>
              {/* Today's Existing Submission Banner if present */}
              {todayStandup && (
                <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 to-indigo-500/10 border border-emerald-500/20">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Standup Recorded for Today ({todayStandup.date})</span>
                    </div>
                    <span className="text-[11px] text-slate-400">
                      Logged at {new Date(todayStandup.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {todayStandup.aiAgentFeedback && (
                    <div className="mt-3 p-3 bg-slate-900/80 rounded-lg border border-slate-800 text-xs text-slate-300">
                      <div className="flex items-center gap-1.5 text-indigo-300 font-semibold mb-1">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                        AI Scrum Master Feedback:
                      </div>
                      <p className="leading-relaxed text-slate-300">{todayStandup.aiAgentFeedback}</p>
                    </div>
                  )}

                  <div className="mt-3 flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/60">
                    <span>
                      Yesterday Tasks: <strong className="text-white">{todayStandup.tasksYesterday.length}</strong> | Today
                      Commitments: <strong className="text-white">{todayStandup.tasksToday.length}</strong> | Blockers:{' '}
                      <strong className="text-white">{todayStandup.blockers.length}</strong>
                    </span>
                    <span className="text-emerald-400 font-medium">Status: Active & Tracked</span>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmitStandup} className="space-y-6">
                {/* Module Scope Selector */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2 flex items-center gap-2">
                    <Layers className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Modules Assigned to You ({currentUser?.role})</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {AVAILABLE_MODULES.map(mod => {
                      const isSelected = selectedModules.includes(mod.id);
                      return (
                        <button
                          key={mod.id}
                          type="button"
                          onClick={() => toggleModuleSelection(mod.id)}
                          className={`text-xs px-2.5 py-1.5 rounded-lg border transition-all ${
                            isSelected
                              ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-300 font-medium'
                              : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700'
                          }`}
                        >
                          {mod.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Section 1: Tasks Yesterday */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold">
                        1
                      </div>
                      <h3 className="text-sm font-bold text-white">What did you complete or work on yesterday?</h3>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddYesterdayTask}
                      className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Task
                    </button>
                  </div>

                  <div className="space-y-2">
                    {tasksYesterday.map((task, idx) => (
                      <div key={task.id} className="flex items-center gap-2 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                        <input
                          type="text"
                          placeholder={`Yesterday task #${idx + 1}...`}
                          value={task.description}
                          onChange={e => handleUpdateYesterdayTask(task.id, { description: e.target.value })}
                          className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none"
                        />
                        <select
                          value={task.moduleId}
                          onChange={e => handleUpdateYesterdayTask(task.id, { moduleId: e.target.value })}
                          className="bg-slate-900 border border-slate-800 text-xs text-slate-300 rounded-lg px-2 py-1 focus:outline-none"
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
                          className="bg-slate-900 border border-slate-800 text-xs text-emerald-400 rounded-lg px-2 py-1 focus:outline-none"
                        >
                          <option value="completed">Completed</option>
                          <option value="in_progress">In Progress</option>
                          <option value="blocked">Blocked</option>
                        </select>
                        {tasksYesterday.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveYesterdayTask(task.id)}
                            className="text-slate-500 hover:text-rose-400 p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Section 2: Tasks Today */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold">
                        2
                      </div>
                      <h3 className="text-sm font-bold text-white">What are you committing to accomplish today?</h3>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddTodayTask}
                      className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Task
                    </button>
                  </div>

                  <div className="space-y-2">
                    {tasksToday.map((task, idx) => (
                      <div key={task.id} className="flex items-center gap-2 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                        <input
                          type="text"
                          placeholder={`Today commitment #${idx + 1}...`}
                          value={task.description}
                          onChange={e => handleUpdateTodayTask(task.id, { description: e.target.value })}
                          className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none"
                        />
                        <select
                          value={task.moduleId}
                          onChange={e => handleUpdateTodayTask(task.id, { moduleId: e.target.value })}
                          className="bg-slate-900 border border-slate-800 text-xs text-slate-300 rounded-lg px-2 py-1 focus:outline-none"
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
                            className="text-slate-500 hover:text-rose-400 p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Section 3: Blockers / Impediments */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs font-bold">
                        3
                      </div>
                      <h3 className="text-sm font-bold text-white">Any blockers, dependencies, or impediments?</h3>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddBlocker}
                      className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 font-medium"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Blocker
                    </button>
                  </div>

                  <div className="space-y-2">
                    {blockers.map((b, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                        <input
                          type="text"
                          placeholder="E.g. Waiting on student payment proof, mentor syllabus sign-off..."
                          value={b}
                          onChange={e => handleUpdateBlocker(idx, e.target.value)}
                          className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none"
                        />
                        {blockers.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveBlocker(idx)}
                            className="text-slate-500 hover:text-rose-400 p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Submit Action */}
                <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                  <p className="text-xs text-slate-400">
                    Logged tasks will be cross-referenced with your weekly performance velocity.
                  </p>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-medium text-sm flex items-center gap-2 shadow-lg shadow-indigo-600/20 disabled:opacity-50 transition-all"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Evaluating with AI Agent...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>{todayStandup ? 'Update & Re-Evaluate Standup' : 'Submit Daily Standup'}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            /* Weekly Scrum Performance Tab */
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-indigo-400" />
                    <span>Weekly Performance & Scrum Velocity</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Calculated by autonomous AI agent based on completed tasks, module coverage, and blocker resolution
                  </p>
                </div>
                <button
                  onClick={handleGenerateWeekly}
                  disabled={isEvaluatingWeekly}
                  className="px-4 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 text-xs font-semibold flex items-center gap-2 transition-all disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isEvaluatingWeekly ? 'animate-spin' : ''}`} />
                  <span>{isEvaluatingWeekly ? 'Evaluating...' : 'Run Weekly AI Audit'}</span>
                </button>
              </div>

              {activeWeeklyReport ? (
                <div className="space-y-6">
                  {/* Top Stats Banner */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-500/10 to-blue-500/10 border border-indigo-500/20 flex flex-col items-center justify-center text-center">
                      <span className="text-xs font-semibold text-indigo-300 uppercase tracking-wider mb-1">
                        Scrum Grade
                      </span>
                      <div className="text-4xl font-extrabold text-white flex items-baseline gap-1">
                        <span>{activeWeeklyReport.letterGrade}</span>
                        <span className="text-sm font-normal text-indigo-300">({activeWeeklyReport.overallScore}/100)</span>
                      </div>
                      <span className="text-[11px] text-slate-400 mt-1">Week #{activeWeeklyReport.weekNumber}</span>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col justify-center">
                      <span className="text-xs text-slate-400 mb-1">Task Completion Rate</span>
                      <div className="text-2xl font-bold text-emerald-400">
                        {activeWeeklyReport.metrics.completionRatePercent}%
                      </div>
                      <span className="text-[11px] text-slate-500">
                        {activeWeeklyReport.metrics.totalTasksCompleted} of {activeWeeklyReport.metrics.totalTasksLogged} tasks resolved
                      </span>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col justify-center">
                      <span className="text-xs text-slate-400 mb-1">Module Coverage</span>
                      <div className="text-2xl font-bold text-blue-400">
                        {activeWeeklyReport.metrics.moduleCoverageScore}%
                      </div>
                      <span className="text-[11px] text-slate-500">Cross-department delivery</span>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col justify-center">
                      <span className="text-xs text-slate-400 mb-1">Blocker Resolution</span>
                      <div className="text-2xl font-bold text-amber-400">
                        {activeWeeklyReport.metrics.blockerResolutionScore}%
                      </div>
                      <span className="text-[11px] text-slate-500">Unblocking agility</span>
                    </div>
                  </div>

                  {/* AI Executive Summary Card */}
                  <div className="p-5 rounded-xl bg-gradient-to-br from-slate-950 to-slate-900 border border-slate-800 space-y-4">
                    <div className="flex items-center gap-2 text-indigo-400 text-sm font-bold">
                      <Sparkles className="w-4 h-4 text-indigo-400" />
                      <span>AI Scrum Master Executive Summary</span>
                    </div>
                    <p className="text-sm leading-relaxed text-slate-200">
                      {activeWeeklyReport.aiExecutiveSummary}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                      <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                        <div className="text-xs font-semibold text-emerald-400 mb-2 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Key Strengths
                        </div>
                        <ul className="space-y-1.5">
                          {activeWeeklyReport.aiStrengths.map((str, i) => (
                            <li key={i} className="text-xs text-slate-300 flex items-start gap-1.5">
                              <span className="text-emerald-400 mt-0.5">•</span>
                              <span>{str}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="p-3 rounded-lg bg-indigo-500/5 border border-indigo-500/20">
                        <div className="text-xs font-semibold text-indigo-400 mb-2 flex items-center gap-1.5">
                          <Flame className="w-3.5 h-3.5" /> High-Impact Growth Areas
                        </div>
                        <ul className="space-y-1.5">
                          {activeWeeklyReport.aiGrowthAreas.map((ga, i) => (
                            <li key={i} className="text-xs text-slate-300 flex items-start gap-1.5">
                              <span className="text-indigo-400 mt-0.5">•</span>
                              <span>{ga}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Module Breakdown */}
                  {activeWeeklyReport.moduleBreakdown && (
                    <div className="p-5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                      <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                        Assigned Module Throughput Breakdown
                      </h4>
                      <div className="space-y-2">
                        {Object.entries(activeWeeklyReport.moduleBreakdown).map(([modId, data]) => {
                          const modInfo = AVAILABLE_MODULES.find(m => m.id === modId);
                          const percentage = data.tasksPlanned > 0 ? Math.round((data.tasksCompleted / data.tasksPlanned) * 100) : 100;
                          return (
                            <div key={modId} className="space-y-1">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-slate-300 font-medium">{modInfo?.name || modId}</span>
                                <span className="text-slate-400 font-mono">
                                  {data.tasksCompleted}/{data.tasksPlanned} tasks ({percentage}%)
                                </span>
                              </div>
                              <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full"
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
                <div className="py-16 text-center text-slate-500 flex flex-col items-center">
                  <Award className="w-12 h-12 mb-3 stroke-[1.2] text-slate-600" />
                  <p className="text-sm font-medium text-slate-400">No Weekly Scrum Evaluation on record</p>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm">
                    Click &apos;Run Weekly AI Audit&apos; to let the autonomous AI Scrum Master analyze your tasks across all modules.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
