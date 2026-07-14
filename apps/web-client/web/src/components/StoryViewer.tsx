'use client';

import React, { useEffect, useRef, useState } from 'react';
import { cImg } from '@/lib/cloudinaryImg';

interface StoryViewerProps {
  videoUrl: string;
  posterUrl?: string | null;
  onClose: () => void;
}

/**
 * Visor pantalla completa estilo "historia": video vertical con barra de progreso.
 * Se cierra al terminar el video, al tocar fuera, con la X o con Escape.
 */
export function StoryViewer({ videoUrl, posterUrl, onClose }: StoryViewerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black"
      onClick={onClose}
    >
      {/* Barra de progreso */}
      <div className="absolute top-3 left-3 right-3 h-1 rounded-full bg-white/30 overflow-hidden">
        <div
          className="h-full bg-white"
          style={{ width: `${progress}%`, transition: 'width 100ms linear' }}
        />
      </div>

      <button
        onClick={onClose}
        aria-label="Cerrar"
        className="absolute top-5 right-4 z-10 text-white text-3xl font-light leading-none hover:text-gray-300"
      >
        ✕
      </button>

      <video
        ref={videoRef}
        src={videoUrl}
        poster={posterUrl ? cImg(posterUrl) : undefined}
        autoPlay
        playsInline
        controls={false}
        onClick={(e) => e.stopPropagation()}
        onTimeUpdate={(e) => {
          const v = e.currentTarget;
          if (v.duration) setProgress((v.currentTime / v.duration) * 100);
        }}
        onEnded={onClose}
        className="h-full max-h-full max-w-full object-contain"
      />
    </div>
  );
}
