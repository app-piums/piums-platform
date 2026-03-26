export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: string;
  read: boolean;
}

export interface Conversation {
  id: string;
  artistId?: string;
  artistName?: string;
  artistAvatar?: string;
  messages?: Message[];
  unreadCount?: number;
  lastMessageAt?: string;
  status?: 'PENDING' | 'ACTIVE' | 'ARCHIVED';
  bookingId?: string;
}
