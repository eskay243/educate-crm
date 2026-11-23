import React, { useMemo, useState } from 'react';
import { formatNaira, useCRM } from '../../context/CRMContext';
import { AuditUserQuery } from '../../types/crm';

export const UserAuditQueryBannerAndModal: React.FC = () => {
  const { currentUser, myAuditQueries, respondToAuditQuery } = useCRM();
  const [activeQuery, setActiveQuery] = useState<AuditUserQuery | null>(null);
  const [responseText, setResponseText] = useState('');
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const pendingQueries = useMemo(
    () => (myAuditQueries || []).filter((q) => q.status === 'Pending'),
    [myAuditQueries]
  );

  if (!currentUser || pendingQueries.length === 0) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeQuery || !responseText.trim()) return;
    setIsSubmitting(true);
    try {
      const ok = await respondToAuditQuery(activeQuery.id, {
        responseText: responseText.trim(),
        evidenceUrls: evidenceUrl.trim() ? [evidenceUrl.trim()] : [],
      });
      if (ok) {
        setActiveQuery(null);
        setResponseText('');
        setEvidenceUrl('');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Subtle Kinetic Alert Banner for Queried Users */}
      <div className="bg-amber-50 border-b border-amber-200/90 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs text-amber-950">
          <span className="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-700 ring-1 ring-amber-500/30 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[18px]">fact_check</span>
          </span>
          <div>
            <span className="font-bold">Financial Audit Clarification Requested:</span>{' '}
            <span>
              You have {pendingQueries.length} pending audit quer{pendingQueries.length === 1 ? 'y' : 'ies'} requiring your explanation.
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setActiveQuery(pendingQueries[0])}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 text-white text-xs font-bold hover:bg-amber-700 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[15px]">reply</span>
          Respond Now
        </button>
      </div>

      {/* Scoped User Query Response Modal */}
      {activeQuery && (
        <div className="fixed inset-0 z-50 bg-on-surface/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-outline-variant shadow-xl max-w-lg w-full p-5 space-y-4">
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-outline-variant/60">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-700 ring-1 ring-amber-500/20 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">policy</span>
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-on-surface">
                    Audit Query Response • {activeQuery.caseNumber || 'Investigation'}
                  </h3>
                  <p className="text-[11px] text-secondary">
                    Requested by {activeQuery.createdBy} on {new Date(activeQuery.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveQuery(null)}
                className="p-1 rounded-lg text-secondary hover:bg-canvas cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-canvas border border-outline-variant/70 space-y-1.5 text-xs">
              <p className="font-bold text-on-surface">{activeQuery.caseTitle || 'Financial Reconciliation Query'}</p>
              <p className="text-on-surface">
                <strong>Question:</strong> {activeQuery.question}
              </p>
              {activeQuery.transactionContext && (
                <p className="text-[11px] text-secondary">{activeQuery.transactionContext}</p>
              )}
              {typeof activeQuery.deltaAmount === 'number' && activeQuery.deltaAmount !== 0 && (
                <p className="text-[11px] font-data-tabular font-bold text-red-600 pt-1">
                  Flagged Variance: {formatNaira(Math.abs(activeQuery.deltaAmount))}
                </p>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-secondary mb-1">
                  Your Explanation / Clarification
                </label>
                <textarea
                  rows={4}
                  required
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  placeholder="Provide transaction details, payment date, bank reference, or reason for price difference..."
                  className="w-full rounded-lg border border-outline-variant bg-white px-3 py-2 text-xs text-on-surface"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-secondary mb-1">
                  Optional Receipt / Bank Proof Link
                </label>
                <input
                  type="url"
                  value={evidenceUrl}
                  onChange={(e) => setEvidenceUrl(e.target.value)}
                  placeholder="https://... (Google Drive / Paystack receipt URL)"
                  className="w-full rounded-lg border border-outline-variant bg-white px-3 py-2 text-xs text-on-surface"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveQuery(null)}
                  className="px-3.5 py-2 rounded-lg border border-outline-variant bg-white text-xs font-bold text-on-surface hover:bg-canvas cursor-pointer"
                >
                  Later
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !responseText.trim()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-white text-xs font-bold hover:bg-primary/90 disabled:opacity-50 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">send</span>
                  {isSubmitting ? 'Submitting...' : 'Submit Official Response'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
