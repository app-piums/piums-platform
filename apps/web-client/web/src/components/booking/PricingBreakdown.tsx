'use client';

import React from 'react';
import { useCurrency } from '@/contexts/CurrencyContext';

interface PriceItem {
  id: string;
  label: string;
  amount: number;
  description?: string;
  type?: 'base' | 'addon' | 'discount' | 'fee' | 'tax';
}

interface PricingBreakdownProps {
  items: PriceItem[];
  currency?: string;
  showDetails?: boolean;
  className?: string;
}

export const PricingBreakdown: React.FC<PricingBreakdownProps> = ({
  items,
  currency,
  showDetails = true,
  className = '',
}) => {
  const { formatPrice } = useCurrency();
  const formatCurrency = (amount: number) => formatPrice(amount);

  const getTypeIcon = (type?: string) => {
    switch (type) {
      case 'base':
        return (
          <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'addon':
        return (
          <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        );
      case 'discount':
        return (
          <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
        );
      case 'fee':
        return (
          <svg className="w-5 h-5 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        );
      case 'tax':
        return (
          <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        );
      default:
        return null;
    }
  };

  const subtotal = items
    .filter(item => item.type !== 'discount')
    .reduce((sum, item) => sum + item.amount, 0);
    
  const discounts = items
    .filter(item => item.type === 'discount')
    .reduce((sum, item) => sum + Math.abs(item.amount), 0);
    
  const total = subtotal - discounts;

  return (
    <div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}>
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="font-semibold text-gray-900">Desglose de Precio</h3>
      </div>

      <div className="p-6">
        {/* Items */}
        {showDetails && (
          <div className="space-y-3 mb-4">
            {items.map((item) => (
              <div key={item.id} className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-2 flex-1">
                  {getTypeIcon(item.type)}
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{item.label}</p>
                    {item.description && (
                      <p className="text-sm text-gray-500 mt-0.5">{item.description}</p>
                    )}
                  </div>
                </div>
                <span
                  className={`font-semibold ${
                    item.type === 'discount' ? 'text-green-600' : 'text-gray-900'
                  }`}
                >
                  {item.type === 'discount' && '-'}
                  {formatCurrency(Math.abs(item.amount))}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Summary */}
        <div className="space-y-2 pt-4 border-t border-gray-200">
          {discounts > 0 && (
            <>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium text-gray-900">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-green-600">Descuentos</span>
                <span className="font-medium text-green-600">-{formatCurrency(discounts)}</span>
              </div>
            </>
          )}
          
          <div className="flex justify-between items-center pt-2 border-t border-gray-200">
            <span className="text-lg font-semibold text-gray-900">Total</span>
            <span className="text-2xl font-bold text-gray-900">
              {formatCurrency(total)}
            </span>
          </div>
        </div>

        {/* Payment methods hint */}
        <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
          <span>Aceptamos todas las formas de pago</span>
        </div>
      </div>
    </div>
  );
};
