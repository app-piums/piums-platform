"use client";

import { io, Socket } from 'socket.io-client';
import React, { Suspense, useEffect, useRef, useState } from 'react';
import { toast } from '@/lib/toast';
import { useRouter, useSearchParams } from 'next/navigation';
import { sdk } from '@piums/sdk';
import type { GroupConversation, GroupMessage } from '@piums/sdk';
import { MessageList } from '@/components/chat/MessageList';
import { MessageInput } from '@/components/chat/MessageInput';
import { DashboardSidebar } from '@/components/artist/DashboardSidebar';
import { useAuth } from '@/contexts/AuthContext';
import { Loading } from '@/components/Loading';

const CHAT_SOCKET_URL =
  typeof window !== 'undefined' && window.location.hostname !== 'localhost'
    ? (process.env.NEXT_PUBLIC_CHAT_SERVICE_URL || 'https://backend.piums.io')
    : (process.env.NEXT_PUBLIC_CHAT_SERVICE_URL || 'http://localhost:4010');

function GroupChatPageInner() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const groupId = searchParams.get('groupId');
  const bookingId = searchParams.get('bookingId');

  const [group, setGroup] = useState<GroupConversation | null>(null);
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const currentGroupIdRef = useRef<string | null>(null);

  // Resolve groupId from bookingId if needed
  const resolveAndLoad = async () => {
    try {
      let gId = groupId;
      if (!gId && bookingId) {
        // Try to load group by bookingId — the group was created when collaborator accepted
        const { groups } = await sdk.getGroupConversations();
        const found = groups.find(g => g.bookingId === bookingId);
        if (found) gId = found.id;
      }
      if (!gId) { setError('No se encontró el chat grupal para esta reserva.'); setLoading(false); return; }
      currentGroupIdRef.current = gId;

      const { group: g } = await sdk.getGroupConversation(gId);
      setGroup(g);
      setMessages(g.messages ?? []);
      await sdk.markGroupAsRead(gId);
    } catch (err: any) {
      setError(err.message || 'Error cargando el chat grupal');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !isAuthenticated) { router.push('/login'); return; }
    if (user) resolveAndLoad();
  }, [user, isAuthenticated, authLoading]);

  // Socket.IO
  useEffect(() => {
    if (!user || !isAuthenticated) return;

    const socket: Socket = io(CHAT_SOCKET_URL, {
      path: '/socket.io/',
      auth: (cb: (data: object) => void) => {
        fetch('/api/chat/token', { credentials: 'include' })
          .then(r => (r.ok ? r.json() : null))
          .then(d => cb({ token: d?.token || '' }))
          .catch(() => cb({ token: '' }));
      },
      transports: ['websocket', 'polling'],
      reconnectionDelay: 1000,
      reconnectionDelayMax: 30000,
      randomizationFactor: 0.5,
    });

    socket.on('connect', () => {
      if (currentGroupIdRef.current) {
        socket.emit('group:conversation:join', { groupId: currentGroupIdRef.current });
      }
    });

    socket.on('group:message:received', ({ groupId: gId, message }: { groupId: string; message: GroupMessage }) => {
      if (gId !== currentGroupIdRef.current) return;
      setMessages(prev => [...prev.filter(m => m.id !== message.id), message]);
      sdk.markGroupAsRead(gId).catch(() => {});
    });

    socketRef.current = socket;
    return () => { socket.disconnect(); };
  }, [user, isAuthenticated]);

  const handleSend = async (content: string) => {
    if (!currentGroupIdRef.current || !content.trim()) return;
    setIsSending(true);
    try {
      const { message } = await sdk.sendGroupMessage(currentGroupIdRef.current, content.trim());
      setMessages(prev => [...prev, message]);
    } catch (err: any) {
      toast.error('No se pudo enviar el mensaje. Intenta de nuevo.');
    } finally {
      setIsSending(false);
    }
  };

  if (authLoading || loading) return <Loading />;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <DashboardSidebar />
      <main className="flex-1 lg:ml-72 flex flex-col">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <div className="flex-1 min-w-0">
            {error ? (
              <p className="text-sm text-red-600">{error}</p>
            ) : group ? (
              <>
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {group.name ?? 'Chat de coordinación'}
                </p>
                <p className="text-xs text-gray-500">
                  {group.participants.length} artista{group.participants.length !== 1 ? 's' : ''}
                </p>
              </>
            ) : (
              <p className="text-sm text-gray-400">Cargando...</p>
            )}
          </div>

          {/* Participant avatars */}
          {group && (
            <div className="flex -space-x-1.5">
              {group.participants.slice(0, 4).map(p => (
                <div
                  key={p.id}
                  className="h-7 w-7 rounded-full bg-purple-200 border-2 border-white flex items-center justify-center text-[10px] font-bold text-purple-700"
                  title={p.artistName ?? p.userId}
                >
                  {(p.artistName ?? p.userId).charAt(0).toUpperCase()}
                </div>
              ))}
              {group.participants.length > 4 && (
                <div className="h-7 w-7 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-[10px] font-bold text-gray-500">
                  +{group.participants.length - 4}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {error ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <p className="text-gray-500 text-sm mb-3">{error}</p>
                <button onClick={() => router.back()} className="text-[#FF6B35] text-sm font-medium hover:underline">
                  Volver
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto p-4">
                {/* Sender name badges for group context */}
                {messages.length === 0 ? (
                  <p className="text-center text-sm text-gray-400 mt-8">
                    Aún no hay mensajes. ¡Empieza la coordinación!
                  </p>
                ) : (
                  <div className="space-y-1">
                    {messages.map((msg, idx) => {
                      const isMe = msg.senderId === (user as any)?.id || msg.senderId === (user as any)?.artistId;
                      const prevMsg = messages[idx - 1];
                      const showSender = !isMe && msg.senderId !== prevMsg?.senderId;
                      const participant = group?.participants.find(p => p.userId === msg.senderId);
                      const senderName = participant?.artistName ?? msg.senderId;

                      return (
                        <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                          {showSender && (
                            <span className="text-[10px] text-gray-400 px-1 mb-0.5">{senderName}</span>
                          )}
                          <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm ${
                            isMe
                              ? 'bg-[#FF6B35] text-white rounded-br-sm'
                              : 'bg-white border border-gray-200 text-gray-900 rounded-bl-sm'
                          }`}>
                            {msg.content}
                          </div>
                          <span className="text-[10px] text-gray-400 px-1 mt-0.5">
                            {new Date(msg.createdAt).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="border-t border-gray-100 bg-white px-4 py-3">
                <MessageInput
                  onSendMessage={handleSend}
                  onTypingStart={() => {}}
                  onTypingStop={() => {}}
                  disabled={isSending}
                />
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default function GroupChatPage() {
  return (
    <Suspense fallback={<Loading />}>
      <GroupChatPageInner />
    </Suspense>
  );
}
