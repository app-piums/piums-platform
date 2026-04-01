'use client';

import React from 'react';
import { useNextStep } from 'nextstepjs';

interface PageHelpButtonProps {
  tourId: string;
}

export function PageHelpButton({ tourId }: PageHelpButtonProps) {
  const { startNextStep } = useNextStep();

  return (
    <button
      onClick={() => startNextStep(tourId)}
      aria-label="Ver ayuda de esta página"
      className="fixed bottom-6 right-6 z-40 w-12 h-12 rounded-full bg-[#FF6A00] text-white shadow-lg hover:bg-[#e55e00] hover:scale-105 active:scale-95 transition-all flex items-center justify-center group"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={2}
        stroke="currentColor"
        className="w-5 h-5"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z"
        />
      </svg>
      <span className="pointer-events-none absolute right-14 bg-gray-900 text-white text-xs font-medium rounded-lg px-2.5 py-1.5 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 shadow-lg">
        Ayuda de esta página
      </span>
    </button>
  );
}
