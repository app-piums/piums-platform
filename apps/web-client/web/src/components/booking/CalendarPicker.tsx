'use client';

import React from 'react';
import { Calendar } from '../ui/Calendar';
import { Loading } from '../Loading';

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
  rangeEndDate?: Date;
  selectedTime?: string;
  onDateSelect: (date: Date) => void;
  onTimeSelect: (time: string) => void;
  onMonthChange?: (year: number, month: number) => void;
  minDate?: Date;
  disabledDates?: Date[];
  isLoading?: boolean;
  isMonthLoading?: boolean;
  className?: string;
}

export const CalendarPicker: React.FC<CalendarPickerProps> = ({
  availability,
  selectedDate,
  rangeEndDate,
  selectedTime,
  onDateSelect,
  onTimeSelect,
  onMonthChange,
  minDate = new Date(),
  disabledDates = [],
  isLoading = false,
  isMonthLoading = false,
  className = '',
}) => {
  // Get available dates
  const availableDates = availability.map(a => new Date(a.date));
  
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
        <div className="relative">
          <Calendar
            selectedDate={selectedDate}
            rangeEndDate={rangeEndDate}
            onDateSelect={onDateSelect}
            onMonthChange={onMonthChange}
            highlightedDates={availableDates}
            disabledDates={disabledDates}
            minDate={minDate}
          />
          {isMonthLoading && (
            <div className="absolute inset-0 bg-white/70 rounded-xl flex items-center justify-center z-10">
              <div className="flex flex-col items-center gap-2">
                <svg className="animate-spin h-6 w-6 text-[#FF6A00]" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span className="text-xs text-gray-500">Cargando fechas...</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Time input */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-4">
          {selectedDate
            ? rangeEndDate
              ? `Hora de inicio · ${selectedDate.toLocaleDateString('es-GT', { day: 'numeric', month: 'short' })} – ${rangeEndDate.toLocaleDateString('es-GT', { day: 'numeric', month: 'short' })}`
              : 'Selecciona una hora'
            : 'Primero selecciona una fecha'}
        </h3>

        {!selectedDate ? (
          <div className="bg-gray-50 rounded-lg border border-gray-200 p-8 text-center">
            <svg className="w-16 h-16 mx-auto text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-gray-500">Selecciona una fecha en el calendario para continuar</p>
          </div>
        ) : isLoading ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <Loading size="sm" />
            <p className="text-sm text-gray-500 mt-3">Cargando...</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <div>
              <label htmlFor="booking-time" className="block text-sm font-medium text-gray-700 mb-1.5">
                ¿A qué hora deseas comenzar?
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <input
                  id="booking-time"
                  type="time"
                  value={selectedTime || ''}
                  onChange={(e) => e.target.value && onTimeSelect(e.target.value)}
                  className="w-full rounded-xl border-2 border-gray-200 bg-gray-50 pl-10 pr-4 py-3 text-base font-semibold text-gray-900 focus:border-[#FF6A00] focus:ring-2 focus:ring-[#FF6A00]/20 focus:bg-white outline-none transition hover:border-gray-300"
                />
              </div>
              <p className="mt-1.5 text-xs text-gray-400">Escribe o usa el selector del navegador para elegir la hora</p>
            </div>

            {/* Quick time suggestions */}
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2">Horarios sugeridos</p>
              <div className="flex flex-wrap gap-2">
                {['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00'].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => onTimeSelect(t)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                      selectedTime === t
                        ? 'border-[#FF6A00] bg-[#FF6A00]/10 text-[#FF6A00]'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-[#FF6A00]/50 hover:text-[#FF6A00]'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
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
