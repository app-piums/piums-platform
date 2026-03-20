import React from 'react';

// ============================================================================
// @piums/ui — Badge component
// ============================================================================

type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info';
type BadgeSize = 'sm' | 'md';

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  default:  'bg-gray-100 text-gray-700',
  primary:  'bg-indigo-100 text-indigo-700',
  success:  'bg-green-100 text-green-700',
  warning:  'bg-yellow-100 text-yellow-700',
  error:    'bg-red-100 text-red-700',
  info:     'bg-blue-100 text-blue-700',
};

const SIZE_CLASSES: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-xs',
};

export interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  className?: string;
}

const DOT_VARIANT: Record<BadgeVariant, string> = {
  default:  'bg-gray-400',
  primary:  'bg-indigo-500',
  success:  'bg-green-500',
  warning:  'bg-yellow-500',
  error:    'bg-red-500',
  info:     'bg-blue-500',
};

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  dot = false,
  className = '',
}) => {
  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 rounded-full font-medium',
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        className,
      ].join(' ')}
    >
      {dot && <span className={`h-1.5 w-1.5 rounded-full ${DOT_VARIANT[variant]}`} />}
      {children}
    </span>
  );
};

// Booking status badge helper
export function bookingStatusBadge(status: string): BadgeVariant {
  const map: Record<string, BadgeVariant> = {
    PENDING: 'warning',
    CONFIRMED: 'primary',
    IN_PROGRESS: 'info',
    COMPLETED: 'success',
    CANCELLED_BY_CLIENT: 'error',
    CANCELLED_BY_ARTIST: 'error',
    DISPUTED: 'error',
    REFUNDED: 'default',
  };
  return map[status] ?? 'default';
}
