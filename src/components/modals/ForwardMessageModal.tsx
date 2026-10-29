import React, { useState, useEffect } from 'react';
import { useCRM } from '../../context/CRMContext';
import { ChatConversation } from '../../types/chat';

export interface ForwardMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ForwardMessageModal: React.FC<ForwardMessageModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, selectedMessageForForward, forwardChatMessage, showToast } = useCRM();

  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isForwarding, setIsForwarding] = useState(false);

  useEffect(() => {
    if (isOpen && currentUser) {
      setIsLoading(true);
      fetch(
        `/api/chat/conversations?userId=${encodeURIComponent(currentUser.id)}&role=${encodeURIComponent(
          currentUser.role
        )}&email=${encodeURIComponent(currentUser.email)}`
      )
        .then(res => res.json())
        .then(data => {
          if (data.success && Array.isArray(data.data)) {
            setConversations(data.data);
          }
        })
        .catch(err => {
          console.error('Failed to load conversations for forwarding:', err);
        })
        .finally(() => setIsLoading(false));
    } else {
      setSelectedConversationId(null);
      setSearchQuery('');
    }
  }, [isOpen, currentUser]);

  if (!isOpen || !selectedMessageForForward) return null;

  const filteredConversations = conversations.filter(c => {
    const q = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      (c.description && c.description.toLowerCase().includes(q)) ||
      (c.topic && c.topic.toLowerCase().includes(q))
    );
  });

  const handleForward = async () => {
    if (!selectedConversationId) {
      showToast('Selection Required', 'Please select a destination channel or conversation.', 'warning');
      return;
    }

    setIsForwarding(true);
    try {
      const ok = await forwardChatMessage(selectedConversationId, selectedMessageForForward);
      if (ok) {
        onClose();
      }
    } finally {
      setIsForwarding(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-inverse-surface/50 backdrop-blur-xs p-2 sm:p-4 md:p-6 flex flex-col justify-start items-center animate-in fade-in duration-200">
      <div className="fixed inset-0 -z-10" onClick={onClose} aria-hidden="true" />
      <div 
        className="my-auto relative w-full max-w-lg max-h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-2.5rem)] md:max-h-[calc(100dvh-3rem)] rounded-t-2xl sm:rounded-2xl shadow-modal flex flex-col overflow-hidden bg-surface border border-outline z-10 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between p-4 sm:p-5 border-b border-outline bg-surface-bright">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
              <span className="material-symbols-outlined text-[22px]">forward</span>
            </div>
            <div>
              <h3 className="font-headline-md text-base sm:text-lg font-bold text-on-surface">
                Forward Message
              </h3>
              <p className="text-xs text-secondary">
                Share this message to another channel or direct contact
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

        {/* Message Preview Box */}
        <div className="shrink-0 p-4 bg-surface-container-low border-b border-outline">
          <div className="text-[10px] font-bold text-secondary uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[14px] text-primary">chat</span>
            <span>Message Preview</span>
          </div>
          <div className="bg-surface border border-outline rounded-xl p-3 text-xs text-on-surface shadow-xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-primary">
                {selectedMessageForForward.senderName} ({selectedMessageForForward.senderRole})
              </span>
              <span className="text-[10px] text-secondary font-mono">
                {new Date(selectedMessageForForward.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <p className="line-clamp-3 text-xs leading-relaxed text-secondary">
              {selectedMessageForForward.content || (
                <span className="italic opacity-60">
                  [{selectedMessageForForward.messageType || 'Attachment'}]
                </span>
              )}
            </p>
            {selectedMessageForForward.attachments && selectedMessageForForward.attachments.length > 0 && (
              <div className="mt-1.5 text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md inline-flex items-center gap-1 font-semibold">
                <span className="material-symbols-outlined text-[12px]">attachment</span>
                <span>{selectedMessageForForward.attachments.length} attachment(s) included</span>
              </div>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="shrink-0 p-3.5 border-b border-outline bg-surface">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-secondary text-[18px]">search</span>
            <input
              type="text"
              placeholder="Search channels, groups, or direct messages..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-canvas border border-outline rounded-lg pl-9 pr-3 py-2 text-xs sm:text-sm text-on-surface placeholder:text-secondary focus:border-primary focus:bg-surface outline-none font-medium"
            />
          </div>
        </div>

        {/* Destination List */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 space-y-2 bg-canvas">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center text-secondary gap-2">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-semibold">Loading available destinations...</span>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-secondary text-center px-4 bg-surface rounded-xl border border-outline">
              <span className="material-symbols-outlined text-secondary text-[32px] mb-1">warning</span>
              <p className="text-sm font-bold text-on-surface">No matching destinations found</p>
              <p className="text-xs text-secondary mt-0.5">Try searching with a different term</p>
            </div>
          ) : (
            filteredConversations.map(conv => {
              const isSelected = selectedConversationId === conv.id;
              const isSubgroup = conv.type === 'subgroup';
              const isChannel = conv.type === 'channel';

              return (
                <div
                  key={conv.id}
                  onClick={() => setSelectedConversationId(conv.id)}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-primary/5 border-primary text-primary shadow-xs font-semibold'
                      : 'bg-surface border-outline hover:border-outline-variant hover:bg-surface-container text-on-surface'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                        isSubgroup
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : isChannel
                          ? 'bg-blue-100 text-primary border border-blue-200'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        {isSubgroup ? 'groups' : isChannel ? 'tag' : 'chat'}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-xs sm:text-sm truncate flex items-center gap-2">
                        <span>{conv.name}</span>
                        {isSubgroup && (
                          <span className="text-[10px] bg-amber-50 text-amber-800 px-1.5 py-0.2 rounded font-mono border border-amber-200 font-bold">
                            Subgroup
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-secondary truncate">
                        {conv.description || conv.topic || `${conv.participants.length} participant(s)`}
                      </p>
                    </div>
                  </div>

                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors shrink-0 ml-3 ${
                      isSelected
                        ? 'bg-primary border-primary text-white'
                        : 'border-outline-variant bg-surface'
                    }`}
                  >
                    {isSelected && <span className="material-symbols-outlined text-[12px] font-bold">check</span>}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 p-3 sm:p-4 border-t border-outline bg-surface-bright flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-secondary hover:text-on-surface cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!selectedConversationId || isForwarding}
            onClick={handleForward}
            className="px-5 py-2.5 rounded-lg bg-primary hover:bg-primary-hover text-white font-bold text-xs flex items-center gap-1.5 shadow-xs disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            {isForwarding ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Forwarding...</span>
              </>
            ) : (
              <>
                <span>Forward Now</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
