'use client';

import { NextStep } from 'nextstepjs';
import { clientTours } from '../lib/tours';

export function NextStepWrapper({ children }: { children: React.ReactNode }) {
  return (
    <NextStep steps={clientTours} shadowRgb="0, 0, 0" shadowOpacity="0.4">
      {children}
    </NextStep>
  );
}
