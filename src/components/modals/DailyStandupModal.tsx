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
    triggerStandupReminders,
    hasFeaturePermission,
    showToast,
  } = useCRM();

  const [activeTab, setActiveTab] = useState<'standup' | 'weekly' | 'management_report'>('standup');

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

  // Management Rollup Report State & Role Capability
  const canViewReports = currentUser?.role === 'super_admin' || (typeof hasFeaturePermission === 'function' && hasFeaturePermission('canViewStandupReports'));
  const [reportDate, setReportDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [reportModule, setReportModule] = useState<string>('all');
  const [managementReport, setManagementReport] = useState<any | null>(null);
  const [isLoadingReport, setIsLoadingReport] = useState(false);
  const [isTriggeringReminders, setIsTriggeringReminders] = useState(false);

  const handleTriggerReminders = async () => {
    setIsTriggeringReminders(true);
    try {
      await triggerStandupReminders();
      await fetchManagementReport(reportDate, reportModule);
    } finally {
      setIsTriggeringReminders(false);
    }
  };

  const fetchManagementReport = async (dateStr = reportDate, moduleStr = reportModule) => {
    setIsLoadingReport(true);
    try {
      const url = `/api/scrum/management-report?date=${dateStr}${moduleStr !== 'all' ? `&moduleId=${moduleStr}` : ''}`;
      const res = await fetch(url);
      const json = await res.json();
      if (json.success) {
        setManagementReport(json.data);
      }
    } catch (err) {
      console.error('Failed to fetch management standup report:', err);
    } finally {
      setIsLoadingReport(false);
    }
  };

  useEffect(() => {
    if (isOpen && activeTab === 'management_report') {
      fetchManagementReport(reportDate, reportModule);
    }
  }, [isOpen, activeTab, reportDate, reportModule]);

  const handleExportCSV = () => {
    if (!managementReport || !managementReport.standups || managementReport.standups.length === 0) {
      showToast('Export Notice', 'No standups available to export for this date.', 'warning');
      return;
    }

    const headers = ['Date', 'Staff Name', 'Role', 'Department', 'Yesterday Completed Tasks', 'Today Planned Tasks', 'Blockers', 'Modules', 'AI Feedback'];
    const rows = managementReport.standups.map((s: any) => {
      const yesterday = (s.tasksYesterday || []).map((t: any) => `[${t.status}] ${t.description}`).join('; ');
      const today = (s.tasksToday || []).map((t: any) => `[${t.status}] ${t.description}`).join('; ');
      const blockersStr = (s.blockers || []).join('; ');
      const modulesStr = (s.taggedModuleIds || []).join(', ');
      return [
        `"${s.date}"`,
        `"${(s.staffName || '').replace(/"/g, '""')}"`,
        `"${(s.staffRoleTitle || s.userRole || '').replace(/"/g, '""')}"`,
        `"${(s.department || '').replace(/"/g, '""')}"`,
        `"${yesterday.replace(/"/g, '""')}"`,
        `"${today.replace(/"/g, '""')}"`,
        `"${blockersStr.replace(/"/g, '""')}"`,
        `"${modulesStr.replace(/"/g, '""')}"`,
        `"${(s.aiAgentFeedback || '').replace(/"/g, '""')}"`,
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `daily-standup-management-report-${reportDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Export Successful', `Downloaded daily standup report for ${reportDate}`, 'success');
  };

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

  // Prefill form states when todayStandup is loaded
  useEffect(() => {
    if (isOpen && todayStandup) {
      if (Array.isArray(todayStandup.tasksYesterday) && todayStandup.tasksYesterday.length > 0) {
        setTasksYesterday(todayStandup.tasksYesterday);
      }
      if (Array.isArray(todayStandup.tasksToday) && todayStandup.tasksToday.length > 0) {
        setTasksToday(todayStandup.tasksToday);
      }
      if (Array.isArray(todayStandup.blockers) && todayStandup.blockers.length > 0) {
        setBlockers(todayStandup.blockers);
      } else {
        setBlockers(['']);
      }
      if (Array.isArray(todayStandup.taggedModuleIds) && todayStandup.taggedModuleIds.length > 0) {
        setSelectedModules(todayStandup.taggedModuleIds);
      }
    } else if (isOpen && !todayStandup) {
      setTasksYesterday([
        { id: `y-${Date.now()}-1`, description: '', moduleId: selectedModules[0] || 'leads', status: 'completed' },
      ]);
      setTasksToday([
        { id: `t-${Date.now()}-1`, description: '', moduleId: selectedModules[0] || 'leads', status: 'in_progress' },
      ]);
      setBlockers(['']);
    }
  }, [isOpen, todayStandup]);

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
        onClose();
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
          {canViewReports && (
            <button
              type="button"
              onClick={() => setActiveTab('management_report')}
              className={`pb-3 px-3 text-xs font-bold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
                activeTab === 'management_report'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-secondary hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">monitoring</span>
              <span>Management Standup Rollup</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-primary text-white font-bold tracking-wider">
                ADMIN
              </span>
            </button>
          )}
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
                    <div className="flex items-center gap-2 text-[11px] font-mono">
                      <span className="text-emerald-700">
                        Logged at {new Date(todayStandup.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {todayStandup.updatedAt && (
                        <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-semibold border border-emerald-300">
                          Updated {new Date(todayStandup.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {todayStandup.updateCount ? ` (Rev #${todayStandup.updateCount})` : ''}
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-[11px] text-emerald-900 bg-emerald-100/60 p-2 rounded-lg border border-emerald-200/50 mt-2">
                    💡 <strong>Update anytime:</strong> You can mark your tasks completed, add new deliverables, or clear blockers below. Submitting will update your live daily record.
                  </p>

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
                    {tasksToday.map((task, idx) => {
                      const isCompleted = task.status === 'completed';
                      const isBlocked = task.status === 'blocked';
                      return (
                        <div 
                          key={task.id} 
                          className={`flex items-center gap-2 p-2.5 rounded-lg border transition-all ${
                            isCompleted ? 'bg-emerald-50/40 border-emerald-200' : isBlocked ? 'bg-red-50/40 border-red-200' : 'bg-canvas border-outline'
                          }`}
                        >
                          {/* Quick-toggle Completion Button */}
                          <button
                            type="button"
                            onClick={() =>
                              handleUpdateTodayTask(task.id, {
                                status: isCompleted ? 'in_progress' : 'completed',
                              })
                            }
                            className={`w-6 h-6 rounded-md flex items-center justify-center transition-all cursor-pointer shrink-0 border ${
                              isCompleted
                                ? 'bg-emerald-600 border-emerald-600 text-white'
                                : isBlocked
                                ? 'bg-red-50 border-red-300 text-red-600'
                                : 'bg-surface border-outline text-transparent hover:border-primary'
                            }`}
                            title={isCompleted ? 'Mark In Progress' : 'Mark Completed'}
                          >
                            <span className="material-symbols-outlined text-[16px]">
                              {isCompleted ? 'check' : isBlocked ? 'priority_high' : 'check'}
                            </span>
                          </button>

                          <input
                            type="text"
                            placeholder={`Today commitment #${idx + 1}...`}
                            value={task.description}
                            onChange={e => handleUpdateTodayTask(task.id, { description: e.target.value })}
                            className={`flex-1 bg-transparent text-xs sm:text-sm placeholder:text-secondary outline-none font-medium ${
                              isCompleted ? 'line-through text-secondary' : 'text-on-surface'
                            }`}
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
                          <select
                            value={task.status || 'in_progress'}
                            onChange={e =>
                              handleUpdateTodayTask(task.id, {
                                status: e.target.value as 'completed' | 'in_progress' | 'blocked',
                              })
                            }
                            className={`bg-surface border text-xs font-bold rounded-lg px-2 py-1 outline-none ${
                              isCompleted
                                ? 'border-emerald-300 text-emerald-700'
                                : isBlocked
                                ? 'border-red-300 text-red-700'
                                : 'border-blue-300 text-blue-700'
                            }`}
                          >
                            <option value="in_progress">In Progress</option>
                            <option value="completed">Completed</option>
                            <option value="blocked">Blocked</option>
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
                      );
                    })}
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
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2.5 rounded-lg border border-outline hover:bg-surface-container text-secondary text-xs font-bold transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
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
                </div>
              </form>
            </div>
          ) : activeTab === 'weekly' ? (
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
          ) : (
            /* Management Standup Rollup Tab */
            <div className="space-y-5">
              {/* Controls & Filter Bar */}
              <div className="p-4 rounded-xl bg-surface border border-outline shadow-xs flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-secondary uppercase tracking-wider mb-1">
                      Standup Date
                    </label>
                    <input
                      type="date"
                      value={reportDate}
                      onChange={e => setReportDate(e.target.value)}
                      className="bg-canvas border border-outline rounded-lg px-2.5 py-1.5 text-xs text-on-surface font-semibold outline-none focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-secondary uppercase tracking-wider mb-1">
                      Operational Module
                    </label>
                    <select
                      value={reportModule}
                      onChange={e => setReportModule(e.target.value)}
                      className="bg-canvas border border-outline rounded-lg px-2.5 py-1.5 text-xs text-on-surface font-semibold outline-none focus:border-primary"
                    >
                      <option value="all">All Modules</option>
                      {AVAILABLE_MODULES.map(m => (
                        <option key={m.id} value={m.id}>
                          {m.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="self-end">
                    <button
                      type="button"
                      onClick={() => fetchManagementReport(reportDate, reportModule)}
                      disabled={isLoadingReport}
                      className="px-3 py-1.5 rounded-lg border border-outline bg-surface hover:bg-surface-container text-xs font-semibold text-secondary hover:text-on-surface flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <span className={`material-symbols-outlined text-[15px] ${isLoadingReport ? 'animate-spin' : ''}`}>
                        refresh
                      </span>
                      <span>Refresh</span>
                    </button>
                  </div>
                </div>

                <div className="self-end flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={handleTriggerReminders}
                    disabled={isTriggeringReminders}
                    className="px-3.5 py-1.5 rounded-lg border border-primary/30 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all disabled:opacity-50 cursor-pointer"
                    title="Dispatch automated push & chat reminders to clocked-in staff who haven't submitted their DSU"
                  >
                    <span className={`material-symbols-outlined text-[15px] ${isTriggeringReminders ? 'animate-spin' : ''}`}>
                      notifications_active
                    </span>
                    <span>{isTriggeringReminders ? 'Reminding...' : 'Send Morning Reminders'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleExportCSV}
                    disabled={!managementReport || !managementReport.standups || managementReport.standups.length === 0}
                    className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all disabled:opacity-50 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[15px]">download</span>
                    <span>Export CSV Rollup</span>
                  </button>
                </div>
              </div>

              {/* KPI Scorecards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-xl bg-surface border border-outline shadow-xs">
                  <div className="flex items-center justify-between text-secondary mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider">Submissions Logged</span>
                    <span className="material-symbols-outlined text-[18px] text-primary">groups</span>
                  </div>
                  <div className="text-2xl font-bold text-on-surface font-data-tabular">
                    {managementReport?.totalSubmissions || 0}
                  </div>
                  <span className="text-[10px] text-secondary">Active staff reporters</span>
                </div>

                <div className="p-4 rounded-xl bg-surface border border-outline shadow-xs">
                  <div className="flex items-center justify-between text-emerald-800 mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider">Achieved / Completed</span>
                    <span className="material-symbols-outlined text-[18px] text-emerald-600">check_circle</span>
                  </div>
                  <div className="text-2xl font-bold text-emerald-700 font-data-tabular">
                    {managementReport?.totalCompletedTasks || 0}
                  </div>
                  <span className="text-[10px] text-secondary">Yesterday deliverables</span>
                </div>

                <div className="p-4 rounded-xl bg-surface border border-outline shadow-xs">
                  <div className="flex items-center justify-between text-primary mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider">Planned Commitments</span>
                    <span className="material-symbols-outlined text-[18px] text-primary">schedule</span>
                  </div>
                  <div className="text-2xl font-bold text-primary font-data-tabular">
                    {managementReport?.totalPlannedTasks || 0}
                  </div>
                  <span className="text-[10px] text-secondary">Today deliverables</span>
                </div>

                <div className="p-4 rounded-xl bg-surface border border-outline shadow-xs">
                  <div className="flex items-center justify-between text-amber-800 mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider">Active Blockers</span>
                    <span className="material-symbols-outlined text-[18px] text-amber-600">warning</span>
                  </div>
                  <div className="text-2xl font-bold text-amber-700 font-data-tabular">
                    {managementReport?.totalBlockersFlagged || 0}
                  </div>
                  <span className="text-[10px] text-secondary">
                    {managementReport?.blockedStaffCount || 0} staff need unblocking
                  </span>
                </div>
              </div>

              {/* Standup Rollup List */}
              {isLoadingReport ? (
                <div className="py-16 text-center text-secondary flex flex-col items-center bg-surface rounded-xl border border-outline">
                  <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin mb-3" />
                  <p className="text-xs font-semibold">Aggregating standup submissions across departments...</p>
                </div>
              ) : managementReport && managementReport.standups && managementReport.standups.length > 0 ? (
                <div className="space-y-4">
                  {managementReport.standups.map((standup: any) => {
                    const hasBlockers = Array.isArray(standup.blockers) && standup.blockers.length > 0;
                    return (
                      <div
                        key={standup.id || standup.userId}
                        className="p-4 sm:p-5 rounded-xl bg-surface border border-outline shadow-xs space-y-4"
                      >
                        {/* Staff Header */}
                        <div className="flex items-start justify-between flex-wrap gap-2 pb-3 border-b border-outline">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-sm border border-primary/20 shrink-0">
                              {standup.staffName ? standup.staffName.charAt(0).toUpperCase() : 'U'}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-sm font-bold text-on-surface">{standup.staffName}</h4>
                                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-surface-container text-secondary">
                                  {standup.staffRoleTitle || standup.userRole}
                                </span>
                              </div>
                              <p className="text-[11px] text-secondary">
                                Department: <span className="font-semibold text-on-surface">{standup.department}</span> &bull; Logged at{' '}
                                {new Date(standup.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {hasBlockers ? (
                              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
                                <span className="material-symbols-outlined text-[14px]">warning</span> Blocked
                              </span>
                            ) : (
                              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                                <span className="material-symbols-outlined text-[14px]">check_circle</span> On Track
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Tagged CRM Modules */}
                        {Array.isArray(standup.taggedModuleIds) && standup.taggedModuleIds.length > 0 && (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] font-bold text-secondary uppercase tracking-wider mr-1">Modules:</span>
                            {standup.taggedModuleIds.map((modId: string) => {
                              const mod = AVAILABLE_MODULES.find(m => m.id === modId);
                              return (
                                <span
                                  key={modId}
                                  className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-surface-container border border-outline-variant text-on-surface"
                                >
                                  {mod?.name || modId}
                                </span>
                              );
                            })}
                          </div>
                        )}

                        {/* 2-Column Task Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Yesterday Completed */}
                          <div className="p-3.5 rounded-lg bg-emerald-50/50 border border-emerald-200/80">
                            <div className="text-xs font-bold text-emerald-900 mb-2 flex items-center gap-1.5">
                              <span className="material-symbols-outlined text-[15px] text-emerald-600">done_all</span>
                              <span>Completed / Achieved (Yesterday)</span>
                            </div>
                            {Array.isArray(standup.tasksYesterday) && standup.tasksYesterday.length > 0 ? (
                              <ul className="space-y-1.5">
                                {standup.tasksYesterday.map((t: any, i: number) => (
                                  <li key={i} className="text-xs text-emerald-950 flex items-start gap-1.5">
                                    <span className="text-emerald-600 mt-0.5">•</span>
                                    <span className="flex-1 font-medium">{t.description}</span>
                                    <span className="text-[9px] uppercase px-1 py-0.2 rounded bg-emerald-100 text-emerald-800 font-bold shrink-0">
                                      {t.moduleId}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-xs text-secondary italic">No completion items noted.</p>
                            )}
                          </div>

                          {/* Today Commitments */}
                          <div className="p-3.5 rounded-lg bg-blue-50/50 border border-blue-200/80">
                            <div className="text-xs font-bold text-blue-900 mb-2 flex items-center gap-1.5">
                              <span className="material-symbols-outlined text-[15px] text-primary">flag</span>
                              <span>Planned Commitments (Today)</span>
                            </div>
                            {Array.isArray(standup.tasksToday) && standup.tasksToday.length > 0 ? (
                              <ul className="space-y-1.5">
                                {standup.tasksToday.map((t: any, i: number) => (
                                  <li key={i} className="text-xs text-blue-950 flex items-start gap-1.5">
                                    <span className="text-primary mt-0.5">•</span>
                                    <span className="flex-1 font-medium">{t.description}</span>
                                    <span className="text-[9px] uppercase px-1 py-0.2 rounded bg-blue-100 text-blue-800 font-bold shrink-0">
                                      {t.moduleId}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-xs text-secondary italic">No daily commitments planned.</p>
                            )}
                          </div>
                        </div>

                        {/* Blockers Alert if any */}
                        {hasBlockers ? (
                          <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-950">
                            <div className="text-xs font-bold text-amber-800 mb-1 flex items-center gap-1.5">
                              <span className="material-symbols-outlined text-[16px] text-amber-600">error</span>
                              <span>Blockers &amp; Management Escalations:</span>
                            </div>
                            <ul className="space-y-1 ml-5 list-disc text-xs font-medium">
                              {standup.blockers.map((b: string, i: number) => (
                                <li key={i}>{b}</li>
                              ))}
                            </ul>
                          </div>
                        ) : (
                          <div className="p-2.5 rounded-lg bg-surface-container/60 border border-outline-variant text-[11px] text-secondary flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[14px] text-emerald-600">verified</span>
                            <span>No blockers reported &bull; Sprint progressing unhindered</span>
                          </div>
                        )}

                        {/* AI Coach Feedback if present */}
                        {standup.aiAgentFeedback && (
                          <div className="p-3 rounded-lg bg-canvas border border-outline text-xs text-secondary">
                            <div className="flex items-center gap-1.5 text-primary font-bold mb-1">
                              <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
                              <span>AI Scrum Evaluation:</span>
                            </div>
                            <p className="leading-relaxed">{standup.aiAgentFeedback}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-16 text-center text-secondary flex flex-col items-center bg-surface rounded-xl border border-outline">
                  <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center text-secondary mb-3">
                    <span className="material-symbols-outlined text-[28px]">assignment_late</span>
                  </div>
                  <p className="text-sm font-bold text-on-surface">No standups submitted for {reportDate}</p>
                  <p className="text-xs text-secondary mt-1 max-w-sm">
                    Staff submissions across the organization will appear here once logged for this day.
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
