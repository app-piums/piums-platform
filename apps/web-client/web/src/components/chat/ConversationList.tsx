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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="text-center py-12 px-4">
        <div className="text-4xl mb-3">💬</div>
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
              w-full text-left px-4 py-3 border-b border-gray-200 hover:bg-gray-50 transition-colors
              ${isActive ? 'bg-purple-50 border-l-4 border-l-purple-600' : ''}
            `}
          >
            <div className="flex items-start justify-between mb-1">
              <h3 className={`font-semibold ${hasUnread ? 'text-gray-900' : 'text-gray-700'}`}>
                Conversación
              </h3>
              
              {hasUnread && (
                <span className="bg-purple-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {conversation.unreadCount}
                </span>
              )}
            </div>
            
            {lastMessage && (
              <p className={`text-sm truncate ${hasUnread ? 'font-medium text-gray-900' : 'text-gray-600'}`}>
                {lastMessage.content}
              </p>
            )}
            
            <p className="text-xs text-gray-500 mt-1">
              {new Date(conversation.lastMessageAt).toLocaleDateString('es-MX', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </button>
        );
      })}
    </div>
  );
};
