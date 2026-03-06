export const logger = {
  info: (message: string, context?: string, data?: any) => {
    console.log(`[INFO] ${context ? `[${context}]` : ''} ${message}`, data || '');
  },
  error: (message: string, context?: string, error?: any) => {
    console.error(`[ERROR] ${context ? `[${context}]` : ''} ${message}`, error || '');
  },
  warn: (message: string, context?: string, data?: any) => {
    console.warn(`[WARN] ${context ? `[${context}]` : ''} ${message}`, data || '');
  },
  debug: (message: string, context?: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[DEBUG] ${context ? `[${context}]` : ''} ${message}`, data || '');
    }
  },
};
