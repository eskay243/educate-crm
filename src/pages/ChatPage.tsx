import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useCRM } from '../context/CRMContext';
import { ChatConversation, ChatMessage, ChatAttachment, ChatUserTarget, ChatMessageReplyTo } from '../types/chat';
import { MentionSuggestions } from '../components/chat/MentionSuggestions';
import { VoiceMessageRecorder } from '../components/chat/VoiceMessageRecorder';

interface SwipeState {
  messageId: string;
  startX: number;
  currentX: number;
}

export const ChatPage: React.FC = () => {
  const { currentUser, showToast, openModal, openForwardModal, editChatMessage, deleteChatMessage, isSuperAdmin } = useCRM();

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

  // Replying state & Quoted message banner
  const [replyingTo, setReplyingTo] = useState<ChatMessageReplyTo | null>(null);
  const [isVoiceRecording, setIsVoiceRecording] = useState(false);

  // Message Editing state
  const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(null);
  const [editInputText, setEditInputText] = useState('');

  // Swipe-to-reply state & Right-click context menu
  const [swiping, setSwiping] = useState<SwipeState | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    message: ChatMessage;
  } | null>(null);

  // Mention autocomplete state
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [taggedUserIds, setTaggedUserIds] = useState<string[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Dismiss context menu on global click
  useEffect(() => {
    const handleCloseMenu = () => setContextMenu(null);
    window.addEventListener('click', handleCloseMenu);
    return () => window.removeEventListener('click', handleCloseMenu);
  }, []);

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
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/chat/conversations/${convId}/messages?userId=${encodeURIComponent(currentUser.id)}&role=${encodeURIComponent(currentUser.role)}&email=${encodeURIComponent(currentUser.email)}`);
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

  const subgroups = useMemo(() => {
    return conversations.filter(c => c.type === 'subgroup');
  }, [conversations]);

  const directMessages = useMemo(() => {
    return conversations.filter(c => c.type === 'direct');
  }, [conversations]);

  const filteredConversations = useMemo(() => {
    if (!searchFilter.trim()) return { channels, subgroups, directMessages };
    const q = searchFilter.toLowerCase();
    return {
      channels: channels.filter(c => c.name.toLowerCase().includes(q) || (c.topic || '').toLowerCase().includes(q)),
      subgroups: subgroups.filter(c => c.name.toLowerCase().includes(q) || (c.topic || '').toLowerCase().includes(q)),
      directMessages: directMessages.filter(c => c.name.toLowerCase().includes(q) || (c.topic || '').toLowerCase().includes(q)),
    };
  }, [channels, subgroups, directMessages, searchFilter]);

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

  // Reply selection trigger
  const handleSetReply = (msg: ChatMessage) => {
    const snippet = msg.content 
      ? (msg.content.slice(0, 100) + (msg.content.length > 100 ? '...' : '')) 
      : (msg.attachments?.[0]?.name ? `📎 ${msg.attachments[0].name}` : 'Voice Note');

    setReplyingTo({
      messageId: msg.id,
      senderId: msg.senderId,
      senderName: msg.senderName,
      contentSnippet: snippet,
      mediaType: msg.messageType || 'text'
    });
    textareaRef.current?.focus();
  };

  // Scroll to quoted original message
  const handleScrollToMessage = (messageId: string) => {
    const el = document.getElementById(`msg-${messageId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('ring-2', 'ring-primary', 'bg-primary/10', 'transition-all');
      setTimeout(() => {
        el.classList.remove('ring-2', 'ring-primary', 'bg-primary/10');
      }, 2000);
    } else {
      showToast('Notice', 'Original message not found in recent history.', 'info');
    }
  };

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

  // Handle Clipboard Paste (intercepts screenshots and image files)
  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.indexOf('image') !== -1) {
        const file = item.getAsFile();
        if (!file) continue;

        const reader = new FileReader();
        reader.onload = (event) => {
          const url = event.target?.result as string;
          if (url) {
            setAttachments(prev => [
              ...prev,
              {
                id: `screenshot-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                name: `Screenshot-${new Date().toLocaleTimeString().replace(/:/g, '')}.png`,
                url,
                type: file.type || 'image/png',
                size: file.size
              }
            ]);
            showToast('Screenshot Attached', 'Clipboard screenshot added to message.', 'info');
          }
        };
        reader.readAsDataURL(file);
      }
    }
  };

  // Handle File Selection
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

  // Send voice note
  const handleSendVoice = async (audioDataUrl: string, durationSeconds: number) => {
    if (!activeConvId || !currentUser) return;
    setIsVoiceRecording(false);
    setIsSending(true);

    try {
      const payload = {
        senderId: currentUser.id,
        senderName: currentUser.name,
        senderEmail: currentUser.email,
        senderRole: currentUser.role,
        senderRoleTitle: currentUser.roleTitle,
        senderAvatar: currentUser.avatar,
        content: '🎤 Voice message',
        messageType: 'voice',
        voiceDurationSeconds: durationSeconds,
        replyTo: replyingTo || undefined,
        attachments: [{
          id: `voice-${Date.now()}`,
          name: `VoiceNote-${durationSeconds}s.webm`,
          url: audioDataUrl,
          type: 'audio/webm',
          size: Math.round(audioDataUrl.length * 0.75)
        }]
      };

      const res = await fetch(`/api/chat/conversations/${activeConvId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success && data.data) {
        setMessages(prev => [...prev, data.data]);
        setReplyingTo(null);
        fetchConversations();
      }
    } catch (err: any) {
      showToast('Voice Error', err.message || 'Could not dispatch voice message', 'error');
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

  // Delete a message with optimistic tombstone
  const handleDeleteMessage = async (msgId: string) => {
    try {
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
    } catch (e: any) {
      showToast('Error', e.message || 'Could not delete message', 'error');
    }
  };

  // Render message content with clickable URLs and highlighted @mentions
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
            className={`inline-flex items-center px-1.5 py-0.2 mx-0.5 rounded font-bold text-xs ${
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

  return (
    <div className="h-[calc(100dvh-4.5rem)] flex flex-col -m-4 sm:-m-6 bg-surface overflow-hidden">
      {/* Main Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* ========================================================================= */}
        {/* LEFT SIDEBAR: Channels, Subgroups & Direct Messages                       */}
        {/* ========================================================================= */}
        <div className="w-80 border-r border-outline-variant bg-surface-container-lowest flex flex-col shrink-0">
          {/* Header */}
          <div className="p-4 border-b border-outline-variant flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[22px]">forum</span>
              <h2 className="font-headline-md text-sm font-bold text-on-surface">Institutional Chat</h2>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => openModal('create-subgroup')}
                className="w-7 h-7 rounded-lg bg-surface-container hover:bg-primary hover:text-white text-secondary flex items-center justify-center transition-colors cursor-pointer"
                title="Create Class Subgroup"
              >
                <span className="material-symbols-outlined text-[17px]">group_add</span>
              </button>
              <button
                type="button"
                onClick={() => setIsNewDmOpen(true)}
                className="w-7 h-7 rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-on-primary flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
                title="Start a new Direct Message"
              >
                <span className="material-symbols-outlined text-[18px]">add_comment</span>
              </button>
            </div>
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
            {/* 1. Group Channels Section */}
            <div>
              <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-secondary flex items-center justify-between">
                <span>Institutional Channels</span>
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

            {/* 2. Class & Cohort Subgroups Section */}
            <div>
              <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-secondary flex items-center justify-between">
                <span>Class & Cohort Subgroups</span>
                <button
                  type="button"
                  onClick={() => openModal('create-subgroup')}
                  className="text-[10px] text-primary hover:underline font-bold cursor-pointer flex items-center gap-0.5"
                >
                  <span>+ Subgroup</span>
                </button>
              </div>
              <div className="space-y-0.5 mt-1">
                {filteredConversations.subgroups.length === 0 ? (
                  <div className="px-3 py-3 text-center text-[11px] text-secondary">
                    No subgroups yet. Click <button onClick={() => openModal('create-subgroup')} className="text-primary font-bold hover:underline">+ Subgroup</button> to create a class group!
                  </div>
                ) : (
                  filteredConversations.subgroups.map((conv) => {
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
                          <span className={`material-symbols-outlined text-[18px] ${isActive ? 'text-white' : 'text-emerald-600'}`}>
                            groups
                          </span>
                          <div className="truncate">
                            <div className="text-xs truncate font-medium">{conv.name}</div>
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
                  })
                )}
              </div>
            </div>

            {/* 3. Direct Messages Section */}
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
                    {activeConversation.type === 'subgroup' ? (
                      <span className="material-symbols-outlined text-[20px] text-emerald-600">groups</span>
                    ) : activeConversation.type === 'channel' ? (
                      <span className="material-symbols-outlined text-[20px]">tag</span>
                    ) : (
                      activeConversation.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-on-surface flex items-center gap-1.5">
                      <span>{activeConversation.name}</span>
                      <span className={`text-[10px] font-medium px-2 py-0.2 rounded-full uppercase tracking-wider ${
                        activeConversation.type === 'subgroup'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400'
                          : 'bg-surface-container text-secondary'
                      }`}>
                        {activeConversation.type}
                      </span>
                    </h3>
                    <p className="text-[11px] text-secondary">
                      {activeConversation.topic || activeConversation.description || 'Class & institutional collaboration thread'}
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
                    const isCurrentSwipe = swiping?.messageId === msg.id;
                    const swipeDelta = isCurrentSwipe ? Math.max(0, swiping.currentX - swiping.startX) : 0;

                    return (
                      <div 
                        id={`msg-${msg.id}`}
                        key={msg.id}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          setContextMenu({ x: e.clientX, y: e.clientY, message: msg });
                        }}
                        onTouchStart={(e) => {
                          const touch = e.touches[0];
                          if (touch) setSwiping({ messageId: msg.id, startX: touch.clientX, currentX: touch.clientX });
                        }}
                        onTouchMove={(e) => {
                          const touch = e.touches[0];
                          if (touch && swiping?.messageId === msg.id) {
                            setSwiping(prev => prev ? { ...prev, currentX: touch.clientX } : null);
                          }
                        }}
                        onTouchEnd={() => {
                          if (swiping?.messageId === msg.id) {
                            const delta = swiping.currentX - swiping.startX;
                            if (delta > 50) {
                              handleSetReply(msg);
                            }
                            setSwiping(null);
                          }
                        }}
                        style={{
                          transform: swipeDelta ? `translateX(${Math.min(swipeDelta, 60)}px)` : undefined,
                          transition: swiping ? 'none' : 'transform 0.2s ease-out'
                        }}
                        className={`flex gap-3 max-w-3xl group relative select-text ${isSelf ? 'ml-auto flex-row-reverse' : ''}`}
                      >
                        {/* Swipe reply indicator cue */}
                        {swipeDelta > 20 && (
                          <div className="absolute -left-8 top-1/2 -translate-y-1/2 flex items-center justify-center text-primary animate-pulse">
                            <span className="material-symbols-outlined text-[20px]">reply</span>
                          </div>
                        )}

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

                          <div className={`p-3 rounded-2xl text-xs leading-relaxed max-w-lg shadow-2xs relative group/bubble ${
                            isSelf 
                              ? 'bg-primary text-white font-medium rounded-tr-xs' 
                              : isMentioned 
                                ? 'bg-amber-50/90 border border-amber-300 text-on-surface rounded-tl-xs'
                                : 'bg-surface-container-low border border-outline-variant text-on-surface rounded-tl-xs'
                          }`}>
                            {/* Forwarded Message Provenance Header */}
                            {msg.forwardedFrom && (
                              <div className={`flex items-center gap-1 text-[10px] italic mb-1.5 pb-1 border-b ${
                                isSelf ? 'border-white/20 text-white/80' : 'border-outline-variant/40 text-secondary'
                              }`}>
                                <span className="material-symbols-outlined text-[13px]">forward</span>
                                <span>Forwarded from <strong>{msg.forwardedFrom.originalSenderName}</strong></span>
                              </div>
                            )}

                            {/* Quoted Message Snippet Header (if this message is a reply) */}
                            {msg.replyTo && (
                              <div
                                onClick={() => handleScrollToMessage(msg.replyTo!.messageId)}
                                className={`p-2 mb-2 rounded-lg border-l-4 cursor-pointer transition text-left select-none ${
                                  isSelf 
                                    ? 'bg-black/15 border-white/80 hover:bg-black/25 text-white' 
                                    : 'bg-primary/10 border-primary hover:bg-primary/15 text-on-surface'
                                }`}
                                title="Click to jump to quoted message"
                              >
                                <div className="flex items-center gap-1 text-[10px] font-bold opacity-90">
                                  <span className="material-symbols-outlined text-[13px]">reply</span>
                                  <span>{msg.replyTo.senderName}</span>
                                </div>
                                <div className="text-[11px] truncate opacity-85 mt-0.5">
                                  {msg.replyTo.contentSnippet || 'Message'}
                                </div>
                              </div>
                            )}

                            {/* Message Body or Tombstone */}
                            {msg.isDeleted ? (
                              <div className="italic text-xs opacity-75 flex items-center gap-1.5 py-1 text-left">
                                <span className="material-symbols-outlined text-[15px]">block</span>
                                <span>This message was deleted</span>
                              </div>
                            ) : editingMessage?.id === msg.id ? (
                              <div className="space-y-2 text-left">
                                <textarea
                                  value={editInputText}
                                  onChange={e => setEditInputText(e.target.value)}
                                  className="w-full p-2 bg-surface text-on-surface border border-outline-variant rounded-lg text-xs outline-none focus:border-primary"
                                  rows={2}
                                />
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => setEditingMessage(null)}
                                    className="px-2 py-0.5 text-[11px] rounded bg-surface-container text-secondary hover:bg-surface-container-high cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      const ok = await editChatMessage(msg.id, editInputText);
                                      if (ok) {
                                        setMessages(prev =>
                                          prev.map(m =>
                                            m.id === msg.id
                                              ? { ...m, content: editInputText, isEdited: true, editedAt: new Date().toISOString() }
                                              : m
                                          )
                                        );
                                        setEditingMessage(null);
                                      }
                                    }}
                                    className="px-2.5 py-0.5 text-[11px] rounded bg-primary text-on-primary font-bold shadow-xs cursor-pointer"
                                  >
                                    Save
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <>
                                {/* Main Content */}
                                {msg.content && msg.content !== '🎤 Voice message' && (
                                  <div className="whitespace-pre-wrap text-left">
                                    {renderMessageContent(msg.content, isSelf)}
                                    {msg.isEdited && (
                                      <span className="text-[10px] opacity-65 italic ml-1.5 font-normal">
                                        (edited)
                                      </span>
                                    )}
                                  </div>
                                )}

                                {/* Voice Note Player */}
                                {msg.messageType === 'voice' && msg.attachments && msg.attachments.length > 0 && (
                                  <div className="mt-1 flex items-center gap-2 p-2 rounded-xl bg-black/5 dark:bg-white/10">
                                    <span className="material-symbols-outlined text-[18px] text-rose-500">mic</span>
                                    <audio controls src={msg.attachments[0].url} className="h-7 max-w-[220px] sm:max-w-[260px]" />
                                    {msg.voiceDurationSeconds && (
                                      <span className="text-[10px] font-mono opacity-70">
                                        {Math.floor(msg.voiceDurationSeconds / 60)}:{(msg.voiceDurationSeconds % 60).toString().padStart(2, '0')}
                                      </span>
                                    )}
                                  </div>
                                )}

                                {/* Attachments (Images, Videos, Files) */}
                                {msg.attachments && msg.attachments.length > 0 && msg.messageType !== 'voice' && (
                                  <div className="mt-2 pt-2 border-t border-outline-variant/40 space-y-1.5">
                                    {msg.attachments.map((att) => (
                                      <div key={att.id}>
                                        {att.type.startsWith('image/') ? (
                                          <a href={att.url} target="_blank" rel="noopener noreferrer" className="block mt-1">
                                            <img 
                                              src={att.url} 
                                              alt={att.name} 
                                              className="max-h-60 rounded-lg object-contain border border-outline-variant bg-black/5"
                                            />
                                          </a>
                                        ) : att.type.startsWith('video/') ? (
                                          <video 
                                            controls 
                                            src={att.url} 
                                            className="max-h-60 rounded-lg max-w-full border border-outline-variant mt-1"
                                          />
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
                              </>
                            )}

                            {/* Quick Action Hover Bar */}
                            {!msg.isDeleted && (
                              <div className={`absolute top-1 ${isSelf ? '-left-36' : '-right-36'} hidden group-hover:flex items-center gap-1 bg-surface border border-outline-variant rounded-lg p-0.5 shadow-sm`}>
                                <button
                                  type="button"
                                  onClick={() => handleSetReply(msg)}
                                  className="p-1 rounded text-secondary hover:text-primary hover:bg-surface-container transition cursor-pointer"
                                  title="Reply to this message"
                                >
                                  <span className="material-symbols-outlined text-[16px]">reply</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => openForwardModal(msg)}
                                  className="p-1 rounded text-secondary hover:text-primary hover:bg-surface-container transition cursor-pointer"
                                  title="Forward message"
                                >
                                  <span className="material-symbols-outlined text-[16px]">forward</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setInputText(prev => `${prev} @${msg.senderName} `);
                                    setTaggedUserIds(prev => Array.from(new Set([...prev, msg.senderId])));
                                    textareaRef.current?.focus();
                                  }}
                                  className="p-1 rounded text-secondary hover:text-primary hover:bg-surface-container transition cursor-pointer"
                                  title="Tag sender"
                                >
                                  <span className="material-symbols-outlined text-[16px]">alternate_email</span>
                                </button>
                                {isSelf && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingMessage(msg);
                                      setEditInputText(msg.content);
                                    }}
                                    className="p-1 rounded text-secondary hover:text-primary hover:bg-surface-container transition cursor-pointer"
                                    title="Edit message"
                                  >
                                    <span className="material-symbols-outlined text-[16px]">edit</span>
                                  </button>
                                )}
                                {(isSelf || isSuperAdmin) && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (window.confirm('Delete this message?')) {
                                        handleDeleteMessage(msg.id);
                                      }
                                    }}
                                    className="p-1 rounded text-secondary hover:text-rose-500 hover:bg-surface-container transition cursor-pointer"
                                    title="Delete message"
                                  >
                                    <span className="material-symbols-outlined text-[16px]">delete</span>
                                  </button>
                                )}
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
                {/* Active Quoted Reply Banner */}
                {replyingTo && (
                  <div className="flex items-center justify-between px-3 py-1.5 mb-2 bg-primary/10 border border-primary/20 rounded-xl text-xs text-primary animate-fade-in">
                    <div className="flex items-center gap-2 truncate">
                      <span className="material-symbols-outlined text-[16px]">reply</span>
                      <span className="truncate">
                        Replying to <strong className="font-bold">{replyingTo.senderName}</strong>: <span className="opacity-80 truncate">{replyingTo.contentSnippet}</span>
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setReplyingTo(null)}
                      className="p-1 hover:bg-primary/10 rounded-md transition text-primary cursor-pointer shrink-0"
                      title="Cancel reply"
                    >
                      <span className="material-symbols-outlined text-[16px]">close</span>
                    </button>
                  </div>
                )}

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

                {/* Voice Message Recorder View */}
                {isVoiceRecording ? (
                  <div className="mb-2">
                    <VoiceMessageRecorder
                      onSendVoice={handleSendVoice}
                      onCancel={() => setIsVoiceRecording(false)}
                    />
                  </div>
                ) : (
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
                        accept="image/*,video/*,.pdf,.doc,.docx,.txt"
                        multiple
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2 rounded-xl text-secondary hover:text-primary hover:bg-surface-container transition-colors cursor-pointer shrink-0"
                        title="Attach file, screenshot, video, or document"
                      >
                        <span className="material-symbols-outlined text-[20px]">attach_file</span>
                      </button>

                      {/* Voice Note Trigger */}
                      <button
                        type="button"
                        onClick={() => setIsVoiceRecording(true)}
                        className="p-2 rounded-xl text-secondary hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer shrink-0"
                        title="Record voice note"
                      >
                        <span className="material-symbols-outlined text-[20px]">mic</span>
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

                      {/* Text Area with Screenshot Paste Interceptor */}
                      <textarea
                        ref={textareaRef}
                        rows={1}
                        value={inputText}
                        onChange={handleInputChange}
                        onPaste={handlePaste}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                        placeholder={`Message ${activeConversation.name}... (Type @ to mention, Paste screenshot, Enter to send)`}
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
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-secondary space-y-2">
              <span className="material-symbols-outlined text-5xl text-outline-variant">chat</span>
              <h3 className="font-bold text-base text-on-surface">Select a conversation to start chatting</h3>
              <p className="text-xs max-w-sm text-center">
                Select an institutional channel, class subgroup, or direct message from the left sidebar.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* RIGHT-CLICK CONTEXT MENU                                                  */}
      {/* ========================================================================= */}
      {contextMenu && (
        <div 
          style={{ 
            top: Math.min(window.innerHeight - 170, contextMenu.y), 
            left: Math.min(window.innerWidth - 220, contextMenu.x) 
          }}
          className="fixed z-50 bg-surface border border-outline-variant shadow-2xl rounded-xl p-1.5 text-xs text-on-surface min-w-[190px] animate-fade-in"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => {
              handleSetReply(contextMenu.message);
              setContextMenu(null);
            }}
            className="w-full text-left px-3 py-2 rounded-lg hover:bg-primary/10 hover:text-primary flex items-center gap-2 transition cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">reply</span>
            <span>Reply to message</span>
          </button>
          <button
            type="button"
            onClick={() => {
              openForwardModal(contextMenu.message);
              setContextMenu(null);
            }}
            className="w-full text-left px-3 py-2 rounded-lg hover:bg-primary/10 hover:text-primary flex items-center gap-2 transition cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">forward</span>
            <span>Forward message</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setInputText(prev => `${prev} @${contextMenu.message.senderName} `);
              setTaggedUserIds(prev => Array.from(new Set([...prev, contextMenu.message.senderId])));
              textareaRef.current?.focus();
              setContextMenu(null);
            }}
            className="w-full text-left px-3 py-2 rounded-lg hover:bg-primary/10 hover:text-primary flex items-center gap-2 transition cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">alternate_email</span>
            <span>Tag @{contextMenu.message.senderName}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(contextMenu.message.content || '');
              showToast('Copied', 'Message text copied to clipboard', 'info');
              setContextMenu(null);
            }}
            className="w-full text-left px-3 py-2 rounded-lg hover:bg-surface-container flex items-center gap-2 transition cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">content_copy</span>
            <span>Copy message text</span>
          </button>
          {(contextMenu.message.senderId === currentUser?.id || contextMenu.message.senderEmail === currentUser?.email) && !contextMenu.message.isDeleted && (
            <button
              type="button"
              onClick={() => {
                setEditingMessage(contextMenu.message);
                setEditInputText(contextMenu.message.content || '');
                setContextMenu(null);
              }}
              className="w-full text-left px-3 py-2 rounded-lg hover:bg-primary/10 hover:text-primary flex items-center gap-2 transition cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">edit</span>
              <span>Edit message</span>
            </button>
          )}
          {(contextMenu.message.senderId === currentUser?.id || contextMenu.message.senderEmail === currentUser?.email || isSuperAdmin) && !contextMenu.message.isDeleted && (
            <button
              type="button"
              onClick={() => {
                const targetId = contextMenu.message.id;
                setContextMenu(null);
                if (window.confirm('Delete this message?')) {
                  handleDeleteMessage(targetId);
                }
              }}
              className="w-full text-left px-3 py-2 rounded-lg hover:bg-rose-500/10 text-rose-500 flex items-center gap-2 transition cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">delete</span>
              <span>Delete message</span>
            </button>
          )}
        </div>
      )}

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
