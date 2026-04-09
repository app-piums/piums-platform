'use client';

import React from 'react';
import { Badge } from '../ui/Badge';

interface BookingEvent {
  id: string;
  title: string;
  date: string;
  time?: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  artist?: string;
  client?: string;
  amount?: number;
}

interface BookingTimelineProps {
  events: BookingEvent[];
  className?: string;
  maxItems?: number;
}

export const BookingTimeline: React.FC<BookingTimelineProps> = ({
  events,
  className = '',
  maxItems = 5,
}) => {
  const statusConfig: Record<BookingEvent['status'], { badge: 'warning' | 'info' | 'success' | 'danger'; label: string; color: string }> = {
    pending: {
      badge: 'warning',
      label: 'Pendiente',
      color: 'bg-yellow-500',
    },
    confirmed: {
      badge: 'info',
      label: 'Confirmada',
      color: 'bg-[#00AEEF]',
    },
    completed: {
      badge: 'success',
      label: 'Completada',
      color: 'bg-green-500',
    },
    cancelled: {
      badge: 'danger',
      label: 'Cancelada',
      color: 'bg-red-500',
    },
  };

  const displayedEvents = events.slice(0, maxItems);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Hoy';
    }
    if (date.toDateString() === tomorrow.toDateString()) {
      return 'Mañana';
    }
    
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
    });
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 shadow-sm p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Próximas Reservas</h3>
        <span className="text-sm text-gray-500">{events.length} total</span>
      </div>

      <div className="space-y-4">
        {displayedEvents.map((event, index) => {
          const config = statusConfig[event.status];
          
          return (
            <div key={event.id} className="flex gap-4 group hover:bg-gray-50 p-3 rounded-lg transition-colors cursor-pointer">
              {/* Timeline indicator */}
              <div className="flex flex-col items-center">
                <div className={`w-3 h-3 rounded-full ${config.color} ring-4 ring-white flex-shrink-0`} />
                {index < displayedEvents.length - 1 && (
                  <div className="w-0.5 h-full bg-gray-200 mt-1" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h4 className="font-medium text-gray-900 truncate">{event.title}</h4>
                  <Badge variant={config.badge} size="sm">
                    {config.label}
                  </Badge>
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-600 mb-1">
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>{formatDate(event.date)}</span>
                  </div>
                  
                  {event.time && (
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{event.time}</span>
                    </div>
                  )}
                </div>

                {(event.artist || event.client) && (
                  <p className="text-sm text-gray-500">
                    {event.artist && `Artista: ${event.artist}`}
                    {event.client && `Cliente: ${event.client}`}
                  </p>
                )}

                {event.amount && (
                  <p className="text-sm font-semibold text-green-600 mt-1">
                    ${event.amount.toLocaleString('en-US')}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {events.length === 0 && (
        <div className="text-center py-8">
          <svg className="w-16 h-16 mx-auto text-gray-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-gray-500">No hay reservas programadas</p>
        </div>
      )}

      {events.length > maxItems && (
        <div className="mt-4 text-center">
          <button className="text-sm text-[#FF6A00] hover:text-[#E65F00] font-medium">
            Ver todas las reservas ({events.length})
          </button>
        </div>
      )}
    </div>
  );
};
