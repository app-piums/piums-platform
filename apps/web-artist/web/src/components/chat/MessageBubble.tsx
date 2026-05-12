'use client';

import React from 'react';
import { Message } from '@/types/chat';
import { Check, CheckCheck } from 'lucide-react';

interface MessageBubbleProps {
  message: Message;
  isOwnMessage: boolean;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isOwnMessage }) => {
  return (
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-3`}>
      <div
        className={`
          max-w-[72%] px-4 py-2.5
          ${
            isOwnMessage
              ? 'bg-[#FF6B35] text-white rounded-2xl rounded-br-sm shadow-sm'
              : 'bg-white border border-gray-200 text-gray-900 rounded-2xl rounded-bl-sm shadow-sm'
          }
        `}
      >
        <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">{message.content}</p>

        <div className={`flex items-center gap-1.5 mt-1 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
          <span className={`text-xs ${isOwnMessage ? 'text-orange-100' : 'text-gray-400'}`}>
            {new Date(message.createdAt).toLocaleTimeString('es-GT', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>

          {isOwnMessage && (
            <span className="text-orange-100">
              {message.readAt ? <CheckCheck size={13} /> : <Check size={13} />}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
