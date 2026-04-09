'use client';

import React, { useEffect, useRef, useState, Suspense } from 'react';
import { PageHelpButton } from '@/components/PageHelpButton';
import { useRouter, useSearchParams } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import { Conversation, Message } from '@/types/chat';
import { ConversationList } from '@/components/chat/ConversationList';
import { MessageList } from '@/components/chat/MessageList';
import { MessageInput } from '@/components/chat/MessageInput';
import ClientSidebar from '@/components/ClientSidebar';
import { useAuth } from '@/contexts/AuthContext';
import { Loading } from '@/components/Loading';

const CHAT_SOCKET_URL =
  process.env.NEXT_PUBLIC_CHAT_SERVICE_URL || 'http://localhost:4010';

function ChatPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push('/login?redirect=/chat');
  }, [authLoading, isAuthenticated, router]);

  // Connect Socket.io for real-time messages
  useEffect(() => {
    if (!user || !isAuthenticated) return;

    // Fetch token from server to use for socket auth (httpOnly cookie)
    fetch('/api/chat/token', { credentials: 'include' })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (!data?.token) return;

        const socket = io(CHAT_SOCKET_URL, {
          path: '/socket.io/',
          auth: { token: data.token },
          transports: ['websocket'],
        });

        socket.on('connect', () => {
          // Join current conversation if one is selected
          if (currentConversation) {
            socket.emit('conversation:join', { conversationId: currentConversation.id });
          }
        });

        socket.on('message:received', (msg: Message) => {
          setMessages(prev => {
            // Avoid duplicates
            if (prev.find(m => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
          setConversations(prev =>
            prev.map(c =>
              c.id === msg.conversationId
                ? { ...c, lastMessageAt: msg.createdAt, unreadCount: c.id === currentConversation?.id ? 0 : (c.unreadCount ?? 0) + 1 }
                : c
            )
          );
        });

        socket.on('typing:start', ({ userId }: { userId: string }) => {
          if (userId !== user.id) setIsTyping(true);
        });

        socket.on('typing:stop', ({ userId }: { userId: string }) => {
          if (userId !== user.id) setIsTyping(false);
        });

        socketRef.current = socket;
      })
      .catch(() => {});

    return () => {
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [user, isAuthenticated]); // eslint-disable-line react-hooks/exhaustive-deps

  // Join conversation room when selection changes
  useEffect(() => {
    if (socketRef.current?.connected && currentConversation) {
      socketRef.current.emit('conversation:join', { conversationId: currentConversation.id });
    }
  }, [currentConversation?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load conversations from real API
  useEffect(() => {
    if (!isAuthenticated) return;
    const fetchConversations = async () => {
      setIsLoadingConversations(true);
      setError(null);
      try {
        const res = await fetch('/api/chat/conversations', { credentials: 'include' });
        if (!res.ok) throw new Error('Error al cargar conversaciones');
        const data = await res.json();
        const convList: Conversation[] = data.conversations ?? data ?? [];
        setConversations(convList);

        // Auto-select conversation by ?artistId query param, else fall back to first
        const targetArtistId = searchParams?.get('artistId');
        const targetBookingId = searchParams?.get('bookingId');
        let target = convList[0] ?? null;
        if (targetArtistId) {
          target = convList.find(c => c.artistId === targetArtistId) ?? convList[0] ?? null;
        } else if (targetBookingId) {
          target = convList.find(c => c.bookingId === targetBookingId) ?? convList[0] ?? null;
        }

        if (target) {
          setCurrentConversation(target);
          const msgRes = await fetch(`/api/chat/messages/${target.id}`, { credentials: 'include' });
          if (msgRes.ok) {
            const msgData = await msgRes.json();
            setMessages(msgData.messages ?? msgData ?? []);
          }
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error desconocido al cargar conversaciones.';
        setError(message);
        setConversations([]);
        setMessages([]);
      } finally {
        setIsLoadingConversations(false);
      }
    };
    fetchConversations();
  }, [isAuthenticated]);

  const selectConversation = async (conversationId: string) => {
    const conv = conversations.find(c => c.id === conversationId) ?? null;
    setCurrentConversation(conv);
    setMessages([]);
    setMobileView('chat');
    if (!conv) return;

    setError(null);
    try {
      const res = await fetch(`/api/chat/messages/${conv.id}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Error al cargar mensajes');
      const msgData = await res.json();
      setMessages(msgData.messages ?? msgData ?? []);
    } catch {
      setError('Error al cargar mensajes de la conversación.');
    }

    // Mark as read
    fetch(`/api/chat/conversations/${conv.id}/read`, {
      method: 'PATCH',
      credentials: 'include',
    }).catch(() => {});

    setConversations(prev =>
      prev.map(c => c.id === conversationId ? { ...c, unreadCount: 0 } : c)
    );
  };

  const handleSendMessage = async (content: string) => {
    if (!currentConversation || isSending) return;
    setIsSending(true);
    setError(null);
    try {
      const res = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ conversationId: currentConversation.id, content }),
      });
      if (!res.ok) throw new Error('Error al enviar mensaje');
      const msg = await res.json();
      const newMsg: Message = msg.message ?? msg;
      setMessages(prev => (prev.find(m => m.id === newMsg.id) ? prev : [...prev, newMsg]));
      setConversations(prev =>
        prev.map(c =>
          c.id === currentConversation.id
            ? { ...c, lastMessageAt: newMsg.createdAt }
            : c
        )
      );
    } catch {
      setError('Error al enviar mensaje.');
    } finally {
      setIsSending(false);
    }
  };

  const handleTypingStart = () => {
    if (socketRef.current?.connected && currentConversation) {
      socketRef.current.emit('typing:start', { conversationId: currentConversation.id });
    }
  };

  const handleTypingStop = () => {
    if (socketRef.current?.connected && currentConversation) {
      socketRef.current.emit('typing:stop', { conversationId: currentConversation.id });
    }
  };

  if (authLoading || !isAuthenticated) return <Loading fullScreen />;

  return (
    <div className="flex bg-gray-50 overflow-hidden" style={{ height: '100dvh' }}>
      <ClientSidebar userName={user?.nombre ?? 'Usuario'} />
        <PageHelpButton tourId="chatTour" />

      {/* Main Chat Layout */}
      <div className="flex flex-1 overflow-hidden relative pt-14 lg:pt-0">
        {error && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded shadow text-sm">
            {error}
          </div>
        )}
        {/* Conversations panel */}
        <div className={`${mobileView === 'list' ? 'flex' : 'hidden'} md:flex w-full md:w-80 bg-white border-r border-gray-200 flex-col shrink-0`}>
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
        <div className={`${mobileView === 'chat' ? 'flex' : 'hidden'} md:flex flex-1 flex-col overflow-hidden`}>
          {currentConversation ? (
            <>
              {/* Chat Header */}
              <div className="bg-white border-b border-gray-200 px-4 lg:px-6 py-3 lg:py-4 shrink-0 flex items-center gap-3">
                <button
                  onClick={() => setMobileView('list')}
                  className="md:hidden p-1.5 -ml-1 text-gray-500 hover:text-gray-900"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
                  </svg>
                </button>
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
                disabled={isSending || currentConversation?.status === 'PENDING'}
                disabledReason={
                  currentConversation?.status === 'PENDING'
                    ? 'En espera de confirmación de reserva para habilitar el chat'
                    : undefined
                }
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

export default function ChatPage() {
  return (
    <Suspense fallback={<Loading fullScreen />}>
      <ChatPageInner />
    </Suspense>
  );
}
