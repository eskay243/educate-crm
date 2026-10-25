import React from 'react';
import { Link } from 'react-router-dom';
import { useCRM, formatNaira, formatNairaCompact } from '../context/CRMContext';

export const OperationalDashboardPage: React.FC = () => {
  const { 
    currentUser,
    expenses, 
    tickets, 
    students, 
    invoices, 
    attendanceRecords, 
    activityLogs, 
    payoutRequests,
    openModal,
    setIsChatPopoutOpen,
    unreadChatCount,
  } = useCRM();

  // 1. Pending Approvals & Action Items
  const pendingExpenses = expenses.filter(e => 
    e.status?.toLowerCase() === 'pending' || e.status?.toLowerCase() === 'submitted'
  );
  const pendingExpensesTotal = pendingExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  const pendingPayouts = payoutRequests.filter(p => p.status === 'Pending');
  const pendingPayoutsTotal = pendingPayouts.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  const pendingInvoices = invoices.filter(inv => 
    inv.status === 'Pending' || inv.status === 'Overdue'
  );

  const openTickets = tickets.filter(t => t.status === 'open');
  const urgentTickets = openTickets.filter(t => t.priority === 'urgent' || t.priority === 'high');

  // 2. Today's Attendance Pulse
  const todayStr = new Date().toISOString().split('T')[0];
  const todayClockIns = attendanceRecords.filter(r => r.date === todayStr);

  // 3. Recent Students
  const recentStudents = students.slice(0, 5);

  const formattedDate = new Date().toLocaleDateString('en-NG', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Header Banner & Operations Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-outline-variant/60">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Operational Pulse Active
            </span>
            <span className="text-xs text-secondary">{formattedDate}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight">
            Operational Command Center
          </h1>
          <p className="text-xs sm:text-sm text-secondary mt-0.5">
            Welcome back, {currentUser?.name || 'Administrator'}. Real-time daily operations, pending authorizations, institutional triage, and active tasks.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Link
            to="/reports"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-surface border border-outline-variant text-on-surface hover:bg-surface-container-high transition-colors shadow-xs"
            title="Switch to Financial and Cohort Performance Analytics"
          >
            <span className="material-symbols-outlined text-[18px] text-primary">monitoring</span>
            <span>View Executive Analytics</span>
          </Link>
          <button
            type="button"
            onClick={() => setIsChatPopoutOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg bg-primary text-white hover:bg-primary-hover transition-colors shadow-xs cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">chat</span>
            <span>Team Chat</span>
            {unreadChatCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-red-500 text-white text-[10px] font-extrabold">
                {unreadChatCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* 2. Urgent Attention Strip: Pending Actions & Authorizations */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pending Expense Requisitions */}
        <Link
          to="/expenses"
          className="group p-4 rounded-xl bg-surface border border-outline-variant hover:border-amber-500/50 hover:shadow-md transition-all duration-200"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-secondary">Expense Requisitions</span>
            <span className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-[20px]">payments</span>
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-on-surface font-data-tabular">
              {pendingExpenses.length}
            </span>
            <span className="text-xs font-bold text-amber-600 bg-amber-500/10 px-1.5 py-0.5 rounded">
              Awaiting Approval
            </span>
          </div>
          <p className="text-[11px] text-secondary mt-1 truncate">
            {pendingExpensesTotal > 0 ? `${formatNaira(pendingExpensesTotal)} total queued` : 'All expenses cleared'}
          </p>
        </Link>

        {/* Pending Mentor Payouts */}
        <Link
          to="/mentors"
          className="group p-4 rounded-xl bg-surface border border-outline-variant hover:border-purple-500/50 hover:shadow-md transition-all duration-200"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-secondary">Faculty Payouts</span>
            <span className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-[20px]">account_balance_wallet</span>
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-on-surface font-data-tabular">
              {pendingPayouts.length}
            </span>
            <span className="text-xs font-bold text-purple-600 bg-purple-500/10 px-1.5 py-0.5 rounded">
              Pending Payouts
            </span>
          </div>
          <p className="text-[11px] text-secondary mt-1 truncate">
            {pendingPayoutsTotal > 0 ? `${formatNaira(pendingPayoutsTotal)} requested` : 'No outstanding claims'}
          </p>
        </Link>

        {/* Unpaid / Pending Tuition Invoices */}
        <Link
          to="/students"
          className="group p-4 rounded-xl bg-surface border border-outline-variant hover:border-blue-500/50 hover:shadow-md transition-all duration-200"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-secondary">Pending Invoices</span>
            <span className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-[20px]">receipt_long</span>
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-on-surface font-data-tabular">
              {pendingInvoices.length}
            </span>
            <span className="text-xs font-bold text-blue-600 bg-blue-500/10 px-1.5 py-0.5 rounded">
              Awaiting Clearance
            </span>
          </div>
          <p className="text-[11px] text-secondary mt-1 truncate">
            Tuition transfers &amp; payment proofs
          </p>
        </Link>

        {/* Support Tickets Needing Resolution */}
        <Link
          to="/tickets"
          className="group p-4 rounded-xl bg-surface border border-outline-variant hover:border-red-500/50 hover:shadow-md transition-all duration-200"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-secondary">Open Support Tickets</span>
            <span className="w-8 h-8 rounded-lg bg-red-500/10 text-red-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-[20px]">confirmation_number</span>
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-on-surface font-data-tabular">
              {openTickets.length}
            </span>
            {urgentTickets.length > 0 && (
              <span className="text-xs font-bold text-red-600 bg-red-500/10 px-1.5 py-0.5 rounded animate-pulse">
                {urgentTickets.length} Urgent
              </span>
            )}
          </div>
          <p className="text-[11px] text-secondary mt-1 truncate">
            {openTickets.length === 0 ? 'All tickets resolved & archived' : 'Click to review active queue'}
          </p>
        </Link>
      </div>

      {/* 3. 1-Click Operations Launchpad */}
      <div className="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant shadow-xs">
        <h3 className="text-xs font-bold uppercase tracking-wider text-secondary mb-3 flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[16px] text-primary">bolt</span>
          <span>1-Click Institutional Shortcuts</span>
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            type="button"
            onClick={() => openModal('create-hub')}
            className="flex items-center gap-2 p-3 rounded-lg border border-outline-variant/80 hover:border-primary hover:bg-primary/5 transition-colors text-left cursor-pointer group"
          >
            <span className="material-symbols-outlined text-[20px] text-primary group-hover:scale-110 transition-transform">
              add_circle
            </span>
            <div className="min-w-0">
              <p className="text-xs font-bold text-on-surface truncate">New Record</p>
              <p className="text-[10px] text-secondary truncate">Hub Creator</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => openModal('log-expense')}
            className="flex items-center gap-2 p-3 rounded-lg border border-outline-variant/80 hover:border-amber-500 hover:bg-amber-500/5 transition-colors text-left cursor-pointer group"
          >
            <span className="material-symbols-outlined text-[20px] text-amber-600 group-hover:scale-110 transition-transform">
              receipt
            </span>
            <div className="min-w-0">
              <p className="text-xs font-bold text-on-surface truncate">Log Expense</p>
              <p className="text-[10px] text-secondary truncate">OpEx Requisition</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => openModal('add-lead')}
            className="flex items-center gap-2 p-3 rounded-lg border border-outline-variant/80 hover:border-blue-500 hover:bg-blue-500/5 transition-colors text-left cursor-pointer group"
          >
            <span className="material-symbols-outlined text-[20px] text-blue-600 group-hover:scale-110 transition-transform">
              person_add
            </span>
            <div className="min-w-0">
              <p className="text-xs font-bold text-on-surface truncate">Add Lead</p>
              <p className="text-[10px] text-secondary truncate">Admissions Intake</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => openModal('clock-in')}
            className="flex items-center gap-2 p-3 rounded-lg border border-outline-variant/80 hover:border-emerald-500 hover:bg-emerald-500/5 transition-colors text-left cursor-pointer group"
          >
            <span className="material-symbols-outlined text-[20px] text-emerald-600 group-hover:scale-110 transition-transform">
              timer
            </span>
            <div className="min-w-0">
              <p className="text-xs font-bold text-on-surface truncate">Clock In / Out</p>
              <p className="text-[10px] text-secondary truncate">Duty Log</p>
            </div>
          </button>
        </div>
      </div>

      {/* 4. Dual Operational Grid: Today's On-Duty Staff & Admissions Intake */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* On-Duty Attendance Today */}
        <div className="p-4 rounded-xl bg-surface border border-outline-variant shadow-xs flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-outline-variant/60 mb-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] text-primary">badge</span>
              <h3 className="text-sm font-bold text-on-surface">Today's Staff On-Duty</h3>
            </div>
            <Link
              to="/attendance"
              className="text-xs font-semibold text-primary hover:underline flex items-center gap-0.5"
            >
              <span>Attendance Ledger</span>
              <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </Link>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 max-h-64">
            {todayClockIns.length === 0 ? (
              <div className="p-6 text-center text-secondary">
                <span className="material-symbols-outlined text-3xl mb-1 text-secondary/40">schedule</span>
                <p className="text-xs font-semibold">No clock-ins recorded today</p>
                <p className="text-[11px] text-secondary/70">Staff can clock in using geolocation or office verification</p>
              </div>
            ) : (
              todayClockIns.map(rec => (
                <div 
                  key={rec.id}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-surface-container-low border border-outline-variant/40 text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0">
                      {rec.staffName ? rec.staffName.charAt(0).toUpperCase() : 'S'}
                    </div>
                    <div className="truncate">
                      <p className="font-bold text-on-surface truncate">{rec.staffName || 'Staff Member'}</p>
                      <p className="text-[10px] text-secondary truncate">{rec.locationName || rec.workMode}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600">
                      {rec.clockInTime || 'On Duty'}
                    </span>
                    {rec.geoStatus === 'Verified On-Site' && (
                      <p className="text-[9px] text-emerald-600 mt-0.5">Geo-Verified</p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Admissions Pipeline Activity */}
        <div className="p-4 rounded-xl bg-surface border border-outline-variant shadow-xs flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-outline-variant/60 mb-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] text-primary">school</span>
              <h3 className="text-sm font-bold text-on-surface">Recent Student Enrollments</h3>
            </div>
            <Link
              to="/students"
              className="text-xs font-semibold text-primary hover:underline flex items-center gap-0.5"
            >
              <span>View Directory</span>
              <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </Link>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 max-h-64">
            {recentStudents.length === 0 ? (
              <div className="p-6 text-center text-secondary">
                <span className="material-symbols-outlined text-3xl mb-1 text-secondary/40">groups</span>
                <p className="text-xs font-semibold">No students registered yet</p>
              </div>
            ) : (
              recentStudents.map(student => (
                <div 
                  key={student.id}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-surface-container-low border border-outline-variant/40 text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-600 font-bold flex items-center justify-center shrink-0">
                      {student.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="truncate">
                      <p className="font-bold text-on-surface truncate">{student.name}</p>
                      <p className="text-[10px] text-secondary truncate">{student.program || 'Tech Scholar'}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary">
                      {student.cohort || 'Active'}
                    </span>
                    <p className="text-[10px] font-semibold text-secondary mt-0.5 font-data-tabular">
                      {formatNairaCompact((student.totalFees || 0) - (student.outstandingBalance || 0))} paid
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 5. Live Institutional Activity Audit Trail */}
      <div className="p-4 rounded-xl bg-surface border border-outline-variant shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-outline-variant/60 mb-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-secondary">history</span>
            <h3 className="text-sm font-bold text-on-surface">Recent Institutional Activity</h3>
          </div>
          <span className="text-[11px] text-secondary">Real-time audit log</span>
        </div>

        <div className="space-y-2 max-h-72 overflow-y-auto">
          {activityLogs.length === 0 ? (
            <p className="text-xs text-secondary text-center py-4">No recent activity logs</p>
          ) : (
            activityLogs.slice(0, 8).map(log => (
              <div 
                key={log.id} 
                className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-surface-container-low transition-colors text-xs"
              >
                <div className="w-7 h-7 rounded-full bg-surface-container-high text-primary flex items-center justify-center shrink-0 mt-0.5">
                  <span className="material-symbols-outlined text-[15px]">event_note</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-on-surface font-medium leading-snug">
                    <span className="font-bold">{log.user || 'System'}</span>{' '}
                    <span>{log.title}</span>{' '}
                    <span className="text-secondary">{log.description || ''}</span>
                  </p>
                  <p className="text-[10px] text-secondary/80 mt-0.5">
                    {new Date(log.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
