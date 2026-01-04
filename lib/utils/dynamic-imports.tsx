import dynamic from 'next/dynamic';
import React from 'react';

/**
 * Enhanced loading component with Matrix theme
 */
const MatrixLoader = ({ className = '' }: { className?: string }) => (
  <div className={`animate-pulse bg-teal-500/10 h-full w-full rounded-lg ${className}`}>
    <div className="flex items-center justify-center h-full">
      <div className="text-teal-400/60 text-sm">Loading...</div>
    </div>
  </div>
);

/**
 * Error boundary component for dynamic imports
 */
const DynamicImportError = ({ error, retry }: { error: Error; retry?: () => void }) => (
  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-center">
    <div className="text-red-400 text-sm mb-2">Failed to load component</div>
    <div className="text-red-300/60 text-xs mb-3">{error.message}</div>
    {retry && (
      <button
        onClick={retry}
        className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 rounded text-red-300 text-xs transition-colors"
      >
        Retry
      </button>
    )}
  </div>
);

/**
 * Configuration for different types of dynamic imports
 */
export const dynamicImportConfigs = {
  // For visual/canvas components that need browser APIs
  visual: {
    ssr: false,
    loading: () => <MatrixLoader className="min-h-[200px]" />
  },

  // For heavy components that can be server-rendered but benefit from lazy loading
  heavy: {
    ssr: true,
    loading: () => <MatrixLoader />
  },

  // For components that are completely client-only
  clientOnly: {
    ssr: false,
    loading: () => <div className="opacity-0" />
  },

  // For debug/development components
  debug: {
    ssr: false,
    loading: () => null
  }
};

/**
 * Enhanced dynamic import wrapper with better error handling
 */
export function createDynamicImport<T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  config: keyof typeof dynamicImportConfigs = 'heavy'
) {
  return dynamic(importFn, {
    ...dynamicImportConfigs[config],
    // Add error boundary
    loading: ({ error, retry }) => {
      if (error) {
        return <DynamicImportError error={error} retry={retry} />;
      }
      return dynamicImportConfigs[config].loading();
    }
  });
}

/**
 * Pre-configured dynamic imports for common component types
 */
export const dynamicVisual = <T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T }>
) => createDynamicImport(importFn, 'visual');

export const dynamicHeavy = <T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T }>
) => createDynamicImport(importFn, 'heavy');

export const dynamicClientOnly = <T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T }>
) => createDynamicImport(importFn, 'clientOnly');

export const dynamicDebug = <T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T }>
) => createDynamicImport(importFn, 'debug');

/**
 * Utility to preload dynamic components
 */
export function preloadDynamicComponent<T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T }>
): void {
  if (typeof window !== 'undefined') {
    // Preload on next tick to avoid blocking initial render
    setTimeout(() => {
      importFn().catch(error => {
        console.warn('Failed to preload component:', error);
      });
    }, 0);
  }
}

/**
 * Hook to preload components on user interaction
 */
export function usePreloadOnHover<T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T }>
) {
  const preload = React.useCallback(() => {
    preloadDynamicComponent(importFn);
  }, [importFn]);

  return {
    onMouseEnter: preload,
    onFocus: preload
  };
}