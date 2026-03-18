import React from 'react';

// ============================================================================
// @piums/ui — Textarea component
// ============================================================================

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  showCount?: boolean;
  maxLength?: number;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, showCount, maxLength, className = '', id, value, ...props }, ref) => {
    const areaId = id ?? (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
    const currentLength = typeof value === 'string' ? value.length : 0;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={areaId} className="mb-1 block text-sm font-medium text-gray-700">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={areaId}
          maxLength={maxLength}
          value={value}
          className={[
            'w-full rounded-lg border bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400',
            'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent',
            'disabled:cursor-not-allowed disabled:bg-gray-50',
            'resize-y min-h-[80px]',
            error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300',
            className,
          ].join(' ')}
          aria-invalid={error ? 'true' : undefined}
          {...props}
        />
        <div className="mt-1 flex justify-between">
          <div>
            {error && <p className="text-xs text-red-600" role="alert">{error}</p>}
            {hint && !error && <p className="text-xs text-gray-500">{hint}</p>}
          </div>
          {showCount && maxLength && (
            <p className={`text-xs ${currentLength >= maxLength ? 'text-red-500' : 'text-gray-400'}`}>
              {currentLength}/{maxLength}
            </p>
          )}
        </div>
      </div>
    );
  },
);

Textarea.displayName = 'Textarea';
