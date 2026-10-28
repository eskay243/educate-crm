import { UserRole } from './crm';

export interface ChatAttachment {
  id: string;
  name: string;
  url: string; // Base64 data URL or storage URL
  type: string;
  size: number;
}

export interface ChatMessageReplyTo {
  messageId: string;
  senderId?: string;
  senderName: string;
  contentSnippet: string;
  mediaType?: 'text' | 'image' | 'voice' | 'video' | 'file';
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderEmail: string;
  senderRole: UserRole | string;
  senderRoleTitle?: string;
  senderAvatar?: string;
  content: string;
  replyTo?: ChatMessageReplyTo;
  messageType?: 'text' | 'image' | 'voice' | 'video' | 'file';
  voiceDurationSeconds?: number;
  mentions?: string[]; // Array of tagged user IDs or emails
  attachments?: ChatAttachment[];
  timestamp: string;
  readBy?: string[];
}

export type ConversationType = 'direct' | 'channel' | 'subgroup';

export interface ChatConversation {
  id: string;
  type: ConversationType;
  name: string; // e.g. '#staff-room', '#general', or Direct Message recipient name
  topic?: string;
  description?: string;
  participants: string[]; // User IDs or emails
  allowedRoles?: string[]; // Optional role filter for channels
  courseId?: string; // For cohort-specific channels
  parentChannelId?: string; // Parent channel or cohort ID if subgroup
  cohortId?: string;
  classId?: string;
  isSubgroup?: boolean;
  createdBy?: string;
  isDefault?: boolean; // Institutional channels joined automatically
  lastMessage?: {
    content: string;
    senderName: string;
    timestamp: string;
  };
  unreadCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ChatUserTarget {
  id: string;
  name: string;
  email: string;
  role: UserRole | string;
  roleTitle: string;
  avatar?: string;
  courseName?: string; // Optional context for students/mentors
  isOnline?: boolean;
}
