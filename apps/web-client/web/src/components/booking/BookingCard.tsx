'use client';

import React from 'react';
import { StatusBadge } from './StatusBadge';
import { Button } from '../ui/Button';
import { Avatar } from '../ui/Avatar';

interface Artist {
  name: string;
  avatar?: string;
  rating?: number;
}

interface BookingAction {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'outline' | 'ghost' | 'secondary' | 'danger';
}

export interface BookingCardProps {
  id: string;
  code?: string;
  status: 'pending' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled' | 'rejected';
  artist: Artist;
  date: string;
  time?: string;
  location?: string;
  duration?: string;
  amount: number;
  currency?: string;
  actions?: BookingAction[];
  className?: string;
}

export const BookingCard: React.FC<BookingCardProps> = ({
  id: _bookingId,
  code,
  status,
  artist,
  date,
  time,
  location,
  duration,
  amount,
  currency = 'USD',
  actions = [],
  className = '',
}) => {
  const statusConfig = {
    pending: {
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
    },
    confirmed: {
      bgColor: 'bg-[#F59E0B]/5',
      borderColor: 'border-[#F59E0B]/20',
    },
    'in-progress': {
      bgColor: 'bg-[#FF6B35]/5',
      borderColor: 'border-[#FF6B35]/20',
    },
    completed: {
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
    },
    cancelled: {
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
    },
    rejected: {
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200',
    },
  };

  const config = statusConfig[status];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div
      data-booking-id={_bookingId}
      className={`
        bg-white
        border-2 ${config.borderColor}
        rounded-xl
        shadow-sm
        hover:shadow-md
        transition-all duration-200
        overflow-hidden
        ${className}
      `}
    >
      {/* Header con estado */}
      <div className={`${config.bgColor} px-6 py-3 border-b ${config.borderColor}`}>
        <div className="flex items-center justify-between">
          <StatusBadge status={status} size="md" />
          {code && <span className="text-sm font-medium text-gray-600">#{code}</span>}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Artist info */}
        <div className="flex items-start gap-4 mb-4">
          <Avatar
            src={artist.avatar}
            fallback={artist.name.charAt(0)}
            size="lg"
          />

          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 text-lg mb-1">
              {artist.name}
            </h3>
            {artist.rating && (
              <div className="flex items-center gap-1">
                <svg className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span className="text-sm text-gray-600">{artist.rating.toFixed(1)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Details grid */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-start gap-2">
            <svg className="w-5 h-5 text-gray-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <div>
              <p className="text-xs text-gray-500 uppercase">Fecha</p>
              <p className="font-medium text-gray-900 capitalize">{formatDate(date)}</p>
            </div>
          </div>

          {time && (
            <div className="flex items-start gap-2">
              <svg className="w-5 h-5 text-gray-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-xs text-gray-500 uppercase">Hora</p>
                <p className="font-medium text-gray-900">{time}</p>
              </div>
            </div>
          )}

          {location && (
            <div className="flex items-start gap-2">
              <svg className="w-5 h-5 text-gray-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <div>
                <p className="text-xs text-gray-500 uppercase">Ubicación</p>
                <p className="font-medium text-gray-900">{location}</p>
              </div>
            </div>
          )}

          {duration && (
            <div className="flex items-start gap-2">
              <svg className="w-5 h-5 text-gray-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <div>
                <p className="text-xs text-gray-500 uppercase">Duración</p>
                <p className="font-medium text-gray-900">{duration}</p>
              </div>
            </div>
          )}
        </div>

        {/* Amount */}
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">Total</span>
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900">
                ${amount.toLocaleString('en-US')}
              </p>
              <p className="text-xs text-gray-500">{currency}</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        {actions.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {actions.map((action, idx) => (
              <Button
                key={idx}
                onClick={action.onClick}
                variant={action.variant || 'outline'}
                size="sm"
                className="flex-1 min-w-[120px]"
              >
                {action.label}
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
