'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { sdk } from '@piums/sdk';
import type { TimeSlotsData, TimeSlot } from '@piums/sdk';
import { Loading } from './Loading';

interface TimeSlotsProps {
  artistId: string;
  selectedDate: Date;
  selectedTime?: string; // HH:mm format
  onTimeSelect: (time: string, slot: TimeSlot) => void;
}

export function TimeSlots({ artistId, selectedDate, selectedTime, onTimeSelect }: TimeSlotsProps) {
  const [timeSlotsData, setTimeSlotsData] = useState<TimeSlotsData | null>(null);
  const [loading, setLoading] = useState(false);

  const loadTimeSlots = useCallback(async () => {
    try {
      setLoading(true);
      const dateStr = selectedDate.toISOString().split('T')[0]; // YYYY-MM-DD
      const data = await sdk.getTimeSlots(artistId, dateStr);
      setTimeSlotsData(data);
    } catch (error) {
      console.error('Error loading time slots:', error);
    } finally {
      setLoading(false);
    }
  }, [artistId, selectedDate]);

  useEffect(() => {
    if (selectedDate) {
      loadTimeSlots();
    }
  }, [loadTimeSlots, selectedDate]);

  const formatDate = (date: Date): string => {
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 
                    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    
    return `${days[date.getDay()]}, ${date.getDate()} de ${months[date.getMonth()]} de ${date.getFullYear()}`;
  };

  const formatTime = (time: string): string => {
    // Convierte "08:00" a "8:00 AM"
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  const getTimeOfDay = (time: string): 'morning' | 'afternoon' | 'evening' => {
    const hour = parseInt(time.split(':')[0]);
    if (hour < 12) return 'morning';
    if (hour < 18) return 'afternoon';
    return 'evening';
  };

  const groupSlotsByTimeOfDay = () => {
    if (!timeSlotsData) return { morning: [], afternoon: [], evening: [] };

    const groups = {
      morning: [] as TimeSlot[],
      afternoon: [] as TimeSlot[],
      evening: [] as TimeSlot[],
    };

    timeSlotsData.slots.forEach((slot) => {
      const timeOfDay = getTimeOfDay(slot.time);
      groups[timeOfDay].push(slot);
    });

    return groups;
  };

  const groups = groupSlotsByTimeOfDay();
  const availableCount = timeSlotsData?.slots.filter(s => s.available).length || 0;

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex justify-center py-8">
          <Loading size="sm" />
        </div>
      </div>
    );
  }

  if (!timeSlotsData || timeSlotsData.slots.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <p className="text-gray-500 text-center">
          No hay slots de tiempo disponibles para esta fecha
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">
          Selecciona una hora
        </h3>
        <p className="text-sm text-gray-600">
          {formatDate(selectedDate)}
        </p>
        <p className="text-sm text-gray-500 mt-1">
          {availableCount} {availableCount === 1 ? 'horario disponible' : 'horarios disponibles'}
        </p>
      </div>

      {/* Slots por período del día */}
      <div className="space-y-6">
        {/* Mañana */}
        {groups.morning.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
              <svg className="w-4 h-4 mr-2 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              Mañana
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {groups.morning.map((slot) => (
                <button
                  key={slot.time}
                  type="button"
                  onClick={() => slot.available && onTimeSelect(slot.time, slot)}
                  disabled={!slot.available}
                  className={`
                    px-4 py-3 rounded-lg text-sm font-medium transition-all
                    ${selectedTime === slot.time ? 'bg-blue-600 text-white ring-2 ring-blue-600 ring-offset-2' : ''}
                    ${selectedTime !== slot.time && slot.available ? 'bg-gray-50 text-gray-900 hover:bg-gray-100 border border-gray-200' : ''}
                    ${!slot.available ? 'bg-gray-50 text-gray-400 cursor-not-allowed opacity-50' : ''}
                  `}
                >
                  {formatTime(slot.time)}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Tarde */}
        {groups.afternoon.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
              <svg className="w-4 h-4 mr-2 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              Tarde
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {groups.afternoon.map((slot) => (
                <button
                  key={slot.time}
                  type="button"
                  onClick={() => slot.available && onTimeSelect(slot.time, slot)}
                  disabled={!slot.available}
                  className={`
                    px-4 py-3 rounded-lg text-sm font-medium transition-all
                    ${selectedTime === slot.time ? 'bg-blue-600 text-white ring-2 ring-blue-600 ring-offset-2' : ''}
                    ${selectedTime !== slot.time && slot.available ? 'bg-gray-50 text-gray-900 hover:bg-gray-100 border border-gray-200' : ''}
                    ${!slot.available ? 'bg-gray-50 text-gray-400 cursor-not-allowed opacity-50' : ''}
                  `}
                >
                  {formatTime(slot.time)}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Noche */}
        {groups.evening.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
              <svg className="w-4 h-4 mr-2 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
              Noche
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {groups.evening.map((slot) => (
                <button
                  key={slot.time}
                  type="button"
                  onClick={() => slot.available && onTimeSelect(slot.time, slot)}
                  disabled={!slot.available}
                  className={`
                    px-4 py-3 rounded-lg text-sm font-medium transition-all
                    ${selectedTime === slot.time ? 'bg-blue-600 text-white ring-2 ring-blue-600 ring-offset-2' : ''}
                    ${selectedTime !== slot.time && slot.available ? 'bg-gray-50 text-gray-900 hover:bg-gray-100 border border-gray-200' : ''}
                    ${!slot.available ? 'bg-gray-50 text-gray-400 cursor-not-allowed opacity-50' : ''}
                  `}
                >
                  {formatTime(slot.time)}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Info adicional */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          Los horarios mostrados son en zona horaria local. 
          Cada slot tiene una duración aproximada de 1 hora.
        </p>
      </div>
    </div>
  );
}
