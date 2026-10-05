import React, { useState, useMemo } from 'react';
import { useCRM } from '../../context/CRMContext';

interface TransferTasksAndDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  userToDelete: {
    id: string;
    name: string;
    email: string;
    role: string;
    roleTitle?: string;
    avatarUrl?: string;
  } | null;
  userType: 'staff' | 'mentor';
  onDeleted?: () => void;
}

export const TransferTasksAndDeleteModal: React.FC<TransferTasksAndDeleteModalProps> = ({
  isOpen,
  onClose,
  userToDelete,
  userType,
  onDeleted,
}) => {
  const { 
    activeMentors, 
    activeStaffUsers, 
    getUserTaskFootprint, 
    transferTasksAndDeleteUser,
    showToast 
  } = useCRM();

  const [selectedTargetUserId, setSelectedTargetUserId] = useState<string>('');
  const [isTransferring, setIsTransferring] = useState(false);
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(false);

  // Compute active footprint for the user
  const footprint = useMemo(() => {
    if (!userToDelete) return null;
    return getUserTaskFootprint(userToDelete.id, userToDelete.name, userToDelete.email);
  }, [userToDelete, getUserTaskFootprint]);

  // Candidates for replacement:
  // Must be active, and cannot be the user being deleted
  const candidateUsers = useMemo(() => {
    if (!userToDelete) return [];
    
    if (userType === 'mentor' || userToDelete.role === 'mentor') {
      return activeMentors.filter(m => m.id !== userToDelete.id && m.mentorCode !== userToDelete.id);
    }

    // For staff members, offer compatible active staff users (or super admins/admissions)
    return activeStaffUsers.filter(u => u.id !== userToDelete.id);
  }, [userToDelete, userType, activeMentors, activeStaffUsers]);

  // Pre-select first candidate if not selected
  React.useEffect(() => {
    if (candidateUsers.length > 0 && !selectedTargetUserId) {
      setSelectedTargetUserId(candidateUsers[0].id);
    }
  }, [candidateUsers, selectedTargetUserId]);

  if (!isOpen || !userToDelete || !footprint) return null;

  const handleConfirmTransferAndDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTargetUserId) {
      showToast('Validation Error', 'Please select an active replacement user to take over responsibilities.', 'warning');
      return;
    }

    setIsTransferring(true);
    try {
      const res = await transferTasksAndDeleteUser(userToDelete.id, selectedTargetUserId);
      if (res.success) {
        onClose();
        if (onDeleted) onDeleted();
      }
    } finally {
      setIsTransferring(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-inverse-surface/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-surface border border-outline-variant rounded-2xl p-6 max-w-xl w-full shadow-2xl space-y-5 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-start gap-3 border-b border-outline-variant pb-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[28px]">published_with_changes</span>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-headline-md text-base font-bold text-on-surface">Transfer Tasks &amp; Delete Account</h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                Action Required
              </span>
            </div>
            <p className="text-xs text-secondary mt-0.5 leading-relaxed">
              This account holds active institutional functions and cannot be deleted bare. All assigned duties must be safely migrated to an active replacement user.
            </p>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="text-secondary hover:text-on-surface p-1 rounded-full hover:bg-surface-container cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* User Being Deleted */}
        <div className="p-3.5 rounded-xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-900/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-rose-200 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200 font-bold flex items-center justify-center text-sm">
              {userToDelete.name.charAt(0)}
            </div>
            <div>
              <p className="text-xs font-bold text-on-surface">{userToDelete.name}</p>
              <p className="text-[11px] text-secondary">{userToDelete.email} • <span className="font-semibold text-rose-700 dark:text-rose-400">{userToDelete.roleTitle || userToDelete.role}</span></p>
            </div>
          </div>
          <span className="text-[11px] font-bold text-rose-700 bg-rose-100 dark:bg-rose-900/40 px-2 py-0.5 rounded">
            Target for Removal
          </span>
        </div>

        {/* Active Responsibilities Breakdown */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-secondary uppercase tracking-wider">
              Active Responsibilities to Transfer ({footprint.totalTasks})
            </h4>
            <button
              type="button"
              onClick={() => setIsDetailsExpanded(!isDetailsExpanded)}
              className="text-[11px] text-primary font-bold hover:underline flex items-center gap-0.5 cursor-pointer"
            >
              <span>{isDetailsExpanded ? 'Hide Details' : 'View Details'}</span>
              <span className="material-symbols-outlined text-[14px]">
                {isDetailsExpanded ? 'expand_less' : 'expand_more'}
              </span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <div className="p-2.5 rounded-lg bg-surface border border-outline-variant flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">school</span>
              <div>
                <p className="text-[10px] text-secondary">Assigned Students</p>
                <p className="text-xs font-bold text-on-surface">{footprint.studentsCount} Scholars</p>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-surface border border-outline-variant flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">groups</span>
              <div>
                <p className="text-[10px] text-secondary">Active Cohorts</p>
                <p className="text-xs font-bold text-on-surface">{footprint.cohortsCount} Cohorts</p>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-surface border border-outline-variant flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">calendar_month</span>
              <div>
                <p className="text-[10px] text-secondary">Timetable Slots</p>
                <p className="text-xs font-bold text-on-surface">{footprint.timetablesCount} Classes</p>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-surface border border-outline-variant flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">confirmation_number</span>
              <div>
                <p className="text-[10px] text-secondary">Open Tickets</p>
                <p className="text-xs font-bold text-on-surface">{footprint.ticketsCount} Tickets</p>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-surface border border-outline-variant flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">person_search</span>
              <div>
                <p className="text-[10px] text-secondary">Active Leads</p>
                <p className="text-xs font-bold text-on-surface">{footprint.leadsCount} Leads</p>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-surface border border-outline-variant flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">menu_book</span>
              <div>
                <p className="text-[10px] text-secondary">Academic Tracks</p>
                <p className="text-xs font-bold text-on-surface">{footprint.coursesCount} Programs</p>
              </div>
            </div>
          </div>

          {/* Expandable Breakdown List */}
          {isDetailsExpanded && (
            <div className="p-3 bg-surface-container rounded-lg border border-outline-variant text-xs space-y-2 max-h-40 overflow-y-auto">
              {footprint.assignedStudents.length > 0 && (
                <div>
                  <span className="font-bold text-on-surface">Students: </span>
                  <span className="text-secondary">
                    {footprint.assignedStudents.map(s => `${s.name} (${s.program})`).join(', ')}
                  </span>
                </div>
              )}
              {footprint.assignedCohorts.length > 0 && (
                <div>
                  <span className="font-bold text-on-surface">Cohorts: </span>
                  <span className="text-secondary">
                    {footprint.assignedCohorts.map(c => c.name).join(', ')}
                  </span>
                </div>
              )}
              {footprint.assignedTimetables.length > 0 && (
                <div>
                  <span className="font-bold text-on-surface">Upcoming Lectures: </span>
                  <span className="text-secondary">
                    {footprint.assignedTimetables.map(t => `${t.topic} (${t.dayOfWeek})`).join(', ')}
                  </span>
                </div>
              )}
              {footprint.assignedTickets.length > 0 && (
                <div>
                  <span className="font-bold text-on-surface">Open Tickets: </span>
                  <span className="text-secondary">
                    {footprint.assignedTickets.map(t => t.title).join(', ')}
                  </span>
                </div>
              )}
              {footprint.assignedLeads.length > 0 && (
                <div>
                  <span className="font-bold text-on-surface">Leads: </span>
                  <span className="text-secondary">
                    {footprint.assignedLeads.map(l => l.name).join(', ')}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Replacement User Selector */}
        <form onSubmit={handleConfirmTransferAndDelete} className="space-y-4 pt-1">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-on-surface">
              Select Active Replacement {userType === 'mentor' ? 'Faculty Mentor' : 'Staff Member'} <span className="text-error">*</span>
            </label>
            <p className="text-[11px] text-secondary">
              Only active, verified accounts are eligible. Deactivated users cannot receive transferred responsibilities.
            </p>

            {candidateUsers.length === 0 ? (
              <div className="p-3 bg-error/10 border border-error/20 rounded-lg text-error text-xs font-semibold">
                No active replacement {userType === 'mentor' ? 'faculty mentors' : 'staff members'} available. Please activate or onboard another user first.
              </div>
            ) : (
              <select
                value={selectedTargetUserId}
                onChange={e => setSelectedTargetUserId(e.target.value)}
                className="w-full h-11 px-3 bg-surface border border-primary/60 rounded-xl text-xs font-semibold text-on-surface focus:border-primary outline-none cursor-pointer shadow-xs"
                required
              >
                {candidateUsers.map(c => {
                  const menteeCount = (c as any).activeMentees !== undefined ? ` • ${(c as any).activeMentees} active mentees` : '';
                  const dept = (c as any).department ? ` (${(c as any).department})` : '';
                  return (
                    <option key={c.id} value={c.id}>
                      {c.name} {dept} — {(c as any).roleTitle || c.role}{menteeCount}
                    </option>
                  );
                })}
              </select>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2 border-t border-outline-variant">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-10 rounded-xl bg-surface hover:bg-surface-container border border-outline-variant font-bold text-xs text-on-surface transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isTransferring || candidateUsers.length === 0 || !selectedTargetUserId}
              className="flex-1 h-10 rounded-xl bg-amber-600 hover:bg-amber-700 font-bold text-xs text-white shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[16px]">swap_horiz</span>
              <span>{isTransferring ? 'Transferring & Deleting...' : 'Transfer All Tasks & Delete Account'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
