'use client';

import React from 'react';

interface StatusBadgeProps {
  status: 'pending' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled' | 'rejected';
  animated?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  animated = true,
  size = 'md',
  className = '',
}) => {
  const statusConfig = {
    pending: {
      label: 'Pendiente',
      bgColor: 'bg-yellow-100',
      textColor: 'text-yellow-800',
      borderColor: 'border-yellow-300',
      dotColor: 'bg-yellow-500',
    },
    confirmed: {
      label: 'Confirmada',
      bgColor: 'bg-[#00AEEF]/10',
      textColor: 'text-[#00AEEF]',
      borderColor: 'border-[#00AEEF]/30',
      dotColor: 'bg-[#00AEEF]',
    },
    'in-progress': {
      label: 'En Progreso',
      bgColor: 'bg-[#FF6A00]/10',
      textColor: 'text-[#FF6A00]',
      borderColor: 'border-[#FF6A00]/30',
      dotColor: 'bg-[#FF6A00]',
    },
    completed: {
      label: 'Completada',
      bgColor: 'bg-green-100',
      textColor: 'text-green-800',
      borderColor: 'border-green-300',
      dotColor: 'bg-green-500',
    },
    cancelled: {
      label: 'Cancelada',
      bgColor: 'bg-gray-100',
      textColor: 'text-gray-800',
      borderColor: 'border-gray-300',
      dotColor: 'bg-gray-500',
    },
    rejected: {
      label: 'Rechazada',
      bgColor: 'bg-red-100',
      textColor: 'text-red-800',
      borderColor: 'border-red-300',
      dotColor: 'bg-red-500',
    },
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs gap-1',
    md: 'px-3 py-1 text-sm gap-1.5',
    lg: 'px-4 py-1.5 text-base gap-2',
  };

  const dotSizes = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-2.5 h-2.5',
  };

  const config = statusConfig[status];

  return (
    <span
      className={`
        inline-flex items-center
        font-medium
        rounded-full
        border
        ${config.bgColor}
        ${config.textColor}
        ${config.borderColor}
        ${sizes[size]}
        ${className}
      `}
    >
      <span
        className={`
          ${dotSizes[size]}
          rounded-full
          ${config.dotColor}
          ${animated && (status === 'pending' || status === 'in-progress') ? 'animate-pulse' : ''}
        `}
      />
      {config.label}
    </span>
  );
};
