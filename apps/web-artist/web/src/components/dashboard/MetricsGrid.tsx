'use client';

import React from 'react';
import { MetricCard } from '../ui/MetricCard';

interface Metric {
  id: string;
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
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
  onClick?: ()=> void;
}

interface MetricsGridProps {
  metrics: Metric[];
  columns?: 2 | 3 | 4;
  className?: string;
}

export const MetricsGrid: React.FC<MetricsGridProps> = ({
  metrics,
  columns = 4,
  className = '',
}) => {
  const gridCols = {
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <div className={`grid ${gridCols[columns]} gap-6 ${className}`}>
      {metrics.map((metric) => (
        <MetricCard
          key={metric.id}
          title={metric.title}
          value={metric.value}
          subtitle={metric.subtitle}
          icon={metric.icon}
          trend={metric.trend}
          progress={metric.progress}
          variant={metric.variant}
          onClick={metric.onClick}
        />
      ))}
    </div>
  );
};
