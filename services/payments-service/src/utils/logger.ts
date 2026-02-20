/**
 * Logger utility - Structured JSON logging
 */

type LogLevel = "INFO" | "WARN" | "ERROR" | "DEBUG";

interface LogData {
  timestamp: string;
  level: LogLevel;
  service: string;
  context: string;
  message: string;
  data?: any;
}

export const logger = {
  info: (message: string, context: string = "APP", data?: any) => {
    log("INFO", message, context, data);
  },
  warn: (message: string, context: string = "APP", data?: any) => {
    log("WARN", message, context, data);
  },
  error: (message: string, context: string = "APP", data?: any) => {
    log("ERROR", message, context, data);
  },
  debug: (message: string, context: string = "APP", data?: any) => {
    if (process.env.NODE_ENV === "development") {
      log("DEBUG", message, context, data);
    }
  },
};

function log(level: LogLevel, message: string, context: string, data?: any) {
  const logEntry: LogData = {
    timestamp: new Date().toISOString(),
    level,
    service: "payments-service",
    context,
    message,
    ...(data && { data }),
  };

  console.log(JSON.stringify(logEntry));
}
