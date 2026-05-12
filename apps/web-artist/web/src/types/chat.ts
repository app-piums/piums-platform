export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  type: string;
  status: string;
  readAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Conversation {
  id: string;
  participant1Id: string;
  participant2Id: string;
  bookingId?: string | null;
  status: string;
  clientName?: string | null;
  clientAvatar?: string | null;
  clientEmail?: string | null;
  artistName?: string | null;
  unreadCount: number;
  lastMessageAt?: string | null;
  lastMessagePreview?: string | null;
  messages?: Message[];
  createdAt: string;
  updatedAt: string;
}
