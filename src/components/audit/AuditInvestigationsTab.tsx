import React, { useMemo, useState } from 'react';
import { formatNaira, useCRM } from '../../context/CRMContext';
import { AuditInvestigationCase, AuditInvestigationStatus } from '../../types/crm';
import { SectionCard } from '../common/KineticUI';

interface Props {
  initialSelectedCaseId?: string | null;
}

const STATUS_BADGE: Record<AuditInvestigationStatus, string> = {
  Open: 'bg-blue-500/10 text-blue-700 border-blue-500/20',
  'Awaiting Response': 'bg-amber-500/10 text-amber-700 border-amber-500/20',
  'Under Review': 'bg-purple-500/10 text-purple-700 border-purple-500/20',
  Resolved: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20',
  Escalated: 'bg-red-500/10 text-red-700 border-red-500/20',
};

export const AuditInvestigationsTab: React.FC<Props> = ({ initialSelectedCaseId }) => {
  const {
    auditInvestigations,
    financialAuditFindings,
    staffUsers,
    mentors,
    createAuditInvestigation,
    updateAuditInvestigation,
    queryUserOnInvestigation,
  } = useCRM();

  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(initialSelectedCaseId || null);
  const [showNewCaseForm, setShowNewCaseForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSummary, setNewSummary] = useState('');
  const [selectedFindingIds, setSelectedFindingIds] = useState<string[]>([]);

  // Ask User form state
  const [targetUserKey, setTargetUserKey] = useState('');
  const [queryQuestion, setQueryQuestion] = useState('');
  const [isSendingQuery, setIsSendingQuery] = useState(false);

  // Timeline note & status update
  const [timelineNote, setTimelineNote] = useState('');
  const [resolveFindingsToo, setResolveFindingsToo] = useState(true);

  const selectedCase: AuditInvestigationCase | null = useMemo(() => {
    const id = selectedCaseId || auditInvestigations[0]?.id || null;
    return auditInvestigations.find((c) => c.id === id) || null;
  }, [auditInvestigations, selectedCaseId]);

  // Combine all queryable ERP users (staff + mentors)
  const queryableUsers = useMemo(() => {
    const list: Array<{ id: string; name: string; role: string; email?: string }> = [];
    const seen = new Set<string>();
    for (const u of staffUsers || []) {
      const key = u.id || u.email;
      if (!key || seen.has(key)) continue;
      seen.add(key);
      list.push({ id: u.id, name: u.name, role: u.role || 'staff', email: u.email });
    }
    for (const m of mentors || []) {
      const key = m.id || m.email;
      if (!key || seen.has(key)) continue;
      seen.add(key);
      list.push({ id: m.id, name: m.name, role: 'mentor', email: m.email });
    }
    return list;
  }, [staffUsers, mentors]);

  const openFindings = useMemo(
    () => (financialAuditFindings || []).filter((f) => f.status !== 'Resolved'),
    [financialAuditFindings]
  );

  const handleCreateCase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const created = await createAuditInvestigation({
      title: newTitle.trim(),
      summary: newSummary.trim(),
      findingIds: selectedFindingIds,
    });
    if (created) {
      setSelectedCaseId(created.id);
      setNewTitle('');
      setNewSummary('');
      setSelectedFindingIds([]);
      setShowNewCaseForm(false);
    }
  };

  const handleSendUserQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCase || !targetUserKey || !queryQuestion.trim()) return;
    const user = queryableUsers.find((u) => u.id === targetUserKey);
    if (!user) return;
    setIsSendingQuery(true);
    try {
      const ok = await queryUserOnInvestigation(selectedCase.id, {
        targetUserId: user.id,
        targetUserName: user.name,
        targetUserRole: user.role,
        targetUserEmail: user.email,
        question: queryQuestion.trim(),
        transactionContext: selectedCase.summary,
        deltaAmount: selectedCase.totalExposureNaira,
      });
      if (ok) {
        setQueryQuestion('');
        setTargetUserKey('');
      }
    } finally {
      setIsSendingQuery(false);
    }
  };

  const handleStatusChange = async (status: AuditInvestigationStatus) => {
    if (!selectedCase) return;
    await updateAuditInvestigation(selectedCase.id, {
      status,
      note: timelineNote.trim() || `Marked investigation as ${status}`,
      resolveLinkedFindings: status === 'Resolved' && resolveFindingsToo,
    });
    setTimelineNote('');
  };

  const handleAddNote = async () => {
    if (!selectedCase || !timelineNote.trim()) return;
    await updateAuditInvestigation(selectedCase.id, { note: timelineNote.trim() });
    setTimelineNote('');
  };

  return (
    <div className="space-y-5">
      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-on-surface">
            Audit Investigation Cases ({auditInvestigations.length})
          </h2>
          <p className="text-xs text-secondary">
            Group discrepancies into formal cases, query any ERP staff or mentor via Chat DM &amp; Bell Alert, and log evidence.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowNewCaseForm(!showNewCaseForm)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-white text-xs font-bold hover:bg-primary/90 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[16px]">{showNewCaseForm ? 'close' : 'add_circle'}</span>
          {showNewCaseForm ? 'Cancel' : 'Open New Investigation'}
        </button>
      </div>

      {/* New Investigation Form */}
      {showNewCaseForm && (
        <SectionCard title="Open Formal Audit Investigation" icon="policy">
          <form onSubmit={handleCreateCase} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-secondary mb-1">Investigation Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. November Cash Shortfall & Unmatched Tuition Deposits"
                  className="w-full rounded-lg border border-outline-variant bg-white px-3 py-2 text-xs text-on-surface"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-secondary mb-1">Summary / Scope</label>
                <input
                  type="text"
                  value={newSummary}
                  onChange={(e) => setNewSummary(e.target.value)}
                  placeholder="Brief objective for this investigation..."
                  className="w-full rounded-lg border border-outline-variant bg-white px-3 py-2 text-xs text-on-surface"
                />
              </div>
            </div>

            {openFindings.length > 0 && (
              <div>
                <label className="block text-[11px] font-bold text-secondary mb-1">
                  Link Open Discrepancies ({selectedFindingIds.length} selected)
                </label>
                <div className="max-h-40 overflow-y-auto rounded-lg border border-outline-variant/70 bg-canvas/60 p-2 space-y-1">
                  {openFindings.map((f) => {
                    const checked = selectedFindingIds.includes(f.id);
                    return (
                      <label
                        key={f.id}
                        className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-md hover:bg-white cursor-pointer text-xs"
                      >
                        <span className="flex items-center gap-2 min-w-0">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() =>
                              setSelectedFindingIds((prev) =>
                                checked ? prev.filter((id) => id !== f.id) : [...prev, f.id]
                              )
                            }
                          />
                          <span className="truncate font-medium text-on-surface">{f.title}</span>
                        </span>
                        <span className="font-data-tabular font-bold text-red-600 shrink-0">
                          {formatNaira(Math.abs(f.deltaAmount))}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-white text-xs font-bold hover:bg-primary/90 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">gavel</span>
                Create Investigation Case
              </button>
            </div>
          </form>
        </SectionCard>
      )}

      {/* Master-Detail Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Case List */}
        <div className="lg:col-span-4 space-y-2.5">
          {auditInvestigations.length === 0 ? (
            <SectionCard>
              <div className="py-10 text-center">
                <span className="material-symbols-outlined text-[36px] text-secondary/50">folder_open</span>
                <p className="text-xs font-bold text-on-surface mt-2">No Active Investigations</p>
                <p className="text-[11px] text-secondary mt-1">
                  Click &ldquo;Investigate / Ask User&rdquo; on any flagged discrepancy or open a new case above.
                </p>
              </div>
            </SectionCard>
          ) : (
            auditInvestigations.map((c) => {
              const isSelected = selectedCase?.id === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedCaseId(c.id)}
                  className={`w-full text-left p-4 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-white border-primary/60 shadow-[0_8px_20px_-8px_rgba(24,114,245,0.22)] ring-1 ring-primary/20'
                      : 'bg-white/75 border-outline-variant/80 hover:bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-[11px] font-mono font-bold text-primary">{c.caseNumber}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${STATUS_BADGE[c.status]}`}>
                      {c.status}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-on-surface line-clamp-2">{c.title}</p>
                  <div className="flex items-center justify-between mt-2 text-[11px] text-secondary">
                    <span>{c.queries.length} user quer{c.queries.length === 1 ? 'y' : 'ies'}</span>
                    <span className="font-data-tabular font-bold text-red-600">
                      {formatNaira(c.totalExposureNaira)}
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Right: Case Detail, Ask User & Timeline */}
        <div className="lg:col-span-8">
          {!selectedCase ? (
            <SectionCard>
              <p className="text-xs text-secondary py-12 text-center">Select an investigation case to inspect details and query users.</p>
            </SectionCard>
          ) : (
            <div className="space-y-4">
              <SectionCard
                title={`${selectedCase.caseNumber}: ${selectedCase.title}`}
                subtitle={`Opened ${new Date(selectedCase.createdAt).toLocaleString()} • Exposure: ${formatNaira(selectedCase.totalExposureNaira)}`}
                icon="policy"
                badge={
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${STATUS_BADGE[selectedCase.status]}`}>
                    {selectedCase.status}
                  </span>
                }
              >
                <p className="text-xs text-on-surface leading-relaxed">{selectedCase.summary}</p>

                {/* Status Actions */}
                <div className="mt-4 pt-3 border-t border-outline-variant/60 space-y-2.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="text"
                      value={timelineNote}
                      onChange={(e) => setTimelineNote(e.target.value)}
                      placeholder="Add investigator note or resolution reason..."
                      className="flex-1 min-w-[200px] rounded-lg border border-outline-variant bg-white px-3 py-1.5 text-xs text-on-surface"
                    />
                    <button
                      type="button"
                      onClick={handleAddNote}
                      disabled={!timelineNote.trim()}
                      className="px-3 py-1.5 rounded-lg border border-outline-variant bg-white text-xs font-bold text-on-surface hover:bg-canvas disabled:opacity-50 cursor-pointer"
                    >
                      Log Note
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label className="inline-flex items-center gap-1.5 text-[11px] text-secondary cursor-pointer">
                      <input
                        type="checkbox"
                        checked={resolveFindingsToo}
                        onChange={(e) => setResolveFindingsToo(e.target.checked)}
                      />
                      Auto-resolve linked audit findings when closing case
                    </label>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {(['Under Review', 'Escalated', 'Resolved'] as AuditInvestigationStatus[]).map((st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => handleStatusChange(st)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border cursor-pointer transition-colors ${STATUS_BADGE[st]}`}
                        >
                          Mark {st}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </SectionCard>

              {/* Ask Any User Query Dispatcher */}
              <SectionCard
                title="Ask Any ERP User for Clarification"
                subtitle="Automatically sends a Direct Message in Chat + Notification Bell Alert with a scoped proof-upload form"
                icon="contact_support"
              >
                <form onSubmit={handleSendUserQuery} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-1">
                      <label className="block text-[11px] font-bold text-secondary mb-1">Select User to Query</label>
                      <select
                        required
                        value={targetUserKey}
                        onChange={(e) => setTargetUserKey(e.target.value)}
                        className="w-full rounded-lg border border-outline-variant bg-white px-3 py-2 text-xs text-on-surface"
                      >
                        <option value="">Choose Staff / Mentor...</option>
                        {queryableUsers.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name} ({u.role})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-bold text-secondary mb-1">Audit Question</label>
                      <input
                        type="text"
                        required
                        value={queryQuestion}
                        onChange={(e) => setQueryQuestion(e.target.value)}
                        placeholder="e.g. Please explain the ₦120,000 variance on this deposit and attach the bank receipt."
                        className="w-full rounded-lg border border-outline-variant bg-white px-3 py-2 text-xs text-on-surface"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={isSendingQuery || !targetUserKey || !queryQuestion.trim()}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-white text-xs font-bold hover:bg-primary/90 disabled:opacity-50 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">send</span>
                      {isSendingQuery ? 'Dispatching Query...' : 'Send Query via Chat & Alert'}
                    </button>
                  </div>
                </form>

                {/* Queries & User Responses */}
                {selectedCase.queries.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-outline-variant/60 space-y-2.5">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-secondary">
                      Dispatched User Queries ({selectedCase.queries.length})
                    </p>
                    {selectedCase.queries.map((q) => (
                      <div key={q.id} className="p-3 rounded-lg bg-canvas/70 border border-outline-variant/70 space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-on-surface">
                            To: {q.targetUserName} <span className="text-secondary font-normal">({q.targetUserRole})</span>
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              q.status === 'Responded'
                                ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20'
                                : 'bg-amber-500/10 text-amber-700 border-amber-500/20'
                            }`}
                          >
                            {q.status}
                          </span>
                        </div>
                        <p className="text-xs text-on-surface">Q: {q.question}</p>
                        {q.responseText ? (
                          <div className="mt-1.5 p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-900">
                            <p className="font-bold text-[11px] text-emerald-800">
                              Response ({q.respondedAt ? new Date(q.respondedAt).toLocaleString() : ''}):
                            </p>
                            <p className="mt-0.5">{q.responseText}</p>
                            {q.evidenceUrls && q.evidenceUrls.length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-1.5">
                                {q.evidenceUrls.map((url, idx) => (
                                  <a
                                    key={idx}
                                    href={url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 underline"
                                  >
                                    <span className="material-symbols-outlined text-[14px]">attach_file</span>
                                    Evidence #{idx + 1}
                                  </a>
                                ))}
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="text-[11px] text-secondary italic">Awaiting user explanation...</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </SectionCard>

              {/* Chronological Investigation Timeline */}
              <SectionCard title="Investigation Audit Trail" icon="history">
                <div className="space-y-2.5">
                  {selectedCase.timeline.map((t) => (
                    <div key={t.id} className="flex items-start gap-3 text-xs">
                      <span className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-on-surface">
                            {t.action} <span className="font-normal text-secondary">by {t.actor}</span>
                          </span>
                          <span className="text-[10px] text-secondary font-data-tabular shrink-0">
                            {new Date(t.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-secondary mt-0.5">{t.note}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </SectionCard>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
