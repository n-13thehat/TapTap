/**
 * SSR-Safe Browser API Utilities
 * Provides safe access to browser APIs with proper fallbacks for server-side rendering
 */

// Environment checks
export const isBrowser = typeof window !== 'undefined';
export const isServer = typeof window === 'undefined';

/**
 * Safe window access
 */
export const safeWindow = {
  get: (): Window | null => (isBrowser ? window : null),
  addEventListener: (event: string, handler: EventListener, options?: AddEventListenerOptions) => {
    if (isBrowser) {
      window.addEventListener(event, handler, options);
    }
  },
  removeEventListener: (event: string, handler: EventListener, options?: EventListenerOptions) => {
    if (isBrowser) {
      window.removeEventListener(event, handler, options);
    }
  },
  matchMedia: (query: string) => {
    if (!isBrowser) {
      return { matches: false, addEventListener: () => {}, removeEventListener: () => {} };
    }
    return window.matchMedia(query);
  }
};

/**
 * Safe document access
 */
export const safeDocument = {
  get: (): Document | null => (isBrowser ? document : null),
  addEventListener: (event: string, handler: EventListener, options?: AddEventListenerOptions) => {
    if (isBrowser) {
      document.addEventListener(event, handler, options);
    }
  },
  removeEventListener: (event: string, handler: EventListener, options?: EventListenerOptions) => {
    if (isBrowser) {
      document.removeEventListener(event, handler, options);
    }
  },
  createElement: (tagName: string) => {
    if (!isBrowser) return null;
    return document.createElement(tagName);
  },
  querySelector: (selector: string) => {
    if (!isBrowser) return null;
    return document.querySelector(selector);
  },
  querySelectorAll: (selector: string) => {
    if (!isBrowser) return [];
    return Array.from(document.querySelectorAll(selector));
  }
};

/**
 * Safe navigator access
 */
export const safeNavigator = {
  get: (): Navigator | null => (isBrowser ? navigator : null),
  userAgent: isBrowser ? navigator.userAgent : '',
  onLine: isBrowser ? navigator.onLine : false,
  clipboard: {
    writeText: async (text: string): Promise<boolean> => {
      if (!isBrowser || !navigator.clipboard) return false;
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch {
        return false;
      }
    },
    readText: async (): Promise<string | null> => {
      if (!isBrowser || !navigator.clipboard) return null;
      try {
        return await navigator.clipboard.readText();
      } catch {
        return null;
      }
    }
  },
  share: async (data: ShareData): Promise<boolean> => {
    if (!isBrowser || !navigator.share) return false;
    try {
      await navigator.share(data);
      return true;
    } catch {
      return false;
    }
  }
};

/**
 * Safe requestAnimationFrame
 */
export const safeRequestAnimationFrame = (callback: FrameRequestCallback): number => {
  if (!isBrowser) return 0;
  return requestAnimationFrame(callback);
};

export const safeCancelAnimationFrame = (id: number): void => {
  if (isBrowser) {
    cancelAnimationFrame(id);
  }
};

/**
 * Safe setTimeout/setInterval
 */
export const safeSetTimeout = (callback: () => void, delay: number): number => {
  if (!isBrowser) return 0;
  return window.setTimeout(callback, delay);
};

export const safeClearTimeout = (id: number): void => {
  if (isBrowser) {
    clearTimeout(id);
  }
};

export const safeSetInterval = (callback: () => void, delay: number): number => {
  if (!isBrowser) return 0;
  return window.setInterval(callback, delay);
};

export const safeClearInterval = (id: number): void => {
  if (isBrowser) {
    clearInterval(id);
  }
};

/**
 * Feature detection utilities
 */
export const features = {
  hasLocalStorage: (): boolean => {
    if (!isBrowser) return false;
    try {
      const test = '__test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  },

  hasSessionStorage: (): boolean => {
    if (!isBrowser) return false;
    try {
      const test = '__test__';
      sessionStorage.setItem(test, test);
      sessionStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  },

  hasWebGL: (): boolean => {
    if (!isBrowser) return false;
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      return gl !== null;
    } catch {
      return false;
    }
  },

  hasAudioContext: (): boolean => {
    if (!isBrowser) return false;
    return typeof AudioContext !== 'undefined' || typeof (window as any).webkitAudioContext !== 'undefined';
  },

  hasServiceWorker: (): boolean => {
    return isBrowser && 'serviceWorker' in navigator;
  },

  hasNotifications: (): boolean => {
    return isBrowser && 'Notification' in window;
  },

  hasClipboard: (): boolean => {
    return isBrowser && 'clipboard' in navigator;
  },

  hasShare: (): boolean => {
    return isBrowser && 'share' in navigator;
  },

  hasIndexedDB: (): boolean => {
    return isBrowser && 'indexedDB' in window;
  },

  prefersReducedMotion: (): boolean => {
    if (!isBrowser) return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  },

  prefersDarkMode: (): boolean => {
    if (!isBrowser) return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
};