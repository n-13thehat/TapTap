/**
 * Image optimization hooks
 */

import { useState, useEffect, useCallback, useRef } from 'react';

export interface ImageOptimizationOptions {
  src: string;
  placeholder?: string;
  fallback?: string;
  quality?: number;
  format?: 'webp' | 'avif' | 'auto';
  sizes?: string;
  priority?: boolean;
  lazy?: boolean;
  threshold?: number;
}

export interface ImageState {
  src: string;
  loading: boolean;
  error: boolean;
  loaded: boolean;
}

/**
 * Hook for optimized image loading with lazy loading and format detection
 */
export function useOptimizedImage(options: ImageOptimizationOptions): ImageState & {
  imgRef: React.RefObject<HTMLImageElement>;
  retry: () => void;
} {
  const { 
    src, 
    placeholder, 
    fallback, 
    quality = 75, 
    format = 'auto', 
    lazy = true, 
    threshold = 0.1,
    priority = false 
  } = options;
  
  const [state, setState] = useState<ImageState>({
    src: placeholder || src,
    loading: !priority,
    error: false,
    loaded: false,
  });
  
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const [shouldLoad, setShouldLoad] = useState(!lazy || priority);
  
  // Generate optimized image URL
  const getOptimizedSrc = useCallback((originalSrc: string) => {
    if (!originalSrc) return originalSrc;
    
    // If it's already a data URL or blob, return as-is
    if (originalSrc.startsWith('data:') || originalSrc.startsWith('blob:')) {
      return originalSrc;
    }
    
    // For external URLs, return as-is (could be enhanced with a proxy service)
    if (originalSrc.startsWith('http://') || originalSrc.startsWith('https://')) {
      return originalSrc;
    }
    
    // For relative URLs, add optimization parameters
    const url = new URL(originalSrc, window.location.origin);

    // Add quality parameter
    if (quality !== 75) {
      url.searchParams.set('q', quality.toString());
    }

    // Add format parameter
    if (format !== 'auto') {
      url.searchParams.set('f', format);
    }

    return url.toString();
  }, [quality, format]);

  // Check if browser supports WebP/AVIF
  const getSupportedFormat = useCallback(() => {
    if (format !== 'auto') return format;

    // Check AVIF support
    const avifCanvas = document.createElement('canvas');
    avifCanvas.width = 1;
    avifCanvas.height = 1;
    const avifSupported = avifCanvas.toDataURL('image/avif').indexOf('data:image/avif') === 0;

    if (avifSupported) return 'avif';

    // Check WebP support
    const webpCanvas = document.createElement('canvas');
    webpCanvas.width = 1;
    webpCanvas.height = 1;
    const webpSupported = webpCanvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;

    if (webpSupported) return 'webp';

    return 'auto';
  }, [format]);

  // Load image
  const loadImage = useCallback(async () => {
    if (!src || state.loaded) return;

    setState(prev => ({ ...prev, loading: true, error: false }));

    try {
      const optimizedSrc = getOptimizedSrc(src);

      // Preload the image
      const img = new Image();

      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = optimizedSrc;
      });

      setState({
        src: optimizedSrc,
        loading: false,
        error: false,
        loaded: true,
      });

    } catch (error) {
      console.warn('Image load failed:', error);

      if (fallback) {
        setState({
          src: fallback,
          loading: false,
          error: false,
          loaded: true,
        });
      } else {
        setState(prev => ({
          ...prev,
          loading: false,
          error: true,
        }));
      }
    }
  }, [src, getOptimizedSrc, fallback, state.loaded]);

  // Retry loading
  const retry = useCallback(() => {
    setState(prev => ({ ...prev, error: false, loaded: false }));
    loadImage();
  }, [loadImage]);

  // Set up intersection observer for lazy loading
  useEffect(() => {
    if (!lazy || shouldLoad || !imgRef.current) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setShouldLoad(true);
            observerRef.current?.disconnect();
          }
        });
      },
      { threshold }
    );

    observerRef.current.observe(imgRef.current);

    return () => {
      observerRef.current?.disconnect();
    };
  }, [lazy, shouldLoad, threshold]);

  // Load image when shouldLoad changes
  useEffect(() => {
    if (shouldLoad) {
      loadImage();
    }
  }, [shouldLoad, loadImage]);

  // Cleanup
  useEffect(() => {
    return () => {
      observerRef.current?.disconnect();
    };
  }, []);

  return {
    ...state,
    imgRef,
    retry,
  };
}

/**
 * Hook for progressive image loading (blur-up effect)
 */
export function useProgressiveImage(options: {
  src: string;
  placeholder?: string;
  blurDataURL?: string;
  quality?: number;
}) {
  const { src, placeholder, blurDataURL, quality = 75 } = options;

  const [currentSrc, setCurrentSrc] = useState(blurDataURL || placeholder || '');
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!src) return;

    const img = new Image();

    img.onload = () => {
      setCurrentSrc(src);
      setLoading(false);
      setLoaded(true);
    };

    img.onerror = () => {
      setLoading(false);
    };

    img.src = src;

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src]);

  return {
    src: currentSrc,
    loading,
    loaded,
    isPlaceholder: currentSrc !== src,
  };
}

/**
 * Hook for responsive images with different sources for different screen sizes
 */
export function useResponsiveImage(sources: Array<{
  src: string;
  media?: string;
  sizes?: string;
  type?: string;
}>) {
  const [currentSrc, setCurrentSrc] = useState(sources[0]?.src || '');

  useEffect(() => {
    const updateSource = () => {
      for (const source of sources) {
        if (source.media) {
          const mediaQuery = window.matchMedia(source.media);
          if (mediaQuery.matches) {
            setCurrentSrc(source.src);
            return;
          }
        }
      }

      // Fallback to first source
      setCurrentSrc(sources[0]?.src || '');
    };

    updateSource();

    const mediaQueries = sources
      .filter(source => source.media)
      .map(source => window.matchMedia(source.media!));

    mediaQueries.forEach(mq => {
      mq.addEventListener('change', updateSource);
    });

    return () => {
      mediaQueries.forEach(mq => {
        mq.removeEventListener('change', updateSource);
      });
    };
  }, [sources]);

  return { src: currentSrc };
}

/**
 * Hook for image preloading
 */
export function useImagePreloader(urls: string[]) {
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  useEffect(() => {
    const preloadImage = (url: string) => {
      return new Promise<void>((resolve) => {
        const img = new Image();

        img.onload = () => {
          setLoadedImages(prev => new Set(prev).add(url));
          resolve();
        };

        img.onerror = () => {
          setFailedImages(prev => new Set(prev).add(url));
          resolve();
        };

        img.src = url;
      });
    };

    urls.forEach(preloadImage);
  }, [urls]);

  return {
    loadedImages,
    failedImages,
    isLoaded: (url: string) => loadedImages.has(url),
    isFailed: (url: string) => failedImages.has(url),
    progress: (loadedImages.size + failedImages.size) / urls.length,
  };
}
