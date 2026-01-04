'use client';

import { useEffect, useRef } from 'react';
import { MatrixIframeEnhancer } from '@/lib/matrix-iframe-enhancer';

// Hook to automatically enhance iframes with Matrix effects
export function useMatrixIframes() {
  const enhancerRef = useRef<MatrixIframeEnhancer | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Initialize the enhancer
    enhancerRef.current = MatrixIframeEnhancer.getInstance();
    enhancerRef.current.initialize();

    // Cleanup on unmount
    return () => {
      if (enhancerRef.current) {
        enhancerRef.current.destroy();
      }
    };
  }, []);

  return {
    enhancer: enhancerRef.current,
  };
}

// Hook for individual iframe enhancement
export function useMatrixIframe(iframeRef: React.RefObject<HTMLIFrameElement>) {
  useEffect(() => {
    if (!iframeRef.current || typeof window === 'undefined') return;

    const enhancer = MatrixIframeEnhancer.getInstance();
    enhancer.initialize();

    // The enhancer will automatically detect and enhance the iframe
    // when it's added to the DOM or when the observer detects it

  }, [iframeRef]);
}

// Hook for Matrix iframe with custom configuration
export function useMatrixIframeWithConfig(
  iframeRef: React.RefObject<HTMLIFrameElement>,
  config: {
    intensity?: 'subtle' | 'medium' | 'strong';
    showOverlay?: boolean;
    autoEnhance?: boolean;
  } = {}
) {
  const {
    intensity = 'medium',
    showOverlay = true,
    autoEnhance = true,
  } = config;

  useEffect(() => {
    if (!iframeRef.current || !autoEnhance || typeof window === 'undefined') return;

    const iframe = iframeRef.current;
    const container = iframe.parentElement;
    if (!container) return;

    // Apply custom Matrix styling based on intensity
    const intensityStyles = {
      subtle: { opacity: '0.1', speed: 0.8 },
      medium: { opacity: '0.2', speed: 1.0 },
      strong: { opacity: '0.4', speed: 1.3 },
    };

    const style = intensityStyles[intensity];

    // Add custom Matrix border
    if (showOverlay) {
      container.style.border = '1px solid rgba(15, 161, 146, 0.3)';
      container.style.boxShadow = '0 0 20px rgba(15, 161, 146, 0.1)';
      container.style.borderRadius = '8px';
      container.style.overflow = 'hidden';
    }

    // Initialize enhancer
    const enhancer = MatrixIframeEnhancer.getInstance();
    enhancer.initialize();

  }, [iframeRef, intensity, showOverlay, autoEnhance]);
}

// Hook for Matrix iframe events
export function useMatrixIframeEvents(
  iframeRef: React.RefObject<HTMLIFrameElement>,
  callbacks: {
    onMatrixLoad?: () => void;
    onMatrixError?: (error: Error) => void;
    onMatrixEnhanced?: () => void;
  } = {}
) {
  const { onMatrixLoad, onMatrixError, onMatrixEnhanced } = callbacks;

  useEffect(() => {
    if (!iframeRef.current || typeof window === 'undefined') return;

    const iframe = iframeRef.current;

    const handleLoad = () => {
      onMatrixLoad?.();
      onMatrixEnhanced?.();
    };

    const handleError = () => {
      onMatrixError?.(new Error('Matrix iframe failed to load'));
    };

    iframe.addEventListener('load', handleLoad);
    iframe.addEventListener('error', handleError);

    return () => {
      iframe.removeEventListener('load', handleLoad);
      iframe.removeEventListener('error', handleError);
    };
  }, [iframeRef, onMatrixLoad, onMatrixError, onMatrixEnhanced]);
}

// Hook for Matrix iframe performance monitoring
export function useMatrixIframePerformance(iframeRef: React.RefObject<HTMLIFrameElement>) {
  const performanceRef = useRef({
    loadTime: 0,
    renderTime: 0,
    matrixEffectTime: 0,
  });

  useEffect(() => {
    if (!iframeRef.current || typeof window === 'undefined') return;

    const iframe = iframeRef.current;
    const startTime = performance.now();

    const handleLoad = () => {
      const loadTime = performance.now() - startTime;
      performanceRef.current.loadTime = loadTime;

      // Measure Matrix effect initialization time
      const matrixStartTime = performance.now();
      
      // Wait for Matrix effects to be applied
      setTimeout(() => {
        const matrixEffectTime = performance.now() - matrixStartTime;
        performanceRef.current.matrixEffectTime = matrixEffectTime;
        
        console.debug('Matrix iframe performance:', {
          loadTime: `${loadTime.toFixed(2)}ms`,
          matrixEffectTime: `${matrixEffectTime.toFixed(2)}ms`,
        });
      }, 100);
    };

    iframe.addEventListener('load', handleLoad);

    return () => {
      iframe.removeEventListener('load', handleLoad);
    };
  }, [iframeRef]);

  return performanceRef.current;
}

// Hook for Matrix iframe accessibility
export function useMatrixIframeA11y(
  iframeRef: React.RefObject<HTMLIFrameElement>,
  options: {
    title?: string;
    description?: string;
    skipMatrixEffects?: boolean;
  } = {}
) {
  const { title = 'Matrix Enhanced Content', description, skipMatrixEffects = false } = options;

  useEffect(() => {
    if (!iframeRef.current || typeof window === 'undefined') return;

    const iframe = iframeRef.current;

    // Set accessibility attributes
    iframe.setAttribute('title', title);
    if (description) {
      iframe.setAttribute('aria-description', description);
    }

    // Add reduced motion support
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if (prefersReducedMotion || skipMatrixEffects) {
      iframe.setAttribute('data-matrix-disabled', 'true');
      
      // Disable Matrix effects for users who prefer reduced motion
      const container = iframe.parentElement;
      if (container) {
        const matrixOverlay = container.querySelector('.matrix-iframe-overlay') as HTMLCanvasElement;
        if (matrixOverlay) {
          matrixOverlay.style.display = 'none';
        }
      }
    }

  }, [iframeRef, title, description, skipMatrixEffects]);
}
