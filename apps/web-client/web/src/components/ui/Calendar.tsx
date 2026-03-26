'use client';

import React, { useState } from 'react';

interface CalendarProps {
  selectedDate?: Date;
  rangeEndDate?: Date;
  onDateSelect?: (date: Date) => void;
  disabledDates?: Date[];
  highlightedDates?: Date[];
  minDate?: Date;
  maxDate?: Date;
  className?: string;
}

export const Calendar: React.FC<CalendarProps> = ({
  selectedDate,
  rangeEndDate,
  onDateSelect,
  disabledDates = [],
  highlightedDates = [],
  minDate,
  maxDate,
  className = '',
}) => {
  const [currentMonth, setCurrentMonth] = useState(selectedDate || new Date());

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (Date | null)[] = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const isSameDay = (date1: Date | null, date2: Date | null) => {
    if (!date1 || !date2) return false;
    return (
      date1.getDate() === date2.getDate() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getFullYear() === date2.getFullYear()
    );
  };

  const isDateDisabled = (date: Date | null) => {
    if (!date) return true;
    
    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;
    
    return disabledDates.some(disabledDate => isSameDay(date, disabledDate));
  };

  const isDateHighlighted = (date: Date | null) => {
    if (!date) return false;
    return highlightedDates.some(highlightedDate => isSameDay(date, highlightedDate));
  };

  const isInRange = (date: Date | null): boolean => {
    if (!date || !selectedDate || !rangeEndDate) return false;
    const d = date.getTime();
    const start = new Date(selectedDate); start.setHours(0,0,0,0);
    const end = new Date(rangeEndDate); end.setHours(23,59,59,999);
    return d > start.getTime() && d < end.getTime();
  };

  const isRangeEnd = (date: Date | null): boolean => {
    if (!rangeEndDate) return false;
    return isSameDay(date, rangeEndDate);
  };

  const handlePreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const handleDateClick = (date: Date | null) => {
    if (date && !isDateDisabled(date)) {
      onDateSelect?.(date);
    }
  };

  const days = getDaysInMonth(currentMonth);

  return (
    <div className={`bg-white rounded-lg border border-gray-200 shadow-sm p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={handlePreviousMonth}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Mes anterior"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <h3 className="font-semibold text-gray-900">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h3>

        <button
          onClick={handleNextMonth}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Mes siguiente"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Day names */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {dayNames.map((day) => (
          <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Days */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((date, index) => {
          const isSelected = isSameDay(date, selectedDate || null);
          const isEnd = isRangeEnd(date);
          const inRange = isInRange(date);
          const isDisabled = isDateDisabled(date);
          const isHighlighted = isDateHighlighted(date);
          const isToday = isSameDay(date, new Date());
          const hasRange = !!rangeEndDate;

          return (
            <button
              key={index}
              onClick={() => handleDateClick(date)}
              disabled={isDisabled}
              className={`
                aspect-square p-2 text-sm font-medium
                transition-all duration-200
                ${!date ? 'invisible' : ''}
                ${isSelected && hasRange ? 'bg-[#FF6A00] text-white rounded-l-lg rounded-r-none' : ''}
                ${isSelected && !hasRange ? 'bg-blue-600 text-white rounded-lg hover:bg-blue-700' : ''}
                ${isEnd ? 'bg-[#FF6A00] text-white rounded-r-lg rounded-l-none' : ''}
                ${inRange ? 'bg-orange-100 text-orange-900 rounded-none' : ''}
                ${!isSelected && !isEnd && !inRange && !isDisabled && !isToday ? 'hover:bg-gray-100 text-gray-900 rounded-lg' : ''}
                ${isDisabled ? 'text-gray-300 cursor-not-allowed rounded-lg' : 'cursor-pointer'}
                ${isToday && !isSelected && !isEnd && !inRange ? 'ring-2 ring-blue-600 ring-inset text-blue-600 rounded-lg' : ''}
                ${isHighlighted && !isSelected && !isEnd && !inRange ? 'bg-purple-100 text-purple-900 rounded-lg' : ''}
              `}
            >
              {date?.getDate()}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4 text-xs text-gray-600">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-blue-600"></div>
          <span>Seleccionado</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded border-2 border-blue-600"></div>
          <span>Hoy</span>
        </div>
        {highlightedDates.length > 0 && (
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-purple-100"></div>
            <span>Disponible</span>
          </div>
        )}
      </div>
    </div>
  );
};
