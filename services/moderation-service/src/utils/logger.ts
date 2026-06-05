type LogLevel = "INFO" | "WARN" | "ERROR" | "DEBUG";

interface LogContext {
  [key: string]: unknown;
}

const formatLog = (level: LogLevel, message: string, context?: string, data?: LogContext) => {
  const logObject = {
    timestamp: new Date().toISOString(),
    level,
    service: "moderation-service",
    context: context || "GENERAL",
    message,
    ...(data && { data }),
  };
  return JSON.stringify(logObject);
};

export const logger = {
  info: (message: string, context?: string, data?: LogContext) => {
    console.log(formatLog("INFO", message, context, data));
  },
  warn: (message: string, context?: string, data?: LogContext) => {
    console.warn(formatLog("WARN", message, context, data));
  },
  error: (message: string, context?: string, data?: LogContext) => {
    console.error(formatLog("ERROR", message, context, data));
  },
  debug: (message: string, context?: string, data?: LogContext) => {
    if (process.env.LOG_LEVEL === "debug" || process.env.NODE_ENV === "development") {
      console.log(formatLog("DEBUG", message, context, data));
    }
  },
};
