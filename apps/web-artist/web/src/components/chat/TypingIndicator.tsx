'use client';

import React from 'react';

interface TypingIndicatorProps {
  isTyping: boolean;
  senderName?: string;
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({ isTyping, senderName }) => {
  if (!isTyping) return null;

  return (
    <div className="flex items-center gap-2 px-4 py-2 text-sm text-gray-500">
      <div className="flex gap-1">
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
      </div>
      <span>{senderName || 'Usuario'} está escribiendo...</span>
    </div>
  );
};
