import React, { useState, useEffect } from 'react';
import { useCRM } from '../../context/CRMContext';
import { Users, Hash, X, Check, Search, Sparkles } from 'lucide-react';
import { ChatUserTarget } from '../../types/chat';

export interface CreateSubgroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubgroupCreated?: (newSubgroup: any) => void;
}

export const CreateSubgroupModal: React.FC<CreateSubgroupModalProps> = ({
  isOpen,
  onClose,
  onSubgroupCreated
}) => {
  const { currentUser, cohorts, showToast } = useCRM();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [cohortId, setCohortId] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [availableUsers, setAvailableUsers] = useState<ChatUserTarget[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && currentUser) {
      setName('');
      setDescription('');
      setCohortId(cohorts[0]?.id || '');
      setSelectedUserIds([]);
      setSearchQuery('');

      // Fetch eligible users from backend
      setIsLoadingUsers(true);
      fetch(`/api/chat/users?userId=${encodeURIComponent(currentUser.id)}&role=${encodeURIComponent(currentUser.role)}&email=${encodeURIComponent(currentUser.email)}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && Array.isArray(data.data)) {
            setAvailableUsers(data.data);
          }
        })
        .catch(err => console.error('Failed to load eligible users for subgroup:', err))
        .finally(() => setIsLoadingUsers(false));
    }
  }, [isOpen, currentUser, cohorts]);

  if (!isOpen) return null;

  const toggleUserSelection = (userId: string) => {
    setSelectedUserIds(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const filteredUsers = availableUsers.filter(u => {
    const q = searchQuery.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.courseName && u.courseName.toLowerCase().includes(q)) ||
      u.roleTitle.toLowerCase().includes(q)
    );
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Name Required', 'Please enter a name for the subgroup.', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedCohort = cohorts.find(c => c.id === cohortId);
      const res = await fetch('/api/chat/subgroups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          cohortId: cohortId || undefined,
          parentChannelId: selectedCohort ? `cohort-${selectedCohort.id}` : undefined,
          participants: selectedUserIds,
          createdBy: currentUser?.id,
          creatorName: currentUser?.name,
          creatorRole: currentUser?.role
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        showToast('Subgroup Error', data.message || 'Failed to create subgroup.', 'error');
        return;
      }

      showToast('Subgroup Created', `Subgroup ${data.data.name} created with ${data.data.participants?.length || 1} members.`, 'success');
      if (onSubgroupCreated) {
        onSubgroupCreated(data.data);
      }
      onClose();
    } catch (err: any) {
      console.error('Failed to create subgroup:', err);
      showToast('Network Error', err.message || 'Could not connect to server.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Create Class Subgroup
                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                  Chat Channel
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Setup a focused subgroup for class cohorts, project study groups, or track discussions
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
              Subgroup Name <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Hash className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. oct26-frontend-study-group"
                className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary font-medium"
              />
            </div>
            <span className="text-[11px] text-slate-400 block mt-1">
              Will be formatted as a channel slug (e.g. #{name.toLowerCase().replace(/[^a-z0-9_-]+/g, '-') || 'subgroup-name'})
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                Cohort / Class Track
              </label>
              <select
                value={cohortId}
                onChange={(e) => setCohortId(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">General (No specific cohort)</option>
                {cohorts.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({(c as any).program || c.programId})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                Topic / Purpose
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Capstone project discussion"
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Members Selector */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Add Members ({selectedUserIds.length} selected)
              </label>
              <span className="text-[11px] text-slate-400">
                You will be added as administrator
              </span>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search staff, mentors, or students..."
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="max-h-48 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl divide-y divide-slate-100 dark:divide-slate-800">
              {isLoadingUsers ? (
                <div className="p-4 text-center text-xs text-slate-400">Loading directory members...</div>
              ) : filteredUsers.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400">No matching members found</div>
              ) : (
                filteredUsers.map(user => {
                  const isSelected = selectedUserIds.includes(user.id);
                  return (
                    <div
                      key={user.id}
                      onClick={() => toggleUserSelection(user.id)}
                      className={`p-2.5 flex items-center justify-between cursor-pointer transition ${
                        isSelected 
                          ? 'bg-primary/5 dark:bg-primary/10' 
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300">
                          {user.name.charAt(0)}
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                            {user.name}
                            <span className="text-[10px] font-normal text-slate-400">({user.roleTitle})</span>
                          </div>
                          <div className="text-[11px] text-slate-400">{user.email}</div>
                        </div>
                      </div>
                      <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition ${
                        isSelected 
                          ? 'bg-primary border-primary text-white' 
                          : 'border-slate-300 dark:border-slate-600'
                      }`}>
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || !name.trim()}
            className="px-5 py-2 text-sm font-bold text-white bg-primary hover:bg-primary/90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-lg shadow-primary/20 transition flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Create Subgroup
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
