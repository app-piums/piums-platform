'use client';

import React from 'react';
import { Conversation } from '@/../../packages/sdk/src';

interface ConversationListProps {
  conversations: Conversation[];
  currentConversationId?: string;
  onSelectConversation: (conversationId: string) => void;
  isLoading?: boolean;
}

export const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  currentConversationId,
  onSelectConversation,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF6A00]"></div>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="text-center py-12 px-4">
        <div className="flex justify-center mb-3">
          <svg className="h-10 w-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <p className="text-sm text-gray-600">No hay conversaciones</p>
      </div>
    );
  }

  return (
    <div className="overflow-y-auto">
      {conversations.map((conversation) => {
        const lastMessage = conversation.messages?.[0];
        const isActive = currentConversationId === conversation.id;
        const hasUnread = (conversation.unreadCount || 0) > 0;

        return (
          <button
            key={conversation.id}
            onClick={() => onSelectConversation(conversation.id)}
            className={`
              w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors
              ${isActive ? 'bg-orange-50 border-l-[3px] border-l-[#FF6A00]' : 'border-l-[3px] border-l-transparent'}
            `}
          >
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                C
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <h3 className={`text-sm font-semibold truncate ${hasUnread ? 'text-gray-900' : 'text-gray-700'}`}>
                    {(conversation as { clientName?: string }).clientName ?? 'Cliente'}
                  </h3>
                  {hasUnread && (
                    <span className="bg-[#FF6A00] text-white text-xs font-bold px-1.5 py-0.5 rounded-full shrink-0 ml-1">
                      {conversation.unreadCount}
                    </span>
                  )}
                </div>
                {lastMessage && (
                  <p className={`text-xs truncate ${hasUnread ? 'font-medium text-gray-800' : 'text-gray-500'}`}>
                    {lastMessage.content}
                  </p>
                )}
                <p className="text-xs text-gray-400 mt-0.5">
                  {conversation.lastMessageAt
                    ? new Date(conversation.lastMessageAt).toLocaleDateString('es-GT', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : 'Sin actividad reciente'}
                </p>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
};
