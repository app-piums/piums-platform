'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { sdk } from '@piums/sdk';
import type { CalendarData } from '@piums/sdk';
import { Loading } from './Loading';

interface DatePickerProps {
  artistId: string;
  selectedDate?: Date;
  onDateSelect: (date: Date) => void;
  minDate?: Date;
  maxDate?: Date;
}

export function DatePicker({ artistId, selectedDate, onDateSelect, minDate, maxDate }: DatePickerProps) {
  const [currentMonth, setCurrentMonth] = useState(selectedDate || new Date());
  const [calendarData, setCalendarData] = useState<CalendarData | null>(null);
  const [loading, setLoading] = useState(false);

  // Cargar datos del calendario cuando cambia el mes
  const loadCalendarData = useCallback(async () => {
    try {
      setLoading(true);
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth() + 1; // getMonth() retorna 0-11

      const data = await sdk.getCalendar(artistId, year, month);
      setCalendarData(data);
    } catch (error) {
      console.error('Error loading calendar:', error);
    } finally {
      setLoading(false);
    }
  }, [artistId, currentMonth]);

  useEffect(() => {
    void loadCalendarData();
  }, [loadCalendarData]);

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const isDateOccupied = (date: Date): boolean => {
    if (!calendarData) return false;
    const dateStr = date.toISOString().split('T')[0];
    return calendarData.occupiedDates.includes(dateStr);
  };

  const isDateBlocked = (date: Date): boolean => {
    if (!calendarData) return false;
    const dateStr = date.toISOString().split('T')[0];
    return calendarData.blockedDates.includes(dateStr);
  };

  const isDateDisabled = (date: Date): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Fecha en el pasado
    if (date < today) return true;
    
    // Fecha antes del minDate
    if (minDate && date < minDate) return true;
    
    // Fecha después del maxDate
    if (maxDate && date > maxDate) return true;
    
    // Fecha ocupada o bloqueada
    if (isDateOccupied(date) || isDateBlocked(date)) return true;
    
    return false;
  };

  const isDateSelected = (date: Date): boolean => {
    if (!selectedDate) return false;
    return (
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
    );
  };

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const handleDateClick = (date: Date) => {
    if (!isDateDisabled(date)) {
      onDateSelect(date);
    }
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDayOfMonth = getFirstDayOfMonth(currentMonth);
    const days = [];

    // Días del mes anterior (espacios vacíos)
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="aspect-square" />);
    }

    // Días del mes actual
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      const disabled = isDateDisabled(date);
      const selected = isDateSelected(date);
      const occupied = isDateOccupied(date);
      const blocked = isDateBlocked(date);
      const isToday = new Date().toDateString() === date.toDateString();

      days.push(
        <button
          key={day}
          type="button"
          onClick={() => handleDateClick(date)}
          disabled={disabled}
          className={`
            aspect-square flex items-center justify-center rounded-lg text-sm font-medium transition-colors relative
            ${selected ? 'bg-blue-600 text-white hover:bg-blue-700' : ''}
            ${!selected && !disabled ? 'hover:bg-gray-100 text-gray-900' : ''}
            ${disabled && !occupied && !blocked ? 'text-gray-300 cursor-not-allowed' : ''}
            ${occupied && !selected ? 'bg-red-50 text-red-400 cursor-not-allowed line-through' : ''}
            ${blocked && !selected ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : ''}
            ${isToday && !selected ? 'ring-2 ring-blue-600 ring-offset-2' : ''}
          `}
        >
          {day}
          {occupied && !selected && (
            <span className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-red-500 rounded-full" />
          )}
          {blocked && !selected && (
            <span className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-gray-400 rounded-full" />
          )}
        </button>
      );
    }

    return days;
  };

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      {/* Header con navegación */}
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={handlePrevMonth}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Mes anterior"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <h3 className="text-lg font-semibold text-gray-900">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h3>

        <button
          type="button"
          onClick={handleNextMonth}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Mes siguiente"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Nombres de días */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {dayNames.map((day) => (
          <div key={day} className="aspect-square flex items-center justify-center text-xs font-medium text-gray-500">
            {day}
          </div>
        ))}
      </div>

      {/* Días del mes */}
      {loading ? (
        <div className="flex justify-center py-8">
          <Loading size="sm" />
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-1">
          {renderCalendar()}
        </div>
      )}

      {/* Leyenda */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex flex-wrap gap-3 text-xs text-gray-600">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 rounded-full ring-2 ring-blue-600" />
            <span>Hoy</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 rounded bg-red-50 border border-red-200" />
            <span>Ocupado</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 rounded bg-gray-100 border border-gray-200" />
            <span>No disponible</span>
          </div>
        </div>
      </div>
    </div>
  );
}
