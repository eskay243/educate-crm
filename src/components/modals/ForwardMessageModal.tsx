import React, { useState, useEffect } from 'react';
import { useCRM } from '../../context/CRMContext';
import { Forward, Search, X, MessageSquare, Hash, Users, Check, AlertCircle, ArrowRight } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Forward className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Forward Message</h2>
              <p className="text-xs text-slate-400">Share this message to another channel or direct contact</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-2 rounded-xl hover:bg-slate-800/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message Preview Box */}
        <div className="p-4 bg-slate-950/40 border-b border-slate-800/60">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
            Message preview
          </div>
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 text-sm text-slate-200">
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold text-xs text-indigo-300">
                {selectedMessageForForward.senderName} ({selectedMessageForForward.senderRole})
              </span>
              <span className="text-[10px] text-slate-500">
                {new Date(selectedMessageForForward.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <p className="line-clamp-3 text-xs leading-relaxed text-slate-300">
              {selectedMessageForForward.content || (
                <span className="italic text-slate-500">
                  [{selectedMessageForForward.messageType || 'Attachment'}]
                </span>
              )}
            </p>
            {selectedMessageForForward.attachments && selectedMessageForForward.attachments.length > 0 && (
              <div className="mt-2 text-[11px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded inline-flex items-center gap-1">
                📎 {selectedMessageForForward.attachments.length} attachment(s) included
              </div>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-slate-800/60">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search channels, groups, or direct messages..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/40 transition-all"
            />
          </div>
        </div>

        {/* Destination List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 min-h-[220px]">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
              <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs">Loading available destinations...</span>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-500 text-center px-4">
              <AlertCircle className="w-8 h-8 mb-2 stroke-[1.5]" />
              <p className="text-sm font-medium">No matching destinations found</p>
              <p className="text-xs text-slate-600 mt-1">Try another search term</p>
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
                      ? 'bg-indigo-600/15 border-indigo-500 text-white shadow-sm'
                      : 'bg-slate-950/40 border-slate-800/80 hover:bg-slate-800/50 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                        isSubgroup
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : isChannel
                          ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}
                    >
                      {isSubgroup ? (
                        <Users className="w-4 h-4" />
                      ) : isChannel ? (
                        <Hash className="w-4 h-4" />
                      ) : (
                        <MessageSquare className="w-4 h-4" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-sm truncate flex items-center gap-2">
                        <span>{conv.name}</span>
                        {isSubgroup && (
                          <span className="text-[10px] bg-amber-500/15 text-amber-300 px-1.5 py-0.2 rounded font-mono border border-amber-500/20">
                            Subgroup
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 truncate">
                        {conv.description || conv.topic || `${conv.participants.length} participant(s)`}
                      </p>
                    </div>
                  </div>

                  <div
                    className={`w-6 h-6 rounded-full border flex items-center justify-center transition-colors shrink-0 ml-3 ${
                      isSelected
                        ? 'bg-indigo-500 border-indigo-400 text-white'
                        : 'border-slate-700 bg-slate-900/60'
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-800 text-sm font-medium text-slate-300 hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!selectedConversationId || isForwarding}
            onClick={handleForward}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-medium text-sm flex items-center gap-2 shadow-lg shadow-indigo-600/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isForwarding ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Forwarding...</span>
              </>
            ) : (
              <>
                <span>Forward Now</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
