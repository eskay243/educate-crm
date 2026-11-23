import React, { useEffect, useMemo, useState } from 'react';
import { formatNaira, useCRM } from '../../context/CRMContext';
import { FinancialAuditAskResponse, FinancialAuditFinding } from '../../types/crm';
import { SectionCard, SemanticMetricCard } from '../common/KineticUI';

interface Props {
  onOpenInvestigationCase?: (caseId: string) => void;
}

const LAYER_LABELS: Record<number, string> = {
  1: 'L1: Price Diffs',
  2: 'L2: Inflows',
  3: 'L3: Mentors',
  4: 'L4: Expenses',
  5: 'L5: Cash Gap',
};

const SEVERITY_RANK: Record<string, number> = {
  Critical: 3,
  Warning: 2,
  Info: 1,
};

const QUICK_PROMPTS = [
  'Why is company cash different from recorded balance?',
  'Show all course price differences',
  'Which mentors have commission or payout discrepancies?',
  'Are there unvouchered expenses or wallet outflows?',
];

export const FinancialAuditAgentPanel: React.FC<Props> = ({ onOpenInvestigationCase }) => {
  const {
    currentUser,
    financialAuditScan,
    financialAuditScans,
    financialAuditFindings,
    financialAuditConfig,
    fetchFinancialAudit,
    updateFinancialAuditFinding,
    updateFinancialAuditConfig,
    createAuditInvestigation,
    askFinancialAuditor,
  } = useCRM();

  // Discrepancy Log filters, search, sort & pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [layerFilter, setLayerFilter] = useState<string>('ALL');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [ruleFilter, setRuleFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('OPEN_ONLY');
  const [sortBy, setSortBy] = useState<'severity' | 'delta' | 'recent'>('severity');
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [resolutionNote, setResolutionNote] = useState<string>('');
  const [exemptingId, setExemptingId] = useState<string | null>(null);
  const [discountReason, setDiscountReason] = useState<string>('');
  const [toleranceInput, setToleranceInput] = useState<string>(
    String(financialAuditConfig?.varianceToleranceNaira ?? 100)
  );

  // Ask AI Auditor Q&A state
  const [question, setQuestion] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const [askError, setAskError] = useState<string | null>(null);
  const [askResult, setAskResult] = useState<FinancialAuditAskResponse | null>(null);

  const isSuperAdmin = currentUser?.role === 'super_admin';

  useEffect(() => {
    if (isSuperAdmin) {
      fetchFinancialAudit();
    }
  }, [isSuperAdmin, fetchFinancialAudit]);

  useEffect(() => {
    setToleranceInput(String(financialAuditConfig?.varianceToleranceNaira ?? 100));
  }, [financialAuditConfig?.varianceToleranceNaira]);

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setPage(1);
  }, [searchQuery, layerFilter, severityFilter, ruleFilter, statusFilter, sortBy, pageSize]);

  const handleUpdateStatus = async (finding: FinancialAuditFinding, status: 'Acknowledged' | 'Resolved') => {
    await updateFinancialAuditFinding(finding.id, {
      status,
      resolutionNote: status === 'Resolved' ? resolutionNote.trim() || 'Reviewed and resolved by Super Admin' : undefined,
    });
    setResolvingId(null);
    setResolutionNote('');
  };

  const handleApproveDiscount = async (finding: FinancialAuditFinding) => {
    await updateFinancialAuditFinding(finding.id, {
      approveDiscount: true,
      discountReason: discountReason.trim() || 'Approved Scholarship / Fee Waiver',
    });
    setExemptingId(null);
    setDiscountReason('');
  };

  const handleStartInvestigation = async (finding: FinancialAuditFinding) => {
    if (finding.investigationCaseId) {
      onOpenInvestigationCase?.(finding.investigationCaseId);
      return;
    }
    const created = await createAuditInvestigation({
      title: finding.title,
      summary: finding.aiDiagnosis,
      severity: finding.severity,
      findingIds: [finding.id],
    });
    if (created) {
      onOpenInvestigationCase?.(created.id);
    }
  };

  const handleAsk = async (promptText?: string) => {
    const q = (promptText ?? question).trim();
    if (!q) return;
    setQuestion(q);
    setIsAsking(true);
    setAskError(null);
    try {
      const res = await askFinancialAuditor(q);
      if (res && res.answer) {
        setAskResult(res);
      } else {
        setAskError('Could not reach the AI Financial Auditor endpoint. Please verify the local server is running.');
      }
    } finally {
      setIsAsking(false);
    }
  };

  const handleSaveTolerance = async () => {
    const num = Math.max(0, Number(toleranceInput || 0));
    await updateFinancialAuditConfig({ varianceToleranceNaira: num });
  };

  const availableRules = useMemo(() => {
    const set = new Set<string>();
    for (const f of financialAuditFindings || []) {
      if (f.ruleCode) set.add(f.ruleCode);
    }
    return Array.from(set).sort();
  }, [financialAuditFindings]);

  const filteredFindings = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = (financialAuditFindings || []).filter((f) => {
      if (layerFilter !== 'ALL' && String(f.layer || '') !== layerFilter) return false;
      if (severityFilter !== 'ALL' && f.severity !== severityFilter) return false;
      if (ruleFilter !== 'ALL' && f.ruleCode !== ruleFilter) return false;
      if (statusFilter === 'OPEN_ONLY' && f.status === 'Resolved') return false;
      if (statusFilter === 'Resolved' && f.status !== 'Resolved') return false;
      if (q) {
        const hay = `${f.title} ${f.entityName} ${f.ruleCode} ${f.aiDiagnosis}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    return list.sort((a, b) => {
      if (sortBy === 'delta') {
        return Math.abs(Number(b.deltaAmount || 0)) - Math.abs(Number(a.deltaAmount || 0));
      }
      if (sortBy === 'recent') {
        return new Date(b.lastDetectedAt || 0).getTime() - new Date(a.lastDetectedAt || 0).getTime();
      }
      const sevDiff = (SEVERITY_RANK[b.severity] || 0) - (SEVERITY_RANK[a.severity] || 0);
      if (sevDiff !== 0) return sevDiff;
      return Math.abs(Number(b.deltaAmount || 0)) - Math.abs(Number(a.deltaAmount || 0));
    });
  }, [financialAuditFindings, searchQuery, layerFilter, severityFilter, ruleFilter, statusFilter, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredFindings.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginatedFindings = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredFindings.slice(start, start + pageSize);
  }, [filteredFindings, safePage, pageSize]);

  if (!isSuperAdmin) {
    return (
      <SectionCard>
        <div className="py-8 text-center">
          <span className="material-symbols-outlined text-[36px] text-red-600">gpp_bad</span>
          <h3 className="text-sm font-bold text-on-surface mt-2">Super Admin Access Only</h3>
          <p className="text-xs text-secondary mt-1">
            The AI Financial Audit Agent is restricted exclusively to Super Admin accounts.
          </p>
        </div>
      </SectionCard>
    );
  }

  const flow = financialAuditScan?.moneyFlow;
  const cashGap = Number(flow?.cashReconciliationGap ?? 0);
  const tolerance = Number(financialAuditConfig?.varianceToleranceNaira ?? 100);
  const hasCashGap = Math.abs(cashGap) > tolerance;

  return (
    <div className="space-y-5">
      {/* 5-Layer Money Flow KPI Pipeline */}
      {flow && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
          <SemanticMetricCard
            label="Tuition Billed"
            value={formatNaira(flow.totalTuitionBilled)}
            icon="school"
            intent="blue"
            subtitle={`Price Diffs: ${formatNaira(flow.coursePriceVarianceTotal || 0)}`}
          />
          <SemanticMetricCard
            label="Student Inflows"
            value={formatNaira(flow.totalStudentPaymentsReceived)}
            icon="payments"
            intent="emerald"
            subtitle={`Acct Credits: ${formatNaira(flow.totalWalletInflow || 0)}`}
          />
          <SemanticMetricCard
            label="Mentor Payouts"
            value={formatNaira(flow.totalDisbursedToMentors)}
            icon="co_present"
            intent="sky"
            subtitle={`37% Due: ${formatNaira(flow.totalAgreedCommissionDue)}`}
          />
          <SemanticMetricCard
            label="Business OpEx Paid"
            value={formatNaira(flow.totalNonMentorExpensesPaid || 0)}
            icon="receipt_long"
            intent="amber"
            subtitle={`All Exp: ${formatNaira(flow.totalBusinessExpensesPaid || 0)}`}
          />
          <SemanticMetricCard
            label="Actual Company Cash"
            value={formatNaira(flow.actualCompanyCashTotal || 0)}
            icon="account_balance"
            intent="purple"
            subtitle={`Expected: ${formatNaira(flow.expectedNetCashPosition || 0)}`}
          />
          <SemanticMetricCard
            label="Master Cash Gap"
            value={`${cashGap >= 0 ? '+' : '-'}${formatNaira(Math.abs(cashGap))}`}
            icon={hasCashGap ? 'warning' : 'verified'}
            intent={hasCashGap ? 'red' : 'emerald'}
            badge={hasCashGap ? (cashGap < 0 ? 'Shortfall' : 'Surplus') : 'Balanced'}
            badgePulse={hasCashGap}
            subtitle={`${financialAuditScan?.criticalCount || 0} crit • ${financialAuditScan?.warningCount || 0} warn`}
          />
        </div>
      )}

      {/* Ask AI Auditor Forensic Briefing Card */}
      <SectionCard
        title="Ask AI Financial Auditor"
        subtitle="Query live 5-layer ERP cash flows, price differences, mentor payouts, or any specific student/mentor name"
        icon="psychology"
        badge={
          askResult ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-700 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              {askResult.mode === 'gemini_enhanced' ? 'Gemini + Live Ledger' : 'Live Ledger Engine Active'}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-700 border border-blue-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              Ready
            </span>
          )
        }
      >
        <div className="space-y-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAsk();
            }}
            className="flex flex-col sm:flex-row gap-2"
          >
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask e.g. 'Why is company cash different from recorded balance?' or type a student/mentor name..."
              className="flex-1 rounded-lg border border-outline-variant bg-white px-3.5 py-2 text-xs text-on-surface"
            />
            <button
              type="submit"
              disabled={isAsking || !question.trim()}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-white text-xs font-bold hover:bg-primary/90 disabled:opacity-50 cursor-pointer shrink-0"
            >
              <span className={`material-symbols-outlined text-[16px] ${isAsking ? 'animate-spin' : ''}`}>
                {isAsking ? 'progress_activity' : 'auto_awesome'}
              </span>
              {isAsking ? 'Auditing Ledger...' : 'Ask Auditor'}
            </button>
          </form>

          <div className="flex flex-wrap gap-1.5">
            {QUICK_PROMPTS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => handleAsk(p)}
                className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-canvas border border-outline-variant/80 text-secondary hover:text-primary hover:border-primary/40 transition-colors cursor-pointer"
              >
                {p}
              </button>
            ))}
          </div>

          {askError && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/25 text-xs text-red-700 font-medium">
              {askError}
            </div>
          )}

          {/* Rich Forensic Briefing Output */}
          {askResult && (
            <div className="rounded-xl border border-outline-variant/90 bg-canvas/70 p-4 space-y-4">
              {/* Executive Verdict */}
              <div className="flex items-start justify-between gap-3 pb-3 border-b border-outline-variant/60">
                <div className="flex items-start gap-2.5">
                  <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary ring-1 ring-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="material-symbols-outlined text-[18px]">insights</span>
                  </span>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-primary">Forensic Verdict</p>
                    <p className="text-xs sm:text-sm font-bold text-on-surface mt-0.5 leading-snug">
                      {askResult.verdict || askResult.answer}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setAskResult(null)}
                  className="p-1 rounded-lg text-secondary hover:bg-white cursor-pointer shrink-0"
                  title="Dismiss briefing"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              </div>

              {/* KPI Highlight Tiles */}
              {askResult.highlights && askResult.highlights.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {askResult.highlights.map((h) => {
                    const colorClass =
                      h.intent === 'red'
                        ? 'border-red-500/30 bg-red-500/[0.04] text-red-700'
                        : h.intent === 'emerald'
                          ? 'border-emerald-500/30 bg-emerald-500/[0.04] text-emerald-700'
                          : h.intent === 'amber'
                            ? 'border-amber-500/30 bg-amber-500/[0.04] text-amber-700'
                            : 'border-blue-500/30 bg-blue-500/[0.04] text-blue-700';
                    return (
                      <div key={h.label} className={`p-2.5 rounded-lg border ${colorClass}`}>
                        <p className="text-[10px] font-bold uppercase tracking-wider opacity-80">{h.label}</p>
                        <p className="text-sm font-black font-data-tabular mt-0.5">{h.value}</p>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Structured Layer Breakdown Sections */}
              {askResult.sections && askResult.sections.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {askResult.sections.map((sec) => (
                    <div
                      key={sec.title}
                      className="p-3.5 rounded-xl bg-white border border-outline-variant/75 space-y-2"
                    >
                      <div className="flex items-center gap-2">
                        {sec.icon && (
                          <span className="material-symbols-outlined text-[16px] text-primary">{sec.icon}</span>
                        )}
                        <h4 className="text-xs font-extrabold text-on-surface">{sec.title}</h4>
                      </div>
                      <ul className="space-y-1.5">
                        {sec.bullets.map((b, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-on-surface/85 leading-relaxed">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary/70 mt-1.5 shrink-0" />
                            <span>{b}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-on-surface leading-relaxed whitespace-pre-line">{askResult.answer}</p>
              )}

              {/* Clickable Cited Findings */}
              {askResult.relatedFindings && askResult.relatedFindings.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-secondary">
                    Top Cited Findings ({askResult.relatedFindings.length})
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {askResult.relatedFindings.slice(0, 4).map((rf) => (
                      <div
                        key={rf.id}
                        className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-white border border-outline-variant/70 text-xs"
                      >
                        <div className="min-w-0">
                          <p className="font-bold text-on-surface truncate">{rf.title}</p>
                          <p className="text-[11px] font-data-tabular text-red-600 font-semibold">
                            Δ {formatNaira(rf.deltaAmount)} • {rf.severity}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleStartInvestigation(rf)}
                          className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-[11px] font-bold hover:bg-primary/20 cursor-pointer shrink-0"
                        >
                          Investigate
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Suggested Follow-up Chips */}
              {askResult.followUpPrompts && askResult.followUpPrompts.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-outline-variant/60">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-secondary mr-1">
                    Follow-up:
                  </span>
                  {askResult.followUpPrompts.map((fp) => (
                    <button
                      key={fp}
                      type="button"
                      onClick={() => handleAsk(fp)}
                      className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-white border border-outline-variant text-primary hover:bg-primary/5 cursor-pointer"
                    >
                      {fp}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </SectionCard>

      {/* Discrepancy Log Filters, Search, Sort & Tolerance */}
      <div className="p-4 rounded-xl bg-white/85 backdrop-blur-md border border-outline-variant/80 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="text-xs font-extrabold text-on-surface">
              Discrepancy Log ({filteredFindings.length} matching)
            </span>
            <div className="flex items-center gap-1.5 pl-2.5 border-l border-outline-variant/70">
              <span className="text-[11px] text-secondary">Tolerance (₦):</span>
              <input
                type="number"
                min={0}
                value={toleranceInput}
                onChange={(e) => setToleranceInput(e.target.value)}
                className="w-20 rounded-lg border border-outline-variant bg-white px-2 py-1 text-xs font-data-tabular"
              />
              <button
                type="button"
                onClick={handleSaveTolerance}
                className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-[11px] font-bold hover:bg-primary/20 cursor-pointer"
              >
                Apply
              </button>
            </div>
          </div>

          <div className="relative w-full sm:w-64">
            <span className="material-symbols-outlined text-[16px] text-secondary absolute left-2.5 top-1/2 -translate-y-1/2">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search student, mentor, rule..."
              className="w-full rounded-lg border border-outline-variant bg-white pl-8 pr-3 py-1.5 text-xs text-on-surface"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-outline-variant/50">
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={layerFilter}
              onChange={(e) => setLayerFilter(e.target.value)}
              className="text-xs border border-outline-variant rounded-lg px-2.5 py-1.5 bg-white font-semibold text-on-surface"
            >
              <option value="ALL">All 5 Layers</option>
              <option value="1">L1: Price Differences</option>
              <option value="2">L2: Student Inflows</option>
              <option value="3">L3: Mentor Payouts</option>
              <option value="4">L4: Expenses &amp; Outflows</option>
              <option value="5">L5: Master Cash Gap</option>
            </select>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="text-xs border border-outline-variant rounded-lg px-2.5 py-1.5 bg-white font-semibold text-on-surface"
            >
              <option value="ALL">All Severities</option>
              <option value="Critical">Critical Only</option>
              <option value="Warning">Warnings Only</option>
              <option value="Info">Info Only</option>
            </select>
            <select
              value={ruleFilter}
              onChange={(e) => setRuleFilter(e.target.value)}
              className="text-xs border border-outline-variant rounded-lg px-2.5 py-1.5 bg-white font-semibold text-on-surface max-w-[200px]"
            >
              <option value="ALL">All Rule Codes</option>
              {availableRules.map((rc) => (
                <option key={rc} value={rc}>
                  {rc}
                </option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs border border-outline-variant rounded-lg px-2.5 py-1.5 bg-white font-semibold text-on-surface"
            >
              <option value="OPEN_ONLY">Open &amp; Acknowledged</option>
              <option value="ALL">All Statuses</option>
              <option value="Resolved">Resolved Only</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-xs border border-outline-variant rounded-lg px-2.5 py-1.5 bg-white font-semibold text-on-surface"
            >
              <option value="severity">Sort: Severity &amp; Delta</option>
              <option value="delta">Sort: Largest ₦ Delta</option>
              <option value="recent">Sort: Most Recent</option>
            </select>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="text-xs border border-outline-variant rounded-lg px-2.5 py-1.5 bg-white font-semibold text-on-surface"
            >
              <option value={10}>10 / page</option>
              <option value={25}>25 / page</option>
              <option value={50}>50 / page</option>
            </select>
          </div>
        </div>
      </div>

      {/* Paginated Findings List */}
      <div className="space-y-3">
        {paginatedFindings.length === 0 ? (
          <SectionCard>
            <div className="py-10 text-center">
              <span className="material-symbols-outlined text-[40px] text-emerald-600">verified</span>
              <p className="text-sm font-bold text-on-surface mt-2">No Discrepancies Matching Filters</p>
              <p className="text-xs text-secondary mt-1">All money-flow checks in this view are clean.</p>
            </div>
          </SectionCard>
        ) : (
          paginatedFindings.map((f) => (
            <div
              key={f.id}
              className={`p-4 rounded-xl bg-white/85 backdrop-blur-md border shadow-[0_2px_10px_-4px_rgba(28,41,60,0.06)] transition-all ${
                f.status === 'Resolved'
                  ? 'border-outline-variant/70 opacity-75'
                  : f.severity === 'Critical'
                    ? 'border-red-500/40'
                    : f.severity === 'Warning'
                      ? 'border-amber-500/40'
                      : 'border-outline-variant/80'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-3">
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        f.severity === 'Critical'
                          ? 'bg-red-500/10 text-red-700 border-red-500/20'
                          : f.severity === 'Warning'
                            ? 'bg-amber-500/10 text-amber-700 border-amber-500/20'
                            : 'bg-sky-500/10 text-sky-700 border-sky-500/20'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[13px]">
                        {f.severity === 'Critical' ? 'error' : f.severity === 'Warning' ? 'warning' : 'info'}
                      </span>
                      {f.severity}
                    </span>
                    {f.layer && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-700 border border-purple-500/20">
                        {LAYER_LABELS[f.layer]}
                      </span>
                    )}
                    <span className="text-[11px] font-mono text-secondary">{f.ruleCode}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        f.status === 'Resolved'
                          ? 'bg-emerald-500/10 text-emerald-700'
                          : f.status === 'Acknowledged'
                            ? 'bg-blue-500/10 text-blue-700'
                            : 'bg-canvas text-secondary'
                      }`}
                    >
                      {f.status}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-on-surface">{f.title}</h4>
                  <p className="text-xs text-on-surface/85 leading-relaxed">{f.aiDiagnosis}</p>
                  <p className="text-xs text-primary font-semibold">
                    Recommended Action: {f.recommendedAction}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 pt-1 text-[11px] text-secondary font-data-tabular">
                    <span>
                      Expected: <strong className="text-on-surface">{formatNaira(f.expectedAmount)}</strong>
                    </span>
                    <span>
                      Actual: <strong className="text-on-surface">{formatNaira(f.actualAmount)}</strong>
                    </span>
                    <span>
                      Delta: <strong className="text-red-600">{formatNaira(f.deltaAmount)}</strong>
                    </span>
                  </div>

                  {f.resolutionNote && (
                    <p className="text-[11px] text-emerald-700 bg-emerald-500/10 px-2.5 py-1 rounded-lg inline-block mt-1">
                      Resolution: {f.resolutionNote} ({f.resolvedBy})
                    </p>
                  )}
                </div>

                {f.status !== 'Resolved' && (
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <div className="flex items-center gap-1.5 flex-wrap justify-end">
                      <button
                        type="button"
                        onClick={() => handleStartInvestigation(f)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[15px]">contact_support</span>
                        {f.investigationCaseId ? 'View Case' : 'Investigate / Ask User'}
                      </button>

                      {f.ruleCode === 'COURSE_PRICE_VARIANCE' && (
                        <button
                          type="button"
                          onClick={() => {
                            setExemptingId(exemptingId === f.id ? null : f.id);
                            setDiscountReason('');
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-amber-700 bg-amber-500/10 hover:bg-amber-500/20 rounded-lg transition-colors cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[15px]">local_offer</span>
                          Approve Discount
                        </button>
                      )}

                      {f.status === 'Open' && (
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(f, 'Acknowledged')}
                          className="px-2.5 py-1.5 text-xs font-bold text-blue-700 bg-blue-500/10 hover:bg-blue-500/20 rounded-lg transition-colors cursor-pointer"
                        >
                          Acknowledge
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setResolvingId(resolvingId === f.id ? null : f.id);
                          setResolutionNote('');
                        }}
                        className="px-2.5 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-lg transition-colors cursor-pointer"
                      >
                        Resolve
                      </button>
                    </div>

                    {exemptingId === f.id && (
                      <div className="flex items-center gap-1.5 mt-1">
                        <input
                          type="text"
                          value={discountReason}
                          onChange={(e) => setDiscountReason(e.target.value)}
                          placeholder="Scholarship / discount reason..."
                          className="text-xs border border-outline-variant rounded-lg px-2.5 py-1 w-48 bg-white"
                        />
                        <button
                          type="button"
                          onClick={() => handleApproveDiscount(f)}
                          className="px-2.5 py-1 text-xs font-bold bg-amber-600 text-white rounded-lg hover:bg-amber-700 cursor-pointer"
                        >
                          Exempt
                        </button>
                      </div>
                    )}

                    {resolvingId === f.id && (
                      <div className="flex items-center gap-1.5 mt-1">
                        <input
                          type="text"
                          value={resolutionNote}
                          onChange={(e) => setResolutionNote(e.target.value)}
                          placeholder="Resolution note..."
                          className="text-xs border border-outline-variant rounded-lg px-2.5 py-1 w-48 bg-white"
                        />
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(f, 'Resolved')}
                          className="px-2.5 py-1 text-xs font-bold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 cursor-pointer"
                        >
                          Confirm
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        )}

        {/* Pagination Bar */}
        {filteredFindings.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 rounded-xl bg-white/80 border border-outline-variant/80 text-xs">
            <span className="text-secondary font-data-tabular">
              Showing <strong>{(safePage - 1) * pageSize + 1}</strong>–
              <strong>{Math.min(safePage * pageSize, filteredFindings.length)}</strong> of{' '}
              <strong>{filteredFindings.length}</strong> findings
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={safePage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-outline-variant bg-white font-bold text-on-surface hover:bg-canvas disabled:opacity-40 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[15px]">chevron_left</span>
                Prev
              </button>
              <span className="px-3 py-1.5 font-bold font-data-tabular text-on-surface">
                Page {safePage} / {totalPages}
              </span>
              <button
                type="button"
                disabled={safePage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-outline-variant bg-white font-bold text-on-surface hover:bg-canvas disabled:opacity-40 cursor-pointer"
              >
                Next
                <span className="material-symbols-outlined text-[15px]">chevron_right</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Approved Discount Exemptions */}
      {financialAuditConfig?.approvedDiscounts && financialAuditConfig.approvedDiscounts.length > 0 && (
        <SectionCard
          title={`Approved Tuition Discount Exemptions (${financialAuditConfig.approvedDiscounts.length})`}
          subtitle="Students tagged here will not re-flag as course price variances"
          icon="local_offer"
        >
          <div className="space-y-2">
            {financialAuditConfig.approvedDiscounts.map((d) => (
              <div
                key={d.id}
                className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-canvas/70 border border-outline-variant/70 text-xs"
              >
                <div>
                  <span className="font-bold text-on-surface">{d.studentName}</span>{' '}
                  <span className="text-secondary">
                    ({d.courseTitle}) — Approved {formatNaira(d.approvedFee)} vs Catalog {formatNaira(d.catalogFee)} • {d.reason}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => updateFinancialAuditConfig({ removeDiscountId: d.id })}
                  className="text-[11px] font-bold text-red-600 hover:underline cursor-pointer shrink-0"
                >
                  Revoke
                </button>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Recent Scan Audit Log */}
      {financialAuditScans.length > 0 && (
        <SectionCard title={`Audit Scan History (${financialAuditScans.length})`} icon="history">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-canvas text-secondary uppercase text-[10px]">
                <tr>
                  <th className="px-3 py-2 text-left">Timestamp</th>
                  <th className="px-3 py-2 text-left">Triggered By</th>
                  <th className="px-3 py-2 text-right">Health Score</th>
                  <th className="px-3 py-2 text-right">Open Findings</th>
                  <th className="px-3 py-2 text-right">Cash Gap</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/50">
                {financialAuditScans.slice(0, 10).map((s) => (
                  <tr key={s.id}>
                    <td className="px-3 py-2 text-on-surface font-data-tabular">
                      {new Date(s.timestamp).toLocaleString()}
                    </td>
                    <td className="px-3 py-2 text-secondary">{s.triggeredBy}</td>
                    <td className="px-3 py-2 text-right font-bold font-data-tabular">{s.healthScore}%</td>
                    <td className="px-3 py-2 text-right font-data-tabular">
                      {s.totalFindings} ({s.criticalCount} crit)
                    </td>
                    <td className="px-3 py-2 text-right font-data-tabular font-bold text-red-600">
                      {formatNaira(s.moneyFlow?.cashReconciliationGap || 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      )}
    </div>
  );
};
