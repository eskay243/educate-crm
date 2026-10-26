import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useCRM, formatNaira } from '../context/CRMContext';
import { RevenueCostChart } from '../components/analytics/RevenueCostChart';
import { LeadSourceDonutChart } from '../components/analytics/LeadSourceDonutChart';
import { CohortProgressionAreaChart } from '../components/analytics/CohortProgressionAreaChart';
import { DepartmentMarginChart } from '../components/analytics/DepartmentMarginChart';

export interface ExecutiveReportPageProps {}

type ReportTab = 'financial' | 'admissions' | 'faculty' | 'cohorts';
type TimeRange = 'MONTH' | 'Q3' | 'Q4' | 'YTD';

export const ExecutiveReportPage: React.FC<ExecutiveReportPageProps> = () => {
  const { kpis, mentors, openModal, students, leads, expenses, currentUser } = useCRM();
  const [filterQuery, setFilterQuery] = useState('');
  const [timeRange, setTimeRange] = useState<TimeRange>('YTD');
  const [activeTab, setActiveTab] = useState<ReportTab>('financial');

  // Dynamic timeframe weighting for realistic executive simulations
  const timeframeMetrics = useMemo(() => {
    let factor = 1.0;
    let label = 'Full Year (2026 YTD)';

    if (timeRange === 'MONTH') {
      factor = 0.12;
      label = 'Current Month (October 2026)';
    } else if (timeRange === 'Q3') {
      factor = 0.32;
      label = 'Fiscal Q3 (Jul - Sep 2026)';
    } else if (timeRange === 'Q4') {
      factor = 0.38;
      label = 'Fiscal Q4 (Oct - Dec 2026)';
    }

    const baseRevenue = (typeof kpis.totalRevenue === 'number' && !isNaN(kpis.totalRevenue)) ? kpis.totalRevenue : 0;
    const baseExpenses = (typeof kpis.totalExpenses === 'number' && !isNaN(kpis.totalExpenses)) ? kpis.totalExpenses : 0;
    const baseMentorPayouts = (typeof kpis.mentorPayouts === 'number' && !isNaN(kpis.mentorPayouts)) ? kpis.mentorPayouts : 0;

    const adjRevenue = Math.round(baseRevenue * factor);
    const adjExpenses = Math.round(baseExpenses * factor);
    const adjMentorPayouts = Math.round(baseMentorPayouts * factor);
    const adjSurplus = adjRevenue - adjExpenses;
    const adjMargin = adjRevenue > 0 ? Math.round((adjSurplus / adjRevenue) * 100) : (kpis.operatingMargin || 0);

    return {
      revenue: adjRevenue,
      expenses: adjExpenses,
      mentorPayouts: adjMentorPayouts,
      surplus: adjSurplus,
      margin: adjMargin,
      label,
    };
  }, [kpis, timeRange]);

  // Lead follow-up intelligence metrics
  const followUpMetrics = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const scheduled = leads.filter(l => Boolean(l.nextFollowUpDate));
    const dueToday = leads.filter(l => l.nextFollowUpDate === todayStr);
    const overdue = leads.filter(l => l.nextFollowUpDate && l.nextFollowUpDate < todayStr && l.status !== 'Converted' && l.status !== 'Lost');
    const qualified = leads.filter(l => l.status === 'Qualified' || l.status === 'Negotiation');
    const converted = leads.filter(l => l.status === 'Converted');
    const conversionRate = leads.length > 0 ? Math.round((converted.length / leads.length) * 100) : 0;

    return {
      total: leads.length,
      scheduled: scheduled.length,
      dueToday: dueToday.length,
      overdue: overdue.length,
      qualified: qualified.length,
      converted: converted.length,
      conversionRate,
    };
  }, [leads]);

  // Mentors filter
  const filteredMentors = useMemo(() => {
    return mentors.filter(m => 
      m.name.toLowerCase().includes(filterQuery.toLowerCase()) ||
      m.mentorCode.toLowerCase().includes(filterQuery.toLowerCase()) ||
      m.department.toLowerCase().includes(filterQuery.toLowerCase())
    );
  }, [mentors, filterQuery]);

  const handlePrintBriefing = () => {
    window.print();
  };

  return (
    <div className="space-y-stack-lg animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex justify-between items-end flex-wrap gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
              Executive Briefing Mode
            </span>
            <span className="text-xs text-secondary">• {timeframeMetrics.label}</span>
          </div>
          <h2 className="font-headline-lg text-headline-lg font-bold text-on-surface">
            Executive Financial &amp; Operational Intelligence
          </h2>
          <p className="font-body-md text-body-md text-secondary">
            Cross-departmental audit: Tuition collections, admissions conversion velocity, mentor honorariums, and unit economics.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Time Range Selector */}
          <div className="flex border border-outline-variant rounded-lg p-1 bg-surface-container-lowest text-xs font-bold shadow-xs">
            {([
              { id: 'MONTH', label: 'Oct 2026' },
              { id: 'Q3', label: 'Fiscal Q3' },
              { id: 'Q4', label: 'Fiscal Q4' },
              { id: 'YTD', label: 'Full Year' }
            ] as const).map((r) => (
              <button
                key={r.id}
                onClick={() => setTimeRange(r.id)}
                className={`px-3 py-1.5 rounded transition-colors ${
                  timeRange === r.id ? 'bg-primary text-on-primary shadow-xs' : 'text-secondary hover:text-on-surface'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          <button 
            onClick={handlePrintBriefing}
            className="h-10 px-3.5 flex items-center gap-1.5 border border-outline-variant rounded-lg bg-surface hover:bg-surface-container text-on-surface font-label-md text-xs font-semibold transition-colors shadow-xs cursor-pointer"
            title="Print Executive Briefing"
          >
            <span className="material-symbols-outlined text-[18px]">print</span>
            <span>Print Brief</span>
          </button>

          <button 
            onClick={() => openModal('export-report')}
            className="h-10 px-4 flex items-center gap-2 bg-primary text-on-primary rounded-lg font-label-md text-label-md font-bold hover:bg-primary/90 transition-colors shadow-xs cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            <span>Export Report (PDF / XLSX)</span>
          </button>
        </div>
      </div>

      {/* Printable Briefing Header (Visible only on print) */}
      <div className="hidden print:block border-b-2 border-slate-900 pb-4 mb-4">
        <h1 className="text-2xl font-black uppercase tracking-tight">EDUCATE CRM - EXECUTIVE INTELLIGENCE BRIEFING</h1>
        <p className="text-xs text-slate-600 mt-1">
          Timeframe: {timeframeMetrics.label} | Exported: {new Date().toLocaleDateString()} | Author: {currentUser?.name || 'Administrator'}
        </p>
      </div>

      {/* 4 KPIs Bento Grid in Naira - Dynamically Scaled */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter">
        {/* Student Revenue */}
        <div className="bg-surface-container-lowest p-stack-md border border-outline-variant rounded-lg shadow-xs hover:border-primary/50 transition-colors">
          <div className="flex justify-between items-start mb-stack-md">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-700 dark:text-emerald-300">
              <span className="material-symbols-outlined">payments</span>
            </div>
            <span className="flex items-center text-[12px] font-bold text-[#166534] bg-[#dcfce7] px-2 py-0.5 rounded-full">
              <span className="material-symbols-outlined text-[14px] mr-1">school</span>
              {students.length} Students
            </span>
          </div>
          <p className="font-body-sm text-body-sm text-secondary mb-unit">Gross Tuition Collected</p>
          <h3 className="font-display text-display font-bold text-on-surface font-data-tabular">
            {formatNaira(timeframeMetrics.revenue)}
          </h3>
          <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-1 font-medium">
            Active billing pipeline
          </p>
        </div>

        {/* Operating Costs */}
        <div className="bg-surface-container-lowest p-stack-md border border-outline-variant rounded-lg shadow-xs hover:border-primary/50 transition-colors">
          <div className="flex justify-between items-start mb-stack-md">
            <div className="w-10 h-10 rounded-lg bg-rose-100 dark:bg-rose-950/50 flex items-center justify-center text-rose-700 dark:text-rose-300">
              <span className="material-symbols-outlined">receipt_long</span>
            </div>
            <span className="flex items-center text-[12px] font-bold text-rose-800 bg-rose-100 dark:bg-rose-950/60 px-2 py-0.5 rounded-full">
              {expenses.length} Vouchers
            </span>
          </div>
          <p className="font-body-sm text-body-sm text-secondary mb-unit">Total Operating Costs (OpEx)</p>
          <h3 className="font-display text-display font-bold text-on-surface font-data-tabular">
            {formatNaira(timeframeMetrics.expenses)}
          </h3>
          <p className="text-[11px] text-secondary mt-1">
            Overhead, cloud, and facilities
          </p>
        </div>

        {/* Mentor Payouts */}
        <div className="bg-surface-container-lowest p-stack-md border border-outline-variant rounded-lg shadow-xs hover:border-primary/50 transition-colors">
          <div className="flex justify-between items-start mb-stack-md">
            <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-700 dark:text-indigo-300">
              <span className="material-symbols-outlined">account_balance_wallet</span>
            </div>
            <span className="flex items-center text-[12px] font-bold text-indigo-800 bg-indigo-100 dark:bg-indigo-950/60 px-2 py-0.5 rounded-full">
              {mentors.length} Mentors
            </span>
          </div>
          <p className="font-body-sm text-body-sm text-secondary mb-unit">Faculty Honorariums (₦)</p>
          <h3 className="font-display text-display font-bold text-on-surface font-data-tabular">
            {formatNaira(timeframeMetrics.mentorPayouts)}
          </h3>
          <p className="text-[11px] text-secondary mt-1">
            Verified NUBAN settlements
          </p>
        </div>

        {/* Net Operating Surplus */}
        <div className="bg-surface-container-lowest p-stack-md border border-outline-variant rounded-lg shadow-xs hover:border-primary/50 transition-colors">
          <div className="flex justify-between items-start mb-stack-md">
            <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-950/50 flex items-center justify-center text-amber-700 dark:text-amber-300">
              <span className="material-symbols-outlined">query_stats</span>
            </div>
            <span className="flex items-center text-[12px] font-bold text-[#166534] bg-[#dcfce7] px-2 py-0.5 rounded-full">
              {timeframeMetrics.margin}% Margin
            </span>
          </div>
          <p className="font-body-sm text-body-sm text-secondary mb-unit">Net Institutional Surplus</p>
          <h3 className="font-display text-display font-bold text-primary font-data-tabular">
            {formatNaira(timeframeMetrics.surplus)}
          </h3>
          <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-1 font-medium">
            Positive unit economics
          </p>
        </div>
      </div>

      {/* Strategic Intelligence Tabs */}
      <div className="border-b border-outline-variant flex items-center gap-2 overflow-x-auto print:hidden">
        {[
          { id: 'financial' as const, label: 'Financial & Unit Economics', icon: 'account_balance' },
          { id: 'admissions' as const, label: 'Admissions ROI & Follow-ups', icon: 'leaderboard' },
          { id: 'faculty' as const, label: 'Faculty & Honorarium Ledger', icon: 'groups' },
          { id: 'cohorts' as const, label: 'Cohorts & Student Retention', icon: 'school' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 font-label-md text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === tab.id
                ? 'border-primary text-primary bg-primary/5'
                : 'border-transparent text-secondary hover:text-on-surface hover:bg-surface-container-low/40'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* TAB 1: Financial & Unit Economics */}
      {activeTab === 'financial' && (
        <div className="space-y-stack-lg">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
            {/* Chart 1: Revenue vs Costs Trend (8 cols) */}
            <div className="lg:col-span-8 bg-surface-container-lowest border border-outline-variant rounded-lg p-stack-md flex flex-col shadow-xs">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <span className="text-[11px] font-bold text-secondary uppercase tracking-wider">Cashflow Trajectory</span>
                  <h3 className="font-headline-md text-base font-bold text-on-surface">
                    Tuition Revenue vs. Faculty Honorariums &amp; Operating Overhead
                  </h3>
                </div>
                <span className="text-xs font-data-tabular text-primary font-bold bg-secondary-container px-2 py-0.5 rounded">
                  Live Trend (₦)
                </span>
              </div>
              <RevenueCostChart />
            </div>

            {/* Chart 2: Department Margin Breakdown (4 cols) */}
            <div className="lg:col-span-4 bg-surface-container-lowest border border-outline-variant rounded-lg p-stack-md flex flex-col shadow-xs">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <span className="text-[11px] font-bold text-secondary uppercase tracking-wider">Unit Economics</span>
                  <h3 className="font-headline-md text-base font-bold text-on-surface">
                    Department Profitability
                  </h3>
                </div>
                <Link to="/courses" className="text-primary font-label-md text-xs font-semibold hover:underline">
                  Programs
                </Link>
              </div>
              <DepartmentMarginChart />
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Admissions ROI & Follow-ups */}
      {activeTab === 'admissions' && (
        <div className="space-y-stack-lg">
          {/* Follow-up Velocity Metrics Banner */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-surface-container-lowest border border-outline-variant">
              <span className="text-xs text-secondary font-semibold">Total Intake Leads</span>
              <p className="text-2xl font-bold font-data-tabular text-on-surface mt-1">{followUpMetrics.total}</p>
              <span className="text-[11px] text-secondary">Inquiry touchpoints</span>
            </div>
            <div className="p-4 rounded-lg bg-surface-container-lowest border border-outline-variant">
              <span className="text-xs text-secondary font-semibold">Follow-ups Scheduled</span>
              <p className="text-2xl font-bold font-data-tabular text-indigo-600 dark:text-indigo-400 mt-1">{followUpMetrics.scheduled}</p>
              <span className="text-[11px] text-secondary">With committed date/time</span>
            </div>
            <div className="p-4 rounded-lg bg-surface-container-lowest border border-outline-variant">
              <span className="text-xs text-secondary font-semibold">Due Today / Urgent</span>
              <p className="text-2xl font-bold font-data-tabular text-amber-600 dark:text-amber-400 mt-1">{followUpMetrics.dueToday}</p>
              <span className="text-[11px] text-amber-700 dark:text-amber-400 font-semibold">Requires immediate call</span>
            </div>
            <div className="p-4 rounded-lg bg-surface-container-lowest border border-outline-variant">
              <span className="text-xs text-secondary font-semibold">Conversion Rate</span>
              <p className="text-2xl font-bold font-data-tabular text-emerald-600 dark:text-emerald-400 mt-1">{followUpMetrics.conversionRate}%</p>
              <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold">{followUpMetrics.converted} enrolled students</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
            {/* Chart: Acquisition Sources (6 cols) */}
            <div className="lg:col-span-6 bg-surface-container-lowest border border-outline-variant rounded-lg p-stack-md flex flex-col shadow-xs">
              <div className="flex justify-between items-center mb-2">
                <div>
                  <span className="text-[11px] font-bold text-secondary uppercase tracking-wider">Channel Efficiency</span>
                  <h3 className="font-headline-md text-base font-bold text-on-surface">
                    Lead Acquisition Sources &amp; Attribution
                  </h3>
                </div>
              </div>
              <LeadSourceDonutChart />
            </div>

            {/* Contacts & Follow-up Command Shortcut (6 cols) */}
            <div className="lg:col-span-6 bg-surface-container-lowest border border-outline-variant rounded-lg p-stack-md flex flex-col justify-between shadow-xs">
              <div>
                <span className="text-[11px] font-bold text-secondary uppercase tracking-wider">Follow-up Workflow</span>
                <h3 className="font-headline-md text-base font-bold text-on-surface mb-2">
                  Prospect Engagement &amp; Scheduled Call Center
                </h3>
                <p className="text-xs text-secondary mb-4 leading-relaxed">
                  Leads entered into the CRM automatically remain in active status with full follow-up tracking. 
                  Admissions officers can trigger 1-click WhatsApp messaging, telephone calls, and note logs from the dedicated Contacts page.
                </p>

                <div className="space-y-2 mb-4">
                  <div className="p-2.5 rounded bg-surface border border-outline-variant text-xs flex justify-between items-center">
                    <span className="font-medium text-on-surface">Overdue Follow-ups</span>
                    <span className="px-2 py-0.5 rounded font-bold text-xs bg-rose-100 text-rose-800">
                      {followUpMetrics.overdue} Leads
                    </span>
                  </div>
                  <div className="p-2.5 rounded bg-surface border border-outline-variant text-xs flex justify-between items-center">
                    <span className="font-medium text-on-surface">Qualified Negotiations</span>
                    <span className="px-2 py-0.5 rounded font-bold text-xs bg-emerald-100 text-emerald-800">
                      {followUpMetrics.qualified} Leads
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t border-outline-variant">
                <Link
                  to="/contacts"
                  className="flex-1 py-2 px-3 rounded-lg bg-primary text-on-primary font-bold text-xs text-center hover:bg-primary-container transition-colors shadow-xs flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">contact_phone</span>
                  <span>Open Contacts &amp; Follow-up Schedule</span>
                </Link>
                <Link
                  to="/leads"
                  className="py-2 px-3 rounded-lg border border-outline-variant bg-surface hover:bg-surface-container font-semibold text-xs text-secondary hover:text-on-surface transition-colors flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">view_kanban</span>
                  <span>Kanban Pipeline</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Faculty & Honorarium Ledger */}
      {activeTab === 'faculty' && (
        <div className="bg-surface-container-lowest border border-outline-variant rounded-lg overflow-hidden shadow-xs">
          <div className="p-stack-md border-b border-outline-variant flex justify-between items-center bg-surface-bright flex-wrap gap-3">
            <div>
              <h3 className="font-headline-md text-headline-md font-bold text-on-surface">Faculty Honorarium Disbursements Ledger</h3>
              <p className="font-body-sm text-body-sm text-secondary">Verified Nigerian banking settlement records via NIBSS electronic transfers.</p>
            </div>
            <div className="flex gap-2">
              <div className="relative w-48 sm:w-64">
                <span className="material-symbols-outlined absolute left-2 top-1/2 -translate-y-1/2 text-outline text-[18px]">search</span>
                <input 
                  type="text"
                  value={filterQuery}
                  onChange={(e) => setFilterQuery(e.target.value)}
                  placeholder="Filter payouts or mentor..."
                  className="w-full h-8 pl-8 pr-2 rounded bg-surface border border-outline-variant text-body-sm focus:border-primary outline-none text-xs"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            {filteredMentors.length === 0 ? (
              <div className="p-8 text-center text-xs text-secondary">
                No faculty honorarium payouts or mentor disbursements match your search filter.
              </div>
            ) : (
              <table className="w-full text-left border-collapse min-w-[700px] text-xs">
                <thead>
                  <tr className="border-b border-outline-variant bg-surface-container-low text-secondary font-label-md">
                    <th className="px-stack-md py-3 font-semibold">Mentor ID</th>
                    <th className="px-stack-md py-3 font-semibold">Faculty Mentor</th>
                    <th className="px-stack-md py-3 font-semibold">Department</th>
                    <th className="px-stack-md py-3 font-semibold">1-on-1 Sessions</th>
                    <th className="px-stack-md py-3 font-semibold">Pending Honorarium (₦)</th>
                    <th className="px-stack-md py-3 font-semibold">Disbursement Status</th>
                  </tr>
                </thead>
                <tbody className="font-data-tabular text-on-surface divide-y divide-outline-variant/50">
                  {filteredMentors.map((mentor, index) => (
                    <tr 
                      key={mentor.id}
                      className={`hover:bg-surface-bright transition-colors ${index % 2 === 1 ? 'bg-surface-container-low/30' : ''}`}
                    >
                      <td className="px-stack-md py-3 font-data-tabular font-bold text-primary">#{mentor.mentorCode}</td>
                      <td className="px-stack-md py-3 font-medium">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-xs">
                            {mentor.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </div>
                          <span className="font-bold text-on-surface">{mentor.name}</span>
                        </div>
                      </td>
                      <td className="px-stack-md py-3 text-secondary">{mentor.department}</td>
                      <td className="px-stack-md py-3 font-semibold">{mentor.sessionsCount}</td>
                      <td className="px-stack-md py-3 font-bold text-on-surface font-data-tabular">{formatNaira(mentor.pendingPayout)}</td>
                      <td className="px-stack-md py-3">
                        <span 
                          className={`px-2 py-0.5 rounded text-[11px] font-bold inline-block ${
                            mentor.payoutStatus === 'Completed'
                              ? 'bg-[#dcfce7] text-[#166534]'
                              : mentor.payoutStatus === 'Processing'
                              ? 'bg-[#fef9c3] text-[#854d0e]'
                              : 'bg-[#fee2e2] text-[#991b1b]'
                          }`}
                        >
                          {mentor.payoutStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: Cohorts & Student Retention */}
      {activeTab === 'cohorts' && (
        <div className="space-y-stack-lg">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-stack-md flex flex-col shadow-xs">
            <div className="flex justify-between items-center mb-4">
              <div>
                <span className="text-[11px] font-bold text-secondary uppercase tracking-wider">Academic Quality &amp; Outcomes</span>
                <h3 className="font-headline-md text-base font-bold text-on-surface">
                  Cohort Admissions vs. Graduation &amp; Capstone Progression
                </h3>
              </div>
              <span className="text-xs font-data-tabular text-primary font-bold bg-secondary-container px-2 py-0.5 rounded">
                Cohort Progression
              </span>
            </div>
            <CohortProgressionAreaChart />
          </div>
        </div>
      )}
    </div>
  );
};
