'use client';

import React from 'react';

interface TypingIndicatorProps {
  isTyping: boolean;
  senderName?: string;
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({ isTyping, senderName }) => {
  if (!isTyping) return null;

  return (
    <div className="flex justify-start mb-3">
      <div className="bg-white border border-gray-200 shadow-sm px-4 py-3 rounded-2xl rounded-bl-sm">
        <div className="flex gap-1.5 items-center">
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          {senderName && <span className="text-xs text-gray-400 ml-1">{senderName} escribe...</span>}
        </div>
      </div>
    </div>
  );
};
