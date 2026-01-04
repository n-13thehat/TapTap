/**
 * SSR-Safe Storage Utilities
 * Provides safe localStorage and sessionStorage access with proper fallbacks
 */

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

/**
 * SSR-safe localStorage wrapper
 */
export const ssrSafeLocalStorage = {
  getItem: (key: string): string | null => {
    if (!isBrowser) return null;
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.warn(`Failed to get localStorage item "${key}":`, error);
      return null;
    }
  },

  setItem: (key: string, value: string): boolean => {
    if (!isBrowser) return false;
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (error) {
      console.warn(`Failed to set localStorage item "${key}":`, error);
      return false;
    }
  },

  removeItem: (key: string): boolean => {
    if (!isBrowser) return false;
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.warn(`Failed to remove localStorage item "${key}":`, error);
      return false;
    }
  },

  clear: (): boolean => {
    if (!isBrowser) return false;
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.warn('Failed to clear localStorage:', error);
      return false;
    }
  },

  // Check if localStorage is available
  isAvailable: (): boolean => {
    if (!isBrowser) return false;
    try {
      const test = '__localStorage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }
};

/**
 * SSR-safe sessionStorage wrapper
 */
export const ssrSafeSessionStorage = {
  getItem: (key: string): string | null => {
    if (!isBrowser) return null;
    try {
      return sessionStorage.getItem(key);
    } catch (error) {
      console.warn(`Failed to get sessionStorage item "${key}":`, error);
      return null;
    }
  },

  setItem: (key: string, value: string): boolean => {
    if (!isBrowser) return false;
    try {
      sessionStorage.setItem(key, value);
      return true;
    } catch (error) {
      console.warn(`Failed to set sessionStorage item "${key}":`, error);
      return false;
    }
  },

  removeItem: (key: string): boolean => {
    if (!isBrowser) return false;
    try {
      sessionStorage.removeItem(key);
      return true;
    } catch (error) {
      console.warn(`Failed to remove sessionStorage item "${key}":`, error);
      return false;
    }
  },

  clear: (): boolean => {
    if (!isBrowser) return false;
    try {
      sessionStorage.clear();
      return true;
    } catch (error) {
      console.warn('Failed to clear sessionStorage:', error);
      return false;
    }
  },

  // Check if sessionStorage is available
  isAvailable: (): boolean => {
    if (!isBrowser) return false;
    try {
      const test = '__sessionStorage_test__';
      sessionStorage.setItem(test, test);
      sessionStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }
};

/**
 * Generic JSON storage utilities with type safety
 */
export const createTypedStorage = <T>(storage: typeof ssrSafeLocalStorage) => ({
  get: (key: string, fallback: T): T => {
    const item = storage.getItem(key);
    if (item === null) return fallback;

    try {
      return JSON.parse(item) as T;
    } catch (error) {
      console.warn(`Failed to parse stored JSON for key "${key}":`, error);
      return fallback;
    }
  },

  set: (key: string, value: T): boolean => {
    try {
      return storage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn(`Failed to stringify value for key "${key}":`, error);
      return false;
    }
  },

  remove: (key: string): boolean => storage.removeItem(key),
  clear: (): boolean => storage.clear(),
  isAvailable: (): boolean => storage.isAvailable()
});

// Pre-configured typed storage instances
export const typedLocalStorage = createTypedStorage(ssrSafeLocalStorage);
export const typedSessionStorage = createTypedStorage(ssrSafeSessionStorage);