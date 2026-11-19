import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCRM, formatNaira, formatNairaCompact } from '../context/CRMContext';
import { PageHeader, SemanticMetricCard, ActionTile } from '../components/common/KineticUI';

export const OperationalDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { 
    currentUser,
    expenses, 
    tickets, 
    students, 
    invoices, 
    attendanceRecords, 
    activityLogs, 
    payoutRequests,
    staffUsers,
    mentors,
    courses,
    cohorts,
    lmsModules,
    openModal,
    setIsChatPopoutOpen,
    unreadChatCount,
  } = useCRM();

  const isProgramOfficer = currentUser?.role === 'program_officer';

  // Audit Log Filtering & Pagination State
  const [auditUserFilter, setAuditUserFilter] = useState<string>('all');
  const [auditCategoryFilter, setAuditCategoryFilter] = useState<string>('all');
  const [auditSearchQuery, setAuditSearchQuery] = useState<string>('');
  const [auditVisibleCount, setAuditVisibleCount] = useState<number>(10);

  // Safe Timestamp Formatter to guarantee zero "Invalid Date" output
  const formatAuditTimestamp = (ts: string) => {
    if (!ts) return 'Recent';
    if (ts.toLowerCase() === 'just now') return 'Just now';
    const d = new Date(ts);
    if (isNaN(d.getTime())) return ts;
    return d.toLocaleString('en-NG', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  // Compile list of personnel for audit filtering
  const availableAuditUsers = useMemo(() => {
    const userSet = new Set<string>();
    activityLogs.forEach(l => {
      if (l.user) userSet.add(l.user.trim());
    });
    staffUsers.forEach(u => {
      if (u.name) userSet.add(u.name.trim());
    });
    mentors.forEach(m => {
      if (m.name) userSet.add(m.name.trim());
    });
    return Array.from(userSet).sort();
  }, [activityLogs, staffUsers, mentors]);

  // Filtered Activity Logs
  const filteredActivityLogs = useMemo(() => {
    return activityLogs.filter(log => {
      // User filter
      if (auditUserFilter !== 'all') {
        const logUser = (log.user || '').toLowerCase().trim();
        const targetUser = auditUserFilter.toLowerCase().trim();
        if (!logUser.includes(targetUser) && !targetUser.includes(logUser)) return false;
      }
      // Category filter
      if (auditCategoryFilter !== 'all') {
        if (log.type !== auditCategoryFilter) return false;
      }
      // Search query
      if (auditSearchQuery.trim()) {
        const q = auditSearchQuery.toLowerCase().trim();
        const match =
          (log.title || '').toLowerCase().includes(q) ||
          (log.description || '').toLowerCase().includes(q) ||
          (log.user || '').toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [activityLogs, auditUserFilter, auditCategoryFilter, auditSearchQuery]);

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

  const pendingPOTopicsCount = useMemo(() => {
    return (lmsModules || []).reduce((acc, mod) => {
      return acc + (mod.lessons || []).filter(
        l => l.approvalStatus === 'Taught (Pending PO Approval)' || (l.completedByMentor && !l.approvedByProgramOfficer)
      ).length;
    }, 0);
  }, [lmsModules]);
  const activeCohortsCount = cohorts.filter(c => c.status === 'In Progress' || c.status === 'Upcoming').length;
  const activeMentorsCount = mentors.filter(m => m.isActive !== false && m.status !== 'Deactivated').length;

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
      <PageHeader
        title={isProgramOfficer ? 'Program Officer Command Center' : 'Operational Command Center'}
        subtitle={
          isProgramOfficer
            ? `Welcome back, ${currentUser?.name || 'Program Officer'}. Curriculum governance, syllabus topic sign-offs, faculty coordination, and cohort operations.`
            : `Welcome back, ${currentUser?.name || 'Administrator'}. Real-time daily operations, pending authorizations, institutional triage, and active tasks.`
        }
        badgeText={isProgramOfficer ? 'Academic Operations Live' : 'Operational Pulse Active'}
        badgeIntent="emerald"
        badgePulse
        metaText={formattedDate}
        actions={
          <>
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
          </>
        }
      />

      {/* 2. Urgent Attention Strip: Pending Actions & Authorizations */}
      {isProgramOfficer ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <SemanticMetricCard
            to="/mentors/course-outlines"
            label="Topic Approvals"
            value={pendingPOTopicsCount}
            icon="fact_check"
            intent="amber"
            badge={pendingPOTopicsCount > 0 ? 'Awaiting Sign-off' : 'All Cleared'}
            badgePulse={pendingPOTopicsCount > 0}
            subtitle={pendingPOTopicsCount > 0 ? 'Syllabus lessons taught & pending review' : 'All taught topics approved'}
          />
          <SemanticMetricCard
            to="/courses"
            label="Programs & Cohorts"
            value={activeCohortsCount}
            icon="menu_book"
            intent="blue"
            badge={`${courses.length} Tracks`}
            subtitle={`${students.length} enrolled scholars across cohorts`}
          />
          <SemanticMetricCard
            to="/mentors"
            label="Faculty Mentors"
            value={activeMentorsCount}
            icon="groups"
            intent="sky"
            badge="Active Roster"
            subtitle="Timetables, office hours & grading"
          />
          <SemanticMetricCard
            to="/tickets"
            label="Open Support Tickets"
            value={openTickets.length}
            icon="confirmation_number"
            intent="red"
            badge={urgentTickets.length > 0 ? `${urgentTickets.length} Urgent` : undefined}
            badgePulse={urgentTickets.length > 0}
            subtitle={openTickets.length === 0 ? 'All tickets resolved & archived' : 'Click to review active queue'}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <SemanticMetricCard
            to="/expenses"
            label="Expense Requisitions"
            value={pendingExpenses.length}
            icon="payments"
            intent="amber"
            badge="Awaiting Approval"
            subtitle={pendingExpensesTotal > 0 ? `${formatNaira(pendingExpensesTotal)} total queued` : 'All expenses cleared'}
          />
          <SemanticMetricCard
            to="/mentors"
            label="Faculty Payouts"
            value={pendingPayouts.length}
            icon="account_balance_wallet"
            intent="sky"
            badge="Pending Payouts"
            subtitle={pendingPayoutsTotal > 0 ? `${formatNaira(pendingPayoutsTotal)} requested` : 'No outstanding claims'}
          />
          <SemanticMetricCard
            to="/students"
            label="Pending Invoices"
            value={pendingInvoices.length}
            icon="receipt_long"
            intent="blue"
            badge="Awaiting Clearance"
            subtitle="Tuition transfers & payment proofs"
          />
          <SemanticMetricCard
            to="/tickets"
            label="Open Support Tickets"
            value={openTickets.length}
            icon="confirmation_number"
            intent="red"
            badge={urgentTickets.length > 0 ? `${urgentTickets.length} Urgent` : undefined}
            badgePulse={urgentTickets.length > 0}
            subtitle={openTickets.length === 0 ? 'All tickets resolved & archived' : 'Click to review active queue'}
          />
        </div>
      )}

      {/* 3. 1-Click Operations Launchpad */}
      <div className="p-4 rounded-xl glass-card">
        <h3 className="text-xs font-bold uppercase tracking-wider text-secondary mb-3 flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[16px] text-primary">bolt</span>
          <span>{isProgramOfficer ? '1-Click Academic Shortcuts' : '1-Click Institutional Shortcuts'}</span>
        </h3>
        {isProgramOfficer ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <ActionTile
              title="Course Outlines"
              subtitle="Topic Approvals"
              icon="account_tree"
              intent="blue"
              onClick={() => navigate('/mentors/course-outlines')}
            />
            <ActionTile
              title="Programs & Cohorts"
              subtitle="Tracks & Schedules"
              icon="menu_book"
              intent="amber"
              onClick={() => navigate('/courses')}
            />
            <ActionTile
              title="Grading Inbox"
              subtitle="Student Submissions"
              icon="fact_check"
              intent="sky"
              onClick={() => navigate('/mentors/grading')}
            />
            <ActionTile
              title="Clock In / Out"
              subtitle="Duty Log"
              icon="timer"
              intent="emerald"
              onClick={() => openModal('clock-in')}
            />
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <ActionTile
              title="New Record"
              subtitle="Hub Creator"
              icon="add_circle"
              intent="blue"
              onClick={() => openModal('create-hub')}
            />
            <ActionTile
              title="Log Expense"
              subtitle="OpEx Requisition"
              icon="receipt"
              intent="amber"
              onClick={() => openModal('log-expense')}
            />
            <ActionTile
              title="Add Lead"
              subtitle="Admissions Intake"
              icon="person_add"
              intent="sky"
              onClick={() => openModal('add-lead')}
            />
            <ActionTile
              title="Clock In / Out"
              subtitle="Duty Log"
              icon="timer"
              intent="emerald"
              onClick={() => openModal('clock-in')}
            />
          </div>
        )}
      </div>

      {/* 4. Dual Operational Grid: Today's On-Duty Staff & Admissions Intake */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* On-Duty Attendance Today */}
        <div className="p-4 rounded-xl glass-card flex flex-col">
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
        <div className="p-4 rounded-xl glass-card flex flex-col">
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

      {/* 5. Live Institutional Activity Audit Trail & Multi-User Governance */}
      <div className="p-4 sm:p-5 rounded-xl glass-card space-y-4">
        {/* Header & Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-outline-variant/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[20px]">history_edu</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-on-surface">Institutional Activity &amp; Audit Trail</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary-container text-on-primary-container font-data-tabular">
                  {filteredActivityLogs.length} {filteredActivityLogs.length === 1 ? 'event' : 'events'}
                </span>
              </div>
              <p className="text-[11px] text-secondary">
                Real-time operational audit log with personnel activity tracking &amp; governance timestamps
              </p>
            </div>
          </div>

          {/* Filtering Controls */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Filter by Personnel (Super Admin User Audit) */}
            <div className="flex items-center gap-1.5 bg-surface-container-low px-2 py-1 rounded-lg border border-outline-variant text-xs">
              <span className="material-symbols-outlined text-[16px] text-primary">person_search</span>
              <select
                aria-label="Filter audit log by personnel"
                value={auditUserFilter}
                onChange={(e) => {
                  setAuditUserFilter(e.target.value);
                  setAuditVisibleCount(10);
                }}
                className="bg-transparent text-xs font-semibold text-on-surface focus:outline-none cursor-pointer max-w-[150px] truncate"
              >
                <option value="all">All Personnel ({activityLogs.length})</option>
                {availableAuditUsers.map((user) => (
                  <option key={user} value={user}>
                    {user}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter by Category */}
            <div className="flex items-center gap-1.5 bg-surface-container-low px-2 py-1 rounded-lg border border-outline-variant text-xs">
              <span className="material-symbols-outlined text-[16px] text-secondary">tune</span>
              <select
                aria-label="Filter audit log by category"
                value={auditCategoryFilter}
                onChange={(e) => {
                  setAuditCategoryFilter(e.target.value);
                  setAuditVisibleCount(10);
                }}
                className="bg-transparent text-xs font-semibold text-on-surface focus:outline-none cursor-pointer"
              >
                <option value="all">All Modules</option>
                <option value="finance">Finance &amp; Tuition</option>
                <option value="mentor">Mentorship &amp; Grading</option>
                <option value="student">Student Operations</option>
                <option value="attendance">Staff Attendance</option>
                <option value="system">System &amp; Administration</option>
              </select>
            </div>

            {/* Search Input */}
            <div className="relative flex-1 sm:w-44">
              <span className="material-symbols-outlined absolute left-2 top-1.5 text-[15px] text-secondary">
                search
              </span>
              <input
                type="text"
                placeholder="Search audit..."
                value={auditSearchQuery}
                onChange={(e) => {
                  setAuditSearchQuery(e.target.value);
                  setAuditVisibleCount(10);
                }}
                className="w-full pl-7 pr-6 py-1 bg-surface-container-low border border-outline-variant rounded-lg text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
              />
              {auditSearchQuery && (
                <button
                  type="button"
                  onClick={() => setAuditSearchQuery('')}
                  className="absolute right-1.5 top-1.5 text-secondary hover:text-on-surface"
                >
                  <span className="material-symbols-outlined text-[14px]">close</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Audit Trail List */}
        <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
          {filteredActivityLogs.length === 0 ? (
            <div className="text-center py-8 space-y-2 text-secondary">
              <span className="material-symbols-outlined text-[32px] text-outline">history_toggle_off</span>
              <p className="text-xs font-medium">No activity records match the selected filters.</p>
              {(auditUserFilter !== 'all' || auditCategoryFilter !== 'all' || auditSearchQuery) && (
                <button
                  type="button"
                  onClick={() => {
                    setAuditUserFilter('all');
                    setAuditCategoryFilter('all');
                    setAuditSearchQuery('');
                  }}
                  className="text-xs font-bold text-primary hover:underline cursor-pointer"
                >
                  Clear all filters
                </button>
              )}
            </div>
          ) : (
            filteredActivityLogs.slice(0, auditVisibleCount).map((log) => {
              const categoryBadge = (() => {
                switch (log.type) {
                  case 'finance':
                    return { label: 'Finance', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
                  case 'mentor':
                    return { label: 'Faculty', bg: 'bg-blue-50 text-blue-700 border-blue-200' };
                  case 'student':
                    return { label: 'Scholar', bg: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
                  case 'attendance':
                    return { label: 'Attendance', bg: 'bg-amber-50 text-amber-700 border-amber-200' };
                  default:
                    return { label: 'System', bg: 'bg-purple-50 text-purple-700 border-purple-200' };
                }
              })();

              const actorInitials = (log.user || 'System')
                .split(' ')
                .map((n) => n[0])
                .slice(0, 2)
                .join('')
                .toUpperCase();

              return (
                <div 
                  key={log.id} 
                  className="flex items-start gap-3 p-3 rounded-xl hover:bg-surface-container-low transition-colors text-xs border border-outline-variant/40 bg-surface-container-lowest/50"
                >
                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5 border border-primary/20">
                    {actorInitials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center justify-between gap-1 mb-0.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="font-bold text-on-surface truncate">{log.user || 'System'}</span>
                        <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold border uppercase tracking-wider ${categoryBadge.bg}`}>
                          {categoryBadge.label}
                        </span>
                      </div>
                      <span className="text-[10px] text-secondary font-data-tabular shrink-0">
                        {formatAuditTimestamp(log.timestamp)}
                      </span>
                    </div>
                    <p className="text-on-surface font-semibold leading-snug">
                      {log.title}
                    </p>
                    {log.description && (
                      <p className="text-secondary text-[11px] leading-relaxed mt-0.5 break-words">
                        {log.description}
                      </p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Load More Footer */}
        {filteredActivityLogs.length > auditVisibleCount && (
          <div className="pt-2 border-t border-outline-variant/60 flex items-center justify-between text-xs text-secondary">
            <span>
              Showing {Math.min(auditVisibleCount, filteredActivityLogs.length)} of {filteredActivityLogs.length} audit entries
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setAuditVisibleCount(prev => prev + 15)}
                className="px-3 py-1 rounded-lg bg-surface-container hover:bg-surface-container-high text-primary font-bold text-xs transition-colors cursor-pointer"
              >
                + Show More
              </button>
              <button
                type="button"
                onClick={() => setAuditVisibleCount(filteredActivityLogs.length)}
                className="px-3 py-1 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary font-bold text-xs transition-colors cursor-pointer"
              >
                Show All ({filteredActivityLogs.length})
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
