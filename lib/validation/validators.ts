/**
 * Comprehensive validation utilities and validators
 */

import { z } from 'zod';
import { ValidationError } from '../errors/AppError';
import type { UUID, Email, URL } from '../../types/global';

// ============================================================================
// Custom Zod Schemas
// ============================================================================

// UUID validation
export const uuidSchema = z.string().uuid('Invalid UUID format');

// Email validation with additional checks
export const emailSchema = z
  .string()
  .email('Invalid email format')
  .max(255, 'Email must be at most 255 characters')
  .refine(
    (email) => {
      // Check for common disposable email domains
      const disposableDomains = [
        '10minutemail.com',
        'tempmail.org',
        'guerrillamail.com',
        'mailinator.com',
        'throwaway.email',
      ];
      const domain = email.split('@')[1]?.toLowerCase();
      return !disposableDomains.includes(domain);
    },
    { message: 'Disposable email addresses are not allowed' }
  );

// URL validation with protocol check
export const urlSchema = z
  .string()
  .url('Invalid URL format')
  .max(2048, 'URL must be at most 2048 characters')
  .refine(
    (url) => {
      try {
        const parsed = new URL(url);
        return ['http:', 'https:'].includes(parsed.protocol);
      } catch {
        return false;
      }
    },
    { message: 'URL must use HTTP or HTTPS protocol' }
  );

// Username validation
export const usernameSchema = z
  .string()
  .min(3, 'Username must be at least 3 characters')
  .max(30, 'Username must be at most 30 characters')
  .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens')
  .refine(
    (username) => {
      // Reserved usernames
      const reserved = [
        'admin', 'administrator', 'root', 'system', 'api', 'www', 'mail',
        'support', 'help', 'info', 'contact', 'about', 'terms', 'privacy',
        'security', 'login', 'register', 'signup', 'signin', 'logout',
        'profile', 'account', 'settings', 'dashboard', 'home', 'index',
        'null', 'undefined', 'true', 'false', 'test', 'demo', 'example',
      ];
      return !reserved.includes(username.toLowerCase());
    },
    { message: 'Username is reserved and cannot be used' }
  );

// Password validation with strength requirements
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must be at most 128 characters')
  .refine(
    (password) => /[a-z]/.test(password),
    { message: 'Password must contain at least one lowercase letter' }
  )
  .refine(
    (password) => /[A-Z]/.test(password),
    { message: 'Password must contain at least one uppercase letter' }
  )
  .refine(
    (password) => /\d/.test(password),
    { message: 'Password must contain at least one number' }
  )
  .refine(
    (password) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
    { message: 'Password must contain at least one special character' }
  )
  .refine(
    (password) => {
      // Check for common weak passwords
      const weakPasswords = [
        'password', '12345678', 'qwerty123', 'abc123456', 'password123',
        'admin123', 'letmein123', 'welcome123', 'monkey123', 'dragon123',
      ];
      return !weakPasswords.includes(password.toLowerCase());
    },
    { message: 'Password is too common and weak' }
  );

// File validation schemas
export const imageFileSchema = z.object({
  name: z.string().min(1, 'File name is required'),
  size: z.number().max(10 * 1024 * 1024, 'Image must be smaller than 10MB'),
  type: z.string().refine(
    (type) => ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'].includes(type),
    { message: 'File must be a valid image (JPEG, PNG, WebP, or GIF)' }
  ),
});

export const audioFileSchema = z.object({
  name: z.string().min(1, 'File name is required'),
  size: z.number().max(100 * 1024 * 1024, 'Audio file must be smaller than 100MB'),
  type: z.string().refine(
    (type) => [
      'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/flac', 
      'audio/aac', 'audio/ogg', 'audio/webm', 'audio/m4a'
    ].includes(type),
    { message: 'File must be a valid audio format (MP3, WAV, FLAC, AAC, OGG, WebM, or M4A)' }
  ),
});

// Date validation
export const dateSchema = z.union([
  z.string().datetime('Invalid date format'),
  z.date(),
]).transform((val) => typeof val === 'string' ? new Date(val) : val);

export const futureDateSchema = dateSchema.refine(
  (date) => date > new Date(),
  { message: 'Date must be in the future' }
);

export const pastDateSchema = dateSchema.refine(
  (date) => date < new Date(),
  { message: 'Date must be in the past' }
);

// ============================================================================
// Validation Functions
// ============================================================================

export function validateUUID(value: unknown, fieldName = 'ID'): UUID {
  try {
    return uuidSchema.parse(value) as UUID;
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw ValidationError.invalid(fieldName, value, error.errors[0]?.message || 'Invalid UUID');
    }
    throw error;
  }
}

export function validateEmail(value: unknown, fieldName = 'Email'): Email {
  try {
    return emailSchema.parse(value) as Email;
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw ValidationError.invalid(fieldName, value, error.errors[0]?.message || 'Invalid email');
    }
    throw error;
  }
}

export function validateURL(value: unknown, fieldName = 'URL'): URL {
  try {
    return urlSchema.parse(value) as URL;
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw ValidationError.invalid(fieldName, value, error.errors[0]?.message || 'Invalid URL');
    }
    throw error;
  }
}

export function validateUsername(value: unknown, fieldName = 'Username'): string {
  try {
    return usernameSchema.parse(value);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw ValidationError.invalid(fieldName, value, error.errors[0]?.message || 'Invalid username');
    }
    throw error;
  }
}

export function validatePassword(value: unknown, fieldName = 'Password'): string {
  try {
    return passwordSchema.parse(value);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw ValidationError.invalid(fieldName, value, error.errors[0]?.message || 'Invalid password');
    }
    throw error;
  }
}

export function validateImageFile(file: File): File {
  try {
    imageFileSchema.parse({
      name: file.name,
      size: file.size,
      type: file.type,
    });
    return file;
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw ValidationError.invalid('Image file', file.name, error.errors[0]?.message || 'Invalid image file');
    }
    throw error;
  }
}

export function validateAudioFile(file: File): File {
  try {
    audioFileSchema.parse({
      name: file.name,
      size: file.size,
      type: file.type,
    });
    return file;
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw ValidationError.invalid('Audio file', file.name, error.errors[0]?.message || 'Invalid audio file');
    }
    throw error;
  }
}

// ============================================================================
// Advanced Validation Utilities
// ============================================================================

export class ValidationBuilder<T> {
  private schema: z.ZodSchema<T>;
  private fieldName: string;

  constructor(schema: z.ZodSchema<T>, fieldName: string) {
    this.schema = schema;
    this.fieldName = fieldName;
  }

  required(): ValidationBuilder<T> {
    return new ValidationBuilder(
      this.schema.refine((val) => val !== null && val !== undefined, {
        message: `${this.fieldName} is required`,
      }),
      this.fieldName
    );
  }

  custom(validator: (value: T) => boolean, message: string): ValidationBuilder<T> {
    return new ValidationBuilder(
      this.schema.refine(validator, { message }),
      this.fieldName
    );
  }

  async(validator: (value: T) => Promise<boolean>, message: string): ValidationBuilder<T> {
    return new ValidationBuilder(
      this.schema.refine(validator, { message }),
      this.fieldName
    );
  }

  validate(value: unknown): T {
    try {
      return this.schema.parse(value);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw ValidationError.invalid(
          this.fieldName,
          value,
          error.errors[0]?.message || 'Validation failed'
        );
      }
      throw error;
    }
  }

  async validateAsync(value: unknown): Promise<T> {
    try {
      return await this.schema.parseAsync(value);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw ValidationError.invalid(
          this.fieldName,
          value,
          error.errors[0]?.message || 'Validation failed'
        );
      }
      throw error;
    }
  }
}

export function createValidator<T>(schema: z.ZodSchema<T>, fieldName: string): ValidationBuilder<T> {
  return new ValidationBuilder(schema, fieldName);
}

// ============================================================================
// Form Validation Utilities
// ============================================================================

export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors: Record<string, string>;
}

export async function validateForm<T extends Record<string, any>>(
  data: unknown,
  schema: z.ZodSchema<T>
): Promise<ValidationResult<T>> {
  try {
    const validData = await schema.parseAsync(data);
    return {
      success: true,
      data: validData,
      errors: {},
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {};
      
      error.errors.forEach((err) => {
        const path = err.path.join('.');
        errors[path] = err.message;
      });
      
      return {
        success: false,
        errors,
      };
    }
    
    return {
      success: false,
      errors: { _form: 'Validation failed' },
    };
  }
}

export function validateField<T>(
  value: unknown,
  schema: z.ZodSchema<T>,
  fieldName: string
): { success: boolean; data?: T; error?: string } {
  try {
    const validData = schema.parse(value);
    return { success: true, data: validData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0]?.message || 'Validation failed',
      };
    }
    
    return {
      success: false,
      error: 'Validation failed',
    };
  }
}

// ============================================================================
// Sanitization Utilities
// ============================================================================

export function sanitizeString(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: URLs
    .replace(/on\w+=/gi, '') // Remove event handlers
    .replace(/\0/g, ''); // Remove null bytes
}

export function sanitizeHTML(input: string): string {
  // Basic HTML sanitization - in production, use a library like DOMPurify
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
    .replace(/<link\b[^<]*(?:(?!<\/link>)<[^<]*)*<\/link>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '');
}

export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, '') // Remove invalid filename characters
    .replace(/^\.+/, '') // Remove leading dots
    .replace(/\.+$/, '') // Remove trailing dots
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .substring(0, 255); // Limit length
}

export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const sanitized = {} as T;
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key as keyof T] = sanitizeString(value) as T[keyof T];
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      sanitized[key as keyof T] = sanitizeObject(value) as T[keyof T];
    } else if (Array.isArray(value)) {
      sanitized[key as keyof T] = value.map(item => 
        typeof item === 'string' ? sanitizeString(item) : 
        typeof item === 'object' && item !== null ? sanitizeObject(item) : 
        item
      ) as T[keyof T];
    } else {
      sanitized[key as keyof T] = value;
    }
  }
  
  return sanitized;
}

// ============================================================================
// Rate Limiting Validation
// ============================================================================

export class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  
  constructor(
    private maxRequests: number,
    private windowMs: number
  ) {}
  
  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    // Get existing requests for this identifier
    const requests = this.requests.get(identifier) || [];
    
    // Filter out requests outside the window
    const validRequests = requests.filter(time => time > windowStart);
    
    // Check if under limit
    if (validRequests.length >= this.maxRequests) {
      return false;
    }
    
    // Add current request
    validRequests.push(now);
    this.requests.set(identifier, validRequests);
    
    return true;
  }
  
  getRemainingRequests(identifier: string): number {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    const requests = this.requests.get(identifier) || [];
    const validRequests = requests.filter(time => time > windowStart);
    
    return Math.max(0, this.maxRequests - validRequests.length);
  }
  
  getResetTime(identifier: string): number {
    const requests = this.requests.get(identifier) || [];
    if (requests.length === 0) return 0;
    
    const oldestRequest = Math.min(...requests);
    return oldestRequest + this.windowMs;
  }
  
  clear(identifier?: string): void {
    if (identifier) {
      this.requests.delete(identifier);
    } else {
      this.requests.clear();
    }
  }
}
