export interface Conversation {
  id: string;
  userId: string;
  artistId: string;
  clientName: string;
  clientAvatar: string;
  unreadCount: number;
  lastMessageAt: string;
  createdAt: string;
  updatedAt: string;
  messages: Message[];
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  content: string;
  createdAt: string;
  timestamp: string;
  read: boolean;
  senderType: string;
  type: string;
}
