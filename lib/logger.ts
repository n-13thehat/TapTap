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

// Keys whose values should never appear in logs. Matched case-insensitively
// as a substring against the property name, so "authToken", "X-Api-Key",
// "stripeSecretKey", etc. all match.
const SENSITIVE_KEY_PATTERN =
  /pass(word)?|secret|token|authorization|cookie|api[_-]?key|private[_-]?key|mnemonic|seed[_-]?phrase|session/i;

// Values that look like secrets even when the key is innocuous.
// Long base58 (Solana addresses/keys), JWT-shaped tokens, raw bearer headers.
const SENSITIVE_VALUE_PATTERN =
  /^(Bearer\s+|Basic\s+)|^eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;

const REDACTED = '[REDACTED]';

export function redactSensitive(input: unknown, depth = 0): unknown {
  if (depth > 8 || input == null) return input;
  if (typeof input === 'string') {
    return SENSITIVE_VALUE_PATTERN.test(input) ? REDACTED : input;
  }
  if (input instanceof Error) {
    return { name: input.name, message: input.message, stack: input.stack };
  }
  if (Array.isArray(input)) {
    return input.map((v) => redactSensitive(v, depth + 1));
  }
  if (typeof input === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
      if (SENSITIVE_KEY_PATTERN.test(k)) {
        out[k] = REDACTED;
      } else {
        out[k] = redactSensitive(v, depth + 1);
      }
    }
    return out;
  }
  return input;
}

// Simple logger implementation
const createSimpleLogger = () => {
  const log = (level: string, message: string, meta?: any) => {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${level.toUpperCase()}: ${message}`;
    const safeMeta = meta == null ? meta : redactSensitive(meta);

    if (safeMeta !== undefined && safeMeta !== null) {
      console.log(logMessage, safeMeta);
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
