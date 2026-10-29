import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useCRM } from '../../context/CRMContext';
import { ChatConversation, ChatMessage, ChatAttachment, ChatUserTarget } from '../../types/chat';
import { MentionSuggestions } from './MentionSuggestions';

export const FloatingChatWidget: React.FC = () => {
  const {
    currentUser,
    unreadChatCount,
    refreshUnreadChatCount,
    isChatPopoutOpen,
    setIsChatPopoutOpen,
    openForwardModal,
    deleteChatMessage,
    isSuperAdmin,
  } = useCRM();
  const location = useLocation();
  const navigate = useNavigate();

  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [allowedUsers, setAllowedUsers] = useState<ChatUserTarget[]>([]);
  const [isChannelDropdownOpen, setIsChannelDropdownOpen] = useState(false);
  const [isNewDmOpen, setIsNewDmOpen] = useState(false);
  const [dmSearchQuery, setDmSearchQuery] = useState('');

  const [inputText, setInputText] = useState('');
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [replyingTo, setReplyingTo] = useState<{ messageId: string; senderName: string; contentSnippet: string } | null>(null);

  // Mention autocomplete state
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [taggedUserIds, setTaggedUserIds] = useState<string[]>([]);

  // Preview notification for incoming messages
  const [latestIncomingToast, setLatestIncomingToast] = useState<{ sender: string; text: string } | null>(null);
  const prevUnreadCountRef = useRef<number>(unreadChatCount);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // 1. Fetch conversations
  const fetchConversations = async () => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/chat/conversations?userId=${encodeURIComponent(currentUser.id)}&role=${encodeURIComponent(currentUser.role)}&email=${encodeURIComponent(currentUser.email)}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setConversations(data.data);
        if (!activeConvId && data.data.length > 0) {
          setActiveConvId(data.data[0].id);
        }
      }
    } catch (err) {
      console.error('FloatingChatWidget: Error fetching conversations:', err);
    }
  };

  // 2. Fetch eligible mention targets
  const fetchAllowedUsers = async () => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/chat/users?userId=${encodeURIComponent(currentUser.id)}&role=${encodeURIComponent(currentUser.role)}&email=${encodeURIComponent(currentUser.email)}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setAllowedUsers(data.data);
      }
    } catch (err) {
      console.error('FloatingChatWidget: Error fetching users:', err);
    }
  };

  // 3. Fetch active messages
  const fetchActiveMessages = async (convId: string) => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/chat/conversations/${convId}/messages?userId=${encodeURIComponent(currentUser.id)}&role=${encodeURIComponent(currentUser.role)}&email=${encodeURIComponent(currentUser.email)}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setMessages(data.data);
      }
    } catch (err) {
      console.error('FloatingChatWidget: Error fetching messages:', err);
    }
  };

  // Mark conversation read
  const markAsRead = async (convId: string) => {
    if (!currentUser) return;
    try {
      await fetch(`/api/chat/conversations/${convId}/read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id })
      });
      await refreshUnreadChatCount();
    } catch (err) {
      console.error('FloatingChatWidget: Error marking read:', err);
    }
  };

  useEffect(() => {
    if (!currentUser || location.pathname === '/chat') return;
    fetchConversations();
    fetchAllowedUsers();
  }, [currentUser, location.pathname]);

  useEffect(() => {
    if (isChatPopoutOpen && activeConvId) {
      fetchActiveMessages(activeConvId);
      markAsRead(activeConvId);
    }
  }, [isChatPopoutOpen, activeConvId]);

  // Polling when popout is open
  useEffect(() => {
    if (!isChatPopoutOpen) return;
    const timer = setInterval(() => {
      if (activeConvId) {
        fetchActiveMessages(activeConvId);
      }
      fetchConversations();
    }, 4000);
    return () => clearInterval(timer);
  }, [isChatPopoutOpen, activeConvId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (isChatPopoutOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isChatPopoutOpen]);

  // Watch for unread increment when popout is closed to trigger discrete popup notification
  useEffect(() => {
    if (!currentUser) return;
    if (unreadChatCount > prevUnreadCountRef.current && !isChatPopoutOpen) {
      // Fetch latest conversation message to display popup toast
      fetch(`/api/chat/conversations?userId=${encodeURIComponent(currentUser.id)}&role=${encodeURIComponent(currentUser.role)}&email=${encodeURIComponent(currentUser.email)}`)
        .then(r => r.json())
        .then(data => {
          if (data.success && Array.isArray(data.data)) {
            const hasLast = data.data.find((c: ChatConversation) => c.lastMessage);
            if (hasLast?.lastMessage) {
              setLatestIncomingToast({
                sender: hasLast.lastMessage.senderName,
                text: hasLast.lastMessage.content || 'Sent an attachment'
              });
              // Auto hide toast after 6 seconds
              setTimeout(() => setLatestIncomingToast(null), 6000);
            }
          }
        })
        .catch(() => {});
    }
    prevUnreadCountRef.current = unreadChatCount;
  }, [unreadChatCount, isChatPopoutOpen, currentUser]);

  // Input typing with mention detector
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setInputText(val);

    const cursorPos = e.target.selectionStart;
    const textBeforeCursor = val.slice(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');

    if (lastAtIndex !== -1) {
      const charBeforeAt = lastAtIndex > 0 ? textBeforeCursor[lastAtIndex - 1] : ' ';
      if (charBeforeAt === ' ' || charBeforeAt === '\n') {
        const query = textBeforeCursor.slice(lastAtIndex + 1);
        if (!query.includes(' ')) {
          setMentionQuery(query);
          return;
        }
      }
    }
    setMentionQuery(null);
  };

  const handleSelectMention = (user: ChatUserTarget) => {
    if (!inputRef.current) return;
    const cursorPos = inputRef.current.selectionStart;
    const textBeforeCursor = inputText.slice(0, cursorPos);
    const textAfterCursor = inputText.slice(cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');

    const prefix = textBeforeCursor.slice(0, lastAtIndex);
    const newText = `${prefix}@${user.name} ${textAfterCursor}`;
    setInputText(newText);
    setTaggedUserIds(prev => Array.from(new Set([...prev, user.id])));
    setMentionQuery(null);

    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const readers: Promise<ChatAttachment>[] = Array.from(files).map(file => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (ev) => {
          resolve({
            id: `att-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            name: file.name,
            url: (ev.target?.result as string) || '',
            size: file.size,
            type: file.type,
          });
        };
        reader.readAsDataURL(file);
      });
    });

    Promise.all(readers).then(results => {
      setAttachments(prev => [...prev, ...results]);
      e.target.value = '';
    });
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!activeConvId || (!inputText.trim() && attachments.length === 0) || isSending || !currentUser) return;

    setIsSending(true);
    try {
      const payload = {
        senderId: currentUser.id,
        senderName: currentUser.name,
        senderEmail: currentUser.email,
        senderRole: currentUser.role,
        senderRoleTitle: currentUser.roleTitle,
        senderAvatar: currentUser.avatar,
        content: inputText.trim(),
        replyTo: replyingTo || undefined,
        mentions: taggedUserIds,
        attachments,
      };

      const res = await fetch(`/api/chat/conversations/${activeConvId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success && data.data) {
        setMessages(prev => [...prev, data.data]);
        setInputText('');
        setAttachments([]);
        setTaggedUserIds([]);
        setReplyingTo(null);
        setMentionQuery(null);
        fetchConversations();
        await refreshUnreadChatCount();
      }
    } catch (err) {
      console.error('FloatingChatWidget: Error sending message:', err);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleStartDirectMessage = async (targetUser: ChatUserTarget) => {
    if (!currentUser) return;
    try {
      const res = await fetch('/api/chat/direct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: currentUser.id,
          senderEmail: currentUser.email,
          senderName: currentUser.name,
          senderRole: currentUser.role,
          targetUserId: targetUser.id,
          targetEmail: targetUser.email,
          targetName: targetUser.name,
          targetRole: targetUser.role
        })
      });
      const data = await res.json();
      if (data.success && data.data) {
        setConversations(prev => {
          const exists = prev.some(c => c.id === data.data.id);
          return exists ? prev : [data.data, ...prev];
        });
        setActiveConvId(data.data.id);
        setIsNewDmOpen(false);
        setDmSearchQuery('');
        setIsChannelDropdownOpen(false);
      }
    } catch (err) {
      console.error('FloatingChatWidget: Error starting direct message:', err);
    }
  };

  const filteredDmUsers = allowedUsers.filter(u => {
    const q = dmSearchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.role && u.role.toLowerCase().includes(q)) ||
      (u.roleTitle && u.roleTitle.toLowerCase().includes(q))
    );
  });

  const activeConv = conversations.find(c => c.id === activeConvId);

  const handleDeleteMessage = async (msgId: string) => {
    const ok = await deleteChatMessage(msgId);
    if (ok) {
      setMessages(prev =>
        prev.map(m =>
          m.id === msgId
            ? { ...m, isDeleted: true, content: '🚫 This message was deleted', attachments: [] }
            : m
        )
      );
    }
  };

  const renderMessageContent = (content: string, isSelf = false) => {
    const parts = content.split(/(https?:\/\/[^\s]+|www\.[^\s]+|@[a-zA-Z0-9_.-]+)/g);
    return parts.map((part, index) => {
      if (part.startsWith('http://') || part.startsWith('https://') || part.startsWith('www.')) {
        const href = part.startsWith('http') ? part : `https://${part}`;
        return (
          <a
            key={index}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className={`underline font-semibold hover:opacity-80 break-all cursor-pointer ${
              isSelf ? 'text-white' : 'text-blue-500 dark:text-blue-400'
            }`}
          >
            {part}
          </a>
        );
      }
      if (part.startsWith('@')) {
        return (
          <span
            key={index}
            className={`inline-flex items-center px-1.5 py-0.2 mx-0.5 rounded font-bold text-[11px] ${
              isSelf 
                ? 'bg-white/20 text-white border border-white/30' 
                : 'bg-primary/10 text-primary border border-primary/20'
            }`}
          >
            {part}
          </span>
        );
      }
      return <span key={index} className={isSelf ? 'text-white font-medium' : undefined}>{part}</span>;
    });
  };

  // If already on the full Chat page or not logged in, hide floating widget safely in render phase
  if (location.pathname === '/chat' || !currentUser) {
    return null;
  }

  return (
    <aside aria-label="Team Chat" className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-40 flex flex-col items-end pointer-events-none">
      {/* 1. Discrete Incoming Message Push / Popup Notification */}
      {latestIncomingToast && !isChatPopoutOpen && (
        <div 
          onClick={() => {
            setIsChatPopoutOpen(true);
            setLatestIncomingToast(null);
          }}
          className="pointer-events-auto mb-3 max-w-xs sm:max-w-sm bg-surface-container-lowest border border-primary/30 p-3 rounded-xl shadow-2xl flex items-start gap-3 cursor-pointer hover:border-primary transition-all duration-200 animate-in slide-in-from-bottom-3 fade-in group"
        >
          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[18px]">chat</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-on-surface truncate">{latestIncomingToast.sender}</span>
              <span className="text-[10px] text-primary font-medium group-hover:underline">Reply</span>
            </div>
            <p className="text-xs text-secondary truncate mt-0.5">{latestIncomingToast.text}</p>
          </div>
          <button 
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setLatestIncomingToast(null);
            }}
            className="text-secondary hover:text-on-surface p-0.5 -mr-1 -mt-1"
          >
            <span className="material-symbols-outlined text-[14px]">close</span>
          </button>
        </div>
      )}

      {/* 2. Docked Chat Popout Window */}
      {isChatPopoutOpen && (
        <div 
          data-testid="floating-chat-popout"
          className="pointer-events-auto mb-3 w-[calc(100vw-2rem)] sm:w-[390px] md:w-[420px] h-[520px] max-h-[82vh] flex flex-col bg-surface border border-outline-variant rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-150"
        >
          {/* Header */}
          <div className="p-3 bg-primary text-white flex items-center justify-between shrink-0 shadow-sm">
            <div className="flex items-center gap-2 min-w-0 relative">
              <button 
                type="button"
                onClick={() => setIsChannelDropdownOpen(!isChannelDropdownOpen)}
                className="flex items-center gap-1.5 text-left hover:bg-white/10 px-2 py-1 rounded-lg transition-colors cursor-pointer"
                title="Switch channel or conversation"
              >
                <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-white shrink-0">
                  <span className="material-symbols-outlined text-[16px]">
                    {activeConv?.type === 'direct' ? 'person' : 'tag'}
                  </span>
                </div>
                <div className="min-w-0 max-w-[170px] sm:max-w-[200px]">
                  <h4 className="text-xs font-bold truncate leading-tight text-white">
                    {activeConv?.name || 'Institutional Chat'}
                  </h4>
                  <p className="text-[10px] text-white/80 truncate">
                    {activeConv?.type === 'direct' ? 'Direct Message' : 'Team Channel'}
                  </p>
                </div>
                <span className="material-symbols-outlined text-[16px] text-white/80">
                  {isChannelDropdownOpen ? 'expand_less' : 'expand_more'}
                </span>
              </button>

              {/* Channel Selector Dropdown */}
              {isChannelDropdownOpen && (
                <div 
                  className="absolute top-full left-0 mt-1 w-64 max-h-68 overflow-y-auto overscroll-contain bg-surface border border-outline-variant rounded-xl shadow-xl z-50 p-1 text-on-surface"
                >
                  <div className="flex items-center justify-between px-2 py-1.5 border-b border-outline-variant/60 mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-secondary">
                      Conversations
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setIsNewDmOpen(true);
                        setIsChannelDropdownOpen(false);
                      }}
                      className="text-[10px] text-primary font-bold hover:underline flex items-center gap-0.5 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[12px]">person_add</span>
                      <span>+ New DM</span>
                    </button>
                  </div>
                  {conversations.map(conv => (
                    <button
                      key={conv.id}
                      type="button"
                      onClick={() => {
                        setActiveConvId(conv.id);
                        setIsChannelDropdownOpen(false);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors ${
                        activeConvId === conv.id ? 'bg-primary/10 text-primary font-bold' : 'hover:bg-surface-container-high text-on-surface'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="material-symbols-outlined text-[14px]">
                          {conv.type === 'direct' ? 'person' : conv.type === 'subgroup' ? 'groups' : 'tag'}
                        </span>
                        <span className="truncate">{conv.name}</span>
                      </div>
                      {conv.unreadCount ? (
                        <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[9px] bg-red-500 text-white font-bold">
                          {conv.unreadCount}
                        </span>
                      ) : null}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Header Right Actions */}
            <div className="flex items-center gap-1">
              <button 
                type="button"
                onClick={() => setIsNewDmOpen(true)}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/15 text-white/90 hover:text-white transition-colors cursor-pointer"
                title="Start Direct Message"
              >
                <span className="material-symbols-outlined text-[18px]">person_add</span>
              </button>
              <button 
                type="button"
                onClick={() => {
                  setIsChatPopoutOpen(false);
                  navigate('/chat');
                }}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/15 text-white/90 hover:text-white transition-colors cursor-pointer"
                title="Expand to Full Chat Page"
              >
                <span className="material-symbols-outlined text-[18px]">open_in_new</span>
              </button>
              <button 
                type="button"
                onClick={() => setIsChatPopoutOpen(false)}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/15 text-white/90 hover:text-white transition-colors cursor-pointer"
                title="Minimize Popout"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
          </div>

          {/* Searchable Direct Message Contact Overlay */}
          {isNewDmOpen ? (
            <div className="flex-1 flex flex-col p-3 bg-surface overflow-hidden">
              <div className="flex items-center justify-between pb-2 border-b border-outline-variant/60 mb-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-on-surface">
                  <span className="material-symbols-outlined text-primary text-[18px]">person_add</span>
                  <span>New Direct Message</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsNewDmOpen(false);
                    setDmSearchQuery('');
                  }}
                  className="p-1 rounded-md text-secondary hover:text-on-surface hover:bg-surface-container cursor-pointer"
                  title="Close search"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              </div>

              {/* DM Search Input */}
              <div className="relative mb-2">
                <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-secondary">
                  <span className="material-symbols-outlined text-[16px]">search</span>
                </span>
                <input
                  type="text"
                  value={dmSearchQuery}
                  onChange={(e) => setDmSearchQuery(e.target.value)}
                  placeholder="Search user by name, role, email..."
                  className="w-full pl-8 pr-7 py-1.5 text-xs bg-surface-container-low border border-outline-variant rounded-xl text-on-surface focus:outline-none focus:border-primary placeholder:text-secondary/60"
                  autoFocus
                />
                {dmSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setDmSearchQuery('')}
                    className="absolute inset-y-0 right-0 pr-2 flex items-center text-secondary hover:text-on-surface cursor-pointer"
                    title="Clear search"
                  >
                    <span className="material-symbols-outlined text-[14px]">cancel</span>
                  </button>
                )}
              </div>

              <div className="text-[10px] text-secondary mb-1 flex items-center justify-between px-0.5">
                <span>{filteredDmUsers.length} contact{filteredDmUsers.length === 1 ? '' : 's'}</span>
                {dmSearchQuery && (
                  <span className="text-primary truncate max-w-[130px] font-medium">"{dmSearchQuery}"</span>
                )}
              </div>

              {/* Contacts List */}
              <div className="flex-1 overflow-y-auto overscroll-contain space-y-1">
                {allowedUsers.length === 0 ? (
                  <div className="p-4 text-center text-xs text-secondary">
                    No eligible contacts available for your role.
                  </div>
                ) : filteredDmUsers.length === 0 ? (
                  <div className="p-4 text-center text-xs text-secondary">
                    <span className="material-symbols-outlined text-xl text-secondary/40 mb-1">person_search</span>
                    <p className="font-semibold">No contacts found</p>
                    <p className="text-[10px] text-secondary/70">Try a different search term</p>
                  </div>
                ) : (
                  filteredDmUsers.map((user) => (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => handleStartDirectMessage(user)}
                      className="w-full text-left p-2 rounded-xl hover:bg-surface-container-high transition-colors flex items-center justify-between cursor-pointer group border border-transparent hover:border-outline-variant"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {user.avatar ? (
                          <img 
                            src={user.avatar} 
                            alt={user.name} 
                            className="w-7 h-7 rounded-full object-cover shrink-0 border border-outline-variant" 
                          />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="font-bold text-xs text-on-surface truncate group-hover:text-primary transition-colors">
                            {user.name}
                          </div>
                          <div className="text-[10px] text-secondary truncate">
                            {user.roleTitle || user.role}
                          </div>
                        </div>
                      </div>
                      <span className="material-symbols-outlined text-[14px] text-secondary group-hover:text-primary">
                        chat
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>
          ) : (
            <>
              {/* Messages Stream */}
              <div className="flex-1 overflow-y-auto overscroll-contain p-3 space-y-3 bg-[#F8FAFC]">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-4 text-secondary">
                <span className="material-symbols-outlined text-3xl mb-1 text-secondary/40">chat_bubble_outline</span>
                <p className="text-xs font-semibold">No messages yet</p>
                <p className="text-[11px] text-secondary/70">Start the conversation below</p>
              </div>
            ) : (
              messages.map(msg => {
                const isMe = msg.senderId === currentUser.id;
                return (
                  <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-[10px] font-semibold text-secondary">
                        {isMe ? 'You' : msg.senderName}
                      </span>
                      {msg.senderRoleTitle && !isMe && (
                        <span className="text-[9px] px-1 py-0.2 rounded bg-surface-container-high text-secondary">
                          {msg.senderRoleTitle}
                        </span>
                      )}
                      <span className="text-[9px] text-secondary/60">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div 
                      className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-relaxed shadow-xs relative group/msg ${
                        isMe 
                          ? 'bg-primary text-white rounded-br-xs' 
                          : 'bg-white text-on-surface border border-outline-variant/60 rounded-bl-xs'
                      }`}
                    >
                      {/* Provenance Header if Forwarded */}
                      {msg.forwardedFrom && (
                        <div className={`flex items-center gap-1 text-[9px] italic mb-1 pb-1 border-b ${
                          isMe ? 'border-white/20 text-white/80' : 'border-outline-variant/40 text-secondary'
                        }`}>
                          <span className="material-symbols-outlined text-[11px]">forward</span>
                          <span>Forwarded from <strong>{msg.forwardedFrom.originalSenderName}</strong></span>
                        </div>
                      )}

                      {/* Quoted Header if Reply */}
                      {msg.replyTo && (
                        <div className={`p-1.5 mb-1.5 rounded border-l-2 text-[10px] ${
                          isMe ? 'bg-black/15 border-white/80 text-white' : 'bg-primary/10 border-primary text-on-surface'
                        }`}>
                          <span className="font-bold">{msg.replyTo.senderName}:</span> {msg.replyTo.contentSnippet}
                        </div>
                      )}

                      {/* Content or Voice Player or Deleted Tombstone */}
                      {msg.isDeleted ? (
                        <p className="italic text-[11px] opacity-75 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[13px]">block</span>
                          <span>This message was deleted</span>
                        </p>
                      ) : msg.messageType === 'voice' && msg.attachments?.[0] ? (
                        <div className="flex items-center gap-1.5 my-1">
                          <span className="material-symbols-outlined text-[16px] text-rose-500">mic</span>
                          <audio controls src={msg.attachments[0].url} className="h-6 max-w-[180px]" />
                        </div>
                      ) : (
                        <div className="whitespace-pre-wrap break-words">
                          {renderMessageContent(msg.content, isMe)}
                          {msg.isEdited && (
                            <span className="text-[9px] opacity-70 italic ml-1">(edited)</span>
                          )}
                        </div>
                      )}

                      {/* Attachments preview */}
                      {msg.attachments && msg.attachments.length > 0 && msg.messageType !== 'voice' && !msg.isDeleted && (
                        <div className="mt-2 space-y-1">
                          {msg.attachments.map(att => (
                            <a
                              key={att.id}
                              href={att.url}
                              download={att.name}
                              target="_blank"
                              rel="noreferrer"
                              className={`flex items-center gap-2 p-1.5 rounded-lg text-[10px] transition-colors ${
                                isMe 
                                  ? 'bg-white/15 hover:bg-white/25 text-white' 
                                  : 'bg-surface-container-high hover:bg-surface-container-highest text-primary'
                              }`}
                            >
                              <span className="material-symbols-outlined text-[14px]">attachment</span>
                              <span className="truncate max-w-[150px] font-medium">{att.name}</span>
                            </a>
                          ))}
                        </div>
                      )}

                      {/* Quick Hover Action Buttons */}
                      {!msg.isDeleted && (
                        <div className={`absolute top-1 ${isMe ? '-left-14' : '-right-14'} hidden group-hover/msg:flex items-center gap-0.5 bg-surface border border-outline-variant rounded-md p-0.5 shadow-xs`}>
                          <button
                            type="button"
                            onClick={() => {
                              setReplyingTo({
                                messageId: msg.id,
                                senderName: msg.senderName,
                                contentSnippet: (msg.content || 'Attachment').slice(0, 60)
                              });
                              inputRef.current?.focus();
                            }}
                            className="p-1 rounded hover:bg-surface-container text-secondary hover:text-primary transition"
                            title="Reply"
                          >
                            <span className="material-symbols-outlined text-[13px]">reply</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => openForwardModal(msg)}
                            className="p-1 rounded hover:bg-surface-container text-secondary hover:text-primary transition"
                            title="Forward"
                          >
                            <span className="material-symbols-outlined text-[13px]">forward</span>
                          </button>
                          {(isMe || isSuperAdmin) && (
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm('Delete this message?')) {
                                  handleDeleteMessage(msg.id);
                                }
                              }}
                              className="p-1 rounded hover:bg-surface-container text-secondary hover:text-rose-500 transition"
                              title="Delete"
                            >
                              <span className="material-symbols-outlined text-[13px]">delete</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Mention Autocomplete Overlay */}
          {mentionQuery !== null && (
            <div className="relative px-3">
              <MentionSuggestions
                users={allowedUsers}
                filterText={mentionQuery}
                onSelect={handleSelectMention}
                onClose={() => setMentionQuery(null)}
              />
            </div>
          )}

          {/* Active Reply Banner in Popout */}
          {replyingTo && (
            <div className="px-3 py-1 bg-primary/10 border-t border-primary/20 flex items-center justify-between text-[11px] text-primary shrink-0 animate-fade-in">
              <span className="truncate">
                Replying to <strong>{replyingTo.senderName}</strong>: <span className="opacity-80 truncate">{replyingTo.contentSnippet}</span>
              </span>
              <button 
                type="button" 
                onClick={() => setReplyingTo(null)} 
                className="hover:text-red-500 p-0.5 ml-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[14px]">close</span>
              </button>
            </div>
          )}

          {/* Pending Attachments Strip */}
          {attachments.length > 0 && (
            <div className="px-3 py-1.5 bg-surface border-t border-outline-variant flex flex-wrap gap-1.5 shrink-0">
              {attachments.map(att => (
                <div key={att.id} className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] border border-primary/20">
                  <span className="material-symbols-outlined text-[12px]">attachment</span>
                  <span className="truncate max-w-[100px]">{att.name}</span>
                  <button 
                    type="button" 
                    onClick={() => setAttachments(prev => prev.filter(a => a.id !== att.id))}
                    className="hover:text-red-500 ml-0.5"
                  >
                    <span className="material-symbols-outlined text-[12px]">close</span>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Input Footer */}
          <form onSubmit={handleSendMessage} className="p-2.5 bg-surface border-t border-outline-variant flex items-end gap-2 shrink-0">
            <input 
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              multiple
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-1.5 text-secondary hover:text-primary rounded-lg hover:bg-surface-container-high transition-colors shrink-0"
              title="Attach File or Document"
            >
              <span className="material-symbols-outlined text-[18px]">attach_file</span>
            </button>

            <div className="flex-1 min-w-0">
              <textarea
                ref={inputRef}
                value={inputText}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Type a message (@ to mention)..."
                rows={1}
                className="w-full text-xs p-2 rounded-xl bg-surface-container-low border border-outline-variant focus:outline-none focus:border-primary resize-none max-h-24"
              />
            </div>

            <button
              type="submit"
              disabled={isSending || (!inputText.trim() && attachments.length === 0)}
              className="p-1.5 bg-primary text-white rounded-xl hover:bg-primary-hover disabled:opacity-40 disabled:cursor-not-allowed transition-all shrink-0 cursor-pointer"
              title="Send Message"
            >
              <span className="material-symbols-outlined text-[18px]">send</span>
            </button>
          </form>
          </>
        )}
        </div>
      )}

      {/* 3. Omnipresent Floating Chat Launcher Bubble */}
      {!isChatPopoutOpen && (
        <button
          type="button"
          data-testid="floating-chat-bubble"
          onClick={() => setIsChatPopoutOpen(true)}
          className="pointer-events-auto relative flex items-center justify-center w-13 h-13 rounded-full bg-primary text-white shadow-xl hover:scale-105 active:scale-95 transition-all duration-150 cursor-pointer group"
          title="Open Team Chat"
        >
          <span 
            className="material-symbols-outlined text-[26px]"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            chat
          </span>

          {/* Dynamic Unread Badge */}
          {unreadChatCount > 0 && (
            <span 
              data-testid="floating-chat-badge"
              className="absolute -top-1 -right-1 bg-red-600 text-white text-[11px] font-extrabold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-md font-data-tabular animate-bounce"
            >
              {unreadChatCount > 99 ? '99+' : unreadChatCount}
            </span>
          )}
        </button>
      )}
    </aside>
  );
};
