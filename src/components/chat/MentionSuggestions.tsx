import React, { useMemo } from 'react';
import { ChatUserTarget } from '../../types/chat';

interface MentionSuggestionsProps {
  users: ChatUserTarget[];
  filterText: string;
  onSelect: (user: ChatUserTarget) => void;
  onClose: () => void;
}

export const MentionSuggestions: React.FC<MentionSuggestionsProps> = ({
  users,
  filterText,
  onSelect,
  onClose,
}) => {
  const filtered = useMemo(() => {
    const q = filterText.toLowerCase().trim();
    if (!q) return users.slice(0, 8);
    return users.filter(u => 
      u.name.toLowerCase().includes(q) || 
      u.email.toLowerCase().includes(q) ||
      (u.roleTitle && u.roleTitle.toLowerCase().includes(q))
    ).slice(0, 8);
  }, [users, filterText]);

  if (filtered.length === 0) return null;

  return (
    <div 
      className="absolute bottom-full left-0 mb-2 w-72 sm:w-80 max-h-60 overflow-y-auto overscroll-contain bg-surface-container-lowest border border-outline-variant rounded-xl shadow-xl z-50 animate-in fade-in zoom-in-95 duration-100"
    >
      <div className="p-2 border-b border-outline-variant bg-surface text-[10px] font-bold uppercase tracking-wider text-secondary flex items-center justify-between">
        <span className="flex items-center gap-1">
          <span className="material-symbols-outlined text-[13px] text-primary">alternate_email</span>
          <span>Mention a Team Member</span>
        </span>
        <button 
          type="button" 
          onClick={onClose}
          className="text-secondary hover:text-on-surface cursor-pointer"
        >
          <span className="material-symbols-outlined text-[14px]">close</span>
        </button>
      </div>

      <div className="p-1 space-y-0.5">
        {filtered.map((user) => (
          <button
            key={user.id}
            type="button"
            onClick={() => onSelect(user)}
            className="w-full text-left p-2 rounded-lg hover:bg-surface-container-high transition-colors flex items-center gap-2.5 cursor-pointer group"
          >
            {user.avatar ? (
              <img 
                src={user.avatar} 
                alt={user.name} 
                className="w-7 h-7 rounded-full object-cover border border-outline-variant shrink-0" 
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0">
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="font-bold text-xs text-on-surface truncate group-hover:text-primary transition-colors flex items-center gap-1.5">
                <span>{user.name}</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-surface-container text-secondary font-medium uppercase tracking-wide">
                  {user.role}
                </span>
              </div>
              <div className="text-[10px] text-secondary truncate">
                {user.roleTitle || user.email}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
