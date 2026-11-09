import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useCRM } from '../../context/CRMContext';
import {
  WorkMode,
  GeoVerificationStatus,
  CampusLocation,
  DailyStandupTask,
} from '../../types/crm';
import { getDeviceCoordinates, calculateDistanceMeters } from '../../utils/geo';
import { initialCampuses } from '../../data/mockData';

export interface ClockInModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AVAILABLE_MODULES = [
  { id: 'leads', name: 'Leads & Admissions' },
  { id: 'students', name: 'Student Records' },
  { id: 'lms', name: 'LMS & Curriculum' },
  { id: 'mentors', name: 'Mentors & Faculty' },
  { id: 'billing', name: 'Billing & Invoicing' },
  { id: 'expenses', name: 'Finance & OpEx' },
  { id: 'attendance', name: 'Attendance & Timetable' },
  { id: 'tickets', name: 'Support Tickets' },
];

const ROLE_CHORE_TEMPLATES: Record<string, { label: string; moduleId: string }[]> = {
  admissions: [
    { label: 'Follow up with Hot/Warm admissions leads & schedule discovery calls', moduleId: 'leads' },
    { label: 'Convert qualified applicants & verify cohort tuition onboarding', moduleId: 'students' },
    { label: 'Update CRM lead pipeline stages and inquiry notes', moduleId: 'leads' },
  ],
  finance: [
    { label: 'Reconcile student tuition installment receipts & NUBAN transfers', moduleId: 'billing' },
    { label: 'Audit pending OpEx requisitions and vendor payout vouchers', moduleId: 'expenses' },
    { label: 'Review 37% faculty mentor commission settlement requests', moduleId: 'mentors' },
  ],
  program_officer: [
    { label: 'Audit cohort class attendance & review mentor syllabus delivery', moduleId: 'attendance' },
    { label: 'Conduct student welfare check-ins for At-Risk scholars', moduleId: 'students' },
    { label: 'Verify course outline topic completions and lab schedules', moduleId: 'lms' },
  ],
  mentor: [
    { label: 'Deliver scheduled cohort lecture & mark student attendance', moduleId: 'lms' },
    { label: 'Grade submitted student lab assignments & provide code feedback', moduleId: 'lms' },
    { label: 'Conduct 1-on-1 mentorship coaching sessions with assigned mentees', moduleId: 'mentors' },
  ],
  default: [
    { label: 'Student Admissions & Lead Pipeline Follow-ups', moduleId: 'leads' },
    { label: 'Curriculum Review, Lab Grading & Student Mentoring', moduleId: 'lms' },
    { label: 'Tuition Invoicing, Bank Reconciliation & OpEx Audit', moduleId: 'billing' },
    { label: 'Student Helpdesk & Technical Support Ticket Resolution', moduleId: 'tickets' },
  ],
};

const GEO_EXCEPTION_REASONS = [
  'Desktop / ISP Wi-Fi GPS Drift (Physically inside campus hub)',
  'Off-Site Corporate Partner / Client Visit',
  'External Admissions Activation / University Outreach',
  'Browser / Device Location Permission Restricted',
];

export const ClockInModal: React.FC<ClockInModalProps> = ({ isOpen, onClose }) => {
  const {
    currentUser,
    clockIn,
    clockOut,
    resumeTodayShift,
    staleAttendanceSession,
    todayCompletedSession,
    todayStandup,
    fetchTodayStandup,
    timetables,
    sessions,
    settings,
  } = useCRM();

  const [searchParams, setSearchParams] = useSearchParams();

  // Rule #1: Sanitize ?action=clock-in query param immediately when modal opens
  useEffect(() => {
    if (isOpen && searchParams.get('action')) {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete('action');
      setSearchParams(nextParams, { replace: true });
    }
  }, [isOpen, searchParams, setSearchParams]);

  const activeCampuses: CampusLocation[] = useMemo(() => {
    return settings.campusLocationsList && settings.campusLocationsList.length > 0
      ? settings.campusLocationsList.filter(c => c.isActive)
      : initialCampuses.filter(c => c.isActive);
  }, [settings.campusLocationsList]);

  // Step 0 state: Retroactive Clock-Out Reconciliation for stale prior-day shift
  const [retroClockOutTime, setRetroClockOutTime] = useState(
    settings.workHoursPolicy?.expectedClockOutTime || '17:00'
  );
  const [retroSummary, setRetroSummary] = useState('');
  const [retroNote, setRetroNote] = useState('Forgot to clock out at the end of shift');
  const [isReconcilingStale, setIsReconcilingStale] = useState(false);

  // Step 1 state: Today's Clock-In & Standup Sync
  const [workMode, setWorkMode] = useState<WorkMode>('On-Site / Hub');
  const [selectedCampusId, setSelectedCampusId] = useState<string>(
    activeCampuses[0]?.id || 'campus-vi'
  );
  const [workstationDetail, setWorkstationDetail] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [coords, setCoords] = useState<{ lat?: number; lng?: number; accuracy?: number }>({});
  const [distanceMeters, setDistanceMeters] = useState<number | null>(null);
  const [geoStatus, setGeoStatus] = useState<GeoVerificationStatus>('GPS Unavailable');
  const [geoMessage, setGeoMessage] = useState<string>('');
  const [geoExceptionReason, setGeoExceptionReason] = useState<string>('');
  const [standupTasks, setStandupTasks] = useState<DailyStandupTask[]>([
    {
      id: `t-${Date.now()}-1`,
      description: '',
      moduleId: currentUser?.assignedModules?.[0] || (currentUser?.role === 'mentor' ? 'lms' : 'leads'),
      status: 'in_progress',
    },
  ]);
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResuming, setIsResuming] = useState(false);

  const policy = settings.workHoursPolicy || {
    expectedClockInTime: '09:00',
    expectedClockOutTime: '17:00',
    gracePeriodMinutes: 15,
  };

  // Detect scheduled classes or mentorship sessions today for Faculty Mentors
  const todayStr = new Date().toISOString().split('T')[0];
  const todayDayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });

  const todayScheduledClasses = useMemo(() => {
    if (!currentUser) return [];
    const mySlots = timetables.filter(
      slot =>
        (slot.mentorId === currentUser.id ||
          slot.mentorName?.toLowerCase() === currentUser.name.toLowerCase()) &&
        slot.status !== 'Cancelled' &&
        (slot.dayOfWeek?.toLowerCase() === todayDayName.toLowerCase() || (slot as any).date === todayStr)
    );
    const mySessions = sessions.filter(
      sess =>
        (sess.mentorId === currentUser.id ||
          sess.mentorName?.toLowerCase() === currentUser.name.toLowerCase()) &&
        sess.date === todayStr &&
        sess.status !== 'Cancelled'
    );
    return [
      ...mySlots.map(s => ({
        id: s.id,
        title: `${s.courseTitle}: ${s.topic} (${s.startTime} - ${s.endTime})`,
        moduleId: 'lms',
      })),
      ...mySessions.map(s => ({
        id: s.id,
        title: `1-on-1 Coaching with ${s.studentName}: ${s.topic} (${s.time})`,
        moduleId: 'mentors',
      })),
    ];
  }, [currentUser, timetables, sessions, todayDayName, todayStr]);

  // Load today's standup when modal opens so tasks are pre-synced
  useEffect(() => {
    if (isOpen && currentUser) {
      fetchTodayStandup();
    }
  }, [isOpen, currentUser, fetchTodayStandup]);

  useEffect(() => {
    if (isOpen && todayStandup && Array.isArray(todayStandup.tasksToday) && todayStandup.tasksToday.length > 0) {
      setStandupTasks(todayStandup.tasksToday);
    } else if (isOpen && todayScheduledClasses.length > 0 && standupTasks.length === 1 && !standupTasks[0].description) {
      setStandupTasks(
        todayScheduledClasses.map((cls, i) => ({
          id: `t-${Date.now()}-${i + 1}`,
          description: cls.title,
          moduleId: cls.moduleId,
          status: 'in_progress',
        }))
      );
    }
  }, [isOpen, todayStandup, todayScheduledClasses.length]);

  const evaluateCampusDistances = (lat: number, lng: number, forcedCampusId?: string) => {
    if (activeCampuses.length === 0) {
      setGeoStatus('GPS Unavailable');
      setGeoMessage('No active institutional campuses configured.');
      return;
    }

    const distances = activeCampuses.map(campus => {
      const dist = calculateDistanceMeters(lat, lng, campus.latitude, campus.longitude);
      return { campus, dist: Math.round(dist) };
    });

    if (forcedCampusId) {
      const target = distances.find(d => d.campus.id === forcedCampusId) || distances[0];
      const { campus, dist } = target;
      setSelectedCampusId(campus.id);
      setDistanceMeters(dist);
      if (dist <= campus.radiusMeters) {
        setGeoStatus('Verified On-Site');
        setGeoMessage(
          `GPS Match Verified: Device is ${dist}m from ${campus.name} (within ${campus.radiusMeters}m perimeter).`
        );
      } else {
        setGeoStatus('Location Mismatch');
        const distKm = (dist / 1000).toFixed(2);
        setGeoMessage(
          `Outside Perimeter: Device is ${distKm}km (${dist}m) from ${campus.name} (limit ${campus.radiusMeters}m). Please provide an exception note below.`
        );
      }
      return;
    }

    // Auto-detect: check if within perimeter of ANY campus
    const withinPerimeter = distances.find(d => d.dist <= d.campus.radiusMeters);
    if (withinPerimeter) {
      const { campus, dist } = withinPerimeter;
      setSelectedCampusId(campus.id);
      setDistanceMeters(dist);
      setGeoStatus('Verified On-Site');
      setGeoMessage(
        `GPS Auto-Detected: You are ${dist}m from ${campus.name} (within ${campus.radiusMeters}m perimeter).`
      );
    } else {
      distances.sort((a, b) => a.dist - b.dist);
      const closest = distances[0];
      if (closest) {
        setSelectedCampusId(closest.campus.id);
        setDistanceMeters(closest.dist);
        setGeoStatus('Location Mismatch');
        const distKm = (closest.dist / 1000).toFixed(2);
        setGeoMessage(
          `Outside Perimeter: Closest hub is ${closest.campus.name} (${distKm}km away, limit ${closest.campus.radiusMeters}m). Exception note required.`
        );
      }
    }
  };

  const triggerGpsCheck = async (forcedCampusId?: string) => {
    setIsLocating(true);
    setGeoMessage('Acquiring high-accuracy GPS telemetry from device...');
    try {
      const deviceCoords = await getDeviceCoordinates();
      setCoords({
        lat: deviceCoords.latitude,
        lng: deviceCoords.longitude,
        accuracy: Math.round(deviceCoords.accuracy),
      });
      evaluateCampusDistances(deviceCoords.latitude, deviceCoords.longitude, forcedCampusId);
    } catch {
      setGeoStatus('GPS Unavailable');
      setGeoMessage(
        'Device GPS unavailable or permission restricted. Please provide a brief verification note below.'
      );
    } finally {
      setIsLocating(false);
    }
  };

  const handleSelectCampus = (campusId: string) => {
    setSelectedCampusId(campusId);
    if (coords.lat !== undefined && coords.lng !== undefined) {
      evaluateCampusDistances(coords.lat, coords.lng, campusId);
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    if (workMode === 'Remote') {
      setGeoStatus('Remote Verified');
      setGeoMessage('Remote workstation selected. Physical campus perimeter check bypassed.');
      setDistanceMeters(null);
      return;
    }

    triggerGpsCheck(selectedCampusId);
  }, [isOpen, workMode]);

  if (!isOpen) return null;

  const currentCampus = activeCampuses.find(c => c.id === selectedCampusId) || activeCampuses[0];
  const needsGeoException =
    workMode === 'On-Site / Hub' &&
    !isLocating &&
    (geoStatus === 'Location Mismatch' || geoStatus === 'GPS Unavailable');

  // Punctuality calculation for preview badge
  const now = new Date();
  const [expHour, expMin] = (policy.expectedClockInTime || '09:00').split(':').map(Number);
  const grace = policy.gracePeriodMinutes ?? 15;
  const strictMinutes = expHour * 60 + expMin;
  const graceLimitMinutes = strictMinutes + grace;
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const punctualityPreview =
    currentUser?.role === 'mentor'
      ? currentMinutes <= graceLimitMinutes
        ? 'On-Time'
        : 'Flexible / Faculty'
      : currentMinutes <= strictMinutes
      ? 'On-Time'
      : currentMinutes <= graceLimitMinutes
      ? 'Grace Period'
      : 'Late';

  // Step 0 Handler: Reconcile stale shift from a prior day
  const handleReconcileStaleShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staleAttendanceSession || !retroSummary.trim() || !retroClockOutTime) return;

    setIsReconcilingStale(true);
    try {
      await clockOut({
        targetRecordId: staleAttendanceSession.id,
        retroactiveClockOutTime: retroClockOutTime,
        retroactiveNote: retroNote.trim() || 'Retroactive clock-out logged on next shift start',
        endOfDaySummary: retroSummary.trim(),
      });
    } finally {
      setIsReconcilingStale(false);
    }
  };

  // Same-Day Resume Handler
  const handleResumeTodayShift = async () => {
    if (!todayCompletedSession) return;
    setIsResuming(true);
    try {
      const ok = await resumeTodayShift(todayCompletedSession.id);
      if (ok) onClose();
    } finally {
      setIsResuming(false);
    }
  };

  // Task list helpers
  const handleAddStandupTask = (description = '', moduleId?: string) => {
    const defaultMod =
      moduleId ||
      currentUser?.assignedModules?.[0] ||
      (currentUser?.role === 'mentor' ? 'lms' : 'leads');

    setStandupTasks(prev => {
      // If first row is empty, fill it
      if (prev.length === 1 && !prev[0].description.trim() && description) {
        return [{ ...prev[0], description, moduleId: defaultMod }];
      }
      if (description && prev.some(t => t.description.toLowerCase() === description.toLowerCase())) {
        return prev;
      }
      return [
        ...prev,
        {
          id: `t-${Date.now()}-${prev.length + 1}`,
          description,
          moduleId: defaultMod,
          status: 'in_progress',
        },
      ];
    });
  };

  const handleUpdateTask = (id: string, updates: Partial<DailyStandupTask>) => {
    setStandupTasks(prev => prev.map(t => (t.id === id ? { ...t, ...updates } : t)));
  };

  const handleRemoveTask = (id: string) => {
    setStandupTasks(prev => (prev.length > 1 ? prev.filter(t => t.id !== id) : prev));
  };

  const validTasks = standupTasks.filter(t => t.description.trim().length > 0);
  const canSubmitClockIn =
    validTasks.length > 0 && (!needsGeoException || geoExceptionReason.trim().length >= 5);

  const handleSubmitClockIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmitClockIn) return;

    setIsSubmitting(true);
    try {
      const composedLocation =
        workMode === 'On-Site / Hub'
          ? workstationDetail.trim()
            ? `${currentCampus?.name || 'Lagos Hub'} — ${workstationDetail.trim()}`
            : currentCampus?.name || 'Lagos Hub'
          : workstationDetail.trim() || 'Remote Workstation (Home / Flex)';

      const focusSummary = [
        ...validTasks.map(t => t.description.trim()),
        ...(additionalNotes.trim() ? [additionalNotes.trim()] : []),
      ].join('; ');

      await clockIn({
        workMode,
        locationName: composedLocation,
        campusId: workMode === 'On-Site / Hub' ? currentCampus?.id : undefined,
        campusName: workMode === 'On-Site / Hub' ? currentCampus?.name : undefined,
        dailyTasksFocus: focusSummary,
        standupTasks: validTasks,
        lat: coords.lat,
        lng: coords.lng,
        gpsAccuracyMeters: coords.accuracy,
        geoExceptionReason: needsGeoException ? geoExceptionReason.trim() : undefined,
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const roleTemplates =
    ROLE_CHORE_TEMPLATES[currentUser?.role || ''] || ROLE_CHORE_TEMPLATES.default;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-inverse-surface/45 backdrop-blur-xs p-2 sm:p-4 md:p-6 flex flex-col justify-start items-center animate-in fade-in duration-200">
      <div className="fixed inset-0 -z-10" onClick={onClose} aria-hidden="true" />

      <div
        className="my-auto relative w-full max-w-2xl max-h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-2.5rem)] rounded-t-2xl sm:rounded-xl shadow-2xl flex flex-col overflow-hidden bg-surface-container-lowest border border-outline-variant z-10 animate-in zoom-in-95 duration-150"
        onClick={e => e.stopPropagation()}
      >
        {/* Kinetic Enterprise Deep Navy Header */}
        <div className="shrink-0 flex items-center justify-between p-4 sm:p-5 bg-[#00236F] text-white border-b border-outline-variant">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/10 text-white flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[22px]">
                {staleAttendanceSession ? 'history_toggle_off' : 'timer'}
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-headline-md text-base sm:text-lg font-bold text-white">
                  {staleAttendanceSession
                    ? 'Step 1 of 2: Reconcile Unclosed Previous Shift'
                    : 'Staff Clock-In & Daily Standup Sync'}
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/15 text-blue-100 font-semibold border border-white/20">
                  AI Scrum Synced
                </span>
              </div>
              <p className="font-body-sm text-xs text-white/75 mt-0.5">
                {staleAttendanceSession
                  ? `You have an unclosed shift from ${staleAttendanceSession.date}. Close it first to unlock today's Clock-In.`
                  : 'Multi-Campus Geofence Audit • Real-Time Standup Task Alignment'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-white/80 hover:text-white transition-colors p-1.5 rounded-full hover:bg-white/10 cursor-pointer shrink-0"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* STEP 0: RETROACTIVE CLOCK-OUT GATE FOR STALE PRIOR-DAY SHIFTS */}
        {staleAttendanceSession ? (
          <form onSubmit={handleReconcileStaleShift} className="flex-1 min-h-0 flex flex-col overflow-hidden">
            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-4">
              <div className="p-4 rounded-lg bg-[#FEF3C7] border border-[#D97706]/40 text-[#92400E] space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-xs font-bold flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[18px] text-[#D97706]">warning</span>
                    <span>Unclosed Shift Detected ({staleAttendanceSession.date})</span>
                  </span>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-white/80 text-[#92400E] font-data-tabular">
                    Clocked In: {staleAttendanceSession.clockInTime} ({staleAttendanceSession.workMode})
                  </span>
                </div>
                <p className="text-xs leading-relaxed">
                  To maintain accurate payroll hours and prevent overnight timer drift, please enter your actual departure time and end-of-day output for <strong>{staleAttendanceSession.date}</strong>.
                </p>
                {staleAttendanceSession.dailyTasksFocus && (
                  <p className="text-[11px] bg-white/60 p-2 rounded border border-[#D97706]/20 italic">
                    <strong>Stated Morning Focus:</strong> &ldquo;{staleAttendanceSession.dailyTasksFocus}&rdquo;
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">
                    Actual Departure Time ({staleAttendanceSession.date}) <span className="text-error">*</span>
                  </label>
                  <input
                    type="time"
                    required
                    value={retroClockOutTime}
                    onChange={e => setRetroClockOutTime(e.target.value)}
                    className="w-full h-11 px-3 rounded bg-surface border border-outline-variant font-data-tabular text-sm font-bold text-on-surface focus:border-primary outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">
                    Reconciliation Reason
                  </label>
                  <input
                    type="text"
                    value={retroNote}
                    onChange={e => setRetroNote(e.target.value)}
                    placeholder="e.g. Forgot to clock out before leaving campus"
                    className="w-full h-11 px-3 rounded bg-surface border border-outline-variant text-xs text-on-surface focus:border-primary outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  Completed Deliverables for {staleAttendanceSession.date} <span className="text-error">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={retroSummary}
                  onChange={e => setRetroSummary(e.target.value)}
                  placeholder="Summarize what you accomplished during that shift..."
                  className="w-full p-3 rounded-lg bg-surface border border-outline-variant text-xs text-on-surface focus:border-primary outline-none resize-none"
                />
              </div>
            </div>

            <div className="shrink-0 p-3 sm:p-4 bg-surface-bright border-t border-outline-variant flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 h-10 rounded border border-outline-variant text-xs font-bold text-secondary hover:bg-surface-container cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isReconcilingStale || !retroSummary.trim()}
                className="px-5 h-10 rounded bg-[#D97706] hover:bg-[#B45309] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[16px]">task_alt</span>
                <span>
                  {isReconcilingStale
                    ? 'Reconciling Shift...'
                    : `Close ${staleAttendanceSession.date} Shift & Continue`}
                </span>
              </button>
            </div>
          </form>
        ) : (
          /* STEP 1: TODAY'S SHIFT CLOCK-IN & STANDUP SYNC */
          <form onSubmit={handleSubmitClockIn} className="flex-1 min-h-0 flex flex-col overflow-hidden">
            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-4">
              {/* Same-Day Shift Resume Banner if user clocked out earlier today */}
              {todayCompletedSession && (
                <div className="p-3.5 rounded-lg bg-[#E0F2FE] border border-[#0284C7]/30 flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-[#0284C7] text-[22px]">replay</span>
                    <div>
                      <p className="text-xs font-bold text-on-surface">
                        Completed Shift Found Today ({todayCompletedSession.clockInTime} – {todayCompletedSession.clockOutTime})
                      </p>
                      <p className="text-[11px] text-secondary">
                        Clocked out early by mistake or returning from an extended break? Resume your existing shift to keep a single continuous daily record.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleResumeTodayShift}
                    disabled={isResuming}
                    className="px-3.5 h-9 rounded bg-[#0284C7] hover:bg-[#0369A1] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <span className="material-symbols-outlined text-[16px]">play_arrow</span>
                    <span>{isResuming ? 'Resuming...' : 'Resume Today Shift'}</span>
                  </button>
                </div>
              )}

              {/* Current Staff & Punctuality Status Bar */}
              <div className="p-3 bg-surface-container-low rounded-lg border border-outline-variant flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-sm">
                    {currentUser?.name
                      .split(' ')
                      .map(n => n[0])
                      .join('')
                      .slice(0, 2) || 'ST'}
                  </div>
                  <div>
                    <p className="font-bold text-sm text-on-surface">{currentUser?.name}</p>
                    <p className="text-xs text-secondary">
                      {currentUser?.roleTitle || currentUser?.role} •{' '}
                      {currentUser?.department || (currentUser?.role === 'mentor' ? 'Academic Faculty' : 'Operations')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <div className="text-right">
                    <p className="text-[11px] text-secondary">Check-In Time (WAT)</p>
                    <p className="font-bold text-sm font-data-tabular text-on-surface">
                      {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                    </p>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      punctualityPreview === 'On-Time'
                        ? 'bg-[#DCFCE7] text-[#16A34A]'
                        : punctualityPreview === 'Flexible / Faculty'
                        ? 'bg-[#E0F2FE] text-[#0284C7]'
                        : punctualityPreview === 'Grace Period'
                        ? 'bg-[#FEF3C7] text-[#D97706]'
                        : 'bg-[#FFDAD6] text-[#BA1A1A]'
                    }`}
                  >
                    ● {punctualityPreview}
                  </span>
                </div>
              </div>

              {/* Work Mode Selector */}
              <div className="space-y-1.5">
                <label className="font-label-md text-xs font-semibold text-secondary">
                  Work Environment / Station <span className="text-error">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setWorkMode('On-Site / Hub')}
                    className={`min-h-[52px] p-3 rounded-lg border text-left transition-all cursor-pointer flex items-center gap-3 ${
                      workMode === 'On-Site / Hub'
                        ? 'border-primary bg-[#DCE1FF]/35 ring-1 ring-primary'
                        : 'border-outline-variant bg-surface hover:border-outline'
                    }`}
                  >
                    <span
                      className={`material-symbols-outlined text-[24px] ${
                        workMode === 'On-Site / Hub' ? 'text-primary' : 'text-secondary'
                      }`}
                    >
                      domain
                    </span>
                    <div>
                      <p className="font-bold text-xs text-on-surface">On-Site / Campus Hub</p>
                      <p className="text-[11px] text-secondary">GPS perimeter verified</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setWorkMode('Remote')}
                    className={`min-h-[52px] p-3 rounded-lg border text-left transition-all cursor-pointer flex items-center gap-3 ${
                      workMode === 'Remote'
                        ? 'border-primary bg-[#DCE1FF]/35 ring-1 ring-primary'
                        : 'border-outline-variant bg-surface hover:border-outline'
                    }`}
                  >
                    <span
                      className={`material-symbols-outlined text-[24px] ${
                        workMode === 'Remote' ? 'text-primary' : 'text-secondary'
                      }`}
                    >
                      home_work
                    </span>
                    <div>
                      <p className="font-bold text-xs text-on-surface">Remote / Flex</p>
                      <p className="text-[11px] text-secondary">Home or remote workstation</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Multi-Campus Geofence & Workstation Card */}
              <div className="p-3.5 rounded-lg border border-outline-variant bg-surface space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-xs font-semibold text-on-surface flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-primary">pin_drop</span>
                    {workMode === 'On-Site / Hub'
                      ? 'Assigned Campus Facility & Geofence Audit'
                      : 'Remote Workstation Specification'}
                  </span>

                  <div className="flex items-center gap-1.5">
                    {workMode === 'On-Site / Hub' && (
                      <button
                        type="button"
                        onClick={() => triggerGpsCheck(selectedCampusId)}
                        disabled={isLocating}
                        className="px-2 py-0.5 rounded border border-outline-variant bg-surface-container-low hover:bg-surface-container text-[11px] font-semibold text-on-surface flex items-center gap-1 cursor-pointer"
                        title="Refresh GPS coordinates"
                      >
                        <span className={`material-symbols-outlined text-[13px] ${isLocating ? 'animate-spin' : ''}`}>
                          my_location
                        </span>
                        <span>Retry GPS</span>
                      </button>
                    )}
                    <span
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                        geoStatus === 'Verified On-Site' || geoStatus === 'Remote Verified'
                          ? 'bg-[#DCFCE7] text-[#16A34A]'
                          : geoStatus === 'Location Mismatch'
                          ? 'bg-[#FEF3C7] text-[#D97706]'
                          : 'bg-[#FFDAD6] text-[#BA1A1A]'
                      }`}
                    >
                      {isLocating ? 'Acquiring GPS...' : geoStatus}
                    </span>
                  </div>
                </div>

                {workMode === 'On-Site / Hub' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-secondary mb-1">
                        Campus Hub Location
                      </label>
                      <select
                        value={selectedCampusId}
                        onChange={e => handleSelectCampus(e.target.value)}
                        className="w-full h-10 px-2.5 bg-surface-container-lowest border border-outline-variant rounded text-xs font-semibold text-on-surface focus:border-primary outline-none cursor-pointer"
                      >
                        {activeCampuses.map(c => (
                          <option key={c.id} value={c.id}>
                            {c.name} ({c.city} • {c.code})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-secondary mb-1">
                        Office / Lab / Desk (Optional)
                      </label>
                      <input
                        type="text"
                        value={workstationDetail}
                        onChange={e => setWorkstationDetail(e.target.value)}
                        placeholder="e.g. Lab 2 / Admissions Desk"
                        className="w-full h-10 px-3 bg-surface-container-lowest border border-outline-variant rounded text-xs text-on-surface focus:border-primary outline-none"
                      />
                    </div>
                  </div>
                ) : (
                  <input
                    type="text"
                    value={workstationDetail}
                    onChange={e => setWorkstationDetail(e.target.value)}
                    placeholder="e.g. Home Office — Lekki / Flex Co-working Space"
                    className="w-full h-10 px-3 bg-surface-container-lowest border border-outline-variant rounded text-xs text-on-surface focus:border-primary outline-none"
                  />
                )}

                <p className="text-[11px] text-secondary flex items-start gap-1.5">
                  <span className="material-symbols-outlined text-[15px] shrink-0 mt-0.5">
                    {geoStatus === 'Verified On-Site' || geoStatus === 'Remote Verified'
                      ? 'verified'
                      : 'warning'}
                  </span>
                  <span>{geoMessage}</span>
                </p>

                {workMode === 'On-Site / Hub' && currentCampus && (
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-outline-variant/60 text-[11px] text-secondary font-data-tabular">
                    <span>
                      Hub: <strong>{currentCampus.name}</strong> • Geofence: <strong>{currentCampus.radiusMeters}m</strong>
                      {coords.accuracy ? ` • GPS Accuracy: ±${coords.accuracy}m` : ''}
                    </span>
                    {distanceMeters !== null && (
                      <span
                        className={
                          distanceMeters <= currentCampus.radiusMeters
                            ? 'text-[#16A34A] font-bold'
                            : 'text-[#D97706] font-bold'
                        }
                      >
                        Distance: {distanceMeters}m{' '}
                        {distanceMeters <= currentCampus.radiusMeters
                          ? '(Inside Perimeter ✓)'
                          : '(Outside Perimeter ⚠️)'}
                      </span>
                    )}
                  </div>
                )}

                {/* Mandatory Exception Note when On-Site GPS mismatches or is unavailable */}
                {needsGeoException && (
                  <div className="p-3 rounded-lg bg-[#FEF3C7]/70 border border-[#D97706]/40 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-[#92400E] flex items-center gap-1">
                        <span className="material-symbols-outlined text-[15px]">gpp_maybe</span>
                        <span>Geofence Exception / Verification Note Required *</span>
                      </label>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white text-[#92400E]">
                        Queued for Admin Audit
                      </span>
                    </div>
                    <input
                      type="text"
                      required
                      value={geoExceptionReason}
                      onChange={e => setGeoExceptionReason(e.target.value)}
                      placeholder="Explain why GPS is outside campus radius or unavailable..."
                      className="w-full h-9 px-3 rounded bg-white border border-[#D97706]/40 text-xs text-on-surface outline-none focus:border-primary"
                    />
                    <div className="flex flex-wrap gap-1.5">
                      {GEO_EXCEPTION_REASONS.map(reason => (
                        <button
                          key={reason}
                          type="button"
                          onClick={() => setGeoExceptionReason(reason)}
                          className="px-2 py-0.5 rounded bg-white/90 hover:bg-white border border-[#D97706]/30 text-[10px] font-semibold text-[#92400E] cursor-pointer"
                        >
                          + {reason}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Scheduled Classes Banner for Faculty Mentors */}
              {todayScheduledClasses.length > 0 && (
                <div className="p-3 rounded-lg bg-[#E0F2FE]/60 border border-[#0284C7]/30 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#0284C7] flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px]">school</span>
                      <span>Scheduled Teaching &amp; Coaching Today ({todayScheduledClasses.length})</span>
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {todayScheduledClasses.map(cls => (
                      <button
                        key={cls.id}
                        type="button"
                        onClick={() => handleAddStandupTask(cls.title, cls.moduleId)}
                        className="px-2.5 py-1 rounded bg-white hover:bg-blue-50 border border-[#0284C7]/30 text-[11px] font-semibold text-on-surface flex items-center gap-1 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[13px] text-[#0284C7]">add_task</span>
                        <span>{cls.title}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Two-Way Synced Daily Standup Commitments */}
              <div className="p-3.5 rounded-lg border border-outline-variant bg-surface space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <label className="font-label-md text-xs font-bold text-on-surface flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px] text-primary">checklist</span>
                      <span>Today&apos;s Shift Objectives &amp; Standup Commitments</span>
                      <span className="text-error">*</span>
                    </label>
                    <p className="text-[11px] text-secondary">
                      Automatically syncs with your AI Daily Standup &amp; EOD Clock-Out checklist
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAddStandupTask('')}
                    className="px-2.5 h-7 rounded bg-primary/10 hover:bg-primary/15 text-primary text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[15px]">add</span>
                    <span>Add Objective</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {standupTasks.map((task, idx) => (
                    <div
                      key={task.id}
                      className="flex items-center gap-2 p-2 rounded-lg bg-surface-container-low border border-outline-variant"
                    >
                      <span className="w-5 h-5 rounded-full bg-primary/10 text-primary font-data-tabular text-[11px] font-bold flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <input
                        type="text"
                        value={task.description}
                        onChange={e => handleUpdateTask(task.id, { description: e.target.value })}
                        placeholder={`Shift deliverable / task #${idx + 1}...`}
                        className="flex-1 bg-transparent text-xs text-on-surface placeholder:text-secondary outline-none font-medium"
                      />
                      <select
                        value={task.moduleId}
                        onChange={e => handleUpdateTask(task.id, { moduleId: e.target.value })}
                        className="h-7 px-2 rounded bg-surface border border-outline-variant text-[11px] font-semibold text-on-surface outline-none cursor-pointer"
                      >
                        {AVAILABLE_MODULES.map(m => (
                          <option key={m.id} value={m.id}>
                            {m.name}
                          </option>
                        ))}
                      </select>
                      {standupTasks.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveTask(task.id)}
                          className="text-secondary hover:text-error p-1 cursor-pointer"
                          title="Remove objective"
                        >
                          <span className="material-symbols-outlined text-[16px]">delete</span>
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Role-Tailored Quick Templates */}
                <div className="space-y-1 pt-1">
                  <p className="text-[11px] text-secondary font-medium">
                    Quick-Add Role Templates ({currentUser?.roleTitle || currentUser?.role}):
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {roleTemplates.map(tpl => (
                      <button
                        key={tpl.label}
                        type="button"
                        onClick={() => handleAddStandupTask(tpl.label, tpl.moduleId)}
                        className="px-2.5 py-1 rounded bg-surface-container-low hover:bg-surface-container border border-outline-variant text-[11px] text-on-surface transition-colors cursor-pointer text-left"
                      >
                        + {tpl.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Optional Shift Notes */}
                <div className="pt-1">
                  <input
                    type="text"
                    value={additionalNotes}
                    onChange={e => setAdditionalNotes(e.target.value)}
                    placeholder="Optional shift context or handover notes..."
                    className="w-full h-9 px-3 rounded bg-surface-container-lowest border border-outline-variant text-xs text-on-surface focus:border-primary outline-none"
                  />
                </div>
              </div>

              {/* Policy Reminder */}
              <div className="p-2.5 bg-surface-container-low rounded border border-outline-variant flex items-center gap-2 text-[11px] text-secondary">
                <span className="material-symbols-outlined text-[16px] text-primary">policy</span>
                <span>
                  {currentUser?.role === 'mentor'
                    ? 'Faculty Mentor Schedule: Flexible shift check-in synced with your assigned cohort lectures and 1-on-1 coaching sessions.'
                    : `Institutional Work Hours Policy: ${policy.expectedClockInTime} – ${policy.expectedClockOutTime} (WAT) with a ${policy.gracePeriodMinutes}-minute arrival grace period.`}
                </span>
              </div>
            </div>

            {/* Sticky Footer */}
            <div className="shrink-0 p-3 sm:p-4 bg-surface-bright border-t border-outline-variant flex items-center justify-between gap-2 flex-wrap">
              <span className="text-[11px] text-secondary font-medium">
                {validTasks.length} objective{validTasks.length === 1 ? '' : 's'} queued for AI Standup
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
                  disabled={isSubmitting || !canSubmitClockIn}
                  className="px-5 h-10 rounded-lg bg-[#1E3A8A] hover:bg-[#00236F] text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-xs"
                >
                  <span className="material-symbols-outlined text-[16px]">login</span>
                  <span>{isSubmitting ? 'Starting Shift...' : 'Confirm Clock-In & Sync Standup'}</span>
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
