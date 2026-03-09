'use client';

import React, { useState } from 'react';

export interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  count?: number;
  disabled?: boolean;
}

interface TabsProps {
  tabs: Tab[];
  defaultTab?: string;
  onChange?: (tabId: string) => void;
  variant?: 'line' | 'pills' | 'enclosed';
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  defaultTab,
  onChange,
  variant = 'line',
  className = '',
}) => {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);

  const handleTabChange = (tabId: string) => {
    if (tabs.find(t => t.id === tabId && !t.disabled)) {
      setActiveTab(tabId);
      onChange?.(tabId);
    }
  };

  const variants = {
    line: {
      container: 'border-b border-gray-200',
      tab: 'border-b-2 px-4 py-2',
      active: 'border-blue-600 text-blue-600',
      inactive: 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300',
    },
    pills: {
      container: 'bg-gray-100 p-1 rounded-lg inline-flex',
      tab: 'px-4 py-2 rounded-md',
      active: 'bg-white text-blue-600 shadow-sm',
      inactive: 'text-gray-600 hover:text-gray-900',
    },
    enclosed: {
      container: 'border-b border-gray-200',
      tab: 'border border-gray-200 border-b-0 px-4 py-2 rounded-t-lg',
      active: 'bg-white text-blue-600 border-blue-600',
      inactive: 'bg-gray-50 text-gray-600 hover:bg-gray-100',
    },
  };

  const style = variants[variant];

  return (
    <div className={className}>
      <div className={`flex ${style.container}`}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            disabled={tab.disabled}
            className={`
              ${style.tab}
              ${activeTab === tab.id ? style.active : style.inactive}
              ${tab.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              transition-all duration-200
              flex items-center gap-2
              font-medium text-sm
            `}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={`
                  px-2 py-0.5 rounded-full text-xs font-semibold
                  ${activeTab === tab.id ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 text-gray-600'}
                `}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

interface TabPanelProps {
  id: string;
  activeTab: string;
  children: React.ReactNode;
  className?: string;
}

export const TabPanel: React.FC<TabPanelProps> = ({ id, activeTab, children, className = '' }) => {
  if (id !== activeTab) return null;

  return (
    <div className={`py-4 ${className}`} role="tabpanel">
      {children}
    </div>
  );
};
