'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { sdk, Conversation, Message } from '@/../../packages/sdk/src';
import { ConversationList } from '@/components/chat/ConversationList';
import { MessageList } from '@/components/chat/MessageList';
import { MessageInput } from '@/components/chat/MessageInput';

export default function ChatPage() {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    loadConversations();
    // TODO: Get current user ID from auth context
    setCurrentUserId('user-id'); // Placeholder
  }, []);

  const loadConversations = async () => {
    try {
      setIsLoadingConversations(true);
      setError(null);

      const result = await sdk.getConversations();
      setConversations(result.conversations);

      // Auto-select first conversation
      if (result.conversations.length > 0 && !currentConversation) {
        await selectConversation(result.conversations[0].id);
      }
    } catch (err: any) {
      console.error('Error loading conversations:', err);
      setError(err.message || 'Error al cargar conversaciones');
      
      if (err.message?.includes('No autenticado') || err.message?.includes('401')) {
        router.push('/login?redirect=/chat');
      }
    } finally {
      setIsLoadingConversations(false);
    }
  };

  const selectConversation = async (conversationId: string) => {
    try {
      setIsLoadingMessages(true);
      setError(null);

      const { conversation } = await sdk.getConversation(conversationId);
      setCurrentConversation(conversation);
      setMessages(conversation.messages || []);

      // Marcar como leída
      if (conversation.unreadCount && conversation.unreadCount > 0) {
        await sdk.markConversationAsRead(conversationId);
        // Actualizar contador en la lista
        setConversations(prevConversations =>
          prevConversations.map(conv =>
            conv.id === conversationId ? { ...conv, unreadCount: 0 } : conv
          )
        );
      }
    } catch (err: any) {
      console.error('Error loading conversation:', err);
      setError(err.message || 'Error al cargar conversación');
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!currentConversation || isSending) return;

    try {
      setIsSending(true);

      const { message } = await sdk.sendMessage({
        conversationId: currentConversation.id,
        content,
      });

      // Agregar el mensaje a la lista
      setMessages(prev => [...prev, message]);

      // Actualizar lastMessageAt en la lista de conversaciones
      setConversations(prevConversations =>
        prevConversations.map(conv =>
          conv.id === currentConversation.id
            ? { ...conv, lastMessageAt: message.createdAt, messages: [message] }
            : conv
        )
      );
    } catch (err: any) {
      console.error('Error sending message:', err);
      alert(err.message || 'Error al enviar mensaje');
    } finally {
      setIsSending(false);
    }
  };

  const handleTypingStart = () => {
    // TODO: Emit via WebSocket
    setIsTyping(false); // Por ahora no mostramos typing del otro usuario
  };

  const handleTypingStop = () => {
    // TODO: Emit via WebSocket
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="text-gray-600 hover:text-gray-900"
            >
              ← Volver
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Chat</h1>
          </div>

          <button
            onClick={loadConversations}
            className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
          >
            🔄 Actualizar
          </button>
        </div>
      </header>

      {/* Main Chat Layout */}
      <div className="max-w-7xl mx-auto h-[calc(100vh-80px)] flex">
        {/* Sidebar - Conversations List */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Conversaciones</h2>
          </div>
          
          <ConversationList
            conversations={conversations}
            currentConversationId={currentConversation?.id}
            onSelectConversation={selectConversation}
            isLoading={isLoadingConversations}
          />
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {currentConversation ? (
            <>
              {/* Chat Header */}
              <div className="bg-white border-b border-gray-200 px-6 py-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Conversación
                </h2>
                <p className="text-sm text-gray-600">
                  ID: {currentConversation.id.slice(0, 8)}...
                </p>
              </div>

              {/* Messages */}
              <MessageList
                messages={messages}
                currentUserId={currentUserId}
                isTyping={isTyping}
                isLoading={isLoadingMessages}
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
                <div className="text-6xl mb-4">💬</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Selecciona una conversación
                </h3>
                <p className="text-gray-600">
                  Comienza a chatear con artistas
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Error Toast */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg">
          {error}
        </div>
      )}
    </div>
  );
}
