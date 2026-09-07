import React, { useState, useMemo } from 'react';
import { useCRM } from '../context/CRMContext';

export const StaffAttendancePage: React.FC = () => {
  const { 
    attendanceRecords, 
    activeAttendanceSession, 
    openModal, 
    currentUser, 
    settings 
  } = useCRM();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMode, setSelectedMode] = useState<string>('all');
  const [selectedPunctuality, setSelectedPunctuality] = useState<string>('all');
  const [selectedGeo, setSelectedGeo] = useState<string>('all');

  // Filter attendance records
  const filteredRecords = useMemo(() => {
    return attendanceRecords.filter(record => {
      const name = record.staffName || record.userName || '';
      const role = record.roleTitle || record.userRole || '';
      const focus = record.dailyTasksFocus || record.shiftFocus || '';
      const summary = record.workSummary || '';
      const punct = record.punctualityStatus || record.punctuality;

      const matchesSearch = 
        name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        role.toLowerCase().includes(searchTerm.toLowerCase()) ||
        focus.toLowerCase().includes(searchTerm.toLowerCase()) ||
        summary.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesMode = selectedMode === 'all' || record.workMode === selectedMode;
      const matchesPunctuality = selectedPunctuality === 'all' || punct === selectedPunctuality;
      const matchesGeo = selectedGeo === 'all' || record.geoStatus === selectedGeo;

      return matchesSearch && matchesMode && matchesPunctuality && matchesGeo;
    });
  }, [attendanceRecords, searchTerm, selectedMode, selectedPunctuality, selectedGeo]);

  // Analytics KPIs
  const todayStr = new Date().toISOString().split('T')[0];
  const todayRecords = attendanceRecords.filter(r => r.date === todayStr);
  const activeNowCount = attendanceRecords.filter(r => !r.clockOutTime).length;

  const onSiteCount = attendanceRecords.filter(r => r.workMode === 'On-Site / Hub').length;
  const hubRatio = attendanceRecords.length > 0 
    ? Math.round((onSiteCount / attendanceRecords.length) * 100) 
    : 0;

  const onTimeCount = attendanceRecords.filter(r => (r.punctualityStatus || r.punctuality) === 'On-Time').length;
  const punctualityRate = attendanceRecords.length > 0
    ? Math.round((onTimeCount / attendanceRecords.length) * 100)
    : 100;

  const totalHoursWorked = attendanceRecords
    .reduce((acc, r) => acc + (r.totalHoursWorked || 0), 0)
    .toFixed(1);

  const officeRadius = settings.officeLocation?.radiusMeters ?? 400;

  // CSV Export
  const exportTimesheetCSV = () => {
    const headers = [
      'Date',
      'Staff Name',
      'Email',
      'Role',
      'Department',
      'Work Mode',
      'Location',
      'Geo Status',
      'Distance (Meters)',
      'Clock In',
      'Clock Out',
      'Total Hours',
      'Punctuality',
      'Daily Chores & Focus',
      'End of Day Output'
    ];

    const rows = filteredRecords.map(r => [
      r.date,
      `"${(r.staffName || r.userName || '').replace(/"/g, '""')}"`,
      r.staffEmail || r.userEmail || '',
      `"${(r.roleTitle || r.userRole || '').replace(/"/g, '""')}"`,
      r.department || 'Operations',
      r.workMode,
      `"${(r.locationName || '').replace(/"/g, '""')}"`,
      r.geoStatus,
      r.distanceFromOfficeMeters ?? '',
      r.clockInTime,
      r.clockOutTime || 'Active',
      r.totalHoursWorked ?? '',
      r.punctualityStatus || r.punctuality,
      `"${(r.dailyTasksFocus || r.shiftFocus || '').replace(/"/g, '""')}"`,
      `"${(r.workSummary || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
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
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[28px]">schedule</span>
            <h1 className="font-headline-lg text-2xl font-bold text-on-surface">Staff Attendance &amp; Work Hours</h1>
          </div>
          <p className="font-body-md text-xs text-secondary mt-1">
            Hybrid Work Tracking • Lagos Hub Geolocation Audits • Daily Office Chores &amp; Output Verification
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={exportTimesheetCSV}
            className="px-3.5 h-9 rounded-lg border border-outline-variant bg-surface hover:bg-surface-container text-xs font-bold text-secondary transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Download CSV for payroll audit"
          >
            <span className="material-symbols-outlined text-[16px]">download</span>
            <span>Export Timesheet CSV</span>
          </button>

          {activeAttendanceSession ? (
            <button
              onClick={() => openModal('clock-out')}
              className="px-4 h-9 rounded-lg bg-error text-white text-xs font-bold hover:bg-error/90 transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
              <span>Clock Out / End Shift</span>
            </button>
          ) : (
            <button
              onClick={() => openModal('clock-in')}
              className="px-4 h-9 rounded-lg bg-primary text-white text-xs font-bold hover:bg-primary/90 transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">timer</span>
              <span>Clock In for Work</span>
            </button>
          )}
        </div>
      </div>

      {/* 4 Bento KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter">
        {/* On-Duty Staff */}
        <div className="bg-surface-container-lowest p-stack-md border border-outline-variant rounded-lg shadow-xs">
          <div className="flex justify-between items-start mb-2">
            <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined">badge</span>
            </div>
            <span className="text-xs font-bold text-[#166534] bg-[#dcfce7] px-2 py-0.5 rounded">
              {todayRecords.length} shifts today
            </span>
          </div>
          <p className="font-body-sm text-xs text-secondary">Currently On-Duty</p>
          <h3 className="font-headline-lg text-2xl font-bold text-on-surface font-data-tabular">
            {activeNowCount} <span className="text-xs font-normal text-secondary">Active Now</span>
          </h3>
        </div>

        {/* Hub vs Remote Ratio */}
        <div className="bg-surface-container-lowest p-stack-md border border-outline-variant rounded-lg shadow-xs">
          <div className="flex justify-between items-start mb-2">
            <div className="w-10 h-10 rounded bg-secondary-container flex items-center justify-center text-primary">
              <span className="material-symbols-outlined">domain</span>
            </div>
            <span className="text-xs font-bold text-secondary bg-surface-container px-2 py-0.5 rounded">
              Hub Policy: {officeRadius}m
            </span>
          </div>
          <p className="font-body-sm text-xs text-secondary">On-Site Hub Ratio</p>
          <h3 className="font-headline-lg text-2xl font-bold text-on-surface font-data-tabular">
            {hubRatio}% <span className="text-xs font-normal text-secondary">({onSiteCount} Hub shifts)</span>
          </h3>
        </div>

        {/* Punctuality Rate */}
        <div className="bg-surface-container-lowest p-stack-md border border-outline-variant rounded-lg shadow-xs">
          <div className="flex justify-between items-start mb-2">
            <div className="w-10 h-10 rounded bg-surface-container flex items-center justify-center text-on-surface">
              <span className="material-symbols-outlined">alarm_on</span>
            </div>
            <span className="text-xs font-bold text-secondary bg-surface-container-high px-2 py-0.5 rounded">
              Target: 09:00 AM
            </span>
          </div>
          <p className="font-body-sm text-xs text-secondary">Punctuality Rate</p>
          <h3 className="font-headline-lg text-2xl font-bold text-on-surface font-data-tabular">
            {punctualityRate}% <span className="text-xs font-normal text-secondary">({onTimeCount} on-time)</span>
          </h3>
        </div>

        {/* Total Work Hours */}
        <div className="bg-surface-container-lowest p-stack-md border border-outline-variant rounded-lg shadow-xs">
          <div className="flex justify-between items-start mb-2">
            <div className="w-10 h-10 rounded bg-primary-container flex items-center justify-center text-on-primary">
              <span className="material-symbols-outlined">hourglass_top</span>
            </div>
            <span className="text-xs font-bold text-primary bg-secondary-container px-2 py-0.5 rounded font-data-tabular">
              Cumulative
            </span>
          </div>
          <p className="font-body-sm text-xs text-secondary">Total Hours Recorded</p>
          <h3 className="font-headline-lg text-2xl font-bold text-on-surface font-data-tabular">
            {totalHoursWorked} <span className="text-xs font-normal text-secondary">Hours</span>
          </h3>
        </div>
      </div>

      {/* Main Timesheets & Audits Container */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-lg overflow-hidden shadow-xs">
        {/* Controls & Filter Bar */}
        <div className="p-stack-md border-b border-outline-variant bg-surface-bright flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
          <div className="relative w-full md:w-80">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">
              search
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search staff, office chore, task..."
              className="w-full h-9 pl-9 pr-3 rounded bg-surface border border-outline-variant text-xs text-on-surface focus:border-primary outline-none"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
            {/* Work Mode Filter */}
            <select
              value={selectedMode}
              onChange={e => setSelectedMode(e.target.value)}
              className="h-9 px-2.5 bg-surface border border-outline-variant rounded text-xs text-on-surface outline-none cursor-pointer"
            >
              <option value="all">All Modes</option>
              <option value="On-Site / Hub">On-Site / Hub</option>
              <option value="Remote">Remote</option>
            </select>

            {/* Punctuality Filter */}
            <select
              value={selectedPunctuality}
              onChange={e => setSelectedPunctuality(e.target.value)}
              className="h-9 px-2.5 bg-surface border border-outline-variant rounded text-xs text-on-surface outline-none cursor-pointer"
            >
              <option value="all">All Punctuality</option>
              <option value="On-Time">On-Time</option>
              <option value="Late">Late Arrival</option>
            </select>

            {/* Geo Status Filter */}
            <select
              value={selectedGeo}
              onChange={e => setSelectedGeo(e.target.value)}
              className="h-9 px-2.5 bg-surface border border-outline-variant rounded text-xs text-on-surface outline-none cursor-pointer"
            >
              <option value="all">All Geo Statuses</option>
              <option value="Verified On-Site">Verified On-Site</option>
              <option value="Remote Verified">Remote Verified</option>
              <option value="Location Mismatch">Location Mismatch</option>
              <option value="GPS Unavailable">GPS Unavailable</option>
            </select>
          </div>
        </div>

        {/* Ledger Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px] text-xs">
            <thead>
              <tr className="border-b border-outline-variant bg-surface text-secondary font-label-md">
                <th className="px-stack-md py-3 font-semibold">Staff Member</th>
                <th className="px-stack-md py-3 font-semibold">Date &amp; Station</th>
                <th className="px-stack-md py-3 font-semibold">Location Audit</th>
                <th className="px-stack-md py-3 font-semibold">Clock In / Out</th>
                <th className="px-stack-md py-3 font-semibold">Hours</th>
                <th className="px-stack-md py-3 font-semibold">Punctuality</th>
                <th className="px-stack-md py-3 font-semibold min-w-[260px]">Office Chores &amp; Output Summary</th>
                <th className="px-stack-md py-3 text-right font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant text-on-surface font-body-md">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-secondary">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <span className="material-symbols-outlined text-[36px] text-outline">schedule</span>
                      <p className="font-bold text-sm text-on-surface">No Attendance Records Found</p>
                      <p className="text-xs max-w-sm">
                        No clock-in entries match your criteria. Employees can use the &ldquo;Clock In&rdquo; button above to start tracking work hours and office tasks.
                      </p>
                      <button
                        onClick={() => openModal('clock-in')}
                        className="mt-2 px-3.5 h-8 rounded-lg bg-primary text-white text-xs font-bold hover:bg-primary/90 flex items-center gap-1 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[16px]">timer</span>
                        <span>Clock In Now</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record, index) => {
                  const isSelf = (record.staffId || record.userId) === currentUser?.id || (record.staffEmail || record.userEmail) === currentUser?.email;
                  const isOnDuty = !record.clockOutTime;
                  const staffDisplayName = record.staffName || record.userName || 'Staff Member';
                  const staffRole = record.roleTitle || record.userRole;
                  const punctuality = record.punctualityStatus || record.punctuality;
                  const tasksFocus = record.dailyTasksFocus || record.shiftFocus;

                  return (
                    <tr
                      key={record.id}
                      className={`hover:bg-surface-bright transition-colors ${
                        index % 2 === 1 ? 'bg-surface' : ''
                      } ${isOnDuty ? 'bg-primary/5' : ''}`}
                    >
                      {/* Staff */}
                      <td className="px-stack-md py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-xs">
                            {staffDisplayName.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
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
                          <span>{record.workMode}</span>
                        </p>
                      </td>

                      {/* Location Audit */}
                      <td className="px-stack-md py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold ${
                          record.geoStatus === 'Verified On-Site' || record.geoStatus === 'Remote Verified'
                            ? 'bg-[#dcfce7] text-[#166534]'
                            : record.geoStatus === 'Location Mismatch'
                            ? 'bg-[#fee2e2] text-[#991b1b]'
                            : 'bg-surface-container text-secondary'
                        }`}>
                          <span className="material-symbols-outlined text-[12px]">
                            {record.geoStatus === 'Verified On-Site' || record.geoStatus === 'Remote Verified'
                              ? 'verified'
                              : record.geoStatus === 'Location Mismatch'
                              ? 'warning'
                              : 'help_outline'}
                          </span>
                          <span>{record.geoStatus}</span>
                        </span>
                        {record.distanceFromOfficeMeters !== undefined && (
                          <p className="text-[10px] text-secondary font-data-tabular mt-0.5">
                            {record.distanceFromOfficeMeters}m from Lagos Hub
                          </p>
                        )}
                      </td>

                      {/* Clock In / Out */}
                      <td className="px-stack-md py-3 font-data-tabular">
                        <p className="font-semibold text-xs text-on-surface">In: {record.clockInTime}</p>
                        <p className="text-[11px] text-secondary">
                          Out: {record.clockOutTime || <span className="text-primary font-bold">In Progress...</span>}
                        </p>
                      </td>

                      {/* Total Hours */}
                      <td className="px-stack-md py-3 font-data-tabular font-bold text-xs text-on-surface">
                        {record.totalHoursWorked ? `${record.totalHoursWorked}h` : '—'}
                      </td>

                      {/* Punctuality */}
                      <td className="px-stack-md py-3">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          punctuality === 'On-Time'
                            ? 'bg-[#dcfce7] text-[#166534]'
                            : 'bg-[#fee2e2] text-[#991b1b]'
                        }`}>
                          {punctuality}
                        </span>
                      </td>

                      {/* Office Chores & Output */}
                      <td className="px-stack-md py-3">
                        <div className="space-y-1 max-w-sm">
                          {tasksFocus && (
                            <p className="text-[11px] text-on-surface">
                              <span className="font-semibold text-secondary">Focus:</span> {tasksFocus}
                            </p>
                          )}
                          {record.workSummary && (
                            <p className="text-[11px] text-[#166534] bg-[#f0fdf4] p-1.5 rounded border border-[#bbf7d0]">
                              <span className="font-semibold">EOD Output:</span> {record.workSummary}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-stack-md py-3 text-right">
                        {isOnDuty ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#dcfce7] text-[#166534]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#16a34a] animate-ping" />
                            <span>On-Duty</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-surface-container text-secondary">
                            Completed
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
