import React, { useState, useMemo } from 'react';
import { useCRM, formatNaira } from '../context/CRMContext';
import { Lead } from '../types/crm';
import { CrispStatusBadge } from '../components/common/CrispStatusBadge';

export const ContactsPage: React.FC = () => {
  const { 
    leads, 
    openModal, 
    openFollowUpModal, 
    convertLeadToStudent,
    currentUser,
  } = useCRM();

  const [activeTab, setActiveTab] = useState<'All' | 'Due Today' | 'Overdue' | 'This Week' | 'No Schedule'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRep, setSelectedRep] = useState('All');
  const [selectedProgram, setSelectedProgram] = useState('All');
  const [selectedLeadForHistory, setSelectedLeadForHistory] = useState<Lead | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];

  // Helper to determine follow-up status
  const getFollowUpTimingCategory = (lead: Lead): 'Due Today' | 'Overdue' | 'This Week' | 'Upcoming' | 'No Schedule' => {
    if (!lead.nextFollowUpDate) return 'No Schedule';
    if (lead.nextFollowUpDate < todayStr) return 'Overdue';
    if (lead.nextFollowUpDate === todayStr) return 'Due Today';

    // Check if within next 7 days
    const followUpDate = new Date(lead.nextFollowUpDate);
    const today = new Date();
    const diffDays = Math.ceil((followUpDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays <= 7 && diffDays > 0) return 'This Week';
    return 'Upcoming';
  };

  // Metrics calculation
  const metrics = useMemo(() => {
    let overdueCount = 0;
    let dueTodayCount = 0;
    let thisWeekCount = 0;
    let noScheduleCount = 0;

    leads.forEach(l => {
      const cat = getFollowUpTimingCategory(l);
      if (cat === 'Overdue') overdueCount++;
      else if (cat === 'Due Today') dueTodayCount++;
      else if (cat === 'This Week') thisWeekCount++;
      else if (cat === 'No Schedule') noScheduleCount++;
    });

    return {
      total: leads.length,
      overdue: overdueCount,
      dueToday: dueTodayCount,
      thisWeek: thisWeekCount,
      noSchedule: noScheduleCount,
    };
  }, [leads, todayStr]);

  // Unique list of reps and programs for dropdown filters
  const allReps = useMemo(() => {
    return Array.from(new Set(leads.map(l => l.assignedRep).filter(Boolean)));
  }, [leads]);

  const allPrograms = useMemo(() => {
    return Array.from(new Set(leads.map(l => l.programInterest).filter(Boolean)));
  }, [leads]);

  // Filtered contacts list
  const filteredContacts = useMemo(() => {
    return leads.filter(l => {
      // 1. Timing Tab filter
      const cat = getFollowUpTimingCategory(l);
      if (activeTab === 'Due Today' && cat !== 'Due Today') return false;
      if (activeTab === 'Overdue' && cat !== 'Overdue') return false;
      if (activeTab === 'This Week' && cat !== 'This Week') return false;
      if (activeTab === 'No Schedule' && cat !== 'No Schedule') return false;

      // 2. Rep filter
      if (selectedRep !== 'All' && l.assignedRep !== selectedRep) return false;

      // 3. Program filter
      if (selectedProgram !== 'All' && l.programInterest !== selectedProgram) return false;

      // 4. Search text
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matches = 
          l.name.toLowerCase().includes(q) ||
          l.phone.toLowerCase().includes(q) ||
          l.email.toLowerCase().includes(q) ||
          l.company.toLowerCase().includes(q) ||
          l.programInterest.toLowerCase().includes(q) ||
          (l.notes && l.notes.toLowerCase().includes(q));
        if (!matches) return false;
      }

      return true;
    });
  }, [leads, activeTab, selectedRep, selectedProgram, searchQuery, todayStr]);

  // Generate WhatsApp direct URL for a lead
  const getWhatsAppUrl = (lead: Lead) => {
    const clean = lead.phone.replace(/[^0-9]/g, '');
    const phone = clean.startsWith('0') 
      ? '234' + clean.slice(1) 
      : clean.startsWith('234') 
      ? clean 
      : '234' + clean;
    const rep = currentUser?.name || lead.assignedRep || 'Admissions Specialist';
    const text = encodeURIComponent(
      `Hello ${lead.name}, this is ${rep} from Codelab Educate. Following up on your inquiry about our ${lead.programInterest} program. How can I assist you with your registration?`
    );
    return `https://wa.me/${phone}?text=${text}`;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-outline-variant/60">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-primary/10 text-primary border border-primary/20">
              <span className="material-symbols-outlined text-[14px]">contact_phone</span>
              Admissions Contacts &amp; Follow-Up CRM
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight">
            Prospective Leads &amp; Contact Follow-Ups
          </h1>
          <p className="text-xs sm:text-sm text-secondary mt-0.5">
            Collated prospective student directory with scheduled follow-up dates &amp; times, call outcomes, and 1-click WhatsApp reach-out.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => openModal('add-lead')}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary-hover transition-colors shadow-xs cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">person_add</span>
            <span>Add New Prospective Lead</span>
          </button>
        </div>
      </div>

      {/* 2. Four Operational Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Collated Contacts */}
        <div 
          onClick={() => setActiveTab('All')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            activeTab === 'All' ? 'bg-primary/5 border-primary shadow-sm' : 'bg-surface border-outline-variant hover:border-outline'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-secondary">Total Inquiries</span>
            <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">contacts</span>
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-on-surface font-data-tabular">{metrics.total}</span>
            <span className="text-xs font-bold text-secondary">Active Contacts</span>
          </div>
          <p className="text-[11px] text-secondary mt-1">Prospective students in pipeline</p>
        </div>

        {/* Follow-ups Due Today */}
        <div 
          onClick={() => setActiveTab('Due Today')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            activeTab === 'Due Today' ? 'bg-amber-500/10 border-amber-500 shadow-sm' : 'bg-surface border-outline-variant hover:border-amber-500/40'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-amber-600">Due Today</span>
            <span className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">today</span>
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-700 font-data-tabular">{metrics.dueToday}</span>
            <span className="text-xs font-bold text-amber-600 bg-amber-500/10 px-1.5 py-0.5 rounded">
              Requires Call
            </span>
          </div>
          <p className="text-[11px] text-secondary mt-1">Scheduled for follow-up today</p>
        </div>

        {/* Overdue Follow-ups */}
        <div 
          onClick={() => setActiveTab('Overdue')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            activeTab === 'Overdue' ? 'bg-red-500/10 border-red-500 shadow-sm' : 'bg-surface border-outline-variant hover:border-red-500/40'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-red-600">Overdue Follow-ups</span>
            <span className="w-8 h-8 rounded-lg bg-red-500/15 text-red-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">warning</span>
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-red-600 font-data-tabular">{metrics.overdue}</span>
            {metrics.overdue > 0 && (
              <span className="text-xs font-bold text-red-600 bg-red-500/10 px-1.5 py-0.5 rounded animate-pulse">
                Needs Attention
              </span>
            )}
          </div>
          <p className="text-[11px] text-secondary mt-1">Missed follow-up dates</p>
        </div>

        {/* Scheduled This Week */}
        <div 
          onClick={() => setActiveTab('This Week')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            activeTab === 'This Week' ? 'bg-blue-500/10 border-blue-500 shadow-sm' : 'bg-surface border-outline-variant hover:border-blue-500/40'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-blue-600">This Week</span>
            <span className="w-8 h-8 rounded-lg bg-blue-500/15 text-blue-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">calendar_month</span>
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-blue-700 font-data-tabular">{metrics.thisWeek}</span>
            <span className="text-xs font-bold text-blue-600">Upcoming Slots</span>
          </div>
          <p className="text-[11px] text-secondary mt-1">Next 7 days scheduled</p>
        </div>
      </div>

      {/* 3. Search and Multi-filter Controls Bar */}
      <div className="p-4 rounded-xl bg-surface border border-outline-variant shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1 min-w-0">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-secondary text-[18px]">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search candidate name, phone number, email, or program..."
              className="w-full h-10 pl-9 pr-8 text-xs bg-surface-container-low border border-outline-variant rounded-xl text-on-surface focus:outline-none focus:border-primary placeholder:text-secondary/60"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-secondary hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-[16px]">cancel</span>
              </button>
            )}
          </div>

          {/* Dropdown Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={selectedRep}
              onChange={e => setSelectedRep(e.target.value)}
              className="h-10 px-3 bg-surface border border-outline-variant rounded-xl text-xs font-medium text-on-surface focus:border-primary outline-none cursor-pointer"
            >
              <option value="All">All Admissions Reps</option>
              {allReps.map(rep => (
                <option key={rep} value={rep}>{rep}</option>
              ))}
            </select>

            <select
              value={selectedProgram}
              onChange={e => setSelectedProgram(e.target.value)}
              className="h-10 px-3 bg-surface border border-outline-variant rounded-xl text-xs font-medium text-on-surface focus:border-primary outline-none cursor-pointer"
            >
              <option value="All">All Program Tracks</option>
              {allPrograms.map(prog => (
                <option key={prog} value={prog}>{prog}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Timing Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-0.5 border-t border-outline-variant/60 text-xs">
          {(['All', 'Due Today', 'Overdue', 'This Week', 'No Schedule'] as const).map(tab => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-colors shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-primary text-white shadow-xs'
                    : 'text-secondary hover:text-on-surface hover:bg-surface-container-high'
                }`}
              >
                {tab === 'All' ? `All Contacts (${metrics.total})` :
                 tab === 'Due Today' ? `Due Today (${metrics.dueToday})` :
                 tab === 'Overdue' ? `Overdue (${metrics.overdue})` :
                 tab === 'This Week' ? `This Week (${metrics.thisWeek})` :
                 `No Schedule (${metrics.noSchedule})`}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Collated Contacts Table */}
      <div className="bg-surface border border-outline-variant rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          {filteredContacts.length === 0 ? (
            <div className="p-12 text-center text-secondary">
              <span className="material-symbols-outlined text-4xl mb-2 text-secondary/40">person_search</span>
              <p className="text-sm font-semibold">No contacts found matching this view</p>
              <p className="text-xs text-secondary/70 mt-1">Try switching tabs or resetting your search filters</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse min-w-[900px] text-xs">
              <thead>
                <tr className="border-b border-outline-variant bg-surface-container-low text-secondary font-semibold">
                  <th className="px-4 py-3">Candidate / Contact</th>
                  <th className="px-4 py-3">Program &amp; Value</th>
                  <th className="px-4 py-3">Scheduled Follow-Up</th>
                  <th className="px-4 py-3">Quick Connect</th>
                  <th className="px-4 py-3">Pipeline Stage</th>
                  <th className="px-4 py-3">Assigned Rep</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/50 text-on-surface">
                {filteredContacts.map((lead) => {
                  const timing = getFollowUpTimingCategory(lead);
                  const isOverdue = timing === 'Overdue';
                  const isDueToday = timing === 'Due Today';

                  return (
                    <tr 
                      key={lead.id} 
                      className={`hover:bg-surface-container-low/50 transition-colors ${
                        isOverdue ? 'bg-red-500/5' : isDueToday ? 'bg-amber-500/5' : ''
                      }`}
                    >
                      {/* Contact Info */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0">
                            {lead.initials || lead.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-on-surface truncate">{lead.name}</p>
                            <p className="text-[11px] text-secondary truncate font-mono">{lead.phone}</p>
                            <p className="text-[10px] text-secondary/70 truncate">{lead.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Program & Deal Value */}
                      <td className="px-4 py-3.5">
                        <p className="font-semibold text-on-surface truncate max-w-[200px]">{lead.programInterest}</p>
                        <p className="text-[11px] font-bold text-primary font-data-tabular">
                          {formatNaira(lead.dealValue || 850000)}
                        </p>
                        <span className="text-[10px] text-secondary">Source: {lead.source}</span>
                      </td>

                      {/* Scheduled Follow-Up */}
                      <td className="px-4 py-3.5">
                        {lead.nextFollowUpDate ? (
                          <div className="space-y-0.5">
                            <span 
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                isOverdue 
                                  ? 'bg-red-500/15 text-red-600 border border-red-500/30' 
                                  : isDueToday 
                                  ? 'bg-amber-500/15 text-amber-700 border border-amber-500/30' 
                                  : 'bg-blue-500/15 text-blue-600'
                              }`}
                            >
                              <span className="material-symbols-outlined text-[12px]">
                                {isOverdue ? 'warning' : isDueToday ? 'alarm' : 'event'}
                              </span>
                              <span>
                                {isDueToday ? 'Today' : lead.nextFollowUpDate}
                                {lead.nextFollowUpTime ? ` • ${lead.nextFollowUpTime}` : ''}
                              </span>
                            </span>
                            {isOverdue && (
                              <p className="text-[10px] text-red-500 font-semibold">Overdue</p>
                            )}
                            {lead.preferredChannel && (
                              <p className="text-[10px] text-secondary capitalize">
                                via {lead.preferredChannel}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-medium bg-surface-container text-secondary">
                            Not Scheduled
                          </span>
                        )}
                      </td>

                      {/* Direct Connect Actions */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <a
                            href={getWhatsAppUrl(lead)}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 transition-colors"
                            title="Chat on WhatsApp"
                          >
                            <span className="material-symbols-outlined text-[16px]">chat</span>
                          </a>
                          <a
                            href={`tel:${lead.phone}`}
                            className="p-1.5 rounded-lg bg-surface-container-high hover:bg-primary/10 text-primary transition-colors"
                            title="Call Phone"
                          >
                            <span className="material-symbols-outlined text-[16px]">call</span>
                          </a>
                          <a
                            href={`mailto:${lead.email}`}
                            className="p-1.5 rounded-lg bg-surface-container-high hover:bg-blue-500/10 text-blue-600 transition-colors"
                            title="Send Email"
                          >
                            <span className="material-symbols-outlined text-[16px]">mail</span>
                          </a>
                        </div>
                      </td>

                      {/* Pipeline Stage */}
                      <td className="px-4 py-3.5">
                        <CrispStatusBadge status={lead.status} />
                      </td>

                      {/* Assigned Rep */}
                      <td className="px-4 py-3.5 font-medium text-secondary">
                        {lead.assignedRep || 'Unassigned'}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openFollowUpModal(lead)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-primary text-white font-bold text-[11px] hover:bg-primary-hover transition-colors shadow-2xs cursor-pointer"
                            title="Record Call Outcome & Set Next Follow-Up"
                          >
                            <span className="material-symbols-outlined text-[14px]">phone_in_talk</span>
                            <span>Log Follow-Up</span>
                          </button>

                          {lead.followUpHistory && lead.followUpHistory.length > 0 && (
                            <button
                              type="button"
                              onClick={() => setSelectedLeadForHistory(lead)}
                              className="p-1.5 rounded-lg border border-outline-variant hover:bg-surface-container text-secondary transition-colors cursor-pointer"
                              title="View Interaction History"
                            >
                              <span className="material-symbols-outlined text-[16px]">history</span>
                            </button>
                          )}

                          {lead.status !== 'Converted' && (
                            <button
                              type="button"
                              onClick={() => convertLeadToStudent(lead.id, lead.programInterest, 'Dr. Arthur Pendelton')}
                              className="p-1.5 rounded-lg border border-outline-variant hover:border-indigo-600 hover:text-indigo-600 transition-colors cursor-pointer text-secondary"
                              title="Convert to Enrolled Student"
                            >
                              <span className="material-symbols-outlined text-[16px]">school</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* 5. Interaction History Drawer / Dialog */}
      {selectedLeadForHistory && (
        <div className="fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-inverse-surface/40 backdrop-blur-xs p-4 flex flex-col justify-center items-center animate-in fade-in">
          <div className="relative w-full max-w-lg bg-surface border border-outline-variant rounded-2xl shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-outline-variant pb-3">
              <div>
                <h3 className="text-sm font-bold text-on-surface">Interaction Timeline</h3>
                <p className="text-xs text-secondary">{selectedLeadForHistory.name} • {selectedLeadForHistory.phone}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLeadForHistory(null)}
                className="text-secondary hover:text-on-surface p-1 rounded-full"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="space-y-2.5 max-h-80 overflow-y-auto">
              {selectedLeadForHistory.followUpHistory?.map(act => (
                <div key={act.id} className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/60 text-xs">
                  <div className="flex items-center justify-between font-bold text-on-surface mb-1">
                    <span>{act.outcome}</span>
                    <span className="text-[10px] text-secondary font-normal">
                      {new Date(act.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </span>
                  </div>
                  <p className="text-secondary text-[11px] whitespace-pre-wrap">{act.notes}</p>
                  <div className="flex items-center justify-between text-[10px] text-secondary/70 mt-2 pt-1 border-t border-outline-variant/30">
                    <span>Recorded by: {act.repName}</span>
                    {act.nextScheduledDate && (
                      <span className="text-primary font-bold">
                        Next: {act.nextScheduledDate} {act.nextScheduledTime || ''}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedLeadForHistory(null)}
                className="px-4 py-2 rounded-lg bg-primary text-white text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
