import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useCRM } from '../context/CRMContext';
import { ChatConversation, ChatMessage, ChatAttachment, ChatUserTarget } from '../types/chat';
import { MentionSuggestions } from '../components/chat/MentionSuggestions';

export const ChatPage: React.FC = () => {
  const { currentUser, showToast } = useCRM();

  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [allowedUsers, setAllowedUsers] = useState<ChatUserTarget[]>([]);

  const [searchFilter, setSearchFilter] = useState('');
  const [inputText, setInputText] = useState('');
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [isNewDmOpen, setIsNewDmOpen] = useState(false);
  const [dmSearchQuery, setDmSearchQuery] = useState('');

  // Mention autocomplete state
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [taggedUserIds, setTaggedUserIds] = useState<string[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 1. Fetch conversations & eligible users for current user
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
      console.error('Error fetching conversations:', err);
    }
  };

  const fetchAllowedUsers = async () => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/chat/users?userId=${encodeURIComponent(currentUser.id)}&role=${encodeURIComponent(currentUser.role)}&email=${encodeURIComponent(currentUser.email)}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setAllowedUsers(data.data);
      }
    } catch (err) {
      console.error('Error fetching allowed users:', err);
    }
  };

  useEffect(() => {
    fetchConversations();
    fetchAllowedUsers();
  }, [currentUser]);

  // 2. Fetch messages for active conversation
  const fetchActiveMessages = async (convId: string) => {
    try {
      const res = await fetch(`/api/chat/conversations/${convId}/messages`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setMessages(data.data);
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
    }
  };

  useEffect(() => {
    if (activeConvId) {
      fetchActiveMessages(activeConvId);
      // Mark read
      if (currentUser) {
        fetch(`/api/chat/conversations/${activeConvId}/read`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: currentUser.id })
        }).catch(() => {});
      }
    }
  }, [activeConvId]);

  // 3. Polling interval for real-time responsiveness (every 4 seconds)
  useEffect(() => {
    const timer = setInterval(() => {
      if (activeConvId) {
        fetchActiveMessages(activeConvId);
      }
      fetchConversations();
    }, 4000);
    return () => clearInterval(timer);
  }, [activeConvId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const activeConversation = useMemo(() => {
    return conversations.find(c => c.id === activeConvId) || null;
  }, [conversations, activeConvId]);

  const channels = useMemo(() => {
    return conversations.filter(c => c.type === 'channel');
  }, [conversations]);

  const directMessages = useMemo(() => {
    return conversations.filter(c => c.type === 'direct');
  }, [conversations]);

  const filteredConversations = useMemo(() => {
    if (!searchFilter.trim()) return { channels, directMessages };
    const q = searchFilter.toLowerCase();
    return {
      channels: channels.filter(c => c.name.toLowerCase().includes(q) || (c.topic || '').toLowerCase().includes(q)),
      directMessages: directMessages.filter(c => c.name.toLowerCase().includes(q) || (c.topic || '').toLowerCase().includes(q)),
    };
  }, [channels, directMessages, searchFilter]);

  const filteredDmUsers = useMemo(() => {
    const q = dmSearchQuery.toLowerCase().trim();
    if (!q) return allowedUsers;
    return allowedUsers.filter(u => 
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.role && u.role.toLowerCase().includes(q)) ||
      (u.roleTitle && u.roleTitle.toLowerCase().includes(q))
    );
  }, [allowedUsers, dmSearchQuery]);

  // Handle typing & @ autocomplete detection
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setInputText(text);

    // Check for @ symbol at cursor
    const cursorPos = e.target.selectionStart;
    const textBeforeCursor = text.slice(0, cursorPos);
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
    if (!textareaRef.current) return;
    const cursorPos = textareaRef.current.selectionStart;
    const textBeforeCursor = inputText.slice(0, cursorPos);
    const textAfterCursor = inputText.slice(cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');

    const prefix = textBeforeCursor.slice(0, lastAtIndex);
    const newText = `${prefix}@${user.name} ${textAfterCursor}`;
    setInputText(newText);
    setTaggedUserIds(prev => Array.from(new Set([...prev, user.id])));
    setMentionQuery(null);

    setTimeout(() => {
      textareaRef.current?.focus();
    }, 50);
  };

  // Handle File Selection (Converts to Base64 data URL)
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

  // Send message
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
        fetchConversations();
      } else {
        showToast('Error', data.message || 'Failed to send message', 'error');
      }
    } catch (err: any) {
      showToast('Error', err.message || 'Could not send message', 'error');
    } finally {
      setIsSending(false);
    }
  };

  // Start new Direct Message
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
        setIsNewDmOpen(false);
        await fetchConversations();
        setActiveConvId(data.data.id);
      } else {
        showToast('Permission Restriction', data.message || 'Cannot message user', 'warning');
      }
    } catch (err: any) {
      showToast('Error', err.message || 'Failed to start direct conversation', 'error');
    }
  };

  // Render message content with highlighted @mentions
  const renderMessageContent = (content: string) => {
    const parts = content.split(/(@[a-zA-Z0-9_\s.-]+(?:\s|$))/g);
    return parts.map((part, index) => {
      if (part.startsWith('@')) {
        return (
          <span 
            key={index} 
            className="inline-flex items-center px-1.5 py-0.2 mx-0.5 rounded font-bold bg-primary/10 text-primary border border-primary/20 text-xs"
          >
            {part}
          </span>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <div className="h-[calc(100dvh-4.5rem)] flex flex-col -m-4 sm:-m-6 bg-surface overflow-hidden">
      {/* Main Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* ========================================================================= */}
        {/* LEFT SIDEBAR: Channels & Direct Messages                                  */}
        {/* ========================================================================= */}
        <div className="w-80 border-r border-outline-variant bg-surface-container-lowest flex flex-col shrink-0">
          {/* Header */}
          <div className="p-4 border-b border-outline-variant flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[22px]">forum</span>
              <h2 className="font-headline-md text-sm font-bold text-on-surface">Institutional Chat</h2>
            </div>

            <button
              type="button"
              onClick={() => setIsNewDmOpen(true)}
              className="w-7 h-7 rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-on-primary flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
              title="Start a new Direct Message"
            >
              <span className="material-symbols-outlined text-[18px]">add_comment</span>
            </button>
          </div>

          {/* Search Bar */}
          <div className="p-3 border-b border-outline-variant">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-secondary text-[16px]">
                search
              </span>
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Search conversations..."
                className="w-full pl-8 pr-3 py-1.5 bg-surface border border-outline-variant rounded-lg text-xs text-on-surface placeholder:text-secondary outline-none focus:border-primary"
              />
            </div>
          </div>

          {/* Conversations Scroll Area */}
          <div className="flex-1 overflow-y-auto overscroll-contain p-2 space-y-4">
            {/* Group Channels Section */}
            <div>
              <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-secondary flex items-center justify-between">
                <span>Group Channels</span>
                <span className="font-mono text-[9px]">{filteredConversations.channels.length}</span>
              </div>
              <div className="space-y-0.5 mt-1">
                {filteredConversations.channels.map((conv) => {
                  const isActive = conv.id === activeConvId;
                  return (
                    <button
                      key={conv.id}
                      type="button"
                      onClick={() => setActiveConvId(conv.id)}
                      className={`w-full text-left px-2.5 py-2 rounded-xl transition-all flex items-center justify-between cursor-pointer group ${
                        isActive
                          ? 'bg-primary text-on-primary shadow-xs font-bold'
                          : 'hover:bg-surface-container text-on-surface'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`material-symbols-outlined text-[18px] ${isActive ? 'text-white' : 'text-primary'}`}>
                          tag
                        </span>
                        <div className="truncate">
                          <div className="text-xs truncate">{conv.name}</div>
                          {conv.topic && (
                            <div className={`text-[10px] truncate ${isActive ? 'text-white/80' : 'text-secondary'}`}>
                              {conv.topic}
                            </div>
                          )}
                        </div>
                      </div>

                      {Boolean(conv.unreadCount && conv.unreadCount > 0) && (
                        <span className="shrink-0 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500 text-white">
                          {conv.unreadCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Direct Messages Section */}
            <div>
              <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-secondary flex items-center justify-between">
                <span>Direct Messages</span>
                <button
                  type="button"
                  onClick={() => setIsNewDmOpen(true)}
                  className="text-[10px] text-primary hover:underline font-bold cursor-pointer"
                >
                  + New
                </button>
              </div>
              <div className="space-y-0.5 mt-1">
                {filteredConversations.directMessages.length === 0 ? (
                  <div className="px-3 py-4 text-center text-[11px] text-secondary">
                    No active 1-on-1 chats yet. Click <button onClick={() => setIsNewDmOpen(true)} className="text-primary font-bold hover:underline">+ New</button> to start one!
                  </div>
                ) : (
                  filteredConversations.directMessages.map((conv) => {
                    const isActive = conv.id === activeConvId;
                    return (
                      <button
                        key={conv.id}
                        type="button"
                        onClick={() => setActiveConvId(conv.id)}
                        className={`w-full text-left px-2.5 py-2 rounded-xl transition-all flex items-center justify-between cursor-pointer group ${
                          isActive
                            ? 'bg-primary text-on-primary shadow-xs font-bold'
                            : 'hover:bg-surface-container text-on-surface'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                            isActive ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary'
                          }`}>
                            {conv.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="truncate">
                            <div className="text-xs truncate">{conv.name}</div>
                            {conv.lastMessage?.content && (
                              <div className={`text-[10px] truncate ${isActive ? 'text-white/80' : 'text-secondary'}`}>
                                {conv.lastMessage.content}
                              </div>
                            )}
                          </div>
                        </div>

                        {Boolean(conv.unreadCount && conv.unreadCount > 0) && (
                          <span className="shrink-0 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500 text-white">
                            {conv.unreadCount}
                          </span>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* RIGHT PANE: Message Stream & Input Box                                    */}
        {/* ========================================================================= */}
        <div className="flex-1 flex flex-col bg-surface overflow-hidden">
          {activeConversation ? (
            <>
              {/* Active Conversation Top Bar */}
              <div className="shrink-0 p-3.5 px-6 border-b border-outline-variant bg-surface-container-lowest flex items-center justify-between shadow-2xs">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                    {activeConversation.type === 'channel' ? (
                      <span className="material-symbols-outlined text-[20px]">tag</span>
                    ) : (
                      activeConversation.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-on-surface flex items-center gap-1.5">
                      <span>{activeConversation.name}</span>
                      <span className="text-[10px] font-medium px-2 py-0.2 rounded-full bg-surface-container text-secondary uppercase tracking-wider">
                        {activeConversation.type}
                      </span>
                    </h3>
                    <p className="text-[11px] text-secondary">
                      {activeConversation.topic || activeConversation.description || 'Institutional conversation thread'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-secondary hidden sm:inline-flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px] text-emerald-600">verified_user</span>
                    <span>Role-isolated communication active</span>
                  </span>
                </div>
              </div>

              {/* Message Feed */}
              <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-4">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-8 text-secondary space-y-2">
                    <span className="material-symbols-outlined text-4xl text-outline-variant">forum</span>
                    <h4 className="font-bold text-sm text-on-surface">No messages yet in this conversation</h4>
                    <p className="text-xs max-w-sm">
                      Be the first to share an update, coordinate with your colleagues, or upload materials.
                    </p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isSelf = msg.senderId === currentUser?.id;
                    const isMentioned = currentUser && msg.mentions?.includes(currentUser.id);

                    return (
                      <div 
                        key={msg.id}
                        className={`flex gap-3 max-w-3xl ${isSelf ? 'ml-auto flex-row-reverse' : ''}`}
                      >
                        {/* Avatar */}
                        {msg.senderAvatar ? (
                          <img 
                            src={msg.senderAvatar} 
                            alt={msg.senderName} 
                            className="w-8 h-8 rounded-full object-cover shrink-0 border border-outline-variant"
                          />
                        ) : (
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                            isSelf ? 'bg-primary text-on-primary' : 'bg-primary/10 text-primary'
                          }`}>
                            {msg.senderName.charAt(0).toUpperCase()}
                          </div>
                        )}

                        {/* Bubble */}
                        <div className={`space-y-1.5 ${isSelf ? 'items-end text-right' : ''}`}>
                          <div className="flex items-center gap-2 text-[11px]">
                            <span className="font-bold text-on-surface">{msg.senderName}</span>
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-surface-container text-secondary font-semibold uppercase tracking-wider">
                              {msg.senderRole}
                            </span>
                            <span className="text-secondary font-mono text-[10px]">
                              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>

                          <div className={`p-3 rounded-2xl text-xs leading-relaxed max-w-lg shadow-2xs ${
                            isSelf 
                              ? 'bg-primary text-on-primary rounded-tr-xs' 
                              : isMentioned 
                                ? 'bg-amber-50/90 border border-amber-300 text-on-surface rounded-tl-xs'
                                : 'bg-surface-container-low border border-outline-variant text-on-surface rounded-tl-xs'
                          }`}>
                            <div className="whitespace-pre-wrap">
                              {renderMessageContent(msg.content)}
                            </div>

                            {/* Attachments */}
                            {msg.attachments && msg.attachments.length > 0 && (
                              <div className="mt-2 pt-2 border-t border-outline-variant/40 space-y-1.5">
                                {msg.attachments.map((att) => (
                                  <div key={att.id}>
                                    {att.type.startsWith('image/') ? (
                                      <a href={att.url} target="_blank" rel="noopener noreferrer" className="block mt-1">
                                        <img 
                                          src={att.url} 
                                          alt={att.name} 
                                          className="max-h-56 rounded-lg object-contain border border-outline-variant bg-black/5"
                                        />
                                      </a>
                                    ) : (
                                      <a
                                        href={att.url}
                                        download={att.name}
                                        className={`inline-flex items-center gap-2 p-2 rounded-lg text-xs font-semibold border transition-colors ${
                                          isSelf 
                                            ? 'bg-white/10 hover:bg-white/20 text-white border-white/20' 
                                            : 'bg-surface hover:bg-surface-container text-primary border-outline-variant'
                                        }`}
                                      >
                                        <span className="material-symbols-outlined text-[18px]">description</span>
                                        <span className="truncate max-w-[200px]">{att.name}</span>
                                        <span className="material-symbols-outlined text-[16px]">download</span>
                                      </a>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Bottom Input Area */}
              <div className="shrink-0 p-3 sm:p-4 border-t border-outline-variant bg-surface-container-lowest">
                {/* Active Attachments Preview */}
                {attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2 p-2 bg-surface-container rounded-xl border border-outline-variant">
                    {attachments.map((att) => (
                      <div 
                        key={att.id}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface border border-outline-variant text-xs text-on-surface"
                      >
                        <span className="material-symbols-outlined text-[16px] text-primary">attach_file</span>
                        <span className="font-semibold max-w-[150px] truncate">{att.name}</span>
                        <button
                          type="button"
                          onClick={() => setAttachments(prev => prev.filter(a => a.id !== att.id))}
                          className="text-secondary hover:text-error ml-1 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[14px]">close</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="relative">
                  {/* @Mention Autocomplete Dropdown */}
                  {mentionQuery !== null && (
                    <MentionSuggestions
                      users={allowedUsers}
                      filterText={mentionQuery}
                      onSelect={handleSelectMention}
                      onClose={() => setMentionQuery(null)}
                    />
                  )}

                  <div className="flex items-end gap-2 bg-surface border border-outline-variant rounded-2xl p-2 focus-within:border-primary shadow-xs">
                    {/* Attachment Upload Trigger */}
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
                      className="p-2 rounded-xl text-secondary hover:text-primary hover:bg-surface-container transition-colors cursor-pointer shrink-0"
                      title="Attach file, document, or screenshot"
                    >
                      <span className="material-symbols-outlined text-[20px]">attach_file</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setInputText(prev => prev + '@');
                        setMentionQuery('');
                        textareaRef.current?.focus();
                      }}
                      className="p-2 rounded-xl text-secondary hover:text-primary hover:bg-surface-container transition-colors cursor-pointer shrink-0"
                      title="Tag a colleague or student with @"
                    >
                      <span className="material-symbols-outlined text-[20px]">alternate_email</span>
                    </button>

                    {/* Text Area */}
                    <textarea
                      ref={textareaRef}
                      rows={1}
                      value={inputText}
                      onChange={handleInputChange}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      placeholder={`Message ${activeConversation.name}... (Type @ to mention, Enter to send)`}
                      className="flex-1 max-h-32 p-1.5 bg-transparent text-xs text-on-surface placeholder:text-secondary outline-none resize-none leading-relaxed"
                    />

                    {/* Send Button */}
                    <button
                      type="button"
                      onClick={() => handleSendMessage()}
                      disabled={isSending || (!inputText.trim() && attachments.length === 0)}
                      className={`p-2 rounded-xl text-white transition-all cursor-pointer shrink-0 flex items-center justify-center ${
                        inputText.trim() || attachments.length > 0
                          ? 'bg-primary hover:bg-primary/90 shadow-xs'
                          : 'bg-surface-container text-secondary/40 cursor-not-allowed'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        {isSending ? 'progress_activity' : 'send'}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-secondary space-y-2">
              <span className="material-symbols-outlined text-5xl text-outline-variant">chat</span>
              <h3 className="font-bold text-base text-on-surface">Select a conversation to start chatting</h3>
              <p className="text-xs max-w-sm text-center">
                Select an institutional channel from the left sidebar or start a direct message with an authorized team member.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* NEW DIRECT MESSAGE MODAL (ROLE-ISOLATED SELECTOR)                         */}
      {/* ========================================================================= */}
      {isNewDmOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-inverse-surface/40 backdrop-blur-xs p-2 sm:p-4 md:p-6 flex flex-col justify-start items-center animate-in fade-in duration-150">
          <div className="my-auto relative bg-surface-container-lowest border border-outline-variant rounded-t-2xl sm:rounded-2xl shadow-2xl p-4 sm:p-6 max-w-md w-full max-h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-2.5rem)] md:max-h-[calc(100dvh-3rem)] overflow-y-auto overscroll-contain space-y-4">
            <div className="flex justify-between items-center border-b border-outline-variant pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[22px]">person_add</span>
                <h3 className="font-headline-md text-sm font-bold text-on-surface">Start Direct Message</h3>
              </div>
              <button 
                onClick={() => {
                  setIsNewDmOpen(false);
                  setDmSearchQuery('');
                }} 
                className="text-secondary hover:text-on-surface p-1 rounded hover:bg-surface-container cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <p className="text-xs text-secondary">
              Select an authorized user to open a private 1-on-1 messaging thread.
            </p>

            {/* Direct Message Contact Search Bar */}
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-secondary">
                <span className="material-symbols-outlined text-[18px]">search</span>
              </span>
              <input
                type="text"
                value={dmSearchQuery}
                onChange={(e) => setDmSearchQuery(e.target.value)}
                placeholder="Search contact by name, email, or role..."
                className="w-full pl-9 pr-8 py-2 text-xs bg-surface-container-low border border-outline-variant rounded-xl text-on-surface focus:outline-none focus:border-primary placeholder:text-secondary/60"
                autoFocus
              />
              {dmSearchQuery && (
                <button
                  type="button"
                  onClick={() => setDmSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-secondary hover:text-on-surface cursor-pointer"
                  title="Clear search"
                >
                  <span className="material-symbols-outlined text-[16px]">cancel</span>
                </button>
              )}
            </div>

            <div className="flex items-center justify-between text-[11px] text-secondary px-0.5">
              <span>{filteredDmUsers.length} contact{filteredDmUsers.length === 1 ? '' : 's'} available</span>
              {dmSearchQuery && (
                <span className="text-[10px] text-primary font-medium truncate max-w-[160px]">
                  Matching "{dmSearchQuery}"
                </span>
              )}
            </div>

            <div className="max-h-72 overflow-y-auto overscroll-contain space-y-1 p-1">
              {allowedUsers.length === 0 ? (
                <div className="p-6 text-center text-xs text-secondary">
                  No eligible contacts available for your role profile.
                </div>
              ) : filteredDmUsers.length === 0 ? (
                <div className="p-6 text-center text-xs text-secondary">
                  <span className="material-symbols-outlined text-2xl text-secondary/40 mb-1">person_search</span>
                  <p className="font-semibold">No contacts found</p>
                  <p className="text-[10px] text-secondary/70">No authorized users match "{dmSearchQuery}"</p>
                </div>
              ) : (
                filteredDmUsers.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => {
                      handleStartDirectMessage(user);
                      setDmSearchQuery('');
                    }}
                    className="w-full text-left p-2.5 rounded-xl hover:bg-surface-container transition-colors flex items-center justify-between cursor-pointer group border border-transparent hover:border-outline-variant"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {user.avatar ? (
                        <img 
                          src={user.avatar} 
                          alt={user.name} 
                          className="w-8 h-8 rounded-full object-cover shrink-0 border border-outline-variant" 
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0">
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

                    <span className="material-symbols-outlined text-[16px] text-secondary group-hover:text-primary shrink-0">
                      chat
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
