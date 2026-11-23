import React, { useState } from 'react';
import { useCRM } from '../context/CRMContext';
import { FinancialAuditAgentPanel } from '../components/audit/FinancialAuditAgentPanel';
import { CompanyAccountsReconcileTab } from '../components/audit/CompanyAccountsReconcileTab';
import { AuditInvestigationsTab } from '../components/audit/AuditInvestigationsTab';
import { AuditReportsTab } from '../components/audit/AuditReportsTab';
import { MentorReconciliationTab } from '../components/mentors/MentorReconciliationTab';
import { PageHeader, SectionCard } from '../components/common/KineticUI';

type AuditSubTab = 'agent' | 'accounts' | 'investigations' | 'reports' | 'reconciliation';

export const FinancialAuditPage: React.FC = () => {
  const {
    currentUser,
    financialAuditScan,
    auditInvestigations,
    financialAuditReports,
    runFinancialAudit,
  } = useCRM();

  const [subTab, setSubTab] = useState<AuditSubTab>('agent');
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  if (currentUser?.role !== 'super_admin') {
    return (
      <div className="p-6 max-w-xl mx-auto">
        <SectionCard>
          <div className="py-8 text-center">
            <span className="material-symbols-outlined text-[40px] text-red-600">gpp_bad</span>
            <h2 className="text-lg font-extrabold text-on-surface mt-2">Restricted to Super Admin</h2>
            <p className="text-xs text-secondary mt-1">
              The AI Financial Audit, Company Account Reconciliation &amp; Investigation Suite is strictly available to Super Admin accounts.
            </p>
          </div>
        </SectionCard>
      </div>
    );
  }

  const healthScore = financialAuditScan?.healthScore ?? 100;
  const openCasesCount = (auditInvestigations || []).filter((c) => c.status !== 'Resolved').length;

  const handleRunScan = async () => {
    setIsScanning(true);
    try {
      await runFinancialAudit();
    } finally {
      setIsScanning(false);
    }
  };

  const handleOpenInvestigationCase = (caseId: string) => {
    setSelectedCaseId(caseId);
    setSubTab('investigations');
  };

  const tabs: Array<{ id: AuditSubTab; label: string; icon: string; badge?: number }> = [
    { id: 'agent', label: 'Money Flow & Discrepancies', icon: 'monitoring', badge: financialAuditScan?.totalFindings },
    { id: 'accounts', label: 'Company Accounts & PDF/CSV', icon: 'account_balance' },
    { id: 'investigations', label: 'Investigations & Queries', icon: 'policy', badge: openCasesCount },
    { id: 'reports', label: 'Forensic Reports', icon: 'summarize', badge: financialAuditReports.length },
    { id: 'reconciliation', label: '37% Commission & Migration', icon: 'balance' },
  ];

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-7xl mx-auto">
      <PageHeader
        title="AI Financial Audit & Reconciliation"
        subtitle="5-layer ERP money-flow auditing, hybrid Paystack & Nigerian bank reconciliation, user investigations, and forensic reporting."
        badgeText={`Audit Health: ${healthScore}%`}
        badgeIntent={healthScore >= 85 ? 'emerald' : healthScore >= 60 ? 'amber' : 'red'}
        badgePulse={healthScore < 85}
        metaText={
          financialAuditScan
            ? `Last scan ${new Date(financialAuditScan.timestamp).toLocaleString()} • ${financialAuditScan.triggeredBy}`
            : 'Super Admin Exclusive'
        }
        actions={
          <div className="flex items-center gap-2 print:hidden">
            <button
              type="button"
              onClick={() => setSubTab('reports')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-outline-variant bg-white text-xs font-bold text-on-surface hover:bg-canvas cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">description</span>
              Forensic Reports
            </button>
            <button
              type="button"
              onClick={handleRunScan}
              disabled={isScanning}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-white text-xs font-bold hover:bg-primary/90 disabled:opacity-50 cursor-pointer shadow-sm"
            >
              <span className={`material-symbols-outlined text-[16px] ${isScanning ? 'animate-spin' : ''}`}>
                refresh
              </span>
              {isScanning ? 'Running 5-Layer Scan...' : 'Run 5-Layer Audit Scan'}
            </button>
          </div>
        }
      />

      {/* Kinetic Segmented Navigation */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 print:hidden">
        {tabs.map((tab) => {
          const active = subTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSubTab(tab.id)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer border ${
                active
                  ? 'bg-primary text-white border-primary shadow-[0_6px_16px_-6px_rgba(24,114,245,0.45)]'
                  : 'bg-white/80 text-secondary border-outline-variant/80 hover:text-on-surface hover:bg-white'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">{tab.icon}</span>
              {tab.label}
              {typeof tab.badge === 'number' && tab.badge > 0 && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold font-data-tabular ${
                    active ? 'bg-white/20 text-white' : 'bg-canvas text-on-surface'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Active View */}
      {subTab === 'agent' && (
        <FinancialAuditAgentPanel onOpenInvestigationCase={handleOpenInvestigationCase} />
      )}
      {subTab === 'accounts' && <CompanyAccountsReconcileTab />}
      {subTab === 'investigations' && (
        <AuditInvestigationsTab initialSelectedCaseId={selectedCaseId} />
      )}
      {subTab === 'reports' && <AuditReportsTab />}
      {subTab === 'reconciliation' && <MentorReconciliationTab />}
    </div>
  );
};
