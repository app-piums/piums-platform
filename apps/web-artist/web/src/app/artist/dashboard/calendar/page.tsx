'use client';

import React, { useState } from 'react';
import { DashboardSidebar } from '@/components/artist/DashboardSidebar';

export default function ArtistCalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const lastDay = new Date(year, month + 1, 0);
    
    const days = [];
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
  };

  const monthName = currentMonth.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });
  const days = getDaysInMonth(currentMonth);

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <DashboardSidebar />
      
      <main className="flex-1 p-4 pt-20 sm:p-6 lg:p-8 lg:pt-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-5">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">Calendario</h1>
            <p className="text-gray-500 text-sm">Administra tu disponibilidad y bloquea fechas</p>
          </div>

          {/* Calendar */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
            {/* Month Navigation */}
            <div className="flex items-center justify-between mb-5">
              <button
                onClick={handlePrevMonth}
                className="p-2 sm:px-4 sm:py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
              >
                <span className="hidden sm:inline">← Anterior</span>
                <span className="sm:hidden">←</span>
              </button>
              
              <h2 className="text-base sm:text-xl font-bold text-gray-900 capitalize">{monthName}</h2>
              
              <button
                onClick={handleNextMonth}
                className="p-2 sm:px-4 sm:py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
              >
                <span className="hidden sm:inline">Siguiente →</span>
                <span className="sm:hidden">→</span>
              </button>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1 sm:gap-2">
              {/* Day Headers */}
              {['D', 'L', 'M', 'X', 'J', 'V', 'S'].map((day, i) => (
                <div key={i} className="text-center font-medium text-gray-500 text-xs py-2">
                  <span className="sm:hidden">{day}</span>
                  <span className="hidden sm:inline">{['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'][i]}</span>
                </div>
              ))}

              {/* Days */}
              {days.map((date) => {
                const isToday = date.toDateString() === new Date().toDateString();
                const isSelected = selectedDate?.toDateString() === date.toDateString();
                
                return (
                  <button
                    key={date.toISOString()}
                    onClick={() => setSelectedDate(date)}
                    className={`
                      aspect-square p-2 rounded-lg text-center transition-colors
                      ${isToday ? 'bg-purple-100 text-purple-700 font-bold' : ''}
                      ${isSelected ? 'bg-purple-700 text-white' : ''}
                      ${!isToday && !isSelected ? 'hover:bg-gray-100 text-gray-900' : ''}
                    `}
                  >
                    {date.getDate()}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Date Actions */}
          {selectedDate && (
            <div className="mt-4 bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 capitalize">
                {selectedDate.toLocaleDateString('es-GT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </h3>
              <div className="flex flex-wrap gap-2">
                <button className="flex-1 min-w-[130px] px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm">🚫 Bloquear día</button>
                <button className="flex-1 min-w-[130px] px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm">✓ Marcar disponible</button>
                <button className="flex-1 min-w-[130px] px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm">⏰ Configurar horarios</button>
              </div>
            </div>
          )}

          {/* Info Box */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="font-semibold text-blue-900 mb-2">💡 Funcionalidad Próximamente</h3>
            <p className="text-blue-800 text-sm">
              Esta es una versión básica del calendario. Próximamente podrás:
            </p>
            <ul className="list-disc list-inside text-blue-800 text-sm mt-2 space-y-1">
              <li>Ver reservas confirmadas en el calendario</li>
              <li>Bloquear y desbloquear fechas específicas</li>
              <li>Configurar horarios de trabajo por día</li>
              <li>Ver disponibilidad en tiempo real</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
