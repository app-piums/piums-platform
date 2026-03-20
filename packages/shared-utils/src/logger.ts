// ============================================================================
// @piums/shared-utils — Logger
// ============================================================================

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: string;
  data?: unknown;
}

const LEVELS: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 };

const EMOJI: Record<LogLevel, string> = {
  debug: '🔍',
  info: 'ℹ️ ',
  warn: '⚠️ ',
  error: '❌',
};

class Logger {
  private readonly minLevel: number;

  constructor() {
    const env = (process.env['LOG_LEVEL'] as LogLevel) || 'info';
    this.minLevel = LEVELS[env] ?? LEVELS.info;
  }

  private formatLog(entry: LogEntry): string {
    if (process.env['NODE_ENV'] === 'production') {
      return JSON.stringify(entry);
    }
    const ctx = entry.context ? ` [${entry.context}]` : '';
    const data = entry.data !== undefined ? ` | ${JSON.stringify(entry.data)}` : '';
    return `${EMOJI[entry.level]} [${entry.timestamp}]${ctx} ${entry.level.toUpperCase()}: ${entry.message}${data}`;
  }

  private log(level: LogLevel, message: string, context?: string, data?: unknown): void {
    if (LEVELS[level] < this.minLevel) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      data,
    };

    const formatted = this.formatLog(entry);

    if (level === 'error') {
      console.error(formatted);
    } else if (level === 'warn') {
      console.warn(formatted);
    } else {
      console.log(formatted);
    }
  }

  debug(message: string, context?: string, data?: unknown): void {
    this.log('debug', message, context, data);
  }

  info(message: string, context?: string, data?: unknown): void {
    this.log('info', message, context, data);
  }

  warn(message: string, context?: string, data?: unknown): void {
    this.log('warn', message, context, data);
  }

  error(message: string, context?: string, data?: unknown): void {
    this.log('error', message, context, data);
  }
}

export const logger = new Logger();
