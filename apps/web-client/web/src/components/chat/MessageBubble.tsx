'use client';

import React from 'react';
import { Message } from '@/types/chat';

interface MessageBubbleProps {
  message: Message;
  isOwnMessage: boolean;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isOwnMessage }) => {
  return (
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        className={`
          max-w-[70%] px-4 py-2 rounded-lg
          ${
            isOwnMessage
              ? 'bg-purple-600 text-white rounded-br-none'
              : 'bg-gray-200 text-gray-900 rounded-bl-none'
          }
        `}
      >
        <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
        
        <div className="flex items-center gap-2 mt-1">
          <span className={`text-xs ${isOwnMessage ? 'text-purple-200' : 'text-gray-500'}`}>
            {new Date(message.createdAt).toLocaleTimeString('es-MX', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
          
          {isOwnMessage && (
            <span className="text-xs text-purple-200">
              {message.read ? '✓✓' : '✓'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
