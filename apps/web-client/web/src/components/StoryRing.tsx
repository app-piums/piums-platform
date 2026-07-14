'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

interface StoryRingProps {
  hasStory: boolean;
  onOpen?: () => void;
  children: React.ReactNode;
  className?: string;
}

/**
 * Anillo estilo "historia" con resplandor pulsante alrededor del avatar.
 * Solo se muestra el anillo cuando hasStory === true; en caso contrario
 * renderiza el avatar tal cual (sin anillo, sin placeholder — los clientes
 * nunca ven placeholder). El avatar que envuelve ya trae su borde blanco,
 * que actúa como separación entre el anillo degradado y la foto.
 */
export function StoryRing({ hasStory, onOpen, children, className = '' }: StoryRingProps) {
  const reduceMotion = useReducedMotion();

  if (!hasStory) {
    return <div className={className}>{children}</div>;
  }

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label="Ver video presentación"
      className={`group relative inline-flex items-center justify-center rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B35] focus-visible:ring-offset-2 ${className}`}
    >
      {/* Anillo degradado con resplandor que "respira" para llamar la atención */}
      <motion.span
        aria-hidden
        className="block rounded-full p-[5px] bg-gradient-to-br from-[#FF6B35] to-[#FFC24B] transition-transform duration-200 group-hover:scale-105"
        style={reduceMotion ? { boxShadow: '0 0 22px 4px rgba(255,107,53,0.75)' } : undefined}
        animate={
          reduceMotion
            ? undefined
            : {
                boxShadow: [
                  '0 0 16px 2px rgba(255,107,53,0.55)',
                  '0 0 30px 8px rgba(255,107,53,0.95)',
                  '0 0 16px 2px rgba(255,107,53,0.55)',
                ],
              }
        }
        transition={reduceMotion ? undefined : { duration: 2.1, repeat: Infinity, ease: 'easeInOut' }}
      >
        {children}
      </motion.span>

      {/* Botón de reproducir */}
      <span className="absolute bottom-0 right-0 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-[#FF6B35] text-white shadow-md ring-2 ring-white">
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5 translate-x-[1px]">
          <path d="M8 5v14l11-7z" />
        </svg>
      </span>
    </button>
  );
}
