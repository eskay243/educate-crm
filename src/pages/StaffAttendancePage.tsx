import React, { useState, useMemo } from 'react';
import { useCRM } from '../context/CRMContext';
import { AttendanceRecord } from '../types/crm';

type AttendanceViewTab = 'my_shifts' | 'institutional_ledger' | 'today_roster' | 'verification_queue';
type DateRangeFilter = 'today' | 'week' | 'month' | 'all' | 'custom';

export const StaffAttendancePage: React.FC = () => {
  const {
    attendanceRecords,
    activeAttendanceSession,
    staleAttendanceSession,
    todayCompletedSession,
    toggleShiftBreak,
    resumeTodayShift,
    verifyAttendanceShift,
    openModal,
    currentUser,
    staffUsers,
    mentors,
    settings,
    isSuperAdmin,
  } = useCRM();

  const canManageAttendance =
    isSuperAdmin ||
    currentUser?.role === 'super_admin' ||
    currentUser?.role === 'program_officer' ||
    currentUser?.role === 'finance';

  const [activeTab, setActiveTab] = useState<AttendanceViewTab>(
    canManageAttendance ? 'institutional_ledger' : 'my_shifts'
  );
  const [dateRange, setDateRange] = useState<DateRangeFilter>('all');
  const [customDate, setCustomDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMode, setSelectedMode] = useState<string>('all');
  const [selectedPunctuality, setSelectedPunctuality] = useState<string>('all');
  const [selectedGeo, setSelectedGeo] = useState<string>('all');

  const todayStr = new Date().toISOString().split('T')[0];

  // Helper to check if a record belongs to currentUser
  const isMyRecord = (record: AttendanceRecord) => {
    if (!currentUser) return false;
    return (
      (record.staffId || record.userId) === currentUser.id ||
      (record.staffEmail || record.userEmail)?.toLowerCase() === currentUser.email?.toLowerCase()
    );
  };

  // Helper to check date filter
  const matchesDateFilter = (recordDate: string) => {
    if (!recordDate) return true;
    if (dateRange === 'all') return true;
    if (dateRange === 'today') return recordDate === todayStr;
    if (dateRange === 'custom') return recordDate === customDate;

    const recTime = new Date(`${recordDate}T00:00:00`).getTime();
    const now = new Date();
    if (dateRange === 'week') {
      const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000).toISOString().split('T')[0];
      return recordDate >= sevenDaysAgo && recordDate <= todayStr;
    }
    if (dateRange === 'month') {
      const monthPrefix = todayStr.slice(0, 7); // YYYY-MM
      return recordDate.startsWith(monthPrefix) || !isNaN(recTime);
    }
    return true;
  };

  // Pending Verification count for badge
  const pendingVerificationRecords = useMemo(() => {
    return attendanceRecords.filter(
      r =>
        r.verificationStatus === 'Pending Verification' ||
        r.verificationStatus === 'Flagged' ||
        ((r.geoStatus === 'Location Mismatch' || r.geoStatus === 'GPS Unavailable') &&
          r.verificationStatus !== 'Verified')
    );
  }, [attendanceRecords]);

  // Filter attendance records based on active tab, date filter, and search/select filters
  const filteredRecords = useMemo(() => {
    return attendanceRecords.filter(record => {
      // Tab scope
      if (activeTab === 'my_shifts' && !isMyRecord(record)) return false;
      if (activeTab === 'verification_queue') {
        const needsAudit =
          record.verificationStatus === 'Pending Verification' ||
          record.verificationStatus === 'Flagged' ||
          record.isRetroactiveClockOut ||
          ((record.geoStatus === 'Location Mismatch' || record.geoStatus === 'GPS Unavailable') &&
            record.verificationStatus !== 'Verified');
        if (!needsAudit) return false;
      }

      if (!matchesDateFilter(record.date)) return false;

      const name = record.staffName || record.userName || '';
      const role = record.roleTitle || record.userRole || '';
      const focus = record.dailyTasksFocus || record.shiftFocus || '';
      const summary = record.workSummary || '';
      const campus = record.campusName || record.locationName || '';
      const punct = record.punctualityStatus || record.punctuality;

      const matchesSearch =
        name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        role.toLowerCase().includes(searchTerm.toLowerCase()) ||
        focus.toLowerCase().includes(searchTerm.toLowerCase()) ||
        summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
        campus.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesMode = selectedMode === 'all' || record.workMode === selectedMode;
      const matchesPunctuality =
        selectedPunctuality === 'all' || punct === selectedPunctuality;
      const matchesGeo = selectedGeo === 'all' || record.geoStatus === selectedGeo;

      return matchesSearch && matchesMode && matchesPunctuality && matchesGeo;
    });
  }, [
    attendanceRecords,
    activeTab,
    dateRange,
    customDate,
    searchTerm,
    selectedMode,
    selectedPunctuality,
    selectedGeo,
    currentUser,
  ]);

  // Today's Live Roster & Absentee calculation across staffUsers + active mentors
  const todayRoster = useMemo(() => {
    const todayRecs = attendanceRecords.filter(r => r.date === todayStr);

    const directoryMap = new Map<
      string,
      {
        id: string;
        name: string;
        email: string;
        roleTitle: string;
        department: string;
        isMentor?: boolean;
      }
    >();

    staffUsers
      .filter(u => u.role !== 'student' && u.isActive !== false)
      .forEach(u => {
        directoryMap.set(u.email.toLowerCase(), {
          id: u.id,
          name: u.name,
          email: u.email,
          roleTitle: u.roleTitle || u.role,
          department: u.department || 'Operations',
          isMentor: u.role === 'mentor',
        });
      });

    mentors
      .filter(m => m.status !== 'Deactivated' && m.isActive !== false)
      .forEach(m => {
        if (m.email && !directoryMap.has(m.email.toLowerCase())) {
          directoryMap.set(m.email.toLowerCase(), {
            id: m.id,
            name: m.name,
            email: m.email,
            roleTitle: m.role || 'Faculty Mentor',
            department: m.department || 'Academic Faculty',
            isMentor: true,
          });
        }
      });

    const rosterItems = Array.from(directoryMap.values()).map(person => {
      const todayRecord = todayRecs.find(
        r =>
          (r.staffId || r.userId) === person.id ||
          (r.staffEmail || r.userEmail)?.toLowerCase() === person.email.toLowerCase()
      );
      let rosterStatus: 'On-Duty' | 'On Break' | 'Completed' | 'Not Clocked In' =
        'Not Clocked In';
      if (todayRecord) {
        if (todayRecord.clockOutTime) {
          rosterStatus = 'Completed';
        } else if (todayRecord.isOnBreak || todayRecord.status === 'On Break') {
          rosterStatus = 'On Break';
        } else {
          rosterStatus = 'On-Duty';
        }
      }
      return {
        ...person,
        todayRecord,
        rosterStatus,
      };
    });

    return {
      all: rosterItems,
      onDuty: rosterItems.filter(i => i.rosterStatus === 'On-Duty'),
      onBreak: rosterItems.filter(i => i.rosterStatus === 'On Break'),
      completed: rosterItems.filter(i => i.rosterStatus === 'Completed'),
      absent: rosterItems.filter(i => i.rosterStatus === 'Not Clocked In'),
    };
  }, [attendanceRecords, staffUsers, mentors, todayStr]);

  // Scoped KPIs for the 4 Bento Cards
  const todayRecords = attendanceRecords.filter(r => r.date === todayStr);
  const activeNowCount = attendanceRecords.filter(r => !r.clockOutTime && r.date === todayStr).length;
  const onBreakNowCount = attendanceRecords.filter(
    r => !r.clockOutTime && r.date === todayStr && r.isOnBreak
  ).length;

  const kpiPool = filteredRecords.length > 0 ? filteredRecords : attendanceRecords;
  const onSiteCount = kpiPool.filter(r => r.workMode === 'On-Site / Hub').length;
  const hubRatio = kpiPool.length > 0 ? Math.round((onSiteCount / kpiPool.length) * 100) : 0;

  const punctualCount = kpiPool.filter(r => {
    const p = r.punctualityStatus || r.punctuality;
    return p === 'On-Time' || p === 'Grace Period' || p === 'Flexible / Faculty';
  }).length;
  const punctualityRate =
    kpiPool.length > 0 ? Math.round((punctualCount / kpiPool.length) * 100) : 100;

  const totalHoursWorked = kpiPool
    .reduce((acc, r) => acc + (r.totalHoursWorked || 0), 0)
    .toFixed(1);
  const totalOvertimeHours = kpiPool
    .reduce((acc, r) => acc + (r.overtimeHours || 0), 0)
    .toFixed(1);

  const officeRadius =
    settings.campusLocationsList?.[0]?.radiusMeters ??
    settings.officeLocation?.radiusMeters ??
    400;

  // Supervisor Force Clock-Out Handler
  const handleForceClockOut = async (record: AttendanceRecord) => {
    const now = new Date();
    const outTimeStr = now.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
    const breakMins = Number(record.totalBreakMinutes || 0);
    const grossMs = Math.max(60000, now.getTime() - record.clockInTimestamp);
    const netMs = Math.max(60000, grossMs - breakMins * 60000);
    const netHrs = Number(Math.min(12, netMs / (1000 * 60 * 60)).toFixed(2));

    await verifyAttendanceShift(record.id, {
      clockOutTime: outTimeStr,
      clockOutTimestamp: now.getTime(),
      totalHoursWorked: netHrs,
      isOnBreak: false,
      status: 'Clocked Out',
      verificationStatus: 'Admin Override',
      workSummary:
        record.workSummary ||
        `Shift force-closed by ${currentUser?.name || 'Administrator'}.`,
    });
  };

  // CSV Export
  const exportTimesheetCSV = () => {
    const headers = [
      'Date',
      'Staff Name',
      'Email',
      'Role',
      'Department',
      'Work Mode',
      'Campus / Location',
      'Geo Status',
      'Geo Exception Note',
      'Distance (Meters)',
      'Verification Status',
      'Verified By',
      'Clock In',
      'Clock Out',
      'Break (Mins)',
      'Net Hours',
      'Overtime Hours',
      'Punctuality',
      'Morning Standup Focus',
      'End of Day Output & CRM Evidence',
    ];

    const rows = filteredRecords.map(r => [
      r.date,
      `"${(r.staffName || r.userName || '').replace(/"/g, '""')}"`,
      r.staffEmail || r.userEmail || '',
      `"${(r.roleTitle || r.userRole || '').replace(/"/g, '""')}"`,
      r.department || 'Operations',
      r.workMode,
      `"${(r.campusName || r.locationName || '').replace(/"/g, '""')}"`,
      r.geoStatus,
      `"${(r.geoExceptionReason || '').replace(/"/g, '""')}"`,
      r.distanceFromOfficeMeters ?? '',
      r.verificationStatus || 'Verified',
      `"${(r.verifiedBy || '').replace(/"/g, '""')}"`,
      r.clockInTime,
      r.clockOutTime || 'Active',
      r.totalBreakMinutes ?? 0,
      r.totalHoursWorked ?? '',
      r.overtimeHours ?? 0,
      r.punctualityStatus || r.punctuality,
      `"${(r.dailyTasksFocus || r.shiftFocus || '').replace(/"/g, '""')}"`,
      `"${(r.workSummary || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `timesheets_attendance_${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="space-y-stack-lg animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-outline-variant pb-stack-md">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-primary text-[28px]">schedule</span>
            <h1 className="font-headline-lg text-2xl font-bold text-on-surface">
              Staff Attendance, Shifts &amp; Standup Sync
            </h1>
          </div>
          <p className="font-body-md text-xs text-secondary mt-1">
            Multi-Campus Geofence Audits • Two-Way AI Standup Alignment • Break &amp; Overtime Ledger
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => openModal('daily-standup')}
            className="px-3.5 h-9 rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 text-xs font-bold text-amber-800 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">psychology</span>
            <span>AI Daily Standup</span>
          </button>

          <button
            onClick={exportTimesheetCSV}
            className="px-3.5 h-9 rounded-lg border border-outline-variant bg-surface hover:bg-surface-container text-xs font-bold text-secondary transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Download CSV for payroll & compliance audit"
          >
            <span className="material-symbols-outlined text-[16px]">download</span>
            <span>Export Timesheet CSV</span>
          </button>

          {activeAttendanceSession ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  toggleShiftBreak(activeAttendanceSession.isOnBreak ? 'end' : 'start')
                }
                className={`px-3.5 h-9 rounded-lg border text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
                  activeAttendanceSession.isOnBreak
                    ? 'bg-[#DCFCE7] border-[#16A34A]/40 text-[#166534]'
                    : 'bg-[#FEF3C7] border-[#D97706]/40 text-[#92400E]'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">
                  {activeAttendanceSession.isOnBreak ? 'play_arrow' : 'coffee'}
                </span>
                <span>
                  {activeAttendanceSession.isOnBreak ? 'End Break' : 'Pause for Break'}
                </span>
              </button>

              <button
                onClick={() => openModal('clock-out')}
                className="px-4 h-9 rounded-lg bg-[#BA1A1A] text-white text-xs font-bold hover:bg-[#991B1B] transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">logout</span>
                <span>Clock Out / End Shift</span>
              </button>
            </div>
          ) : staleAttendanceSession ? (
            <button
              onClick={() => openModal('clock-in')}
              className="px-4 h-9 rounded-lg bg-[#D97706] text-white text-xs font-bold hover:bg-[#B45309] transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">history_toggle_off</span>
              <span>Reconcile {staleAttendanceSession.date} Shift &amp; Clock In</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              {todayCompletedSession && (
                <button
                  onClick={() => resumeTodayShift(todayCompletedSession.id)}
                  className="px-3.5 h-9 rounded-lg bg-[#E0F2FE] border border-[#0284C7]/30 text-[#0284C7] text-xs font-bold hover:bg-[#BAE6FD] transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">replay</span>
                  <span>Resume Today Shift</span>
                </button>
              )}
              <button
                onClick={() => openModal('clock-in')}
                className="px-4 h-9 rounded-lg bg-[#1E3A8A] text-white text-xs font-bold hover:bg-[#00236F] transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">timer</span>
                <span>Clock In for Work</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Stale Shift Alert Banner if user has an unclosed prior-day shift */}
      {staleAttendanceSession && (
        <div className="p-4 rounded-xl bg-[#FEF3C7] border border-[#D97706]/40 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[#D97706] text-[24px]">warning</span>
            <div>
              <p className="text-xs sm:text-sm font-bold text-[#92400E]">
                Action Required: Unclosed Shift from {staleAttendanceSession.date} (Clocked in at{' '}
                {staleAttendanceSession.clockInTime})
              </p>
              <p className="text-xs text-[#92400E]/90">
                Please submit your retroactive departure time and deliverables summary to close this shift before starting today&apos;s attendance session.
              </p>
            </div>
          </div>
          <button
            onClick={() => openModal('clock-in')}
            className="px-4 h-9 rounded-lg bg-[#D97706] hover:bg-[#B45309] text-white text-xs font-bold cursor-pointer shrink-0"
          >
            Reconcile Shift Now
          </button>
        </div>
      )}

      {/* 4 Bento KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter">
        {/* On-Duty Staff */}
        <div className="bg-surface-container-lowest p-stack-md border border-outline-variant rounded-lg shadow-xs">
          <div className="flex justify-between items-start mb-2">
            <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined">badge</span>
            </div>
            <span className="text-xs font-bold text-[#166534] bg-[#DCFCE7] px-2 py-0.5 rounded font-data-tabular">
              {todayRecords.length} shifts today
            </span>
          </div>
          <p className="font-body-sm text-xs text-secondary">Currently On-Duty</p>
          <h3 className="font-headline-lg text-2xl font-bold text-on-surface font-data-tabular">
            {activeNowCount}{' '}
            <span className="text-xs font-normal text-secondary">
              Active {onBreakNowCount > 0 ? `(${onBreakNowCount} on break)` : 'Now'}
            </span>
          </h3>
        </div>

        {/* Hub vs Remote Ratio */}
        <div className="bg-surface-container-lowest p-stack-md border border-outline-variant rounded-lg shadow-xs">
          <div className="flex justify-between items-start mb-2">
            <div className="w-10 h-10 rounded bg-secondary-container flex items-center justify-center text-primary">
              <span className="material-symbols-outlined">domain</span>
            </div>
            <span className="text-xs font-bold text-secondary bg-surface-container px-2 py-0.5 rounded font-data-tabular">
              Geofence: {officeRadius}m
            </span>
          </div>
          <p className="font-body-sm text-xs text-secondary">On-Site Hub Ratio</p>
          <h3 className="font-headline-lg text-2xl font-bold text-on-surface font-data-tabular">
            {hubRatio}%{' '}
            <span className="text-xs font-normal text-secondary">
              ({onSiteCount} Hub shifts)
            </span>
          </h3>
        </div>

        {/* Punctuality Rate */}
        <div className="bg-surface-container-lowest p-stack-md border border-outline-variant rounded-lg shadow-xs">
          <div className="flex justify-between items-start mb-2">
            <div className="w-10 h-10 rounded bg-surface-container flex items-center justify-center text-on-surface">
              <span className="material-symbols-outlined">alarm_on</span>
            </div>
            <span className="text-xs font-bold text-secondary bg-surface-container-high px-2 py-0.5 rounded font-data-tabular">
              Policy: {settings.workHoursPolicy?.expectedClockInTime || '09:00'} WAT
            </span>
          </div>
          <p className="font-body-sm text-xs text-secondary">Punctuality Compliance</p>
          <h3 className="font-headline-lg text-2xl font-bold text-on-surface font-data-tabular">
            {punctualityRate}%{' '}
            <span className="text-xs font-normal text-secondary">
              ({punctualCount} compliant)
            </span>
          </h3>
        </div>

        {/* Net Work Hours & Overtime */}
        <div className="bg-surface-container-lowest p-stack-md border border-outline-variant rounded-lg shadow-xs">
          <div className="flex justify-between items-start mb-2">
            <div className="w-10 h-10 rounded bg-primary-container flex items-center justify-center text-on-primary">
              <span className="material-symbols-outlined">hourglass_top</span>
            </div>
            <span className="text-xs font-bold text-[#166534] bg-[#DCFCE7] px-2 py-0.5 rounded font-data-tabular">
              +{totalOvertimeHours}h Overtime
            </span>
          </div>
          <p className="font-body-sm text-xs text-secondary">Net Hours Logged</p>
          <h3 className="font-headline-lg text-2xl font-bold text-on-surface font-data-tabular">
            {totalHoursWorked}{' '}
            <span className="text-xs font-normal text-secondary">Net Hours</span>
          </h3>
        </div>
      </div>

      {/* Role-Scoped Navigation Tabs & Date Period Bar */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-lg overflow-hidden shadow-xs">
        <div className="px-stack-md pt-3 border-b border-outline-variant bg-surface-bright flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* View Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab('my_shifts')}
              className={`px-3.5 pb-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'my_shifts'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-secondary hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">person</span>
              <span>My Shifts &amp; Timesheet</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('institutional_ledger')}
              className={`px-3.5 pb-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'institutional_ledger'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-secondary hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">table_chart</span>
              <span>Institutional Attendance Ledger</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('today_roster')}
              className={`px-3.5 pb-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'today_roster'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-secondary hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">groups</span>
              <span>Today&apos;s Roster &amp; Absentees</span>
              {todayRoster.absent.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-surface-container text-secondary font-data-tabular">
                  {todayRoster.absent.length} unclocked
                </span>
              )}
            </button>

            {canManageAttendance && (
              <button
                type="button"
                onClick={() => setActiveTab('verification_queue')}
                className={`px-3.5 pb-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  activeTab === 'verification_queue'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-secondary hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">fact_check</span>
                <span>Verification Queue</span>
                {pendingVerificationRecords.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[#FEF3C7] text-[#92400E] font-bold font-data-tabular">
                    {pendingVerificationRecords.length}
                  </span>
                )}
              </button>
            )}
          </div>

          {/* Date Period Pill Selector */}
          {activeTab !== 'today_roster' && (
            <div className="flex items-center gap-1.5 pb-2.5 flex-wrap">
              {(
                [
                  { id: 'today', label: 'Today' },
                  { id: 'week', label: 'Last 7 Days' },
                  { id: 'month', label: 'This Month' },
                  { id: 'all', label: 'All Time' },
                  { id: 'custom', label: 'Date' },
                ] as { id: DateRangeFilter; label: string }[]
              ).map(p => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setDateRange(p.id)}
                  className={`px-2.5 h-7 rounded text-[11px] font-bold transition-colors cursor-pointer ${
                    dateRange === p.id
                      ? 'bg-[#1E3A8A] text-white'
                      : 'bg-surface border border-outline-variant text-secondary hover:text-on-surface'
                  }`}
                >
                  {p.label}
                </button>
              ))}
              {dateRange === 'custom' && (
                <input
                  type="date"
                  value={customDate}
                  onChange={e => setCustomDate(e.target.value)}
                  className="h-7 px-2 rounded bg-surface border border-outline-variant text-[11px] font-data-tabular text-on-surface"
                />
              )}
            </div>
          )}
        </div>

        {/* TODAY'S ROSTER & ABSENTEES BOARD VIEW */}
        {activeTab === 'today_roster' ? (
          <div className="p-stack-md space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Column 1: Currently On-Duty / On Break */}
              <div className="p-4 rounded-lg border border-outline-variant bg-surface space-y-3">
                <div className="flex items-center justify-between border-b border-outline-variant pb-2">
                  <span className="text-xs font-bold text-[#166534] flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse" />
                    <span>Currently On-Duty ({todayRoster.onDuty.length + todayRoster.onBreak.length})</span>
                  </span>
                </div>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {todayRoster.onDuty.length + todayRoster.onBreak.length === 0 ? (
                    <p className="text-xs text-secondary py-6 text-center">
                      No staff members currently clocked in.
                    </p>
                  ) : (
                    [...todayRoster.onDuty, ...todayRoster.onBreak].map(person => (
                      <div
                        key={person.email}
                        className="p-2.5 rounded-lg bg-surface-container-lowest border border-outline-variant flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <p className="font-bold text-xs text-on-surface truncate">
                            {person.name}
                          </p>
                          <p className="text-[11px] text-secondary truncate">
                            {person.roleTitle} • {person.todayRecord?.locationName}
                          </p>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                            person.rosterStatus === 'On Break'
                              ? 'bg-[#FEF3C7] text-[#92400E]'
                              : 'bg-[#DCFCE7] text-[#166534]'
                          }`}
                        >
                          {person.rosterStatus} ({person.todayRecord?.clockInTime})
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Column 2: Shift Completed Today */}
              <div className="p-4 rounded-lg border border-outline-variant bg-surface space-y-3">
                <div className="flex items-center justify-between border-b border-outline-variant pb-2">
                  <span className="text-xs font-bold text-[#0284C7] flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[15px]">task_alt</span>
                    <span>Shift Completed Today ({todayRoster.completed.length})</span>
                  </span>
                </div>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {todayRoster.completed.length === 0 ? (
                    <p className="text-xs text-secondary py-6 text-center">
                      No completed shifts yet today.
                    </p>
                  ) : (
                    todayRoster.completed.map(person => (
                      <div
                        key={person.email}
                        className="p-2.5 rounded-lg bg-surface-container-lowest border border-outline-variant flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <p className="font-bold text-xs text-on-surface truncate">
                            {person.name}
                          </p>
                          <p className="text-[11px] text-secondary truncate">
                            {person.roleTitle}
                          </p>
                        </div>
                        <span className="px-2 py-0.5 rounded bg-surface-container text-on-surface text-[10px] font-bold font-data-tabular shrink-0">
                          {person.todayRecord?.totalHoursWorked}h Net
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Column 3: Not Clocked-In Today (Absentee / Flexible Roster) */}
              <div className="p-4 rounded-lg border border-outline-variant bg-surface space-y-3">
                <div className="flex items-center justify-between border-b border-outline-variant pb-2">
                  <span className="text-xs font-bold text-[#92400E] flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[15px]">person_off</span>
                    <span>Not Clocked-In Today ({todayRoster.absent.length})</span>
                  </span>
                </div>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {todayRoster.absent.length === 0 ? (
                    <p className="text-xs text-[#16A34A] font-semibold py-6 text-center">
                      100% of active roster has clocked in today!
                    </p>
                  ) : (
                    todayRoster.absent.map(person => (
                      <div
                        key={person.email}
                        className="p-2.5 rounded-lg bg-surface-container-lowest border border-outline-variant flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <p className="font-bold text-xs text-on-surface truncate">
                            {person.name}
                          </p>
                          <p className="text-[11px] text-secondary truncate">
                            {person.roleTitle} • {person.department}
                          </p>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                            person.isMentor
                              ? 'bg-[#E0F2FE] text-[#0284C7]'
                              : 'bg-[#FFDAD6] text-[#BA1A1A]'
                          }`}
                        >
                          {person.isMentor ? 'Flexible Faculty' : 'Not Clocked In'}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* LEDGER TABLE VIEW (My Shifts, Institutional Ledger, Verification Queue) */
          <>
            {/* Search & Filter Bar */}
            <div className="p-stack-md border-b border-outline-variant bg-surface flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
              <div className="relative w-full md:w-80">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">
                  search
                </span>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Search staff, campus, standup task, output..."
                  className="w-full h-9 pl-9 pr-3 rounded bg-surface-container-lowest border border-outline-variant text-xs text-on-surface focus:border-primary outline-none"
                />
              </div>

              <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
                <select
                  value={selectedMode}
                  onChange={e => setSelectedMode(e.target.value)}
                  className="h-9 px-2.5 bg-surface-container-lowest border border-outline-variant rounded text-xs text-on-surface outline-none cursor-pointer"
                >
                  <option value="all">All Modes</option>
                  <option value="On-Site / Hub">On-Site / Hub</option>
                  <option value="Remote">Remote</option>
                </select>

                <select
                  value={selectedPunctuality}
                  onChange={e => setSelectedPunctuality(e.target.value)}
                  className="h-9 px-2.5 bg-surface-container-lowest border border-outline-variant rounded text-xs text-on-surface outline-none cursor-pointer"
                >
                  <option value="all">All Punctuality</option>
                  <option value="On-Time">On-Time</option>
                  <option value="Grace Period">Grace Period</option>
                  <option value="Flexible / Faculty">Flexible / Faculty</option>
                  <option value="Late">Late Arrival</option>
                </select>

                <select
                  value={selectedGeo}
                  onChange={e => setSelectedGeo(e.target.value)}
                  className="h-9 px-2.5 bg-surface-container-lowest border border-outline-variant rounded text-xs text-on-surface outline-none cursor-pointer"
                >
                  <option value="all">All Geo Statuses</option>
                  <option value="Verified On-Site">Verified On-Site</option>
                  <option value="Remote Verified">Remote Verified</option>
                  <option value="Location Mismatch">Location Mismatch</option>
                  <option value="GPS Unavailable">GPS Unavailable</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[980px] text-xs">
                <thead>
                  <tr className="border-b border-outline-variant bg-surface-container-low text-secondary font-label-md">
                    <th className="px-stack-md py-3 font-semibold">Staff Member</th>
                    <th className="px-stack-md py-3 font-semibold">Date &amp; Station</th>
                    <th className="px-stack-md py-3 font-semibold">Geofence &amp; Verification</th>
                    <th className="px-stack-md py-3 font-semibold">Clock In / Out</th>
                    <th className="px-stack-md py-3 font-semibold">Net Hours &amp; Breaks</th>
                    <th className="px-stack-md py-3 font-semibold">Punctuality</th>
                    <th className="px-stack-md py-3 font-semibold min-w-[280px]">
                      Standup Focus &amp; Verified EOD Output
                    </th>
                    <th className="px-stack-md py-3 text-right font-semibold">
                      Status / Audit Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant text-on-surface font-body-md">
                  {filteredRecords.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center text-secondary">
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <span className="material-symbols-outlined text-[36px] text-outline">
                            schedule
                          </span>
                          <p className="font-bold text-sm text-on-surface">
                            No Attendance Records Match Filter
                          </p>
                          <p className="text-xs max-w-sm">
                            Switch the date filter above or click &ldquo;Clock In for Work&rdquo; to start logging shift telemetry and daily standup tasks.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredRecords.map((record, index) => {
                      const isSelf = isMyRecord(record);
                      const isOnDuty = !record.clockOutTime;
                      const isOnBreak = Boolean(record.isOnBreak);
                      const staffDisplayName =
                        record.staffName || record.userName || 'Staff Member';
                      const staffRole = record.roleTitle || record.userRole;
                      const punctuality = record.punctualityStatus || record.punctuality;
                      const tasksFocus = record.dailyTasksFocus || record.shiftFocus;
                      const verifStatus = record.verificationStatus || 'Verified';

                      return (
                        <tr
                          key={record.id}
                          className={`hover:bg-surface-bright transition-colors ${
                            index % 2 === 1 ? 'bg-surface-container-low/40' : ''
                          } ${isOnDuty ? 'bg-primary/5' : ''}`}
                        >
                          {/* Staff */}
                          <td className="px-stack-md py-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-xs shrink-0">
                                {staffDisplayName
                                  .split(' ')
                                  .map((n: string) => n[0])
                                  .join('')
                                  .slice(0, 2)}
                              </div>
                              <div>
                                <p className="font-bold text-on-surface text-xs flex items-center gap-1">
                                  {staffDisplayName}
                                  {isSelf && (
                                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-primary/10 text-primary">
                                      You
                                    </span>
                                  )}
                                </p>
                                <p className="text-[11px] text-secondary">{staffRole}</p>
                              </div>
                            </div>
                          </td>

                          {/* Date & Station */}
                          <td className="px-stack-md py-3">
                            <p className="font-bold text-xs font-data-tabular">{record.date}</p>
                            <p className="text-[11px] text-secondary flex items-center gap-1">
                              <span className="material-symbols-outlined text-[13px]">
                                {record.workMode === 'On-Site / Hub' ? 'domain' : 'home_work'}
                              </span>
                              <span className="truncate max-w-[150px]" title={record.locationName}>
                                {record.campusName || record.locationName || record.workMode}
                              </span>
                            </p>
                          </td>

                          {/* Geofence & Verification */}
                          <td className="px-stack-md py-3">
                            <div className="space-y-1">
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold ${
                                  record.geoStatus === 'Verified On-Site' ||
                                  record.geoStatus === 'Remote Verified'
                                    ? 'bg-[#DCFCE7] text-[#166534]'
                                    : record.geoStatus === 'Location Mismatch'
                                    ? 'bg-[#FEF3C7] text-[#92400E]'
                                    : 'bg-[#FFDAD6] text-[#BA1A1A]'
                                }`}
                              >
                                <span className="material-symbols-outlined text-[12px]">
                                  {record.geoStatus === 'Verified On-Site' ||
                                  record.geoStatus === 'Remote Verified'
                                    ? 'verified'
                                    : 'warning'}
                                </span>
                                <span>{record.geoStatus}</span>
                              </span>

                              {record.distanceFromOfficeMeters !== undefined && (
                                <p className="text-[10px] text-secondary font-data-tabular">
                                  {record.distanceFromOfficeMeters}m from Hub
                                </p>
                              )}

                              {record.geoExceptionReason && (
                                <p
                                  className="text-[10px] text-[#92400E] bg-[#FEF3C7]/60 px-1.5 py-0.5 rounded border border-[#D97706]/30 max-w-[180px] truncate"
                                  title={record.geoExceptionReason}
                                >
                                  Note: {record.geoExceptionReason}
                                </p>
                              )}

                              {verifStatus !== 'Verified' && (
                                <span
                                  className={`inline-block text-[10px] font-bold px-1.5 py-0.2 rounded ${
                                    verifStatus === 'Flagged'
                                      ? 'bg-[#FFDAD6] text-[#BA1A1A]'
                                      : 'bg-[#FEF3C7] text-[#92400E]'
                                  }`}
                                >
                                  {verifStatus}
                                </span>
                              )}
                              {record.verifiedBy && (
                                <p className="text-[10px] text-[#16A34A] font-medium">
                                  ✓ Audited by {record.verifiedBy}
                                </p>
                              )}
                            </div>
                          </td>

                          {/* Clock In / Out */}
                          <td className="px-stack-md py-3 font-data-tabular">
                            <p className="font-semibold text-xs text-on-surface">
                              In: {record.clockInTime}
                            </p>
                            <p className="text-[11px] text-secondary">
                              Out:{' '}
                              {record.clockOutTime || (
                                <span className="text-primary font-bold">
                                  {isOnBreak ? 'Paused (Break)' : 'Active...'}
                                </span>
                              )}
                            </p>
                            {record.isRetroactiveClockOut && (
                              <span className="inline-block mt-0.5 text-[9px] font-bold px-1.5 py-0.2 rounded bg-[#FEF3C7] text-[#92400E]">
                                Retroactive Out
                              </span>
                            )}
                          </td>

                          {/* Net Hours & Breaks */}
                          <td className="px-stack-md py-3 font-data-tabular">
                            <p className="font-bold text-xs text-on-surface">
                              {record.totalHoursWorked ? `${record.totalHoursWorked}h` : '—'}
                            </p>
                            {(record.totalBreakMinutes || 0) > 0 && (
                              <p className="text-[10px] text-secondary">
                                Break: {record.totalBreakMinutes}m
                              </p>
                            )}
                            {(record.overtimeHours || 0) > 0 && (
                              <span className="inline-block text-[10px] font-bold text-[#166534] bg-[#DCFCE7] px-1.5 py-0.2 rounded">
                                +{record.overtimeHours}h OT
                              </span>
                            )}
                          </td>

                          {/* Punctuality */}
                          <td className="px-stack-md py-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                punctuality === 'On-Time'
                                  ? 'bg-[#DCFCE7] text-[#166534]'
                                  : punctuality === 'Flexible / Faculty'
                                  ? 'bg-[#E0F2FE] text-[#0284C7]'
                                  : punctuality === 'Grace Period'
                                  ? 'bg-[#FEF3C7] text-[#92400E]'
                                  : 'bg-[#FFDAD6] text-[#BA1A1A]'
                              }`}
                            >
                              {punctuality}
                            </span>
                          </td>

                          {/* Standup Focus & EOD Output */}
                          <td className="px-stack-md py-3">
                            <div className="space-y-1 max-w-sm">
                              {tasksFocus && (
                                <p className="text-[11px] text-on-surface line-clamp-2" title={tasksFocus}>
                                  <span className="font-semibold text-secondary">
                                    Standup Focus:
                                  </span>{' '}
                                  {tasksFocus}
                                </p>
                              )}
                              {record.workSummary && (
                                <div className="text-[11px] text-[#166534] bg-[#F0FDF4] p-1.5 rounded border border-[#BBF7D0]">
                                  <span className="font-semibold">EOD Output:</span>{' '}
                                  <span className="line-clamp-2" title={record.workSummary}>
                                    {record.workSummary}
                                  </span>
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Status & Admin Actions */}
                          <td className="px-stack-md py-3 text-right">
                            <div className="flex flex-col items-end gap-1.5">
                              {isOnDuty ? (
                                <span
                                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                    isOnBreak
                                      ? 'bg-[#FEF3C7] text-[#92400E]'
                                      : 'bg-[#DCFCE7] text-[#166534]'
                                  }`}
                                >
                                  <span
                                    className={`w-1.5 h-1.5 rounded-full ${
                                      isOnBreak ? 'bg-[#D97706]' : 'bg-[#16A34A] animate-ping'
                                    }`}
                                  />
                                  <span>{isOnBreak ? 'On Break' : 'On-Duty'}</span>
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-surface-container text-secondary">
                                  Completed
                                </span>
                              )}

                              {/* Supervisor Audit Buttons */}
                              {canManageAttendance && (
                                <div className="flex items-center gap-1 mt-0.5">
                                  {verifStatus !== 'Verified' && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        verifyAttendanceShift(record.id, {
                                          verificationStatus: 'Verified',
                                        })
                                      }
                                      className="px-2 py-0.5 rounded bg-[#DCFCE7] hover:bg-[#BBF7D0] text-[#166534] text-[10px] font-bold cursor-pointer"
                                      title="Approve & verify this shift"
                                    >
                                      ✓ Verify
                                    </button>
                                  )}
                                  {verifStatus !== 'Flagged' && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        verifyAttendanceShift(record.id, {
                                          verificationStatus: 'Flagged',
                                        })
                                      }
                                      className="px-2 py-0.5 rounded bg-surface-container hover:bg-[#FFDAD6] text-secondary hover:text-[#BA1A1A] text-[10px] font-bold cursor-pointer"
                                      title="Flag shift for HR review"
                                    >
                                      Flag
                                    </button>
                                  )}
                                  {isOnDuty && !isSelf && (
                                    <button
                                      type="button"
                                      onClick={() => handleForceClockOut(record)}
                                      className="px-2 py-0.5 rounded bg-[#FFDAD6] hover:bg-[#BA1A1A] text-[#BA1A1A] hover:text-white text-[10px] font-bold cursor-pointer"
                                      title="Force clock-out this shift"
                                    >
                                      Force Out
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
