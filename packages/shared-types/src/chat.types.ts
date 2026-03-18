// ============================================================================
// @piums/shared-types — Chat domain types
// ============================================================================

export type MessageType = 'TEXT' | 'IMAGE' | 'FILE' | 'SYSTEM';
export type ConversationStatus = 'ACTIVE' | 'ARCHIVED' | 'BLOCKED';

export interface Conversation {
  id: string;
  participantIds: string[];
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount?: number;
  status: ConversationStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationWithParticipants extends Conversation {
  participants: ConversationParticipant[];
}

export interface ConversationParticipant {
  id: string;
  nombre: string;
  avatar?: string;
  role?: string;
  isOnline?: boolean;
  lastSeenAt?: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  type: MessageType;
  content: string;
  fileUrl?: string;
  fileName?: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

export interface MessageWithSender extends Message {
  sender: {
    id: string;
    nombre: string;
    avatar?: string;
  };
}

export interface SendMessageRequest {
  conversationId: string;
  content: string;
  type?: MessageType;
  fileUrl?: string;
  fileName?: string;
}

export interface CreateConversationRequest {
  participantId: string;
  initialMessage?: string;
}

// Socket.io events
export interface SocketTypingPayload {
  conversationId: string;
  userId: string;
  userName: string;
}

export interface SocketMessagePayload {
  message: MessageWithSender;
  conversationId: string;
}
