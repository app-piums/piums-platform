'use client';

import React, { useState } from 'react';
import { Calendar } from '../ui/Calendar';

interface TimeSlot {
  time: string;
  available: boolean;
  price?: number;
}

interface Availability {
  date: string;
  slots: TimeSlot[];
}

interface CalendarPickerProps {
  availability: Availability[];
  selectedDate?: Date;
  selectedTime?: string;
  onDateSelect: (date: Date) => void;
  onTimeSelect: (time: string) => void;
  minDate?: Date;
  className?: string;
}

export const CalendarPicker: React.FC<CalendarPickerProps> = ({
  availability,
  selectedDate,
  selectedTime,
  onDateSelect,
  onTimeSelect,
  minDate = new Date(),
  className = '',
}) => {
  // Get available dates
  const availableDates = availability.map(a => new Date(a.date));
  
  // Get disabled dates (dates before today)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Get time slots for selected date
  const getTimeSlots = (): TimeSlot[] => {
    if (!selectedDate) return [];
    
    const dateStr = selectedDate.toISOString().split('T')[0];
    const dateAvailability = availability.find(a => a.date === dateStr);
    
    return dateAvailability?.slots || [];
  };

  const timeSlots = getTimeSlots();

  return (
    <div className={`grid lg:grid-cols-2 gap-6 ${className}`}>
      {/* Calendar */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-4">Selecciona una fecha</h3>
        <Calendar
          selectedDate={selectedDate}
          onDateSelect={onDateSelect}
          highlightedDates={availableDates}
          minDate={minDate}
        />
      </div>

      {/* Time slots */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-4">
          {selectedDate ? 'Selecciona un horario' : 'Primero selecciona una fecha'}
        </h3>
        
        {!selectedDate ? (
          <div className="bg-gray-50 rounded-lg border border-gray-200 p-8 text-center">
            <svg
              className="w-16 h-16 mx-auto text-gray-300 mb-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p className="text-gray-500">
              Selecciona una fecha en el calendario para ver los horarios disponibles
            </p>
          </div>
        ) : timeSlots.length === 0 ? (
          <div className="bg-yellow-50 rounded-lg border border-yellow-200 p-8 text-center">
            <svg
              className="w-16 h-16 mx-auto text-yellow-400 mb-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <p className="text-yellow-800 font-medium mb-1">No hay horarios disponibles</p>
            <p className="text-yellow-600 text-sm">
              Para esta fecha. Por favor, selecciona otra fecha.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 p-4 max-h-96 overflow-y-auto">
            <div className="grid grid-cols-2 gap-2">
              {timeSlots.map((slot) => (
                <button
                  key={slot.time}
                  onClick={() => slot.available && onTimeSelect(slot.time)}
                  disabled={!slot.available}
                  className={`
                    p-3 rounded-lg border-2 transition-all duration-200
                    ${
                      selectedTime === slot.time
                        ? 'border-blue-600 bg-blue-50 text-blue-900'
                        : slot.available
                        ? 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                        : 'border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed'
                    }
                  `}
                >
                  <div className="font-semibold">{slot.time}</div>
                  {slot.price && slot.available && (
                    <div className="text-xs text-gray-600 mt-1">
                      Q{slot.price.toLocaleString('es-GT')}
                    </div>
                  )}
                  {!slot.available && (
                    <div className="text-xs text-gray-400 mt-1">No disponible</div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Selected summary */}
        {selectedDate && selectedTime && (
          <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-green-600 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div>
                <p className="font-medium text-green-900">Horario seleccionado</p>
                <p className="text-sm text-green-700 mt-1">
                  {selectedDate.toLocaleDateString('es-ES', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}{' '}
                  a las {selectedTime}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
