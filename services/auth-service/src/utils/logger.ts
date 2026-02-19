type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: string;
  data?: any;
}

class Logger {
  private level: LogLevel;
  private levels: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
  };

  constructor() {
    this.level = (process.env.LOG_LEVEL as LogLevel) || "info";
  }

  private shouldLog(level: LogLevel): boolean {
    return this.levels[level] >= this.levels[this.level];
  }

  private formatLog(entry: LogEntry): string {
    if (process.env.NODE_ENV === "production") {
      // JSON estructurado para producción
      return JSON.stringify(entry);
    }
    // Formato legible para desarrollo
    const emoji = {
      debug: "🔍",
      info: "ℹ️ ",
      warn: "⚠️ ",
      error: "❌",
    };
    return `${emoji[entry.level]} [${entry.timestamp}] ${entry.level.toUpperCase()}: ${entry.message}${
      entry.data ? ` | ${JSON.stringify(entry.data)}` : ""
    }`;
  }

  private log(level: LogLevel, message: string, context?: string, data?: any) {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      data,
    };

    const formatted = this.formatLog(entry);

    if (level === "error") {
      console.error(formatted);
    } else if (level === "warn") {
      console.warn(formatted);
    } else {
      console.log(formatted);
    }
  }

  debug(message: string, context?: string, data?: any) {
    this.log("debug", message, context, data);
  }

  info(message: string, context?: string, data?: any) {
    this.log("info", message, context, data);
  }

  warn(message: string, context?: string, data?: any) {
    this.log("warn", message, context, data);
  }

  error(message: string, context?: string, data?: any) {
    this.log("error", message, context, data);
  }
}

export const logger = new Logger();
