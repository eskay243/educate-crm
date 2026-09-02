import React, { useState, useMemo } from 'react';
import { useCRM, formatNaira } from '../context/CRMContext';
import { LeadStatus } from '../types/crm';

export const LeadManagementPage: React.FC = () => {
  const { leads, updateLeadStatus, convertLeadToStudent, openModal, globalSearch } = useCRM();

  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('kanban');
  const [tableSearch, setTableSearch] = useState('');
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<string>('All');
  
  // Drag and drop state
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<LeadStatus | null>(null);

  // Note / Activity modal
  const [noteModalLeadId, setNoteModalLeadId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');

  // Loss Reason dialog
  const [lossModalLeadId, setLossModalLeadId] = useState<string | null>(null);
  const [lossReason, setLossReason] = useState('Price / Budget Constraint');

  const effectiveSearch = globalSearch || tableSearch;

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const matchesTab = activeTab === 'All' || lead.status === activeTab;
      const matchesSearch = 
        lead.name.toLowerCase().includes(effectiveSearch.toLowerCase()) ||
        lead.email.toLowerCase().includes(effectiveSearch.toLowerCase()) ||
        lead.company?.toLowerCase().includes(effectiveSearch.toLowerCase()) ||
        lead.programInterest.toLowerCase().includes(effectiveSearch.toLowerCase()) ||
        lead.source.toLowerCase().includes(effectiveSearch.toLowerCase());
      return matchesTab && matchesSearch;
    });
  }, [leads, activeTab, effectiveSearch]);

  const toggleSelectAll = () => {
    if (selectedLeads.length === filteredLeads.length) {
      setSelectedLeads([]);
    } else {
      setSelectedLeads(filteredLeads.map(l => l.id));
    }
  };

  const toggleSelectLead = (id: string) => {
    setSelectedLeads(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const getStatusBadge = (status: LeadStatus) => {
    switch (status) {
      case 'Qualified':
        return 'bg-[#E8F5E9] text-[#1B5E20]';
      case 'Negotiation':
        return 'bg-[#FFF3E0] text-[#E65100]';
      case 'Discovery':
        return 'bg-[#E3F2FD] text-[#0D47A1]';
      case 'Overdue':
        return 'bg-[#FFEBEE] text-[#B71C1C]';
      case 'Converted':
        return 'bg-emerald-100 text-emerald-800';
      case 'Lost':
        return 'bg-rose-100 text-rose-800';
      default:
        return 'bg-surface-container text-on-surface';
    }
  };

  const kanbanStages: { stage: LeadStatus; title: string; color: string; bgAccent: string }[] = [
    { stage: 'New', title: 'New Leads', color: 'border-blue-400', bgAccent: 'bg-blue-50/50' },
    { stage: 'Discovery', title: 'Discovery Call', color: 'border-sky-500', bgAccent: 'bg-sky-50/50' },
    { stage: 'Negotiation', title: 'Negotiation', color: 'border-amber-500', bgAccent: 'bg-amber-50/50' },
    { stage: 'Qualified', title: 'Qualified Ready', color: 'border-emerald-500', bgAccent: 'bg-emerald-50/50' },
    { stage: 'Converted', title: 'Enrolled Students', color: 'border-indigo-600', bgAccent: 'bg-indigo-50/50' },
    { stage: 'Lost', title: 'Disqualified / Lost', color: 'border-rose-400', bgAccent: 'bg-rose-50/50' },
  ];

  const handleStageMove = (leadId: string, newStage: LeadStatus) => {
    if (newStage === 'Lost') {
      setLossModalLeadId(leadId);
    } else if (newStage === 'Converted') {
      const targetLead = leads.find(l => l.id === leadId);
      convertLeadToStudent(leadId, targetLead?.programInterest || 'Full-Stack Software Engineering', 'Dr. Arthur Pendelton');
    } else {
      updateLeadStatus(leadId, newStage);
    }
  };

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    e.dataTransfer.setData('text/plain', leadId);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedLeadId(leadId);
  };

  const handleDragOver = (e: React.DragEvent, stage: LeadStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverStage !== stage) {
      setDragOverStage(stage);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetStage: LeadStatus) => {
    e.preventDefault();
    const leadId = e.dataTransfer.getData('text/plain') || draggedLeadId;
    setDragOverStage(null);
    setDraggedLeadId(null);
    if (leadId) {
      handleStageMove(leadId, targetStage);
    }
  };

  const confirmLossReason = () => {
    if (lossModalLeadId) {
      updateLeadStatus(lossModalLeadId, 'Lost', lossReason);
      setLossModalLeadId(null);
    }
  };

  return (
    <div className="space-y-stack-lg animate-in fade-in duration-200">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-stack-md">
        <div>
          <h1 className="font-display text-display text-on-surface">Lead Pipeline &amp; Admissions</h1>
          <p className="font-body-lg text-body-lg text-secondary mt-unit">Manage prospective student inquiries, corporate deals, and drag-and-drop conversion stages.</p>
        </div>
        <div className="flex items-center gap-stack-sm flex-wrap">
          {/* View Mode Toggle */}
          <div className="flex border border-outline-variant rounded p-1 bg-surface shadow-xs">
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-1 rounded text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'kanban' ? 'bg-primary text-on-primary shadow-xs' : 'text-secondary hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">view_kanban</span>
              <span>Kanban Board</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1 rounded text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'table' ? 'bg-primary text-on-primary shadow-xs' : 'text-secondary hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">view_list</span>
              <span>Table Roster</span>
            </button>
          </div>

          <button 
            onClick={() => setActiveTab(activeTab === 'All' ? 'Qualified' : 'All')}
            className={`h-10 px-4 rounded border border-outline-variant font-label-md text-label-md transition-colors flex items-center gap-unit shadow-xs ${
              activeTab !== 'All' ? 'bg-secondary-container text-primary font-bold' : 'bg-surface text-secondary hover:bg-surface-container-low'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">filter_list</span>
            <span>Filter ({activeTab})</span>
          </button>
          <button 
            onClick={() => openModal('add-lead')}
            className="h-10 px-4 rounded bg-primary text-on-primary hover:bg-surface-tint font-label-md text-label-md font-bold transition-colors flex items-center gap-unit shadow-xs"
          >
            <span className="material-symbols-outlined text-[18px]">person_add</span>
            <span>Add Lead</span>
          </button>
        </div>
      </div>

      {/* Stats Overview Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
        <div className="bg-surface rounded-xl border border-outline-variant p-stack-md shadow-xs">
          <div className="flex justify-between items-start mb-stack-sm">
            <span className="text-secondary font-label-md text-label-md">Total Active Leads</span>
            <span className="material-symbols-outlined text-primary-container">groups</span>
          </div>
          <div className="font-headline-lg text-headline-lg font-bold text-on-surface">{leads.length}</div>
          <div className="mt-2 flex items-center gap-1 text-xs text-secondary">
            <span className="material-symbols-outlined text-[14px] text-[#006A60]">trending_up</span>
            <span className="text-[#006A60] font-medium">+18%</span> intake velocity
          </div>
        </div>

        <div className="bg-surface rounded-xl border border-outline-variant p-stack-md shadow-xs">
          <div className="flex justify-between items-start mb-stack-sm">
            <span className="text-secondary font-label-md text-label-md">Active Pipeline Value</span>
            <span className="material-symbols-outlined text-primary-container">payments</span>
          </div>
          <div className="font-headline-lg text-headline-lg font-bold text-on-surface">₦3,250,000</div>
          <div className="mt-2 flex items-center gap-1 text-xs text-secondary">
            <span className="material-symbols-outlined text-[14px] text-[#006A60]">trending_up</span>
            <span className="text-[#006A60] font-medium">+₦450K</span> qualified corporate deals
          </div>
        </div>

        <div className="bg-surface rounded-xl border border-outline-variant p-stack-md shadow-xs">
          <div className="flex justify-between items-start mb-stack-sm">
            <span className="text-secondary font-label-md text-label-md">Needs Action &amp; Follow-up</span>
            <span className="material-symbols-outlined text-error">notification_important</span>
          </div>
          <div className="font-headline-lg text-headline-lg font-bold text-on-surface">
            {leads.filter(l => l.status === 'Overdue' || l.status === 'New').length}
          </div>
          <div className="mt-2 flex items-center gap-1 text-xs text-secondary">
            <span className="material-symbols-outlined text-[14px] text-error">priority_high</span>
            <span className="text-error font-medium">Pending intake response</span>
          </div>
        </div>
      </div>

      {/* View 1: Drag-and-Drop Kanban Board */}
      {viewMode === 'kanban' && (
        <div>
          <div className="mb-2 text-xs text-secondary flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px] text-primary">drag_indicator</span>
            <span>Tip: Drag and drop any prospect card between columns to change stages or enroll.</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 overflow-x-auto pb-4">
            {kanbanStages.map(({ stage, title, color }) => {
              const stageLeads = filteredLeads.filter(l => l.status === stage);
              const isOverThisStage = dragOverStage === stage;

              return (
                <div
                  key={stage}
                  onDragOver={(e) => handleDragOver(e, stage)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, stage)}
                  className={`border-2 rounded-lg flex flex-col min-w-[240px] max-h-[780px] transition-all ${
                    isOverThisStage 
                      ? 'border-primary bg-primary-container/15 ring-2 ring-primary/40 shadow-md scale-[1.01]' 
                      : 'border-outline-variant bg-surface-container-low/50'
                  }`}
                >
                  {/* Column Header */}
                  <div className={`p-3 border-b-2 ${color} bg-surface rounded-t-lg flex justify-between items-center`}>
                    <h4 className="font-label-md text-xs font-bold text-on-surface">{title}</h4>
                    <span className="px-2 py-0.5 rounded-full bg-surface-container text-secondary text-[11px] font-bold">
                      {stageLeads.length}
                    </span>
                  </div>

                  {/* Cards Container */}
                  <div className="p-2 space-y-2 overflow-y-auto flex-1 min-h-[140px]">
                    {stageLeads.length === 0 ? (
                      <div className="h-28 flex flex-col items-center justify-center text-center p-3 rounded border border-dashed border-outline-variant/80 text-xs text-secondary italic bg-surface/40">
                        <span className="material-symbols-outlined text-[20px] mb-1 opacity-40">move_to_inbox</span>
                        <span>Drop leads here</span>
                      </div>
                    ) : (
                      stageLeads.map(lead => {
                        const isBeingDragged = draggedLeadId === lead.id;
                        return (
                          <div
                            key={lead.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, lead.id)}
                            onDragEnd={() => { setDraggedLeadId(null); setDragOverStage(null); }}
                            className={`p-3 bg-surface rounded-lg border border-outline-variant hover:border-primary cursor-grab active:cursor-grabbing transition-all shadow-xs space-y-2 ${
                              isBeingDragged ? 'opacity-40 scale-95 border-dashed border-primary' : 'hover:shadow-sm'
                            }`}
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-outline text-[14px]">drag_indicator</span>
                                <span className="font-bold text-xs text-on-surface">{lead.name}</span>
                              </div>
                              {lead.dealValue && (
                                <span className="font-mono text-[11px] font-bold text-primary">{formatNaira(lead.dealValue)}</span>
                              )}
                            </div>

                            <p className="text-[11px] text-secondary truncate font-semibold">{lead.company}</p>
                            <p className="text-[11px] text-secondary truncate">{lead.programInterest}</p>

                            <div className="flex items-center justify-between pt-2 border-t border-outline-variant/60 text-[10px]">
                              <span className="text-secondary font-medium">Rep: {lead.assignedRep.split(' ')[0]}</span>
                              <span className="font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                                Score: {lead.score}
                              </span>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center justify-between pt-1 gap-1">
                              <button
                                onClick={() => {
                                  setNoteModalLeadId(lead.id);
                                  setNoteText('');
                                }}
                                className="text-secondary hover:text-primary p-1 text-[11px] rounded hover:bg-surface-container"
                                title="Add Touchpoint Note"
                              >
                                <span className="material-symbols-outlined text-[16px]">edit_note</span>
                              </button>
                              
                              <div className="flex items-center gap-1">
                                {stage !== 'Converted' && (
                                  <button
                                    onClick={() => convertLeadToStudent(lead.id, lead.programInterest, 'Dr. Arthur Pendelton')}
                                    className="px-2 py-0.5 bg-primary text-on-primary rounded text-[10px] font-bold shadow-xs hover:bg-primary-container"
                                    title="Quick Convert to Student"
                                  >
                                    Enroll ✓
                                  </button>
                                )}
                                {stage !== 'Lost' && (
                                  <button
                                    onClick={() => handleStageMove(lead.id, 'Lost')}
                                    className="px-1.5 py-0.5 bg-error-container text-on-error-container rounded text-[10px] hover:bg-error/30"
                                    title="Mark Lost"
                                  >
                                    ✕
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* View 2: Table View */}
      {viewMode === 'table' && (
        <div className="bg-surface rounded-xl border border-outline-variant overflow-hidden shadow-xs">
          <div className="p-stack-md border-b border-outline-variant flex flex-col sm:flex-row sm:items-center justify-between gap-stack-sm bg-surface-container-low/40">
            <div className="flex items-center gap-stack-sm">
              <span className="font-headline-md text-headline-md font-bold text-on-surface">Prospect Roster</span>
              <span className="text-body-sm text-secondary">({filteredLeads.length} total)</span>
            </div>
            <div className="relative w-full sm:w-72">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">
                search
              </span>
              <input
                type="text"
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                placeholder="Search by name, company, or program..."
                className="w-full h-9 pl-9 pr-3 rounded bg-surface border border-outline-variant text-body-sm focus:border-primary outline-none"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="border-b border-outline-variant bg-surface-container-low text-secondary font-label-md text-label-md">
                  <th className="p-stack-md w-10">
                    <input 
                      type="checkbox" 
                      onChange={toggleSelectAll}
                      checked={selectedLeads.length === filteredLeads.length && filteredLeads.length > 0}
                      className="rounded border-outline-variant text-primary focus:ring-primary"
                    />
                  </th>
                  <th className="p-stack-md">Lead / Prospect</th>
                  <th className="p-stack-md">Company</th>
                  <th className="p-stack-md">Status</th>
                  <th className="p-stack-md">Deal Value</th>
                  <th className="p-stack-md">Source</th>
                  <th className="p-stack-md">Assigned Rep</th>
                  <th className="p-stack-md text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/60 font-body-md text-body-md text-on-surface">
                {filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-surface-container-low/50 transition-colors">
                    <td className="p-stack-md">
                      <input 
                        type="checkbox" 
                        checked={selectedLeads.includes(lead.id)}
                        onChange={() => toggleSelectLead(lead.id)}
                        className="rounded border-outline-variant text-primary focus:ring-primary"
                      />
                    </td>
                    <td className="p-stack-md">
                      <div className="flex items-center gap-stack-sm">
                        <div className="w-8 h-8 rounded-full bg-secondary-container text-primary flex items-center justify-center font-bold text-xs">
                          {lead.initials || lead.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-on-surface">{lead.name}</div>
                          <div className="text-body-sm text-secondary">{lead.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-stack-md font-medium text-on-surface">{lead.company || 'N/A'}</td>
                    <td className="p-stack-md">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusBadge(lead.status as LeadStatus)}`}>
                        {lead.status}
                      </span>
                    </td>
                    <td className="p-stack-md font-mono font-bold text-primary">
                      {lead.dealValue ? formatNaira(lead.dealValue) : '₦850,000'}
                    </td>
                    <td className="p-stack-md text-secondary">{lead.source}</td>
                    <td className="p-stack-md text-on-surface font-medium">{lead.assignedRep}</td>
                    <td className="p-stack-md text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button 
                          onClick={() => {
                            setNoteModalLeadId(lead.id);
                            setNoteText('');
                          }}
                          className="text-secondary hover:text-primary transition-colors p-1.5 rounded hover:bg-surface-container" 
                          title="View / Add Note"
                        >
                          <span className="material-symbols-outlined text-[20px]">edit_note</span>
                        </button>
                        <button 
                          onClick={() => convertLeadToStudent(lead.id, lead.programInterest, 'Dr. Arthur Pendelton')}
                          className="text-primary hover:text-primary-container transition-colors bg-secondary-container px-2.5 py-1 rounded text-xs font-bold flex items-center gap-1 shadow-xs" 
                          title="Quick Convert to Student"
                        >
                          <span className="material-symbols-outlined text-[16px]">school</span>
                          <span>Enroll</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Note / Activity Dialog Modal */}
      {noteModalLeadId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-inverse-surface/40 backdrop-blur-xs p-margin-page">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-lg p-stack-lg max-w-md w-full space-y-4">
            <div className="flex justify-between items-center border-b border-outline-variant pb-3">
              <h3 className="font-headline-md text-headline-md font-bold text-on-surface">Lead Notes &amp; Activity Log</h3>
              <button onClick={() => setNoteModalLeadId(null)} className="text-secondary hover:text-on-surface">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="space-y-2">
              <label className="font-label-md text-xs text-secondary font-semibold">Touchpoint Notes</label>
              <textarea
                rows={3}
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Log call outcome, WhatsApp feedback, or scheduled meeting date..."
                className="w-full p-2.5 bg-surface border border-outline-variant rounded font-body-md text-sm text-on-surface focus:border-primary outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-outline-variant">
              <button 
                onClick={() => setNoteModalLeadId(null)}
                className="px-4 py-2 rounded border border-outline-variant text-secondary text-xs font-semibold hover:bg-surface-container"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  if (noteText) {
                    updateLeadStatus(noteModalLeadId, 'Negotiation', noteText);
                  }
                  setNoteModalLeadId(null);
                }}
                className="px-4 py-2 rounded bg-primary text-on-primary text-xs font-bold hover:bg-primary-container"
              >
                Save Touchpoint Note
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loss Reason Dialog Modal */}
      {lossModalLeadId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-inverse-surface/40 backdrop-blur-xs p-margin-page">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-lg p-stack-lg max-w-md w-full space-y-4">
            <div className="flex justify-between items-center border-b border-outline-variant pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-rose-600 text-[20px]">cancel</span>
                <h3 className="font-headline-md text-headline-md font-bold text-on-surface">Disqualification Reason</h3>
              </div>
              <button onClick={() => setLossModalLeadId(null)} className="text-secondary hover:text-on-surface">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <p className="text-xs text-secondary">Please capture the primary reason why this prospective lead dropped out of the pipeline:</p>

            <div className="space-y-2">
              {['Price / Budget Constraint', 'Chose Competitor Institute', 'Bad Timing / Requested Deferral', 'Unresponsive to Follow-ups'].map(reason => (
                <label key={reason} className="flex items-center gap-2 p-2.5 rounded border border-outline-variant cursor-pointer text-xs hover:bg-surface">
                  <input
                    type="radio"
                    name="lossReason"
                    value={reason}
                    checked={lossReason === reason}
                    onChange={() => setLossReason(reason)}
                    className="text-primary focus:ring-primary"
                  />
                  <span>{reason}</span>
                </label>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-outline-variant">
              <button 
                onClick={() => setLossModalLeadId(null)}
                className="px-4 py-2 rounded border border-outline-variant text-secondary text-xs font-semibold hover:bg-surface-container"
              >
                Cancel
              </button>
              <button 
                onClick={confirmLossReason}
                className="px-4 py-2 rounded bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 shadow-xs"
              >
                Confirm Disqualification
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
