"use client";
import { io, Socket } from 'socket.io-client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Conversation, Message } from '@/types/chat';
import { ConversationList } from '@/components/chat/ConversationList';
import { MessageList } from '@/components/chat/MessageList';
import { MessageInput } from '@/components/chat/MessageInput';
import { DashboardSidebar } from '@/components/artist/DashboardSidebar';
import { useAuth } from '@/contexts/AuthContext';
import { Loading } from '@/components/Loading';
import { getErrorMessage } from '@/lib/errors';

export default function ChatPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  // WebSocket para mensajes en tiempo real
  useEffect(() => {
    if (!user || !isAuthenticated) return;
    // Ajusta la URL y path según tu backend
    const socket: Socket = io(process.env.NEXT_PUBLIC_CHAT_SERVICE_URL || 'http://localhost:4007', {
      path: '/socket.io/',
      auth: { token: typeof window !== 'undefined' ? localStorage.getItem('token') : '' },
      transports: ['websocket'],
    });

    socket.on('connect', () => {
      // Opcional: console.log('Conectado a WebSocket');
    });

    socket.on('message:received', (msg: Message) => {
      // Si el mensaje es para la conversación actual, agregarlo
      setMessages(prev => [...prev, msg]);
      // Opcional: actualizar conversaciones si es necesario
    });

    return () => {
      socket.disconnect();
    };
  }, [user, isAuthenticated]);
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
    const fetchConversations = async () => {
      setIsLoadingConversations(true);
      setError(null);
      try {
        const res = await fetch('/api/chat/conversations', {
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });
        if (!res.ok) throw new Error('Error al cargar conversaciones');
        const data = await res.json();
        setConversations(data);
        if (data.length > 0) {
          setCurrentConversation(data[0]);
          // Cargar mensajes de la primera conversación
          const msgRes = await fetch(`/api/chat/messages/${data[0].id}`, {
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
          });
          if (msgRes.ok) {
            const msgData = await msgRes.json();
            setMessages(msgData);
          } else {
            setMessages([]);
            setError('Error al cargar mensajes de la conversación.');
          }
        }
        setIsLoadingConversations(false);
      } catch (err: unknown) {
        const message = getErrorMessage(err);
        setIsLoadingConversations(false);
        setConversations([]);
        setMessages([]);
        setError(message || 'Error desconocido al cargar conversaciones.');
      }
    };
    fetchConversations();
  }, []);

  const selectConversation = (conversationId: string) => {
    const conv = conversations.find(c => c.id === conversationId) ?? null;
    setCurrentConversation(conv);
    // Cargar mensajes reales
    if (conv) {
      setError(null);
      fetch(`/api/chat/messages/${conv.id}`, {
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      })
        .then(async res => {
          if (!res.ok) throw new Error('Error al cargar mensajes');
          const msgData = await res.json();
          setMessages(msgData);
        })
        .catch((err: unknown) => {
          setMessages([]);
          setError(getErrorMessage(err) || 'Error al cargar mensajes de la conversación.');
        });
      // Marcar mensajes como leídos
      fetch(`/api/chat/conversations/${conv.id}/read`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
    } else {
      setMessages([]);
    }
    // Actualizar estado local
    setConversations(prev =>
      prev.map(c => c.id === conversationId ? { ...c, unreadCount: 0 } : c)
    );
  };

  const handleSendMessage = (content: string) => {
    if (!currentConversation || isSending) return;
    setIsSending(true);
    setError(null);
    fetch('/api/chat/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        conversationId: currentConversation.id,
        content,
      }),
    })
      .then(async res => {
        if (!res.ok) throw new Error('Error al enviar mensaje');
        const msg = await res.json();
        setMessages(prev => [...prev, msg]);
        setConversations(prev =>
          prev.map(c =>
            c.id === currentConversation.id
              ? { ...c, lastMessageAt: msg.createdAt, messages: [...(c.messages ?? []), msg] }
              : c
          )
        );
      })
      .catch((err: unknown) => {
        setError(getErrorMessage(err) || 'Error al enviar mensaje.');
      })
      .finally(() => setIsSending(false));
  };

  const handleTypingStart = () => setIsTyping(false);
  const handleTypingStop = () => {};

  if (authLoading || !isAuthenticated) return <Loading fullScreen />;

  const showList = !currentConversation;

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <DashboardSidebar />
      {/* Main Chat Layout */}
      <div className="flex flex-1 overflow-hidden pt-14 lg:pt-0">
        {error && (
          <div className="absolute top-16 lg:top-4 left-1/2 -translate-x-1/2 z-50 bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded shadow text-sm">
            {error}
          </div>
        )}
        {/* Conversations panel — always shown on lg, toggle on mobile */}
        <div className={`${
          showList ? 'flex' : 'hidden'
        } lg:flex w-full lg:w-80 bg-white border-r border-gray-200 flex-col`}>
          <div className="p-4 border-b border-gray-200 flex items-center justify-between shrink-0">
            <h2 className="text-lg font-semibold text-gray-900">Mensajes</h2>
          </div>
          {isLoadingConversations ? (
            <div className="flex-1 flex items-center justify-center">
              <span className="text-gray-400">Cargando conversaciones...</span>
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <span className="text-gray-400">No tienes conversaciones aún.</span>
            </div>
          ) : (
            <ConversationList
              conversations={conversations}
              currentConversationId={currentConversation?.id}
              onSelectConversation={(id) => { selectConversation(id); }}
              isLoading={isLoadingConversations}
            />
          )}
        </div>
        {/* Main Chat Area — always shown on lg, shown only when conversation selected on mobile */}
        <div className={`${
          !showList ? 'flex' : 'hidden'
        } lg:flex flex-1 flex-col overflow-hidden`}>
          {isLoadingConversations ? (
            <div className="flex-1 flex items-center justify-center">
              <span className="text-gray-400">Cargando mensajes...</span>
            </div>
          ) : currentConversation ? (
            <>
              {/* Chat Header */}
              <div className="bg-white border-b border-gray-200 px-4 py-3 shrink-0 flex items-center gap-3">
                {/* Back button on mobile */}
                <button
                  className="lg:hidden p-1.5 text-gray-500 hover:text-gray-700"
                  onClick={() => setCurrentConversation(null)}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#FF6A00] to-pink-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
                  {(currentConversation.clientName ?? 'C').charAt(0)}
                </div>
                <div>
                  <h2 className="text-base font-semibold text-gray-900">
                    {currentConversation.clientName ?? 'Cliente'}
                  </h2>
                  <p className="text-xs text-green-500 font-medium">En línea</p>
                </div>
              </div>
              {/* Messages */}
              {messages.length === 0 ? (
                <div className="flex-1 flex items-center justify-center">
                  <span className="text-gray-400">No hay mensajes en esta conversación.</span>
                </div>
              ) : (
                <MessageList
                  messages={messages}
                  currentUserId={user?.id ?? 'me'}
                  isTyping={isTyping}
                  isLoading={false}
                />
              )}
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
                <p className="text-gray-500">Comienza a chatear con tus clientes</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
