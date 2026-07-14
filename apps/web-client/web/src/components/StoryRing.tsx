'use client';

import React from 'react';

interface StoryRingProps {
  hasStory: boolean;
  onOpen?: () => void;
  children: React.ReactNode;
  className?: string;
}

/**
 * Anillo estilo "historia" alrededor del avatar. Solo se muestra el anillo cuando
 * hasStory === true; en caso contrario renderiza el avatar tal cual (sin nada).
 */
export function StoryRing({ hasStory, onOpen, children, className = '' }: StoryRingProps) {
  if (!hasStory) {
    return <div className={className}>{children}</div>;
  }

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label="Ver video presentación"
      className={`relative inline-flex items-center justify-center rounded-full p-[3px] bg-gradient-to-tr from-[#FF6B35] via-[#FF8F5E] to-[#FFC24B] transition-transform hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B35] ${className}`}
    >
      <span className="block rounded-full bg-white p-[2px]">{children}</span>
    </button>
  );
}
