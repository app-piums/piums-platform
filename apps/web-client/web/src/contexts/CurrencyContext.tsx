'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

export type DisplayCurrency = 'GTQ' | 'USD';

// Reference exchange rate (April 2026). Replace with a live API in production.
const GTQ_TO_USD = 7.75;

interface CurrencyContextValue {
  currency: DisplayCurrency;
  setCurrency: (c: DisplayCurrency) => void;
  /** Format a GTQ amount (full units, not cents) for display in the selected currency */
  formatPrice: (amountGTQ: number) => string;
}

const CurrencyContext = createContext<CurrencyContextValue>({
  currency: 'GTQ',
  setCurrency: () => {},
  formatPrice: (a) => `Q${a.toLocaleString('es-GT')}`,
});

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrency] = useState<DisplayCurrency>('GTQ');

  const formatPrice = useCallback(
    (amountGTQ: number) => {
      if (currency === 'USD') {
        const usd = amountGTQ / GTQ_TO_USD;
        return `$${usd.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
      }
      return `Q${Math.round(amountGTQ).toLocaleString('es-GT')}`;
    },
    [currency],
  );

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, formatPrice }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export const useCurrency = () => useContext(CurrencyContext);

/** Small inline toggle — renders a GTQ / USD pill switcher */
export function CurrencyToggle({ className }: { className?: string }) {
  const { currency, setCurrency } = useCurrency();
  return (
    <div className={`inline-flex items-center rounded-lg border border-gray-200 overflow-hidden text-xs font-semibold ${className ?? ''}`}>
      {(['GTQ', 'USD'] as const).map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => setCurrency(c)}
          className={`px-3 py-1.5 transition-colors ${
            currency === c
              ? 'bg-[#FF6A00] text-white'
              : 'bg-white text-gray-500 hover:bg-gray-50'
          }`}
        >
          {c}
        </button>
      ))}
    </div>
  );
}
