'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

const MONTH_NAMES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const MONTH_ABBR = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

interface MonthYearPickerProps {
  month: number; // 0-11
  year: number;
  onSelect: (month: number, year: number) => void;
  className?: string;
  align?: 'left' | 'center';
}

/** Título de mes/año clickeable con popover para saltar a cualquier mes/año. */
export function MonthYearPicker({ month, year, onSelect, className, align = 'left' }: MonthYearPickerProps) {
  const [open, setOpen] = useState(false);
  const [pickerYear, setPickerYear] = useState(year);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onMouseDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const toggle = () => {
    if (!open) setPickerYear(year);
    setOpen(o => !o);
  };

  const pick = (m: number, y: number) => {
    onSelect(m, y);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative inline-block">
      <button
        type="button"
        onClick={toggle}
        className={`flex items-center gap-1 rounded-lg hover:text-[#FF6B35] transition-colors ${className ?? 'font-semibold text-gray-800'}`}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        {MONTH_NAMES[month]} {year}
        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className={`absolute top-full mt-2 z-50 bg-white rounded-xl shadow-lg border border-gray-200 p-3 w-64 ${align === 'center' ? 'left-1/2 -translate-x-1/2' : 'left-0'}`}>
          <div className="flex items-center justify-between mb-2">
            <button
              type="button"
              onClick={() => setPickerYear(y => y - 1)}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
              aria-label="Año anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="font-semibold text-gray-800">{pickerYear}</span>
            <button
              type="button"
              onClick={() => setPickerYear(y => y + 1)}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
              aria-label="Año siguiente"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-1">
            {MONTH_ABBR.map((name, i) => {
              const isCurrent = i === month && pickerYear === year;
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => pick(i, pickerYear)}
                  className={`py-2 rounded-lg text-sm font-medium transition-colors ${
                    isCurrent
                      ? 'bg-[#FF6B35] text-white'
                      : 'text-gray-700 hover:bg-orange-50 hover:text-[#FF6B35]'
                  }`}
                >
                  {name}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => {
              const today = new Date();
              pick(today.getMonth(), today.getFullYear());
            }}
            className="mt-2 w-full py-1.5 rounded-lg text-sm text-[#FF6B35] font-medium hover:bg-orange-50 transition-colors"
          >
            Hoy
          </button>
        </div>
      )}
    </div>
  );
}
