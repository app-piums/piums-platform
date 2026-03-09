'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Conversation, Message } from '@/types/chat';
import { ConversationList } from '@/components/chat/ConversationList';
import { MessageList } from '@/components/chat/MessageList';
import { MessageInput } from '@/components/chat/MessageInput';
import ClientSidebar from '@/components/ClientSidebar';
import { useAuth } from '@/contexts/AuthContext';
import { Loading } from '@/components/Loading';

// ── Mock data ────────────────────────────────────────────────────────────────
const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: 'conv-1',
    artistName: 'Sarah J.',
    artistAvatar: '',
    unreadCount: 2,
    lastMessageAt: new Date().toISOString(),
    messages: [
      { id: 'm1', conversationId: 'conv-1', senderId: 'artist-1', content: '¡Hola! Vi que te interesó mi trabajo de fotografía 📸', createdAt: new Date(Date.now() - 3600000).toISOString(), read: true },
      { id: 'm2', conversationId: 'conv-1', senderId: 'me', content: 'Sí! Estoy buscando fotógrafo para una boda en mayo', createdAt: new Date(Date.now() - 3500000).toISOString(), read: true },
      { id: 'm3', conversationId: 'conv-1', senderId: 'artist-1', content: '¡Perfecto! Tengo disponibilidad en mayo. ¿Podrías decirme la fecha exacta?', createdAt: new Date(Date.now() - 1800000).toISOString(), read: false },
      { id: 'm4', conversationId: 'conv-1', senderId: 'artist-1', content: 'También te puedo enviar mi portafolio de bodas 💍', createdAt: new Date(Date.now() - 900000).toISOString(), read: false },
    ],
  },
  {
    id: 'conv-2',
    artistName: 'DJ Alex',
    artistAvatar: '',
    unreadCount: 0,
    lastMessageAt: new Date(Date.now() - 86400000).toISOString(),
    messages: [
      { id: 'm5', conversationId: 'conv-2', senderId: 'artist-2', content: 'Hola! Claro que sí, puedo tocar en tu evento corporativo', createdAt: new Date(Date.now() - 86400000).toISOString(), read: true },
      { id: 'm6', conversationId: 'conv-2', senderId: 'me', content: 'Genial, te contacto la próxima semana para cerrar detalles', createdAt: new Date(Date.now() - 82800000).toISOString(), read: true },
    ],
  },
  {
    id: 'conv-3',
    artistName: 'Carlos M.',
    artistAvatar: '',
    unreadCount: 1,
    lastMessageAt: new Date(Date.now() - 172800000).toISOString(),
    messages: [
      { id: 'm7', conversationId: 'conv-3', senderId: 'artist-3', content: 'Enviado el presupuesto a tu correo 🎵', createdAt: new Date(Date.now() - 172800000).toISOString(), read: false },
    ],
  },
];

export default function ChatPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push('/login?redirect=/chat');
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    // Simulate loading conversations
    const t = setTimeout(() => {
      setConversations(MOCK_CONVERSATIONS);
      // Auto-select first
      setCurrentConversation(MOCK_CONVERSATIONS[0]);
      setMessages(MOCK_CONVERSATIONS[0].messages ?? []);
      setIsLoadingConversations(false);
    }, 600);
    return () => clearTimeout(t);
  }, []);

  const selectConversation = (conversationId: string) => {
    const conv = conversations.find(c => c.id === conversationId) ?? null;
    setCurrentConversation(conv);
    setMessages(conv?.messages ?? []);
    // Mark as read
    setConversations(prev =>
      prev.map(c => c.id === conversationId ? { ...c, unreadCount: 0 } : c)
    );
  };

  const handleSendMessage = (content: string) => {
    if (!currentConversation || isSending) return;
    setIsSending(true);
    const newMsg: Message = {
      id: `m-${Date.now()}`,
      conversationId: currentConversation.id,
      senderId: 'me',
      content,
      createdAt: new Date().toISOString(),
      read: false,
    };
    setMessages(prev => [...prev, newMsg]);
    setConversations(prev =>
      prev.map(c =>
        c.id === currentConversation.id
          ? { ...c, lastMessageAt: newMsg.createdAt, messages: [...(c.messages ?? []), newMsg] }
          : c
      )
    );
    setIsSending(false);
  };

  const handleTypingStart = () => setIsTyping(false);
  const handleTypingStop = () => {};

  if (authLoading || !isAuthenticated) return <Loading fullScreen />;

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <ClientSidebar userName={user?.nombre ?? 'Usuario'} />

      {/* Main Chat Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Conversations panel */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between shrink-0">
            <h2 className="text-lg font-semibold text-gray-900">Mensajes</h2>
          </div>
          
          <ConversationList
            conversations={conversations}
            currentConversationId={currentConversation?.id}
            onSelectConversation={selectConversation}
            isLoading={isLoadingConversations}
          />
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {currentConversation ? (
            <>
              {/* Chat Header */}
              <div className="bg-white border-b border-gray-200 px-6 py-4 shrink-0 flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#FF6A00] to-pink-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
                  {(currentConversation.artistName ?? 'A').charAt(0)}
                </div>
                <div>
                  <h2 className="text-base font-semibold text-gray-900">
                    {currentConversation.artistName ?? 'Artista'}
                  </h2>
                  <p className="text-xs text-green-500 font-medium">En línea</p>
                </div>
              </div>

              {/* Messages */}
              <MessageList
                messages={messages}
                currentUserId={user?.id ?? 'me'}
                isTyping={isTyping}
                isLoading={false}
              />

              {/* Input */}
              <MessageInput
                onSendMessage={handleSendMessage}
                onTypingStart={handleTypingStart}
                onTypingStop={handleTypingStop}
                disabled={isSending}
              />
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="h-20 w-20 rounded-full bg-[#FF6A00]/10 flex items-center justify-center mx-auto mb-4">
                  <svg className="h-10 w-10 text-[#FF6A00]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Selecciona una conversación</h3>
                <p className="text-gray-500">Comienza a chatear con artistas</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
