'use client';

import { NextStep } from 'nextstepjs';
import { artistTours } from '../lib/tours';
import { PiumsTourCard } from './PiumsTourCard';

export function NextStepWrapper({ children }: { children: React.ReactNode }) {
  return (
    <NextStep steps={artistTours} shadowRgb="0, 0, 0" shadowOpacity="0.4" cardComponent={PiumsTourCard}>
      {children}
    </NextStep>
  );
}
