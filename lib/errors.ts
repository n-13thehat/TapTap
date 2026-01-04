import { Logger } from './logger';

// Custom error types
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly code?: string;
  public readonly context?: Record<string, any>;

  constructor(
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true,
    code?: string,
    context?: Record<string, any>
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.code = code;
    this.context = context;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 400, true, 'VALIDATION_ERROR', context);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required', context?: Record<string, any>) {
    super(message, 401, true, 'AUTHENTICATION_ERROR', context);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions', context?: Record<string, any>) {
    super(message, 403, true, 'AUTHORIZATION_ERROR', context);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource', context?: Record<string, any>) {
    super(`${resource} not found`, 404, true, 'NOT_FOUND_ERROR', context);
  }
}

export class ConflictError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 409, true, 'CONFLICT_ERROR', context);
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded', context?: Record<string, any>) {
    super(message, 429, true, 'RATE_LIMIT_ERROR', context);
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 500, true, 'DATABASE_ERROR', context);
  }
}

export class ExternalServiceError extends AppError {
  constructor(service: string, message: string, context?: Record<string, any>) {
    super(`${service}: ${message}`, 502, true, 'EXTERNAL_SERVICE_ERROR', context);
  }
}

// Error handler utility
export class ErrorHandler {
  static handle(error: Error, context?: Record<string, any>): AppError {
    // If it's already an AppError, just log and return
    if (error instanceof AppError) {
      Logger.error(error.message, error, { ...context, ...error.context });
      return error;
    }

    // Handle Prisma errors
    if (error.name === 'PrismaClientKnownRequestError') {
      const prismaError = error as any;
      switch (prismaError.code) {
        case 'P2002':
          const appError = new ConflictError('Unique constraint violation', {
            ...context,
            prismaCode: prismaError.code,
            target: prismaError.meta?.target,
          });
          Logger.error(appError.message, appError, context);
          return appError;
        case 'P2025':
          const notFoundError = new NotFoundError('Record', {
            ...context,
            prismaCode: prismaError.code,
          });
          Logger.error(notFoundError.message, notFoundError, context);
          return notFoundError;
        default:
          const dbError = new DatabaseError(prismaError.message, {
            ...context,
            prismaCode: prismaError.code,
          });
          Logger.error(dbError.message, dbError, context);
          return dbError;
      }
    }

    // Handle validation errors (Zod, etc.)
    if (error.name === 'ZodError') {
      const validationError = new ValidationError('Invalid input data', {
        ...context,
        validationErrors: (error as any).errors,
      });
      Logger.error(validationError.message, validationError, context);
      return validationError;
    }

    // Handle unknown errors
    const unknownError = new AppError(
      'An unexpected error occurred',
      500,
      false,
      'UNKNOWN_ERROR',
      context
    );
    Logger.error(error.message, error, context);
    return unknownError;
  }

  static isOperationalError(error: Error): boolean {
    if (error instanceof AppError) {
      return error.isOperational;
    }
    return false;
  }
}

// Error response formatter
export interface ErrorResponse {
  error: {
    message: string;
    code?: string;
    statusCode: number;
    requestId?: string;
    timestamp: string;
    details?: Record<string, any>;
  };
}

export function formatErrorResponse(error: AppError, requestId?: string): ErrorResponse {
  return {
    error: {
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
      requestId,
      timestamp: new Date().toISOString(),
      ...(process.env.NODE_ENV === 'development' && {
        details: error.context,
        stack: error.stack,
      }),
    },
  };
}
