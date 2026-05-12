export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  type?: string;
  status?: string;
  readAt?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface Conversation {
  id: string;
  participant1Id?: string;
  participant2Id?: string;
  bookingId?: string | null;
  status?: 'ACTIVE' | 'ARCHIVED' | 'BLOCKED';
  artistId?: string;
  artistName?: string | null;
  artistAvatar?: string | null;
  clientName?: string | null;
  clientAvatar?: string | null;
  messages?: Message[];
  unreadCount?: number;
  lastMessageAt?: string | null;
  lastMessagePreview?: string | null;
}
