export const logger = {
  info: (message: string, context: string = 'NOTIFICATION_SERVICE', data?: any) => {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'INFO',
      service: 'notifications-service',
      context,
      message,
      data,
    }));
  },

  warn: (message: string, context: string = 'NOTIFICATION_SERVICE', data?: any) => {
    console.warn(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'WARN',
      service: 'notifications-service',
      context,
      message,
      data,
    }));
  },

  error: (message: string, context: string = 'NOTIFICATION_SERVICE', error?: any) => {
    console.error(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'ERROR',
      service: 'notifications-service',
      context,
      message,
      error: error?.message || error,
      stack: error?.stack,
    }));
  },
};
