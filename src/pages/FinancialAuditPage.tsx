import React, { useState } from 'react';
import { Bot, Scale, ShieldAlert } from 'lucide-react';
import { useCRM } from '../context/CRMContext';
import { FinancialAuditAgentPanel } from '../components/audit/FinancialAuditAgentPanel';
import { MentorReconciliationTab } from '../components/mentors/MentorReconciliationTab';

export const FinancialAuditPage: React.FC = () => {
  const { currentUser } = useCRM();
  const [subTab, setSubTab] = useState<'agent' | 'reconciliation'>('agent');

  if (currentUser?.role !== 'super_admin') {
    return (
      <div className="p-8 max-w-xl mx-auto">
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-8 text-center">
          <ShieldAlert className="w-10 h-10 text-rose-600 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-rose-900">Restricted to Super Admin</h2>
          <p className="text-sm text-rose-700 mt-1">
            The Financial Audit &amp; Commission Reconciliation suite is strictly available to Super Admin accounts.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Super Admin Financial Audit</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            AI money-flow auditing, discrepancy logging, backdated cohort migration, and 37% mentor commission reconciliation.
          </p>
        </div>
        <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200">
          <button
            type="button"
            onClick={() => setSubTab('agent')}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              subTab === 'agent' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Bot className="w-4 h-4" />
            AI Audit Agent
          </button>
          <button
            type="button"
            onClick={() => setSubTab('reconciliation')}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              subTab === 'reconciliation' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Scale className="w-4 h-4" />
            Commission &amp; Backdated Migration
          </button>
        </div>
      </div>

      {subTab === 'agent' ? <FinancialAuditAgentPanel /> : <MentorReconciliationTab />}
    </div>
  );
};
