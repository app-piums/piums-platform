'use client';

import React, { useState, KeyboardEvent } from 'react';

interface MessageInputProps {
  onSendMessage: (content: string) => void;
  onTypingStart: () => void;
  onTypingStop: () => void;
  disabled?: boolean;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  onTypingStart,
  onTypingStop,
  disabled = false,
}) => {
  const [message, setMessage] = useState('');
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setMessage(value);

    // Notificar que está escribiendo
    if (value.length > 0) {
      onTypingStart();

      // Clear previous timeout
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }

      // Set new timeout to stop typing indicator
      const timeout = setTimeout(() => {
        onTypingStop();
      }, 1000);

      setTypingTimeout(timeout);
    } else {
      onTypingStop();
    }
  };

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage('');
      onTypingStop();

      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-gray-200 p-4 bg-white">
      <div className="flex items-end gap-2">
        <textarea
          value={message}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Escribe un mensaje..."
          disabled={disabled}
          rows={1}
          className="flex-1 px-4 py-2 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/40 focus:border-[#FF6B35] disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors text-gray-900"
          style={{ maxHeight: '120px' }}
        />
        
        <button
          onClick={handleSend}
          disabled={!message.trim() || disabled}
          className="flex items-center gap-1.5 px-5 py-2 bg-[#FF6B35] text-white rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
        >
          <svg className="h-4 w-4 rotate-45" fill="currentColor" viewBox="0 0 24 24">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
          <span className="hidden sm:inline">Enviar</span>
        </button>
      </div>
      
      <p className="text-xs text-gray-500 mt-2">
        Presiona Enter para enviar, Shift + Enter para nueva línea
      </p>
    </div>
  );
};
