'use client';

import React from 'react';
import Link from 'next/link';

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  href?: string;
  onClick?: () => void;
  variant?: 'default' | 'primary' | 'accent' | 'success' | 'warning';
  badge?: string;
}

interface QuickActionsProps {
  actions: QuickAction[];
  columns?: 2 | 3 | 4;
  className?: string;
}

export const QuickActions: React.FC<QuickActionsProps> = ({
  actions,
  columns = 3,
  className = '',
}) => {
  const gridCols = {
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  };

  const variants = {
    default: {
      bg: 'bg-white hover:bg-gray-50',
      iconBg: 'bg-gray-100',
      iconColor: 'text-gray-600',
      border: 'border-gray-200',
    },
    primary: {
      bg: 'bg-[#FF6B35]/5 hover:bg-[#FF6B35]/10',
      iconBg: 'bg-[#FF6B35]/10',
      iconColor: 'text-[#FF6B35]',
      border: 'border-[#FF6B35]/20',
    },
    accent: {
      bg: 'bg-[#F59E0B]/5 hover:bg-[#F59E0B]/10',
      iconBg: 'bg-[#F59E0B]/10',
      iconColor: 'text-[#F59E0B]',
      border: 'border-[#F59E0B]/20',
    },
    success: {
      bg: 'bg-green-50 hover:bg-green-100',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      border: 'border-green-200',
    },
    warning: {
      bg: 'bg-yellow-50 hover:bg-yellow-100',
      iconBg: 'bg-yellow-100',
      iconColor: 'text-yellow-600',
      border: 'border-yellow-200',
    },
  };

  const ActionCard = ({ action }: { action: QuickAction }) => {
    const style = variants[action.variant || 'default'];
    
    const content = (
      <>
        <div className={`${style.iconBg} ${style.iconColor} p-4 rounded-lg mb-4`}>
          {action.icon}
        </div>
        <h3 className="font-semibold text-gray-900 mb-1">{action.title}</h3>
        <p className="text-sm text-gray-600">{action.description}</p>
        {action.badge && (
          <span className="inline-block mt-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
            {action.badge}
          </span>
        )}
      </>
    );

    const className = `
      ${style.bg}
      border ${style.border}
      rounded-lg
      p-6
      transition-all duration-200
      cursor-pointer
      hover:shadow-md
      hover:scale-105
      group
    `;

    if (action.href) {
      return (
        <Link href={action.href} className={className}>
          {content}
        </Link>
      );
    }

    return (
      <button onClick={action.onClick} className={`${className} text-left w-full`}>
        {content}
      </button>
    );
  };

  return (
    <div className={`grid ${gridCols[columns]} gap-6 ${className}`}>
      {actions.map((action) => (
        <ActionCard key={action.id} action={action} />
      ))}
    </div>
  );
};
