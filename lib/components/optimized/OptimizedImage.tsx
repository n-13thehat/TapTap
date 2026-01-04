/**
 * Optimized Image component with lazy loading, progressive enhancement, and format detection
 */

import React, { forwardRef, memo } from 'react';
import { useOptimizedImage, useProgressiveImage } from '@/lib/hooks/useImageOptimization';
import { cn } from '@/lib/utils';

export interface OptimizedImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src' | 'loading'> {
  src: string;
  alt: string;
  placeholder?: string;
  fallback?: string;
  blurDataURL?: string;
  quality?: number;
  format?: 'webp' | 'avif' | 'auto';
  priority?: boolean;
  lazy?: boolean;
  progressive?: boolean;
  threshold?: number;
  onLoad?: () => void;
  onError?: () => void;
  className?: string;
  containerClassName?: string;
  loadingClassName?: string;
  errorClassName?: string;
}

const OptimizedImage = memo(forwardRef<HTMLImageElement, OptimizedImageProps>(({
  src,
  alt,
  placeholder,
  fallback,
  blurDataURL,
  quality = 75,
  format = 'auto',
  priority = false,
  lazy = true,
  progressive = false,
  threshold = 0.1,
  onLoad,
  onError,
  className,
  containerClassName,
  loadingClassName,
  errorClassName,
  ...props
}, ref) => {
  // Use progressive loading if enabled
  const progressiveImage = useProgressiveImage({
    src: progressive ? src : '',
    placeholder,
    blurDataURL,
    quality,
  });

  // Use optimized loading
  const optimizedImage = useOptimizedImage({
    src: progressive ? progressiveImage.src : src,
    placeholder,
    fallback,
    quality,
    format,
    priority,
    lazy: lazy && !priority,
    threshold,
  });

  const imageState = progressive ? {
    ...optimizedImage,
    src: progressiveImage.src,
    loading: progressiveImage.loading,
    loaded: progressiveImage.loaded,
  } : optimizedImage;

  // Handle load event
  const handleLoad = () => {
    onLoad?.();
  };

  // Handle error event
  const handleError = () => {
    onError?.();
    optimizedImage.retry();
  };

  return (
    <div className={cn('relative overflow-hidden', containerClassName)}>
      <img
        ref={ref || optimizedImage.imgRef}
        src={imageState.src}
        alt={alt}
        onLoad={handleLoad}
        onError={handleError}
        className={cn(
          'transition-opacity duration-300',
          {
            'opacity-0': imageState.loading && !placeholder && !blurDataURL,
            'opacity-100': imageState.loaded || placeholder || blurDataURL,
            'blur-sm': progressive && progressiveImage.isPlaceholder,
            'blur-none': progressive && !progressiveImage.isPlaceholder,
          },
          imageState.loading && loadingClassName,
          imageState.error && errorClassName,
          className
        )}
        {...props}
      />
      
      {/* Loading indicator */}
      {imageState.loading && !placeholder && !blurDataURL && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
        </div>
      )}
      
      {/* Error state */}
      {imageState.error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
          <svg className="h-8 w-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-sm">Failed to load</span>
          <button
            onClick={optimizedImage.retry}
            className="mt-1 text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            Retry
          </button>
        </div>
      )}
    </div>
  );
}));

OptimizedImage.displayName = 'OptimizedImage';

export { OptimizedImage };
