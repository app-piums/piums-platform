import React from 'react';
import { Progress } from './Progress';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    label: string;
    direction: 'up' | 'down' | 'neutral';
  };
  progress?: {
    value: number;
    max: number;
    variant?: 'default' | 'success' | 'warning' | 'danger' | 'primary' | 'accent';
  };
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'primary' | 'accent';
  className?: string;
  onClick?: () => void;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  progress,
  variant = 'default',
  className = '',
  onClick,
}) => {
  const variants = {
    default: {
      bg: 'bg-white',
      iconBg: 'bg-gray-100',
      iconColor: 'text-gray-600',
      border: 'border-gray-200',
    },
    success: {
      bg: 'bg-white',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      border: 'border-green-200',
    },
    warning: {
      bg: 'bg-white',
      iconBg: 'bg-yellow-100',
      iconColor: 'text-yellow-600',
      border: 'border-yellow-200',
    },
    danger: {
      bg: 'bg-white',
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      border: 'border-red-200',
    },
    primary: {
      bg: 'bg-white',
      iconBg: 'bg-[#FF6B35]/10',
      iconColor: 'text-[#FF6B35]',
      border: 'border-[#FF6B35]/20',
    },
    accent: {
      bg: 'bg-white',
      iconBg: 'bg-[#F59E0B]/10',
      iconColor: 'text-[#F59E0B]',
      border: 'border-[#F59E0B]/20',
    },
  };

  const style = variants[variant];

  const getTrendColor = () => {
    if (!trend) return '';
    switch (trend.direction) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getTrendIcon = () => {
    if (!trend) return null;
    switch (trend.direction) {
      case 'up':
        return (
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
            />
          </svg>
        );
      case 'down':
        return (
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 17h8m0 0v-8m0 8l-8-8-4 4-6-6"
            />
          </svg>
        );
      default:
        return (
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 12h14"
            />
          </svg>
        );
    }
  };

  return (
    <div
      className={`
        ${style.bg}
        border ${style.border}
        rounded-lg
        shadow-sm
        p-6
        transition-all duration-200
        ${onClick ? 'cursor-pointer hover:shadow-md hover:scale-105' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mb-2">{value}</p>
          
          {subtitle && (
            <p className="text-sm text-gray-500">{subtitle}</p>
          )}

          {trend && (
            <div className={`flex items-center gap-1 text-sm font-medium mt-2 ${getTrendColor()}`}>
              {getTrendIcon()}
              <span>{trend.value > 0 ? '+' : ''}{trend.value}%</span>
              <span className="text-gray-500 font-normal">{trend.label}</span>
            </div>
          )}

          {progress && (
            <div className="mt-3">
              <Progress
                value={progress.value}
                max={progress.max}
                variant={progress.variant || variant}
                showLabel
                size="md"
              />
            </div>
          )}
        </div>

        {icon && (
          <div className={`${style.iconBg} ${style.iconColor} p-3 rounded-lg`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};
