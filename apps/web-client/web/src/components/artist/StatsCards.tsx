'use client';

import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

const StatCard: React.FC<StatCardProps> = ({ title, value, subtitle, icon, trend }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="text-3xl">{icon}</div>
        {trend && (
          <span
            className={`text-sm font-medium ${
              trend.isPositive ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
          </span>
        )}
      </div>
      
      <h3 className="text-sm font-medium text-gray-600 mb-2">{title}</h3>
      <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
      {subtitle && <p className="text-sm text-gray-500">{subtitle.replace('reviews', 'reseñas').replace('Esperando respuesta', 'Pendiente de respuesta').replace('Próximas', 'Próximas reservas')}</p>}
    </div>
  );
};

interface StatsCardsProps {
  bookingsThisMonth: number;
  totalRevenue: number;
  averageRating: number;
  totalReviews: number;
  pendingBookings: number;
  confirmedBookings: number;
}

export const StatsCards: React.FC<StatsCardsProps> = ({
  bookingsThisMonth,
  totalRevenue,
  averageRating,
  totalReviews,
  pendingBookings,
  confirmedBookings,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      <StatCard
        title="Reservas este mes"
        value={bookingsThisMonth}
        subtitle={`${pendingBookings} pendientes`}
        icon="📅"
      />
      <StatCard
        title="Ingresos totales"
        value={`$${totalRevenue.toLocaleString()}`}
        subtitle="MXN"
        icon="💰"
      />
      <StatCard
        title="Calificación promedio"
        value={averageRating.toFixed(1)}
        subtitle={`${totalReviews} reseñas`}
        icon="⭐"
      />
      <StatCard
        title="Reservas pendientes"
        value={pendingBookings}
        subtitle="Pendiente de respuesta"
        icon="⏳"
      />
      <StatCard
        title="Reservas confirmadas"
        value={confirmedBookings}
        subtitle="Próximas reservas"
        icon="✅"
      />
      <StatCard
        title="Total de reseñas"
        value={totalReviews}
        subtitle={`${averageRating.toFixed(1)} / 5.0`}
        icon="💬"
      />
    </div>
  );
};
