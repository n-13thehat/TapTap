// Client-side compatible logger
export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  HTTP = 'http',
  DEBUG = 'debug',
}

// Structured logging interface
export interface LogContext {
  userId?: string;
  requestId?: string;
  action?: string;
  resource?: string;
  metadata?: Record<string, any>;
  errorId?: string;
  componentStack?: string;
}

// Simple logger implementation
const createSimpleLogger = () => {
  const log = (level: string, message: string, meta?: any) => {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${level.toUpperCase()}: ${message}`;

    if (meta) {
      console.log(logMessage, meta);
    } else {
      console.log(logMessage);
    }
  };

  return {
    error: (message: string, meta?: any) => log('error', message, meta),
    warn: (message: string, meta?: any) => log('warn', message, meta),
    info: (message: string, meta?: any) => log('info', message, meta),
    http: (message: string, meta?: any) => log('http', message, meta),
    debug: (message: string, meta?: any) => {
      if (process.env.NODE_ENV !== 'production') {
        log('debug', message, meta);
      }
    }
  };
};

const logger = createSimpleLogger();

// Enhanced logger with context
export class Logger {
  static error(message: string, error?: Error, context?: LogContext) {
    logger.error(message, {
      error: error?.message,
      stack: error?.stack,
      ...context,
    });
  }

  static warn(message: string, context?: LogContext) {
    logger.warn(message, context);
  }

  static info(message: string, context?: LogContext) {
    logger.info(message, context);
  }

  static http(message: string, context?: LogContext) {
    logger.http(message, context);
  }

  static debug(message: string, context?: LogContext) {
    logger.debug(message, context);
  }

  // Audit logging for sensitive operations
  static audit(action: string, context: LogContext & {
    userId: string;
    resource: string;
    result: 'success' | 'failure';
    details?: Record<string, any>;
  }) {
    logger.info(`AUDIT: ${action}`, {
      ...context,
      audit: true,
    });
  }

  // Performance logging
  static performance(operation: string, duration: number, context?: LogContext) {
    logger.info(`PERFORMANCE: ${operation}`, {
      ...context,
      duration,
      performance: true,
    });
  }

  // Security logging
  static security(event: string, context: LogContext & {
    severity: 'low' | 'medium' | 'high' | 'critical';
    ip?: string;
    userAgent?: string;
  }) {
    logger.warn(`SECURITY: ${event}`, {
      ...context,
      security: true,
    });
  }
}

export default logger;
