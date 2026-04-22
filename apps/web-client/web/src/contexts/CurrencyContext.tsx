'use client';

import React, { createContext, useContext, useCallback } from 'react';

/**
 * PIUMS ahora opera exclusivamente en USD. El contexto se mantiene para no
 * romper imports previos, pero siempre formatea en USD.
 */
export type DisplayCurrency = 'USD';

interface CurrencyContextValue {
  currency: DisplayCurrency;
  setCurrency: (c: DisplayCurrency) => void;
  /** Format a USD amount (full units, not cents) for display */
  formatPrice: (amountUSD: number) => string;
}

const formatUSD = (amount: number) =>
  `$${Number(amount).toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;

const CurrencyContext = createContext<CurrencyContextValue>({
  currency: 'USD',
  setCurrency: () => {},
  formatPrice: formatUSD,
});

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const formatPrice = useCallback((amount: number) => formatUSD(amount), []);

  return (
    <CurrencyContext.Provider
      value={{ currency: 'USD', setCurrency: () => {}, formatPrice }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export const useCurrency = () => useContext(CurrencyContext);

/** Stub: se preserva para no romper imports; USD es la única moneda ahora. */
export function CurrencyToggle({ className }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-lg bg-[#FF6A00] px-3 py-1.5 text-xs font-semibold text-white ${className ?? ''}`}
    >
      USD
    </span>
  );
}
