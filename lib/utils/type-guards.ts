/**
 * Type guards and validation utilities
 */

import type { UUID, Email, URL } from '../../types/global';
import type { ApiResponse, ErrorResponse, PaginatedResponse } from '../../types/api';

// ============================================================================
// Primitive Type Guards
// ============================================================================

export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value);
}

export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isArray<T>(value: unknown, itemGuard?: (item: unknown) => item is T): value is T[] {
  if (!Array.isArray(value)) return false;
  if (!itemGuard) return true;
  return value.every(itemGuard);
}

export function isNull(value: unknown): value is null {
  return value === null;
}

export function isUndefined(value: unknown): value is undefined {
  return value === undefined;
}

export function isNullish(value: unknown): value is null | undefined {
  return value === null || value === undefined;
}

export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

// ============================================================================
// Brand Type Guards
// ============================================================================

export function isUUID(value: unknown): value is UUID {
  if (!isString(value)) return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}

export function isEmail(value: unknown): value is Email {
  if (!isString(value)) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(value);
}

export function isURL(value: unknown): value is URL {
  if (!isString(value)) return false;
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

export function isTimestamp(value: unknown): value is number {
  return isNumber(value) && value > 0 && value <= Date.now() + 86400000; // Allow up to 1 day in future
}

export function isBase64(value: unknown): value is string {
  if (!isString(value)) return false;
  const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
  return base64Regex.test(value) && value.length % 4 === 0;
}

export function isHexColor(value: unknown): value is string {
  if (!isString(value)) return false;
  const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  return hexColorRegex.test(value);
}

// ============================================================================
// API Response Type Guards
// ============================================================================

export function isApiResponse<T>(value: unknown): value is ApiResponse<T> {
  return (
    isObject(value) &&
    isBoolean(value.success) &&
    isString(value.timestamp)
  );
}

export function isSuccessResponse<T>(value: unknown): value is ApiResponse<T> & { success: true } {
  return isApiResponse(value) && value.success === true;
}

export function isErrorResponse(value: unknown): value is ErrorResponse {
  return (
    isApiResponse(value) &&
    value.success === false &&
    isString(value.error)
  );
}

export function isPaginatedResponse<T>(value: unknown): value is PaginatedResponse<T> {
  return (
    isApiResponse(value) &&
    value.success === true &&
    isArray(value.data) &&
    isObject(value.pagination) &&
    isNumber(value.pagination.page) &&
    isNumber(value.pagination.limit) &&
    isNumber(value.pagination.total) &&
    isNumber(value.pagination.totalPages)
  );
}

// ============================================================================
// Domain Type Guards
// ============================================================================

export function isTrack(value: unknown): value is { id: UUID; title: string; artistId: UUID } {
  return (
    isObject(value) &&
    isUUID(value.id) &&
    isString(value.title) &&
    isUUID(value.artistId)
  );
}

export function isUser(value: unknown): value is { id: UUID; email: Email; username: string } {
  return (
    isObject(value) &&
    isUUID(value.id) &&
    isEmail(value.email) &&
    isString(value.username)
  );
}

export function isPlaylist(value: unknown): value is { id: UUID; title: string; userId: UUID } {
  return (
    isObject(value) &&
    isUUID(value.id) &&
    isString(value.title) &&
    isUUID(value.userId)
  );
}

// ============================================================================
// File Type Guards
// ============================================================================

export function isAudioFile(file: File): boolean {
  const audioMimeTypes = [
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'audio/flac',
    'audio/aac',
    'audio/ogg',
    'audio/webm',
    'audio/m4a'
  ];
  return audioMimeTypes.includes(file.type);
}

export function isImageFile(file: File): boolean {
  const imageMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/svg+xml'
  ];
  return imageMimeTypes.includes(file.type);
}

export function isVideoFile(file: File): boolean {
  const videoMimeTypes = [
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'video/x-msvideo',
    'video/avi'
  ];
  return videoMimeTypes.includes(file.type);
}

// ============================================================================
// Browser Feature Detection
// ============================================================================

export function hasAudioContext(): boolean {
  return typeof window !== 'undefined' && 
         (typeof window.AudioContext !== 'undefined' || 
          typeof (window as any).webkitAudioContext !== 'undefined');
}

export function hasWebGL(): boolean {
  if (typeof window === 'undefined') return false;
  
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    return gl !== null;
  } catch {
    return false;
  }
}

export function hasLocalStorage(): boolean {
  if (typeof window === 'undefined') return false;
  
  try {
    const test = '__localStorage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}

export function hasIndexedDB(): boolean {
  return typeof window !== 'undefined' && 'indexedDB' in window;
}

export function hasServiceWorker(): boolean {
  return typeof window !== 'undefined' && 'serviceWorker' in navigator;
}

export function hasNotifications(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function hasClipboard(): boolean {
  return typeof window !== 'undefined' && 'clipboard' in navigator;
}

export function hasShare(): boolean {
  return typeof window !== 'undefined' && 'share' in navigator;
}

// ============================================================================
// Environment Detection
// ============================================================================

export function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

export function isServer(): boolean {
  return typeof window === 'undefined';
}

export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development';
}

export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

export function isTest(): boolean {
  return process.env.NODE_ENV === 'test';
}

export function isMobile(): boolean {
  if (!isBrowser()) return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

export function isIOS(): boolean {
  if (!isBrowser()) return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

export function isAndroid(): boolean {
  if (!isBrowser()) return false;
  return /Android/.test(navigator.userAgent);
}

export function isSafari(): boolean {
  if (!isBrowser()) return false;
  return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
}

export function isChrome(): boolean {
  if (!isBrowser()) return false;
  return /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
}

export function isFirefox(): boolean {
  if (!isBrowser()) return false;
  return /Firefox/.test(navigator.userAgent);
}

// ============================================================================
// Utility Functions
// ============================================================================

export function assertIsString(value: unknown, message?: string): asserts value is string {
  if (!isString(value)) {
    throw new TypeError(message || `Expected string, got ${typeof value}`);
  }
}

export function assertIsNumber(value: unknown, message?: string): asserts value is number {
  if (!isNumber(value)) {
    throw new TypeError(message || `Expected number, got ${typeof value}`);
  }
}

export function assertIsUUID(value: unknown, message?: string): asserts value is UUID {
  if (!isUUID(value)) {
    throw new TypeError(message || `Expected UUID, got ${typeof value}`);
  }
}

export function assertIsEmail(value: unknown, message?: string): asserts value is Email {
  if (!isEmail(value)) {
    throw new TypeError(message || `Expected email, got ${typeof value}`);
  }
}

export function assertIsDefined<T>(value: T | null | undefined, message?: string): asserts value is T {
  if (!isDefined(value)) {
    throw new TypeError(message || 'Expected value to be defined');
  }
}

// ============================================================================
// Validation Helpers
// ============================================================================

export function validateRequired<T>(value: T | null | undefined, fieldName: string): T {
  if (!isDefined(value)) {
    throw new Error(`${fieldName} is required`);
  }
  return value;
}

export function validateString(value: unknown, fieldName: string, options?: {
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
}): string {
  if (!isString(value)) {
    throw new Error(`${fieldName} must be a string`);
  }
  
  if (options?.minLength && value.length < options.minLength) {
    throw new Error(`${fieldName} must be at least ${options.minLength} characters`);
  }
  
  if (options?.maxLength && value.length > options.maxLength) {
    throw new Error(`${fieldName} must be at most ${options.maxLength} characters`);
  }
  
  if (options?.pattern && !options.pattern.test(value)) {
    throw new Error(`${fieldName} format is invalid`);
  }
  
  return value;
}

export function validateNumber(value: unknown, fieldName: string, options?: {
  min?: number;
  max?: number;
  integer?: boolean;
}): number {
  if (!isNumber(value)) {
    throw new Error(`${fieldName} must be a number`);
  }
  
  if (options?.min !== undefined && value < options.min) {
    throw new Error(`${fieldName} must be at least ${options.min}`);
  }
  
  if (options?.max !== undefined && value > options.max) {
    throw new Error(`${fieldName} must be at most ${options.max}`);
  }
  
  if (options?.integer && !Number.isInteger(value)) {
    throw new Error(`${fieldName} must be an integer`);
  }
  
  return value;
}

export function validateArray<T>(
  value: unknown, 
  fieldName: string, 
  itemValidator?: (item: unknown, index: number) => T,
  options?: {
    minLength?: number;
    maxLength?: number;
  }
): T[] {
  if (!Array.isArray(value)) {
    throw new Error(`${fieldName} must be an array`);
  }
  
  if (options?.minLength && value.length < options.minLength) {
    throw new Error(`${fieldName} must have at least ${options.minLength} items`);
  }
  
  if (options?.maxLength && value.length > options.maxLength) {
    throw new Error(`${fieldName} must have at most ${options.maxLength} items`);
  }
  
  if (itemValidator) {
    return value.map((item, index) => {
      try {
        return itemValidator(item, index);
      } catch (error) {
        throw new Error(`${fieldName}[${index}]: ${error instanceof Error ? error.message : 'Invalid item'}`);
      }
    });
  }
  
  return value as T[];
}
