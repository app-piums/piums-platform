'use client';

import React from 'react';
import type { CardComponentProps } from 'nextstepjs';

export function PiumsTourCard({
  step,
  currentStep,
  totalSteps,
  nextStep,
  prevStep,
  skipTour,
  arrow,
}: CardComponentProps) {
  const progress = ((currentStep + 1) / totalSteps) * 100;
  const isLast = currentStep === totalSteps - 1;

  return (
    <div className="bg-white dark:bg-[#1E293B] rounded-xl shadow-2xl p-4 min-w-[16rem] max-w-[32rem] border border-gray-100 dark:border-[#334155]">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <h2 className="text-sm font-bold text-gray-900 dark:text-[#F1F5F9] leading-tight">
          {step.title}
        </h2>
        {step.icon && (
          <span className="text-xl shrink-0">{step.icon}</span>
        )}
      </div>

      {/* Content */}
      <div className="text-sm text-gray-600 dark:text-[#94A3B8] mb-4 leading-relaxed">
        {step.content}
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-gray-100 dark:bg-[#334155] rounded-full mb-4 overflow-hidden">
        <div
          className="h-full bg-[#FF6A00] rounded-full transition-all duration-400"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Controls */}
      {step.showControls !== false && (
        <div className="flex items-center justify-between gap-3 text-xs">
          <button
            onClick={prevStep}
            disabled={currentStep === 0}
            className="px-3 py-1.5 font-medium text-gray-600 dark:text-[#CBD5E1] bg-gray-100 dark:bg-[#334155] hover:bg-gray-200 dark:hover:bg-[#3E536B] rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            Anterior
          </button>
          <span className="text-gray-400 dark:text-[#64748B] whitespace-nowrap font-medium tabular-nums">
            {currentStep + 1} / {totalSteps}
          </span>
          <button
            onClick={nextStep}
            className={`px-3 py-1.5 font-semibold text-white rounded-md transition-colors cursor-pointer ${
              isLast
                ? 'bg-[#10B981] hover:bg-[#0d9e74]'
                : 'bg-[#FF6A00] hover:bg-[#e55e00]'
            }`}
          >
            {isLast ? 'Finalizar' : 'Siguiente'}
          </button>
        </div>
      )}

      {arrow}

      {/* Skip */}
      {skipTour && !isLast && (
        <button
          onClick={skipTour}
          style={{ display: step.showSkip === false ? 'none' : 'block' }}
          className="mt-3 w-full py-1.5 px-3 text-xs font-medium text-gray-500 dark:text-[#64748B] bg-gray-100 dark:bg-[#334155] hover:bg-gray-200 dark:hover:bg-[#3E536B] rounded-md transition-colors text-center cursor-pointer"
        >
          Omitir tour
        </button>
      )}
    </div>
  );
}
