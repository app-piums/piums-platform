type LogLevel = "debug" | "info" | "warn" | "error";

interface LogMetadata {
  [key: string]: any;
}

class Logger {
  private colors = {
    reset: "\x1b[0m",
    debug: "\x1b[36m", // Cyan
    info: "\x1b[32m", // Green
    warn: "\x1b[33m", // Yellow
    error: "\x1b[31m", // Red
  };

  private shouldLog(level: LogLevel): boolean {
    const logLevel = process.env.LOG_LEVEL || "info";
    const levels = ["debug", "info", "warn", "error"];
    return levels.indexOf(level) >= levels.indexOf(logLevel);
  }

  private formatMessage(
    level: LogLevel,
    message: string,
    context?: string,
    metadata?: LogMetadata
  ): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? `[${context}]` : "";
    const metadataStr = metadata ? ` ${JSON.stringify(metadata)}` : "";
    
    if (process.env.NODE_ENV === "production") {
      // JSON format para producción
      return JSON.stringify({
        timestamp,
        level,
        context,
        message,
        ...metadata,
      });
    }
    
    // Colorized format para desarrollo
    const color = this.colors[level];
    const reset = this.colors.reset;
    return `${color}[${timestamp}] ${level.toUpperCase()}${reset} ${contextStr} ${message}${metadataStr}`;
  }

  debug(message: string, context?: string, metadata?: LogMetadata) {
    if (this.shouldLog("debug")) {
      console.log(this.formatMessage("debug", message, context, metadata));
    }
  }

  info(message: string, context?: string, metadata?: LogMetadata) {
    if (this.shouldLog("info")) {
      console.log(this.formatMessage("info", message, context, metadata));
    }
  }

  warn(message: string, context?: string, metadata?: LogMetadata) {
    if (this.shouldLog("warn")) {
      console.warn(this.formatMessage("warn", message, context, metadata));
    }
  }

  error(message: string, context?: string, metadata?: LogMetadata) {
    if (this.shouldLog("error")) {
      console.error(this.formatMessage("error", message, context, metadata));
    }
  }
}

export const logger = new Logger();
