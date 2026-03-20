'use client';

import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  iconBgColor: string;
  helperText?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, iconBgColor, helperText, trend }) => {
  return (
    <div className="bg-white p-4 sm:p-6 rounded-2xl border border-gray-100 hover:shadow-lg transition-all duration-200">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl ${iconBgColor} flex items-center justify-center`}>
          {icon}
        </div>
        {trend && (
          <div className={`flex items-center gap-1 px-2.5 py-1 rounded-lg ${
            trend.isPositive ? 'bg-green-50' : 'bg-red-50'
          }`}>
            <svg className={`w-3 h-3 ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d={trend.isPositive ? "M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" : "M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z"} clipRule="evenodd" />
            </svg>
            <span className={`text-sm font-semibold ${
              trend.isPositive ? 'text-green-600' : 'text-red-600'
            }`}>
              {trend.isPositive ? '+' : ''}{trend.value}%
            </span>
          </div>
        )}
      </div>
      
      <h3 className="text-xs sm:text-sm font-medium text-gray-500 mb-1">{title}</h3>
      <p className="text-xl sm:text-3xl font-bold text-gray-900">{value}</p>
      {helperText && <p className="text-xs text-gray-500 mt-1">{helperText}</p>}
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
  profileViews?: number;
  earningsGrowth?: number;
  profileViewsGrowth?: number;
}

export const StatsCards: React.FC<StatsCardsProps> = ({
  bookingsThisMonth,
  totalRevenue,
  averageRating,
  totalReviews,
  pendingBookings,
  confirmedBookings,
  profileViews,
  earningsGrowth,
  profileViewsGrowth,
}) => {
  // Calcular valores con fallbacks
  const displayProfileViews = profileViews || (bookingsThisMonth * 45);
  const pendingPayouts = Math.round(totalRevenue * 0.15);
  const ratingDisplay = Number.isFinite(averageRating) ? `${averageRating.toFixed(1)}/5` : 'N/D';
  const reviewsHelper = totalReviews > 0 ? `${totalReviews} reseñas recibidas` : 'Sin reseñas aún';
  const bookingsHelper = `${pendingBookings} pendientes · ${confirmedBookings} confirmadas`;
  const monthlyHelper = `${bookingsThisMonth} este mes`;
  
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-6 mb-6 sm:mb-8">
      <StatCard
        title="Ingresos Totales"
        value={`Q${totalRevenue.toLocaleString('es-GT')}`}
        iconBgColor="bg-green-50"
        icon={
          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        }
        trend={earningsGrowth ? { value: earningsGrowth, isPositive: earningsGrowth > 0 } : undefined}
      />
      
      <StatCard
        title="Pagos Pendientes"
        value={`Q${pendingPayouts.toLocaleString('es-GT')}`}
        iconBgColor="bg-orange-50"
        icon={
          <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        }
      />
      
      <StatCard
        title="Vistas del Perfil"
        value={displayProfileViews >= 1000 ? `${(displayProfileViews / 1000).toFixed(1)}k` : displayProfileViews.toLocaleString()}
        iconBgColor="bg-blue-50"
        icon={
          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        }
        trend={profileViewsGrowth ? { value: profileViewsGrowth, isPositive: profileViewsGrowth > 0 } : undefined}
        helperText="Últimos 30 días"
      />

      <StatCard
        title="Reservas del Mes"
        value={bookingsThisMonth}
        helperText={monthlyHelper}
        iconBgColor="bg-purple-50"
        icon={
          <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        }
      />

      <StatCard
        title="Calificación Promedio"
        value={ratingDisplay}
        helperText={reviewsHelper}
        iconBgColor="bg-yellow-50"
        icon={
          <svg className="w-6 h-6 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        }
      />

      <StatCard
        title="Estado de Reservas"
        value={`${confirmedBookings + pendingBookings}`}
        helperText={bookingsHelper}
        iconBgColor="bg-teal-50"
        icon={
          <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        }
      />
    </div>
  );
};
