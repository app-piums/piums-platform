'use client';

import React from 'react';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export interface FilterConfig {
  type: 'select' | 'input' | 'range' | 'multiselect';
  name: string;
  label: string;
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
  value?: string | string[] | number[];
  onChange?: (value: string | string[] | number[] | undefined) => void;
}

interface FiltersProps {
  filters: FilterConfig[];
  onApply?: () => void;
  onClear?: () => void;
  showApplyButton?: boolean;
  showClearButton?: boolean;
  layout?: 'horizontal' | 'vertical';
  className?: string;
}

export const Filters: React.FC<FiltersProps> = ({
  filters,
  onApply,
  onClear,
  showApplyButton = true,
  showClearButton = true,
  layout = 'horizontal',
  className = '',
}) => {
  const hasActiveFilters = filters.some(f => {
    if (Array.isArray(f.value)) return f.value.length > 0;
    return f.value && f.value !== '';
  });

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 ${className}`}>
      <div className={`grid gap-4 ${layout === 'horizontal' ? 'grid-cols-1 md:grid-cols-auto-fit' : 'grid-cols-1'}`}>
        {filters.map((filter) => (
          <div key={filter.name} className="flex flex-col">
            {filter.label && (
              <label className="text-sm font-medium text-gray-700 mb-1">
                {filter.label}
              </label>
            )}
            
            {filter.type === 'select' && (
              <Select
                options={filter.options || []}
                value={filter.value as string}
                onChange={(e) => filter.onChange?.(e.target.value)}
              />
            )}

            {filter.type === 'input' && (
              <Input
                placeholder={filter.placeholder}
                value={filter.value as string}
                onChange={(e) => filter.onChange?.(e.target.value)}
              />
            )}

            {filter.type === 'range' && (
              <div className="flex items-center space-x-2">
                <Input
                  type="number"
                  placeholder="Min"
                  value={(filter.value as number[])?.[0] || ''}
                  onChange={(e) => {
                    const current = (filter.value as number[]) || [0, 0];
                    filter.onChange?.([Number(e.target.value), current[1]]);
                  }}
                  className="w-full"
                />
                <span className="text-gray-500">-</span>
                <Input
                  type="number"
                  placeholder="Max"
                  value={(filter.value as number[])?.[1] || ''}
                  onChange={(e) => {
                    const current = (filter.value as number[]) || [0, 0];
                    filter.onChange?.([current[0], Number(e.target.value)]);
                  }}
                  className="w-full"
                />
              </div>
            )}

            {filter.type === 'multiselect' && (
              <div className="space-y-2">
                {filter.options?.map((option) => (
                  <label key={option.value} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={(filter.value as string[])?.includes(option.value)}
                      onChange={(e) => {
                        const current = (filter.value as string[]) || [];
                        if (e.target.checked) {
                          filter.onChange?.([...current, option.value]);
                        } else {
                          filter.onChange?.(current.filter(v => v !== option.value));
                        }
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{option.label}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        ))}

        {/* Action Buttons */}
        {(showApplyButton || showClearButton) && (
          <div className={`flex items-end space-x-2 ${layout === 'vertical' ? 'mt-2' : ''}`}>
            {showApplyButton && onApply && (
              <Button onClick={onApply} className="flex-1">
                Aplicar
              </Button>
            )}
            {showClearButton && onClear && hasActiveFilters && (
              <Button onClick={onClear} variant="ghost">
                <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Limpiar
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
