// Central export for all DTOs
export * from './user.dto';
export * from './track.dto';

// Common DTO utilities
import { z } from 'zod';

// Pagination DTO
export const PaginationDTOSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  total: z.number().int().min(0),
  totalPages: z.number().int().min(0),
});

export type PaginationDTO = z.infer<typeof PaginationDTOSchema>;

// Paginated Response DTO
export function createPaginatedResponseSchema<T extends z.ZodTypeAny>(itemSchema: T) {
  return z.object({
    items: z.array(itemSchema),
    pagination: PaginationDTOSchema,
  });
}

// API Response DTO
export const ApiResponseDTOSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  error: z.string().optional(),
  timestamp: z.date().default(() => new Date()),
});

export function createApiResponseSchema<T extends z.ZodTypeAny>(dataSchema: T) {
  return ApiResponseDTOSchema.extend({
    data: dataSchema.optional(),
  });
}

export type ApiResponseDTO<T = unknown> = {
  success: boolean;
  message?: string;
  error?: string;
  timestamp: Date;
  data?: T;
};

// Error DTO
export const ErrorDTOSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.record(z.any()).optional(),
  timestamp: z.date().default(() => new Date()),
});

export type ErrorDTO = z.infer<typeof ErrorDTOSchema>;

// Validation utilities
export function createValidationError(field: string, message: string): ErrorDTO {
  return {
    code: 'VALIDATION_ERROR',
    message: `Validation failed for field '${field}': ${message}`,
    details: { field, message },
    timestamp: new Date(),
  };
}

export function createNotFoundError(resource: string, id?: string): ErrorDTO {
  return {
    code: 'NOT_FOUND',
    message: `${resource}${id ? ` with id '${id}'` : ''} not found`,
    details: { resource, id },
    timestamp: new Date(),
  };
}

export function createUnauthorizedError(message = 'Unauthorized access'): ErrorDTO {
  return {
    code: 'UNAUTHORIZED',
    message,
    timestamp: new Date(),
  };
}

export function createForbiddenError(message = 'Forbidden access'): ErrorDTO {
  return {
    code: 'FORBIDDEN',
    message,
    timestamp: new Date(),
  };
}

export function createInternalError(message = 'Internal server error'): ErrorDTO {
  return {
    code: 'INTERNAL_ERROR',
    message,
    timestamp: new Date(),
  };
}
