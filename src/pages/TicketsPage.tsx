import React, { useState, useMemo } from 'react';
import { useCRM } from '../context/CRMContext';
import { TicketCategory, TicketPriority, TicketStatus } from '../types/crm';

export const TicketsPage: React.FC = () => {
  const { 
    tickets, 
    createTicket, 
    updateTicketStatus, 
    addTicketComment, 
    currentUser, 
    showToast 
  } = useCRM();

  // Search and Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'all' | 'my_tickets'>('all');

  // Modal / Drawer States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  // New Ticket Form State
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<TicketCategory>('observation');
  const [newPriority, setNewPriority] = useState<TicketPriority>('medium');
  const [newDescription, setNewDescription] = useState('');

  // Comment Input State
  const [replyText, setReplyText] = useState('');

  const isStaff = currentUser?.role === 'super_admin' || currentUser?.role === 'admissions' || currentUser?.role === 'finance' || currentUser?.role === 'it_support';

  const filteredTickets = useMemo(() => {
    return tickets.filter(t => {
      const matchesSearch = 
        t.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.createdBy.name.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
      const matchesCategory = categoryFilter === 'all' || t.category === categoryFilter;
      const matchesPriority = priorityFilter === 'all' || t.priority === priorityFilter;
      const matchesTab = activeTab === 'all' || t.createdBy.email === currentUser?.email || t.createdBy.id === currentUser?.id;

      return matchesSearch && matchesStatus && matchesCategory && matchesPriority && matchesTab;
    });
  }, [tickets, searchQuery, statusFilter, categoryFilter, priorityFilter, activeTab, currentUser]);

  const stats = useMemo(() => {
    const total = tickets.length;
    const open = tickets.filter(t => t.status === 'open').length;
    const inProgress = tickets.filter(t => t.status === 'in_progress').length;
    const resolved = tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length;
    return { total, open, inProgress, resolved };
  }, [tickets]);

  const activeTicket = useMemo(() => {
    return tickets.find(t => t.id === selectedTicketId) || null;
  }, [tickets, selectedTicketId]);

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDescription.trim()) {
      showToast('Validation Error', 'Please provide a title and detailed description.', 'error');
      return;
    }

    createTicket({
      title: newTitle.trim(),
      description: newDescription.trim(),
      category: newCategory,
      priority: newPriority,
      status: 'open',
      createdBy: {
        id: currentUser?.id || `usr-${Date.now()}`,
        name: currentUser?.name || 'Authorized User',
        email: currentUser?.email || 'user@codelab.institute',
        role: currentUser?.role || 'student',
        roleTitle: currentUser?.roleTitle || 'Portal Member',
      }
    });

    setNewTitle('');
    setNewDescription('');
    setNewCategory('observation');
    setNewPriority('medium');
    setIsCreateModalOpen(false);
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicketId || !replyText.trim()) return;

    addTicketComment(selectedTicketId, replyText.trim());
    setReplyText('');
  };

  const getCategoryLabel = (cat: TicketCategory) => {
    switch (cat) {
      case 'bug': return 'Technical Bug';
      case 'feature_request': return 'App Improvement';
      case 'academic': return 'Academic Inquiry';
      case 'billing': return 'Tuition & Billing';
      case 'welfare': return 'Student Welfare';
      case 'observation': return 'App Observation';
      default: return 'General Inquiry';
    }
  };

  const getCategoryBadgeClass = (cat: TicketCategory) => {
    switch (cat) {
      case 'bug': return 'bg-rose-500/10 text-rose-700 border-rose-200';
      case 'feature_request': return 'bg-purple-500/10 text-purple-700 border-purple-200';
      case 'academic': return 'bg-blue-500/10 text-blue-700 border-blue-200';
      case 'billing': return 'bg-emerald-500/10 text-emerald-700 border-emerald-200';
      case 'welfare': return 'bg-amber-500/10 text-amber-700 border-amber-200';
      case 'observation': return 'bg-indigo-500/10 text-indigo-700 border-indigo-200';
      default: return 'bg-slate-500/10 text-slate-700 border-slate-200';
    }
  };

  const getPriorityBadgeClass = (priority: TicketPriority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-600 text-white font-bold';
      case 'high': return 'bg-orange-500 text-white font-bold';
      case 'medium': return 'bg-amber-500/15 text-amber-800 font-semibold';
      case 'low': return 'bg-slate-500/15 text-slate-700 font-medium';
    }
  };

  const getStatusBadgeClass = (status: TicketStatus) => {
    switch (status) {
      case 'open': return 'bg-amber-500/15 text-amber-700 border-amber-300';
      case 'in_progress': return 'bg-blue-500/15 text-blue-700 border-blue-300';
      case 'resolved': return 'bg-emerald-500/15 text-emerald-700 border-emerald-300';
      case 'closed': return 'bg-slate-500/15 text-slate-700 border-slate-300';
    }
  };

  return (
    <div className="space-y-stack-lg animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-surface-container-lowest p-stack-md rounded-xl border border-outline-variant shadow-xs">
        <div>
          <h2 className="font-headline-lg text-headline-lg font-bold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[28px]">confirmation_number</span>
            <span>Support &amp; Feedback Hub</span>
          </h2>
          <p className="text-xs text-secondary mt-0.5">
            Log complaints, submit bug reports, raise observations, and suggest features for app improvement.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="h-10 px-5 bg-primary text-on-primary rounded-lg font-label-md text-xs font-bold hover:bg-primary/90 transition-colors flex items-center gap-2 shadow-xs cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">add_circle</span>
          <span>Raise Support Ticket</span>
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-stack-md">
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-stack-md shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-secondary font-semibold">Total Tickets</span>
            <div className="text-headline-md font-bold text-on-surface font-data-tabular mt-0.5">
              {stats.total}
            </div>
            <span className="text-[11px] text-secondary font-medium">All recorded items</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <span className="material-symbols-outlined text-[22px]">confirmation_number</span>
          </div>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-stack-md shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-secondary font-semibold">Open Issues</span>
            <div className="text-headline-md font-bold text-amber-600 font-data-tabular mt-0.5">
              {stats.open}
            </div>
            <span className="text-[11px] text-amber-700 font-semibold">Awaiting triage</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
            <span className="material-symbols-outlined text-[22px]">pending_actions</span>
          </div>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-stack-md shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-secondary font-semibold">In Progress</span>
            <div className="text-headline-md font-bold text-blue-600 font-data-tabular mt-0.5">
              {stats.inProgress}
            </div>
            <span className="text-[11px] text-blue-700 font-semibold">Under active resolution</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
            <span className="material-symbols-outlined text-[22px]">published_with_changes</span>
          </div>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-stack-md shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-secondary font-semibold">Resolved</span>
            <div className="text-headline-md font-bold text-emerald-600 font-data-tabular mt-0.5">
              {stats.resolved}
            </div>
            <span className="text-[11px] text-emerald-700 font-semibold">Completed &amp; closed</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
            <span className="material-symbols-outlined text-[22px]">task_alt</span>
          </div>
        </div>
      </div>

      {/* Tabs & Filters */}
      <div className="space-y-stack-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-surface-container-lowest p-3 rounded-xl border border-outline-variant">
          {/* Tabs */}
          <div className="inline-flex rounded-lg border border-outline-variant bg-surface p-0.5">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-primary text-on-primary shadow-xs'
                  : 'text-secondary hover:text-on-surface'
              }`}
            >
              All Tickets ({tickets.length})
            </button>
            <button
              onClick={() => setActiveTab('my_tickets')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'my_tickets'
                  ? 'bg-primary text-on-primary shadow-xs'
                  : 'text-secondary hover:text-on-surface'
              }`}
            >
              My Tickets ({tickets.filter(t => t.createdBy.email === currentUser?.email || t.createdBy.id === currentUser?.id).length})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-secondary text-[18px]">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tickets, title, submitter..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-surface border border-outline-variant rounded-lg text-on-surface placeholder:text-secondary focus:border-primary outline-none"
            />
          </div>
        </div>

        {/* Filter Dropdowns */}
        <div className="flex items-center gap-2 flex-wrap text-xs bg-surface-container-lowest p-2.5 px-3 rounded-xl border border-outline-variant">
          <div className="flex items-center gap-1.5 text-secondary font-semibold">
            <span className="material-symbols-outlined text-[16px]">filter_list</span>
            <span>Filters:</span>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-surface border border-outline-variant rounded-md px-2.5 py-1 text-on-surface font-medium outline-none cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-surface border border-outline-variant rounded-md px-2.5 py-1 text-on-surface font-medium outline-none cursor-pointer"
          >
            <option value="all">All Categories</option>
            <option value="bug">Technical Bug</option>
            <option value="feature_request">App Improvement</option>
            <option value="observation">App Observation</option>
            <option value="academic">Academic Inquiry</option>
            <option value="billing">Tuition &amp; Billing</option>
            <option value="welfare">Student Welfare</option>
            <option value="general">General Inquiry</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="bg-surface border border-outline-variant rounded-md px-2.5 py-1 text-on-surface font-medium outline-none cursor-pointer"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          {(statusFilter !== 'all' || categoryFilter !== 'all' || priorityFilter !== 'all' || searchQuery) && (
            <button
              onClick={() => {
                setStatusFilter('all');
                setCategoryFilter('all');
                setPriorityFilter('all');
                setSearchQuery('');
              }}
              className="text-xs text-primary font-bold hover:underline ml-auto cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Tickets List */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-outline-variant bg-surface text-secondary text-[11px] font-bold uppercase tracking-wider">
                <th className="p-3 pl-4">Ticket</th>
                <th className="p-3">Title &amp; Observation Details</th>
                <th className="p-3">Category</th>
                <th className="p-3">Priority</th>
                <th className="p-3">Status</th>
                <th className="p-3">Submitted By</th>
                <th className="p-3">Updated</th>
                <th className="p-3 pr-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {filteredTickets.map((ticket) => (
                <tr key={ticket.id} className="hover:bg-surface-container-low/50 transition-colors">
                  <td className="p-3 pl-4 font-mono font-bold text-primary whitespace-nowrap">
                    {ticket.ticketNumber}
                  </td>

                  <td className="p-3 max-w-sm">
                    <div className="font-bold text-on-surface hover:text-primary transition-colors cursor-pointer" onClick={() => setSelectedTicketId(ticket.id)}>
                      {ticket.title}
                    </div>
                    <p className="text-secondary text-[11px] line-clamp-1 mt-0.5">
                      {ticket.description}
                    </p>
                  </td>

                  <td className="p-3 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${getCategoryBadgeClass(ticket.category)}`}>
                      {getCategoryLabel(ticket.category)}
                    </span>
                  </td>

                  <td className="p-3 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] uppercase tracking-wider ${getPriorityBadgeClass(ticket.priority)}`}>
                      {ticket.priority}
                    </span>
                  </td>

                  <td className="p-3 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold border ${getStatusBadgeClass(ticket.status)}`}>
                      {ticket.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </td>

                  <td className="p-3 whitespace-nowrap">
                    <div className="font-semibold text-on-surface">{ticket.createdBy.name}</div>
                    <div className="text-[10px] text-secondary capitalize">{ticket.createdBy.roleTitle || ticket.createdBy.role.replace('_', ' ')}</div>
                  </td>

                  <td className="p-3 text-secondary text-[11px] whitespace-nowrap font-mono">
                    {ticket.updatedAt?.split('T')[0] || ticket.createdAt?.split('T')[0] || 'Today'}
                  </td>

                  <td className="p-3 pr-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setSelectedTicketId(ticket.id)}
                        className="px-2.5 py-1 rounded bg-secondary-container text-primary font-bold text-xs hover:bg-secondary-container/80 transition-colors flex items-center gap-1 cursor-pointer shadow-xs"
                      >
                        <span className="material-symbols-outlined text-[15px]">chat</span>
                        <span>Reply ({ticket.comments?.length || 0})</span>
                      </button>

                      {isStaff && (
                        <select
                          value={ticket.status}
                          onChange={(e) => updateTicketStatus(ticket.id, e.target.value as TicketStatus)}
                          className="text-[11px] bg-surface border border-outline-variant rounded px-2 py-1 text-on-surface font-semibold outline-none cursor-pointer"
                        >
                          <option value="open">Open</option>
                          <option value="in_progress">In Progress</option>
                          <option value="resolved">Resolved</option>
                          <option value="closed">Closed</option>
                        </select>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredTickets.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-secondary">
                    No tickets found matching your search and filter parameters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* RAISE TICKET MODAL                                                        */}
      {/* ========================================================================= */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-inverse-surface/40 backdrop-blur-xs p-margin-page animate-in fade-in duration-150">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-xl p-stack-lg max-w-lg w-full space-y-4">
            <div className="flex justify-between items-center border-b border-outline-variant pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[22px]">add_task</span>
                <h3 className="font-headline-md text-headline-md font-bold text-on-surface">Raise Support Ticket</h3>
              </div>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-secondary hover:text-on-surface">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-secondary font-semibold mb-1">Subject / Summary *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Inability to view course videos or observation on billing list"
                  className="w-full p-2.5 bg-surface border border-outline-variant rounded-lg text-on-surface focus:border-primary outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-secondary font-semibold mb-1">Category *</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as TicketCategory)}
                    className="w-full p-2.5 bg-surface border border-outline-variant rounded-lg text-on-surface focus:border-primary outline-none cursor-pointer"
                  >
                    <option value="observation">App Observation / Feedback</option>
                    <option value="feature_request">Feature Request / Improvement</option>
                    <option value="bug">Technical Bug</option>
                    <option value="academic">Academic Inquiry</option>
                    <option value="billing">Tuition &amp; Billing</option>
                    <option value="welfare">Student Welfare</option>
                    <option value="general">General Inquiry</option>
                  </select>
                </div>

                <div>
                  <label className="block text-secondary font-semibold mb-1">Priority *</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as TicketPriority)}
                    className="w-full p-2.5 bg-surface border border-outline-variant rounded-lg text-on-surface focus:border-primary outline-none cursor-pointer"
                  >
                    <option value="low">Low (General Feedback)</option>
                    <option value="medium">Medium (Standard Request)</option>
                    <option value="high">High (Hindering Study / Work)</option>
                    <option value="urgent">Urgent (Blocking Application / System Failure)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-secondary font-semibold mb-1">Detailed Description &amp; Steps *</label>
                <textarea
                  rows={4}
                  required
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Describe your issue, complaint, observation, or suggested improvement in detail..."
                  className="w-full p-2.5 bg-surface border border-outline-variant rounded-lg text-on-surface focus:border-primary outline-none resize-y"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-outline-variant">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-outline-variant text-secondary font-semibold hover:bg-surface-container"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-primary text-on-primary font-bold hover:bg-primary/90 transition-colors shadow-xs"
                >
                  Submit Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TICKET DETAILS & REPLY DRAWER                                             */}
      {/* ========================================================================= */}
      {activeTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-inverse-surface/40 backdrop-blur-xs p-margin-page animate-in fade-in duration-150">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden">
            {/* Drawer Header */}
            <div className="p-stack-md border-b border-outline-variant flex items-center justify-between bg-surface">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-primary px-2 py-0.5 bg-primary/10 rounded">
                  {activeTicket.ticketNumber}
                </span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${getStatusBadgeClass(activeTicket.status)}`}>
                  {activeTicket.status.replace('_', ' ').toUpperCase()}
                </span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${getPriorityBadgeClass(activeTicket.priority)}`}>
                  {activeTicket.priority}
                </span>
              </div>
              <button onClick={() => setSelectedTicketId(null)} className="text-secondary hover:text-on-surface">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Ticket Subject & Main Post */}
            <div className="p-stack-md border-b border-outline-variant bg-surface-container-lowest overflow-y-auto space-y-3">
              <div>
                <h3 className="font-headline-md text-headline-md font-bold text-on-surface">
                  {activeTicket.title}
                </h3>
                <div className="flex items-center gap-2 text-xs text-secondary mt-1">
                  <span>Submitted by <strong className="text-on-surface">{activeTicket.createdBy.name}</strong> ({activeTicket.createdBy.roleTitle || activeTicket.createdBy.role})</span>
                  <span>•</span>
                  <span>{activeTicket.createdAt?.split('T')[0] || 'Today'}</span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-surface border border-outline-variant/60 text-xs text-on-surface leading-relaxed whitespace-pre-wrap">
                {activeTicket.description}
              </div>

              {/* Status Action Buttons for Staff */}
              {isStaff && (
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-[11px] text-secondary font-semibold">Change Status:</span>
                  {(['open', 'in_progress', 'resolved', 'closed'] as TicketStatus[]).map((st) => (
                    <button
                      key={st}
                      onClick={() => updateTicketStatus(activeTicket.id, st)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold capitalize transition-all cursor-pointer ${
                        activeTicket.status === st
                          ? 'bg-primary text-on-primary shadow-xs'
                          : 'bg-surface border border-outline-variant text-secondary hover:text-on-surface'
                      }`}
                    >
                      {st.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Conversation / Comments Stream */}
            <div className="p-stack-md flex-1 overflow-y-auto space-y-3 bg-surface/30">
              <h4 className="text-xs font-bold text-secondary uppercase tracking-wider">
                Conversation History ({activeTicket.comments?.length || 0})
              </h4>

              {(!activeTicket.comments || activeTicket.comments.length === 0) ? (
                <div className="p-6 text-center text-xs text-secondary">
                  No responses recorded yet. Post a comment below to update the ticket.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {activeTicket.comments.map((comment) => (
                    <div 
                      key={comment.id}
                      className="p-3 rounded-lg bg-surface-container-lowest border border-outline-variant/60 shadow-2xs space-y-1 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-on-surface">{comment.authorName}</span>
                          <span className="px-1.5 py-0.2 rounded bg-surface-container text-[10px] text-secondary font-semibold capitalize">
                            {comment.authorRole.replace('_', ' ')}
                          </span>
                        </div>
                        <span className="text-[10px] text-secondary font-mono">
                          {comment.createdAt ? new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'}
                        </span>
                      </div>
                      <p className="text-on-surface leading-relaxed whitespace-pre-wrap">{comment.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Reply Input Box */}
            <form onSubmit={handleSendReply} className="p-stack-md border-t border-outline-variant bg-surface-container-lowest flex gap-2">
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Type a response or update note..."
                className="flex-1 p-2.5 text-xs bg-surface border border-outline-variant rounded-lg text-on-surface focus:border-primary outline-none"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-primary text-on-primary rounded-lg text-xs font-bold hover:bg-primary/90 transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">send</span>
                <span>Send</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
