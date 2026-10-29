import React, { useState, useEffect } from 'react';
import { useCRM } from '../../context/CRMContext';
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
    <div className="fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-inverse-surface/50 backdrop-blur-xs p-2 sm:p-4 md:p-6 flex flex-col justify-start items-center animate-in fade-in duration-200">
      <div className="fixed inset-0 -z-10" onClick={onClose} aria-hidden="true" />
      <div 
        className="my-auto relative w-full max-w-xl max-h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-2.5rem)] md:max-h-[calc(100dvh-3rem)] rounded-t-2xl sm:rounded-2xl shadow-modal flex flex-col overflow-hidden bg-surface border border-outline z-10 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between p-4 sm:p-5 border-b border-outline bg-surface-bright">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
              <span className="material-symbols-outlined text-[22px]">groups</span>
            </div>
            <div>
              <h3 className="font-headline-md text-base sm:text-lg font-bold text-on-surface flex items-center gap-2">
                Create Class Subgroup
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-bold">
                  Chat Channel
                </span>
              </h3>
              <p className="text-xs text-secondary">
                Setup a focused subgroup for class cohorts, project study groups, or track discussions
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full text-secondary hover:text-on-surface hover:bg-surface-container flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-4 bg-canvas">
          <div className="bg-surface p-4 rounded-xl border border-outline shadow-xs space-y-3">
            <div>
              <label className="text-xs font-bold text-on-surface block mb-1">
                Subgroup Name <span className="text-error">*</span>
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-2.5 text-secondary text-[18px]">tag</span>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. oct26-frontend-study-group"
                  className="w-full pl-9 pr-3 py-2 bg-canvas border border-outline rounded-lg text-xs sm:text-sm text-on-surface font-semibold focus:border-primary focus:bg-surface outline-none"
                />
              </div>
              <span className="text-[11px] text-secondary block mt-1">
                Will be formatted as a channel slug (e.g. #{name.toLowerCase().replace(/[^a-z0-9_-]+/g, '-') || 'subgroup-name'})
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-xs font-bold text-on-surface block mb-1">
                  Cohort / Class Track
                </label>
                <select
                  value={cohortId}
                  onChange={(e) => setCohortId(e.target.value)}
                  className="w-full px-3 py-2 bg-canvas border border-outline rounded-lg text-xs text-on-surface font-semibold focus:border-primary focus:bg-surface outline-none"
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
                <label className="text-xs font-bold text-on-surface block mb-1">
                  Topic / Purpose
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Capstone project discussion"
                  className="w-full px-3 py-2 bg-canvas border border-outline rounded-lg text-xs text-on-surface font-semibold focus:border-primary focus:bg-surface outline-none"
                />
              </div>
            </div>
          </div>

          {/* Members Selector */}
          <div className="bg-surface p-4 rounded-xl border border-outline shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-on-surface uppercase tracking-wider flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-primary">person_add</span>
                <span>Add Members ({selectedUserIds.length} selected)</span>
              </label>
              <span className="text-[11px] text-secondary">
                You will be added as administrator
              </span>
            </div>

            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-2.5 text-secondary text-[18px]">search</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search staff, mentors, or students..."
                className="w-full pl-9 pr-3 py-2 bg-canvas border border-outline rounded-lg text-xs text-on-surface focus:border-primary focus:bg-surface outline-none"
              />
            </div>

            <div className="max-h-48 overflow-y-auto border border-outline rounded-lg divide-y divide-outline bg-surface">
              {isLoadingUsers ? (
                <div className="p-4 text-center text-xs text-secondary">Loading directory members...</div>
              ) : filteredUsers.length === 0 ? (
                <div className="p-4 text-center text-xs text-secondary">No matching members found</div>
              ) : (
                filteredUsers.map(user => {
                  const isSelected = selectedUserIds.includes(user.id);
                  return (
                    <div
                      key={user.id}
                      onClick={() => toggleUserSelection(user.id)}
                      className={`p-2.5 flex items-center justify-between cursor-pointer transition-colors ${
                        isSelected 
                          ? 'bg-primary/5 text-primary' 
                          : 'hover:bg-surface-container text-on-surface'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-full bg-surface-container flex items-center justify-center text-xs font-bold text-secondary shrink-0">
                          {user.name.charAt(0)}
                        </div>
                        <div className="truncate">
                          <div className="text-xs font-semibold truncate flex items-center gap-1.5">
                            <span>{user.name}</span>
                            <span className="text-[10px] font-normal text-secondary">({user.roleTitle})</span>
                          </div>
                          <div className="text-[11px] text-secondary truncate">{user.email}</div>
                        </div>
                      </div>
                      <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                        isSelected 
                          ? 'bg-primary border-primary text-white' 
                          : 'border-outline-variant bg-surface'
                      }`}>
                        {isSelected && <span className="material-symbols-outlined text-[14px]">check</span>}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="shrink-0 p-3 sm:p-4 border-t border-outline bg-surface-bright flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-xs font-semibold text-secondary hover:text-on-surface rounded-lg cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || !name.trim()}
            className="px-5 py-2.5 text-xs font-bold text-white bg-primary hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Creating...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[16px]">groups</span>
                <span>Create Subgroup</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
