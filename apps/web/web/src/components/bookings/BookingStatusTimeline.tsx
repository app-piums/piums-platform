'use client';

import React from 'react';

interface BookingStatusTimelineProps {
  status: string;
  createdAt: string;
  confirmedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  className?: string;
}

export const BookingStatusTimeline: React.FC<BookingStatusTimelineProps> = ({
  status,
  createdAt,
  confirmedAt,
  completedAt,
  cancelledAt,
  className = '',
}) => {
  const steps = [
    {
      id: 'created',
      name: 'Creada',
      date: createdAt,
      status: 'complete',
    },
    {
      id: 'confirmed',
      name: 'Confirmada',
      date: confirmedAt,
      status:
        status === 'PENDING'
          ? 'upcoming'
          : confirmedAt
          ? 'complete'
          : 'upcoming',
    },
    {
      id: 'completed',
      name: cancelledAt ? 'Cancelada' : 'Completada',
      date: cancelledAt || completedAt,
      status:
        status === 'CANCELLED'
          ? 'cancelled'
          : status === 'COMPLETED'
          ? 'complete'
          : status === 'IN_PROGRESS'
          ? 'current'
          : 'upcoming',
    },
  ];

  const getStepIcon = (stepStatus: string) => {
    if (stepStatus === 'complete') {
      return (
        <svg
          className="h-5 w-5 text-white"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
            clipRule="evenodd"
          />
        </svg>
      );
    }
    if (stepStatus === 'current') {
      return (
        <svg
          className="h-5 w-5 text-white animate-pulse"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
            clipRule="evenodd"
          />
        </svg>
      );
    }
    if (stepStatus === 'cancelled') {
      return (
        <svg
          className="h-5 w-5 text-white"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
            clipRule="evenodd"
          />
        </svg>
      );
    }
    return null;
  };

  const getStepColor = (stepStatus: string) => {
    if (stepStatus === 'complete') return 'bg-green-600';
    if (stepStatus === 'current') return 'bg-blue-600';
    if (stepStatus === 'cancelled') return 'bg-red-600';
    return 'bg-gray-300';
  };

  const getLineColor = (currentIndex: number) => {
    const currentStep = steps[currentIndex];
    const nextStep = steps[currentIndex + 1];

    if (
      currentStep.status === 'complete' &&
      (nextStep?.status === 'complete' || nextStep?.status === 'current')
    ) {
      return 'bg-green-600';
    }
    if (currentStep.status === 'cancelled' || nextStep?.status === 'cancelled') {
      return 'bg-red-600';
    }
    return 'bg-gray-300';
  };

  return (
    <div className={`py-4 ${className}`}>
      <nav aria-label="Progress">
        <ol role="list" className="flex items-center">
          {steps.map((step, stepIdx) => (
            <li
              key={step.id}
              className={`relative ${
                stepIdx !== steps.length - 1 ? 'pr-8 sm:pr-20 flex-1' : ''
              }`}
            >
              {/* Connector Line */}
              {stepIdx !== steps.length - 1 && (
                <div
                  className="absolute inset-0 flex items-center top-4"
                  aria-hidden="true"
                >
                  <div
                    className={`h-0.5 w-full ${getLineColor(stepIdx)}`}
                  />
                </div>
              )}

              <div className="relative flex flex-col items-center group">
                <span
                  className={`h-9 w-9 rounded-full flex items-center justify-center ${getStepColor(
                    step.status
                  )} relative z-10 transition-all duration-200 ${
                    step.status === 'current' ? 'ring-4 ring-blue-200' : ''
                  }`}
                >
                  {getStepIcon(step.status)}
                </span>
                <span className="mt-2 text-xs font-medium text-gray-900 text-center">
                  {step.name}
                </span>
                {step.date && (
                  <span className="mt-1 text-xs text-gray-500 text-center">
                    {new Date(step.date).toLocaleDateString('es-MX', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ol>
      </nav>

      {/* Status Description */}
      <div className="mt-4 text-center">
        {status === 'PENDING' && (
          <p className="text-sm text-gray-600">
            Esperando confirmación del artista
          </p>
        )}
        {status === 'CONFIRMED' && (
          <p className="text-sm text-gray-600">
            Tu reserva ha sido confirmada
          </p>
        )}
        {status === 'IN_PROGRESS' && (
          <p className="text-sm text-blue-600 font-medium">
            Servicio en progreso
          </p>
        )}
        {status === 'COMPLETED' && (
          <p className="text-sm text-green-600 font-medium">
            Servicio completado exitosamente
          </p>
        )}
        {status === 'CANCELLED' && (
          <p className="text-sm text-red-600 font-medium">
            Esta reserva fue cancelada
          </p>
        )}
      </div>
    </div>
  );
};
