import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useCRM } from '../../context/CRMContext';
import { DailyStandupTask, ShiftDeliverableItem } from '../../types/crm';

export interface ClockOutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const COMMON_DELIVERABLES = [
  'Processed student admissions & logged prospect follow-ups',
  'Conducted student code reviews and 1-on-1 mentorship',
  'Reconciled student tuition fee receipts with bank records',
  'Resolved open student support tickets and course queries',
  'Updated cohort curriculum materials and class attendance',
];

export const ClockOutModal: React.FC<ClockOutModalProps> = ({ isOpen, onClose }) => {
  const {
    currentUser,
    activeAttendanceSession,
    staleAttendanceSession,
    clockOut,
    toggleShiftBreak,
    todayStandup,
    fetchTodayStandup,
    activityLogs,
    timetables,
    sessions,
    leads,
    expenses,
    settings,
  } = useCRM();

  const [searchParams, setSearchParams] = useSearchParams();

  // Rule #1: Sanitize ?action=clock-out query param immediately when modal opens
  useEffect(() => {
    if (isOpen && searchParams.get('action')) {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete('action');
      setSearchParams(nextParams, { replace: true });
    }
  }, [isOpen, searchParams, setSearchParams]);

  const targetSession = activeAttendanceSession || staleAttendanceSession;

  const [standupChecklist, setStandupChecklist] = useState<DailyStandupTask[]>([]);
  const [selectedCrmEvidence, setSelectedCrmEvidence] = useState<string[]>([]);
  const [endOfDaySummary, setEndOfDaySummary] = useState('');
  const [retroClockOutTime, setRetroClockOutTime] = useState(
    settings.workHoursPolicy?.expectedClockOutTime || '17:00'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTogglingBreak, setIsTogglingBreak] = useState(false);

  useEffect(() => {
    if (isOpen && currentUser) {
      fetchTodayStandup();
    }
  }, [isOpen, currentUser, fetchTodayStandup]);

  // Auto-detect verified CRM activity performed by currentUser during this shift
  const detectedCrmActivities = useMemo(() => {
    if (!currentUser || !targetSession) return [];
    const items: { id: string; moduleId: string; text: string }[] = [];
    const shiftDate = targetSession.date;

    // 1. Activity logs by this user today
    const myLogs = activityLogs.filter(
      log =>
        log.user?.toLowerCase() === currentUser.name.toLowerCase() &&
        !log.title.toLowerCase().includes('clocked in') &&
        !log.title.toLowerCase().includes('clocked out') &&
        !log.title.toLowerCase().includes('standup')
    );
    myLogs.slice(0, 6).forEach(log => {
      items.push({
        id: `log-${log.id}`,
        moduleId: log.type || 'system',
        text: `${log.title}: ${log.description}`,
      });
    });

    // 2. Classes / Timetable slots where attendance was marked or taught by this user
    const myMarkedClasses = timetables.filter(
      slot =>
        (slot.mentorId === currentUser.id ||
          slot.mentorName?.toLowerCase() === currentUser.name.toLowerCase()) &&
        slot.attendanceMarked
    );
    myMarkedClasses.slice(0, 3).forEach(slot => {
      items.push({
        id: `cls-${slot.id}`,
        moduleId: 'lms',
        text: `Taught & marked attendance for ${slot.courseTitle} (${slot.topic})`,
      });
    });

    // 3. 1-on-1 Mentorship sessions completed on shift date
    const myCompletedSessions = sessions.filter(
      s =>
        (s.mentorId === currentUser.id ||
          s.mentorName?.toLowerCase() === currentUser.name.toLowerCase()) &&
        s.date === shiftDate &&
        (s.status === 'Completed' || s.studentAttendance === 'Attended')
    );
    myCompletedSessions.forEach(s => {
      items.push({
        id: `sess-${s.id}`,
        moduleId: 'mentors',
        text: `Completed 1-on-1 coaching session with ${s.studentName} (${s.topic})`,
      });
    });

    // 4. Leads followed up on shift date
    const followedUpLeads = leads.filter(l =>
      (l.followUpHistory || []).some(
        f =>
          f.repName?.toLowerCase() === currentUser.name.toLowerCase() &&
          f.timestamp?.startsWith(shiftDate)
      )
    );
    if (followedUpLeads.length > 0) {
      items.push({
        id: `leads-${shiftDate}`,
        moduleId: 'leads',
        text: `Logged admissions follow-ups for ${followedUpLeads.length} prospect(s) (${followedUpLeads
          .slice(0, 3)
          .map(l => l.name)
          .join(', ')})`,
      });
    }

    // 5. Expenses submitted or reviewed on shift date
    const myExpenses = expenses.filter(
      e =>
        e.date === shiftDate &&
        (e.requestedBy?.toLowerCase() === currentUser.name.toLowerCase() ||
          e.reviewedBy?.toLowerCase() === currentUser.name.toLowerCase())
    );
    if (myExpenses.length > 0) {
      items.push({
        id: `exp-${shiftDate}`,
        moduleId: 'expenses',
        text: `Processed ${myExpenses.length} OpEx requisition(s) (${myExpenses
          .slice(0, 2)
          .map(e => e.expenseCode)
          .join(', ')})`,
      });
    }

    // Deduplicate by text
    const unique = new Map<string, { id: string; moduleId: string; text: string }>();
    items.forEach(item => {
      if (!unique.has(item.text)) unique.set(item.text, item);
    });
    return Array.from(unique.values());
  }, [currentUser, targetSession, activityLogs, timetables, sessions, leads, expenses]);

  // Initialize checklist and auto-selected CRM evidence when modal opens
  useEffect(() => {
    if (!isOpen || !targetSession) return;

    if (todayStandup && Array.isArray(todayStandup.tasksToday) && todayStandup.tasksToday.length > 0) {
      setStandupChecklist(todayStandup.tasksToday);
    } else if (
      targetSession.deliverablesChecklist &&
      targetSession.deliverablesChecklist.length > 0
    ) {
      setStandupChecklist(
        targetSession.deliverablesChecklist.map(d => ({
          id: d.id,
          description: d.description,
          moduleId: d.moduleId,
          status: d.completed ? 'completed' : 'in_progress',
        }))
      );
    } else if (targetSession.dailyTasksFocus) {
      setStandupChecklist(
        targetSession.dailyTasksFocus
          .split(';')
          .map(s => s.trim())
          .filter(Boolean)
          .map((desc, idx) => ({
            id: `chk-${idx}`,
            description: desc,
            moduleId: 'leads',
            status: 'completed',
          }))
      );
    } else {
      setStandupChecklist([]);
    }

    // Auto-select detected CRM evidence
    setSelectedCrmEvidence(detectedCrmActivities.map(a => a.text));
  }, [isOpen, targetSession?.id, todayStandup, detectedCrmActivities.length]);

  if (!isOpen || !targetSession) return null;

  const isStaleShift = targetSession.date < new Date().toISOString().split('T')[0];

  // Calculate gross elapsed, break minutes, net hours, and overtime
  const now = new Date();
  let effectiveOutTs = now.getTime();
  if (isStaleShift && retroClockOutTime) {
    const [hh, mm] = retroClockOutTime.split(':').map(Number);
    const retroD = new Date(`${targetSession.date}T00:00:00`);
    if (!isNaN(hh) && !isNaN(mm)) {
      retroD.setHours(hh, mm, 0, 0);
      effectiveOutTs = Math.max(targetSession.clockInTimestamp + 60000, retroD.getTime());
    }
  }

  const grossElapsedMs = Math.max(0, effectiveOutTs - targetSession.clockInTimestamp);
  const recordedBreakMins = Number(targetSession.totalBreakMinutes || 0);
  const activeBreakMins =
    targetSession.isOnBreak && targetSession.breaks && targetSession.breaks.length > 0
      ? Math.max(
          0,
          Math.round(
            (now.getTime() -
              targetSession.breaks[targetSession.breaks.length - 1].startTimestamp) /
              60000
          )
        )
      : 0;
  const totalBreakMins = recordedBreakMins + activeBreakMins;
  const netElapsedMs = Math.max(60000, grossElapsedMs - totalBreakMins * 60000);

  const netHours = Math.floor(netElapsedMs / (1000 * 60 * 60));
  const netMinutes = Math.floor((netElapsedMs % (1000 * 60 * 60)) / (1000 * 60));
  const netDurationText = `${netHours}h ${netMinutes}m`;
  const netDecimalHours = Number((netElapsedMs / (1000 * 60 * 60)).toFixed(2));

  const [inH, inM] = (settings.workHoursPolicy?.expectedClockInTime || '09:00').split(':').map(Number);
  const [outH, outM] = (settings.workHoursPolicy?.expectedClockOutTime || '17:00').split(':').map(Number);
  const expectedShiftHours = Math.max(1, ((outH * 60 + outM) - (inH * 60 + inM)) / 60);
  const overtimeDecimal =
    netDecimalHours > expectedShiftHours
      ? Number((netDecimalHours - expectedShiftHours).toFixed(2))
      : 0;

  const toggleStandupTaskCompletion = (taskId: string) => {
    setStandupChecklist(prev =>
      prev.map(t =>
        t.id === taskId
          ? { ...t, status: t.status === 'completed' ? 'in_progress' : 'completed' }
          : t
      )
    );
  };

  const toggleCrmEvidenceItem = (text: string) => {
    setSelectedCrmEvidence(prev =>
      prev.includes(text) ? prev.filter(item => item !== text) : [...prev, text]
    );
  };

  const addDeliverableChip = (del: string) => {
    setEndOfDaySummary(prev => {
      if (!prev) return del;
      if (prev.includes(del)) return prev;
      return `${prev}; ${del}`;
    });
  };

  const handleBreakToggle = async () => {
    setIsTogglingBreak(true);
    try {
      await toggleShiftBreak(targetSession.isOnBreak ? 'end' : 'start');
    } finally {
      setIsTogglingBreak(false);
    }
  };

  // Synthesize full EOD summary from checked standup tasks + selected CRM evidence + manual summary
  const completedStandupDescriptions = standupChecklist
    .filter(t => t.status === 'completed')
    .map(t => t.description.trim());

  const hasValidOutput =
    endOfDaySummary.trim().length > 0 ||
    completedStandupDescriptions.length > 0 ||
    selectedCrmEvidence.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasValidOutput) return;

    setIsSubmitting(true);
    try {
      const summaryParts: string[] = [];
      if (completedStandupDescriptions.length > 0) {
        summaryParts.push(`Completed Standup Objectives: ${completedStandupDescriptions.join('; ')}`);
      }
      if (selectedCrmEvidence.length > 0) {
        summaryParts.push(`Verified CRM Actions: ${selectedCrmEvidence.join('; ')}`);
      }
      if (endOfDaySummary.trim()) {
        summaryParts.push(endOfDaySummary.trim());
      }

      const checklistPayload: ShiftDeliverableItem[] = [
        ...standupChecklist.map(t => ({
          id: t.id,
          moduleId: t.moduleId,
          description: t.description,
          completed: t.status === 'completed',
          source: 'standup' as const,
        })),
        ...detectedCrmActivities
          .filter(a => selectedCrmEvidence.includes(a.text))
          .map(a => ({
            id: a.id,
            moduleId: a.moduleId,
            description: a.text,
            completed: true,
            source: 'crm_auto' as const,
          })),
      ];

      await clockOut({
        targetRecordId: targetSession.id,
        retroactiveClockOutTime: isStaleShift ? retroClockOutTime : undefined,
        endOfDaySummary: summaryParts.join(' | '),
        deliverablesChecklist: checklistPayload,
        completedStandupTasks: standupChecklist,
        crmActivitiesCount: selectedCrmEvidence.length,
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-inverse-surface/45 backdrop-blur-xs p-2 sm:p-4 md:p-6 flex flex-col justify-start items-center animate-in fade-in duration-200">
      <div className="fixed inset-0 -z-10" onClick={onClose} aria-hidden="true" />

      <div
        className="my-auto relative w-full max-w-2xl max-h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-2.5rem)] rounded-t-2xl sm:rounded-xl shadow-2xl flex flex-col overflow-hidden bg-surface-container-lowest border border-outline-variant z-10 animate-in zoom-in-95 duration-150"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between p-4 sm:p-5 border-b border-outline-variant bg-surface-bright">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#FFDAD6] text-[#BA1A1A] flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[22px]">logout</span>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-headline-md text-base sm:text-lg font-bold text-on-surface">
                  {isStaleShift
                    ? `Retroactive Clock-Out (${targetSession.date})`
                    : 'End Shift & Sync Daily Output'}
                </h2>
                {overtimeDecimal > 0 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#DCFCE7] text-[#16A34A] font-data-tabular">
                    +{overtimeDecimal}h Overtime
                  </span>
                )}
              </div>
              <p className="font-body-sm text-xs text-secondary">
                Check off Standup Commitments • Attach Verified CRM Activity • Calculate Net Hours
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Break Toggle inside modal header if shift is today */}
            {!isStaleShift && (
              <button
                type="button"
                onClick={handleBreakToggle}
                disabled={isTogglingBreak}
                className={`px-3 h-8 rounded-lg border text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors ${
                  targetSession.isOnBreak
                    ? 'bg-[#DCFCE7] border-[#16A34A]/30 text-[#16A34A]'
                    : 'bg-[#FEF3C7] border-[#D97706]/30 text-[#92400E]'
                }`}
                title="Need a break instead of clocking out for the day?"
              >
                <span className="material-symbols-outlined text-[15px]">
                  {targetSession.isOnBreak ? 'play_arrow' : 'coffee'}
                </span>
                <span>{targetSession.isOnBreak ? 'End Break' : 'Take Break Instead'}</span>
              </button>
            )}
            <button
              onClick={onClose}
              aria-label="Close"
              className="text-secondary hover:text-primary transition-colors p-1 rounded-full hover:bg-surface-container cursor-pointer shrink-0"
            >
              <span className="material-symbols-outlined text-[22px]">close</span>
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 min-h-0 flex flex-col overflow-hidden">
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-4">
            {/* Shift Telemetry Bento Card */}
            <div className="p-3.5 bg-surface-container-low rounded-lg border border-outline-variant grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <p className="text-[11px] text-secondary font-medium">Clocked In</p>
                <p className="font-bold text-sm font-data-tabular text-on-surface">
                  {targetSession.clockInTime}
                </p>
                <p className="text-[10px] text-secondary font-data-tabular">{targetSession.date}</p>
              </div>

              <div>
                <p className="text-[11px] text-secondary font-medium">Break Deducted</p>
                <p className="font-bold text-sm font-data-tabular text-on-surface">
                  {totalBreakMins}m
                </p>
                <p className="text-[10px] text-secondary">
                  {targetSession.breaks?.length || 0} pause(s)
                </p>
              </div>

              <div>
                <p className="text-[11px] text-secondary font-medium">Net Work Hours</p>
                <p className="font-bold text-sm font-data-tabular text-primary">
                  {netDurationText} ({netDecimalHours}h)
                </p>
                <span className="text-[10px] font-bold text-[#16A34A] bg-[#DCFCE7] px-1.5 py-0.5 rounded">
                  {targetSession.isOnBreak ? 'Paused (On Break)' : 'Active Shift'}
                </span>
              </div>

              <div>
                <p className="text-[11px] text-secondary font-medium">Workstation</p>
                <p className="font-bold text-xs text-on-surface truncate">
                  {targetSession.workMode}
                </p>
                <p className="text-[10px] text-secondary truncate">
                  {targetSession.locationName}
                </p>
              </div>
            </div>

            {/* Retroactive Time Picker if closing a prior-day shift */}
            {isStaleShift && (
              <div className="p-3 rounded-lg bg-[#FEF3C7] border border-[#D97706]/40 flex items-center justify-between flex-wrap gap-3">
                <div>
                  <p className="text-xs font-bold text-[#92400E]">
                    Prior-Day Unclosed Shift ({targetSession.date})
                  </p>
                  <p className="text-[11px] text-[#92400E]">
                    Specify your actual departure time on {targetSession.date}:
                  </p>
                </div>
                <input
                  type="time"
                  required
                  value={retroClockOutTime}
                  onChange={e => setRetroClockOutTime(e.target.value)}
                  className="h-9 px-3 rounded bg-white border border-[#D97706]/40 font-data-tabular text-xs font-bold text-on-surface"
                />
              </div>
            )}

            {/* 1. Interactive Daily Standup Task Checklist */}
            {standupChecklist.length > 0 && (
              <div className="p-3.5 rounded-lg border border-outline-variant bg-surface space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-primary">fact_check</span>
                    <span>Morning Standup Commitments (Click to mark completed)</span>
                  </span>
                  <span className="text-[11px] font-bold text-[#16A34A] font-data-tabular">
                    {standupChecklist.filter(t => t.status === 'completed').length}/
                    {standupChecklist.length} Completed
                  </span>
                </div>

                <div className="space-y-1.5">
                  {standupChecklist.map(task => {
                    const isDone = task.status === 'completed';
                    return (
                      <div
                        key={task.id}
                        onClick={() => toggleStandupTaskCompletion(task.id)}
                        className={`p-2.5 rounded-lg border flex items-center justify-between gap-2.5 cursor-pointer transition-all ${
                          isDone
                            ? 'bg-[#DCFCE7]/40 border-[#16A34A]/40 text-on-surface'
                            : 'bg-surface-container-low border-outline-variant text-secondary hover:border-outline'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className={`w-5 h-5 rounded flex items-center justify-center shrink-0 border ${
                              isDone
                                ? 'bg-[#16A34A] border-[#16A34A] text-white'
                                : 'bg-white border-outline-variant text-transparent'
                            }`}
                          >
                            <span className="material-symbols-outlined text-[14px]">check</span>
                          </span>
                          <span className={`text-xs font-medium truncate ${isDone ? 'text-on-surface font-semibold' : ''}`}>
                            {task.description}
                          </span>
                        </div>
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-surface border border-outline-variant shrink-0">
                          {task.moduleId}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 2. Verified CRM Shift Activity Rollup */}
            {detectedCrmActivities.length > 0 && (
              <div className="p-3.5 rounded-lg border border-[#16A34A]/30 bg-[#DCFCE7]/20 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#166534] flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-[#16A34A]">verified</span>
                    <span>Auto-Detected CRM Shift Activity ({detectedCrmActivities.length})</span>
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#DCFCE7] text-[#166534]">
                    Live System Audit
                  </span>
                </div>
                <div className="space-y-1.5">
                  {detectedCrmActivities.map(act => {
                    const isChecked = selectedCrmEvidence.includes(act.text);
                    return (
                      <div
                        key={act.id}
                        onClick={() => toggleCrmEvidenceItem(act.text)}
                        className={`p-2 rounded border text-xs flex items-center gap-2 cursor-pointer transition-all ${
                          isChecked
                            ? 'bg-white border-[#16A34A]/40 text-on-surface font-medium'
                            : 'bg-white/50 border-outline-variant text-secondary line-through'
                        }`}
                      >
                        <span
                          className={`material-symbols-outlined text-[16px] ${
                            isChecked ? 'text-[#16A34A]' : 'text-secondary'
                          }`}
                        >
                          {isChecked ? 'check_box' : 'check_box_outline_blank'}
                        </span>
                        <span className="flex-1">{act.text}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 3. Additional End-of-Day Summary & Notes */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-label-md text-xs font-semibold text-on-surface">
                  Additional End-of-Day Summary &amp; Handover Notes{' '}
                  {completedStandupDescriptions.length === 0 && selectedCrmEvidence.length === 0 && (
                    <span className="text-error">*</span>
                  )}
                </label>
                <span className="text-[11px] text-secondary">Saved to permanent timesheet ledger</span>
              </div>

              <textarea
                rows={3}
                value={endOfDaySummary}
                onChange={e => setEndOfDaySummary(e.target.value)}
                placeholder="Add any extra accomplishments, handover notes, or context for today's shift..."
                className="w-full p-3 bg-surface border border-outline-variant rounded-lg font-body-md text-xs text-on-surface focus:border-primary outline-none resize-none"
              />

              <div className="space-y-1">
                <p className="text-[11px] text-secondary font-medium">Quick Deliverable Tags:</p>
                <div className="flex flex-wrap gap-1.5">
                  {COMMON_DELIVERABLES.map(del => (
                    <button
                      key={del}
                      type="button"
                      onClick={() => addDeliverableChip(del)}
                      className="px-2 py-1 rounded bg-surface-container-low hover:bg-surface-container border border-outline-variant text-[11px] text-on-surface transition-colors cursor-pointer text-left"
                    >
                      + {del}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Sticky Footer Actions */}
          <div className="shrink-0 p-3 sm:p-4 bg-surface-bright border-t border-outline-variant flex items-center justify-between gap-2 flex-wrap">
            <span className="text-[11px] text-secondary font-data-tabular">
              {completedStandupDescriptions.length} standup task(s) • {selectedCrmEvidence.length} CRM action(s) attached
            </span>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 h-10 rounded-lg border border-outline-variant text-xs font-bold text-secondary hover:bg-surface-container transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !hasValidOutput}
                className="px-5 h-10 rounded-lg bg-[#BA1A1A] hover:bg-[#991B1B] text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-xs"
              >
                <span className="material-symbols-outlined text-[16px]">logout</span>
                <span>
                  {isSubmitting
                    ? 'Closing Shift...'
                    : `Confirm Clock-Out (${netDurationText} Net)`}
                </span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
