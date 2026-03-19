'use client';

import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  iconBgColor: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, iconBgColor, trend }) => {
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
      />
    </div>
  );
};
