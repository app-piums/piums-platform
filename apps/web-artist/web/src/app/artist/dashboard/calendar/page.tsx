'use client';

import React, { useState } from 'react';
import { DashboardSidebar } from '@/components/artist/DashboardSidebar';

export default function ArtistCalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
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
      
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Calendario</h1>
            <p className="text-gray-600">Administra tu disponibilidad y bloquea fechas</p>
          </div>

          {/* Calendar */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            {/* Month Navigation */}
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={handlePrevMonth}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                ← Anterior
              </button>
              
              <h2 className="text-xl font-bold text-gray-900 capitalize">{monthName}</h2>
              
              <button
                onClick={handleNextMonth}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Siguiente →
              </button>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2">
              {/* Day Headers */}
              {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((day) => (
                <div key={day} className="text-center font-medium text-gray-600 py-2">
                  {day}
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
            <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {selectedDate.toLocaleDateString('es-MX', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </h3>

              <div className="flex gap-4">
                <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                  🚫 Bloquear día
                </button>
                <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                  ✓ Marcar disponible
                </button>
                <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                  ⏰ Configurar horarios
                </button>
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
