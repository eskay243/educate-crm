import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCRM, formatNaira } from '../context/CRMContext';
import { RevenueCostChart } from '../components/analytics/RevenueCostChart';
import { LeadSourceDonutChart } from '../components/analytics/LeadSourceDonutChart';
import { CohortProgressionAreaChart } from '../components/analytics/CohortProgressionAreaChart';
import { DepartmentMarginChart } from '../components/analytics/DepartmentMarginChart';

export interface ExecutiveReportPageProps {}

export const ExecutiveReportPage: React.FC<ExecutiveReportPageProps> = () => {
  const { kpis, mentors, openModal, students, leads } = useCRM();
  const [filterQuery, setFilterQuery] = useState('');
  const [timeRange, setTimeRange] = useState<'Q3' | 'Q4' | 'YTD'>('YTD');

  const filteredMentors = mentors.filter(m => 
    m.name.toLowerCase().includes(filterQuery.toLowerCase()) ||
    m.mentorCode.toLowerCase().includes(filterQuery.toLowerCase()) ||
    m.department.toLowerCase().includes(filterQuery.toLowerCase())
  );

  return (
    <div className="space-y-stack-lg animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex justify-between items-end flex-wrap gap-4">
        <div>
          <h2 className="font-headline-lg text-headline-lg font-bold text-on-surface mb-unit">
            Executive Financial &amp; Operational Intelligence
          </h2>
          <p className="font-body-md text-body-md text-secondary">
            Real-time graphical tuition trends, Nigerian lead acquisition channels, cohort retention, and department margins.
          </p>
        </div>
        <div className="flex gap-2">
          {/* Time Range Selector */}
          <div className="flex border border-outline-variant rounded p-1 bg-surface-container-lowest text-xs font-bold">
            {(['Q3', 'Q4', 'YTD'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                className={`px-3 py-1 rounded transition-colors ${
                  timeRange === r ? 'bg-primary text-on-primary' : 'text-secondary hover:text-on-surface'
                }`}
              >
                {r === 'YTD' ? 'Full Year (2026)' : `Fiscal ${r}`}
              </button>
            ))}
          </div>

          <button 
            onClick={() => openModal('export-report')}
            className="h-10 px-4 flex items-center gap-2 bg-primary text-on-primary rounded font-label-md text-label-md hover:bg-primary/90 transition-colors shadow-xs cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            <span>Export Executive PDF</span>
          </button>
        </div>
      </div>

      {/* 4 KPIs Cards in Naira - Fully Dynamic */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter">
        {/* Student Revenue */}
        <div className="bg-surface-container-lowest p-stack-md border border-outline-variant rounded-lg shadow-xs">
          <div className="flex justify-between items-start mb-stack-md">
            <div className="w-10 h-10 rounded bg-secondary-container flex items-center justify-center text-primary">
              <span className="material-symbols-outlined">payments</span>
            </div>
            <span className="flex items-center text-[12px] font-bold text-[#166534] bg-[#dcfce7] px-2 py-1 rounded">
              <span className="material-symbols-outlined text-[14px] mr-1">school</span>
              {students.length} Students
            </span>
          </div>
          <p className="font-body-sm text-body-sm text-secondary mb-unit">Gross Tuition Collected</p>
          <h3 className="font-display text-display font-bold text-on-surface font-mono">
            {formatNaira(kpis.totalRevenue)}
          </h3>
        </div>

        {/* Mentor Payouts */}
        <div className="bg-surface-container-lowest p-stack-md border border-outline-variant rounded-lg shadow-xs">
          <div className="flex justify-between items-start mb-stack-md">
            <div className="w-10 h-10 rounded bg-primary-container flex items-center justify-center text-on-primary">
              <span className="material-symbols-outlined">account_balance_wallet</span>
            </div>
            <span className="flex items-center text-[12px] font-bold text-primary bg-secondary-container px-2 py-1 rounded">
              <span className="material-symbols-outlined text-[14px] mr-1">supervisor_account</span>
              {mentors.length} Mentors
            </span>
          </div>
          <p className="font-body-sm text-body-sm text-secondary mb-unit">Faculty Honorariums (₦)</p>
          <h3 className="font-display text-display font-bold text-on-surface font-mono">
            {formatNaira(kpis.mentorPayouts)}
          </h3>
        </div>

        {/* Operating Costs */}
        <div className="bg-surface-container-lowest p-stack-md border border-outline-variant rounded-lg shadow-xs">
          <div className="flex justify-between items-start mb-stack-md">
            <div className="w-10 h-10 rounded bg-error-container/40 flex items-center justify-center text-error">
              <span className="material-symbols-outlined">receipt_long</span>
            </div>
            <span className="flex items-center text-[12px] font-bold text-secondary bg-surface-container px-2 py-1 rounded">
              Operating
            </span>
          </div>
          <p className="font-body-sm text-body-sm text-secondary mb-unit">Total Operating Costs (₦)</p>
          <h3 className="font-display text-display font-bold text-on-surface font-mono">
            {formatNaira(kpis.totalExpenses)}
          </h3>
        </div>

        {/* Operating Profit Margin */}
        <div className="bg-surface-container-lowest p-stack-md border border-outline-variant rounded-lg shadow-xs">
          <div className="flex justify-between items-start mb-stack-md">
            <div className="w-10 h-10 rounded bg-secondary-container flex items-center justify-center text-primary">
              <span className="material-symbols-outlined">show_chart</span>
            </div>
            <span className="flex items-center text-[12px] font-bold text-[#166534] bg-[#dcfce7] px-2 py-1 rounded">
              <span className="material-symbols-outlined text-[14px] mr-1">group</span>
              {leads.length} Leads
            </span>
          </div>
          <p className="font-body-sm text-body-sm text-secondary mb-unit">Net Operating Margin</p>
          <h3 className="font-display text-display font-bold text-primary font-mono">
            {kpis.operatingMargin}%
          </h3>
        </div>
      </div>

      {/* Bento Grid Row 1: Interactive Recharts Bar & Donut Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
        {/* Chart 1: Revenue vs Costs Trend (8 cols) */}
        <div className="lg:col-span-8 bg-surface-container-lowest border border-outline-variant rounded-lg p-stack-md flex flex-col shadow-xs">
          <div className="flex justify-between items-center mb-4">
            <div>
              <span className="text-[11px] font-bold text-secondary uppercase tracking-wider">Financial Performance</span>
              <h3 className="font-headline-md text-base font-bold text-on-surface">
                Tuition Revenue vs. Faculty Honorariums &amp; Operating Overhead
              </h3>
            </div>
            <span className="text-xs font-mono text-primary font-bold bg-secondary-container px-2 py-0.5 rounded">
              Live Trend (₦)
            </span>
          </div>

          <RevenueCostChart />
        </div>

        {/* Chart 2: Lead Acquisition Sources Donut (4 cols) */}
        <div className="lg:col-span-4 bg-surface-container-lowest border border-outline-variant rounded-lg p-stack-md flex flex-col shadow-xs">
          <div className="flex justify-between items-center mb-2">
            <div>
              <span className="text-[11px] font-bold text-secondary uppercase tracking-wider">Admissions Channel ROI</span>
              <h3 className="font-headline-md text-base font-bold text-on-surface">
                Lead Acquisition Sources
              </h3>
            </div>
            <Link to="/leads" className="text-primary font-label-md text-xs font-semibold hover:underline">
              Kanban
            </Link>
          </div>

          <LeadSourceDonutChart />
        </div>
      </div>

      {/* Bento Grid Row 2: Cohort Retention Area Chart & Department Margins */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
        {/* Chart 3: Cohort Enrollment & Placement Retention (6 cols) */}
        <div className="lg:col-span-6 bg-surface-container-lowest border border-outline-variant rounded-lg p-stack-md flex flex-col shadow-xs">
          <div className="flex justify-between items-center mb-4">
            <div>
              <span className="text-[11px] font-bold text-secondary uppercase tracking-wider">Academic Quality &amp; Outcomes</span>
              <h3 className="font-headline-md text-base font-bold text-on-surface">
                Cohort Admissions vs. Graduation Progress
              </h3>
            </div>
            <span className="text-xs font-mono text-primary font-bold bg-secondary-container px-2 py-0.5 rounded">
              Cohort Tracking
            </span>
          </div>

          <CohortProgressionAreaChart />
        </div>

        {/* Chart 4: Department Profitability & Margins (6 cols) */}
        <div className="lg:col-span-6 bg-surface-container-lowest border border-outline-variant rounded-lg p-stack-md flex flex-col shadow-xs">
          <div className="flex justify-between items-center mb-4">
            <div>
              <span className="text-[11px] font-bold text-secondary uppercase tracking-wider">Unit Economics</span>
              <h3 className="font-headline-md text-base font-bold text-on-surface">
                Department Revenue vs. Direct Operating Overhead
              </h3>
            </div>
            <Link to="/courses" className="text-primary font-label-md text-xs font-semibold hover:underline">
              Programs
            </Link>
          </div>

          <DepartmentMarginChart />
        </div>
      </div>

      {/* Data Table Section: Recent Mentor Payouts & Disbursements */}
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
              No faculty honorarium payouts or mentor disbursements recorded yet.
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
                    <td className="px-stack-md py-3 font-mono font-bold text-primary">#{mentor.mentorCode}</td>
                    <td className="px-stack-md py-3 font-medium">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-xs">
                          {mentor.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <span className="font-sans font-bold">{mentor.name}</span>
                      </div>
                    </td>
                    <td className="px-stack-md py-3 text-secondary font-sans">{mentor.department}</td>
                    <td className="px-stack-md py-3 font-semibold">{mentor.sessionsCount}</td>
                    <td className="px-stack-md py-3 font-bold text-on-surface">{formatNaira(mentor.pendingPayout)}</td>
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
    </div>
  );
};
