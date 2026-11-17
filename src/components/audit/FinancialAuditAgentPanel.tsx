import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  Bot,
  CheckCircle2,
  Clock,
  Info,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  TrendingDown
} from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { FinancialAuditFinding } from '../../types/crm';

const formatNaira = (amount: number) => `₦${Number(amount || 0).toLocaleString()}`;

export const FinancialAuditAgentPanel: React.FC = () => {
  const {
    currentUser,
    financialAuditScan,
    financialAuditScans,
    financialAuditFindings,
    fetchFinancialAudit,
    runFinancialAudit,
    updateFinancialAuditFinding
  } = useCRM();

  const [isScanning, setIsScanning] = useState(false);
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('OPEN_ONLY');
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [resolutionNote, setResolutionNote] = useState<string>('');

  const isSuperAdmin = currentUser?.role === 'super_admin';

  useEffect(() => {
    if (isSuperAdmin) {
      fetchFinancialAudit();
    }
  }, [isSuperAdmin, fetchFinancialAudit]);

  const handleRunScan = async () => {
    setIsScanning(true);
    try {
      await runFinancialAudit();
    } finally {
      setIsScanning(false);
    }
  };

  const handleUpdateStatus = async (finding: FinancialAuditFinding, status: 'Acknowledged' | 'Resolved') => {
    await updateFinancialAuditFinding(finding.id, {
      status,
      resolutionNote: status === 'Resolved' ? resolutionNote.trim() || 'Reviewed and resolved by Super Admin' : undefined
    });
    setResolvingId(null);
    setResolutionNote('');
  };

  const filteredFindings = useMemo(() => {
    return (financialAuditFindings || []).filter(f => {
      if (severityFilter !== 'ALL' && f.severity !== severityFilter) return false;
      if (statusFilter === 'OPEN_ONLY' && f.status === 'Resolved') return false;
      if (statusFilter === 'Resolved' && f.status !== 'Resolved') return false;
      return true;
    });
  }, [financialAuditFindings, severityFilter, statusFilter]);

  if (!isSuperAdmin) {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-xl p-6 text-center">
        <ShieldAlert className="w-8 h-8 text-rose-600 mx-auto mb-2" />
        <h3 className="text-sm font-bold text-rose-900">Super Admin Access Only</h3>
        <p className="text-xs text-rose-700 mt-1">
          The AI Financial Audit Agent is restricted exclusively to Super Admin accounts.
        </p>
      </div>
    );
  }

  const flow = financialAuditScan?.moneyFlow;
  const healthScore = financialAuditScan?.healthScore ?? 100;

  return (
    <div className="space-y-6">
      {/* AI Audit Agent Header */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-md flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center shrink-0">
            <Bot className="w-6 h-6 text-indigo-300" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-bold tracking-tight">AI Financial Audit Agent</h2>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-500/20 text-indigo-200 border border-indigo-400/30">
                <Sparkles className="w-3 h-3" /> Super Admin Exclusive
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              Continuously audits student tuition received, 37% mentor commission accruals, and bank/Paystack disbursements — automatically flagging outliers, over-disbursements, and unlinked deposits.
            </p>
            {financialAuditScan && (
              <p className="text-[11px] text-slate-400 mt-2">
                Last Scan: {new Date(financialAuditScan.timestamp).toLocaleString()} • Triggered by {financialAuditScan.triggeredBy}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Audit Health</p>
            <p className={`text-2xl font-extrabold ${
              healthScore >= 85 ? 'text-emerald-400' : healthScore >= 60 ? 'text-amber-400' : 'text-rose-400'
            }`}>
              {healthScore}%
            </p>
          </div>
          <button
            type="button"
            onClick={handleRunScan}
            disabled={isScanning}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-colors disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
            {isScanning ? 'Scanning Ledger...' : 'Run AI Audit Scan'}
          </button>
        </div>
      </div>

      {/* Money Flow Pipeline */}
      {flow && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <p className="text-xs font-semibold text-slate-500 uppercase">Tuition Billed</p>
            <p className="text-lg font-bold text-slate-900 mt-1">{formatNaira(flow.totalTuitionBilled)}</p>
            <p className="text-[11px] text-slate-400 mt-1">Total CRM student fees</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <p className="text-xs font-semibold text-slate-500 uppercase">Payments Received</p>
            <p className="text-lg font-bold text-indigo-700 mt-1">{formatNaira(flow.totalStudentPaymentsReceived)}</p>
            <p className="text-[11px] text-slate-400 mt-1">Verified deposits</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <p className="text-xs font-semibold text-slate-500 uppercase">37% Commission Due</p>
            <p className="text-lg font-bold text-slate-900 mt-1">{formatNaira(flow.totalAgreedCommissionDue)}</p>
            <p className="text-[11px] text-slate-400 mt-1">Formula: {formatNaira(flow.totalExpectedCommission37)}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <p className="text-xs font-semibold text-slate-500 uppercase">Payments Disbursed</p>
            <p className="text-lg font-bold text-emerald-700 mt-1">{formatNaira(flow.totalDisbursedToMentors)}</p>
            <p className="text-[11px] text-slate-400 mt-1">Outstanding: {formatNaira(flow.totalOutstandingPayable)}</p>
          </div>
          <div className="bg-white border border-rose-200 rounded-xl p-4 shadow-sm bg-rose-50/30">
            <p className="text-xs font-semibold text-rose-700 uppercase flex items-center gap-1">
              <TrendingDown className="w-3.5 h-3.5" /> Flagged Exposure
            </p>
            <p className="text-lg font-bold text-rose-700 mt-1">{formatNaira(flow.netDiscrepancyExposure)}</p>
            <p className="text-[11px] text-rose-600 mt-1">
              {financialAuditScan?.criticalCount || 0} critical • {financialAuditScan?.warningCount || 0} warnings
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-600">Discrepancy Log ({filteredFindings.length})</span>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={severityFilter}
            onChange={e => setSeverityFilter(e.target.value)}
            className="text-xs border border-slate-200 rounded-lg px-3 py-1.5 bg-white font-semibold"
          >
            <option value="ALL">All Severities</option>
            <option value="Critical">Critical Only</option>
            <option value="Warning">Warnings Only</option>
            <option value="Info">Info Only</option>
          </select>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="text-xs border border-slate-200 rounded-lg px-3 py-1.5 bg-white font-semibold"
          >
            <option value="OPEN_ONLY">Open &amp; Acknowledged</option>
            <option value="ALL">All Statuses</option>
            <option value="Resolved">Resolved Only</option>
          </select>
        </div>
      </div>

      {/* Findings List */}
      <div className="space-y-3">
        {filteredFindings.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-10 text-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-800">No Discrepancies Matching Filters</p>
            <p className="text-xs text-slate-500 mt-1">All money-flow checks in this view are clean.</p>
          </div>
        ) : (
          filteredFindings.map(f => (
            <div
              key={f.id}
              className={`bg-white border rounded-xl p-4 shadow-sm transition-all ${
                f.status === 'Resolved'
                  ? 'border-slate-200 opacity-75'
                  : f.severity === 'Critical'
                    ? 'border-rose-300'
                    : f.severity === 'Warning'
                      ? 'border-amber-300'
                      : 'border-slate-200'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    {f.severity === 'Critical' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800">
                        <AlertOctagon className="w-3 h-3" /> Critical
                      </span>
                    ) : f.severity === 'Warning' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
                        <AlertTriangle className="w-3 h-3" /> Warning
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-sky-100 text-sky-800">
                        <Info className="w-3 h-3" /> Info
                      </span>
                    )}
                    <span className="text-[11px] font-mono text-slate-400">{f.ruleCode}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      f.status === 'Resolved'
                        ? 'bg-emerald-100 text-emerald-700'
                        : f.status === 'Acknowledged'
                          ? 'bg-indigo-100 text-indigo-700'
                          : 'bg-slate-100 text-slate-700'
                    }`}>
                      {f.status}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900">{f.title}</h4>
                  <p className="text-xs text-slate-700 leading-relaxed">{f.aiDiagnosis}</p>
                  <p className="text-xs text-indigo-700 font-medium">
                    Recommended Action: {f.recommendedAction}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 pt-1 text-[11px] text-slate-500 font-mono">
                    <span>Expected: <strong className="text-slate-800">{formatNaira(f.expectedAmount)}</strong></span>
                    <span>Actual: <strong className="text-slate-800">{formatNaira(f.actualAmount)}</strong></span>
                    <span>Delta: <strong className="text-rose-700">{formatNaira(f.deltaAmount)}</strong></span>
                  </div>

                  {f.resolutionNote && (
                    <p className="text-[11px] text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg inline-block mt-1">
                      Resolution: {f.resolutionNote} ({f.resolvedBy})
                    </p>
                  )}
                </div>

                {f.status !== 'Resolved' && (
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <div className="flex items-center gap-1.5">
                      {f.status === 'Open' && (
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(f, 'Acknowledged')}
                          className="px-2.5 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
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
                        className="px-2.5 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors"
                      >
                        Resolve
                      </button>
                    </div>
                    {resolvingId === f.id && (
                      <div className="flex items-center gap-1.5 mt-1">
                        <input
                          type="text"
                          value={resolutionNote}
                          onChange={e => setResolutionNote(e.target.value)}
                          placeholder="Resolution note..."
                          className="text-xs border border-slate-200 rounded-lg px-2.5 py-1 w-44"
                        />
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(f, 'Resolved')}
                          className="px-2.5 py-1 text-xs font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
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
      </div>

      {/* Recent Scan Audit Log */}
      {financialAuditScans.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="px-4 py-3 border-b border-slate-200 flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-500" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Audit Scan History ({financialAuditScans.length})
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px]">
                <tr>
                  <th className="px-4 py-2 text-left">Timestamp</th>
                  <th className="px-4 py-2 text-left">Triggered By</th>
                  <th className="px-4 py-2 text-right">Health Score</th>
                  <th className="px-4 py-2 text-right">Open Findings</th>
                  <th className="px-4 py-2 text-right">Exposure</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {financialAuditScans.slice(0, 10).map(s => (
                  <tr key={s.id}>
                    <td className="px-4 py-2 text-slate-700">{new Date(s.timestamp).toLocaleString()}</td>
                    <td className="px-4 py-2 text-slate-600">{s.triggeredBy}</td>
                    <td className="px-4 py-2 text-right font-bold">{s.healthScore}%</td>
                    <td className="px-4 py-2 text-right">{s.totalFindings} ({s.criticalCount} crit)</td>
                    <td className="px-4 py-2 text-right font-mono text-rose-700">{formatNaira(s.moneyFlow?.netDiscrepancyExposure || 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
