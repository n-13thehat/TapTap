/**
 * Application-specific error classes and utilities
 */

import type { UUID } from '../../types/global';

// ============================================================================
// Base Error Classes
// ============================================================================

export abstract class AppError extends Error {
  abstract readonly code: string;
  abstract readonly statusCode: number;
  readonly timestamp: Date;
  readonly requestId?: string;
  readonly userId?: UUID;
  readonly context?: Record<string, any>;

  constructor(
    message: string,
    options?: {
      cause?: Error;
      requestId?: string;
      userId?: UUID;
      context?: Record<string, any>;
    }
  ) {
    super(message, { cause: options?.cause });
    this.name = this.constructor.name;
    this.timestamp = new Date();
    this.requestId = options?.requestId;
    this.userId = options?.userId;
    this.context = options?.context;

    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, new.target.prototype);

    // Capture stack trace if available
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      timestamp: this.timestamp.toISOString(),
      requestId: this.requestId,
      userId: this.userId,
      context: this.context,
      stack: this.stack,
    };
  }

  toString() {
    return `${this.name} [${this.code}]: ${this.message}`;
  }
}

// ============================================================================
// Validation Errors
// ============================================================================

export class ValidationError extends AppError {
  readonly code = 'VALIDATION_ERROR';
  readonly statusCode = 400;
  readonly field?: string;
  readonly value?: any;
  readonly constraint?: string;

  constructor(
    message: string,
    options?: {
      field?: string;
      value?: any;
      constraint?: string;
      cause?: Error;
      requestId?: string;
      userId?: UUID;
      context?: Record<string, any>;
    }
  ) {
    super(message, options);
    this.field = options?.field;
    this.value = options?.value;
    this.constraint = options?.constraint;
  }

  static required(field: string, requestId?: string): ValidationError {
    return new ValidationError(`${field} is required`, {
      field,
      constraint: 'required',
      requestId,
    });
  }

  static invalid(field: string, value: any, constraint: string, requestId?: string): ValidationError {
    return new ValidationError(`${field} is invalid: ${constraint}`, {
      field,
      value,
      constraint,
      requestId,
    });
  }

  static tooShort(field: string, value: any, minLength: number, requestId?: string): ValidationError {
    return new ValidationError(`${field} must be at least ${minLength} characters`, {
      field,
      value,
      constraint: `minLength:${minLength}`,
      requestId,
    });
  }

  static tooLong(field: string, value: any, maxLength: number, requestId?: string): ValidationError {
    return new ValidationError(`${field} must be at most ${maxLength} characters`, {
      field,
      value,
      constraint: `maxLength:${maxLength}`,
      requestId,
    });
  }

  static outOfRange(field: string, value: any, min: number, max: number, requestId?: string): ValidationError {
    return new ValidationError(`${field} must be between ${min} and ${max}`, {
      field,
      value,
      constraint: `range:${min}-${max}`,
      requestId,
    });
  }
}

// ============================================================================
// Authentication & Authorization Errors
// ============================================================================

export class AuthenticationError extends AppError {
  readonly code = 'AUTHENTICATION_ERROR';
  readonly statusCode = 401;

  constructor(message = 'Authentication required', options?: {
    cause?: Error;
    requestId?: string;
    context?: Record<string, any>;
  }) {
    super(message, options);
  }

  static invalidCredentials(requestId?: string): AuthenticationError {
    return new AuthenticationError('Invalid credentials', { requestId });
  }

  static tokenExpired(requestId?: string): AuthenticationError {
    return new AuthenticationError('Token has expired', { requestId });
  }

  static tokenInvalid(requestId?: string): AuthenticationError {
    return new AuthenticationError('Invalid token', { requestId });
  }

  static sessionExpired(requestId?: string): AuthenticationError {
    return new AuthenticationError('Session has expired', { requestId });
  }
}

export class AuthorizationError extends AppError {
  readonly code = 'AUTHORIZATION_ERROR';
  readonly statusCode = 403;
  readonly requiredPermission?: string;
  readonly userRole?: string;

  constructor(
    message = 'Insufficient permissions',
    options?: {
      requiredPermission?: string;
      userRole?: string;
      cause?: Error;
      requestId?: string;
      userId?: UUID;
      context?: Record<string, any>;
    }
  ) {
    super(message, options);
    this.requiredPermission = options?.requiredPermission;
    this.userRole = options?.userRole;
  }

  static insufficientPermissions(
    requiredPermission: string,
    userRole?: string,
    requestId?: string,
    userId?: UUID
  ): AuthorizationError {
    return new AuthorizationError(
      `Permission '${requiredPermission}' required`,
      { requiredPermission, userRole, requestId, userId }
    );
  }

  static resourceOwnershipRequired(resourceType: string, requestId?: string, userId?: UUID): AuthorizationError {
    return new AuthorizationError(
      `You can only access your own ${resourceType}`,
      { requestId, userId }
    );
  }

  static accountSuspended(requestId?: string, userId?: UUID): AuthorizationError {
    return new AuthorizationError(
      'Account has been suspended',
      { requestId, userId }
    );
  }
}

// ============================================================================
// Resource Errors
// ============================================================================

export class NotFoundError extends AppError {
  readonly code = 'NOT_FOUND';
  readonly statusCode = 404;
  readonly resourceType?: string;
  readonly resourceId?: string;

  constructor(
    message = 'Resource not found',
    options?: {
      resourceType?: string;
      resourceId?: string;
      cause?: Error;
      requestId?: string;
      userId?: UUID;
      context?: Record<string, any>;
    }
  ) {
    super(message, options);
    this.resourceType = options?.resourceType;
    this.resourceId = options?.resourceId;
  }

  static resource(type: string, id?: string, requestId?: string): NotFoundError {
    const message = id ? `${type} with id '${id}' not found` : `${type} not found`;
    return new NotFoundError(message, { resourceType: type, resourceId: id, requestId });
  }

  static user(id: string, requestId?: string): NotFoundError {
    return NotFoundError.resource('User', id, requestId);
  }

  static track(id: string, requestId?: string): NotFoundError {
    return NotFoundError.resource('Track', id, requestId);
  }

  static album(id: string, requestId?: string): NotFoundError {
    return NotFoundError.resource('Album', id, requestId);
  }

  static playlist(id: string, requestId?: string): NotFoundError {
    return NotFoundError.resource('Playlist', id, requestId);
  }
}

export class ConflictError extends AppError {
  readonly code = 'CONFLICT';
  readonly statusCode = 409;
  readonly conflictType?: string;

  constructor(
    message = 'Resource conflict',
    options?: {
      conflictType?: string;
      cause?: Error;
      requestId?: string;
      userId?: UUID;
      context?: Record<string, any>;
    }
  ) {
    super(message, options);
    this.conflictType = options?.conflictType;
  }

  static duplicate(resourceType: string, field: string, value: any, requestId?: string): ConflictError {
    return new ConflictError(
      `${resourceType} with ${field} '${value}' already exists`,
      { conflictType: 'duplicate', requestId, context: { resourceType, field, value } }
    );
  }

  static emailTaken(email: string, requestId?: string): ConflictError {
    return ConflictError.duplicate('User', 'email', email, requestId);
  }

  static usernameTaken(username: string, requestId?: string): ConflictError {
    return ConflictError.duplicate('User', 'username', username, requestId);
  }
}

// ============================================================================
// Business Logic Errors
// ============================================================================

export class BusinessLogicError extends AppError {
  readonly code = 'BUSINESS_LOGIC_ERROR';
  readonly statusCode = 422;
  readonly businessRule?: string;

  constructor(
    message: string,
    options?: {
      businessRule?: string;
      cause?: Error;
      requestId?: string;
      userId?: UUID;
      context?: Record<string, any>;
    }
  ) {
    super(message, options);
    this.businessRule = options?.businessRule;
  }

  static insufficientFunds(required: number, available: number, requestId?: string, userId?: UUID): BusinessLogicError {
    return new BusinessLogicError(
      `Insufficient funds: required ${required}, available ${available}`,
      { businessRule: 'sufficient_funds', requestId, userId, context: { required, available } }
    );
  }

  static trackLimitExceeded(limit: number, requestId?: string, userId?: UUID): BusinessLogicError {
    return new BusinessLogicError(
      `Track upload limit exceeded: maximum ${limit} tracks allowed`,
      { businessRule: 'track_limit', requestId, userId, context: { limit } }
    );
  }

  static invalidFileFormat(allowedFormats: string[], requestId?: string, userId?: UUID): BusinessLogicError {
    return new BusinessLogicError(
      `Invalid file format. Allowed formats: ${allowedFormats.join(', ')}`,
      { businessRule: 'file_format', requestId, userId, context: { allowedFormats } }
    );
  }

  static fileTooLarge(maxSize: number, actualSize: number, requestId?: string, userId?: UUID): BusinessLogicError {
    return new BusinessLogicError(
      `File too large: maximum ${maxSize} bytes, got ${actualSize} bytes`,
      { businessRule: 'file_size', requestId, userId, context: { maxSize, actualSize } }
    );
  }
}

// ============================================================================
// External Service Errors
// ============================================================================

export class ExternalServiceError extends AppError {
  readonly code = 'EXTERNAL_SERVICE_ERROR';
  readonly statusCode = 502;
  readonly service?: string;
  readonly serviceStatusCode?: number;

  constructor(
    message: string,
    options?: {
      service?: string;
      serviceStatusCode?: number;
      cause?: Error;
      requestId?: string;
      context?: Record<string, any>;
    }
  ) {
    super(message, options);
    this.service = options?.service;
    this.serviceStatusCode = options?.serviceStatusCode;
  }

  static serviceUnavailable(service: string, requestId?: string): ExternalServiceError {
    return new ExternalServiceError(
      `${service} service is currently unavailable`,
      { service, serviceStatusCode: 503, requestId }
    );
  }

  static serviceTimeout(service: string, requestId?: string): ExternalServiceError {
    return new ExternalServiceError(
      `${service} service request timed out`,
      { service, serviceStatusCode: 504, requestId }
    );
  }

  static apiKeyInvalid(service: string, requestId?: string): ExternalServiceError {
    return new ExternalServiceError(
      `Invalid API key for ${service}`,
      { service, serviceStatusCode: 401, requestId }
    );
  }

  static rateLimitExceeded(service: string, requestId?: string): ExternalServiceError {
    return new ExternalServiceError(
      `Rate limit exceeded for ${service}`,
      { service, serviceStatusCode: 429, requestId }
    );
  }
}

// ============================================================================
// System Errors
// ============================================================================

export class SystemError extends AppError {
  readonly code = 'SYSTEM_ERROR';
  readonly statusCode = 500;
  readonly systemComponent?: string;

  constructor(
    message = 'Internal system error',
    options?: {
      systemComponent?: string;
      cause?: Error;
      requestId?: string;
      context?: Record<string, any>;
    }
  ) {
    super(message, options);
    this.systemComponent = options?.systemComponent;
  }

  static database(operation: string, requestId?: string): SystemError {
    return new SystemError(
      `Database ${operation} failed`,
      { systemComponent: 'database', requestId }
    );
  }

  static storage(operation: string, requestId?: string): SystemError {
    return new SystemError(
      `Storage ${operation} failed`,
      { systemComponent: 'storage', requestId }
    );
  }

  static cache(operation: string, requestId?: string): SystemError {
    return new SystemError(
      `Cache ${operation} failed`,
      { systemComponent: 'cache', requestId }
    );
  }

  static queue(operation: string, requestId?: string): SystemError {
    return new SystemError(
      `Queue ${operation} failed`,
      { systemComponent: 'queue', requestId }
    );
  }
}

// ============================================================================
// Rate Limiting Errors
// ============================================================================

export class RateLimitError extends AppError {
  readonly code = 'RATE_LIMIT_EXCEEDED';
  readonly statusCode = 429;
  readonly limit?: number;
  readonly windowMs?: number;
  readonly retryAfter?: number;

  constructor(
    message = 'Rate limit exceeded',
    options?: {
      limit?: number;
      windowMs?: number;
      retryAfter?: number;
      cause?: Error;
      requestId?: string;
      userId?: UUID;
      context?: Record<string, any>;
    }
  ) {
    super(message, options);
    this.limit = options?.limit;
    this.windowMs = options?.windowMs;
    this.retryAfter = options?.retryAfter;
  }

  static exceeded(
    limit: number,
    windowMs: number,
    retryAfter: number,
    requestId?: string,
    userId?: UUID
  ): RateLimitError {
    return new RateLimitError(
      `Rate limit exceeded: ${limit} requests per ${windowMs}ms. Retry after ${retryAfter}ms`,
      { limit, windowMs, retryAfter, requestId, userId }
    );
  }
}

// ============================================================================
// Error Utilities
// ============================================================================

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

export function isValidationError(error: unknown): error is ValidationError {
  return error instanceof ValidationError;
}

export function isAuthenticationError(error: unknown): error is AuthenticationError {
  return error instanceof AuthenticationError;
}

export function isAuthorizationError(error: unknown): error is AuthorizationError {
  return error instanceof AuthorizationError;
}

export function isNotFoundError(error: unknown): error is NotFoundError {
  return error instanceof NotFoundError;
}

export function isConflictError(error: unknown): error is ConflictError {
  return error instanceof ConflictError;
}

export function isBusinessLogicError(error: unknown): error is BusinessLogicError {
  return error instanceof BusinessLogicError;
}

export function isExternalServiceError(error: unknown): error is ExternalServiceError {
  return error instanceof ExternalServiceError;
}

export function isSystemError(error: unknown): error is SystemError {
  return error instanceof SystemError;
}

export function isRateLimitError(error: unknown): error is RateLimitError {
  return error instanceof RateLimitError;
}

export function getErrorStatusCode(error: unknown): number {
  if (isAppError(error)) {
    return error.statusCode;
  }
  return 500;
}

export function getErrorCode(error: unknown): string {
  if (isAppError(error)) {
    return error.code;
  }
  return 'UNKNOWN_ERROR';
}

export function serializeError(error: unknown): Record<string, any> {
  if (isAppError(error)) {
    return error.toJSON();
  }
  
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: 'UNKNOWN_ERROR',
      statusCode: 500,
      timestamp: new Date().toISOString(),
    };
  }
  
  return {
    message: String(error),
    code: 'UNKNOWN_ERROR',
    statusCode: 500,
    timestamp: new Date().toISOString(),
  };
}
